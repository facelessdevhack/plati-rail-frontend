const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const root = path.resolve(__dirname, '..')
const target = path.join(root, 'public/warranty-ocr')
const cache = path.join(root, '.cache/warranty-ocr')
const paddleTarget = path.join(target, 'paddle-v6-r1')
const models = [
  { name: 'PP-OCRv6_small_det', file: 'detection-d218f6fb.tar', sha: 'd218f6fbf0f1c23d2161bd6ac7f5eaa6104fa89955c09290497e31008e2618e4' },
  { name: 'PP-OCRv6_small_rec', file: 'recognition-d267ab07.tar', sha: 'd267ab077a44a0eedb1ea8f8c542d263f211de8e9d7a029bf9fcfff7e5a88fb1' }
]
const packageRoot = name => {
  let directory = path.dirname(require.resolve(name))
  while (!fs.existsSync(path.join(directory, 'package.json'))) {
    const parent = path.dirname(directory)
    if (parent === directory) throw new Error(`Cannot locate ${name}.`)
    directory = parent
  }
  return directory
}
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
async function main() {
  fs.mkdirSync(cache, { recursive: true })
  // Prepare downloads before replacing generated assets, so a failed download leaves them usable.
  for (const model of models) {
    const file = path.join(cache, model.file)
    if (!fs.existsSync(file) || digest(file) !== model.sha) {
      console.log(`Downloading ${model.name} for self-hosted browser OCR…`)
      const response = await fetch(`https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/${model.name}_onnx_infer.tar`, { signal: AbortSignal.timeout(120000) })
      if (!response.ok) throw new Error(`OCR model download failed (${response.status}).`)
      const bytes = Buffer.from(await response.arrayBuffer())
      if (crypto.createHash('sha256').update(bytes).digest('hex') !== model.sha) throw new Error(`Unexpected checksum for ${model.name}; refusing to publish changed weights.`)
      fs.writeFileSync(file, bytes)
    }
  }
  fs.rmSync(target, { recursive: true, force: true }); fs.mkdirSync(paddleTarget, { recursive: true })
  const copy = (source, destination) => fs.cpSync(source, path.join(target, destination), { recursive: true })
  const pdf = packageRoot('pdfjs-dist')
  copy(path.join(pdf, 'legacy/build/pdf.mjs'), 'pdf.mjs')
  copy(path.join(pdf, 'legacy/build/pdf.worker.min.mjs'), 'pdf.worker.min.mjs')
  for (const directory of ['standard_fonts', 'cmaps', 'wasm']) copy(path.join(pdf, directory), directory)
  for (const model of models) fs.copyFileSync(path.join(cache, model.file), path.join(paddleTarget, model.file))
  const ort = packageRoot('onnxruntime-web')
  fs.mkdirSync(path.join(paddleTarget, 'ort'), { recursive: true })
  for (const file of ['ort.wasm.min.mjs', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) fs.copyFileSync(path.join(ort, 'dist', file), path.join(paddleTarget, 'ort', file))
  await require('esbuild').build({ entryPoints: [path.join(root, 'src/Modules/DealerWarranty/registration/paddleCard.worker.js')],
    outfile: path.join(paddleTarget, 'card.worker.mjs'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true,
    external: ['fs', 'path', 'crypto', 'module'], plugins: [{ name: 'self-hosted-onnx', setup(build) {
      build.onResolve({ filter: /^onnxruntime-web$/ }, () => ({ path: './ort/ort.wasm.min.mjs', external: true }))
    } }] })
  fs.writeFileSync(path.join(paddleTarget, 'models.json'), JSON.stringify({ sdk: '0.4.2', runtime: '1.24.3', models }, null, 2))
  console.log('PaddleOCR worker, pinned models and PDF assets prepared for browser processing.')
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
