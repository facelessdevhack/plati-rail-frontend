import { createSlice } from "@reduxjs/toolkit";
import { userAuthenticate } from "../api/userAPI";

const initialState = {
  loading: false,
  error: {},
  authError: false,
  status: "idle",
  loggedIn: false,
  tryingAuth: false,
  user: {},
};

export const userSlice = createSlice({
  name: "userDetails",
  initialState,
  reducers: {
    addDummyDataForUserDetails: (state, action) => {
      const dummyState = action.payload;
      Object.keys(dummyState).forEach((key) => (state[key] = dummyState[key]));
    },
    updateUser: (state, action) => {
      state[action.payload.key] = action.payload.value;
    },
    updateUserData: (state, action) => {
      action.payload.map((ele) => {
        state[ele.key] = ele.value;
      });
    },
    updateUserToken: (state, action) => {
      state.user.token = action.payload;
    },
    updateParentKeyUserData: (state, action) => {
      action.payload.map((ele) => {
        state[ele.parentkey][ele.key] = ele.value;
      });
    },
    resetToInitialUser: (state, action) => {
      Object.keys(initialState).forEach(
        (key) => (state[key] = initialState[key])
      );
    },
  },
  extraReducers: (builder) => {
    builder.addCase(userAuthenticate.pending, (state, { payload }) => {
      state.loading = true;
      state.status = "pending";
      state.authError = false;
      state.loggedIn = false;
      state.tryingAuth = true;
    });
    builder.addCase(userAuthenticate.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.status = "fulfilled";
      state.loggedIn = true;
      state.user = payload;
      state.error = null;
      state.authError = false;
      state.tryingAuth = false;
      console.log("AUTTTH: ", payload);
    });
    builder.addCase(userAuthenticate.rejected, (state, { payload }) => {
      state.loading = false;
      state.status = "rejected";
      state.error = payload;
      state.user = {
        ...initialState.user,
      };
      state.tryingAuth = false;
      state.loggedIn = false;
      state.authError = true;
    });
  },
});

export const {
  updateUserData,
  resetToInitialUser,
  updateUserToken,
  addDummyDataForUserDetails,
} = userSlice.actions;
export default userSlice.reducer;
