import React, { useEffect, useRef } from 'react'
import {
  Table,
  Button,
  Dropdown,
  Tag,
  Select,
  DatePicker,
  Space,
  Row
} from 'antd'
import {
  EyeOutlined,
  MoreOutlined,
  CalendarOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import moment from 'moment'

import PageTitle from '../../../Core/Components/PageTitle'
import TabBar from '../../../Core/Components/TabBar'
import KpiCard from '../../../Core/Components/KpiCard'
import FilterBar from '../../../Core/Components/FilterBar'
import StatusBadge from '../../../Core/Components/StatusBadge'

const { RangePicker } = DatePicker

const ProductionTable = ({
  productionPlans,
  loading,
  currentPage,
  pageSize,
  totalPlansCount,
  handlePageChange,
  handleTableChange,
  handleView,
  getActionMenu,
  // Search and filter props
  localSearch,
  setLocalSearch,
  handleSearch,
  filters,
  handleFilterChange,
  handleDateRangeChange,
  isTodayFilter,
  handleTodayFilter,
  handleClearFilters,
  searchTerm,
  handleCreatePlan,
  navigate,
  exportMenuItems,
  // Expandable row props
  expandedRowKeys,
  handleExpand,
  expandedRowRender,
  // Job cards data
  jobCardsData,
  loadingJobCards,
  // Total KPIs from entire dataset (not paginated)
  totalKPIs,
  kpisLoading,
  lastKPIUpdate,
  // Row styling
  rowClassName
}) => {
  const urgentOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'true', label: 'Urgent' },
    { value: 'false', label: 'Normal' }
  ]

  // Use total KPIs from entire dataset (not paginated)
  const kpis = totalKPIs || {
    todayQuantity: 0,
    totalUnallocated: 0,
    totalAllocated: 0,
    urgentPlans: 0,
    totalPlans: 0,
    todayPlansCount: 0,
    completionRate: 0
  }


  // Live search with debounce — matches the Sales Coordination filter bar
  // behavior (no Enter key needed)
  const searchDebounce = useRef(null)
  useEffect(() => {
    if (localSearch === searchTerm) return undefined
    searchDebounce.current = setTimeout(() => handleSearch(), 450)
    return () => clearTimeout(searchDebounce.current)
  }, [localSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Get deadline urgency status for a production plan (using API-provided data)
  const getDeadlineStatus = record => {
    const deadlineInfo = record.deadlineInfo || {}

    // A completed plan has no delivery pressure — it previously kept showing
    // "⚠️ DELAYED" / "DUE TODAY" tags forever, contradicting its own state
    if (
      record.isCompleted === 1 ||
      record.quantityTracking?.completionStatus === 'completed'
    ) {
      return { status: 'none', daysRemaining: null, closestDeadline: null }
    }

    // Map API status to component status
    const apiStatus = deadlineInfo.status || 'none'

    // Calculate days remaining on CALENDAR days. The old hour-based
    // moment().diff ran in the browser's timezone and OVERRODE the API's IST
    // verdict, so "DUE TODAY" could show a day early (a shipped console.warn
    // acknowledged the mismatch).
    let daysRemaining = null
    let closestDeadline = null

    if (deadlineInfo.earliestDeadline) {
      closestDeadline = moment(deadlineInfo.earliestDeadline)
      daysRemaining = closestDeadline
        .clone()
        .startOf('day')
        .diff(moment().startOf('day'), 'days')
    }

    // The API's status is authoritative; daysRemaining only fills the gap
    // for the "exactly tomorrow" hint the API doesn't distinguish
    let mappedStatus = 'none'
    if (apiStatus === 'overdue') {
      mappedStatus = 'delayed'
    } else if (apiStatus === 'due_today') {
      mappedStatus = 'today'
    } else if (apiStatus === 'urgent') {
      mappedStatus = 'urgent'
    } else if (daysRemaining === 1) {
      mappedStatus = 'upcoming'
    }

    return {
      status: mappedStatus,
      daysRemaining,
      closestDeadline
    }
  }

  const columns = [
    {
      title: 'Plan ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      sorter: true, // server-side (validSortFields.id)
      render: (id, record) => {
        return (
          <div>
            <div className='flex items-center gap-2'>
              <span className='font-semibold'>#{id}</span>
              {record.isRework && (
                <span className='inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200'>
                  ↻ Rework
                </span>
              )}
            </div>
            {record.isRework && record.parentPlanId && (
              <div
                className='text-xs text-purple-600 cursor-pointer hover:underline mt-1'
                onClick={(e) => { e.stopPropagation(); navigate(`/production-plan/${record.parentPlanId}`) }}
              >
                ↩ Rework of Plan #{record.parentPlanId}
              </div>
            )}
            {!record.isRework && record.quantityTracking?.childReworkPlanCount > 0 && (
              <div className='mt-1'>
                <Tag
                  color='purple'
                  className='text-xs cursor-pointer'
                  onClick={(e) => { e.stopPropagation(); navigate(`/production-plan/${record.id}`) }}
                >
                  🔄 {record.quantityTracking.childReworkPlanCount} Rework Plan{record.quantityTracking.childReworkPlanCount > 1 ? 's' : ''}
                </Tag>
              </div>
            )}
            {record.urgent === 1 && (
              <div className='mt-1'>
                <span className='inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white'>
                  🔥 Urgent
                </span>
              </div>
            )}
          </div>
        )
      }
    },
    {
      // Single at-a-glance status — the status FILTER existed but no column
      // showed it, so filtered rows were indistinguishable
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, record) => {
        const qt = record.quantityTracking || {}
        if (
          record.isCompleted === 1 ||
          qt.completionStatus === 'completed'
        ) {
          return <StatusBadge variant='dispatched'>Completed</StatusBadge>
        }
        if ((qt.rejectedQuantity || 0) > 0) {
          return <StatusBadge variant='unpaid'>Has Rejections</StatusBadge>
        }
        if ((qt.allocatedQuantity || 0) > 0) {
          return <StatusBadge variant='inprod'>In Production</StatusBadge>
        }
        return <StatusBadge variant='pending'>Pending</StatusBadge>
      }
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      sorter: true, // server-side (validSortFields.createdAt)
      render: createdAt => (
        <span>{moment(createdAt).format('MMM DD, YYYY')}</span>
      )
    },
    {
      title: 'Deadline',
      key: 'deadline',
      width: 150,
      render: (_, record) => {
        const deadlineInfo = getDeadlineStatus(record)

        if (!deadlineInfo.closestDeadline) {
          return <span className='text-gray-300'>—</span>
        }

        const deadlineDate = deadlineInfo.closestDeadline.format('MMM DD, YYYY')
        const daysText = deadlineInfo.daysRemaining !== null
          ? `(${deadlineInfo.daysRemaining === 0 ? 'Today' : deadlineInfo.daysRemaining === 1 ? '1 day' : `${deadlineInfo.daysRemaining} days`})`
          : ''

        return (
          <div>
            <div className='text-sm font-medium'>{deadlineDate}</div>
            {daysText && <div className='text-xs text-gray-500'>{daysText}</div>}
            {deadlineInfo.status === 'delayed' && (
              <span className='inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white'>
                ⚠ Delayed
              </span>
            )}
            {deadlineInfo.status === 'today' && (
              <span className='inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white'>
                Due today
              </span>
            )}
            {deadlineInfo.status === 'urgent' && (
              <span className='inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200'>
                Due soon
              </span>
            )}
            {deadlineInfo.status === 'upcoming' && (
              <span className='inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200'>
                Tomorrow
              </span>
            )}
          </div>
        )
      }
    },
    {
      title: 'Product Conversion',
      key: 'conversion',
      render: (_, record) => {
        const sourceProduct =
          record.alloyName ||
          record.sourceProduct ||
          record.sourceproductname ||
          `Alloy ${record.alloyId}`
        const targetProduct =
          record.convertName ||
          record.targetProduct ||
          record.targetproductname ||
          `Convert ${record.convertToAlloyId}`
        return (
          <div className='leading-snug'>
            <div className='text-xs text-slate-500'>{sourceProduct}</div>
            <div className='text-sm font-medium text-slate-800'>
              <span className='text-slate-400 mr-1'>→</span>
              {targetProduct}
            </div>
          </div>
        )
      }
    },
    {
      title: 'Quantity Breakdown',
      key: 'quantity',
      width: 280,
      render: (_, record) => {
        const qt = record.quantityTracking || {}
        const total = record.quantity || 0
        const done = qt.completedQuantity || 0
        const rejected = qt.rejectedQuantity || 0
        const rework = qt.reworkQuantity || 0
        const unallocated = Math.max(0, qt.remainingQuantity ?? 0)
        const inProd = Math.max(
          0,
          total - done - rejected - rework - unallocated
        )
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        const w = n => ({ width: `${total > 0 ? (n / total) * 100 : 0}%` })
        return (
          <div>
            {/* headline: done/total */}
            <div className='flex items-baseline justify-between mb-1'>
              <span className='text-sm font-semibold text-slate-800'>
                {done.toLocaleString()}
                <span className='text-slate-400 font-normal'>
                  {' '}/ {total.toLocaleString()}
                </span>
              </span>
              <span className='text-xs font-medium text-slate-500'>{pct}%</span>
            </div>
            {/* stacked bar — one segment per state */}
            <div className='flex h-2 rounded-full overflow-hidden bg-slate-200'>
              {done > 0 && (
                <div className='bg-green-500' style={w(done)} title={`${done} completed`} />
              )}
              {inProd > 0 && (
                <div className='bg-blue-500' style={w(inProd)} title={`${inProd} in production`} />
              )}
              {rework > 0 && (
                <div className='bg-purple-500' style={w(rework)} title={`${rework} in rework`} />
              )}
              {rejected > 0 && (
                <div className='bg-red-500' style={w(rejected)} title={`${rejected} rejected`} />
              )}
            </div>
            {/* explicit counts — every nonzero state is SAID, not implied */}
            <div className='flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs leading-tight'>
              {inProd > 0 && (
                <span className='text-blue-700'>
                  <span className='inline-block w-2 h-2 rounded-full bg-blue-500 mr-1' />
                  {inProd} in production
                </span>
              )}
              {rework > 0 && (
                <span className='text-purple-700 font-medium'>
                  <span className='inline-block w-2 h-2 rounded-full bg-purple-500 mr-1' />
                  {rework} rework
                </span>
              )}
              {rejected > 0 && (
                <span className='text-red-700 font-medium'>
                  <span className='inline-block w-2 h-2 rounded-full bg-red-500 mr-1' />
                  {rejected} rejected
                </span>
              )}
              {unallocated > 0 && (
                <span className='text-slate-500'>
                  <span className='inline-block w-2 h-2 rounded-full bg-slate-300 mr-1' />
                  {unallocated} unallocated
                </span>
              )}
              {done === total && total > 0 && (
                <span className='text-green-700 font-medium'>
                  <span className='inline-block w-2 h-2 rounded-full bg-green-500 mr-1' />
                  all completed
                </span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      title: 'Job Cards',
      key: 'jobCards',
      dataIndex: 'totalJobCards',
      width: 180,
      sorter: true, // server-side (validSortFields.totalJobCards)
      render: (_, record) => {
        const totalCards = record.totalJobCards || 0
        const activeCards = record.activeJobCards || 0
        const completedCards = record.completedJobCardsStatus || 0

        if (totalCards === 0) {
          return <Tag color='default'>No cards</Tag>
        }

        return (
          <Space size={4}>
            <Tag color='blue'>{totalCards} total</Tag>
            {activeCards > 0 && <Tag color='orange'>{activeCards} active</Tag>}
            {completedCards > 0 && (
              <Tag color='green'>{completedCards} done</Tag>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <div className='flex gap-2'>
          <Button
            type='link'
            size='small'
            icon={<EyeOutlined />}
            onClick={e => {
              e.stopPropagation()
              handleView(record)
            }}
          />
          <Dropdown menu={getActionMenu(record)} trigger={['click']}>
            <Button
              type='link'
              size='small'
              icon={<MoreOutlined />}
              onClick={e => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      )
    }
  ]

  // Old KPI functions removed - using calculateKPIs function defined above

  return (
    <div style={{ width: '100%' }}>
      <PageTitle>Production Plans</PageTitle>

      {/* Status tabs — one glance, one click */}
      <TabBar
        tabs={[
          { key: 'pending', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'rejected', label: 'Has Rejections' },
          { key: '', label: 'All Plans' }
        ]}
        activeKey={filters.status ?? ''}
        onChange={key => handleFilterChange('status', key)}
      />

      {/* KPI row — shared KpiCard (reflects active filters) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16,
          marginBottom: 16
        }}
      >
        <KpiCard
          title="Today's Quantity"
          value={`${(kpis.todayQuantity || 0).toLocaleString()} units`}
          icon={<CalendarOutlined />}
          accentColor='blue'
          subMetric={{
            label: 'Plans created today:',
            value: String(kpis.todayPlansCount || 0)
          }}
        />
        <KpiCard
          title='Unallocated'
          value={`${(kpis.totalUnallocated || 0).toLocaleString()} units`}
          icon={<InboxOutlined />}
          accentColor='orange'
          subMetric={{ label: 'Waiting for job cards', value: '' }}
        />
        <KpiCard
          title='Allocated'
          value={`${(kpis.totalAllocated || 0).toLocaleString()} units`}
          icon={<ThunderboltOutlined />}
          accentColor='green'
          subMetric={{ label: 'Committed to job cards', value: '' }}
        />
        <KpiCard
          title='Urgent Plans'
          value={`${(kpis.urgentPlans || 0).toLocaleString()} / ${(
            kpis.totalPlans || 0
          ).toLocaleString()}`}
          icon={<ExclamationCircleOutlined />}
          accentColor='red'
          subMetric={{ label: 'High priority plans', value: '' }}
        />
      </div>

      {/* Filter bar — shared component (live search, range picker, export) */}
      <FilterBar
        searchText={localSearch}
        onSearchChange={setLocalSearch}
        dateRange={
          filters.dateRange
            ? [moment(filters.dateRange[0]), moment(filters.dateRange[1])]
            : null
        }
        onDateRangeChange={handleDateRangeChange}
        onRefresh={handleSearch}
        loading={loading}
        exportMenuItems={exportMenuItems}
        extraFilters={
          <>
            <Select
              placeholder='Priority'
              value={filters.urgent || undefined}
              onChange={value => handleFilterChange('urgent', value ?? '')}
              options={urgentOptions.filter(o => o.value !== '')}
              style={{ width: 120 }}
              allowClear
            />
            <button
              className='plati-btn-refresh'
              onClick={handleTodayFilter}
              style={
                isTodayFilter
                  ? { borderColor: '#f26c2d', color: '#f26c2d' }
                  : undefined
              }
            >
              <CalendarOutlined style={{ fontSize: 14 }} /> Today
            </button>
            {(searchTerm ||
              filters.urgent ||
              filters.dateRange ||
              isTodayFilter) && (
              <button
                className='plati-btn-refresh'
                onClick={handleClearFilters}
              >
                Clear
              </button>
            )}
            <button className='plati-btn-create' onClick={handleCreatePlan}>
              <PlusOutlined style={{ fontSize: 14 }} /> Create Plan
            </button>
          </>
        }
      />

      {/* Table — antd behavior (expand/sort/paginate) in the plati skin */}
      <div className='plati-antd-card'>
        <Table
          columns={columns}
          dataSource={productionPlans}
          rowKey='id'
          loading={loading}
          onChange={handleTableChange}
          rowClassName={rowClassName}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalPlansCount,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} plans`,
            pageSizeOptions: ['10', '25', '50', '100']
          }}
          expandable={{
            expandedRowKeys,
            onExpand: handleExpand,
            expandedRowRender,
            expandRowByClick: false
          }}
          onRow={record => ({
            onClick: () => handleView(record),
            style: { cursor: 'pointer' }
          })}
        />
      </div>

      {/* plati design-language skin (mirrors Core/Components/DataTable) */}
      <style>{`
        .plati-antd-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0px 1px 2px 0px rgba(0,0,0,0.05);
        }
        .plati-antd-card .ant-table {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #1a1a1a;
        }
        .plati-antd-card .ant-table-thead > tr > th {
          background: #f3f3f5;
          color: rgba(26, 26, 26, 0.6);
          font-weight: 500;
          font-size: 14px;
          border-bottom: 1px solid #e5e5e5;
          height: 40px;
          padding: 10px 16px;
        }
        .plati-antd-card .ant-table-tbody > tr > td {
          padding: 14px 16px;
          border-bottom: 1px solid #f3f4f6;
          color: #1a1a1a;
          font-size: 14px;
        }
        .plati-antd-card .ant-table-tbody > tr:hover > td {
          background: #fafafa;
        }
        .plati-antd-card .ant-pagination {
          padding: 12px 24px;
          margin: 0 !important;
        }
        .plati-btn-create {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f26c2d;
          border: none;
          border-radius: 123px;
          padding: 0 18px;
          height: 40px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          color: white;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .plati-btn-create:hover { background: #e05a1e; }
      `}</style>
    </div>
  )
}

export default ProductionTable
