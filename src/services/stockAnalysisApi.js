import { client } from '../Utils/axiosClient'

export class StockAnalysisApiService {
  /**
   * Analyze a single product and get comprehensive order recommendations
   * @param {string} productId - Product ID from alloy_master
   * @param {Object} params - Optional parameters
   * @returns {Promise} API response
   */
  static async analyzeSingle (productId, params = {}) {
    try {
      const queryParams = new URLSearchParams({
        productId,
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
      console.error('Single stock analysis failed:', error)
      throw new Error(error.response?.data?.message || 'Stock analysis failed')
    }
  }

  /**
   * Analyze multiple products simultaneously for comprehensive inventory planning
   * @param {number[]} productIds - Array of product IDs
   * @param {Object} params - Optional parameters
   * @returns {Promise} API response
   */
  static async analyzeBulk (productIds, params = {}) {
    try {
      const requestBody = {
        productIds,
        productType: params.productType || 'alloy',
        cushionMonths: params.cushionMonths || 3,
        riskTolerance: params.riskTolerance || 'medium'
      }

      const response = await client.post(
        '/inventory/bulk-stock-analysis',
        requestBody
      )
      return response.data
    } catch (error) {
      console.error('Bulk stock analysis failed:', error)
      throw new Error(error.response?.data?.message || 'Bulk analysis failed')
    }
  }

  /**
   * Get available inventory items for analysis
   * @returns {Promise} List of inventory items
   */
  static async getInventoryItems () {
    try {
      const response = await client.get('/inventory/')
      return response.data
    } catch (error) {
      console.error('Failed to fetch inventory items:', error)
      throw new Error('Failed to fetch inventory items')
    }
  }
}

export default StockAnalysisApiService
