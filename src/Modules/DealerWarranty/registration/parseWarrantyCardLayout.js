import { identifyWarrantyLabel, normalizeWarrantyFields, parseWarrantyDate } from './parseWarrantyCard'

const quantity = /^(?:\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten)$/i
const fragment = /^(?:[&/,\s]*(?:number|no\.?|contact|model|name|finish|sign|stamp|size)[&/,\s]*)+$/i
const footer = /^(?:for\s|auth|sign\b|stamp\b|partner\b|.*(?:pvt\.?\s*ltd|stamp.*sign))/i
const accepts = (key, value) => {
  if (!value || fragment.test(value) || footer.test(value)) return false
  if (key === 'warrantyCardNo') return /\d/.test(value) && /^[a-z\d /-]{1,100}$/i.test(value)
  if (key === 'quantity') return quantity.test(value.trim())
  if (key === 'purchaseDate') return Boolean(parseWarrantyDate(value))
  if (key === 'meterReading') return /^\d{1,9}$/.test(value)
  if (key === 'mobileNumber') return /^[+\d\s()-]+$/.test(value)
  return true
}
const overlap = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 5
const sameRow = (a, b) => Math.abs(a.cy - b.cy) <= Math.max(a.height, b.height) * 0.7

// Discover rows and columns from the labels themselves. Coordinates are never
// tied to a particular card template, image resolution, or ordering of fields.
export function getWarrantyCardRegions(items = []) {
  const lines = items.slice(0, 2000).filter(item => item.score >= 0.55 && item.poly?.length === 4 && item.poly.every(p => p.length === 2 && p.every(Number.isFinite)))
    .map((item, id) => {
      const xs = item.poly.map(p => p[0]), ys = item.poly.map(p => p[1])
      const x = Math.min(...xs), y = Math.min(...ys), right = Math.max(...xs), bottom = Math.max(...ys)
      return { ...item, id, text: String(item.text).trim(), x, y, right, bottom, cx: (x + right) / 2, cy: (y + bottom) / 2,
        height: Math.max(10, bottom - y), label: identifyWarrantyLabel(item.text) }
    })
  const labels = lines.filter(line => line.label && line.right - line.x > line.height * 1.4)
  // Only enable values left of labels when strongly typed fields establish
  // that direction. Unlabelled policy columns must never become form values.
  const typed = labels.filter(line => ['warrantyCardNo', 'mobileNumber', 'quantity', 'purchaseDate'].includes(line.label.key) && !line.label.value)
  const values = lines.filter(line => !line.label)
  const leftEvidence = typed.filter(label => values.some(value => value.right < label.x && sameRow(value, label) && accepts(label.label.key, value.text))).length
  const normalEvidence = typed.filter(label => values.some(value => value.x >= label.x - label.height && value.cy >= label.cy && value.cy - label.cy < label.height * 4 && accepts(label.label.key, value.text))).length
  const allowLeft = leftEvidence > 0 && leftEvidence > normalEvidence
  const edge = Math.max(0, ...lines.map(line => line.right)) + 20
  const regions = labels.map(line => {
    const peers = labels.filter(other => other !== line && Math.abs(other.cy - line.cy) < Math.max(line.height, other.height) * 1.1)
    return { line, left: allowLeft && !peers.some(other => other.x < line.x - line.height) ? 0 : Math.max(0, line.x - line.height), right: Math.min(edge, ...peers.filter(other => other.x > line.x + line.height).map(other => other.x - line.height * 0.25)) }
  })
  for (const region of regions) {
    const { line } = region
    const next = regions.filter(other => other !== region && other.line.cy > line.cy + Math.max(line.height, other.line.height) * 1.1 && overlap(region, other))
    region.top = Math.max(0, line.y - line.height)
    region.bottom = Math.min(line.cy + line.height * 7, ...next.map(other => other.line.cy - other.line.height * 0.15))
  }
  return { lines, regions }
}

export function parseWarrantyCardLayout(items = []) {
  const { lines, regions } = getWarrantyCardRegions(items)
  const raw = {}, confidence = {}, sources = {}, owners = new Map()
  for (const region of regions) {
    const { line } = region, { key, value } = line.label
    if (key === 'ignore' || value) continue
    for (const other of lines) {
      if (other.label || other === line || !accepts(key, other.text)) continue
      // Use the centre of each value box: long handwriting often crosses the
      // printed label or starts far inside a wide cell.
      if (other.cx < region.left || other.cx >= region.right || other.cy >= region.bottom) continue
      const beside = (other.x > line.right - line.height * 0.5 || other.right < line.x + line.height * 0.5) && sameRow(other, line)
      const below = other.cy > line.cy + line.height * 0.25
      if (!beside && !below) continue
      const distance = Math.abs(other.cy - line.cy) / line.height + (beside ? 0 : 0.25)
      const previous = owners.get(other.id)
      if (!previous || distance < previous.distance) owners.set(other.id, { region, distance })
    }
  }
  for (const region of regions) {
    const { line } = region, { key, value } = line.label
    if (key === 'ignore') continue
    let candidates = value && accepts(key, value) ? [{ ...line, text: value }] : lines.filter(other => owners.get(other.id)?.region === region)
    if (!candidates.length) continue
    candidates.sort((a, b) => (Math.abs(a.cy - line.cy) - Math.abs(b.cy - line.cy)) || a.x - b.x)
    const first = candidates[0]
    // Join separately detected name/phone and make/model fragments in the same
    // row; product descriptions may continue onto further lines in their cell.
    candidates = candidates.filter(item => sameRow(item, first) || (['productInfo', 'size', 'model', 'vehicleModel'].includes(key) && item.cy > first.cy && item.cy - first.cy < first.height * 2))
      .sort((a, b) => sameRow(a, b) ? a.x - b.x : a.cy - b.cy)
    const combined = candidates.map(item => item.text).join(' ')
    const score = Math.min(...candidates.map(item => item.score))
    if (!raw[key] || score > confidence[key]) {
      raw[key] = combined; confidence[key] = score; sources[key] = candidates.map(item => item.id)
    }
  }
  const labels = regions.filter(region => region.line.label.key !== 'ignore').map(region => region.line.label.label)
  const fields = normalizeWarrantyFields(raw, labels, lines.filter(line => !line.label).map(line => line.text))
  if (fields.productInfo) confidence.productInfo = Math.min(...['productInfo', 'model', 'modelNo', 'size', 'finish', 'pcd', 'holes'].filter(key => confidence[key] !== undefined).map(key => confidence[key]))
  if (fields.mobileNumber) {
    const phoneLine = lines.find(line => sources.customerName?.includes(line.id) && line.text.replace(/\D/g, '').includes(fields.mobileNumber))
    if (phoneLine) confidence.mobileNumber = phoneLine.score
  }
  const warnings = ['Check the customer phone, card number, quantity and sale date against the card. Handwriting can be misread even when the scan appears clear.']
  if (raw.purchaseDate && /\d{1,2}[/.-]\d{1,2}[/.-]\d{2}$/.test(raw.purchaseDate.replace(/\s/g, ''))) warnings.push('The sale date uses a two-digit year. Check the expanded year before continuing.')
  const critical = ['customerName', 'mobileNumber', 'warrantyCardNo', 'quantity', 'purchaseDate']
  const quality = Object.keys(fields).length * 10 + critical.filter(key => fields[key]).length * 15 + Math.min(labels.length, 15)
  return { fields, text: lines.slice().sort((a, b) => sameRow(a, b) ? a.x - b.x : a.cy - b.cy).map(line => line.text).join('\n'),
    labelCount: labels.length, quality, warnings, confidence, sources }
}
