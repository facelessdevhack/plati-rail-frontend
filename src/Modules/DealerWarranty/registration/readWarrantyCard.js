import { parseWarrantyCard } from './parseWarrantyCard'

const base = `${process.env.PUBLIC_URL || ''}/warranty-ocr`
const abortError = () => new DOMException('Card scan cancelled.', 'AbortError')
export async function readWarrantyCard(file, { onProgress = () => {}, signal } = {}) {
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Choose a JPG, PNG or PDF warranty card up to 10 MB.')
  let worker, loadingTask, pdf, renderTask, timer, failure, rejectPending, rejectAbort
  const stop = error => {
    failure = error; worker?.terminate(); rejectPending?.(error)
    renderTask?.cancel(); loadingTask?.destroy().catch(() => {})
  }
  const check = () => { if (failure) throw failure; if (signal?.aborted) throw abortError() }
  const onAbort = () => { const error = abortError(); stop(error); rejectAbort?.(error) }
  const aborted = new Promise((_, reject) => { rejectAbort = reject })
  signal?.addEventListener('abort', onAbort, { once: true })
  const recognize = canvas => {
    check()
    if (!window.Worker || !window.OffscreenCanvas) throw new Error('This browser cannot run the card reader. Use a recent browser or enter the details manually.')
    if (!worker) worker = new Worker(`${base}/paddle-v6-r1/card.worker.mjs`, { type: 'module' })
    return new Promise((resolve, reject) => {
      rejectPending = reject
      worker.onmessage = ({ data }) => {
        if (failure) return
        if (data.type === 'progress') onProgress(data.message)
        if (data.type === 'result') { rejectPending = null; resolve(data.result) }
        if (data.type === 'error') { rejectPending = null; reject(new Error(data.message)) }
      }
      worker.onerror = () => reject(new Error('The card reader could not start. Check your connection or enter the details manually.'))
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.buffer
      worker.postMessage({ width: canvas.width, height: canvas.height, pixels }, [pixels])
    })
  }
  const scan = async () => {
    check()
    const results = []
    if (file.type === 'application/pdf') {
      const pdfjs = await import(/* webpackIgnore: true */ `${base}/pdf.mjs`)
      check(); pdfjs.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`
      loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false,
        standardFontDataUrl: `${base}/standard_fonts/`, cMapUrl: `${base}/cmaps/`, cMapPacked: true, wasmUrl: `${base}/wasm/` })
      pdf = await loadingTask.promise
      if (pdf.numPages > 3) throw new Error('Upload a warranty card with at most 3 pages, or enter the details manually.')
      for (let number = 1; number <= pdf.numPages; number++) {
        check(); onProgress(`Reading page ${number} of ${pdf.numPages}…`)
        const page = await pdf.getPage(number)
        const content = await page.getTextContent()
        const text = content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('')
        const fields = parseWarrantyCard(text)
        // Complete text PDFs need no model; partially printed forms must still read handwriting.
        if (fields.warrantyCardNo && fields.customerName && fields.mobileNumber && fields.productInfo) results.push({ fields, text, warnings: [] })
        else {
          const original = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: Math.min(2.5, 1600 / Math.max(original.width, original.height)) })
          const canvas = document.createElement('canvas')
          canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
          try {
            renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport }); await renderTask.promise
            results.push(await recognize(canvas))
          } finally { renderTask = null; canvas.width = 0; canvas.height = 0 }
        }
        page.cleanup()
      }
    } else {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      try {
        check(); const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
        canvas.width = Math.ceil(bitmap.width * scale); canvas.height = Math.ceil(bitmap.height * scale)
        const context = canvas.getContext('2d'); context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        results.push(await recognize(canvas))
      } finally { bitmap.close(); canvas.width = 0; canvas.height = 0 }
    }
    check()
    return { fields: Object.assign({}, ...results.map(result => result.fields).reverse()), text: results.map(result => result.text).join('\n'),
      warnings: [...new Set(results.flatMap(result => result.warnings || []))] }
  }
  try {
    return await Promise.race([scan(), aborted, new Promise((_, reject) => { timer = setTimeout(() => {
      const error = new Error('Card reading took too long. Try a clearer image or enter the details manually.'); stop(error); reject(error)
    }, 180000) })])
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', onAbort); worker?.terminate()
    await pdf?.destroy().catch(() => {})
  }
}
