import React, { useState, useMemo } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Select,
  Typography,
  Alert,
  Spin,
  Divider,
  Tooltip,
  Badge,
  Progress,
  Avatar,
  List,
  Empty,
  Tabs
} from 'antd'
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ShopOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined,
  EyeOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  CalendarOutlined,
  TeamOutlined,
  ProductOutlined
} from '@ant-design/icons'
import { Line, Column, Pie } from '@ant-design/plots'
import { useAdminDashboard } from '../../hooks/useAdminDashboard'
import moment from 'moment'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

const AdminSalesDashboard = () => {
  // Calculate yesterday's date range for initial filters
  const getYesterdayDateRange = () => {
    const yesterday = moment().subtract(1, 'day')
    return {
      startDate: yesterday.format('YYYY-MM-DD'),
      endDate: yesterday.format('YYYY-MM-DD')
    }
  }

  // Utility function to format currency amounts
  const formatAmount = value => {
    const num = parseFloat(value)
    if (num >= 10000000) {
      // 1 Crore
      return `₹${(num / 10000000).toFixed(2)}Cr`
    } else if (num >= 100000) {
      // 1 Lakh
      return `₹${(num / 100000).toFixed(2)}L`
    } else if (num >= 1000) {
      // 1 Thousand
      return `₹${(num / 1000).toFixed(2)}K`
    } else {
      return `₹${num.toLocaleString()}`
    }
  }

  const {
    data,
    loading,
    error,
    filters,
    setDateRange,
    setChartPeriod,
    setDealerFilter,
    setProductFilter,
    refresh,
    clearFilters
  } = useAdminDashboard(getYesterdayDateRange())

  const [selectedPeriod, setSelectedPeriod] = useState('yesterday')

  // Calculate date ranges for different periods
  const getDateRange = period => {
    const today = moment()
    let startDate, endDate

    switch (period) {
      case 'today':
        startDate = today.clone().startOf('day')
        endDate = today.clone().endOf('day')
        break
      case 'yesterday':
        startDate = today.clone().subtract(1, 'day').startOf('day')
        endDate = today.clone().subtract(1, 'day').endOf('day')
        break
      case 'thisWeek':
        startDate = today.clone().startOf('week')
        endDate = today.clone().endOf('week')
        break
      case 'thisMonth':
        startDate = today.clone().startOf('month')
        endDate = today.clone().endOf('month')
        break
      case '3months':
        startDate = today.clone().subtract(3, 'months').startOf('day')
        endDate = today.clone().endOf('day')
        break
      default:
        startDate = today.clone().startOf('day')
        endDate = today.clone().endOf('day')
    }

    return {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD')
    }
  }

  // Handle period tab change
  const handlePeriodChange = period => {
    setSelectedPeriod(period)
    const dateRange = getDateRange(period)
    setDateRange(dateRange.startDate, dateRange.endDate)
  }

  // Initialize with yesterday's date range
  React.useEffect(() => {
    const dateRange = getDateRange('yesterday')
    setDateRange(dateRange.startDate, dateRange.endDate)
  }, [])

  // KPI Cards Component
  const KPICards = () => {
    if (!data?.kpis) return null

    const { totalSales } = data.kpis

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Total Sales Quantity'
              value={totalSales.quantity}
              prefix={<ShoppingCartOutlined />}
              suffix='units'
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type='secondary'>Growth vs Previous Period: </Text>
              <Text
                style={{
                  color: totalSales.quantityGrowth >= 0 ? '#3f8600' : '#cf1322'
                }}
              >
                {totalSales.quantityGrowth >= 0 ? (
                  <CaretUpOutlined />
                ) : (
                  <CaretDownOutlined />
                )}
                {Math.abs(totalSales.quantityGrowth)}%
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Total Sales Amount'
              value={totalSales.amount}
              prefix={<DollarOutlined />}
              formatter={formatAmount}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type='secondary'>Growth vs Previous Period: </Text>
              <Text
                style={{
                  color: totalSales.amountGrowth >= 0 ? '#3f8600' : '#cf1322'
                }}
              >
                {totalSales.amountGrowth >= 0 ? (
                  <CaretUpOutlined />
                ) : (
                  <CaretDownOutlined />
                )}
                {Math.abs(totalSales.amountGrowth)}%
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Total Orders'
              value={totalSales.orders}
              prefix={<ShopOutlined />}
              suffix='orders'
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type='secondary'>Growth vs Previous Period: </Text>
              <Text
                style={{
                  color: totalSales.ordersGrowth >= 0 ? '#3f8600' : '#cf1322'
                }}
              >
                {totalSales.ordersGrowth >= 0 ? (
                  <CaretUpOutlined />
                ) : (
                  <CaretDownOutlined />
                )}
                {Math.abs(totalSales.ordersGrowth)}%
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Average Order Value'
              value={totalSales.avgOrderValue}
              prefix={<DollarOutlined />}
              precision={2}
              formatter={value => {
                const num = parseFloat(value)
                if (num >= 10000000) {
                  // 1 Crore
                  return `₹${(num / 10000000).toFixed(2)}Cr`
                } else if (num >= 100000) {
                  // 1 Lakh
                  return `₹${(num / 100000).toFixed(2)}L`
                } else if (num >= 1000) {
                  // 1 Thousand
                  return `₹${(num / 1000).toFixed(2)}K`
                } else {
                  return `₹${num.toLocaleString()}`
                }
              }}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type='secondary'>Avg Qty: </Text>
              <Text strong>{totalSales.avgOrderQuantity} units/order</Text>
            </div>
          </Card>
        </Col>
      </Row>
    )
  }

  // Sales Trend Chart
  const SalesTrendChart = () => {
    if (!data?.charts?.salesTrend) return null

    const { salesTrend } = data.charts

    const chartData = salesTrend.labels.map((label, index) => ({
      date: label,
      quantity: salesTrend.datasets.quantity[index],
      amount: salesTrend.datasets.amount[index],
      orders: salesTrend.datasets.orders[index]
    }))

    const config = {
      data: chartData,
      xField: 'date',
      yField: 'amount',
      seriesField: 'type',
      smooth: true,
      animation: {
        appear: {
          animation: 'path-in',
          duration: 1000
        }
      }
    }

    return (
      <Card
        title='Sales Trend'
        extra={
          <Select
            value={filters.chartPeriod}
            onChange={setChartPeriod}
            style={{ width: 120 }}
          >
            <Option value='daily'>Daily</Option>
            <Option value='weekly'>Weekly</Option>
            <Option value='monthly'>Monthly</Option>
          </Select>
        }
      >
        <Line {...config} height={300} />
      </Card>
    )
  }

  // Product Category Breakdown Chart
  const ProductCategoryChart = () => {
    if (!data?.charts?.productCategoryBreakdown) return null

    const { productCategoryBreakdown } = data.charts

    const chartData = productCategoryBreakdown.labels.map((label, index) => ({
      category: label,
      value: productCategoryBreakdown.datasets.amount[index],
      quantity: productCategoryBreakdown.datasets.quantity[index]
    }))

    const config = {
      data: chartData,
      angleField: 'value',
      colorField: 'category',
      radius: 0.8,
      label: {
        type: 'outer',
        content: '{name}\n₹{value}'
      },
      interactions: [{ type: 'element-active' }]
    }

    return (
      <Card title='Product Category Breakdown'>
        <Pie {...config} height={300} />
      </Card>
    )
  }

  // Dealer Type Analysis Chart
  const DealerTypeChart = () => {
    if (!data?.charts?.dealerTypeBreakdown) return null

    const { dealerTypeBreakdown } = data.charts

    const chartData = dealerTypeBreakdown.labels.map((label, index) => ({
      type: label,
      amount: dealerTypeBreakdown.datasets.amount[index],
      quantity: dealerTypeBreakdown.datasets.quantity[index],
      dealers: dealerTypeBreakdown.datasets.dealerCount[index]
    }))

    const config = {
      data: chartData,
      xField: 'type',
      yField: 'amount',
      columnStyle: {
        radius: [4, 4, 0, 0]
      },
      meta: {
        amount: {
          formatter: v => `₹${v.toLocaleString()}`
        }
      }
    }

    return (
      <Card title='Dealer Type Analysis'>
        <Column {...config} height={300} />
      </Card>
    )
  }

  // Top Products Table
  const TopProductsTable = () => {
    if (!data?.topLists?.topProducts) return null

    const columns = [
      {
        title: 'Rank',
        dataIndex: 'rank',
        key: 'rank',
        width: 60,
        render: (_, __, index) => (
          <Badge
            count={index + 1}
            style={{ backgroundColor: index < 3 ? '#faad14' : '#d9d9d9' }}
          />
        )
      },
      {
        title: 'Product',
        dataIndex: 'productName',
        key: 'productName',
        render: (text, record) => (
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type='secondary' style={{ fontSize: '12px' }}>
              {record.alloyName} | {record.size}
            </Text>
          </div>
        )
      },
      {
        title: 'Brand',
        dataIndex: 'brand',
        key: 'brand',
        render: text => <Tag color='blue'>{text}</Tag>
      },
      {
        title: 'Quantity Sold',
        dataIndex: 'totalQuantitySold',
        key: 'totalQuantitySold',
        render: value => <Text strong>{value.toLocaleString()}</Text>
      },
      {
        title: 'Amount Sold',
        dataIndex: 'totalAmountSold',
        key: 'totalAmountSold',
        render: value => <Text strong>₹{value.toLocaleString()}</Text>
      },
      {
        title: 'Avg Price',
        dataIndex: 'avgPrice',
        key: 'avgPrice',
        render: value => `₹${value.toLocaleString()}`
      },
      {
        title: 'Orders',
        dataIndex: 'totalOrders',
        key: 'totalOrders'
      }
    ]

    return (
      <Card
        title='Top Selling Products'
        extra={
          <Button icon={<EyeOutlined />} type='link'>
            View All
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data.topLists.topProducts}
          rowKey='productId'
          pagination={false}
          size='small'
        />
      </Card>
    )
  }

  // Top Dealers Table
  const TopDealersTable = () => {
    if (!data?.topLists?.topDealers) return null

    const columns = [
      {
        title: 'Rank',
        dataIndex: 'rank',
        key: 'rank',
        width: 60,
        render: (_, __, index) => (
          <Badge
            count={index + 1}
            style={{ backgroundColor: index < 3 ? '#faad14' : '#d9d9d9' }}
          />
        )
      },
      {
        title: 'Dealer',
        dataIndex: 'dealerName',
        key: 'dealerName',
        render: (text, record) => (
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type='secondary' style={{ fontSize: '12px' }}>
              {record.city}, {record.state}
            </Text>
          </div>
        )
      },
      {
        title: 'Type',
        dataIndex: 'dealerType',
        key: 'dealerType',
        render: text => <Tag color='green'>{text}</Tag>
      },
      {
        title: 'Total Purchase',
        dataIndex: 'totalAmountPurchased',
        key: 'totalAmountPurchased',
        render: value => <Text strong>₹{value.toLocaleString()}</Text>
      },
      {
        title: 'Quantity',
        dataIndex: 'totalQuantityPurchased',
        key: 'totalQuantityPurchased',
        render: value => <Text strong>{value.toLocaleString()}</Text>
      },
      {
        title: 'Orders',
        dataIndex: 'totalOrders',
        key: 'totalOrders'
      },
      {
        title: 'Avg Order Value',
        dataIndex: 'avgOrderValue',
        key: 'avgOrderValue',
        render: value => `₹${value.toLocaleString()}`
      }
    ]

    return (
      <Card
        title='Top Performing Dealers'
        extra={
          <Button icon={<EyeOutlined />} type='link'>
            View All
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data.topLists.topDealers}
          rowKey='dealerId'
          pagination={false}
          size='small'
        />
      </Card>
    )
  }

  // Additional Statistics
  const AdditionalStats = () => {
    if (!data?.kpis?.totalSales) return null

    const { totalSales } = data.kpis

    return (
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title='Active Dealers'
              value={totalSales.totalDealers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title='Products Sold'
              value={totalSales.totalProducts}
              prefix={<ProductOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title='Avg Qty Per Order'
              value={totalSales.avgOrderQuantity}
              precision={2}
              suffix='units'
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
      </Row>
    )
  }

  if (loading && !data) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size='large' />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading dashboard data...</Text>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message='Error Loading Dashboard'
          description={error}
          type='error'
          showIcon
          action={
            <Button size='small' type='primary' onClick={refresh}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Admin Sales Dashboard
          </Title>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Button icon={<ExportOutlined />}>Export</Button>
          </Space>
        </div>

        {/* Period Tabs */}
        <Tabs
          activeKey={selectedPeriod}
          defaultActiveKey='yesterday'
          onChange={handlePeriodChange}
          type='card'
          size='large'
        >
          {/* <TabPane tab='Today' key='today' /> */}
          <TabPane tab='Yesterday' key='yesterday' />
          <TabPane tab='This Week' key='thisWeek' />
          <TabPane tab='This Month' key='thisMonth' />
          <TabPane tab='3 Months' key='3months' />
        </Tabs>
      </div>

      {/* Main Content */}
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        {/* KPI Cards */}
        <KPICards />

        {/* Additional Stats */}
        <AdditionalStats />

        {/* Charts Section */}
        {/* <Row gutter={[16, 16]}>
          <Col span={24}>
            <SalesTrendChart />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <ProductCategoryChart />
          </Col>
          <Col xs={24} lg={12}>
            <DealerTypeChart />
          </Col>
        </Row> */}

        {/* Top Lists Section */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <TopProductsTable />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <TopDealersTable />
          </Col>
        </Row>

        {/* Metadata */}
        {data?.metadata && (
          <Card title='Report Information' size='small'>
            <Row gutter={16}>
              <Col span={6}>
                <Text type='secondary'>Date Range:</Text>
                <br />
                <Text strong>
                  {moment(data.metadata.dateRange.start).format('MMM DD, YYYY')}{' '}
                  - {moment(data.metadata.dateRange.end).format('MMM DD, YYYY')}
                </Text>
              </Col>
              <Col span={6}>
                <Text type='secondary'>Chart Period:</Text>
                <br />
                <Text strong>{data.metadata.dateRange.chartPeriod}</Text>
              </Col>
              <Col span={6}>
                <Text type='secondary'>Total Records:</Text>
                <br />
                <Text strong>{data.metadata.recordCount.totalRecords}</Text>
              </Col>
              <Col span={6}>
                <Text type='secondary'>Generated At:</Text>
                <br />
                <Text strong>
                  {moment(data.metadata.generatedAt).format(
                    'MMM DD, YYYY HH:mm'
                  )}
                </Text>
              </Col>
            </Row>
          </Card>
        )}
      </Space>
    </div>
  )
}

export default AdminSalesDashboard
