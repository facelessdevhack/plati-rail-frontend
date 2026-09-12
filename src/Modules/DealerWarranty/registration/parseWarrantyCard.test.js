import { parseWarrantyCard } from './parseWarrantyCard'

test('reads labelled customer, phone, card and product details without importing OTPs', () => {
  expect(parseWarrantyCard(`PLATI WARRANTY CARD
Warranty Card No: WR - TEST - 12
Customer Name: Asha Sharma
Mobile Number: +91 98765 43210
Product Type: Alloy
Product Specification: 18 inch graphite
Vehicle No: PB10AB1234
Vehicle Model: Test SUV
OTP: 654321`)).toEqual({ warrantyCardNo: 'WR-TEST-12', customerName: 'Asha Sharma', mobileNumber: '9876543210',
    productType: 'Alloy', productInfo: '18 inch graphite', vehicleNo: 'PB10AB1234', vehicleModel: 'Test SUV' })
})

test('handles same-line PDF text and assembles product model and size', () => {
  const fields = parseWarrantyCard('Warranty Number: TY/2026/123 Customer Name: Rahul Singh Phone: 9123456789 Product Type: Tyre Model: Touring Size: 205/55 R16 Dealer Name: Demo dealer')
  expect(fields).toMatchObject({ warrantyCardNo: 'TY/2026/123', customerName: 'Rahul Singh', mobileNumber: '9123456789', productType: 'Tyre' })
  expect(fields.productInfo).toBe('MODEL: Touring · SIZE: 205/55 R16')
})

test('does not invent missing identity fields from an unreadable card', () => {
  expect(parseWarrantyCard('PLATI INDIA WARRANTY TERMS AND CONDITIONS')).toEqual({})
  expect(parseWarrantyCard('Product Type: Alloy')).toEqual({ productType: 'Alloy' })
})

test('limits extracted field size and ignores markup as executable instructions', () => {
  expect(parseWarrantyCard('Customer Name: ' + 'A'.repeat(200)).customerName).toHaveLength(150)
  expect(parseWarrantyCard('Customer Name: <script>alert(1)</script>').customerName).toBe('<script>alert(1)</script>')
})

test('prefills the labelled purchase date, quantity and email for a new registration', () => {
  expect(parseWarrantyCard('Purchase Date: 10/09/2026\nQuantity: 4\nCustomer Email: asha@example.test')).toEqual({
    purchaseDate: '2026-09-10', quantity: 4, customerEmail: 'asha@example.test'
  })
  expect(parseWarrantyCard('Date of purchase: 2026-09-10').purchaseDate).toBe('2026-09-10')
  expect(parseWarrantyCard('Purchase Date: 30/02/2026\nQuantity: 0')).toEqual({})
})
