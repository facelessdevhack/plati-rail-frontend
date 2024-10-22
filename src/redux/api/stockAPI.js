import { createAsyncThunk } from "@reduxjs/toolkit";
import { client, getError } from "../../Utils/axiosClient";

export const getAllAlloys = createAsyncThunk(
  "stock/getAllAlloys",
  async ({ page }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/alloys/?page=${page}&limit=${10}`);
      //   response.data.userId = userId;
      console.log(response.data.length, "DATA OF ALLOYS LENGTH");
      return response.data;
    } catch (error) {
      return rejectWithValue(getError(error));
      //return error;
    }
  }
);

export const getAllFinishes = createAsyncThunk(
  "stock/getAllFinishes",
  async ({ }, { rejectWithValue }) => {
    try {
      const response = await client.get("/alloys/finishes");
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const getAllDealers = createAsyncThunk(
  "dealers/getAllDealers",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/master/all-dealers?salesId=${id}`);
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
)

export const getAllCaps = createAsyncThunk(
  "master/getAllDealers",
  async ({ _ }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/master/all-caps`);
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
)

export const getAllSizes = createAsyncThunk(
  "stock/getAllSizes",
  async ({ }, { rejectWithValue }) => {
    try {
      const response = await client.get("/alloys/sizes");
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const getAllPcd = createAsyncThunk(
  "stock/getAllPcd",
  async ({ }, { rejectWithValue }) => {
    try {
      const response = await client.get("/alloys/pcds");
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const getAllHoles = createAsyncThunk(
  "stock/getAllHoles",
  async ({ }, { rejectWithValue }) => {
    try {
      const response = await client.get("/alloys/holes");
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const getAllCbs = createAsyncThunk(
  "stock/getAllCbs",
  async ({ }, { rejectWithValue }) => {
    try {
      const response = await client.get("/alloys/cbs");
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const getAllOffsets = createAsyncThunk(
  "stock/getAllOffsets",
  async ({ }, { rejectWithValue }) => {
    try {
      const response = await client.get("/alloys/offsets");
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const getAllWidths = createAsyncThunk(
  "stock/getAllWidths",
  async ({ }, { rejectWithValue }) => {
    try {
      const response = await client.get("/alloys/widths");
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const getAllModels = createAsyncThunk(
  "stock/getAllModels",
  async ({ }, { rejectWithValue }) => {
    try {
      const response = await client.get("/alloys/models");
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const getAllAlloysWithSameParams = createAsyncThunk(
  "stock/getAllAlloysWithSameParams",
  async (
    { pcdId, modelId, cbId, finishId, holesId, inchesId, offsetId, widthId },
    { rejectWithValue }
  ) => {
    try {
      const response = await client.post("/alloys/get-alloy-with-same-params", {
        pcdId,
        modelId,
        cbId,
        finishId,
        holesId,
        inchesId,
        offsetId,
        widthId,
      });
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const createAlloyEntry = createAsyncThunk(
  "stock/createAlloyEntry",
  async (
    {
      modelId,
      cbId,
      finishId,
      holesId,
      inchesId,
      offsetId,
      pcdId,
      widthId,
      stock,
      showroomStock,
      productName,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await client.post("/alloys/create-alloy", {
        modelId,
        cbId,
        finishId,
        holesId,
        inchesId,
        offsetId,
        pcdId,
        widthId,
        stock,
        showroomStock,
        productName,
      });
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const getAllProducts = createAsyncThunk(
  "dailyEntry/getAllProducts",
  async ({ }, { rejectWithValue }) => {
    try {
      const response = await client.get('/master/all-products');
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
)

export const createCap = createAsyncThunk(
  "master/createCap",
  async ({ capModel }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/master/create-cap`, { capModel });
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
)
export const addFinishes = createAsyncThunk(
  "alloys/addFinishes",
  async ({ finish }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/alloys/add-finishes`, { finish });
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
)
export const addModel = createAsyncThunk(
  "alloys/addModel",
  async ({ model }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/alloys/add-model`, { model });
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
)