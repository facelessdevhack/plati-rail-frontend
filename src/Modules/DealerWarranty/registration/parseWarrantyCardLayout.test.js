import { parseWarrantyCardLayout } from './parseWarrantyCardLayout'
const line = (text, x, y, width = 160, height = 20, score = 0.99) => ({ text, score, poly: [[x,y],[x+width,y],[x+width,y+height],[x,y+height]] })

test('maps a two-column card by position, retaining both model fields and separating identifiers', () => {
  const result = parseWarrantyCardLayout([
    line('Alloy Warranty Card',0,0),
    line('Customer Name & Contact No.',100,50,220), line('Card No.',500,50,80),
    line('Test Customer 9876543210',100,80,320,35),line('TEST-123',500,80),
    line("Dealer's Name",100,130),line('Example Wheels',100,160),
    line('Car Make',100,210),line('Model',400,210),line('I-20',100,240),line('18 inch chrome wheel',400,240),
    line('Registration No.',100,290),line('Odometer Reading',400,290),line('AB12CD1234',100,320),
    line('Alloy Size',100,370),line('Model No.',400,370),line('18/100x4 Ch',100,400),line('P-TEST',440,400),
    line('No. of Pcs.',100,450),line('Date of Sale',400,450),line('Four',145,485),
    line('For PLATI INDIA PVT. LTD.',400,480),line('12/09/2026',445,505)
  ])
  expect(result.fields).toMatchObject({customerName:'Test Customer',mobileNumber:'9876543210',warrantyCardNo:'TEST-123',dealerName:'Example Wheels',
    vehicleModel:'I-20',vehicleNo:'AB12CD1234',quantity:4,purchaseDate:'2026-09-12',productType:'Alloy'})
  expect(result.fields.productInfo).toBe('MODEL: 18 inch chrome wheel · MODEL NO: P-TEST · SIZE: 18/100x4 Ch')
  expect(result.fields.meterReading).toBeUndefined()
})

test('leaves misread quantity and empty neighbouring fields blank instead of guessing', () => {
  const result=parseWarrantyCardLayout([line('No. of Pcs.',0,0),line('Date of Sale',250,0),line('Fom',0,30),line('12/09/2026',250,30)])
  expect(result.fields.quantity).toBeUndefined()
  expect(result.fields.purchaseDate).toBe('2026-09-12')
  expect(result.warnings.join(' ')).toMatch(/phone.*card number.*quantity.*sale date/)
})

test('reads inline labelled cards and does not use unlabelled policy/OTP numbers as a customer phone',()=>{
  const result=parseWarrantyCardLayout([line('Customer Name: Asha Sharma',0,0),line('Card No: TEST-88',0,50),line('Contact our helpline 9123456789',0,120),line('OTP: 654321',0,170)])
  expect(result.fields).toEqual({customerName:'Asha Sharma',warrantyCardNo:'TEST-88'})
})

test('ignores malformed boxes and low-confidence readings',()=>{
  const result=parseWarrantyCardLayout([line('Card No: TEST-88',0,0,100,20,0.2),{text:'Customer Name: Wrong',score:1,poly:[[NaN,0]]}])
  expect(result.fields).toEqual({})
})

test('does not mistake readable vertical labels for upright table columns',()=>{
  const result=parseWarrantyCardLayout([line('Customer Name: Wrong orientation',10,10,20,200),line('Card No: WRONG',50,10,20,150)])
  expect(result.fields.customerName).toBeUndefined()
  expect(result.fields.warrantyCardNo).toBeUndefined()
  expect(result.labelCount).toBe(0)
})
