import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Progress,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tabs,
  Typography,
  message
} from 'antd'
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  LinkOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

import PageTitle from '../../Core/Components/PageTitle'
import { client } from '../../Utils/axiosClient'

const { Text, Title } = Typography
const BORDER = '#e5e7eb'
const MUTED = '#667085'
const INK = '#182230'
const ORANGE = '#f26c2d'
const GREEN = '#159455'
const BLUE = '#175cd3'

const formatQty = value => `${Number(value || 0).toLocaleString('en-IN')} Pcs`
const formatDate = value => value ? dayjs(value).format('DD MMM YYYY') : '—'
const formatCurrency = value => Number(value || 0).toLocaleString('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
const percent = (value, total) => total > 0
  ? Math.round((Number(value || 0) / Number(total)) * 10000) / 100
  : 0
const formatPercent = value => `${Number(value || 0).toFixed(2)}%`

const MAPPING_FILTER_OPTIONS = [
  { value: 'all', label: 'All mapping statuses' },
  { value: 'full', label: 'Fully mapped' },
  { value: 'partial', label: 'Partially mapped' },
  { value: 'unmapped', label: 'Unmapped' }
]

const PRICE_FILTER_OPTIONS = [
  { value: 'excel-ready', label: 'Exact Excel price ready' },
  { value: 'excel-review', label: 'Excel match needs review' },
  { value: 'editable', label: 'Price entry available' },
  { value: 'pending', label: 'Any price pending' },
  { value: 'priced', label: 'Fully priced' },
  { value: 'all', label: 'All price statuses' }
]

const exactExcelPrice = row => row?.excelPriceMatch?.status === 'exact_ready' &&
  row?.excelPriceMatch?.eligibleForPrefill

const hasExactExcelEvidence = row => ['exact_ready', 'already_claimed_same_movement']
  .includes(String(row?.excelPriceMatch?.status || ''))

const entryTypeLabel = row => {
  if (row?.upstreamProductionInput) {
    return ['adjustment', 'sync'].includes(String(row?.referenceType || ''))
      ? 'Raw adjustment input'
      : 'Raw purchase input'
  }
  if (['adjustment', 'sync'].includes(String(row?.referenceType || ''))) return 'Adjustment entry'
  if (['purchase', 'purchase_entry'].includes(String(row?.referenceType || ''))) return 'Purchase entry'
  return String(row?.sourceLabel || row?.sourceKind || 'Source entry').replaceAll('_', ' ')
}

const PERIOD_OPTIONS = [
  { value: 'apr-jun-2026', label: 'April–June 2026' },
  { value: 'july-2026', label: 'July 2026' }
]

const mappingStatus = (mapped, required) => {
  const mappedQty = Number(mapped || 0)
  const requiredQty = Number(required || 0)
  if (mappedQty <= 0) return 'unmapped'
  if (mappedQty + 0.005 >= requiredQty) return 'full'
  return 'partial'
}

const MappingStatusTag = ({ mapped, required }) => {
  const status = mappingStatus(mapped, required)
  if (status === 'full') return <Tag color='success'>Fully mapped</Tag>
  if (status === 'partial') return <Tag color='warning'>Partially mapped</Tag>
  return <Tag color='error'>Unmapped</Tag>
}

const SummaryCard = ({ title, value, suffix, helper, color = INK, icon }) => (
  <Card styles={{ body: { padding: 18 } }} style={{ borderColor: BORDER, height: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
      <Statistic
        title={<span style={{ color: MUTED, fontWeight: 700 }}>{title}</span>}
        value={Number(value || 0)}
        suffix={suffix}
        valueStyle={{ color, fontSize: 27, fontWeight: 750 }}
      />
      <div style={{ color, fontSize: 22 }}>{icon}</div>
    </div>
    <div style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>{helper}</div>
  </Card>
)

const ProductName = ({ children }) => (
  <Text style={{ color: INK, fontSize: 16, lineHeight: 1.4, fontWeight: 750 }}>
    {children || '—'}
  </Text>
)

const sourceLabel = sourceType => {
  if (sourceType === 'direct-raw-sale') return <Tag color='cyan'>Raw sale</Tag>
  return <Tag color='blue'>ERP production</Tag>
}

const lineageEvidenceTag = evidence => {
  if (evidence === 'fifo_consumption') return <Tag color='success'>Exact FIFO link</Tag>
  if (evidence === 'fifo_purchase_consumption') return <Tag color='success'>Exact purchase link</Tag>
  if (evidence === 'fifo_adjustment_consumption') return <Tag color='purple'>Exact adjustment link</Tag>
  if (evidence === 'fifo_sync_consumption') return <Tag color='magenta'>Exact stock-sync link</Tag>
  if (String(evidence || '').startsWith('fifo_production_input_')) {
    return <Tag color='geekblue'>Exact issued-input layer</Tag>
  }
  if (evidence === 'available_fifo_purchase_layer') return <Tag color='cyan'>Available purchase layer</Tag>
  if (evidence === 'inventory_in_without_fifo_layer') return <Tag color='warning'>Inventory In · no FIFO layer</Tag>
  if (evidence === 'inferred_output_batch') return <Tag color='blue'>Output batch inferred</Tag>
  if (evidence === 'inferred_plan_total') return <Tag color='warning'>Plan total inferred</Tag>
  if (evidence === 'direct_raw_sale') return <Tag color='cyan'>Direct raw sale</Tag>
  return <Tag>{String(evidence || 'Unknown').replaceAll('_', ' ')}</Tag>
}

const purchaseSourceTag = sourceType => {
  if (sourceType === 'erp_inventory_in') return <Tag color='blue'>ERP Inventory In</Tag>
  if (sourceType === 'step1_approved_opening') return <Tag color='success'>Step 1 approved opening</Tag>
  if (sourceType === 'step1_pending_opening') return <Tag color='warning'>Step 1 price pending</Tag>
  if (sourceType === 'tally_historical_purchase') return <Tag color='purple'>Older Tally purchase</Tag>
  if (sourceType === 'erp_historical_purchase') return <Tag color='cyan'>Older ERP purchase</Tag>
  return <Tag>{sourceType || 'Purchase source'}</Tag>
}

const DateFreeCoveragePanel = ({ data, loading, onRefresh }) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('excel-ready')
  const [draftCosts, setDraftCosts] = useState({})
  const [savingSourceKey, setSavingSourceKey] = useState(null)
  const totals = data?.totals || {}
  const baseline = data?.dateAwareBaseline?.totals || {}

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data?.products || []).filter(product => {
      const matchesSource = (product.sourceRows || []).some(row => [
        row.movementId,
        row.referenceId,
        row.sourceProductId,
        row.sourceProductName,
        row.entrySupplier,
        row.entryInvoiceNo,
        row.excelPriceMatch?.invoiceNo,
        row.excelPriceMatch?.supplierDescription
      ].some(value => String(value ?? '').toLowerCase().includes(needle)))
      const matchesSearch = !needle ||
        String(product.productName || '').toLowerCase().includes(needle) ||
        String(product.productId).includes(needle) ||
        matchesSource
      const status = mappingStatus(product.mappedPieces, product.salesPieces)
      const hasEditablePrice = (product.sourceRows || []).some(row => row.pricingEditable)
      const matchesPrice = priceFilter === 'all' ||
        (priceFilter === 'excel-ready' && product.excelPriceReadySources > 0) ||
        (priceFilter === 'excel-review' && product.excelPriceReviewSources > 0) ||
        (priceFilter === 'editable' && hasEditablePrice) ||
        (priceFilter === 'pending' && product.pricePendingPieces > 0) ||
        (priceFilter === 'priced' && product.pricePendingPieces <= 0)
      return matchesSearch &&
        (statusFilter === 'all' || status === statusFilter) &&
        matchesPrice
    })
  }, [data?.products, priceFilter, search, statusFilter])

  const sourcePriceValue = row => {
    if (Object.prototype.hasOwnProperty.call(draftCosts, row.sourceKey)) {
      return draftCosts[row.sourceKey]
    }
    if (exactExcelPrice(row) && !row.pricingReady) {
      return row.excelPriceMatch.gstInclusiveUnitPrice
    }
    return row.unitCost ?? null
  }

  const applyExcelPrice = row => {
    if (!exactExcelPrice(row)) return
    setDraftCosts(current => ({
      ...current,
      [row.sourceKey]: row.excelPriceMatch.gstInclusiveUnitPrice
    }))
  }

  const approveSourcePrice = async row => {
    const unitCost = Number(sourcePriceValue(row))
    if (!(unitCost > 0)) {
      message.warning('Enter a positive GST-inclusive material cost per piece')
      return
    }
    setSavingSourceKey(row.sourceKey)
    try {
      const response = await client.post(
        '/cost-management/step4/date-free-production-coverage/source-price',
        {
          sourceType: row.pricingSourceType,
          sourceId: row.pricingSourceId,
          productId: row.pricingProductId,
          unitCost,
          excelEvidenceId: hasExactExcelEvidence(row) ? row.excelPriceMatch.evidenceId : null
        }
      )
      message.success(response.data?.message || 'Source price approved')
      setDraftCosts(current => {
        const next = { ...current }
        delete next[row.sourceKey]
        return next
      })
      await onRefresh()
    } catch (error) {
      console.error('Failed to approve source price:', error)
      message.error(error.response?.data?.message || 'Failed to approve the source price')
    } finally {
      setSavingSourceKey(null)
    }
  }

  const sourceRows = useMemo(() => [
    {
      key: 'fmbk-inventory-in',
      source: 'FMBK ERP Inventory In',
      usedPieces: data?.sourceTotals?.fmbk_inventory_in,
      capacityPieces: data?.supplyPools?.fmbkInventoryIn?.capacityPieces
    },
    {
      key: 'other-inventory-in',
      source: 'Other exact ERP Inventory In',
      usedPieces: data?.sourceTotals?.erp_inventory_in,
      capacityPieces: data?.supplyPools?.otherInventoryIn?.capacityPieces
    },
    {
      key: 'adjustment',
      source: 'Adjustment / Sync as purchase',
      usedPieces: data?.sourceTotals?.adjustment_as_purchase,
      capacityPieces: data?.supplyPools?.adjustmentsAsPurchases?.capacityPieces
    },
    {
      key: 'restoration',
      source: 'Residual ERP stock restoration',
      usedPieces: data?.sourceTotals?.stock_restoration_as_purchase,
      capacityPieces: data?.supplyPools?.stockRestorations?.capacityPieces
    },
    {
      key: 'opening',
      source: 'Priced Step 1 opening stock',
      usedPieces: data?.sourceTotals?.opening_stock_as_purchase,
      capacityPieces: data?.supplyPools?.pricedOpeningStock?.capacityPieces
    },
    {
      key: 'production',
      source: 'Production output · dates ignored',
      usedPieces: data?.sourceTotals?.production_plan_output,
      capacityPieces: data?.supplyPools?.productionPlans?.capacityPieces
    }
  ], [data])

  const productColumns = useMemo(() => [
    {
      title: 'Alloy product',
      dataIndex: 'productName',
      key: 'productName',
      width: 390,
      render: (value, row) => (
        <div>
          <ProductName>{value}</ProductName>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>Product #{row.productId}</div>
        </div>
      )
    },
    {
      title: 'Sales',
      key: 'sales',
      width: 150,
      render: (_, row) => (
        <div>
          <Text strong>{formatQty(row.salesPieces)}</Text>
          <div style={{ color: MUTED, fontSize: 12 }}>{row.salesEntries} entries</div>
        </div>
      )
    },
    {
      title: 'Source allocation',
      key: 'sources',
      width: 430,
      render: (_, row) => (
        <Space size={[4, 4]} wrap>
          {row.fmbkInventoryInPieces > 0 && <Tag color='blue'>{formatQty(row.fmbkInventoryInPieces)} FMBK In</Tag>}
          {row.otherInventoryInPieces > 0 && <Tag color='cyan'>{formatQty(row.otherInventoryInPieces)} ERP In</Tag>}
          {row.adjustmentAsPurchasePieces > 0 && <Tag color='purple'>{formatQty(row.adjustmentAsPurchasePieces)} adjustment/sync</Tag>}
          {row.stockRestorationPieces > 0 && <Tag color='gold'>{formatQty(row.stockRestorationPieces)} restoration</Tag>}
          {row.openingStockPieces > 0 && <Tag color='success'>{formatQty(row.openingStockPieces)} opening</Tag>}
          {row.productionPlanPieces > 0 && <Tag color='geekblue'>{formatQty(row.productionPlanPieces)} production</Tag>}
        </Space>
      )
    },
    {
      title: 'Covered',
      key: 'coverage',
      width: 285,
      render: (_, row) => (
        <div style={{ minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Text strong style={{ color: row.gapPieces > 0 ? ORANGE : GREEN }}>
              {formatQty(row.mappedPieces)} / {formatQty(row.salesPieces)}
            </Text>
            <Text type='secondary'>{formatPercent(row.coveragePercent)}</Text>
          </div>
          <Progress
            percent={Number(row.coveragePercent || 0)}
            showInfo={false}
            size='small'
            strokeColor={row.gapPieces > 0 ? ORANGE : GREEN}
          />
          {row.gapPieces > 0 && (
            <Text type='danger' style={{ fontSize: 12 }}>
              {formatQty(row.gapPieces)} source quantity exhausted
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Exact price coverage',
      key: 'priceCoverage',
      width: 285,
      render: (_, row) => {
        const mappedPieces = Number(row.mappedPieces || 0)
        const pricedPercent = percent(row.pricedPieces, mappedPieces)
        return (
          <div style={{ minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <Text strong style={{ color: row.pricePendingPieces > 0 ? ORANGE : GREEN }}>
                {formatQty(row.pricedPieces)} / {formatQty(mappedPieces)}
              </Text>
              <Text type='secondary'>{formatPercent(pricedPercent)}</Text>
            </div>
            <Progress
              percent={pricedPercent}
              showInfo={false}
              size='small'
              strokeColor={row.pricePendingPieces > 0 ? ORANGE : GREEN}
            />
            <Text type={row.pricePendingPieces > 0 ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
              {formatQty(row.pricePendingPieces)} still need exact price evidence
            </Text>
            {(row.excelPriceReadySources > 0 || row.excelPriceReviewSources > 0) && (
              <div style={{ marginTop: 5 }}>
                {row.excelPriceReadySources > 0 && (
                  <Tag color='success'>{row.excelPriceReadySources} Excel price ready</Tag>
                )}
                {row.excelPriceReviewSources > 0 && (
                  <Tag color='warning'>{row.excelPriceReviewSources} Excel review</Tag>
                )}
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 145,
      fixed: 'right',
      render: (_, row) => <MappingStatusTag mapped={row.mappedPieces} required={row.salesPieces} />
    }
  ], [])

  const sourcePriceColumns = [
    {
      title: 'Purchase / adjustment entry',
      key: 'source',
      width: 365,
      render: (_, row) => {
        const isAdjustment = ['adjustment', 'sync'].includes(String(row.referenceType || ''))
        return (
          <div>
            <Space size={5} wrap>
              <Tag color={row.movementId ? (isAdjustment ? 'purple' : 'blue') : row.sourceKind === 'production_plan_output' ? 'geekblue' : 'default'}>
                {entryTypeLabel(row)}
              </Tag>
              {row.trackedByFifo === false && <Tag color='warning'>No FIFO layer</Tag>}
            </Space>
            <div style={{ marginTop: 6 }}>
              <Text strong style={{ color: INK, fontSize: 14 }}>
                {row.movementId
                  ? `Movement #${row.movementId}`
                  : row.productionId
                    ? `Production plan #${row.productionId}`
                    : row.sourceId}
              </Text>
              {row.referenceId != null && (
                <Text style={{ color: MUTED, fontSize: 12 }}> · ERP entry #{row.referenceId}</Text>
              )}
            </div>
            {row.upstreamProductionInput && (
              <div style={{ marginTop: 5 }}>
                <Text strong style={{ color: INK, fontSize: 14 }}>
                  {row.sourceProductName || row.productName || 'Raw alloy input'}
                </Text>
                <div style={{ color: BLUE, fontSize: 12, fontWeight: 650, marginTop: 2 }}>
                  Issued to production plan{(row.productionIds || []).length === 1 ? '' : 's'}{' '}
                  {(row.productionIds || []).map(id => `#${id}`).join(', ') || `#${row.productionId}`}
                </div>
              </div>
            )}
            <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
              {formatDate(row.sourceAt)}
              {row.entryQuantity != null ? ` · Entry quantity ${formatQty(row.entryQuantity)}` : ''}
            </div>
            {row.fifoLayerId && (
              <div style={{ color: MUTED, fontSize: 12 }}>FIFO layer #{row.fifoLayerId}</div>
            )}
            {!row.fifoLayerId && (row.fifoLayerIds || []).length > 0 && (
              <div style={{ color: MUTED, fontSize: 12 }}>
                FIFO layer{row.fifoLayerIds.length === 1 ? '' : 's'}{' '}
                {row.fifoLayerIds.map(id => `#${id}`).join(', ')}
              </div>
            )}
            {(row.entrySupplier || row.entryInvoiceNo) && (
              <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
                {[row.entrySupplier, row.entryInvoiceNo].filter(Boolean).join(' · ')}
              </div>
            )}
            {row.entryNotes && (
              <Text
                type='secondary'
                ellipsis={{ tooltip: row.entryNotes }}
                style={{ display: 'block', maxWidth: 330, fontSize: 11, marginTop: 3 }}
              >
                {row.entryNotes}
              </Text>
            )}
          </div>
        )
      }
    },
    {
      title: 'Linked quantity',
      key: 'sales',
      width: 235,
      render: (_, row) => row.upstreamProductionInput ? (
        <div>
          <Text strong>{formatQty(row.usedByProductionPieces)} issued to production</Text>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            {formatQty(row.linkedSalesPieces)} finished sales linked
          </div>
          <div style={{ color: MUTED, fontSize: 12 }}>
            Sales {(row.saleEntryIds || []).slice(0, 4).map(entryId => `#${entryId}`).join(', ')}
            {(row.saleEntryIds || []).length > 4 ? ` +${row.saleEntryIds.length - 4}` : ''}
          </div>
        </div>
      ) : (
        <div>
          <Text strong>{formatQty(row.usedPieces)} used by sales</Text>
          <div style={{ color: MUTED, fontSize: 12 }}>
            {(row.saleEntryIds || []).slice(0, 4).map(entryId => `#${entryId}`).join(', ')}
            {(row.saleEntryIds || []).length > 4 ? ` +${row.saleEntryIds.length - 4}` : ''}
          </div>
        </div>
      )
    },
    {
      title: 'Excel purchase-price evidence (±2 days)',
      key: 'excelEvidence',
      width: 430,
      render: (_, row) => {
        const match = row.excelPriceMatch
        if (hasExactExcelEvidence(row)) {
          const alreadyApproved = match.status === 'already_claimed_same_movement'
          return (
            <div style={{ borderLeft: `3px solid ${GREEN}`, paddingLeft: 10 }}>
              <Tag color='success'>
                {alreadyApproved ? 'Exact Excel evidence approved' : 'Exact product + quantity + date'}
              </Tag>
              <div style={{ marginTop: 5 }}>
                <Text strong style={{ color: INK }}>{match.supplier || 'Excel purchase'}</Text>
                <div style={{ color: MUTED, fontSize: 12 }}>
                  Invoice {match.invoiceNo || '—'} · {formatDate(match.evidenceDate)} · {formatQty(match.purchaseQuantity)}
                </div>
                <div style={{ color: MUTED, fontSize: 12 }}>
                  ERP movement is {Math.abs(Number(match.dayDifference || 0))} day{Math.abs(Number(match.dayDifference || 0)) === 1 ? '' : 's'} from Excel
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 8 }}>
                <div>
                  <div style={{ color: MUTED, fontSize: 11 }}>Taxable / Pc</div>
                  <Text strong>{formatCurrency(match.taxableUnitPrice)}</Text>
                </div>
                <div>
                  <div style={{ color: MUTED, fontSize: 11 }}>GST {Number(match.gstRate || 0) * 100}%</div>
                  <Text strong>{formatCurrency(match.gstAmountPerUnit)}</Text>
                </div>
                <div>
                  <div style={{ color: MUTED, fontSize: 11 }}>Inclusive / Pc</div>
                  <Text strong style={{ color: GREEN }}>{formatCurrency(match.gstInclusiveUnitPrice)}</Text>
                </div>
              </div>
              {row.pricingEditable && exactExcelPrice(row) && (
                <Button type='link' onClick={() => applyExcelPrice(row)} style={{ padding: 0, marginTop: 4 }}>
                  Use this price
                </Button>
              )}
            </div>
          )
        }
        if (String(match?.status || '').startsWith('review_')) {
          return (
            <div style={{ borderLeft: `3px solid ${ORANGE}`, paddingLeft: 10 }}>
              <Tag color='warning'>Excel match needs review</Tag>
              <div style={{ color: INK, fontSize: 12, marginTop: 5 }}>{match.reviewReason}</div>
              {match.gstInclusiveUnitPrice > 0 && (
                <div style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>
                  Reference only: {formatCurrency(match.gstInclusiveUnitPrice)} / Pc · Excel qty {formatQty(match.purchaseQuantity)}
                </div>
              )}
            </div>
          )
        }
        return row.pricingEditable ? (
          <div>
            <Tag>No exact Excel match</Tag>
            <div style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>
              Enter the GST-inclusive cost manually for this exact ERP entry.
            </div>
          </div>
        ) : <Text type='secondary'>Not applicable to this source</Text>
      }
    },
    {
      title: 'Approve material cost / Pc',
      key: 'unitCost',
      width: 355,
      render: (_, row) => row.pricingEditable ? (
        <Space align='start' wrap>
          <InputNumber
            min={0.01}
            max={1000000}
            precision={2}
            prefix='₹'
            value={sourcePriceValue(row)}
            onChange={value => setDraftCosts(current => ({ ...current, [row.sourceKey]: value }))}
            placeholder='GST-inclusive cost / Pc'
            style={{ width: 190 }}
          />
          <Button
            type='primary'
            loading={savingSourceKey === row.sourceKey}
            disabled={savingSourceKey != null && savingSourceKey !== row.sourceKey}
            onClick={() => approveSourcePrice(row)}
          >
            {row.pricingReady ? 'Update price' : exactExcelPrice(row) ? 'Approve Excel price' : 'Approve price'}
          </Button>
          {exactExcelPrice(row) && !row.pricingReady && (
            <Text type='success' style={{ fontSize: 12, width: '100%' }}>
              Prefilled from exact Excel evidence. You can edit it before approval.
            </Text>
          )}
          {row.pricingStatus === 'estimated_cost_not_exact' && row.unitCost > 0 && (
            <Text type='warning' style={{ fontSize: 12, width: '100%' }}>
              Current estimate {formatCurrency(row.unitCost)} is not treated as exact.
            </Text>
          )}
        </Space>
      ) : row.pricingReady ? (
        <div>
          <Text strong style={{ color: GREEN }}>{formatCurrency(row.unitCost)} / Pc</Text>
          <div><Tag color='success'>Exact price ready</Tag></div>
        </div>
      ) : row.pendingAction === 'price_raw_input_in_step3' ? (
        <div>
          <Tag color='warning'>Raw input price pending</Tag>
          <div>
            <Button type='link' href='/costing/step-3-production-costing' style={{ padding: 0 }}>
              Open Step 3 pricing
            </Button>
          </div>
        </div>
      ) : (
        <Tag color='default'>No direct price entry for this source</Tag>
      )
    },
    {
      title: 'Price status',
      key: 'priceStatus',
      width: 175,
      render: (_, row) => row.pricingReady
        ? <Tag color='success'>{String(row.pricingStatus || 'priced').replaceAll('_', ' ')}</Tag>
        : exactExcelPrice(row)
          ? <Tag color='success'>Excel price ready</Tag>
          : String(row.excelPriceMatch?.status || '').startsWith('review_')
            ? <Tag color='warning'>Review Excel match</Tag>
        : row.pricingEditable
          ? <Tag color='error'>Price entry required</Tag>
          : <Tag color='warning'>{String(row.pricingStatus || 'pending').replaceAll('_', ' ')}</Tag>
    }
  ]

  const renderProductSourceDetail = product => (
    <div style={{ padding: '4px 6px 16px' }}>
      <Title level={5} style={{ margin: '4px 0 10px', color: INK }}>
        Finished source and upstream raw purchase/adjustment entries — latest to oldest
      </Title>
      <Alert
        type='info'
        showIcon
        message='Approve one GST-inclusive material cost for the complete purchase or adjustment entry'
        description='Production rows now include the raw purchase or adjustment FIFO entries that supplied them, even when that raw layer is fully consumed. An exact Excel product + quantity match within ±2 days is prefilled automatically. Review matches are never prefilled. Approval stages durable source evidence only; FIFO layers and sales remain unchanged until controlled replay.'
        style={{ marginBottom: 10 }}
      />
      <Table
        rowKey='sourceKey'
        dataSource={product.sourceRows || []}
        columns={sourcePriceColumns}
        pagination={false}
        size='small'
        scroll={{ x: 1600 }}
      />
    </div>
  )

  const monthlyColumns = [
    { title: 'Month', dataIndex: 'month', key: 'month', width: 120 },
    { title: 'Sales Qty', dataIndex: 'salesPieces', key: 'salesPieces', render: formatQty },
    { title: 'Covered', dataIndex: 'mappedPieces', key: 'mappedPieces', render: value => <Text strong style={{ color: GREEN }}>{formatQty(value)}</Text> },
    { title: 'Gap', dataIndex: 'gapPieces', key: 'gapPieces', render: value => <Text strong type={value > 0 ? 'danger' : 'success'}>{formatQty(value)}</Text> },
    { title: 'Quantity coverage', dataIndex: 'coveragePercent', key: 'coveragePercent', render: value => <Text strong>{formatPercent(value)}</Text> },
    { title: 'Exactly priced', dataIndex: 'pricedPieces', key: 'pricedPieces', render: value => <Text strong style={{ color: BLUE }}>{formatQty(value)}</Text> },
    { title: 'Price pending', dataIndex: 'pricePendingPieces', key: 'pricePendingPieces', render: value => <Text strong type={value > 0 ? 'danger' : 'success'}>{formatQty(value)}</Text> }
  ]

  const sourceColumns = [
    { title: 'Source', dataIndex: 'source', key: 'source', render: value => <Text strong>{value}</Text> },
    { title: 'Available pool', dataIndex: 'capacityPieces', key: 'capacityPieces', render: formatQty },
    { title: 'Used for sales', dataIndex: 'usedPieces', key: 'usedPieces', render: value => <Text strong style={{ color: BLUE }}>{formatQty(value)}</Text> }
  ]

  const unresolvedColumns = [
    { title: 'Sale', dataIndex: 'entryId', key: 'entryId', width: 110, render: value => <Text strong>#{value}</Text> },
    { title: 'Date', dataIndex: 'saleDate', key: 'saleDate', width: 140, render: formatDate },
    { title: 'Product', dataIndex: 'productName', key: 'productName', render: value => <ProductName>{value}</ProductName> },
    { title: 'Sale Qty', dataIndex: 'salesPieces', key: 'salesPieces', width: 120, render: formatQty },
    { title: 'Covered', dataIndex: 'mappedPieces', key: 'mappedPieces', width: 120, render: formatQty },
    { title: 'Missing', dataIndex: 'gapPieces', key: 'gapPieces', width: 120, render: value => <Text strong type='danger'>{formatQty(value)}</Text> },
    { title: 'Reason', key: 'reason', width: 220, render: () => <Tag color='error'>Verified source exhausted</Tag> }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: INK }}>January–Now · date-free production dry run</Title>
          <Text style={{ color: MUTED }}>
            Purchase-like sources stay chronological. Recorded production output can be consumed without enforcing its production date.
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>Refresh coverage</Button>
      </div>

      <Alert
        type='warning'
        showIcon
        message='Quantity lineage is read-only; a cost is staged only when you press Approve'
        description={`Exact ERP product IDs only. Inventory In, adjustments/sync, and priced Step 1 opening stock are merged latest-to-oldest with a two-day posting grace. Production output is used next with dates ignored; unlayered restoration is only a residual fallback. ${formatQty(totals.gapPieces)} currently lack verified source quantity.`}
        style={{ marginBottom: 18 }}
      />

      {data?.sourcePricingSummary?.excelPriceReadySources > 0 && (
        <Alert
          type='success'
          showIcon
          message={`${Number(data.sourcePricingSummary.excelPriceReadySources).toLocaleString('en-IN')} exact Excel prices are ready to approve`}
          description={`${formatQty(data.sourcePricingSummary.excelPriceReadyPieces)} full ERP entry quantity is covered by these unique purchase entries, including ${Number(data.sourcePricingSummary.upstreamExcelPriceReadySources || 0).toLocaleString('en-IN')} raw inputs already consumed by production. Expand a row to review the ERP entry, Excel invoice, GST calculation, and editable approval price.`}
          style={{ marginBottom: 18 }}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: 12, marginBottom: 18 }}>
        <SummaryCard
          title='Sales universe'
          value={totals.salesPieces}
          suffix='Pcs'
          helper={`${Number(totals.salesEntries || 0).toLocaleString('en-IN')} entries · ${Number(totals.salesProducts || 0).toLocaleString('en-IN')} exact products`}
          icon={<LinkOutlined />}
        />
        <SummaryCard
          title='Source quantity covered'
          value={totals.mappedPieces}
          suffix='Pcs'
          helper={`${formatPercent(totals.coveragePercent)} coverage · ${Number(totals.fullyCoveredEntries || 0).toLocaleString('en-IN')} fully covered entries`}
          color={GREEN}
          icon={<CheckCircleOutlined />}
        />
        <SummaryCard
          title='Verified source gap'
          value={totals.gapPieces}
          suffix='Pcs'
          helper={`${Number(data?.unresolvedSales?.length || 0).toLocaleString('en-IN')} sales entries across ${Number(data?.unresolvedProducts?.length || 0).toLocaleString('en-IN')} products`}
          color={totals.gapPieces > 0 ? ORANGE : GREEN}
          icon={<WarningOutlined />}
        />
        <SummaryCard
          title='Exact price coverage'
          value={totals.pricedPieces}
          suffix='Pcs'
          helper={`${formatPercent(totals.priceCoveragePercent)} of mapped quantity · ${formatQty(totals.pricePendingPieces)} pending · ${Number(data?.sourcePricingSummary?.excelPriceReadySources || 0).toLocaleString('en-IN')} exact Excel prices ready`}
          color={totals.pricePendingPieces > 0 ? ORANGE : GREEN}
          icon={<ShoppingCartOutlined />}
        />
        <SummaryCard
          title='Date-free improvement'
          value={data?.dateFreeImprovement?.mappedPieces}
          suffix='Pcs'
          helper={`${formatPercent(baseline.coveragePercent)} date-aware → ${formatPercent(totals.coveragePercent)} date-free`}
          color={BLUE}
          icon={<ApartmentOutlined />}
        />
      </div>

      <Card style={{ borderColor: BORDER, marginBottom: 18 }} styles={{ body: { padding: 16 } }}>
        <Title level={4} style={{ margin: '0 0 12px', color: INK }}>Monthly coverage</Title>
        <Table rowKey='month' loading={loading} dataSource={data?.monthly || []} columns={monthlyColumns} pagination={false} size='small' />
      </Card>

      <Card style={{ borderColor: BORDER, marginBottom: 18 }} styles={{ body: { padding: 16 } }}>
        <Title level={4} style={{ margin: '0 0 12px', color: INK }}>Source quantities consumed</Title>
        <Table rowKey='key' loading={loading} dataSource={sourceRows} columns={sourceColumns} pagination={false} size='small' />
      </Card>

      <Card style={{ borderColor: BORDER, marginBottom: 18 }} styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: INK }}>Coverage by exact alloy product</Title>
            <Text style={{ color: MUTED }}>Every sale is concatenated by ERP product ID.</Text>
          </div>
          <Space wrap>
            <Input
              allowClear
              value={search}
              onChange={event => setSearch(event.target.value)}
              prefix={<SearchOutlined style={{ color: MUTED }} />}
              placeholder='Product, movement, invoice or ID'
              style={{ width: 280, maxWidth: '100%' }}
            />
            <Select value={statusFilter} onChange={setStatusFilter} options={MAPPING_FILTER_OPTIONS} style={{ width: 205 }} />
            <Select value={priceFilter} onChange={setPriceFilter} options={PRICE_FILTER_OPTIONS} style={{ width: 205 }} />
            <Tag color='blue'>{filteredProducts.length} of {(data?.products || []).length} products</Tag>
          </Space>
        </div>
        <Table
          rowKey='productId'
          loading={loading}
          dataSource={filteredProducts}
          columns={productColumns}
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: [25, 50, 100] }}
          scroll={{ x: 1680 }}
          expandable={{
            expandedRowRender: renderProductSourceDetail,
            rowExpandable: row => (row.sourceRows || []).length > 0
          }}
        />
      </Card>

      <Card style={{ borderColor: BORDER }} styles={{ body: { padding: 16 } }}>
        <Title level={4} style={{ margin: '0 0 4px', color: INK }}>Exact unsupported sales</Title>
        <Text style={{ color: MUTED }}>These entries need approved source corrections before exact quantity coverage can reach 100%.</Text>
        <Table
          rowKey='entryId'
          loading={loading}
          dataSource={data?.unresolvedSales || []}
          columns={unresolvedColumns}
          pagination={false}
          size='small'
          scroll={{ x: 1150 }}
          style={{ marginTop: 12 }}
          locale={{ emptyText: <Empty description='All sales have verified source quantity' /> }}
        />
      </Card>
    </div>
  )
}

const JulySalesLineagePage = () => {
  const [workspaceTab, setWorkspaceTab] = useState('date-free')
  const [dateFreeData, setDateFreeData] = useState(null)
  const [dateFreeLoading, setDateFreeLoading] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('apr-jun-2026')
  const [search, setSearch] = useState('')
  const [productMappingFilter, setProductMappingFilter] = useState('all')
  const [rawSearch, setRawSearch] = useState('')
  const [purchaseMappingFilter, setPurchaseMappingFilter] = useState('all')
  const [expandedRawKeys, setExpandedRawKeys] = useState([])

  const loadDateFreeCoverage = useCallback(async () => {
    setDateFreeLoading(true)
    try {
      const response = await client.get('/cost-management/step4/date-free-production-coverage', {
        params: { startDate: '2026-01-01' }
      })
      setDateFreeData(response.data)
    } catch (error) {
      console.error('Failed to load date-free production coverage:', error)
      message.error(error.response?.data?.message || 'Failed to load the date-free coverage workspace')
    } finally {
      setDateFreeLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDateFreeCoverage()
  }, [loadDateFreeCoverage])

  const createRun = useCallback(async () => {
    setLoading(true)
    try {
      const response = await client.get('/cost-management/step4/july-sales-lineage', {
        params: { period }
      })
      setData(response.data)
      setExpandedRawKeys([])
    } catch (error) {
      console.error('Failed to create sales lineage run:', error)
      message.error(error.response?.data?.message || 'Failed to load the sales mapping workspace')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    createRun()
  }, [createRun])

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data?.products || []).filter(product => {
      const matchesSearch = !needle ||
        product.productName.toLowerCase().includes(needle) ||
        String(product.productId).includes(needle)
      const status = mappingStatus(product.lineageMappedQty, product.salesQty)
      return matchesSearch && (productMappingFilter === 'all' || status === productMappingFilter)
    })
  }, [data?.products, productMappingFilter, search])

  const filteredRawGroups = useMemo(() => {
    const needle = rawSearch.trim().toLowerCase()
    return (data?.rawGroups || []).filter(rawGroup => {
      const matchesSearch = !needle ||
        rawGroup.rawProductName.toLowerCase().includes(needle) ||
        rawGroup.finishedProducts.some(product => product.toLowerCase().includes(needle))
      const status = mappingStatus(rawGroup.purchaseMappedQty, rawGroup.requiredQty)
      return matchesSearch && (purchaseMappingFilter === 'all' || status === purchaseMappingFilter)
    })
  }, [data?.rawGroups, purchaseMappingFilter, rawSearch])

  const periodLabel = data?.window?.shortLabel ||
    PERIOD_OPTIONS.find(option => option.value === period)?.label ||
    'Selected period'

  const productColumns = useMemo(() => [
    {
      title: `${periodLabel} sales product`,
      dataIndex: 'productName',
      key: 'productName',
      width: 390,
      render: (value, row) => (
        <div>
          <ProductName>{value}</ProductName>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
            Product #{row.productId} · {formatDate(row.firstSaleAt)}–{formatDate(row.lastSaleAt)}
          </div>
        </div>
      )
    },
    {
      title: 'Sales entries',
      dataIndex: 'salesEntries',
      key: 'salesEntries',
      width: 125,
      render: (value, row) => (
        <div>
          <Text strong>{Number(value).toLocaleString('en-IN')}</Text>
          {row.claims > 0 && <div><Tag color='gold'>{row.claims} claim</Tag></div>}
        </div>
      )
    },
    {
      title: `${periodLabel} quantity`,
      dataIndex: 'salesQty',
      key: 'salesQty',
      width: 145,
      render: value => <Text style={{ fontSize: 16, fontWeight: 750 }}>{formatQty(value)}</Text>
    },
    {
      title: 'Resolved source',
      key: 'production',
      width: 285,
      render: (_, row) => (
        <div style={{ minWidth: 190 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Text strong style={{ color: GREEN }}>
              {formatQty(row.lineageMappedQty)} / {formatQty(row.salesQty)}
            </Text>
            <Text type='secondary'>{percent(row.lineageMappedQty, row.salesQty)}%</Text>
          </div>
          <Progress
            percent={percent(row.lineageMappedQty, row.salesQty)}
            showInfo={false}
            size='small'
            strokeColor={GREEN}
          />
          <Text type={row.productionGapQty > 0 ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
            {formatQty(row.productionGapQty)} unresolved
          </Text>
          <div style={{ marginTop: 4 }}>
            <Space size={4} wrap>
              <Tag color='success'>{formatQty(row.exactProductionMappedQty)} exact plan</Tag>
              {row.inferredProductionMappedQty > 0 && (
                <Tag color='blue'>{formatQty(row.inferredProductionMappedQty)} inferred</Tag>
              )}
              {row.productionInputMappedQty > 0 && (
                <Tag color='geekblue'>{formatQty(row.productionInputMappedQty)} exact production input</Tag>
              )}
              {row.directFinishedPurchaseMappedQty > 0 && (
                <Tag color='cyan'>{formatQty(row.directFinishedPurchaseMappedQty)} direct finished purchase</Tag>
              )}
              {row.directFinishedAdjustmentMappedQty > 0 && (
                <Tag color='purple'>{formatQty(row.directFinishedAdjustmentMappedQty)} adjustment / sync</Tag>
              )}
            </Space>
          </div>
        </div>
      )
    },
    {
      title: 'Raw groups',
      dataIndex: 'rawGroups',
      key: 'rawGroups',
      width: 115,
      align: 'center',
      render: value => <Tag color={value > 0 ? 'blue' : 'default'}>{value || 0}</Tag>
    },
    {
      title: 'End-to-end cost-source coverage',
      key: 'purchases',
      width: 285,
      render: (_, row) => (
        <div style={{ minWidth: 190 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Text strong style={{ color: GREEN }}>
              {formatQty(row.endToEndMappedQty)} / {formatQty(row.salesQty)}
            </Text>
            <Text type='secondary'>{percent(row.endToEndMappedQty, row.salesQty)}%</Text>
          </div>
          <Progress
            percent={percent(row.endToEndMappedQty, row.salesQty)}
            showInfo={false}
            size='small'
            strokeColor={GREEN}
          />
          <Text type='secondary' style={{ fontSize: 12 }}>
            {formatQty(row.purchaseMappedQty)} raw purchases · {formatQty(row.productionInputPricedQty)} priced production input · {formatQty(row.directFinishedPurchaseMappedQty)} direct purchases · {formatQty(row.directFinishedAdjustmentPricedQty)} priced adjustment/sync
          </Text>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      fixed: 'right',
      width: 145,
      render: (_, row) => (
        <MappingStatusTag mapped={row.lineageMappedQty} required={row.salesQty} />
      )
    }
  ], [periodLabel])

  const saleLineageColumns = [
    {
      title: 'Sale entry',
      key: 'sale',
      width: 165,
      render: (_, row) => (
        <div>
          <Text strong>#{row.entryId}</Text>
          <div style={{ color: MUTED, fontSize: 12 }}>{formatDate(row.saleAt)}</div>
        </div>
      )
    },
    {
      title: 'Dealer',
      dataIndex: 'dealerName',
      key: 'dealerName',
      width: 220,
      render: value => <Text strong>{value || '—'}</Text>
    },
    {
      title: 'Lineage source',
      key: 'productionPlan',
      width: 225,
      render: (_, row) => row.directAdjustment ? (
        <div>
          <Tag color={row.directAdjustment.referenceType === 'sync' ? 'magenta' : 'purple'}>
            {row.directAdjustment.referenceType === 'sync' ? 'Stock Sync In' : 'Adjustment In'}
          </Tag>
          <div style={{ marginTop: 4 }}>{lineageEvidenceTag(row.directAdjustment.lineageEvidence)}</div>
        </div>
      ) : row.productionInput ? (
        <div>
          <Tag color='geekblue'>Exact production input</Tag>
          <div style={{ marginTop: 4 }}>{lineageEvidenceTag(row.productionInput.lineageEvidence)}</div>
        </div>
      ) : row.directPurchase ? (
        <div>
          <Tag color='cyan'>Direct finished purchase</Tag>
          <div style={{ marginTop: 4 }}>{lineageEvidenceTag(row.directPurchase.lineageEvidence)}</div>
        </div>
      ) : row.allocation ? (
        <div>
          <Text strong style={{ fontSize: 15 }}>Plan #{row.allocation.productionId}</Text>
          <div style={{ marginTop: 4 }}>{lineageEvidenceTag(row.allocation.lineageEvidence)}</div>
        </div>
      ) : <Tag color='error'>No plan linked</Tag>
    },
    {
      title: 'Source event',
      key: 'outputBatch',
      width: 235,
      render: (_, row) => row.directAdjustment ? (
        <div>
          <Text strong>{formatDate(row.directAdjustment.sourceAt)}</Text>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            Inventory movement #{row.directAdjustment.movementId} · source {formatQty(row.directAdjustment.sourceQuantity)}
          </div>
          <div style={{ color: MUTED, fontSize: 12 }}>
            FIFO consumption #{row.directAdjustment.fifoConsumptionId} · layer #{row.directAdjustment.fifoLayerId}
          </div>
          {row.directAdjustment.notes && (
            <div style={{ color: MUTED, fontSize: 12 }}>{row.directAdjustment.notes}</div>
          )}
        </div>
      ) : row.productionInput ? (
        <div>
          <Text strong>{formatDate(row.productionInput.inputConsumedAt)}</Text>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            Plan #{row.productionInput.productionId} · request #{row.productionInput.requestId}
          </div>
          <div style={{ color: MUTED, fontSize: 12 }}>
            FIFO consumption #{row.productionInput.fifoConsumptionId} · layer #{row.productionInput.fifoLayerId}
          </div>
        </div>
      ) : row.directPurchase ? (
        <div>
          <Text strong>{formatDate(row.directPurchase.purchaseAt)}</Text>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            Inventory movement #{row.directPurchase.movementId}
          </div>
          <div style={{ color: MUTED, fontSize: 12 }}>
            Purchase line {formatQty(row.directPurchase.purchaseQuantity)}
          </div>
          {row.directPurchase.fifoConsumptionId && (
            <div style={{ color: MUTED, fontSize: 12 }}>
              FIFO consumption #{row.directPurchase.fifoConsumptionId} · layer #{row.directPurchase.fifoLayerId}
            </div>
          )}
          {!row.directPurchase.fifoConsumptionId && row.directPurchase.fifoLayerId && (
            <div style={{ color: MUTED, fontSize: 12 }}>
              Available FIFO layer #{row.directPurchase.fifoLayerId}
            </div>
          )}
          <div style={{ color: MUTED, fontSize: 12 }}>
            {row.directPurchase.supplier || 'ERP purchase entry'}
            {row.directPurchase.invoiceNo ? ` · ${row.directPurchase.invoiceNo}` : ''}
          </div>
        </div>
      ) : row.allocation ? (
        <div>
          <Text strong>{formatDate(row.allocation.productionAt)}</Text>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            {row.allocation.productionOutputMovementId
              ? `Inventory movement #${row.allocation.productionOutputMovementId}`
              : row.allocation.productionOutputId || 'Recorded plan output'}
          </div>
          {row.allocation.productionOutputQuantity > 0 && (
            <div style={{ color: MUTED, fontSize: 12 }}>
              Accepted batch {formatQty(row.allocation.productionOutputQuantity)}
            </div>
          )}
          {row.allocation.fifoConsumptionId && (
            <div style={{ color: MUTED, fontSize: 12 }}>
              FIFO consumption #{row.allocation.fifoConsumptionId} · layer #{row.allocation.fifoLayerId}
            </div>
          )}
        </div>
      ) : <Text type='secondary'>—</Text>
    },
    {
      title: 'Raw / purchased product',
      key: 'rawProductName',
      width: 375,
      render: (_, row) => row.directAdjustment
        ? (
            <div>
              <Tag color={row.directAdjustment.pricingReady ? 'success' : 'warning'}>
                {row.directAdjustment.pricingReady ? 'Prior production cost applied' : 'Prior production price missing'}
              </Tag>
              <div><Text strong style={{ color: BLUE }}>{row.directAdjustment.productName}</Text></div>
              {row.directAdjustment.pricingReady ? (
                <>
                  <Text type='secondary'>{formatCurrency(row.directAdjustment.unitCost)} / Pc</Text>
                  <div style={{ color: MUTED, fontSize: 12 }}>
                    Plan #{row.directAdjustment.nearestProductionId} · {formatDate(row.directAdjustment.nearestProductionAt)}
                  </div>
                </>
              ) : (
                <Text type='warning'>Mapped quantity; cost remains pending</Text>
              )}
            </div>
          )
        : row.productionInput
          ? (
              <div>
                <Tag color={row.productionInput.pricingReady ? 'success' : 'warning'}>
                  {row.productionInput.sourceLabel}
                </Tag>
                <div><Text strong style={{ color: BLUE }}>{row.productionInput.productName}</Text></div>
                {row.productionInput.pricingReady ? (
                  <Text type='secondary'>{formatCurrency(row.productionInput.unitCost)} / Pc</Text>
                ) : (
                  <Text type='warning'>Exact input found; price remains pending</Text>
                )}
              </div>
            )
        : row.directPurchase
        ? (
            <div>
              <Tag color='cyan'>Purchased finished product</Tag>
              <div><Text strong style={{ color: BLUE }}>{row.directPurchase.productName}</Text></div>
              {row.directPurchase.unitCost > 0 && (
                <Text type='secondary'>{formatCurrency(row.directPurchase.unitCost)} / Pc</Text>
              )}
            </div>
          )
        : row.allocation
          ? <Text strong style={{ color: BLUE }}>{row.allocation.rawProductName}</Text>
        : <Text type='secondary'>{(row.gapReasons || []).join(' · ').replaceAll('_', ' ') || 'Unresolved'}</Text>
    },
    {
      title: 'Linked quantity',
      key: 'quantity',
      width: 145,
      render: (_, row) => (
        <Text strong type={row.allocation || row.productionInput || row.directPurchase || row.directAdjustment ? 'success' : 'danger'}>
          {formatQty(row.allocation?.quantity || row.productionInput?.quantity || row.directPurchase?.quantity || row.directAdjustment?.quantity || row.gapQty)}
        </Text>
      )
    }
  ]

  const renderSaleLineageDetail = product => {
    const rows = (product.saleRows || []).flatMap(sale => {
      const mappedRows = (sale.allocations || []).map((allocation, index) => ({
          ...sale,
          allocation,
          productionInput: null,
          directPurchase: null,
          directAdjustment: null,
          lineageRowKey: `${sale.entryId}-${allocation.productionOutputId || allocation.productionId}-${index}`
        }))
      const productionInputRows = (sale.productionInputAllocations || []).map((productionInput, index) => ({
        ...sale,
        allocation: null,
        productionInput,
        directPurchase: null,
        directAdjustment: null,
        lineageRowKey: `${sale.entryId}-production-input-${productionInput.fifoConsumptionId}-${index}`
      }))
      const directRows = (sale.directPurchaseAllocations || []).map((directPurchase, index) => ({
        ...sale,
        allocation: null,
        productionInput: null,
        directPurchase,
        directAdjustment: null,
        lineageRowKey: `${sale.entryId}-direct-${directPurchase.movementId}-${index}`
      }))
      const adjustmentRows = (sale.directAdjustmentAllocations || []).map((directAdjustment, index) => ({
        ...sale,
        allocation: null,
        productionInput: null,
        directPurchase: null,
        directAdjustment,
        lineageRowKey: `${sale.entryId}-adjustment-${directAdjustment.fifoConsumptionId}-${index}`
      }))
      const gapRows = sale.gapQty > 0
        ? [{
            ...sale,
            allocation: null,
            productionInput: null,
            directPurchase: null,
            directAdjustment: null,
            lineageRowKey: `${sale.entryId}-unresolved`
          }]
        : []
      return [...mappedRows, ...productionInputRows, ...directRows, ...adjustmentRows, ...gapRows]
    })

    return (
      <div style={{ padding: '4px 6px 18px' }}>
        <Title level={5} style={{ margin: '4px 0 4px', color: INK }}>
          Finished sale → exact source tracking
        </Title>
        <Text style={{ display: 'block', color: MUTED, marginBottom: 10 }}>
          Production output, its exact intermediate-input FIFO layer, direct finished-product purchases, and exact adjustment/sync evidence stay distinct. Intermediate finished inputs use the stock layer actually issued to that production plan.
        </Text>
        <Table
          rowKey='lineageRowKey'
          dataSource={rows}
          columns={saleLineageColumns}
          pagination={false}
          size='small'
          scroll={{ x: 1365 }}
        />
      </div>
    )
  }

  const productionColumns = [
    {
      title: 'Production source',
      key: 'source',
      width: 210,
      render: (_, row) => (
        <div>
          {sourceLabel(row.sourceType)}
          <div style={{ marginTop: 4 }}>{lineageEvidenceTag(row.lineageEvidence)}</div>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
            {row.productionId ? `#${row.productionId}` : 'Direct raw sale'}
          </div>
          {row.productionOutputMovementId && (
            <div style={{ color: MUTED, fontSize: 12 }}>
              Output movement #{row.productionOutputMovementId}
            </div>
          )}
          {row.productionOutputQuantity > 0 && (
            <div style={{ color: MUTED, fontSize: 12 }}>
              Accepted batch {formatQty(row.productionOutputQuantity)}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Available date',
      dataIndex: 'productionAt',
      key: 'productionAt',
      width: 140,
      render: formatDate
    },
    {
      title: 'Finished sales product',
      dataIndex: 'finishedProductName',
      key: 'finishedProductName',
      width: 360,
      render: value => <Text strong>{value}</Text>
    },
    {
      title: 'Raw wheel resolved',
      dataIndex: 'rawProductName',
      key: 'rawProductName',
      width: 360,
      render: value => <Text strong style={{ color: BLUE }}>{value}</Text>
    },
    {
      title: 'Used here',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 130,
      render: value => <Text strong>{formatQty(value)}</Text>
    },
    {
      title: 'Sales',
      dataIndex: 'saleEntries',
      key: 'saleEntries',
      width: 90,
      render: value => `${value} entries`
    }
  ]

  const purchaseColumns = [
    {
      title: 'Purchase date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 135,
      render: formatDate
    },
    {
      title: 'Purchase source',
      key: 'source',
      width: 220,
      render: (_, row) => (
        <div>
          {purchaseSourceTag(row.sourceType)}
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            {row.movementId
              ? `Movement #${row.movementId}`
              : row.voucherId
                ? `Voucher ${row.voucherNumber || row.voucherId}${row.inventoryLine ? ` · line ${row.inventoryLine}` : ''}`
                : `Source #${row.sourceRecordId || '—'}`}
          </div>
        </div>
      )
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 205,
      render: (value, row) => (
        <div>
          <Text strong>{value}</Text>
          {row.invoiceNo && <div style={{ color: MUTED, fontSize: 12 }}>Invoice {row.invoiceNo}</div>}
        </div>
      )
    },
    {
      title: 'Raw product purchased',
      dataIndex: 'purchaseProductName',
      key: 'purchaseProductName',
      width: 365,
      render: value => <Text strong>{value}</Text>
    },
    {
      title: 'Available source Qty',
      dataIndex: 'purchaseQuantity',
      key: 'purchaseQuantity',
      width: 165,
      render: (value, row) => (
        <div>
          <Text strong>{formatQty(value)}</Text>
          {Number(row.originalPurchaseQuantity || 0) !== Number(value || 0) && (
            <div style={{ color: MUTED, fontSize: 12 }}>
              {formatQty(row.originalPurchaseQuantity)} on original line
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Deducted now',
      dataIndex: 'matchedQty',
      key: 'matchedQty',
      width: 140,
      render: value => <Text strong style={{ color: BLUE }}>{formatQty(value)}</Text>
    },
    {
      title: 'Live line balance',
      dataIndex: 'liveRemainingQty',
      key: 'liveRemainingQty',
      width: 150,
      render: value => <Text strong style={{ color: value > 0 ? GREEN : MUTED }}>{formatQty(value)}</Text>
    },
    {
      title: 'Cost status',
      key: 'costStatus',
      width: 175,
      render: (_, row) => row.pricingReady
        ? (
            <div>
              <Tag color='success'>Price ready</Tag>
              <div><Text strong>{formatCurrency(row.unitCost)} / Pc</Text></div>
            </div>
          )
        : <Tag color='warning'>Price pending</Tag>
    },
    {
      title: 'Match',
      key: 'match',
      width: 125,
      render: (_, row) => row.fallbackMatchedQty > 0
        ? <Tag color='warning'>{formatQty(row.fallbackMatchedQty)} fallback</Tag>
        : <Tag color='success'>Exact product</Tag>
    }
  ]

  const tallySalesColumns = [
    {
      title: 'Cash Sales date',
      dataIndex: 'voucherDate',
      key: 'voucherDate',
      width: 135,
      render: formatDate
    },
    {
      title: 'Voucher / line',
      key: 'voucher',
      width: 165,
      render: (_, row) => (
        <div>
          <Text strong>Voucher {row.voucherNumber || row.voucherId}</Text>
          <div style={{ color: MUTED, fontSize: 12 }}>Inventory line {row.inventoryLine}</div>
        </div>
      )
    },
    {
      title: 'Ledger',
      dataIndex: 'ledger',
      key: 'ledger',
      width: 115,
      render: value => <Tag color='cyan'>{value}</Tag>
    },
    {
      title: 'Raw wheel in Tally Sales',
      dataIndex: 'tallyProductName',
      key: 'tallyProductName',
      width: 385,
      render: value => <Text strong>{value}</Text>
    },
    {
      title: 'Sales line Qty',
      dataIndex: 'lineQuantity',
      key: 'lineQuantity',
      width: 140,
      render: value => formatQty(value)
    },
    {
      title: 'Mapped here',
      dataIndex: 'matchedQty',
      key: 'matchedQty',
      width: 135,
      render: value => <Text strong style={{ color: BLUE }}>{formatQty(value)}</Text>
    },
    {
      title: 'Live line balance',
      dataIndex: 'liveRemainingQty',
      key: 'liveRemainingQty',
      width: 150,
      render: value => <Text strong style={{ color: value > 0 ? GREEN : MUTED }}>{formatQty(value)}</Text>
    },
    {
      title: 'Match',
      key: 'match',
      width: 125,
      render: (_, row) => row.fallbackMatchedQty > 0
        ? <Tag color='warning'>{formatQty(row.fallbackMatchedQty)} fallback</Tag>
        : <Tag color='success'>Exact product</Tag>
    }
  ]

  const rawColumns = useMemo(() => [
    {
      title: 'Concatenated raw wheel',
      dataIndex: 'rawProductName',
      key: 'rawProductName',
      width: 390,
      render: (value, row) => (
        <div>
          <ProductName>{value}</ProductName>
          <div style={{ marginTop: 5 }}>
            {row.finishedProducts.slice(0, 2).map(product => (
              <Tag key={product} color='default'>{product}</Tag>
            ))}
            {row.finishedProducts.length > 2 && (
              <Tag>+{row.finishedProducts.length - 2} finished products</Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Production evidence',
      key: 'production',
      width: 175,
      render: (_, row) => (
        <div>
          <Text strong>{row.productionSources} sources</Text>
          <div style={{ color: MUTED, fontSize: 12 }}>{row.saleEntries} sales entries</div>
        </div>
      )
    },
    {
      title: 'Raw Qty required',
      dataIndex: 'requiredQty',
      key: 'requiredQty',
      width: 160,
      render: value => <Text style={{ fontSize: 16, fontWeight: 750 }}>{formatQty(value)}</Text>
    },
    {
      title: 'Mapped to purchases',
      key: 'purchaseProgress',
      width: 305,
      render: (_, row) => (
        <div style={{ minWidth: 210 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Text strong style={{ color: GREEN }}>
              {formatQty(row.purchaseMappedQty)} / {formatQty(row.requiredQty)}
            </Text>
            <Text type='secondary'>{percent(row.purchaseMappedQty, row.requiredQty)}%</Text>
          </div>
          <Progress
            percent={percent(row.purchaseMappedQty, row.requiredQty)}
            showInfo={false}
            size='small'
            strokeColor={GREEN}
          />
          <Space size={4} wrap>
            {row.erpPurchaseMappedQty > 0 && <Tag color='blue'>{formatQty(row.erpPurchaseMappedQty)} ERP</Tag>}
            {row.openingPurchaseMappedQty > 0 && <Tag color='success'>{formatQty(row.openingPurchaseMappedQty)} opening</Tag>}
            {row.historicalPurchaseMappedQty > 0 && <Tag color='purple'>{formatQty(row.historicalPurchaseMappedQty)} older</Tag>}
            {row.pricePendingPurchaseMappedQty > 0 && <Tag color='warning'>{formatQty(row.pricePendingPurchaseMappedQty)} price pending</Tag>}
          </Space>
        </div>
      )
    },
    {
      title: 'Tally Cash Sales evidence',
      key: 'tallySalesProgress',
      width: 305,
      render: (_, row) => (
        <div style={{ minWidth: 210 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Text strong style={{ color: BLUE }}>
              {formatQty(row.tallySalesMappedQty)} / {formatQty(row.requiredQty)}
            </Text>
            <Text type='secondary'>{percent(row.tallySalesMappedQty, row.requiredQty)}%</Text>
          </div>
          <Progress
            percent={percent(row.tallySalesMappedQty, row.requiredQty)}
            showInfo={false}
            size='small'
            strokeColor={BLUE}
          />
          <Space size={4} wrap>
            <Tag color='success'>{formatQty(row.exactTallySalesMappedQty)} exact</Tag>
            {row.fallbackTallySalesMappedQty > 0 && (
              <Tag color='warning'>{formatQty(row.fallbackTallySalesMappedQty)} fallback</Tag>
            )}
          </Space>
        </div>
      )
    },
    {
      title: 'Still required',
      dataIndex: 'purchaseRemainingQty',
      key: 'purchaseRemainingQty',
      width: 145,
      render: value => <Text strong type={value > 0 ? 'danger' : 'success'}>{formatQty(value)}</Text>
    },
    {
      title: 'Status',
      key: 'status',
      fixed: 'right',
      width: 145,
      render: (_, row) => (
        <MappingStatusTag mapped={row.purchaseMappedQty} required={row.requiredQty} />
      )
    }
  ], [])

  const renderRawDetail = rawGroup => (
    <div style={{ padding: '4px 6px 18px' }}>
      <Title level={5} style={{ margin: '4px 0 10px', color: INK }}>
        Production → raw quantity trail
      </Title>
      <Table
        rowKey='sourceKey'
        dataSource={rawGroup.productionRows}
        columns={productionColumns}
        pagination={false}
        size='small'
        scroll={{ x: 1300 }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', margin: '22px 0 10px' }}>
        <Title level={5} style={{ margin: 0, color: INK }}>
          Production raw → purchase supply — latest to oldest
        </Title>
        <Space wrap>
          <Tag color='blue'>Required {formatQty(rawGroup.requiredQty)}</Tag>
          <Tag color='success'>Deducted {formatQty(rawGroup.purchaseMappedQty)}</Tag>
          <Tag color={rawGroup.purchaseRemainingQty > 0 ? 'error' : 'default'}>
            Remaining {formatQty(rawGroup.purchaseRemainingQty)}
          </Tag>
          <Tag color='blue'>ERP {formatQty(rawGroup.erpPurchaseMappedQty)}</Tag>
          <Tag color='success'>Opening {formatQty(rawGroup.openingPurchaseMappedQty)}</Tag>
          <Tag color='purple'>Older {formatQty(rawGroup.historicalPurchaseMappedQty)}</Tag>
          <Tag color={rawGroup.pricePendingPurchaseMappedQty > 0 ? 'warning' : 'success'}>
            Price pending {formatQty(rawGroup.pricePendingPurchaseMappedQty)}
          </Tag>
        </Space>
      </div>
      {rawGroup.purchaseRemainingQty > 0 && (
        <Alert
          type='warning'
          showIcon
          message='This production raw group is not fully covered by genuine purchase supply'
          description={Object.entries(rawGroup.purchaseGapReasons || {})
            .map(([reason, quantity]) => `${reason.replaceAll('_', ' ')}: ${formatQty(quantity)}`)
            .join(' · ')}
          style={{ marginBottom: 10 }}
        />
      )}
      <Table
        rowKey='purchaseId'
        dataSource={rawGroup.purchaseRows}
        columns={purchaseColumns}
        pagination={false}
        size='small'
        scroll={{ x: 1850 }}
        locale={{ emptyText: <Empty description='No eligible ERP, opening, or older supplier purchase' /> }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', margin: '22px 0 10px' }}>
        <Title level={5} style={{ margin: 0, color: INK }}>
          Same-day Tally Cash Sales — raw-wheel issue evidence only
        </Title>
        <Space wrap>
          <Tag color='blue'>Required {formatQty(rawGroup.requiredQty)}</Tag>
          <Tag color='success'>Mapped {formatQty(rawGroup.tallySalesMappedQty)}</Tag>
          <Tag color={rawGroup.tallySalesRemainingQty > 0 ? 'error' : 'default'}>
            Remaining {formatQty(rawGroup.tallySalesRemainingQty)}
          </Tag>
        </Space>
      </div>
      {rawGroup.tallySalesRemainingQty > 0 && (
        <Alert
          type='warning'
          showIcon
          message='This raw group is not fully represented in same-day Tally Cash Sales'
          description={Object.entries(rawGroup.tallySalesGapReasons || {})
            .map(([reason, quantity]) => `${reason.replaceAll('_', ' ')}: ${formatQty(quantity)}`)
            .join(' · ')}
          style={{ marginBottom: 10 }}
        />
      )}
      <Table
        rowKey='salesLineId'
        dataSource={rawGroup.tallySalesRows}
        columns={tallySalesColumns}
        pagination={false}
        size='small'
        scroll={{ x: 1450 }}
        locale={{ emptyText: <Empty description='No same-day Tally Cash Sales raw issue' /> }}
      />
    </div>
  )

  const global = data?.globalSummary || {}
  const live = data?.liveSummary || {}

  return (
    <div style={{ padding: '0 4px 36px' }}>
      <div style={{ marginBottom: 8 }}>
        <PageTitle>Step 4 · Sales Source Coverage</PageTitle>
        <Text style={{ color: MUTED, fontSize: 14 }}>
          Audit exact ERP sales against purchase-like stock and recorded production output without changing the costing ledger.
        </Text>
      </div>

      <Tabs
        activeKey={workspaceTab}
        onChange={setWorkspaceTab}
        items={[
          { key: 'date-free', label: 'January–Now · Date-free production' },
          { key: 'lineage', label: 'Chronological production → raw → purchases' }
        ]}
        style={{ marginBottom: 14 }}
      />

      {workspaceTab === 'date-free' ? (
        <DateFreeCoveragePanel
          data={dateFreeData}
          loading={dateFreeLoading}
          onRefresh={loadDateFreeCoverage}
        />
      ) : (
        <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <Space wrap>
          <Select
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS}
            style={{ width: 190 }}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={createRun}>
            Refresh mapping
          </Button>
        </Space>
      </div>

      <Alert
        type='info'
        showIcon
        icon={<DatabaseOutlined />}
        message='Read-only local audit workspace'
        description={`Finished sales use exact persisted FIFO evidence first: production consumption, the intermediate stock layer actually issued to that production plan, the sale's own direct finished-product purchase consumption, then adjustment/sync consumption. An adjustment/sync cost is accepted only from its priced layer or the nearest earlier priced production output for the same product. Only the remaining quantity uses recorded production output batches with a maximum two-day timestamp grace. Residual FMBK gaps may then use still-available prior Inventory In latest to oldest. Raw purchase quantities are reserved once across the complete ${periodLabel} run, newest sale first. Cash Purchases and CASH PAGE are never supplier purchases. No database row is changed. Cost-source-backed coverage is ${formatQty(global.endToEndMappedPieces)} of ${formatQty(global.totalSalesPieces)}.`}
        style={{ marginBottom: 18 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: 12, marginBottom: 18 }}>
        <SummaryCard
          title={`${periodLabel} sales universe`}
          value={global.totalSalesPieces}
          suffix='Pcs'
          helper={`${Number(global.totalSalesEntries || 0).toLocaleString('en-IN')} entries · ${Number(global.totalProducts || 0).toLocaleString('en-IN')} concatenated products`}
          icon={<LinkOutlined />}
        />
        <SummaryCard
          title='Products evaluated'
          value={live.mappedProductGroups}
          suffix={`/ ${live.totalProductGroups || 0}`}
          helper={`${formatQty(live.selectedSalesPieces)} evaluated for production lineage`}
          color={ORANGE}
          icon={<ApartmentOutlined />}
        />
        <SummaryCard
          title='Sales source resolved'
          value={live.lineageMappedPieces}
          suffix='Pcs'
          helper={`${formatQty(live.productionMappedPieces)} production/raw · ${formatQty(live.productionInputMappedPieces)} exact production input · ${formatQty(live.directFinishedPurchaseMappedPieces)} direct purchase · ${formatQty(live.directFinishedAdjustmentMappedPieces)} adjustment/sync · ${formatQty(live.productionGapPieces)} unresolved`}
          color={GREEN}
          icon={<CheckCircleOutlined />}
        />
        <SummaryCard
          title='End-to-end cost-source backed'
          value={live.endToEndMappedPieces}
          suffix='Pcs'
          helper={`${formatQty(live.purchaseMappedPieces)} raw purchases · ${formatQty(live.productionInputPricedPieces)} priced production input · ${formatQty(live.directFinishedPurchaseMappedPieces)} direct purchases · ${formatQty(live.directFinishedAdjustmentPricedPieces)} priced adjustment/sync · ${formatQty(live.endToEndPendingPieces)} missing`}
          color={GREEN}
          icon={<ShoppingCartOutlined />}
        />
        <SummaryCard
          title='Exact adjustment / sync evidence'
          value={live.directFinishedAdjustmentMappedPieces}
          suffix='Pcs'
          helper={`${formatQty(live.directFinishedAdjustmentPricedPieces)} priced from safe prior production · ${formatQty(live.directFinishedAdjustmentPricePendingPieces)} price pending`}
          color={BLUE}
          icon={<DatabaseOutlined />}
        />
        <SummaryCard
          title='Tally Cash Sales evidence'
          value={live.tallySalesMappedPieces}
          suffix='Pcs'
          helper={`${formatQty(live.tallySalesPendingPieces)} lack a same-day Cash Sales raw issue · evidence only`}
          color={BLUE}
          icon={<DatabaseOutlined />}
        />
      </div>

      <Card style={{ borderColor: BORDER, marginBottom: 18 }} styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: INK }}>
              1. {periodLabel} sales concatenated by product
            </Title>
            <Text style={{ color: MUTED }}>
              One row combines every {periodLabel} ERP sale for that exact alloy product.
            </Text>
          </div>
          <Space wrap>
            <Input
              allowClear
              value={search}
              onChange={event => setSearch(event.target.value)}
              prefix={<SearchOutlined style={{ color: MUTED }} />}
              placeholder='Search product or ID'
              style={{ width: 280, maxWidth: '100%' }}
            />
            <Select
              value={productMappingFilter}
              onChange={setProductMappingFilter}
              options={MAPPING_FILTER_OPTIONS}
              style={{ width: 205 }}
            />
            <Tag color='blue'>{filteredProducts.length} of {(data?.products || []).length} products</Tag>
          </Space>
        </div>
        <Table
          rowKey='productId'
          loading={loading}
          dataSource={filteredProducts}
          columns={productColumns}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            pageSizeOptions: [25, 50, 100],
            showTotal: total => `${total} filtered products`
          }}
          scroll={{ x: 1510 }}
          expandable={{
            expandedRowRender: renderSaleLineageDetail,
            rowExpandable: row => (row.saleRows || []).length > 0
          }}
          locale={{ emptyText: <Empty description={`No ${periodLabel} alloy sales products match the current filters`} /> }}
        />
      </Card>

      <Card style={{ borderColor: BORDER }} styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: INK }}>
              2. Production raw requirements → 3. Genuine purchases
            </Title>
            <Text style={{ color: MUTED }}>
              Identical raw wheels combine into one row. Expand a row to inspect latest-to-oldest ERP Inventory In, opening, and older supplier-purchase deductions. Tally Cash Sales are shown separately as production evidence.
            </Text>
          </div>
          <Space wrap>
            <Input
              allowClear
              value={rawSearch}
              onChange={event => setRawSearch(event.target.value)}
              prefix={<SearchOutlined style={{ color: MUTED }} />}
              placeholder='Search raw or finished product'
              style={{ width: 280, maxWidth: '100%' }}
            />
            <Select
              value={purchaseMappingFilter}
              onChange={setPurchaseMappingFilter}
              options={MAPPING_FILTER_OPTIONS}
              style={{ width: 205 }}
            />
            <Tag color='blue'>{filteredRawGroups.length} of {live.visibleRawGroups || 0} raw groups</Tag>
            <Tag color='success'>{live.purchaseLinesLive || 0} purchase lines deducted</Tag>
          </Space>
        </div>

        {filteredRawGroups.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='No raw-wheel requirements match the current filters'
          />
        ) : (
          <Table
            rowKey='rawKey'
            dataSource={filteredRawGroups}
            columns={rawColumns}
            pagination={{
              pageSize: 25,
              showSizeChanger: true,
              pageSizeOptions: [25, 50, 100],
              showTotal: total => `${total} filtered raw groups`
            }}
            scroll={{ x: 1650 }}
            expandable={{
              expandedRowKeys: expandedRawKeys,
              onExpandedRowsChange: keys => setExpandedRawKeys(keys),
              expandedRowRender: renderRawDetail,
              rowExpandable: row => row.productionRows.length > 0
            }}
          />
        )}
      </Card>

      {live.productionGapPieces > 0 && (
        <Alert
          type='warning'
          showIcon
          icon={<WarningOutlined />}
          message={`${formatQty(live.productionGapPieces)} in the complete ${periodLabel} run still lack an eligible source`}
          description='Exact production, direct-purchase, and adjustment/sync FIFO evidence, eligible production output, and FMBK-only inferred Inventory In have all been tried. Unpriced adjustment/sync quantities are source-resolved and therefore are not included in this unresolved number.'
          style={{ marginTop: 18 }}
        />
      )}
        </>
      )}
    </div>
  )
}

export default JulySalesLineagePage
