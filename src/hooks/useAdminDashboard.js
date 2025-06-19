import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import AdminDashboardApiService from '../services/adminDashboardApi'

export const useAdminDashboard = (initialFilters = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    chartPeriod: 'daily',
    ...initialFilters
  })

  const fetchDashboardData = useCallback(
    async (showMessage = false) => {
      setLoading(true)
      setError(null)

      try {
        const result = await AdminDashboardApiService.getSalesDashboard(filters)
        setData(result.data)

        if (showMessage) {
          message.success('Dashboard data refreshed successfully')
        }
      } catch (err) {
        setError(err.message)
        message.error(`Failed to load dashboard: ${err.message}`)
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const updateFilters = useCallback(newFilters => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const refresh = useCallback(() => {
    fetchDashboardData(true)
  }, [fetchDashboardData])

  const setDateRange = useCallback(
    (startDate, endDate) => {
      updateFilters({ startDate, endDate })
    },
    [updateFilters]
  )

  const setChartPeriod = useCallback(
    chartPeriod => {
      updateFilters({ chartPeriod })
    },
    [updateFilters]
  )

  const setDealerFilter = useCallback(
    dealerId => {
      updateFilters({ dealerId })
    },
    [updateFilters]
  )

  const setProductFilter = useCallback(
    productId => {
      updateFilters({ productId })
    },
    [updateFilters]
  )

  const clearFilters = useCallback(() => {
    setFilters({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      chartPeriod: 'daily'
    })
  }, [])

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refresh,
    setDateRange,
    setChartPeriod,
    setDealerFilter,
    setProductFilter,
    clearFilters
  }
}
