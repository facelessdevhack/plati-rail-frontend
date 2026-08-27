import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  DatePicker,
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
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  DollarOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'

import PageTitle from '../../Core/Components/PageTitle'
import { client } from '../../Utils/axiosClient'

const { Text, Title } = Typography
const BORDER = '#e5e7eb'
const MUTED = '#667085'
const INK = '#182230'
const GREEN = '#159455'
const ORANGE = '#f26c2d'
const RED = '#d92d20'
const BLUE = '#175cd3'

const formatQty = value => `${Number(value || 0).toLocaleString('en-IN')} Pcs`
const formatDateTime = value => value ? dayjs(value).format('DD MMM YYYY · HH:mm') : '—'
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

const priceStatusTag = row => {
  if (row.pricingReady) {
    return <Tag color='success'>{String(row.pricingStatus || 'priced').replaceAll('_', ' ')}</Tag>
  }
  if (exactExcelPrice(row)) return <Tag color='success'>Excel price ready</Tag>
  if (String(row.excelPriceMatch?.status || '').startsWith('review_')) {
    return <Tag color='warning'>Excel review required</Tag>
  }
  if (row.pricingEditable) return <Tag color='error'>Price required</Tag>
  return <Tag>Read only</Tag>
}

const SummaryCard = ({ title, value, helper, color = INK, icon }) => (
  <Card style={{ borderColor: BORDER, height: '100%' }} styles={{ body: { padding: 18 } }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <Statistic
        title={<span style={{ color: MUTED, fontWeight: 700 }}>{title}</span>}
        value={Number(value || 0)}
        valueStyle={{ color, fontSize: 26, fontWeight: 750 }}
      />
      <div style={{ color, fontSize: 22 }}>{icon}</div>
    </div>
    <div style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>{helper}</div>
  </Card>
)

const ProductMovementPricingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialProductId = Number(searchParams.get('productId')) || null
  const [productIdInput, setProductIdInput] = useState(initialProductId)
  const [activeProductId, setActiveProductId] = useState(initialProductId)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [movementType, setMovementType] = useState('all')
  const [referenceType, setReferenceType] = useState('all')
  const [priceStatus, setPriceStatus] = useState('all')
  const [sort, setSort] = useState('desc')
  const [dateRange, setDateRange] = useState(null)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [draftCosts, setDraftCosts] = useState({})
  const [savingMovementId, setSavingMovementId] = useState(null)

  const loadMovements = useCallback(async () => {
    if (!(Number(activeProductId) > 0)) return
    setLoading(true)
    try {
      const response = await client.get(
        `/cost-management/step4/product-movements/${Number(activeProductId)}`,
        {
          params: {
            page,
            limit,
            movementType,
            referenceType,
            priceStatus,
            search: appliedSearch,
            sort,
            startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
            endDate: dateRange?.[1]?.format('YYYY-MM-DD')
          }
        }
      )
      setData(response.data)
    } catch (error) {
      console.error('Failed to load product movements:', error)
      setData(null)
      message.error(error.response?.data?.message || 'Failed to load product movements')
    } finally {
      setLoading(false)
    }
  }, [activeProductId, appliedSearch, dateRange, limit, movementType, page, priceStatus, referenceType, sort])

  useEffect(() => {
    loadMovements()
  }, [loadMovements])

  const selectProduct = () => {
    const productId = Number(productIdInput)
    if (!Number.isInteger(productId) || productId <= 0) {
      message.warning('Enter a valid alloy product ID')
      return
    }
    setPage(1)
    setActiveProductId(productId)
    setSearchParams({ productId: String(productId) })
  }

  const resetFilters = () => {
    setPage(1)
    setMovementType('all')
    setReferenceType('all')
    setPriceStatus('all')
    setSort('desc')
    setDateRange(null)
    setSearch('')
    setAppliedSearch('')
  }

  const sourcePriceValue = useCallback(row => {
    if (Object.prototype.hasOwnProperty.call(draftCosts, row.movementId)) {
      return draftCosts[row.movementId]
    }
    if (exactExcelPrice(row) && !row.pricingReady) {
      return row.excelPriceMatch.gstInclusiveUnitPrice
    }
    return row.unitCost ?? null
  }, [draftCosts])

  const approvePrice = useCallback(async row => {
    const unitCost = Number(sourcePriceValue(row))
    if (!(unitCost > 0)) {
      message.warning('Enter a positive GST-inclusive material cost per piece')
      return
    }
    setSavingMovementId(row.movementId)
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
      message.success(response.data?.message || 'Movement price approved')
      setDraftCosts(current => {
        const next = { ...current }
        delete next[row.movementId]
        return next
      })
      await loadMovements()
    } catch (error) {
      console.error('Failed to approve movement price:', error)
      message.error(error.response?.data?.message || 'Failed to approve movement price')
    } finally {
      setSavingMovementId(null)
    }
  }, [loadMovements, sourcePriceValue])

  const movementTypeOptions = useMemo(() => [
    { value: 'all', label: 'All movement types' },
    ...(data?.filters?.movementTypes || []).map(value => ({
      value,
      label: String(value).replaceAll('_', ' ')
    }))
  ], [data?.filters?.movementTypes])

  const referenceTypeOptions = useMemo(() => [
    { value: 'all', label: 'All reference types' },
    ...(data?.filters?.referenceTypes || []).map(value => ({
      value,
      label: String(value).replaceAll('_', ' ')
    }))
  ], [data?.filters?.referenceTypes])

  const columns = useMemo(() => [
    {
      title: 'Movement',
      key: 'movement',
      width: 185,
      render: (_, row) => (
        <div>
          <Text strong style={{ color: INK, fontSize: 15 }}>#{row.movementId}</Text>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            {formatDateTime(row.movementAt)}
          </div>
          <div style={{ color: MUTED, fontSize: 11 }}>Inventory #{row.inventoryId}</div>
        </div>
      )
    },
    {
      title: 'Type / quantity',
      key: 'quantity',
      width: 165,
      render: (_, row) => {
        const inbound = row.movementType === 'in'
        const outbound = row.movementType === 'out'
        return (
          <div>
            <Tag color={inbound ? 'success' : outbound ? 'error' : 'default'}>
              {inbound ? <ArrowDownOutlined /> : outbound ? <ArrowUpOutlined /> : null}{' '}
              {String(row.movementType || 'unknown').replaceAll('_', ' ')}
            </Tag>
            <div style={{ marginTop: 6 }}>
              <Text strong style={{ color: inbound ? GREEN : outbound ? RED : INK, fontSize: 16 }}>
                {inbound ? '+' : outbound ? '−' : ''}{formatQty(row.quantityChange)}
              </Text>
            </div>
          </div>
        )
      }
    },
    {
      title: 'Stock change',
      key: 'stock',
      width: 155,
      render: (_, row) => (
        <div>
          <Text>{formatQty(row.previousQuantity)}</Text>
          <Text type='secondary'> → </Text>
          <Text strong>{formatQty(row.newQuantity)}</Text>
        </div>
      )
    },
    {
      title: 'ERP reference',
      key: 'reference',
      width: 220,
      render: (_, row) => (
        <div>
          <Tag color={row.pricingEditable ? 'blue' : 'default'}>
            {String(row.referenceType || 'No reference').replaceAll('_', ' ')}
          </Tag>
          {row.referenceId != null && (
            <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
              Reference #{row.referenceId}
            </div>
          )}
          {(row.entrySupplier || row.entryInvoiceNo) && (
            <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
              {[row.entrySupplier, row.entryInvoiceNo].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Movement details',
      key: 'details',
      width: 260,
      render: (_, row) => (
        <div>
          {row.batchNumber && <div><Text strong>Batch:</Text> {row.batchNumber}</div>}
          {row.sourceTable && <div style={{ color: MUTED, fontSize: 12 }}>Source: {row.sourceTable}</div>}
          {row.notes ? (
            <Text
              type='secondary'
              ellipsis={{ tooltip: row.notes }}
              style={{ display: 'block', maxWidth: 235, marginTop: 4 }}
            >
              {row.notes}
            </Text>
          ) : <Text type='secondary'>No notes</Text>}
        </div>
      )
    },
    {
      title: 'FIFO / recorded cost',
      key: 'fifo',
      width: 255,
      render: (_, row) => (
        <div>
          {(row.fifoLayers || []).length > 0 ? (row.fifoLayers || []).map(layer => (
            <div key={layer.layerId} style={{ marginBottom: 5 }}>
              <Text strong>Layer #{layer.layerId}</Text>
              <div style={{ color: MUTED, fontSize: 12 }}>
                {formatQty(layer.qtyIn)} in · {formatQty(layer.qtyRemaining)} left
              </div>
              {layer.unitCost > 0 && (
                <div style={{ color: layer.costClassification === 'exact' ? GREEN : ORANGE, fontSize: 12 }}>
                  {formatCurrency(layer.unitCost)} / Pc · {layer.costClassification}
                </div>
              )}
            </div>
          )) : (
            <Text type='secondary'>No purchase/adjustment FIFO layer</Text>
          )}
          {row.movementCostPerUnit > 0 && (
            <div style={{ color: MUTED, fontSize: 12 }}>
              Movement recorded {formatCurrency(row.movementCostPerUnit)} / Pc
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Excel evidence (±2 days)',
      key: 'excel',
      width: 360,
      render: (_, row) => {
        const match = row.excelPriceMatch
        if (hasExactExcelEvidence(row)) {
          return (
            <div style={{ borderLeft: `3px solid ${GREEN}`, paddingLeft: 9 }}>
              <Tag color='success'>
                {match.status === 'already_claimed_same_movement'
                  ? 'Exact evidence approved'
                  : 'Exact product + quantity + date'}
              </Tag>
              <div style={{ marginTop: 5 }}>
                <Text strong>{match.supplier || 'Excel purchase'}</Text>
                <div style={{ color: MUTED, fontSize: 12 }}>
                  {match.invoiceNo || 'No invoice'} · {dayjs(match.evidenceDate).format('DD MMM YYYY')} · {formatQty(match.purchaseQuantity)}
                </div>
                <div style={{ color: MUTED, fontSize: 12 }}>
                  Taxable {formatCurrency(match.taxableUnitPrice)} + GST {formatCurrency(match.gstAmountPerUnit)}
                </div>
                <Text strong style={{ color: GREEN }}>
                  {formatCurrency(match.gstInclusiveUnitPrice)} / Pc inclusive
                </Text>
              </div>
            </div>
          )
        }
        if (String(match?.status || '').startsWith('review_')) {
          return (
            <div style={{ borderLeft: `3px solid ${ORANGE}`, paddingLeft: 9 }}>
              <Tag color='warning'>Review match</Tag>
              <div style={{ color: INK, fontSize: 12, marginTop: 5 }}>{match.reviewReason}</div>
              {match.gstInclusiveUnitPrice > 0 && (
                <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
                  Reference {formatCurrency(match.gstInclusiveUnitPrice)} / Pc · {formatQty(match.purchaseQuantity)}
                </div>
              )}
            </div>
          )
        }
        return row.pricingEditable ? (
          <div>
            <Tag>No exact Excel match</Tag>
            <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
              Manual GST-inclusive pricing is available.
            </div>
          </div>
        ) : <Text type='secondary'>Not an editable inbound source</Text>
      }
    },
    {
      title: 'Material cost / Pc',
      key: 'pricing',
      width: 335,
      fixed: 'right',
      render: (_, row) => row.pricingEditable ? (
        <div>
          <Space align='start' wrap>
            <InputNumber
              min={0.01}
              max={1000000}
              precision={2}
              prefix='₹'
              value={sourcePriceValue(row)}
              onChange={value => setDraftCosts(current => ({
                ...current,
                [row.movementId]: value
              }))}
              placeholder='GST-inclusive / Pc'
              style={{ width: 180 }}
            />
            <Button
              type='primary'
              loading={savingMovementId === row.movementId}
              disabled={savingMovementId != null && savingMovementId !== row.movementId}
              onClick={() => approvePrice(row)}
            >
              {row.pricingReady ? 'Update price' : exactExcelPrice(row) ? 'Approve Excel price' : 'Approve price'}
            </Button>
          </Space>
          <div style={{ marginTop: 6 }}>{priceStatusTag(row)}</div>
          {exactExcelPrice(row) && !row.pricingReady && (
            <div style={{ color: GREEN, fontSize: 12, marginTop: 4 }}>
              Prefilled from exact Excel evidence; editable before approval.
            </div>
          )}
          {row.pricingStatus === 'estimated_cost_not_exact' && (
            <div style={{ color: ORANGE, fontSize: 12, marginTop: 4 }}>
              Current FIFO estimate: {formatCurrency(row.unitCost)} / Pc
            </div>
          )}
        </div>
      ) : row.pricingReady ? (
        <div>
          <Text strong style={{ color: GREEN }}>{formatCurrency(row.unitCost)} / Pc</Text>
          <div style={{ marginTop: 4 }}>{priceStatusTag(row)}</div>
        </div>
      ) : (
        <div>
          {priceStatusTag(row)}
          <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
            Only inbound purchase/adjustment sources can be priced.
          </div>
        </div>
      )
    }
  ], [approvePrice, savingMovementId, sourcePriceValue])

  const summary = data?.summary || {}
  const loadedProduct = data?.product
  const filteredTotal = Number(data?.pagination?.total || 0)
  const priceCompletion = summary.eligiblePricingMovements > 0
    ? Math.round(
      ((summary.eligiblePricingMovements - summary.unpricedEditableMovements) / summary.eligiblePricingMovements) * 10000
    ) / 100
    : 0

  return (
    <div style={{ padding: '0 0 28px' }}>
      <PageTitle>Product Movement Pricing</PageTitle>

      <Card style={{ borderColor: BORDER, marginBottom: 18 }} styles={{ body: { padding: 18 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <Title level={4} style={{ color: INK, margin: '0 0 5px' }}>
              Load every inventory movement for one alloy product
            </Title>
            <Text style={{ color: MUTED }}>
              Enter the exact ERP product ID. Pricing is staged only for eligible inbound purchase or adjustment movements.
            </Text>
          </div>
          <Space.Compact>
            <InputNumber
              min={1}
              precision={0}
              value={productIdInput}
              onChange={setProductIdInput}
              onPressEnter={selectProduct}
              placeholder='ERP product ID'
              style={{ width: 210 }}
            />
            <Button type='primary' icon={<SearchOutlined />} onClick={selectProduct} loading={loading}>
              Load movements
            </Button>
          </Space.Compact>
        </div>
      </Card>

      {!activeProductId ? (
        <Card style={{ borderColor: BORDER }}>
          <Empty
            image={<DatabaseOutlined style={{ fontSize: 56, color: '#98a2b3' }} />}
            description='Enter an alloy product ID to open its complete movement ledger'
          />
        </Card>
      ) : (
        <>
          {loadedProduct && (
            <Alert
              type='info'
              showIcon
              message={`${loadedProduct.productName} · Product #${loadedProduct.productId}`}
              description='Approvals store a GST-inclusive material cost against the durable ERP source. Existing FIFO layers and sales are not replayed or changed from this screen.'
              style={{ marginBottom: 18 }}
              action={<Button icon={<ReloadOutlined />} onClick={loadMovements} loading={loading}>Refresh</Button>}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 18 }}>
            <SummaryCard
              title='All movements'
              value={summary.totalMovements}
              helper={`${Number(summary.inboundMovements || 0).toLocaleString('en-IN')} in · ${Number(summary.outboundMovements || 0).toLocaleString('en-IN')} out · ${Number(summary.otherMovements || 0).toLocaleString('en-IN')} other`}
              icon={<DatabaseOutlined />}
            />
            <SummaryCard
              title='Eligible pricing sources'
              value={summary.eligiblePricingMovements}
              helper='Inbound purchase, purchase entry, adjustment or sync'
              color={BLUE}
              icon={<DollarOutlined />}
            />
            <SummaryCard
              title='Still need exact price'
              value={summary.unpricedEditableMovements}
              helper={`${priceCompletion.toFixed(2)}% of editable sources priced`}
              color={summary.unpricedEditableMovements > 0 ? ORANGE : GREEN}
              icon={<WarningOutlined />}
            />
            <SummaryCard
              title='Excel prices ready'
              value={summary.excelPriceReadyMovements}
              helper={`${Number(summary.excelReviewMovements || 0).toLocaleString('en-IN')} additional Excel matches need review`}
              color={GREEN}
              icon={<CheckCircleOutlined />}
            />
          </div>

          <Card style={{ borderColor: BORDER }} styles={{ body: { padding: 16 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 14 }}>
              <div>
                <Title level={4} style={{ color: INK, margin: 0 }}>Movement ledger</Title>
                <Text style={{ color: MUTED }}>
                  {filteredTotal.toLocaleString('en-IN')} movements match the current filters.
                </Text>
              </div>
              <Space size={[8, 8]} wrap>
                <Input.Search
                  allowClear
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  onSearch={value => {
                    setPage(1)
                    setAppliedSearch(value.trim())
                  }}
                  placeholder='Movement, reference, invoice, notes'
                  style={{ width: 290 }}
                />
                <Select
                  value={movementType}
                  options={movementTypeOptions}
                  onChange={value => { setPage(1); setMovementType(value) }}
                  style={{ width: 180 }}
                />
                <Select
                  value={referenceType}
                  options={referenceTypeOptions}
                  onChange={value => { setPage(1); setReferenceType(value) }}
                  style={{ width: 205 }}
                />
                <Select
                  value={priceStatus}
                  onChange={value => { setPage(1); setPriceStatus(value) }}
                  options={[
                    { value: 'all', label: 'All price statuses' },
                    { value: 'excel-ready', label: 'Exact Excel price ready' },
                    { value: 'excel-review', label: 'Excel review required' },
                    { value: 'unpriced', label: 'Editable and unpriced' },
                    { value: 'priced', label: 'Priced movements' },
                    { value: 'editable', label: 'All editable movements' },
                    { value: 'noneditable', label: 'Read-only movements' }
                  ]}
                  style={{ width: 210 }}
                />
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={value => { setPage(1); setDateRange(value) }}
                  allowClear
                />
                <Select
                  value={sort}
                  onChange={value => { setPage(1); setSort(value) }}
                  options={[
                    { value: 'desc', label: 'Latest first' },
                    { value: 'asc', label: 'Oldest first' }
                  ]}
                  style={{ width: 140 }}
                />
                <Button icon={<FilterOutlined />} onClick={resetFilters}>Reset filters</Button>
              </Space>
            </div>

            <Alert
              type='warning'
              showIcon
              message='Pricing changes are staged, not replayed'
              description='Exact Excel product + full movement quantity within ±2 days is prefilled. Review matches remain reference-only. Manual pricing is allowed when no exact Excel evidence exists.'
              style={{ marginBottom: 12 }}
            />

            <Table
              rowKey='movementId'
              loading={loading}
              dataSource={data?.movements || []}
              columns={columns}
              scroll={{ x: 1940 }}
              pagination={{
                current: data?.pagination?.page || page,
                pageSize: data?.pagination?.limit || limit,
                total: filteredTotal,
                showSizeChanger: true,
                pageSizeOptions: [25, 50, 100, 200],
                showTotal: total => `${total.toLocaleString('en-IN')} movements`,
                onChange: (nextPage, nextLimit) => {
                  setPage(nextLimit !== limit ? 1 : nextPage)
                  setLimit(nextLimit)
                }
              }}
              locale={{ emptyText: <Empty description='No movements match these filters' /> }}
            />
          </Card>
        </>
      )}
    </div>
  )
}

export default ProductMovementPricingPage
