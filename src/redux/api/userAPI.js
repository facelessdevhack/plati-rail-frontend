import { createAsyncThunk } from '@reduxjs/toolkit'
import { client, getError } from '../../Utils/axiosClient'
import { resetSessionExpiryHandling } from '../../Utils/session'

export const userAuthenticate = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await client.post('/auth/login', {
        email,
        password
      })

      localStorage.setItem('user', JSON.stringify(response.data))
      // Save the token to localStorage for axios usage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        resetSessionExpiryHandling()
      }
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
      //return error;
    }
  }
)
