import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  message,
  Badge,
  Progress
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  TruckOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const DispatchToSales = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [urgentFilter, setUrgentFilter] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const fetchDispatchReadyPlans = async (
    page = 1,
    search = searchText,
    urgent = urgentFilter,
    range = dateRange
  ) => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search,
        urgent,
        dispatchPending: 'true' // Server-side filter for plans with pending quantities at step 11
      }

      if (range && range[0] && range[1]) {
        params.startDate = range[0].format('YYYY-MM-DD')
        params.endDate = range[1].format('YYYY-MM-DD')
      }

      const response = await client.get('/production/plans-with-quantities', {
        params
      })

      // Backend returns productionPlans array and pagination object
      if (response.data.productionPlans) {
        setData(response.data.productionPlans)
        setPagination({
          ...pagination,
          current: page,
          total: response.data.pagination?.totalCount || response.data.productionPlans.length
        })
      }
    } catch (error) {
      console.error('Error fetching dispatch-ready plans:', error)
      message.error('Failed to fetch dispatch-ready production plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDispatchReadyPlans()
  }, [])

  const handleSearch = value => {
    setSearchText(value)
    fetchDispatchReadyPlans(1, value, urgentFilter, dateRange)
  }

  const handleUrgentChange = value => {
    setUrgentFilter(value)
    fetchDispatchReadyPlans(1, searchText, value, dateRange)
  }

  const handleDateChange = range => {
    setDateRange(range)
    fetchDispatchReadyPlans(1, searchText, urgentFilter, range)
  }

  const handleClearFilters = () => {
    setSearchText('')
    setUrgentFilter('')
    setDateRange(null)
    fetchDispatchReadyPlans(1, '', '', null)
  }

  const columns = [
    {
      title: 'Plan ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>#{text}</Text>
          {record.isUrgent === 1 && (
            <Tag color="red" icon={<WarningOutlined />}>
              Urgent
            </Tag>
          )}
        </Space>
      ),
      sorter: (a, b) => a.id - b.id
    },
    {
      title: 'Product Details',
      key: 'product',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.targetProductName || 'N/A'}</Text>
          <Space size={4} wrap>
            <Tag color="blue">{record.targetModelName}</Tag>
            <Tag color="cyan">{record.targetInches}"</Tag>
            <Tag color="green">{record.targetFinish}</Tag>
          </Space>
          {record.sourceProductName && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              From: {record.sourceProductName}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Dispatch Pending',
      key: 'dispatchPending',
      width: 150,
      render: (_, record) => {
        const pendingQty = record.dispatchPendingQuantity || 0
        const totalQty = record.quantity || 0
        const percentage = totalQty > 0 ? (pendingQty / totalQty) * 100 : 0

        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text strong style={{ fontSize: '18px', color: '#ff9800' }}>
                {pendingQty}
              </Text>
              <Text type="secondary">/ {totalQty}</Text>
            </div>
            <Progress
              percent={Number(percentage.toFixed(1))}
              size="small"
              strokeColor={{
                '0%': '#ff9800',
                '100%': '#ff5722'
              }}
              status="active"
              format={percent => `${percent}%`}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Awaiting acceptance
            </Text>
          </Space>
        )
      },
      sorter: (a, b) =>
        (a.dispatchPendingQuantity || 0) - (b.dispatchPendingQuantity || 0)
    },
    {
      title: 'Production Progress',
      key: 'progress',
      width: 180,
      render: (_, record) => {
        const completed = record.completedQuantity || 0
        const total = record.quantity || 0
        const percentage = total > 0 ? (completed / total) * 100 : 0

        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>
                {completed} / {total}
              </Text>
            </Space>
            <Progress
              percent={Number(percentage.toFixed(1))}
              size="small"
              status={percentage === 100 ? 'success' : 'active'}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.completedJobCardsStatus || 0} / {record.totalJobCards || 0}{' '}
              cards done
            </Text>
          </Space>
        )
      }
    },
    {
      title: 'Quality',
      key: 'quality',
      width: 120,
      render: (_, record) => {
        const accepted = record.acceptedQuantity || 0
        const rejected = record.rejectedQuantity || 0
        const total = accepted + rejected
        const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0

        return (
          <Space direction="vertical" size={4}>
            <Space>
              <Badge status="success" />
              <Text>{accepted} accepted</Text>
            </Space>
            {rejected > 0 && (
              <Space>
                <Badge status="error" />
                <Text type="danger">{rejected} rejected</Text>
              </Space>
            )}
            {total > 0 && (
              <Tag color={acceptanceRate >= 95 ? 'green' : 'orange'}>
                {acceptanceRate.toFixed(1)}% Pass
              </Tag>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Timeline',
      key: 'timeline',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Created: {moment(record.createdAt).format('DD MMM YYYY')}
          </Text>
          {record.completedAt && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Completed: {moment(record.completedAt).format('DD MMM YYYY')}
            </Text>
          )}
          <Text strong style={{ fontSize: '12px' }}>
            {moment(record.createdAt).fromNow()}
          </Text>
        </Space>
      ),
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix()
    },
    {
      title: 'Current Step',
      key: 'currentStep',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tag color="processing">{record.currentStepName || 'N/A'}</Tag>
          {record.avgProgressPercentage && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Avg: {Number(record.avgProgressPercentage).toFixed(0)}% complete
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            size="small"
            block
            onClick={() => handleDispatchToWarehouse(record)}
          >
            Accept & Dispatch
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            View Details
          </Button>
        </Space>
      )
    }
  ]

  const handleDispatchToWarehouse = record => {
    message.info(
      `${record.dispatchPendingQuantity} units pending acceptance at dispatch step...`
    )
    // TODO: Implement accept/dispatch logic
    // This would:
    // 1. Accept the pending quantity (move from pending_quantity to accepted_quantity)
    // 2. Add stock to alloy_master.in_house_stock
    // 3. Update job card status
    // 4. Create stock movement record
  }

  const handleViewDetails = record => {
    message.info(`Viewing details for Plan #${record.id}`)
    // TODO: Navigate to plan details page or open modal
  }

  // Calculate summary statistics
  const summaryStats = {
    totalPlans: data.length,
    totalPendingUnits: data.reduce(
      (sum, item) => sum + (item.dispatchPendingQuantity || 0),
      0
    ),
    urgentPlans: data.filter(item => item.isUrgent === 1).length,
    fullyPendingPlans: data.filter(
      item =>
        item.dispatchPendingQuantity >= item.quantity &&
        item.dispatchPendingQuantity > 0
    ).length
  }

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}
          >
            <Space align="center">
              <RocketOutlined
                style={{ fontSize: '24px', color: '#1890ff' }}
              />
              <Title level={3} style={{ margin: 0 }}>
                Dispatch to Sales - Pending Acceptance
              </Title>
            </Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => fetchDispatchReadyPlans(pagination.current)}
            >
              Refresh
            </Button>
          </div>
        </Col>

        {/* Summary Statistics */}
        <Col span={24}>
          <Card bordered={false} className="shadow-sm">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Plans Pending"
                  value={summaryStats.totalPlans}
                  prefix={<TruckOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Pending Units"
                  value={summaryStats.totalPendingUnits}
                  suffix="units"
                  valueStyle={{ color: '#ff9800' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Urgent Plans"
                  value={summaryStats.urgentPlans}
                  prefix={<WarningOutlined />}
                  valueStyle={{
                    color: summaryStats.urgentPlans > 0 ? '#ff4d4f' : '#8c8c8c'
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Fully At Dispatch"
                  value={summaryStats.fullyPendingPlans}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#ff9800' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Filters */}
        <Col span={24}>
          <Card bordered={false} className="shadow-sm" bodyStyle={{ padding: '16px' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <Text
                  type="secondary"
                  strong
                  style={{
                    fontSize: '12px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}
                >
                  Search
                </Text>
                <Search
                  placeholder="Search Product, Model, Finish..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  onSearch={handleSearch}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ flex: '0 0 150px' }}>
                <Text
                  type="secondary"
                  strong
                  style={{
                    fontSize: '12px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}
                >
                  Priority
                </Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="All"
                  value={urgentFilter}
                  onChange={handleUrgentChange}
                  allowClear
                >
                  <Option value="1">Urgent Only</Option>
                  <Option value="0">Normal</Option>
                </Select>
              </div>

              <div style={{ flex: '1 1 280px' }}>
                <Text
                  type="secondary"
                  strong
                  style={{
                    fontSize: '12px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}
                >
                  Date Range
                </Text>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={handleDateChange}
                  format="DD-MM-YYYY"
                />
              </div>

              <div style={{ paddingTop: '20px' }}>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                  disabled={!searchText && !urgentFilter && !dateRange}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* Table */}
        <Col span={24}>
          <Card bordered={false} className="shadow-sm">
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey="id"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: total => `Total ${total} dispatch-ready plans`,
                onChange: page => fetchDispatchReadyPlans(page)
              }}
              scroll={{ x: 1500 }}
              locale={{
                emptyText: (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <TruckOutlined
                      style={{ fontSize: '48px', color: '#d9d9d9' }}
                    />
                    <div style={{ marginTop: '16px' }}>
                      <Text type="secondary">
                        No production plans ready for dispatch
                      </Text>
                    </div>
                  </div>
                )
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DispatchToSales
