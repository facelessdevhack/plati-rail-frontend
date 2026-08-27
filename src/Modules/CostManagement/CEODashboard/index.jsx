import React, { useMemo, useState } from 'react'
import { Button, Col, DatePicker, Layout, Row, Segmented, Space, Tooltip, Typography } from 'antd'
import {
  CalendarOutlined,
  PrinterOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { COSTING_REPORT_FROM, disableBeforeCostingStart } from '../../../Utils/costingConfig'
import TabBar from '../../../Core/Components/TabBar'
import GrossProfitRankings from './components/GrossProfitRankings'
import PnLOverview from './components/PnLOverview'
import RevenueProfitTrend from './components/RevenueProfitTrend'
import useCEODashboardData from './hooks/useCEODashboardData'
import './pnl-dashboard.css'

const { Content } = Layout
const { Text } = Typography
const { RangePicker } = DatePicker

const CEODashboard = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [dateMode, setDateMode] = useState('month')
  const [selectedRange, setSelectedRange] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const {
    loading,
    error,
    summary,
    byDealer,
    trends,
    profitabilityMatrix,
    period,
    dataQuality,
    pnlStatement,
    netProfitAllocation,
    refresh,
    setPeriod,
    setCustomDateRange
  } = useCEODashboardData(selectedDate.year(), selectedDate.month() + 1)

  const handleDateChange = date => {
    if (!date) return
    setSelectedDate(date)
    setSelectedRange(null)
    setPeriod(date.year(), date.month() + 1)
  }

  const handleRangeChange = dates => {
    if (!dates?.[0] || !dates?.[1]) return
    setSelectedRange(dates)
    setCustomDateRange(dates)
  }

  const handleDateModeChange = mode => {
    setDateMode(mode)
    if (mode === 'month') {
      setSelectedRange(null)
      setPeriod(selectedDate.year(), selectedDate.month() + 1)
      return
    }

    const range = [COSTING_REPORT_FROM, dayjs()]
    setSelectedRange(range)
    setCustomDateRange(range)
  }

  const periodLabel = useMemo(() => {
    if (!period) return 'the selected period'
    if (period.isCustomRange) {
      return `${dayjs(period.startDate).format('DD MMM YYYY')} – ${dayjs(period.endDate).format('DD MMM YYYY')}`
    }
    return `${period.monthName} ${period.year}`
  }, [period])

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'performance', label: 'Products & dealers' }
  ]

  return (
    <Layout className="pnl-dashboard">
      <Content className="pnl-dashboard__content">
        <header className="pnl-dashboard__header">
          <div>
            <div className="pnl-dashboard__title-row">
              <h1 className="pnl-dashboard__title">Profit &amp; Loss</h1>
            </div>
            <Text type="secondary" className="pnl-dashboard__subtitle">
              See sales, product cost and profit for {periodLabel}.
            </Text>
          </div>

          <div className="pnl-dashboard__controls">
            <Segmented
              className="pnl-period-toggle"
              options={[
                { label: 'Month', value: 'month', icon: <CalendarOutlined /> },
                { label: 'Custom dates', value: 'range', icon: <CalendarOutlined /> }
              ]}
              value={dateMode}
              onChange={handleDateModeChange}
            />
            {dateMode === 'month' ? (
              <DatePicker
                className="pnl-date-picker"
                picker="month"
                value={selectedDate}
                onChange={handleDateChange}
                format="MMMM YYYY"
                allowClear={false}
                style={{ width: 170 }}
                disabledDate={disableBeforeCostingStart}
              />
            ) : (
              <RangePicker
                className="pnl-date-picker"
                value={selectedRange}
                onChange={handleRangeChange}
                format="DD MMM YYYY"
                style={{ width: 270 }}
                disabledDate={disableBeforeCostingStart}
                presets={[
                  { label: 'This month', value: [dayjs().startOf('month'), dayjs()] },
                  { label: 'Last month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                  { label: 'This quarter', value: [dayjs().startOf('quarter'), dayjs()] },
                  { label: 'This year', value: [dayjs().startOf('year'), dayjs()] }
                ]}
              />
            )}
            <Tooltip title="Refresh numbers">
              <Button
                className="pnl-icon-button"
                aria-label="Refresh numbers"
                icon={<ReloadOutlined spin={loading} />}
                onClick={refresh}
                disabled={loading}
              />
            </Tooltip>
            <Tooltip title="Print report">
              <Button className="pnl-icon-button" aria-label="Print report" icon={<PrinterOutlined />} onClick={() => window.print()} />
            </Tooltip>
          </div>
        </header>

        {error && (
          <Row justify="center" style={{ marginBottom: 20 }}>
            <Col>
              <Text type="danger">The report could not be loaded. </Text>
              <Button type="link" onClick={refresh}>Try again</Button>
            </Col>
          </Row>
        )}

        <TabBar tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' ? (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <PnLOverview
              summary={summary}
              pnlStatement={pnlStatement}
              dataQuality={dataQuality}
              loading={loading}
            />
            <RevenueProfitTrend trends={trends} loading={loading} period={period} />
          </Space>
        ) : (
          <GrossProfitRankings
            products={profitabilityMatrix}
            dealers={byDealer}
            netProfitAllocation={netProfitAllocation}
            loading={loading}
          />
        )}

        <footer className="pnl-dashboard__footer">
          <Text type="secondary" style={{ fontSize: 12 }}>
            P&amp;L Dashboard · Updated {dayjs().format('DD MMM YYYY, HH:mm')}
          </Text>
        </footer>
      </Content>
    </Layout>
  )
}

export default CEODashboard
