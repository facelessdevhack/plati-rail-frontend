import React, { useState } from 'react'
import { Layout, Row, Col, DatePicker, Button, Space, Typography, Divider, Breadcrumb, message, Segmented } from 'antd'
import { ReloadOutlined, HomeOutlined, DashboardOutlined, PrinterOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

// Components
import ExecutiveKPICards from './components/ExecutiveKPICards'
import RevenueProfitTrend from './components/RevenueProfitTrend'
import ProductPLTable from './components/ProductPLTable'
import GrossProfitRankings from './components/GrossProfitRankings'

// Hook
import useCEODashboardData from './hooks/useCEODashboardData'

const { Content } = Layout
const { Title, Text } = Typography
const { RangePicker } = DatePicker

/**
 * CEO Product P&L Dashboard
 * Executive dashboard for product-wise profitability analysis and decision-making
 */
const CEODashboard = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [dateMode, setDateMode] = useState('month') // 'month' or 'range'
  const [selectedRange, setSelectedRange] = useState(null)

  // Fetch dashboard data
  const {
    loading,
    error,
    summary,
    byDealer,
    trends,
    profitabilityMatrix,
    period,
    refresh,
    setPeriod,
    setCustomDateRange
  } = useCEODashboardData(selectedDate.year(), selectedDate.month() + 1)

  // Handle month picker change
  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date)
      setSelectedRange(null)
      setPeriod(date.year(), date.month() + 1)
    }
  }

  // Handle date range change
  const handleRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setSelectedRange(dates)
      setCustomDateRange(dates)
    }
  }

  // Handle date mode change
  const handleDateModeChange = (mode) => {
    setDateMode(mode)
    if (mode === 'month') {
      setSelectedRange(null)
      setPeriod(selectedDate.year(), selectedDate.month() + 1)
    }
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  // Handle view product details
  const handleViewProductDetails = (product) => {
    message.info(`Product details for: ${product.productName || product.model}`)
    // TODO: Navigate to product detail page or open modal
  }

  // Prepare products for table
  const allProducts = React.useMemo(() => {
    if (!profitabilityMatrix || profitabilityMatrix.length === 0) return []
    return profitabilityMatrix.map(p => ({
      ...p,
      cogs: p.revenue - p.grossProfit
    }))
  }, [profitabilityMatrix])

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Content style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Breadcrumb
            items={[
              { title: <><HomeOutlined /> Home</> },
              { title: 'Cost Management' },
              { title: 'CEO Dashboard' }
            ]}
            style={{ marginBottom: 16 }}
          />

          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical" size={0}>
                <Title level={3} style={{ margin: 0 }}>
                  <DashboardOutlined style={{ marginRight: 12 }} />
                  Product P&L Dashboard
                </Title>
                <Text type="secondary">
                  Executive overview for product profitability analysis and strategic decisions
                </Text>
              </Space>
            </Col>
            <Col>
              <Space>
                <Segmented
                  options={[
                    { label: 'Month', value: 'month', icon: <CalendarOutlined /> },
                    { label: 'Date Range', value: 'range', icon: <CalendarOutlined /> }
                  ]}
                  value={dateMode}
                  onChange={handleDateModeChange}
                />
                {dateMode === 'month' ? (
                  <DatePicker
                    picker="month"
                    value={selectedDate}
                    onChange={handleDateChange}
                    format="MMMM YYYY"
                    allowClear={false}
                    style={{ width: 180 }}
                  />
                ) : (
                  <RangePicker
                    value={selectedRange}
                    onChange={handleRangeChange}
                    format="DD MMM YYYY"
                    style={{ width: 280 }}
                    presets={[
                      { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] },
                      { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
                      { label: 'Last 90 Days', value: [dayjs().subtract(90, 'day'), dayjs()] },
                      { label: 'This Month', value: [dayjs().startOf('month'), dayjs()] },
                      { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                      { label: 'This Quarter', value: [dayjs().startOf('quarter'), dayjs()] },
                      { label: 'This Year', value: [dayjs().startOf('year'), dayjs()] },
                    ]}
                  />
                )}
                <Button
                  icon={<ReloadOutlined spin={loading} />}
                  onClick={refresh}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                >
                  Print
                </Button>
              </Space>
            </Col>
          </Row>

          {period && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Data Period: {period.isCustomRange
                ? `${dayjs(period.startDate).format('DD MMM YYYY')} - ${dayjs(period.endDate).format('DD MMM YYYY')}`
                : `${period.monthName} ${period.year}`
              }
              {period.compareWith && ` (Compared with ${dayjs(period.compareWith.startDate).format('DD MMM')} - ${dayjs(period.compareWith.endDate).format('DD MMM YYYY')})`}
            </Text>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div style={{ padding: 24, textAlign: 'center', marginBottom: 24 }}>
            <Text type="danger">{error}</Text>
            <Button type="link" onClick={refresh}>Try Again</Button>
          </div>
        )}

        {/* KPI Cards */}
        <section style={{ marginBottom: 24 }}>
          <ExecutiveKPICards summary={summary} loading={loading} />
        </section>

        {/* Revenue & Profit Trend Chart */}
        <section style={{ marginBottom: 24 }}>
          <RevenueProfitTrend trends={trends} loading={loading} />
        </section>

        <Divider style={{ margin: '32px 0' }}>
          <Text type="secondary">Gross Profit Rankings</Text>
        </Divider>

        {/* Gross Profit Rankings - Products & Dealers */}
        <section style={{ marginBottom: 24 }}>
          <GrossProfitRankings
            products={profitabilityMatrix}
            dealers={byDealer}
            loading={loading}
          />
        </section>

        <Divider style={{ margin: '32px 0' }}>
          <Text type="secondary">Product Details</Text>
        </Divider>

        {/* Product P&L Table */}
        <section style={{ marginBottom: 24 }}>
          <ProductPLTable
            products={allProducts}
            loading={loading}
            onViewDetails={handleViewProductDetails}
          />
        </section>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            CEO Dashboard • Plati India Pvt. Ltd. • Data refreshed: {dayjs().format('DD MMM YYYY, HH:mm')}
          </Text>
        </div>
      </Content>

      {/* Print Styles */}
      <style>{`
        @media print {
          .ant-layout-header,
          .ant-breadcrumb,
          button,
          .ant-picker,
          .ant-table-pagination {
            display: none !important;
          }
          .ant-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .ant-layout {
            background: white !important;
          }
        }
      `}</style>
    </Layout>
  )
}

export default CEODashboard
