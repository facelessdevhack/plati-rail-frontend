import { createSlice } from '@reduxjs/toolkit'

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

const vendorOrdersSlice = createSlice({
  name: 'vendorOrders',
  initialState,
  reducers: {
    setVendors: (state, action) => {
      state.vendors = action.payload
    },
    setVendorOrders: (state, action) => {
      state.vendorOrders = action.payload.data || []
      state.pagination = action.payload.pagination || state.pagination
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload
    },
    addVendorOrder: (state, action) => {
      state.vendorOrders.unshift(action.payload)
      state.currentOrder = action.payload
    },
    updateVendorOrder: (state, action) => {
      const index = state.vendorOrders.findIndex(order => order.id === action.payload.id)
      if (index !== -1) {
        state.vendorOrders[index] = action.payload
      }
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder = action.payload
      }
    },
    deleteVendorOrder: (state, action) => {
      state.vendorOrders = state.vendorOrders.filter(order => order.id !== action.payload)
      if (state.currentOrder?.id === action.payload) {
        state.currentOrder = null
      }
    },
    addVendor: (state, action) => {
      state.vendors.push(action.payload)
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
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
  }
})

export const {
  setVendors,
  setVendorOrders,
  setCurrentOrder,
  addVendorOrder,
  updateVendorOrder,
  deleteVendorOrder,
  addVendor,
  setLoading,
  setError,
  clearError,
  clearCurrentOrder,
  resetState
} = vendorOrdersSlice.actions

export default vendorOrdersSlice.reducer