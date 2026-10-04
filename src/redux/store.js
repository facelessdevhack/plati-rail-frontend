import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userSlice from './slices/user.slice';
import stockSlice from './slices/stock.slice';
import orderSlice from './slices/order.slice';
import entrySlice from './slices/entry.slice';
import dashboardSlice from './slices/dashboard.slice';
import productionSlice from './slices/production.slice';
import internalInventorySlice from './slices/internal-inventory.slice';
import purchaseSystemSlice from './slices/purchaseSystem.slice';
import moldManagementSlice from './slices/moldManagement.slice';
import purchaseV2Slice from './slices/purchaseV2.slice';

const combinedReducer = combineReducers({
  userDetails: userSlice,
  stockDetails: stockSlice,
  orderDetails: orderSlice,
  entryDetails: entrySlice,
  metrics: dashboardSlice,
  productionDetails: productionSlice,
  internalInventory: internalInventorySlice,
  purchaseSystem: purchaseSystemSlice,
  moldManagement: moldManagementSlice,
  purchaseV2: purchaseV2Slice
});

// A new sign-in or sign-out discards all data from the previous account.
const rootReducer = (state, action) => combinedReducer(
  ['userDetails/resetToInitialUser', 'auth/login/pending'].includes(action.type) ? undefined : state,
  action
);

const persistConfig = {
  key: 'root',
  version: 2,
  storage,
  timeout: 0,
  whitelist: ['userDetails'],
  transforms: [createTransform(state => ({ ...state, pendingAuth: null }), state => ({ ...state, pendingAuth: null }), { whitelist: ['userDetails'] })],
  // Drop legacy cached payment/entry data when upgrading the existing app.
  migrate: state => Promise.resolve(state ? { userDetails: { ...state.userDetails, pendingAuth: null }, _persist: state._persist } : state),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export default store;
