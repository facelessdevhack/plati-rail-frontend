import React from 'react'
import {
  Table,
  Button,
  Dropdown,
  Tag,
  Input,
  Select,
  DatePicker,
  Space,
  Card,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  EyeOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  PlusOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import moment from 'moment'

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

  console.log('🔍 ProductionTable Debug - totalKPIs from Redux:', totalKPIs)
  console.log('🔍 ProductionTable Debug - kpis used for display:', kpis)
  console.log('🔍 ProductionTable Debug - kpisLoading:', kpisLoading)

  // Get deadline urgency status for a production plan (using API-provided data)
  const getDeadlineStatus = record => {
    const deadlineInfo = record.deadlineInfo || {}

    console.log(`🔍 Plan #${record.id} deadlineInfo:`, {
      deadlineInfo,
      earliestDeadline: deadlineInfo.earliestDeadline,
      status: deadlineInfo.status,
      overdueCount: deadlineInfo.overdueCount,
      dueTodayCount: deadlineInfo.dueTodayCount,
      urgentCount: deadlineInfo.urgentCount,
      today: moment().format('YYYY-MM-DD')
    })

    // Map API status to component status
    const apiStatus = deadlineInfo.status || 'none'

    // Calculate days remaining if we have an earliest deadline
    let daysRemaining = null
    let closestDeadline = null

    if (deadlineInfo.earliestDeadline) {
      closestDeadline = moment(deadlineInfo.earliestDeadline)
      daysRemaining = closestDeadline.diff(moment(), 'days')

      console.log(`📅 Plan #${record.id} deadline calculation:`, {
        deadline: deadlineInfo.earliestDeadline,
        today: moment().format('YYYY-MM-DD'),
        daysRemaining,
        apiStatus
      })
    }

    // Map API status values to component status values
    const statusMap = {
      'overdue': 'delayed',
      'due_today': 'today',
      'urgent': 'urgent',
      'normal': 'upcoming',
      'none': 'none'
    }

    const mappedStatus = statusMap[apiStatus] || 'none'

    console.log(`✅ Plan #${record.id} final status: ${apiStatus} → ${mappedStatus}`)

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
      sorter: (a, b) => (a.id || 0) - (b.id || 0),
      render: (id, record) => {
        const deadlineInfo = getDeadlineStatus(record)
        return (
          <div>
            {console.log(deadlineInfo, 'DEADLINE INFO')}
            <span className='font-semibold'>#{id}</span>
            {deadlineInfo.status === 'delayed' && (
              <div className='mt-1'>
                <Tag color='red' size='small' className='text-xs'>
                  ⚠️ DELAYED
                </Tag>
              </div>
            )}
            {deadlineInfo.status === 'today' && (
              <div className='mt-1'>
                <Tag color='red' size='small' className='text-xs'>
                  📅 TODAY
                </Tag>
              </div>
            )}
            {deadlineInfo.status === 'urgent' && (
              <div className='mt-1'>
                <Tag color='orange' size='small' className='text-xs'>
                  ⏰ DUE SOON
                </Tag>
              </div>
            )}
            {deadlineInfo.status === 'upcoming' && (
              <div className='mt-1'>
                <Tag color='gold' size='small' className='text-xs'>
                  📅 UPCOMING
                </Tag>
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: createdAt => (
        <span>{moment(createdAt).format('MMM DD, YYYY')}</span>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'urgent',
      key: 'urgent',
      width: 100,
      render: urgent =>
        urgent ? (
          <Tag color='red'>URGENT</Tag>
        ) : (
          <Tag color='default'>Normal</Tag>
        )
    },
    {
      title: 'Source Alloy',
      key: 'sourceAlloy',
      render: (_, record) => {
        const sourceProduct =
          record.alloyName ||
          record.sourceProduct ||
          record.sourceproductname ||
          `Alloy ${record.alloyId}`
        return <span>{sourceProduct}</span>
      }
    },
    {
      title: 'Target Alloy',
      key: 'targetAlloy',
      render: (_, record) => {
        const targetProduct =
          record.convertName ||
          record.targetProduct ||
          record.targetproductname ||
          `Convert ${record.convertToAlloyId}`
        return <span>{targetProduct}</span>
      }
    },
    {
      title: (
        <span>
          Pending / <span className='text-red-600'>Rejected</span> / Total
        </span>
      ),
      key: 'quantity',
      width: 200,
      render: (_, record) => {
        const inProgressQuantity =
          record.quantityTracking.inProgressQuantity || 0
        const rejectedQuantity = record.quantityTracking.rejectedQuantity || 0
        const total = record.quantity || 0
        const deadlineInfo = getDeadlineStatus(record)
        console.log(record, 'RECORD')
        return (
          <div>
            <div>
              <span className='font-semibold' title="In Progress">
                {inProgressQuantity.toLocaleString()}
              </span>
              <span className='text-gray-400'> / </span>
              {rejectedQuantity > 0 ? (
                <>
                  <span 
                    className='font-bold text-red-600' 
                    style={{ color: '#cf1322' }} 
                    title="Rejected"
                  >
                    {rejectedQuantity.toLocaleString()}
                  </span>
                  <span className='text-gray-400'> / </span>
                </>
              ) : (
                <>
                   <span className='text-gray-300' title="Rejected">0</span>
                   <span className='text-gray-400'> / </span>
                </>
              )}
              <span className='font-semibold' title="Total Plan Quantity">{total.toLocaleString()}</span>
            </div>
            {deadlineInfo.closestDeadline && (
              <div className='mt-1'>
                {deadlineInfo.status === 'delayed' && (
                  <span className='text-xs text-red-600 font-medium'>
                    ⚠️ Delayed by {Math.abs(deadlineInfo.daysRemaining)} {Math.abs(deadlineInfo.daysRemaining) === 1 ? 'day' : 'days'}
                  </span>
                )}
                {deadlineInfo.status === 'today' && (
                  <span className='text-xs text-red-600 font-medium'>
                    📅 To be delivered today
                  </span>
                )}
                {deadlineInfo.status === 'urgent' && (
                  <span className='text-xs text-orange-600 font-medium'>
                    ⏰ Due in {deadlineInfo.daysRemaining} {deadlineInfo.daysRemaining === 1 ? 'day' : 'days'}
                  </span>
                )}
                {deadlineInfo.status === 'upcoming' && (
                  <span className='text-xs text-yellow-600 font-medium'>
                    📅 {deadlineInfo.closestDeadline.format('MMM DD')}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: 'Job Cards',
      key: 'jobCards',
      dataIndex: 'totalJobCards',
      width: 180,
      sorter: (a, b) => (a.totalJobCards || 0) - (b.totalJobCards || 0),
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
    <div className='space-y-4'>
      {/* KPI Cards */}
      <div className='space-y-3'>
        {/* KPI Header */}
        <div className='flex justify-between items-center'>
          <h3 className='text-lg font-semibold text-gray-800'>
            Production Overview (All Production Plans)
          </h3>
          <div className='flex items-center gap-3 text-xs text-gray-500'>
            {kpisLoading && (
              <span className='text-blue-500'>Updating KPIs...</span>
            )}
            {lastKPIUpdate && (
              <span>
                Last updated: {moment(lastKPIUpdate).format('MMM DD, HH:mm')}
              </span>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Today's Quantity */}
          <Card className='text-center' loading={kpisLoading}>
            <Statistic
              title={<span className='text-gray-600'>Today's Quantity</span>}
              value={kpis.todayQuantity}
              suffix='units'
              valueStyle={{ color: '#1890ff' }}
              prefix={<CheckCircleOutlined />}
            />
            <div className='text-xs text-gray-500 mt-2'>
              {kpis.todayPlansCount || 0} plans created today
            </div>
          </Card>

          {/* Unallocated Quantity */}
          <Card className='text-center' loading={kpisLoading}>
            <Statistic
              title={
                <span className='text-gray-600'>Unallocated Quantity</span>
              }
              value={kpis.totalUnallocated}
              suffix='units'
              valueStyle={{ color: '#faad14' }}
              prefix={<InboxOutlined />}
            />
            <div className='text-xs text-gray-500 mt-2'>
              Available for job cards
            </div>
          </Card>

          {/* Allocated Quantity */}
          <Card className='text-center' loading={kpisLoading}>
            <Statistic
              title={<span className='text-gray-600'>Allocated Quantity</span>}
              value={kpis.totalAllocated}
              suffix='units'
              valueStyle={{ color: '#52c41a' }}
              prefix={<ThunderboltOutlined />}
            />
            <div className='text-xs text-gray-500 mt-2'>
              {kpis.completionRate || 0}% completion rate
            </div>
          </Card>

          {/* Urgent Plans */}
          <Card className='text-center' loading={kpisLoading}>
            <Statistic
              title={<span className='text-gray-600'>Urgent Plans</span>}
              value={kpis.urgentPlans || 0}
              suffix={`/ ${kpis.totalPlans || 0}`}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
            <div className='text-xs text-gray-500 mt-2'>
              High priority plans
            </div>
          </Card>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className='bg-white p-4 rounded-lg border border-gray-200'>
        <div className='flex flex-wrap gap-3 items-center'>
          {/* Search */}
          <Input
            placeholder='Search production plans...'
            prefix={<SearchOutlined />}
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            style={{ width: 300 }}
          />

          {/* Today Filter */}
          <Button
            type={isTodayFilter ? 'primary' : 'default'}
            icon={<CalendarOutlined />}
            onClick={handleTodayFilter}
          >
            Today
          </Button>

          {/* Date Range */}
          <RangePicker
            value={
              filters.dateRange
                ? [moment(filters.dateRange[0]), moment(filters.dateRange[1])]
                : null
            }
            onChange={handleDateRangeChange}
            placeholder={['Start Date', 'End Date']}
            disabled={isTodayFilter}
          />

          {/* Priority Filter */}
          <Select
            placeholder='Priority'
            value={filters.urgent}
            onChange={value => handleFilterChange('urgent', value)}
            options={urgentOptions}
            style={{ width: 150 }}
            allowClear
          />

          {/* Status Filter */}
          <Select
            placeholder='Status'
            value={filters.status}
            onChange={value => handleFilterChange('status', value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'completed', label: 'Completed' }
            ]}
            style={{ width: 150 }}
            allowClear
          />

          {/* Clear Filters */}
          {(searchTerm ||
            filters.urgent ||
            filters.status ||
            filters.dateRange ||
            isTodayFilter) && (
            <Button onClick={handleClearFilters}>Clear Filters</Button>
          )}

          {/* Actions - Right Side */}
          <div className='ml-auto flex gap-2'>
            <Dropdown
              menu={{ items: exportMenuItems }}
              trigger={['click']}
              disabled={productionPlans.length === 0}
            >
              <Button
                icon={<DownloadOutlined />}
                disabled={productionPlans.length === 0}
              >
                Export
              </Button>
            </Dropdown>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleCreatePlan}
            >
              Create Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
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
  )
}

export default ProductionTable
