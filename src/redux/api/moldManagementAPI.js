import { createAsyncThunk } from '@reduxjs/toolkit'
import { client, getError } from '../../Utils/axiosClient'

// =============================================
// MOLD CRUD Operations
// =============================================

// Get all molds with pagination and filters
export const getMolds = createAsyncThunk(
  'moldManagement/getMolds',
  async (
    { page = 1, limit = 10, search = '', status = '', vendorId = null },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (vendorId) params.append('vendor_id', vendorId)

      const response = await client.get(`/mold-management?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get single mold by ID
export const getMoldById = createAsyncThunk(
  'moldManagement/getMoldById',
  async (moldId, { rejectWithValue }) => {
    try {
      const response = await client.get(`/mold-management/${moldId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Create new mold
export const createMold = createAsyncThunk(
  'moldManagement/createMold',
  async (moldData, { rejectWithValue }) => {
    try {
      const response = await client.post('/mold-management', moldData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Update mold
export const updateMold = createAsyncThunk(
  'moldManagement/updateMold',
  async ({ moldId, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await client.put(`/mold-management/${moldId}`, updateData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Delete mold
export const deleteMold = createAsyncThunk(
  'moldManagement/deleteMold',
  async (moldId, { rejectWithValue }) => {
    try {
      const response = await client.delete(`/mold-management/${moldId}`)
      return { moldId, message: response.data.message }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// =============================================
// Dispatch Operations
// =============================================

// Dispatch mold to vendor
export const dispatchMoldToVendor = createAsyncThunk(
  'moldManagement/dispatchMoldToVendor',
  async ({ moldId, vendorId, expectedReturnDate, notes }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/mold-management/${moldId}/dispatch`, {
        vendor_id: vendorId,
        expected_return_date: expectedReturnDate,
        dispatch_notes: notes
      })
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Receive mold from vendor
export const receiveMoldFromVendor = createAsyncThunk(
  'moldManagement/receiveMoldFromVendor',
  async ({ moldId, cyclesUsed, quantityProduced, conditionAtReturn, notes }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/mold-management/${moldId}/receive`, {
        cycles_at_return: cyclesUsed,
        quantity_produced_at_vendor: quantityProduced,
        condition_at_return: conditionAtReturn,
        return_notes: notes
      })
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get dispatch history
export const getDispatchHistory = createAsyncThunk(
  'moldManagement/getDispatchHistory',
  async ({ moldId = null, vendorId = null, status = '', page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (moldId) params.append('mold_id', moldId)
      if (vendorId) params.append('vendor_id', vendorId)
      if (status) params.append('status', status)

      const response = await client.get(`/mold-management/dispatch/history?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// =============================================
// Production Logging
// =============================================

// Log production for a mold
export const logProduction = createAsyncThunk(
  'moldManagement/logProduction',
  async (productionData, { rejectWithValue }) => {
    try {
      const response = await client.post('/mold-management/production/log', productionData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get production logs
export const getProductionLogs = createAsyncThunk(
  'moldManagement/getProductionLogs',
  async ({ moldId = null, startDate = null, endDate = null, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (moldId) params.append('mold_id', moldId)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const response = await client.get(`/mold-management/production/logs?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// =============================================
// Maintenance Operations
// =============================================

// Create maintenance record
export const createMaintenance = createAsyncThunk(
  'moldManagement/createMaintenance',
  async (maintenanceData, { rejectWithValue }) => {
    try {
      const response = await client.post('/mold-management/maintenance', maintenanceData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Complete maintenance
export const completeMaintenance = createAsyncThunk(
  'moldManagement/completeMaintenance',
  async ({ maintenanceId, ...completionData }, { rejectWithValue }) => {
    try {
      const response = await client.put(
        `/mold-management/maintenance/${maintenanceId}/complete`,
        completionData
      )
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get maintenance history
export const getMaintenanceHistory = createAsyncThunk(
  'moldManagement/getMaintenanceHistory',
  async ({ moldId = null, status = '', page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (moldId) params.append('mold_id', moldId)
      if (status) params.append('status', status)

      const response = await client.get(`/mold-management/maintenance/history?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// =============================================
// Alerts Operations
// =============================================

// Get mold alerts
export const getMoldAlerts = createAsyncThunk(
  'moldManagement/getMoldAlerts',
  async ({ moldId = null, isRead = null, isResolved = null }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams()

      if (moldId) params.append('mold_id', moldId)
      if (isRead !== null) params.append('is_read', isRead)
      if (isResolved !== null) params.append('is_resolved', isResolved)

      const response = await client.get(`/mold-management/alerts?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Mark alert as read
export const markAlertAsRead = createAsyncThunk(
  'moldManagement/markAlertAsRead',
  async (alertId, { rejectWithValue }) => {
    try {
      const response = await client.put(`/mold-management/alerts/${alertId}/read`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Resolve alert
export const resolveAlert = createAsyncThunk(
  'moldManagement/resolveAlert',
  async (alertId, { rejectWithValue }) => {
    try {
      const response = await client.put(`/mold-management/alerts/${alertId}/resolve`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// =============================================
// Dashboard & Analytics
// =============================================

// Get mold dashboard data
export const getMoldDashboard = createAsyncThunk(
  'moldManagement/getMoldDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/mold-management/dashboard')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get molds by vendor
export const getMoldsByVendor = createAsyncThunk(
  'moldManagement/getMoldsByVendor',
  async (vendorId, { rejectWithValue }) => {
    try {
      const response = await client.get(`/mold-management/vendor/${vendorId}/molds`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// =============================================
// Master Data Operations
// =============================================

// Get all vendors
export const getVendors = createAsyncThunk(
  'moldManagement/getVendors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/mold-management/master/vendors')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get all sizes (inches)
export const getInchesMaster = createAsyncThunk(
  'moldManagement/getInchesMaster',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/mold-management/master/inches')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get all models
export const getModelMaster = createAsyncThunk(
  'moldManagement/getModelMaster',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/mold-management/master/models')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)
