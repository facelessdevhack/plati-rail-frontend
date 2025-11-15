import React, { useState, useEffect } from 'react'
import { Card, Statistic, Table, Tag, Spin, DatePicker, Button, notification, Space, Row, Col, Tooltip } from 'antd'
import {
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  WarningOutlined,
  FileTextOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'

const { RangePicker } = DatePicker

const ImprovedAdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [dateRange, setDateRange] = useState([
    moment().subtract(25, 'days'),
    moment()
  ])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      const startDate = dateRange[0].format('YYYY-MM-DD')
      const endDate = dateRange[1].format('YYYY-MM-DD')

      const response = await client.get(
        `/dashboard/admin-kpis?startDate=${startDate}&endDate=${endDate}`
      )

      if (response.data.success) {
        setDashboardData(response.data.data)
      }

      if (showRefresh) {
        notification.success({
          message: 'Dashboard Refreshed',
          description: 'All metrics have been updated successfully.',
          placement: 'topRight'
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      notification.error({
        message: 'Error Loading Dashboard',
        description: 'Failed to load dashboard data. Please try again.',
        placement: 'topRight'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Quick date range shortcuts
  const handleQuickDateRange = (range) => {
    let start, end
    switch (range) {
      case 'today':
        start = moment()
        end = moment()
        break
      case 'yesterday':
        start = moment().subtract(1, 'days')
        end = moment().subtract(1, 'days')
        break
      case 'thisWeek':
        start = moment().startOf('week')
        end = moment().endOf('week')
        break
      case 'thisMonth':
        start = moment().startOf('month')
        end = moment().endOf('month')
        break
      case 'last3Months':
        start = moment().subtract(3, 'months')
        end = moment()
        break
      default:
        return
    }
    setDateRange([start, end])
  }

  // Professional KPI Card Component
  const KPICard = ({ title, value, growth, icon: Icon, prefix = '', suffix = '', color = '#1890ff' }) => {
    const isPositive = parseFloat(growth) >= 0

    return (
      <Card
        bordered={false}
        className="shadow-sm hover:shadow-md transition-shadow"
      >
        <Statistic
          title={title}
          value={value}
          prefix={<Icon style={{ color, fontSize: '24px', marginRight: '8px' }} />}
          suffix={suffix}
          valueStyle={{ color: '#262626', fontSize: '28px', fontWeight: 600 }}
        />
        {growth !== undefined && (
          <div className="mt-2 flex items-center">
            {isPositive ? (
              <RiseOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
            ) : (
              <FallOutlined style={{ color: '#ff4d4f', marginRight: '4px' }} />
            )}
            <span style={{
              color: isPositive ? '#52c41a' : '#ff4d4f',
              fontSize: '14px',
              fontWeight: 500
            }}>
              {Math.abs(growth)}%
            </span>
            <span style={{ color: '#8c8c8c', marginLeft: '6px', fontSize: '12px' }}>
              vs last period
            </span>
          </div>
        )}
      </Card>
    )
  }

  // Top Products Table Columns
  const productColumns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 70,
      align: 'center',
      render: (_, __, index) => (
        <span style={{
          fontWeight: 600,
          color: index < 3 ? '#1890ff' : '#595959',
          fontSize: '16px'
        }}>
          #{index + 1}
        </span>
      )
    },
    {
      title: 'Product Details',
      dataIndex: 'productName',
      key: 'productName',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#262626', marginBottom: '4px' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.modelName} • Code: {record.productCode}
          </div>
        </div>
      )
    },
    {
      title: 'Quantity Sold',
      dataIndex: 'totalQuantitySold',
      key: 'totalQuantitySold',
      align: 'center',
      render: (qty) => (
        <span style={{ fontWeight: 600, fontSize: '16px' }}>
          {qty.toLocaleString()}
        </span>
      ),
      sorter: (a, b) => a.totalQuantitySold - b.totalQuantitySold
    },
    {
      title: 'Revenue',
      dataIndex: 'totalAmountSold',
      key: 'totalAmountSold',
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 600, fontSize: '16px', color: '#52c41a' }}>
          ₹{amount.toLocaleString()}
        </span>
      ),
      sorter: (a, b) => a.totalAmountSold - b.totalAmountSold
    },
    {
      title: 'Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      align: 'center',
      render: (orders) => (
        <Tag color="blue">{orders} orders</Tag>
      )
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      align: 'center',
      render: (stock) => {
        const isLow = stock < 100
        return (
          <Tag color={isLow ? 'red' : 'green'}>
            {stock} units
          </Tag>
        )
      }
    },
    {
      title: 'Avg Order Value',
      dataIndex: 'avgOrderValue',
      key: 'avgOrderValue',
      align: 'right',
      render: (avg) => (
        <span style={{ color: '#595959' }}>
          ₹{avg.toLocaleString()}
        </span>
      )
    }
  ]

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Spin size='large' tip='Loading dashboard data...' />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className='flex items-center justify-center h-96'>
        <p className='text-gray-500'>No data available</p>
      </div>
    )
  }

  const { kpis, topProducts } = dashboardData

  return (
    <div className='p-6 bg-gray-50'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex justify-between items-center mb-4'>
          <div>
            <h1 className='text-2xl font-semibold text-gray-900 mb-1'>
              Admin Dashboard
            </h1>
            <p className='text-gray-600'>
              Sales performance and key metrics overview
            </p>
          </div>

          <Space size="middle">
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: 280 }}
            />
            <Button
              type='primary'
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => fetchDashboardData(true)}
              loading={refreshing}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Quick Date Range Buttons */}
        <div className='flex items-center gap-2'>
          <span className='text-sm text-gray-600 mr-2'>Quick Select:</span>
          <Space size="small">
            <Button
              size="small"
              onClick={() => handleQuickDateRange('today')}
            >
              Today
            </Button>
            <Button
              size="small"
              onClick={() => handleQuickDateRange('yesterday')}
            >
              Yesterday
            </Button>
            <Button
              size="small"
              onClick={() => handleQuickDateRange('thisWeek')}
            >
              This Week
            </Button>
            <Button
              size="small"
              onClick={() => handleQuickDateRange('thisMonth')}
            >
              This Month
            </Button>
            <Button
              size="small"
              onClick={() => handleQuickDateRange('last3Months')}
            >
              Last 3 Months
            </Button>
          </Space>
        </div>

        {/* Info Banner */}
        <div style={{
          background: '#e6f7ff',
          border: '1px solid #91d5ff',
          borderRadius: '4px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          marginTop: '12px'
        }}>
          <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '16px', marginRight: '8px' }} />
          <span style={{ fontSize: '13px', color: '#262626' }}>
            <strong>Sales Amount</strong> is calculated as the sum of all entry prices (SUM of price field from entry_master).
            <strong> Default range:</strong> Last 25 days. Use quick select buttons or date picker to change the period.
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} className='mb-6'>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title='Sales Quantity'
            value={kpis.salesQuantity.value}
            growth={kpis.salesQuantity.growth}
            icon={ShoppingCartOutlined}
            suffix=' units'
            color='#1890ff'
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title='Sales Amount'
            value={kpis.salesAmount.value}
            growth={kpis.salesAmount.growth}
            icon={DollarOutlined}
            prefix='₹'
            color='#52c41a'
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title='Lost Sales (Pending)'
            value={kpis.lostSales.quantity}
            icon={WarningOutlined}
            suffix=' units'
            color='#faad14'
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title='Total Orders'
            value={kpis.totalOrders}
            icon={FileTextOutlined}
            color='#722ed1'
          />
        </Col>
      </Row>

      {/* Lost Sales Details Card */}
      <Card
        title={
          <span>
            <WarningOutlined style={{ color: '#faad14', marginRight: '8px' }} />
            Lost Sales Details
          </span>
        }
        bordered={false}
        className='mb-6 shadow-sm'
      >
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Statistic
              title="Units Lost"
              value={kpis.lostSales.quantity}
              valueStyle={{ color: '#faad14' }}
              suffix="units"
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Revenue Lost"
              value={kpis.lostSales.amount}
              valueStyle={{ color: '#ff4d4f' }}
              prefix="₹"
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Pending Orders"
              value={kpis.lostSales.ordersCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Top Selling Products Table */}
      <Card
        title={
          <span style={{ fontSize: '16px', fontWeight: 600 }}>
            Top Selling Products
          </span>
        }
        extra={
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            Best performing products by quantity sold
          </span>
        }
        bordered={false}
        className='shadow-sm'
      >
        <Table
          columns={productColumns}
          dataSource={topProducts}
          rowKey='productId'
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  )
}

export default ImprovedAdminDashboard
