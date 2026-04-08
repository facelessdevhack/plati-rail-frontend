import { createSlice } from '@reduxjs/toolkit'
import {
  createRequisition, getRequisitions, getPendingRequisitionCount, getRequisitionById, approveRequisition, rejectRequisition,
  getItemCategories, createItemCategory, updateItemCategory,
  getItemSubcategories, createItemSubcategory, updateItemSubcategory,
  getItems, createItem, updateItem,
  getIndents, getIndentById, createIndent,
  getPurchaseOrders, getPurchaseOrderById, createPurchaseOrder, updatePurchaseOrderStatus, getVendors,
  getGRNs, getGRNById, createGRN, completeGRN
} from '../api/purchaseV2API'

const initialState = {
  // Requisitions
  requisitions: [],
  currentRequisition: null,
  pendingRequisitionCount: 0,
  requisitionsPagination: { currentPage: 1, pageSize: 20, total: 0, totalPages: 0 },

  // Item Categories & Subcategories
  itemCategories: [],
  itemSubcategories: [],

  // Items Master
  items: [],
  itemsPagination: { currentPage: 1, pageSize: 50, total: 0, totalPages: 0 },

  // Indents
  indents: [],
  currentIndent: null,
  indentsPagination: { currentPage: 1, pageSize: 20, total: 0, totalPages: 0 },

  // Purchase Orders
  purchaseOrders: [],
  currentPurchaseOrder: null,
  purchaseOrdersPagination: { currentPage: 1, pageSize: 20, total: 0, totalPages: 0 },
  vendors: [],

  // GRN
  grnList: [],
  currentGRN: null,
  grnPagination: { currentPage: 1, pageSize: 20, total: 0, totalPages: 0 },

  // UI state
  loading: false,
  error: null,
  success: null
}

const purchaseV2Slice = createSlice({
  name: 'purchaseV2',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null },
    clearSuccess: (state) => { state.success = null },
    clearCurrentRequisition: (state) => { state.currentRequisition = null },
    clearCurrentIndent: (state) => { state.currentIndent = null },
    clearCurrentGRN: (state) => { state.currentGRN = null },
    clearCurrentPurchaseOrder: (state) => { state.currentPurchaseOrder = null }
  },
  extraReducers: (builder) => {
    // ---- Requisitions ----
    builder
      .addCase(getRequisitions.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getRequisitions.fulfilled, (state, action) => {
        state.loading = false
        state.requisitions = action.payload.data || []
        state.requisitionsPagination = action.payload.pagination || state.requisitionsPagination
      })
      .addCase(getRequisitions.rejected, (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(getPendingRequisitionCount.fulfilled, (state, action) => {
        state.pendingRequisitionCount = action.payload.count || 0
      })

      .addCase(getRequisitionById.pending, (state) => { state.loading = true })
      .addCase(getRequisitionById.fulfilled, (state, action) => {
        state.loading = false
        state.currentRequisition = action.payload.data
      })
      .addCase(getRequisitionById.rejected, (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(approveRequisition.fulfilled, (state, action) => {
        state.success = 'Requisition approved'
        const updated = action.payload.data
        const idx = state.requisitions.findIndex(r => r.id === updated.id)
        if (idx !== -1) state.requisitions[idx] = updated
        if (state.currentRequisition?.id === updated.id) state.currentRequisition = updated
      })
      .addCase(rejectRequisition.fulfilled, (state, action) => {
        state.success = 'Requisition rejected'
        const updated = action.payload.data
        const idx = state.requisitions.findIndex(r => r.id === updated.id)
        if (idx !== -1) state.requisitions[idx] = updated
        if (state.currentRequisition?.id === updated.id) state.currentRequisition = updated
      })
      .addCase(createRequisition.pending, (state) => { state.loading = true; state.error = null })
      .addCase(createRequisition.fulfilled, (state, action) => {
        state.loading = false
        state.success = `${action.payload.data?.prNumber} submitted successfully`
      })
      .addCase(createRequisition.rejected, (state, action) => { state.loading = false; state.error = action.payload })

    // ---- Item Categories ----
    builder
      .addCase(getItemCategories.fulfilled, (state, action) => {
        state.itemCategories = action.payload.data || []
      })
      .addCase(createItemCategory.fulfilled, (state, action) => {
        state.itemCategories.push(action.payload.data)
        state.success = 'Category created'
      })
      .addCase(updateItemCategory.fulfilled, (state, action) => {
        const updated = action.payload.data
        const idx = state.itemCategories.findIndex(c => c.id === updated.id)
        if (idx !== -1) state.itemCategories[idx] = updated
      })

    // ---- Item Subcategories ----
    builder
      .addCase(getItemSubcategories.fulfilled, (state, action) => {
        state.itemSubcategories = action.payload.data || []
      })
      .addCase(createItemSubcategory.fulfilled, (state, action) => {
        state.itemSubcategories.push(action.payload.data)
        state.success = 'Subcategory created'
      })
      .addCase(updateItemSubcategory.fulfilled, (state, action) => {
        const updated = action.payload.data
        const idx = state.itemSubcategories.findIndex(s => s.id === updated.id)
        if (idx !== -1) state.itemSubcategories[idx] = updated
      })

    // ---- Items Master ----
    builder
      .addCase(getItems.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getItems.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data || []
        state.itemsPagination = action.payload.pagination || state.itemsPagination
      })
      .addCase(getItems.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(createItem.fulfilled, (state, action) => {
        state.items.unshift(action.payload.data)
        state.success = 'Item created'
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        const updated = action.payload.data
        const idx = state.items.findIndex(i => i.id === updated.id)
        if (idx !== -1) state.items[idx] = updated
        state.success = 'Item updated'
      })

    // ---- Indents ----
    builder
      .addCase(getIndents.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getIndents.fulfilled, (state, action) => {
        state.loading = false
        state.indents = action.payload.data || []
        state.indentsPagination = action.payload.pagination || state.indentsPagination
      })
      .addCase(getIndents.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(getIndentById.pending, (state) => { state.loading = true })
      .addCase(getIndentById.fulfilled, (state, action) => {
        state.loading = false
        state.currentIndent = action.payload.data
      })
      .addCase(getIndentById.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(createIndent.pending, (state) => { state.loading = true; state.error = null })
      .addCase(createIndent.fulfilled, (state, action) => {
        state.loading = false
        state.success = `Indent ${action.payload.data?.indentNumber} created`
      })
      .addCase(createIndent.rejected, (state, action) => { state.loading = false; state.error = action.payload })

    // ---- Purchase Orders ----
    builder
      .addCase(getPurchaseOrders.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false
        state.purchaseOrders = action.payload.data || []
        state.purchaseOrdersPagination = action.payload.pagination || state.purchaseOrdersPagination
      })
      .addCase(getPurchaseOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(getPurchaseOrderById.pending, (state) => { state.loading = true })
      .addCase(getPurchaseOrderById.fulfilled, (state, action) => {
        state.loading = false
        state.currentPurchaseOrder = action.payload.data
      })
      .addCase(getPurchaseOrderById.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(createPurchaseOrder.pending, (state) => { state.loading = true; state.error = null })
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.loading = false
        state.success = `PO ${action.payload.data?.orderNumber} created`
      })
      .addCase(createPurchaseOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(updatePurchaseOrderStatus.fulfilled, (state, action) => {
        const updated = action.payload.data
        const idx = state.purchaseOrders.findIndex(p => p.id === updated.id)
        if (idx !== -1) state.purchaseOrders[idx] = updated
        if (state.currentPurchaseOrder?.id === updated.id) state.currentPurchaseOrder = updated
      })
      .addCase(getVendors.fulfilled, (state, action) => {
        state.vendors = action.payload.data || []
      })

    // ---- GRN ----
    builder
      .addCase(getGRNs.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getGRNs.fulfilled, (state, action) => {
        state.loading = false
        state.grnList = action.payload.data || []
        state.grnPagination = action.payload.pagination || state.grnPagination
      })
      .addCase(getGRNs.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(getGRNById.fulfilled, (state, action) => {
        state.currentGRN = action.payload.data
      })
      .addCase(createGRN.pending, (state) => { state.loading = true; state.error = null })
      .addCase(createGRN.fulfilled, (state, action) => {
        state.loading = false
        state.success = `GRN ${action.payload.data?.grnNumber} created`
      })
      .addCase(createGRN.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(completeGRN.fulfilled, (state) => {
        state.success = 'GRN completed — inventory updated'
      })
  }
})

export const { clearError, clearSuccess, clearCurrentRequisition, clearCurrentIndent, clearCurrentGRN, clearCurrentPurchaseOrder } = purchaseV2Slice.actions
export default purchaseV2Slice.reducer
