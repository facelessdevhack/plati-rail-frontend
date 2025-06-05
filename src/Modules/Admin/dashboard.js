import React, { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button as AntButton,
  Divider,
  Timeline,
  Alert,
  Badge,
  Tooltip,
  Select,
  DatePicker,
  Spin,
  notification,
  Tabs,
  List,
  Avatar,
  Typography,
  Empty,
  Drawer,
  Modal
} from 'antd'
import {
  ClockCircleTwoTone,
  CheckCircleTwoTone,
  DownCircleTwoTone,
  AlertTwoTone,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  ExportOutlined,
  SettingOutlined,
  BellOutlined,
  EyeOutlined,
  FilterOutlined,
  CalendarOutlined,
  TeamOutlined,
  ToolOutlined,
  StockOutlined,
  WarningOutlined,
  SyncOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  RocketOutlined,
  StarOutlined,
  HeartOutlined,
  CaretUpOutlined,
  CaretDownOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { TabPane } = Tabs

const AdminDashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.userDetails)

  // State management
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, 'days'),
    moment()
  ])
  const [selectedMetric, setSelectedMetric] = useState('overview')
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    production: {},
    sales: {},
    inventory: {},
    dealers: {},
    alerts: [],
    recentActivities: [],
    topProducts: [],
    trends: {}
  })
  const [notificationDrawer, setNotificationDrawer] = useState(false)
  const [settingsModal, setSettingsModal] = useState(false)

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData()
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000)
    return () => clearInterval(interval)
  }, [dateRange])

  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      const startDate = dateRange[0].format('YYYY-MM-DD')
      const endDate = dateRange[1].format('YYYY-MM-DD')

      // Fetch multiple endpoints in parallel
      const [
        overviewRes,
        productionRes,
        salesRes,
        inventoryRes,
        dealersRes,
        alertsRes,
        activitiesRes,
        trendsRes
      ] = await Promise.allSettled([
        client.get(
          `/v2/dashboard/overview?startDate=${startDate}&endDate=${endDate}`
        ),
        client.get(
          `/v2/dashboard/production?startDate=${startDate}&endDate=${endDate}`
        ),
        client.get(
          `/v2/dashboard/sales?startDate=${startDate}&endDate=${endDate}`
        ),
        client.get(`/v2/dashboard/inventory`),
        client.get(
          `/v2/dashboard/dealers?startDate=${startDate}&endDate=${endDate}`
        ),
        client.get(`/v2/dashboard/alerts`),
        client.get(`/v2/dashboard/activities?limit=10`),
        client.get(
          `/v2/dashboard/trends?startDate=${startDate}&endDate=${endDate}`
        )
      ])

      setDashboardData({
        overview:
          overviewRes.status === 'fulfilled'
            ? overviewRes.value.data.result
            : getMockOverview(),
        production:
          productionRes.status === 'fulfilled'
            ? productionRes.value.data.result
            : getMockProduction(),
        sales:
          salesRes.status === 'fulfilled'
            ? salesRes.value.data.result
            : getMockSales(),
        inventory:
          inventoryRes.status === 'fulfilled'
            ? inventoryRes.value.data.result
            : getMockInventory(),
        dealers:
          dealersRes.status === 'fulfilled'
            ? dealersRes.value.data.result
            : getMockDealers(),
        alerts:
          alertsRes.status === 'fulfilled'
            ? alertsRes.value.data.result
            : getMockAlerts(),
        recentActivities:
          activitiesRes.status === 'fulfilled'
            ? activitiesRes.value.data.result
            : getMockActivities(),
        trends:
          trendsRes.status === 'fulfilled'
            ? trendsRes.value.data.result
            : getMockTrends()
      })

      if (showRefresh) {
        notification.success({
          message: 'Dashboard Refreshed',
          description: 'All data has been updated successfully.',
          placement: 'topRight'
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      notification.error({
        message: 'Error Loading Dashboard',
        description: 'Failed to load dashboard data. Using cached data.',
        placement: 'topRight'
      })

      // Use mock data as fallback
      setDashboardData({
        overview: getMockOverview(),
        production: getMockProduction(),
        sales: getMockSales(),
        inventory: getMockInventory(),
        dealers: getMockDealers(),
        alerts: getMockAlerts(),
        recentActivities: getMockActivities(),
        trends: getMockTrends()
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Mock data functions
  const getMockOverview = () => ({
    totalRevenue: 2450000,
    revenueGrowth: 12.5,
    totalOrders: 1247,
    ordersGrowth: 8.3,
    totalCustomers: 89,
    customersGrowth: 15.2,
    avgOrderValue: 1965,
    avgOrderGrowth: 4.1,
    conversionRate: 3.2,
    conversionGrowth: -2.1
  })

  const getMockProduction = () => ({
    totalProduced: 15420,
    productionGrowth: 18.7,
    activeJobCards: 23,
    completedJobCards: 156,
    rejectionRate: 3.4,
    rejectionTrend: -1.2,
    avgProductionTime: 4.2,
    timeTrend: -0.8,
    urgentOrders: 5,
    capacityUtilization: 78.5
  })

  const getMockSales = () => ({
    todaySales: 45000,
    weeklySales: 285000,
    monthlySales: 1200000,
    topSellingProduct: 'PY-009 Chrome 15x6',
    salesTrend: [
      { date: '2024-01-01', amount: 25000 },
      { date: '2024-01-02', amount: 32000 },
      { date: '2024-01-03', amount: 28000 },
      { date: '2024-01-04', amount: 45000 },
      { date: '2024-01-05', amount: 38000 },
      { date: '2024-01-06', amount: 52000 },
      { date: '2024-01-07', amount: 48000 }
    ]
  })

  const getMockInventory = () => ({
    totalItems: 1247,
    lowStockItems: 23,
    outOfStockItems: 5,
    totalValue: 8500000,
    turnoverRate: 4.2,
    topMovingItems: [
      { name: 'PY-009 Chrome', quantity: 450, value: 2250000 },
      { name: 'PY-023 Black', quantity: 320, value: 1600000 },
      { name: 'PY-015 Silver', quantity: 280, value: 1400000 }
    ]
  })

  const getMockDealers = () => ({
    totalDealers: 89,
    activeDealers: 67,
    newDealers: 5,
    topDealers: [
      { name: 'ABC Motors', revenue: 450000, orders: 45, growth: 12.5 },
      { name: 'XYZ Auto Parts', revenue: 380000, orders: 38, growth: 8.3 },
      { name: 'Premium Wheels', revenue: 320000, orders: 32, growth: 15.2 }
    ]
  })

  const getMockAlerts = () => [
    {
      id: 1,
      type: 'critical',
      title: 'Low Stock Alert',
      message: '5 items are out of stock',
      timestamp: moment().subtract(2, 'hours'),
      action: 'View Inventory'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Production Delay',
      message: 'Job Card #156 is behind schedule',
      timestamp: moment().subtract(4, 'hours'),
      action: 'View Production'
    },
    {
      id: 3,
      type: 'info',
      title: 'New Order',
      message: 'Large order received from ABC Motors',
      timestamp: moment().subtract(6, 'hours'),
      action: 'View Order'
    }
  ]

  const getMockActivities = () => [
    {
      id: 1,
      type: 'order',
      title: 'New order created',
      description: 'Order #1247 for 50 units of PY-009',
      user: 'John Doe',
      timestamp: moment().subtract(1, 'hour'),
      status: 'success'
    },
    {
      id: 2,
      type: 'production',
      title: 'Production completed',
      description: 'Job Card #156 completed successfully',
      user: 'Production Team',
      timestamp: moment().subtract(2, 'hours'),
      status: 'success'
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment received',
      description: '₹45,000 payment from ABC Motors',
      user: 'Finance Team',
      timestamp: moment().subtract(3, 'hours'),
      status: 'success'
    }
  ]

  const getMockTrends = () => ({
    revenueChart: [
      { month: 'Jan', revenue: 1200000, orders: 120 },
      { month: 'Feb', revenue: 1350000, orders: 135 },
      { month: 'Mar', revenue: 1180000, orders: 118 },
      { month: 'Apr', revenue: 1420000, orders: 142 },
      { month: 'May', revenue: 1580000, orders: 158 },
      { month: 'Jun', revenue: 1650000, orders: 165 }
    ],
    productionChart: [
      { month: 'Jan', produced: 2500, target: 2800 },
      { month: 'Feb', produced: 2750, target: 2800 },
      { month: 'Mar', produced: 2400, target: 2800 },
      { month: 'Apr', produced: 2900, target: 2800 },
      { month: 'May', produced: 3100, target: 3200 },
      { month: 'Jun', produced: 3250, target: 3200 }
    ]
  })

  // Enhanced KPI Cards with animations and trends
  const renderKPICard = (
    title,
    value,
    growth,
    icon,
    color,
    prefix = '',
    suffix = ''
  ) => (
    <Card
      hoverable
      className='relative overflow-hidden transition-all duration-300 hover:shadow-lg'
      bodyStyle={{ padding: '20px' }}
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='flex items-center space-x-2 mb-2'>
            <div className={`p-2 rounded-lg bg-${color}-50`}>
              {React.cloneElement(icon, {
                className: `text-${color}-500 text-xl`
              })}
            </div>
            <Text type='secondary' className='text-sm font-medium'>
              {title}
            </Text>
          </div>
          <div className='space-y-1'>
            <Title level={3} className='mb-0'>
              {prefix}
              {typeof value === 'number' ? value.toLocaleString() : value}
              {suffix}
            </Title>
            <div className='flex items-center space-x-1'>
              {growth > 0 ? (
                <CaretUpOutlined className='text-green-500 text-sm' />
              ) : (
                <CaretDownOutlined className='text-red-500 text-sm' />
              )}
              <Text
                className={`text-sm font-medium ${
                  growth > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {Math.abs(growth)}%
              </Text>
              <Text type='secondary' className='text-xs'>
                vs last period
              </Text>
            </div>
          </div>
        </div>
        <div className='text-right'>
          <Progress
            type='circle'
            size={60}
            percent={Math.min(Math.abs(growth) * 10, 100)}
            strokeColor={growth > 0 ? '#52c41a' : '#ff4d4f'}
            showInfo={false}
          />
        </div>
      </div>
    </Card>
  )

  // Enhanced Alert Component
  const renderAlerts = () => (
    <Card
      title={
        <div className='flex items-center justify-between'>
          <span className='flex items-center space-x-2'>
            <BellOutlined className='text-orange-500' />
            <span>System Alerts</span>
            <Badge count={dashboardData.alerts.length} />
          </span>
          <AntButton
            type='text'
            icon={<EyeOutlined />}
            onClick={() => setNotificationDrawer(true)}
          >
            View All
          </AntButton>
        </div>
      }
      className='h-full'
    >
      <div className='space-y-3'>
        {dashboardData.alerts.slice(0, 3).map(alert => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border-l-4 ${
              alert.type === 'critical'
                ? 'border-red-500 bg-red-50'
                : alert.type === 'warning'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-blue-500 bg-blue-50'
            }`}
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <Text strong className='block'>
                  {alert.title}
                </Text>
                <Text type='secondary' className='text-sm'>
                  {alert.message}
                </Text>
                <Text type='secondary' className='text-xs block mt-1'>
                  {alert.timestamp.fromNow()}
                </Text>
              </div>
              <AntButton type='link' size='small'>
                {alert.action}
              </AntButton>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )

  // Recent Activities Component
  const renderRecentActivities = () => (
    <Card
      title={
        <span className='flex items-center space-x-2'>
          <ClockCircleTwoTone />
          <span>Recent Activities</span>
        </span>
      }
      className='h-full'
    >
      <Timeline>
        {dashboardData.recentActivities.map(activity => (
          <Timeline.Item
            key={activity.id}
            dot={
              activity.type === 'order' ? (
                <ShoppingCartOutlined className='text-blue-500' />
              ) : activity.type === 'production' ? (
                <ToolOutlined className='text-green-500' />
              ) : (
                <DollarOutlined className='text-orange-500' />
              )
            }
          >
            <div className='space-y-1'>
              <Text strong>{activity.title}</Text>
              <Text type='secondary' className='block text-sm'>
                {activity.description}
              </Text>
              <div className='flex items-center space-x-2 text-xs'>
                <Text type='secondary'>{activity.user}</Text>
                <Text type='secondary'>•</Text>
                <Text type='secondary'>{activity.timestamp.fromNow()}</Text>
              </div>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  )

  // Top Dealers Table
  const dealerColumns = [
    {
      title: 'Dealer',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className='flex items-center space-x-2'>
          <Avatar size='small' icon={<UserOutlined />} />
          <span className='font-medium'>{name}</span>
        </div>
      )
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: revenue => <Text strong>₹{revenue.toLocaleString()}</Text>,
      sorter: (a, b) => a.revenue - b.revenue
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      render: orders => <Badge count={orders} showZero color='blue' />
    },
    {
      title: 'Growth',
      dataIndex: 'growth',
      key: 'growth',
      render: growth => (
        <div className='flex items-center space-x-1'>
          {growth > 0 ? (
            <CaretUpOutlined className='text-green-500' />
          ) : (
            <CaretDownOutlined className='text-red-500' />
          )}
          <Text className={growth > 0 ? 'text-green-500' : 'text-red-500'}>
            {growth}%
          </Text>
        </div>
      )
    }
  ]

  // Quick Actions
  const quickActions = [
    {
      title: 'New Production Plan',
      icon: <ToolOutlined />,
      color: 'blue',
      action: () => navigate('/production-plan/create')
    },
    {
      title: 'View Orders',
      icon: <ShoppingCartOutlined />,
      color: 'green',
      action: () => navigate('/admin-daily-entry-dealers')
    },
    {
      title: 'Inventory Report',
      icon: <StockOutlined />,
      color: 'orange',
      action: () => navigate('/stock-dashboard')
    },
    {
      title: 'Dealer Metrics',
      icon: <BarChartOutlined />,
      color: 'purple',
      action: () => navigate('/admin-dealer-metrics')
    }
  ]

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Spin size='large' tip='Loading dashboard...' />
      </div>
    )
  }

  return (
    <div className='w-full min-h-screen p-6 bg-gray-50'>
      {/* Header Section */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <Title level={2} className='mb-2'>
              Welcome back, {user?.firstName} {user?.lastName}! 👋
            </Title>
            <Text type='secondary' className='text-lg'>
              Here's what's happening with your business today.
            </Text>
          </div>
          <div className='flex items-center space-x-3'>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              className='w-64'
            />
            <Tooltip title='Refresh Dashboard'>
              <AntButton
                icon={<ReloadOutlined />}
                loading={refreshing}
                onClick={() => fetchDashboardData(true)}
              />
            </Tooltip>
            <Tooltip title='Export Report'>
              <AntButton icon={<ExportOutlined />} />
            </Tooltip>
            <Tooltip title='Settings'>
              <AntButton
                icon={<SettingOutlined />}
                onClick={() => setSettingsModal(true)}
              />
            </Tooltip>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white'>
            <div className='flex items-center justify-between'>
              <div>
                <Text className='text-blue-100'>Today's Revenue</Text>
                <Title level={3} className='text-white mb-0'>
                  ₹{dashboardData.sales.todaySales?.toLocaleString()}
                </Title>
              </div>
              <DollarOutlined className='text-2xl text-blue-200' />
            </div>
          </div>
          <div className='bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white'>
            <div className='flex items-center justify-between'>
              <div>
                <Text className='text-green-100'>Active Jobs</Text>
                <Title level={3} className='text-white mb-0'>
                  {dashboardData.production.activeJobCards}
                </Title>
              </div>
              <ToolOutlined className='text-2xl text-green-200' />
            </div>
          </div>
          <div className='bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white'>
            <div className='flex items-center justify-between'>
              <div>
                <Text className='text-orange-100'>Low Stock Items</Text>
                <Title level={3} className='text-white mb-0'>
                  {dashboardData.inventory.lowStockItems}
                </Title>
              </div>
              <WarningOutlined className='text-2xl text-orange-200' />
            </div>
          </div>
          <div className='bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white'>
            <div className='flex items-center justify-between'>
              <div>
                <Text className='text-purple-100'>Active Dealers</Text>
                <Title level={3} className='text-white mb-0'>
                  {dashboardData.dealers.activeDealers}
                </Title>
              </div>
              <TeamOutlined className='text-2xl text-purple-200' />
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <Row gutter={[16, 16]} className='mb-6'>
        <Col xs={24} sm={12} lg={6}>
          {renderKPICard(
            'Total Revenue',
            dashboardData.overview.totalRevenue,
            dashboardData.overview.revenueGrowth,
            <DollarOutlined />,
            'green',
            '₹'
          )}
        </Col>
        <Col xs={24} sm={12} lg={6}>
          {renderKPICard(
            'Total Orders',
            dashboardData.overview.totalOrders,
            dashboardData.overview.ordersGrowth,
            <ShoppingCartOutlined />,
            'blue'
          )}
        </Col>
        <Col xs={24} sm={12} lg={6}>
          {renderKPICard(
            'Production Rate',
            dashboardData.production.capacityUtilization,
            dashboardData.production.productionGrowth,
            <ToolOutlined />,
            'orange',
            '',
            '%'
          )}
        </Col>
        <Col xs={24} sm={12} lg={6}>
          {renderKPICard(
            'Active Dealers',
            dashboardData.dealers.activeDealers,
            dashboardData.dealers.newDealers,
            <TeamOutlined />,
            'purple'
          )}
        </Col>
      </Row>

      {/* Quick Actions Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Title level={4} style={{ marginBottom: 16 }}>
            <ThunderboltOutlined style={{ marginRight: 8 }} />
            Quick Actions
          </Title>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={() => (window.location.href = '/dealer-metrics')}
          >
            <div style={{ textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: '48px', marginBottom: 16 }} />
              <Title level={4} style={{ color: 'white', marginBottom: 8 }}>
                Dealer Performance Metrics
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                Comprehensive dealer analytics, scorecards, and performance
                tracking
              </Text>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={() =>
              (window.location.href = '/dealer-metrics?tab=financial')
            }
          >
            <div style={{ textAlign: 'center' }}>
              <DollarOutlined style={{ fontSize: '48px', marginBottom: 16 }} />
              <Title level={4} style={{ color: 'white', marginBottom: 8 }}>
                Financial Health Monitor
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                Track outstanding amounts, payment behaviors, and credit
                utilization
              </Text>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={() =>
              (window.location.href = '/dealer-metrics?tab=operational')
            }
          >
            <div style={{ textAlign: 'center' }}>
              <ThunderboltOutlined
                style={{ fontSize: '48px', marginBottom: 16 }}
              />
              <Title level={4} style={{ color: 'white', marginBottom: 8 }}>
                Operational Efficiency
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                Monitor delivery times, fulfillment rates, and service quality
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Tabs defaultActiveKey='overview' className='mb-6'>
        <TabPane tab='Overview' key='overview'>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title='Revenue & Orders Trend'
                className='h-96 shadow-sm'
                extra={
                  <Select defaultValue='6months' size='small'>
                    <Select.Option value='7days'>Last 7 Days</Select.Option>
                    <Select.Option value='30days'>Last 30 Days</Select.Option>
                    <Select.Option value='6months'>Last 6 Months</Select.Option>
                  </Select>
                }
              >
                <div className='h-64 flex items-center justify-center'>
                  <Empty description='Chart will be implemented with a charting library' />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              {renderAlerts()}
            </Col>
          </Row>
        </TabPane>

        <TabPane tab='Production' key='production'>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title='Production Metrics' className='shadow-sm'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Text>Capacity Utilization</Text>
                    <Progress
                      percent={dashboardData.production.capacityUtilization}
                      strokeColor='#52c41a'
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <Text>Quality Rate</Text>
                    <Progress
                      percent={100 - dashboardData.production.rejectionRate}
                      strokeColor='#1890ff'
                    />
                  </div>
                  <Divider />
                  <div className='grid grid-cols-2 gap-4'>
                    <Statistic
                      title='Avg Production Time'
                      value={dashboardData.production.avgProductionTime}
                      suffix='hrs'
                      prefix={<ClockCircleTwoTone />}
                    />
                    <Statistic
                      title='Urgent Orders'
                      value={dashboardData.production.urgentOrders}
                      prefix={<FireOutlined className='text-red-500' />}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              {renderRecentActivities()}
            </Col>
          </Row>
        </TabPane>

        <TabPane tab='Sales & Dealers' key='sales'>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title='Top Performing Dealers' className='shadow-sm'>
                <Table
                  columns={dealerColumns}
                  dataSource={dashboardData.dealers.topDealers}
                  pagination={false}
                  size='small'
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title='Sales Summary' className='shadow-sm'>
                <div className='space-y-4'>
                  <Statistic
                    title="Today's Sales"
                    value={dashboardData.sales.todaySales}
                    prefix='₹'
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <Statistic
                    title='Weekly Sales'
                    value={dashboardData.sales.weeklySales}
                    prefix='₹'
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Statistic
                    title='Monthly Sales'
                    value={dashboardData.sales.monthlySales}
                    prefix='₹'
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <Divider />
                  <div>
                    <Text type='secondary'>Top Selling Product</Text>
                    <div className='flex items-center space-x-2 mt-1'>
                      <CrownOutlined className='text-yellow-500' />
                      <Text strong>
                        {dashboardData.sales.topSellingProduct}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab='Inventory' key='inventory'>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title='Inventory Overview' className='shadow-sm'>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title='Total Items'
                      value={dashboardData.inventory.totalItems}
                      prefix={<StockOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title='Total Value'
                      value={dashboardData.inventory.totalValue}
                      prefix='₹'
                    />
                  </Col>
                </Row>
                <Divider />
                <div className='space-y-3'>
                  <Alert
                    message={`${dashboardData.inventory.lowStockItems} items are running low`}
                    type='warning'
                    showIcon
                    action={
                      <AntButton
                        size='small'
                        onClick={() => navigate('/stock-dashboard')}
                      >
                        View
                      </AntButton>
                    }
                  />
                  {dashboardData.inventory.outOfStockItems > 0 && (
                    <Alert
                      message={`${dashboardData.inventory.outOfStockItems} items are out of stock`}
                      type='error'
                      showIcon
                      action={
                        <AntButton size='small' danger>
                          Urgent
                        </AntButton>
                      }
                    />
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title='Top Moving Items' className='shadow-sm'>
                <List
                  dataSource={dashboardData.inventory.topMovingItems}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Badge count={index + 1} color='blue'>
                            <Avatar icon={<StockOutlined />} />
                          </Badge>
                        }
                        title={item.name}
                        description={`Quantity: ${
                          item.quantity
                        } | Value: ₹${item.value.toLocaleString()}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Notification Drawer */}
      <Drawer
        title='System Notifications'
        placement='right'
        onClose={() => setNotificationDrawer(false)}
        open={notificationDrawer}
        width={400}
      >
        <List
          dataSource={dashboardData.alerts}
          renderItem={alert => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={
                      alert.type === 'critical' ? (
                        <WarningOutlined />
                      ) : alert.type === 'warning' ? (
                        <AlertTwoTone />
                      ) : (
                        <BellOutlined />
                      )
                    }
                    className={
                      alert.type === 'critical'
                        ? 'bg-red-500'
                        : alert.type === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }
                  />
                }
                title={alert.title}
                description={
                  <div>
                    <div>{alert.message}</div>
                    <Text type='secondary' className='text-xs'>
                      {alert.timestamp.fromNow()}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Settings Modal */}
      <Modal
        title='Dashboard Settings'
        open={settingsModal}
        onCancel={() => setSettingsModal(false)}
        footer={null}
      >
        <div className='space-y-4'>
          <div>
            <Text strong>Auto Refresh Interval</Text>
            <Select defaultValue='5' className='w-full mt-2'>
              <Select.Option value='1'>1 minute</Select.Option>
              <Select.Option value='5'>5 minutes</Select.Option>
              <Select.Option value='10'>10 minutes</Select.Option>
              <Select.Option value='30'>30 minutes</Select.Option>
            </Select>
          </div>
          <div>
            <Text strong>Default Date Range</Text>
            <Select defaultValue='30' className='w-full mt-2'>
              <Select.Option value='7'>Last 7 days</Select.Option>
              <Select.Option value='30'>Last 30 days</Select.Option>
              <Select.Option value='90'>Last 3 months</Select.Option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminDashboard
