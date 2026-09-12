const labels = [
  ['warrantyCardNo', '(?:warranty\\s*(?:card\\s*)?|card\\s*)(?:no\\.?|number|id)'],
  ['customerName', '(?:customer|buyer|purchaser)(?:[’\x27]s)?\\s*name(?:\\s*(?:&|and|/)\\s*(?:(?:contact|mobile|phone)\\s*)?(?:no\\.?|number))?|name\\s*of\\s*(?:the\\s*)?customer'],
  ['mobileNumber', '(?:customer\\s*)?(?:mobile|phone|telephone|contact|tel\\.?)(?:\\s*(?:no\\.?|number))?'],
  ['productType', 'product\\s*type'],
  ['productInfo', '(?:(?:alloy|wheel|tyre|tire)\\s*)?(?:size\\s*,?\\s*(?:&|and)?\\s*model\\s*(?:,|&|and)\\s*finish)|product\\s*(?:info(?:rmation)?|specifications?|details|description)|specifications?'],
  ['vehicleNo', '(?:vehicle|registration|regn\\.?|reg\\.?)(?:\\s*(?:no\\.?|number))'],
  ['vehicleModel', '(?:car|vehicle)\\s*(?:make(?:\\s*(?:&|and|/)\\s*model)?|model)'],
  ['modelNo', 'model\\s*(?:no\\.?|number)'],
  ['model', '(?:alloy|tyre|wheel)\\s*model|model'],
  ['size', '(?:(?:alloy|wheel|tyre|tire)\\s*)?size|diameter'], ['finish', '(?:colour|color|finish)'], ['pcd', 'pcd'], ['holes', 'holes'],
  ['purchaseDate', '(?:purchase|sale|invoice)\\s*date|date\\s*of\\s*(?:purchase|sale)|dop'],
  ['quantity', 'no\\.?\\s*of\\s*(?:pcs\\.?|pieces|alloys|tyres|tires)|(?:product\\s*)?quantity|qty\\.?'],
  ['customerEmail', '(?:customer\\s*)?email(?:\\s*address)?'],
  ['meterReading', '(?:odometer|meter)(?:\\s*reading)?|mileage'],
  ['dealerName', '(?:dealer|retailer)(?:[’\x27]s|s)?\\s*name'],
  ['ignore', 'address|otp|terms(?:\\s*and\\s*conditions)?|(?:dealer|plati)\\s*stamp(?:\\s*(?:&|and)\\s*sign)?']
]
const labelPattern = new RegExp(`(?:^|\\n|\\s)(?<label>${labels.map(([, pattern]) => `(?:${pattern.replaceAll('\\s', '[ \\t]')})`).join('|')})[ \\t]*[:：#-]?[ \\t]*`, 'gi')
const clean = value => value.replace(/\s+/g, ' ').replace(/^[\s:;|]+|[\s:;|]+$/g, '').trim()
// Full labels and inline "Label: value" lines are both returned by PaddleOCR.
export function identifyWarrantyLabel(text) {
  const source = clean(String(text || '')).replace(/[.][ \t]*:/g, ':')
  for (const [key, pattern] of labels) {
    const match = source.match(new RegExp(`^(${pattern})(?=$|[\\s:：#.-])[ \\t]*[:：#.-]?[ \\t]*(.*)$`, 'i'))
    if (match) {
      const value = clean(match[2])
      if (key === 'mobileNumber' && value && !/^[+\d\s-]+$/.test(value)) return null
      return { key, label: match[1], value }
    }
  }
  return null
}
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
  return normalizeWarrantyFields(raw, matches.map(match => match.groups.label), source.split('\n'))
}

export function normalizeWarrantyFields(raw, labelTexts = [], headings = []) {
  const fields = {}
  if (raw.warrantyCardNo) fields.warrantyCardNo = raw.warrantyCardNo.replace(/\s*([/-])\s*/g, '$1').slice(0, 100)
  if (raw.customerName) {
    const name = raw.customerName.replace(/(?:\+?91[\s-]*)?[6-9](?:[\s-]*\d){9}(?!\d)/g, '').replace(/^[\s,;|&/-]+|[\s,;|&/-]+$/g, '').trim()
    if (/[\p{L}]/u.test(name) && !/^(?:number|contact|phone|mobile|name|model|no\.?)$/i.test(name)) fields.customerName = name.slice(0, 150)
  }
  const phoneSource = /^[+\d\s-]+$/.test(raw.mobileNumber || '') ? raw.mobileNumber : raw.customerName || ''
  const phone = phoneSource.match(/(?:\+?91[\s-]*)?([6-9](?:[\s-]*\d){9})(?!\d)/)
  if (phone) fields.mobileNumber = phone[1].replace(/\D/g, '')
  // Dealer names, stamps and policy text are never evidence of product type.
  const type = [raw.productType, raw.productInfo,
    ...labelTexts.filter(label => /^(?:alloy|wheel|tyre|tire)\b/i.test(label)),
    ...headings.filter(line => /^\s*(?:alloy|wheel|tyre|tire)\s+warranty\s+card\s*$/i.test(line))].filter(Boolean).join(' ')
  if (/\balloy|\bwheel/i.test(type)) fields.productType = 'Alloy'
  else if (/\btyre|\btire/i.test(type)) fields.productType = 'Tyre'
  const info = [raw.productInfo, ...['model', 'modelNo', 'size', 'finish', 'pcd', 'holes'].filter(key => raw[key]).map(key => `${key === 'modelNo' ? 'MODEL NO' : key.toUpperCase()}: ${raw[key]}`)].filter(Boolean).join(' · ')
  if (info) fields.productInfo = info.slice(0, 2000)
  if (raw.vehicleNo && /[a-z]/i.test(raw.vehicleNo) && /\d/.test(raw.vehicleNo)) fields.vehicleNo = raw.vehicleNo.slice(0, 50)
  if (raw.vehicleModel && /[\p{L}\d]/u.test(raw.vehicleModel) && !/^(?:[&/ ]*model|make)$/i.test(raw.vehicleModel)) fields.vehicleModel = raw.vehicleModel.slice(0, 100)
  if (raw.customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.customerEmail)) fields.customerEmail = raw.customerEmail.slice(0, 254)
  const quantityWord = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }[raw.quantity?.toLowerCase()]
  if (quantityWord) fields.quantity = quantityWord
  if (raw.dealerName) fields.dealerName = raw.dealerName.slice(0, 150)
  if (raw.meterReading && /^\d{1,9}$/.test(raw.meterReading)) fields.meterReading = raw.meterReading
  if (raw.quantity && /^\d{1,3}$/.test(raw.quantity) && Number(raw.quantity) > 0 && Number(raw.quantity) <= 100) fields.quantity = Number(raw.quantity)
  const value = parseWarrantyDate(raw.purchaseDate)
  if (value) fields.purchaseDate = value
  return fields
}


export function parseWarrantyDate(input) {
  const match = String(input || '').replace(/\s/g, '').match(/^(?:(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})|(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2}))$/)
  if (!match) return undefined
  const year = match[1] || (match[6].length === 2 ? '20' + match[6] : match[6])
  const value = year + '-' + (match[2] || match[5]).padStart(2, '0') + '-' + (match[3] || match[4]).padStart(2, '0')
  const date = new Date(value + 'T00:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined
}
