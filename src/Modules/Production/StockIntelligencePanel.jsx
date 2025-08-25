import React, { useMemo, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Button,
  Tooltip,
  Select,
  Typography,
  Alert,
  Table,
  Space,
  Badge
} from 'antd'
import {
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  RocketOutlined,
  EyeOutlined,
  DollarOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

const StockIntelligencePanel = ({ 
  stockData = [], 
  onRecommendationAction,
  selectedCells = new Set(),
  onCellSelect 
}) => {
  const [analysisType, setAnalysisType] = useState('overview')
  const [timeframe, setTimeframe] = useState('current')

  // Generate AI recommendations
  const generateIntelligentRecommendations = (analysis) => {
    const recommendations = []

    // Safety check for analysis object
    if (!analysis || typeof analysis !== 'object') {
      return recommendations
    }

    // Stock optimization recommendations
    if (analysis.stockDistribution && analysis.stockDistribution.out > 0) {
      recommendations.push({
        type: 'urgent',
        icon: '🚨',
        title: 'Critical Stock Alert',
        description: `${analysis.stockDistribution.out} alloys are completely out of stock`,
        action: 'Create immediate production plans for out-of-stock items',
        impact: 'high',
        effort: 'medium',
        roi: 'high'
      })
    }

    if (analysis.stockDistribution && analysis.stockDistribution.low > analysis.stockDistribution.high) {
      recommendations.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Inventory Imbalance',
        description: 'More items have low stock than high stock',
        action: 'Rebalance inventory by increasing production of low-stock items',
        impact: 'medium',
        effort: 'high',
        roi: 'medium'
      })
    }

    // Value optimization
    const highValueLowStock = analysis.opportunityMatrix && analysis.valueAnalysis 
      ? analysis.opportunityMatrix.filter(item => 
          item.value > analysis.valueAnalysis.avgValue && item.stock < 20
        )
      : []

    if (highValueLowStock.length > 0) {
      recommendations.push({
        type: 'opportunity',
        icon: '💰',
        title: 'High-Value Opportunity',
        description: `${highValueLowStock.length} high-value items have low stock`,
        action: 'Prioritize production for high-value, low-stock items',
        impact: 'high',
        effort: 'low',
        roi: 'very_high'
      })
    }

    // Size-based recommendations
    const topSize = analysis.topSizes && analysis.topSizes.length > 0 ? analysis.topSizes[0] : null
    if (topSize) {
      recommendations.push({
        type: 'insight',
        icon: '📊',
        title: 'Size Performance Leader',
        description: `${topSize.size}" wheels generate highest value (${topSize.count} models)`,
        action: 'Focus expansion on popular size categories',
        impact: 'medium',
        effort: 'low',
        roi: 'medium'
      })
    }

    // Efficiency recommendations
    const lowEfficiencyItems = analysis.opportunityMatrix && analysis.valueAnalysis
      ? analysis.opportunityMatrix.filter(item => 
          item.stock > 100 && item.value < analysis.valueAnalysis.avgValue
        )
      : []

    if (lowEfficiencyItems.length > 0) {
      recommendations.push({
        type: 'efficiency',
        icon: '⚡',
        title: 'Inventory Efficiency',
        description: `${lowEfficiencyItems.length} items have high stock but low value`,
        action: 'Reduce production or find conversion opportunities',
        impact: 'medium',
        effort: 'low',
        roi: 'medium'
      })
    }

    return recommendations.slice(0, 6) // Limit to top 6 recommendations
  }

  // Advanced analytics calculations
  const intelligence = useMemo(() => {
    if (!stockData || stockData.length === 0) return {}

    const totalAlloys = stockData.length
    const alloysBySize = {}
    const alloysByPcd = {}
    const alloysByFinish = {}
    const stockDistribution = { high: 0, medium: 0, low: 0, out: 0 }
    const valueAnalysis = { totalValue: 0, avgValue: 0, highValueItems: [] }
    const opportunityMatrix = []

    stockData.forEach(alloy => {
      const totalStock = (alloy.inHouseStock || 0) + (alloy.showroomStock || 0)
      const estimatedValue = totalStock * (alloy.estimatedPrice || 50) // Assuming avg price

      // Size analysis
      if (!alloysBySize[alloy.inches]) alloysBySize[alloy.inches] = { count: 0, stock: 0, value: 0 }
      alloysBySize[alloy.inches].count++
      alloysBySize[alloy.inches].stock += totalStock
      alloysBySize[alloy.inches].value += estimatedValue

      // PCD analysis
      if (!alloysByPcd[alloy.pcd]) alloysByPcd[alloy.pcd] = { count: 0, stock: 0, value: 0 }
      alloysByPcd[alloy.pcd].count++
      alloysByPcd[alloy.pcd].stock += totalStock
      alloysByPcd[alloy.pcd].value += estimatedValue

      // Finish analysis
      if (!alloysByFinish[alloy.finish]) alloysByFinish[alloy.finish] = { count: 0, stock: 0, value: 0 }
      alloysByFinish[alloy.finish].count++
      alloysByFinish[alloy.finish].stock += totalStock
      alloysByFinish[alloy.finish].value += estimatedValue

      // Stock distribution
      if (totalStock === 0) stockDistribution.out++
      else if (totalStock < 10) stockDistribution.low++
      else if (totalStock < 50) stockDistribution.medium++
      else stockDistribution.high++

      // Value analysis
      valueAnalysis.totalValue += estimatedValue
      if (estimatedValue > 1000) {
        valueAnalysis.highValueItems.push({ ...alloy, estimatedValue })
      }

      // Opportunity matrix (combinations with high potential)
      const opportunity = {
        alloy,
        size: alloy.inches,
        pcd: alloy.pcd,
        finish: alloy.finish,
        stock: totalStock,
        value: estimatedValue,
        conversionPotential: totalStock > 0 ? totalStock * 0.8 : 0, // Assuming 80% conversion rate
        priority: totalStock === 0 ? 'urgent' : totalStock < 10 ? 'high' : 'normal'
      }
      opportunityMatrix.push(opportunity)
    })

    valueAnalysis.avgValue = totalAlloys > 0 ? valueAnalysis.totalValue / totalAlloys : 0

    // Generate intelligent recommendations
    const recommendations = generateIntelligentRecommendations({
      alloysBySize,
      alloysByPcd, 
      alloysByFinish,
      stockDistribution,
      valueAnalysis,
      opportunityMatrix,
      totalAlloys
    })

    // Top performers
    const topSizes = Object.entries(alloysBySize)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5)
      .map(([size, data]) => ({ size, ...data }))

    const topPcds = Object.entries(alloysByPcd)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5)
      .map(([pcd, data]) => ({ pcd, ...data }))

    const topFinishes = Object.entries(alloysByFinish)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5)
      .map(([finish, data]) => ({ finish, ...data }))

    return {
      totalAlloys,
      alloysBySize,
      alloysByPcd,
      alloysByFinish,
      stockDistribution,
      valueAnalysis,
      opportunityMatrix: opportunityMatrix.sort((a, b) => b.value - a.value),
      recommendations,
      topSizes,
      topPcds,
      topFinishes
    }
  }, [stockData])

  const getROIColor = (roi) => {
    switch (roi) {
      case 'very_high': return 'green'
      case 'high': return 'blue'
      case 'medium': return 'orange'
      case 'low': return 'gray'
      default: return 'default'
    }
  }

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return <FireOutlined />
      case 'medium': return <ThunderboltOutlined />
      case 'low': return <CheckCircleOutlined />
      default: return <BulbOutlined />
    }
  }

  const opportunityColumns = [
    {
      title: 'Product',
      dataIndex: 'alloy',
      key: 'product',
      render: (alloy) => (
        <div>
          <div className="font-medium text-sm">{alloy.productName}</div>
          <div className="text-xs text-gray-500">
            {alloy.inches}" × {alloy.pcd} • {alloy.finish}
          </div>
        </div>
      )
    },
    {
      title: 'Current Stock',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      render: (stock) => (
        <Badge 
          count={stock} 
          style={{ 
            backgroundColor: stock === 0 ? '#f5222d' : 
                             stock < 10 ? '#faad14' : '#52c41a' 
          }}
        />
      )
    },
    {
      title: 'Estimated Value',
      dataIndex: 'value',
      key: 'value',
      sorter: (a, b) => a.value - b.value,
      render: (value) => (
        <span className="font-medium">
          ${Math.round(value).toLocaleString()}
        </span>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      filters: [
        { text: 'Urgent', value: 'urgent' },
        { text: 'High', value: 'high' },
        { text: 'Normal', value: 'normal' }
      ],
      onFilter: (value, record) => record.priority === value,
      render: (priority) => (
        <Tag color={
          priority === 'urgent' ? 'red' :
          priority === 'high' ? 'orange' : 'blue'
        }>
          {priority.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          size="small"
          icon={<RocketOutlined />}
          onClick={() => onCellSelect && onCellSelect(record.size, record.pcd)}
        >
          Select
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Select
              value={analysisType}
              onChange={setAnalysisType}
              className="w-full"
              size="large"
            >
              <Option value="overview">Overview Analysis</Option>
              <Option value="opportunities">Opportunities</Option>
              <Option value="performance">Performance</Option>
              <Option value="recommendations">AI Recommendations</Option>
            </Select>
          </Col>
          <Col xs={24} md={12}>
            <Select
              value={timeframe}
              onChange={setTimeframe}
              className="w-full"
              size="large"
            >
              <Option value="current">Current Stock</Option>
              <Option value="weekly">Weekly Trend</Option>
              <Option value="monthly">Monthly Analysis</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Overview Analysis */}
      {analysisType === 'overview' && (
        <>
          {/* Stock Distribution */}
          <Card title="📊 Stock Distribution Analysis">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>High Stock (50+)</span>
                    <span className="font-semibold">{intelligence.stockDistribution?.high || 0}</span>
                  </div>
                  <Progress 
                    percent={intelligence.totalAlloys > 0 ? 
                      (intelligence.stockDistribution?.high / intelligence.totalAlloys * 100) : 0} 
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                  
                  <div className="flex justify-between items-center">
                    <span>Medium Stock (10-49)</span>
                    <span className="font-semibold">{intelligence.stockDistribution?.medium || 0}</span>
                  </div>
                  <Progress 
                    percent={intelligence.totalAlloys > 0 ? 
                      (intelligence.stockDistribution?.medium / intelligence.totalAlloys * 100) : 0} 
                    strokeColor="#1890ff"
                    showInfo={false}
                  />
                  
                  <div className="flex justify-between items-center">
                    <span>Low Stock (1-9)</span>
                    <span className="font-semibold">{intelligence.stockDistribution?.low || 0}</span>
                  </div>
                  <Progress 
                    percent={intelligence.totalAlloys > 0 ? 
                      (intelligence.stockDistribution?.low / intelligence.totalAlloys * 100) : 0} 
                    strokeColor="#faad14"
                    showInfo={false}
                  />
                  
                  <div className="flex justify-between items-center">
                    <span>Out of Stock</span>
                    <span className="font-semibold">{intelligence.stockDistribution?.out || 0}</span>
                  </div>
                  <Progress 
                    percent={intelligence.totalAlloys > 0 ? 
                      (intelligence.stockDistribution?.out / intelligence.totalAlloys * 100) : 0} 
                    strokeColor="#f5222d"
                    showInfo={false}
                  />
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
                  <Title level={4} className="mb-4">Value Analysis</Title>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Portfolio Value</span>
                      <span className="font-bold text-lg text-green-600">
                        ${Math.round(intelligence.valueAnalysis?.totalValue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Item Value</span>
                      <span className="font-semibold">
                        ${Math.round(intelligence.valueAnalysis?.avgValue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>High-Value Items</span>
                      <span className="font-semibold">
                        {intelligence.valueAnalysis?.highValueItems?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Top Performers */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card title="🏆 Top Sizes by Value" size="small">
                <div className="space-y-2">
                  {intelligence.topSizes?.slice(0, 5).map((item, index) => (
                    <div key={item.size} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge count={index + 1} style={{ backgroundColor: '#1890ff' }} />
                        <span className="font-medium">{item.size}"</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">${Math.round(item.value).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{item.count} models</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="🎯 Top PCDs by Value" size="small">
                <div className="space-y-2">
                  {intelligence.topPcds?.slice(0, 5).map((item, index) => (
                    <div key={item.pcd} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge count={index + 1} style={{ backgroundColor: '#52c41a' }} />
                        <span className="font-medium">{item.pcd}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">${Math.round(item.value).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{item.count} models</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="✨ Top Finishes by Value" size="small">
                <div className="space-y-2">
                  {intelligence.topFinishes?.slice(0, 5).map((item, index) => (
                    <div key={item.finish} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge count={index + 1} style={{ backgroundColor: '#faad14' }} />
                        <span className="font-medium text-sm">{item.finish}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">${Math.round(item.value).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{item.count} models</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* AI Recommendations */}
      {analysisType === 'recommendations' && (
        <Card title="🤖 AI-Powered Production Recommendations">
          <Row gutter={[16, 16]}>
            {intelligence.recommendations?.map((rec, index) => (
              <Col xs={24} lg={12} key={index}>
                <div className="border border-gray-200 rounded-lg p-4 h-full">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-2xl">{rec.icon}</div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{rec.title}</span>
                        <Tag color={getROIColor(rec.roi)} size="small">
                          {rec.roi?.replace('_', ' ').toUpperCase()} ROI
                        </Tag>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            {getImpactIcon(rec.impact)}
                            Impact: {rec.impact}
                          </span>
                        </div>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => onRecommendationAction && onRecommendationAction(rec)}
                        >
                          Apply
                        </Button>
                      </div>
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <strong>Action:</strong> {rec.action}
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Opportunities Table */}
      {analysisType === 'opportunities' && (
        <Card title="💎 Production Opportunities" extra={
          <Badge count={intelligence.opportunityMatrix?.length || 0} style={{ backgroundColor: '#52c41a' }} />
        }>
          <Table
            columns={opportunityColumns}
            dataSource={intelligence.opportunityMatrix}
            rowKey={(record) => record.alloy.id}
            size="small"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 600 }}
          />
        </Card>
      )}
    </div>
  )
}

export default StockIntelligencePanel