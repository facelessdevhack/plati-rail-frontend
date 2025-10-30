import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Progress,
  Timeline,
  Button,
  Space,
  Divider,
  Statistic,
  Alert,
  Tooltip,
  Badge,
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  notification,
  Tabs,
  Descriptions,
  Avatar,
  List,
  Empty,
  Breadcrumb,
  Modal,
  Collapse
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  ArrowRightOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  ReloadOutlined,
  ToolOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  TagOutlined,
  WarningOutlined,
  SettingOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  BranchesOutlined,
  DashboardOutlined,
  HomeOutlined,
  FolderOutlined,
  ProductOutlined,
  BarChartOutlined,
  SettingFilled,
  PlayCircleOutlined,
  PauseCircleOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  FormOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import {
  getJobCardsWithDetails,
  updateJobCardProgress,
  getPresetDetails,
  getJobCardProgress,
  processStepProgress,
  getJobCardStepProgress,
  initializeJobCardSteps
} from '../../redux/api/productionAPI'
import StepProgressModal from './StepProgressModal'
import StepManagementView from './StepManagementView'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs
const { confirm } = Modal

// Default Production Steps Configuration
const DEFAULT_PRODUCTION_STEPS = [
  {
    id: 1,
    name: 'Material Request',
    color: '#722ed1',
    icon: '📦',
    description: 'Request and prepare raw materials'
  },
  {
    id: 2,
    name: 'Painting',
    color: '#eb2f96',
    icon: '🎨',
    description: 'Apply base paint coating'
  },
  {
    id: 3,
    name: 'Machining',
    color: '#faad14',
    icon: '⚙️',
    description: 'Machine processing and shaping'
  },
  {
    id: 4,
    name: 'PVD Powder Coating',
    color: '#fa8c16',
    icon: '🔧',
    description: 'Apply powder coating layer'
  },
  {
    id: 5,
    name: 'PVD Process',
    color: '#a0d911',
    icon: '⚡',
    description: 'Physical vapor deposition process'
  },
  {
    id: 6,
    name: 'Milling',
    color: '#52c41a',
    icon: '🏭',
    description: 'Precision milling operations'
  },
  {
    id: 7,
    name: 'Acrylic Coating',
    color: '#13c2c2',
    icon: '💧',
    description: 'Apply acrylic protective layer'
  },
  {
    id: 8,
    name: 'Lacquer Finish',
    color: '#1890ff',
    icon: '✨',
    description: 'Final lacquer coating'
  },
  {
    id: 9,
    name: 'Packaging',
    color: '#2f54eb',
    icon: '📋',
    description: 'Package for shipment'
  },
  {
    id: 10,
    name: 'Quality Check',
    color: '#f5222d',
    icon: '🔍',
    description: 'Final quality inspection'
  },
  {
    id: 11,
    name: 'Dispatch',
    color: '#389e0d',
    icon: '🚚',
    description: 'Ready for delivery'
  }
]

// Preset Options Configuration
const PRESET_OPTIONS = [
  { name: '14-inch Alloys', displayName: '14-inch Alloy Wheels' },
  { name: '15-inch Alloys', displayName: '15-inch Alloy Wheels' },
  { name: '16-inch Alloys', displayName: '16-inch Alloy Wheels' },
  { name: '17-inch Alloys', displayName: '17-inch Alloy Wheels' },
  { name: '18-inch Alloys', displayName: '18-inch Alloy Wheels' },
  { name: '20-inch Alloys', displayName: '20-inch Alloy Wheels' },
  { name: 'Custom Design', displayName: 'Custom Design Process' }
]

// Shadcn-style components
const ShadcnCard = ({ children, className = '', ...props }) => (
  <div
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
)

const ShadcnButton = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  }

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10'
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const ShadcnBadge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default:
      'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary:
      'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive:
      'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground'
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  )
}

const ShadcnProgress = ({ value, className = '' }) => (
  <div
    className={`relative h-4 w-full overflow-hidden rounded-full bg-secondary ${className}`}
  >
    <div
      className='h-full w-full flex-1 bg-primary transition-all'
      style={{ width: `${value}%` }}
    />
  </div>
)

const ShadcnTabs = ({ activeKey, onChange, items }) => (
  <div className='w-full'>
    <div className='inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground'>
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
            activeKey === item.key
              ? 'bg-background text-foreground shadow-sm'
              : 'transparent'
          }`}
        >
          {item.icon && <span className='mr-2'>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  </div>
)

const JobCardDetailsPage = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.userDetails || {})

  // Local state
  const [loading, setLoading] = useState(false)
  const [jobCard, setJobCard] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [stepHistory, setStepHistory] = useState([])
  const [qaReports, setQaReports] = useState([])
  const [inventoryRequests, setInventoryRequests] = useState([])

  // View state for different sections
  const [activeSection, setActiveSection] = useState('overview')

  // Preset-related state
  const [presetSteps, setPresetSteps] = useState([])
  const [currentPlanStepId, setCurrentPlanStepId] = useState(null)
  const [jobCardProgress, setJobCardProgress] = useState([])
  const [isPresetBased, setIsPresetBased] = useState(false)

  const [form] = Form.useForm()

  // Step-wise quantity tracking state
  const [stepProgressModalVisible, setStepProgressModalVisible] =
    useState(false)
  const [selectedStepProgress, setSelectedStepProgress] = useState(null)
  const [stepProgressData, setStepProgressData] = useState([])
  const [stepProgressLoading, setStepProgressLoading] = useState(false)

  // Load job card data on component mount or when jobId changes
  useEffect(() => {
    if (jobId) {
      loadJobCard()
    }
  }, [jobId])

  // Load step progress data when job card is loaded
  useEffect(() => {
    if (jobCard?.id) {
      loadStepProgressData(jobCard.id)
    }
  }, [jobCard?.id])

  // Handle browser back navigation and cleanup
  useEffect(() => {
    const handlePopState = () => {
      // Refresh data when user navigates back to this page
      if (jobId) {
        loadJobCard()
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Cleanup any pending operations
      setStepProgressLoading(false)
      setSelectedStepProgress(null)
    }
  }, [jobId])

  // Update page title and keyboard shortcuts
  useEffect(() => {
    if (jobCard?.jobCardId) {
      document.title = `Job Card #${jobCard.jobCardId} - Plati System`
    } else {
      document.title = 'Job Card Details - Plati System'
    }

    // Handle keyboard shortcuts
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        if (editMode) {
          setEditMode(false)
          form.resetFields()
        } else {
          navigate('/job-cards')
        }
      }
      if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        handleRefresh()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Cleanup title and event listener on unmount
    return () => {
      document.title = 'Plati System'
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [jobCard?.jobCardId, navigate])

  // Initialize form when entering edit mode
  useEffect(() => {
    if (editMode && jobCard) {
      form.setFieldsValue({
        prodStep: jobCard.prodStep,
        isUrgent: jobCard.isUrgent,
        acceptedQuantity: jobCard.acceptedQuantity,
        rejectedQuantity: jobCard.rejectedQuantity,
        rejectionReason: jobCard.rejectionReason
      })
    }
  }, [editMode, jobCard, form])

  const loadJobCard = async () => {
    try {
      setLoading(true)

      // Use the same API as the modal - get all job cards and find the specific one
      const result = await dispatch(
        getJobCardsWithDetails({
          page: 1,
          limit: 1000 // Get a large number to ensure we find the job card
        })
      ).unwrap()

      const jobCardData = result.jobCards?.find(
        jc =>
          (jc.id && jc.id.toString() === jobId.toString()) ||
          (jc.jobCardId && jc.jobCardId.toString() === jobId.toString())
      )

      if (jobCardData) {
        setJobCard(jobCardData)
        await loadJobCardDetails(jobCardData)
      } else {
        throw new Error('Job card not found')
      }
    } catch (error) {
      console.error('Error loading job card:', error)
      notification.error({
        message: 'Failed to load job card',
        description: error.message || 'Please try again or contact support'
      })
      // Navigate back to job cards list if job card not found
      navigate('/job-cards')
    } finally {
      setLoading(false)
    }
  }

  // Determine if job card uses preset
  useEffect(() => {
    if (jobCard) {
      const usesPreset =
        (jobCard.presetId || jobCard.presetName) &&
        jobCard.stepAssignmentMode === 'preset'
      setIsPresetBased(usesPreset)
    }
  }, [jobCard])

  // Load job card details including preset steps
  const loadJobCardDetails = async cardData => {
    try {
      // Load preset steps if job card uses preset
      if (
        (cardData.presetId || cardData.presetName) &&
        cardData.stepAssignmentMode === 'preset'
      ) {
        try {
          const presetResult = await dispatch(
            getPresetDetails({
              presetId: cardData.presetId || cardData.presetName
            })
          ).unwrap()

          // Handle different response structures
          const steps =
            presetResult?.steps ||
            presetResult?.data?.steps ||
            presetResult ||
            []

          if (Array.isArray(steps) && steps.length > 0) {
            // Create a copy and sort steps by order to avoid frozen array issues
            const sortedSteps = [...steps].sort(
              (a, b) => a.stepOrder - b.stepOrder
            )
            setPresetSteps(sortedSteps)
            console.log(
              `Loaded ${sortedSteps.length} preset steps for ${
                cardData.presetName || cardData.presetId
              }`
            )
          } else {
            console.warn(
              'No preset steps found for:',
              cardData.presetName || cardData.presetId
            )
            setPresetSteps([])
          }
        } catch (error) {
          console.error('Failed to load preset details:', error)
          // Fallback to default steps
          setPresetSteps([])
        }
      }

      // Load job card progress
      try {
        const progressResult = await dispatch(
          getJobCardProgress(cardData.id)
        ).unwrap()
        if (progressResult && Array.isArray(progressResult)) {
          setJobCardProgress(progressResult)

          // Find current plan step ID from progress
          const currentProgress = progressResult.find(
            p => p.stepOrder === cardData.prodStep && p.status !== 'completed'
          )
          if (currentProgress) {
            setCurrentPlanStepId(
              currentProgress.planStepId || currentProgress.plan_step_id
            )
          }
        }
      } catch (error) {
        console.error('Failed to load job card progress:', error)
      }

      // Load step progress data for quality tracking
      await loadStepProgressData(cardData.id)

      // Simulate loading additional details (this could be replaced with real API calls)
      const steps = getProductionSteps()
      // For preset-based, prodStep is the position (1-based), for standard it's the step ID
      const completedStepsCount = Math.min(
        cardData.prodStep - 1,
        steps.length - 1
      )
      const mockStepHistory = steps
        .slice(0, completedStepsCount)
        .map((step, index) => ({
          stepId: step.id || step.stepOrder || index + 1,
          stepName: step.name || step.stepName,
          status: 'completed',
          completedAt: moment()
            .subtract(completedStepsCount - index, 'days')
            .format(),
          completedBy: 'Production Team',
          notes: step.notes || ''
        }))
      setStepHistory(mockStepHistory)

      // Load QA reports if any
      if (cardData.rejectedQuantity > 0) {
        setQaReports([
          {
            id: 1,
            date: moment().subtract(1, 'day').format(),
            rejectedQuantity: cardData.rejectedQuantity,
            reason: cardData.rejectionReason || 'Quality issues detected',
            inspector: 'QA Team'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading job card details:', error)
      notification.error({
        message: 'Failed to load details',
        description: 'Some job card details could not be loaded'
      })
    }
  }

  // Get production steps based on preset or default
  const getProductionSteps = () => {
    if (isPresetBased && presetSteps.length > 0) {
      return presetSteps.map((step, index) => ({
        id: step.stepOrder,
        stepOrder: step.stepOrder,
        name: step.stepName,
        stepName: step.stepName,
        description: step.description || step.notes || '',
        estimatedDuration: step.estimatedDuration,
        estimatedDurationUnit: step.estimatedDurationUnit,
        color: getStepColor(index),
        icon: getStepIcon(step.stepName),
        assignedRoles: step.assignedRoles || [],
        qualityChecks: step.qualityChecks || []
      }))
    }
    return DEFAULT_PRODUCTION_STEPS
  }

  // Get step color based on index
  const getStepColor = index => {
    const colors = [
      '#722ed1',
      '#eb2f96',
      '#faad14',
      '#fa8c16',
      '#a0d911',
      '#52c41a',
      '#13c2c2',
      '#1890ff',
      '#2f54eb',
      '#f5222d',
      '#389e0d'
    ]
    return colors[index % colors.length]
  }

  // Get step icon based on name
  const getStepIcon = stepName => {
    const iconMap = {
      material: '📦',
      paint: '🎨',
      machine: '⚙️',
      coating: '🔧',
      pvd: '⚡',
      mill: '🏭',
      acrylic: '💧',
      lacquer: '✨',
      pack: '📋',
      quality: '🔍',
      dispatch: '🚚',
      ship: '🚚'
    }

    const lowerName = stepName.toLowerCase()
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) return icon
    }
    return '⚡'
  }

  // Handle job card update
  const handleUpdate = async values => {
    try {
      setLoading(true)

      if (!jobCard.jobCardId) {
        notification.error({
          message: 'Error',
          description:
            'Job card ID not found. Please refresh the page and try again.'
        })
        setLoading(false)
        return
      }

      await dispatch(
        updateJobCardProgress({
          jobCardId: jobCard.jobCardId,
          ...values
        })
      ).unwrap()

      notification.success({
        message: 'Job Card Updated',
        description: 'Job card has been updated successfully'
      })

      setEditMode(false)
      await loadJobCard()
    } catch (error) {
      notification.error({
        message: 'Update Failed',
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Load step-wise progress data
  const loadStepProgressData = async () => {
    const jobCardId = jobCard?.id || jobCard?.jobCardId
    if (!jobCardId) {
      console.warn('No job card ID available for loading step progress')
      return
    }

    try {
      setStepProgressLoading(true)
      let result = await dispatch(getJobCardStepProgress(jobCardId)).unwrap()
      let stepProgress = result.data || result.stepProgress || []

      // If no step progress exists, initialize it
      if (!stepProgress || stepProgress.length === 0) {
        try {
          console.log(
            'No step progress found, initializing for job card:',
            jobCardId
          )
          const initResult = await dispatch(
            initializeJobCardSteps(jobCardId)
          ).unwrap()
          console.log('Step progress initialized successfully:', initResult)

          // Reload step progress after initialization
          result = await dispatch(getJobCardStepProgress(jobCardId)).unwrap()
          stepProgress = result.data || result.stepProgress || []

          if (stepProgress && stepProgress.length > 0) {
            notification.success({
              message: 'Step Progress Initialized',
              description: `Initialized ${stepProgress.length} production steps`
            })
          }
        } catch (initError) {
          console.error('Failed to initialize step progress:', initError)
          notification.warning({
            message: 'Step Progress Initialization Failed',
            description:
              'Could not initialize production steps. Manual tracking may be required.'
          })
          // Continue with empty array rather than failing completely
        }
      }

      setStepProgressData(stepProgress || [])
      console.log(
        'Loaded step progress data:',
        stepProgress?.length || 0,
        'steps'
      )
    } catch (error) {
      console.error('Failed to load step progress:', error)
      notification.error({
        message: 'Failed to Load Step Progress',
        description: error.message || 'Could not load production step data'
      })
    } finally {
      setStepProgressLoading(false)
    }
  }

  // Handle processing a step with quality data
  const handleProcessStep = stepProgress => {
    setSelectedStepProgress(stepProgress)
    setStepProgressModalVisible(true)
  }

  // Submit step progress with quality data
  const handleSubmitStepProgress = async progressData => {
    try {
      setStepProgressLoading(true)

      console.log('Submitting step progress:', progressData)
      const result = await dispatch(processStepProgress(progressData)).unwrap()
      console.log('Step progress processed successfully:', result)

      notification.success({
        message: 'Step Processed Successfully',
        description: `Processed ${progressData.acceptedQuantity} accepted, ${progressData.rejectedQuantity} rejected, ${progressData.reworkQuantity} rework units`
      })

      setStepProgressModalVisible(false)
      setSelectedStepProgress(null)

      // Reload data to reflect changes
      await Promise.all([loadStepProgressData(), loadJobCard()])
    } catch (error) {
      console.error('Step progress processing failed:', error)

      // More detailed error handling
      let errorMessage = 'Failed to process step'
      let errorDescription = error.message || 'Unknown error occurred'

      // Handle specific error cases
      if (error.message?.includes('exceeds input quantity')) {
        errorDescription =
          'Total processed quantity exceeds available units. Please check your quantities.'
      } else if (error.message?.includes('Rejection reason is required')) {
        errorDescription =
          'Please provide a rejection reason when units are rejected.'
      } else if (error.message?.includes('Step progress not found')) {
        errorDescription =
          'Step progress record not found. Please refresh and try again.'
      }

      notification.error({
        message: errorMessage,
        description: errorDescription,
        duration: 6 // Longer duration for important errors
      })
    } finally {
      setStepProgressLoading(false)
    }
  }

  // Handle step progression with preset support
  const handleMoveToNextStep = async () => {
    // Find current step progress in stepProgressData
    const currentStepProgress = stepProgressData.find(
      s => s.stepOrder === jobCard.prodStep && s.status !== 'completed'
    )

    if (!currentStepProgress) {
      // If no step progress data exists, show error
      notification.warning({
        message: 'No Step Progress Data',
        description:
          'Please use the Quality Tracking tab to process this step with quality data.'
      })
      return
    }

    // Open the quality tracking modal for the current step
    handleProcessStep(currentStepProgress)
  }

  // Handle updating job card details
  const handleUpdateJobCard = async values => {
    try {
      setLoading(true)

      const updateData = {
        ...jobCard,
        ...values,
        updatedAt: new Date().toISOString()
      }

      console.log('Updating job card:', updateData)

      // Update job card in Redux/API
      // Note: You would need to implement the actual API call here
      // await dispatch(updateJobCard(updateData)).unwrap()

      notification.success({
        message: 'Job Card Updated',
        description: 'Job card details have been updated successfully.'
      })

      setEditMode(false)
      await loadJobCard()
    } catch (error) {
      console.error('Failed to update job card:', error)
      notification.error({
        message: 'Update Failed',
        description: error.message || 'Failed to update job card details.'
      })
    } finally {
      setLoading(false)
    }
  }

  // Load preset details when a preset is selected
  const loadPresetDetails = async presetName => {
    try {
      console.log('Loading preset details for:', presetName)
      const presetData = await dispatch(getPresetDetails(presetName)).unwrap()

      if (presetData && presetData.steps) {
        setPresetSteps(presetData.steps)
        setIsPresetBased(true)

        // Initialize job card steps if needed
        if (jobCard?.id) {
          await dispatch(
            initializeJobCardSteps({
              jobCardId: jobCard.id,
              presetSteps: presetData.steps
            })
          ).unwrap()
        }

        notification.success({
          message: 'Preset Loaded',
          description: `Preset "${presetName}" has been applied.`
        })
      }
    } catch (error) {
      console.error('Failed to load preset details:', error)
      notification.error({
        message: 'Preset Loading Failed',
        description: 'Failed to load preset details. Please try again.'
      })
    }
  }

  // Refresh all job card data
  const handleRefresh = async () => {
    await loadJobCard()
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-500'>Loading job card details...</p>
        </div>
      </div>
    )
  }

  if (!jobCard) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-gray-400 text-6xl mb-4'>📋</div>
          <p className='text-gray-500 mb-4'>Job card not found</p>
          <ShadcnButton onClick={() => navigate('/job-cards')}>
            Back to Job Cards
          </ShadcnButton>
        </div>
      </div>
    )
  }

  const steps = getProductionSteps()
  const totalSteps = steps.length

  // For preset-based job cards, prodStep might be an index rather than stepId
  // So we need to get the step by position for presets
  const currentStep = isPresetBased
    ? steps[jobCard.prodStep - 1] || steps[0] // Use index for presets (prodStep is 1-based)
    : steps.find(s => (s.id || s.stepOrder) === jobCard.prodStep) || steps[0] // Use ID for standard

  const nextStep = isPresetBased
    ? steps[jobCard.prodStep] // Next step by index for presets
    : steps.find(s => (s.id || s.stepOrder) === jobCard.prodStep + 1) // Next step by ID for standard

  const progress = Math.round((jobCard.prodStep / totalSteps) * 100)
  const isCompleted = jobCard.prodStep >= totalSteps

  const sectionItems = [
    {
      key: 'overview',
      label: 'Overview',
      icon: <DashboardOutlined />
    },
    {
      key: 'quality',
      label: 'Quality Tracking',
      icon: <ToolOutlined />
    }
  ]

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='py-4'>
            <Breadcrumb>
              <Breadcrumb.Item>
                <HomeOutlined />
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <FolderOutlined />
                <span>Production</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <span>Job Cards</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <span>Job Card #{jobCard.jobCardId}</span>
              </Breadcrumb.Item>
            </Breadcrumb>
          </div>
        </div>
      </div>

      {/* Professional Header with All Job Card Details */}
      <div className='bg-white shadow-lg border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          {/* Top Row - Job Card ID and Key Actions */}
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
                  <span className='text-white font-bold text-lg'>
                    {jobCard.id}
                  </span>
                </div>
                <div>
                  <h1 className='text-2xl font-bold text-gray-900 m-0 flex items-center gap-3'>
                    Job Card #{jobCard.jobCardId}
                    {jobCard.isUrgent && (
                      <span className='px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1'>
                        <FireOutlined />
                        URGENT
                      </span>
                    )}
                    {isCompleted && (
                      <span className='px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1'>
                        <CheckCircleOutlined />
                        COMPLETED
                      </span>
                    )}
                  </h1>
                  <p className='text-gray-500 text-sm mt-1'>
                    Plan #{jobCard.prodPlanId} • Created by{' '}
                    {jobCard.createdByFirstName ||
                      jobCard.createdBy ||
                      'Production Team'}{' '}
                    • {moment(jobCard.createdAt).format('MMM DD, YYYY')}
                  </p>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadJobCard}
                className='border-gray-300 text-gray-700 hover:bg-gray-50'
              >
                Refresh
              </Button>
              <Button
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/job-cards')}
                type='primary'
              >
                Back to List
              </Button>
            </div>
          </div>

          {/* Second Row - Product Flow and Status */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
            {/* Product Transformation */}
            <div className='lg:col-span-2'>
              <div className='bg-gray-50 rounded-xl p-4 border border-gray-200'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                  <BranchesOutlined />
                  Product Transformation
                </h3>
                <div className='flex items-center gap-3'>
                  <div className='flex-1 bg-white rounded-lg p-3 border border-gray-200'>
                    <p className='text-xs text-gray-500 mb-1'>Source Product</p>
                    <p className='font-semibold text-gray-900'>
                      {jobCard.sourceProductName || jobCard.alloyName || 'N/A'}
                    </p>
                  </div>
                  <div className='text-blue-500'>
                    <ArrowRightOutlined className='text-lg' />
                  </div>
                  <div className='flex-1 bg-white rounded-lg p-3 border border-gray-200'>
                    <p className='text-xs text-gray-500 mb-1'>Target Product</p>
                    <p className='font-semibold text-gray-900'>
                      {jobCard.targetProductName ||
                        jobCard.convertName ||
                        'N/A'}
                    </p>
                  </div>
                </div>
                {isPresetBased && (
                  <div className='mt-3 flex items-center gap-2'>
                    <SettingOutlined className='text-blue-500' />
                    <span className='text-sm text-gray-600'>
                      Preset: <strong>{jobCard.presetName}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Step Status */}
            <div>
              <div className='bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                  <DashboardOutlined />
                  Current Status
                </h3>
                <div className='space-y-2'>
                  <div>
                    <p className='text-xs text-gray-500'>Current Step</p>
                    <p className='font-semibold text-gray-900'>
                      {currentStep?.name || 'Not Started'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500'>Progress</p>
                    <div className='flex items-center gap-2'>
                      <Progress
                        percent={progress}
                        size='small'
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#52c41a'
                        }}
                        className='flex-1'
                      />
                      <span className='text-sm font-medium text-gray-700'>
                        {progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Row - Metrics and Quick Actions */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='bg-white border border-gray-200 rounded-xl p-4 text-center'>
              <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2'>
                <ProductOutlined className='text-blue-600 text-lg' />
              </div>
              <p className='text-2xl font-bold text-gray-900'>
                {jobCard.quantity?.toLocaleString() || 0}
              </p>
              <p className='text-sm text-gray-500'>Total Units</p>
            </div>

            <div className='bg-white border border-gray-200 rounded-xl p-4 text-center'>
              <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2'>
                <CheckCircleOutlined className='text-green-600 text-lg' />
              </div>
              <p className='text-2xl font-bold text-gray-900'>
                {Math.round(
                  (jobCard.quantity * progress) / 100
                )?.toLocaleString() || 0}
              </p>
              <p className='text-sm text-gray-500'>Completed Units</p>
            </div>

            <div className='bg-white border border-gray-200 rounded-xl p-4 text-center'>
              <div className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2'>
                <ClockCircleOutlined className='text-orange-600 text-lg' />
              </div>
              <p className='text-2xl font-bold text-gray-900'>
                {jobCard.prodStep || 0}/{totalSteps}
              </p>
              <p className='text-sm text-gray-500'>Step Progress</p>
            </div>

            <div className='bg-white border border-gray-200 rounded-xl p-4 text-center'>
              <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2'>
                <BarChartOutlined className='text-purple-600 text-lg' />
              </div>
              <p className='text-2xl font-bold text-gray-900'>
                {moment(jobCard.createdAt).fromNow()}
              </p>
              <p className='text-sm text-gray-500'>Time Elapsed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Action Area */}
      <div className='max-w-7xl mx-auto px-4 sm:px-4 lg:px-4 py-1'>
        {/* Step Management View */}
        <div className='pt-6'>
          <StepManagementView
            jobCard={jobCard}
            stepProgressData={stepProgressData}
            onProcessStep={handleProcessStep}
            loading={stepProgressLoading}
          />
        </div>
      </div>
      {/* Step Progress Modal for Quality Data Entry */}
      {selectedStepProgress && (
        <StepProgressModal
          visible={stepProgressModalVisible}
          onCancel={() => {
            setStepProgressModalVisible(false)
            setSelectedStepProgress(null)
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
          jobCard={jobCard}
          loading={stepProgressLoading}
        />
      )}
    </div>
  )
}

export default JobCardDetailsPage
