import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import {
  ClearOutlined,
  CodeOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

import PageTitle from '../../Core/Components/PageTitle'
import { client } from '../../Utils/axiosClient'

const { Text, Title } = Typography
const { RangePicker } = DatePicker

const BORDER = '#e5e7eb'
const MUTED = '#667085'
const INK = '#182230'
const BLUE = '#175cd3'
const GREEN = '#159455'
const ORANGE = '#f26c2d'

const EMPTY_FILTERS = {
  search: '',
  product: '',
  ledger: '',
  voucherType: 'all',
  cashStatus: 'all',
  costingStatus: 'all',
  amountMode: 'all',
  sourceFile: 'all',
  sortOrder: 'desc',
  dateFrom: '',
  dateTo: ''
}

const formatNumber = (value, maximumFractionDigits = 2) => Number(value || 0).toLocaleString('en-IN', {
  maximumFractionDigits
})

const formatQty = value => `${formatNumber(value, 3)} Pcs`
const formatMoney = value => value === null || value === undefined
  ? '—'
  : `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const formatDate = value => value ? dayjs(value).format('DD MMM YYYY') : '—'
const formatDateTime = value => value ? dayjs(value).format('DD MMM YYYY HH:mm') : '—'

const pricingTag = status => {
  if (status === 'fully-priced') return <Tag color='success'>Fully priced</Tag>
  if (status === 'partially-priced') return <Tag color='warning'>Partially priced</Tag>
  if (status === 'unpriced') return <Tag color='default'>Unpriced</Tag>
  return <Tag>No inventory lines</Tag>
}

const voucherTypeTag = value => {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('purchase')) return <Tag color='blue'>{value}</Tag>
  if (normalized.includes('sales')) return <Tag color='green'>{value}</Tag>
  if (normalized.includes('stock')) return <Tag color='purple'>{value}</Tag>
  return <Tag>{value || 'Unspecified'}</Tag>
}

const SummaryCard = ({ title, value, suffix, helper, color = INK }) => (
  <Card style={{ borderColor: BORDER, height: '100%' }} styles={{ body: { padding: 17 } }}>
    <Statistic
      title={<span style={{ color: MUTED, fontWeight: 700 }}>{title}</span>}
      value={Number(value || 0)}
      suffix={suffix}
      valueStyle={{ color, fontSize: 26, fontWeight: 750 }}
    />
    <div style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>{helper}</div>
  </Card>
)

const TallyBackupExplorerPage = () => {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState([])
  const [xmlVoucher, setXmlVoucher] = useState(null)
  const [xmlLoading, setXmlLoading] = useState(false)

  const loadVouchers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await client.get('/cost-management/tally-backup', {
        params: {
          ...appliedFilters,
          page,
          limit: pageSize
        }
      })
      setData(response.data)
      setExpandedKeys([])
    } catch (error) {
      console.error('Failed to load Tally backup explorer:', error)
      message.error(error.response?.data?.message || 'Failed to search the Tally backup')
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, page, pageSize])

  useEffect(() => {
    loadVouchers()
  }, [loadVouchers])

  const updateFilter = useCallback((key, value) => {
    setDraftFilters(previous => ({ ...previous, [key]: value }))
  }, [])

  const applyFilters = useCallback(() => {
    setPage(1)
    setAppliedFilters({ ...draftFilters })
  }, [draftFilters])

  const clearFilters = useCallback(() => {
    setDraftFilters({ ...EMPTY_FILTERS })
    setAppliedFilters({ ...EMPTY_FILTERS })
    setPage(1)
  }, [])

  const openRawXml = useCallback(async voucher => {
    setXmlVoucher({ ...voucher, rawXml: '' })
    setXmlLoading(true)
    try {
      const response = await client.get(`/cost-management/tally-backup/${voucher.id}`)
      setXmlVoucher(response.data.voucher)
    } catch (error) {
      console.error('Failed to load archived Tally XML:', error)
      message.error(error.response?.data?.message || 'Failed to load the archived XML')
    } finally {
      setXmlLoading(false)
    }
  }, [])

  const voucherTypeOptions = useMemo(() => [
    { value: 'all', label: 'All voucher types' },
    ...(data?.facets?.voucherTypes || []).map(item => ({
      value: item.value,
      label: `${item.value} (${formatNumber(item.count, 0)})`
    }))
  ], [data?.facets?.voucherTypes])

  const sourceFileOptions = useMemo(() => [
    { value: 'all', label: 'All source files' },
    ...(data?.facets?.sourceFiles || []).map(item => ({
      value: item.value,
      label: `${item.value} (${formatNumber(item.count, 0)})`
    }))
  ], [data?.facets?.sourceFiles])

  const lineColumns = [
    {
      title: 'Line',
      dataIndex: 'lineNumber',
      key: 'lineNumber',
      width: 70
    },
    {
      title: 'Archived product',
      dataIndex: 'productName',
      key: 'productName',
      width: 390,
      render: value => <Text style={{ color: INK, fontSize: 15, fontWeight: 700 }}>{value}</Text>
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 125,
      render: value => <Text strong>{formatQty(value)}</Text>
    },
    {
      title: 'Archived amount field',
      dataIndex: 'amount',
      key: 'amount',
      width: 155,
      render: value => formatNumber(value)
    },
    {
      title: 'Rate text',
      dataIndex: 'rateText',
      key: 'rateText',
      width: 125,
      render: value => value || '—'
    },
    {
      title: 'Costing',
      dataIndex: 'costingStatus',
      key: 'costingStatus',
      width: 115,
      render: status => status === 'priced'
        ? <Tag color='success'>Priced</Tag>
        : <Tag>Unpriced</Tag>
    },
    {
      title: 'Inclusive cost / Pc',
      dataIndex: 'costingUnitCost',
      key: 'costingUnitCost',
      width: 155,
      render: value => <Text strong style={{ color: value == null ? MUTED : GREEN }}>{formatMoney(value)}</Text>
    },
    {
      title: 'Taxable line amount',
      dataIndex: 'costingPurchaseTaxableAmount',
      key: 'costingPurchaseTaxableAmount',
      width: 170,
      render: formatMoney
    },
    {
      title: 'GST',
      key: 'gst',
      width: 180,
      render: (_, line) => line.costingGstAmount == null ? '—' : (
        <div>
          <Text>{formatMoney(line.costingGstAmount)}</Text>
          <div style={{ marginTop: 3 }}>
            <Tag color={line.costingGstOverridden ? 'warning' : 'blue'}>
              {formatNumber(line.costingGstPercent)}%{line.costingGstOverridden ? ' overridden' : ''}
            </Tag>
          </div>
        </div>
      )
    },
    {
      title: 'GST-inclusive total',
      dataIndex: 'costingGstInclusiveAmount',
      key: 'costingGstInclusiveAmount',
      width: 170,
      render: formatMoney
    }
  ]

  const renderVoucherDetails = voucher => (
    <div style={{ padding: '6px 8px 20px' }}>
      <Descriptions bordered size='small' column={{ xs: 1, sm: 2, lg: 3 }} style={{ marginBottom: 14 }}>
        <Descriptions.Item label='Archive ID'>{voucher.id}</Descriptions.Item>
        <Descriptions.Item label='Source GUID'>{voucher.sourceGuid || '—'}</Descriptions.Item>
        <Descriptions.Item label='Imported'>{formatDateTime(voucher.importedAt)}</Descriptions.Item>
        <Descriptions.Item label='Source file'>{voucher.sourceFile || '—'}</Descriptions.Item>
        <Descriptions.Item label='Amount interpretation'>
          {voucher.amountIsQuantity ? <Tag color='gold'>Quantity, not rupees</Tag> : <Tag color='green'>Rupee amount</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label='Costing'>{pricingTag(voucher.costingStatus)}</Descriptions.Item>
        <Descriptions.Item label='Narration' span={3}>{voucher.narration || '—'}</Descriptions.Item>
      </Descriptions>
      <Table
        rowKey='lineNumber'
        dataSource={voucher.lineItems}
        columns={lineColumns}
        pagination={false}
        size='small'
        scroll={{ x: 1650 }}
        locale={{ emptyText: <Empty description='This voucher has no archived inventory lines' /> }}
      />
    </div>
  )

  const voucherColumns = [
    {
      title: 'Date',
      dataIndex: 'voucherDate',
      key: 'voucherDate',
      width: 125,
      render: value => <Text strong>{formatDate(value)}</Text>
    },
    {
      title: 'Voucher',
      key: 'voucher',
      width: 145,
      render: (_, row) => (
        <div>
          <Text strong style={{ fontSize: 15 }}>#{row.voucherNumber || '—'}</Text>
          <div style={{ color: MUTED, fontSize: 12 }}>Archive ID {row.id}</div>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'voucherTypeName',
      key: 'voucherTypeName',
      width: 125,
      render: voucherTypeTag
    },
    {
      title: 'Party / ledger',
      dataIndex: 'partyLedgerName',
      key: 'partyLedgerName',
      width: 250,
      render: (value, row) => (
        <div>
          <Text style={{ color: INK, fontSize: 15, fontWeight: 700 }}>{value || '—'}</Text>
          {row.isCashEntry && <div style={{ marginTop: 3 }}><Tag color='red'>Cash bookkeeping</Tag></div>}
        </div>
      )
    },
    {
      title: 'Inventory lines',
      key: 'lines',
      width: 235,
      render: (_, row) => (
        <div>
          <Text strong>{formatNumber(row.lineItemCount, 0)} lines · {formatQty(row.quantity)}</Text>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            {row.lineItems.slice(0, 2).map(line => line.productName).join(' · ') || 'No product lines'}
            {row.lineItems.length > 2 ? ` · +${row.lineItems.length - 2} more` : ''}
          </div>
        </div>
      )
    },
    {
      title: 'Archived amount',
      key: 'amount',
      width: 155,
      render: (_, row) => (
        <div>
          <Text strong>{row.amountIsQuantity ? formatNumber(row.amount) : formatMoney(row.amount)}</Text>
          <div style={{ marginTop: 3 }}>
            <Tag color={row.amountIsQuantity ? 'gold' : 'green'}>
              {row.amountIsQuantity ? 'Stored as quantity' : 'Rupee value'}
            </Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Line costing',
      key: 'costing',
      width: 165,
      render: (_, row) => (
        <div>
          {pricingTag(row.costingStatus)}
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            {row.pricedLineCount} priced · {row.unpricedLineCount} unpriced
          </div>
        </div>
      )
    },
    {
      title: 'Source',
      key: 'source',
      width: 175,
      render: (_, row) => (
        <div>
          <Text>{row.sourceFile || '—'}</Text>
          <div style={{ color: MUTED, fontSize: 12 }}>{formatDateTime(row.importedAt)}</div>
        </div>
      )
    },
    {
      title: 'Source XML',
      key: 'xml',
      fixed: 'right',
      width: 125,
      render: (_, row) => (
        <Button icon={<CodeOutlined />} onClick={() => openRawXml(row)}>
          View XML
        </Button>
      )
    }
  ]

  const summary = data?.summary || {}
  const archive = data?.archive || {}
  const total = data?.pagination?.total || 0
  const activeFilterCount = Object.entries(appliedFilters).filter(([key, value]) => {
    if (['voucherType', 'cashStatus', 'costingStatus', 'amountMode', 'sourceFile'].includes(key)) return value !== 'all'
    if (key === 'sortOrder') return value !== 'desc'
    return Boolean(value)
  }).length

  return (
    <div style={{ padding: '0 4px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
        <div>
          <PageTitle>Tally Backup Explorer</PageTitle>
          <Text style={{ color: MUTED, fontSize: 14 }}>
            Search archived Tally vouchers and inspect every stored inventory line without changing the backup.
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={loadVouchers}>Refresh</Button>
      </div>

      <Alert
        type='info'
        showIcon
        icon={<DatabaseOutlined />}
        message='Read-only Tally XML archive'
        description={`The backup contains ${formatNumber(archive.voucherCount, 0)} vouchers from ${formatDate(archive.earliestDate)} to ${formatDate(archive.latestDate)}. Cash entries remain visible for audit and can be filtered, but this screen never treats them as costing evidence or modifies any voucher.`}
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 16 }}>
        <SummaryCard
          title='Matching vouchers'
          value={summary.voucherCount}
          helper={`${activeFilterCount} active filters · ${formatNumber(archive.voucherCount, 0)} total archived`}
          color={BLUE}
        />
        <SummaryCard
          title='Matching inventory lines'
          value={summary.lineItemCount}
          helper='Across every voucher matching the current filters'
          color={GREEN}
        />
        <SummaryCard
          title='Archived quantity'
          value={summary.quantity}
          suffix='Pcs'
          helper='Quantity field stored in the matching vouchers'
          color={ORANGE}
        />
        <SummaryCard
          title='Cash / non-Cash vouchers'
          value={summary.cashVoucherCount}
          suffix={`/ ${formatNumber(summary.nonCashVoucherCount, 0)}`}
          helper='Cash bookkeeping / non-Cash ledgers in this result'
        />
      </div>

      <Card style={{ borderColor: BORDER, marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: INK }}>Search and filters</Title>
            <Text style={{ color: MUTED }}>Search checks voucher metadata, narration, archived product lines, and the raw XML.</Text>
          </div>
          <Tag icon={<FilterOutlined />} color={activeFilterCount ? 'blue' : 'default'}>
            {activeFilterCount} active
          </Tag>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Input
            value={draftFilters.search}
            onChange={event => updateFilter('search', event.target.value)}
            onPressEnter={applyFilters}
            allowClear
            prefix={<SearchOutlined />}
            placeholder='Search anything in the backup'
          />
          <Input
            value={draftFilters.product}
            onChange={event => updateFilter('product', event.target.value)}
            onPressEnter={applyFilters}
            allowClear
            placeholder='Product contains…'
          />
          <Input
            value={draftFilters.ledger}
            onChange={event => updateFilter('ledger', event.target.value)}
            onPressEnter={applyFilters}
            allowClear
            placeholder='Party / ledger contains…'
          />
          <RangePicker
            value={draftFilters.dateFrom && draftFilters.dateTo
              ? [dayjs(draftFilters.dateFrom), dayjs(draftFilters.dateTo)]
              : null}
            onChange={values => {
              updateFilter('dateFrom', values?.[0]?.format('YYYY-MM-DD') || '')
              updateFilter('dateTo', values?.[1]?.format('YYYY-MM-DD') || '')
            }}
            style={{ width: '100%' }}
          />
          <Select
            showSearch
            optionFilterProp='label'
            value={draftFilters.voucherType}
            onChange={value => updateFilter('voucherType', value)}
            options={voucherTypeOptions}
          />
          <Select
            value={draftFilters.cashStatus}
            onChange={value => updateFilter('cashStatus', value)}
            options={[
              { value: 'all', label: 'All Cash and non-Cash' },
              { value: 'cash', label: 'Cash bookkeeping only' },
              { value: 'non-cash', label: 'Non-Cash only' }
            ]}
          />
          <Select
            value={draftFilters.costingStatus}
            onChange={value => updateFilter('costingStatus', value)}
            options={[
              { value: 'all', label: 'All costing statuses' },
              { value: 'fully-priced', label: 'All lines priced' },
              { value: 'partially-priced', label: 'Partially priced' },
              { value: 'unpriced', label: 'No lines priced' },
              { value: 'any-priced', label: 'Contains priced lines' },
              { value: 'no-lines', label: 'No inventory lines' }
            ]}
          />
          <Select
            value={draftFilters.amountMode}
            onChange={value => updateFilter('amountMode', value)}
            options={[
              { value: 'all', label: 'All amount interpretations' },
              { value: 'quantity', label: 'Amount stored as quantity' },
              { value: 'rupee', label: 'Amount stored as rupees' }
            ]}
          />
          <Select
            showSearch
            optionFilterProp='label'
            value={draftFilters.sourceFile}
            onChange={value => updateFilter('sourceFile', value)}
            options={sourceFileOptions}
          />
          <Select
            value={draftFilters.sortOrder}
            onChange={value => updateFilter('sortOrder', value)}
            options={[
              { value: 'desc', label: 'Latest vouchers first' },
              { value: 'asc', label: 'Oldest vouchers first' }
            ]}
          />
        </div>

        <Space wrap style={{ marginTop: 14 }}>
          <Button type='primary' icon={<FileSearchOutlined />} onClick={applyFilters} style={{ background: BLUE }}>
            Apply filters
          </Button>
          <Button icon={<ClearOutlined />} onClick={clearFilters}>Clear all</Button>
        </Space>
      </Card>

      <Card style={{ borderColor: BORDER }} styles={{ body: { padding: 16 } }}>
        <Table
          rowKey='id'
          loading={loading}
          dataSource={data?.rows || []}
          columns={voucherColumns}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [25, 50, 100, 200],
            showTotal: value => `${formatNumber(value, 0)} matching vouchers`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPageSize !== pageSize ? 1 : nextPage)
              setPageSize(nextPageSize)
            }
          }}
          scroll={{ x: 1500 }}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: keys => setExpandedKeys(keys),
            expandedRowRender: renderVoucherDetails,
            rowExpandable: row => row.lineItems.length > 0
          }}
          locale={{ emptyText: <Empty description='No Tally vouchers match the current filters' /> }}
        />
      </Card>

      <Drawer
        title={xmlVoucher
          ? `Tally source XML · Voucher ${xmlVoucher.voucherNumber || xmlVoucher.id}`
          : 'Tally source XML'}
        width='min(900px, 92vw)'
        open={Boolean(xmlVoucher)}
        onClose={() => setXmlVoucher(null)}
      >
        <Spin spinning={xmlLoading}>
          {xmlVoucher && (
            <>
              <Descriptions bordered size='small' column={1} style={{ marginBottom: 14 }}>
                <Descriptions.Item label='Date'>{formatDate(xmlVoucher.voucherDate)}</Descriptions.Item>
                <Descriptions.Item label='Type'>{xmlVoucher.voucherTypeName || '—'}</Descriptions.Item>
                <Descriptions.Item label='Party / ledger'>{xmlVoucher.partyLedgerName || '—'}</Descriptions.Item>
                <Descriptions.Item label='Source'>{xmlVoucher.sourceFile || '—'}</Descriptions.Item>
              </Descriptions>
              {xmlVoucher.rawXml ? (
                <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: 14, background: '#0f172a', color: '#e2e8f0', borderRadius: 8, fontSize: 12 }}>
                  {xmlVoucher.rawXml}
                </pre>
              ) : (
                <Empty description={xmlLoading ? 'Loading XML…' : 'No raw XML was archived for this voucher'} />
              )}
            </>
          )}
        </Spin>
      </Drawer>
    </div>
  )
}

export default TallyBackupExplorerPage
