import { createSlice } from '@reduxjs/toolkit'
import {
  // Vendors (replaced suppliers)
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  // Molds
  getMoldsForPurchase,
  // Legacy suppliers
  getSuppliers,
  // Purchase orders
  getPurchaseOrders,
  getPurchaseOrderStats,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  getPurchaseOrderDetails,
  exportPurchaseOrderPDF,
  // Receipts & payments
  getPurchaseReceipts,
  createPurchaseReceipt,
  getPurchasePayments,
  createPurchasePayment,
  getPurchaseStatistics
} from '../api/purchaseSystemAPI'

const initialState = {
  // Vendors (replaced suppliers)
  vendors: [],
  vendorsLoading: false,
  vendorsError: null,
  selectedVendor: null,

  // Molds
  molds: [],
  moldsLoading: false,
  moldsError: null,

  // Legacy suppliers (backward compatibility - maps to vendors)
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

  // Purchase Order Stats
  orderStats: null,
  orderStatsLoading: false,
  orderStatsError: null,

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
    },
    setSelectedVendor: (state, action) => {
      state.selectedVendor = action.payload
    },
    clearSelectedVendor: (state) => {
      state.selectedVendor = null
    }
  },
  extraReducers: (builder) => {
    // =============================================
    // VENDOR REDUCERS (replaced suppliers)
    // =============================================

    // Get Vendors
    builder
      .addCase(getVendors.pending, (state) => {
        state.vendorsLoading = true
        state.vendorsError = null
      })
      .addCase(getVendors.fulfilled, (state, action) => {
        state.vendorsLoading = false
        state.vendors = action.payload.data || action.payload || []
        // Also update suppliers for backward compatibility
        state.suppliers = state.vendors
      })
      .addCase(getVendors.rejected, (state, action) => {
        state.vendorsLoading = false
        state.vendorsError = action.payload
      })

    // Get Vendor By ID
    builder
      .addCase(getVendorById.pending, (state) => {
        state.vendorsLoading = true
        state.vendorsError = null
      })
      .addCase(getVendorById.fulfilled, (state, action) => {
        state.vendorsLoading = false
        state.selectedVendor = action.payload.data || action.payload
      })
      .addCase(getVendorById.rejected, (state, action) => {
        state.vendorsLoading = false
        state.vendorsError = action.payload
      })

    // Create Vendor
    builder
      .addCase(createVendor.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.loading = false
        const newVendor = action.payload.data || action.payload
        if (newVendor) {
          state.vendors.unshift(newVendor)
          state.suppliers = state.vendors
        }
      })
      .addCase(createVendor.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Update Vendor
    builder
      .addCase(updateVendor.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        state.loading = false
        const updatedVendor = action.payload.data || action.payload
        const index = state.vendors.findIndex(v => v.id === updatedVendor?.id)
        if (index !== -1 && updatedVendor) {
          state.vendors[index] = updatedVendor
          state.suppliers = state.vendors
        }
      })
      .addCase(updateVendor.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Delete Vendor
    builder
      .addCase(deleteVendor.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.loading = false
        state.vendors = state.vendors.filter(v => v.id !== action.payload)
        state.suppliers = state.vendors
      })
      .addCase(deleteVendor.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // =============================================
    // MOLD REDUCERS
    // =============================================

    // Get Molds for Purchase
    builder
      .addCase(getMoldsForPurchase.pending, (state) => {
        state.moldsLoading = true
        state.moldsError = null
      })
      .addCase(getMoldsForPurchase.fulfilled, (state, action) => {
        state.moldsLoading = false
        state.molds = action.payload.data || action.payload || []
      })
      .addCase(getMoldsForPurchase.rejected, (state, action) => {
        state.moldsLoading = false
        state.moldsError = action.payload
      })

    // =============================================
    // LEGACY SUPPLIER REDUCERS (backward compatibility)
    // =============================================

    // Get Suppliers (maps to vendors)
    builder
      .addCase(getSuppliers.pending, (state) => {
        state.suppliersLoading = true
        state.suppliersError = null
      })
      .addCase(getSuppliers.fulfilled, (state, action) => {
        state.suppliersLoading = false
        state.suppliers = action.payload.data || action.payload || []
        state.vendors = state.suppliers
      })
      .addCase(getSuppliers.rejected, (state, action) => {
        state.suppliersLoading = false
        state.suppliersError = action.payload
      })

    // =============================================
    // PURCHASE ORDER REDUCERS
    // =============================================

    // Get Purchase Orders
    builder
      .addCase(getPurchaseOrders.pending, (state) => {
        state.purchaseOrdersLoading = true
        state.purchaseOrdersError = null
      })
      .addCase(getPurchaseOrders.fulfilled, (state, action) => {
        state.purchaseOrdersLoading = false
        state.purchaseOrders = action.payload.data || action.payload || []
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination
        }
      })
      .addCase(getPurchaseOrders.rejected, (state, action) => {
        state.purchaseOrdersLoading = false
        state.purchaseOrdersError = action.payload
      })

    // Get Purchase Order Stats
    builder
      .addCase(getPurchaseOrderStats.pending, (state) => {
        state.orderStatsLoading = true
        state.orderStatsError = null
      })
      .addCase(getPurchaseOrderStats.fulfilled, (state, action) => {
        state.orderStatsLoading = false
        state.orderStats = action.payload.data || action.payload
      })
      .addCase(getPurchaseOrderStats.rejected, (state, action) => {
        state.orderStatsLoading = false
        state.orderStatsError = action.payload
      })

    // Create Purchase Order
    builder
      .addCase(createPurchaseOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.loading = false
        const newOrder = action.payload.data || action.payload
        if (newOrder && state.purchaseOrders && Array.isArray(state.purchaseOrders)) {
          state.purchaseOrders.unshift(newOrder)
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
        const updatedOrder = action.payload.data || action.payload
        if (updatedOrder) {
          const index = state.purchaseOrders.findIndex(order => order.id === updatedOrder.id)
          if (index !== -1) {
            state.purchaseOrders[index] = updatedOrder
          }
          if (state.currentOrder && state.currentOrder.id === updatedOrder.id) {
            state.currentOrder = updatedOrder
          }
        }
      })
      .addCase(updatePurchaseOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Update Purchase Order Status
    builder
      .addCase(updatePurchaseOrderStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePurchaseOrderStatus.fulfilled, (state, action) => {
        state.loading = false
        const updatedOrder = action.payload.data || action.payload
        if (updatedOrder) {
          const index = state.purchaseOrders.findIndex(order => order.id === updatedOrder.id)
          if (index !== -1) {
            state.purchaseOrders[index] = updatedOrder
          }
          if (state.currentOrder && state.currentOrder.id === updatedOrder.id) {
            state.currentOrder = updatedOrder
          }
        }
      })
      .addCase(updatePurchaseOrderStatus.rejected, (state, action) => {
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
        state.purchaseOrders = state.purchaseOrders.filter(order => order.id !== action.payload)
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

    // =============================================
    // RECEIPT & PAYMENT REDUCERS
    // =============================================

    // Get Purchase Receipts
    builder
      .addCase(getPurchaseReceipts.pending, (state) => {
        state.receiptsLoading = true
        state.receiptsError = null
      })
      .addCase(getPurchaseReceipts.fulfilled, (state, action) => {
        state.receiptsLoading = false
        state.purchaseReceipts = action.payload.data || action.payload || []
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
        const newReceipt = action.payload.data || action.payload
        if (newReceipt && state.purchaseReceipts && Array.isArray(state.purchaseReceipts)) {
          state.purchaseReceipts.unshift(newReceipt)
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
        state.purchasePayments = action.payload.data || action.payload || []
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
        const newPayment = action.payload.data || action.payload
        if (newPayment && state.purchasePayments && Array.isArray(state.purchasePayments)) {
          state.purchasePayments.unshift(newPayment)
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
