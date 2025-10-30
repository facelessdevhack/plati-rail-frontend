import { createAsyncThunk } from '@reduxjs/toolkit'
import { client, getError } from '../../Utils/axiosClient'
import moment from 'moment'

export const userAuthenticate = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await client.post('/auth/login', {
        email,
        password
      })

      localStorage.setItem('user', JSON.stringify(response.data))
      console.log(response.data, 'user obj')
      return response.data
    } catch (error) {
      console.log(error, 'error')
      return rejectWithValue(getError(error))
      //return error;
    }
  }
)

export const addEntryAPI = async ({
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
  isRepair,
  date,
  uniqueProductId
}) => {
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
      date: date || moment().format('YYYY-MM-DD HH:mm:ss'),
      isRepair,
      uniqueProductId
    })
    console.log(response, 'ADD ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('ADD ENTRY ERROR: ' + e)
    return e
  }
}

export const addChargesAPI = async ({
  dealerId,
  dealerName,
  description,
  amount,
  isChecked
}) => {
  try {
    const response = await client.post('entries/create-charges-entry', {
      dealerId,
      dealerName,
      description,
      amount,
      isChecked
    })
    console.log(response, 'ADD ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('ADD ENTRY ERROR: ' + e)
    return e
  }
}

export const editEntryAPI = async ({
  id,
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
  isRepair,
  amount,
  sourceType,
  description
}) => {
  try {
    const response = await client.put('entries/edit-entry', {
      id,
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
      isRepair,
      amount,
      sourceType,
      description
    })
    console.log(response, 'EDIT ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('ERROR FROM EDIT ENTRY', e)
    return e
  }
}

export const removeEntryAPI = async ({ entryId }) => {
  try {
    const response = await client.delete(`entries/remove-entry?id=${entryId}`, {
      entryId
    })
    console.log(response, 'RESPONSE FROM DELETE ENTRY')
    return response
  } catch (e) {
    console.log('ERROR FROM DELETE ENTRY', e)
    return e
  }
}

export const addInwardsEntryAPI = async ({
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
  isRepair,
  paymentDate
}) => {
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
      date: paymentDate || moment().format('YYYY-MM-DD HH:mm:ss'),
      isRepair
    })
    console.log(response, 'ADD ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('ADD ENTRY ERROR: ' + e)
    return e
  }
}

export const editInwardsEntryAPI = async ({
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
  transportationCharges
}) => {
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
      transportationCharges
    })
    console.log(response, 'EDIT ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('ERROR FROM EDIT ENTRY', e)
    return e
  }
}

export const removeInwardsEntryAPI = async ({ entryId }) => {
  try {
    const response = await client.delete(
      `entries/remove-inwards-entry?id=${entryId}`,
      { entryId }
    )
    console.log(response, 'RESPONSE FROM DELETE ENTRY')
    return response
  } catch (e) {
    console.log('ERROR FROM DELETE ENTRY', e)
    return e
  }
}

export const getAllEntriesAdmin = createAsyncThunk(
  'entries/getAllEntriesAdmin',
  async (
    {
      dealerId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
      sortField = 'created_at',
      sortOrder = 'desc'
    },
    { rejectWithValue }
  ) => {
    try {
      // Build query params string with optional date filtering and sorting
      let url = `/entries/get-entries?dealerId=${dealerId}&page=${page}&limit=${limit}`
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`
      }
      if (sortField && sortOrder) {
        url += `&sortField=${sortField}&sortOrder=${sortOrder}`
      }

      // Make the API call
      const response = await client.get(url)

      // Return the paginated response
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)
export const getTodayDataEntry = createAsyncThunk(
  'entries/getTodayDataEntry',
  async (
    {
      dealerId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
      sortField = 'created_at',
      sortOrder = 'desc'
    },
    { rejectWithValue }
  ) => {
    try {
      // Build query params string with optional date filtering and sorting
      let url = `/entries/get-entries-user?today=${moment().format(
        'YYYY-MM-DD HH:MM:SS'
      )}`

      // Make the API call
      const response = await client.get(url)

      // Return the paginated response
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)
export const getTodayChargesEntry = createAsyncThunk(
  'entries/getTodayChargesEntry',
  async (
    {
      dealerId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
      sortField = 'created_at',
      sortOrder = 'desc'
    },
    { rejectWithValue }
  ) => {
    try {
      // Build query params string with optional date filtering and sorting
      let url = `/entries/get-entries-user?today=${moment().format(
        'YYYY-MM-DD HH:MM:SS'
      )}`

      // Make the API call
      const response = await client.get(url)

      // Return the paginated response
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getPaymentEntries = createAsyncThunk(
  'entries/getPaymentEntries',
  async (
    {
      dealerId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
      sortField = 'created_at',
      sortOrder = 'desc'
    },
    { rejectWithValue }
  ) => {
    try {
      // Build query params string with optional date filtering and sorting
      let url = `/entries/get-payment-entries?dealerId=${dealerId}&page=${page}&limit=${limit}`
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`
      }
      if (sortField && sortOrder) {
        url += `&sortField=${sortField}&sortOrder=${sortOrder}`
      }

      // Make the API call
      const response = await client.get(url)

      // Return the paginated response
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const checkEntry = createAsyncThunk(
  async ({ entryId }, { rejectWithValue }) => {
    try {
      const response = await client.post(
        `/entries/check-entry?entryId=${entryId}`
      )
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const checkChargesEntry = createAsyncThunk(
  async ({ entryId }, { rejectWithValue }) => {
    try {
      const response = await client.post(
        `/entries/check-charges-entry?entryId=${entryId}`
      )
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getDailyEntry = createAsyncThunk(
  'entries/getDailyEntries',
  async ({ _ }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/entries/get-daily-entries`)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getPaymentMethods = createAsyncThunk(
  'entries/getPaymentMethods',
  async ({ _ }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/entries/get-payment-methods`)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)
export const getAdminPaymentMethods = createAsyncThunk(
  'entries/getAdminPaymentMethods',
  async ({ _ }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/entries/get-admin-payment-methods`)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)
export const getAllPaymentMethods = createAsyncThunk(
  'entries/getAllPaymentMethods',
  async ({ _ }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/entries/get-all-payment-methods`)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getMiddleDealers = createAsyncThunk(
  'entries/getMiddleDealers',
  async ({ _ }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/master/all-middle-dealers`)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
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
// )q

export const getInwardsDailyEntry = createAsyncThunk(
  'entries/getInwardsDailyEntry',
  async ({ _ }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/entries/get-daily-inwards-entries`)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getPaymentDailyEntry = createAsyncThunk(
  'entries/getPaymentDailyEntry',
  async ({ _ }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/entries/get-daily-payment-entries`)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)
export const getChargesDailyEntry = createAsyncThunk(
  'entries/getChargesDailyEntry',
  async ({ _ }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/entries/get-daily-charges-entries`)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllDealersOrders = createAsyncThunk(
  'entries/getAllDealersOrders',
  async ({ id, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await client.get(
        `/entries/get-dealer-orders?dealerId=${id}&page=${page}&limit=${limit}`
      )
      console.log(response, 'RESPONSE FROM ALL DEALERS ORDERS')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const deletePaymentEntryAPI = async ({ paymentId, reason }) => {
  try {
    const response = await client.delete(`entries/remove-payment-entry`, {
      data: {
        paymentId,
        reason
      }
    })
    console.log(response, 'DELETE PAYMENT ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('DELETE PAYMENT ENTRY ERROR: ' + e)
    return e
  }
}

export const checkMultipleEntriesAPI = async ({ entryIds, entryType }) => {
  try {
    const response = await client.post('/entries/check-multiple-entries', {
      entryIds,
      entryType
    })
    return response.data
  } catch (error) {
    throw error
  }
}

// ============================================
// SALES COORDINATION SYSTEM - API FUNCTIONS
// ============================================

/**
 * Add entry with sales coordination logic
 * Routes entry to appropriate table based on stock and production status
 */
export const addCoordinatedEntryAPI = async ({
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
  isRepair,
  date,
  uniqueProductId
}) => {
  try {
    const response = await client.post('entries/add-coordinated-entry', {
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
      date: date || moment().format('YYYY-MM-DD HH:mm:ss'),
      isRepair,
      uniqueProductId
    })
    console.log(response, 'ADD COORDINATED ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('ADD COORDINATED ENTRY ERROR: ' + e)
    return e
  }
}

/**
 * Get all pending entries awaiting stock
 */
export const getPendingEntriesAPI = createAsyncThunk(
  'entries/getPendingEntries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/entries/get-pending-entries')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

/**
 * Get all entries currently in production
 */
export const getInProductionEntriesAPI = createAsyncThunk(
  'entries/getInProductionEntries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/entries/get-inprod-entries')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

/**
 * Move pending entry to entry_master when stock becomes available
 */
export const movePendingToMasterAPI = async ({ pendingEntryId }) => {
  try {
    const response = await client.post('entries/move-pending-to-master', {
      pendingEntryId
    })
    console.log(response, 'MOVE PENDING TO MASTER RESPONSE')
    return response
  } catch (e) {
    console.log('MOVE PENDING TO MASTER ERROR: ' + e)
    return e
  }
}

/**
 * Delete a pending entry
 */
export const deletePendingEntryAPI = async ({ pendingEntryId }) => {
  try {
    const response = await client.post('entries/delete-pending-entry', {
      pendingEntryId
    })
    console.log(response, 'DELETE PENDING ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('DELETE PENDING ENTRY ERROR: ' + e)
    return e
  }
}

/**
 * Move in-production entry to entry_master when production completes
 */
export const moveInProdToMasterAPI = async ({ inProdEntryId }) => {
  try {
    const response = await client.post('entries/move-inprod-to-master', {
      inProdEntryId
    })
    console.log(response, 'MOVE INPROD TO MASTER RESPONSE')
    return response
  } catch (e) {
    console.log('MOVE INPROD TO MASTER ERROR: ' + e)
    return e
  }
}

/**
 * Delete an in-production entry and restore production plan quantity
 */
export const deleteInProductionEntryAPI = async ({ inProdEntryId }) => {
  try {
    const response = await client.post('entries/delete-in-production-entry', {
      inProdEntryId
    })
    console.log(response, 'DELETE IN-PRODUCTION ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('DELETE IN-PRODUCTION ENTRY ERROR: ' + e)
    return e
  }
}

/**
 * Get all dispatch entries awaiting coordinator approval
 */
export const getDispatchEntriesAPI = createAsyncThunk(
  'entries/getDispatchEntries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/entries/get-dispatch-entries')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

/**
 * Process dispatch entry - move to pricing_pending when approved
 */
export const processDispatchEntryAPI = async ({ dispatchEntryId }) => {
  try {
    const response = await client.post('entries/process-dispatch-entry', {
      dispatchEntryId
    })
    console.log(response, 'PROCESS DISPATCH ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('PROCESS DISPATCH ENTRY ERROR: ' + e)
    return e
  }
}

/**
 * Delete dispatch entry and restore stock
 */
export const deleteDispatchEntryAPI = async ({ dispatchEntryId }) => {
  try {
    const response = await client.post('entries/delete-dispatch-entry', {
      dispatchEntryId
    })
    console.log(response, 'DELETE DISPATCH ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('DELETE DISPATCH ENTRY ERROR: ' + e)
    return e
  }
}

/**
 * Get all pricing pending entries awaiting price entry
 */
export const getPricingPendingEntriesAPI = createAsyncThunk(
  'entries/getPricingPendingEntries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/entries/get-pricing-pending-entries')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

/**
 * Add pricing to pending entry and move to entry_master
 */
export const addPricingToEntryAPI = async ({
  pricingEntryId,
  price,
  transportationCharges = 0,
  transportationType = 0,
  isClaim = 0,
  isRepair = 0
}) => {
  try {
    const response = await client.post('entries/add-pricing-to-entry', {
      pricingEntryId,
      price,
      transportationCharges,
      transportationType,
      isClaim,
      isRepair
    })
    console.log(response, 'ADD PRICING TO ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('ADD PRICING TO ENTRY ERROR: ' + e)
    return e
  }
}

/**
 * Delete pricing pending entry and restore stock
 */
export const deletePricingPendingEntryAPI = async (pricingEntryId) => {
  try {
    const response = await client.post('entries/delete-pricing-pending-entry', {
      pricingEntryId
    })
    console.log(response, 'DELETE PRICING PENDING ENTRY RESPONSE')
    return response
  } catch (e) {
    console.log('DELETE PRICING PENDING ENTRY ERROR: ' + e)
    return e
  }
}

/**
 * Get all coordination entries (dispatch, pending, in-production) for today
 */
export const getAllCoordinationEntriesAPI = createAsyncThunk(
  'entries/getAllCoordinationEntries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/entries/get-all-coordination-entries')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

/**
 * Get pending entries comparison data for month-over-month analysis
 */
export const getPendingEntriesComparisonAPI = createAsyncThunk(
  'entries/getPendingEntriesComparison',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/entries/get-pending-entries-comparison')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)
