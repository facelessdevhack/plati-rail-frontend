import { createAsyncThunk } from '@reduxjs/toolkit'
import { client, getError } from '../../Utils/axiosClient'

export const getAllAlloys = createAsyncThunk(
  'stock/getAllAlloys',
  async ({ page=1, limit=10 }, { rejectWithValue }) => {
    try {
      // Use stock management API instead of complex alloys API
      const response = await client.get(`/alloys/stock/management?page=${page}&limit=${limit}`)
      console.log(response.data, 'DATA OF ALLOYS FROM STOCK API')
      // Transform the response to match expected format
      return response.data.data || []
    } catch (error) {
      console.error('Alloys API error:', error)
      return rejectWithValue(getError(error))
    }
  }
)

export const getAllFinishes = createAsyncThunk(
  'stock/getAllFinishes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/alloys/finishes')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllDealers = createAsyncThunk(
  'dealers/getAllDealers',
  async ({ id, page = 1, limit = 10, search, overdue }, { rejectWithValue }) => {
    try {
      let url = `/master/all-dealers?page=${page}&limit=${limit}`
      if (id) {
        url += `&salesId=${id}`
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }
      if (overdue) {
        url += `&overdue=true`
      }
      const response = await client.get(url)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getDealersDropdown = createAsyncThunk(
  'dealers/getDealersDropdown',
  async ({ salesId, search }, { rejectWithValue }) => {
    try {
      let url = `/master/dealers-dropdown`
      const params = new URLSearchParams()
      if (salesId) {
        params.append('salesId', salesId)
      }
      if (search) {
        params.append('search', search)
      }
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      const response = await client.get(url)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllCaps = createAsyncThunk(
  'master/getAllDealers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get(`/master/all-caps`)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllSizes = createAsyncThunk(
  'stock/getAllSizes',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Calling getAllSizes API...')
      const response = await client.get('/alloys/sizes')
      console.log('getAllSizes response:', response.data)
      return response.data
    } catch (e) {
      console.error('getAllSizes error:', e)
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllPcd = createAsyncThunk(
  'stock/getAllPcd',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Calling getAllPcd API...')
      const response = await client.get('/alloys/pcds')
      console.log('getAllPcd response:', response.data)
      return response.data
    } catch (e) {
      console.error('getAllPcd error:', e)
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllHoles = createAsyncThunk(
  'stock/getAllHoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/alloys/holes')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllCbs = createAsyncThunk(
  'stock/getAllCbs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/alloys/cbs')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllOffsets = createAsyncThunk(
  'stock/getAllOffsets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/alloys/offsets')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllWidths = createAsyncThunk(
  'stock/getAllWidths',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/alloys/widths')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllModels = createAsyncThunk(
  'stock/getAllModels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/alloys/models')
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllAlloysWithSameParams = createAsyncThunk(
  'stock/getAllAlloysWithSameParams',
  async (
    { pcdId, modelId, cbId, finishId, holesId, inchesId, offsetId, widthId },
    { rejectWithValue }
  ) => {
    try {
      const response = await client.post('/alloys/get-alloy-with-same-params', {
        pcdId,
        modelId,
        cbId,
        finishId,
        holesId,
        inchesId,
        offsetId,
        widthId
      })
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getConversionOptions = createAsyncThunk(
  'stock/getConversionOptions',
  async ({ alloyId }, { rejectWithValue }) => {
    try {
      const response = await client.post('/alloys/get-conversion-options', {
        alloyId
      })
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const createAlloyEntry = createAsyncThunk(
  'stock/createAlloyEntry',
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
      productName
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await client.post('/alloys/create-alloy', {
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
        productName
      })
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const getAllProducts = createAsyncThunk(
  'dailyEntry/getAllProducts',
  async ({ type }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/master/all-products?type=${type}`)
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

export const createCap = createAsyncThunk(
  'master/createCap',
  async ({ capModel }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/master/create-cap`, { capModel })
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)
export const addFinishes = createAsyncThunk(
  'alloys/addFinishes',
  async ({ finish }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/alloys/add-finishes`, { finish })
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)
export const addModel = createAsyncThunk(
  'alloys/addModel',
  async ({ model }, { rejectWithValue }) => {
    try {
      const response = await client.post(`/alloys/add-model`, { model })
      return response.data
    } catch (e) {
      return rejectWithValue(getError(e))
    }
  }
)

// Stock Management API Functions
export const getStockManagement = createAsyncThunk(
  'stock/getStockManagement',
  async ({ page = 1, limit = 50, search = '', filter = 'all', pcd = null, inches = null }, { rejectWithValue }) => {
    try {
      const params = { page, limit, search, filter }
      if (pcd) params.pcd = pcd
      if (inches) params.inches = inches
      
      const response = await client.get(`/alloys/stock/management`, { params })
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const updateStock = createAsyncThunk(
  'stock/updateStock',
  async ({ alloyId, in_house_stock, showroom_stock, reason }, { rejectWithValue }) => {
    try {
      const response = await client.put(`/alloys/stock/update/${alloyId}`, {
        in_house_stock,
        showroom_stock,
        reason
      })
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const createStockProduct = createAsyncThunk(
  'stock/createStockProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await client.post(`/alloys/stock/create`, productData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const deleteStockProduct = createAsyncThunk(
  'stock/deleteStockProduct',
  async ({ alloyId }, { rejectWithValue }) => {
    try {
      const response = await client.delete(`/alloys/stock/delete/${alloyId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)
