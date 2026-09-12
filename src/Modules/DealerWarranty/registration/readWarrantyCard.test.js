import { readWarrantyCard } from './readWarrantyCard'
const file = () => new File(['test'], 'card.png', {type:'image/png'})
let workers, bitmap
beforeEach(()=>{
  workers=[];bitmap={width:10,height:10,close:jest.fn()}
  global.createImageBitmap=jest.fn().mockResolvedValue(bitmap)
  global.OffscreenCanvas=class {}
  global.Worker=class {constructor(url, options){this.url=url;this.options=options;this.terminate=jest.fn();this.postMessage=jest.fn();workers.push(this)}}
  jest.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:jest.fn(),drawImage:jest.fn(),getImageData:()=>({data:new Uint8ClampedArray(400)})})
})
afterEach(()=>{jest.restoreAllMocks();jest.useRealTimers()})
const started=async()=>{for(let n=0;n<5;n++) await Promise.resolve()}

test('only starts a local worker and releases it after a scan',async()=>{
  const promise=readWarrantyCard(file());await started()
  expect(workers[0].url).toBe('/warranty-ocr/paddle-v6-r1/card.worker.mjs')
  expect(workers[0].options).toEqual({type:'module'})
  workers[0].onmessage({data:{type:'result',result:{fields:{customerName:'Test'},text:'Customer Name: Test',warnings:[]}}})
  expect((await promise).fields.customerName).toBe('Test')
  expect(workers[0].terminate).toHaveBeenCalled();expect(bitmap.close).toHaveBeenCalled()
})
test('cancellation immediately terminates active OCR and frees the bitmap',async()=>{
  const controller=new AbortController();const promise=readWarrantyCard(file(),{signal:controller.signal});await started()
  controller.abort();await expect(promise).rejects.toMatchObject({name:'AbortError'})
  expect(workers[0].terminate).toHaveBeenCalled();expect(bitmap.close).toHaveBeenCalled()
})
test('a previously cancelled request starts no worker',async()=>{
  const controller=new AbortController();controller.abort()
  await expect(readWarrantyCard(file(),{signal:controller.signal})).rejects.toMatchObject({name:'AbortError'})
  expect(workers).toHaveLength(0);expect(global.createImageBitmap).not.toHaveBeenCalled()
})
test('stops a stalled scan at its deadline',async()=>{
  jest.useFakeTimers();const promise=readWarrantyCard(file());await started();jest.advanceTimersByTime(180000)
  await expect(promise).rejects.toThrow('took too long');expect(workers[0].terminate).toHaveBeenCalled()
})
test('reports manual-entry recovery when the worker fails',async()=>{
  const promise=readWarrantyCard(file());await started();workers[0].onerror({})
  await expect(promise).rejects.toThrow('enter the details manually');expect(workers[0].terminate).toHaveBeenCalled()
})
test('rejects unsupported files before loading OCR',async()=>{
  await expect(readWarrantyCard(new File(['test'],'card.txt',{type:'text/plain'}))).rejects.toThrow('JPG, PNG or PDF')
  expect(workers).toHaveLength(0)
})
