import React from 'react'
import { Card, Col, Divider, Progress, Row, Skeleton, Space, Typography } from 'antd'
import {
  ArrowDownOutlined,
  BankOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons'

const { Text, Title } = Typography

const formatMoney = value => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0))

const formatCompactMoney = value => {
  const amount = Number(value || 0)
  const absolute = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (absolute >= 10000000) return `${sign}₹${(absolute / 10000000).toFixed(2)} Cr`
  if (absolute >= 100000) return `${sign}₹${(absolute / 100000).toFixed(2)} L`
  if (absolute >= 1000) return `${sign}₹${(absolute / 1000).toFixed(1)} K`
  return `${sign}₹${Math.round(absolute).toLocaleString('en-IN')}`
}

const MetricCard = ({ title, value, caption, icon, tone, loading }) => (
  <Card className="pnl-metric-card" bordered={false} style={{ '--pnl-card-accent': tone }}>
    <div className="pnl-metric-card__topline">
      <Text className="pnl-metric-card__label" style={{ color: tone }}>{title}</Text>
      <span className="pnl-metric-card__icon" style={{ color: tone }}>
        {React.cloneElement(icon, { style: { fontSize: 19 } })}
      </span>
    </div>
    {loading ? (
      <Skeleton.Input active block style={{ height: 34, marginTop: 14 }} />
    ) : (
      <>
        <Title level={3} className="pnl-metric-card__value" title={formatMoney(value)}>
          {formatCompactMoney(value)}
        </Title>
        <Text type="secondary" className="pnl-metric-card__caption">{caption}</Text>
      </>
    )}
  </Card>
)

const MoneyRow = ({ label, value, strong, muted }) => (
  <div className={`pnl-money-row${strong ? ' pnl-money-row--strong' : ''}`}>
    <Text strong={strong} type={muted ? 'secondary' : undefined}>{label}</Text>
    <Text strong={strong} type={muted ? 'secondary' : undefined}>{formatMoney(value)}</Text>
  </div>
)

const PnLOverview = ({ summary, pnlStatement, dataQuality, loading }) => {
  const incomplete = dataQuality?.status === 'INCOMPLETE'
  const netSales = Number(pnlStatement?.netSales ?? summary?.totalRevenue ?? 0)
  const productCost = Number(pnlStatement?.fifoCogs ?? summary?.totalCost ?? 0)
  const grossProfit = Number(pnlStatement?.coveredGrossProfit ?? summary?.grossProfit ?? 0)
  const expenses = Number(pnlStatement?.totalOperatingExpenses ?? summary?.totalOperatingExpenses ?? 0)
  const netProfit = Number(
    incomplete
      ? pnlStatement?.indicativeNetProfit ?? summary?.indicativeNetProfit ?? 0
      : pnlStatement?.netProfit ?? summary?.netProfit ?? 0
  )
  const grossMargin = Number(pnlStatement?.coveredGrossMargin ?? summary?.grossMargin ?? 0)
  const netMargin = Number(
    incomplete
      ? pnlStatement?.indicativeNetMargin ?? summary?.indicativeNetMargin ?? 0
      : pnlStatement?.netMargin ?? summary?.netMargin ?? 0
  )
  const coverage = Number(dataQuality?.costingCoveragePercent ?? summary?.costingCoveragePercent ?? 0)
  const salesAwaitingCost = Number(pnlStatement?.salesAwaitingCost ?? summary?.salesAwaitingCost ?? 0)
  const salesIncludedInProfit = Number(pnlStatement?.salesWithCost ?? netSales - salesAwaitingCost)
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard
            title="Net sales"
            value={netSales}
            caption={`${Number(summary?.totalQuantity || 0).toLocaleString('en-IN')} pieces sold`}
            icon={<DollarOutlined />}
            tone="#f26c2d"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard
            title="Product cost"
            value={productCost}
            caption={`${coverage.toFixed(1)}% of sold pieces costed`}
            icon={<ShoppingCartOutlined />}
            tone="#4a90ff"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard
            title="Gross profit"
            value={grossProfit}
            caption={`${grossMargin.toFixed(1)}% margin${salesAwaitingCost > 0 ? ' on costed sales' : ''}`}
            icon={<RiseOutlined />}
            tone="#4ecb71"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard
            title="Net profit"
            value={netProfit}
            caption={`${netMargin.toFixed(1)}% net margin`}
            icon={<BankOutlined />}
            tone={netProfit >= 0 ? '#f26c2d' : '#e53e3e'}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card className="pnl-section-card" bordered={false} title="How profit is calculated">
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <div className="pnl-money-list">
                <MoneyRow label="Net sales" value={netSales} strong />
                {salesAwaitingCost > 0 && (
                  <>
                    <MoneyRow label="Sales waiting for product cost" value={-salesAwaitingCost} muted />
                    <MoneyRow label="Sales included in current profit" value={salesIncludedInProfit} strong />
                  </>
                )}
                <MoneyRow label="Less: Product cost" value={-productCost} muted />
                <MoneyRow label="Gross profit" value={grossProfit} strong />
                <MoneyRow label="Less: Business expenses" value={-expenses} muted />
                <Divider style={{ margin: '4px 0' }} />
                <MoneyRow
                  label="Net profit"
                  value={netProfit}
                  strong
                />
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card className="pnl-section-card" bordered={false} title="Sales coverage">
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <>
                <div className="pnl-coverage-heading">
                  <div>
                    <Title level={3} style={{ margin: 0 }}>{coverage.toFixed(1)}%</Title>
                    <Text type="secondary">of sold pieces have a product cost</Text>
                  </div>
                  <CheckCircleOutlined style={{ color: coverage === 100 ? '#4ecb71' : '#f26c2d', fontSize: 28 }} />
                </div>
                <Progress
                  percent={Math.min(Math.max(coverage, 0), 100)}
                  showInfo={false}
                  strokeColor={coverage === 100 ? '#4ecb71' : '#f26c2d'}
                  trailColor="#f3f3f5"
                  style={{ margin: '16px 0 18px' }}
                />
                <div className="pnl-activity-grid">
                  <div>
                    <Text type="secondary">Products</Text>
                    <Text strong>{Number(summary?.uniqueProducts || 0).toLocaleString('en-IN')}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Dealers</Text>
                    <Text strong>{Number(summary?.uniqueDealers || 0).toLocaleString('en-IN')}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Sales entries</Text>
                    <Text strong>{Number(summary?.totalEntries || 0).toLocaleString('en-IN')}</Text>
                  </div>
                </div>
                {salesAwaitingCost > 0 && (
                  <div className="pnl-coverage-note">
                    <ArrowDownOutlined /> {formatMoney(salesAwaitingCost)} of sales is waiting for product cost.
                  </div>
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

export default PnLOverview
