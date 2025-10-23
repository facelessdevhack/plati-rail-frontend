import { createAsyncThunk } from '@reduxjs/toolkit'
import { client } from './index'

// Get comprehensive production dashboard data
export const getProductionDashboardData = createAsyncThunk(
  'turboProduction/getDashboardData',
  async (params = {}) => {
    try {
      const response = await client.get('/v2/turbo-production/dashboard-data', {
        params: {
          page: params.page || 1,
          limit: params.limit || 1000,
          search: params.search || '',
          status: params.status || 'all',
          includeAnalytics: params.includeAnalytics !== false
        }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Create multiple production plans in batch
export const createBulkProductionPlans = createAsyncThunk(
  'turboProduction/createBulkPlans',
  async ({ plans, autoAssignPresets = true, createdBy }) => {
    try {
      const response = await client.post('/v2/turbo-production/create-bulk-plans', {
        plans,
        autoAssignPresets,
        createdBy
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Quick job card creation with smart defaults
export const createQuickJobCard = createAsyncThunk(
  'turboProduction/createQuickJobCard',
  async ({ prodPlanId, quantity, autoAssignSteps = true, createdBy }) => {
    try {
      const response = await client.post('/v2/turbo-production/create-quick-job-card', {
        prodPlanId,
        quantity,
        autoAssignSteps,
        createdBy
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Batch move multiple job cards to next step
export const batchMoveToNextStep = createAsyncThunk(
  'turboProduction/batchMoveToNextStep',
  async ({ jobCardIds, stepNotes, updatedBy }) => {
    try {
      const response = await client.post('/v2/turbo-production/batch-move-next-step', {
        jobCardIds,
        stepNotes,
        updatedBy
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Get real-time statistics
export const getRealtimeStats = createAsyncThunk(
  'turboProduction/getRealtimeStats',
  async () => {
    try {
      const response = await client.get('/v2/turbo-production/realtime-stats')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Smart preset assignment based on historical patterns
export const assignSmartPreset = createAsyncThunk(
  'turboProduction/assignSmartPreset',
  async ({ planId, modelName, productType }) => {
    try {
      const response = await client.post('/v2/turbo-production/assign-smart-preset', {
        planId,
        modelName,
        productType
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Get production suggestions and insights
export const getProductionInsights = createAsyncThunk(
  'turboProduction/getInsights',
  async ({ timeRange = '7d', includeRecommendations = true }) => {
    try {
      const response = await client.get('/v2/turbo-production/insights', {
        params: { timeRange, includeRecommendations }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Bulk assign presets to multiple plans
export const bulkAssignPresets = createAsyncThunk(
  'turboProduction/bulkAssignPresets',
  async ({ planIds, presetName }) => {
    try {
      const response = await client.post('/v2/turbo-production/bulk-assign-presets', {
        planIds,
        presetName
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Get production workflow templates
export const getWorkflowTemplates = createAsyncThunk(
  'turboProduction/getWorkflowTemplates',
  async () => {
    try {
      const response = await client.get('/v2/turbo-production/workflow-templates')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Quick duplicate production plan
export const duplicateProductionPlan = createAsyncThunk(
  'turboProduction/duplicatePlan',
  async ({ planId, newQuantity, createdBy }) => {
    try {
      const response = await client.post('/v2/turbo-production/duplicate-plan', {
        planId,
        newQuantity,
        createdBy
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Export production data in various formats
export const exportProductionData = createAsyncThunk(
  'turboProduction/exportData',
  async ({ format = 'excel', dateRange, status, includeJobCards = false }) => {
    try {
      const response = await client.post('/v2/turbo-production/export-data', {
        format,
        dateRange,
        status,
        includeJobCards
      }, {
        responseType: 'blob' // For file downloads
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// Production analytics and reporting
export const getProductionAnalytics = createAsyncThunk(
  'turboProduction/getAnalytics',
  async ({
    dateRange = '30d',
    groupBy = 'day',
    metrics = ['quantity', 'completion', 'efficiency']
  }) => {
    try {
      const response = await client.get('/v2/turbo-production/analytics', {
        params: { dateRange, groupBy, metrics }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
)

// WebSocket message handling utilities
export const WebSocketEvents = {
  PLAN_CREATED: 'PLAN_CREATED',
  PLAN_UPDATED: 'PLAN_UPDATED',
  PLAN_COMPLETED: 'PLAN_COMPLETED',
  JOBCARD_CREATED: 'JOBCARD_CREATED',
  JOBCARD_UPDATED: 'JOBCARD_UPDATED',
  JOBCARD_COMPLETED: 'JOBCARD_COMPLETED',
  STEP_COMPLETED: 'STEP_COMPLETED',
  STEP_STARTED: 'STEP_STARTED',
  STOCK_UPDATED: 'STOCK_UPDATED',
  SYSTEM_ALERT: 'SYSTEM_ALERT'
}

// Utility functions for WebSocket handling
export const parseWebSocketMessage = (message) => {
  try {
    return JSON.parse(message)
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error)
    return null
  }
}

export const createWebSocketMessage = (type, data) => {
  return JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
    id: Math.random().toString(36).substr(2, 9)
  })
}

// Error handling utilities
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return defaultMessage
}

// Data transformation utilities
export const transformProductionPlanData = (plan) => {
  return {
    ...plan,
    id: parseInt(plan.id),
    quantity: parseInt(plan.quantity) || 0,
    urgent: Boolean(plan.urgent),
    createdAt: plan.created_at ? new Date(plan.created_at) : null,
    updatedAt: plan.updated_at ? new Date(plan.updated_at) : null,
    quantityTracking: {
      allocatedQuantity: parseInt(plan.allocated_quantity) || 0,
      completedQuantity: parseInt(plan.completed_quantity) || 0,
      remainingQuantity: parseInt(plan.remaining_quantity) || 0,
      totalJobCards: parseInt(plan.total_job_cards) || 0,
      completionStatus: parseInt(plan.remaining_quantity) === 0 ? 'completed' :
                      parseInt(plan.allocated_quantity) > 0 ? 'in_progress' : 'pending'
    },
    progress: plan.quantity > 0 ? Math.round(((parseInt(plan.completed_quantity) || 0) / plan.quantity) * 100) : 0
  }
}

export const transformJobCardData = (jobCard) => {
  return {
    ...jobCard,
    id: parseInt(jobCard.id),
    jobCardId: parseInt(jobCard.job_card_id) || parseInt(jobCard.id),
    prodPlanId: parseInt(jobCard.prod_plan_id) || parseInt(jobCard.prodplanid),
    quantity: parseInt(jobCard.quantity) || 0,
    prodStep: parseInt(jobCard.prod_step) || 1,
    createdAt: jobCard.created_at ? new Date(jobCard.created_at) : null,
    updatedAt: jobCard.updated_at ? new Date(jobCard.updated_at) : null,
    progress: jobCard.progress || 0,
    currentStepName: jobCard.current_step_name || 'Not Started',
    currentStepStatus: jobCard.current_step_status || 'pending'
  }
}

// Batch operation utilities
export const batchOperationBuilder = (type, items, options = {}) => {
  return {
    type,
    items: items.map(item => ({
      id: item.id,
      data: item,
      options: options[item.id] || {}
    })),
    metadata: {
      totalItems: items.length,
      timestamp: new Date().toISOString(),
      requestedBy: options.requestedBy || 'system'
    }
  }
}

// Validation utilities
export const validateProductionPlan = (plan) => {
  const errors = []

  if (!plan.alloyId || plan.alloyId <= 0) {
    errors.push('Valid source alloy is required')
  }

  if (!plan.targetFinishId || plan.targetFinishId <= 0) {
    errors.push('Valid target finish is required')
  }

  if (!plan.quantity || plan.quantity <= 0) {
    errors.push('Quantity must be greater than 0')
  }

  if (plan.quantity > 10000) {
    errors.push('Quantity cannot exceed 10,000')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateJobCard = (jobCard) => {
  const errors = []

  if (!jobCard.prodPlanId || jobCard.prodPlanId <= 0) {
    errors.push('Valid production plan is required')
  }

  if (!jobCard.quantity || jobCard.quantity <= 0) {
    errors.push('Quantity must be greater than 0')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export all functions as a single object for easier imports
const turboProductionAPI = {
  // Data fetching
  getProductionDashboardData,
  getRealtimeStats,
  getProductionInsights,
  getWorkflowTemplates,
  getProductionAnalytics,

  // CRUD operations
  createBulkProductionPlans,
  createQuickJobCard,
  duplicateProductionPlan,
  batchMoveToNextStep,
  bulkAssignPresets,
  assignSmartPreset,

  // Utilities
  WebSocketEvents,
  parseWebSocketMessage,
  createWebSocketMessage,
  handleAPIError,
  transformProductionPlanData,
  transformJobCardData,
  batchOperationBuilder,
  validateProductionPlan,
  validateJobCard,

  // Export
  exportProductionData
}

export default turboProductionAPI