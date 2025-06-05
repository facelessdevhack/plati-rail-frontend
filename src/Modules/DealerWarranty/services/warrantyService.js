import { client } from '../../../Utils/axiosClient'

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
      const response = await client.get('/v2/dealers')
      return response.data
    } catch (error) {
      console.error('Error fetching dealers:', error)
      throw error
    }
  },

  // Get product registration by ID
  getProductRegistrationById: async id => {
    try {
      const response = await client.get(`/v2/product-registrations/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching product registration:', error)
      throw error
    }
  },

  // Update product registration status
  updateRegistrationStatus: async (id, status) => {
    try {
      const response = await client.put(
        `/v2/product-registrations/${id}/status`,
        {
          status
        }
      )
      return response.data
    } catch (error) {
      console.error('Error updating registration status:', error)
      throw error
    }
  }
}

export default warrantyService
