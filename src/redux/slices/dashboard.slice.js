import { createSlice } from '@reduxjs/toolkit';
import { getDealerQuantity, getDealerQuantityBySize } from '../api/dashboardAPI';

const initialState = {
  loading: false,
  error: {},
  authError: false,
  status: 'idle',
  dealerQuantityMetrics: [],
  dealerQuantityMetricsBySize: []
};

export const dashboardSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDealerQuantity.pending, (state) => {
        state.loading = true;
        state.spinLoader = true
        state.status = 'pending';
        state.dealerQuantityMetrics = []
        // state.dealerEntryCount = 0
      })
      .addCase(getDealerQuantity.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.spinLoader = false;
        state.status = 'fulfilled';
        state.dealerQuantityMetrics = payload.data;
        // state.dealerEntryCount = payload.totalCount;
        state.error = null;
      })
      .addCase(getDealerQuantity.rejected, (state, { payload }) => {
        state.loading = false;
        state.spinLoader = false;
        state.status = 'rejected';
        state.error = payload;
        state.dealerQuantityMetrics = []
        // state.dealerEntryCount = 0
      })
      .addCase(getDealerQuantityBySize.pending, (state) => {
        state.loading = true;
        state.spinLoader = true
        state.status = 'pending';
        state.dealerQuantityMetricsBySize = []
        // state.dealerEntryCount = 0
      })
      .addCase(getDealerQuantityBySize.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.spinLoader = false;
        state.status = 'fulfilled';
        state.dealerQuantityMetricsBySize = payload.data;
        // state.dealerEntryCount = payload.totalCount;
        state.error = null;
      })
      .addCase(getDealerQuantityBySize.rejected, (state, { payload }) => {
        state.loading = false;
        state.spinLoader = false;
        state.status = 'rejected';
        state.error = payload;
        state.dealerQuantityMetricsBySize = []
        // state.dealerEntryCount = 0
      })
  },
});

// export const {

// } = dashboardSlice.actions;
export default dashboardSlice.reducer;
