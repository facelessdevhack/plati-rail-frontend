import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Settings,
  TrendingUp,
  FileText,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ArrowRight,
  BarChart3,
  Activity,
  Filter,
  X,
  Search,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Target
} from 'lucide-react'

import {
  getProductionPlanById,
  getProductionPlanDetails,
  getJobCardsWithDetails,
  getJobCardProgress,
  getJobCardStepProgress,
  initializeJobCardSteps,
  processStepProgress,
  createInventoryRequest
} from '../../redux/api/productionAPI'
import JobCardDetailsModal from './JobCardDetailsModal'
import StepManagementView from './StepManagementView'
import StepProgressModal from './StepProgressModal'
import JobCardCreationModal from './JobCardCreationModal'
import InventoryRequestModal from './InventoryRequestModal'

const ProductionPlanDetailsPage = () => {
  const { planId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [loading, setLoading] = useState(true)
  const [planDetails, setPlanDetails] = useState(null)
  const [jobCards, setJobCards] = useState([])
  const [jobCardsLoading, setJobCardsLoading] = useState(false)
  const [selectedJobCard, setSelectedJobCard] = useState(null)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stepFilter, setStepFilter] = useState('all')
  const [qualityFilter, setQualityFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Step progress tracking states
  const [selectedJobCardForSteps, setSelectedJobCardForSteps] = useState(null)
  const [stepProgressData, setStepProgressData] = useState([])
  const [stepProgressLoading, setStepProgressLoading] = useState(false)
  const [activeViewTab, setActiveViewTab] = useState('overview') // 'overview', 'steps', or 'aggregated'

  // Aggregated quality tracking states
  const [aggregatedQualityData, setAggregatedQualityData] = useState([])
  const [aggregatedQualityLoading, setAggregatedQualityLoading] = useState(false)

  // Step progress modal states
  const [selectedStepProgress, setSelectedStepProgress] = useState(null)
  const [stepProgressModalVisible, setStepProgressModalVisible] = useState(false)
  const [stepProgressSubmitting, setStepProgressSubmitting] = useState(false)

  // Job card creation modal states
  const [jobCardModalVisible, setJobCardModalVisible] = useState(false)

  // Inventory request modal states
  const [inventoryRequestModalVisible, setInventoryRequestModalVisible] = useState(false)
  const [selectedStepForInventory, setSelectedStepForInventory] = useState(null)
  const [inventoryRequestSubmitting, setInventoryRequestSubmitting] = useState(false)

  // Get selected plan from Redux if available
  const { selectedPlan, productionPlans } = useSelector(state => state.productionDetails)

  // Load production plan details
  useEffect(() => {
    if (planId) {
      // First try to find the plan in already loaded data
      const existingPlan = productionPlans.find(p => p.id === parseInt(planId))
      if (existingPlan) {
        console.log('Using existing plan from Redux:', existingPlan)
        setPlanDetails(existingPlan)
        setLoading(false)
      } else if (selectedPlan && selectedPlan.id === parseInt(planId)) {
        console.log('Using selected plan from Redux:', selectedPlan)
        setPlanDetails(selectedPlan)
        setLoading(false)
      } else {
        // Load from API if not in Redux
        loadPlanDetails()
      }
      loadJobCards()
    }
  }, [planId, productionPlans, selectedPlan])

  const loadPlanDetails = async () => {
    setLoading(true)
    try {
      const response = await dispatch(getProductionPlanDetails(planId)).unwrap()
      console.log('Production Plan Details Response:', response)

      // Handle different response structures
      // API returns { planDetails: {...}, message: ... }
      const planData = response.planDetails || response
      console.log('Extracted Plan Data:', planData)
      console.log('Production Steps:', planData.productionSteps)

      if (planData) {
        // Map statistics to quantityTracking for compatibility
        const enhancedPlanData = {
          ...planData,
          quantityTracking: {
            totalJobCardQuantity: planData.statistics?.totalJobCardQuantity || 0,
            allocatedQuantity: planData.statistics?.totalJobCardQuantity || 0,
            remainingQuantity: planData.statistics?.remainingQuantity || planData.quantity || 0,
            completedQuantity: planData.statistics?.completedQuantity || 0
          }
        }
        console.log('Enhanced Plan Data with quantityTracking:', enhancedPlanData)
        setPlanDetails(enhancedPlanData)
      } else {
        console.error('No plan data received')
        setPlanDetails(null)
      }
    } catch (error) {
      console.error('Error loading plan details:', error)
      setPlanDetails(null)
    } finally {
      setLoading(false)
    }
  }

  const loadJobCards = async () => {
    setJobCardsLoading(true)
    try {
      const response = await dispatch(
        getJobCardsWithDetails({
          prodPlanId: planId,
          page: 1,
          limit: 100
        })
      ).unwrap()
      setJobCards(response.jobCards || [])
    } catch (error) {
      console.error('Error loading job cards:', error)
      setJobCards([])
    } finally {
      setJobCardsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      on_hold: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status] || colors.pending
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      in_progress: <Play className="h-4 w-4" />,
      completed: <CheckCircle2 className="h-4 w-4" />,
      on_hold: <AlertCircle className="h-4 w-4" />,
      cancelled: <AlertCircle className="h-4 w-4" />
    }
    return icons[status] || icons.pending
  }

  const getQualityStatus = (jobCard) => {
    const accepted = parseInt(jobCard.acceptedQuantity) || 0
    const rejected = parseInt(jobCard.rejectedQuantity) || 0
    const total = accepted + rejected

    if (total === 0) return { status: 'pending', color: 'bg-amber-100 text-amber-700', icon: <Clock className="h-4 w-4" /> }

    const qualityRate = (accepted / total) * 100
    if (qualityRate >= 95) return { status: 'excellent', color: 'bg-green-100 text-green-700', icon: <ThumbsUp className="h-4 w-4" /> }
    if (qualityRate >= 80) return { status: 'good', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 className="h-4 w-4" /> }
    if (qualityRate >= 60) return { status: 'fair', color: 'bg-amber-100 text-amber-700', icon: <AlertCircle className="h-4 w-4" /> }
    return { status: 'poor', color: 'bg-red-100 text-red-700', icon: <ThumbsDown className="h-4 w-4" /> }
  }

  // Get unique steps for filter dropdown
  const uniqueSteps = useMemo(() => {
    const steps = [...new Set(jobCards.map(card => card.currentStepName).filter(Boolean))]
    return steps.sort()
  }, [jobCards])

  // Filter job cards based on all filters
  const filteredJobCards = useMemo(() => {
    return jobCards.filter(jobCard => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          (jobCard.jobCardId || jobCard.id || '').toString().toLowerCase().includes(searchLower) ||
          (jobCard.currentStepName || '').toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'all') {
        if ((jobCard.status || 'pending') !== statusFilter) return false
      }

      // Step filter
      if (stepFilter !== 'all') {
        if ((jobCard.currentStepName || '') !== stepFilter) return false
      }

      // Quality filter
      if (qualityFilter !== 'all') {
        const qualityStatus = getQualityStatus(jobCard).status
        if (qualityStatus !== qualityFilter) return false
      }

      return true
    })
  }, [jobCards, searchTerm, statusFilter, stepFilter, qualityFilter])

  // Calculate quality metrics
  const qualityMetrics = useMemo(() => {
    const total = jobCards.reduce((sum, card) => sum + (parseInt(card.quantity) || 0), 0)
    const accepted = jobCards.reduce((sum, card) => sum + (parseInt(card.acceptedQuantity) || 0), 0)
    const rejected = jobCards.reduce((sum, card) => sum + (parseInt(card.rejectedQuantity) || 0), 0)
    const pending = total - accepted - rejected

    return {
      total,
      accepted,
      rejected,
      pending,
      qualityRate: (accepted + rejected) > 0 ? ((accepted / (accepted + rejected)) * 100).toFixed(1) : 0,
      completionRate: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0
    }
  }, [jobCards])

  const handleViewDetails = (jobCard) => {
    setSelectedJobCard(jobCard)
    setDetailsModalVisible(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setStepFilter('all')
    setQualityFilter('all')
  }

  const refreshJobCards = () => {
    loadJobCards()
  }

  const loadStepProgressData = async (jobCardId) => {
    if (!jobCardId) return

    setStepProgressLoading(true)
    try {
      const response = await dispatch(getJobCardStepProgress(jobCardId)).unwrap()
      let stepData = response.data || response.stepProgress || []

      console.log('Step progress data loaded:', stepData)

      // If no step progress data exists, initialize it
      if (stepData.length === 0) {
        console.log('No step progress data found, initializing...')
        try {
          const initResponse = await dispatch(initializeJobCardSteps(jobCardId)).unwrap()
          console.log('Step progress initialized:', initResponse)

          // Load the step progress data again after initialization
          const retryResponse = await dispatch(getJobCardStepProgress(jobCardId)).unwrap()
          stepData = retryResponse.data || retryResponse.stepProgress || []
          console.log('Step progress data loaded after initialization:', stepData)
        } catch (initError) {
          console.error('Error initializing step progress:', initError)
        }
      }

      setStepProgressData(stepData)
    } catch (error) {
      console.error('Error loading step progress data:', error)
      setStepProgressData([])
    } finally {
      setStepProgressLoading(false)
    }
  }

  const handleViewStepProgress = (jobCard) => {
    setSelectedJobCardForSteps(jobCard)
    setActiveViewTab('steps')
    const cardId = jobCard.jobCardId || jobCard.id
    loadStepProgressData(cardId)
  }

  const handleProcessStep = (step) => {
    // Open the step processing modal with the step data
    if (!selectedJobCardForSteps) {
      console.error('No job card selected for step processing')
      return
    }

    // Enhance step progress with job card info
    setSelectedStepProgress({
      ...step,
      jobCardId: selectedJobCardForSteps.jobCardId || selectedJobCardForSteps.id,
      jobCard: selectedJobCardForSteps,
      currentStepInfo: {
        name: step.stepName,
        order: step.stepOrder
      }
    })
    setStepProgressModalVisible(true)
  }

  const loadAggregatedQualityData = async () => {
    if (!jobCards || jobCards.length === 0) {
      console.log('⚠️ No job cards available for aggregation')
      setAggregatedQualityData([])
      return
    }

    setAggregatedQualityLoading(true)
    try {
      console.log('📊 Aggregated Quality Tracking Debug:', {
        planId,
        totalJobCards: jobCards.length,
        jobCards: jobCards.map(jc => ({
          id: jc.id,
          jobCardId: jc.jobCardId,
          quantity: jc.quantity,
          allFields: Object.keys(jc)
        }))
      })

      const allStepProgress = []

      for (const jobCard of jobCards) {
        try {
          // Use the correct ID field - jobCardId is the actual database ID
          const cardId = jobCard.jobCardId || jobCard.id

          if (!cardId) {
            console.warn(`⚠️ Job card missing ID:`, jobCard)
            continue
          }

          console.log(`🔄 Fetching step progress for job card ${cardId}...`)

          let stepResponse = await dispatch(getJobCardStepProgress(cardId)).unwrap()
          console.log(`📦 Raw step response for job card ${cardId}:`, stepResponse)

          let steps = stepResponse.data || []

          // If no steps found, try to initialize them
          if (steps.length === 0) {
            console.log(`⚙️ No step progress found for job card ${cardId}, initializing...`)
            try {
              await dispatch(initializeJobCardSteps(cardId)).unwrap()
              console.log(`✅ Step progress initialized for job card ${cardId}`)

              // Fetch again after initialization
              stepResponse = await dispatch(getJobCardStepProgress(cardId)).unwrap()
              steps = stepResponse.data || []
              console.log(`📦 Refetched step progress for job card ${cardId}:`, steps)
            } catch (initError) {
              console.error(`❌ Failed to initialize steps for job card ${cardId}:`, initError)
              // Continue to next job card even if initialization fails
              continue
            }
          }

          console.log(`✅ Job card ${cardId}: ${steps.length} steps found`)
          allStepProgress.push(...steps)
        } catch (error) {
          console.error(`❌ Error fetching step progress for job card ${jobCard.id}:`, {
            error,
            errorMessage: error?.message,
            errorData: error?.data,
            fullError: JSON.stringify(error, null, 2)
          })
        }
      }

      console.log('📈 Total step progress entries:', allStepProgress.length)

      // Aggregate by step with job card tracking
      const aggregatedSteps = allStepProgress.reduce((acc, step) => {
        const key = `${step.stepOrder}-${step.stepName}`
        if (!acc[key]) {
          acc[key] = {
            ...step,
            id: `aggregated-${step.stepOrder}`,
            inputQuantity: 0,
            acceptedQuantity: 0,
            rejectedQuantity: 0,
            pendingQuantity: 0,
            reworkQuantity: 0,
            // Track contributing job cards
            jobCardBreakdown: []
          }
        }

        // Accumulate quantities
        acc[key].inputQuantity += step.inputQuantity || 0
        acc[key].acceptedQuantity += step.acceptedQuantity || 0
        acc[key].rejectedQuantity += step.rejectedQuantity || 0
        acc[key].pendingQuantity += step.pendingQuantity || 0
        acc[key].reworkQuantity += step.reworkQuantity || 0

        // Track job card contribution
        if (step.jobCardId) {
          acc[key].jobCardBreakdown.push({
            jobCardId: step.jobCardId,
            inputQuantity: step.inputQuantity || 0,
            acceptedQuantity: step.acceptedQuantity || 0,
            rejectedQuantity: step.rejectedQuantity || 0,
            pendingQuantity: step.pendingQuantity || 0,
            reworkQuantity: step.reworkQuantity || 0,
            status: step.status,
            processedAt: step.processedAt
          })
        }

        return acc
      }, {})

      const aggregatedData = Object.values(aggregatedSteps).sort((a, b) => a.stepOrder - b.stepOrder)
      console.log('📊 Aggregated quality data with job card breakdown:', aggregatedData)
      setAggregatedQualityData(aggregatedData)
    } catch (error) {
      console.error('❌ Error fetching aggregated quality tracking data:', error)
    } finally {
      setAggregatedQualityLoading(false)
    }
  }

  const handleViewAggregatedQuality = () => {
    setActiveViewTab('aggregated')
    loadAggregatedQualityData()
  }

  const handleProcessStepFromAggregated = async (stepProgress, jobCardId) => {
    // Find the job card for this step
    const jobCard = jobCards.find(jc => (jc.jobCardId || jc.id) === jobCardId)

    if (!jobCard) {
      console.error('Job card not found:', jobCardId)
      return
    }

    // Fetch the actual step progress data for this specific job card
    try {
      const cardId = jobCard.jobCardId || jobCard.id
      const response = await dispatch(getJobCardStepProgress(cardId)).unwrap()
      const stepProgressData = response.data || []

      // Find the specific step progress record that matches the step order
      const specificStepProgress = stepProgressData.find(
        sp => sp.stepOrder === stepProgress.stepOrder && sp.stepName === stepProgress.stepName
      )

      if (!specificStepProgress) {
        console.error('Step progress not found for step:', stepProgress.stepName)
        return
      }

      // Enhance step progress with job card ID and step info
      setSelectedStepProgress({
        ...specificStepProgress,
        jobCardId: jobCardId,
        jobCard: jobCard,
        currentStepInfo: {
          name: specificStepProgress.stepName,
          order: specificStepProgress.stepOrder
        }
      })
      setStepProgressModalVisible(true)
    } catch (error) {
      console.error('Error loading step progress for job card:', error)
    }
  }

  const handleSubmitStepProgress = async (progressData) => {
    try {
      setStepProgressSubmitting(true)
      await dispatch(processStepProgress(progressData)).unwrap()

      // Reload data based on current active tab
      if (activeViewTab === 'aggregated') {
        // Reload aggregated quality data
        await loadAggregatedQualityData()
      } else if (activeViewTab === 'steps' && selectedJobCardForSteps) {
        // Reload step progress data for the selected job card
        const cardId = selectedJobCardForSteps.jobCardId || selectedJobCardForSteps.id
        await loadStepProgressData(cardId)
      }

      // Also reload job cards to update the overview
      await loadJobCards()

      setStepProgressModalVisible(false)
      setSelectedStepProgress(null)
    } catch (error) {
      console.error('Failed to process step:', error)
    } finally {
      setStepProgressSubmitting(false)
    }
  }

  const handleCreateJobCard = () => {
    setJobCardModalVisible(true)
  }

  const handleJobCardModalClose = () => {
    setJobCardModalVisible(false)
  }

  const handleJobCardCreateSuccess = () => {
    setJobCardModalVisible(false)
    // Reload job cards
    loadJobCards()
  }

  const handleRequestInventory = (step) => {
    // Open the inventory request modal with the step data
    if (!selectedJobCardForSteps) {
      console.error('No job card selected for inventory request')
      return
    }

    setSelectedStepForInventory({
      ...step,
      jobCardId: selectedJobCardForSteps.jobCardId || selectedJobCardForSteps.id,
      jobCard: selectedJobCardForSteps
    })
    setInventoryRequestModalVisible(true)
  }

  const handleSubmitInventoryRequest = async (requestData) => {
    try {
      setInventoryRequestSubmitting(true)
      
      await dispatch(createInventoryRequest(requestData)).unwrap()
      
      console.log('Inventory request submitted successfully:', requestData)
      
      alert(`Inventory request created successfully!\nQuantity: ${requestData.quantityRequested} units`)

      setInventoryRequestModalVisible(false)
      setSelectedStepForInventory(null)
    } catch (error) {
      console.error('Failed to create inventory request:', error)
      alert(`Failed to create inventory request: ${error.message || 'Please try again.'}`)
    } finally {
      setInventoryRequestSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading production plan...</p>
        </div>
      </div>
    )
  }

  if (!planDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg mb-2">Production plan not found</p>
          <p className="text-slate-500 text-sm mb-4">Plan ID: {planId}</p>
          <button
            onClick={() => navigate('/production-plans-v2')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Production Plans
          </button>
        </div>
      </div>
    )
  }

  console.log('Rendering with plan details:', planDetails)

  const totalQuantity = planDetails.quantity || 0
  const allocatedQuantity = planDetails.quantityTracking?.allocatedQuantity || 0
  const remainingQuantity = totalQuantity - allocatedQuantity
  const progressPercentage = totalQuantity > 0 ? Math.round((allocatedQuantity / totalQuantity) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/production-plans-v2')}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Plans</span>
            </button>

            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                <Edit2 className="h-4 w-4" />
                Edit Plan
              </button>
              <button
                onClick={handleCreateJobCard}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Create Job Card
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-slate-800">
                  Production Plan #{planDetails.id}
                </h1>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${
                  planDetails.urgent ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  <AlertCircle className="h-4 w-4" />
                  {planDetails.urgent ? 'URGENT' : 'NORMAL'}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${
                  getStatusColor(planDetails.currentStepStatus || 'pending')
                }`}>
                  {getStatusIcon(planDetails.currentStepStatus || 'pending')}
                  {(planDetails.currentStepStatus || 'pending').replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Created {moment(planDetails.createdAt).format('MMM DD, YYYY [at] HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>By {planDetails.createdBy || 'Unknown'}</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-slate-800">Total: {totalQuantity.toLocaleString()} units</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-slate-800">Pending: {remainingQuantity.toLocaleString()} units</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* Combined Plan Details Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header with Progress */}
          <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-5 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-slate-800">Production Plan Overview</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">Allocated:</span>
                <span className="text-2xl font-bold text-blue-600">{allocatedQuantity.toLocaleString()}</span>
                <span className="text-sm text-slate-500">of {totalQuantity.toLocaleString()} ({progressPercentage}%)</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="p-6">
            <div className="flex items-center gap-4">
              {/* Source Alloy */}
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Source Material</p>
                    <h3 className="text-lg font-bold text-slate-800">
                      {planDetails.alloyName || planDetails.sourceProduct || `Alloy ${planDetails.alloyId}`}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-green-100 rounded-full shadow-sm">
                  <ArrowRight className="h-6 w-6 text-slate-700" strokeWidth={2.5} />
                </div>
              </div>

              {/* Target Alloy */}
              <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-0.5">Target Product</p>
                    <h3 className="text-lg font-bold text-slate-800">
                      {planDetails.convertName || planDetails.targetProduct || `Alloy ${planDetails.convertToAlloyId}`}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Metrics Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Quality Tracking Overview
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-600">Total Quantity</span>
                </div>
                <div className="text-2xl font-bold text-slate-800">{qualityMetrics.total.toLocaleString()}</div>
                <div className="text-xs text-slate-500">All job cards</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Accepted</span>
                </div>
                <div className="text-2xl font-bold text-green-700">{qualityMetrics.accepted.toLocaleString()}</div>
                <div className="text-xs text-green-600">{qualityMetrics.qualityRate}% quality rate</div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Rejected</span>
                </div>
                <div className="text-2xl font-bold text-red-700">{qualityMetrics.rejected.toLocaleString()}</div>
                <div className="text-xs text-red-600">Failed quality</div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-600">Pending</span>
                </div>
                <div className="text-2xl font-bold text-amber-700">{qualityMetrics.pending.toLocaleString()}</div>
                <div className="text-xs text-amber-600">Awaiting inspection</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Completion</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">{qualityMetrics.completionRate}%</div>
                <div className="text-xs text-blue-600">Overall rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Cards Section with Tabbed Interface */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {/* Tab Navigation */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Production Tracking
                </h3>

                {/* Tab Buttons */}
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveViewTab('overview')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeViewTab === 'overview'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Job Cards Overview ({filteredJobCards.length})
                  </button>
                  <button
                    onClick={() => setActiveViewTab('steps')}
                    disabled={!selectedJobCardForSteps}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeViewTab === 'steps'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : selectedJobCardForSteps
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Step Quality Tracking
                    {selectedJobCardForSteps && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        #{selectedJobCardForSteps.jobCardId || selectedJobCardForSteps.id}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleViewAggregatedQuality}
                    disabled={jobCards.length === 0}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeViewTab === 'aggregated'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : jobCards.length > 0
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Aggregated Quality
                    {jobCards.length > 0 && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        {jobCards.length} cards
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {activeViewTab === 'overview' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {(searchTerm || statusFilter !== 'all' || stepFilter !== 'all' || qualityFilter !== 'all') && (
                      <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {[searchTerm, statusFilter !== 'all', stepFilter !== 'all', qualityFilter !== 'all'].filter(Boolean).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={refreshJobCards}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCreateJobCard}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Create Job Card
                  </button>
                </div>
              )}
            </div>

            {/* Filters Panel - Only show in overview tab */}
            {activeViewTab === 'overview' && showFilters && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter Job Cards
                  </h4>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Job Card ID or Step..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Step Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Current Step</label>
                    <select
                      value={stepFilter}
                      onChange={(e) => setStepFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Steps</option>
                      {uniqueSteps.map(step => (
                        <option key={step} value={step}>{step}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quality Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quality Status</label>
                    <select
                      value={qualityFilter}
                      onChange={(e) => setQualityFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Quality</option>
                      <option value="excellent">Excellent (≥95%)</option>
                      <option value="good">Good (80-94%)</option>
                      <option value="fair">Fair (60-79%)</option>
                      <option value="poor">Poor (&lt;60%)</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tab Content */}
          {activeViewTab === 'overview' ? (
            // Job Cards Overview Tab
            jobCardsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : jobCards.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg mb-2">No job cards created yet</p>
                <p className="text-slate-500 text-sm mb-4">Create your first job card to start production</p>
                <button
                  onClick={handleCreateJobCard}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Create First Job Card
                </button>
              </div>
            ) : filteredJobCards.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg mb-2">No job cards match your filters</p>
                <p className="text-slate-500 text-sm mb-4">Try adjusting your filter criteria</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Job Card ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Created Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Quantities</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Quality</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Current Step</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobCards.map((card) => {
                      const qualityStatus = getQualityStatus(card)
                      const accepted = parseInt(card.acceptedQuantity) || 0
                      const rejected = parseInt(card.rejectedQuantity) || 0
                      const pending = (parseInt(card.quantity) || 0) - accepted - rejected

                      return (
                        <tr key={card.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">#{card.jobCardId || card.id}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-600">{moment(card.createdAt).format('MMM DD, YYYY')}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-800">Total: {card.quantity?.toLocaleString()}</span>
                              </div>
                              <div className="flex gap-3 text-xs">
                                <span className="text-green-600">✓ {accepted}</span>
                                <span className="text-red-600">✗ {rejected}</span>
                                <span className="text-amber-600">⏳ {pending}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                              qualityStatus.color
                            }`}>
                              {qualityStatus.icon}
                              {qualityStatus.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-600">{card.currentStepName || '-'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                              getStatusColor(card.status || 'pending')
                            }`}>
                              {getStatusIcon(card.status || 'pending')}
                              {(card.status || 'pending').replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewStepProgress(card)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                                  selectedJobCardForSteps?.id === card.id && activeViewTab === 'steps'
                                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                }`}
                              >
                                <BarChart3 className="h-3.5 w-3.5" />
                                Steps
                              </button>
                              <button
                                onClick={() => handleViewDetails(card)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                              <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium">
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : activeViewTab === 'steps' ? (
            // Step Quality Tracking Tab (Individual Job Card)
            selectedJobCardForSteps ? (
              <div className="p-6">
                {/* Job Card Info Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Job Card #{selectedJobCardForSteps.jobCardId || selectedJobCardForSteps.id}</h4>
                        <p className="text-sm text-slate-600">
                          Quantity: {selectedJobCardForSteps.quantity?.toLocaleString()} units |
                          Created: {moment(selectedJobCardForSteps.createdAt).format('MMM DD, YYYY')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => loadStepProgressData(selectedJobCardForSteps.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium border border-purple-200"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh Steps
                    </button>
                  </div>
                </div>

                {/* Step Management View */}
                <StepManagementView
                  jobCard={selectedJobCardForSteps}
                  stepProgressData={stepProgressData}
                  onProcessStep={handleProcessStep}
                  onRequestInventory={handleRequestInventory}
                  loading={stepProgressLoading}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <BarChart3 className="h-16 w-16 text-slate-300 mb-4" />
                <p className="text-slate-600 text-lg mb-2">No Job Card Selected</p>
                <p className="text-slate-500 text-sm mb-4">Click on the "Steps" button in any job card to view detailed step-wise quality tracking</p>
              </div>
            )
          ) : (
            // Aggregated Quality Tracking Tab (All Job Cards)
            <div className="p-6">
              {/* Aggregated Info Header */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Step-wise Quality Overview</h4>
                      <p className="text-sm text-slate-600">
                        Production Plan #{planDetails.id} | {jobCards.length} Job Card{jobCards.length !== 1 ? 's' : ''} | Total Quantity: {qualityMetrics.total.toLocaleString()} units
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={loadAggregatedQualityData}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium border border-green-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Data
                  </button>
                </div>
              </div>

              {/* Aggregated Step Management View */}
              {aggregatedQualityLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <p className="ml-3 text-slate-600">Loading aggregated quality data...</p>
                </div>
              ) : aggregatedQualityData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Step</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Job Card</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Input</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-green-700">Accepted</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-red-700">Rejected</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-amber-700">Pending</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-purple-700">Rework</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Updated Time</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedQualityData.map((step, stepIndex) => (
                        <React.Fragment key={step.id || stepIndex}>
                          {/* Show job card breakdown rows */}
                          {step.jobCardBreakdown && step.jobCardBreakdown.length > 0 ? (
                            step.jobCardBreakdown.map((jcBreakdown, jcIndex) => (
                              <tr key={`${stepIndex}-${jcIndex}`} className="border-b border-slate-100 hover:bg-slate-50">
                                {/* Step info - only show for first job card */}
                                {jcIndex === 0 && (
                                  <td rowSpan={step.jobCardBreakdown.length} className="py-3 px-4 bg-blue-50 border-r border-slate-200">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded font-bold text-sm">
                                        {step.stepOrder}
                                      </div>
                                      <span className="font-semibold text-slate-800">{step.stepName}</span>
                                    </div>
                                  </td>
                                )}
                                {/* Job card info */}
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-slate-800">#{jcBreakdown.jobCardId}</span>
                                </td>
                                {/* Quantities */}
                                <td className="text-center py-3 px-4 text-slate-700">{jcBreakdown.inputQuantity.toLocaleString()}</td>
                                <td className="text-center py-3 px-4 text-green-700 font-medium">{jcBreakdown.acceptedQuantity.toLocaleString()}</td>
                                <td className="text-center py-3 px-4 text-red-700 font-medium">{jcBreakdown.rejectedQuantity.toLocaleString()}</td>
                                <td className="text-center py-3 px-4 text-amber-700 font-medium">{jcBreakdown.pendingQuantity.toLocaleString()}</td>
                                <td className="text-center py-3 px-4 text-purple-700 font-medium">{jcBreakdown.reworkQuantity.toLocaleString()}</td>
                                <td className="text-center py-3 px-4 text-sm text-slate-600">
                                  {jcBreakdown.processedAt ? moment(jcBreakdown.processedAt).format('MMM DD, HH:mm') :
                                   moment(jcBreakdown.createdAt).format('MMM DD, HH:mm')}
                                </td>
                                <td className="text-center py-3 px-4">
                                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                    jcBreakdown.status === 'completed'
                                      ? 'bg-green-100 text-green-700'
                                      : jcBreakdown.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {(jcBreakdown.status || 'pending').replace('_', ' ').toUpperCase()}
                                  </span>
                                </td>
                                <td className="text-center py-3 px-4">
                                  {jcBreakdown.pendingQuantity > 0 || jcBreakdown.inputQuantity > 0 ? (
                                    <button
                                      onClick={() => {
                                        // Find the full step progress record for this job card and step
                                        const fullStepData = step.jobCardBreakdown.find(
                                          jc => jc.jobCardId === jcBreakdown.jobCardId
                                        )
                                        if (fullStepData) {
                                          handleProcessStepFromAggregated(fullStepData, jcBreakdown.jobCardId)
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                                    >
                                      <Settings className="h-3.5 w-3.5" />
                                      Process
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-400">Completed</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="border-b border-slate-100">
                              <td className="py-3 px-4 bg-blue-50 border-r border-slate-200">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded font-bold text-sm">
                                    {step.stepOrder}
                                  </div>
                                  <span className="font-semibold text-slate-800">{step.stepName}</span>
                                </div>
                              </td>
                              <td colSpan="9" className="py-3 px-4 text-center text-slate-500 italic">
                                No job card data
                              </td>
                            </tr>
                          )}
                          {/* Total row for this step - only show if multiple job cards */}
                          {jobCards.length > 1 && (
                            <tr className="bg-slate-100 border-b-2 border-slate-300 font-semibold">
                              <td className="py-2 px-4"></td>
                              <td className="py-2 px-4 text-slate-700">STEP TOTAL</td>
                              <td className="text-center py-2 px-4 text-slate-800">{step.inputQuantity.toLocaleString()}</td>
                              <td className="text-center py-2 px-4 text-green-800">{step.acceptedQuantity.toLocaleString()}</td>
                              <td className="text-center py-2 px-4 text-red-800">{step.rejectedQuantity.toLocaleString()}</td>
                              <td className="text-center py-2 px-4 text-amber-800">{step.pendingQuantity.toLocaleString()}</td>
                              <td className="text-center py-2 px-4 text-purple-800">{step.reworkQuantity.toLocaleString()}</td>
                              <td className="text-center py-2 px-4">-</td>
                              <td className="text-center py-2 px-4">-</td>
                              <td className="text-center py-2 px-4">-</td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg mb-2">No Quality Tracking Data Available</p>
                  <p className="text-slate-500 text-sm mb-4">No step progress data found for any job cards in this production plan</p>
                  <button
                    onClick={loadAggregatedQualityData}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {planDetails.note && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Notes
            </h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-slate-700">{planDetails.note}</p>
            </div>
          </div>
        )}
      </div>

      {/* Job Card Details Modal */}
      <JobCardDetailsModal
        visible={detailsModalVisible}
        jobCard={selectedJobCard}
        onClose={() => {
          setDetailsModalVisible(false)
          setSelectedJobCard(null)
        }}
        onJobCardUpdated={loadJobCards}
      />

      {/* Step Progress Modal */}
      {selectedStepProgress && (
        <StepProgressModal
          visible={stepProgressModalVisible}
          stepProgress={selectedStepProgress}
          currentStepInfo={selectedStepProgress.currentStepInfo}
          jobCard={selectedStepProgress.jobCard}
          onCancel={() => {
            setStepProgressModalVisible(false)
            setSelectedStepProgress(null)
          }}
          onSubmit={handleSubmitStepProgress}
          loading={stepProgressSubmitting}
        />
      )}

      {/* Job Card Creation Modal */}
      <JobCardCreationModal
        visible={jobCardModalVisible}
        onCancel={handleJobCardModalClose}
        onSuccess={handleJobCardCreateSuccess}
        selectedPlan={planDetails}
      />

      {/* Inventory Request Modal */}
      {selectedStepForInventory && (
        <InventoryRequestModal
          visible={inventoryRequestModalVisible}
          stepProgress={selectedStepForInventory}
          jobCard={selectedStepForInventory.jobCard}
          onCancel={() => {
            setInventoryRequestModalVisible(false)
            setSelectedStepForInventory(null)
          }}
          onSubmit={handleSubmitInventoryRequest}
          loading={inventoryRequestSubmitting}
        />
      )}
    </div>
  )
}

export default ProductionPlanDetailsPage
