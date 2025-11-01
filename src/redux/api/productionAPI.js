import { createAsyncThunk } from '@reduxjs/toolkit'
import { client, getError } from '../../Utils/axiosClient'
import { mockApiResponses } from '../../Utils/mockProductionData'

// Development mode flag - set to true to use mock data
const USE_MOCK_DATA = false

// Get production plans with enhanced quantity tracking
export const getProductionPlansWithQuantities = createAsyncThunk(
  'production/getProductionPlansWithQuantities',
  async (
    { page = 1, limit = 10, search = '', urgent = '', status = '', dateRange = null, alloyId = null },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (search) params.append('search', search)
      if (urgent !== '') params.append('urgent', urgent)
      if (status) params.append('status', status)
      if (alloyId) params.append('alloyId', alloyId.toString())
      if (dateRange && dateRange.length === 2) {
        params.append('startDate', dateRange[0])
        params.append('endDate', dateRange[1])
      }

      const response = await client.get(
        `/production/plans-with-quantities?${params}&_t=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      )

      return {
        productionPlans: response.data.productionPlans || [],
        pagination: response.data.pagination || {},
        summary: response.data.summary || {},
        totalCount: response.data.pagination?.totalCount || 0,
        currentPage: response.data.pagination?.currentPage || page,
        pageSize: response.data.pagination?.pageSize || limit
      }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get production plans for smart planner (optimized for smart production dashboard)
export const getProductionPlansForSmartPlanner = createAsyncThunk(
  'production/getProductionPlansForSmartPlanner',
  async (
    { page = 1, limit = 10, search = '', urgent = '', status = '', startDate = '', endDate = '', alloyId = null },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (search) params.append('search', search)
      if (urgent !== '') params.append('urgent', urgent)
      if (status) params.append('status', status)
      if (alloyId) params.append('alloyId', alloyId.toString())
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await client.get(
        `/production/plans-for-smart-planner?${params}&_t=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      )

      return {
        productionPlans: response.data.productionPlans || [],
        pagination: response.data.pagination || {},
        summary: response.data.summary || {},
        totalCount: response.data.pagination?.totalCount || 0,
        currentPage: response.data.pagination?.currentPage || page,
        pageSize: response.data.pagination?.pageSize || limit
      }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get all production plans with pagination and filters (legacy)
export const getProductionPlans = createAsyncThunk(
  'production/getProductionPlans',
  async (
    { page = 1, limit = 10, search = '', urgent = '', finish = '' },
    { rejectWithValue }
  ) => {
    try {
      if (USE_MOCK_DATA) {
        const mockResponse = mockApiResponses.getProductionPlans({ page, limit, search, urgent, finish })
        return {
          plans: mockResponse.getProdListing || [],
          totalCount: mockResponse.totalCount || 0,
          currentPage: page,
          pageSize: limit
        }
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (search) params.append('search', search)
      if (urgent !== '') params.append('urgent', urgent)
      if (finish) params.append('finish', finish)

      const response = await client.get(
        `/production/get-prod-listing?${params}`
      )
      return {
        plans: response.data.getProdListing || [],
        totalCount:
          response.data.totalCount || response.data.getProdListing?.length || 0,
        currentPage: page,
        pageSize: limit
      }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get single production plan by ID
export const getProductionPlanById = createAsyncThunk(
  'production/getProductionPlanById',
  async (planId, { rejectWithValue }) => {
    try {
      const response = await client.get(`/production/plan/${planId}`)
      return response.data.plan
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get detailed production plan information with steps and progress
export const getProductionPlanDetails = createAsyncThunk(
  'production/getProductionPlanDetails',
  async (planId, { rejectWithValue }) => {
    try {
      const response = await client.get(`/production/plan/${planId}/details`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Update production plan
export const updateProductionPlan = createAsyncThunk(
  'production/updateProductionPlan',
  async (updateData, { rejectWithValue }) => {
    try {
      const { planId, ...data } = updateData
      const response = await client.put(`/production/plan/${planId}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Create new production plan
export const createProductionPlan = createAsyncThunk(
  'production/createProductionPlan',
  async (planData, { rejectWithValue }) => {
    try {
      const response = await client.post(
        '/production/add-production-plan',
        planData
      )
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Delete production plan
export const deleteProductionPlan = createAsyncThunk(
  'production/deleteProductionPlan',
  async (planId, { rejectWithValue }) => {
    try {
      const response = await client.delete(`/production/plan/${planId}`)
      return { planId, message: response.data.message }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get production steps
export const getProductionSteps = createAsyncThunk(
  'production/getProductionSteps',
  async (_, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        const mockResponse = mockApiResponses.getProductionSteps()
        return mockResponse.result || []
      }

      const response = await client.get('/production/get-steps')
      return response.data.result || []
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get production plan steps for custom workflows
export const getProductionPlanSteps = createAsyncThunk(
  'production/getProductionPlanSteps',
  async (prodPlanId, { rejectWithValue }) => {
    try {
      const response = await client.get(`/production/plan-steps/${prodPlanId}`)
      return response.data.steps || []
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Add custom steps to production plan
export const addCustomStepsToProductionPlan = createAsyncThunk(
  'production/addCustomStepsToProductionPlan',
  async ({ prodPlanId, steps, userId }, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        const mockResponse = mockApiResponses.addCustomStepsToProductionPlan({ prodPlanId, steps, userId })
        return mockResponse
      }

      const response = await client.post('/production/add-custom-steps', {
        prodPlanId,
        steps,
        userId
      })
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get job cards with enhanced allocation details
export const getJobCardsWithDetails = createAsyncThunk(
  'production/getJobCardsWithDetails',
  async ({ 
    page = 1, 
    limit = 10, 
    prodPlanId = null, 
    status = null, 
    search = '' 
  }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (prodPlanId) params.append('prodPlanId', prodPlanId)
      if (status) params.append('status', status)
      if (search) params.append('search', search)

      const response = await client.get(`/production/job-cards?${params}`)
      
      return {
        jobCards: response.data.jobCards || [],
        totalCount: response.data.totalCount || 0,
        currentPage: response.data.currentPage || page,
        totalPages: response.data.totalPages || 1,
        hasNext: response.data.hasNext || false,
        hasPrev: response.data.hasPrev || false
      }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get job cards for a production plan (legacy)
export const getJobCards = createAsyncThunk(
  'production/getJobCards',
  async ({ prodPlanId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        const mockResponse = mockApiResponses.getJobCards({ prodPlanId })
        return {
          jobCards: mockResponse.jobCards || [],
          totalCount: mockResponse.totalCount || 0
        }
      }

      const response = await client.get(
        `/production/job-cards?prodPlanId=${prodPlanId}&page=${page}&limit=${limit}`
      )
      return {
        jobCards: response.data.jobCards || [],
        totalCount: response.data.totalCount || 0
      }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Create job card
export const createJobCard = createAsyncThunk(
  'production/createJobCard',
  async (jobCardData, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        const mockResponse = mockApiResponses.createJobCard(jobCardData)
        console.log('Mock job card created:', mockResponse)
        return mockResponse
      }

      const response = await client.post(
        '/production/add-production-job-card',
        jobCardData
      )
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Update job card progress
export const updateJobCardProgress = createAsyncThunk(
  'production/updateJobCardProgress',
  async (updateData, { rejectWithValue }) => {
    try {
      const response = await client.post(
        '/production/update-production-job-card',
        updateData
      )
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get job card progress
export const getJobCardProgress = createAsyncThunk(
  'production/getJobCardProgress',
  async (jobCardId, { rejectWithValue }) => {
    try {
      const response = await client.get(
        `/production/job-card-progress/${jobCardId}`
      )
      return response.data.progress || []
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Submit QA report
export const submitQAReport = createAsyncThunk(
  'production/submitQAReport',
  async (qaData, { rejectWithValue }) => {
    try {
      const response = await client.post(
        '/production/add-qa-production-card-report',
        qaData
      )
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Update QA report
export const updateQAReport = createAsyncThunk(
  'production/updateQAReport',
  async (updateData, { rejectWithValue }) => {
    try {
      const response = await client.post(
        '/production/update-qa-production-card-report',
        updateData
      )
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Production Step Presets API

// Get all step presets
export const getStepPresets = createAsyncThunk(
  'production/getStepPresets',
  async (_, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        const mockResponse = mockApiResponses.getStepPresets()
        return mockResponse
      }

      const response = await client.get('/production/step-presets')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get preset details by ID
export const getPresetDetails = createAsyncThunk(
  'production/getPresetDetails',
  async ({ presetId }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/production/step-presets/${presetId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Create new step preset
export const createStepPreset = createAsyncThunk(
  'production/createStepPreset',
  async (presetData, { rejectWithValue }) => {
    try {
      const response = await client.post('/production/step-presets', presetData)
      return response.data || response
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Update step preset
export const updateStepPreset = createAsyncThunk(
  'production/updateStepPreset',
  async ({ presetName, presetData }, { rejectWithValue }) => {
    try {
      const response = await client.put(`/production/step-presets/${presetName}`, presetData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Delete step preset
export const deleteStepPreset = createAsyncThunk(
  'production/deleteStepPreset',
  async ({ presetName }, { rejectWithValue }) => {
    try {
      const response = await client.delete(`/production/step-presets/${presetName}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Assign preset to production plan
export const assignPresetToPlan = createAsyncThunk(
  'production/assignPresetToPlan',
  async ({ planId, presetId }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/production/plan/${planId}/assign-preset`, {
        presetId
      })
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Move production plan to next step
export const moveToNextStep = createAsyncThunk(
  'production/moveToNextStep',
  async ({ planId, notes, priority, assignUserId }, { rejectWithValue }) => {
    try {
      const payload = {}
      if (notes) payload.notes = notes
      if (priority) payload.priority = priority
      if (assignUserId) payload.assignUserId = assignUserId

      const response = await client.post(`/production/plan/${planId}/next-step`, payload)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get AI-powered production suggestions
export const getAIProductionSuggestions = createAsyncThunk(
  'production/getAIProductionSuggestions',
  async ({ timeframe = '6m', dealerId = null, maxSuggestions = 10, focusArea = 'balanced' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        timeframe,
        maxSuggestions: maxSuggestions.toString(),
        focusArea
      })

      if (dealerId) params.append('dealerId', dealerId)

      const response = await client.get(`/production/ai-suggestions?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get smart production suggestions (16-inch alloys only)
export const getSmartProductionSuggestions = createAsyncThunk(
  'production/getSmartProductionSuggestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/production/smart-production')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get sales performance metrics
// Process step progress with quality data
export const processStepProgress = createAsyncThunk(
  'production/processStepProgress',
  async ({ stepProgressId, acceptedQuantity, rejectedQuantity, pendingQuantity, reworkQuantity, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/production/step-progress/${stepProgressId}/process`, {
        acceptedQuantity,
        rejectedQuantity,
        pendingQuantity,
        reworkQuantity,
        rejectionReason
      })
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get job card step progress details
export const getJobCardStepProgress = createAsyncThunk(
  'production/getJobCardStepProgress',
  async (jobCardId, { rejectWithValue }) => {
    try {
      const response = await client.get(`/production/job-card/${jobCardId}/step-progress`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get pending quantities summary for job card
export const getPendingSummary = createAsyncThunk(
  'production/getPendingSummary',
  async (jobCardId, { rejectWithValue }) => {
    try {
      const response = await client.get(`/production/job-card/${jobCardId}/pending-summary`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Initialize job card steps
export const initializeJobCardSteps = createAsyncThunk(
  'production/initializeJobCardSteps',
  async (jobCardId, { rejectWithValue }) => {
    try {
      const response = await client.post(`/production/job-card/${jobCardId}/initialize-steps`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const deleteJobCard = createAsyncThunk(
  'production/deleteJobCard',
  async (jobCardId, { rejectWithValue }) => {
    try {
      const response = await client.delete(`/production/job-card/${jobCardId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const getSalesPerformanceMetrics = createAsyncThunk(
  'production/getSalesPerformanceMetrics',
  async ({
    page = 1,
    limit = 10,
    timeframe = '1m',
    search = '',
    sortBy = 'total_sold',
    sortOrder = 'desc'
  }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        timeframe,
        search,
        sortBy,
        sortOrder
      })

      const response = await client.get(`/production/sales-metrics?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get finish-specific sales metrics for Smart Production Dashboard
// getFinishSalesMetrics - REMOVED
