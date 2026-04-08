import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Progress,
  Tooltip,
  Badge,
  Typography,
  Row,
  Col,
  Statistic,
  Modal,
  notification,
  Dropdown,
  Menu,
  Segmented,
  Avatar,
  Empty,
  Skeleton,
  message
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  ToolOutlined,
  ArrowRightOutlined,
  MoreOutlined,
  ExportOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  CalendarOutlined,
  TeamOutlined,
  DashboardOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  BarsOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'

import Layout from '../Layout/layout'
import KpiCard from '../../Core/Components/KpiCard'
import DataTablePagination from '../../Core/Components/DataTablePagination'
import JobCardCreationModal from './JobCardCreationModal'
import JobCardDetailsModal from './JobCardDetailsModal'
import StepProgressModal from './StepProgressModal'
import {
  getJobCardsWithDetails,
  getProductionPlansWithQuantities,
  updateJobCardProgress,
  getPresetDetails,
  getProductionSteps,
  processStepProgress,
  getJobCardStepProgress,
  initializeJobCardSteps,
  deleteJobCard,
  getJobCardsWithStepProgress,
  getJobCardsWithStepProgressBatch
} from '../../redux/api/productionAPI'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { confirm } = Modal

// Production Steps Configuration with enhanced visuals
const PRODUCTION_STEPS = [
  {
    id: 1,
    name: 'Material Request',
    color: '#722ed1',
    icon: '📦',
    shortName: 'Material'
  },
  { id: 2, name: 'Painting', color: '#eb2f96', icon: '🎨', shortName: 'Paint' },
  {
    id: 3,
    name: 'Machining',
    color: '#faad14',
    icon: '⚙️',
    shortName: 'Machine'
  },
  {
    id: 4,
    name: 'PVD Powder Coating',
    color: '#fa8c16',
    icon: '🔧',
    shortName: 'PVD Coat'
  },
  {
    id: 5,
    name: 'PVD Process',
    color: '#a0d911',
    icon: '⚡',
    shortName: 'PVD'
  },
  { id: 6, name: 'Milling', color: '#52c41a', icon: '🏭', shortName: 'Mill' },
  {
    id: 7,
    name: 'Acrylic Coating',
    color: '#13c2c2',
    icon: '💧',
    shortName: 'Acrylic'
  },
  {
    id: 8,
    name: 'Lacquer Finish',
    color: '#1890ff',
    icon: '✨',
    shortName: 'Lacquer'
  },
  { id: 9, name: 'Packaging', color: '#2f54eb', icon: '📋', shortName: 'Pack' },
  {
    id: 10,
    name: 'Quality Check',
    color: '#f5222d',
    icon: '🔍',
    shortName: 'QA'
  },
  { id: 11, name: 'Dispatch', color: '#389e0d', icon: '🚚', shortName: 'Ship' }
]

const JobCardListing = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Redux state
  const { user } = useSelector(state => state.userDetails || {})
  const { presetDetails, productionSteps } = useSelector(
    state => state.productionDetails || {}
  )

  // Local state
  const [jobCards, setJobCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Export loading states
  const [exportLoading, setExportLoading] = useState(false)
  const [detailedExportLoading, setDetailedExportLoading] = useState(false)
  const [jobCardPresets, setJobCardPresets] = useState({})
  const [viewMode, setViewMode] = useState('table') // 'table' or 'cards'

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStep, setSelectedStep] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [dateRange, setDateRange] = useState(null)

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [selectedJobCard, setSelectedJobCard] = useState(null)

  // Step progress modal state
  const [stepProgressModalVisible, setStepProgressModalVisible] =
    useState(false)
  const [selectedStepProgress, setSelectedStepProgress] = useState(null)
  const [stepProgressData, setStepProgressData] = useState([])
  const [stepProgressLoading, setStepProgressLoading] = useState(false)

  // Export filter modal state
  const [exportFilterModalVisible, setExportFilterModalVisible] =
    useState(false)
  const [exportFilterFormat, setExportFilterFormat] = useState('pdf') // 'pdf', 'detailed_pdf', 'excel'
  const [exportFilters, setExportFilters] = useState({
    excludeDispatched: true,
    excludeCompleted: false,
    includeOnlyWithRejected: false,
    includeOnlyWithPending: false
  })

  // Selected job cards for export
  const [selectedJobCardIds, setSelectedJobCardIds] = useState([])

  // Helper functions for checking rejected/pending quantities
  const hasRejectedQuantities = jobCard => {
    if (!jobCard.stepProgress || !Array.isArray(jobCard.stepProgress))
      return false
    return jobCard.stepProgress.some(step => (step.rejectedQuantity || 0) > 0)
  }

  const hasPendingQuantities = jobCard => {
    if (!jobCard.stepProgress || !Array.isArray(jobCard.stepProgress))
      return false
    return jobCard.stepProgress.some(step => (step.pendingQuantity || 0) > 0)
  }

  // Apply custom export filters to job cards
  const applyExportFilters = jobCards => {
    let filtered = [...jobCards]

    // Filter by dispatched status
    if (exportFilters.excludeDispatched) {
      filtered = filtered.filter(jc => {
        const isDispatched =
          jc.status === 'Completed' &&
          jc.stepProgress?.some(sp =>
            sp.stepName?.toLowerCase().includes('dispatch')
          )
        return !isDispatched
      })
    }

    // Filter by completed status
    if (exportFilters.excludeCompleted) {
      filtered = filtered.filter(jc => jc.status !== 'Completed')
    }

    // Include ONLY with rejected quantities
    if (exportFilters.includeOnlyWithRejected) {
      filtered = filtered.filter(jc => hasRejectedQuantities(jc))
    }

    // Include ONLY with pending quantities
    if (exportFilters.includeOnlyWithPending) {
      filtered = filtered.filter(jc => hasPendingQuantities(jc))
    }

    return filtered
  }

  // Export functions with custom filters
  const handleExportWithFilters = async format => {
    try {
      setExportLoading(true)

      const loadingMessage = message.loading({
        content: '🔍 Fetching job cards for export...',
        duration: 0
      })

      const batchResult = await dispatch(
        getJobCardsWithStepProgressBatch({
          page: 1,
          limit: 1000,
          search: searchTerm,
          status: selectedStatus === 'all' ? null : selectedStatus,
          excludeDispatched: false // We'll filter manually
        })
      ).unwrap()

      if (!batchResult.jobCards || batchResult.jobCards.length === 0) {
        message.warning('No job cards found for export')
        loadingMessage()
        return
      }

      // Apply custom filters
      const filteredJobCards = applyExportFilters(batchResult.jobCards)

      if (filteredJobCards.length === 0) {
        message.warning('No job cards match the selected filters')
        loadingMessage()
        return
      }

      loadingMessage()

      // Prepare export data
      const exportData = filteredJobCards.map(jc => ({
        'Job Card ID': jc.id,
        Date: jc.createdAt
          ? moment(jc.createdAt).format('YYYY-MM-DD HH:mm')
          : '',
        'Source Product': jc.alloyName || '',
        'Target Product': jc.convertName || '',
        Quantity: jc.quantity || 0,
        'Progress %': `${jc.progressPercentage || 0}%`,
        Status: jc.status,
        Priority: jc.isUrgent ? 'Urgent' : 'Normal',
        'Created By': jc.createdBy || 'Unknown',
        'Has Rejected': hasRejectedQuantities(jc) ? 'Yes' : 'No',
        'Has Pending': hasPendingQuantities(jc) ? 'Yes' : 'No'
      }))

      // CSV Export
      const headers = Object.keys(exportData[0])
      const csvContent = [
        headers.join(','),
        ...exportData.map(row =>
          headers
            .map(header => {
              const value = row[header]
              return typeof value === 'string' &&
                (value.includes(',') || value.includes('"'))
                ? `"${value.replace(/"/g, '""')}"`
                : value
            })
            .join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `job-cards-custom-export-${moment().format(
        'YYYY-MM-DD'
      )}.csv`
      link.click()

      message.success(
        `✅ Exported ${filteredJobCards.length} job cards to Excel`
      )
      setExportLoading(false)
    } catch (error) {
      console.error('Export error:', error)
      message.error('Failed to export job cards')
      setExportLoading(false)
    }
  }

  const handleExportPDFWithFilters = async () => {
    try {
      setExportLoading(true)

      const loadingMessage = message.loading({
        content: '🔍 Fetching job cards for PDF export...',
        duration: 0
      })

      const batchResult = await dispatch(
        getJobCardsWithStepProgressBatch({
          page: 1,
          limit: 1000,
          search: searchTerm,
          status: selectedStatus === 'all' ? null : selectedStatus,
          excludeDispatched: false
        })
      ).unwrap()

      const filteredJobCards = applyExportFilters(batchResult.jobCards || [])

      if (filteredJobCards.length === 0) {
        message.warning('No job cards match the selected filters')
        loadingMessage()
        return
      }

      loadingMessage()

      // Use existing handleExportPDF logic but with filtered data
      await handleExportPDF(false, filteredJobCards)
    } catch (error) {
      console.error('PDF export error:', error)
      message.error('Failed to export PDF')
      setExportLoading(false)
    }
  }

  const handleExportDetailedPDFWithFilters = async () => {
    try {
      setDetailedExportLoading(true)

      const loadingMessage = message.loading({
        content: '🔍 Fetching job cards for detailed PDF export...',
        duration: 0
      })

      const batchResult = await dispatch(
        getJobCardsWithStepProgressBatch({
          page: 1,
          limit: 1000,
          search: searchTerm,
          status: selectedStatus === 'all' ? null : selectedStatus,
          excludeDispatched: false
        })
      ).unwrap()

      const filteredJobCards = applyExportFilters(batchResult.jobCards || [])

      if (filteredJobCards.length === 0) {
        message.warning('No job cards match the selected filters')
        loadingMessage()
        return
      }

      loadingMessage()

      // Use existing handleExportDetailedPDF logic but with filtered data
      await handleExportDetailedPDF(false, filteredJobCards)
    } catch (error) {
      console.error('Detailed PDF export error:', error)
      message.error('Failed to export detailed PDF')
      setDetailedExportLoading(false)
    }
  }

  const handleExportSelectedJobCards = async () => {
    try {
      if (selectedJobCardIds.length === 0) {
        message.warning('Please select at least one job card to export')
        return
      }

      setDetailedExportLoading(true)

      const loadingMessage = message.loading({
        content: `📋 Fetching step progress for ${selectedJobCardIds.length} selected job cards...`,
        duration: 0
      })

      console.log(
        `🔍 Fetching ONLY selected job cards: ${selectedJobCardIds.join(', ')}`
      )

      // Fetch step progress for ONLY the selected job cards
      const selectedJobCardsWithSteps = []

      for (const jobCardId of selectedJobCardIds) {
        try {
          const result = await dispatch(
            getJobCardStepProgress(jobCardId)
          ).unwrap()
          const stepProgress = result.data || result.stepProgress || []

          // Find the job card in the current loaded list
          const jobCard = jobCards.find(
            jc => (jc.jobCardId || jc.id) === jobCardId
          )

          if (jobCard) {
            // Calculate progress percentage
            const totalSteps = jobCard.totalWorkflowSteps || 11
            const currentStep = jobCard.prodStep || 1
            const progressPercentage = Math.round(
              (currentStep / totalSteps) * 100
            )

            selectedJobCardsWithSteps.push({
              ...jobCard,
              id: jobCard.jobCardId || jobCard.id,
              alloyName: jobCard.sourceProductName || jobCard.alloyName,
              convertName: jobCard.targetProductName || jobCard.convertName,
              progressPercentage: progressPercentage,
              status: currentStep >= totalSteps ? 'Completed' : 'In Progress',
              stepProgress: stepProgress
            })
            console.log(`✅ Fetched step progress for job card ${jobCardId}`)
          }
        } catch (error) {
          console.error(
            `Failed to fetch step progress for job card ${jobCardId}:`,
            error
          )
        }
      }

      if (selectedJobCardsWithSteps.length === 0) {
        message.warning('No step progress found for selected job cards')
        loadingMessage()
        setDetailedExportLoading(false)
        return
      }

      console.log(
        `✅ Successfully fetched ${selectedJobCardsWithSteps.length} selected job cards with step progress`
      )
      loadingMessage()

      // Use existing handleExportDetailedPDF logic but with selected data
      await handleExportDetailedPDF(false, selectedJobCardsWithSteps)

      message.success(
        `✅ Exported ${selectedJobCardsWithSteps.length} selected job cards to PDF`
      )
    } catch (error) {
      console.error('Export selected job cards error:', error)
      message.error('Failed to export selected job cards')
      setDetailedExportLoading(false)
    }
  }

  // Load job cards and production plans with allocation details
  const loadJobCards = async () => {
    try {
      setLoading(true)

      // Get job cards with enhanced details
      const jobCardResult = await dispatch(
        getJobCardsWithDetails({
          page: currentPage,
          limit: pageSize,
          search: searchTerm,
          status: selectedStatus === 'all' ? null : selectedStatus
        })
      ).unwrap()

      // Get production plans with quantity tracking to enhance job cards
      const plansResult = await dispatch(
        getProductionPlansWithQuantities({
          page: 1,
          limit: 100
        })
      ).unwrap()

      // Create a map of production plans for quick lookup
      const plansMap = {}
      if (plansResult?.productionPlans) {
        plansResult.productionPlans.forEach(plan => {
          plansMap[plan.id] = plan
        })
      }

      // Enhance job cards with proper field mapping from API response
      let enhancedJobCards = (jobCardResult.jobCards || []).map((jc, index) => {
        const plan = plansMap[jc.prodplanid || jc.prodPlanId] || {}
        const tracking = plan.quantityTracking || {}

        // Debug logging for preset fields
        console.log('Raw job card data:', {
          id: jc.jobcardid || jc.id,
          allFields: Object.keys(jc),
          presetRelatedFields: Object.keys(jc).filter(
            key =>
              key.toLowerCase().includes('preset') ||
              key.toLowerCase().includes('step') ||
              key.toLowerCase().includes('assignment') ||
              key.toLowerCase().includes('mode')
          )
        })

        return {
          ...jc,
          // Fix field name mapping
          id: jc.jobcardid || jc.id,
          prodPlanId: jc.prodplanid || jc.prodPlanId,

          // Map API response fields to frontend expectations
          alloyName:
            jc.sourceproductname ||
            jc.alloyName ||
            plan.alloyName ||
            'Unknown Alloy',
          convertName:
            jc.targetproductname ||
            jc.convertName ||
            plan.convertName ||
            'Unknown Conversion',
          isUrgent: Boolean(jc.urgent) || jc.isUrgent || Boolean(plan.urgent),

          // Creator name from API fields
          createdBy:
            jc.createdbyfirstname && jc.createdbylastname
              ? `${jc.createdbyfirstname} ${jc.createdbylastname}`
              : jc.createdBy || 'Unknown',

          // Preset and step assignment mode fields - check all possible field names
          presetName:
            jc.presetname ||
            jc.presetName ||
            jc.preset_name ||
            jc.workflow_preset ||
            jc.workflowPreset ||
            jc.workflow_preset_name ||
            null,
          presetId: jc.presetid || jc.presetId || jc.preset_id || null,
          stepAssignmentMode:
            jc.stepassignmentmode ||
            jc.stepAssignmentMode ||
            jc.step_assignment_mode ||
            jc.workflow_mode ||
            jc.workflowMode ||
            'standard',

          // Allocation details
          planTotalQuantity: plan.quantity || 0,
          planAllocatedQuantity: tracking.totalJobCardQuantity || 0,
          planRemainingQuantity: tracking.remainingQuantity || 0,
          planCompletedQuantity: tracking.completedQuantity || 0,
          allocationPercentage:
            plan.quantity > 0
              ? Math.round((jc.quantity / plan.quantity) * 100)
              : 0
        }
      })

      // Apply local filtering if needed
      let filteredJobCards = enhancedJobCards

      if (selectedStep !== 'all') {
        filteredJobCards = filteredJobCards.filter(jc => {
          const stepInfo = getStepInfo(jc, jc.prodStep)
          return stepInfo?.name === selectedStep
        })
      }

      if (selectedPriority !== 'all') {
        filteredJobCards = filteredJobCards.filter(jc =>
          selectedPriority === 'urgent' ? jc.isUrgent : !jc.isUrgent
        )
      }

      setJobCards(filteredJobCards)
      setTotalCount(jobCardResult.totalCount || filteredJobCards.length)

      // Load preset details for job cards that use presets
      if (filteredJobCards.length > 0) {
        loadJobCardPresets(filteredJobCards)
      }
    } catch (error) {
      console.error('Job Cards Loading Error:', error)
      notification.error({
        message: 'Failed to Load Job Cards',
        description: error?.message || 'Unable to fetch job cards from server.',
        duration: 5
      })
    } finally {
      setLoading(false)
    }
  }

  // Load preset steps for job cards
  const loadJobCardPresets = async jobCards => {
    console.log(
      'Loading presets for job cards:',
      jobCards.map(jc => ({
        id: jc.id,
        presetId: jc.presetId,
        presetName: jc.presetName,
        stepAssignmentMode: jc.stepAssignmentMode
      }))
    )

    const presetPromises = []
    const presetsToLoad = new Map()

    jobCards.forEach(jc => {
      console.log(
        `Job card ${jc.id}: presetId="${jc.presetId}", presetName="${jc.presetName}", stepAssignmentMode="${jc.stepAssignmentMode}"`
      )
      if (jc.presetId && jc.stepAssignmentMode === 'preset') {
        presetsToLoad.set(jc.presetId, jc.presetName) // Store both ID and name
      }
    })

    console.log('Presets to load:', Array.from(presetsToLoad.entries()))

    if (presetsToLoad.size === 0) {
      console.log('No presets to load')
      return
    }

    for (const [presetId, presetName] of presetsToLoad.entries()) {
      presetPromises.push(
        dispatch(getPresetDetails({ presetId }))
          .unwrap()
          .then(result => {
            // Handle different response structures
            console.log(`Raw preset response for presetId ${presetId}:`, result)
            const steps = result?.steps || result?.data?.steps || result || []
            console.log(`Loaded preset ${presetName} (${presetId}):`, steps)
            return { presetId, presetName, steps }
          })
          .catch(error => {
            console.warn(
              `Failed to load preset ${presetName} (${presetId}):`,
              error
            )
            return { presetId, presetName, steps: [] }
          })
      )
    }

    try {
      const presetResults = await Promise.all(presetPromises)
      const presetMap = {}

      presetResults.forEach(({ presetId, presetName, steps }) => {
        // Use presetName as the key for backward compatibility with existing code
        presetMap[presetName] = Array.isArray(steps) ? steps : []
        // Also store by ID for more robust lookup
        presetMap[presetId] = Array.isArray(steps) ? steps : []
      })

      console.log('Loaded preset map:', presetMap)
      setJobCardPresets(presetMap)
    } catch (error) {
      console.error('Error loading job card presets:', error)
    }
  }

  // Load production steps on mount
  useEffect(() => {
    dispatch(getProductionSteps())
  }, [dispatch])

  // Load data on mount and when filters change
  useEffect(() => {
    loadJobCards()
  }, [
    currentPage,
    pageSize,
    searchTerm,
    selectedStep,
    selectedStatus,
    selectedPriority,
    dateRange
  ])

  // Get steps for a job card
  const getJobCardSteps = record => {
    // Try presetId first, then presetName for backward compatibility
    const presetKey = record.presetId || record.presetName

    if (
      presetKey &&
      record.stepAssignmentMode === 'preset' &&
      jobCardPresets[presetKey]
    ) {
      // Create a copy of the array before sorting to avoid modifying frozen Redux state
      const steps = [...jobCardPresets[presetKey]]
      return steps.sort((a, b) => a.stepOrder - b.stepOrder)
    }
    return PRODUCTION_STEPS
  }

  // Get step info for a specific job card
  const getStepInfo = (record, stepId) => {
    const steps = getJobCardSteps(record)

    if (record.presetName && record.stepAssignmentMode === 'preset') {
      const step = steps.find(s => s.stepOrder === stepId)
      return step
        ? {
            id: stepId,
            name: step.stepName,
            shortName: step.stepName?.split(' ')[0],
            color: '#1890ff',
            icon: '⚙️'
          }
        : PRODUCTION_STEPS.find(s => s.id === stepId) || {
            name: 'Unknown',
            shortName: 'Unknown',
            color: '#gray',
            icon: '❓'
          }
    } else {
      return (
        PRODUCTION_STEPS.find(s => s.id === stepId) || {
          name: 'Unknown',
          shortName: 'Unknown',
          color: '#gray',
          icon: '❓'
        }
      )
    }
  }

  // Get total steps count
  const getTotalSteps = record => {
    const steps = getJobCardSteps(record)
    // If preset is specified and loaded, use preset steps count
    if (
      record.presetName &&
      record.stepAssignmentMode === 'preset' &&
      steps.length > 0
    ) {
      return steps.length
    }
    // Otherwise use standard production steps count
    return PRODUCTION_STEPS.length
  }

  // Get unique step names from all job cards
  const uniqueStepNames = useMemo(() => {
    const stepNames = new Set()
    jobCards.forEach(jc => {
      const stepInfo = getStepInfo(jc, jc.prodStep)
      if (stepInfo?.name) {
        stepNames.add(stepInfo.name)
      }
    })
    return Array.from(stepNames).sort()
  }, [jobCards, jobCardPresets])

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = jobCards.length
    const inProgress = jobCards.filter(jc => {
      const totalSteps = getTotalSteps(jc)
      return jc.prodStep > 1 && jc.prodStep < totalSteps
    }).length
    const completed = jobCards.filter(jc => {
      const totalSteps = getTotalSteps(jc)
      return jc.prodStep >= totalSteps
    }).length
    const urgent = jobCards.filter(jc => jc.isUrgent).length
    const qaReady = jobCards.filter(jc => {
      const totalSteps = getTotalSteps(jc)
      return jc.prodStep >= totalSteps - 1
    }).length

    return {
      total,
      inProgress,
      completed,
      urgent,
      qaReady,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }, [jobCards, jobCardPresets])

  // Handle export to Excel/CSV
  const handleExport = async (format, excludeDispatched = false) => {
    try {
      // Show loading message
      const loadingMessage = message.loading(
        'Fetching all job cards for export...'
      )

      // Fetch ALL job cards (without pagination)
      const allJobCardsResult = await dispatch(
        getJobCardsWithDetails({
          page: 1,
          limit: 10000, // Large number to get all job cards
          search: searchTerm,
          status: selectedStatus === 'all' ? null : selectedStatus
        })
      ).unwrap()

      // Get production plans with quantity tracking to enhance job cards
      const plansResult = await dispatch(
        getProductionPlansWithQuantities({
          page: 1,
          limit: 10000
        })
      ).unwrap()

      // Create a map of production plans for quick lookup
      const plansMap = {}
      if (plansResult?.productionPlans) {
        plansResult.productionPlans.forEach(plan => {
          plansMap[plan.id] = plan
        })
      }

      // Enhance all job cards with proper field mapping
      let allJobCards = (allJobCardsResult.jobCards || []).map((jc, index) => {
        const plan = plansMap[jc.prodplanid || jc.prodPlanId] || {}
        const tracking = plan.quantityTracking || {}

        return {
          ...jc,
          // Fix field name mapping
          id: jc.jobcardid || jc.id,
          prodPlanId: jc.prodplanid || jc.prodPlanId,
          alloyName:
            jc.sourceproductname ||
            jc.alloyName ||
            plan.alloyName ||
            'Unknown Alloy',
          convertName:
            jc.targetproductname ||
            jc.convertName ||
            plan.convertName ||
            'Unknown Conversion',
          isUrgent: Boolean(jc.urgent) || jc.isUrgent || Boolean(plan.urgent),
          createdBy:
            jc.createdbyfirstname && jc.createdbylastname
              ? `${jc.createdbyfirstname} ${jc.createdbylastname}`
              : jc.createdBy || 'Unknown',
          planTotalQuantity: plan.quantity || 0,
          planAllocatedQuantity: tracking.totalJobCardQuantity || 0,
          planRemainingQuantity: tracking.remainingQuantity || 0,
          planCompletedQuantity: tracking.completedQuantity || 0,
          allocationPercentage:
            plan.quantity > 0
              ? Math.round((jc.quantity / plan.quantity) * 100)
              : 0
        }
      })

      // Filter out dispatched job cards if requested
      if (excludeDispatched) {
        allJobCards = allJobCards.filter(jc => {
          const stepInfo = getStepInfo(jc, jc.prodStep)
          const totalSteps = getTotalSteps(jc)
          const isDispatched =
            jc.prodStep >= totalSteps &&
            stepInfo?.name?.toLowerCase().includes('dispatch')
          return !isDispatched
        })
      }

      loadingMessage()

      // Prepare data for export
      const exportData = allJobCards.map(jc => {
        const stepInfo = getStepInfo(jc, jc.prodStep)
        const totalSteps = getTotalSteps(jc)
        const progress = Math.round((jc.prodStep / totalSteps) * 100)

        return {
          'Job Card ID': jc.jobCardId || jc.id,
          'Plan ID': jc.prodPlanId,
          Date: jc.createdAt
            ? moment(jc.createdAt).format('YYYY-MM-DD HH:mm')
            : '',
          'Source Product': jc.sourceProductName || jc.alloyName || '',
          'Target Product': jc.targetProductName || jc.convertName || '',
          Quantity: jc.quantity || 0,
          'Current Step': stepInfo?.name || 'Unknown',
          'Step Progress': `${jc.prodStep}/${totalSteps}`,
          'Progress %': `${progress}%`,
          Priority: jc.isUrgent ? 'Urgent' : 'Normal',
          'Created By': jc.createdBy || 'Unknown',
          Preset: jc.presetName || 'Standard',
          Status: jc.prodStep >= totalSteps ? 'Completed' : 'In Progress'
        }
      })

      if (format === 'csv') {
        // CSV Export
        const headers = Object.keys(exportData[0])
        const csvContent = [
          headers.join(','),
          ...exportData.map(row =>
            headers
              .map(header => {
                const value = row[header]
                // Escape commas and quotes in values
                return typeof value === 'string' &&
                  (value.includes(',') || value.includes('"'))
                  ? `"${value.replace(/"/g, '""')}"`
                  : value
              })
              .join(',')
          )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `job_cards_${
          excludeDispatched ? 'non_dispatched_' : ''
        }${moment().format('YYYY-MM-DD')}.csv`
        link.click()
        message.success(
          `${allJobCards.length} job cards exported to CSV successfully`
        )
      } else {
        // Excel Export - using simple HTML table method
        const tableHTML = `
          <table>
            <thead>
              <tr>
                ${Object.keys(exportData[0])
                  .map(header => `<th>${header}</th>`)
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${exportData
                .map(
                  row => `
                <tr>
                  ${Object.values(row)
                    .map(value => `<td>${value}</td>`)
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `

        const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `job_cards_${
          excludeDispatched ? 'non_dispatched_' : ''
        }${moment().format('YYYY-MM-DD')}.xls`
        link.click()
        message.success(
          `${allJobCards.length} job cards exported to Excel successfully`
        )
      }
    } catch (error) {
      console.error('Export error:', error)
      message.error('Failed to export data')
    }
  }

  // Handle export to detailed PDF with step-wise quantities (using working individual APIs)
  const handleExportDetailedPDF = async (
    excludeDispatched = false,
    preFilteredJobCards = null
  ) => {
    try {
      setDetailedExportLoading(true)

      let jobCardsWithSteps = preFilteredJobCards
      let loadingMessage = null

      // Only fetch from API if pre-filtered cards are not provided
      if (!preFilteredJobCards) {
        // Show specific loading message
        loadingMessage = message.loading({
          content:
            '🔍 Fetching job cards and step progress for detailed PDF export...',
          duration: 0 // Don't auto dismiss
        })

        console.log(
          `🚀 Using optimized batch endpoint that replicates individual API logic...`
        )

        // Use the batch endpoint that replicates the exact logic of individual APIs
        const batchResult = await dispatch(
          getJobCardsWithStepProgressBatch({
            page: 1,
            limit: 1000,
            search: searchTerm,
            status: selectedStatus === 'all' ? null : selectedStatus,
            excludeDispatched
          })
        ).unwrap()

        if (!batchResult.jobCards || batchResult.jobCards.length === 0) {
          message.warning('No job cards found for detailed export')
          if (loadingMessage) loadingMessage()
          setDetailedExportLoading(false)
          return
        }

        jobCardsWithSteps = batchResult.jobCards
        console.log(
          `✅ Successfully fetched ${jobCardsWithSteps.length} job cards with step progress in batch`
        )

        if (loadingMessage) loadingMessage()
      } else {
        console.log(
          `✅ Using ${preFilteredJobCards.length} pre-filtered job cards`
        )
      }

      // Check what we're getting
      if (jobCardsWithSteps.length > 0) {
        console.log('🔍 FIRST JOB CARD:', jobCardsWithSteps[0])
        console.log(
          '🔍 FIRST JOB CARD STEP PROGRESS:',
          jobCardsWithSteps[0].stepProgress
        )
        console.log(
          '🔍 STEP PROGRESS LENGTH:',
          jobCardsWithSteps[0].stepProgress.length
        )
      }

      // Sort all job cards by ID in descending order
      const sortedJobCards = [...jobCardsWithSteps].sort((a, b) => b.id - a.id)

      // Create HTML content for detailed PDF with 2x2 grid layout
      const reportTitle = excludeDispatched
        ? 'Detailed Non-Dispatched Job Cards Report'
        : 'Detailed Job Cards Report'

      let htmlContent = `
        <html>
          <head>
            <title>${reportTitle} - ${moment().format('DD MMM YYYY')}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              * {
                box-sizing: border-box;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 8px;
                margin: 0;
                padding: 0;
                color: #000;
              }
              .page-header {
                text-align: center;
                margin: 0 0 8px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #333;
              }
              .page-header h1 {
                margin: 0 0 4px 0;
                font-size: 14px;
                color: #333;
                font-weight: bold;
              }
              .page-header .summary {
                font-size: 9px;
                font-weight: bold;
                color: #1890ff;
              }
              .page {
                page-break-after: always;
                width: 100%;
                height: 250mm;
                padding: 0;
                display: flex;
                flex-direction: column;

              }
              .page:last-child {
                page-break-after: auto;
              }
              .jobcard-section {
                border: 2px solid #333;
                border-radius: 4px;
                padding: 6px;
                background-color: #fafafa;
                display: flex;
                flex-direction: column;
                height: 255mm;
                overflow: hidden;
              }
              .jobcard-header {
                background-color: #e9ecef;
                padding: 4px;
                border-radius: 3px;
                margin-bottom: 6px;
                border: 1px solid #999;
              }
              .jobcard-title {
                font-weight: bold;
                font-size: 11px;
                text-align: center;
                margin-bottom: 3px;
              }
              .jobcard-details {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
                gap: 3px;
                font-size: 8px;
              }
              .jobcard-detail-item {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .jobcard-detail-label {
                font-weight: bold;
                color: #555;
              }
              .status-completed { color: #52c41a; font-weight: bold; }
              .status-in-progress { color: #faad14; font-weight: bold; }
              .status-pending { color: #d9d9d9; font-weight: bold; }
              .priority-urgent { color: #ff4d4f; font-weight: bold; }
              .priority-normal { color: #52c41a; font-weight: bold; }
              .steps-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9px;
                background-color: white;
                table-layout: fixed;
              }
              .steps-table th,
              .steps-table td {
                border: 1px solid #999;
                padding: 38px 3px;
                text-align: left;
                vertical-align: middle;
                overflow: hidden;
                line-height: 1.3;
              }
              .steps-table th {
                background-color: #f8f9fa;
                font-weight: bold;
                font-size: 9px;
                text-align: center;
                padding: 5px 3px;
                line-height: 1.2;
              }
              .step-col { width: 20%; }
              .qty-col { width: 8%; text-align: center; }
              .status-col { width: 12%; text-align: center; }
              .reason-col { width: 20%; word-wrap: break-word; }
              .no-entries {
                text-align: center;
                font-style: italic;
                color: #666;
                padding: 4px;
                font-size: 6px;
              }
              .quantity-zero { color: #999; }
              .quantity-positive { color: #000; font-weight: bold; }
              .quantity-rejected { color: #ff4d4f; font-weight: bold; }
              .quantity-pending { color: #faad14; font-weight: bold; }
              @media print {
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            </style>
          </head>
          <body>
      `

      // Process job cards one per page
      sortedJobCards.forEach((jc, index) => {
        // Add page header on first page only
        if (index === 0) {
          htmlContent += `
            <div class="page-header">
              <h1>${reportTitle}</h1>
              <div class="summary">
                Date: ${moment().format('DD MMM YYYY HH:mm')} | 
                Total: ${sortedJobCards.length} cards |
                1 job card per page
              </div>
            </div>
          `
        }

        htmlContent += `<div class="page">`

        {
          const priorityClass = jc.isUrgent
            ? 'priority-urgent'
            : 'priority-normal'
          const priorityText = jc.isUrgent ? 'Urgent' : 'Normal'
          const hasStepProgress = jc.stepProgress && jc.stepProgress.length > 0

          htmlContent += `
              <div class="jobcard-section">
                <div class="jobcard-header">
                  <div class="jobcard-title">JC #${jc.id} - ${jc.alloyName} → ${jc.convertName}</div>
                  <div class="jobcard-details">
                    <div class="jobcard-detail-item">
                      <span class="jobcard-detail-label">Qty:</span> ${jc.quantity}
                    </div>
                    <div class="jobcard-detail-item">
                      <span class="jobcard-detail-label">Progress:</span> ${jc.progressPercentage}%
                    </div>
                    <div class="jobcard-detail-item">
                      <span class="jobcard-detail-label">Priority:</span> <span class="${priorityClass}">${priorityText}</span>
                    </div>
                    <div class="jobcard-detail-item">
                      <span class="jobcard-detail-label">Status:</span> ${jc.status}
                    </div>
                  </div>
                </div>
                <table class="steps-table">
                  <thead>
                    <tr>
                      <th class="step-col">Step Name</th>
                      <th class="qty-col">Input</th>
                      <th class="qty-col">Accepted</th>
                      <th class="qty-col">Rejected</th>
                      <th class="qty-col">Pending</th>
                      <th class="status-col">Status</th>
                      <th class="reason-col">Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody>
            `

          if (hasStepProgress) {
            jc.stepProgress.forEach(step => {
              const statusClass =
                step.status === 'completed'
                  ? 'status-completed'
                  : step.status === 'in_progress'
                  ? 'status-in-progress'
                  : 'status-pending'

              htmlContent += `
                  <tr>
                    <td style="font-size: 9px; font-weight: 500;">${
                      step.stepIcon || ''
                    } ${step.stepName}</td>
                    <td class="${
                      step.inputQuantity > 0
                        ? 'quantity-positive'
                        : 'quantity-zero'
                    }" style="text-align: center; font-size: 9px;">
                      ${step.inputQuantity || 0}
                    </td>
                    <td class="${
                      step.acceptedQuantity > 0
                        ? 'quantity-positive'
                        : 'quantity-zero'
                    }" style="text-align: center; font-size: 9px;">
                      ${step.acceptedQuantity || 0}
                    </td>
                    <td class="${
                      step.rejectedQuantity > 0
                        ? 'quantity-rejected'
                        : 'quantity-zero'
                    }" style="text-align: center; font-size: 9px;">
                      ${step.rejectedQuantity || 0}
                    </td>
                    <td class="${
                      step.pendingQuantity > 0
                        ? 'quantity-pending'
                        : 'quantity-zero'
                    }" style="text-align: center; font-size: 9px;">
                      ${step.pendingQuantity || 0}
                    </td>
                    <td style="text-align: center; font-weight: bold; font-size: 9px;" class="${statusClass}">
                      ${
                        step.status?.replace('_', ' ').toUpperCase() ||
                        'PENDING'
                      }
                    </td>
                    <td style="font-size: 8px; word-wrap: break-word;">
                      ${step.rejectionReason || '-'}
                    </td>
                  </tr>
                `
            })
          } else {
            const currentStep = jc.prodStep || 1
            const totalSteps = jc.totalWorkflowSteps || 11

            htmlContent += `
                <tr>
                  <td colspan="7" class="no-entries">
                    Step progress not initialized<br>
                    Current: ${currentStep}/${totalSteps} (${Math.round(
              (currentStep / totalSteps) * 100
            )}%)
                  </td>
                </tr>
              `
          }

          htmlContent += `
                  </tbody>
                </table>
              </div>
            `
        }

        htmlContent += `</div>`
      })

      htmlContent += `</body></html>`

      // Create a temporary window to print the content
      const printWindow = window.open('', '_blank', 'width=1000,height=800')

      if (!printWindow) {
        // Popup was blocked - offer alternative
        Modal.error({
          title: '❌ Popup Blocked',
          content: (
            <div>
              <p>The browser blocked the popup window needed for PDF export.</p>
              <p>
                <strong>To fix this:</strong>
              </p>
              <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li>Allow popups for this site in your browser settings</li>
                <li>Click the PDF export button again</li>
              </ol>
              <p style={{ marginTop: '10px', color: '#1890ff' }}>
                <strong>Tip:</strong> Look for a popup blocker icon in your
                browser's address bar and click "Always allow popups".
              </p>
            </div>
          ),
          width: 500
        })
        return
      }

      printWindow.document.write(htmlContent)
      printWindow.document.title = `${reportTitle} - ${moment().format(
        'DD MMM YYYY'
      )}`
      printWindow.document.close()

      // Wait for the content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()

          // Show helpful instructions
          Modal.info({
            title: '📄 PDF Export Instructions',
            content: (
              <div>
                <p>
                  <strong>
                    A print dialog has been opened in a new window.
                  </strong>
                </p>
                <p>To save as PDF:</p>
                <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
                  <li>
                    <strong>Windows/Linux:</strong> Select "Save as PDF" or
                    "Microsoft Print to PDF" as the printer
                  </li>
                  <li>
                    <strong>Mac:</strong> Click "PDF" button in bottom-left,
                    then select "Save as PDF"
                  </li>
                  <li>Choose your save location</li>
                  <li>Click "Save"</li>
                </ol>
                <p style={{ marginTop: '10px', color: '#faad14' }}>
                  <strong>Note:</strong> If you don't see the print window,
                  check if it was blocked by your browser's popup blocker.
                </p>
              </div>
            ),
            width: 500,
            okText: 'Got it'
          })
        }, 500)
      }

      // Close the loading message if it exists
      if (loadingMessage) loadingMessage()
    } catch (error) {
      console.error('Detailed PDF Export error:', error)
      message.error('Failed to export detailed job cards to PDF')
    } finally {
      setDetailedExportLoading(false)
    }
  }

  // Handle export to PDF
  const handleExportPDF = async (excludeDispatched = false) => {
    try {
      setExportLoading(true)

      // Show specific loading message
      const loadingMessage = message.loading({
        content: '📄 Fetching job cards for PDF export...',
        duration: 0 // Don't auto dismiss
      })

      // Fetch ALL job cards (without pagination)
      const allJobCardsResult = await dispatch(
        getJobCardsWithDetails({
          page: 1,
          limit: 10000, // Large number to get all job cards
          search: searchTerm,
          status: selectedStatus === 'all' ? null : selectedStatus
        })
      ).unwrap()

      // Get production plans with quantity tracking to enhance job cards
      const plansResult = await dispatch(
        getProductionPlansWithQuantities({
          page: 1,
          limit: 10000
        })
      ).unwrap()

      // Create a map of production plans for quick lookup
      const plansMap = {}
      if (plansResult?.productionPlans) {
        plansResult.productionPlans.forEach(plan => {
          plansMap[plan.id] = plan
        })
      }

      // Enhance all job cards with proper field mapping
      let allJobCards = (allJobCardsResult.jobCards || []).map((jc, index) => {
        const plan = plansMap[jc.prodplanid || jc.prodPlanId] || {}
        const tracking = plan.quantityTracking || {}
        const stepInfo = getStepInfo(jc, jc.prodStep)
        const totalSteps = getTotalSteps(jc)
        const progress =
          totalSteps > 0 ? Math.round((jc.prodStep / totalSteps) * 100) : 0

        return {
          ...jc,
          // Fix field name mapping
          id: jc.jobcardid || jc.id,
          prodPlanId: jc.prodplanid || jc.prodPlanId,
          alloyName:
            jc.sourceproductname ||
            jc.alloyName ||
            plan.alloyName ||
            'Unknown Alloy',
          convertName:
            jc.targetproductname ||
            jc.convertName ||
            plan.convertName ||
            'Unknown Conversion',
          isUrgent: Boolean(jc.urgent) || jc.isUrgent || Boolean(plan.urgent),
          createdBy:
            jc.createdbyfirstname && jc.createdbylastname
              ? `${jc.createdbyfirstname} ${jc.createdbylastname}`
              : jc.createdBy || 'Unknown',
          planTotalQuantity: plan.quantity || 0,
          planAllocatedQuantity: tracking.totalJobCardQuantity || 0,
          planRemainingQuantity: tracking.remainingQuantity || 0,
          planCompletedQuantity: tracking.completedQuantity || 0,
          allocationPercentage:
            plan.quantity > 0
              ? Math.round((jc.quantity / plan.quantity) * 100)
              : 0,
          // Additional fields for PDF
          currentStepName: stepInfo?.name || 'Unknown',
          totalSteps: totalSteps,
          progressPercentage: progress,
          status: jc.prodStep >= totalSteps ? 'Completed' : 'In Progress'
        }
      })

      // Filter out dispatched job cards if requested
      if (excludeDispatched) {
        allJobCards = allJobCards.filter(jc => {
          const stepInfo = getStepInfo(jc, jc.prodStep)
          const totalSteps = getTotalSteps(jc)
          const isDispatched =
            jc.prodStep >= totalSteps &&
            stepInfo?.name?.toLowerCase().includes('dispatch')
          return !isDispatched
        })
      }

      loadingMessage()

      if (allJobCards.length === 0) {
        message.warning('No job cards found for export')
        return
      }

      // Group job cards by status for better organization
      const groupedByStatus = allJobCards.reduce((groups, jc) => {
        const status = jc.status
        if (!groups[status]) {
          groups[status] = []
        }
        groups[status].push(jc)
        return groups
      }, {})

      // Create HTML content for PDF with proper tables
      const reportTitle = excludeDispatched
        ? 'Non-Dispatched Job Cards Report'
        : 'All Job Cards Report'
      let htmlContent = `
        <html>
          <head>
            <title>${reportTitle} - ${moment().format('DD MMM YYYY')}</title>
            <style>
              @page {
                size: A4;
                margin: 10mm;
                orientation: portrait;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 16px;
                margin: 0;
                padding: 8px;
                color: #000;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
              }
              h1 {
                text-align: center;
                margin-bottom: 12px;
                font-size: 20px;
                color: #333;
                font-weight: bold;
              }
              .summary-section {
                margin-bottom: 20px;
                padding: 10px;
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 6px;
              }
              .status-section {
                margin-bottom: 25px;
                page-break-inside: avoid;
              }
              .status-title {
                font-weight: bold;
                font-size: 18px;
                margin-bottom: 8px;
                text-align: center;
                background-color: #e9ecef;
                padding: 6px;
                border: 1px solid #ddd;
                border-radius: 6px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 12px;
                font-size: 12px;
                table-layout: fixed;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 4px 6px;
                text-align: left;
                word-wrap: break-word;
              }
              th {
                background-color: #f8f9fa;
                font-weight: bold;
                color: #333;
                font-size: 11px;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .id-col { width: 8%; }
              .date-col { width: 10%; }
              .source-col { width: 15%; }
              .target-col { width: 15%; }
              .quantity-col { width: 8%; text-align: center; }
              .step-col { width: 12%; }
              .progress-col { width: 8%; text-align: center; }
              .priority-col { width: 8%; text-align: center; }
              .createdby-col { width: 12%; }
              .urgent-tag { color: #ff4d4f; font-weight: bold; }
              .normal-tag { color: #52c41a; font-weight: bold; }
              .no-entries {
                text-align: center;
                font-style: italic;
                color: #666;
                padding: 8px;
              }
              @media print {
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body {
                  font-size: 10px !important;
                  line-height: 1.2 !important;
                }
                h1 {
                  font-size: 16px !important;
                  margin-bottom: 8px !important;
                }
                th, td {
                  padding: 2px 4px !important;
                  font-size: 9px !important;
                }
                .status-section {
                  margin-bottom: 15px !important;
                }
                .status-title {
                  font-size: 14px !important;
                  padding: 4px !important;
                }
              }
            </style>
          </head>
          <body>
            <h1>${reportTitle} - ${moment().format('DD MMM YYYY HH:mm')}</h1>

            <div class="summary-section">
              <strong>Total Job Cards: ${allJobCards.length}</strong> |
              <strong>Completed: ${
                (groupedByStatus['Completed'] || []).length
              }</strong> |
              <strong>In Progress: ${
                (groupedByStatus['In Progress'] || []).length
              }</strong> |
              <strong>Urgent: ${
                allJobCards.filter(jc => jc.isUrgent).length
              }</strong>
            </div>
      `

      Object.keys(groupedByStatus).forEach(status => {
        htmlContent += `
              <div class="status-section">
                <div class="status-title">${status} (${groupedByStatus[status].length})</div>
                <table>
                  <thead>
                    <tr>
                      <th class="id-col">ID</th>
                      <th class="date-col">Date</th>
                      <th class="source-col">Source Product</th>
                      <th class="target-col">Target Product</th>
                      <th class="quantity-col">Qty</th>
                      <th class="step-col">Current Step</th>
                      <th class="progress-col">Progress</th>
                      <th class="priority-col">Priority</th>
                      <th class="createdby-col">Created By</th>
                    </tr>
                  </thead>
                  <tbody>
        `

        if (groupedByStatus[status].length === 0) {
          htmlContent += `
                    <tr>
                      <td colspan="9" class="no-entries">No entries found</td>
                    </tr>
          `
        } else {
          // Sort by job card ID in descending order
          const sortedJobCards = [...groupedByStatus[status]].sort(
            (a, b) => b.id - a.id
          )
          sortedJobCards.forEach(jc => {
            const createdDate = jc.createdAt
              ? moment(jc.createdAt).format('DD/MM/YYYY')
              : 'N/A'
            const priorityClass = jc.isUrgent ? 'urgent-tag' : 'normal-tag'
            const priorityText = jc.isUrgent ? 'Urgent' : 'Normal'

            htmlContent += `
                      <tr>
                        <td>${jc.id}</td>
                        <td>${createdDate}</td>
                        <td>${jc.alloyName}</td>
                        <td>${jc.convertName}</td>
                        <td style="text-align: center;">${jc.quantity}</td>
                        <td>${jc.currentStepName}</td>
                        <td style="text-align: center;">${jc.progressPercentage}%</td>
                        <td style="text-align: center;" class="${priorityClass}">${priorityText}</td>
                        <td>${jc.createdBy}</td>
                      </tr>
            `
          })
        }

        htmlContent += `
                  </tbody>
                </table>
              </div>
        `
      })

      htmlContent += `
          </body>
        </html>
      `

      // Create a temporary window to print the content
      console.log('🖨️ Opening print window...')
      const printWindow = window.open('', '_blank', 'width=800,height=600')

      if (!printWindow) {
        loadingMessage()
        // Popup was blocked - offer alternative
        Modal.error({
          title: '❌ Popup Blocked',
          content: (
            <div>
              <p>The browser blocked the popup window needed for PDF export.</p>
              <p>
                <strong>To fix this:</strong>
              </p>
              <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li>Allow popups for this site in your browser settings</li>
                <li>Click the PDF export button again</li>
              </ol>
              <p style={{ marginTop: '10px', color: '#1890ff' }}>
                <strong>Tip:</strong> Look for a popup blocker icon in your
                browser's address bar and click "Always allow popups".
              </p>
            </div>
          ),
          width: 500
        })
        return
      }

      console.log('🖨️ Writing HTML content to print window...')
      printWindow.document.write(htmlContent)
      printWindow.document.title = `${reportTitle} - ${moment().format(
        'DD MMM YYYY'
      )}`
      printWindow.document.close()

      // Wait for the content to load, then trigger print
      printWindow.onload = () => {
        console.log('🖨️ Print window loaded, triggering print dialog...')
        setTimeout(() => {
          printWindow.print()

          // Show helpful instructions
          Modal.info({
            title: '📄 PDF Export Instructions',
            content: (
              <div>
                <p>
                  <strong>
                    A print dialog has been opened in a new window.
                  </strong>
                </p>
                <p>To save as PDF:</p>
                <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
                  <li>
                    <strong>Windows/Linux:</strong> Select "Save as PDF" or
                    "Microsoft Print to PDF" as the printer
                  </li>
                  <li>
                    <strong>Mac:</strong> Click "PDF" button in bottom-left,
                    then select "Save as PDF"
                  </li>
                  <li>Choose your save location</li>
                  <li>Click "Save"</li>
                </ol>
                <p style={{ marginTop: '10px', color: '#faad14' }}>
                  <strong>Note:</strong> If you don't see the print window,
                  check if it was blocked by your browser's popup blocker.
                </p>
              </div>
            ),
            width: 500,
            okText: 'Got it'
          })
        }, 500)
      }

      console.log('🖨️ Print window setup complete')
      loadingMessage()
    } catch (error) {
      console.error('PDF Export error:', error)
      message.error('Failed to export job cards to PDF')
    } finally {
      setExportLoading(false)
    }
  }

  // Export menu items
  const exportMenuItems = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Export All Job Cards to Excel',
      onClick: () => handleExport('excel', false),
      disabled: exportLoading || detailedExportLoading
    },
    {
      key: 'csv',
      icon: <DownloadOutlined />,
      label: 'Export All Job Cards to CSV',
      onClick: () => handleExport('csv', false),
      disabled: exportLoading || detailedExportLoading
    },
    {
      key: 'pdf',
      icon: exportLoading ? <FilePdfOutlined spin /> : <FilePdfOutlined />,
      label: exportLoading
        ? 'Exporting to PDF...'
        : 'Export All Job Cards to PDF',
      onClick: () => handleExportPDF(false),
      disabled: exportLoading || detailedExportLoading
    },
    {
      key: 'detailed_pdf',
      icon: detailedExportLoading ? (
        <FilePdfOutlined spin />
      ) : (
        <FilePdfOutlined />
      ),
      label: detailedExportLoading
        ? 'Creating Detailed PDF...'
        : 'Export All Job Cards to Detailed PDF',
      onClick: () => handleExportDetailedPDF(false),
      disabled: exportLoading || detailedExportLoading
    },
    { type: 'divider' },
    {
      key: 'excel_non_dispatched',
      icon: <FileExcelOutlined />,
      label: 'Export Non-Dispatched Job Cards to Excel',
      onClick: () => handleExport('excel', true),
      disabled: exportLoading || detailedExportLoading
    },
    {
      key: 'csv_non_dispatched',
      icon: <DownloadOutlined />,
      label: 'Export Non-Dispatched Job Cards to CSV',
      onClick: () => handleExport('csv', true),
      disabled: exportLoading || detailedExportLoading
    },
    {
      key: 'pdf_non_dispatched',
      icon: exportLoading ? <FilePdfOutlined spin /> : <FilePdfOutlined />,
      label: exportLoading
        ? 'Exporting Non-Dispatched to PDF...'
        : 'Export Non-Dispatched Job Cards to PDF',
      onClick: () => handleExportPDF(true),
      disabled: exportLoading || detailedExportLoading
    },
    {
      key: 'detailed_pdf_non_dispatched',
      icon: detailedExportLoading ? (
        <FilePdfOutlined spin />
      ) : (
        <FilePdfOutlined />
      ),
      label: detailedExportLoading
        ? 'Creating Non-Dispatched Detailed PDF...'
        : 'Export Non-Dispatched Job Cards to Detailed PDF',
      onClick: () => handleExportDetailedPDF(true),
      disabled: exportLoading || detailedExportLoading
    },
    { type: 'divider' },
    {
      key: 'custom_export',
      icon: <FilterOutlined />,
      label: '🎯 Custom Export (Filter Options)',
      onClick: () => setExportFilterModalVisible(true),
      disabled: exportLoading || detailedExportLoading
    },
    { type: 'divider' },
    {
      key: 'export_selected',
      icon: detailedExportLoading ? (
        <FilePdfOutlined spin />
      ) : (
        <FilePdfOutlined />
      ),
      label:
        selectedJobCardIds.length > 0
          ? `📋 Export Selected (${selectedJobCardIds.length}) to Detailed PDF`
          : '📋 Export Selected to Detailed PDF',
      onClick: () => handleExportSelectedJobCards(),
      disabled:
        exportLoading ||
        detailedExportLoading ||
        selectedJobCardIds.length === 0
    }
  ]

  // Handle search
  const handleSearch = value => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedStep('all')
    setSelectedStatus('all')
    setSelectedPriority('all')
    setDateRange(null)
    setCurrentPage(1)
  }

  // Handle job card actions
  const handleViewDetails = jobCard => {
    setSelectedJobCard(jobCard)
    setDetailsModalVisible(true)
  }

  const handleMoveToNextStep = async jobCard => {
    try {
      // Load step progress data for this job card
      setStepProgressLoading(true)
      const jobCardId = jobCard.id || jobCard.jobCardId
      let result = await dispatch(getJobCardStepProgress(jobCardId)).unwrap()
      let stepProgress = result.data || result.stepProgress || []

      // If no step progress exists, initialize it
      if (!stepProgress || stepProgress.length === 0) {
        try {
          await dispatch(initializeJobCardSteps(jobCardId)).unwrap()
          // Reload step progress after initialization
          result = await dispatch(getJobCardStepProgress(jobCardId)).unwrap()
          stepProgress = result.data || result.stepProgress || []
        } catch (initError) {
          notification.error({
            message: 'Initialization Failed',
            description:
              initError.message ||
              'Failed to initialize step tracking for this job card'
          })
          return
        }
      }

      // Find current step progress
      const currentStepProgress = stepProgress.find(
        s => s.stepOrder === jobCard.prodStep && s.status !== 'completed'
      )

      if (!currentStepProgress) {
        notification.warning({
          message: 'No Step Progress Data',
          description:
            'Unable to find current step progress. Please view job card details for more information.'
        })
        return
      }

      // Set step progress data and open modal
      setStepProgressData(stepProgress)
      setSelectedStepProgress(currentStepProgress)
      setSelectedJobCard(jobCard)
      setStepProgressModalVisible(true)
    } catch (error) {
      notification.error({
        message: 'Failed to Load Step Data',
        description: error.message || 'Could not load step progress information'
      })
    } finally {
      setStepProgressLoading(false)
    }
  }

  // Handle step progress submission
  const handleSubmitStepProgress = async progressData => {
    try {
      setStepProgressLoading(true)
      await dispatch(processStepProgress(progressData)).unwrap()

      notification.success({
        message: 'Step Processed',
        description: 'Quality data recorded successfully'
      })

      setStepProgressModalVisible(false)
      setSelectedStepProgress(null)
      setSelectedJobCard(null)

      // Reload job cards
      loadJobCards()
    } catch (error) {
      notification.error({
        message: 'Processing Failed',
        description: error.message || 'Failed to process step'
      })
    } finally {
      setStepProgressLoading(false)
    }
  }

  // Handle select all checkbox
  const handleSelectAll = e => {
    if (e.target.checked) {
      const allIds = jobCards.map(jc => jc.jobCardId || jc.id)
      setSelectedJobCardIds(allIds)
    } else {
      setSelectedJobCardIds([])
    }
  }

  // Handle individual checkbox
  const handleSelectJobCard = jobCardId => {
    setSelectedJobCardIds(prev => {
      if (prev.includes(jobCardId)) {
        return prev.filter(id => id !== jobCardId)
      } else {
        return [...prev, jobCardId]
      }
    })
  }

  // Enhanced table columns with modern design
  const columns = [
    {
      title: (
        <input
          type='checkbox'
          checked={
            selectedJobCardIds.length === jobCards.length && jobCards.length > 0
          }
          indeterminate={
            selectedJobCardIds.length > 0 &&
            selectedJobCardIds.length < jobCards.length
          }
          onChange={handleSelectAll}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
      ),
      key: 'select',
      width: 50,
      fixed: 'left',
      render: (_, record) => (
        <input
          type='checkbox'
          checked={selectedJobCardIds.includes(record.jobCardId || record.id)}
          onChange={() => handleSelectJobCard(record.jobCardId || record.id)}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
      )
    },
    {
      title: 'Job Card',
      key: 'jobCard',
      width: 360,
      fixed: 'left',
      render: (_, record) => (
        <div style={{ padding: '8px 4px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: record.isUrgent ? '#e53e3e' : '#4a90ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {record.jobCardId}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 14, fontFamily: "'Inter', sans-serif" }}>Job Card #{record.jobCardId}</span>
              <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#dbeafe', color: '#4a90ff' }}>Plan #{record.prodPlanId}</span>
              {record.isUrgent && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#fef2f2', color: '#e53e3e' }}><FireOutlined /> URGENT</span>}
            </div>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{record.sourceProductName}</span>
              <span style={{ margin: '0 6px', color: '#9ca3af' }}>→</span>
              <span style={{ fontWeight: 500 }}>{record.targetProductName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#9ca3af' }}>
              <span><TeamOutlined style={{ marginRight: 4 }} />{record.createdBy}</span>
              <span><CalendarOutlined style={{ marginRight: 4 }} />{moment(record.createdAt).format('MMM DD')}</span>
              {record.presetName && <Tooltip title={record.presetName}><span style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: 6, fontSize: 10, background: '#dbeafe', color: '#4a90ff' }}><SettingOutlined style={{ marginRight: 3 }} />Preset</span></Tooltip>}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 320,
      render: (_, record) => {
        const totalSteps = getTotalSteps(record)
        const stepInfo = getStepInfo(record, record.prodStep)
        const overallProgress = Math.round((record.prodStep / totalSteps) * 100)
        const isCompleted = record.prodStep >= totalSteps

        return (
          <div style={{ padding: '4px 0' }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 13, color: isCompleted ? '#15803d' : '#1a1a1a', fontFamily: "'Inter', sans-serif" }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: isCompleted ? '#4ecb71' : record.prodStep > 1 ? '#4a90ff' : '#f26c2d', display: 'inline-block', marginRight: 6 }} />
                  {stepInfo.name}
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Step {record.prodStep}/{totalSteps}</span>
              </div>
              <div style={{ width: '100%', height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${overallProgress}%`, background: `linear-gradient(90deg, #4a90ff, ${overallProgress >= 100 ? '#4ecb71' : '#87d068'})`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{overallProgress}%</div>
            </div>

            {/* Mini step indicators */}
            <div className='flex items-center gap-1'>
              {(() => {
                // Get the appropriate steps based on the job card's preset or standard
                const steps = getJobCardSteps(record)
                const stepsToShow =
                  record.presetName && record.stepAssignmentMode === 'preset'
                    ? steps
                    : PRODUCTION_STEPS.slice(0, 11)

                return stepsToShow.map((step, idx) => {
                  const stepNum = idx + 1
                  const isPast = stepNum < record.prodStep
                  const isCurrent = stepNum === record.prodStep
                  const isFuture = stepNum > record.prodStep
                  const stepName = step.stepName || step.name

                  return (
                    <Tooltip
                      key={step.id || step.stepId || idx}
                      title={`${stepName} ${
                        isPast ? '✓' : isCurrent ? '(Current)' : ''
                      }`}
                    >
                      <div
                        className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer
                          transition-all duration-300 hover:scale-110
                          ${
                            isPast
                              ? 'bg-green-500 text-white'
                              : isCurrent
                              ? 'bg-blue-500 text-white animate-pulse'
                              : 'bg-gray-200 text-gray-400'
                          }
                        `}
                      >
                        {isPast ? '✓' : stepNum}
                      </div>
                    </Tooltip>
                  )
                })
              })()}
            </div>
          </div>
        )
      }
    },
    {
      title: 'Quantities',
      key: 'quantities',
      width: 200,
      render: (_, record) => (
        <div style={{ padding: '4px 0', fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#6b7280' }}>Total:</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{record.quantity?.toLocaleString()}</span>
          </div>
          {(record.acceptedQuantity > 0 || record.rejectedQuantity > 0) && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ color: '#6b7280' }}>Accepted:</span>
                <span style={{ color: '#15803d', fontWeight: 500 }}>{record.acceptedQuantity?.toLocaleString() || 0}</span>
              </div>
              {record.rejectedQuantity > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: '#6b7280' }}>Rejected:</span>
                  <span style={{ color: '#dc2626', fontWeight: 500 }}>{record.rejectedQuantity?.toLocaleString()}</span>
                </div>
              )}
            </>
          )}
          {record.allocationPercentage > 0 && (
            <Tooltip title={`${record.allocationPercentage}% of plan`}>
              <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, marginTop: 6 }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${record.allocationPercentage}%`, background: '#4ecb71' }} />
              </div>
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const totalSteps = getTotalSteps(record)
        const isCompleted = record.prodStep >= totalSteps

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tooltip title='View Details'>
              <button onClick={() => handleViewDetails(record)} style={{ background: '#4a90ff', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: 14 }}><EyeOutlined /></button>
            </Tooltip>
            <Tooltip title={isCompleted ? 'Completed' : 'Next Step'}>
              <button onClick={() => handleMoveToNextStep(record)} disabled={isCompleted} style={{ background: isCompleted ? '#f3f3f5' : '#4a90ff', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isCompleted ? 'not-allowed' : 'pointer', color: isCompleted ? '#9ca3af' : 'white', fontSize: 14, opacity: isCompleted ? 0.5 : 1 }}><ArrowRightOutlined /></button>
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  { key: 'edit', icon: <EditOutlined />, label: 'Edit Job Card' },
                  { key: 'export', icon: <ExportOutlined />, label: 'Export Report' },
                  { type: 'divider' },
                  { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true }
                ],
                onClick: ({ key }) => {
                  if (key === 'delete') {
                    confirm({
                      title: 'Delete Job Card',
                      icon: <DeleteOutlined />,
                      content: `Are you sure you want to delete Job Card #${record.jobCardId}?`,
                      okText: 'Yes, Delete', okType: 'danger', cancelText: 'Cancel',
                      onOk: async () => {
                        try { await dispatch(deleteJobCard(record.id)).unwrap(); notification.success({ message: 'Job Card Deleted', description: `Job Card #${record.jobCardId} deleted` }); loadJobCards() }
                        catch (error) { notification.error({ message: 'Delete Failed', description: error.message || 'Failed to delete' }) }
                      }
                    })
                  }
                }
              }}
              trigger={['click']}
            >
              <button style={{ background: 'rgba(26,26,26,0.2)', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1a1a1a', fontSize: 14 }}><MoreOutlined /></button>
            </Dropdown>
          </div>
        )
      }
    }
  ]

  // Card view component
  const JobCardItem = ({ record }) => {
    const totalSteps = getTotalSteps(record)
    const stepInfo = getStepInfo(record, record.prodStep)
    const overallProgress = Math.round((record.prodStep / totalSteps) * 100)
    const isCompleted = record.prodStep >= totalSteps

    return (
      <Card
        hoverable
        className='h-full shadow-md hover:shadow-xl transition-shadow duration-300'
        onClick={() => handleViewDetails(record)}
      >
        <div className='space-y-4'>
          {/* Header */}
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <Avatar
                size={48}
                style={{
                  backgroundColor: record.isUrgent ? '#ff4d4f' : '#1890ff'
                }}
              >
                {record.jobCardId}
              </Avatar>
              <div>
                <Text strong className='text-lg'>
                  Job Card #{record.jobCardId}
                </Text>
                <div className='flex items-center gap-2 mt-1'>
                  {record.isUrgent && (
                    <Tag color='red' icon={<FireOutlined />}>
                      URGENT
                    </Tag>
                  )}
                  {isCompleted && (
                    <Tag color='green' icon={<CheckCircleOutlined />}>
                      COMPLETED
                    </Tag>
                  )}
                </div>
              </div>
            </div>
            <Dropdown
              menu={{
                items: [
                  { key: '1', icon: <EyeOutlined />, label: 'View Details' },
                  {
                    key: '2',
                    icon: <ArrowRightOutlined />,
                    label: 'Next Step',
                    disabled: isCompleted
                  },
                  { type: 'divider' },
                  {
                    key: '3',
                    icon: <DeleteOutlined />,
                    label: 'Delete',
                    danger: true
                  }
                ],
                onClick: ({ key }) => {
                  if (key === '1') {
                    handleViewDetails(record)
                  } else if (key === '2' && !isCompleted) {
                    handleMoveToNextStep(record)
                  } else if (key === '3') {
                    confirm({
                      title: 'Delete Job Card',
                      icon: <DeleteOutlined />,
                      content: `Are you sure you want to delete Job Card #${record.jobCardId}?`,
                      okText: 'Yes, Delete',
                      okType: 'danger',
                      cancelText: 'Cancel',
                      onOk: async () => {
                        try {
                          await dispatch(deleteJobCard(record.id)).unwrap()
                          notification.success({
                            message: 'Job Card Deleted',
                            description: `Job Card #${record.jobCardId} has been deleted successfully`
                          })
                          loadJobCards()
                        } catch (error) {
                          notification.error({
                            message: 'Delete Failed',
                            description:
                              error.message || 'Failed to delete job card'
                          })
                        }
                      }
                    })
                  }
                }
              }}
            >
              <Button icon={<MoreOutlined />} type='text' />
            </Dropdown>
          </div>

          {/* Product Info */}
          <div className='bg-gray-50 rounded-lg p-3'>
            <div className='text-sm text-gray-600 mb-1'>Product Conversion</div>
            <div className='flex items-center gap-2'>
              <Text strong>{record.alloyName}</Text>
              <ArrowRightOutlined className='text-gray-400' />
              <Text strong>{record.convertName}</Text>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <Badge
                status={isCompleted ? 'success' : 'processing'}
                text={<Text className='text-sm'>{stepInfo.name}</Text>}
              />
              <Text className='text-sm text-gray-500'>
                {record.prodStep}/{totalSteps}
              </Text>
            </div>
            <Progress
              percent={overallProgress}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068'
              }}
            />
          </div>

          {/* Quantities */}
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title='Total'
                value={record.quantity}
                valueStyle={{ fontSize: '20px' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title='Accepted'
                value={record.acceptedQuantity || 0}
                valueStyle={{ fontSize: '20px', color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title='Rejected'
                value={record.rejectedQuantity || 0}
                valueStyle={{
                  fontSize: '20px',
                  color: record.rejectedQuantity > 0 ? '#ff4d4f' : '#8c8c8c'
                }}
              />
            </Col>
          </Row>

          {/* Footer */}
          <div className='flex items-center justify-between pt-3 border-t'>
            <div className='flex items-center gap-3 text-xs text-gray-500'>
              <span>
                <TeamOutlined /> {record.createdBy}
              </span>
              <span>
                <CalendarOutlined /> {moment(record.createdAt).format('MMM DD')}
              </span>
            </div>
            <Button
              type='primary'
              size='small'
              icon={<ArrowRightOutlined />}
              onClick={e => {
                e.stopPropagation()
                handleMoveToNextStep(record)
              }}
              disabled={isCompleted}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Staff Wide Test', serif", fontSize: 42, fontWeight: 400, color: '#1a1a1a', margin: '0 0 4px', lineHeight: '30px' }}>Job Card Management</h1>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(26,26,26,0.6)' }}>Track and manage production workflow</div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 8, flexWrap: 'wrap' }}>
            {/* View Toggle */}
            <div style={{ display: 'flex', background: '#f3f3f5', borderRadius: 123, padding: 2 }}>
              <button onClick={() => setViewMode('table')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 123, fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif", border: 'none', cursor: 'pointer', background: viewMode === 'table' ? 'white' : 'transparent', color: viewMode === 'table' ? '#1a1a1a' : '#6b7280', boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}><BarsOutlined /> Table</button>
              <button onClick={() => setViewMode('cards')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 123, fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif", border: 'none', cursor: 'pointer', background: viewMode === 'cards' ? 'white' : 'transparent', color: viewMode === 'cards' ? '#1a1a1a' : '#6b7280', boxShadow: viewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}><AppstoreOutlined /> Cards</button>
            </div>
            <button onClick={loadJobCards} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}><ReloadOutlined spin={loading} style={{ fontSize: 14 }} /> Refresh</button>
            <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#1a1a1a', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer' }}><ExportOutlined style={{ fontSize: 14 }} /> Export</button>
            </Dropdown>
            <button onClick={() => setCreateModalVisible(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}><PlusOutlined style={{ fontSize: 14 }} /> Create Job Card</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
          <KpiCard title="Total Cards" value={statistics.total} icon={<DashboardOutlined />} accentColor="blue" />
          <KpiCard title="In Progress" value={statistics.inProgress} icon={<SyncOutlined />} accentColor="orange" />
          <KpiCard title="Completed" value={statistics.completed} icon={<CheckCircleOutlined />} accentColor="green" subMetric={{ label: 'Rate:', value: `${statistics.completionRate}%` }} />
          <KpiCard title="Urgent" value={statistics.urgent} icon={<FireOutlined />} accentColor="red" />
          <KpiCard title="QA Ready" value={statistics.qaReady} icon={<CheckCircleOutlined />} accentColor="purple" />
          <KpiCard title="Efficiency" value={`${statistics.completionRate}%`} icon={<ThunderboltOutlined />} accentColor="blue" />
        </div>

        {/* Filter Bar */}
        <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, padding: '12px 32px', marginBottom: 16, boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input type="text" placeholder="Search job cards..." onKeyDown={e => e.key === 'Enter' && handleSearch(e.target.value)} style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }} />
            <Select placeholder="Step" value={selectedStep} onChange={v => setSelectedStep(v)} style={{ width: 160, height: 40 }} className="plati-filter-dealer"
              options={[{ value: 'all', label: 'All Steps' }, ...uniqueStepNames.map(s => ({ value: s, label: s }))]} />
            <Select placeholder="Priority" value={selectedPriority} onChange={v => setSelectedPriority(v)} style={{ width: 150, height: 40 }} className="plati-filter-dealer"
              options={[{ value: 'all', label: 'All Priorities' }, { value: 'urgent', label: '🔥 Urgent' }, { value: 'normal', label: 'Normal' }]} />
            <DatePicker.RangePicker value={dateRange} onChange={setDateRange} format="DD MMM YYYY" placeholder={['Start Date', 'End Date']} className="plati-filter-daterange" style={{ height: 40, borderRadius: 123, borderColor: '#a0a0a8', minWidth: 240 }} />
            <button onClick={handleClearFilters} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40, padding: '0 14px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}>Clear</button>
          </div>
        </div>

        {/* Main Content Area */}
        <div>
          {viewMode === 'table' ? (
            <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 1100 }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#f3f3f5', padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14, fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5', width: 50 }}>
                        <input type='checkbox' checked={selectedJobCardIds.length === jobCards.length && jobCards.length > 0} onChange={handleSelectAll} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                      </th>
                      {['Job Card', 'Progress', 'Quantities', 'Actions'].map(h => (
                        <th key={h} style={{ background: '#f3f3f5', padding: '12px 16px', textAlign: h === 'Actions' ? 'center' : 'left', fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14, fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
                    ) : !jobCards || jobCards.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                        <div style={{ color: '#f55e34', fontWeight: 500, marginBottom: 12 }}>No job cards found</div>
                        <button onClick={() => setCreateModalVisible(true)} style={{ background: '#4a90ff', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer' }}>Create First Job Card</button>
                      </td></tr>
                    ) : jobCards.map(record => (
                      <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6', background: record.isUrgent ? '#fef8f8' : 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = record.isUrgent ? '#fef2f2' : '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = record.isUrgent ? '#fef8f8' : 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <input type='checkbox' checked={selectedJobCardIds.includes(record.jobCardId || record.id)} onChange={() => handleSelectJobCard(record.jobCardId || record.id)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>{columns.find(c => c.key === 'jobCard').render(null, record)}</td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>{columns.find(c => c.key === 'progress').render(null, record)}</td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>{columns.find(c => c.key === 'quantities').render(null, record)}</td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>{columns.find(c => c.key === 'actions').render(null, record)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                currentPage={currentPage}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
              />
            </div>
          ) : (
            <div>
              {loading ? (
                <Row gutter={[16, 16]}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                      <Card>
                        <Skeleton active />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : jobCards.length === 0 ? (
                <Card className='text-center py-12'>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description='No job cards found'
                  >
                    <Button
                      type='primary'
                      onClick={() => setCreateModalVisible(true)}
                    >
                      Create First Job Card
                    </Button>
                  </Empty>
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {jobCards.map(jobCard => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={jobCard.id}>
                      <JobCardItem record={jobCard} />
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        <JobCardCreationModal
          visible={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onSuccess={() => {
            setCreateModalVisible(false)
            loadJobCards()
          }}
        />

        {detailsModalVisible && selectedJobCard && (
          <JobCardDetailsModal
            visible={detailsModalVisible}
            onCancel={() => {
              setDetailsModalVisible(false)
              setSelectedJobCard(null)
            }}
            jobCard={selectedJobCard}
            onRefresh={loadJobCards}
          />
        )}

        {/* Step Progress Modal for Quality Data Entry */}
        {selectedStepProgress && selectedJobCard && (
          <StepProgressModal
            visible={stepProgressModalVisible}
            onCancel={() => {
              setStepProgressModalVisible(false)
              setSelectedStepProgress(null)
              setSelectedJobCard(null)
            }}
            onSubmit={handleSubmitStepProgress}
            stepProgress={selectedStepProgress}
            currentStepInfo={{
              name: selectedStepProgress?.stepName || 'Unknown Step',
              order: selectedStepProgress?.stepOrder || 0
            }}
            nextStepInfo={(() => {
              const nextStep = stepProgressData.find(
                s => s.stepOrder === (selectedStepProgress?.stepOrder || 0) + 1
              )
              return nextStep
                ? { name: nextStep.stepName || 'Unknown Step' }
                : null
            })()}
            jobCard={selectedJobCard}
            loading={stepProgressLoading}
          />
        )}

        {/* Export Filter Modal */}
        <Modal
          title='📊 Custom Export Options'
          open={exportFilterModalVisible}
          onCancel={() => setExportFilterModalVisible(false)}
          onOk={() => {
            setExportFilterModalVisible(false)
            // Execute export based on format and filters
            if (exportFilterFormat === 'excel') {
              handleExportWithFilters('excel')
            } else if (exportFilterFormat === 'pdf') {
              handleExportPDFWithFilters()
            } else if (exportFilterFormat === 'detailed_pdf') {
              handleExportDetailedPDFWithFilters()
            }
          }}
          okText='Export'
          cancelText='Cancel'
          width={600}
        >
          <div style={{ marginBottom: 20 }}>
            <Typography.Text strong>Export Format:</Typography.Text>
            <Select
              value={exportFilterFormat}
              onChange={setExportFilterFormat}
              style={{ width: '100%', marginTop: 8 }}
              options={[
                { value: 'excel', label: '📊 Excel Spreadsheet' },
                { value: 'pdf', label: '📄 PDF Report (Summary)' },
                {
                  value: 'detailed_pdf',
                  label: '📑 PDF Report (Detailed with Steps)'
                }
              ]}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <Typography.Text strong>Filter Options:</Typography.Text>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <input
                  type='checkbox'
                  checked={exportFilters.excludeDispatched}
                  onChange={e =>
                    setExportFilters({
                      ...exportFilters,
                      excludeDispatched: e.target.checked
                    })
                  }
                  style={{ marginRight: 8, width: 16, height: 16 }}
                />
                <span>🚚 Exclude Dispatched Job Cards</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <input
                  type='checkbox'
                  checked={exportFilters.excludeCompleted}
                  onChange={e =>
                    setExportFilters({
                      ...exportFilters,
                      excludeCompleted: e.target.checked
                    })
                  }
                  style={{ marginRight: 8, width: 16, height: 16 }}
                />
                <span>✅ Exclude Completed Job Cards (100% progress)</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <input
                  type='checkbox'
                  checked={exportFilters.includeOnlyWithRejected}
                  onChange={e =>
                    setExportFilters({
                      ...exportFilters,
                      includeOnlyWithRejected: e.target.checked
                    })
                  }
                  style={{ marginRight: 8, width: 16, height: 16 }}
                />
                <span>❌ Include ONLY Job Cards with Rejected Quantities</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <input
                  type='checkbox'
                  checked={exportFilters.includeOnlyWithPending}
                  onChange={e =>
                    setExportFilters({
                      ...exportFilters,
                      includeOnlyWithPending: e.target.checked
                    })
                  }
                  style={{ marginRight: 8, width: 16, height: 16 }}
                />
                <span>⏳ Include ONLY Job Cards with Pending Quantities</span>
              </label>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: '#f0f7ff',
              borderRadius: 4,
              border: '1px solid #91d5ff'
            }}
          >
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} />
              <strong>Note:</strong> If you select "Include ONLY with Rejected"
              or "Include ONLY with Pending", only job cards that have rejected
              or pending quantities in their step progress will be exported.
              This is useful for quality control and identifying problematic job
              cards.
            </Typography.Text>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default JobCardListing
