import { createSlice } from '@reduxjs/toolkit'
import {
  // CRUD
  getMolds,
  getMoldById,
  createMold,
  updateMold,
  deleteMold,
  // Dispatch
  dispatchMoldToVendor,
  receiveMoldFromVendor,
  getDispatchHistory,
  // Production
  logProduction,
  getProductionLogs,
  // Maintenance
  createMaintenance,
  completeMaintenance,
  getMaintenanceHistory,
  // Alerts
  getMoldAlerts,
  markAlertAsRead,
  resolveAlert,
  // Dashboard
  getMoldDashboard,
  getMoldsByVendor,
  // Master Data
  getVendors,
  getInchesMaster,
  getModelMaster
} from '../api/moldManagementAPI'

const initialState = {
  // Loading states
  loading: false,
  success: false,
  error: null,

  // Molds list
  molds: [],
  totalMolds: 0,
  currentPage: 1,
  pageSize: 10,
  selectedMold: null,

  // Master Data
  vendors: [],
  inchesMaster: [],
  modelMaster: [],

  // Dispatch history
  dispatchHistory: [],
  totalDispatchHistory: 0,

  // Production logs
  productionLogs: [],
  totalProductionLogs: 0,

  // Maintenance history
  maintenanceHistory: [],
  totalMaintenanceHistory: 0,

  // Alerts
  alerts: [],
  unreadAlertsCount: 0,

  // Dashboard data
  dashboard: {
    totalMolds: 0,
    moldsInHouse: 0,
    moldsWithVendors: 0,
    moldsUnderMaintenance: 0,
    moldsRetired: 0,
    criticalLifeMolds: 0,
    warningLifeMolds: 0,
    totalProductionQuantity: 0,
    recentDispatchActivity: [],
    vendorDistribution: []
  },

  // Molds by vendor
  moldsByVendor: [],

  // Filters
  filters: {
    search: '',
    status: '',
    vendorId: null
  },

  // UI states
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isDispatching: false,
  isReceiving: false,
  showCreateModal: false,
  showDetailsModal: false,
  showDispatchModal: false,
  showReceiveModal: false,
  showMaintenanceModal: false,
  showProductionLogModal: false
}

const moldManagementSlice = createSlice({
  name: 'moldManagement',
  initialState,
  reducers: {
    // UI state management
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    },
    setSelectedMold: (state, action) => {
      state.selectedMold = action.payload
    },

    // Modal controls
    toggleCreateModal: (state) => {
      state.showCreateModal = !state.showCreateModal
    },
    toggleDetailsModal: (state) => {
      state.showDetailsModal = !state.showDetailsModal
    },
    toggleDispatchModal: (state) => {
      state.showDispatchModal = !state.showDispatchModal
    },
    toggleReceiveModal: (state) => {
      state.showReceiveModal = !state.showReceiveModal
    },
    toggleMaintenanceModal: (state) => {
      state.showMaintenanceModal = !state.showMaintenanceModal
    },
    toggleProductionLogModal: (state) => {
      state.showProductionLogModal = !state.showProductionLogModal
    },

    // Reset states
    clearError: (state) => {
      state.error = null
    },
    resetSuccess: (state) => {
      state.success = false
    },
    resetMoldManagementState: () => {
      return initialState
    }
  },
  extraReducers: (builder) => {
    builder
      // =============================================
      // Get Molds
      // =============================================
      .addCase(getMolds.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMolds.fulfilled, (state, action) => {
        state.loading = false
        state.molds = action.payload.data || []
        state.totalMolds = action.payload.total || 0
        state.currentPage = action.payload.page || 1
        state.success = true
      })
      .addCase(getMolds.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // =============================================
      // Get Mold By ID
      // =============================================
      .addCase(getMoldById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMoldById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedMold = action.payload.data
        state.success = true
      })
      .addCase(getMoldById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // =============================================
      // Create Mold
      // =============================================
      .addCase(createMold.pending, (state) => {
        state.isCreating = true
        state.error = null
      })
      .addCase(createMold.fulfilled, (state) => {
        state.isCreating = false
        state.success = true
        state.showCreateModal = false
      })
      .addCase(createMold.rejected, (state, action) => {
        state.isCreating = false
        state.error = action.payload
      })

      // =============================================
      // Update Mold
      // =============================================
      .addCase(updateMold.pending, (state) => {
        state.isUpdating = true
        state.error = null
      })
      .addCase(updateMold.fulfilled, (state) => {
        state.isUpdating = false
        state.success = true
        state.showDetailsModal = false
      })
      .addCase(updateMold.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload
      })

      // =============================================
      // Delete Mold
      // =============================================
      .addCase(deleteMold.pending, (state) => {
        state.isDeleting = true
        state.error = null
      })
      .addCase(deleteMold.fulfilled, (state, action) => {
        state.isDeleting = false
        state.success = true
        state.molds = state.molds.filter((mold) => mold.id !== action.payload.moldId)
        state.totalMolds -= 1
      })
      .addCase(deleteMold.rejected, (state, action) => {
        state.isDeleting = false
        state.error = action.payload
      })

      // =============================================
      // Dispatch Mold to Vendor
      // =============================================
      .addCase(dispatchMoldToVendor.pending, (state) => {
        state.isDispatching = true
        state.error = null
      })
      .addCase(dispatchMoldToVendor.fulfilled, (state) => {
        state.isDispatching = false
        state.success = true
        state.showDispatchModal = false
      })
      .addCase(dispatchMoldToVendor.rejected, (state, action) => {
        state.isDispatching = false
        state.error = action.payload
      })

      // =============================================
      // Receive Mold from Vendor
      // =============================================
      .addCase(receiveMoldFromVendor.pending, (state) => {
        state.isReceiving = true
        state.error = null
      })
      .addCase(receiveMoldFromVendor.fulfilled, (state) => {
        state.isReceiving = false
        state.success = true
        state.showReceiveModal = false
      })
      .addCase(receiveMoldFromVendor.rejected, (state, action) => {
        state.isReceiving = false
        state.error = action.payload
      })

      // =============================================
      // Get Dispatch History
      // =============================================
      .addCase(getDispatchHistory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getDispatchHistory.fulfilled, (state, action) => {
        state.loading = false
        state.dispatchHistory = action.payload.data || []
        state.totalDispatchHistory = action.payload.total || 0
      })
      .addCase(getDispatchHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // =============================================
      // Log Production
      // =============================================
      .addCase(logProduction.pending, (state) => {
        state.isCreating = true
        state.error = null
      })
      .addCase(logProduction.fulfilled, (state) => {
        state.isCreating = false
        state.success = true
        state.showProductionLogModal = false
      })
      .addCase(logProduction.rejected, (state, action) => {
        state.isCreating = false
        state.error = action.payload
      })

      // =============================================
      // Get Production Logs
      // =============================================
      .addCase(getProductionLogs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getProductionLogs.fulfilled, (state, action) => {
        state.loading = false
        state.productionLogs = action.payload.data || []
        state.totalProductionLogs = action.payload.total || 0
      })
      .addCase(getProductionLogs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // =============================================
      // Create Maintenance
      // =============================================
      .addCase(createMaintenance.pending, (state) => {
        state.isCreating = true
        state.error = null
      })
      .addCase(createMaintenance.fulfilled, (state) => {
        state.isCreating = false
        state.success = true
        state.showMaintenanceModal = false
      })
      .addCase(createMaintenance.rejected, (state, action) => {
        state.isCreating = false
        state.error = action.payload
      })

      // =============================================
      // Complete Maintenance
      // =============================================
      .addCase(completeMaintenance.pending, (state) => {
        state.isUpdating = true
        state.error = null
      })
      .addCase(completeMaintenance.fulfilled, (state) => {
        state.isUpdating = false
        state.success = true
      })
      .addCase(completeMaintenance.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload
      })

      // =============================================
      // Get Maintenance History
      // =============================================
      .addCase(getMaintenanceHistory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMaintenanceHistory.fulfilled, (state, action) => {
        state.loading = false
        state.maintenanceHistory = action.payload.data || []
        state.totalMaintenanceHistory = action.payload.total || 0
      })
      .addCase(getMaintenanceHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // =============================================
      // Get Alerts
      // =============================================
      .addCase(getMoldAlerts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMoldAlerts.fulfilled, (state, action) => {
        state.loading = false
        state.alerts = action.payload.data || []
        state.unreadAlertsCount = (action.payload.data || []).filter(
          (alert) => !alert.isRead
        ).length
      })
      .addCase(getMoldAlerts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // =============================================
      // Mark Alert as Read
      // =============================================
      .addCase(markAlertAsRead.fulfilled, (state, action) => {
        const alertId = action.meta.arg
        const alert = state.alerts.find((a) => a.id === alertId)
        if (alert) {
          alert.isRead = true
          state.unreadAlertsCount = Math.max(0, state.unreadAlertsCount - 1)
        }
      })

      // =============================================
      // Resolve Alert
      // =============================================
      .addCase(resolveAlert.fulfilled, (state, action) => {
        const alertId = action.meta.arg
        const alert = state.alerts.find((a) => a.id === alertId)
        if (alert) {
          alert.isResolved = true
          alert.resolvedAt = new Date().toISOString()
        }
      })

      // =============================================
      // Get Dashboard
      // =============================================
      .addCase(getMoldDashboard.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMoldDashboard.fulfilled, (state, action) => {
        state.loading = false
        state.dashboard = action.payload.data || initialState.dashboard
      })
      .addCase(getMoldDashboard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // =============================================
      // Get Molds by Vendor
      // =============================================
      .addCase(getMoldsByVendor.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMoldsByVendor.fulfilled, (state, action) => {
        state.loading = false
        state.moldsByVendor = action.payload.data || []
      })
      .addCase(getMoldsByVendor.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // =============================================
      // Get Vendors
      // =============================================
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

      // =============================================
      // Get Inches Master (Sizes)
      // =============================================
      .addCase(getInchesMaster.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getInchesMaster.fulfilled, (state, action) => {
        state.loading = false
        state.inchesMaster = action.payload.data || []
      })
      .addCase(getInchesMaster.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // =============================================
      // Get Model Master
      // =============================================
      .addCase(getModelMaster.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getModelMaster.fulfilled, (state, action) => {
        state.loading = false
        state.modelMaster = action.payload.data || []
      })
      .addCase(getModelMaster.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMold,
  toggleCreateModal,
  toggleDetailsModal,
  toggleDispatchModal,
  toggleReceiveModal,
  toggleMaintenanceModal,
  toggleProductionLogModal,
  clearError,
  resetSuccess,
  resetMoldManagementState
} = moldManagementSlice.actions

export default moldManagementSlice.reducer
