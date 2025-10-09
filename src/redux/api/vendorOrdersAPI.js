import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { client } from '../../Utils/axiosClient'

const initialState = {
  vendors: [],
  vendorOrders: [],
  currentOrder: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
}

// Get all vendors
export const getVendors = createAsyncThunk(
  'vendorOrders/getVendors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/vendor-orders/vendors')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendors')
    }
  }
)

// Create new vendor
export const createVendor = createAsyncThunk(
  'vendorOrders/createVendor',
  async (vendorData, { rejectWithValue }) => {
    try {
      const response = await client.post('/vendor-orders/vendors', vendorData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create vendor')
    }
  }
)

// Get vendor orders with pagination and filtering
export const getVendorOrders = createAsyncThunk(
  'vendorOrders/getVendorOrders',
  async ({ page = 1, limit = 10, vendor_id = null, search = '' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (vendor_id) params.append('vendor_id', vendor_id.toString())
      if (search) params.append('search', search)

      const response = await client.get(`/vendor-orders/orders?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendor orders')
    }
  }
)

// Get vendor order by ID
export const getVendorOrderById = createAsyncThunk(
  'vendorOrders/getVendorOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await client.get(`/vendor-orders/orders/${orderId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendor order')
    }
  }
)

// Create new vendor order
export const createVendorOrder = createAsyncThunk(
  'vendorOrders/createVendorOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await client.post('/vendor-orders/orders', orderData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create vendor order')
    }
  }
)

// Update vendor order
export const updateVendorOrder = createAsyncThunk(
  'vendorOrders/updateVendorOrder',
  async ({ id, ...orderData }, { rejectWithValue }) => {
    try {
      const response = await client.put(`/vendor-orders/orders/${id}`, orderData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update vendor order')
    }
  }
)

// Delete vendor order
export const deleteVendorOrder = createAsyncThunk(
  'vendorOrders/deleteVendorOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await client.delete(`/vendor-orders/orders/${orderId}`)
      return { orderId, message: response.data.message }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete vendor order')
    }
  }
)

// Export vendor order as PDF
export const exportVendorOrderPDF = createAsyncThunk(
  'vendorOrders/exportVendorOrderPDF',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await client.get(`/vendor-orders/orders/${orderId}/export/pdf`, {
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Purchase_Order_${orderId}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true, message: 'PDF exported successfully' }
    } catch (error) {
      return rejectWithValue('Failed to export PDF')
    }
  }
)

// Export vendor order as Excel

const vendorOrdersSlice = createSlice({
  name: 'vendorOrders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    resetState: (state) => {
      state.vendors = []
      state.vendorOrders = []
      state.currentOrder = null
      state.loading = false
      state.error = null
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Vendors
      .addCase(getVendors.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getVendors.fulfilled, (state, action) => {
        state.loading = false
        state.vendors = action.payload.data || []
      })
      .addCase(getVendors.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create Vendor
      .addCase(createVendor.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.loading = false
        state.vendors.push(action.payload.data)
      })
      .addCase(createVendor.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Get Vendor Orders
      .addCase(getVendorOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getVendorOrders.fulfilled, (state, action) => {
        state.loading = false
        state.vendorOrders = action.payload.data || []
        state.pagination = action.payload.pagination || state.pagination
      })
      .addCase(getVendorOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Get Vendor Order by ID
      .addCase(getVendorOrderById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getVendorOrderById.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload.data
      })
      .addCase(getVendorOrderById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create Vendor Order
      .addCase(createVendorOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createVendorOrder.fulfilled, (state, action) => {
        state.loading = false
        state.vendorOrders.unshift(action.payload.data)
        state.currentOrder = action.payload.data
      })
      .addCase(createVendorOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update Vendor Order
      .addCase(updateVendorOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateVendorOrder.fulfilled, (state, action) => {
        state.loading = false
        const index = state.vendorOrders.findIndex(order => order.id === action.payload.data.id)
        if (index !== -1) {
          state.vendorOrders[index] = action.payload.data
        }
        if (state.currentOrder?.id === action.payload.data.id) {
          state.currentOrder = action.payload.data
        }
      })
      .addCase(updateVendorOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete Vendor Order
      .addCase(deleteVendorOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteVendorOrder.fulfilled, (state, action) => {
        state.loading = false
        state.vendorOrders = state.vendorOrders.filter(order => order.id !== action.payload.orderId)
        if (state.currentOrder?.id === action.payload.orderId) {
          state.currentOrder = null
        }
      })
      .addCase(deleteVendorOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Export PDF
      .addCase(exportVendorOrderPDF.pending, (state) => {
        state.loading = true
      })
      .addCase(exportVendorOrderPDF.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(exportVendorOrderPDF.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError, clearCurrentOrder, resetState } = vendorOrdersSlice.actions
export default vendorOrdersSlice.reducer