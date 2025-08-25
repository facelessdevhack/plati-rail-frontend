import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Tag,
  Typography,
  Row,
  Col,
  Progress,
  Select,
  Alert,
  Spin,
  notification,
  Tooltip,
  Badge,
  Space,
  Divider
} from 'antd'
import {
  RobotOutlined,
  BulbOutlined,
  FireOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  WarningOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  StarOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { getAIProductionSuggestions } from '../../redux/api/productionAPI'

const { Title, Text } = Typography
const { Option } = Select

const AISuggestionsPanel = ({ onApplySuggestion, onCreateFromSuggestion }) => {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.userDetails)
  
  const [suggestions, setSuggestions] = useState([])
  const [insights, setInsights] = useState({})
  const [metadata, setMetadata] = useState({})
  const [loading, setLoading] = useState(false)
  const [focusArea, setFocusArea] = useState('balanced')
  const [timeframe, setTimeframe] = useState('6m')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Load AI suggestions on component mount and when parameters change
  useEffect(() => {
    loadAISuggestions()
  }, [focusArea, timeframe])

  const loadAISuggestions = async () => {
    setLoading(true)
    try {
      const result = await dispatch(getAIProductionSuggestions({
        timeframe,
        focusArea,
        maxSuggestions: 8
      })).unwrap()

      if (result.success) {
        setSuggestions(result.data.suggestions || [])
        setInsights(result.data.insights || {})
        setMetadata(result.data.metadata || {})
        setLastUpdated(new Date())
        
        notification.success({
          message: 'AI Analysis Complete',
          description: `Generated ${result.data.suggestions?.length || 0} production suggestions`,
          duration: 3
        })
      }
    } catch (error) {
      console.error('Error loading AI suggestions:', error)
      notification.error({
        message: 'AI Analysis Failed',
        description: 'Unable to generate production suggestions. Please try again.',
        duration: 4
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplySuggestion = (suggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion)
      notification.success({
        message: 'Suggestion Applied',
        description: `Added ${suggestion.productName} to your production plan`,
        duration: 3
      })
    }
  }

  const handleCreatePlan = (suggestion) => {
    if (onCreateFromSuggestion) {
      onCreateFromSuggestion(suggestion)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'blue'
      default: return 'default'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <FireOutlined />
      case 'medium': return <ThunderboltOutlined />
      case 'low': return <StarOutlined />
      default: return <BulbOutlined />
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#52c41a' // green
    if (confidence >= 80) return '#1890ff' // blue
    if (confidence >= 70) return '#faad14' // yellow
    return '#f5222d' // red
  }

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RobotOutlined className="text-blue-600" />
            <span>AI Production Suggestions</span>
            <Badge count={suggestions.length} style={{ backgroundColor: '#52c41a' }} />
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadAISuggestions}
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        </div>
      }
      className="h-full"
    >
      {/* AI Controls */}
      <div className="mb-4">
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Select
              value={focusArea}
              onChange={setFocusArea}
              size="small"
              className="w-full"
            >
              <Option value="balanced">🔄 Balanced</Option>
              <Option value="profit">💰 Profit Focus</Option>
              <Option value="inventory">📦 Inventory Focus</Option>
              <Option value="demand">📈 Demand Focus</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Select
              value={timeframe}
              onChange={setTimeframe}
              size="small"
              className="w-full"
            >
              <Option value="3m">📅 3 Months</Option>
              <Option value="6m">📅 6 Months</Option>
            </Select>
          </Col>
        </Row>
      </div>

      {/* AI Insights Summary */}
      {Object.keys(insights).length > 0 && (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message={
            <div>
              <strong>🧠 AI Market Intelligence</strong>
              <div className="text-xs mt-1 space-y-1">
                <div><strong>Trends:</strong> {insights.marketTrends}</div>
                <div><strong>Capacity:</strong> {insights.capacityUtilization}</div>
                <div><strong>Risk:</strong> {insights.riskAssessment}</div>
              </div>
            </div>
          }
        />
      )}

      {/* Suggestions List */}
      <div className="space-y-3" style={{ height: 'calc(100vh - 420px)', minHeight: '400px', maxHeight: '600px', overflowY: 'auto' }}>
        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-2 text-gray-500">AI analyzing your business data...</div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <RobotOutlined className="text-4xl mb-2" />
            <div>No AI suggestions available</div>
            <div className="text-xs">Try adjusting the focus area or timeframe</div>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <Card
              key={suggestion.id || index}
              size="small"
              className={`cursor-pointer hover:shadow-md transition-all ${
                suggestion.priority === 'high' ? 'border-red-300' : 
                suggestion.priority === 'medium' ? 'border-orange-300' : 
                'border-blue-300'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag 
                      color={getPriorityColor(suggestion.priority)} 
                      icon={getPriorityIcon(suggestion.priority)}
                    >
                      {suggestion.priority?.toUpperCase()}
                    </Tag>
                    <div className="flex items-center gap-1">
                      <TrophyOutlined className="text-gray-400" />
                      <Progress 
                        percent={suggestion.confidence} 
                        size="small" 
                        strokeColor={getConfidenceColor(suggestion.confidence)}
                        format={() => `${suggestion.confidence}%`}
                        className="w-16"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div>
                  <div className="font-medium text-sm">{suggestion.productName}</div>
                  <div className="text-xs text-gray-600">
                    Target: {suggestion.targetFinish} • Quantity: {suggestion.suggestedQuantity} units
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                  <BulbOutlined className="mr-1" />
                  {suggestion.reasoning}
                </div>

                {/* Metrics */}
                <Row gutter={[8, 8]} className="text-xs">
                  <Col span={8}>
                    <div className="text-center">
                      <div className="font-medium text-green-600">₹{suggestion.profitMargin}%</div>
                      <div className="text-gray-500">Margin</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-center">
                      <div className="font-medium text-blue-600">{suggestion.expectedDemand}</div>
                      <div className="text-gray-500">Demand</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-center">
                      <div className="font-medium text-purple-600">{suggestion.timeToComplete}</div>
                      <div className="text-gray-500">Timeline</div>
                    </div>
                  </Col>
                </Row>

                {/* Risk Factors */}
                {suggestion.riskFactors && suggestion.riskFactors.length > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <WarningOutlined className="text-orange-500" />
                    <span className="text-gray-600">
                      Risks: {suggestion.riskFactors.join(', ')}
                    </span>
                  </div>
                )}

                {/* Target Markets */}
                {suggestion.markets && suggestion.markets.length > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-gray-600">Markets:</span>
                    {suggestion.markets.map(market => (
                      <Tag key={market} size="small" color="blue">{market}</Tag>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="flex-1"
                  >
                    Apply Suggestion
                  </Button>
                  <Tooltip title="Create production plan immediately">
                    <Button
                      size="small"
                      icon={<ThunderboltOutlined />}
                      onClick={() => handleCreatePlan(suggestion)}
                    >
                      Quick Create
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Footer */}
      {lastUpdated && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 text-center">
          Last updated: {lastUpdated.toLocaleTimeString()} • 
          Confidence: {metadata.confidenceScore || 'N/A'}% • 
          Analysis: {metadata.analysisDepth || 'Standard'}
        </div>
      )}
    </Card>
  )
}

export default AISuggestionsPanel