import React from 'react'
import { Card, Row, Col, List, Tag, Typography, Space, Tooltip, Empty, Spin } from 'antd'
import {
  TrophyOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'

const { Text, Title } = Typography

// Format currency for Indian Rupees
const formatCurrency = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toFixed(0)}`
}

// Get recommendation based on performance
const getRecommendation = (product, isTop) => {
  if (isTop) {
    if (product.grossMargin >= 30) return { text: 'Maintain pricing, expand distribution', color: 'green' }
    if (product.grossMargin >= 20) return { text: 'Good performer, consider promotion', color: 'blue' }
    return { text: 'Volume driver, monitor margin', color: 'cyan' }
  } else {
    if (product.grossMargin < 0) return { text: 'Review for discontinuation', color: 'red' }
    if (product.grossMargin < 10) return { text: 'Pricing review needed', color: 'orange' }
    if (product.volume < 5) return { text: 'Low demand, consider clearance', color: 'volcano' }
    return { text: 'Monitor performance', color: 'gold' }
  }
}

// Product insight item component
const InsightItem = ({ product, rank, isTop }) => {
  const recommendation = getRecommendation(product, isTop)

  return (
    <List.Item style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {/* Rank Badge */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: isTop ? '#f6ffed' : '#fff2f0',
            border: `1px solid ${isTop ? '#b7eb8f' : '#ffa39e'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            flexShrink: 0
          }}
        >
          <Text strong style={{ fontSize: 12, color: isTop ? '#52c41a' : '#ff4d4f' }}>
            {rank}
          </Text>
        </div>

        {/* Product Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 4 }}>
            <Text strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.productName || 'Unknown Product'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {product.model} • {product.inches}"
            </Text>
          </div>

          <Space size={4} wrap>
            <Tag color={isTop ? 'green' : (product.grossProfit >= 0 ? 'default' : 'red')} style={{ margin: 0 }}>
              Profit: {formatCurrency(product.grossProfit || 0)}
            </Tag>
            <Tag color={product.grossMargin >= 20 ? 'blue' : (product.grossMargin >= 10 ? 'orange' : 'red')} style={{ margin: 0 }}>
              {(product.grossMargin || 0).toFixed(1)}%
            </Tag>
          </Space>

          <div style={{ marginTop: 6 }}>
            <Tooltip title="Recommended Action">
              <Tag color={recommendation.color} style={{ fontSize: 11 }}>
                {recommendation.text}
              </Tag>
            </Tooltip>
          </div>
        </div>

        {/* Trend Indicator */}
        <div style={{ marginLeft: 8, textAlign: 'right', flexShrink: 0 }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            Units: {product.volume?.toLocaleString() || 0}
          </Text>
          <Text style={{ fontSize: 11, color: '#1890ff' }}>
            Rev: {formatCurrency(product.revenue || 0)}
          </Text>
        </div>
      </div>
    </List.Item>
  )
}

/**
 * Top/Bottom Insights Component
 * Shows top 10 profit contributors and bottom 10 products needing attention
 */
const TopBottomInsights = ({ topProducts = [], bottomProducts = [], loading }) => {
  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 12, height: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
              <Spin size="large" />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 12, height: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
              <Spin size="large" />
            </div>
          </Card>
        </Col>
      </Row>
    )
  }

  return (
    <Row gutter={[16, 16]}>
      {/* Top Performers */}
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <TrophyOutlined style={{ color: '#52c41a', fontSize: 18 }} />
              <span>Top 10 Profit Contributors</span>
              <Tooltip title="Products contributing most to gross profit">
                <InfoCircleOutlined style={{ color: '#999', fontSize: 14 }} />
              </Tooltip>
            </Space>
          }
          style={{
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderTop: '3px solid #52c41a'
          }}
          bodyStyle={{ padding: '0 16px' }}
        >
          {topProducts.length === 0 ? (
            <Empty description="No top products data" style={{ padding: '40px 0' }} />
          ) : (
            <>
              {/* Summary Stats */}
              <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Combined Profit</Text>
                    <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                      {formatCurrency(topProducts.reduce((sum, p) => sum + (p.grossProfit || 0), 0))}
                    </Title>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Avg Margin</Text>
                    <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                      {topProducts.length > 0
                        ? (topProducts.reduce((sum, p) => sum + (p.grossMargin || 0), 0) / topProducts.length).toFixed(1)
                        : 0}%
                    </Title>
                  </Col>
                </Row>
              </div>

              <List
                dataSource={topProducts.slice(0, 10)}
                renderItem={(item, index) => (
                  <InsightItem product={item} rank={index + 1} isTop={true} />
                )}
                style={{ maxHeight: 380, overflow: 'auto' }}
              />
            </>
          )}
        </Card>
      </Col>

      {/* Bottom Performers / Action Needed */}
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
              <span>Bottom 10 - Action Needed</span>
              <Tooltip title="Products with lowest margins or losses requiring review">
                <InfoCircleOutlined style={{ color: '#999', fontSize: 14 }} />
              </Tooltip>
            </Space>
          }
          style={{
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderTop: '3px solid #ff4d4f'
          }}
          bodyStyle={{ padding: '0 16px' }}
        >
          {bottomProducts.length === 0 ? (
            <Empty description="No products needing attention" style={{ padding: '40px 0' }} />
          ) : (
            <>
              {/* Summary Stats */}
              <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Combined Impact</Text>
                    <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                      {formatCurrency(bottomProducts.reduce((sum, p) => sum + (p.grossProfit || 0), 0))}
                    </Title>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Products at Risk</Text>
                    <Title level={4} style={{ margin: 0, color: '#faad14' }}>
                      {bottomProducts.filter(p => (p.grossMargin || 0) < 10).length}
                    </Title>
                  </Col>
                </Row>
              </div>

              <List
                dataSource={bottomProducts.slice(0, 10)}
                renderItem={(item, index) => (
                  <InsightItem product={item} rank={index + 1} isTop={false} />
                )}
                style={{ maxHeight: 380, overflow: 'auto' }}
              />
            </>
          )}
        </Card>
      </Col>

      {/* Decision Summary */}
      <Col span={24}>
        <Card
          style={{
            borderRadius: 12,
            backgroundColor: '#fafafa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <Space>
                <RiseOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Stars to Promote</Text>
                  <Text strong>
                    {topProducts.filter(p => (p.grossMargin || 0) >= 25).length} products with ≥25% margin
                  </Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space>
                <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Pricing Review</Text>
                  <Text strong>
                    {bottomProducts.filter(p => (p.grossMargin || 0) < 15 && (p.grossMargin || 0) >= 0).length} products with low margin
                  </Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space>
                <FallOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Discontinuation Review</Text>
                  <Text strong>
                    {bottomProducts.filter(p => (p.grossMargin || 0) < 0).length} products with negative margin
                  </Text>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  )
}

export default TopBottomInsights
