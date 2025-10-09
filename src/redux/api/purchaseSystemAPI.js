import { createAsyncThunk } from '@reduxjs/toolkit'
import { client, getError } from '../../Utils/axiosClient'

// Get all suppliers
export const getSuppliers = createAsyncThunk(
  'purchaseSystem/getSuppliers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('purchase/suppliers')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

// Get all purchase orders
export const getPurchaseOrders = createAsyncThunk(
  'purchaseSystem/getPurchaseOrders',
  async (
    { page = 1, limit = 10, supplier_id, search, status, start_date, end_date },
    { rejectWithValue }
  ) => {
    try {
      let url = `/purchase/purchase-orders?page=${page}&limit=${limit}`

      if (supplier_id) url += `&supplier_id=${supplier_id}`
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
    { page = 1, limit = 10, order_id, supplier_id, start_date, end_date },
    { rejectWithValue }
  ) => {
    try {
      let url = `/purchase-receipts?page=${page}&limit=${limit}`

      if (order_id) url += `&order_id=${order_id}`
      if (supplier_id) url += `&supplier_id=${supplier_id}`
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
      supplier_id,
      payment_status,
      start_date,
      end_date
    },
    { rejectWithValue }
  ) => {
    try {
      let url = `/purchase-payments?page=${page}&limit=${limit}`

      if (order_id) url += `&order_id=${order_id}`
      if (supplier_id) url += `&supplier_id=${supplier_id}`
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
  async ({ start_date, end_date, supplier_id }, { rejectWithValue }) => {
    try {
      let url = '/purchase-statistics'

      if (start_date) url += `?start_date=${start_date}`
      if (end_date) url += `&end_date=${end_date}`
      if (supplier_id) url += `&supplier_id=${supplier_id}`

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

// Simple API calls for direct use (not thunks)
export const supplierAPI = {
  getAll: () => client.get('/v2/purchase/suppliers'),
  getById: id => client.get(`/v2/suppliers/${id}`),
  create: data => client.post('/v2/suppliers', data),
  update: (id, data) => client.put(`/v2/suppliers/${id}`, data),
  delete: id => client.delete(`/v2/suppliers/${id}`)
}

export const purchaseOrderAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return client.get(`/purchase-orders?${query}`)
  },
  getById: id => client.get(`/purchase/purchase-orders/${id}`),
  create: data => client.post('/purchase/purchase-orders', data),
  update: (id, data) => client.put(`/purchase/purchase-orders/${id}`, data),
  delete: id => client.delete(`/purchase/purchase-orders/${id}`),
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
