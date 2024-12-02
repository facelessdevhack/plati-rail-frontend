import { createSlice } from "@reduxjs/toolkit";
import {
  addFinishes,
  addModel,
  createAlloyEntry,
  createCap,
  getAllAlloys,
  getAllCaps,
  getAllCbs,
  getAllDealers,
  getAllFinishes,
  getAllHoles,
  getAllModels,
  getAllOffsets,
  getAllPcd,
  getAllProducts,
  getAllSizes,
  getAllWidths,
} from "../api/stockAPI";

const initialState = {
  loading: false,
  success: false,
  error: {},
  status: "idle",
  allAlloys: [],
  totalAlloysCount: 0,
  allFinishes: [],
  allPcd: [],
  allSizes: [],
  allHoles: [],
  allCbs: [],
  allOffsets: [],
  allWidths: [],
  allModels: [],
  allDealers: [],
  allProducts: [],
  allCaps: []
};

export const stockSlice = createSlice({
  name: "stockDetails",
  initialState,
  reducers: {
    setSuccessToInit: (state, action) => {
      state.success = false;
    },
  },
  extraReducers(builder) {
    builder.addCase(getAllAlloys.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllAlloys.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allAlloys = payload.data;
      state.totalAlloysCount = payload.total;
    });
    builder.addCase(getAllAlloys.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllFinishes.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllFinishes.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allFinishes = payload.data;
    });
    builder.addCase(getAllFinishes.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllDealers.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllDealers.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allDealers = payload.data;
    });
    builder.addCase(getAllDealers.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllProducts.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllProducts.fulfilled, (state, { payload }) => {
      state.loading = false;
      // console.log(payload, 'GETALL PRODUCTS')
      state.allProducts = payload;
    });
    builder.addCase(getAllProducts.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllPcd.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllPcd.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allPcd = payload;
    });
    builder.addCase(getAllPcd.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllSizes.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllSizes.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allSizes = payload;
    });
    builder.addCase(getAllSizes.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllHoles.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllHoles.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allHoles = payload.data;
    });
    builder.addCase(getAllHoles.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllCbs.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllCbs.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allCbs = payload.data;
    });
    builder.addCase(getAllCbs.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllOffsets.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllOffsets.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allOffsets = payload.data;
    });
    builder.addCase(getAllOffsets.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllWidths.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllWidths.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allWidths = payload.data;
    });
    builder.addCase(getAllWidths.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllModels.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllModels.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allModels = payload.data;
    });
    builder.addCase(getAllModels.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(getAllCaps.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllCaps.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.allCaps = payload.data;
    });
    builder.addCase(getAllCaps.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(createAlloyEntry.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(createAlloyEntry.fulfilled, (state, { payload }) => {
      state.loading = false;
      // state.allModels = payload.data;
    });
    builder.addCase(createAlloyEntry.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });

    builder.addCase(createCap.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(createCap.fulfilled, (state, { payload }) => {
      state.loading = false;
      // state.allModels = payload.data;
    });
    builder.addCase(createCap.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    builder.addCase(addFinishes.pending, (state) => {
      state.loading = true;
      state.success = false
    });
    builder.addCase(addFinishes.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.success = true
      // state.allModels = payload.data;
    });
    builder.addCase(addFinishes.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
      state.success = false
    });
    builder.addCase(addModel.pending, (state) => {
      state.loading = true;
      state.success = false
    });
    builder.addCase(addModel.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.success = true
      // state.allModels = payload.data;
    });
    builder.addCase(addModel.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
      state.success = false
    });
  },
});

export const { setSuccessToInit } = stockSlice.actions;
export default stockSlice.reducer;
