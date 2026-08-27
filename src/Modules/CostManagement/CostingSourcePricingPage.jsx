import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import {
  CheckCircleOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useParams } from 'react-router-dom'

import PageTitle from '../../Core/Components/PageTitle'
import { client } from '../../Utils/axiosClient'
import { normalizeConsumedSourceRows } from '../../Utils/costingSourcePricing'

const { Text, Title } = Typography
const BORDER = '#e5e7eb'
const MUTED = '#667085'
const INK = '#182230'
const GREEN = '#159455'
const BLUE = '#175cd3'
const ORANGE = '#f26c2d'

export const COSTING_SOURCE_TABS = {
  'raw-purchases': {
    title: 'Raw Purchase Movements',
    shortTitle: 'Raw Purchases',
    sourceKinds: ['raw_purchase_movement'],
    description: 'Every genuine raw-wheel purchase movement without an approved exact FIFO cost, whether consumed by sales yet or not.'
  },
  'fmbk-inventory-in': {
    title: 'FMBK ERP Inventory In',
    shortTitle: 'FMBK Inventory In',
    sourceKinds: ['fmbk_inventory_in'],
    description: 'FMBK Inventory In entries actually consumed by January–now alloy sales.'
  },
  'erp-inventory-in': {
    title: 'Other ERP Inventory In',
    shortTitle: 'ERP Inventory In',
    sourceKinds: ['erp_inventory_in'],
    description: 'Non-FMBK ERP Inventory In entries actually consumed by January–now alloy sales.'
  },
  adjustments: {
    title: 'Adjustment / Sync Sources',
    shortTitle: 'Adjustments / Sync',
    sourceKinds: ['adjustment_as_purchase'],
    description: 'Positive adjustment and stock-sync entries used as purchase-like source quantity.'
  },
  restorations: {
    title: 'Residual Stock Restorations',
    shortTitle: 'Stock Restorations',
    sourceKinds: ['stock_restoration_as_purchase'],
    description: 'Residual quantities restored by entry deletion or correction and later consumed by sales.'
  },
  'opening-stock': {
    title: 'Step 1 Opening Sources',
    shortTitle: 'Opening Stock',
    sourceKinds: ['opening_stock_as_purchase'],
    description: 'Priced Step 1 opening layers actually consumed by January–now alloy sales.'
  },
  production: {
    title: 'Production Output Sources',
    shortTitle: 'Production',
    sourceKinds: ['production_plan_output', 'production_raw_input'],
    description: 'Production output consumed by sales together with the raw purchase and adjustment inputs that determine its material cost.'
  }
}

const PRICE_FILTERS = [
  { value: 'all', label: 'All price statuses' },
  { value: 'needs-price', label: 'Needs price entry' },
  { value: 'excel-ready', label: 'Excel price ready' },
  { value: 'priced', label: 'Priced' },
  { value: 'derived', label: 'Recorded / derived elsewhere' }
]

const formatQty = value => `${Number(value || 0).toLocaleString('en-IN')} Pcs`
const formatDate = value => value ? dayjs(value).format('DD MMM YYYY') : '—'
const formatCurrency = value => Number(value || 0).toLocaleString('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const exactExcelPrice = row => row?.excelPriceMatch?.status === 'exact_ready' &&
  row?.excelPriceMatch?.eligibleForPrefill

const hasExactExcelEvidence = row => ['exact_ready', 'already_claimed_same_movement']
  .includes(String(row?.excelPriceMatch?.status || ''))

const sourceKindTag = row => {
  if (row.sourceKind === 'raw_purchase_movement') return <Tag color='volcano'>Raw Purchase</Tag>
  if (row.sourceKind === 'fmbk_inventory_in') return <Tag color='blue'>FMBK Inventory In</Tag>
  if (row.sourceKind === 'erp_inventory_in') return <Tag color='cyan'>ERP Inventory In</Tag>
  if (row.sourceKind === 'adjustment_as_purchase') return <Tag color='purple'>Adjustment / Sync</Tag>
  if (row.sourceKind === 'stock_restoration_as_purchase') return <Tag color='gold'>Stock restoration</Tag>
  if (row.sourceKind === 'opening_stock_as_purchase') return <Tag color='success'>Step 1 opening</Tag>
  if (row.sourceKind === 'production_raw_input') return <Tag color='geekblue'>Raw input to production</Tag>
  if (row.sourceKind === 'production_plan_output') return <Tag color='blue'>Production output</Tag>
  return <Tag>{String(row.sourceKind || 'Source').replaceAll('_', ' ')}</Tag>
}

const sourceDisplayId = row => {
  if (row.movementId) return `Movement #${row.movementId}`
  if (row.productionId) return `Production plan #${row.productionId}`
  if (row.fifoLayerId) return `FIFO layer #${row.fifoLayerId}`
  return String(row.sourceId || 'Source')
}

const sourceProductName = row => row.sourceProductName || row.productName || 'Unknown alloy product'

const consumedQuantity = row => row.sourceKind === 'production_raw_input'
  ? Number(row.usedByProductionPieces || row.usedPieces || 0)
  : Number(row.usedPieces || 0)

const SummaryCard = ({ title, value, suffix, helper, color = INK, icon }) => (
  <Card style={{ borderColor: BORDER, height: '100%' }} styles={{ body: { padding: 17 } }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <Statistic
        title={<span style={{ color: MUTED, fontWeight: 700 }}>{title}</span>}
        value={Number(value || 0)}
        suffix={suffix}
        valueStyle={{ color, fontSize: 26, fontWeight: 750 }}
      />
      <div style={{ color, fontSize: 21 }}>{icon}</div>
    </div>
    <div style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>{helper}</div>
  </Card>
)

const CostingSourcePricingPage = () => {
  const { sourceTab } = useParams()
  const activeSourceTab = COSTING_SOURCE_TABS[sourceTab] ? sourceTab : 'fmbk-inventory-in'
  const tab = COSTING_SOURCE_TABS[activeSourceTab]
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [priceFilter, setPriceFilter] = useState('all')
  const [draftCosts, setDraftCosts] = useState({})
  const [savingKey, setSavingKey] = useState(null)

  const loadSources = useCallback(async () => {
    setLoading(true)
    try {
      const response = activeSourceTab === 'raw-purchases'
        ? await client.get('/cost-management/step4/raw-purchase-movements')
        : await client.get('/cost-management/step4/date-free-production-coverage/sources', {
            params: { startDate: '2026-01-01', sourceTab: activeSourceTab }
          })
      setData(response.data)
    } catch (error) {
      console.error('Failed to load consumed costing sources:', error)
      message.error(error.response?.data?.message || 'Failed to load consumed source entries')
    } finally {
      setLoading(false)
    }
  }, [activeSourceTab])

  useEffect(() => {
    loadSources()
  }, [loadSources])

  useEffect(() => {
    setSearch('')
    setPriceFilter('all')
  }, [sourceTab])

  const allRows = useMemo(() => normalizeConsumedSourceRows(data), [data])
  const tabRows = useMemo(
    () => allRows.filter(row => row.tabKey === activeSourceTab),
    [activeSourceTab, allRows]
  )
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return tabRows.filter(row => {
      const matchesSearch = !needle || [
        sourceProductName(row),
        row.sourceId,
        row.movementId,
        row.referenceId,
        row.immediateRemovalMovementId,
        row.immediateRemovalNotes,
        row.productionId,
        row.entrySupplier,
        row.entryInvoiceNo,
        row.excelPriceMatch?.invoiceNo,
        ...(row.saleEntryIds || []),
        ...(row.productionIds || [])
      ].some(value => String(value ?? '').toLowerCase().includes(needle))
      const isExcelReady = exactExcelPrice(row) && !row.pricingReady
      const matchesPrice = priceFilter === 'all' ||
        (priceFilter === 'needs-price' && row.pricingEditable && !row.pricingReady) ||
        (priceFilter === 'excel-ready' && isExcelReady) ||
        (priceFilter === 'priced' && row.pricingReady) ||
        (priceFilter === 'derived' && !row.pricingEditable)
      return matchesSearch && matchesPrice
    })
  }, [priceFilter, search, tabRows])

  const priceValue = row => {
    if (Object.prototype.hasOwnProperty.call(draftCosts, row.workspaceKey)) {
      return draftCosts[row.workspaceKey]
    }
    if (exactExcelPrice(row) && !row.pricingReady) {
      return row.excelPriceMatch.gstInclusiveUnitPrice
    }
    return row.unitCost ?? null
  }

  const approvePrice = async row => {
    const unitCost = Number(priceValue(row))
    if (!(unitCost > 0)) {
      message.warning('Enter a positive GST-inclusive material cost per piece')
      return
    }
    setSavingKey(row.workspaceKey)
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
        delete next[row.workspaceKey]
        return next
      })
      await loadSources()
    } catch (error) {
      console.error('Failed to approve consumed source price:', error)
      message.error(error.response?.data?.message || 'Failed to approve source price')
    } finally {
      setSavingKey(null)
    }
  }

  const priceAction = row => {
    if (row.pricingEditable) {
      return (
        <Space align='start' wrap>
          <InputNumber
            min={0.01}
            max={1000000}
            precision={2}
            prefix='₹'
            value={priceValue(row)}
            onChange={value => setDraftCosts(current => ({ ...current, [row.workspaceKey]: value }))}
            placeholder='GST-inclusive / Pc'
            style={{ width: 180 }}
          />
          <Button
            type='primary'
            loading={savingKey === row.workspaceKey}
            disabled={savingKey != null && savingKey !== row.workspaceKey}
            onClick={() => approvePrice(row)}
          >
            {row.pricingReady ? 'Update price' : exactExcelPrice(row) ? 'Approve Excel price' : 'Approve price'}
          </Button>
          <Text type='secondary' style={{ width: '100%', fontSize: 12 }}>
            Complete source-entry cost per piece; not only the quantity consumed here.
          </Text>
        </Space>
      )
    }
    if (row.pricingReady && Number(row.unitCost) > 0) {
      const recordedPurchasePrice = row.pricingStatus === 'recorded_exact_movement_cost'
      return (
        <div>
          <Text strong style={{ color: GREEN }}>{formatCurrency(row.unitCost)} / Pc</Text>
          <div><Tag color='success'>{recordedPurchasePrice ? 'Recorded purchase price' : 'Derived price ready'}</Tag></div>
        </div>
      )
    }
    if (row.sourceKind === 'opening_stock_as_purchase') {
      return <Button type='link' href='/costing/step-1-opening-stock' style={{ padding: 0 }}>Review price in Step 1</Button>
    }
    if (row.sourceKind === 'production_plan_output') {
      return (
        <div>
          <Tag color='warning'>Raw-input price pending</Tag>
          <div><Button type='link' href='/costing/step-3-production-costing' style={{ padding: 0 }}>Open Step 3</Button></div>
        </div>
      )
    }
    return (
      <div>
        <Tag color='warning'>Originating cost required</Tag>
        <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
          A restoration carries its original layer cost; it is not a new purchase.
        </div>
      </div>
    )
  }

  const columns = [
    {
      title: 'Source entry',
      key: 'source',
      width: 300,
      render: (_, row) => (
        <div>
          <Space size={[4, 4]} wrap>{sourceKindTag(row)}{row.trackedByFifo === false && <Tag color='warning'>No FIFO layer</Tag>}</Space>
          <div style={{ marginTop: 6 }}><Text strong style={{ color: INK }}>{sourceDisplayId(row)}</Text></div>
          {row.referenceId != null && <div style={{ color: MUTED, fontSize: 12 }}>ERP entry #{row.referenceId}</div>}
          {(row.entrySupplier || row.entryInvoiceNo) && (
            <div style={{ color: MUTED, fontSize: 12 }}>{[row.entrySupplier, row.entryInvoiceNo].filter(Boolean).join(' · ')}</div>
          )}
        </div>
      )
    },
    {
      title: 'Source date',
      dataIndex: 'sourceAt',
      key: 'sourceAt',
      width: 135,
      render: formatDate
    },
    {
      title: 'Alloy source product',
      key: 'product',
      width: 365,
      render: (_, row) => (
        <div>
          <Text strong style={{ color: INK, fontSize: 15 }}>{sourceProductName(row)}</Text>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            Product #{row.sourceProductId || row.pricingProductId || row.productId}
          </div>
          {row.upstreamProductionInput && row.targetProductNames.length > 0 && (
            <div style={{ color: BLUE, fontSize: 12, marginTop: 4 }}>
              Supplies {row.targetProductNames.slice(0, 2).join(' · ')}
              {row.targetProductNames.length > 2 ? ` +${row.targetProductNames.length - 2}` : ''}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Source quantity',
      key: 'sourceQuantity',
      width: 235,
      render: (_, row) => {
        const sourceQuantity = row.entryNetQuantity ?? row.entryQuantity ??
          row.completedQuantity ?? consumedQuantity(row)
        const removedQuantity = Number(row.entryRemovedQuantity || 0)
        const purchaseWasDeleted = row.entryRemovalReason === 'purchase_entry_deleted'
        return (
          <div>
            <Text strong>{formatQty(sourceQuantity)}</Text>
            {removedQuantity > 0 ? (
              <>
                <div style={{ color: ORANGE, fontSize: 12 }}>
                  {formatQty(row.entryOriginalQuantity)} in − {formatQty(removedQuantity)}{' '}
                  {purchaseWasDeleted ? 'purchase deletion' : 'immediate adjustment'}
                </div>
                <div style={{ color: MUTED, fontSize: 12 }}>
                  {purchaseWasDeleted ? 'Deletion' : 'Adjustment'} movement #{row.immediateRemovalMovementId}
                </div>
                {row.immediateRemovalNotes && (
                  <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
                    {row.immediateRemovalNotes}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: MUTED, fontSize: 12 }}>
                {row.entryQuantity != null
                  ? 'Complete ERP entry'
                  : row.completedQuantity != null ? 'Completed output' : 'Visible source quantity'}
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: activeSourceTab === 'raw-purchases' ? 'FIFO position' : 'Quantity consumed',
      key: 'consumed',
      width: 190,
      render: (_, row) => activeSourceTab === 'raw-purchases'
        ? (
            <div>
              <Text strong style={{ color: BLUE }}>{formatQty(row.fifoQtyRemaining)}</Text>
              <div style={{ color: MUTED, fontSize: 12 }}>Currently remaining in FIFO</div>
              <div style={{ color: MUTED, fontSize: 12 }}>{formatQty(row.fifoConsumedQuantity)} already consumed</div>
            </div>
          )
        : (
            <div>
              <Text strong style={{ color: BLUE }}>{formatQty(consumedQuantity(row))}</Text>
              <div style={{ color: MUTED, fontSize: 12 }}>
                {row.upstreamProductionInput ? 'Issued to production' : 'Used by sales'}
              </div>
              {row.upstreamProductionInput && row.linkedSalesPieces > 0 && (
                <div style={{ color: MUTED, fontSize: 12 }}>{formatQty(row.linkedSalesPieces)} finished sales linked</div>
              )}
            </div>
          )
    },
    {
      title: 'Linked records',
      key: 'links',
      width: 220,
      render: (_, row) => (
        <div style={{ color: MUTED, fontSize: 12 }}>
          {(row.productionIds || []).length > 0 && <div>Plans {(row.productionIds || []).slice(0, 5).map(id => `#${id}`).join(', ')}</div>}
          {(row.saleEntryIds || []).length > 0 && <div>Sales {(row.saleEntryIds || []).slice(0, 5).map(id => `#${id}`).join(', ')}</div>}
          {(row.saleEntryIds || []).length > 5 && <div>+{row.saleEntryIds.length - 5} more sales</div>}
        </div>
      )
    },
    {
      title: 'Price evidence',
      key: 'evidence',
      width: 275,
      render: (_, row) => {
        const match = row.excelPriceMatch
        if (hasExactExcelEvidence(row)) {
          return (
            <div>
              <Tag color='success'>Exact Excel line</Tag>
              <div style={{ color: INK, fontSize: 12, marginTop: 4 }}>{match.supplier || 'Excel purchase'} · {match.invoiceNo || '—'}</div>
              <div style={{ color: MUTED, fontSize: 12 }}>{formatQty(match.purchaseQuantity)} · {formatCurrency(match.gstInclusiveUnitPrice)} / Pc incl. GST</div>
            </div>
          )
        }
        if (String(match?.status || '').startsWith('review_')) {
          return <Tag color='warning'>Excel match needs review</Tag>
        }
        if (row.pricingReady) return <Tag color='success'>{String(row.pricingStatus || 'priced').replaceAll('_', ' ')}</Tag>
        return row.pricingEditable ? <Tag color='error'>Manual price required</Tag> : <Tag>Derived source</Tag>
      }
    },
    {
      title: 'GST-inclusive material cost / Pc',
      key: 'price',
      width: 365,
      fixed: 'right',
      render: (_, row) => priceAction(row)
    }
  ]

  const totalConsumed = tabRows.reduce((sum, row) => sum + (
    activeSourceTab === 'raw-purchases'
      ? Number(row.entryNetQuantity || 0)
      : consumedQuantity(row)
  ), 0)
  const pricedRows = tabRows.filter(row => row.pricingReady).length
  const editablePendingRows = tabRows.filter(row => row.pricingEditable && !row.pricingReady).length
  const derivedRows = tabRows.filter(row => !row.pricingEditable).length

  return (
    <div style={{ padding: '0 4px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
        <div>
          <PageTitle>Source Pricing · {tab.title}</PageTitle>
          <Text style={{ color: MUTED }}>{tab.description}</Text>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={loadSources}>Refresh sources</Button>
      </div>

      <Alert
        type={activeSourceTab === 'restorations' ? 'warning' : 'info'}
        showIcon
        message={activeSourceTab === 'raw-purchases'
          ? 'One row represents one complete raw purchase movement'
          : 'One row represents one complete source entry'}
        description={activeSourceTab === 'raw-purchases'
          ? 'This queue includes every raw purchase movement still missing an approved exact cost, not only sources already consumed by sales. Enter the GST-inclusive material cost per piece for the complete net receipt. Rows marked Recorded purchase price already have an authoritative vendor cost and must not be priced again.'
          : activeSourceTab === 'production'
          ? 'Production output cost remains derived from its raw material. The raw purchase and adjustment inputs are listed in this same tab with direct price controls.'
          : activeSourceTab === 'restorations'
            ? 'A stock restoration is not a new acquisition. It must carry its originating layer cost; pricing it as a fresh purchase would duplicate cost.'
            : 'Enter or update the GST-inclusive material cost per piece for the complete source entry. The consumed quantity only shows how much of that source January–now sales used.'}
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 16 }}>
        <SummaryCard title='Listed source entries' value={tabRows.length} helper={`${tab.shortTitle} consumed-source rows`} icon={<DatabaseOutlined />} />
        <SummaryCard
          title={activeSourceTab === 'raw-purchases' ? 'Net purchase quantity' : 'Quantity consumed'}
          value={totalConsumed}
          suffix='Pcs'
          helper={activeSourceTab === 'raw-purchases'
            ? 'After immediate deletions and stock-count corrections'
            : 'Used by sales or issued to linked production'}
          color={BLUE}
          icon={<ShoppingCartOutlined />}
        />
        <SummaryCard title='Price ready' value={pricedRows} helper={`${tabRows.length ? Math.round(pricedRows / tabRows.length * 100) : 0}% of listed source entries`} color={GREEN} icon={<CheckCircleOutlined />} />
        <SummaryCard title='Direct price required' value={editablePendingRows} helper={`${derivedRows} derived or governed elsewhere`} color={editablePendingRows > 0 ? ORANGE : GREEN} icon={<WarningOutlined />} />
      </div>

      <Card style={{ borderColor: BORDER }} styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: INK }}>{tab.title} source entries</Title>
            <Text style={{ color: MUTED }}>Latest source date first. Prices are approved against the immutable source entry.</Text>
          </div>
          <Space wrap>
            <Input
              allowClear
              value={search}
              onChange={event => setSearch(event.target.value)}
              prefix={<SearchOutlined style={{ color: MUTED }} />}
              placeholder='Product, movement, plan, sale or invoice'
              style={{ width: 315, maxWidth: '100%' }}
            />
            <Select value={priceFilter} onChange={setPriceFilter} options={PRICE_FILTERS} style={{ width: 205 }} />
            <Tag color='blue'>{filteredRows.length} of {tabRows.length}</Tag>
          </Space>
        </div>
        <Table
          rowKey='workspaceKey'
          loading={loading}
          dataSource={filteredRows}
          columns={columns}
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: [25, 50, 100, 200] }}
          scroll={{ x: 2050 }}
          locale={{ emptyText: <Empty description={`No consumed ${tab.shortTitle} source entries`} /> }}
        />
      </Card>
    </div>
  )
}

export default CostingSourcePricingPage
