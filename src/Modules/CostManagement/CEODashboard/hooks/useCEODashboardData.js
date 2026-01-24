import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { client } from '../../../../Utils/axiosClient'
import dayjs from 'dayjs'

/**
 * Custom hook for fetching CEO Dashboard data
 * @param {number} initialYear - Initial year for data (legacy mode)
 * @param {number} initialMonth - Initial month for data (legacy mode)
 */
const useCEODashboardData = (
  initialYear = dayjs().year(),
  initialMonth = dayjs().month() + 1
) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  // Date range state (null means use year/month mode)
  const [dateRange, setDateRange] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build params based on mode (date range vs month)
      const params = {
        compareWithPrevious: true
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        // Custom date range mode
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      } else {
        // Legacy month mode
        params.year = year
        params.month = month
      }

      const response = await client.get('/cost-management/ceo/product-pl', { params })

      if (response.data.success) {
        setData(response.data.data)
      } else {
        throw new Error(response.data.message || 'Failed to fetch data')
      }
    } catch (err) {
      console.error('Error fetching CEO dashboard data:', err)
      setError(err.message || 'Failed to fetch dashboard data')
      message.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [year, month, dateRange])

  // Fetch data on mount and when year/month/dateRange changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Helper function to refresh data
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Helper function to change period (legacy month mode)
  const setPeriod = useCallback((newYear, newMonth) => {
    setDateRange(null) // Clear date range when switching to month mode
    setYear(newYear)
    setMonth(newMonth)
  }, [])

  // Helper function to set custom date range
  const setCustomDateRange = useCallback((range) => {
    setDateRange(range)
  }, [])

  return {
    loading,
    error,
    data,
    year,
    month,
    dateRange,
    setYear,
    setMonth,
    setPeriod,
    setCustomDateRange,
    refresh,
    // Destructured data for convenience
    summary: data?.summary || null,
    topProducts: data?.topProducts || [],
    bottomProducts: data?.bottomProducts || [],
    bySize: data?.bySize || [],
    byModel: data?.byModel || [],
    byDealer: data?.byDealer || [],
    trends: data?.trends || [],
    profitabilityMatrix: data?.profitabilityMatrix || [],
    productMix: data?.productMix || [],
    period: data?.period || null
  }
}

export default useCEODashboardData
