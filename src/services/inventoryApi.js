import { client } from '../Utils/axiosClient'

export class InventoryApiService {
  /**
   * Get all inventory items
   * @returns {Promise} API response
   */
  static async getAllInventory () {
    try {
      const response = await client.get('/inventory/')
      return response.data
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
      throw new Error(
        error.response?.data?.message || 'Failed to fetch inventory'
      )
    }
  }

  /**
   * Get stock estimation with advanced analytics
   * @param {Object} params - Parameters for stock estimation
   * @returns {Promise} API response
   */
  static async getStockEstimation (params = {}) {
    try {
      const queryParams = new URLSearchParams({
        productId: params.productId || '',
        productType: params.productType || 'alloy',
        cushionMonths: params.cushionMonths?.toString() || '3',
        riskTolerance: params.riskTolerance || 'medium',
        forecastPeriod: params.forecastPeriod?.toString() || '6',
        includeSeasonality: params.includeSeasonality?.toString() || 'true',
        aiEnhanced: params.aiEnhanced?.toString() || 'false'
      })

      const response = await client.get(
        `/inventory/stock-estimation?${queryParams}`
      )
      return response.data
    } catch (error) {
      console.error('Stock estimation failed:', error)
      throw new Error(
        error.response?.data?.message || 'Stock estimation failed'
      )
    }
  }

  /**
   * Add new inventory entry
   * @param {Object} data - Inventory data
   * @returns {Promise} API response
   */
  static async addInventory (data) {
    try {
      const response = await client.post('/inventory/add-inventory', data)
      return response.data
    } catch (error) {
      console.error('Failed to add inventory:', error)
      throw new Error(
        error.response?.data?.message || 'Failed to add inventory'
      )
    }
  }

  /**
   * Update single alloy stock
   * @param {Object} data - Stock update data
   * @returns {Promise} API response
   */
  static async updateStock (data) {
    try {
      const response = await client.put('/inventory/update-stock', data)
      return response.data
    } catch (error) {
      console.error('Failed to update stock:', error)
      throw new Error(error.response?.data?.message || 'Failed to update stock')
    }
  }

  /**
   * Batch update multiple alloy stock
   * @param {Object} data - Batch update data
   * @returns {Promise} API response
   */
  static async batchUpdateStock (data) {
    try {
      const response = await client.put('/inventory/batch-update-stock', data)
      return response.data
    } catch (error) {
      console.error('Failed to batch update stock:', error)
      throw new Error(
        error.response?.data?.message || 'Failed to batch update stock'
      )
    }
  }

  /**
   * Bulk stock analysis for multiple products
   * @param {Object} data - Bulk analysis data
   * @returns {Promise} API response
   */
  static async bulkStockAnalysis (data) {
    try {
      const response = await client.post('/inventory/bulk-stock-analysis', data)
      return response.data
    } catch (error) {
      console.error('Bulk stock analysis failed:', error)
      throw new Error(
        error.response?.data?.message || 'Bulk stock analysis failed'
      )
    }
  }
}

export default InventoryApiService
