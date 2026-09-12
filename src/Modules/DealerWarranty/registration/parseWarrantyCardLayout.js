import { identifyWarrantyLabel, parseWarrantyCard } from './parseWarrantyCard'

const quantity = /^(?:\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten)$/i
const date = /^(?:\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})$/
const accepts = (key, value) => {
  if (/^(?:for plati|auth|sign\.|stamp)/i.test(value)) return false
  if (key === 'quantity') return quantity.test(value.trim())
  if (key === 'purchaseDate') return date.test(value.replace(/\s/g, ''))
  if (key === 'meterReading') return /^\d{1,9}$/.test(value)
  return true
}

// Use the label's column and next label to avoid mixing adjacent table cells.
export function parseWarrantyCardLayout(items = []) {
  const lines = items.slice(0, 2000).filter(item => item.score >= 0.55 && item.poly?.length === 4 && item.poly.every(p => p.length === 2 && p.every(Number.isFinite)))
    .map(item => {
      const xs = item.poly.map(p => p[0]), ys = item.poly.map(p => p[1])
      const x = Math.min(...xs), y = Math.min(...ys), right = Math.max(...xs), bottom = Math.max(...ys)
      return { ...item, text: String(item.text).trim(), x, y, right, bottom, cy: (y + bottom) / 2, height: Math.max(10, bottom - y), label: identifyWarrantyLabel(item.text) }
    })
  // Paddle can read vertical crops before the page is upright. Their positions
  // cannot be used as horizontal table columns; let the worker rotate the page.
  const labels = lines.filter(line => line.label && line.right - line.x > line.height * 1.4)
  const mapped = []
  for (const line of labels) {
    const { key, label, value } = line.label
    if (value) { mapped.push(`${label}: ${value}`); continue }
    const tolerance = Math.max(45, line.height * 3.5)
    const below = labels.filter(other => other !== line && Math.abs(other.x - line.x) < tolerance && other.cy > line.cy + line.height)
    const bottom = Math.min(line.cy + line.height * 5, ...below.map(other => other.cy))
    const right = Math.min(Infinity, ...labels.filter(other => other.x > line.right + 15 && Math.abs(other.cy - line.cy) < line.height * 2).map(other => other.x - 8))
    const candidates = lines.filter(other => !other.label && other.x >= line.x - line.height && other.x < Math.min(line.x + tolerance, right) &&
      other.cy > line.cy + line.height * 0.3 && other.cy < bottom && accepts(key, other.text))
    candidates.sort((a, b) => (a.cy - line.cy + Math.abs(a.x - line.x) * 0.25) - (b.cy - line.cy + Math.abs(b.x - line.x) * 0.25))
    if (candidates[0]) mapped.push(`${label}: ${candidates[0].text}`)
  }
  const text = mapped.join('\n')
  const fields = parseWarrantyCard(text)
  if (!fields.productType) {
    const header = lines.map(line => line.text).join('\n')
    if (/alloy|wheel/i.test(header)) fields.productType = 'Alloy'
    else if (/tyre|tire/i.test(header)) fields.productType = 'Tyre'
  }
  return { fields, text, labelCount: labels.length, quality: labels.length * 10 + Object.keys(fields).length,
    warnings: ['Check the customer phone, card number, quantity and sale date against the card. Handwriting can be misread even when the scan appears clear.'] }
}
