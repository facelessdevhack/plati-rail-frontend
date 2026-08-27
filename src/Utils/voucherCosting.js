export const DEFAULT_ALLOY_GST_PERCENT = 18

export const roundCurrency = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100

const numberOrNull = value => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const calculatePurchaseLineCosting = ({
  taxableAmount,
  gstAmount,
  purchaseQuantity,
  gstPercent = DEFAULT_ALLOY_GST_PERCENT
}) => {
  const taxable = numberOrNull(taxableAmount)
  const quantity = numberOrNull(purchaseQuantity)
  const percent = numberOrNull(gstPercent)
  if (taxable === null || taxable <= 0 || quantity === null || quantity <= 0 || percent === null || percent < 0) {
    return null
  }

  const roundedTaxable = roundCurrency(taxable)
  const calculatedGstAmount = roundCurrency(roundedTaxable * percent / 100)
  const suppliedGst = numberOrNull(gstAmount)
  if (gstAmount !== null && gstAmount !== undefined && gstAmount !== '' && (suppliedGst === null || suppliedGst < 0)) {
    return null
  }
  const finalGstAmount = suppliedGst === null ? calculatedGstAmount : roundCurrency(suppliedGst)
  const gstInclusiveAmount = roundCurrency(roundedTaxable + finalGstAmount)

  return {
    taxableAmount: roundedTaxable,
    gstPercent: percent,
    calculatedGstAmount,
    gstAmount: finalGstAmount,
    gstOverridden: Math.abs(finalGstAmount - calculatedGstAmount) >= 0.01,
    gstInclusiveAmount,
    purchaseQuantity: quantity,
    unitCost: roundCurrency(gstInclusiveAmount / quantity)
  }
}
