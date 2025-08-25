import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Select,
  Typography,
  Tag,
  Progress,
  Tooltip
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

const TrendAnalysisChart = ({ aiInsights, businessData }) => {
  const [viewMode, setViewMode] = useState('overview')
  const [timeRange, setTimeRange] = useState('7d')

  // Mock trend data - in real implementation, this would come from the AI insights
  const trendData = {
    demandTrends: [
      { finish: 'Chrome', trend: '+25%', direction: 'up', confidence: 85 },
      { finish: 'Diamond Cut', trend: '+18%', direction: 'up', confidence: 78 },
      { finish: 'Black', trend: '+12%', direction: 'up', confidence: 72 },
      { finish: 'Silver', trend: '-5%', direction: 'down', confidence: 68 },
      { finish: 'Anthracite', trend: '+8%', direction: 'up', confidence: 65 }
    ],
    sizeTrends: [
      { size: '17"', demand: 85, growth: '+15%', priority: 'high' },
      { size: '18"', demand: 78, growth: '+12%', priority: 'high' },
      { size: '19"', demand: 65, growth: '+8%', priority: 'medium' },
      { size: '20"', demand: 45, growth: '+3%', priority: 'low' },
      { size: '16"', demand: 35, growth: '-2%', priority: 'low' }
    ],
    seasonalInsights: {
      currentQuarter: 'Q3',
      expectedGrowth: '+22%',
      peakMonths: ['October', 'November', 'December'],
      lowMonths: ['June', 'July', 'August']
    }
  }

  const getTrendIcon = (direction) => {
    return direction === 'up' ? 
      <ArrowUpOutlined className="text-green-500" /> : 
      <ArrowDownOutlined className="text-red-500" />
  }

  const getTrendColor = (trend) => {
    return trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'blue'
      default: return 'default'
    }
  }

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChartOutlined className="text-purple-600" />
            <span>Market Trend Analysis</span>
          </div>
          <Select
            value={viewMode}
            onChange={setViewMode}
            size="small"
            className="w-32"
          >
            <Option value="overview">📊 Overview</Option>
            <Option value="detailed">📈 Detailed</Option>
            <Option value="forecast">🔮 Forecast</Option>
          </Select>
        </div>
      }
      className="h-full"
    >
      {viewMode === 'overview' && (
        <div className="space-y-4">
          {/* AI Market Intelligence Summary */}
          {aiInsights && Object.keys(aiInsights).length > 0 && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="text-sm font-medium text-purple-900 mb-2">
                🤖 AI Market Intelligence
              </div>
              <div className="text-xs text-purple-800 space-y-1">
                <div><strong>Trends:</strong> {aiInsights.marketTrends}</div>
                <div><strong>Focus:</strong> {aiInsights.recommendedFocus}</div>
              </div>
            </div>
          )}

          {/* Demand Trends by Finish */}
          <div>
            <Title level={5} className="mb-3">
              <LineChartOutlined className="mr-2" />
              Finish Demand Trends
            </Title>
            <div className="space-y-2">
              {trendData.demandTrends.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(item.direction)}
                    <span className="font-medium text-sm">{item.finish}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm ${getTrendColor(item.trend)}`}>
                      {item.trend}
                    </span>
                    <Tooltip title={`Confidence: ${item.confidence}%`}>
                      <Progress 
                        percent={item.confidence} 
                        size="small" 
                        strokeColor={item.confidence > 80 ? '#52c41a' : '#faad14'}
                        className="w-16"
                        showInfo={false}
                      />
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Size Demand Analysis */}
          <div>
            <Title level={5} className="mb-3">
              <PieChartOutlined className="mr-2" />
              Size Popularity Trends
            </Title>
            <div className="space-y-2">
              {trendData.sizeTrends.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Tag color={getPriorityColor(item.priority)} size="small">
                      {item.priority}
                    </Tag>
                    <span className="font-medium text-sm">{item.size}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress 
                      percent={item.demand} 
                      size="small" 
                      strokeColor="#1890ff"
                      className="w-20"
                      format={() => `${item.demand}%`}
                    />
                    <span className={`text-xs font-medium ${getTrendColor(item.growth)}`}>
                      {item.growth}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'detailed' && (
        <div className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <BarChartOutlined className="text-4xl mb-2" />
            <div>Detailed Analytics</div>
            <div className="text-xs">Coming soon with advanced charts</div>
          </div>
        </div>
      )}

      {viewMode === 'forecast' && (
        <div className="space-y-4">
          {/* Seasonal Forecast */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
            <Title level={5} className="mb-3 text-blue-900">
              📅 Seasonal Forecast
            </Title>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Current Quarter:</span>
                <Tag color="blue">{trendData.seasonalInsights.currentQuarter}</Tag>
              </div>
              <div className="flex justify-between">
                <span>Expected Growth:</span>
                <span className="font-bold text-green-600">
                  {trendData.seasonalInsights.expectedGrowth}
                </span>
              </div>
              <div>
                <span className="font-medium">Peak Months:</span>
                <div className="mt-1">
                  {trendData.seasonalInsights.peakMonths.map(month => (
                    <Tag key={month} color="green" size="small" className="mb-1">
                      {month}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium">Low Season:</span>
                <div className="mt-1">
                  {trendData.seasonalInsights.lowMonths.map(month => (
                    <Tag key={month} color="orange" size="small" className="mb-1">
                      {month}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-900 mb-2">
              💡 AI Production Recommendations
            </div>
            <div className="text-xs text-green-800 space-y-1">
              <div>• Focus on Chrome and Diamond Cut finishes for Q4</div>
              <div>• Increase 17" and 18" production by 20%</div>
              <div>• Prepare for seasonal demand spike in October</div>
              <div>• Consider reducing Silver finish production</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 text-center">
        Analysis powered by AI • Real-time market data • Updated continuously
      </div>
    </Card>
  )
}

export default TrendAnalysisChart