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
  SearchOutlined,
  InfoCircleOutlined
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
  getStepPresets,
  getProductionPlansWithQuantities
} from '../../redux/api/productionAPI'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const SmartProductionDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const listRef = useRef(null)

  // Redux state
  const { stockManagementData, loading, allSizes, allPcd, allFinishes } =
    useSelector(state => state.stockDetails)
  const { user } = useSelector(state => state.userDetails)

  // Local state
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSize, setFilterSize] = useState(null)
  const [filterPcd, setFilterPcd] = useState(null)
  const [filterFinish, setFilterFinish] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showOnlyWithStock, setShowOnlyWithStock] = useState(false)
  const [showWithoutPaint, setShowWithoutPaint] = useState(false)
  const [conversionPlans, setConversionPlans] = useState({})
  const [isCreatingPlans, setIsCreatingPlans] = useState(false)
  const [showSelectedPanel, setShowSelectedPanel] = useState(true)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [planCounter, setPlanCounter] = useState(0) // Counter for unique plan IDs
  const [infoModalVisible, setInfoModalVisible] = useState(false)
  const [selectedProductInfo, setSelectedProductInfo] = useState(null)
  const [productionData, setProductionData] = useState([])
  const [loadingProductionData, setLoadingProductionData] = useState(false)

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (selectedRows.size > 0 || Object.keys(conversionPlans).length > 0) {
      const stateToSave = {
        selectedRows: Array.from(selectedRows),
        conversionPlans: conversionPlans,
        planCounter: planCounter,
        searchTerm: searchTerm,
        filterSize: filterSize,
        filterPcd: filterPcd,
        filterFinish: filterFinish,
        showOnlyWithStock: showOnlyWithStock,
        showWithoutPaint: showWithoutPaint,
        timestamp: Date.now()
      }
      localStorage.setItem('smartProductionState', JSON.stringify(stateToSave))
    }
  }, [
    selectedRows,
    conversionPlans,
    planCounter,
    searchTerm,
    filterSize,
    filterPcd,
    filterFinish,
    showOnlyWithStock
  ])

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
        const hoursSinceLastSave =
          (Date.now() - parsed.timestamp) / (1000 * 60 * 60)
        if (hoursSinceLastSave < 24) {
          // Restore state
          if (parsed.selectedRows && parsed.selectedRows.length > 0) {
            setSelectedRows(new Set(parsed.selectedRows))
          }
          if (parsed.conversionPlans) {
            setConversionPlans(parsed.conversionPlans)
          }
          if (typeof parsed.planCounter === 'number') {
            setPlanCounter(parsed.planCounter)
          }
          if (parsed.searchTerm) setSearchTerm(parsed.searchTerm)
          if (parsed.filterSize) setFilterSize(parsed.filterSize)
          if (parsed.filterPcd) setFilterPcd(parsed.filterPcd)
          if (parsed.filterFinish) setFilterFinish(parsed.filterFinish)
          if (typeof parsed.showOnlyWithStock === 'boolean')
            setShowOnlyWithStock(parsed.showOnlyWithStock)
          if (typeof parsed.showWithoutPaint === 'boolean')
            setShowWithoutPaint(parsed.showWithoutPaint)

          notification.info({
            message: 'Session Restored',
            description: `Restored ${
              parsed.selectedRows?.length || 0
            } selected items from your previous session`,
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

      // Filter by without paint if toggle is on
      if (showWithoutPaint) {
        const finish = alloy.finish ? alloy.finish.toLowerCase() : ''
        if (
          !finish.includes('without paint') &&
          !finish.includes('without lacquer')
        ) {
          return false
        }
      }

      const matchesSearch =
        !searchTerm ||
        (alloy.productName
          ? alloy.productName
              .toString()
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          : false) ||
        (alloy.modelName
          ? alloy.modelName
              .toString()
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          : false) ||
        (alloy.inches ? alloy.inches.toString().includes(searchTerm) : false) ||
        (alloy.pcd
          ? alloy.pcd
              .toString()
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          : false) ||
        (alloy.finish
          ? alloy.finish
              .toString()
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          : false)

      const matchesSize = !filterSize || alloy.inches === filterSize
      const matchesPcd = !filterPcd || alloy.pcd === filterPcd
      const matchesFinish = !filterFinish || alloy.finish === filterFinish

      return matchesSearch && matchesSize && matchesPcd && matchesFinish
    })
  }, [
    stockManagementData,
    searchTerm,
    filterSize,
    filterPcd,
    filterFinish,
    showOnlyWithStock,
    showWithoutPaint
  ])

  // Toggle panel collapse
  const handleTogglePanel = useCallback(() => {
    setIsPanelCollapsed(prev => {
      const newState = !prev
      localStorage.setItem('selectedPanelCollapsed', newState.toString())
      return newState
    })
  }, [])

  // Get available target finishes for a specific alloy, excluding already selected finishes for this alloy
  const getAvailableTargetFinishes = useCallback(
    (sourceAlloy, excludeFinishesForAlloy = []) => {
      if (!stockManagementData || !sourceAlloy) return []

      console.log('🔍 Finding finishes for:', sourceAlloy.productName, {
        modelId: sourceAlloy.modelId,
        modelName: sourceAlloy.modelName,
        inchesId: sourceAlloy.inchesId,
        pcdId: sourceAlloy.pcdId,
        holesId: sourceAlloy.holesId,
        cbId: sourceAlloy.cbId,
        widthId: sourceAlloy.widthId,
        offsetId: sourceAlloy.offsetId,
        finishId: sourceAlloy.finishId
      })

      // Find all alloys with the EXACT same specification IDs but different finishes
      const matchedAlloys = stockManagementData.filter(alloy => {
        // Match by specification IDs (model, inches, pcd, holes, cb, width, offset)
        // IMPORTANT: modelName match is required since modelId is often undefined
        const sameSpecs =
          alloy.modelName === sourceAlloy.modelName &&
          alloy.inchesId === sourceAlloy.inchesId &&
          alloy.pcdId === sourceAlloy.pcdId &&
          alloy.holesId === sourceAlloy.holesId &&
          alloy.cbId === sourceAlloy.cbId &&
          alloy.widthId === sourceAlloy.widthId

        const differentFinish =
          alloy.finishId !== sourceAlloy.finishId &&
          alloy.finish !== sourceAlloy.finish
        const notExcluded = !excludeFinishesForAlloy.includes(alloy.finish)

        if (sameSpecs && differentFinish) {
          console.log(
            `  Match: ${alloy.productName} | Finish: ${
              alloy.finish
            } | Excluded: ${!notExcluded}`
          )
        }

        return (
          sameSpecs &&
          differentFinish &&
          notExcluded &&
          (alloy.inHouseStock || 0) >= 0
        )
      })

      console.log(`Total matches before dedup: ${matchedAlloys.length}`)

      const availableFinishes = matchedAlloys
        .map(alloy => ({
          value: alloy.finish,
          label: alloy.finish,
          stock: alloy.inHouseStock || 0,
          alloyId: alloy.id
        }))
        .filter((finish, index, arr) => {
          // Remove duplicates by finish name
          const firstIndex = arr.findIndex(f => f.value === finish.value)
          if (firstIndex !== index) {
            console.log(`  Duplicate removed: ${finish.value}`)
          }
          return firstIndex === index
        })
        .sort((a, b) => a.label.localeCompare(b.label))

      console.log(
        `Final finishes (${availableFinishes.length}):`,
        availableFinishes.map(f => f.label)
      )

      return availableFinishes
    },
    [stockManagementData]
  )

  // Handle adding alloy to plan (allows multiple finishes for same alloy)
  const handleAddToPlan = useCallback(
    alloyId => {
      const alloy = filteredStockData.find(a => a.id === alloyId)
      if (!alloy) return

      // Create unique plan ID
      const planId = `${alloyId}_${planCounter}`
      setPlanCounter(prev => prev + 1)

      // Add to selected rows
      setSelectedRows(prev => new Set(prev).add(planId))

      // Initialize conversion plan
      setConversionPlans(plans => ({
        ...plans,
        [planId]: {
          sourceAlloy: alloy,
          targetFinish: null,
          quantity: 1,
          originalAlloyId: alloyId // Keep reference to original alloy ID
        }
      }))
    },
    [filteredStockData, planCounter]
  )

  // Handle removing plan
  const handleRemovePlan = useCallback(planId => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      newSet.delete(planId)
      return newSet
    })

    setConversionPlans(plans => {
      const newPlans = { ...plans }
      delete newPlans[planId]
      return newPlans
    })
  }, [])

  // Handle row selection/deselection
  const handleRowSelect = useCallback((id, isSelected) => {
    if (isSelected) {
      setSelectedRows(prev => new Set(prev).add(id))
    } else {
      setSelectedRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })

      // Remove from conversion plans when deselected
      setConversionPlans(plans => {
        const newPlans = { ...plans }
        delete newPlans[id]
        return newPlans
      })
    }
  }, [])

  // Handle showing product info modal
  const handleShowInfo = useCallback(
    async alloy => {
      setSelectedProductInfo(alloy)
      setInfoModalVisible(true)

      // Fetch production data for all alloys (not just base materials)
      console.log('🚀 Fetching production data for alloy:', alloy)
      setLoadingProductionData(true)
      try {
        const result = await dispatch(
          getProductionPlansWithQuantities({
            page: 1,
            limit: 1000
          })
        ).unwrap()
        console.log('📦 Raw production API response:', result)
        console.log('📋 Production plans array:', result.productionPlans)
        setProductionData(result.productionPlans || [])
      } catch (error) {
        console.error('Failed to fetch production data:', error)
        setProductionData([])
      } finally {
        setLoadingProductionData(false)
      }
    },
    [dispatch]
  )

  // Calculate pending production quantities by finish for a base material
  const getPendingProductionByFinish = useCallback(
    (baseAlloy, productionPlans) => {
      if (!baseAlloy || !productionPlans) return []

      // Find all production plans where the source alloy matches this base alloy
      const relevantPlans = productionPlans.filter(plan => {
        // Match by alloyId or by product name/finish match
        const matchesById = plan.alloyId === baseAlloy.id
        const matchesByProduct =
          plan.sourceProductName === baseAlloy.productName ||
          (plan.sourceFinish === baseAlloy.finish &&
            plan.sourceInches === baseAlloy.inches &&
            plan.sourcePCD === baseAlloy.pcd)

        // Only include plans that are not completed
        const isNotCompleted =
          !plan.isCompleted &&
          plan.quantityTracking?.completionStatus !== 'completed'

        return (matchesById || matchesByProduct) && isNotCompleted
      })

      // Group by target finish and sum quantities
      const finishQuantities = {}

      relevantPlans.forEach(plan => {
        const targetFinish =
          plan.targetFinish || plan.convertName || 'Unknown Finish'
        const remainingQuantity =
          plan.quantityTracking?.remainingQuantity ||
          plan.quantity - (plan.completedQuantity || 0)

        if (remainingQuantity > 0) {
          if (!finishQuantities[targetFinish]) {
            finishQuantities[targetFinish] = {
              finish: targetFinish,
              pendingQuantity: 0,
              totalPlans: 0,
              inProductionQuantity: 0
            }
          }

          finishQuantities[targetFinish].pendingQuantity += remainingQuantity
          finishQuantities[targetFinish].totalPlans += 1
          finishQuantities[targetFinish].inProductionQuantity +=
            plan.inProductionQuantity || 0
        }
      })

      return Object.values(finishQuantities).sort(
        (a, b) => b.pendingQuantity - a.pendingQuantity
      )
    },
    []
  )

  // Get comprehensive production data for any alloy (total, pending, in-production)
  const getAllProductionDataForAlloy = useCallback(
    (selectedAlloy, productionPlans) => {
      console.log('🔍 getAllProductionDataForAlloy called with:', {
        selectedAlloy: selectedAlloy,
        productionPlansCount: productionPlans?.length || 0,
        productionPlansFirst3: productionPlans?.slice(0, 3)
      })

      if (!selectedAlloy || !productionPlans) {
        console.log('❌ Early return - missing data')
        return {
          totalPlans: 0,
          totalQuantity: 0,
          pendingQuantity: 0,
          inProductionQuantity: 0,
          completedQuantity: 0,
          plans: []
        }
      }

      // Find all production plans where this alloy is involved (as source or target)
      const relevantPlans = productionPlans.filter(plan => {
        // Match by alloyId (exact match)
        const matchesById = plan.alloyId === selectedAlloy.id

        // Match by product specifications - try multiple field combinations
        const matchesByProduct =
          // Source matching
          (plan.sourceProductName === selectedAlloy.productName &&
            plan.sourceFinish === selectedAlloy.finish) ||
          plan.sourceAlloy === selectedAlloy.productName ||
          plan.sourceAlloyName === selectedAlloy.productName ||
          // Target matching
          (plan.targetProductName === selectedAlloy.productName &&
            plan.targetFinish === selectedAlloy.finish) ||
          plan.targetAlloy === selectedAlloy.productName ||
          plan.targetAlloyName === selectedAlloy.productName ||
          // Convert fields
          plan.convertTo === selectedAlloy.finish ||
          plan.convertName === selectedAlloy.finish ||
          // Product name without finish matching
          plan.productName === selectedAlloy.productName

        console.log('🔍 Checking plan:', {
          planId: plan.id,
          planAlloyId: plan.alloyId,
          selectedAlloyId: selectedAlloy.id,
          matchesById: matchesById,
          plan: {
            sourceProductName: plan.sourceProductName,
            sourceFinish: plan.sourceFinish,
            sourceAlloy: plan.sourceAlloy,
            sourceAlloyName: plan.sourceAlloyName,
            targetProductName: plan.targetProductName,
            targetFinish: plan.targetFinish,
            targetAlloy: plan.targetAlloy,
            targetAlloyName: plan.targetAlloyName,
            convertTo: plan.convertTo,
            convertName: plan.convertName,
            productName: plan.productName
          },
          selected: {
            productName: selectedAlloy.productName,
            finish: selectedAlloy.finish,
            id: selectedAlloy.id
          },
          matchesByProduct: matchesByProduct,
          finalMatch: matchesById || matchesByProduct
        })

        return matchesById || matchesByProduct
      })

      console.log('✅ Found relevant plans:', relevantPlans.length)

      // Calculate metrics
      let totalQuantity = 0
      let pendingQuantity = 0
      let inProductionQuantity = 0
      let completedQuantity = 0

      relevantPlans.forEach(plan => {
        const planQuantity = plan.quantity || 0
        const remaining =
          plan.quantityTracking?.remainingQuantity || planQuantity
        const inProduction = plan.inProductionQuantity || 0
        const completed = planQuantity - remaining

        totalQuantity += planQuantity
        pendingQuantity += remaining
        inProductionQuantity += inProduction
        completedQuantity += completed
      })

      const result = {
        totalPlans: relevantPlans.length,
        totalQuantity,
        pendingQuantity,
        inProductionQuantity,
        completedQuantity,
        plans: relevantPlans.map(plan => ({
          id: plan.id,
          type: plan.alloyId === selectedAlloy.id ? 'source' : 'target',
          sourceFinish: plan.sourceFinish,
          targetFinish: plan.targetFinish || plan.convertName,
          quantity: plan.quantity || 0,
          remaining:
            plan.quantityTracking?.remainingQuantity || plan.quantity || 0,
          inProduction: plan.inProductionQuantity || 0,
          status: plan.quantityTracking?.completionStatus || 'pending'
        }))
      }

      console.log('📊 Final result:', result)
      return result
    },
    []
  )

  // Get already selected finishes for a specific alloy ID
  const getSelectedFinishesForAlloy = useCallback(
    alloyId => {
      return Array.from(selectedRows)
        .map(planId => conversionPlans[planId])
        .filter(
          plan => plan && plan.originalAlloyId === alloyId && plan.targetFinish
        )
        .map(plan => plan.targetFinish)
    },
    [selectedRows, conversionPlans]
  )

  // Handle select all (creates one plan per alloy with first available finish)
  const handleSelectAll = useCallback(
    checked => {
      if (checked) {
        // Only select items with stock > 0
        const selectableItems = filteredStockData.filter(
          a => (a.inHouseStock || 0) > 0
        )
        const newRows = new Set()
        const newPlans = {}

        selectableItems.forEach(alloy => {
          const availableFinishes = getAvailableTargetFinishes(alloy)
          if (availableFinishes.length > 0) {
            const planId = `${alloy.id}_${planCounter + newRows.size}`
            newRows.add(planId)
            newPlans[planId] = {
              sourceAlloy: alloy,
              targetFinish: availableFinishes[0].value,
              quantity: 1,
              originalAlloyId: alloy.id
            }
          }
        })

        setSelectedRows(newRows)
        setConversionPlans(newPlans)
        setPlanCounter(prev => prev + newRows.size)
      } else {
        setSelectedRows(new Set())
        setConversionPlans({})
      }
    },
    [filteredStockData, getAvailableTargetFinishes, planCounter]
  )

  // Update conversion plan
  const updateConversionPlan = useCallback((planId, field, value) => {
    setConversionPlans(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value
      }
    }))
  }, [])

  // Handle bulk plan creation
  const handleCreateBulkPlans = useCallback(async () => {
    const validPlans = Array.from(selectedRows)
      .map(planId => conversionPlans[planId])
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
        // Find the target alloy ID based on the selected target finish
        const availableFinishes = getAvailableTargetFinishes(plan.sourceAlloy)
        const targetFinishOption = availableFinishes.find(
          f => f.value === plan.targetFinish
        )

        if (!targetFinishOption) {
          throw new Error(
            `Target finish "${plan.targetFinish}" not found for alloy ${plan.sourceAlloy.productName}`
          )
        }

        const planData = {
          alloyId: plan.sourceAlloy.id,
          convertId: targetFinishOption.alloyId, // Use the correct target alloy ID
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
      setPlanCounter(0)
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
  }, [
    selectedRows,
    conversionPlans,
    user,
    dispatch,
    navigate,
    getAvailableTargetFinishes
  ])

  // Table row renderer for virtual list
  const Row = ({ index, style }) => {
    const alloy = filteredStockData[index]
    if (!alloy) return null

    const totalStock = alloy.inHouseStock || 0
    const stockStatus =
      totalStock === 0 ? 'error' : totalStock < 10 ? 'warning' : 'success'

    // Check how many plans exist for this alloy
    const alloyPlans = Array.from(selectedRows)
      .map(planId => ({ planId, plan: conversionPlans[planId] }))
      .filter(({ plan }) => plan && plan.originalAlloyId === alloy.id)

    const hasPlans = alloyPlans.length > 0
    const selectedFinishes = getSelectedFinishesForAlloy(alloy.id)
    const availableFinishes = getAvailableTargetFinishes(
      alloy,
      selectedFinishes
    )

    return (
      <div
        style={style}
        className={`flex items-center px-4 border-b ${
          totalStock === 0 ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
        } ${hasPlans ? 'bg-blue-50' : ''}`}
      >
        {/* Add to Plan Button - 40px */}
        <div className='w-10 flex-shrink-0'>
          <Button
            size='small'
            type={hasPlans ? 'primary' : 'default'}
            icon={<PlusCircleOutlined />}
            onClick={() => handleAddToPlan(alloy.id)}
            disabled={totalStock === 0 || availableFinishes.length === 0}
            title={
              availableFinishes.length === 0
                ? 'No additional finishes available'
                : 'Add to Plan'
            }
          />
        </div>

        {/* Size & PCD - 100px */}
        <div className='w-[100px] flex-shrink-0 px-2'>
          <div className='font-semibold text-lg text-blue-600'>
            {alloy.inches}"
          </div>
          <div className='text-xs text-gray-500'>{alloy.pcd}</div>
        </div>

        {/* Product Info - Flexible */}
        <div className='flex-1 px-2 min-w-0'>
          <div className='font-medium truncate'>{alloy.productName}</div>
          <div className='text-xs text-gray-500 truncate'>
            {alloy.modelName} • {alloy.holes}H • {alloy.width}W • {alloy.finish}
          </div>
          {hasPlans && (
            <div className='text-xs text-blue-600 mt-1'>
              {alloyPlans.length} plan{alloyPlans.length > 1 ? 's' : ''}{' '}
              configured
            </div>
          )}
        </div>

        {/* Stock - 120px */}
        <div className='w-[120px] flex-shrink-0 px-2 text-center'>
          <div
            className={`font-bold text-lg ${
              stockStatus === 'error'
                ? 'text-red-600'
                : stockStatus === 'warning'
                ? 'text-orange-600'
                : 'text-green-600'
            }`}
          >
            {totalStock} units
          </div>
        </div>

        {/* Plan Status - 280px */}
        <div className='w-[280px] flex-shrink-0 px-2'>
          {totalStock === 0 ? (
            <Text type='secondary' className='text-xs'>
              No stock available
            </Text>
          ) : hasPlans ? (
            <div className='text-xs'>
              <Text strong className='text-blue-600'>
                {alloyPlans.length} plan{alloyPlans.length > 1 ? 's' : ''}
              </Text>
              {availableFinishes.length > 0 && (
                <Text type='secondary'>
                  {' '}
                  • {availableFinishes.length} more finish
                  {availableFinishes.length > 1 ? 'es' : ''} available
                </Text>
              )}
            </div>
          ) : (
            <Text type='secondary' className='text-xs'>
              {availableFinishes.length} finish
              {availableFinishes.length > 1 ? 'es' : ''} available for
              conversion
            </Text>
          )}
        </div>

        {/* Info Button - 50px */}
        <div className='w-[50px] flex-shrink-0 px-2 text-center'>
          <Button
            size='small'
            type='text'
            icon={<InfoCircleOutlined />}
            onClick={() => handleShowInfo(alloy)}
            title='View product information'
            className='text-blue-600 hover:bg-blue-50'
          />
        </div>
      </div>
    )
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = e => {
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
      <div className='h-screen flex bg-gray-50'>
        {/* Main Content */}
        <div className='flex-1 flex flex-col'>
          {/* Compact Header */}
          <div className='bg-white border-b px-6 py-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Title level={3} className='mb-0'>
                  Smart Production Planner
                </Title>
                <Badge count={selectedRows.size} showZero>
                  <Tag
                    className='cursor-pointer'
                    onClick={() => setShowSelectedPanel(!showSelectedPanel)}
                  >
                    {showSelectedPanel ? 'Hide' : 'Show'} Selected
                  </Tag>
                </Badge>
              </div>

              <Space>
                <Text type='secondary' className='text-xs'>
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
          <div className='bg-white border-b px-6 py-3'>
            <div className='flex items-center gap-3'>
              <Search
                id='search-input'
                placeholder='Search by product, model, size, PCD...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onPressEnter={() => listRef.current?.scrollToItem(0)}
                allowClear
                prefix={<SearchOutlined />}
                className='flex-1 max-w-md'
              />

              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? 'primary' : 'default'}
              >
                Filters{' '}
                {(filterSize || filterPcd || filterFinish) &&
                  `(${
                    [filterSize, filterPcd, filterFinish].filter(Boolean).length
                  })`}
              </Button>

              <Divider type='vertical' className='h-8' />

              <Checkbox
                checked={showOnlyWithStock}
                onChange={e => setShowOnlyWithStock(e.target.checked)}
              >
                Only with stock
              </Checkbox>

              <Checkbox
                checked={showWithoutPaint}
                onChange={e => setShowWithoutPaint(e.target.checked)}
              >
                Without paint
              </Checkbox>

              <Divider type='vertical' className='h-8' />

              <Button
                icon={<PlusCircleOutlined />}
                onClick={() => {
                  // Add one plan for each alloy with stock that doesn't have any plans yet
                  filteredStockData
                    .filter(alloy => (alloy.inHouseStock || 0) > 0)
                    .forEach(alloy => {
                      const existingPlans = Array.from(selectedRows)
                        .map(planId => conversionPlans[planId])
                        .filter(
                          plan => plan && plan.originalAlloyId === alloy.id
                        )

                      if (existingPlans.length === 0) {
                        handleAddToPlan(alloy.id)
                      }
                    })
                }}
              >
                Add All (
                {
                  filteredStockData.filter(a => (a.inHouseStock || 0) > 0)
                    .length
                }{' '}
                with stock)
              </Button>

              <Button
                icon={<ClearOutlined />}
                onClick={() => {
                  setSelectedRows(new Set())
                  setConversionPlans({})
                  setPlanCounter(0)
                  // Clear saved state
                  localStorage.removeItem('smartProductionState')
                }}
                disabled={selectedRows.size === 0}
              >
                Clear
              </Button>

              <Button
                type='primary'
                icon={<RocketOutlined />}
                onClick={handleCreateBulkPlans}
                disabled={selectedRows.size === 0}
                loading={isCreatingPlans}
                className='bg-green-600 border-green-600 hover:bg-green-700'
              >
                Create {selectedRows.size} Plans
              </Button>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
              <div className='mt-3 pt-3 border-t flex gap-3'>
                <Select
                  placeholder='Filter by Size'
                  value={filterSize}
                  onChange={setFilterSize}
                  allowClear
                  className='w-32'
                >
                  {(allSizes || []).map(size => (
                    <Option key={size.value} value={size.label}>
                      {size.label}"
                    </Option>
                  ))}
                </Select>

                <Select
                  placeholder='Filter by PCD'
                  value={filterPcd}
                  onChange={setFilterPcd}
                  allowClear
                  className='w-40'
                >
                  {(allPcd || []).map(pcd => (
                    <Option key={pcd.value} value={pcd.label}>
                      {pcd.label}
                    </Option>
                  ))}
                </Select>

                <Select
                  placeholder='Filter by Finish'
                  value={filterFinish}
                  onChange={setFilterFinish}
                  allowClear
                  className='w-40'
                >
                  {(allFinishes?.data || []).map(finish => (
                    <Option key={finish.id} value={finish.finish}>
                      {finish.finish}
                    </Option>
                  ))}
                </Select>

                <Button
                  size='small'
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
          <div
            className='bg-gray-100 border-b px-6 py-2 flex items-center font-semibold text-sm'
            style={{
              paddingRight: showSelectedPanel
                ? isPanelCollapsed
                  ? '60px'
                  : '416px'
                : '24px'
            }}
          >
            <div className='w-10 flex-shrink-0'>Add</div>
            <div className='w-[100px] flex-shrink-0 px-2'>Size/PCD</div>
            <div className='flex-1 px-2'>Product Details</div>
            <div className='w-[120px] flex-shrink-0 px-2 text-center'>
              Stock
            </div>
            <div className='w-[280px] flex-shrink-0 px-2'>Plan Status</div>
            <div className='w-[50px] flex-shrink-0 px-2 text-center'>Info</div>
          </div>

          {/* Virtual Table */}
          <div
            className='flex-1 bg-white'
            style={{
              marginRight:
                showSelectedPanel && selectedRows.size > 0
                  ? isPanelCollapsed
                    ? '48px'
                    : '400px'
                  : '0'
            }}
          >
            {loading ? (
              <div className='flex items-center justify-center h-full'>
                <Spin size='large' />
              </div>
            ) : filteredStockData.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full text-gray-500'>
                <div className='text-6xl mb-4'>📦</div>
                <div className='text-xl'>No alloys found</div>
                <div className='text-sm mt-2'>
                  Try adjusting your search or filters
                </div>
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
            <div className='bg-blue-50 border-t px-6 py-2 flex items-center justify-between'>
              <div className='text-sm'>
                <Text strong>{selectedRows.size}</Text> items selected •{' '}
                <Text strong>
                  {
                    Array.from(selectedRows)
                      .map(id => conversionPlans[id])
                      .filter(p => p?.targetFinish).length
                  }
                </Text>{' '}
                configured •{' '}
                <Text type='warning'>
                  {selectedRows.size -
                    Array.from(selectedRows)
                      .map(id => conversionPlans[id])
                      .filter(p => p?.targetFinish).length}
                </Text>{' '}
                need target finish
              </div>
              <Button
                type='primary'
                size='small'
                onClick={() => {
                  // Auto-fill with first available finish for each product
                  selectedRows.forEach(id => {
                    if (!conversionPlans[id]?.targetFinish) {
                      const sourceAlloy = filteredStockData.find(
                        a => a.id === id
                      )
                      if (sourceAlloy) {
                        const availableFinishes =
                          getAvailableTargetFinishes(sourceAlloy)
                        if (availableFinishes.length > 0) {
                          updateConversionPlan(
                            id,
                            'targetFinish',
                            availableFinishes[0].value
                          )
                        }
                      }
                    }
                  })
                }}
              >
                Auto-fill First Available
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
            onRemoveItem={id => handleRowSelect(id, false)}
            onRemoveAll={() => {
              setSelectedRows(new Set())
              setConversionPlans({})
              // Clear saved state
              localStorage.removeItem('smartProductionState')
            }}
            getAvailableTargetFinishes={getAvailableTargetFinishes}
          />
        )}

        {/* Product Info Modal */}
        <Modal
          title={
            <div className='flex items-center gap-2'>
              <InfoCircleOutlined className='text-blue-600' />
              <span>Product Information</span>
            </div>
          }
          open={infoModalVisible}
          onCancel={() => {
            setInfoModalVisible(false)
            setSelectedProductInfo(null)
          }}
          footer={[
            <Button key='close' onClick={() => setInfoModalVisible(false)}>
              Close
            </Button>
          ]}
          width={600}
        >
          {selectedProductInfo && (
            <div className='space-y-4'>
              {/* Basic Product Info */}
              <div className='bg-blue-50 p-4 rounded-lg'>
                <h3 className='font-semibold text-lg text-blue-800 mb-2'>
                  {selectedProductInfo.productName}
                </h3>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <strong>Model:</strong> {selectedProductInfo.modelName}
                  </div>
                  <div>
                    <strong>Size:</strong> {selectedProductInfo.inches}"
                  </div>
                  <div>
                    <strong>PCD:</strong> {selectedProductInfo.pcd}
                  </div>
                  <div>
                    <strong>Holes:</strong> {selectedProductInfo.holes}H
                  </div>
                  <div>
                    <strong>Width:</strong> {selectedProductInfo.width}W
                  </div>
                  <div>
                    <strong>Finish:</strong> {selectedProductInfo.finish}
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className='bg-green-50 p-4 rounded-lg'>
                <h4 className='font-semibold text-green-800 mb-2'>
                  Stock Information
                </h4>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <strong>In-House Stock:</strong>{' '}
                    {selectedProductInfo.inHouseStock || 0} units
                  </div>
                  <div>
                    <strong>Stock Status:</strong>
                    <Tag
                      color={
                        selectedProductInfo.inHouseStock > 0 ? 'green' : 'red'
                      }
                      className='ml-2'
                    >
                      {selectedProductInfo.inHouseStock > 0
                        ? 'Available'
                        : 'Out of Stock'}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* Production Status - For all alloys */}
              <div className='bg-blue-50 p-4 rounded-lg'>
                <h4 className='font-semibold text-blue-800 mb-3'>
                  Production Status
                </h4>
                {loadingProductionData ? (
                  <div className='flex items-center justify-center py-4'>
                    <Spin size='small' />
                    <span className='ml-2 text-sm'>
                      Loading production data...
                    </span>
                  </div>
                ) : (
                  (() => {
                    const alloyProductionData = getAllProductionDataForAlloy(
                      selectedProductInfo,
                      productionData
                    )

                    return (
                      <div className='space-y-3'>
                        {/* Summary Cards */}
                        <div className='grid grid-cols-2 gap-3'>
                          <div className='bg-white p-3 rounded border border-blue-200'>
                            <div className='text-xs text-gray-600 mb-1'>
                              Total Plans
                            </div>
                            <div className='text-lg font-bold text-blue-600'>
                              {alloyProductionData.totalPlans}
                            </div>
                          </div>
                          <div className='bg-white p-3 rounded border border-blue-200'>
                            <div className='text-xs text-gray-600 mb-1'>
                              Total Quantity
                            </div>
                            <div className='text-lg font-bold text-blue-600'>
                              {alloyProductionData.totalQuantity.toLocaleString()}
                            </div>
                          </div>
                          <div className='bg-white p-3 rounded border border-orange-200'>
                            <div className='text-xs text-gray-600 mb-1'>
                              Pending
                            </div>
                            <div className='text-lg font-bold text-orange-600'>
                              {alloyProductionData.pendingQuantity.toLocaleString()}
                            </div>
                          </div>
                          <div className='bg-white p-3 rounded border border-green-200'>
                            <div className='text-xs text-gray-600 mb-1'>
                              In Production
                            </div>
                            <div className='text-lg font-bold text-green-600'>
                              {alloyProductionData.inProductionQuantity.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Detailed Plans */}
                        {alloyProductionData.plans.length > 0 && (
                          <div>
                            <div className='text-sm font-medium text-gray-700 mb-2'>
                              Production Plans Details
                            </div>
                            <div className='space-y-2 max-h-32 overflow-y-auto'>
                              {alloyProductionData.plans.map((plan, index) => (
                                <div
                                  key={plan.id || index}
                                  className='flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-xs'
                                >
                                  <div className='flex-1'>
                                    <div className='flex items-center gap-1'>
                                      {plan.type === 'source' ? (
                                        <>
                                          <span className='text-gray-600'>
                                            Converting to:
                                          </span>
                                          <span className='font-medium'>
                                            {plan.targetFinish}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span className='text-gray-600'>
                                            Converting from:
                                          </span>
                                          <span className='font-medium'>
                                            {plan.sourceFinish}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <div className='text-gray-500 mt-1'>
                                      Status: {plan.status} • In Prod:{' '}
                                      {plan.inProduction}
                                    </div>
                                  </div>
                                  <div className='text-right'>
                                    <div className='font-medium'>
                                      {plan.remaining.toLocaleString()}
                                    </div>
                                    <div className='text-gray-500'>
                                      remaining
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {alloyProductionData.totalPlans === 0 && (
                          <div className='text-center py-4 text-gray-500 text-sm'>
                            No production plans found for this alloy
                          </div>
                        )}
                      </div>
                    )
                  })()
                )}
              </div>

              {/* Production Conversions - Only for base materials */}
              {(selectedProductInfo.id || selectedProductInfo.alloyId) && (
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-800 mb-2'>
                    Technical Details
                  </h4>
                  <div className='text-sm space-y-1'>
                    {selectedProductInfo.id && (
                      <div>
                        <strong>Product ID:</strong> {selectedProductInfo.id}
                      </div>
                    )}
                    {selectedProductInfo.alloyId && (
                      <div>
                        <strong>Alloy ID:</strong> {selectedProductInfo.alloyId}
                      </div>
                    )}
                    {selectedProductInfo.finishId && (
                      <div>
                        <strong>Finish ID:</strong>{' '}
                        {selectedProductInfo.finishId}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  )
}

export default SmartProductionDashboard
