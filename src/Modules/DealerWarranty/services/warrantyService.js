import { client, warrantyClient } from '../../../Utils/axiosClient'

export const warrantyService = {
  // Get all product registrations
  getAllProductRegistrations: async (dealerId = null) => {
    try {
      const params = new URLSearchParams()
      if (dealerId) {
        params.append('dealerId', dealerId)
      }

      const response = await client.get(
        `/warranty/registrations?${params.toString()}`
      )
      return response.data
    } catch (error) {
      console.error('Error fetching product registrations:', error)
      throw error
    }
  },

  // Get dealers list
  getDealers: async () => {
    try {
      const response = await client.get('/dealers')
      return response.data
    } catch (error) {
      console.error('Error fetching dealers:', error)
      throw error
    }
  },

  // Get product registration by ID
  getProductRegistrationById: async id => {
    try {
      const response = await client.get(`/warranty/registrations/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching product registration:', error)
      throw error
    }
  },

  // Update product registration status
  updateRegistrationStatus: async (id, status) => {
    try {
      const response = await client.put(`/warranty/registrations/${id}`, {
        register_status: status
      })
      return response.data
    } catch (error) {
      console.error('Error updating registration status:', error)
      throw error
    }
  },

  // Update product registration details
  updateProductRegistration: async (id, data) => {
    try {
      // Debug: Log the data being sent to the API
      console.log('Warranty Service - Sending data to API:', data)
      console.log('Warranty Service - Mobile number:', data.mobileNo)
      console.log(
        'Warranty Service - API endpoint:',
        `/warranty/registrations/${id}`
      )

      const response = await client.put(`/warranty/registrations/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating product registration:', error)
      throw error
    }
  },

  // Delete product registration
  deleteProductRegistration: async id => {
    try {
      const response = await client.delete(`/warranty/registrations/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting product registration:', error)
      throw error
    }
  },

  // Bulk update product registrations
  bulkUpdateProductRegistrations: async registrations => {
    try {
      const response = await client.put(`/warranty/registrations/bulk-update`, {
        registrations
      })
      return response.data
    } catch (error) {
      console.error('Error bulk updating product registrations:', error)
      throw error
    }
  },

  // Send OTP for warranty verification - using SMS endpoint
  sendOtpVerification: async (registrationId, mobileNumber) => {
    try {
      // Use SMS OTP endpoint (confirmed working)
      const response = await client.post('/sms/send-otp', {
        mobile_no: mobileNumber,
        type: 'warranty_verification',
        registration_id: registrationId // Include for context
      })
      return response.data
    } catch (error) {
      console.error('Error sending OTP via SMS:', error)
      throw error
    }
  },

  // Verify OTP for warranty - using SMS endpoint
  verifyOtp: async ({ id, otp }) => {
    try {
      // Use SMS OTP verification endpoint
      const response = await warrantyClient.post('/otp/verify', {
        otp,
        id // Include for context
      })
      console.log('Verify OTP response:', response)
      if (response.status === 200) {
        return response
      }
    } catch (error) {
      console.error('Error verifying OTP via SMS:', error)
      throw error
    }
  }
}

export const warrantyOTPClient = {
  sendOtpVerification: async ({ otp, mobileNumber }) => {
    try {
      console.log('Sending OTP with params:', { otp, mobileNumber })
      const response = await warrantyClient.post('/sms/send-otp', {
        mobile_no: mobileNumber,
        otp: otp
      })
      console.log('Send OTP response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error sending OTP via SMS:', error)
      throw error
    }
  },
  updateOtp: async (id, otp) => {
    try {
      const response = await warrantyClient.post('/otp/update', {
        otp,
        id
      })
      return response.data
    } catch (error) {
      console.error('Error updating OTP:', error)
      throw error
    }
  }
}

export default warrantyService
