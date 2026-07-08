import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { notification } from 'antd'
import moment from 'moment'
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  FileText,
  Plus,
  Eye,
  Edit2,
  ArrowRight,
  BarChart3,
  Filter,
  X,
  Search,
  RefreshCw,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

import {
  getProductionPlanById,
  getProductionPlanDetails,
  getJobCardsWithDetails,
  getJobCardProgress,
  getJobCardStepProgress,
  initializeJobCardSteps,
  processStepProgress,
  createInventoryRequest,
  getProductionPlansWithQuantities
} from '../../redux/api/productionAPI'
import JobCardDetailsModal from './JobCardDetailsModal'
import StepManagementView from './StepManagementView'
import StepProgressModal from './StepProgressModal'
import JobCardCreationModal from './JobCardCreationModal'
import EditProductionPlanModal from './EditProductionPlanModal'
import StatusBadge from '../../Core/Components/StatusBadge'
import TabBar from '../../Core/Components/TabBar'
import InventoryRequestModal from './InventoryRequestModal'

const JOB_CARD_STATUS_BADGE = {
  pending: { variant: 'pending', label: 'Pending' },
  in_progress: { variant: 'inprod', label: 'In Progress' },
  completed: { variant: 'paid', label: 'Completed' },
  on_hold: { variant: 'outofstock', label: 'On Hold' },
  cancelled: { variant: 'unpaid', label: 'Cancelled' }
}

const QUALITY_BADGE_VARIANT = {
  excellent: 'paid',
  good: 'paid',
  fair: 'pending',
  pending: 'pending',
  poor: 'unpaid'
}

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
  const [editModalVisible, setEditModalVisible] = useState(false)

  // Inventory request modal states
  const [inventoryRequestModalVisible, setInventoryRequestModalVisible] = useState(false)
  const [selectedStepForInventory, setSelectedStepForInventory] = useState(null)
  const [inventoryRequestSubmitting, setInventoryRequestSubmitting] = useState(false)

  // Rework traceability states
  const [childReworkPlans, setChildReworkPlans] = useState([])
  const [childReworkPlansLoading, setChildReworkPlansLoading] = useState(false)

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

  // Load child rework plans when we have plan details (only for non-rework plans)
  useEffect(() => {
    if (planDetails?.id && !planDetails?.isRework) {
      loadChildReworkPlans(planDetails.id)
    }
  }, [planDetails?.id, planDetails?.isRework])

  const loadChildReworkPlans = async (id) => {
    setChildReworkPlansLoading(true)
    try {
      const result = await dispatch(
        getProductionPlansWithQuantities({ parentPlanId: id, limit: 50, page: 1 })
      ).unwrap()
      setChildReworkPlans(result.productionPlans || [])
    } catch (e) {
      setChildReworkPlans([])
    } finally {
      setChildReworkPlansLoading(false)
    }
  }

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

  // The backend never flips a job card's status field to 'completed' —
  // derive it from the unit math instead (every unit's fate decided =
  // nothing left to process on this card)
  const getDerivedCardStatus = (jobCard) => {
    if (jobCard.status === 'completed') return 'completed'
    const total = parseInt(jobCard.quantity) || 0
    const accounted =
      (parseInt(jobCard.acceptedQuantity) || 0) +
      (parseInt(jobCard.rejectedQuantity) || 0) +
      (parseInt(jobCard.reworkQuantity) || 0)
    if (total > 0 && accounted >= total) return 'completed'
    return jobCard.status || 'pending'
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

      // Status filter — same derived status the badge shows
      if (statusFilter !== 'all') {
        if (getDerivedCardStatus(jobCard) !== statusFilter) return false
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

  // pipeline strip + bottleneck need aggregated data from the start,
  // not only after the tab is clicked
  useEffect(() => {
    if (planDetails?.id && jobCards.length > 0) loadAggregatedQualityData()
  }, [planDetails?.id, jobCards.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // single-job-card plans: pre-select it so the Steps tab is never
  // mysteriously disabled — and load its step data, or the tab opens
  // onto a false "No steps initialized" empty state
  useEffect(() => {
    if (jobCards.length === 1 && !selectedJobCardForSteps) {
      setSelectedJobCardForSteps(jobCards[0])
      loadStepProgressData(jobCards[0].jobCardId || jobCards[0].id)
    }
  }, [jobCards]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewAggregatedQuality = () => {
    setActiveViewTab('aggregated')
    loadAggregatedQualityData()
  }

  // ─── RETHINK: one unit-flow model + a computed next action ───
  // The page's job is to answer, in order: (1) where do the units stand,
  // (2) what should I do next, (3) where are they stuck. Everything below
  // derives from ONE consistent decomposition of plan.quantity.
  const unitFlow = useMemo(() => {
    const total = planDetails?.quantity || 0
    // "done" = dispatch-accepted units (same semantics as the listing's
    // completedQuantity). statistics.completedQuantity was fed by a backend
    // dead-read and job-card completion flags that are never set — it showed
    // 0/11 with a blue bar on COMPLETED plans.
    const accepted = jobCards.reduce(
      (s, c) => s + (parseInt(c.acceptedQuantity) || 0), 0
    )
    const done = Math.max(
      accepted,
      planDetails?.statistics?.completedQuantity || 0
    )
    const rejected = jobCards.reduce((s, c) => s + (parseInt(c.rejectedQuantity) || 0), 0)
    const rework = jobCards.reduce((s, c) => s + (parseInt(c.reworkQuantity) || 0), 0)
    const allocated = jobCards.reduce((s, c) => s + (parseInt(c.quantity) || 0), 0)
    const unallocated = Math.max(0, total - allocated)
    const inProd = Math.max(0, total - done - rejected - rework - unallocated)
    return {
      total, done, rejected, rework, unallocated, inProd,
      pct: total > 0 ? Math.round((done / total) * 100) : 0
    }
  }, [planDetails, jobCards])

  // first pipeline step that still holds pending units = the bottleneck
  const bottleneckStep = useMemo(
    () => (aggregatedQualityData || []).find(st => (st.pendingQuantity || 0) > 0) || null,
    [aggregatedQualityData]
  )

  const nextAction = useMemo(() => {
    if (!planDetails) return null
    if (planDetails.isCompleted) {
      return {
        tone: 'done',
        text: childReworkPlans.length > 0
          ? 'Plan completed — its remaining units continue in the rework plans below.'
          : 'Plan completed — output has been added to inventory.'
      }
    }
    if (jobCards.length === 0) {
      return {
        tone: 'todo',
        text: `All ${unitFlow.total.toLocaleString()} units are waiting for a job card.`,
        actionLabel: 'Create Job Card',
        onClick: handleCreateJobCard
      }
    }
    if (unitFlow.rejected > 0) {
      return {
        tone: 'alert',
        text: `${unitFlow.rejected} rejected unit${unitFlow.rejected !== 1 ? 's' : ''} need a decision — return, rework or discard.`,
        actionLabel: 'Open Rejected Stock',
        onClick: () => navigate('/rejected-stock')
      }
    }
    if (bottleneckStep) {
      return {
        tone: 'todo',
        text: `${bottleneckStep.pendingQuantity} unit${bottleneckStep.pendingQuantity !== 1 ? 's' : ''} waiting at ${bottleneckStep.stepName}.`,
        actionLabel: 'Open Step Tracking',
        onClick: handleViewAggregatedQuality
      }
    }
    if (unitFlow.unallocated > 0) {
      return {
        tone: 'todo',
        text: `${unitFlow.unallocated} unit${unitFlow.unallocated !== 1 ? 's' : ''} not on any job card yet.`,
        actionLabel: 'Create Job Card',
        onClick: handleCreateJobCard
      }
    }
    return {
      tone: 'ok',
      text: 'Units are moving through production.',
      actionLabel: 'Open Step Tracking',
      onClick: handleViewAggregatedQuality
    }
  }, [planDetails, jobCards, unitFlow, bottleneckStep, childReworkPlans])


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

  // function declaration (hoisted) — the nextAction memo above references
  // this before a `const` here would be initialized (TDZ crash when the plan
  // arrives from Redux cache while jobCards are still loading)
  function handleCreateJobCard () {
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

      // alert() blocks the whole tab; notification surfaces the same info
      notification.success({
        message: 'Materials requested',
        description: `${requestData.quantityRequested} units requested from inventory. The warehouse will see it on the Inventory Requests page.`
      })

      setInventoryRequestModalVisible(false)
      setSelectedStepForInventory(null)

      // reload step data → StepManagementView refetches its material state,
      // so the inventory step's status line flips to "requested" immediately
      if (requestData.jobCardId) loadStepProgressData(requestData.jobCardId)
    } catch (error) {
      console.error('Failed to create inventory request:', error)
      notification.error({
        message: 'Request failed',
        // backend messages carry the budget math ("plan quantity X, already
        // requested Y") — show them verbatim
        description: error?.message || 'Please try again.'
      })
    } finally {
      setInventoryRequestSubmitting(false)
    }
  }

  // no bg overrides on these states — the layout's warm #F8F4F0 shows through
  // (the old slate gradient flashed a cool gray page during load)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#f26c2d' }}></div>
          <p className="text-slate-600">Loading production plan...</p>
        </div>
      </div>
    )
  }

  if (!planDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg mb-2">Production plan not found</p>
          <p className="text-slate-500 text-sm mb-4">Plan ID: {planId}</p>
          <button
            onClick={() => navigate('/production-plans-v2')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#f26c2d] text-white rounded-full hover:bg-[#e05a1e] transition-colors"
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
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5' }}>
        <div className="max-w-screen-2xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate('/production-plans-v2')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 36, padding: '0 14px', borderRadius: 999,
                border: '1px solid #e5e5e5', background: 'white',
                fontFamily: "'Inter', sans-serif", fontSize: 13,
                color: 'rgba(26,26,26,0.7)', cursor: 'pointer'
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Plans
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setEditModalVisible(true)}
                disabled={planDetails.isCompleted}
                title={planDetails.isCompleted ? 'Completed plans cannot be edited' : undefined}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 40, padding: '0 18px', borderRadius: 999,
                  border: '1px solid #a0a0a8', background: 'white',
                  fontFamily: "'Inter', sans-serif", fontSize: 14,
                  color: '#1a1a1a',
                  cursor: planDetails.isCompleted ? 'not-allowed' : 'pointer',
                  opacity: planDetails.isCompleted ? 0.45 : 1
                }}
              >
                <Edit2 className="h-4 w-4" />
                Edit Plan
              </button>
              <button
                onClick={handleCreateJobCard}
                disabled={planDetails.isCompleted}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 40, padding: '0 18px', borderRadius: 999,
                  border: 'none', background: '#f26c2d',
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
                  color: 'white',
                  cursor: planDetails.isCompleted ? 'not-allowed' : 'pointer',
                  opacity: planDetails.isCompleted ? 0.45 : 1
                }}
              >
                <Plus className="h-4 w-4" />
                Create Job Card
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1
              style={{
                fontFamily: "'Staff Wide Test', serif",
                fontSize: 34, fontWeight: 400, color: '#1a1a1a',
                margin: 0, lineHeight: '38px'
              }}
            >
              Production Plan #{planDetails.id}
            </h1>
            {planDetails.isRework && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 13px', borderRadius: 999, fontSize: 12,
                fontFamily: "'Inter', sans-serif", color: '#1a1a1a',
                background: '#f5f3ff', border: '1px solid rgba(124,58,237,0.25)'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }} />
                Rework
              </span>
            )}
            {planDetails.urgent ? (
              <StatusBadge variant="unpaid">Urgent</StatusBadge>
            ) : null}
            {planDetails.isCompleted ? (
              <StatusBadge variant="dispatched">Completed</StatusBadge>
            ) : (
              <StatusBadge variant="inprod">
                {(planDetails.currentStepStatus || 'in production').replace('_', ' ')}
              </StatusBadge>
            )}
          </div>

          <div
            className="flex items-center gap-5 flex-wrap"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(26,26,26,0.6)' }}
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Created {moment(planDetails.createdAt).format('MMM DD, YYYY [at] HH:mm')}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              By {planDetails.createdBy || 'Unknown'}
            </span>
            <span style={{ width: 1, height: 14, background: '#e5e5e5' }} />
            <span className="flex items-center gap-1.5" style={{ color: '#1a1a1a', fontWeight: 500 }}>
              <Package className="h-4 w-4" style={{ color: '#4a90ff' }} />
              Total: {totalQuantity.toLocaleString()} units
            </span>
            <span className="flex items-center gap-1.5" style={{ color: '#1a1a1a', fontWeight: 500 }}>
              <Clock className="h-4 w-4" style={{ color: '#f26c2d' }} />
              Pending: {remainingQuantity.toLocaleString()} units
            </span>
          </div>
        </div>
      </div>

      {/* Rework Banner - shown if this plan is a rework plan */}
      {planDetails.isRework && planDetails.parentPlanId && (
        <div className="max-w-screen-2xl mx-auto px-6 pt-4">
          <div className="bg-purple-50 border border-purple-200 rounded-[20px] p-4 flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold text-purple-800">This is a Rework Plan</span>
              <span className="text-purple-600 ml-2">
                Created from rejected units of{' '}
                <button
                  className="underline font-semibold hover:text-purple-900"
                  onClick={() => navigate(`/production-plan/${planDetails.parentPlanId}`)}
                >
                  Plan #{planDetails.parentPlanId}
                </button>
              </span>
            </div>
            <button
              className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
              onClick={() => navigate(`/production-plan/${planDetails.parentPlanId}`)}
            >
              View Parent Plan <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* ── WHERE THINGS STAND — one flow bar, one next action ── */}
        <div className="bg-white rounded-[20px] shadow-sm border border-[#e5e5e5] overflow-hidden">
          <div className="px-6 py-5">
            <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-slate-800 m-0">Where things stand</h3>
              <div className="text-sm text-slate-500">
                <span className="text-2xl font-bold text-slate-800">{unitFlow.done.toLocaleString()}</span>
                <span className="text-slate-400"> / {unitFlow.total.toLocaleString()} completed</span>
                <span className="ml-2 font-semibold text-slate-700">{unitFlow.pct}%</span>
              </div>
            </div>

            {/* segmented unit-flow bar — same vocabulary as the listing */}
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-200 mb-2">
              {unitFlow.done > 0 && (
                <div className="bg-green-500" style={{ width: `${(unitFlow.done / unitFlow.total) * 100}%` }} title={`${unitFlow.done} completed`} />
              )}
              {unitFlow.inProd > 0 && (
                <div className="bg-blue-500" style={{ width: `${(unitFlow.inProd / unitFlow.total) * 100}%` }} title={`${unitFlow.inProd} in production`} />
              )}
              {unitFlow.rework > 0 && (
                <div className="bg-purple-500" style={{ width: `${(unitFlow.rework / unitFlow.total) * 100}%` }} title={`${unitFlow.rework} in rework`} />
              )}
              {unitFlow.rejected > 0 && (
                <div className="bg-red-500" style={{ width: `${(unitFlow.rejected / unitFlow.total) * 100}%` }} title={`${unitFlow.rejected} rejected`} />
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-4">
              {unitFlow.done > 0 && (
                <span className="text-green-700 font-medium"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />{unitFlow.done} completed</span>
              )}
              {unitFlow.inProd > 0 && (
                <span className="text-blue-700"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />{unitFlow.inProd} in production</span>
              )}
              {unitFlow.rework > 0 && (
                <span className="text-purple-700 font-medium"><span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1" />{unitFlow.rework} in rework</span>
              )}
              {unitFlow.rejected > 0 && (
                <span className="text-red-700 font-medium"><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />{unitFlow.rejected} rejected</span>
              )}
              {unitFlow.unallocated > 0 && (
                <span className="text-slate-500"><span className="inline-block w-2 h-2 rounded-full bg-slate-300 mr-1" />{unitFlow.unallocated} unallocated</span>
              )}
            </div>

            {/* NEXT ACTION — the page tells you what to do, not just what is */}
            {nextAction && (
              <div
                className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                style={{
                  background:
                    nextAction.tone === 'done' ? '#d9fae6'
                    : nextAction.tone === 'alert' ? '#fef2f2'
                    : nextAction.tone === 'ok' ? '#ecfeff'
                    : '#fff7ed',
                  border: `1px solid ${
                    nextAction.tone === 'done' ? 'rgba(78,203,113,0.25)'
                    : nextAction.tone === 'alert' ? 'rgba(229,62,62,0.25)'
                    : nextAction.tone === 'ok' ? 'rgba(8,145,178,0.25)'
                    : 'rgba(242,108,45,0.25)'
                  }`
                }}
              >
                <div className="flex items-center gap-2 text-sm" style={{ fontFamily: "'Inter', sans-serif", color: '#1a1a1a' }}>
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background:
                        nextAction.tone === 'done' ? '#4ecb71'
                        : nextAction.tone === 'alert' ? '#e53e3e'
                        : nextAction.tone === 'ok' ? '#0891b2'
                        : '#f26c2d'
                    }}
                  />
                  <span className="font-semibold mr-1">Next:</span>
                  {nextAction.text}
                </div>
                {nextAction.actionLabel && (
                  <button
                    onClick={nextAction.onClick}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      height: 34, padding: '0 16px', borderRadius: 999,
                      border: 'none', background: '#f26c2d', color: 'white',
                      fontFamily: "'Inter', sans-serif", fontSize: 13,
                      fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {nextAction.actionLabel}
                  </button>
                )}
              </div>
            )}

            {/* conversion */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 rounded-2xl px-4 py-3 border" style={{ background: '#f8fafc', borderColor: '#e5e5e5' }}>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5 m-0">Source material</p>
                <div className="text-sm font-semibold text-slate-800">
                  {planDetails.alloyName || planDetails.sourceProduct || `Alloy ${planDetails.alloyId}`}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 rounded-2xl px-4 py-3 border" style={{ background: '#f0fdf4', borderColor: 'rgba(78,203,113,0.25)' }}>
                <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide mb-0.5 m-0">Target product</p>
                <div className="text-sm font-semibold text-slate-800">
                  {planDetails.convertName || planDetails.targetProduct || `Alloy ${planDetails.convertToAlloyId}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PRODUCTION PIPELINE — where the units are, step by step ── */}
        {aggregatedQualityData.length > 0 && (
          <div className="bg-white rounded-[20px] shadow-sm border border-[#e5e5e5] px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 m-0">Production pipeline</h3>
              <button
                onClick={handleViewAggregatedQuality}
                className="text-xs font-medium"
                style={{ color: '#f26c2d', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Open step tracking →
              </button>
            </div>
            <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
              {aggregatedQualityData.map((st, i) => {
                const started = (st.inputQuantity || 0) > 0
                const pending = st.pendingQuantity || 0
                const isBottleneck = bottleneckStep && bottleneckStep.stepOrder === st.stepOrder
                return (
                  <React.Fragment key={st.stepOrder || i}>
                    {i > 0 && (
                      <div className="self-center text-slate-300 flex-shrink-0">›</div>
                    )}
                    <button
                      onClick={handleViewAggregatedQuality}
                      className="flex-1 min-w-[110px] rounded-xl px-3 py-2 text-left border transition-colors"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        cursor: 'pointer',
                        background: isBottleneck ? '#fff7ed' : started && pending === 0 ? '#f0fdf4' : 'white',
                        borderColor: isBottleneck ? 'rgba(242,108,45,0.4)' : started && pending === 0 ? 'rgba(78,203,113,0.25)' : '#e5e5e5'
                      }}
                    >
                      <div className="text-[11px] font-medium truncate" style={{ color: 'rgba(26,26,26,0.6)' }}>
                        {i + 1}. {st.stepName}
                      </div>
                      <div className="text-sm font-semibold" style={{ color: isBottleneck ? '#f26c2d' : started && pending === 0 ? '#15803d' : '#a0a0a8' }}>
                        {started
                          ? pending > 0
                            ? `${pending} pending`
                            : '✓ clear'
                          : '—'}
                      </div>
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PRODUCTION TRACKING — job cards, per-card steps, aggregated steps ── */}
        <div className="bg-white rounded-[20px] shadow-sm border border-[#e5e5e5] overflow-hidden">
          <div className="px-6 pt-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-lg font-semibold text-slate-800 m-0">Production Tracking</h3>

              {activeViewTab === 'overview' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      height: 36, padding: '0 16px', borderRadius: 999,
                      border: '1px solid #e5e5e5',
                      background: showFilters ? '#f3f3f5' : 'white',
                      color: '#1a1a1a', fontFamily: "'Inter', sans-serif",
                      fontSize: 13, fontWeight: 500, cursor: 'pointer'
                    }}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                    {(searchTerm || statusFilter !== 'all' || stepFilter !== 'all' || qualityFilter !== 'all') && (
                      <span style={{
                        background: '#f26c2d', color: 'white', fontSize: 11, fontWeight: 600,
                        borderRadius: 999, minWidth: 18, height: 18, lineHeight: '18px',
                        textAlign: 'center', padding: '0 4px'
                      }}>
                        {[searchTerm, statusFilter !== 'all', stepFilter !== 'all', qualityFilter !== 'all'].filter(Boolean).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={refreshJobCards}
                    title='Refresh job cards'
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 36, height: 36, borderRadius: 999,
                      border: '1px solid #e5e5e5', background: 'white',
                      color: '#1a1a1a', cursor: 'pointer'
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCreateJobCard}
                    disabled={!!planDetails.isCompleted}
                    title={planDetails.isCompleted ? 'Plan is completed' : undefined}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      height: 36, padding: '0 18px', borderRadius: 999, border: 'none',
                      background: planDetails.isCompleted ? '#f5c9b3' : '#f26c2d',
                      color: 'white', fontFamily: "'Inter', sans-serif",
                      fontSize: 13, fontWeight: 500,
                      cursor: planDetails.isCompleted ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Create Job Card
                  </button>
                </div>
              )}
            </div>

            {/* Tabs appear only when reachable: Step Tracking needs a selected
                job card, Aggregated needs at least one job card */}
            <TabBar
              tabs={[
                { key: 'overview', label: 'Job Cards' },
                ...(selectedJobCardForSteps
                  ? [{ key: 'steps', label: `Step Tracking · #${selectedJobCardForSteps.jobCardId || selectedJobCardForSteps.id}` }]
                  : []),
                ...(jobCards.length > 0
                  ? [{ key: 'aggregated', label: 'Aggregated Quality' }]
                  : [])
              ]}
              activeKey={activeViewTab}
              onChange={key => {
                if (key === 'aggregated') handleViewAggregatedQuality()
                else setActiveViewTab(key)
              }}
              counts={{
                overview: filteredJobCards.length,
                ...(jobCards.length > 0 ? { aggregated: jobCards.length } : {})
              }}
            />

            {/* Filters Panel - Only show in overview tab */}
            {activeViewTab === 'overview' && showFilters && (
              <div
                className="rounded-2xl p-4 mb-4 border"
                style={{ background: '#f8fafc', borderColor: '#e5e5e5', fontFamily: "'Inter', sans-serif" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Filter job cards</span>
                  <button
                    onClick={clearFilters}
                    className="text-sm flex items-center gap-1"
                    style={{ color: '#f26c2d', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    <X className="h-3 w-3" />
                    Clear all
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Search */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Job Card ID or Step..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-full text-sm focus:outline-none"
                        style={{ border: '1px solid #e5e5e5', background: 'white', color: '#1a1a1a' }}
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-full text-sm focus:outline-none"
                      style={{ border: '1px solid #e5e5e5', background: 'white', color: '#1a1a1a' }}
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
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Current Step</label>
                    <select
                      value={stepFilter}
                      onChange={(e) => setStepFilter(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-full text-sm focus:outline-none"
                      style={{ border: '1px solid #e5e5e5', background: 'white', color: '#1a1a1a' }}
                    >
                      <option value="all">All Steps</option>
                      {uniqueSteps.map(step => (
                        <option key={step} value={step}>{step}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quality Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Quality</label>
                    <select
                      value={qualityFilter}
                      onChange={(e) => setQualityFilter(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-full text-sm focus:outline-none"
                      style={{ border: '1px solid #e5e5e5', background: 'white', color: '#1a1a1a' }}
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#f26c2d' }}></div>
              </div>
            ) : jobCards.length === 0 ? (
              <div className="text-center py-12" style={{ fontFamily: "'Inter', sans-serif" }}>
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-medium mb-1" style={{ color: '#1a1a1a' }}>No job cards yet</p>
                <p className="text-slate-500 text-sm mb-4">Create the first job card to start production</p>
                {!planDetails.isCompleted && (
                  <button
                    onClick={handleCreateJobCard}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      height: 38, padding: '0 20px', borderRadius: 999, border: 'none',
                      background: '#f26c2d', color: 'white',
                      fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer'
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Create First Job Card
                  </button>
                )}
              </div>
            ) : filteredJobCards.length === 0 ? (
              <div className="text-center py-12" style={{ fontFamily: "'Inter', sans-serif" }}>
                <Filter className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-medium mb-1" style={{ color: '#1a1a1a' }}>No job cards match your filters</p>
                <p className="text-slate-500 text-sm mb-4">Try adjusting the filter criteria</p>
                <button
                  onClick={clearFilters}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    height: 38, padding: '0 20px', borderRadius: 999,
                    border: '1px solid #e5e5e5', background: 'white', color: '#1a1a1a',
                    fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontFamily: "'Inter', sans-serif", borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f3f3f5' }}>
                      <th className="text-left py-3 px-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Job Card</th>
                      <th className="text-left py-3 px-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Unit Breakdown</th>
                      <th className="text-left py-3 px-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Quality</th>
                      <th className="text-left py-3 px-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Current Step</th>
                      <th className="text-left py-3 px-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Status</th>
                      <th className="text-center py-3 px-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobCards.map((card) => {
                      const total = parseInt(card.quantity) || 0
                      const accepted = parseInt(card.acceptedQuantity) || 0
                      const rejected = parseInt(card.rejectedQuantity) || 0
                      const rework = parseInt(card.reworkQuantity) || 0
                      const inProd = Math.max(0, total - accepted - rejected - rework)
                      const judged = accepted + rejected
                      const qualityStatus = getQualityStatus(card)
                      const qualityRate = judged > 0 ? Math.round((accepted / judged) * 100) : null
                      const statusBadge = JOB_CARD_STATUS_BADGE[getDerivedCardStatus(card)] || JOB_CARD_STATUS_BADGE.pending
                      const stepsActive = selectedJobCardForSteps?.id === card.id

                      return (
                        <tr key={card.id} className="hover:bg-[#fafafa] transition-colors" style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>#{card.jobCardId || card.id}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{moment(card.createdAt).format('MMM DD, YYYY')}</div>
                          </td>
                          {/* same segment palette + wording as the hero bar */}
                          <td className="py-4 px-6" style={{ minWidth: 200 }}>
                            <div className="text-sm mb-1.5" style={{ color: '#1a1a1a' }}>
                              <span className="font-semibold">{accepted.toLocaleString()}</span>
                              <span className="text-slate-400"> / {total.toLocaleString()} accepted</span>
                            </div>
                            {total > 0 && (
                              <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 mb-1.5" style={{ maxWidth: 220 }}>
                                {accepted > 0 && <div className="bg-green-500" style={{ width: `${(accepted / total) * 100}%` }} />}
                                {inProd > 0 && <div className="bg-blue-500" style={{ width: `${(inProd / total) * 100}%` }} />}
                                {rework > 0 && <div className="bg-purple-500" style={{ width: `${(rework / total) * 100}%` }} />}
                                {rejected > 0 && <div className="bg-red-500" style={{ width: `${(rejected / total) * 100}%` }} />}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                              {inProd > 0 && (
                                <span className="text-blue-700"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />{inProd} in production</span>
                              )}
                              {rework > 0 && (
                                <span className="text-purple-700 font-medium"><span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1" />{rework} in rework</span>
                              )}
                              {rejected > 0 && (
                                <span className="text-red-700 font-medium"><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />{rejected} rejected</span>
                              )}
                              {total > 0 && inProd === 0 && rework === 0 && rejected === 0 && accepted >= total && (
                                <span className="text-green-700 font-medium"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />all accepted</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <StatusBadge
                              variant={QUALITY_BADGE_VARIANT[qualityStatus.status] || 'pending'}
                              subText={qualityRate !== null ? `${qualityRate}% of judged units` : undefined}
                            >
                              {qualityStatus.status.charAt(0).toUpperCase() + qualityStatus.status.slice(1)}
                            </StatusBadge>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm" style={{ color: card.currentStepName ? '#1a1a1a' : '#a0a0a8' }}>
                              {card.currentStepName || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <StatusBadge variant={statusBadge.variant}>{statusBadge.label}</StatusBadge>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewStepProgress(card)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  height: 32, padding: '0 14px', borderRadius: 999,
                                  fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                                  background: stepsActive && activeViewTab === 'steps' ? '#7c3aed' : '#faf5ff',
                                  color: stepsActive && activeViewTab === 'steps' ? 'white' : '#7c3aed',
                                  border: '1px solid #e9d5ff'
                                }}
                              >
                                <BarChart3 className="h-3.5 w-3.5" />
                                Steps
                              </button>
                              <button
                                onClick={() => handleViewDetails(card)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  height: 32, padding: '0 14px', borderRadius: 999,
                                  fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                                  background: 'white', color: '#1a1a1a', border: '1px solid #e5e5e5'
                                }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                              {/* the old "Edit" button here had NO onClick — dead affordance, removed */}
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
              <div className="px-6 pb-6">
                {/* Job Card Info Header — purple = the rework/steps identity */}
                <div
                  className="rounded-2xl p-4 mb-5 border flex items-center justify-between flex-wrap gap-3"
                  style={{ background: '#faf5ff', borderColor: '#e9d5ff', fontFamily: "'Inter', sans-serif" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ background: '#7c3aed' }}>
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: '#1a1a1a' }}>
                        Job Card #{selectedJobCardForSteps.jobCardId || selectedJobCardForSteps.id}
                      </div>
                      <div className="text-sm text-slate-500">
                        {selectedJobCardForSteps.quantity?.toLocaleString()} units · created {moment(selectedJobCardForSteps.createdAt).format('MMM DD, YYYY')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => loadStepProgressData(selectedJobCardForSteps.jobCardId || selectedJobCardForSteps.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      height: 34, padding: '0 16px', borderRadius: 999,
                      border: '1px solid #e9d5ff', background: 'white', color: '#7c3aed',
                      fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer'
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Steps
                  </button>
                </div>

                {/* Step Management View */}
                <StepManagementView
                  jobCard={selectedJobCardForSteps}
                  stepProgressData={stepProgressData}
                  onProcessStep={handleProcessStep}
                  onRequestInventory={handleRequestInventory}
                  loading={stepProgressLoading}
                  planCompleted={!!planDetails.isCompleted}
                  isReworkPlan={!!planDetails.isRework}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16" style={{ fontFamily: "'Inter', sans-serif" }}>
                <BarChart3 className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-base font-medium mb-1" style={{ color: '#1a1a1a' }}>No job card selected</p>
                <p className="text-slate-500 text-sm">Click "Steps" on any job card to see its step-by-step quality tracking</p>
              </div>
            )
          ) : (
            // Aggregated Quality Tracking Tab (All Job Cards)
            <div className="px-6 pb-6">
              {/* Aggregated Info Header */}
              <div
                className="rounded-2xl p-4 mb-5 border flex items-center justify-between flex-wrap gap-3"
                style={{ background: '#f8fafc', borderColor: '#e5e5e5', fontFamily: "'Inter', sans-serif" }}
              >
                <div>
                  <div className="font-semibold" style={{ color: '#1a1a1a' }}>Step-wise quality — all job cards</div>
                  <div className="text-sm text-slate-500">
                    {jobCards.length} job card{jobCards.length !== 1 ? 's' : ''} · {qualityMetrics.total.toLocaleString()} units total
                  </div>
                </div>
                <button
                  onClick={loadAggregatedQualityData}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    height: 34, padding: '0 16px', borderRadius: 999,
                    border: '1px solid #e5e5e5', background: 'white', color: '#1a1a1a',
                    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              {/* Aggregated Step Management View */}
              {aggregatedQualityLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#f26c2d' }}></div>
                  <p className="ml-3 text-slate-600">Loading aggregated quality data...</p>
                </div>
              ) : aggregatedQualityData.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: '#e5e5e5' }}>
                  <table className="w-full" style={{ fontFamily: "'Inter', sans-serif", borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f3f3f5' }}>
                        <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Step</th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Job Card</th>
                        <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Input</th>
                        <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(26,26,26,0.55)' }}>
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 align-middle" />Accepted
                        </th>
                        <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(26,26,26,0.55)' }}>
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 align-middle" />Rejected
                        </th>
                        <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(26,26,26,0.55)' }}>
                          <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: '#f26c2d' }} />Pending
                        </th>
                        <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(26,26,26,0.55)' }}>
                          <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1.5 align-middle" />Rework
                        </th>
                        <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Updated</th>
                        <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Status</th>
                        <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.55)' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedQualityData.map((step, stepIndex) => {
                        const isBottleneck = bottleneckStep && bottleneckStep.stepOrder === step.stepOrder
                        return (
                        <React.Fragment key={step.id || stepIndex}>
                          {/* Show job card breakdown rows */}
                          {step.jobCardBreakdown && step.jobCardBreakdown.length > 0 ? (
                            step.jobCardBreakdown.map((jcBreakdown, jcIndex) => {
                              const rowStatusBadge =
                                jcBreakdown.status === 'completed'
                                  ? { variant: 'paid', label: 'Completed' }
                                  : jcBreakdown.status === 'in_progress'
                                  ? { variant: 'inprod', label: 'In Progress' }
                                  : { variant: 'pending', label: 'Pending' }
                              return (
                              <tr key={`${stepIndex}-${jcIndex}`} className="hover:bg-[#fafafa]" style={{ borderBottom: '1px solid #f0f0f0' }}>
                                {/* Step info - only show for first job card; the
                                    bottleneck step (same one the pipeline strip
                                    highlights) gets the orange treatment */}
                                {jcIndex === 0 && (
                                  <td
                                    rowSpan={step.jobCardBreakdown.length}
                                    className="py-3 px-5"
                                    style={{
                                      background: isBottleneck ? '#fff7ed' : '#fafafa',
                                      borderRight: '1px solid #f0f0f0'
                                    }}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className="flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs flex-shrink-0"
                                        style={{ background: isBottleneck ? '#f26c2d' : '#1a1a1a', color: 'white' }}
                                      >
                                        {step.stepOrder}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>{step.stepName}</div>
                                        {isBottleneck && (
                                          <div className="text-[11px] font-medium" style={{ color: '#f26c2d' }}>bottleneck</div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                )}
                                {/* Job card info */}
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>#{jcBreakdown.jobCardId}</span>
                                </td>
                                {/* Quantities — zeros muted so the eye lands on real numbers */}
                                <td className="text-center py-3 px-4 text-sm" style={{ color: jcBreakdown.inputQuantity === 0 ? '#d1d5db' : '#1a1a1a' }}>{jcBreakdown.inputQuantity.toLocaleString()}</td>
                                <td className="text-center py-3 px-4 text-sm font-medium" style={{ color: jcBreakdown.acceptedQuantity === 0 ? '#d1d5db' : '#15803d' }}>{jcBreakdown.acceptedQuantity.toLocaleString()}</td>
                                <td className="text-center py-3 px-4 text-sm font-medium" style={{ color: jcBreakdown.rejectedQuantity === 0 ? '#d1d5db' : '#b91c1c' }}>{jcBreakdown.rejectedQuantity.toLocaleString()}</td>
                                <td className="text-center py-3 px-4 text-sm font-medium" style={{ color: jcBreakdown.pendingQuantity === 0 ? '#d1d5db' : '#c2410c' }}>{jcBreakdown.pendingQuantity.toLocaleString()}</td>
                                <td className="text-center py-3 px-4 text-sm font-medium" style={{ color: jcBreakdown.reworkQuantity === 0 ? '#d1d5db' : '#6d28d9' }}>{jcBreakdown.reworkQuantity.toLocaleString()}</td>
                                <td className="text-center py-3 px-4 text-xs text-slate-500">
                                  {jcBreakdown.processedAt ? moment(jcBreakdown.processedAt).format('MMM DD, HH:mm') :
                                   moment(jcBreakdown.createdAt).format('MMM DD, HH:mm')}
                                </td>
                                <td className="text-center py-3 px-4">
                                  <StatusBadge variant={rowStatusBadge.variant}>{rowStatusBadge.label}</StatusBadge>
                                </td>
                                <td className="text-center py-3 px-4">
                                  {/* Process only while there is genuinely
                                      something to process — a completed row
                                      kept input>0 so the old check left the
                                      button live on finished steps/plans */}
                                  {!planDetails.isCompleted &&
                                  jcBreakdown.status !== 'completed' &&
                                  jcBreakdown.pendingQuantity > 0 ? (
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
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f26c2d] text-white rounded-full hover:bg-[#e05a1e] transition-colors text-xs font-medium"
                                    >
                                      <Settings className="h-3.5 w-3.5" />
                                      Process
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                      {planDetails.isCompleted
                                        ? 'Plan completed'
                                        : jcBreakdown.status === 'completed'
                                        ? 'Completed'
                                        : jcBreakdown.inputQuantity > 0
                                        ? '✓ Cleared'
                                        : 'Awaiting input'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                              )
                            })
                          ) : (
                            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td className="py-3 px-5" style={{ background: '#fafafa', borderRight: '1px solid #f0f0f0' }}>
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs flex-shrink-0"
                                    style={{ background: '#1a1a1a', color: 'white' }}
                                  >
                                    {step.stepOrder}
                                  </div>
                                  <span className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>{step.stepName}</span>
                                </div>
                              </td>
                              <td colSpan="9" className="py-3 px-4 text-center text-slate-400 italic text-sm">
                                No job card data
                              </td>
                            </tr>
                          )}
                          {/* Total row for this step - only show if multiple job cards */}
                          {jobCards.length > 1 && (
                            <tr className="font-semibold" style={{ background: '#f7f7f8', borderBottom: '2px solid #e5e5e5' }}>
                              <td className="py-2 px-5"></td>
                              <td className="py-2 px-4 text-xs uppercase tracking-wide" style={{ color: 'rgba(26,26,26,0.55)' }}>Step total</td>
                              <td className="text-center py-2 px-4 text-sm" style={{ color: '#1a1a1a' }}>{step.inputQuantity.toLocaleString()}</td>
                              <td className="text-center py-2 px-4 text-sm" style={{ color: '#15803d' }}>{step.acceptedQuantity.toLocaleString()}</td>
                              <td className="text-center py-2 px-4 text-sm" style={{ color: '#b91c1c' }}>{step.rejectedQuantity.toLocaleString()}</td>
                              <td className="text-center py-2 px-4 text-sm" style={{ color: '#c2410c' }}>{step.pendingQuantity.toLocaleString()}</td>
                              <td className="text-center py-2 px-4 text-sm" style={{ color: '#6d28d9' }}>{step.reworkQuantity.toLocaleString()}</td>
                              <td className="text-center py-2 px-4 text-slate-300">—</td>
                              <td className="text-center py-2 px-4 text-slate-300">—</td>
                              <td className="text-center py-2 px-4 text-slate-300">—</td>
                            </tr>
                          )}
                        </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <AlertCircle className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-base font-medium mb-1" style={{ color: '#1a1a1a' }}>No quality tracking data yet</p>
                  <p className="text-slate-500 text-sm mb-4">No step progress recorded for any job card in this plan</p>
                  <button
                    onClick={loadAggregatedQualityData}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      height: 38, padding: '0 20px', borderRadius: 999,
                      border: '1px solid #e5e5e5', background: 'white', color: '#1a1a1a',
                      fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer'
                    }}
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
          <div className="bg-white rounded-[20px] shadow-sm border border-[#e5e5e5] p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Notes
            </h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-slate-700">{planDetails.note}</p>
            </div>
          </div>
        )}

        {/* Child Rework Plans - shown for original plans that have rework plans */}
        {!planDetails.isRework && (childReworkPlansLoading || childReworkPlans.length > 0) && (
          <div className="bg-white rounded-[20px] shadow-sm border border-purple-200 overflow-hidden">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-800">
                Rework Plans
              </h3>
              {!childReworkPlansLoading && (
                <span className="ml-auto text-sm text-purple-600">{childReworkPlans.length} plan{childReworkPlans.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="p-6">
              {childReworkPlansLoading ? (
                <div className="text-center py-4 text-slate-500">Loading rework plans...</div>
              ) : (
                <div className="space-y-3">
                  {childReworkPlans.map(rp => {
                    const rpPending = rp.quantityTracking?.inProgressQuantity || 0
                    const rpAccepted = rp.quantityTracking?.dispatchAcceptedQuantity || 0
                    const rpRejected = rp.quantityTracking?.rejectedQuantity || 0
                    return (
                      <div key={rp.id} className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-lg p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-purple-800">Plan #{rp.id}</span>
                            {rp.urgent === 1 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">URGENT</span>}
                          </div>
                          <div className="text-sm text-slate-600">{rp.targetProduct || rp.sourceProduct}</div>
                          <div className="text-xs text-slate-500 mt-1 flex gap-4">
                            <span>Total: <strong>{rp.quantity}</strong></span>
                            <span>Pending: <strong>{rpPending}</strong></span>
                            <span className="text-green-600">Accepted: <strong>{rpAccepted}</strong></span>
                            {rpRejected > 0 && <span className="text-red-600">Rejected: <strong>{rpRejected}</strong></span>}
                          </div>
                        </div>
                        <button
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1 ml-4"
                          onClick={() => navigate(`/production-plan/${rp.id}`)}
                        >
                          View Plan <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
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

      {/* Edit Plan Modal — the header button was previously a dead affordance */}
      <EditProductionPlanModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        planData={planDetails}
        onSuccess={() => {
          setEditModalVisible(false)
          loadPlanDetails()
        }}
      />

      {/* Inventory Request Modal */}
      {selectedStepForInventory && (
        <InventoryRequestModal
          visible={inventoryRequestModalVisible}
          stepProgress={selectedStepForInventory}
          jobCard={selectedStepForInventory.jobCard}
          planId={planDetails?.id}
          planQuantity={planDetails?.quantity}
          planAlloyName={planDetails?.alloyName || planDetails?.sourceProduct}
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
