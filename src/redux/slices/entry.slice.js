import { createSlice } from '@reduxjs/toolkit';
import { userAuthenticate } from '../api/userAPI';
import { checkEntry, getAllEntriesAdmin, getTodayDataEntry, getPaymentEntries, getDailyEntry, getPaymentMethods, getMiddleDealers } from '../api/entriesAPI';

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
    transportationCharges: null,
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
    transportationCharges: null,
  },
  pmEntry: {
    dealerId: null,
    dealerName: null,
    description: null,
    amount: null,
  },
  allEntries: [],
  allInwardsEntries: [], // Define allEntries here
  isEditing: false,
  editingEntryId: null,
  allDealerEntries: [],
  dealerEntryCount: 0,
  allPMEntries: [],
  pmEntryCount: 0,
  allEntriesUser: [],
  spinLoader: false,
  allDailyEntries: [],
  allPaymentMethods: [],
  allMiddleDealers: []
};

export const entrySlice = createSlice({
  name: 'entryDetails',
  initialState,
  reducers: {
    setEntry: (state, action) => {
      state.entry = { ...state.entry, ...action.payload };
    },
    setInwardsEntry: (state, action) => {
      state.inwardsEntry = { ...state.inwardsEntry, ...action.payload };
    },
    resetEntry: (state) => {
      state.entry = initialState.entry;
    },
    resetInwardsEntry: (state) => {
      state.inwardsEntry = initialState.inwardsEntry;
    },
    setInwardsEntries: (state, action) => {
      state.allInwardsEntries = action.payload; // Update allEntries
    },
    addInwardsEntry: (state, action) => {
      state.allInwardsEntries.push(action.payload); // Update allEntries
    },
    updateInwardsEntryById: (state, action) => {
      const index = state.allInwardsEntries.findIndex(
        (entry) => entry.id === action.payload.id,
      );
      if (index !== -1) {
        state.allInwardsEntries[index] = action.payload; // Update allEntries
      }
    },
    deleteInwardsEntryById: (state, action) => {
      state.allInwardsEntries = state.allInwardsEntries.filter(
        (entry) => entry?.entryId !== action.payload,
      );
    },
    setPMEntry: (state, action) => {
      state.pmEntry = { ...state.pmEntry, ...action.payload };
    },
    resetPMEntry: (state) => {
      state.pmEntry = initialState.pmEntry;
    },
    setEntries: (state, action) => {
      state.allEntries = action.payload; // Update allEntries
    },
    addEntry: (state, action) => {
      state.allEntries.push(action.payload); // Update allEntries
    },
    addPMEntry: (state, action) => {
      state.allPMEntries.push(action.payload); // Update allEntries
    },
    updateEntryById: (state, action) => {
      const index = state.allEntries.findIndex(
        (entry) => entry.id === action.payload.id,
      );
      if (index !== -1) {
        state.allEntries[index] = action.payload; // Update allEntries
      }
    },
    deleteEntryById: (state, action) => {
      state.allEntries = state.allEntries.filter(
        (entry) => entry?.entryId !== action.payload,
      );
    },
    setEditing: (state, action) => {
      state.isEditing = action.payload.isEditing;
      state.editingEntryId = action.payload.editingEntryId;
    },
    updateDealerEntryById: (state, action) => {
      const index = state.allDealerEntries.findIndex(
        (entry) => entry.entryId === action.payload.entryId
      );
      if (index !== -1) {
        state.allDealerEntries[index] = {
          ...state.allDealerEntries[index],
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllEntriesAdmin.pending, (state) => {
        state.loading = true;
        state.spinLoader = true
        state.status = 'pending';
        state.allDealerEntries = []
        state.dealerEntryCount = 0
      })
      .addCase(getAllEntriesAdmin.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.spinLoader = false;
        state.status = 'fulfilled';
        state.allDealerEntries = payload.data;
        state.dealerEntryCount = payload.totalCount;
        state.error = null;
      })
      .addCase(getAllEntriesAdmin.rejected, (state, { payload }) => {
        state.loading = false;
        state.spinLoader = false;
        state.status = 'rejected';
        state.error = payload;
        state.allDealerEntries = []
        state.dealerEntryCount = 0
      })
      .addCase(getTodayDataEntry.pending, (state) => {
        state.loading = true;
        state.status = 'pending';
        state.allEntriesUser = []
      })
      .addCase(getTodayDataEntry.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.status = 'fulfilled';
        state.allEntriesUser = payload.data;
        state.error = null;
      })
      .addCase(getTodayDataEntry.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = 'rejected';
        state.error = payload;
        state.allEntriesUser = []
      })
      .addCase(getDailyEntry.pending, (state) => {
        state.loading = true;
        state.status = 'pending';
        state.allDailyEntries = []
      })
      .addCase(getDailyEntry.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.status = 'fulfilled';
        state.allDailyEntries = payload.data;
        state.error = null;
      })
      .addCase(getDailyEntry.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = 'rejected';
        state.error = payload;
        state.allDailyEntries = []
      })
      .addCase(getPaymentMethods.pending, (state) => {
        state.loading = true;
        state.status = 'pending';
        state.allPaymentMethods = []
      })
      .addCase(getPaymentMethods.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.status = 'fulfilled';
        console.log(payload, 'PAYMENT METHODS')
        state.allPaymentMethods = payload;
        state.error = null;
      })
      .addCase(getPaymentMethods.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = 'rejected';
        state.error = payload;
        state.allPaymentMethods = []
      })
      .addCase(getMiddleDealers.pending, (state) => {
        state.loading = true;
        state.status = 'pending';
        state.allMiddleDealers = []
      })
      .addCase(getMiddleDealers.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.status = 'fulfilled';
        console.log(payload, 'PAYMENT METHODS')
        state.allMiddleDealers = payload;
        state.error = null;
      })
      .addCase(getMiddleDealers.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = 'rejected';
        state.error = payload;
        state.allMiddleDealers = []
      })
      .addCase(getPaymentEntries.pending, (state) => {
        state.loading = true;
        state.spinLoader = true;
        state.status = 'pending';
        state.allPMEntries = []
      })
      .addCase(getPaymentEntries.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.spinLoader = false;
        state.status = 'fulfilled';
        state.loggedIn = true;
        state.allPMEntries = payload.data;
        state.pmEntryCount = payload.totalCount;
        state.error = null;
      })
      .addCase(getPaymentEntries.rejected, (state, { payload }) => {
        state.loading = false;
        state.spinLoader = false;
        state.status = 'rejected';
        state.error = payload;
        state.allPMEntries = []
        state.pmEntryCount = 0
      });
  },
});

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
  setInwardsEntry
} = entrySlice.actions;
export default entrySlice.reducer;
