const labels = [
  ['warrantyCardNo', 'warranty\\s*(?:card\\s*)?(?:no\\.?|number)|card\\s*(?:no\\.?|number)'],
  ['customerName', 'customer\\s*name\\s*(?:&|and)\\s*contact\\s*(?:no\\.?|number)|customer\\s*name|name\\s*of\\s*(?:the\\s*)?customer'],
  ['mobileNumber', '(?:mobile|phone|contact)\\s*(?:no\\.?|number)?'],
  ['productType', 'product\\s*type'],
  ['productInfo', 'product\\s*(?:info(?:rmation)?|specifications?|details)|specifications?'],
  ['vehicleNo', 'vehicle\\s*(?:no\\.?|number)|registration\\s*(?:no\\.?|number)'],
  ['vehicleModel', 'vehicle\\s*model|car\\s*make'],
  ['model', '(?:alloy|tyre|wheel)\\s*model|model\\s*(?:no\\.?|number)?'],
  ['size', '(?:alloy\\s*)?size|diameter'], ['finish', 'finish'], ['pcd', 'pcd'], ['holes', 'holes'],
  ['purchaseDate', 'purchase\\s*date|date\\s*of\\s*(?:purchase|sale)|dop'],
  ['quantity', 'no\\.?\\s*of\\s*pcs\\.?|(?:product\\s*)?quantity|no\\.?\\s*of\\s*(?:alloys|tyres|tires)'],
  ['customerEmail', '(?:customer\\s*)?email(?:\\s*address)?'],
  ['meterReading', 'odometer\\s*reading'],
  ['dealerName', 'dealer(?:[’\']s|s)?\\s*name'],
  ['ignore', 'dealer\\s*name|purchase\\s*date|date\\s*of\\s*purchase|quantity|address|email|dop']
]
const labelPattern = new RegExp(`(?:^|\\n|\\s)(?<label>${labels.map(([, pattern]) => `(?:${pattern.replaceAll('\\s', '[ \\t]')})`).join('|')})[ \\t]*[:：#-]?[ \\t]*`, 'gi')
const clean = value => value.replace(/\s+/g, ' ').replace(/^[\s:;|]+|[\s:;|]+$/g, '').trim()
export function parseWarrantyCard(text) {
  const source = String(text || '').replace(/\r/g, '').slice(0, 40000)
  const matches = [...source.matchAll(labelPattern)]
  const raw = {}
  for (let index = 0; index < matches.length; index++) {
    const match = matches[index]
    const key = labels.find(([, pattern]) => new RegExp(`^(?:${pattern})$`, 'i').test(match.groups.label))?.[0]
    const value = clean(source.slice(match.index + match[0].length, matches[index + 1]?.index ?? source.length).trimStart().split('\n')[0])
    const isAnotherLabel = labels.some(([, pattern]) => new RegExp(`^(?:${pattern})[.:]?$`, 'i').test(value))
    if (key && key !== 'ignore' && value && !isAnotherLabel && !raw[key]) raw[key] = value
  }
  const fields = {}
  if (raw.warrantyCardNo) fields.warrantyCardNo = raw.warrantyCardNo.replace(/\s*([/-])\s*/g, '$1').slice(0, 100)
  if (raw.customerName) fields.customerName = raw.customerName.replace(/(?:\+?91[\s-]*)?[6-9](?:[\s-]*\d){9}(?!\d)/, '').trim().slice(0, 150)
  const phone = (raw.mobileNumber || source).match(/(?:\+?91[\s-]*)?([6-9](?:[\s-]*\d){9})(?!\d)/)
  if (phone) fields.mobileNumber = phone[1].replace(/\D/g, '')
  const type = raw.productType || raw.productInfo || source
  if (/alloy|wheel/i.test(type)) fields.productType = 'Alloy'
  else if (/tyre|tire/i.test(type)) fields.productType = 'Tyre'
  const info = [raw.productInfo, ...['model', 'size', 'finish', 'pcd', 'holes'].filter(key => raw[key]).map(key => `${key.toUpperCase()}: ${raw[key]}`)].filter(Boolean).join(' · ')
  if (info) fields.productInfo = info.slice(0, 2000)
  if (raw.vehicleNo) fields.vehicleNo = raw.vehicleNo.slice(0, 50)
  if (raw.vehicleModel) fields.vehicleModel = raw.vehicleModel.slice(0, 100)
  if (raw.customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.customerEmail)) fields.customerEmail = raw.customerEmail.slice(0, 254)
  const quantityWord = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }[raw.quantity?.toLowerCase()]
  if (quantityWord) fields.quantity = quantityWord
  if (raw.dealerName) fields.dealerName = raw.dealerName.slice(0, 150)
  if (raw.meterReading && /^\d{1,9}$/.test(raw.meterReading)) fields.meterReading = raw.meterReading
  if (raw.quantity && /^\d{1,3}$/.test(raw.quantity) && Number(raw.quantity) > 0 && Number(raw.quantity) <= 100) fields.quantity = Number(raw.quantity)
  const date = raw.purchaseDate?.match(/^(?:(\d{4})[-/](\d{1,2})[-/](\d{1,2})|(\d{1,2})[-/](\d{1,2})[-/](\d{4}))$/)
  if (date) {
    const value = date[1] ? `${date[1]}-${date[2].padStart(2, '0')}-${date[3].padStart(2, '0')}` : `${date[6]}-${date[5].padStart(2, '0')}-${date[4].padStart(2, '0')}`
    const parsed = new Date(`${value}T00:00:00Z`)
    if (Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value) fields.purchaseDate = value
  }
  return fields
}
