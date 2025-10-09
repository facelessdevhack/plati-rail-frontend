import { createSlice } from '@reduxjs/toolkit'
import {
  getSuppliers,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderDetails,
  exportPurchaseOrderPDF,
  getPurchaseReceipts,
  createPurchaseReceipt,
  getPurchasePayments,
  createPurchasePayment,
  getPurchaseStatistics
} from '../api/purchaseSystemAPI'

const initialState = {
  // Suppliers
  suppliers: [],
  suppliersLoading: false,
  suppliersError: null,

  // Purchase Orders
  purchaseOrders: [],
  purchaseOrdersLoading: false,
  purchaseOrdersError: null,
  currentOrder: null,
  currentOrderLoading: false,
  currentOrderError: null,

  // Purchase Receipts
  purchaseReceipts: [],
  receiptsLoading: false,
  receiptsError: null,

  // Purchase Payments
  purchasePayments: [],
  paymentsLoading: false,
  paymentsError: null,

  // Statistics
  statistics: null,
  statisticsLoading: false,
  statisticsError: null,

  // General
  error: null,
  loading: false,

  // Pagination
  pagination: {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  }
}

const purchaseSystemSlice = createSlice({
  name: 'purchaseSystem',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    resetPurchaseOrders: (state) => {
      state.purchaseOrders = []
      state.pagination = initialState.pagination
    }
  },
  extraReducers: (builder) => {
    // Get Suppliers
    builder
      .addCase(getSuppliers.pending, (state) => {
        state.suppliersLoading = true
        state.suppliersError = null
      })
      .addCase(getSuppliers.fulfilled, (state, action) => {
        state.suppliersLoading = false
        state.suppliers = action.payload.data || action.payload
      })
      .addCase(getSuppliers.rejected, (state, action) => {
        state.suppliersLoading = false
        state.suppliersError = action.payload
      })

    // Get Purchase Orders
    builder
      .addCase(getPurchaseOrders.pending, (state) => {
        state.purchaseOrdersLoading = true
        state.purchaseOrdersError = null
      })
      .addCase(getPurchaseOrders.fulfilled, (state, action) => {
        state.purchaseOrdersLoading = false
        state.purchaseOrders = action.payload.data || action.payload
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination
        }
      })
      .addCase(getPurchaseOrders.rejected, (state, action) => {
        state.purchaseOrdersLoading = false
        state.purchaseOrdersError = action.payload
      })

    // Create Purchase Order
    builder
      .addCase(createPurchaseOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.loading = false
        // Add the new order to the list if it exists
        if (state.purchaseOrders && Array.isArray(state.purchaseOrders)) {
          state.purchaseOrders.unshift(action.payload)
        }
      })
      .addCase(createPurchaseOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Update Purchase Order
    builder
      .addCase(updatePurchaseOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
        state.loading = false
        // Update the order in the list
        const index = state.purchaseOrders.findIndex(order => order.id === action.payload.id)
        if (index !== -1) {
          state.purchaseOrders[index] = action.payload
        }
        // Update current order if it matches
        if (state.currentOrder && state.currentOrder.id === action.payload.id) {
          state.currentOrder = action.payload
        }
      })
      .addCase(updatePurchaseOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Delete Purchase Order
    builder
      .addCase(deletePurchaseOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deletePurchaseOrder.fulfilled, (state, action) => {
        state.loading = false
        // Remove the order from the list
        state.purchaseOrders = state.purchaseOrders.filter(order => order.id !== action.payload)
        // Clear current order if it matches
        if (state.currentOrder && state.currentOrder.id === action.payload) {
          state.currentOrder = null
        }
      })
      .addCase(deletePurchaseOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Get Purchase Order Details
    builder
      .addCase(getPurchaseOrderDetails.pending, (state) => {
        state.currentOrderLoading = true
        state.currentOrderError = null
      })
      .addCase(getPurchaseOrderDetails.fulfilled, (state, action) => {
        state.currentOrderLoading = false
        state.currentOrder = action.payload.data || action.payload
      })
      .addCase(getPurchaseOrderDetails.rejected, (state, action) => {
        state.currentOrderLoading = false
        state.currentOrderError = action.payload
      })

    // Export Purchase Order PDF
    builder
      .addCase(exportPurchaseOrderPDF.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(exportPurchaseOrderPDF.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(exportPurchaseOrderPDF.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Get Purchase Receipts
    builder
      .addCase(getPurchaseReceipts.pending, (state) => {
        state.receiptsLoading = true
        state.receiptsError = null
      })
      .addCase(getPurchaseReceipts.fulfilled, (state, action) => {
        state.receiptsLoading = false
        state.purchaseReceipts = action.payload.data || action.payload
      })
      .addCase(getPurchaseReceipts.rejected, (state, action) => {
        state.receiptsLoading = false
        state.receiptsError = action.payload
      })

    // Create Purchase Receipt
    builder
      .addCase(createPurchaseReceipt.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPurchaseReceipt.fulfilled, (state, action) => {
        state.loading = false
        // Add the new receipt to the list
        if (state.purchaseReceipts && Array.isArray(state.purchaseReceipts)) {
          state.purchaseReceipts.unshift(action.payload)
        }
      })
      .addCase(createPurchaseReceipt.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Get Purchase Payments
    builder
      .addCase(getPurchasePayments.pending, (state) => {
        state.paymentsLoading = true
        state.paymentsError = null
      })
      .addCase(getPurchasePayments.fulfilled, (state, action) => {
        state.paymentsLoading = false
        state.purchasePayments = action.payload.data || action.payload
      })
      .addCase(getPurchasePayments.rejected, (state, action) => {
        state.paymentsLoading = false
        state.paymentsError = action.payload
      })

    // Create Purchase Payment
    builder
      .addCase(createPurchasePayment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPurchasePayment.fulfilled, (state, action) => {
        state.loading = false
        // Add the new payment to the list
        if (state.purchasePayments && Array.isArray(state.purchasePayments)) {
          state.purchasePayments.unshift(action.payload)
        }
      })
      .addCase(createPurchasePayment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Get Purchase Statistics
    builder
      .addCase(getPurchaseStatistics.pending, (state) => {
        state.statisticsLoading = true
        state.statisticsError = null
      })
      .addCase(getPurchaseStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false
        state.statistics = action.payload.data || action.payload
      })
      .addCase(getPurchaseStatistics.rejected, (state, action) => {
        state.statisticsLoading = false
        state.statisticsError = action.payload
      })

    }
})

export const purchaseSystemActions = purchaseSystemSlice.actions

export default purchaseSystemSlice.reducer