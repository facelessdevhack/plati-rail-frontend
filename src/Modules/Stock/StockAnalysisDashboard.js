import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Button,
  Tag,
  Divider,
  Select,
  InputNumber,
  Switch,
  Space,
  Spin,
  Empty,
  Typography,
  Timeline,
  Progress,
  Modal,
  Form,
  notification,
  Tooltip,
  Badge
} from 'antd'
import {
  ReloadOutlined,
  SettingOutlined,
  RiseOutlined,
  TrendingDownOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  BarChartOutlined,
  LineChartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  StockOutlined
} from '@ant-design/icons'
import { Line, Column, Pie } from '@ant-design/plots'
import { useStockAnalysis } from '../../hooks/useStockAnalysis'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const StockAnalysisDashboard = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [form] = Form.useForm()

  // Analysis settings
  const [settings, setSettings] = useState({
    cushionMonths: 3,
    riskTolerance: 'medium',
    forecastPeriod: 6,
    includeSeasonality: true,
    aiEnhanced: false
  })

  const { data, loading, error, refetch } = useStockAnalysis({
    productId,
    settings
  })

  const getUrgencyConfig = urgency => {
    const configs = {
      critical: {
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        icon: <ExclamationCircleOutlined className='text-red-500' />
      },
      high: {
        color: 'orange',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        icon: <WarningOutlined className='text-orange-500' />
      },
      medium: {
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        icon: <ClockCircleOutlined className='text-blue-500' />
      },
      normal: {
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        icon: <CheckCircleOutlined className='text-green-500' />
      }
    }
    return configs[urgency] || configs.normal
  }

  const handleSettingsUpdate = async values => {
    setSettings(values)
    setSettingsVisible(false)
    notification.success({
      message: 'Settings Updated',
      description: 'Analysis will be refreshed with new parameters.'
    })
    setTimeout(() => refetch(), 500)
  }

  // Chart configurations
  const salesTrendConfig = data?.analysis?.salesHistory?.monthlyData
    ? {
        data: data.analysis.salesHistory.monthlyData,
        xField: 'month',
        yField: 'quantity',
        point: {
          size: 5,
          shape: 'diamond'
        },
        line: {
          color: '#1890ff'
        },
        tooltip: {
          formatter: datum => ({
            name: 'Sales',
            value: `${datum.quantity} units (${datum.orders} orders)`
          })
        }
      }
    : null

  const forecastConfig = data?.analysis?.demandForecast?.forecastedDemand
    ? {
        data: data.analysis.demandForecast.forecastedDemand.map(
          (value, index) => ({
            period: `Month ${index + 1}`,
            demand: value
          })
        ),
        xField: 'period',
        yField: 'demand',
        color: '#52c41a',
        columnWidthRatio: 0.6
      }
    : null

  const seasonalConfig = data?.analysis?.seasonalPatterns
    ? {
        data: data.analysis.seasonalPatterns,
        angleField: 'avgQuantity',
        colorField: 'monthName',
        radius: 0.8,
        label: {
          type: 'outer',
          content: '{name}\n{percentage}'
        }
      }
    : null

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Spin size='large' tip='Analyzing inventory data...' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='max-w-7xl mx-auto p-6'>
        <Alert
          message='Analysis Failed'
          description={error}
          type='error'
          showIcon
          action={
            <Button size='small' onClick={refetch}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className='max-w-7xl mx-auto p-6'>
        <Empty description='No analysis data available' />
      </div>
    )
  }

  const urgencyConfig = getUrgencyConfig(data.recommendation.urgency)

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6'>
      {/* Header */}
      <div className='bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-8 mb-8'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0'>
          <div className='space-y-2'>
            <div className='flex items-center space-x-3'>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center'>
                <BarChartOutlined className='text-white text-xl' />
              </div>
              <div>
                <h1 className='text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
                  📊 Stock Analysis Dashboard
                </h1>
                <p className='text-gray-600 text-lg'>
                  {data.productInfo.currentStock.productName} (ID:{' '}
                  {data.productInfo.productId})
                </p>
              </div>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <div
              className={`px-4 py-2 rounded-full flex items-center space-x-2 ${urgencyConfig.bgColor} ${urgencyConfig.borderColor} border`}
            >
              {urgencyConfig.icon}
              <span className={`font-semibold ${urgencyConfig.textColor}`}>
                {data.recommendation.urgency.toUpperCase()} PRIORITY
              </span>
            </div>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
              style={{ borderRadius: '12px' }}
            >
              Settings
            </Button>
            <Button
              type='primary'
              icon={<ReloadOutlined />}
              onClick={refetch}
              style={{ borderRadius: '12px' }}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <Row gutter={[24, 24]} className='mb-8'>
        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
            <Statistic
              title='Current Stock'
              value={data.productInfo.currentStock.totalStock}
              valueStyle={{ color: '#1890ff' }}
              prefix={<StockOutlined />}
              suffix='units'
            />
            <div className='mt-2 text-sm text-gray-600'>
              In-House: {data.productInfo.currentStock.inHouseStock} | Showroom:{' '}
              {data.productInfo.currentStock.showroomStock}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
            <Statistic
              title='Recommended Order'
              value={data.recommendation.recommendedOrderQuantity}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ShoppingCartOutlined />}
              suffix='units'
            />
            <div className='mt-2 text-sm text-gray-600'>
              Est. Cost: $
              {data.recommendation.costAnalysis.estimatedOrderCost.toLocaleString()}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
            <Statistic
              title='Days Remaining'
              value={data.recommendation.daysOfStockRemaining}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
              suffix='days'
            />
            <div className='mt-2 text-sm text-gray-600'>
              Stockout: {data.recommendation.estimatedStockoutDate}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
            <Statistic
              title='Monthly Demand'
              value={Math.round(data.analysis.demandForecast.avgMonthlyDemand)}
              valueStyle={{ color: '#722ed1' }}
              prefix={<RiseOutlined />}
              suffix='units'
            />
            <div className='mt-2 text-sm text-gray-600'>
              Confidence: {data.analysis.demandForecast.confidenceLevel}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recommendations Alert */}
      <Alert
        message='📋 Analysis Recommendations'
        description={
          <div className='space-y-2 mt-3'>
            {data.recommendation.reasoning.map((reason, index) => (
              <div key={index} className='flex items-start space-x-2'>
                <div className='w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0' />
                <Text>{reason}</Text>
              </div>
            ))}
          </div>
        }
        type='info'
        showIcon
        className='mb-8'
      />

      {/* Charts and Analysis */}
      <Row gutter={[24, 24]} className='mb-8'>
        {/* Sales Trend */}
        <Col xs={24} lg={12}>
          <Card
            title='📈 Sales Trend Analysis'
            className='h-full bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
            extra={
              <div className='flex items-center space-x-2'>
                <Tag
                  color={
                    data.analysis.salesHistory.trend.trend === 'increasing'
                      ? 'green'
                      : data.analysis.salesHistory.trend.trend === 'decreasing'
                      ? 'red'
                      : 'blue'
                  }
                >
                  {data.analysis.salesHistory.trend.trend}
                </Tag>
                <Text type='secondary'>
                  {data.analysis.salesHistory.trend.strength} strength
                </Text>
              </div>
            }
          >
            {salesTrendConfig ? (
              <Line {...salesTrendConfig} height={300} />
            ) : (
              <Empty description='No sales trend data available' />
            )}
          </Card>
        </Col>

        {/* Demand Forecast */}
        <Col xs={24} lg={12}>
          <Card
            title='🔮 Demand Forecast'
            className='h-full bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
            extra={
              <Badge
                count={`${data.analysis.demandForecast.confidenceLevel} confidence`}
                style={{ backgroundColor: '#52c41a' }}
              />
            }
          >
            {forecastConfig ? (
              <Column {...forecastConfig} height={300} />
            ) : (
              <Empty description='No forecast data available' />
            )}
          </Card>
        </Col>

        {/* Seasonal Patterns */}
        {data.analysis.seasonalPatterns && (
          <Col xs={24} lg={12}>
            <Card
              title='🌍 Seasonal Patterns'
              className='h-full bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
            >
              <Pie {...seasonalConfig} height={300} />
            </Card>
          </Col>
        )}

        {/* Supply Metrics */}
        <Col xs={24} lg={12}>
          <Card
            title='📦 Supply Chain Metrics'
            className='h-full bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
          >
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Text type='secondary'>Average Lead Time</Text>
                  <div className='text-2xl font-bold text-blue-600'>
                    {data.analysis.supplierMetrics.avgLeadTime} days
                  </div>
                </div>
                <div>
                  <Text type='secondary'>Total Orders</Text>
                  <div className='text-2xl font-bold text-green-600'>
                    {data.analysis.supplierMetrics.totalOrders}
                  </div>
                </div>
              </div>
              <Divider />
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Text type='secondary'>Average Order Cost</Text>
                  <div className='text-xl font-semibold text-orange-600'>
                    $
                    {data.analysis.supplierMetrics.avgOrderCost.toLocaleString()}
                  </div>
                </div>
                <div>
                  <Text type='secondary'>Monthly Holding Cost</Text>
                  <div className='text-xl font-semibold text-purple-600'>
                    $
                    {data.recommendation.costAnalysis.holdingCostPerMonth.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Advanced Metrics */}
      <Row gutter={[24, 24]} className='mb-8'>
        <Col xs={24}>
          <Card
            title='🎯 Advanced Inventory Metrics'
            className='bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={8}>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {data.analysis.safetyStock}
                  </div>
                  <div className='text-sm text-gray-600'>Safety Stock</div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <div className='text-2xl font-bold text-green-600'>
                    {data.analysis.reorderPoint}
                  </div>
                  <div className='text-sm text-gray-600'>Reorder Point</div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className='text-center p-4 bg-purple-50 rounded-lg'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {data.analysis.eoq}
                  </div>
                  <div className='text-sm text-gray-600'>
                    Economic Order Quantity
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* AI Insights */}
      {data.aiInsights && (
        <Card
          title={
            <div className='flex items-center space-x-2'>
              <RobotOutlined className='text-purple-500' />
              <span>🤖 AI-Enhanced Insights</span>
              <Badge
                count={`${Math.round(
                  data.aiInsights.confidence * 100
                )}% confidence`}
                style={{ backgroundColor: '#722ed1' }}
              />
            </div>
          }
          className='mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200'
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Title level={5}>Market Trends</Title>
              <div className='space-y-2'>
                <div>
                  <Text strong>Primary Trend: </Text>
                  <Text>
                    {data.aiInsights.insights.marketTrends.primaryTrend}
                  </Text>
                </div>
                <div>
                  <Text strong>Trend Strength: </Text>
                  <Text>
                    {data.aiInsights.insights.marketTrends.trendStrength}
                  </Text>
                </div>
                <div>
                  <Text strong>Volatility: </Text>
                  <Progress
                    percent={
                      data.aiInsights.insights.marketTrends.volatility * 100
                    }
                    size='small'
                    strokeColor='#722ed1'
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <Title level={5}>AI Recommendations</Title>
              <div className='space-y-2'>
                {data.aiInsights.recommendations.map((rec, index) => (
                  <div key={index} className='flex items-start space-x-2'>
                    <div className='w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0' />
                    <Text>{rec}</Text>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Settings Modal */}
      <Modal
        title='Analysis Settings'
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout='vertical'
          initialValues={settings}
          onFinish={handleSettingsUpdate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='cushionMonths'
                label='Cushion Months'
                help='Safety buffer period (1-12 months)'
              >
                <InputNumber min={1} max={12} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='forecastPeriod'
                label='Forecast Period'
                help='Prediction horizon (3-12 months)'
              >
                <InputNumber min={3} max={12} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name='riskTolerance'
            label='Risk Tolerance'
            help='Conservative = low, Balanced = medium, Aggressive = high'
          >
            <Select>
              <Option value='low'>Low (Conservative)</Option>
              <Option value='medium'>Medium (Balanced)</Option>
              <Option value='high'>High (Aggressive)</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='includeSeasonality'
                label='Include Seasonality'
                valuePropName='checked'
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='aiEnhanced'
                label='AI Enhancement'
                valuePropName='checked'
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <div className='flex justify-end space-x-2'>
            <Button onClick={() => setSettingsVisible(false)}>Cancel</Button>
            <Button type='primary' htmlType='submit'>
              Apply Settings
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default StockAnalysisDashboard
