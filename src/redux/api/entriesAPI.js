import { createAsyncThunk } from '@reduxjs/toolkit';
import { client, getError } from '../../Utils/axiosClient';
import moment from 'moment';

export const userAuthenticate = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await client.post('/auth/login', {
        email,
        password,
      });

      localStorage.setItem('user', JSON.stringify(response.data));
      console.log(response.data, 'user obj');
      return response.data;
    } catch (error) {
      console.log(error, 'error');
      return rejectWithValue(getError(error));
      //return error;
    }
  },
);

export const addEntryAPI = async (
  {
    dealerId,
    dealerName,
    productId,
    productName,
    productType,
    quantity,
    price,
    isClaim,
    transportationType,
    transportationCharges,
    isRepair
  },
) => {
  try {
    const response = await client.post('entries/add-entry', {
      dealerId,
      dealerName,
      productId,
      productName,
      productType,
      quantity,
      price,
      isClaim,
      transportationType,
      transportationCharges,
      date: moment().format('YYYY-MM-DD HH:mm:ss'),
      isRepair
    });
    console.log(response, 'ADD ENTRY RESPONSE');
    return response;
  } catch (e) {
    console.log('ADD ENTRY ERROR: ' + e);
    return e;
  }
}

export const editEntryAPI = async (
  {
    entryId,
    dealerId,
    dealerName,
    productId,
    productName,
    productType,
    quantity,
    price,
    isClaim,
    transportationType,
    transportationCharges,
  },
) => {
  try {
    const response = await client.put('entries/edit-entry', {
      entryId,
      dealerId,
      dealerName,
      productId,
      productName,
      productType,
      quantity,
      price,
      isClaim,
      transportationType,
      transportationCharges,
    });
    console.log(response, 'EDIT ENTRY RESPONSE');
    return response;
  } catch (e) {
    console.log('ERROR FROM EDIT ENTRY', e);
    return e;
  }
}

export const removeEntryAPI = async ({ entryId }) => {
  try {
    const response = await client.delete(`entries/remove-entry?id=${entryId}`, { entryId });
    console.log(response, 'RESPONSE FROM DELETE ENTRY');
    return response;
  } catch (e) {
    console.log('ERROR FROM DELETE ENTRY', e);
    return e;
  }
}

export const addInwardsEntryAPI = async (
  {
    dealerId,
    dealerName,
    productId,
    productName,
    productType,
    quantity,
    price,
    isClaim,
    transportationType,
    transportationCharges,
    isRepair
  },
) => {
  try {
    const response = await client.post('entries/add-inwards-entry', {
      dealerId,
      dealerName,
      productId,
      productName,
      productType,
      quantity,
      price,
      isClaim,
      transportationType,
      transportationCharges,
      date: moment().format('YYYY-MM-DD HH:mm:ss'),
      isRepair
    });
    console.log(response, 'ADD ENTRY RESPONSE');
    return response;
  } catch (e) {
    console.log('ADD ENTRY ERROR: ' + e);
    return e;
  }
}

export const editInwardsEntryAPI = async (
  {
    entryId,
    dealerId,
    dealerName,
    productId,
    productName,
    productType,
    quantity,
    price,
    isClaim,
    transportationType,
    transportationCharges,
  },
) => {
  try {
    const response = await client.put('entries/edit-inwards-entry', {
      entryId,
      dealerId,
      dealerName,
      productId,
      productName,
      productType,
      quantity,
      price,
      isClaim,
      transportationType,
      transportationCharges,
    });
    console.log(response, 'EDIT ENTRY RESPONSE');
    return response;
  } catch (e) {
    console.log('ERROR FROM EDIT ENTRY', e);
    return e;
  }
}

export const removeInwardsEntryAPI = async ({ entryId }) => {
  try {
    const response = await client.delete(`entries/remove-inwards-entry?id=${entryId}`, { entryId });
    console.log(response, 'RESPONSE FROM DELETE ENTRY');
    return response;
  } catch (e) {
    console.log('ERROR FROM DELETE ENTRY', e);
    return e;
  }
}

export const getAllEntriesAdmin = createAsyncThunk(
  "entries/getAllEntriesAdmin",
  async ({ dealerId, page = 1, limit = 10, startDate, endDate, sortField = 'created_at', sortOrder = 'desc' }, { rejectWithValue }) => {
    try {
      // Build query params string with optional date filtering and sorting
      let url = `/entries/get-entries?dealerId=${dealerId}&page=${page}&limit=${limit}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      if (sortField && sortOrder) {
        url += `&sortField=${sortField}&sortOrder=${sortOrder}`;
      }

      // Make the API call
      const response = await client.get(url);

      // Return the paginated response
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);
export const getTodayDataEntry = createAsyncThunk(
  "entries/getTodayDataEntry",
  async ({ dealerId, page = 1, limit = 10, startDate, endDate, sortField = 'created_at', sortOrder = 'desc' }, { rejectWithValue }) => {
    try {
      // Build query params string with optional date filtering and sorting
      let url = `/entries/get-entries-user?today=${moment().format('YYYY-MM-DD HH:MM:SS')}`;

      // Make the API call
      const response = await client.get(url);

      // Return the paginated response
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const getPaymentEntries = createAsyncThunk(
  "entries/getPaymentEntries",
  async ({ dealerId, page = 1, limit = 10, startDate, endDate, sortField = 'created_at', sortOrder = 'desc' }, { rejectWithValue }) => {
    try {
      // Build query params string with optional date filtering and sorting
      let url = `/entries/get-payment-entries?dealerId=${dealerId}&page=${page}&limit=${limit}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      if (sortField && sortOrder) {
        url += `&sortField=${sortField}&sortOrder=${sortOrder}`;
      }

      // Make the API call
      const response = await client.get(url);

      // Return the paginated response
      return response.data;
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
);

export const checkEntry = createAsyncThunk(
  async ({ entryId }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/entries/check-entry?entryId=${entryId}`);
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e));
    }
  }
)


// export const createPMEntry = createAsyncThunk(
//   async ({
//     dealerId, dealerName, description, amount
//   }, { rejectWithValue }) => {
//     try {
//       const response = await client.post('entries/create-pm-entry', {
//         dealerId, dealerName, description, amount
//       });
//       return response.data
//     }
//     catch (e) {
//       return rejectWithValue(getError(e));
//     }
//   }
// )