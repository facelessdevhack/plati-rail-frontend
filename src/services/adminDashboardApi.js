import { client } from '../Utils/axiosClient'

export class AdminDashboardApiService {
  /**
   * Get comprehensive admin sales dashboard data
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  static async getSalesDashboard (params = {}) {
    try {
      const queryParams = new URLSearchParams()

      // Add query parameters if provided
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.dealerId) queryParams.append('dealerId', params.dealerId)
      if (params.productId) queryParams.append('productId', params.productId)
      if (params.chartPeriod)
        queryParams.append('chartPeriod', params.chartPeriod)

      const response = await client.get(
        `/dashboard/sales-dashboard?${queryParams}`
      )

      return response.data
    } catch (error) {
      console.error('Sales dashboard API failed:', error)
      throw new Error(
        error.response?.data?.message || 'Failed to fetch sales dashboard data'
      )
    }
  }

  /**
   * Helper method to get dashboard data with default parameters
   * @param {Object} filters - Filter options
   * @returns {Promise} API response
   */
  static async getDashboardData (filters = {}) {
    const defaultParams = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // 30 days ago
      endDate: new Date().toISOString().split('T')[0], // Today
      chartPeriod: 'daily',
      ...filters
    }

    return this.getSalesDashboard(defaultParams)
  }

  /**
   * Get dashboard data for specific date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} additionalFilters - Additional filters
   * @returns {Promise} API response
   */
  static async getDashboardByDateRange (
    startDate,
    endDate,
    additionalFilters = {}
  ) {
    return this.getSalesDashboard({
      startDate,
      endDate,
      ...additionalFilters
    })
  }

  /**
   * Get dashboard data for specific dealer
   * @param {number} dealerId - Dealer ID
   * @param {Object} additionalParams - Additional parameters
   * @returns {Promise} API response
   */
  static async getDashboardByDealer (dealerId, additionalParams = {}) {
    return this.getSalesDashboard({
      dealerId,
      ...additionalParams
    })
  }

  /**
   * Get dashboard data for specific product
   * @param {number} productId - Product ID
   * @param {Object} additionalParams - Additional parameters
   * @returns {Promise} API response
   */
  static async getDashboardByProduct (productId, additionalParams = {}) {
    return this.getSalesDashboard({
      productId,
      ...additionalParams
    })
  }
}

export default AdminDashboardApiService
