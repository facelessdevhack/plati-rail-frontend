import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import InventoryApiService from '../services/inventoryApi'

export const useInventory = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await InventoryApiService.getAllInventory()
      // Handle different response structures and convert snake_case to camelCase
      const inventoryData = data.result || data.data || []
      const transformedData = inventoryData.map(item => ({
        ...item,
        productName: item.product_name || item.productName,
        inHouseStock: item.in_house_stock || item.inHouseStock,
        showroomStock: item.showroom_stock || item.showroomStock,
        uniqueId: item.unique_id || item.uniqueId || item.id,
        // Keep both size and inches fields for compatibility
        size: item.size || item.inches,
        inches: item.inches || item.size,
        // Keep existing PCD or derive from other fields if available
        pcd: item.pcd || item.bolt_pattern || item.boltPattern || '',
        // Ensure numeric fields are properly converted
        price: parseFloat(item.price || 0),
        id: item.id
      }))
      setInventory(transformedData)
      console.log('Transformed inventory data:', transformedData) // Debug log
    } catch (err) {
      setError(err.message)
      message.error(`Failed to fetch inventory: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  return { inventory, loading, error, refetch: fetchInventory }
}

export const useStockManagement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getCurrentUserId = () => {
    // Get user ID from Redux store or localStorage
    const userString = localStorage.getItem('user')
    if (userString) {
      const user = JSON.parse(userString)
      return user.id || user.userId || 1
    }
    return 1
  }

  const updateStock = useCallback(
    async (alloyId, stockData, operation = 'set') => {
      setLoading(true)
      setError(null)

      try {
        const response = await InventoryApiService.updateStock({
          alloyId,
          ...stockData,
          operation,
          userId: getCurrentUserId()
        })

        message.success('Stock updated successfully!')
        return response.data
      } catch (err) {
        setError(err.message)
        message.error(`Error updating stock: ${err.message}`)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const batchUpdateStock = useCallback(async (updates, operation = 'set') => {
    setLoading(true)
    setError(null)

    try {
      const response = await InventoryApiService.batchUpdateStock({
        updates,
        operation,
        userId: getCurrentUserId()
      })

      const { successful, failed } = response.data
      if (successful > 0) {
        message.success(`Successfully updated ${successful} items`)
      }
      if (failed > 0) {
        message.warning(`Failed to update ${failed} items`)
      }

      return response.data
    } catch (err) {
      setError(err.message)
      message.error(`Error in batch update: ${err.message}`)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const addInventory = useCallback(async inventoryData => {
    setLoading(true)
    setError(null)

    try {
      const response = await InventoryApiService.addInventory({
        ...inventoryData,
        userId: getCurrentUserId()
      })

      message.success('Inventory added successfully!')
      return response
    } catch (err) {
      setError(err.message)
      message.error(`Error adding inventory: ${err.message}`)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    updateStock,
    batchUpdateStock,
    addInventory,
    loading,
    error
  }
}

export const useStockAnalysis = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getStockEstimation = useCallback(async params => {
    setLoading(true)
    setError(null)

    try {
      const response = await InventoryApiService.getStockEstimation(params)
      return response
    } catch (err) {
      setError(err.message)
      message.error(`Stock estimation failed: ${err.message}`)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkStockAnalysis = useCallback(async (productIds, params = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await InventoryApiService.bulkStockAnalysis({
        productIds,
        ...params
      })
      return response
    } catch (err) {
      setError(err.message)
      message.error(`Bulk analysis failed: ${err.message}`)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    getStockEstimation,
    bulkStockAnalysis,
    loading,
    error
  }
}
