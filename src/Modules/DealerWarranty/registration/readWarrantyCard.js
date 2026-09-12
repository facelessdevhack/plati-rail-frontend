import { parseWarrantyCard } from './parseWarrantyCard'

const base = `${process.env.PUBLIC_URL || ''}/warranty-ocr`
const abortError = () => new DOMException('Card scan cancelled.', 'AbortError')
export async function readWarrantyCard(file, { onProgress = () => {}, signal } = {}) {
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Choose a JPG, PNG or PDF warranty card up to 10 MB.')
  let worker, loadingTask, pdf, timer, stopped = false, rejectAbort
  const stop = () => { stopped = true; worker?.terminate().catch(() => {}); loadingTask?.destroy().catch(() => {}) }
  const check = () => { if (signal?.aborted || stopped) { stop(); throw abortError() } }
  const onAbort = () => { stop(); rejectAbort?.(abortError()) }
  const aborted = new Promise((_, reject) => { rejectAbort = reject })
  signal?.addEventListener('abort', onAbort, { once: true })
  const recognize = async canvas => {
    check()
    if (!worker) {
      const { createWorker } = await import('tesseract.js')
      check()
      worker = await createWorker('eng', 1, { workerPath: `${base}/worker.min.js`, corePath: `${base}/core`, langPath: `${base}/lang`,
        logger: event => onProgress(event.status === 'recognizing text' ? `Reading card… ${Math.round((event.progress || 0) * 100)}%` : 'Preparing card reader…') })
      check()
    }
    const { data } = await worker.recognize(canvas)
    return data.text || ''
  }
  const scan = async () => {
    let text = ''
    if (file.type === 'application/pdf') {
      // Self-hosted, lazily loaded PDF engine; documents stay in this browser.
      const pdfjs = await import(/* webpackIgnore: true */ `${base}/pdf.mjs`)
      check()
      pdfjs.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`
      loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false,
        standardFontDataUrl: `${base}/standard_fonts/`, cMapUrl: `${base}/cmaps/`, cMapPacked: true, wasmUrl: `${base}/wasm/` })
      pdf = await loadingTask.promise
      if (pdf.numPages > 3) throw new Error('Upload a warranty card with at most 3 pages, or enter the details manually.')
      for (let number = 1; number <= pdf.numPages; number++) {
        check()
        onProgress(`Reading page ${number} of ${pdf.numPages}…`)
        const page = await pdf.getPage(number)
        const content = await page.getTextContent()
        const extracted = content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('')
        const extractedFields = parseWarrantyCard(extracted)
        if ((extractedFields.warrantyCardNo || extractedFields.mobileNumber) && Object.keys(extractedFields).length >= 2) text += extracted + '\n'
        else {
          const original = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: Math.min(2.5, 2400 / Math.max(original.width, original.height)) })
          const canvas = document.createElement('canvas')
          canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
          text += await recognize(canvas) + '\n'
          canvas.width = 0; canvas.height = 0
        }
        page.cleanup()
      }
    } else {
      const bitmap = await createImageBitmap(file)
      try {
        check()
        const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(bitmap.width * scale); canvas.height = Math.ceil(bitmap.height * scale)
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        text = await recognize(canvas)
        canvas.width = 0; canvas.height = 0
      } finally { bitmap.close() }
    }
    check()
    return { fields: parseWarrantyCard(text), text }
  }
  try {
    return await Promise.race([scan(), aborted, new Promise((_, reject) => { timer = setTimeout(() => { stop(); reject(new Error('Card reading took too long. Try a clearer image or enter the details manually.')) }, 90000) })])
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
    await worker?.terminate().catch(() => {})
    await pdf?.destroy().catch(() => {})
  }
}
