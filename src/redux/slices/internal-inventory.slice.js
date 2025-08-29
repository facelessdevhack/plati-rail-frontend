import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../../Utils/axiosClient';

// Initial state
const initialState = {
  // Locations
  locations: [],
  selectedLocation: null,
  locationLoading: false,
  
  // Inventory
  inventoryOverview: null,
  inventoryMovements: [],
  searchResults: [],
  lowStockAlerts: [],
  inventoryLoading: false,
  
  // Production Requests
  productionRequests: [],
  selectedProductionRequest: null,
  productionRequestLoading: false,
  
  // Dispatch Orders
  dispatchOrders: [],
  selectedDispatchOrder: null,
  dispatchOrderLoading: false,
  
  // General
  loading: false,
  error: null,
  searchQuery: ''
};

// Async Thunks

// Locations
export const fetchLocations = createAsyncThunk(
  'internalInventory/fetchLocations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/inventory/internal/locations');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch locations');
    }
  }
);

export const createLocation = createAsyncThunk(
  'internalInventory/createLocation',
  async (locationData, { rejectWithValue }) => {
    try {
      const response = await client.post('/inventory/internal/locations', locationData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create location');
    }
  }
);

export const updateLocation = createAsyncThunk(
  'internalInventory/updateLocation',
  async ({ locationId, ...locationData }, { rejectWithValue }) => {
    try {
      const response = await client.put(`/inventory/internal/locations/${locationId}`, locationData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update location');
    }
  }
);

export const fetchLocationInventory = createAsyncThunk(
  'internalInventory/fetchLocationInventory',
  async ({ locationId, filters = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await client.get(`/inventory/internal/locations/${locationId}/inventory?${queryParams}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch location inventory');
    }
  }
);

// Inventory Overview
export const fetchInventoryOverview = createAsyncThunk(
  'internalInventory/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/inventory/internal/overview');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inventory overview');
    }
  }
);

export const searchInventory = createAsyncThunk(
  'internalInventory/searchInventory',
  async ({ query, filters = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({ query, ...filters }).toString();
      const response = await client.get(`/inventory/search?${queryParams}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search inventory');
    }
  }
);

export const fetchLowStockAlerts = createAsyncThunk(
  'internalInventory/fetchLowStockAlerts',
  async ({ threshold = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await client.get(`/inventory/alerts/low-stock?threshold=${threshold}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch low stock alerts');
    }
  }
);

// Production Requests
export const fetchProductionRequests = createAsyncThunk(
  'internalInventory/fetchProductionRequests',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await client.get(`/inventory/production/requests?${queryParams}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch production requests');
    }
  }
);

export const createProductionRequest = createAsyncThunk(
  'internalInventory/createProductionRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await client.post('/inventory/production/requests', requestData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create production request');
    }
  }
);

export const approveProductionRequest = createAsyncThunk(
  'internalInventory/approveProductionRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await client.post(`/inventory/production/requests/${requestId}/approve`);
      return { requestId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve production request');
    }
  }
);

// Dispatch Orders
export const fetchDispatchOrders = createAsyncThunk(
  'internalInventory/fetchDispatchOrders',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await client.get(`/inventory/dispatch/orders?${queryParams}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dispatch orders');
    }
  }
);

export const createDispatchOrder = createAsyncThunk(
  'internalInventory/createDispatchOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await client.post('/inventory/dispatch/orders', orderData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create dispatch order');
    }
  }
);

// Slice
const internalInventorySlice = createSlice({
  name: 'internalInventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedLocation: (state, action) => {
      state.selectedLocation = action.payload;
    },
    setSelectedProductionRequest: (state, action) => {
      state.selectedProductionRequest = action.payload;
    },
    setSelectedDispatchOrder: (state, action) => {
      state.selectedDispatchOrder = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    }
  },
  extraReducers: (builder) => {
    builder
      // Locations
      .addCase(fetchLocations.pending, (state) => {
        state.locationLoading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.locationLoading = false;
        state.locations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.locationLoading = false;
        state.error = action.payload;
      })

      .addCase(createLocation.pending, (state) => {
        state.loading = true;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.locations.push(action.payload);
      })
      .addCase(createLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateLocation.fulfilled, (state, action) => {
        const index = state.locations.findIndex(loc => loc.id === action.payload.id);
        if (index !== -1) {
          state.locations[index] = action.payload;
        }
      })

      // Inventory Overview
      .addCase(fetchInventoryOverview.pending, (state) => {
        state.inventoryLoading = true;
      })
      .addCase(fetchInventoryOverview.fulfilled, (state, action) => {
        state.inventoryLoading = false;
        state.inventoryOverview = action.payload;
      })
      .addCase(fetchInventoryOverview.rejected, (state, action) => {
        state.inventoryLoading = false;
        state.error = action.payload;
      })

      // Search
      .addCase(searchInventory.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.inventory;
      })
      .addCase(searchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Low Stock Alerts
      .addCase(fetchLowStockAlerts.fulfilled, (state, action) => {
        state.lowStockAlerts = action.payload.low_stock_items;
      })

      // Production Requests
      .addCase(fetchProductionRequests.pending, (state) => {
        state.productionRequestLoading = true;
      })
      .addCase(fetchProductionRequests.fulfilled, (state, action) => {
        state.productionRequestLoading = false;
        state.productionRequests = action.payload.requests;
      })
      .addCase(fetchProductionRequests.rejected, (state, action) => {
        state.productionRequestLoading = false;
        state.error = action.payload;
      })

      .addCase(createProductionRequest.fulfilled, (state, action) => {
        state.productionRequests.unshift(action.payload);
      })

      .addCase(approveProductionRequest.fulfilled, (state, action) => {
        const index = state.productionRequests.findIndex(req => req.id === action.payload.requestId);
        if (index !== -1) {
          state.productionRequests[index].status = 'approved';
        }
      })

      // Dispatch Orders
      .addCase(fetchDispatchOrders.pending, (state) => {
        state.dispatchOrderLoading = true;
      })
      .addCase(fetchDispatchOrders.fulfilled, (state, action) => {
        state.dispatchOrderLoading = false;
        state.dispatchOrders = action.payload.orders;
      })
      .addCase(fetchDispatchOrders.rejected, (state, action) => {
        state.dispatchOrderLoading = false;
        state.error = action.payload;
      })

      .addCase(createDispatchOrder.fulfilled, (state, action) => {
        state.dispatchOrders.unshift(action.payload);
      });
  }
});

// Actions
export const {
  clearError,
  setSelectedLocation,
  setSelectedProductionRequest,
  setSelectedDispatchOrder,
  setSearchQuery,
  clearSearchResults
} = internalInventorySlice.actions;

// Selectors
export const selectLocations = (state) => state.internalInventory.locations;
export const selectInventoryOverview = (state) => state.internalInventory.inventoryOverview;
export const selectProductionRequests = (state) => state.internalInventory.productionRequests;
export const selectDispatchOrders = (state) => state.internalInventory.dispatchOrders;
export const selectSearchResults = (state) => state.internalInventory.searchResults;
export const selectLowStockAlerts = (state) => state.internalInventory.lowStockAlerts;
export const selectLoading = (state) => state.internalInventory.loading;
export const selectError = (state) => state.internalInventory.error;

export default internalInventorySlice.reducer;