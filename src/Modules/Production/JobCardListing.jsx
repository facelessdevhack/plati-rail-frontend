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
  FileExcelOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'

import Layout from '../Layout/layout'
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
  deleteJobCard
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
  const [stepProgressModalVisible, setStepProgressModalVisible] = useState(false)
  const [selectedStepProgress, setSelectedStepProgress] = useState(null)
  const [stepProgressData, setStepProgressData] = useState([])
  const [stepProgressLoading, setStepProgressLoading] = useState(false)

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
          presetId:
            jc.presetid ||
            jc.presetId ||
            jc.preset_id ||
            null,
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
            console.warn(`Failed to load preset ${presetName} (${presetId}):`, error)
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
      const loadingMessage = message.loading('Fetching all job cards for export...')

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
          alloyName: jc.sourceproductname || jc.alloyName || plan.alloyName || 'Unknown Alloy',
          convertName: jc.targetproductname || jc.convertName || plan.convertName || 'Unknown Conversion',
          isUrgent: Boolean(jc.urgent) || jc.isUrgent || Boolean(plan.urgent),
          createdBy: jc.createdbyfirstname && jc.createdbylastname
            ? `${jc.createdbyfirstname} ${jc.createdbylastname}`
            : jc.createdBy || 'Unknown',
          planTotalQuantity: plan.quantity || 0,
          planAllocatedQuantity: tracking.totalJobCardQuantity || 0,
          planRemainingQuantity: tracking.remainingQuantity || 0,
          planCompletedQuantity: tracking.completedQuantity || 0,
          allocationPercentage: plan.quantity > 0 ? Math.round((jc.quantity / plan.quantity) * 100) : 0
        }
      })

      // Filter out dispatched job cards if requested
      if (excludeDispatched) {
        allJobCards = allJobCards.filter(jc => {
          const stepInfo = getStepInfo(jc, jc.prodStep)
          const totalSteps = getTotalSteps(jc)
          const isDispatched = jc.prodStep >= totalSteps && stepInfo?.name?.toLowerCase().includes('dispatch')
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
          'Date': jc.createdAt ? moment(jc.createdAt).format('YYYY-MM-DD HH:mm') : '',
          'Source Product': jc.sourceProductName || jc.alloyName || '',
          'Target Product': jc.targetProductName || jc.convertName || '',
          'Quantity': jc.quantity || 0,
          'Current Step': stepInfo?.name || 'Unknown',
          'Step Progress': `${jc.prodStep}/${totalSteps}`,
          'Progress %': `${progress}%`,
          'Priority': jc.isUrgent ? 'Urgent' : 'Normal',
          'Created By': jc.createdBy || 'Unknown',
          'Preset': jc.presetName || 'Standard',
          'Status': jc.prodStep >= totalSteps ? 'Completed' : 'In Progress'
        }
      })

      if (format === 'csv') {
        // CSV Export
        const headers = Object.keys(exportData[0])
        const csvContent = [
          headers.join(','),
          ...exportData.map(row =>
            headers.map(header => {
              const value = row[header]
              // Escape commas and quotes in values
              return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                ? `"${value.replace(/"/g, '""')}"`
                : value
            }).join(',')
          )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `job_cards_${excludeDispatched ? 'non_dispatched_' : ''}${moment().format('YYYY-MM-DD')}.csv`
        link.click()
        message.success(`${allJobCards.length} job cards exported to CSV successfully`)
      } else {
        // Excel Export - using simple HTML table method
        const tableHTML = `
          <table>
            <thead>
              <tr>
                ${Object.keys(exportData[0]).map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${exportData.map(row => `
                <tr>
                  ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `

        const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `job_cards_${excludeDispatched ? 'non_dispatched_' : ''}${moment().format('YYYY-MM-DD')}.xls`
        link.click()
        message.success(`${allJobCards.length} job cards exported to Excel successfully`)
      }
    } catch (error) {
      console.error('Export error:', error)
      message.error('Failed to export data')
    }
  }

  // Export menu items
  const exportMenuItems = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Export All Job Cards to Excel',
      onClick: () => handleExport('excel', false)
    },
    {
      key: 'csv',
      icon: <DownloadOutlined />,
      label: 'Export All Job Cards to CSV',
      onClick: () => handleExport('csv', false)
    },
    { type: 'divider' },
    {
      key: 'excel_non_dispatched',
      icon: <FileExcelOutlined />,
      label: 'Export Non-Dispatched Job Cards to Excel',
      onClick: () => handleExport('excel', true)
    },
    {
      key: 'csv_non_dispatched',
      icon: <DownloadOutlined />,
      label: 'Export Non-Dispatched Job Cards to CSV',
      onClick: () => handleExport('csv', true)
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

  const handleMoveToNextStep = async (jobCard) => {
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
            description: initError.message || 'Failed to initialize step tracking for this job card'
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
          description: 'Unable to find current step progress. Please view job card details for more information.'
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
  const handleSubmitStepProgress = async (progressData) => {
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

  // Enhanced table columns with modern design
  const columns = [
    {
      title: (
        <div className='flex items-center gap-2'>
          <DashboardOutlined />
          <span>Job Card</span>
        </div>
      ),
      key: 'jobCard',
      width: 360,
      fixed: 'left',
      render: (_, record) => (
        <div className='py-3 px-2'>
          <div className='flex items-start gap-3'>
            {/* Visual indicator */}
            <div className='mt-1'>
              <Avatar
                size={40}
                style={{
                  backgroundColor: record.isUrgent ? '#ff4d4f' : '#1890ff',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                {record.jobCardId}
              </Avatar>
            </div>

            {/* Card info */}
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <Text className='font-semibold text-base'>
                  Job Card #{record.jobCardId}
                </Text>
                <Tag color='geekblue'>Plan #{record.prodPlanId}</Tag>
                {record.isUrgent && (
                  <Tag color='red' icon={<FireOutlined />}>
                    URGENT
                  </Tag>
                )}
              </div>
              {console.log(record, 'RECORD')}
              <div className='text-sm text-gray-600 mb-2'>
                <span className='font-medium'>{record.sourceProductName}</span>
                <ArrowRightOutlined className='mx-2 text-xs' />
                <span className='font-medium'>{record.targetProductName}</span>
              </div>

              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-1'>
                  <TeamOutlined className='text-gray-400' />
                  <Text className='text-xs text-gray-500'>
                    {record.createdBy}
                  </Text>
                </div>
                <div className='flex items-center gap-1'>
                  <CalendarOutlined className='text-gray-400' />
                  <Text className='text-xs text-gray-500'>
                    {moment(record.createdAt).format('MMM DD')}
                  </Text>
                </div>
                {record.presetName && (
                  <Tooltip title={record.presetName}>
                    <Tag color='blue' className='text-xs'>
                      <SettingOutlined /> Preset
                    </Tag>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: (
        <div className='flex items-center gap-2'>
          <ThunderboltOutlined />
          <span>Progress</span>
        </div>
      ),
      key: 'progress',
      width: 320,
      render: (_, record) => {
        const totalSteps = getTotalSteps(record)
        const stepInfo = getStepInfo(record, record.prodStep)
        const overallProgress = Math.round((record.prodStep / totalSteps) * 100)
        const isCompleted = record.prodStep >= totalSteps

        return (
          <div className='py-2'>
            <div className='mb-3'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <Badge
                    status={
                      isCompleted
                        ? 'success'
                        : record.prodStep > 1
                        ? 'processing'
                        : 'warning'
                    }
                    text={
                      <Text
                        strong
                        className={isCompleted ? 'text-green-600' : ''}
                      >
                        {stepInfo.name}
                      </Text>
                    }
                  />
                </div>
                <Text className='text-sm text-gray-500'>
                  Step {record.prodStep}/{totalSteps}
                </Text>
              </div>

              <Progress
                percent={overallProgress}
                size='small'
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068'
                }}
                format={percent => (
                  <span className='text-xs font-medium'>{percent}%</span>
                )}
              />
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
      title: (
        <div className='flex items-center gap-2'>
          <InfoCircleOutlined />
          <span>Quantities</span>
        </div>
      ),
      key: 'quantities',
      width: 200,
      render: (_, record) => (
        <div className='py-2'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Text className='text-gray-500'>Total:</Text>
              <Text strong className='text-lg'>
                {record.quantity?.toLocaleString()}
              </Text>
            </div>

            {(record.acceptedQuantity > 0 || record.rejectedQuantity > 0) && (
              <>
                <div className='flex items-center justify-between'>
                  <Text className='text-gray-500'>Accepted:</Text>
                  <Text className='text-green-600'>
                    {record.acceptedQuantity?.toLocaleString() || 0}
                  </Text>
                </div>
                {record.rejectedQuantity > 0 && (
                  <div className='flex items-center justify-between'>
                    <Text className='text-gray-500'>Rejected:</Text>
                    <Text className='text-red-600'>
                      {record.rejectedQuantity?.toLocaleString()}
                    </Text>
                  </div>
                )}
              </>
            )}

            {record.allocationPercentage > 0 && (
              <Tooltip
                title={`This job card represents ${record.allocationPercentage}% of the production plan`}
              >
                <Progress
                  percent={record.allocationPercentage}
                  size='small'
                  showInfo={false}
                  strokeColor='#52c41a'
                />
              </Tooltip>
            )}
          </div>
        </div>
      )
    },
    {
      title: (
        <div className='flex items-center gap-2'>
          <ToolOutlined />
          <span>Actions</span>
        </div>
      ),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const totalSteps = getTotalSteps(record)
        const isCompleted = record.prodStep >= totalSteps

        return (
          <div className='flex items-center gap-2'>
            <Tooltip title='View Details'>
              <Button
                type='default'
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
                shape='circle'
              />
            </Tooltip>

            <Tooltip title={isCompleted ? 'Completed' : 'Move to Next Step'}>
              <Button
                type='primary'
                icon={<ArrowRightOutlined />}
                onClick={() => handleMoveToNextStep(record)}
                disabled={isCompleted}
                shape='circle'
                className={
                  !isCompleted
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-0'
                    : ''
                }
              />
            </Tooltip>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'edit',
                    icon: <EditOutlined />,
                    label: 'Edit Job Card'
                  },
                  {
                    key: 'export',
                    icon: <ExportOutlined />,
                    label: 'Export Report'
                  },
                  { type: 'divider' },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: 'Delete',
                    danger: true
                  }
                ],
                onClick: ({ key }) => {
                  if (key === 'delete') {
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
                            description: error.message || 'Failed to delete job card'
                          })
                        }
                      }
                    })
                  }
                }
              }}
              trigger={['click']}
            >
              <Button icon={<MoreOutlined />} shape='circle' />
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
                            description: error.message || 'Failed to delete job card'
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
    <Layout>
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
        {/* Modern Header */}
        <div className='bg-white shadow-sm border-b'>
          <div className='px-6 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg'>
                  <RocketOutlined className='text-white text-2xl' />
                </div>
                <div>
                  <Title level={3} className='mb-0'>
                    Job Card Management
                  </Title>
                  <Text className='text-gray-600'>
                    Track and manage production workflow efficiently
                  </Text>
                </div>
              </div>

              <Space size='middle'>
                <Segmented
                  options={[
                    { label: <BarsOutlined />, value: 'table' },
                    { label: <AppstoreOutlined />, value: 'cards' }
                  ]}
                  value={viewMode}
                  onChange={setViewMode}
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadJobCards}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Dropdown
                  menu={{ items: exportMenuItems }}
                  trigger={['click']}
                >
                  <Button
                    icon={<DownloadOutlined />}
                  >
                    Export All
                  </Button>
                </Dropdown>
                <Button
                  icon={<PlusOutlined />}
                  type='primary'
                  size='large'
                  onClick={() => setCreateModalVisible(true)}
                  className='bg-gradient-to-r from-blue-500 to-purple-500 border-0'
                >
                  Create Job Card
                </Button>
              </Space>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='px-6 py-6'>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Card className='border-0 shadow-md hover:shadow-lg transition-shadow'>
                <Statistic
                  title={
                    <span className='text-gray-600 flex items-center gap-2'>
                      <DashboardOutlined />
                      Total Cards
                    </span>
                  }
                  value={statistics.total}
                  valueStyle={{ color: '#1890ff', fontSize: '28px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Card className='border-0 shadow-md hover:shadow-lg transition-shadow'>
                <Statistic
                  title={
                    <span className='text-gray-600 flex items-center gap-2'>
                      <SyncOutlined spin />
                      In Progress
                    </span>
                  }
                  value={statistics.inProgress}
                  valueStyle={{ color: '#faad14', fontSize: '28px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Card className='border-0 shadow-md hover:shadow-lg transition-shadow'>
                <Statistic
                  title={
                    <span className='text-gray-600 flex items-center gap-2'>
                      <CheckCircleOutlined />
                      Completed
                    </span>
                  }
                  value={statistics.completed}
                  valueStyle={{ color: '#52c41a', fontSize: '28px' }}
                  suffix={
                    <span className='text-sm text-gray-500'>
                      ({statistics.completionRate}%)
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Card className='border-0 shadow-md hover:shadow-lg transition-shadow'>
                <Statistic
                  title={
                    <span className='text-gray-600 flex items-center gap-2'>
                      <FireOutlined />
                      Urgent
                    </span>
                  }
                  value={statistics.urgent}
                  valueStyle={{ color: '#ff4d4f', fontSize: '28px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Card className='border-0 shadow-md hover:shadow-lg transition-shadow'>
                <Statistic
                  title={
                    <span className='text-gray-600 flex items-center gap-2'>
                      <CheckCircleOutlined />
                      QA Ready
                    </span>
                  }
                  value={statistics.qaReady}
                  valueStyle={{ color: '#722ed1', fontSize: '28px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Card className='border-0 shadow-md hover:shadow-lg transition-shadow'>
                <div className='text-center'>
                  <div className='text-gray-600 mb-2 flex items-center justify-center gap-2'>
                    <ThunderboltOutlined />
                    <span>Efficiency</span>
                  </div>
                  <Progress
                    type='circle'
                    percent={statistics.completionRate}
                    width={60}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068'
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Enhanced Filters */}
        <div className='px-6 mb-6'>
          <Card className='border-0 shadow-md'>
            <Row gutter={[16, 16]} align='middle'>
              <Col xs={24} md={8} lg={6}>
                <Search
                  placeholder='Search job cards...'
                  allowClear
                  onSearch={handleSearch}
                  size='large'
                  prefix={<SearchOutlined className='text-gray-400' />}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder='Step'
                  value={selectedStep}
                  onChange={value => setSelectedStep(value)}
                  style={{ width: '100%' }}
                  size='large'
                >
                  <Option value='all'>All Steps</Option>
                  {uniqueStepNames.map(stepName => (
                    <Option key={stepName} value={stepName}>
                      {stepName}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder='Priority'
                  value={selectedPriority}
                  onChange={value => setSelectedPriority(value)}
                  style={{ width: '100%' }}
                  size='large'
                >
                  <Option value='all'>All Priorities</Option>
                  <Option value='urgent'>
                    <span className='text-red-500'>🔥 Urgent Only</span>
                  </Option>
                  <Option value='normal'>Normal Only</Option>
                </Select>
              </Col>
              <Col xs={24} md={6}>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%' }}
                  size='large'
                />
              </Col>
              <Col xs={24} md={2}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={handleClearFilters}
                  size='large'
                  block
                  danger
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className='px-6 pb-6'>
          {viewMode === 'table' ? (
            <Card className='border-0 shadow-md'>
              <Table
                columns={columns}
                dataSource={jobCards}
                rowKey='id'
                loading={loading}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalCount,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} job cards`,
                  onChange: (page, size) => {
                    setCurrentPage(page)
                    setPageSize(size)
                  }
                }}
                scroll={{ x: 1200 }}
                rowClassName={record =>
                  record.isUrgent
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'hover:bg-gray-50'
                }
                locale={{
                  emptyText: (
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
                  )
                }}
              />
            </Card>
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
              const nextStep = stepProgressData.find(s => s.stepOrder === (selectedStepProgress?.stepOrder || 0) + 1)
              return nextStep ? { name: nextStep.stepName || 'Unknown Step' } : null
            })()}
            jobCard={selectedJobCard}
            loading={stepProgressLoading}
          />
        )}
      </div>
    </Layout>
  )
}

export default JobCardListing
