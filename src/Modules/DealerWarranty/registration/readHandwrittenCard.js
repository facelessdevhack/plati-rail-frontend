import { readHandwrittenCardImages } from './registrationAPI'

const base = `${process.env.PUBLIC_URL || ''}/warranty-ocr`
export async function readHandwrittenCard(file, { signal, onProgress = () => {} } = {}) {
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Choose a JPG, PNG or PDF warranty card up to 10 MB.')
  const check = () => { if (signal?.aborted) throw new DOMException('Card scan cancelled.', 'AbortError') }
  let pdf, loadingTask
  const pages = []
  const addCanvas = async canvas => {
    check()
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) throw new Error('The card image could not be prepared. Try another photo.')
    pages.push(new File([blob], `card-${pages.length + 1}.jpg`, { type: 'image/jpeg' }))
    canvas.width = 0; canvas.height = 0
  }
  const onAbort = () => { loadingTask?.destroy().catch(() => {}) }
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    check(); onProgress('Preparing the card for handwriting recognition…')
    if (file.type === 'application/pdf') {
      const pdfjs = await import(/* webpackIgnore: true */ `${base}/pdf.mjs`)
      check(); pdfjs.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`
      loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false,
        standardFontDataUrl: `${base}/standard_fonts/`, cMapUrl: `${base}/cmaps/`, cMapPacked: true, wasmUrl: `${base}/wasm/` })
      pdf = await loadingTask.promise
      if (pdf.numPages > 3) throw new Error('Upload a warranty card with at most 3 pages.')
      for (let number = 1; number <= pdf.numPages; number++) {
        check(); const page = await pdf.getPage(number), original = page.getViewport({ scale: 1 })
        const viewport = page.getViewport({ scale: Math.min(2.5, 2000 / Math.max(original.width, original.height)) })
        const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        await addCanvas(canvas); page.cleanup()
      }
    } else {
      const bitmap = await createImageBitmap(file)
      try {
        check(); const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas'); canvas.width = Math.ceil(bitmap.width * scale); canvas.height = Math.ceil(bitmap.height * scale)
        const context = canvas.getContext('2d'); context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); await addCanvas(canvas)
      } finally { bitmap.close() }
    }
    check()
    if (pages.reduce((sum, page) => sum + page.size, 0) > 3 * 1024 * 1024) throw new Error('The prepared card is too large. Upload a closer photo of the form or fewer pages.')
    onProgress('Reading handwritten fields…')
    return await readHandwrittenCardImages(pages, signal)
  } finally { signal?.removeEventListener('abort', onAbort); await pdf?.destroy().catch(() => {}) }
}
