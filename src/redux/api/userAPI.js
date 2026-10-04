import { createAsyncThunk } from '@reduxjs/toolkit'
import { client, getError } from '../../Utils/axiosClient'

export const userAuthenticate = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await client.post('/auth/login', {
        email,
        password
      })

      // Password verification only grants a short enrollment/authentication ticket.
      // It is never saved as an app session.
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
      //return error;
    }
  }
)
