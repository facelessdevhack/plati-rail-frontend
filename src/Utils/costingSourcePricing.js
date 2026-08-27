export const sourceTabForKind = sourceKind => {
  if (sourceKind === 'raw_purchase_movement') return 'raw-purchases'
  if (sourceKind === 'fmbk_inventory_in') return 'fmbk-inventory-in'
  if (sourceKind === 'erp_inventory_in') return 'erp-inventory-in'
  if (sourceKind === 'adjustment_as_purchase') return 'adjustments'
  if (sourceKind === 'stock_restoration_as_purchase') return 'restorations'
  if (sourceKind === 'opening_stock_as_purchase') return 'opening-stock'
  if (['production_plan_output', 'production_raw_input'].includes(sourceKind)) return 'production'
  return null
}

const uniqueNumbers = values => [...new Set((values || [])
  .map(Number)
  .filter(value => Number.isFinite(value) && value > 0))]
  .sort((left, right) => right - left)

const durablePriceKey = row => {
  const type = String(row.pricingSourceType || '')
  const sourceId = Number(row.pricingSourceId)
  const productId = Number(row.pricingProductId)
  return type && sourceId > 0 && productId > 0
    ? `${type}:${sourceId}:${productId}`
    : null
}

const sourceIdentity = row => {
  const priceKey = durablePriceKey(row)
  if (priceKey) return `${sourceTabForKind(row.sourceKind)}:price:${priceKey}`
  return [
    sourceTabForKind(row.sourceKind),
    row.sourceKind,
    row.sourceId,
    row.productionId,
    row.fifoLayerId,
    row.productId
  ].join(':')
}

const dateValue = value => {
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

export const normalizeConsumedSourceRows = data => {
  const sourceEntries = data?.sourceEntries
  const rows = sourceEntries
    ? [
        ...(sourceEntries.consumed || []),
        ...(sourceEntries.productionRawInputs || [])
      ]
    : (data?.products || []).flatMap(product => product.sourceRows || [])

  const grouped = new Map()
  for (const source of rows) {
    const tabKey = sourceTabForKind(source.sourceKind)
    if (!tabKey) continue
    const key = sourceIdentity(source)
    if (!grouped.has(key)) {
      grouped.set(key, {
        ...source,
        workspaceKey: key,
        tabKey,
        saleEntryIds: uniqueNumbers(source.saleEntryIds),
        productionIds: uniqueNumbers(source.productionIds || [source.productionId]),
        fifoLayerIds: uniqueNumbers(source.fifoLayerIds || [source.fifoLayerId]),
        targetProductNames: [],
        _saleProducts: new Set([
          source.saleProductName,
          source.sourceKind === 'production_raw_input' ? source.productName : null
        ].filter(Boolean))
      })
      continue
    }

    const current = grouped.get(key)
    current.saleEntryIds = uniqueNumbers([...current.saleEntryIds, ...(source.saleEntryIds || [])])
    current.productionIds = uniqueNumbers([
      ...current.productionIds,
      ...(source.productionIds || []),
      source.productionId
    ])
    current.fifoLayerIds = uniqueNumbers([
      ...current.fifoLayerIds,
      ...(source.fifoLayerIds || []),
      source.fifoLayerId
    ])
    current.usedPieces = Math.max(Number(current.usedPieces || 0), Number(source.usedPieces || 0))
    current.usedByProductionPieces = Math.max(
      Number(current.usedByProductionPieces || 0),
      Number(source.usedByProductionPieces || 0)
    )
    current.linkedSalesPieces = Number(current.linkedSalesPieces || 0) +
      Number(source.linkedSalesPieces || 0)
    current.pricingReady = Boolean(current.pricingReady || source.pricingReady)
    current.pricingEditable = Boolean(current.pricingEditable || source.pricingEditable)
    if (!current.unitCost && source.unitCost) current.unitCost = source.unitCost
    if (!current.excelPriceMatch && source.excelPriceMatch) current.excelPriceMatch = source.excelPriceMatch
    if (source.saleProductName) current._saleProducts.add(source.saleProductName)
    if (source.sourceKind === 'production_raw_input' && source.productName) {
      current._saleProducts.add(source.productName)
    }
  }

  return [...grouped.values()].map(row => {
    const targetProductNames = [...row._saleProducts]
    const normalized = { ...row, targetProductNames }
    delete normalized._saleProducts
    return normalized
  }).sort((left, right) =>
    dateValue(right.sourceAt) - dateValue(left.sourceAt) ||
    String(right.sourceId || '').localeCompare(String(left.sourceId || ''), undefined, { numeric: true })
  )
}
