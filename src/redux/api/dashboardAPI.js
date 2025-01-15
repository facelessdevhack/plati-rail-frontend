import { createAsyncThunk } from '@reduxjs/toolkit';
import { client, getError } from '../../Utils/axiosClient';
import moment from 'moment';


export const getDealerQuantity = createAsyncThunk(
    "dashboard/getDealerQuantity",
    async ({ dealerId, page = 1, limit = 10, startDate, endDate, sortField = 'created_at', sortOrder = 'desc' }, { rejectWithValue }) => {
      try {
        
        let url = `/dashboard/get-dealer-quantity?dealerId=${dealerId}&page=${page}&limit=${limit}`;
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        if (sortField && sortOrder) {
          url += `&sortField=${sortField}&sortOrder=${sortOrder}`;
        }
  
        // Make the API call
        const response = await client.get(url);
        console.log(response, 'RESPONSE FROM ALL DEALERS QUANTITY')
        return response.data
      } catch (e) {
        return rejectWithValue(getError(e));
      }
    }
  )
export const getDealerQuantityBySize = createAsyncThunk(
    "dashboard/getDealerQuantityBySize",
    async ({ dealerId, page = 1, limit = 10, startDate, endDate, sortField = 'created_at', sortOrder = 'desc' }, { rejectWithValue }) => {
      try {
        
        let url = `/dashboard/get-dealer-quantity-by-sizes?dealerId=${dealerId}&page=${page}&limit=${limit}`;
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        if (sortField && sortOrder) {
          url += `&sortField=${sortField}&sortOrder=${sortOrder}`;
        }
  
        // Make the API call
        const response = await client.get(url);
        console.log(response, 'RESPONSE FROM ALL DEALERS QUANTITY')
        return response.data
      } catch (e) {
        return rejectWithValue(getError(e));
      }
    }
  )