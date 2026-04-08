import { createAsyncThunk } from '@reduxjs/toolkit'
import { client, getError } from '../../Utils/axiosClient'

// ============================================================
// REQUISITIONS
// ============================================================

export const createRequisition = createAsyncThunk(
  'purchaseV2/createRequisition',
  async (data, { rejectWithValue }) => {
    try {
      const response = await client.post('/purchase/requisitions', data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const getRequisitions = createAsyncThunk(
  'purchaseV2/getRequisitions',
  async ({ page = 1, limit = 20, status, urgency, purchaseType, search } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (status) params.append('status', status)
      if (urgency) params.append('urgency', urgency)
      if (purchaseType) params.append('purchase_type', purchaseType)
      if (search) params.append('search', search)
      const response = await client.get(`/purchase/requisitions?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const getPendingRequisitionCount = createAsyncThunk(
  'purchaseV2/getPendingRequisitionCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/purchase/requisitions/pending-count')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const getRequisitionById = createAsyncThunk(
  'purchaseV2/getRequisitionById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.get(`/purchase/requisitions/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const approveRequisition = createAsyncThunk(
  'purchaseV2/approveRequisition',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.patch(`/purchase/requisitions/${id}/approve`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const rejectRequisition = createAsyncThunk(
  'purchaseV2/rejectRequisition',
  async ({ id, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await client.patch(`/purchase/requisitions/${id}/reject`, { rejection_reason: rejectionReason })
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// ============================================================
// ITEM CATEGORIES
// ============================================================

export const getItemCategories = createAsyncThunk(
  'purchaseV2/getItemCategories',
  async ({ includeInactive } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams()
      if (includeInactive) params.append('includeInactive', 'true')
      const response = await client.get(`/purchase/items/categories?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const createItemCategory = createAsyncThunk(
  'purchaseV2/createItemCategory',
  async (data, { rejectWithValue }) => {
    try {
      const response = await client.post('/purchase/items/categories', data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const updateItemCategory = createAsyncThunk(
  'purchaseV2/updateItemCategory',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const response = await client.put(`/purchase/items/categories/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const toggleItemCategoryActive = createAsyncThunk(
  'purchaseV2/toggleItemCategoryActive',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.patch(`/purchase/items/categories/${id}/toggle`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// ============================================================
// ITEM SUBCATEGORIES
// ============================================================

export const getItemSubcategories = createAsyncThunk(
  'purchaseV2/getItemSubcategories',
  async ({ categoryId, includeInactive } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams()
      if (categoryId) params.append('categoryId', String(categoryId))
      if (includeInactive) params.append('includeInactive', 'true')
      const response = await client.get(`/purchase/items/subcategories?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const createItemSubcategory = createAsyncThunk(
  'purchaseV2/createItemSubcategory',
  async (data, { rejectWithValue }) => {
    try {
      const response = await client.post('/purchase/items/subcategories', data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const updateItemSubcategory = createAsyncThunk(
  'purchaseV2/updateItemSubcategory',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const response = await client.put(`/purchase/items/subcategories/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const toggleSubcategoryActive = createAsyncThunk(
  'purchaseV2/toggleSubcategoryActive',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.patch(`/purchase/items/subcategories/${id}/toggle`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// ============================================================
// ITEMS MASTER
// ============================================================

export const getItems = createAsyncThunk(
  'purchaseV2/getItems',
  async ({ page = 1, limit = 50, search, categoryId, subcategoryId, includeInactive } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.append('search', search)
      if (categoryId) params.append('categoryId', String(categoryId))
      if (subcategoryId) params.append('subcategoryId', String(subcategoryId))
      if (includeInactive) params.append('includeInactive', 'true')
      const response = await client.get(`/purchase/items?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const createItem = createAsyncThunk(
  'purchaseV2/createItem',
  async (data, { rejectWithValue }) => {
    try {
      const response = await client.post('/purchase/items', data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const updateItem = createAsyncThunk(
  'purchaseV2/updateItem',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const response = await client.put(`/purchase/items/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const toggleItemActive = createAsyncThunk(
  'purchaseV2/toggleItemActive',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.patch(`/purchase/items/${id}/toggle`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// ============================================================
// PURCHASE INDENTS
// ============================================================

export const getIndents = createAsyncThunk(
  'purchaseV2/getIndents',
  async ({ page = 1, limit = 20, status, purchaseType, search, createdBy } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (status) params.append('status', status)
      if (purchaseType) params.append('purchaseType', purchaseType)
      if (search) params.append('search', search)
      if (createdBy) params.append('createdBy', String(createdBy))
      const response = await client.get(`/purchase/indents?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const getIndentById = createAsyncThunk(
  'purchaseV2/getIndentById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.get(`/purchase/indents/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const createIndent = createAsyncThunk(
  'purchaseV2/createIndent',
  async (data, { rejectWithValue }) => {
    try {
      const response = await client.post('/purchase/indents', data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const closeIndent = createAsyncThunk(
  'purchaseV2/closeIndent',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.patch(`/purchase/indents/${id}/close`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// ============================================================
// PURCHASE ORDERS
// ============================================================

export const getPurchaseOrders = createAsyncThunk(
  'purchaseV2/getPurchaseOrders',
  async ({ page = 1, limit = 20, status, indentId, search } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (status) params.append('status', status)
      if (indentId) params.append('indentId', String(indentId))
      if (search) params.append('search', search)
      const response = await client.get(`/purchase/purchase-orders?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const getPurchaseOrderById = createAsyncThunk(
  'purchaseV2/getPurchaseOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.get(`/purchase/purchase-orders/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const createPurchaseOrder = createAsyncThunk(
  'purchaseV2/createPurchaseOrder',
  async (data, { rejectWithValue }) => {
    try {
      const response = await client.post('/purchase/purchase-orders', data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const updatePurchaseOrderStatus = createAsyncThunk(
  'purchaseV2/updatePurchaseOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await client.patch(`/purchase/purchase-orders/${id}/status`, { status })
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const getVendors = createAsyncThunk(
  'purchaseV2/getVendors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/purchase/vendors')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// ============================================================
// GRN
// ============================================================

export const getGRNs = createAsyncThunk(
  'purchaseV2/getGRNs',
  async ({ page = 1, limit = 20, status, poId, search } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (status) params.append('status', status)
      if (poId) params.append('poId', String(poId))
      if (search) params.append('search', search)
      const response = await client.get(`/purchase/grn?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const getGRNById = createAsyncThunk(
  'purchaseV2/getGRNById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.get(`/purchase/grn/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const createGRN = createAsyncThunk(
  'purchaseV2/createGRN',
  async (data, { rejectWithValue }) => {
    try {
      const response = await client.post('/purchase/grn', data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const completeGRN = createAsyncThunk(
  'purchaseV2/completeGRN',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.patch(`/purchase/grn/${id}/complete`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)
