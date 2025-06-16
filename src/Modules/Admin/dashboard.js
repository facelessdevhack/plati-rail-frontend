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
  CaretDownOutlined,
  CarOutlined,
  PhoneOutlined,
  MailOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'
import { Pie, Column, Line, Bar } from '@ant-design/plots'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { TabPane } = Tabs

const MetricsDashboard = () => {
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

  // Metrics data state
  const [warrantyMetrics, setWarrantyMetrics] = useState(null)
  const [dealerMetrics, setDealerMetrics] = useState(null)
  const [customerMetrics, setCustomerMetrics] = useState(null)
  const [productionMetrics, setProductionMetrics] = useState(null)
  const [combinedMetrics, setCombinedMetrics] = useState(null)

  // Fetch all metrics data
  useEffect(() => {
    fetchAllMetrics()
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchAllMetrics, 300000)
    return () => clearInterval(interval)
  }, [dateRange])

  const fetchAllMetrics = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      // Build query parameters for production metrics
      const startDate = dateRange[0].format('YYYY-MM-DD')
      const endDate = dateRange[1].format('YYYY-MM-DD')
      const productionParams = `?startDate=${startDate}&endDate=${endDate}`

      // Fetch all metrics APIs in parallel
      const [warrantyRes, dealerRes, customerRes, productionRes, combinedRes] =
        await Promise.allSettled([
          client.get('/metrics/warranty'),
          client.get('/metrics/dealers'),
          client.get('/metrics/customers'),
          client.get(`/metrics/production${productionParams}`),
          client.get('/metrics/customer-dealer')
        ])

      // Set data or fallback to null
      setWarrantyMetrics(
        warrantyRes.status === 'fulfilled' ? warrantyRes.value.data.data : null
      )
      setDealerMetrics(
        dealerRes.status === 'fulfilled' ? dealerRes.value.data.data : null
      )
      setCustomerMetrics(
        customerRes.status === 'fulfilled' ? customerRes.value.data.data : null
      )
      setProductionMetrics(
        productionRes.status === 'fulfilled'
          ? productionRes.value.data.data
          : null
      )
      setCombinedMetrics(
        combinedRes.status === 'fulfilled' ? combinedRes.value.data.data : null
      )

      if (showRefresh) {
        notification.success({
          message: 'Metrics Refreshed',
          description: 'All metrics data has been updated successfully.',
          placement: 'topRight'
        })
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
      notification.error({
        message: 'Error Loading Metrics',
        description: 'Failed to load metrics data. Please try again.',
        placement: 'topRight'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Chart configurations
  const getWarrantyStatusPieConfig = () => {
    if (!warrantyMetrics?.statusDistribution) return null

    return {
      data: warrantyMetrics.statusDistribution,
      angleField: 'count',
      colorField: 'registerStatus',
      radius: 0.8,
      label: {
        type: 'outer',
        content: '{name} ({percentage})'
      },
      interactions: [{ type: 'element-active' }]
    }
  }

  const getProductTypeDistributionConfig = () => {
    if (!warrantyMetrics?.productTypeAnalysis) return null

    return {
      data: warrantyMetrics.productTypeAnalysis,
      xField: 'productType',
      yField: 'count',
      seriesField: 'productType',
      color: ['#1890ff', '#52c41a', '#faad14', '#f5222d'],
      columnWidthRatio: 0.8,
      label: {
        position: 'middle',
        style: {
          fill: '#FFFFFF',
          opacity: 0.6
        }
      }
    }
  }

  const getDealerRegistrationRankingConfig = () => {
    if (!dealerMetrics?.dealerRegistrationRanking) return null

    const topDealers = dealerMetrics.dealerRegistrationRanking.slice(0, 10)
    return {
      data: topDealers,
      xField: 'registration_count',
      yField: 'dealer_name',
      seriesField: 'dealer_name',
      color: '#1890ff',
      barWidthRatio: 0.6,
      label: {
        position: 'middle',
        style: {
          fill: '#FFFFFF'
        }
      }
    }
  }

  const getCustomerRegistrationTrendsConfig = () => {
    if (!customerMetrics?.registrationTrends) return null

    return {
      data: customerMetrics.registrationTrends,
      xField: 'month',
      yField: 'registrations',
      point: {
        size: 5,
        shape: 'diamond'
      },
      label: {
        style: {
          fill: '#aaa'
        }
      }
    }
  }

  const getProductionStepDistributionConfig = () => {
    if (!productionMetrics?.stepDistribution) return null

    return {
      data: productionMetrics.stepDistribution,
      xField: 'step_name',
      yField: 'job_count',
      color: '#52c41a',
      columnWidthRatio: 0.8,
      label: {
        position: 'middle',
        style: {
          fill: '#FFFFFF',
          opacity: 0.6
        }
      }
    }
  }

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
        <Spin size='large' tip='Loading metrics dashboard...' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6'>
      {/* Header Section */}
      <div className='bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-8 mb-8'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0'>
          <div className='space-y-2'>
            <div className='flex items-center space-x-3'>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center'>
                <BarChartOutlined className='text-white text-xl' />
              </div>
              <div>
                <h1 className='text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
                  📊 System Metrics Dashboard
                </h1>
                <p className='text-gray-600 text-lg'>
                  Comprehensive analytics and performance insights
                </p>
              </div>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'
              style={{ borderRadius: '12px' }}
            />
            <Tooltip title='Refresh Dashboard'>
              <AntButton
                type='primary'
                icon={
                  <ReloadOutlined
                    className={refreshing ? 'animate-spin' : ''}
                  />
                }
                onClick={() => fetchAllMetrics(true)}
                loading={refreshing}
                style={{ borderRadius: '12px' }}
              >
                Refresh
              </AntButton>
            </Tooltip>
            <Tooltip title='Export Report'>
              <AntButton
                icon={<ExportOutlined />}
                style={{ borderRadius: '12px' }}
              >
                Export
              </AntButton>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[24, 24]} className='mb-6'>
        {/* Warranty Verification Rate */}
        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
            <Statistic
              title='Warranty Verification Rate'
              value={
                warrantyMetrics?.otpVerificationRate?.[0]?.verificationRate || 0
              }
              precision={1}
              suffix='%'
              valueStyle={{ color: '#1890ff' }}
              prefix={<CheckCircleTwoTone twoToneColor='#1890ff' />}
            />
            <div className='mt-2'>
              <Text type='secondary'>
                {warrantyMetrics?.otpVerificationRate?.[0]
                  ?.verifiedRegistrations || 0}{' '}
                of{' '}
                {warrantyMetrics?.otpVerificationRate?.[0]
                  ?.totalRegistrations || 0}{' '}
                verified
              </Text>
            </div>
          </Card>
        </Col>

        {/* Total Active Dealers */}
        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
            <Statistic
              title='Active Dealers'
              value={dealerMetrics?.totalActiveDealers?.count || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
            <div className='mt-2'>
              <Text type='secondary'>
                Avg Credit: ₹
                {dealerMetrics?.financialMetrics?.avg_credit_limit?.toLocaleString() ||
                  0}
              </Text>
            </div>
          </Card>
        </Col>

        {/* Total Customers */}
        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
            <Statistic
              title='Total Customers'
              value={customerMetrics?.totalCustomers || 0}
              valueStyle={{ color: '#722ed1' }}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
            <div className='mt-2'>
              <Text type='secondary'>
                Avg{' '}
                {customerMetrics?.customerRetention
                  ?.avg_registrations_per_customer || 0}{' '}
                registrations/customer
              </Text>
            </div>
          </Card>
        </Col>

        {/* Production Completion Rate */}
        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
            <Statistic
              title='Production Completion Rate'
              value={productionMetrics?.planMetrics?.completion_rate || 0}
              precision={1}
              suffix='%'
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ToolOutlined style={{ color: '#fa8c16' }} />}
            />
            <div className='mt-2'>
              <Text type='secondary'>
                {productionMetrics?.planMetrics?.completed_plans || 0} of{' '}
                {productionMetrics?.planMetrics?.total_plans || 0} completed
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Metrics Content */}
      <div className='bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-8'>
        <Tabs
          defaultActiveKey='warranty'
          className='metrics-tabs'
          tabBarStyle={{
            borderBottom: 'none',
            marginBottom: '2rem'
          }}
        >
          {/* Warranty Metrics Tab */}
          <TabPane
            tab={
              <span className='flex items-center space-x-2 px-4 py-2'>
                <CheckCircleTwoTone />
                <span>Warranty Analytics</span>
              </span>
            }
            key='warranty'
          >
            <Row gutter={[24, 24]}>
              {/* Warranty Status Breakdown */}
              <Col xs={24} lg={12}>
                <Card
                  title='Registration Status Distribution'
                  className='h-full'
                >
                  {warrantyMetrics?.statusDistribution ? (
                    <Pie {...getWarrantyStatusPieConfig()} height={300} />
                  ) : (
                    <Empty description='No warranty status data available' />
                  )}
                </Card>
              </Col>

              {/* Product Type Distribution */}
              <Col xs={24} lg={12}>
                <Card title='Product Type Distribution' className='h-full'>
                  {warrantyMetrics?.productTypeAnalysis ? (
                    <Column
                      {...getProductTypeDistributionConfig()}
                      height={300}
                    />
                  ) : (
                    <Empty description='No product type data available' />
                  )}
                </Card>
              </Col>

              {/* Geographic Distribution */}
              <Col xs={24}>
                <Card title='Geographic Distribution (Top States)'>
                  {warrantyMetrics?.geographicDistribution ? (
                    <Table
                      dataSource={warrantyMetrics.geographicDistribution}
                      columns={[
                        {
                          title: 'State',
                          dataIndex: 'state',
                          key: 'state'
                        },
                        {
                          title: 'Registrations',
                          dataIndex: 'count',
                          key: 'count',
                          render: count => (
                            <Badge count={count} showZero color='blue' />
                          )
                        },
                        {
                          title: 'Progress',
                          key: 'progress',
                          render: (_, record) => {
                            const total = warrantyMetrics.totalRegistrations
                            const percentage = (
                              (record.count / total) *
                              100
                            ).toFixed(1)
                            return (
                              <Progress
                                percent={parseFloat(percentage)}
                                size='small'
                              />
                            )
                          }
                        }
                      ]}
                      pagination={false}
                      size='small'
                    />
                  ) : (
                    <Empty description='No geographic data available' />
                  )}
                </Card>
              </Col>

              {/* Warranty Card Upload Rate */}
              <Col xs={24} lg={8}>
                <Card title='Warranty Card Upload'>
                  <Statistic
                    title='Upload Rate'
                    value={
                      warrantyMetrics?.warrantyCardUploadRate?.[0]
                        ?.uploadRate || 0
                    }
                    precision={1}
                    suffix='%'
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Progress
                    percent={
                      warrantyMetrics?.warrantyCardUploadRate?.[0]
                        ?.uploadRate || 0
                    }
                    strokeColor='#52c41a'
                  />
                  <div className='mt-2'>
                    <Text type='secondary'>
                      {warrantyMetrics?.warrantyCardUploadRate?.[0]
                        ?.withWarrantyCard || 0}{' '}
                      cards uploaded
                    </Text>
                  </div>
                </Card>
              </Col>

              {/* Verification Metrics */}
              <Col xs={24} lg={8}>
                <Card title='OTP Verification'>
                  <Statistic
                    title='Verification Rate'
                    value={
                      warrantyMetrics?.otpVerificationRate?.[0]
                        ?.verificationRate || 0
                    }
                    precision={1}
                    suffix='%'
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Progress
                    percent={
                      warrantyMetrics?.otpVerificationRate?.[0]
                        ?.verificationRate || 0
                    }
                    strokeColor='#1890ff'
                  />
                  <div className='mt-2'>
                    <Text type='secondary'>
                      {warrantyMetrics?.otpVerificationRate?.[0]
                        ?.verifiedRegistrations || 0}{' '}
                      verified
                    </Text>
                  </div>
                </Card>
              </Col>

              {/* Total Registration Summary */}
              <Col xs={24} lg={8}>
                <Card title='Total Registrations'>
                  <Statistic
                    title='Total Count'
                    value={warrantyMetrics?.totalRegistrations || 0}
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <div className='mt-4 space-y-2'>
                    <div className='flex justify-between'>
                      <Text>Verified:</Text>
                      <Text strong>
                        {warrantyMetrics?.otpVerificationRate?.[0]
                          ?.verifiedRegistrations || 0}
                      </Text>
                    </div>
                    <div className='flex justify-between'>
                      <Text>Verification Rate:</Text>
                      <Text strong>
                        {warrantyMetrics?.otpVerificationRate?.[0]
                          ?.verificationRate || 0}
                        %
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Dealer Performance Tab */}
          <TabPane
            tab={
              <span className='flex items-center space-x-2 px-4 py-2'>
                <TeamOutlined />
                <span>Dealer Performance</span>
              </span>
            }
            key='dealer'
          >
            <Row gutter={[24, 24]}>
              {/* Dealer Registration Ranking */}
              <Col xs={24} lg={16}>
                <Card
                  title='Top Performing Dealers (by Registrations)'
                  className='h-full'
                >
                  {dealerMetrics?.dealerRegistrationRanking ? (
                    <Bar
                      {...getDealerRegistrationRankingConfig()}
                      height={400}
                    />
                  ) : (
                    <Empty description='No dealer ranking data available' />
                  )}
                </Card>
              </Col>

              {/* Financial Metrics */}
              <Col xs={24} lg={8}>
                <Card title='Financial Overview' className='h-full'>
                  <div className='space-y-4'>
                    <div>
                      <Text type='secondary'>Total Dealers</Text>
                      <div className='text-2xl font-bold text-blue-600'>
                        {dealerMetrics?.financialMetrics?.total_dealers || 0}
                      </div>
                    </div>
                    <Divider />
                    <div>
                      <Text type='secondary'>Avg Credit Limit</Text>
                      <div className='text-xl font-semibold text-green-600'>
                        ₹
                        {dealerMetrics?.financialMetrics?.avg_credit_limit?.toLocaleString() ||
                          0}
                      </div>
                    </div>
                    <Divider />
                    <div>
                      <Text type='secondary'>Avg Opening Balance</Text>
                      <div className='text-xl font-semibold text-orange-600'>
                        ₹
                        {dealerMetrics?.financialMetrics?.avg_opening_balance?.toLocaleString() ||
                          0}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Dealers by State */}
              <Col xs={24}>
                <Card title='Dealer Distribution by State'>
                  {dealerMetrics?.dealersByState ? (
                    <Table
                      dataSource={dealerMetrics.dealersByState}
                      columns={[
                        {
                          title: 'State',
                          dataIndex: 'state',
                          key: 'state'
                        },
                        {
                          title: 'Dealer Count',
                          dataIndex: 'dealer_count',
                          key: 'dealer_count',
                          render: count => (
                            <Badge count={count} showZero color='green' />
                          )
                        },
                        {
                          title: 'Market Share',
                          key: 'share',
                          render: (_, record) => {
                            const total = dealerMetrics.totalActiveDealers.count
                            const percentage = (
                              (record.dealer_count / total) *
                              100
                            ).toFixed(1)
                            return (
                              <div className='flex items-center space-x-2'>
                                <Progress
                                  percent={parseFloat(percentage)}
                                  size='small'
                                  className='flex-1'
                                />
                                <Text>{percentage}%</Text>
                              </div>
                            )
                          }
                        }
                      ]}
                      pagination={false}
                      size='small'
                    />
                  ) : (
                    <Empty description='No dealer distribution data available' />
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Customer Analytics Tab */}
          <TabPane
            tab={
              <span className='flex items-center space-x-2 px-4 py-2'>
                <UserOutlined />
                <span>Customer Analytics</span>
              </span>
            }
            key='customer'
          >
            <Row gutter={[24, 24]}>
              {/* Customer Retention Metrics */}
              <Col xs={24} lg={8}>
                <Card title='Customer Retention' className='h-full'>
                  <div className='space-y-4'>
                    <Statistic
                      title='Total Customers'
                      value={customerMetrics?.totalCustomers || 0}
                      valueStyle={{ color: '#722ed1' }}
                    />
                    <Statistic
                      title='Avg Registrations/Customer'
                      value={
                        customerMetrics?.customerRetention
                          ?.avg_registrations_per_customer || 0
                      }
                      precision={2}
                      valueStyle={{ color: '#1890ff' }}
                    />
                    <div className='text-sm text-gray-500'>
                      Based on{' '}
                      {customerMetrics?.customerRetention
                        ?.total_registrations || 0}{' '}
                      total registrations
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Communication Channels */}
              <Col xs={24} lg={8}>
                <Card title='Contact Information' className='h-full'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <MailOutlined className='text-blue-500' />
                        <Text>Email Rate</Text>
                      </div>
                      <Text strong>
                        {customerMetrics?.communicationChannels?.email_rate ||
                          0}
                        %
                      </Text>
                    </div>
                    <Progress
                      percent={
                        customerMetrics?.communicationChannels?.email_rate || 0
                      }
                      strokeColor='#1890ff'
                      size='small'
                    />

                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <PhoneOutlined className='text-green-500' />
                        <Text>Mobile Rate</Text>
                      </div>
                      <Text strong>
                        {customerMetrics?.communicationChannels?.mobile_rate ||
                          0}
                        %
                      </Text>
                    </div>
                    <Progress
                      percent={
                        customerMetrics?.communicationChannels?.mobile_rate || 0
                      }
                      strokeColor='#52c41a'
                      size='small'
                    />
                  </div>
                </Card>
              </Col>

              {/* Entry Source Analysis */}
              <Col xs={24} lg={8}>
                <Card title='Registration Sources' className='h-full'>
                  {customerMetrics?.entrySourceAnalysis ? (
                    <div className='space-y-3'>
                      {customerMetrics.entrySourceAnalysis.map(
                        (source, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between'
                          >
                            <Text>{source.entry_source}</Text>
                            <Badge count={source.count} showZero color='blue' />
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <Empty description='No entry source data available' />
                  )}
                </Card>
              </Col>

              {/* Registration Trends */}
              <Col xs={24} lg={16}>
                <Card title='Monthly Registration Trends' className='h-full'>
                  {customerMetrics?.registrationTrends ? (
                    <Line
                      {...getCustomerRegistrationTrendsConfig()}
                      height={300}
                    />
                  ) : (
                    <Empty description='No registration trends data available' />
                  )}
                </Card>
              </Col>

              {/* Product Preference */}
              <Col xs={24} lg={8}>
                <Card title='Product Preferences' className='h-full'>
                  {customerMetrics?.productPreference ? (
                    <div className='space-y-3'>
                      {customerMetrics.productPreference.map(
                        (product, index) => (
                          <div key={index}>
                            <div className='flex items-center justify-between mb-1'>
                              <Text>{product.product_type}</Text>
                              <Text strong>{product.count}</Text>
                            </div>
                            <Progress
                              percent={(
                                (product.count /
                                  customerMetrics.totalCustomers) *
                                100
                              ).toFixed(1)}
                              size='small'
                              strokeColor={index === 0 ? '#1890ff' : '#52c41a'}
                            />
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <Empty description='No product preference data available' />
                  )}
                </Card>
              </Col>

              {/* Vehicle Analysis */}
              <Col xs={24}>
                <Card title='Popular Vehicle Makes'>
                  {customerMetrics?.vehicleAnalysis ? (
                    <Table
                      dataSource={customerMetrics.vehicleAnalysis}
                      columns={[
                        {
                          title: 'Vehicle Make',
                          dataIndex: 'vehicle_make',
                          key: 'vehicle_make',
                          render: make => (
                            <div className='flex items-center space-x-2'>
                              <CarOutlined className='text-blue-500' />
                              <span>{make}</span>
                            </div>
                          )
                        },
                        {
                          title: 'Count',
                          dataIndex: 'count',
                          key: 'count',
                          render: count => (
                            <Badge count={count} showZero color='blue' />
                          )
                        },
                        {
                          title: 'Market Share',
                          key: 'share',
                          render: (_, record) => {
                            const total = customerMetrics.totalCustomers
                            const percentage = (
                              (record.count / total) *
                              100
                            ).toFixed(1)
                            return (
                              <div className='flex items-center space-x-2'>
                                <Progress
                                  percent={parseFloat(percentage)}
                                  size='small'
                                  className='flex-1'
                                />
                                <Text>{percentage}%</Text>
                              </div>
                            )
                          }
                        }
                      ]}
                      pagination={false}
                      size='small'
                    />
                  ) : (
                    <Empty description='No vehicle analysis data available' />
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Production Metrics Tab */}
          <TabPane
            tab={
              <span className='flex items-center space-x-2 px-4 py-2'>
                <ToolOutlined />
                <span>Production Analytics</span>
              </span>
            }
            key='production'
          >
            <Row gutter={[24, 24]}>
              {/* Production Plan Metrics */}
              <Col xs={24} lg={8}>
                <Card title='Production Plans' className='h-full'>
                  <div className='space-y-4'>
                    <Statistic
                      title='Total Plans'
                      value={productionMetrics?.planMetrics?.total_plans || 0}
                      valueStyle={{ color: '#722ed1' }}
                    />
                    <Statistic
                      title='Completion Rate'
                      value={
                        productionMetrics?.planMetrics?.completion_rate || 0
                      }
                      precision={1}
                      suffix='%'
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <div className='text-sm space-y-1'>
                      <div className='flex justify-between'>
                        <Text>Active:</Text>
                        <Badge
                          count={
                            productionMetrics?.planMetrics?.active_plans || 0
                          }
                          color='blue'
                        />
                      </div>
                      <div className='flex justify-between'>
                        <Text>Completed:</Text>
                        <Badge
                          count={
                            productionMetrics?.planMetrics?.completed_plans || 0
                          }
                          color='green'
                        />
                      </div>
                      <div className='flex justify-between'>
                        <Text>Urgent:</Text>
                        <Badge
                          count={
                            productionMetrics?.planMetrics?.urgent_plans || 0
                          }
                          color='red'
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Job Card Metrics */}
              <Col xs={24} lg={8}>
                <Card title='Job Cards & Quality' className='h-full'>
                  <div className='space-y-4'>
                    <Statistic
                      title='Total Job Cards'
                      value={
                        productionMetrics?.jobCardMetrics?.total_job_cards || 0
                      }
                      valueStyle={{ color: '#1890ff' }}
                    />
                    <Statistic
                      title='Acceptance Rate'
                      value={
                        productionMetrics?.jobCardMetrics?.acceptance_rate || 0
                      }
                      precision={1}
                      suffix='%'
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <div className='text-sm space-y-1'>
                      <div className='flex justify-between'>
                        <Text>Accepted:</Text>
                        <Text strong className='text-green-600'>
                          {productionMetrics?.jobCardMetrics?.total_accepted ||
                            0}
                        </Text>
                      </div>
                      <div className='flex justify-between'>
                        <Text>Rejected:</Text>
                        <Text strong className='text-red-600'>
                          {productionMetrics?.jobCardMetrics?.total_rejected ||
                            0}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Quality & Rejection Metrics */}
              <Col xs={24} lg={8}>
                <Card title='Quality Control' className='h-full'>
                  <div className='space-y-4'>
                    <Statistic
                      title='Total Inspected'
                      value={
                        productionMetrics?.qualityMetrics?.total_inspected || 0
                      }
                      valueStyle={{ color: '#fa8c16' }}
                    />
                    <Statistic
                      title='Active QA Personnel'
                      value={
                        productionMetrics?.qualityMetrics
                          ?.active_qa_personnel || 0
                      }
                      valueStyle={{ color: '#722ed1' }}
                    />
                    <div className='text-sm space-y-1'>
                      <div className='flex justify-between'>
                        <Text>Total Rejections:</Text>
                        <Text strong>
                          {productionMetrics?.rejectionMetrics
                            ?.total_rejections || 0}
                        </Text>
                      </div>
                      <div className='flex justify-between'>
                        <Text>Resolved:</Text>
                        <Text strong className='text-green-600'>
                          {productionMetrics?.rejectionMetrics
                            ?.resolved_rejections || 0}
                        </Text>
                      </div>
                      <div className='flex justify-between'>
                        <Text>Pending:</Text>
                        <Text strong className='text-red-600'>
                          {productionMetrics?.rejectionMetrics
                            ?.pending_rejections || 0}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Production Step Distribution */}
              <Col xs={24}>
                <Card title='Production Step Distribution'>
                  {productionMetrics?.stepDistribution ? (
                    <Column
                      {...getProductionStepDistributionConfig()}
                      height={400}
                    />
                  ) : (
                    <Empty description='No production step data available' />
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Combined Overview Tab */}
          <TabPane
            tab={
              <span className='flex items-center space-x-2 px-4 py-2'>
                <PieChartOutlined />
                <span>Overview</span>
              </span>
            }
            key='overview'
          >
            <Row gutter={[24, 24]}>
              {/* System Health Alert */}
              <Col xs={24}>
                <Alert
                  message='System Metrics Overview'
                  description='All metrics are updated in real-time. Use the refresh button to get the latest data.'
                  type='info'
                  showIcon
                  className='mb-4'
                />
              </Col>

              {/* Combined Summary Cards */}
              <Col xs={24} sm={12} lg={6}>
                <Card className='text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
                  <div className='mb-2'>
                    <CheckCircleTwoTone
                      className='text-3xl'
                      twoToneColor='#1890ff'
                    />
                  </div>
                  <Statistic
                    title='Total Warranty Registrations'
                    value={warrantyMetrics?.totalRegistrations || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className='text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
                  <div className='mb-2'>
                    <TeamOutlined className='text-3xl text-green-500' />
                  </div>
                  <Statistic
                    title='Active Dealer Network'
                    value={dealerMetrics?.totalActiveDealers?.count || 0}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className='text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
                  <div className='mb-2'>
                    <UserOutlined className='text-3xl text-purple-500' />
                  </div>
                  <Statistic
                    title='Customer Base'
                    value={customerMetrics?.totalCustomers || 0}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className='text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
                  <div className='mb-2'>
                    <ToolOutlined className='text-3xl text-orange-500' />
                  </div>
                  <Statistic
                    title='Active Production Plans'
                    value={productionMetrics?.planMetrics?.active_plans || 0}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>

              {/* Key Performance Indicators */}
              <Col xs={24}>
                <Card title='Key Performance Indicators'>
                  <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} lg={6}>
                      <div className='text-center p-4 bg-blue-50 rounded-lg'>
                        <div className='text-2xl font-bold text-blue-600'>
                          {warrantyMetrics?.otpVerificationRate?.[0]
                            ?.verificationRate || 0}
                          %
                        </div>
                        <div className='text-sm text-gray-600'>
                          Warranty Verification Rate
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <div className='text-center p-4 bg-green-50 rounded-lg'>
                        <div className='text-2xl font-bold text-green-600'>
                          {productionMetrics?.jobCardMetrics?.acceptance_rate ||
                            0}
                          %
                        </div>
                        <div className='text-sm text-gray-600'>
                          Quality Acceptance Rate
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <div className='text-center p-4 bg-purple-50 rounded-lg'>
                        <div className='text-2xl font-bold text-purple-600'>
                          {customerMetrics?.customerRetention
                            ?.avg_registrations_per_customer || 0}
                        </div>
                        <div className='text-sm text-gray-600'>
                          Avg Products per Customer
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <div className='text-center p-4 bg-orange-50 rounded-lg'>
                        <div className='text-2xl font-bold text-orange-600'>
                          {productionMetrics?.planMetrics?.completion_rate || 0}
                          %
                        </div>
                        <div className='text-sm text-gray-600'>
                          Production Completion Rate
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </div>
    </div>
  )
}

export default MetricsDashboard
