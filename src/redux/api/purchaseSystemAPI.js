import { createAsyncThunk } from '@reduxjs/toolkit'
import { client, getError } from '../../Utils/axiosClient'

// =============================================
// VENDOR ENDPOINTS (replaced suppliers)
// =============================================

// Get all vendors
export const getVendors = createAsyncThunk(
  'purchaseSystem/getVendors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('purchase/vendors')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get vendor by ID
export const getVendorById = createAsyncThunk(
  'purchaseSystem/getVendorById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.get(`purchase/vendors/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Create vendor
export const createVendor = createAsyncThunk(
  'purchaseSystem/createVendor',
  async (vendorData, { rejectWithValue }) => {
    try {
      const response = await client.post('purchase/vendors', vendorData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Update vendor
export const updateVendor = createAsyncThunk(
  'purchaseSystem/updateVendor',
  async ({ id, vendorData }, { rejectWithValue }) => {
    try {
      const response = await client.put(`purchase/vendors/${id}`, vendorData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Delete vendor
export const deleteVendor = createAsyncThunk(
  'purchaseSystem/deleteVendor',
  async (id, { rejectWithValue }) => {
    try {
      await client.delete(`purchase/vendors/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// =============================================
// MOLD ENDPOINTS (for purchase orders)
// =============================================

// Get all molds for purchase orders
export const getMoldsForPurchase = createAsyncThunk(
  'purchaseSystem/getMoldsForPurchase',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('purchase/molds')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// =============================================
// LEGACY SUPPLIER ENDPOINTS (backward compatibility)
// =============================================

// Get all suppliers (maps to vendors)
export const getSuppliers = createAsyncThunk(
  'purchaseSystem/getSuppliers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('purchase/vendors')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// =============================================
// PURCHASE ORDER ENDPOINTS
// =============================================

// Get all purchase orders
export const getPurchaseOrders = createAsyncThunk(
  'purchaseSystem/getPurchaseOrders',
  async (
    { page = 1, limit = 10, vendor_id, vendorId, mold_id, moldId, search, status, start_date, end_date } = {},
    { rejectWithValue }
  ) => {
    try {
      let url = `/purchase/purchase-orders?page=${page}&limit=${limit}`

      const actualVendorId = vendor_id || vendorId
      const actualMoldId = mold_id || moldId

      if (actualVendorId) url += `&vendor_id=${actualVendorId}`
      if (actualMoldId) url += `&mold_id=${actualMoldId}`
      if (search) url += `&search=${search}`
      if (status) url += `&status=${status}`
      if (start_date) url += `&start_date=${start_date}`
      if (end_date) url += `&end_date=${end_date}`

      const response = await client.get(url)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get purchase order statistics
export const getPurchaseOrderStats = createAsyncThunk(
  'purchaseSystem/getPurchaseOrderStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('purchase/purchase-orders/stats')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Create purchase order
export const createPurchaseOrder = createAsyncThunk(
  'purchaseSystem/createPurchaseOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await client.post('/purchase/purchase-orders', orderData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Update purchase order
export const updatePurchaseOrder = createAsyncThunk(
  'purchaseSystem/updatePurchaseOrder',
  async ({ id, orderData }, { rejectWithValue }) => {
    try {
      const response = await client.put(
        `/purchase/purchase-orders/${id}`,
        orderData
      )
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Update purchase order status
export const updatePurchaseOrderStatus = createAsyncThunk(
  'purchaseSystem/updatePurchaseOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await client.patch(
        `/purchase/purchase-orders/${id}/status`,
        { status }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Delete purchase order
export const deletePurchaseOrder = createAsyncThunk(
  'purchaseSystem/deletePurchaseOrder',
  async (id, { rejectWithValue }) => {
    try {
      await client.delete(`/purchase/purchase-orders/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get purchase order details
export const getPurchaseOrderDetails = createAsyncThunk(
  'purchaseSystem/getPurchaseOrderDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.get(`purchase/purchase-orders/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get purchase order by ID (alias for getPurchaseOrderDetails)
export const getPurchaseOrderById = createAsyncThunk(
  'purchaseSystem/getPurchaseOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.get(`purchase/purchase-orders/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Export purchase order as PDF
export const exportPurchaseOrderPDF = createAsyncThunk(
  'purchaseSystem/exportPurchaseOrderPDF',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.get(
        `purchase/purchase-orders/${id}/export-pdf`,
        {
          responseType: 'blob'
        }
      )

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `purchase-order-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Export purchase order as Excel
export const exportPurchaseOrderExcel = createAsyncThunk(
  'purchaseSystem/exportPurchaseOrderExcel',
  async (id, { rejectWithValue }) => {
    try {
      const response = await client.get(
        `purchase/purchase-orders/${id}/export-excel`,
        {
          responseType: 'blob'
        }
      )

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `purchase-order-${id}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get purchase receipts
export const getPurchaseReceipts = createAsyncThunk(
  'purchaseSystem/getPurchaseReceipts',
  async (
    { page = 1, limit = 10, order_id, vendor_id, start_date, end_date } = {},
    { rejectWithValue }
  ) => {
    try {
      let url = `/purchase-receipts?page=${page}&limit=${limit}`

      if (order_id) url += `&order_id=${order_id}`
      if (vendor_id) url += `&vendor_id=${vendor_id}`
      if (start_date) url += `&start_date=${start_date}`
      if (end_date) url += `&end_date=${end_date}`

      const response = await client.get(url)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Create purchase receipt
export const createPurchaseReceipt = createAsyncThunk(
  'purchaseSystem/createPurchaseReceipt',
  async (receiptData, { rejectWithValue }) => {
    try {
      const response = await client.post('/purchase-receipts', receiptData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get purchase payments
export const getPurchasePayments = createAsyncThunk(
  'purchaseSystem/getPurchasePayments',
  async (
    {
      page = 1,
      limit = 10,
      order_id,
      vendor_id,
      payment_status,
      start_date,
      end_date
    } = {},
    { rejectWithValue }
  ) => {
    try {
      let url = `/purchase-payments?page=${page}&limit=${limit}`

      if (order_id) url += `&order_id=${order_id}`
      if (vendor_id) url += `&vendor_id=${vendor_id}`
      if (payment_status) url += `&payment_status=${payment_status}`
      if (start_date) url += `&start_date=${start_date}`
      if (end_date) url += `&end_date=${end_date}`

      const response = await client.get(url)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Create purchase payment
export const createPurchasePayment = createAsyncThunk(
  'purchaseSystem/createPurchasePayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await client.post('/purchase-payments', paymentData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get purchase statistics
export const getPurchaseStatistics = createAsyncThunk(
  'purchaseSystem/getPurchaseStatistics',
  async ({ start_date, end_date, vendor_id } = {}, { rejectWithValue }) => {
    try {
      let url = '/purchase-statistics'

      if (start_date) url += `?start_date=${start_date}`
      if (end_date) url += `&end_date=${end_date}`
      if (vendor_id) url += `&vendor_id=${vendor_id}`

      const response = await client.get(url)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Clear error action
export const clearError = () => ({
  type: 'purchaseSystem/clearError'
})

// =============================================
// SIMPLE API CALLS (for direct use)
// =============================================

export const vendorAPI = {
  getAll: () => client.get('/purchase/vendors'),
  getById: id => client.get(`/purchase/vendors/${id}`),
  create: data => client.post('/purchase/vendors', data),
  update: (id, data) => client.put(`/purchase/vendors/${id}`, data),
  delete: id => client.delete(`/purchase/vendors/${id}`)
}

export const moldAPI = {
  getAll: () => client.get('/purchase/molds')
}

// Legacy supplier API (backward compatibility)
export const supplierAPI = {
  getAll: () => client.get('/purchase/vendors'),
  getById: id => client.get(`/purchase/vendors/${id}`),
  create: data => client.post('/purchase/vendors', data),
  update: (id, data) => client.put(`/purchase/vendors/${id}`, data),
  delete: id => client.delete(`/purchase/vendors/${id}`)
}

export const purchaseOrderAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return client.get(`/purchase/purchase-orders?${query}`)
  },
  getById: id => client.get(`/purchase/purchase-orders/${id}`),
  create: data => client.post('/purchase/purchase-orders', data),
  update: (id, data) => client.put(`/purchase/purchase-orders/${id}`, data),
  updateStatus: (id, status) => client.patch(`/purchase/purchase-orders/${id}/status`, { status }),
  delete: id => client.delete(`/purchase/purchase-orders/${id}`),
  getStats: () => client.get('/purchase/purchase-orders/stats'),
  exportPDF: id =>
    client.get(`/purchase/purchase-orders/${id}/export-pdf`, {
      responseType: 'blob'
    }),
  exportExcel: id =>
    client.get(`/purchase/purchase-orders/${id}/export-excel`, {
      responseType: 'blob'
    })
}

export const purchaseReceiptAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return client.get(`/purchase-receipts?${query}`)
  },
  getById: id => client.get(`/purchase-receipts/${id}`),
  create: data => client.post('/purchase-receipts', data),
  update: (id, data) => client.put(`/purchase-receipts/${id}`, data),
  delete: id => client.delete(`/purchase-receipts/${id}`)
}

export const purchasePaymentAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return client.get(`/purchase-payments?${query}`)
  },
  getById: id => client.get(`/purchase-payments/${id}`),
  create: data => client.post('/purchase-payments', data),
  update: (id, data) => client.put(`/purchase-payments/${id}`, data),
  delete: id => client.delete(`/purchase-payments/${id}`)
}
