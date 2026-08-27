import { calculatePurchaseLineCosting } from './voucherCosting'

describe('calculatePurchaseLineCosting', () => {
  test('adds 18% GST and derives a GST-inclusive per-piece cost', () => {
    expect(calculatePurchaseLineCosting({
      taxableAmount: 100000,
      purchaseQuantity: 20
    })).toEqual({
      taxableAmount: 100000,
      gstPercent: 18,
      calculatedGstAmount: 18000,
      gstAmount: 18000,
      gstOverridden: false,
      gstInclusiveAmount: 118000,
      purchaseQuantity: 20,
      unitCost: 5900
    })
  })

  test('uses an edited GST amount and marks it as overridden', () => {
    expect(calculatePurchaseLineCosting({
      taxableAmount: 100000,
      gstAmount: 17000,
      purchaseQuantity: 20
    })).toMatchObject({
      calculatedGstAmount: 18000,
      gstAmount: 17000,
      gstOverridden: true,
      gstInclusiveAmount: 117000,
      unitCost: 5850
    })
  })

  test('calculates GST and unit cost using a selected 28% rate', () => {
    expect(calculatePurchaseLineCosting({
      taxableAmount: 100000,
      purchaseQuantity: 20,
      gstPercent: 28
    })).toEqual({
      taxableAmount: 100000,
      gstPercent: 28,
      calculatedGstAmount: 28000,
      gstAmount: 28000,
      gstOverridden: false,
      gstInclusiveAmount: 128000,
      purchaseQuantity: 20,
      unitCost: 6400
    })
  })

  test('uses the exact 60-piece product line instead of the 864-piece mixed voucher', () => {
    expect(calculatePurchaseLineCosting({
      taxableAmount: 60000,
      purchaseQuantity: 60
    })?.unitCost).toBe(1180)
  })

  test('requires a positive taxable value and purchase-line quantity', () => {
    expect(calculatePurchaseLineCosting({ taxableAmount: '', purchaseQuantity: 20 })).toBeNull()
    expect(calculatePurchaseLineCosting({ taxableAmount: 1000, purchaseQuantity: 0 })).toBeNull()
  })
})
