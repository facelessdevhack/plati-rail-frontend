import { createSlice } from '@reduxjs/toolkit'
import { userAuthenticate } from '../api/userAPI'
import {
  checkEntry,
  getAllEntriesAdmin,
  getTodayDataEntry,
  getPaymentEntries,
  getDailyEntry,
  getPaymentMethods,
  getMiddleDealers,
  getInwardsDailyEntry,
  getPaymentDailyEntry,
  getAdminPaymentMethods,
  getAllPaymentMethods,
  getChargesDailyEntry
} from '../api/entriesAPI'
import { getAllDealersOrders } from '../api/entriesAPI'

const initialState = {
  loading: false,
  error: {},
  authError: false,
  status: 'idle',
  entries: [],
  entry: {
    dealerId: null,
    dealerName: null,
    productId: null,
    productType: 1,
    productName: null,
    quantity: null,
    price: null,
    isClaim: false,
    isRepair: false,
    transportationType: '',
    transportationCharges: null
  },

  inwardsEntries: [],
  inwardsEntry: {
    dealerId: null,
    dealerName: null,
    productId: null,
    productName: null,
    productType: 1,
    quantity: null,
    price: null,
    isClaim: false,
    isRepair: false,
    transportationType: '',
    transportationCharges: null
  },
  pmEntry: {
    dealerId: null,
    dealerName: null,
    description: null,
    amount: null
  },
  chargesEntry: {
    dealerId: null,
    dealerName: null,
    description: null,
    amount: null
  },
  allEntries: [],
  allInwardsEntries: [], // Define allEntries here
  allChargesEntries: [],
  isEditing: false,
  editingEntryId: null,
  allDealerEntries: [],
  dealerEntryCount: 0,
  dealerEntriesPagination: {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  },
  allPMEntries: [],
  pmEntryCount: 0,
  paymentEntriesPagination: {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  },
  allEntriesUser: [],
  spinLoader: false,
  allDailyEntries: [],
  allInwardsDailyEntries: [],
  allPaymentMethods: [],
  adminPaymentMethods: [],
  allAdminPaymentMethods: [],
  allMiddleDealers: [],
  allPaymentDailyEntries: [],
  allChargesDailyEntries: [],
  allDealersOrders: [],
  dealersOrdersCount: 0
}

export const entrySlice = createSlice({
  name: 'entryDetails',
  initialState,
  reducers: {
    setEntry: (state, action) => {
      state.entry = { ...state.entry, ...action.payload }
    },
    setInwardsEntry: (state, action) => {
      state.inwardsEntry = { ...state.inwardsEntry, ...action.payload }
    },
    setChargesEntry: (state, action) => {
      state.chargesEntry = { ...state.chargesEntry, ...action.payload }
    },
    resetEntry: state => {
      state.entry = {
        ...state.entry,
        productId: null,
        productType: 1,
        productName: null,
        quantity: null,
        price: null,
        isClaim: false,
        isRepair: false,
        transportationType: '',
        transportationCharges: null
      }
    },
    resetInwardsEntry: state => {
      state.inwardsEntry = initialState.inwardsEntry
    },
    resetChargesEntry: state => {
      state.chargesEntry = {
        ...state.chargesEntry,
        description: null,
        amount: null
      }
    },
    setInwardsEntries: (state, action) => {
      state.allInwardsEntries = action.payload // Update allEntries
    },
    addInwardsEntry: (state, action) => {
      state.allInwardsEntries.push(action.payload) // Update allEntries
    },
    addChargesEntry: (state, action) => {
      state.allChargesEntries.push(action.payload) // Update allEntries
    },
    updateInwardsEntryById: (state, action) => {
      const index = state.allInwardsEntries.findIndex(
        entry => entry.id === action.payload.id
      )
      if (index !== -1) {
        state.allInwardsEntries[index] = action.payload // Update allEntries
      }
    },
    deleteInwardsEntryById: (state, action) => {
      state.allInwardsEntries = state.allInwardsEntries.filter(
        entry => entry?.entryId !== action.payload
      )
    },
    updateChargesEntryById: (state, action) => {
      const index = state.allChargesEntries.findIndex(
        entry => entry.id === action.payload.id
      )
      if (index !== -1) {
        state.allChargesEntries[index] = action.payload // Update allEntries
      }
    },
    deleteChargesEntryById: (state, action) => {
      state.allChargesEntries = state.allChargesEntries.filter(
        entry => entry?.entryId !== action.payload
      )
    },
    setPMEntry: (state, action) => {
      state.pmEntry = { ...state.pmEntry, ...action.payload }
    },
    resetPMEntry: state => {
      state.pmEntry = initialState.pmEntry
    },
    setEntries: (state, action) => {
      state.allEntries = action.payload // Update allEntries
    },
    addEntry: (state, action) => {
      state.allEntries.push(action.payload) // Update allEntries
    },
    addPMEntry: (state, action) => {
      state.allPMEntries.push(action.payload) // Update allEntries
    },
    updateEntryById: (state, action) => {
      const index = state.allEntries.findIndex(
        entry => entry.id === action.payload.id
      )
      if (index !== -1) {
        state.allEntries[index] = action.payload // Update allEntries
      }
    },
    deleteEntryById: (state, action) => {
      state.allEntries = state.allEntries.filter(
        entry => entry?.entryId !== action.payload
      )
    },
    setEditing: (state, action) => {
      state.isEditing = action.payload.isEditing
      state.editingEntryId = action.payload.editingEntryId
    },
    updateDealerEntryById: (state, action) => {
      const index = state.allDealerEntries.findIndex(
        entry => entry.entryId === action.payload.entryId
      )
      if (index !== -1) {
        state.allDealerEntries[index] = {
          ...state.allDealerEntries[index],
          ...action.payload
        }
      }
    },
    updatePaymentEntryById: (state, action) => {
      const index = state.allPMEntries.findIndex(
        entry => entry.entryId === action.payload.entryId
      )
      if (index !== -1) {
        state.allPMEntries[index] = {
          ...state.allPMEntries[index],
          ...action.payload
        }
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(getAllEntriesAdmin.pending, state => {
        state.loading = true
        state.spinLoader = true
        state.status = 'pending'
        state.allDealerEntries = []
        state.dealerEntryCount = 0
      })
      .addCase(getAllEntriesAdmin.fulfilled, (state, { payload }) => {
        state.loading = false
        state.spinLoader = false
        state.status = 'fulfilled'
        if (payload.data && payload.pagination) {
          state.allDealerEntries = payload.data
          state.dealerEntriesPagination = payload.pagination
          state.dealerEntryCount = payload.pagination.total
        } else {
          state.allDealerEntries = payload.data || payload
          state.dealerEntryCount = payload.totalCount || 0
        }
        state.error = null
      })
      .addCase(getAllEntriesAdmin.rejected, (state, { payload }) => {
        state.loading = false
        state.spinLoader = false
        state.status = 'rejected'
        state.error = payload
        state.allDealerEntries = []
        state.dealerEntryCount = 0
      })
      .addCase(getTodayDataEntry.pending, state => {
        state.loading = true
        state.status = 'pending'
        state.allEntriesUser = []
      })
      .addCase(getTodayDataEntry.fulfilled, (state, { payload }) => {
        state.loading = false
        state.status = 'fulfilled'
        state.allEntriesUser = payload.data
        state.error = null
      })
      .addCase(getTodayDataEntry.rejected, (state, { payload }) => {
        state.loading = false
        state.status = 'rejected'
        state.error = payload
        state.allEntriesUser = []
      })
      .addCase(getDailyEntry.pending, state => {
        state.loading = true
        state.status = 'pending'
        state.allDailyEntries = []
      })
      .addCase(getDailyEntry.fulfilled, (state, { payload }) => {
        state.loading = false
        state.status = 'fulfilled'
        state.allDailyEntries = payload.data
        state.error = null
      })
      .addCase(getDailyEntry.rejected, (state, { payload }) => {
        state.loading = false
        state.status = 'rejected'
        state.error = payload
        state.allDailyEntries = []
      })
      .addCase(getAllDealersOrders.pending, state => {
        state.loading = true
        state.status = 'pending'
        state.allDealersOrders = []
        state.dealersOrdersCount = 0
      })
      .addCase(getAllDealersOrders.fulfilled, (state, { payload }) => {
        state.loading = false
        state.status = 'fulfilled'
        state.allDealersOrders = payload.data || payload
        state.dealersOrdersCount = payload.totalCount || 0
        state.error = null
      })
      .addCase(getAllDealersOrders.rejected, (state, { payload }) => {
        state.loading = false
        state.status = 'rejected'
        state.error = payload
        state.allDealersOrders = []
        state.dealersOrdersCount = 0
      })
      .addCase(getInwardsDailyEntry.pending, state => {
        state.loading = true
        state.status = 'pending'
        state.allInwardsDailyEntries = []
      })
      .addCase(getInwardsDailyEntry.fulfilled, (state, { payload }) => {
        state.loading = false
        state.status = 'fulfilled'
        state.allInwardsDailyEntries = payload.data
        state.error = null
      })
      .addCase(getInwardsDailyEntry.rejected, (state, { payload }) => {
        state.loading = false
        state.status = 'rejected'
        state.error = payload
        state.allInwardsDailyEntries = []
      })
      .addCase(getPaymentDailyEntry.pending, state => {
        state.loading = true
        state.status = 'pending'
        state.allPaymentDailyEntries = []
      })
      .addCase(getPaymentDailyEntry.fulfilled, (state, { payload }) => {
        state.loading = false
        state.status = 'fulfilled'
        state.allPaymentDailyEntries = payload.data
        state.error = null
      })
      .addCase(getPaymentDailyEntry.rejected, (state, { payload }) => {
        state.loading = false
        state.status = 'rejected'
        state.error = payload
        state.allPaymentDailyEntries = []
      })
      .addCase(getChargesDailyEntry.pending, state => {
        state.loading = true
        state.status = 'pending'
        state.allChargesDailyEntries = []
      })
      .addCase(getChargesDailyEntry.fulfilled, (state, { payload }) => {
        state.loading = false
        state.status = 'fulfilled'
        state.allChargesDailyEntries = payload.data
        state.error = null
      })
      .addCase(getChargesDailyEntry.rejected, (state, { payload }) => {
        state.loading = false
        state.status = 'rejected'
        state.error = payload
        state.allChargesDailyEntries = []
      })
      .addCase(getPaymentMethods.pending, state => {
        state.loading = true
        state.status = 'pending'
        state.allPaymentMethods = []
      })
      .addCase(getPaymentMethods.fulfilled, (state, { payload }) => {
        state.loading = false
        state.status = 'fulfilled'
        state.allPaymentMethods = payload
        state.error = null
      })
      .addCase(getPaymentMethods.rejected, (state, { payload }) => {
        state.loading = false
        state.status = 'rejected'
        state.error = payload
        state.allPaymentMethods = []
      })
      .addCase(getAdminPaymentMethods.pending, state => {
        state.loading = true
        state.status = 'pending'
        state.adminPaymentMethods = []
      })
      .addCase(getAdminPaymentMethods.fulfilled, (state, { payload }) => {
        state.loading = false
        state.status = 'fulfilled'
        state.adminPaymentMethods = payload
        state.error = null
      })
      .addCase(getAdminPaymentMethods.rejected, (state, { payload }) => {
        state.loading = false
        state.status = 'rejected'
        state.error = payload
        state.adminPaymentMethods = []
      })
      .addCase(getAllPaymentMethods.pending, state => {
        state.loading = true
        state.status = 'pending'
        state.allAdminPaymentMethods = []
      })
      .addCase(getAllPaymentMethods.fulfilled, (state, { payload }) => {
        state.loading = false
        state.status = 'fulfilled'
        state.allAdminPaymentMethods = payload
        state.error = null
      })
      .addCase(getAllPaymentMethods.rejected, (state, { payload }) => {
        state.loading = false
        state.status = 'rejected'
        state.error = payload
        state.allAdminPaymentMethods = []
      })
      .addCase(getMiddleDealers.pending, state => {
        state.loading = true
        state.status = 'pending'
        state.allMiddleDealers = []
      })
      .addCase(getMiddleDealers.fulfilled, (state, { payload }) => {
        state.loading = false
        state.status = 'fulfilled'
        state.allMiddleDealers = payload
        state.error = null
      })
      .addCase(getMiddleDealers.rejected, (state, { payload }) => {
        state.loading = false
        state.status = 'rejected'
        state.error = payload
        state.allMiddleDealers = []
      })
      .addCase(getPaymentEntries.pending, state => {
        state.loading = true
        state.spinLoader = true
        state.status = 'pending'
        state.allPMEntries = []
      })
      .addCase(getPaymentEntries.fulfilled, (state, { payload }) => {
        state.loading = false
        state.spinLoader = false
        state.status = 'fulfilled'
        state.loggedIn = true
        if (payload.data && payload.pagination) {
          state.allPMEntries = payload.data
          state.paymentEntriesPagination = payload.pagination
          state.pmEntryCount = payload.pagination.total
        } else {
          state.allPMEntries = payload.data || payload
          state.pmEntryCount = payload.totalCount || 0
        }
        state.error = null
      })
      .addCase(getPaymentEntries.rejected, (state, { payload }) => {
        state.loading = false
        state.spinLoader = false
        state.status = 'rejected'
        state.error = payload
        state.allPMEntries = []
        state.pmEntryCount = 0
      })
  }
})

export const {
  setEntry,
  resetEntry,
  setEntries,
  addEntry,
  updateEntryById,
  deleteEntryById,
  setEditing,
  updateDealerEntryById,
  addPMEntry,
  resetPMEntry,
  setPMEntry,
  addInwardsEntry,
  resetInwardsEntry,
  setInwardsEntries,
  updateInwardsEntryById,
  deleteInwardsEntryById,
  setInwardsEntry,
  updatePaymentEntryById,
  setChargesEntry,
  resetChargesEntry,
  addChargesEntry,
  updateChargesEntryById
} = entrySlice.actions
export default entrySlice.reducer
