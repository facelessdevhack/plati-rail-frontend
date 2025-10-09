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
  Statistic
} from 'antd'
import {
  ShopOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  ClearOutlined,
  PlusCircleOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  DownOutlined,
  UpOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { VariableSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import SalesChart from '../../Components/SalesChart'
import {
  getSuppliers,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder
} from '../../redux/api/purchaseSystemAPI'
import {
  getStockManagement,
  getAllSizes,
  getAllPcd,
  getAllFinishes,
  getEntriesByProductId
} from '../../redux/api/stockAPI'
import PurchaseItemsPanel from './PurchaseItemsPanel'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const SmartOrdering = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const listRef = useRef(null)

  // Redux state
  const { stockManagementData, loading, allSizes, allPcd, allFinishes } =
    useSelector(state => state.stockDetails)
  const { user } = useSelector(state => state.userDetails)
  const { suppliers, purchaseOrders, currentOrder } = useSelector(
    state => state.purchaseSystem
  )

  // console.log('🔍 Destructured production state:', {
  //   finishSalesMetrics,
  //   finishSalesMetricsLoading,
  //   finishSalesMetricsError,
  //   finishSalesMetricsKeys: Object.keys(finishSalesMetrics || {})
  // })

  // Local state
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSize, setFilterSize] = useState(null)
  const [filterPcd, setFilterPcd] = useState(null)
  const [filterFinish, setFilterFinish] = useState(null)
  const [showOnlyWithStock, setShowOnlyWithStock] = useState(false)
  const [showWithoutPaint, setShowWithoutPaint] = useState(false)
  const [conversionPlans, setConversionPlans] = useState({})
  const [isCreatingPlans, setIsCreatingPlans] = useState(false)
  const [showSelectedPanel, setShowSelectedPanel] = useState(true)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [planCounter, setPlanCounter] = useState(0) // Counter for unique plan IDs
  const [infoModalVisible, setInfoModalVisible] = useState(false)
  const [selectedProductInfo, setSelectedProductInfo] = useState(null)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [entriesData, setEntriesData] = useState({}) // Store entries by alloyId
  const [loadingEntries, setLoadingEntries] = useState({})

  // Reset virtual list when entries data changes (affects row heights)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        listRef.current &&
        typeof listRef.current.resetAfterIndex === 'function'
      ) {
        try {
          listRef.current.resetAfterIndex(0)
        } catch (error) {
          console.warn('Failed to reset list after entries data change:', error)
        }
      }
    }, 100) // Small delay to ensure DOM has updated

    return () => clearTimeout(timer)
  }, [entriesData])

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
      localStorage.setItem(
        'smartPurchaseOrderingState',
        JSON.stringify(stateToSave)
      )
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

  // Helper function to get trend icon
  const getTrendIcon = direction => {
    switch (direction) {
      case 'increasing':
        return '📈 '
      case 'decreasing':
        return '📉 '
      default:
        return '➡️ '
    }
  }

  // Load initial data and restore state
  useEffect(() => {
    dispatch(getStockManagement({ page: 1, limit: 10000, filter: 'all' }))
    dispatch(getAllSizes())
    dispatch(getAllPcd())
    dispatch(getAllFinishes())
    dispatch(getSuppliers()) // Fetch suppliers for purchase ordering
    dispatch(getPurchaseOrders({ page: 1, limit: 1000 })) // Fetch existing purchase orders

    // No need to fetch production data for purchase ordering

    // Load panel state from localStorage
    const savedPanelState = localStorage.getItem('selectedPanelCollapsed')
    if (savedPanelState !== null) {
      setIsPanelCollapsed(savedPanelState === 'true')
    }

    // Load saved purchase ordering state
    const savedState = localStorage.getItem('smartPurchaseOrderingState')
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
          localStorage.removeItem('smartPurchaseOrderingState')
        }
      } catch (error) {
        console.error('Failed to restore state:', error)
        localStorage.removeItem('smartPurchaseOrderingState')
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

  // Reset virtual list when filtered data changes (affects row count)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        listRef.current &&
        typeof listRef.current.resetAfterIndex === 'function'
      ) {
        try {
          listRef.current.resetAfterIndex(0)
        } catch (error) {
          console.warn(
            'Failed to reset list after filtered data change:',
            error
          )
        }
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [filteredStockData])

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

      // console.log('🔍 Finding finishes for:', sourceAlloy.productName, {
      //   modelId: sourceAlloy.modelId,
      //   modelName: sourceAlloy.modelName,
      //   inchesId: sourceAlloy.inchesId,
      //   pcdId: sourceAlloy.pcdId,
      //   holesId: sourceAlloy.holesId,
      //   cbId: sourceAlloy.cbId,
      //   widthId: sourceAlloy.widthId,
      //   offsetId: sourceAlloy.offsetId,
      //   finishId: sourceAlloy.finishId
      // })

      // Find all alloys with the EXACT same specification IDs but different finishes
      const matchedAlloys = stockManagementData.filter(alloy => {
        // Match by specification IDs (model, inches, pcd, holes, cb, width, offset)
        // IMPORTANT: modelName match is required since modelId is often undefined
        const sameSpecs =
          alloy.modelName === sourceAlloy.modelName &&
          alloy.inchesId === sourceAlloy.inchesId &&
          alloy.pcdId === sourceAlloy.pcdId &&
          alloy.holesId === sourceAlloy.holesId &&
          alloy.widthId === sourceAlloy.widthId

        const differentFinish =
          alloy.finishId !== sourceAlloy.finishId &&
          alloy.finish !== sourceAlloy.finish
        const notExcluded = !excludeFinishesForAlloy.includes(alloy.finish)

        // if (sameSpecs && differentFinish) {
        //   console.log(
        //     `  Match: ${alloy.productName} | Finish: ${
        //       alloy.finish
        //     } | Excluded: ${!notExcluded}`
        //   )
        // }

        return (
          sameSpecs &&
          differentFinish &&
          notExcluded &&
          (alloy.inHouseStock || 0) >= 0
        )
      })

      // console.log(`Total matches before dedup: ${matchedAlloys.length}`)

      const availableFinishes = matchedAlloys
        .map(alloy => ({
          value: alloy.finish,
          label: alloy.finish,
          stock: alloy.inHouseStock || 0,
          alloyId: alloy.id,
          id: alloy.finishId // Add finish ID for backend queries
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

      // console.log(
      //   `Final finishes (${availableFinishes.length}):`,
      //   availableFinishes.map(f => f.label)
      // )

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
  const handleShowInfo = useCallback(alloy => {
    setSelectedProductInfo(alloy)
    setInfoModalVisible(true)
  }, [])

  // Get combined monthly average and stock for "without paint/lacquer" finishes
  const getCombinedWithoutPaintData = useCallback(
    baseAlloy => {
      if (!baseAlloy || !stockManagementData) {
        return {
          combinedMonthlyAverage: 0,
          combinedTotalStock: 0,
          finishes: []
        }
      }

      // Find all finishes of the same base alloy that are "without paint" or "without lacquer"
      const withoutPaintFinishes = stockManagementData.filter(alloy => {
        const sameBaseAlloy =
          alloy.modelName === baseAlloy.modelName &&
          alloy.inchesId === baseAlloy.inchesId &&
          alloy.pcdId === baseAlloy.pcdId &&
          alloy.holesId === baseAlloy.holesId &&
          alloy.widthId === baseAlloy.widthId

        const finish = alloy.finish ? alloy.finish.toLowerCase() : ''
        const isWithoutPaint =
          finish.includes('without paint') || finish.includes('without lacquer')

        return sameBaseAlloy && isWithoutPaint
      })

      // Calculate combined monthly average and total stock
      let combinedMonthlyAverage = 0
      let combinedTotalStock = 0

      withoutPaintFinishes.forEach(alloy => {
        // Add stock
        combinedTotalStock += alloy.inHouseStock || 0

        // Add monthly average if entries data exists
        const alloyEntries = entriesData[alloy.id]
        if (alloyEntries?.monthlyAverageSales) {
          combinedMonthlyAverage += alloyEntries.monthlyAverageSales
        }
      })

      return {
        combinedMonthlyAverage,
        combinedTotalStock,
        finishes: withoutPaintFinishes.map(f => f.finish)
      }
    },
    [stockManagementData, entriesData]
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

  // Handle bulk purchase order creation
  const handleCreatePurchaseOrders = useCallback(async () => {
    const validOrders = Array.from(selectedRows)
      .map(planId => conversionPlans[planId])
      .filter(plan => plan && plan.quantity > 0)

    if (validOrders.length === 0) {
      notification.warning({
        message: 'No Valid Orders',
        description: 'Please select target finishes and quantities'
      })
      return
    }

    // Check if supplier is selected (you might want to add supplier selection)
    if (!suppliers || suppliers.length === 0) {
      notification.warning({
        message: 'No Suppliers Available',
        description: 'Please add suppliers before creating orders'
      })
      return
    }

    setIsCreatingPlans(true)
    try {
      const orderPromises = validOrders.map(async plan => {
        // Find the target alloy ID based on the selected target finish
        const availableFinishes = getAvailableTargetFinishes(plan.sourceAlloy)
        // const targetFinishOption = availableFinishes.find(
        //   f => f.value === plan.targetFinish
        // )

        // if (!targetFinishOption) {
        //   throw new Error(
        //     `Target finish "${plan.targetFinish}" not found for alloy ${plan.sourceAlloy.productName}`
        //   )
        // }

        // Create purchase order item
        const orderItemData = {
          productId: plan.sourceAlloy.id,
          productName: plan.sourceAlloy.productName,
          modelName: plan.sourceAlloy.modelName,
          size: plan.sourceAlloy.inches,
          pcd: plan.sourceAlloy.pcd,
          holes: plan.sourceAlloy.holes,
          width: plan.sourceAlloy.width,
          sourceFinish: plan.sourceAlloy.finish,
          targetFinish: plan.targetFinish,
          quantity: plan.quantity
        }

        // For now, create a simple order with first supplier
        // In a real implementation, you'd want supplier selection
        const orderData = {
          supplierId: suppliers[0].id, // Use first available supplier
          orderNumber: `PO-${Date.now()}`, // Generate order number
          orderDate: new Date().toISOString().split('T')[0],
          expectedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0], // 30 days from now
          status: 'pending',
          notes: 'Created via Smart Ordering',
          items: [orderItemData]
        }

        return dispatch(createPurchaseOrder(orderData)).unwrap()
      })

      await Promise.all(orderPromises)

      notification.success({
        message: 'Orders Created!',
        description: `Successfully created ${validOrders.length} purchase orders`,
        duration: 3
      })

      // Reset
      setSelectedRows(new Set())
      setConversionPlans({})
      setPlanCounter(0)
      // Clear saved state after successful creation
      localStorage.removeItem('smartPurchaseOrderingState')
      navigate('/purchase-orders')
    } catch (error) {
      notification.error({
        message: 'Failed to Create Orders',
        description: error?.message || 'Some orders could not be created'
      })
    } finally {
      setIsCreatingPlans(false)
    }
  }, [
    selectedRows,
    conversionPlans,
    user,
    suppliers,
    dispatch,
    navigate,
    getAvailableTargetFinishes
  ])

  // Table row renderer for virtual list
  // Format finish name to include color if needed
  const formatFinishDisplay = useCallback((finish, productName) => {
    if (!finish) return ''

    const finishUpper = finish.toUpperCase()

    // If finish contains "WITHOUT" (lacquer, paint, etc.), extract color from product name
    if (finishUpper.includes('WITHOUT') && productName) {
      // Extract color that appears right before the finish in the product name
      // e.g., "PY-021 17*7.5/114.3 x 5 BLACK WITHOUT LACQUER" -> "BLACK"
      const productNameUpper = productName.toUpperCase()
      const finishIndex = productNameUpper.indexOf(finishUpper)

      if (finishIndex > 0) {
        // Get the part before the finish and split by spaces
        const beforeFinish = productName.substring(0, finishIndex).trim()
        const words = beforeFinish.split(/\s+/)
        // The last word should be the color
        const color = words[words.length - 1]

        // Check if it's a valid color word (alphabetic characters, possibly with hyphen)
        if (color && color.match(/^[A-Z-]+$/i)) {
          return `${color.toUpperCase()} ${finish.toUpperCase()}`
        }
      }
    }

    return finish
  }, [])

  // Fetch entries for a specific alloy
  const fetchEntriesForAlloy = useCallback(
    async alloyId => {
      if (entriesData[alloyId] || loadingEntries[alloyId]) {
        return // Already loaded or loading
      }

      setLoadingEntries(prev => ({ ...prev, [alloyId]: true }))
      try {
        const result = await dispatch(
          getEntriesByProductId({ productId: alloyId })
        ).unwrap()
        console.log(`Debug - API response for alloy ${alloyId}:`, result.data)
        setEntriesData(prev => ({ ...prev, [alloyId]: result.data || [] }))
      } catch (error) {
        console.error('Failed to fetch entries:', error)
        setEntriesData(prev => ({ ...prev, [alloyId]: [] }))
      } finally {
        setLoadingEntries(prev => ({ ...prev, [alloyId]: false }))
      }
    },
    [dispatch, entriesData, loadingEntries]
  )

  // Toggle row expansion
  const toggleRowExpansion = useCallback(alloyId => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(alloyId)) {
        newSet.delete(alloyId)
      } else {
        newSet.add(alloyId)
      }

      // Reset the virtual list after expansion state changes to prevent overlapping
      setTimeout(() => {
        if (
          listRef.current &&
          typeof listRef.current.resetAfterIndex === 'function'
        ) {
          try {
            listRef.current.resetAfterIndex(0)
          } catch (error) {
            console.warn('Failed to reset list after row expansion:', error)
          }
        }
      }, 0)

      return newSet
    })
  }, [])

  // Add finish directly from expanded row
  const handleAddFinishFromExpanded = useCallback(
    (alloy, targetFinish) => {
      const newPlanId = `plan-${Date.now()}-${planCounter}`
      setPlanCounter(prev => prev + 1)

      setConversionPlans(prev => ({
        ...prev,
        [newPlanId]: {
          sourceAlloy: alloy,
          originalAlloyId: alloy.id,
          targetFinish: targetFinish,
          quantity: 1
        }
      }))

      setSelectedRows(prev => new Set([...prev, newPlanId]))
    },
    [planCounter]
  )

  // Calculate row size for variable height - now more compact
  const getItemSize = useCallback(
    index => {
      const alloy = filteredStockData[index]
      if (!alloy) return 100

      const isExpanded = expandedRows.has(alloy.id)

      if (!isExpanded) {
        // Base height is 100px
        return 100
      }

      const selectedFinishes = getSelectedFinishesForAlloy(alloy.id)
      const availableFinishes = getAvailableTargetFinishes(
        alloy,
        selectedFinishes
      )

      // Calculate dynamic height based on actual content
      let totalHeight = 180 // Base row + header (80 + 40)

      // Debug: Log expanded state and available finishes
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `getItemSize - Alloy: ${alloy.id}, Expanded: ${isExpanded}, Available finishes: ${availableFinishes.length}`
        )
      }

      availableFinishes.forEach(finish => {
        // Base Card height (compact)
        let cardHeight = 120 // Finish name + button

        // No production data for purchase ordering
        // All finish cards have consistent height

        // Sales metrics section - dynamic based on data availability
        // Check if we have sales data for this alloy (shared across all finishes)
        const alloySalesData = entriesData[alloy.id]
        const hasSalesData = alloySalesData?.monthlySalesData?.length > 0
        cardHeight += hasSalesData ? 200 : 180 // Enhanced vs Compact layout

        // Debug: Log height calculation for this finish (Content Library)
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `Content Library Height - Alloy: ${alloy.id}, Finish: ${finish.value}, HasSalesData: ${hasSalesData}, CardHeight: ${cardHeight}`
          )
        }

        // Card spacing
        cardHeight += 12

        totalHeight += cardHeight
      })

      return totalHeight
    },
    [
      filteredStockData,
      expandedRows,
      getSelectedFinishesForAlloy,
      getAvailableTargetFinishes,
      stockManagementData
    ]
  )

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

    const isExpanded = expandedRows.has(alloy.id)

    return (
      <div
        style={style}
        className={`border-b ${
          totalStock === 0 ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
        } ${hasPlans ? 'bg-blue-50' : ''}`}
      >
        <div className='flex items-center px-4 h-20'>
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
              {alloy.modelName} • {alloy.holes}H • {alloy.width}W •{' '}
              {formatFinishDisplay(alloy.finish, alloy.productName)}
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

            {/* Combined monthly average for without paint/lacquer alloys */}
            {(() => {
              const alloyFinish = alloy.finish ? alloy.finish.toLowerCase() : ''
              const isWithoutPaint =
                alloyFinish.includes('without paint') ||
                alloyFinish.includes('without lacquer')

              if (isWithoutPaint) {
                // Find all finishes of the same base alloy
                const allFinishesForBaseAlloy = stockManagementData.filter(
                  a =>
                    a.modelName === alloy.modelName &&
                    a.inchesId === alloy.inchesId &&
                    a.pcdId === alloy.pcdId &&
                    a.holesId === alloy.holesId &&
                    a.widthId === alloy.widthId
                )

                let totalMonthlyAvg = 0
                let hasData = false

                // Simply add up the monthlyAverageSales from entries data
                allFinishesForBaseAlloy.forEach(a => {
                  const entries = entriesData[a.id]
                  if (
                    entries?.monthlyAverageSales &&
                    entries.monthlyAverageSales > 0
                  ) {
                    totalMonthlyAvg += entries.monthlyAverageSales
                    hasData = true
                  }
                })

                if (hasData && totalMonthlyAvg > 0) {
                  return (
                    <div className='mt-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-300 font-medium text-xs inline-block'>
                      📊 {totalMonthlyAvg.toLocaleString()}/mo
                    </div>
                  )
                }
              }

              return null
            })()}
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

          {/* Expand & Info Buttons - 90px */}
          <div className='w-[90px] flex-shrink-0 px-2 flex gap-1 justify-center'>
            <Button
              size='small'
              type='text'
              icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
              onClick={() => toggleRowExpansion(alloy.id)}
              title={
                isExpanded ? 'Collapse' : 'Expand to see available finishes'
              }
              className='text-gray-600 hover:bg-gray-100'
              disabled={availableFinishes.length === 0}
            />
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

        {/* Expanded Content */}
        {isExpanded && availableFinishes.length > 0 && (
          <div className='px-3 pb-2 bg-gray-50 border-t border-gray-200'>
            <div className='flex items-center gap-2 py-1.5'>
              <Badge
                count={availableFinishes.length}
                color='purple'
                size='small'
              />
              <Text className='text-xs text-gray-600'>
                Available Conversions
              </Text>
            </div>

            <div className='space-y-1.5'>
              {console.log(availableFinishes, 'AVAILABLE FINISHES')}
              {availableFinishes.map(finish => {
                const isAlreadyAdded = selectedFinishes.includes(finish.value)

                return (
                  <Card
                    key={finish.value}
                    size='small'
                    className='hover:shadow transition-shadow'
                    bodyStyle={{ padding: '8px 10px' }}
                    style={{
                      borderLeft: `3px solid ${
                        finish.stock > 10
                          ? '#52c41a'
                          : finish.stock > 0
                          ? '#faad14'
                          : '#ff4d4f'
                      }`
                    }}
                  >
                    {/* Finish Name and Stock */}
                    <div className='flex items-center justify-between gap-2 mb-1.5'>
                      <Space size={4}>
                        <Text strong className='text-sm'>
                          {finish.label}
                        </Text>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`px-3 py-1.5 rounded-full font-bold text-sm ${
                              finish.stock > 10
                                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                : finish.stock > 0
                                ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                                : 'bg-red-100 text-red-700 border-2 border-red-300'
                            }`}
                          >
                            {finish.stock} In Stock
                          </div>

                          {/* Add monthly average for without paint/lacquer finishes */}
                          {(() => {
                            const finishText = finish.label
                              ? finish.label.toLowerCase()
                              : ''
                            const isWithoutPaint =
                              finishText.includes('without paint') ||
                              finishText.includes('without lacquer')

                            if (isWithoutPaint) {
                              const finishAlloyData = stockManagementData?.find(
                                a =>
                                  a.modelName === alloy.modelName &&
                                  a.inchesId === alloy.inchesId &&
                                  a.pcdId === alloy.pcdId &&
                                  a.holesId === alloy.holesId &&
                                  a.widthId === alloy.widthId &&
                                  a.finish === finish.value
                              )

                              const alloyEntries =
                                entriesData[finishAlloyData?.id]
                              const monthlyAverage =
                                alloyEntries?.monthlyAverageSales || 0

                              if (monthlyAverage > 0) {
                                return (
                                  <div className='px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-300 font-medium text-xs'>
                                    📊 {monthlyAverage.toLocaleString()}/mo
                                  </div>
                                )
                              }
                            }

                            return null
                          })()}
                        </div>
                      </Space>
                      <Button
                        type={isAlreadyAdded ? 'default' : 'primary'}
                        size='small'
                        icon={
                          isAlreadyAdded ? (
                            <CheckCircleOutlined />
                          ) : (
                            <PlusCircleOutlined />
                          )
                        }
                        onClick={() =>
                          handleAddFinishFromExpanded(alloy, finish.value)
                        }
                        disabled={isAlreadyAdded}
                        className='text-xs h-6'
                      >
                        {isAlreadyAdded ? 'Added' : 'Add'}
                      </Button>
                    </div>

                    {/* Entry History */}
                    {(() => {
                      const finishEntries = entriesData[finish.alloyId] || []
                      const isLoadingEntries = loadingEntries[finish.alloyId]

                      // Fetch entries when card is rendered
                      if (!entriesData[finish.alloyId] && !isLoadingEntries) {
                        fetchEntriesForAlloy(finish.alloyId)
                      }

                      if (isLoadingEntries) {
                        return (
                          <div className='bg-gray-50 rounded px-2 py-1 text-center'>
                            <Spin size='small' />
                            <Text type='secondary' className='text-xs ml-2'>
                              Loading entries...
                            </Text>
                          </div>
                        )
                      }

                      return (
                        <div className='bg-white rounded-lg border border-gray-200 p-4'>
                          {/* Content Library: Conditional display based on data availability */}
                          {finishEntries.monthlySalesData &&
                          finishEntries.monthlySalesData.length > 0 ? (
                            // Enhanced layout when data is available
                            <div className='grid grid-cols-12 gap-4 items-stretch'>
                              {/* Total Units Sold KPI */}
                              <div className='col-span-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 flex flex-col justify-center relative overflow-hidden'>
                                <div className='absolute top-0 right-0 w-16 h-16 bg-blue-200 opacity-20 rounded-full -mr-8 -mt-8'></div>
                                <div className='flex items-start justify-between mb-3 relative z-10'>
                                  <div className='flex items-center gap-2'>
                                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                                    <span className='text-xs text-blue-600 font-semibold uppercase tracking-wide'>
                                      Total Units
                                    </span>
                                  </div>
                                  <div className='text-xs text-blue-500 font-medium bg-blue-100 px-2 py-1 rounded'>
                                    All Time
                                  </div>
                                </div>
                                <div className='relative z-10'>
                                  <div className='text-3xl font-bold text-blue-700 mb-1'>
                                    {(
                                      finishEntries.totalUnits || 0
                                    ).toLocaleString()}
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    <span className='text-xs text-blue-500 font-medium'>
                                      units sold
                                    </span>
                                    {finishEntries.totalUnits > 0 && (
                                      <span className='text-xs text-green-600 font-medium'>
                                        ✓ Active
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Monthly Sales Average KPI */}
                              <div className='col-span-3 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4 border border-cyan-200 flex flex-col justify-center relative overflow-hidden'>
                                <div className='absolute top-0 right-0 w-16 h-16 bg-cyan-200 opacity-20 rounded-full -mr-8 -mt-8'></div>
                                <div className='flex items-start justify-between mb-3 relative z-10'>
                                  <div className='flex items-center gap-2'>
                                    <div className='w-2 h-2 bg-cyan-500 rounded-full'></div>
                                    <span className='text-xs text-cyan-600 font-semibold uppercase tracking-wide'>
                                      Monthly Avg
                                    </span>
                                  </div>
                                  <div className='text-xs text-cyan-500 font-medium bg-cyan-100 px-2 py-1 rounded'>
                                    Per Month
                                  </div>
                                </div>
                                <div className='relative z-10'>
                                  <div className='text-3xl font-bold text-cyan-700 mb-1'>
                                    {(
                                      finishEntries.monthlyAverageSales || 0
                                    ).toLocaleString()}
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    <span className='text-xs text-cyan-500 font-medium'>
                                      units/month
                                    </span>
                                    {finishEntries.monthlyAverageSales > 0 && (
                                      <span className='text-xs text-orange-600 font-medium'>
                                        📊 Trending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Sales Trend Chart */}
                              <div className='col-span-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 p-4 flex flex-col'>
                                <div className='flex items-center justify-between mb-3'>
                                  <div>
                                    <h4 className='text-sm font-semibold text-gray-700 mb-1'>
                                      Sales Trend
                                    </h4>
                                    <p className='text-xs text-gray-500'>
                                      {finishEntries.monthlySalesData?.length ||
                                        0}{' '}
                                      months
                                    </p>
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <span className='text-lg'>
                                      {getTrendIcon(
                                        finishEntries.salesTrend?.direction
                                      )}
                                    </span>
                                    <div className='text-right'>
                                      <div className='text-sm font-semibold text-green-700 capitalize'>
                                        {finishEntries.salesTrend?.direction ||
                                          'stable'}
                                      </div>
                                      <div className='text-xs text-green-500'>
                                        {finishEntries.salesTrend?.strength ||
                                          'unknown'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className='flex-1 flex items-end'>
                                  <SalesChart
                                    salesHistory={
                                      finishEntries.monthlySalesData || []
                                    }
                                    height={120}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Compact layout when no data available
                            <div className='grid grid-cols-4 gap-4 items-center'>
                              {/* Total Units Sold KPI */}
                              <div className='bg-blue-50 rounded-lg p-3 border border-blue-100'>
                                <div className='text-xs text-blue-600 font-medium mb-1'>
                                  Total Units
                                </div>
                                <div className='text-xl font-bold text-blue-700'>
                                  {(
                                    finishEntries.totalUnits || 0
                                  ).toLocaleString()}
                                </div>
                                <div className='text-xs text-blue-500'>
                                  units
                                </div>
                              </div>

                              {/* Monthly Sales Average KPI */}
                              <div className='bg-cyan-50 rounded-lg p-3 border border-cyan-100'>
                                <div className='text-xs text-cyan-600 font-medium mb-1'>
                                  Monthly Avg
                                </div>
                                <div className='text-xl font-bold text-cyan-700'>
                                  {(
                                    finishEntries.monthlyAverageSales || 0
                                  ).toLocaleString()}
                                </div>
                                <div className='text-xs text-cyan-500'>
                                  units/month
                                </div>
                              </div>

                              {/* Sales Trend KPI */}
                              <div className='bg-green-50 rounded-lg p-3 border border-green-100'>
                                <div className='text-xs text-green-600 font-medium mb-1'>
                                  Trend
                                </div>
                                <div className='flex items-center gap-1'>
                                  <span className='text-lg'>
                                    {getTrendIcon(
                                      finishEntries.salesTrend?.direction
                                    )}
                                  </span>
                                  <span className='text-sm font-semibold text-green-700 capitalize'>
                                    {finishEntries.salesTrend?.direction ||
                                      'stable'}
                                  </span>
                                </div>
                              </div>

                              {/* No Data Message */}
                              <div className='bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-center'>
                                <div className='text-center'>
                                  <div className='text-gray-400 mb-1'>📊</div>
                                  <div className='text-xs text-gray-500'>
                                    No sales data
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )

                      return null
                    })()}
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Reset list cache when expanded rows change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        listRef.current &&
        typeof listRef.current.resetAfterIndex === 'function'
      ) {
        try {
          listRef.current.resetAfterIndex(0)
        } catch (error) {
          console.warn(
            'Failed to reset list after expanded rows change:',
            error
          )
        }
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [expandedRows])

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
      // Ctrl+Enter - Create orders
      if (e.ctrlKey && e.key === 'Enter' && selectedRows.size > 0) {
        handleCreatePurchaseOrders()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleSelectAll, selectedRows, handleCreatePurchaseOrders])

  return (
    <div className='h-screen flex bg-gray-50'>
      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Compact Header */}
        <div className='bg-white border-b px-6 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Title level={3} className='mb-0'>
                <ShopOutlined className='mr-2' />
                Smart Vendor Ordering
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
                onClick={() => navigate('/purchase-orders')}
              >
                Purchase Orders
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

            {/* <Button
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
              </Button> */}

            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setSelectedRows(new Set())
                setConversionPlans({})
                setPlanCounter(0)
                // Clear saved state
                localStorage.removeItem('smartPurchaseOrderingState')
              }}
              disabled={selectedRows.size === 0}
            >
              Clear
            </Button>

            <Button
              type='primary'
              icon={<ShoppingCartOutlined />}
              onClick={handleCreatePurchaseOrders}
              disabled={selectedRows.size === 0}
              loading={isCreatingPlans}
              className='bg-green-600 border-green-600 hover:bg-green-700'
            >
              Create {selectedRows.size} Orders
            </Button>
          </div>

          {/* Filters */}
          <div className='mt-3 pt-3 border-t flex gap-3 flex-wrap items-end'>
            <div className='flex flex-col'>
              <label className='text-xs text-gray-600 mb-1 font-medium'>
                Size
              </label>
              <Select
                placeholder='Filter by Size'
                value={filterSize}
                onChange={setFilterSize}
                allowClear
                className='w-32'
              >
                {(allSizes || [])
                  .slice()
                  .sort((a, b) => parseFloat(a.label) - parseFloat(b.label))
                  .map(size => (
                    <Option key={size.value} value={size.label}>
                      {size.label}"
                    </Option>
                  ))}
              </Select>
            </div>

            <div className='flex flex-col'>
              <label className='text-xs text-gray-600 mb-1 font-medium'>
                PCD
              </label>
              <Select
                placeholder='Filter by PCD'
                value={filterPcd}
                onChange={setFilterPcd}
                allowClear
                className='w-40'
              >
                {(allPcd || [])
                  .slice()
                  .reverse()
                  .map(pcd => (
                    <Option key={pcd.value} value={pcd.label}>
                      {pcd.label}
                    </Option>
                  ))}
              </Select>
            </div>

            <div className='flex flex-col'>
              <label className='text-xs text-gray-600 mb-1 font-medium'>
                Finish
              </label>
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
            </div>

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
        </div>

        {/* Table Header */}
        <div
          className='bg-gray-100 border-b px-6 py-2 flex items-center font-semibold text-sm'
          style={{
            paddingRight:
              (showSelectedPanel ? (isPanelCollapsed ? 60 : 416) : 24) + 'px'
          }}
        >
          <div className='w-10 flex-shrink-0'>Add</div>
          <div className='w-[100px] flex-shrink-0 px-2'>Size/PCD</div>
          <div className='flex-1 px-2'>Product Details</div>
          <div className='w-[120px] flex-shrink-0 px-2 text-center'>Stock</div>
          <div className='w-[280px] flex-shrink-0 px-2'>Plan Status</div>
          <div className='w-[50px] flex-shrink-0 px-2 text-center'>Info</div>
        </div>

        {/* Virtual Table */}
        <div
          className='flex-1 bg-white'
          style={{
            marginRight:
              (showSelectedPanel && selectedRows.size > 0
                ? isPanelCollapsed
                  ? 48
                  : 400
                : 0) + 'px'
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
                  itemSize={getItemSize}
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
                    const sourceAlloy = filteredStockData.find(a => a.id === id)
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
        <PurchaseItemsPanel
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
            localStorage.removeItem('smartPurchaseOrderingState')
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

            {/* Available Finishes */}
            <div className='bg-purple-50 p-4 rounded-lg'>
              <h4 className='font-semibold text-purple-800 mb-3'>
                Available Finishes
              </h4>
              {(() => {
                const availableFinishes =
                  getAvailableTargetFinishes(selectedProductInfo)

                if (availableFinishes.length === 0) {
                  return (
                    <div className='text-sm text-gray-500 text-center py-2'>
                      No other finishes available for this product specification
                    </div>
                  )
                }

                return (
                  <div className='space-y-2'>
                    {availableFinishes.map((finish, index) => (
                      <div
                        key={finish.value}
                        className='flex items-center justify-between p-2 bg-white rounded border border-purple-200'
                      >
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium text-gray-800'>
                            {finish.label}
                          </span>
                        </div>
                        <Tag
                          color={
                            finish.stock > 10
                              ? 'green'
                              : finish.stock > 0
                              ? 'orange'
                              : 'red'
                          }
                        >
                          {finish.stock} units
                        </Tag>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Technical Details - Product Information */}
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
                      <strong>Finish ID:</strong> {selectedProductInfo.finishId}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SmartOrdering
