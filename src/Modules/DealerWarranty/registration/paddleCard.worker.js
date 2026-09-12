import { PaddleOCR } from '@paddleocr/paddleocr-js'
import cvModule from '@techstark/opencv-js'
import { parseWarrantyCardLayout } from './parseWarrantyCardLayout'

let engine
const base = new URL('./', self.location.href).href
const progress = message => self.postMessage({ type: 'progress', message })
// Only public model files are cached. Customer images and OCR results never are.
async function fetchModel(url) {
  let cache
  try { cache = await caches.open('plati-paddle-v6-0.4.2-r1') } catch (_) { /* Storage can be disabled. */ }
  const cached = await cache?.match(url)
  if (cached) return cached
  const response = await fetch(url)
  if (!response.ok) throw new Error('The card reader could not download its model. Check your connection and try again.')
  const size = Number(response.headers.get('content-length'))
  let loaded = 0
  const body = response.body.pipeThrough(new TransformStream({ transform(chunk, controller) {
    loaded += chunk.byteLength
    progress(`Downloading card reader… ${Math.round(loaded / 1024 / 1024)} MB${size ? ` of ${Math.round(size / 1024 / 1024)} MB` : ''}`)
    controller.enqueue(chunk)
  } }))
  const result = new Response(body, { headers: response.headers })
  if (cache) await cache.put(url, result.clone()).catch(() => {})
  return result
}
async function getEngine() {
  if (!engine) {
    progress('Preparing PaddleOCR on this device. The first scan downloads the reader…')
    engine = await PaddleOCR.create({
      textDetectionModelName: 'PP-OCRv6_small_det', textRecognitionModelName: 'PP-OCRv6_small_rec',
      textDetectionModelAsset: { url: `${base}detection-d218f6fb.tar` },
      textRecognitionModelAsset: { url: `${base}recognition-d267ab07.tar` },
      // Single-thread WASM supports browsers without WebGPU or cross-origin isolation.
      ortOptions: { backend: 'wasm', numThreads: 1, wasmPaths: `${base}ort/` }, fetch: fetchModel
    })
  }
  return engine
}
self.onmessage = async ({ data }) => {
  try {
    const reader = await getEngine()
    const cv = cvModule instanceof Promise ? await cvModule : cvModule
    const source = new OffscreenCanvas(data.width, data.height)
    source.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.pixels), data.width, data.height), 0, 0)
    let best = { fields: {}, text: '', quality: -1, warnings: [] }
    for (const degrees of [0, 270, 90, 180]) {
      progress(`Reading card${degrees ? ' and checking rotation' : ''}…`)
      const sideways = degrees % 180 !== 0
      const canvas = new OffscreenCanvas(sideways ? source.height : source.width, sideways ? source.width : source.height)
      const context = canvas.getContext('2d')
      context.translate(canvas.width / 2, canvas.height / 2); context.rotate(degrees * Math.PI / 180)
      context.drawImage(source, -source.width / 2, -source.height / 2)
      // The SDK's ImageData adapter uses document; use its supported Mat input in a worker.
      const input = cv.matFromImageData(context.getImageData(0, 0, canvas.width, canvas.height))
      let result
      try {
        ;[result] = await reader.predict(input, { textDetLimitSideLen: 1600, textDetLimitType: 'max', textRecScoreThresh: 0 })
      } finally { input.delete() }
      const parsed = parseWarrantyCardLayout(result.items)
      canvas.width = 0; canvas.height = 0
      if (parsed.quality > best.quality) best = parsed
      if (parsed.labelCount >= 6 && Object.keys(parsed.fields).length >= 4) break
    }
    source.width = 0; source.height = 0
    self.postMessage({ type: 'result', result: best })
  } catch (error) {
    console.error('PaddleOCR worker failed:', error)
    self.postMessage({ type: 'error', message: 'The card could not be read on this device. Check your connection, try a clearer photo, or enter the details manually.' })
  }
}
