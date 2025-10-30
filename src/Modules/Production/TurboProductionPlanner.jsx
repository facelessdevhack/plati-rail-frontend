import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  Input,
  Tag,
  notification,
  Typography,
  InputNumber,
  Spin,
  Space,
  Tooltip,
  Badge,
  Checkbox,
  Modal,
  Divider,
  Statistic,
  Steps,
  Progress,
  Alert,
  AutoComplete,
  FloatButton,
  message
} from 'antd'
import {
  RocketOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  ClearOutlined,
  PlusCircleOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  DownOutlined,
  UpOutlined,
  BulbOutlined,
  LoadingOutlined,
  FastForwardOutlined,
  SaveOutlined,
  EyeOutlined,
  EditOutlined,
  FireOutlined,
  ClockCircleOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { debounce } from 'lodash'
import { useHotkeys } from 'react-hotkeys-hook'

import Layout from '../Layout/layout'
import {
  getStockManagement,
  getAllSizes,
  getAllPcd,
  getAllFinishes,
  getEntriesByProductId
} from '../../redux/api/stockAPI'
import {
  createProductionPlan,
  getStepPresets,
  getSmartProductionSuggestions
} from '../../redux/api/productionAPI'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Search } = Input
const { Step } = Steps

// Keyboard shortcuts for turbo speed
const SHORTCUTS = {
  'ctrl+n': 'newPlan',
  'ctrl+s': 'savePlan',
  'ctrl+r': 'refresh',
  'ctrl+f': 'focusSearch',
  'ctrl+1': 'step1',
  'ctrl+2': 'step2',
  'ctrl+3': 'step3',
  'ctrl+enter': 'quickAdd',
  'escape': 'clearSelection',
  'ctrl+/': 'showHelp'
}

const TurboProductionPlanner = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // User data
  const { user } = useSelector(state => state.userDetails || {})

  // State management
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedItems, setSelectedItems] = useState([])
  const [quantities, setQuantities] = useState({})
  const [urgentItems, setUrgentItems] = useState(new Set())
  const [notes, setNotes] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [helpVisible, setHelpVisible] = useState(false)

  // Data states
  const [stockData, setStockData] = useState([])
  const [sizes, setSizes] = useState([])
  const [pcds, setPcds] = useState([])
  const [finishes, setFinishes] = useState([])
  const [presets, setPresets] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [stats, setStats] = useState({})

  // Refs
  const searchInputRef = useRef(null)

  // Keyboard shortcuts
  useHotkeys(SHORTCUTS, (event, handler) => {
    event.preventDefault()
    handleShortcut(handler.key)
  })

  const handleShortcut = (key) => {
    switch (key) {
      case 'newPlan':
        handleNewPlan()
        break
      case 'savePlan':
        handleSavePlans()
        break
      case 'refresh':
        fetchAllData()
        break
      case 'focusSearch':
        searchInputRef.current?.focus()
        break
      case 'step1':
        setCurrentStep(0)
        break
      case 'step2':
        setCurrentStep(1)
        break
      case 'step3':
        setCurrentStep(2)
        break
      case 'quickAdd':
        handleQuickAdd()
        break
      case 'clearSelection':
        handleClearSelection()
        break
      case 'showHelp':
        setHelpVisible(true)
        break
    }
  }

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      console.log('Starting to fetch all data...')

      // Fetch stock data first
      console.log('Fetching stock data...')
      const stockRes = await dispatch(getStockManagement({ page: 1, limit: 10000, filter: 'all' })).unwrap()
      console.log('Stock data received:', stockRes)
      setStockData(stockRes.data || stockRes.items || [])

      // Fetch other data sequentially for better error handling
      try {
        console.log('Fetching sizes...')
        const sizesRes = await dispatch(getAllSizes()).unwrap()
        console.log('Sizes data received:', sizesRes)
        setSizes(sizesRes.sizes || sizesRes.data || [])
      } catch (error) {
        console.error('Sizes fetch failed:', error)
        setSizes([])
      }

      try {
        console.log('Fetching PCDs...')
        const pcdsRes = await dispatch(getAllPcd()).unwrap()
        console.log('PCDs data received:', pcdsRes)
        setPcds(pcdsRes.pcd || pcdsRes.data || [])
      } catch (error) {
        console.error('PCDs fetch failed:', error)
        setPcds([])
      }

      try {
        console.log('Fetching finishes...')
        const finishesRes = await dispatch(getAllFinishes()).unwrap()
        console.log('Finishes data received:', finishesRes)
        setFinishes(finishesRes.finishes || finishesRes.data || [])
      } catch (error) {
        console.error('Finishes fetch failed:', error)
        setFinishes([])
      }

      try {
        console.log('Fetching presets...')
        const presetsRes = await dispatch(getStepPresets()).unwrap()
        console.log('Presets data received:', presetsRes)
        setPresets(presetsRes.presets || presetsRes.data || [])
      } catch (error) {
        console.error('Presets fetch failed:', error)
        setPresets([])
      }

      console.log('All data fetching completed')

    } catch (error) {
      console.error('Failed to load data:', error)
      message.error(`Failed to load data: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Filter and search data
  const filteredData = useMemo(() => {
    return stockData.filter(item => {
      const matchesSearch = searchTerm === '' ||
        item.alloyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sizeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pcd?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory

      return matchesSearch && matchesCategory && (item.inHouseStock || 0) > 0
    })
  }, [stockData, searchTerm, selectedCategory])

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalSelected = selectedItems.length
    const totalQuantity = selectedItems.reduce((sum, item) => sum + (quantities[item.id] || 1), 0)
    const urgentCount = urgentItems.size

    return {
      totalSelected,
      totalQuantity,
      urgentCount,
      estimatedTime: Math.ceil(totalQuantity * 2.5), // minutes
      efficiency: totalSelected > 0 ? Math.min(95, 70 + (totalSelected * 2)) : 0
    }
  }, [selectedItems, quantities, urgentItems])

  // Handlers
  const handleNewPlan = useCallback(() => {
    handleClearSelection()
    setCurrentStep(0)
    searchInputRef.current?.focus()
  }, [])

  const handleSavePlans = useCallback(async () => {
    if (selectedItems.length === 0) {
      message.warning('Please select at least one item')
      return
    }

    setLoading(true)
    
    // Track results for detailed reporting
    const results = {
      successful: [],
      failed: []
    }
    
    try {
      // Get full item details for selected items
      const selectedItemDetails = selectedItems
        .map(itemId => stockData.find(item => item.id === itemId))
        .filter(Boolean)

      // Process plans sequentially with proper error tracking
      for (let i = 0; i < selectedItemDetails.length; i++) {
        const item = selectedItemDetails[i]
        
        try {
          const planData = {
            alloyId: item.id,
            convertId: item.id, // For turbo planner, converting within same finish
            quantity: quantities[item.id] || 1,
            urgent: urgentItems.has(item.id),
            userId: user?.id || user?.userId || 1,
            presetName: selectedPreset,
            notes: notes || ''
          }
          
          // Create individual production plan
          await dispatch(createProductionPlan(planData)).unwrap()
          
          results.successful.push({
            index: i,
            item: item,
            productName: item.alloyName,
            quantity: quantities[item.id] || 1,
            urgent: urgentItems.has(item.id)
          })
          
        } catch (error) {
          results.failed.push({
            index: i,
            item: item,
            productName: item.alloyName,
            quantity: quantities[item.id] || 1,
            error: error.message || 'Failed to create plan'
          })
        }
      }
      
      // Show detailed notifications based on results
      const successCount = results.successful.length
      const failCount = results.failed.length
      const totalCount = selectedItemDetails.length

      if (failCount === 0) {
        // All plans succeeded
        notification.success({
          message: `✅ Created ${successCount} Production Plans`,
          description: (
            <div>
              <div className="mb-2">All production plans created successfully!</div>
              <div className="text-xs text-gray-600">
                {results.successful.slice(0, 3).map((item, idx) => (
                  <div key={idx}>
                    • {item.productName} ({item.quantity} units){item.urgent ? ' 🔥 Urgent' : ''}
                  </div>
                ))}
                {successCount > 3 && <div>...and {successCount - 3} more</div>}
              </div>
            </div>
          ),
          duration: 5
        })

        // Reset and navigate
        handleClearSelection()
        navigate('/turbo-production')
        
      } else if (successCount > 0) {
        // Partial success - some succeeded, some failed
        notification.warning({
          message: `⚠️ Created ${successCount} of ${totalCount} Production Plans`,
          description: (
            <div>
              <div className="mb-2 font-semibold text-green-700">✅ Successful ({successCount}):</div>
              <div className="text-xs mb-3 text-gray-700">
                {results.successful.slice(0, 2).map((item, idx) => (
                  <div key={idx}>
                    • {item.productName} ({item.quantity} units)
                  </div>
                ))}
                {successCount > 2 && <div>...and {successCount - 2} more</div>}
              </div>
              
              <div className="mb-2 font-semibold text-red-700">❌ Failed ({failCount}):</div>
              <div className="text-xs text-gray-700">
                {results.failed.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="mb-1">
                    • {item.productName} ({item.quantity} units)
                    <div className="text-red-600 ml-3">Reason: {item.error}</div>
                  </div>
                ))}
                {failCount > 2 && <div>...and {failCount - 2} more failures</div>}
              </div>
            </div>
          ),
          duration: 10,
          style: { width: 500 }
        })

        // Remove successful items, keep failed ones for retry
        const failedItemIds = results.failed.map(item => item.item.id)
        setSelectedItems(failedItemIds)
        
        // Show retry option
        Modal.confirm({
          title: 'Retry Failed Plans?',
          content: `${failCount} production plans failed. The failed items remain selected for you to adjust and retry.`,
          okText: 'Review & Retry',
          cancelText: 'Discard Failed',
          onOk: () => {
            // User can review and retry - items remain selected
          },
          onCancel: () => {
            // Clear everything
            handleClearSelection()
          }
        })
        
      } else {
        // All plans failed
        notification.error({
          message: `❌ Failed to Create Production Plans`,
          description: (
            <div>
              <div className="mb-2 font-semibold">All {totalCount} production plans failed:</div>
              <div className="text-xs text-gray-700">
                {results.failed.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="mb-1">
                    • {item.productName} ({item.quantity} units)
                    <div className="text-red-600 ml-3">Reason: {item.error}</div>
                  </div>
                ))}
                {failCount > 3 && <div>...and {failCount - 3} more failures</div>}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Please check stock availability or adjust quantities and try again.
              </div>
            </div>
          ),
          duration: 10,
          style: { width: 500 }
        })
      }

    } catch (error) {
      console.error('Plan creation error:', error)
      notification.error({
        message: 'Failed to Create Plans',
        description: error?.message || 'An unexpected error occurred while creating production plans'
      })
    } finally {
      setLoading(false)
    }
  }, [selectedItems, quantities, urgentItems, notes, selectedPreset, user, dispatch, navigate, stockData, handleClearSelection])

  const handleQuickAdd = useCallback(() => {
    // Quick add logic - add first available item with default quantity
    if (filteredData.length > 0 && !selectedItems.includes(filteredData[0].id)) {
      const item = filteredData[0]
      setSelectedItems(prev => [...prev, item.id])
      setQuantities(prev => ({ ...prev, [item.id]: 1 }))
    }
  }, [filteredData, selectedItems])

  const handleClearSelection = useCallback(() => {
    setSelectedItems([])
    setQuantities({})
    setUrgentItems(new Set())
    setNotes('')
    setSelectedPreset(null)
    setPreviewMode(false)
  }, [])

  const handleItemToggle = useCallback((item) => {
    const isSelected = selectedItems.includes(item.id)

    if (isSelected) {
      setSelectedItems(prev => prev.filter(id => id !== item.id))
      setQuantities(prev => {
        const newQuantities = { ...prev }
        delete newQuantities[item.id]
        return newQuantities
      })
      setUrgentItems(prev => {
        const newUrgent = new Set(prev)
        newUrgent.delete(item.id)
        return newUrgent
      })
    } else {
      setSelectedItems(prev => [...prev, item.id])
      setQuantities(prev => ({ ...prev, [item.id]: 1 }))
    }
  }, [selectedItems])

  const handleQuantityChange = useCallback((itemId, quantity) => {
    setQuantities(prev => ({ ...prev, [itemId]: quantity }))
  }, [])

  const handleUrgentToggle = useCallback((itemId) => {
    setUrgentItems(prev => {
      const newUrgent = new Set(prev)
      if (newUrgent.has(itemId)) {
        newUrgent.delete(itemId)
      } else {
        newUrgent.add(itemId)
      }
      return newUrgent
    })
  }, [])

  // Virtual list item renderer
  const Row = ({ index, style }) => {
    const item = filteredData[index]

    // Safety check - return null if item is undefined
    if (!item) {
      return null
    }

    const isSelected = selectedItems.includes(item.id)
    const quantity = quantities[item.id] || 1
    const isUrgent = urgentItems.has(item.id)

    return (
      <div style={style}>
        <Card
          size="small"
          className={`cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'}`}
          onClick={() => handleItemToggle(item)}
          actions={[
            <Button
              size="small"
              type={isUrgent ? 'primary' : 'default'}
              danger={isUrgent}
              icon={<FireOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleUrgentToggle(item.id)
              }}
            >
              {isUrgent ? 'Urgent' : 'Normal'}
            </Button>,
            <InputNumber
              size="small"
              min={1}
              max={item.inHouseStock || 999}
              value={quantity}
              onChange={(value) => {
                handleQuantityChange(item.id, value || 1)
              }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '70px' }}
            />
          ]}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{item.alloyName}</div>
              <div className="text-sm text-gray-600">
                {item.sizeName} • {item.pcd} • {item.finish}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Stock: {item.inHouseStock || 0}
              </div>
            </div>
            <div className="ml-2">
              <Tag color={isSelected ? 'blue' : 'default'}>
                {isSelected ? 'Selected' : item.category}
              </Tag>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Enhanced statistics with Ant Design Cards
  const renderQuickStats = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '12px'
          }}
          bodyStyle={{ padding: '20px', textAlign: 'center', color: 'white' }}
        >
          <Statistic
            title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Available Products</span>}
            value={filteredData.length}
            valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            border: 'none',
            borderRadius: '12px'
          }}
          bodyStyle={{ padding: '20px', textAlign: 'center', color: 'white' }}
        >
          <Statistic
            title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Selected</span>}
            value={selectedItems.length}
            valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            border: 'none',
            borderRadius: '12px'
          }}
          bodyStyle={{ padding: '20px', textAlign: 'center', color: 'white' }}
        >
          <Statistic
            title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Total Stock</span>}
            value={filteredData.reduce((sum, item) => sum + (item.inHouseStock || 0), 0)}
            valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            border: 'none',
            borderRadius: '12px'
          }}
          bodyStyle={{ padding: '20px', textAlign: 'center', color: 'white' }}
        >
          <Statistic
            title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Est. Time</span>}
            value={statistics.estimatedTime}
            suffix="min"
            valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
    </Row>
  )

  // Enhanced search and filter controls
  const renderSearchControls = () => (
    <Card style={{ marginBottom: '24px' }} bodyStyle={{ padding: '16px' }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={8}>
          <Search
            placeholder="Search products..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={() => {}}
            prefix={<BulbOutlined style={{ color: '#1890ff' }} />}
          />
        </Col>
        <Col xs={24} md={4}>
          <Select
            placeholder="Category"
            size="large"
            style={{ width: '100%' }}
            value={selectedCategory}
            onChange={setSelectedCategory}
          >
            <Option value="all">All Categories</Option>
            <Option value="alloy">Alloys</Option>
            <Option value="tyre">Tyres</Option>
          </Select>
        </Col>
        <Col xs={24} md={12}>
          <Space size="middle" style={{ float: 'right' }}>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleQuickAdd}
              disabled={filteredData.length === 0}
            >
              Quick Add
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearSelection}
              disabled={selectedItems.length === 0}
            >
              Clear ({selectedItems.length})
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAllData}
              loading={loading}
            >
              Refresh
            </Button>
            <Tooltip title="Keyboard Shortcuts (Ctrl+/)">
              <Button
                icon={<InfoCircleOutlined />}
                onClick={() => setHelpVisible(true)}
              />
            </Tooltip>
          </Space>
        </Col>
      </Row>
    </Card>
  )

  // Product selection interface
  const renderProductSelection = () => (
    <Card
      title={
        <Space>
          <DashboardOutlined />
          <span>Product Selection ({filteredData.length} items)</span>
        </Space>
      }
      style={{ marginBottom: '24px' }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <Row gutter={[16, 16]}>
          {filteredData.slice(0, 20).map(item => {
            const isSelected = selectedItems.includes(item.id)
            const quantity = quantities[item.id] || 1
            const isUrgent = urgentItems.has(item.id)

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card
                  size="small"
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                  }`}
                  onClick={() => handleItemToggle(item)}
                  actions={[
                    <Button
                      size="small"
                      type={isUrgent ? 'primary' : 'default'}
                      danger={isUrgent}
                      icon={<FireOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUrgentToggle(item.id)
                      }}
                    >
                      {isUrgent ? 'Urgent' : 'Normal'}
                    </Button>,
                    <InputNumber
                      size="small"
                      min={1}
                      max={item.inHouseStock || 999}
                      value={quantity}
                      onChange={(value) => {
                        handleQuantityChange(item.id, value || 1)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: '70px' }}
                    />
                  ]}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{item.alloyName}</div>
                      <div className="text-sm text-gray-600">
                        {item.sizeName} • {item.pcd} • {item.finish}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Stock: {item.inHouseStock || 0}
                      </div>
                    </div>
                    <div className="ml-2">
                      <Tag color={isSelected ? 'blue' : 'default'}>
                        {isSelected ? 'Selected' : item.category}
                      </Tag>
                    </div>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      </div>
    </Card>
  )

  return (
    <Layout>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
        <Card style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
              🚀 Turbo Production Planner
            </Title>
            <Text type="secondary">Lightning-fast production planning with intelligent workflow</Text>
          </div>

          {/* Statistics */}
          {renderQuickStats()}

          {/* Search Controls */}
          {renderSearchControls()}

          {/* Product Selection */}
          {renderProductSelection()}

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <Card
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>Selected Items ({selectedItems.length})</span>
                </Space>
              }
              style={{ marginBottom: '24px' }}
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSavePlans}
                    loading={loading}
                  >
                    Create Plans
                  </Button>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => setPreviewMode(true)}
                  >
                    Preview
                  </Button>
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                {selectedItems.slice(0, 5).map(itemId => {
                  const item = stockData.find(i => i.id === itemId)
                  if (!item) return null

                  return (
                    <Col xs={24} sm={12} md={8} key={itemId}>
                      <Card size="small">
                        <Space>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <div>
                            <div className="font-semibold">{item.alloyName}</div>
                            <div className="text-sm text-gray-600">
                              Qty: {quantities[item.id] || 1}
                              {urgentItems.has(itemId) && (
                                <Tag color="red" size="small" style={{ marginLeft: '8px' }}>
                                  <FireOutlined /> Urgent
                                </Tag>
                              )}
                            </div>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  )
                })}
              </Row>
              {selectedItems.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Text type="secondary">...and {selectedItems.length - 5} more items</Text>
                </div>
              )}
            </Card>
          )}

          {/* Debug Info (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <Alert
              message="Debug Information"
              description={
                <div>
                  <p>Loading: {loading ? 'Yes' : 'No'}</p>
                  <p>Stock Data: {stockData.length} items</p>
                  <p>Filtered Data: {filteredData.length} items</p>
                  <p>Selected Items: {selectedItems.length}</p>
                </div>
              }
              type="info"
              style={{ marginTop: '24px' }}
            />
          )}

          {/* Floating Action Buttons */}
          <FloatButton.Group
            trigger="click"
            type="primary"
            style={{ right: 24 }}
            icon={<ThunderboltOutlined />}
            tooltip="Quick Actions"
          >
            <FloatButton
              icon={<PlusCircleOutlined />}
              tooltip="Quick Add"
              onClick={handleQuickAdd}
            />
            <FloatButton
              icon={<ClearOutlined />}
              tooltip="Clear Selection"
              onClick={handleClearSelection}
            />
            <FloatButton
              icon={<ReloadOutlined />}
              tooltip="Refresh Data"
              onClick={fetchAllData}
            />
          </FloatButton.Group>

          {/* Help Modal */}
          <Modal
            title="⌨️ Keyboard Shortcuts"
            open={helpVisible}
            onCancel={() => setHelpVisible(false)}
            footer={[
              <Button key="close" onClick={() => setHelpVisible(false)}>
                Close
              </Button>
            ]}
          >
            <div>
              <p><kbd>Ctrl+N</kbd> - New Plan</p>
              <p><kbd>Ctrl+S</kbd> - Save Plans</p>
              <p><kbd>Ctrl+R</kbd> - Refresh Data</p>
              <p><kbd>Ctrl+F</kbd> - Focus Search</p>
              <p><kbd>Ctrl+Enter</kbd> - Quick Add</p>
              <p><kbd>Ctrl+/</kbd> - Show Help</p>
              <p><kbd>Escape</kbd> - Clear Selection</p>
            </div>
          </Modal>
        </Card>
      </div>
    </Layout>
  )
}

export default TurboProductionPlanner