import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  error: {},
  status: "idle",
  loggedIn: false,
  currentOrder: [],
};

export const orderSlice = createSlice({
  name: "orderDetails",
  initialState,
  reducers: {
    updateOrderKey: (state, action) => {
      state[action.payload.key] = action.payload.value;
    },
    resetToInitialOrderState: (state, action) => {
      Object.keys(initialState).forEach(
        (key) => (state[key] = initialState[key])
      );
    },
  },
  extraReducers(builder) {},
});

export const { updateOrderKey, resetToInitialOrderState } = orderSlice.actions;
export default orderSlice.reducer;
