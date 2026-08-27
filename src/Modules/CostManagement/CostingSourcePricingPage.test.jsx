import { normalizeConsumedSourceRows } from '../../Utils/costingSourcePricing'

describe('normalizeConsumedSourceRows', () => {
  test('routes complete raw purchase movements into their dedicated pricing tab', () => {
    const rows = normalizeConsumedSourceRows({
      sourceEntries: {
        consumed: [{
          sourceKey: 'raw-purchase-movement-32337',
          sourceKind: 'raw_purchase_movement',
          sourceId: 'purchase-movement-32337',
          movementId: 32337,
          pricingSourceType: 'purchase_movement',
          pricingSourceId: 32337,
          pricingProductId: 4106,
          entryNetQuantity: 128,
          fifoQtyRemaining: 24,
          pricingReady: false,
          pricingEditable: true
        }]
      }
    })

    expect(rows).toHaveLength(1)
    expect(rows[0].tabKey).toBe('raw-purchases')
    expect(rows[0].entryNetQuantity).toBe(128)
    expect(rows[0].fifoQtyRemaining).toBe(24)
  })

  test('keeps consumed source categories separate and merges repeated production raw pricing sources', () => {
    const rows = normalizeConsumedSourceRows({
      sourceEntries: {
        consumed: [{
          sourceKey: 'finished:purchase-1',
          sourceKind: 'fmbk_inventory_in',
          sourceId: 'purchase-1',
          productId: 10,
          usedPieces: 4,
          saleEntryIds: [101]
        }, {
          sourceKey: 'production-7',
          sourceKind: 'production_plan_output',
          sourceId: 'production-7',
          productionId: 7,
          productId: 20,
          usedPieces: 3,
          saleEntryIds: [102]
        }],
        productionRawInputs: [{
          sourceKey: 'finished-a:production-raw',
          sourceKind: 'production_raw_input',
          pricingSourceType: 'purchase_movement',
          pricingSourceId: 55,
          pricingProductId: 30,
          sourceProductName: 'PY-030 WITHOUT PAINT',
          productName: 'PY-030 BLACK',
          usedByProductionPieces: 5,
          linkedSalesPieces: 2,
          productionIds: [7],
          saleEntryIds: [102]
        }, {
          sourceKey: 'finished-b:production-raw',
          sourceKind: 'production_raw_input',
          pricingSourceType: 'purchase_movement',
          pricingSourceId: 55,
          pricingProductId: 30,
          sourceProductName: 'PY-030 WITHOUT PAINT',
          productName: 'PY-030 HS',
          usedByProductionPieces: 5,
          linkedSalesPieces: 3,
          productionIds: [7],
          saleEntryIds: [103]
        }]
      }
    })

    expect(rows).toHaveLength(3)
    expect(rows.find(row => row.sourceKind === 'fmbk_inventory_in').tabKey)
      .toBe('fmbk-inventory-in')

    const rawInput = rows.find(row => row.sourceKind === 'production_raw_input')
    expect(rawInput.tabKey).toBe('production')
    expect(rawInput.usedByProductionPieces).toBe(5)
    expect(rawInput.linkedSalesPieces).toBe(5)
    expect(rawInput.saleEntryIds).toEqual([103, 102])
    expect(rawInput.targetProductNames).toEqual(expect.arrayContaining([
      'PY-030 BLACK',
      'PY-030 HS'
    ]))
  })
})
