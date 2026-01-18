import React from 'react'
import { Row, Col, Card, Progress, Typography, Space, Tooltip } from 'antd'
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  WarningOutlined,
  ShoppingCartOutlined,
  TeamOutlined
} from '@ant-design/icons'

const { Text } = Typography

// Format currency for Indian Rupees with breakdown (e.g., "3Cr 25L" or "25L 35K")
const formatCurrencyBreakdown = (value) => {
  if (value === null || value === undefined || value === 0) return '₹0'

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 10000000) {
    // Crores
    const crores = Math.floor(absValue / 10000000)
    const lakhs = Math.floor((absValue % 10000000) / 100000)
    if (lakhs > 0) {
      return `${sign}₹${crores}Cr ${lakhs}L`
    }
    return `${sign}₹${crores}Cr`
  }

  if (absValue >= 100000) {
    // Lakhs
    const lakhs = Math.floor(absValue / 100000)
    const thousands = Math.floor((absValue % 100000) / 1000)
    if (thousands > 0) {
      return `${sign}₹${lakhs}L ${thousands}K`
    }
    return `${sign}₹${lakhs}L`
  }

  if (absValue >= 1000) {
    // Thousands
    const thousands = Math.floor(absValue / 1000)
    const hundreds = Math.floor(absValue % 1000)
    if (hundreds > 0) {
      return `${sign}₹${thousands}K ${hundreds}`
    }
    return `${sign}₹${thousands}K`
  }

  return `${sign}₹${Math.round(absValue)}`
}

// Compact format for smaller displays
const formatCurrencyCompact = (value) => {
  if (value === null || value === undefined || value === 0) return '₹0'

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 10000000) return `${sign}₹${(absValue / 10000000).toFixed(1)}Cr`
  if (absValue >= 100000) return `${sign}₹${(absValue / 100000).toFixed(1)}L`
  if (absValue >= 1000) return `${sign}₹${(absValue / 1000).toFixed(1)}K`
  return `${sign}₹${Math.round(absValue)}`
}

// Growth indicator component
const GrowthIndicator = ({ value, suffix = '%' }) => {
  if (value === 0 || value === undefined || value === null) return <Text type="secondary">0{suffix}</Text>

  const isPositive = value > 0
  const color = isPositive ? '#52c41a' : '#ff4d4f'
  const Icon = isPositive ? RiseOutlined : FallOutlined

  return (
    <Space size={4}>
      <Icon style={{ color }} />
      <Text style={{ color, fontWeight: 500 }}>
        {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
      </Text>
    </Space>
  )
}

// Single KPI Card component with formatted currency
const KPICard = ({
  title,
  value,
  formattedValue,
  suffix,
  icon,
  iconColor,
  growth,
  growthLabel,
  extra,
  loading
}) => (
  <Card
    size="small"
    className="kpi-card"
    style={{
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      height: '100%'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ flex: 1 }}>
        <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Text>
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4, color: '#262626' }}>
          {loading ? (
            <span style={{ color: '#d9d9d9' }}>Loading...</span>
          ) : (
            <>
              {formattedValue || value}
              {suffix && <span style={{ fontSize: 16, marginLeft: 2 }}>{suffix}</span>}
            </>
          )}
        </div>
        {growth !== undefined && (
          <div style={{ marginTop: 4 }}>
            <GrowthIndicator value={growth} />
            {growthLabel && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                vs last month
              </Text>
            )}
          </div>
        )}
        {extra}
      </div>
      {icon && (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: `${iconColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {React.cloneElement(icon, { style: { fontSize: 24, color: iconColor } })}
        </div>
      )}
    </div>
  </Card>
)

// Best/Worst Product Card
const ProductHighlightCard = ({ product, type, loading }) => {
  const isBest = type === 'best'
  const bgColor = isBest ? '#f6ffed' : '#fff2e8'
  const borderColor = isBest ? '#b7eb8f' : '#ffbb96'
  const iconColor = isBest ? '#52c41a' : '#fa8c16'
  const Icon = isBest ? TrophyOutlined : WarningOutlined

  if (!product) {
    return (
      <Card
        size="small"
        style={{
          borderRadius: 12,
          backgroundColor: bgColor,
          borderColor,
          height: '100%'
        }}
      >
        <Text type="secondary">No data available</Text>
      </Card>
    )
  }

  return (
    <Card
      size="small"
      style={{
        borderRadius: 12,
        backgroundColor: bgColor,
        borderColor,
        height: '100%'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon style={{ fontSize: 20, color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
            {isBest ? 'Top Performer' : 'Needs Attention'}
          </Text>
          <Tooltip title={product.productName}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: 2
              }}
            >
              {product.productName}
            </div>
          </Tooltip>
          <Space size={12} style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 12 }}>
              Profit: <strong>{formatCurrencyCompact(product.grossProfit)}</strong>
            </Text>
            <Text style={{ fontSize: 12 }}>
              Margin: <strong style={{ color: product.grossMargin >= 20 ? '#52c41a' : '#fa8c16' }}>
                {product.grossMargin}%
              </strong>
            </Text>
          </Space>
        </div>
      </div>
    </Card>
  )
}

/**
 * Executive KPI Cards Component
 * Displays key metrics for CEO dashboard
 */
const ExecutiveKPICards = ({ summary, loading }) => {
  return (
    <div className="executive-kpi-cards">
      <Row gutter={[16, 16]}>
        {/* Revenue */}
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <KPICard
            title="Total Revenue"
            formattedValue={formatCurrencyBreakdown(summary?.totalRevenue)}
            icon={<DollarOutlined />}
            iconColor="#1890ff"
            growth={summary?.growth?.revenue}
            growthLabel
            loading={loading}
          />
        </Col>

        {/* Gross Profit */}
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <KPICard
            title="Gross Profit"
            formattedValue={formatCurrencyBreakdown(summary?.grossProfit)}
            icon={<RiseOutlined />}
            iconColor="#52c41a"
            growth={summary?.growth?.profit}
            growthLabel
            loading={loading}
            extra={
              <div style={{ marginTop: 4 }}>
                <Progress
                  percent={summary?.grossMargin || 0}
                  size="small"
                  strokeColor="#52c41a"
                  format={p => `${p.toFixed(1)}%`}
                />
              </div>
            }
          />
        </Col>

        {/* Net Profit */}
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <KPICard
            title="Net Profit"
            formattedValue={formatCurrencyBreakdown(summary?.netProfit)}
            icon={<DollarOutlined />}
            iconColor={summary?.netProfit >= 0 ? '#722ed1' : '#ff4d4f'}
            loading={loading}
            extra={
              <Text type="secondary" style={{ fontSize: 11 }}>
                Net Margin: {summary?.netMargin?.toFixed(1) || 0}%
              </Text>
            }
          />
        </Col>

        {/* Units Sold */}
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <KPICard
            title="Units Sold"
            formattedValue={(summary?.totalQuantity || 0).toLocaleString('en-IN')}
            icon={<ShoppingCartOutlined />}
            iconColor="#13c2c2"
            loading={loading}
            extra={
              <Text type="secondary" style={{ fontSize: 11 }}>
                {summary?.uniqueProducts || 0} unique products
              </Text>
            }
          />
        </Col>

        {/* Active Dealers */}
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <KPICard
            title="Active Dealers"
            formattedValue={(summary?.uniqueDealers || 0).toLocaleString('en-IN')}
            icon={<TeamOutlined />}
            iconColor="#eb2f96"
            loading={loading}
            extra={
              <Text type="secondary" style={{ fontSize: 11 }}>
                {summary?.totalEntries || 0} transactions
              </Text>
            }
          />
        </Col>
      </Row>

      {/* Best and Worst Products Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <ProductHighlightCard
            product={summary?.bestProduct}
            type="best"
            loading={loading}
          />
        </Col>
        <Col xs={24} md={12}>
          <ProductHighlightCard
            product={summary?.worstProduct}
            type="worst"
            loading={loading}
          />
        </Col>
      </Row>
    </div>
  )
}

export default ExecutiveKPICards
