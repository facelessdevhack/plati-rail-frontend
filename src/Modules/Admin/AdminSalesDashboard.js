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
  Tabs,
  Modal,
  DatePicker,
  message
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
const { RangePicker } = DatePicker

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
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [exportDateRange, setExportDateRange] = useState([moment().subtract(30, 'days'), moment()])
  const [exporting, setExporting] = useState(false)

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

  // Export functions
  const handleExportPricedEntries = () => {
    setExportModalVisible(true)
  }

  const handleExportConfirm = async () => {
    setExporting(true)
    try {
      const startDate = exportDateRange[0].format('YYYY-MM-DD')
      const endDate = exportDateRange[1].format('YYYY-MM-DD')

      // Call API to get priced entries
      const response = await fetch(`/api/v2/entries/priced-entries/export?startDate=${startDate}&endDate=${endDate}`)
      const result = await response.json()

      if (result.success && result.pricedEntries.length > 0) {
        exportToPDF(result.pricedEntries, 'Priced Entries Report', startDate, endDate)
        message.success(`Exported ${result.pricedEntries.length} priced entries`)
      } else {
        message.warning('No priced entries found in the selected date range')
      }
    } catch (error) {
      console.error('Export error:', error)
      message.error('Failed to export priced entries')
    } finally {
      setExporting(false)
      setExportModalVisible(false)
    }
  }

  const exportToPDF = (entries, reportTitle, startDate, endDate) => {
    // Group entries by dealer
    const groupedByDealer = entries.reduce((groups, entry) => {
      const dealerName = entry.dealerName || 'Unknown Dealer'
      if (!groups[dealerName]) {
        groups[dealerName] = []
      }
      groups[dealerName].push(entry)
      return groups
    }, {})

    // Create HTML content for PDF
    let htmlContent = `
      <html>
        <head>
          <title>${reportTitle} - ${moment().format('DD MMM YYYY')}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
              orientation: portrait;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 26px;
              margin: 0;
              padding: 8px;
              color: #000;
              width: 100%;
              max-width: 100%;
              box-sizing: border-box;
            }
            h1 {
              text-align: center;
              margin-bottom: 12px;
              font-size: 26px;
              color: #333;
              font-weight: bold;
            }
            .date-range {
              text-align: center;
              margin-bottom: 20px;
              font-size: 20px;
              color: #666;
            }
            .dealer-section {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .dealer-title {
              font-weight: bold;
              font-size: 22px;
              margin-bottom: 8px;
              text-align: center;
              background-color: #f5f5f5;
              padding: 6px;
              border: 1px solid #ddd;
              border-radius: 6px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 18px;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 4px 6px;
              text-align: left;
              word-wrap: break-word;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
              color: #333;
              font-size: 16px;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .date-col {
              width: 20%;
            }
            .product-col {
              width: 35%;
            }
            .quantity-col {
              width: 10%;
              text-align: center;
              font-weight: bold;
            }
            .price-col {
              width: 15%;
              text-align: right;
              font-weight: bold;
            }
            .total-col {
              width: 15%;
              text-align: right;
              font-weight: bold;
              color: #1890ff;
            }
            .transport-col {
              width: 5%;
              text-align: center;
              font-weight: bold;
            }
            .no-entries {
              text-align: center;
              font-style: italic;
              color: #666;
              padding: 5px;
            }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                font-size: 16px !important;
                line-height: 1.4 !important;
              }
              h1 {
                font-size: 21px !important;
                margin-bottom: 10px !important;
              }
              .dealer-title {
                font-size: 18px !important;
                padding: 8px !important;
                margin-bottom: 8px !important;
              }
              th, td {
                padding: 6px 8px !important;
                font-size: 13px !important;
              }
              th {
                font-size: 13px !important;
              }
              .dealer-section {
                margin-bottom: 12px !important;
              }
            }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <div class="date-range">
            ${moment(startDate).format('DD MMM YYYY')} - ${moment(endDate).format('DD MMM YYYY')}
          </div>
    `

    Object.keys(groupedByDealer).forEach(dealerName => {
      htmlContent += `
            <div class="dealer-section">
              <div class="dealer-title">${dealerName}</div>
              <table>
                <thead>
                  <tr>
                    <th class="date-col">Date</th>
                    <th class="product-col">Product</th>
                    <th class="quantity-col">Qty</th>
                    <th class="price-col">Price</th>
                    <th class="total-col">Total</th>
                    <th class="transport-col"></th>
                  </tr>
                </thead>
                <tbody>
      `

      if (groupedByDealer[dealerName].length === 0) {
        htmlContent += `
                  <tr>
                    <td colspan="6" class="no-entries">No entries found</td>
                  </tr>
        `
      } else {
        groupedByDealer[dealerName].forEach(entry => {
          const formattedDate = entry.dateIST
            ? moment(entry.dateIST).format('DD MMM YYYY HH:mm')
            : (entry.date ? moment.utc(entry.date).format('DD MMM YYYY HH:mm') : 'N/A')
          const product = entry.productName || 'N/A'
          const quantity = entry.quantity || 0
          const price = entry.price || 0
          const totalPrice = entry.totalPrice || (price * quantity)
          const transportPaid = entry.isTransportPaid ? 'Paid' : 'To Pay'

          htmlContent += `
                  <tr>
                    <td>${formattedDate}</td>
                    <td>${product}</td>
                    <td>${quantity}</td>
                    <td>₹${price.toLocaleString()}</td>
                    <td style="color: #1890ff; font-weight: bold;">₹${totalPrice.toLocaleString()}</td>
                    <td style="color: ${entry.isTransportPaid ? '#52c41a' : '#ff4d4f'}; font-weight: bold;">${transportPaid}</td>
                  </tr>
          `
        })
      }

      htmlContent += `
                </tbody>
              </table>
            </div>
      `
    })

    htmlContent += `
        </body>
      </html>
    `

    // Create a temporary iframe to print the content
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    printWindow.document.write(htmlContent)
    printWindow.document.title = `${reportTitle} - ${moment().format('DD MMM YYYY')}`
    printWindow.document.close()
    printWindow.print()
  }

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
            <Button icon={<ExportOutlined />} onClick={handleExportPricedEntries}>Export Priced Entries</Button>
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

      {/* Export Modal */}
      <Modal
        title="Export Priced Entries"
        open={exportModalVisible}
        onOk={handleExportConfirm}
        onCancel={() => setExportModalVisible(false)}
        confirmLoading={exporting}
        width={400}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Select Date Range:</Text>
          <div style={{ marginTop: 8 }}>
            <RangePicker
              value={exportDateRange}
              onChange={setExportDateRange}
              style={{ width: '100%' }}
              format="DD MMM YYYY"
              placeholder={['Start Date', 'End Date']}
            />
          </div>
        </div>
        <Text type="secondary">
          Export priced entries within the selected date range in PDF format, grouped by dealer.
        </Text>
      </Modal>
    </div>
  )
}

export default AdminSalesDashboard
