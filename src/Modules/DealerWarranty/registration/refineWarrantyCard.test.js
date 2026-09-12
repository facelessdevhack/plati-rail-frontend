import { refineWarrantyCard } from './refineWarrantyCard'
const result = (fields,confidence={}) => ({fields,confidence,warnings:[],text:'Detected card text'})

test('recovers a missing vehicle prefix from the ink pass without inventing characters',()=>{
  expect(refineWarrantyCard(result({vehicleNo:'B12CD1234'},{vehicleNo:.98}),result({vehicleNo:'AB12CD1234'},{vehicleNo:.98})).fields.vehicleNo).toBe('AB12CD1234')
  expect(refineWarrantyCard(result({vehicleNo:'B12CD1234'},{vehicleNo:.98})).fields.vehicleNo).toBeUndefined()
})

test('conflicting high-confidence customer digits are left for review',()=>{
  const refined=refineWarrantyCard(result({mobileNumber:'9876543210'},{mobileNumber:.99}),result({mobileNumber:'9876543211'},{mobileNumber:.99}))
  expect(refined.fields.mobileNumber).toBeUndefined()
  expect(refined.warnings.join(' ')).toMatch(/conflicting/)
})

test('does not replace a clear card number with a weak ink reading',()=>{
  expect(refineWarrantyCard(result({warrantyCardNo:'123456'},{warrantyCardNo:.99}),result({warrantyCardNo:'123458'},{warrantyCardNo:.6})).fields.warrantyCardNo).toBe('123456')
})

test('unclear names and product specifications stay blank and available in detected text',()=>{
  const refined=refineWarrantyCard(result({customerName:'Ncha',productInfo:'1811445'},{customerName:.8,productInfo:.79}),result({customerName:'Neha',productInfo:'18114x5'},{customerName:.82,productInfo:.83}))
  expect(refined.fields).toEqual({})
  expect(refined.text).toBe('Detected card text')
})
