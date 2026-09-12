// Indian registrations have a state prefix or a Bharat-series prefix. OCR
// suggestions outside these forms stay in the detected text for manual review.
export const isVehicleNumber = value => /^(?:[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}|\d{2}BH\d{4}[A-Z]{1,2})$/.test(String(value || '').replace(/[\s-]/g, '').toUpperCase())
const titles = { customerName: 'Customer name', mobileNumber: 'Customer phone', warrantyCardNo: 'Warranty card number',
  productInfo: 'Product information', quantity: 'Quantity', purchaseDate: 'Sale date', vehicleNo: 'Vehicle number' }
const comparable = value => String(value || '').toLowerCase().replace(/[^\p{L}\d]/gu, '')
const confidenceFor = (result, key) => result.confidence?.[key] ?? (key === 'mobileNumber' ? result.confidence?.customerName : undefined) ?? 0

export function refineWarrantyCard(primary, secondary) {
  const fields = { ...primary.fields }, warnings = [...primary.warnings], confidence = { ...primary.confidence }
  if (secondary) {
    for (const key of Object.keys(titles)) {
      const before = fields[key], after = secondary.fields[key]
      const beforeScore = confidenceFor(primary, key), afterScore = confidenceFor(secondary, key)
      const minimum = ['mobileNumber', 'warrantyCardNo', 'quantity'].includes(key) ? 0.9 : 0.75
      if (!after || afterScore < minimum) continue
      if (key === 'vehicleNo' && !isVehicleNumber(before) && isVehicleNumber(after)) { fields[key] = after; confidence[key] = afterScore; continue }
      if (!before) { fields[key] = after; confidence[key] = afterScore; continue }
      if (comparable(before) === comparable(after)) continue
      // Never choose between competing critical digits by confidence alone.
      // Low-confidence handwriting remains available for staff to correct.
      if (['mobileNumber', 'warrantyCardNo', 'quantity', 'purchaseDate'].includes(key) || beforeScore < 0.9) {
        delete fields[key]
        warnings.push(`${titles[key]} had conflicting readings. Enter it from the card.`)
      } else {
        warnings.push(`Check ${titles[key].toLowerCase()}: the handwriting readings differed.`)
      }
    }
  }
  if (fields.vehicleNo && !isVehicleNumber(fields.vehicleNo)) {
    delete fields.vehicleNo; warnings.push('The vehicle number may be incomplete. Enter it from the card.')
  }
  for (const key of ['customerName', 'productInfo']) {
    if (fields[key] && confidenceFor({ confidence }, key) < 0.85) {
      delete fields[key]; warnings.push(`${titles[key]} was unclear. Enter it from the card.`)
    }
  }
  return { ...primary, fields, confidence,
    text: [...new Set([primary.text, secondary?.text].filter(Boolean).join('\n').split('\n'))].join('\n'),
    warnings: [...new Set(warnings)] }
}
