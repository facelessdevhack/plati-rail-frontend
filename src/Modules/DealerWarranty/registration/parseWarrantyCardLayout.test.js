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

const flexibleCard = () => [
  line('CARD NO. :',100,250,270,45), line('777001',440,200,280,80),
  line('CUSTOMER NAME & NUMBER',120,350,560,45),line('Neha Kumar',130,405,470,85),line('9876543210',790,410,400,80),
  line('DEALER NAME',120,505,300,40),line('Example Tyre Service',120,550,700,80),
  line('CAR MAKE & MODEL',120,635,400,40),line('Test Make',120,680,280,80),line('Example SUV',580,680,520,80),
  line('REGISTRATION NO.',120,770,340,40),line('ODOMETER READING',750,770,360,40),line('AB12CD1234',160,810,450,70),
  line('ALLOY SIZE, MODEL & FINISH',120,910,540,40),line('M100 18 inch black',680,930,530,80),
  line('QUANTITY',120,1060,200,40),line('Four',440,1060,200,80),line('DATE OF SALE',750,1060,300,40),line('12/9/26',800,1100,300,70),
  line('For Example Tyre Service',120,1220,600,80)
]

test.each([0.5,1,2])('handles a mixed layout at scale %s, including far-indented and split values', scale => {
  const items=flexibleCard().reverse().map(item=>({...item,poly:item.poly.map(([x,y])=>[x*scale+80,y*scale+45])}))
  expect(parseWarrantyCardLayout(items).fields).toEqual({warrantyCardNo:'777001',customerName:'Neha Kumar',mobileNumber:'9876543210',
    dealerName:'Example Tyre Service',vehicleNo:'AB12CD1234',vehicleModel:'Test Make Example SUV',productType:'Alloy',
    productInfo:'M100 18 inch black',quantity:4,purchaseDate:'2026-09-12'})
})

test('supports values to the left of right-aligned labels',()=>{
  expect(parseWarrantyCardLayout([line('WR-100',10,0),line('Card number',450,0),line('Neha Kumar',10,70),line('Customer name',450,70)]).fields)
    .toMatchObject({warrantyCardNo:'WR-100',customerName:'Neha Kumar'})
})

test('keeps an empty right-hand cell empty when the next row spans both columns',()=>{
  const result=parseWarrantyCardLayout([line('Registration No.',0,0),line('Odometer reading',400,0),line('AB12CD1234',0,40),
    line('Alloy size, model & finish',0,100,320),line('18 114 5',450,130)])
  expect(result.fields.meterReading).toBeUndefined()
  expect(result.fields.productInfo).toBe('18 114 5')
})

test('does not infer product type from a dealer name or stamp',()=>{
  const result=parseWarrantyCardLayout([line('Dealer name',0,0),line('Example Tyre Service',0,40),line('For Example Alloy Wheels',0,130)])
  expect(result.fields.productType).toBeUndefined()
})

test('preserves unmapped detected text for review of unfamiliar labels',()=>{
  const result=parseWarrantyCardLayout([line('Unusual heading',0,0),line('Useful value',0,40)])
  expect(result.fields).toEqual({})
  expect(result.text).toContain('Useful value')
})

test('excludes an unlabelled policy column alongside the registration form',()=>{
  const result = parseWarrantyCardLayout([
    line('Brand Alloy Warranty Card',0,0,400,30),line('Customer Name & Number',700,0,240,25),line('Card No.',1050,0,120,25),
    line('Neha 9876543210',700,40,280,30),line('777001',1050,40,120,30),
    line('Alloy Size',700,120,150),line('Model No.',1050,120,120),line('18/114x5',700,150,200),line('P100',1050,150,140),
    line('Wheels used under heavy loads are not covered by warranty.',20,150,580,20)
  ])
  expect(result.fields.customerName).toBe('Neha')
  expect(result.fields.productInfo).toBe('MODEL NO: P100 · SIZE: 18/114x5')
  expect(result.confidence.productInfo).toBeGreaterThan(.9)
})
