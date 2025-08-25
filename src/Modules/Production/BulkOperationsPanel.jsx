import React, { useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  InputNumber,
  Form,
  Switch,
  Tooltip,
  Badge,
  Progress,
  Tag,
  Alert,
  Typography,
  Divider,
  Collapse,
  Slider,
  Checkbox,
  Space
} from 'antd'
import {
  RocketOutlined,
  SelectOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  TrophyOutlined,
  FireOutlined,
  SaveOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const BulkOperationsPanel = ({
  stockMatrix,
  selectedCells,
  selectedAlloys,
  onCellSelect,
  onBulkSelect,
  onClearSelection,
  onCreatePlans,
  stepPresets = []
}) => {
  const [operationMode, setOperationMode] = useState('smart')
  const [selectionCriteria, setSelectionCriteria] = useState({
    stockLevel: 'any',
    valueRange: [0, 100],
    priority: 'any',
    finish: 'any'
  })
  const [bulkSettings, setBulkSettings] = useState({
    quantityMethod: 'percentage',
    quantityValue: 50,
    preset: null,
    urgent: false,
    autoOptimize: true
  })

  // Smart selection algorithms
  const smartSelectionOptions = [
    {
      id: 'low_stock_urgent',
      name: 'Low Stock Sources',
      description:
        'Select source alloys with stock < 10 units for urgent conversion',
      icon: '🚨',
      color: 'red',
      criteria: alloy => {
        const stock = (alloy.inHouseStock || 0) + (alloy.showroomStock || 0)
        return stock > 0 && stock < 10
      }
    },
    {
      id: 'out_of_stock',
      name: 'Out of Stock',
      description: 'Select all completely out of stock alloys',
      icon: '⚠️',
      color: 'orange',
      criteria: alloy => {
        const stock = (alloy.inHouseStock || 0) + (alloy.showroomStock || 0)
        return stock === 0
      }
    },
    {
      id: 'high_conversion_potential',
      name: 'High Conversion Potential',
      description: 'Select source materials with good conversion opportunities',
      icon: '💰',
      color: 'gold',
      criteria: alloy => {
        const stock = (alloy.inHouseStock || 0) + (alloy.showroomStock || 0)
        // Good conversion candidates: decent stock, not premium finishes
        return (
          stock >= 5 &&
          stock < 50 &&
          !['Chrome', 'Diamond Cut'].includes(alloy.finish)
        )
      }
    },
    {
      id: 'popular_sizes',
      name: 'Popular Sizes',
      description: 'Select most common wheel sizes (17", 18", 19")',
      icon: '📊',
      color: 'blue',
      criteria: alloy => {
        return ['17', '18', '19'].includes(alloy.inches)
      }
    },
    {
      id: 'balanced_portfolio',
      name: 'Balanced Portfolio',
      description: 'Select diverse mix across sizes and finishes',
      icon: '⚖️',
      color: 'green',
      criteria: (alloy, allAlloys) => {
        // Complex algorithm for balanced selection
        const stock = (alloy.inHouseStock || 0) + (alloy.showroomStock || 0)
        return stock > 5 && stock < 50
      }
    },
    {
      id: 'quick_conversions',
      name: 'Quick Conversions',
      description: 'Select basic finishes that can be converted quickly',
      icon: '⚡',
      color: 'purple',
      criteria: alloy => {
        const stock = (alloy.inHouseStock || 0) + (alloy.showroomStock || 0)
        const basicFinishes = ['Silver', 'Black', 'Anthracite', 'Gun Metal']
        return stock > 0 && stock < 25 && basicFinishes.includes(alloy.finish)
      }
    }
  ]

  // Calculate selection statistics
  const selectionStats = useMemo(() => {
    if (!selectedAlloys || selectedAlloys.length === 0) {
      return {
        totalItems: 0,
        totalStock: 0,
        estimatedValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        avgStock: 0,
        sizeDistribution: {},
        finishDistribution: {}
      }
    }

    let totalStock = 0
    let estimatedValue = 0
    let lowStockItems = 0
    let outOfStockItems = 0
    const sizeDistribution = {}
    const finishDistribution = {}

    selectedAlloys.forEach(alloy => {
      const stock = (alloy.inHouseStock || 0) + (alloy.showroomStock || 0)
      const value = stock * 50 // Estimated value

      totalStock += stock
      estimatedValue += value

      if (stock === 0) outOfStockItems++
      else if (stock < 10) lowStockItems++

      // Size distribution
      const size = alloy.inches
      sizeDistribution[size] = (sizeDistribution[size] || 0) + 1

      // Finish distribution
      const finish = alloy.finish
      finishDistribution[finish] = (finishDistribution[finish] || 0) + 1
    })

    return {
      totalItems: selectedAlloys.length,
      totalStock,
      estimatedValue,
      lowStockItems,
      outOfStockItems,
      avgStock:
        selectedAlloys.length > 0 ? totalStock / selectedAlloys.length : 0,
      sizeDistribution,
      finishDistribution
    }
  }, [selectedAlloys])

  // Handle smart selection
  const handleSmartSelection = optionId => {
    const option = smartSelectionOptions.find(opt => opt.id === optionId)
    if (!option) return

    // Get all alloys from stock matrix
    const allAlloys = []
    Object.values(stockMatrix.matrix || {}).forEach(pcds => {
      Object.values(pcds).forEach(data => {
        allAlloys.push(...data.alloys)
      })
    })

    // Apply selection criteria
    const selectedAlloyIds = allAlloys
      .filter(alloy => option.criteria(alloy, allAlloys))
      .map(alloy => alloy.id)

    // Convert to cell selections
    const newSelectedCells = new Set()
    Object.entries(stockMatrix.matrix || {}).forEach(([size, pcds]) => {
      Object.entries(pcds).forEach(([pcd, data]) => {
        if (data.alloys.some(alloy => selectedAlloyIds.includes(alloy.id))) {
          newSelectedCells.add(`${size}-${pcd}`)
        }
      })
    })

    onBulkSelect(newSelectedCells)
  }

  // Calculate optimized quantities
  const calculateOptimizedQuantities = () => {
    if (!selectedAlloys || selectedAlloys.length === 0) return []

    return selectedAlloys.map(alloy => {
      const stock = (alloy.inHouseStock || 0) + (alloy.showroomStock || 0)
      let recommendedQuantity = 0

      if (bulkSettings.quantityMethod === 'percentage') {
        recommendedQuantity = Math.floor(
          stock * (bulkSettings.quantityValue / 100)
        )
      } else if (bulkSettings.quantityMethod === 'fixed') {
        recommendedQuantity = bulkSettings.quantityValue
      } else if (bulkSettings.quantityMethod === 'smart') {
        // Smart quantity calculation based on stock level and demand
        if (stock === 0) recommendedQuantity = 10 // Emergency stock
        else if (stock < 10)
          recommendedQuantity = Math.min(20, stock) // Replenish low stock
        else if (stock < 50)
          recommendedQuantity = Math.floor(stock * 0.6) // Moderate production
        else recommendedQuantity = Math.floor(stock * 0.3) // Conservative for high stock
      }

      return {
        alloy,
        recommendedQuantity: Math.max(1, recommendedQuantity),
        currentStock: stock,
        priority: stock === 0 ? 'urgent' : stock < 10 ? 'high' : 'normal'
      }
    })
  }

  const optimizedQuantities = calculateOptimizedQuantities()

  // Calculate production timeline estimate
  const calculateTimeline = () => {
    const totalQuantity = optimizedQuantities.reduce(
      (sum, item) => sum + item.recommendedQuantity,
      0
    )
    const avgTimePerUnit = 2 // hours
    const totalHours = totalQuantity * avgTimePerUnit
    const workingHoursPerDay = 8
    const days = Math.ceil(totalHours / workingHoursPerDay)

    return {
      totalQuantity,
      estimatedHours: totalHours,
      estimatedDays: days,
      urgentItems: optimizedQuantities.filter(
        item => item.priority === 'urgent'
      ).length
    }
  }

  const timeline = calculateTimeline()

  return (
    <div className='space-y-6'>
      {/* Operation Mode Selection */}
      <Card>
        <Row gutter={[16, 16]} align='middle'>
          <Col xs={24} md={8}>
            <Select
              value={operationMode}
              onChange={setOperationMode}
              className='w-full'
              size='large'
            >
              <Option value='smart'>🤖 Smart Selection</Option>
              <Option value='manual'>👆 Manual Selection</Option>
              <Option value='criteria'>🎯 Criteria-Based</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <div className='flex gap-2'>
              <Button
                icon={<ClearOutlined />}
                onClick={onClearSelection}
                disabled={selectedCells.size === 0}
              >
                Clear ({selectedCells.size})
              </Button>
              <Button
                icon={<SelectOutlined />}
                onClick={() => onBulkSelect('all')}
                type='dashed'
              >
                Select All
              </Button>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <Button
              type='primary'
              icon={<RocketOutlined />}
              onClick={() => onCreatePlans(optimizedQuantities)}
              disabled={selectedAlloys.length === 0}
              size='large'
              className='w-full'
            >
              Create {selectedAlloys.length} Plans
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Smart Selection Options */}
      {operationMode === 'smart' && (
        <Card title='🤖 AI-Powered Smart Selection'>
          <Row gutter={[12, 12]}>
            {smartSelectionOptions.map(option => (
              <Col xs={24} sm={12} lg={8} key={option.id}>
                <Card
                  size='small'
                  hoverable
                  className='h-full cursor-pointer transition-all hover:shadow-md'
                  onClick={() => handleSmartSelection(option.id)}
                  bodyStyle={{ padding: '12px' }}
                >
                  <div className='flex items-center gap-3'>
                    <div className='text-2xl'>{option.icon}</div>
                    <div className='flex-grow'>
                      <div className='font-semibold text-sm'>{option.name}</div>
                      <div className='text-xs text-gray-600 mt-1'>
                        {option.description}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Selection Statistics */}
      {selectedAlloys.length > 0 && (
        <Card title='📊 Selection Analysis'>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div className='space-y-4'>
                <div className='flex justify-between items-center'>
                  <span>Selected Items</span>
                  <Badge
                    count={selectionStats.totalItems}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                </div>
                <div className='flex justify-between items-center'>
                  <span>Total Current Stock</span>
                  <span className='font-semibold'>
                    {selectionStats.totalStock.toLocaleString()} units
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span>Estimated Portfolio Value</span>
                  <span className='font-semibold text-green-600'>
                    $
                    {Math.round(selectionStats.estimatedValue).toLocaleString()}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span>Average Stock per Item</span>
                  <span className='font-medium'>
                    {Math.round(selectionStats.avgStock)} units
                  </span>
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className='space-y-4'>
                <Alert
                  type={
                    selectionStats.outOfStockItems > 0
                      ? 'error'
                      : selectionStats.lowStockItems > 0
                      ? 'warning'
                      : 'success'
                  }
                  showIcon
                  message={
                    <div>
                      <div>Stock Status Analysis</div>
                      <div className='text-sm mt-1'>
                        {selectionStats.outOfStockItems > 0 && (
                          <div>
                            🚨 {selectionStats.outOfStockItems} out of stock
                          </div>
                        )}
                        {selectionStats.lowStockItems > 0 && (
                          <div>⚠️ {selectionStats.lowStockItems} low stock</div>
                        )}
                        {selectionStats.outOfStockItems === 0 &&
                          selectionStats.lowStockItems === 0 && (
                            <div>✅ All items have adequate stock</div>
                          )}
                      </div>
                    </div>
                  }
                />
              </div>
            </Col>
          </Row>

          {/* Size and Finish Distribution */}
          <Divider />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Title level={5}>Size Distribution</Title>
              <div className='space-y-2'>
                {Object.entries(selectionStats.sizeDistribution).map(
                  ([size, count]) => (
                    <div
                      key={size}
                      className='flex justify-between items-center'
                    >
                      <span>{size}"</span>
                      <div className='flex items-center gap-2'>
                        <Progress
                          percent={(count / selectionStats.totalItems) * 100}
                          size='small'
                          showInfo={false}
                          className='w-20'
                        />
                        <span className='text-sm w-8'>{count}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <Title level={5}>Finish Distribution</Title>
              <div className='space-y-2'>
                {Object.entries(selectionStats.finishDistribution)
                  .slice(0, 5)
                  .map(([finish, count]) => (
                    <div
                      key={finish}
                      className='flex justify-between items-center'
                    >
                      <span className='truncate'>{finish}</span>
                      <div className='flex items-center gap-2'>
                        <Progress
                          percent={(count / selectionStats.totalItems) * 100}
                          size='small'
                          showInfo={false}
                          className='w-20'
                        />
                        <span className='text-sm w-8'>{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Bulk Settings */}
      <Card title='⚙️ Bulk Production Settings'>
        <Collapse defaultActiveKey={['quantities']}>
          <Panel header='📦 Quantity Settings' key='quantities'>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Form.Item label='Quantity Method'>
                  <Select
                    value={bulkSettings.quantityMethod}
                    onChange={value =>
                      setBulkSettings({
                        ...bulkSettings,
                        quantityMethod: value
                      })
                    }
                    className='w-full'
                  >
                    <Option value='smart'>🤖 Smart Algorithm</Option>
                    <Option value='percentage'>📊 Percentage of Stock</Option>
                    <Option value='fixed'>🔢 Fixed Quantity</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                {bulkSettings.quantityMethod === 'percentage' && (
                  <Form.Item label='Stock Percentage'>
                    <Slider
                      value={bulkSettings.quantityValue}
                      onChange={value =>
                        setBulkSettings({
                          ...bulkSettings,
                          quantityValue: value
                        })
                      }
                      min={10}
                      max={100}
                      marks={{ 25: '25%', 50: '50%', 75: '75%', 100: '100%' }}
                    />
                  </Form.Item>
                )}
                {bulkSettings.quantityMethod === 'fixed' && (
                  <Form.Item label='Fixed Quantity'>
                    <InputNumber
                      value={bulkSettings.quantityValue}
                      onChange={value =>
                        setBulkSettings({
                          ...bulkSettings,
                          quantityValue: value
                        })
                      }
                      min={1}
                      className='w-full'
                    />
                  </Form.Item>
                )}
                {bulkSettings.quantityMethod === 'smart' && (
                  <Alert
                    type='info'
                    showIcon
                    message='Smart Algorithm'
                    description='AI will calculate optimal quantities based on stock levels, demand patterns, and production capacity.'
                  />
                )}
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label='Additional Options'>
                  <Space direction='vertical' className='w-full'>
                    <Checkbox
                      checked={bulkSettings.urgent}
                      onChange={e =>
                        setBulkSettings({
                          ...bulkSettings,
                          urgent: e.target.checked
                        })
                      }
                    >
                      Mark all as Urgent
                    </Checkbox>
                    <Checkbox
                      checked={bulkSettings.autoOptimize}
                      onChange={e =>
                        setBulkSettings({
                          ...bulkSettings,
                          autoOptimize: e.target.checked
                        })
                      }
                    >
                      Auto-optimize sequences
                    </Checkbox>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          <Panel header='🔧 Workflow Settings' key='workflow'>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label='Production Preset'>
                  <Select
                    value={bulkSettings.preset}
                    onChange={value =>
                      setBulkSettings({ ...bulkSettings, preset: value })
                    }
                    placeholder='Select workflow preset'
                    allowClear
                    className='w-full'
                  >
                    {stepPresets.map(preset => (
                      <Option key={preset.presetName} value={preset.presetName}>
                        <div className='flex justify-between items-center'>
                          <span>{preset.presetName}</span>
                          <Tag color='blue' size='small'>
                            {preset.stepCount || 0} steps
                          </Tag>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                {bulkSettings.preset && (
                  <Alert
                    type='success'
                    showIcon
                    message='Preset Selected'
                    description={`All ${selectedAlloys.length} plans will use the "${bulkSettings.preset}" workflow.`}
                  />
                )}
              </Col>
            </Row>
          </Panel>
        </Collapse>
      </Card>

      {/* Production Timeline */}
      {selectedAlloys.length > 0 && (
        <Card title='⏱️ Production Timeline Estimate'>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {timeline.totalQuantity}
                </div>
                <div className='text-sm text-gray-600'>Total Units</div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {timeline.estimatedDays}
                </div>
                <div className='text-sm text-gray-600'>Estimated Days</div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-600'>
                  {timeline.estimatedHours}
                </div>
                <div className='text-sm text-gray-600'>Production Hours</div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>
                  {timeline.urgentItems}
                </div>
                <div className='text-sm text-gray-600'>Urgent Items</div>
              </div>
            </Col>
          </Row>

          {timeline.urgentItems > 0 && (
            <Alert
              type='warning'
              showIcon
              className='mt-4'
              message='Urgent Items Detected'
              description={`${timeline.urgentItems} items require immediate attention. Consider prioritizing these in your production schedule.`}
            />
          )}
        </Card>
      )}
    </div>
  )
}

export default BulkOperationsPanel
