import { useState, useEffect, useCallback } from 'react'
import StockAnalysisApiService from '../services/stockAnalysisApi'

export const useStockAnalysis = ({ productId, settings = {} }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAnalysis = useCallback(async () => {
    if (!productId) return

    setLoading(true)
    setError(null)

    try {
      const result = await StockAnalysisApiService.analyzeSingle(
        productId,
        settings
      )

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.message || 'Analysis failed')
      }
    } catch (err) {
      setError(err.message || 'Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [productId, JSON.stringify(settings)])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  return {
    data,
    loading,
    error,
    refetch: fetchAnalysis
  }
}

export const useBulkStockAnalysis = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyzeBulk = useCallback(async (productIds, settings = {}) => {
    if (!productIds || productIds.length === 0) {
      setError('No products selected for analysis')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await StockAnalysisApiService.analyzeBulk(
        productIds,
        settings
      )

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.message || 'Bulk analysis failed')
      }
    } catch (err) {
      setError(err.message || 'Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    data,
    loading,
    error,
    analyzeBulk,
    clearData: () => setData(null),
    clearError: () => setError(null)
  }
}

export const useInventoryItems = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await StockAnalysisApiService.getInventoryItems()
      setItems(result.data || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return {
    items,
    loading,
    error,
    refetch: fetchItems
  }
}
