import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Progress,
  Tag,
  Tabs,
  Space,
  Button,
  Tooltip,
  Badge,
  Avatar,
  List,
  Typography,
  Alert,
  Divider,
  Rate,
  Timeline
} from 'antd'
import {
  TrophyOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  StarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  GiftOutlined,
  EyeOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Line, Column, Pie, Area } from '@ant-design/plots'
import { useLocation, useNavigate } from 'react-router-dom'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { RangePicker } = DatePicker
const { Option } = Select

const DealerMetrics = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Get tab from URL parameters
  const urlParams = new URLSearchParams(location.search)
  const tabFromUrl = urlParams.get('tab') || 'scorecard'

  const [selectedDealer, setSelectedDealer] = useState('all')
  const [dateRange, setDateRange] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(tabFromUrl)

  // Update URL when tab changes
  const handleTabChange = newTab => {
    setActiveTab(newTab)
    const newUrl = `/dealer-metrics${
      newTab !== 'scorecard' ? `?tab=${newTab}` : ''
    }`
    navigate(newUrl, { replace: true })
  }

  // Mock data - replace with actual API calls
  const mockDealers = [
    { id: 1, name: 'Rajesh Enterprises', city: 'Mumbai', region: 'West' },
    { id: 2, name: 'Sharma Trading Co.', city: 'Delhi', region: 'North' },
    { id: 3, name: 'South India Motors', city: 'Chennai', region: 'South' },
    { id: 4, name: 'Bengal Steel Works', city: 'Kolkata', region: 'East' },
    { id: 5, name: 'Gujarat Industries', city: 'Ahmedabad', region: 'West' }
  ]

  const mockPerformanceData = {
    overall: {
      totalRevenue: 12500000,
      totalOrders: 1250,
      avgOrderValue: 10000,
      topPerformers: 5,
      growthRate: 15.5,
      satisfactionScore: 4.2
    },
    dealers: mockDealers.map(dealer => ({
      ...dealer,
      revenue: Math.floor(Math.random() * 5000000) + 1000000,
      orders: Math.floor(Math.random() * 500) + 50,
      avgOrderValue: Math.floor(Math.random() * 20000) + 5000,
      growthRate: Math.random() * 30 - 10,
      satisfactionScore: Math.random() * 2 + 3,
      paymentScore: Math.floor(Math.random() * 40) + 60,
      deliveryScore: Math.floor(Math.random() * 30) + 70,
      qualityScore: Math.floor(Math.random() * 25) + 75,
      lastOrderDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0]
    }))
  }

  const mockFinancialData = {
    overall: {
      totalOutstanding: 2500000,
      overdueAmount: 450000,
      collectionEfficiency: 85.5,
      avgPaymentDays: 28,
      creditUtilization: 72
    },
    dealers: mockDealers.map(dealer => ({
      ...dealer,
      outstanding: Math.floor(Math.random() * 800000) + 100000,
      overdue: Math.floor(Math.random() * 200000),
      creditLimit: Math.floor(Math.random() * 1000000) + 500000,
      paymentDays: Math.floor(Math.random() * 20) + 15,
      collectionRate: Math.floor(Math.random() * 30) + 70
    }))
  }

  const mockProductData = [
    {
      product: 'Steel Rods',
      totalSales: 5000000,
      topDealer: 'Rajesh Enterprises',
      growth: 12.5
    },
    {
      product: 'Iron Sheets',
      totalSales: 3500000,
      topDealer: 'Gujarat Industries',
      growth: 8.3
    },
    {
      product: 'Aluminum Pipes',
      totalSales: 2800000,
      topDealer: 'South India Motors',
      growth: -2.1
    },
    {
      product: 'Copper Wires',
      totalSales: 1200000,
      topDealer: 'Bengal Steel Works',
      growth: 18.7
    }
  ]

  const mockOperationalData = {
    overall: {
      avgDeliveryTime: 3.2,
      orderFulfillmentRate: 94.5,
      returnRate: 2.1,
      customerSatisfaction: 4.3
    },
    dealers: mockDealers.map(dealer => ({
      ...dealer,
      deliveryTime: Math.random() * 3 + 2,
      fulfillmentRate: Math.random() * 20 + 80,
      returnRate: Math.random() * 5,
      responseTime: Math.random() * 24 + 2
    }))
  }

  // Performance Scorecard Component
  const PerformanceScorecard = () => {
    const getScoreColor = score => {
      if (score >= 80) return '#52c41a'
      if (score >= 60) return '#faad14'
      return '#ff4d4f'
    }

    const getPerformanceLevel = score => {
      if (score >= 90)
        return { level: 'Excellent', icon: <CrownOutlined />, color: '#722ed1' }
      if (score >= 80)
        return { level: 'Good', icon: <StarOutlined />, color: '#52c41a' }
      if (score >= 60)
        return {
          level: 'Average',
          icon: <CheckCircleOutlined />,
          color: '#faad14'
        }
      return {
        level: 'Needs Improvement',
        icon: <WarningOutlined />,
        color: '#ff4d4f'
      }
    }

    const scorecardData =
      selectedDealer === 'all'
        ? mockPerformanceData.dealers.map(dealer => {
            const overallScore = Math.floor(
              (dealer.paymentScore +
                dealer.deliveryScore +
                dealer.qualityScore) /
                3
            )
            return {
              ...dealer,
              overallScore,
              performance: getPerformanceLevel(overallScore)
            }
          })
        : mockPerformanceData.dealers
            .filter(d => d.id === parseInt(selectedDealer))
            .map(dealer => {
              const overallScore = Math.floor(
                (dealer.paymentScore +
                  dealer.deliveryScore +
                  dealer.qualityScore) /
                  3
              )
              return {
                ...dealer,
                overallScore,
                performance: getPerformanceLevel(overallScore)
              }
            })

    const columns = [
      {
        title: 'Dealer',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <Space>
            <Avatar style={{ backgroundColor: record.performance.color }}>
              {record.performance.icon}
            </Avatar>
            <div>
              <Text strong>{text}</Text>
              <br />
              <Text type='secondary' style={{ fontSize: '12px' }}>
                {record.city}
              </Text>
            </div>
          </Space>
        )
      },
      {
        title: 'Overall Score',
        dataIndex: 'overallScore',
        key: 'overallScore',
        render: (score, record) => (
          <div>
            <Progress
              percent={score}
              strokeColor={getScoreColor(score)}
              size='small'
              format={() => `${score}%`}
            />
            <Tag color={record.performance.color} style={{ marginTop: 4 }}>
              {record.performance.level}
            </Tag>
          </div>
        ),
        sorter: (a, b) => a.overallScore - b.overallScore
      },
      {
        title: 'Payment Score',
        dataIndex: 'paymentScore',
        key: 'paymentScore',
        render: score => (
          <Progress
            percent={score}
            strokeColor={getScoreColor(score)}
            size='small'
            style={{ width: 80 }}
          />
        ),
        sorter: (a, b) => a.paymentScore - b.paymentScore
      },
      {
        title: 'Delivery Score',
        dataIndex: 'deliveryScore',
        key: 'deliveryScore',
        render: score => (
          <Progress
            percent={score}
            strokeColor={getScoreColor(score)}
            size='small'
            style={{ width: 80 }}
          />
        ),
        sorter: (a, b) => a.deliveryScore - b.deliveryScore
      },
      {
        title: 'Quality Score',
        dataIndex: 'qualityScore',
        key: 'qualityScore',
        render: score => (
          <Progress
            percent={score}
            strokeColor={getScoreColor(score)}
            size='small'
            style={{ width: 80 }}
          />
        ),
        sorter: (a, b) => a.qualityScore - b.qualityScore
      },
      {
        title: 'Revenue',
        dataIndex: 'revenue',
        key: 'revenue',
        render: revenue => `₹${(revenue / 100000).toFixed(1)}L`,
        sorter: (a, b) => a.revenue - b.revenue
      },
      {
        title: 'Growth Rate',
        dataIndex: 'growthRate',
        key: 'growthRate',
        render: rate => (
          <Tag color={rate >= 0 ? 'green' : 'red'}>
            {rate >= 0 ? <RiseOutlined /> : <FallOutlined />}
            {Math.abs(rate).toFixed(1)}%
          </Tag>
        ),
        sorter: (a, b) => a.growthRate - b.growthRate
      }
    ]

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title='Top Performers'
                value={scorecardData.filter(d => d.overallScore >= 80).length}
                prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                suffix={`/ ${scorecardData.length}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Average Score'
                value={
                  scorecardData.reduce((acc, d) => acc + d.overallScore, 0) /
                  scorecardData.length
                }
                precision={1}
                prefix={<StarOutlined style={{ color: '#52c41a' }} />}
                suffix='%'
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Needs Attention'
                value={scorecardData.filter(d => d.overallScore < 60).length}
                prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                suffix='dealers'
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Total Revenue'
                value={
                  scorecardData.reduce((acc, d) => acc + d.revenue, 0) /
                  10000000
                }
                precision={1}
                prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
                suffix='Cr'
              />
            </Card>
          </Col>
        </Row>

        <Card
          title='Performance Scorecard'
          extra={
            <Space>
              <Button icon={<ExportOutlined />}>Export</Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setLoading(true)}
              >
                Refresh
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={scorecardData}
            rowKey='id'
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    )
  }

  // Financial Health Dashboard Component
  const FinancialHealthDashboard = () => {
    const financialData =
      selectedDealer === 'all'
        ? mockFinancialData.dealers
        : mockFinancialData.dealers.filter(
            d => d.id === parseInt(selectedDealer)
          )

    const getHealthStatus = score => {
      if (score >= 80) return { status: 'Excellent', color: '#52c41a' }
      if (score >= 60) return { status: 'Good', color: '#faad14' }
      return { status: 'Poor', color: '#ff4d4f' }
    }

    const outstandingData = financialData.map(dealer => ({
      dealer: dealer.name,
      outstanding: dealer.outstanding / 100000,
      overdue: dealer.overdue / 100000
    }))

    const outstandingConfig = {
      data: outstandingData,
      xField: 'dealer',
      yField: 'outstanding',
      seriesField: 'type',
      isGroup: true,
      columnStyle: {
        radius: [4, 4, 0, 0]
      }
    }

    const columns = [
      {
        title: 'Dealer',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <Space>
            <Avatar
              style={{
                backgroundColor: getHealthStatus(record.collectionRate).color
              }}
            >
              {text.charAt(0)}
            </Avatar>
            <div>
              <Text strong>{text}</Text>
              <br />
              <Text type='secondary' style={{ fontSize: '12px' }}>
                {record.city}
              </Text>
            </div>
          </Space>
        )
      },
      {
        title: 'Outstanding Amount',
        dataIndex: 'outstanding',
        key: 'outstanding',
        render: amount => `₹${(amount / 100000).toFixed(1)}L`,
        sorter: (a, b) => a.outstanding - b.outstanding
      },
      {
        title: 'Overdue Amount',
        dataIndex: 'overdue',
        key: 'overdue',
        render: (amount, record) => (
          <div>
            <Text style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a' }}>
              ₹{(amount / 100000).toFixed(1)}L
            </Text>
            <br />
            <Text type='secondary' style={{ fontSize: '12px' }}>
              {((amount / record.outstanding) * 100).toFixed(1)}% of total
            </Text>
          </div>
        ),
        sorter: (a, b) => a.overdue - b.overdue
      },
      {
        title: 'Credit Utilization',
        dataIndex: 'creditLimit',
        key: 'creditUtilization',
        render: (limit, record) => {
          const utilization = (record.outstanding / limit) * 100
          return (
            <div>
              <Progress
                percent={utilization}
                strokeColor={
                  utilization > 80
                    ? '#ff4d4f'
                    : utilization > 60
                    ? '#faad14'
                    : '#52c41a'
                }
                size='small'
              />
              <Text type='secondary' style={{ fontSize: '12px' }}>
                ₹{(limit / 100000).toFixed(1)}L limit
              </Text>
            </div>
          )
        }
      },
      {
        title: 'Avg Payment Days',
        dataIndex: 'paymentDays',
        key: 'paymentDays',
        render: days => (
          <Tag color={days <= 30 ? 'green' : days <= 45 ? 'orange' : 'red'}>
            {days} days
          </Tag>
        ),
        sorter: (a, b) => a.paymentDays - b.paymentDays
      },
      {
        title: 'Collection Rate',
        dataIndex: 'collectionRate',
        key: 'collectionRate',
        render: rate => {
          const health = getHealthStatus(rate)
          return (
            <div>
              <Progress
                percent={rate}
                strokeColor={health.color}
                size='small'
                style={{ width: 80 }}
              />
              <Tag color={health.color} style={{ marginTop: 4 }}>
                {health.status}
              </Tag>
            </div>
          )
        },
        sorter: (a, b) => a.collectionRate - b.collectionRate
      }
    ]

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title='Total Outstanding'
                value={
                  financialData.reduce((acc, d) => acc + d.outstanding, 0) /
                  10000000
                }
                precision={1}
                prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
                suffix='Cr'
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Overdue Amount'
                value={
                  financialData.reduce((acc, d) => acc + d.overdue, 0) / 100000
                }
                precision={1}
                prefix={
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                }
                suffix='L'
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Avg Collection Rate'
                value={
                  financialData.reduce((acc, d) => acc + d.collectionRate, 0) /
                  financialData.length
                }
                precision={1}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                suffix='%'
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='High Risk Dealers'
                value={
                  financialData.filter(
                    d =>
                      d.collectionRate < 60 || d.overdue / d.outstanding > 0.3
                  ).length
                }
                prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                suffix='dealers'
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title='Outstanding vs Overdue Analysis'>
              <Column {...outstandingConfig} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title='Payment Behavior Timeline'>
              <Timeline>
                {financialData.slice(0, 5).map((dealer, index) => (
                  <Timeline.Item
                    key={dealer.id}
                    color={
                      dealer.paymentDays <= 30
                        ? 'green'
                        : dealer.paymentDays <= 45
                        ? 'orange'
                        : 'red'
                    }
                  >
                    <Text strong>{dealer.name}</Text>
                    <br />
                    <Text type='secondary'>
                      Avg Payment: {dealer.paymentDays} days
                    </Text>
                    <br />
                    <Text type='secondary'>
                      Collection Rate: {dealer.collectionRate}%
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Col>
        </Row>

        <Card
          title='Financial Health Details'
          extra={
            <Space>
              <Button icon={<ExportOutlined />}>Export</Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setLoading(true)}
              >
                Refresh
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={financialData}
            rowKey='id'
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    )
  }

  // Product Performance Matrix Component
  const ProductPerformanceMatrix = () => {
    const productSalesData = mockProductData.map(product => ({
      product: product.product,
      sales: product.totalSales / 100000,
      growth: product.growth
    }))

    const productConfig = {
      data: productSalesData,
      xField: 'product',
      yField: 'sales',
      columnStyle: {
        radius: [4, 4, 0, 0]
      },
      color: ({ growth }) => (growth >= 0 ? '#52c41a' : '#ff4d4f')
    }

    const dealerProductData =
      selectedDealer === 'all'
        ? mockDealers.map(dealer => ({
            ...dealer,
            products: mockProductData.map(product => ({
              ...product,
              dealerSales: Math.floor(Math.random() * 1000000) + 100000,
              dealerGrowth: Math.random() * 40 - 20
            }))
          }))
        : mockDealers
            .filter(d => d.id === parseInt(selectedDealer))
            .map(dealer => ({
              ...dealer,
              products: mockProductData.map(product => ({
                ...product,
                dealerSales: Math.floor(Math.random() * 1000000) + 100000,
                dealerGrowth: Math.random() * 40 - 20
              }))
            }))

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title='Total Products'
                value={mockProductData.length}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Growing Products'
                value={mockProductData.filter(p => p.growth > 0).length}
                prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                suffix={`/ ${mockProductData.length}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Top Product Sales'
                value={
                  Math.max(...mockProductData.map(p => p.totalSales)) / 10000000
                }
                precision={1}
                prefix={<FireOutlined style={{ color: '#faad14' }} />}
                suffix='Cr'
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Avg Growth Rate'
                value={
                  mockProductData.reduce((acc, p) => acc + p.growth, 0) /
                  mockProductData.length
                }
                precision={1}
                prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                suffix='%'
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title='Product Sales Performance'>
              <Column {...productConfig} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title='Product Growth Matrix'>
              <List
                dataSource={mockProductData}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor:
                              item.growth >= 0 ? '#52c41a' : '#ff4d4f'
                          }}
                        >
                          {item.growth >= 0 ? (
                            <RiseOutlined />
                          ) : (
                            <FallOutlined />
                          )}
                        </Avatar>
                      }
                      title={item.product}
                      description={
                        <div>
                          <Text>
                            Sales: ₹{(item.totalSales / 100000).toFixed(1)}L
                          </Text>
                          <br />
                          <Text>Top Dealer: {item.topDealer}</Text>
                        </div>
                      }
                    />
                    <Tag color={item.growth >= 0 ? 'green' : 'red'}>
                      {item.growth >= 0 ? '+' : ''}
                      {item.growth.toFixed(1)}%
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {selectedDealer !== 'all' && dealerProductData.length > 0 && (
          <Card title={`Product Performance - ${dealerProductData[0].name}`}>
            <Row gutter={[16, 16]}>
              {dealerProductData[0].products.map(product => (
                <Col span={6} key={product.product}>
                  <Card size='small'>
                    <Statistic
                      title={product.product}
                      value={product.dealerSales / 100000}
                      precision={1}
                      suffix='L'
                      prefix={
                        product.dealerGrowth >= 0 ? (
                          <RiseOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <FallOutlined style={{ color: '#ff4d4f' }} />
                        )
                      }
                    />
                    <Tag
                      color={product.dealerGrowth >= 0 ? 'green' : 'red'}
                      style={{ marginTop: 8 }}
                    >
                      {product.dealerGrowth >= 0 ? '+' : ''}
                      {product.dealerGrowth.toFixed(1)}%
                    </Tag>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}
      </div>
    )
  }

  // Operational Efficiency Tracker Component
  const OperationalEfficiencyTracker = () => {
    const operationalData =
      selectedDealer === 'all'
        ? mockOperationalData.dealers
        : mockOperationalData.dealers.filter(
            d => d.id === parseInt(selectedDealer)
          )

    const efficiencyData = operationalData.map(dealer => ({
      dealer: dealer.name,
      deliveryTime: dealer.deliveryTime,
      fulfillmentRate: dealer.fulfillmentRate,
      returnRate: dealer.returnRate
    }))

    const deliveryConfig = {
      data: efficiencyData,
      xField: 'dealer',
      yField: 'deliveryTime',
      point: {
        size: 5,
        shape: 'diamond'
      },
      color: '#1890ff'
    }

    const columns = [
      {
        title: 'Dealer',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <Space>
            <Avatar
              style={{
                backgroundColor:
                  record.fulfillmentRate >= 90
                    ? '#52c41a'
                    : record.fulfillmentRate >= 80
                    ? '#faad14'
                    : '#ff4d4f'
              }}
            >
              {text.charAt(0)}
            </Avatar>
            <div>
              <Text strong>{text}</Text>
              <br />
              <Text type='secondary' style={{ fontSize: '12px' }}>
                {record.city}
              </Text>
            </div>
          </Space>
        )
      },
      {
        title: 'Avg Delivery Time',
        dataIndex: 'deliveryTime',
        key: 'deliveryTime',
        render: time => (
          <div>
            <Text strong>{time.toFixed(1)} days</Text>
            <br />
            <Progress
              percent={Math.max(0, 100 - time * 20)}
              strokeColor={
                time <= 2 ? '#52c41a' : time <= 4 ? '#faad14' : '#ff4d4f'
              }
              size='small'
              showInfo={false}
            />
          </div>
        ),
        sorter: (a, b) => a.deliveryTime - b.deliveryTime
      },
      {
        title: 'Fulfillment Rate',
        dataIndex: 'fulfillmentRate',
        key: 'fulfillmentRate',
        render: rate => (
          <div>
            <Progress
              percent={rate}
              strokeColor={
                rate >= 90 ? '#52c41a' : rate >= 80 ? '#faad14' : '#ff4d4f'
              }
              size='small'
            />
            <Tag color={rate >= 90 ? 'green' : rate >= 80 ? 'orange' : 'red'}>
              {rate >= 90 ? 'Excellent' : rate >= 80 ? 'Good' : 'Poor'}
            </Tag>
          </div>
        ),
        sorter: (a, b) => a.fulfillmentRate - b.fulfillmentRate
      },
      {
        title: 'Return Rate',
        dataIndex: 'returnRate',
        key: 'returnRate',
        render: rate => (
          <div>
            <Text
              style={{
                color: rate <= 2 ? '#52c41a' : rate <= 5 ? '#faad14' : '#ff4d4f'
              }}
            >
              {rate.toFixed(1)}%
            </Text>
            <br />
            <Progress
              percent={Math.max(0, 100 - rate * 10)}
              strokeColor={
                rate <= 2 ? '#52c41a' : rate <= 5 ? '#faad14' : '#ff4d4f'
              }
              size='small'
              showInfo={false}
            />
          </div>
        ),
        sorter: (a, b) => a.returnRate - b.returnRate
      },
      {
        title: 'Response Time',
        dataIndex: 'responseTime',
        key: 'responseTime',
        render: time => (
          <Tag color={time <= 4 ? 'green' : time <= 12 ? 'orange' : 'red'}>
            {time.toFixed(1)} hrs
          </Tag>
        ),
        sorter: (a, b) => a.responseTime - b.responseTime
      },
      {
        title: 'Efficiency Score',
        key: 'efficiency',
        render: (_, record) => {
          const score = Math.floor(
            (record.fulfillmentRate +
              Math.max(0, 100 - record.deliveryTime * 20) +
              Math.max(0, 100 - record.returnRate * 10) +
              Math.max(0, 100 - record.responseTime * 4)) /
              4
          )
          return (
            <div>
              <Progress
                percent={score}
                strokeColor={
                  score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'
                }
                size='small'
              />
              <Rate
                disabled
                value={Math.floor(score / 20)}
                style={{ fontSize: '12px', marginTop: 4 }}
              />
            </div>
          )
        }
      }
    ]

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title='Avg Delivery Time'
                value={
                  operationalData.reduce((acc, d) => acc + d.deliveryTime, 0) /
                  operationalData.length
                }
                precision={1}
                prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                suffix='days'
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Avg Fulfillment Rate'
                value={
                  operationalData.reduce(
                    (acc, d) => acc + d.fulfillmentRate,
                    0
                  ) / operationalData.length
                }
                precision={1}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                suffix='%'
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Avg Return Rate'
                value={
                  operationalData.reduce((acc, d) => acc + d.returnRate, 0) /
                  operationalData.length
                }
                precision={1}
                prefix={
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                }
                suffix='%'
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Top Performers'
                value={
                  operationalData.filter(
                    d => d.fulfillmentRate >= 90 && d.deliveryTime <= 3
                  ).length
                }
                prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
                suffix='dealers'
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title='Delivery Time Trends'>
              <Line {...deliveryConfig} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title='Efficiency Alerts'>
              <List
                dataSource={operationalData.filter(
                  d =>
                    d.fulfillmentRate < 80 ||
                    d.deliveryTime > 4 ||
                    d.returnRate > 5
                )}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#ff4d4f' }}>
                          <WarningOutlined />
                        </Avatar>
                      }
                      title={item.name}
                      description={
                        <div>
                          {item.fulfillmentRate < 80 && (
                            <Tag color='red'>
                              Low Fulfillment: {item.fulfillmentRate.toFixed(1)}
                              %
                            </Tag>
                          )}
                          {item.deliveryTime > 4 && (
                            <Tag color='red'>
                              Slow Delivery: {item.deliveryTime.toFixed(1)} days
                            </Tag>
                          )}
                          {item.returnRate > 5 && (
                            <Tag color='red'>
                              High Returns: {item.returnRate.toFixed(1)}%
                            </Tag>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title='Operational Efficiency Details'
          extra={
            <Space>
              <Button icon={<ExportOutlined />}>Export</Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setLoading(true)}
              >
                Refresh
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={operationalData}
            rowKey='id'
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <TeamOutlined style={{ marginRight: 8 }} />
          Dealer Performance Metrics
        </Title>
        <Text type='secondary'>
          Comprehensive analytics and performance tracking for all dealers
        </Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align='middle'>
          <Col span={6}>
            <Text strong>Select Dealer:</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={selectedDealer}
              onChange={setSelectedDealer}
              placeholder='Select dealer'
            >
              <Option value='all'>All Dealers</Option>
              {mockDealers.map(dealer => (
                <Option key={dealer.id} value={dealer.id.toString()}>
                  {dealer.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Text strong>Date Range:</Text>
            <RangePicker
              style={{ width: '100%', marginTop: 8 }}
              value={dateRange}
              onChange={setDateRange}
            />
          </Col>
          <Col span={12}>
            <Space style={{ marginTop: 24 }}>
              <Button type='primary' icon={<FilterOutlined />}>
                Apply Filters
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSelectedDealer('all')
                  setDateRange(null)
                }}
              >
                Reset
              </Button>
              <Button icon={<ExportOutlined />}>Export All</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tabs for different metrics */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type='card'
        size='large'
      >
        <TabPane
          tab={
            <span>
              <TrophyOutlined />
              Performance Scorecard
            </span>
          }
          key='scorecard'
        >
          <PerformanceScorecard />
        </TabPane>

        <TabPane
          tab={
            <span>
              <DollarOutlined />
              Financial Health
            </span>
          }
          key='financial'
        >
          <FinancialHealthDashboard />
        </TabPane>

        <TabPane
          tab={
            <span>
              <ShoppingCartOutlined />
              Product Performance
            </span>
          }
          key='products'
        >
          <ProductPerformanceMatrix />
        </TabPane>

        <TabPane
          tab={
            <span>
              <ThunderboltOutlined />
              Operational Efficiency
            </span>
          }
          key='operational'
        >
          <OperationalEfficiencyTracker />
        </TabPane>
      </Tabs>
    </div>
  )
}

export default DealerMetrics
