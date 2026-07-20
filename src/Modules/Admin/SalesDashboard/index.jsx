import React, { useMemo, useState } from 'react'
import { Alert, DatePicker, Empty, Select, Spin } from 'antd'
import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WalletOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { Bar, Line, Pie } from '@ant-design/plots'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import { useAdminDashboard } from '../../../hooks/useAdminDashboard'
import './SalesDashboard.css'

const { RangePicker } = DatePicker

const SECTIONS = [
  { key: 'trends', label: 'Trends' },
  { key: 'product', label: 'Product Performance' },
  { key: 'dealer', label: 'Dealer Performance' },
  { key: 'team', label: 'Sales Team Performance' },
  { key: 'warranty', label: 'Warranty' }
]

const CHANNELS = [
  { key: 'all', label: 'All' },
  { key: 'b2b', label: 'B2B' },
  { key: 'd2c', label: 'D2C' }
]

const number = value => Number(value || 0)
const formatNumber = value => number(value).toLocaleString('en-IN')
const formatCurrency = value => {
  const amount = number(value)
  if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  if (Math.abs(amount) >= 1000) return `₹${(amount / 1000).toFixed(1)} K`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}
const formatDate = value => (value ? moment(value).format('DD MMM YYYY') : '—')
const formatChartPeriod = (value, chartPeriod) => {
  if (!value) return '—'
  if (chartPeriod === 'weekly') return `W${moment(value).isoWeek()}`
  if (chartPeriod === 'daily') return moment(value).format('DD MMM')
  return moment(value, 'YYYY-MM').format('MMM')
}

const GrowthPill = ({ value, label }) => {
  const amount = number(value)
  const positive = amount >= 0
  return (
    <span className={`sales-growth-pill ${positive ? 'positive' : 'negative'}`}>
      {positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      {Math.abs(amount).toFixed(1)}%{label ? ` ${label}` : ''}
    </span>
  )
}

const MetricCard = ({ tone, icon, title, value, growth, comparison, detail, suffix }) => (
  <article className={`sales-metric-card ${tone}`}>
    <div className='sales-metric-title'>
      {icon}
      <span>{title}</span>
    </div>
    <div className='sales-metric-value'>
      {value}
      {suffix && <span className='sales-metric-suffix'>{suffix}</span>}
    </div>
    <div className='sales-metric-comparison'>
      {comparison || (
        <>
          <span>vs last period</span>
          <GrowthPill value={growth} />
        </>
      )}
    </div>
    <div className='sales-metric-detail'>{detail}</div>
  </article>
)

const PillTabs = ({ items, value, onChange, ariaLabel }) => (
  <div className='sales-pill-tabs' role='tablist' aria-label={ariaLabel}>
    {items.map(item => (
      <button
        type='button'
        role='tab'
        aria-selected={value === item.key}
        key={item.key}
        className={value === item.key ? 'active' : ''}
        onClick={() => onChange(item.key)}
      >
        {item.label}
      </button>
    ))}
  </div>
)

const Rank = ({ index }) => <span className='sales-rank'>{index + 1}</span>

const TrendCell = ({ value }) => {
  const amount = number(value)
  const positive = amount >= 0
  return (
    <span className={`sales-table-trend ${positive ? 'positive' : 'negative'}`}>
      {positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      {Math.abs(amount).toFixed(1)}%
    </span>
  )
}

const DashboardTable = ({ columns, rows, rowKey = 'key', emptyText = 'No data for this period' }) => (
  <div className='sales-table-scroll'>
    <table className='sales-dashboard-table'>
      <thead>
        <tr>
          {columns.map(column => (
            <th key={column.key} className={column.align === 'center' ? 'center' : ''}>
              {column.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td className='sales-empty-cell' colSpan={columns.length}>
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row, index) => (
            <tr key={row[rowKey] ?? `${rowKey}-${index}`}>
              {columns.map(column => (
                <td key={column.key} className={column.align === 'center' ? 'center' : ''}>
                  {column.render ? column.render(row[column.dataIndex], row, index) : row[column.dataIndex] ?? '—'}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

const TablePanel = ({ title, tone = 'blue', children }) => (
  <section className='sales-table-panel'>
    <div className={`sales-table-panel-title ${tone}`}>{title}</div>
    {children}
  </section>
)

const PerformanceTable = ({ title, tone, rows, limit }) => {
  const columns = [
    { key: 'rank', title: '', render: (_, __, index) => <Rank index={index} /> },
    {
      key: 'name',
      title: 'Model',
      dataIndex: 'name',
      render: (value, row) => (
        <div className='sales-name-cell'>
          <span>{value || 'Unknown'}</span>
          {row.meta && <small>{row.meta}</small>}
        </div>
      )
    },
    { key: 'revenue', title: 'Revenue', dataIndex: 'revenue', render: formatCurrency },
    { key: 'units', title: 'Units', dataIndex: 'units', render: formatNumber },
    { key: 'profit', title: 'Gross Profit', dataIndex: 'grossProfit', render: formatCurrency },
    { key: 'gp', title: 'GP%', dataIndex: 'gpPercent', render: value => `${number(value).toFixed(1)}%` },
    { key: 'trend', title: 'Trend (MoM)', dataIndex: 'trend', align: 'center', render: value => <TrendCell value={value} /> }
  ]

  return (
    <TablePanel title={title} tone={tone}>
      <DashboardTable columns={columns} rows={(rows || []).slice(0, limit)} />
    </TablePanel>
  )
}

const TrendsSection = ({ data, chartPeriod, setChartPeriod, navigate }) => {
  const [overdueView, setOverdueView] = useState('dealer')
  const revenueRows = data?.trends?.revenue || []
  const unitRows = data?.trends?.units || []
  const overdueDealers = data?.overdue?.byDealer || []
  const overdueSalesPeople = data?.overdue?.bySalesPerson || []
  const currentRevenueRows = revenueRows.filter(row => row.series === 'Current Period')
  const periodLabels = new Map(
    currentRevenueRows.map(row => [number(row.bucket), formatChartPeriod(row.period, chartPeriod)])
  )

  const lineConfig = {
    data: revenueRows,
    xField: 'bucket',
    yField: 'revenue',
    colorField: 'series',
    seriesField: 'series',
    height: 255,
    animate: false,
    scale: {
      color: { range: ['#4a90ff', '#a9ccff'] },
      x: { nice: false },
      y: { nice: true }
    },
    style: {
      shape: 'smooth',
      lineWidth: 2.5,
      lineDash: group => group?.[0]?.series === 'Previous Period' ? [7, 6] : null
    },
    axis: {
      x: {
        title: false,
        labelAutoRotate: false,
        labelAutoHide: true,
        labelFormatter: value => periodLabels.get(number(value)) || value,
        line: false,
        tick: false
      },
      y: {
        title: false,
        labelFormatter: formatCurrency,
        grid: true,
        gridStroke: '#dedee3',
        gridLineWidth: 1,
        line: false,
        tick: false
      }
    },
    legend: false,
    tooltip: {
      title: datum => formatChartPeriod(datum.period, chartPeriod),
      items: [datum => ({ name: datum.series, value: formatCurrency(datum.revenue) })]
    }
  }
  const barConfig = {
    data: unitRows,
    xField: 'period',
    yField: 'units',
    height: 255,
    animate: false,
    scale: { y: { nice: true } },
    style: { fill: '#6f9ef6', radius: 3, maxWidth: 18 },
    axis: {
      x: {
        title: false,
        labelFormatter: value => formatChartPeriod(value, chartPeriod),
        labelAutoHide: false,
        line: false,
        tick: false
      },
      y: {
        title: false,
        tickCount: 4,
        labelAutoRotate: false,
        labelAutoHide: false,
        labelFormatter: formatNumber,
        grid: true,
        gridStroke: '#dedee3',
        gridLineWidth: 1,
        line: false,
        tick: false
      }
    },
    legend: false,
    tooltip: {
      title: datum => formatChartPeriod(datum.period, chartPeriod),
      items: [datum => ({ name: 'Units', value: formatNumber(datum.units) })]
    }
  }

  const dealerColumns = [
    { key: 'rank', title: '', render: (_, __, index) => <Rank index={index} /> },
    { key: 'dealer', title: 'Dealer', dataIndex: 'dealerName' },
    { key: 'sales', title: 'Sales Person', dataIndex: 'salesPerson' },
    { key: 'amount', title: 'Overdue Amount', dataIndex: 'overdueAmount', render: formatCurrency },
    { key: 'payment', title: 'Last Payment', dataIndex: 'lastPaymentDate', render: formatDate },
    {
      key: 'risk',
      title: 'Risk',
      dataIndex: 'risk',
      render: value => <span className={`sales-risk ${value}`}>{value === 'critical' ? 'Critical · 60d+' : value}</span>
    },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      render: (_, row) => (
        <button
          type='button'
          className='sales-row-action'
          aria-label={`View ${row.dealerName}`}
          onClick={() => navigate(`/admin-dealers/${row.dealerId}`, { state: { id: row.dealerId, name: row.dealerName } })}
        >
          <ArrowRightOutlined />
        </button>
      )
    }
  ]
  const personColumns = [
    { key: 'rank', title: '', render: (_, __, index) => <Rank index={index} /> },
    { key: 'person', title: 'Sales Person', dataIndex: 'salesPerson' },
    { key: 'dealers', title: 'Dealers Overdue', dataIndex: 'dealersOverdue', render: formatNumber },
    { key: 'amount', title: 'Overdue Amount', dataIndex: 'overdueAmount', render: formatCurrency },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      render: (_, row) => (
        <button
          type='button'
          className='sales-row-action text'
          onClick={() => navigate(`/admin-daily-entry-dealers?salesId=${row.salesPersonId || ''}&overdue=true&sort=overdue`)}
        >
          View <ArrowRightOutlined />
        </button>
      )
    }
  ]

  return (
    <div className='sales-section-stack'>
      <div className='sales-chart-grid'>
        <section className='sales-card sales-chart-card wide'>
          <div className='sales-card-heading-row'>
            <div>
              <h2>Revenue</h2>
            </div>
            <div className='sales-revenue-controls'>
              <div className='sales-chart-legend' aria-label='Revenue chart legend'>
                <span><i className='current' />Current Period</span>
                <span><i className='previous' />Previous Period</span>
              </div>
              <PillTabs
                items={[{ key: 'monthly', label: 'Monthly' }, { key: 'weekly', label: 'Weekly' }]}
                value={chartPeriod}
                onChange={setChartPeriod}
                ariaLabel='Revenue chart period'
              />
            </div>
          </div>
          {revenueRows.length ? <Line {...lineConfig} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </section>
        <section className='sales-card sales-chart-card'>
          <div className='sales-card-heading-row'>
            <div>
              <h2>Units Sold</h2>
            </div>
          </div>
          {unitRows.length ? <Bar {...barConfig} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </section>
      </div>

      <section className='sales-card sales-overdue-card'>
        <div className='sales-card-heading-row table-heading'>
          <div>
            <h2>Overdue Breakdown</h2>
            <p>Sorted by overdue amount</p>
          </div>
          <PillTabs
            items={[{ key: 'dealer', label: 'By Dealer' }, { key: 'sales', label: 'By Sales Person' }]}
            value={overdueView}
            onChange={setOverdueView}
            ariaLabel='Overdue breakdown'
          />
        </div>
        <DashboardTable
          columns={overdueView === 'dealer' ? dealerColumns : personColumns}
          rows={overdueView === 'dealer' ? overdueDealers : overdueSalesPeople}
          rowKey={overdueView === 'dealer' ? 'dealerId' : 'salesPersonId'}
        />
        <button type='button' className='sales-view-all' onClick={() => navigate('/admin-daily-entry-dealers?overdue=true&sort=overdue')}>
          View all Dealers <ArrowRightOutlined />
        </button>
      </section>
    </div>
  )
}

const ProductSection = ({ data }) => {
  const [view, setView] = useState('models')
  const [limit, setLimit] = useState(10)
  const product = data?.productPerformance || {}

  return (
    <section className='sales-card sales-performance-card'>
      <div className='sales-card-heading-row performance-heading'>
        <h2>Product Performance</h2>
        <div className='sales-heading-controls'>
          <Select value={limit} onChange={setLimit} options={[{ value: 5, label: '5 per table' }, { value: 10, label: '10 per table' }]} />
          <PillTabs
            items={[{ key: 'models', label: 'Models' }, { key: 'sizeFinish', label: 'Size & Finish' }, { key: 'designs', label: 'Designs' }]}
            value={view}
            onChange={setView}
            ariaLabel='Product performance view'
          />
        </div>
      </div>

      {view === 'models' && (
        <>
          <PerformanceTable title='Top Performing Models' tone='blue' rows={product.models?.top} limit={limit} />
          <PerformanceTable title='Lowest Performing Models' tone='orange' rows={product.models?.bottom} limit={limit} />
        </>
      )}
      {view === 'sizeFinish' && (
        <>
          <PerformanceTable title='Size-Wise Performance' tone='blue' rows={product.sizes?.top} limit={limit} />
          <PerformanceTable title='Finish-wise Performance' tone='orange' rows={product.finishes?.top} limit={limit} />
        </>
      )}
      {view === 'designs' && (
        <>
          <PerformanceTable title='Top Performing Designs' tone='blue' rows={product.designs?.top} limit={limit} />
          <PerformanceTable title='Lowest Performing Designs' tone='orange' rows={product.designs?.bottom} limit={limit} />
        </>
      )}
    </section>
  )
}

const DealerSection = ({ data, navigate }) => {
  const [view, setView] = useState('top')
  const dealer = data?.dealerPerformance || {}
  const rows = view === 'top' ? dealer.topDealers || [] : view === 'new' ? dealer.newDealers || [] : dealer.dormantDealers || []

  const standardColumns = [
    { key: 'rank', title: '', render: (_, __, index) => <Rank index={index} /> },
    { key: 'dealer', title: 'Dealer', dataIndex: 'dealerName' },
    { key: 'sales', title: 'Sales Person', dataIndex: 'salesPerson' },
    { key: 'revenue', title: 'Revenue', dataIndex: 'revenue', render: formatCurrency },
    { key: 'units', title: 'Units', dataIndex: 'units', render: formatNumber },
    { key: 'profit', title: 'Gross Profit', dataIndex: 'grossProfit', render: formatCurrency },
    { key: 'gp', title: 'GP%', dataIndex: 'gpPercent', render: value => `${number(value).toFixed(1)}%` },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      render: (_, row) => (
        <button type='button' className='sales-row-action' onClick={() => navigate(`/admin-dealers/${row.dealerId}`, { state: { id: row.dealerId, name: row.dealerName } })}>
          <ArrowRightOutlined />
        </button>
      )
    }
  ]
  const dormantColumns = [
    { key: 'rank', title: '', render: (_, __, index) => <Rank index={index} /> },
    { key: 'dealer', title: 'Dealer', dataIndex: 'dealerName' },
    { key: 'sales', title: 'Sales Person', dataIndex: 'salesPerson' },
    { key: 'lifetime', title: 'Lifetime Revenue', dataIndex: 'lifetimeRevenue', render: formatCurrency },
    { key: 'last', title: 'Last Order', dataIndex: 'lastOrderDate', render: formatDate },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      render: (_, row) => (
        <button type='button' className='sales-row-action' onClick={() => navigate(`/admin-dealers/${row.dealerId}`, { state: { id: row.dealerId, name: row.dealerName } })}>
          <ArrowRightOutlined />
        </button>
      )
    }
  ]

  return (
    <section className='sales-card sales-performance-card'>
      <div className='sales-card-heading-row performance-heading'>
        <div>
          <h2>Dealer Performance</h2>
          <p>Dealer overview for the selected period</p>
        </div>
        <PillTabs
          items={[{ key: 'top', label: 'Top Dealers' }, { key: 'new', label: 'New Acquisitions' }, { key: 'dormant', label: 'Dormant Dealers' }]}
          value={view}
          onChange={setView}
          ariaLabel='Dealer performance view'
        />
      </div>
      <DashboardTable columns={view === 'dormant' ? dormantColumns : standardColumns} rows={rows} rowKey='dealerId' />
      <button type='button' className='sales-view-all' onClick={() => navigate('/admin-daily-entry-dealers')}>
        View all Dealers <ArrowRightOutlined />
      </button>
    </section>
  )
}

const SalesTeamSection = ({ data, navigate }) => {
  const rows = data?.salesTeamPerformance || []
  const columns = [
    { key: 'rank', title: '', render: (_, __, index) => <Rank index={index} /> },
    { key: 'person', title: 'Sales Rep.', dataIndex: 'salesPerson' },
    {
      key: 'units',
      title: 'Units sold',
      dataIndex: 'units',
      render: (value, row) => (
        <div className='sales-stacked-cell'><strong>{formatNumber(value)}</strong><small>Selected period</small></div>
      )
    },
    {
      key: 'revenue',
      title: 'Revenue & MoM Change',
      dataIndex: 'revenue',
      render: (value, row) => (
        <div className='sales-stacked-cell'><strong>{formatCurrency(value)}</strong><TrendCell value={row.trend} /></div>
      )
    },
    {
      key: 'active',
      title: 'Active Dealers',
      render: (_, row) => <strong>{row.activeDealers}<span className='sales-muted'>/{row.totalDealers}</span></strong>
    },
    {
      key: 'overdue',
      title: 'Overdue',
      render: (_, row) => (
        <button
          type='button'
          className='sales-link-cell'
          onClick={() => navigate(`/admin-daily-entry-dealers?salesId=${row.salesPersonId || ''}&overdue=true&sort=overdue`)}
        >
          <strong>{formatCurrency(row.overdueAmount)}</strong>
          <small>{row.overdueDealers} dealers</small>
        </button>
      )
    }
  ]
  return (
    <section className='sales-card sales-performance-card'>
      <div className='sales-card-heading-row performance-heading'><h2>Sales Rep. Performance</h2></div>
      <DashboardTable columns={columns} rows={rows} rowKey='salesPersonId' />
    </section>
  )
}

const WarrantySection = ({ data }) => {
  const warranty = data?.warranty || {}
  const rows = warranty.bottomDealers || []
  const claims = warranty.claimsByType || []
  const columns = [
    { key: 'dealer', title: 'Dealer', dataIndex: 'dealerName' },
    { key: 'sales', title: 'Sales Person', dataIndex: 'salesPerson' },
    { key: 'units', title: 'Unit Sold', dataIndex: 'units', align: 'center', render: formatNumber },
    { key: 'registrations', title: 'Registrations', dataIndex: 'registrations', align: 'center', render: value => <strong>{formatNumber(value)}</strong> },
    { key: 'rate', title: 'Rate', dataIndex: 'registrationRate', align: 'center', render: value => <span className={`sales-rate ${number(value) < 10 ? 'critical' : 'warning'}`}>{number(value).toFixed(1)}%</span> }
  ]
  const pieConfig = {
    data: claims,
    angleField: 'value',
    colorField: 'type',
    radius: 1,
    innerRadius: 0.68,
    transform: [{ type: 'stackY' }],
    startAngle: Math.PI,
    endAngle: Math.PI * 2,
    scale: { color: { range: ['#f8d5c9', '#ffb79f', '#ff9978', '#ff7957', '#f55632'] } },
    style: { stroke: '#ffffff', lineWidth: 2 },
    legend: {
      color: {
        position: 'bottom',
        layout: { justifyContent: 'flex-start' },
        itemMarker: 'circle',
        itemLabelFontSize: 11,
        rowPadding: 4
      }
    },
    label: false,
    tooltip: {
      items: [datum => ({ name: datum.type, value: formatNumber(datum.value) })]
    },
    animate: false,
    height: 275
  }

  return (
    <div className='sales-section-stack'>
      <div className='sales-warranty-metrics'>
        <div className='sales-warranty-stat'>
          <span>Registrations</span>
          <div><strong>{formatNumber(warranty.registrations)}</strong><GrowthPill value={warranty.registrationGrowth} /></div>
        </div>
        <div className='sales-warranty-stat'>
          <span>Registration Rate</span>
          <div><strong>{number(warranty.registrationRate).toFixed(1)}%</strong></div>
        </div>
        <div className='sales-warranty-stat warning'>
          <span>Warranty Claims</span>
          <div><strong>{formatNumber(warranty.claims)}</strong><GrowthPill value={warranty.claimsGrowth} /></div>
        </div>
      </div>
      <div className='sales-warranty-grid'>
        <TablePanel title='Bottom dealers by warranty registration rate' tone='orange'>
          <DashboardTable columns={columns} rows={rows} rowKey='dealerId' />
        </TablePanel>
        <section className='sales-card sales-claims-card'>
          <h2>Claims by Type</h2>
          {claims.length ? (
            <div className='sales-claims-chart'>
              <Pie {...pieConfig} />
              <div className='sales-claims-stat' aria-label={`Claim rate ${number(warranty.claimRate).toFixed(2)} percent`}>
                <span>Claim Rate</span>
                <strong>{number(warranty.claimRate).toFixed(2)}%</strong>
              </div>
            </div>
          ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </section>
      </div>
    </div>
  )
}

const AdminSalesDashboard = () => {
  const navigate = useNavigate()
  const initialRange = useMemo(() => ({
    startDate: moment().subtract(11, 'months').startOf('month').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    chartPeriod: 'monthly',
    dealerType: 'all'
  }), [])
  const {
    data,
    loading,
    error,
    filters,
    updateFilters,
    setDateRange,
    setChartPeriod,
    refresh
  } = useAdminDashboard(initialRange)
  const [section, setSection] = useState('trends')

  const overview = data?.overview || {}
  const selectedRange = [moment(filters.startDate), moment(filters.endDate)]
  const handleDateChange = values => {
    if (values?.[0] && values?.[1]) {
      setDateRange(values[0].format('YYYY-MM-DD'), values[1].format('YYYY-MM-DD'))
    }
  }

  const content = {
    trends: <TrendsSection data={data} chartPeriod={filters.chartPeriod} setChartPeriod={setChartPeriod} navigate={navigate} />,
    product: <ProductSection data={data} />,
    dealer: <DealerSection data={data} navigate={navigate} />,
    team: <SalesTeamSection data={data} navigate={navigate} />,
    warranty: <WarrantySection data={data} />
  }[section]

  if (loading && !data) {
    return <div className='sales-dashboard-state'><Spin size='large' /><span>Loading sales dashboard…</span></div>
  }

  if (error && !data) {
    return <Alert type='error' showIcon message='Unable to load the Sales Dashboard' description={error} action={<button type='button' className='sales-primary-button' onClick={refresh}>Retry</button>} />
  }

  return (
    <div className='sales-dashboard'>
      <header className='sales-dashboard-header'>
        <div>
          <h1>Sales Overview</h1>
          <p>{moment(filters.startDate).format('DD MMM YYYY')} – {moment(filters.endDate).format('DD MMM YYYY')}</p>
        </div>
        <div className='sales-dashboard-actions'>
          <button type='button' className='sales-secondary-button' onClick={refresh} disabled={loading}>
            <ReloadOutlined spin={loading} /> Refresh
          </button>
          <RangePicker
            value={selectedRange}
            onChange={handleDateChange}
            allowClear={false}
            format='DD MMM YYYY'
            suffixIcon={<CalendarOutlined />}
            className='sales-date-range'
          />
        </div>
      </header>

      {error && <Alert type='warning' showIcon message='Some dashboard data may be stale' description={error} closable />}

      <section className='sales-metric-grid' aria-label='Sales summary'>
        <MetricCard
          tone='blue'
          icon={<WalletOutlined />}
          title='Total Revenue'
          value={formatCurrency(overview.totalRevenue)}
          growth={overview.revenueGrowth}
          detail={<>Average order value: <strong>{formatCurrency(overview.averageOrderValue)}</strong></>}
        />
        <MetricCard
          tone='purple'
          icon={<ShoppingCartOutlined />}
          title='Total Sales (Units)'
          value={formatNumber(overview.totalUnits)}
          growth={overview.unitsGrowth}
          detail={<>Stock units delayed: <strong>{formatNumber(overview.stockDelayedUnits)} ({formatNumber(overview.stockDelayedOrders)} orders)</strong></>}
        />
        <MetricCard
          tone='red'
          icon={<WarningOutlined />}
          title='Payments Overdue'
          value={formatCurrency(overview.overdueAmount)}
          comparison='Outstanding for more than 25 days'
          detail={<><strong>{formatNumber(overview.criticalDealers)}</strong> dealers · critical 60d+</>}
        />
        <MetricCard
          tone='orange'
          icon={<TeamOutlined />}
          title='Dealer Network'
          value={formatNumber(overview.activeDealers)}
          suffix={`of ${formatNumber(overview.totalDealers)} active`}
          comparison={<><strong>{formatNumber(overview.newAcquisitions)}</strong>&nbsp; new acquisitions</>}
          detail={<>{formatNumber(overview.dormantDealers)} dormant · 3M+ inactive</>}
        />
      </section>

      <div className='sales-dashboard-navigation'>
        <div className='sales-section-tabs' role='tablist' aria-label='Sales dashboard sections'>
          {SECTIONS.map(item => (
            <button
              key={item.key}
              type='button'
              role='tab'
              aria-selected={section === item.key}
              className={section === item.key ? 'active' : ''}
              onClick={() => setSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <PillTabs items={CHANNELS} value={filters.dealerType || 'all'} onChange={dealerType => updateFilters({ dealerType })} ariaLabel='Sales channel' />
      </div>

      <main className={loading ? 'sales-dashboard-content loading' : 'sales-dashboard-content'}>
        {content}
      </main>
    </div>
  )
}

export default AdminSalesDashboard
