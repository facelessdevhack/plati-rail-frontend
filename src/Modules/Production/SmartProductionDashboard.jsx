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
  Divider
} from 'antd'
import {
  RocketOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  ClearOutlined,
  PlusCircleOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import Layout from '../Layout/layout'
import AISuggestionsPanel from './AISuggestionsPanel'
import SelectedItemsPanel from './SelectedItemsPanel'
import {
  getStockManagement,
  getAllSizes,
  getAllPcd,
  getAllFinishes
} from '../../redux/api/stockAPI'
import {
  createProductionPlan,
  getStepPresets
} from '../../redux/api/productionAPI'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const SmartProductionDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const listRef = useRef(null)

  // Redux state
  const {
    stockManagementData,
    loading,
    allSizes,
    allPcd,
    allFinishes
  } = useSelector(state => state.stockDetails)
  const { user } = useSelector(state => state.userDetails)

  // Local state
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSize, setFilterSize] = useState(null)
  const [filterPcd, setFilterPcd] = useState(null)
  const [filterFinish, setFilterFinish] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showOnlyWithStock, setShowOnlyWithStock] = useState(false)
  const [conversionPlans, setConversionPlans] = useState({})
  const [isCreatingPlans, setIsCreatingPlans] = useState(false)
  const [showSelectedPanel, setShowSelectedPanel] = useState(true)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (selectedRows.size > 0 || Object.keys(conversionPlans).length > 0) {
      const stateToSave = {
        selectedRows: Array.from(selectedRows),
        conversionPlans: conversionPlans,
        searchTerm: searchTerm,
        filterSize: filterSize,
        filterPcd: filterPcd,
        filterFinish: filterFinish,
        showOnlyWithStock: showOnlyWithStock,
        timestamp: Date.now()
      }
      localStorage.setItem('smartProductionState', JSON.stringify(stateToSave))
    }
  }, [selectedRows, conversionPlans, searchTerm, filterSize, filterPcd, filterFinish, showOnlyWithStock])

  // Load initial data and restore state
  useEffect(() => {
    dispatch(getStockManagement({ page: 1, limit: 10000, filter: 'all' }))
    dispatch(getAllSizes())
    dispatch(getAllPcd())
    dispatch(getAllFinishes())
    dispatch(getStepPresets())
    
    // Load panel state from localStorage
    const savedPanelState = localStorage.getItem('selectedPanelCollapsed')
    if (savedPanelState !== null) {
      setIsPanelCollapsed(savedPanelState === 'true')
    }

    // Load saved production state
    const savedState = localStorage.getItem('smartProductionState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // Check if state is not too old (24 hours)
        const hoursSinceLastSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60)
        if (hoursSinceLastSave < 24) {
          // Restore state
          if (parsed.selectedRows && parsed.selectedRows.length > 0) {
            setSelectedRows(new Set(parsed.selectedRows))
          }
          if (parsed.conversionPlans) {
            setConversionPlans(parsed.conversionPlans)
          }
          if (parsed.searchTerm) setSearchTerm(parsed.searchTerm)
          if (parsed.filterSize) setFilterSize(parsed.filterSize)
          if (parsed.filterPcd) setFilterPcd(parsed.filterPcd)
          if (parsed.filterFinish) setFilterFinish(parsed.filterFinish)
          if (typeof parsed.showOnlyWithStock === 'boolean') setShowOnlyWithStock(parsed.showOnlyWithStock)

          notification.info({
            message: 'Session Restored',
            description: `Restored ${parsed.selectedRows?.length || 0} selected items from your previous session`,
            duration: 3
          })
        } else {
          // Clear old state
          localStorage.removeItem('smartProductionState')
        }
      } catch (error) {
        console.error('Failed to restore state:', error)
        localStorage.removeItem('smartProductionState')
      }
    }
  }, [dispatch])

  // Filter stock data
  const filteredStockData = useMemo(() => {
    if (!stockManagementData) return []

    return stockManagementData.filter(alloy => {
      // Filter by stock if toggle is on
      if (showOnlyWithStock) {
        const stock = alloy.inHouseStock || 0
        if (stock === 0) return false
      }

      const matchesSearch =
        !searchTerm ||
        alloy.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alloy.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alloy.inches?.toString().includes(searchTerm) ||
        alloy.pcd?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSize = !filterSize || alloy.inches === filterSize
      const matchesPcd = !filterPcd || alloy.pcd === filterPcd
      const matchesFinish = !filterFinish || alloy.finish === filterFinish

      return matchesSearch && matchesSize && matchesPcd && matchesFinish
    })
  }, [stockManagementData, searchTerm, filterSize, filterPcd, filterFinish, showOnlyWithStock])

  // Toggle panel collapse
  const handleTogglePanel = useCallback(() => {
    setIsPanelCollapsed(prev => {
      const newState = !prev
      localStorage.setItem('selectedPanelCollapsed', newState.toString())
      return newState
    })
  }, [])

  // Handle row selection
  const handleRowSelect = useCallback((alloyId, checked) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(alloyId)
        // Initialize conversion plan if not exists
        if (!conversionPlans[alloyId]) {
          const alloy = filteredStockData.find(a => a.id === alloyId)
          if (alloy) {
            setConversionPlans(plans => ({
              ...plans,
              [alloyId]: {
                sourceAlloy: alloy,
                targetFinish: null,
                quantity: 1
              }
            }))
          }
        }
      } else {
        newSet.delete(alloyId)
        // Remove conversion plan
        setConversionPlans(plans => {
          const newPlans = { ...plans }
          delete newPlans[alloyId]
          return newPlans
        })
      }
      return newSet
    })
  }, [conversionPlans, filteredStockData])

  // Handle select all
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      const allIds = new Set(filteredStockData.map(a => a.id))
      setSelectedRows(allIds)
      // Initialize all conversion plans
      const newPlans = {}
      filteredStockData.forEach(alloy => {
        newPlans[alloy.id] = {
          sourceAlloy: alloy,
          targetFinish: 'Chrome',
          quantity: 1
        }
      })
      setConversionPlans(newPlans)
    } else {
      setSelectedRows(new Set())
      setConversionPlans({})
    }
  }, [filteredStockData])

  // Update conversion plan
  const updateConversionPlan = useCallback((alloyId, field, value) => {
    setConversionPlans(prev => ({
      ...prev,
      [alloyId]: {
        ...prev[alloyId],
        [field]: value
      }
    }))
  }, [])


  // Handle bulk plan creation
  const handleCreateBulkPlans = useCallback(async () => {
    const validPlans = Array.from(selectedRows)
      .map(id => conversionPlans[id])
      .filter(plan => plan && plan.targetFinish && plan.quantity > 0)

    if (validPlans.length === 0) {
      notification.warning({
        message: 'No Valid Plans',
        description: 'Please select target finishes and quantities'
      })
      return
    }

    setIsCreatingPlans(true)
    try {
      const planPromises = validPlans.map(async plan => {
        const planData = {
          alloyId: plan.sourceAlloy.id,
          convertId: plan.sourceAlloy.id,
          quantity: plan.quantity,
          urgent: false,
          userId: user?.id || 1,
          presetName: null
        }
        return dispatch(createProductionPlan(planData)).unwrap()
      })

      await Promise.all(planPromises)

      notification.success({
        message: 'Plans Created!',
        description: `Successfully created ${validPlans.length} production plans`,
        duration: 3
      })

      // Reset
      setSelectedRows(new Set())
      setConversionPlans({})
      // Clear saved state after successful creation
      localStorage.removeItem('smartProductionState')
      navigate('/production-plans')
    } catch (error) {
      notification.error({
        message: 'Failed to Create Plans',
        description: error?.message || 'Some plans could not be created'
      })
    } finally {
      setIsCreatingPlans(false)
    }
  }, [selectedRows, conversionPlans, user, dispatch, navigate])

  // Table row renderer for virtual list
  const Row = ({ index, style }) => {
    const alloy = filteredStockData[index]
    if (!alloy) return null

    const totalStock = alloy.inHouseStock || 0
    const isSelected = selectedRows.has(alloy.id)
    const plan = conversionPlans[alloy.id]
    const stockStatus = totalStock === 0 ? 'error' : totalStock < 10 ? 'warning' : 'success'

    return (
      <div 
        style={style} 
        className={`flex items-center px-4 border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
      >
        {/* Checkbox - 40px */}
        <div className="w-10 flex-shrink-0">
          <Checkbox
            checked={isSelected}
            onChange={(e) => handleRowSelect(alloy.id, e.target.checked)}
          />
        </div>

        {/* Size & PCD - 100px */}
        <div className="w-[100px] flex-shrink-0 px-2">
          <div className="font-semibold text-lg text-blue-600">{alloy.inches}"</div>
          <div className="text-xs text-gray-500">{alloy.pcd}</div>
        </div>

        {/* Product Info - Flexible */}
        <div className="flex-1 px-2 min-w-0">
          <div className="font-medium truncate">{alloy.productName}</div>
          <div className="text-xs text-gray-500 truncate">
            {alloy.modelName} • {alloy.holes}H • {alloy.width}W • {alloy.finish}
          </div>
        </div>

        {/* Stock - 120px */}
        <div className="w-[120px] flex-shrink-0 px-2 text-center">
          <div className={`font-bold text-lg ${
            stockStatus === 'error' ? 'text-red-600' : 
            stockStatus === 'warning' ? 'text-orange-600' : 
            'text-green-600'
          }`}>
            {totalStock} units
          </div>
        </div>

        {/* Plan Controls - 280px */}
        {isSelected ? (
          <div className="w-[280px] flex-shrink-0 px-2 flex gap-2">
            <Select
              size="small"
              placeholder="Target Finish"
              value={plan?.targetFinish}
              onChange={(value) => updateConversionPlan(alloy.id, 'targetFinish', value)}
              className="flex-1"
            >
              <Option value="Chrome">Chrome</Option>
              <Option value="Diamond Cut">Diamond Cut</Option>
              <Option value="Black">Black</Option>
              <Option value="Silver">Silver</Option>
              <Option value="Anthracite">Anthracite</Option>
              <Option value="Gun Metal">Gun Metal</Option>
            </Select>
            <InputNumber
              size="small"
              min={1}
              max={totalStock}
              value={plan?.quantity || 1}
              onChange={(value) => updateConversionPlan(alloy.id, 'quantity', value)}
              className="w-20"
            />
          </div>
        ) : (
          <div className="w-[280px] flex-shrink-0 px-2">
            <Text type="secondary" className="text-xs">
              Select to configure
            </Text>
          </div>
        )}
      </div>
    )
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+F - Focus search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
      // Ctrl+A - Select all
      if (e.ctrlKey && e.key === 'a' && !e.target.matches('input, textarea')) {
        e.preventDefault()
        handleSelectAll(true)
      }
      // Ctrl+Enter - Create plans
      if (e.ctrlKey && e.key === 'Enter' && selectedRows.size > 0) {
        handleCreateBulkPlans()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleSelectAll, selectedRows, handleCreateBulkPlans])

  return (
    <Layout>
      <div className="h-screen flex bg-gray-50">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
        {/* Compact Header */}
        <div className="bg-white border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Title level={3} className="mb-0">
                Smart Production Planner
              </Title>
              <Badge count={selectedRows.size} showZero>
                <Tag className="cursor-pointer" onClick={() => setShowSelectedPanel(!showSelectedPanel)}>
                  {showSelectedPanel ? 'Hide' : 'Show'} Selected
                </Tag>
              </Badge>
            </div>
            
            <Space>
              <Text type="secondary" className="text-xs">
                Shortcuts: Ctrl+F (search) • Ctrl+A (select all)
              </Text>
              <Button
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/production-workflow')}
              >
                Workflow
              </Button>
            </Space>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white border-b px-6 py-3">
          <div className="flex items-center gap-3">
            <Search
              id="search-input"
              placeholder="Search by product, model, size, PCD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={() => listRef.current?.scrollToItem(0)}
              allowClear
              prefix={<SearchOutlined />}
              className="flex-1 max-w-md"
            />

            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              type={showFilters ? 'primary' : 'default'}
            >
              Filters {(filterSize || filterPcd || filterFinish) && `(${[filterSize, filterPcd, filterFinish].filter(Boolean).length})`}
            </Button>

            <Divider type="vertical" className="h-8" />

            <Checkbox
              checked={showOnlyWithStock}
              onChange={(e) => setShowOnlyWithStock(e.target.checked)}
            >
              Only with stock
            </Checkbox>

            <Divider type="vertical" className="h-8" />

            <Checkbox
              checked={selectedRows.size === filteredStockData.length && filteredStockData.length > 0}
              indeterminate={selectedRows.size > 0 && selectedRows.size < filteredStockData.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              Select All ({filteredStockData.length})
            </Checkbox>

            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setSelectedRows(new Set())
                setConversionPlans({})
                // Clear saved state
                localStorage.removeItem('smartProductionState')
              }}
              disabled={selectedRows.size === 0}
            >
              Clear
            </Button>

            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={handleCreateBulkPlans}
              disabled={selectedRows.size === 0}
              loading={isCreatingPlans}
              className="bg-green-600 border-green-600 hover:bg-green-700"
            >
              Create {selectedRows.size} Plans
            </Button>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t flex gap-3">
              <Select
                placeholder="Filter by Size"
                value={filterSize}
                onChange={setFilterSize}
                allowClear
                className="w-32"
              >
                {(allSizes || []).map(size => (
                  <Option key={size.value} value={size.label}>
                    {size.label}"
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Filter by PCD"
                value={filterPcd}
                onChange={setFilterPcd}
                allowClear
                className="w-40"
              >
                {(allPcd || []).map(pcd => (
                  <Option key={pcd.value} value={pcd.label}>
                    {pcd.label}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Filter by Finish"
                value={filterFinish}
                onChange={setFilterFinish}
                allowClear
                className="w-40"
              >
                {(allFinishes?.data || []).map(finish => (
                  <Option key={finish.id} value={finish.finish}>
                    {finish.finish}
                  </Option>
                ))}
              </Select>

              <Button
                size="small"
                onClick={() => {
                  setFilterSize(null)
                  setFilterPcd(null)
                  setFilterFinish(null)
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="bg-gray-100 border-b px-6 py-2 flex items-center font-semibold text-sm" style={{ paddingRight: showSelectedPanel ? (isPanelCollapsed ? '60px' : '416px') : '24px' }}>
          <div className="w-10 flex-shrink-0"></div>
          <div className="w-[100px] flex-shrink-0 px-2">Size/PCD</div>
          <div className="flex-1 px-2">Product Details</div>
          <div className="w-[120px] flex-shrink-0 px-2 text-center">Stock</div>
          <div className="w-[280px] flex-shrink-0 px-2">
            Plan Configuration
          </div>
        </div>

        {/* Virtual Table */}
        <div className="flex-1 bg-white" style={{ marginRight: showSelectedPanel && selectedRows.size > 0 ? (isPanelCollapsed ? '48px' : '400px') : '0' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Spin size="large" />
            </div>
          ) : filteredStockData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-6xl mb-4">📦</div>
              <div className="text-xl">No alloys found</div>
              <div className="text-sm mt-2">Try adjusting your search or filters</div>
            </div>
          ) : (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  ref={listRef}
                  height={height}
                  itemCount={filteredStockData.length}
                  itemSize={60}
                  width={width}
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
          )}
        </div>

        {/* Status Bar */}
        {selectedRows.size > 0 && (
          <div className="bg-blue-50 border-t px-6 py-2 flex items-center justify-between">
            <div className="text-sm">
              <Text strong>{selectedRows.size}</Text> items selected •{' '}
              <Text strong>
                {Array.from(selectedRows)
                  .map(id => conversionPlans[id])
                  .filter(p => p?.targetFinish).length}
              </Text>{' '}
              configured •{' '}
              <Text type="warning">
                {selectedRows.size - Array.from(selectedRows)
                  .map(id => conversionPlans[id])
                  .filter(p => p?.targetFinish).length}
              </Text>{' '}
              need target finish
            </div>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                // Auto-fill with Chrome
                selectedRows.forEach(id => {
                  if (!conversionPlans[id]?.targetFinish) {
                    updateConversionPlan(id, 'targetFinish', 'Chrome')
                  }
                })
              }}
            >
              Auto-fill Chrome
            </Button>
          </div>
        )}

        </div>

        {/* Selected Items Panel */}
        {showSelectedPanel && selectedRows.size > 0 && (
          <SelectedItemsPanel
            selectedRows={selectedRows}
            conversionPlans={conversionPlans}
            filteredStockData={filteredStockData}
            isCollapsed={isPanelCollapsed}
            onToggleCollapse={handleTogglePanel}
            onUpdatePlan={updateConversionPlan}
            onRemoveItem={(id) => handleRowSelect(id, false)}
            onRemoveAll={() => {
              setSelectedRows(new Set())
              setConversionPlans({})
              // Clear saved state
              localStorage.removeItem('smartProductionState')
            }}
          />
        )}
      </div>
    </Layout>
  )
}

export default SmartProductionDashboard