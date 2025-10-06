import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userSlice from './slices/user.slice';
import stockSlice from './slices/stock.slice';
import orderSlice from './slices/order.slice';
import entrySlice from './slices/entry.slice';
import dashboardSlice from './slices/dashboard.slice';
import productionSlice from './slices/production.slice';
import internalInventorySlice from './slices/internal-inventory.slice';

const rootReducer = combineReducers({
  userDetails: userSlice,
  stockDetails: stockSlice,
  orderDetails: orderSlice,
  entryDetails: entrySlice,
  metrics: dashboardSlice,
  productionDetails: productionSlice,
  internalInventory: internalInventorySlice
});

console.log('🔍 Root reducer created:', Object.keys(rootReducer));
console.log('🔍 productionSlice reducer:', productionSlice);

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  timeout: 0,
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
