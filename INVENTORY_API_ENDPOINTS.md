# Inventory API Endpoints Documentation

## 📋 **Overview**

This document provides comprehensive documentation for all inventory-related API endpoints in the Plati System ERP. These endpoints handle alloy inventory management, stock updates, and advanced analytics.

**Base URL:** `/api/v2/inventory`  
**Authentication:** Required (userId in request body)  
**Content-Type:** `application/json`

---

## 🔍 **GET Endpoints**

### **1. Get All Inventory**

```
GET /api/v2/inventory/
```

**Description:** Retrieve all alloy inventory data from the system

**Headers:**

- `Content-Type: application/json`

**Response:**

```json
{
  "result": [
    {
      "id": 123,
      "product_name": "Alloy Wheel XYZ",
      "in_house_stock": 50,
      "showroom_stock": 25,
      "price": 2500.0,
      "brand": "Premium Brand",
      "size": "18x8.5",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Error Response:**

```json
{
  "message": "Something Went Wrong"
}
```

---

### **2. Stock Order Estimation (Advanced Analytics)**

```
GET /api/v2/inventory/stock-estimation
```

**Description:** Get AI-powered stock analysis and order recommendations with forecasting

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `productId` | number | required | Product ID to analyze |
| `productType` | string | 'alloy' | Product type ('alloy' or 'tyre') |
| `cushionMonths` | number | 3 | Buffer months for stock planning |
| `riskTolerance` | string | 'medium' | Risk level ('low', 'medium', 'high') |
| `forecastPeriod` | number | 6 | Forecast period in months |
| `includeSeasonality` | boolean | true | Include seasonal patterns |
| `aiEnhanced` | boolean | false | Enable AI insights |

**Example Request:**

```
GET /api/v2/inventory/stock-estimation?productId=123&productType=alloy&cushionMonths=3&riskTolerance=medium&forecastPeriod=6&includeSeasonality=true&aiEnhanced=false
```

**Response:**

```json
{
  "success": true,
  "data": {
    "productInfo": {
      "productId": 123,
      "productType": "alloy",
      "currentStock": {
        "inHouseStock": 50,
        "showroomStock": 25,
        "totalStock": 75,
        "productName": "Alloy Wheel XYZ"
      }
    },
    "analysis": {
      "salesHistory": {
        "totalSales": 120,
        "monthlyData": [
          {
            "month": "2024-01",
            "quantity": 25,
            "orders": 8,
            "avgOrderSize": 3.125
          }
        ],
        "trend": {
          "trend": "increasing",
          "slope": 0.85,
          "correlation": 0.72,
          "strength": "strong"
        }
      },
      "seasonalPatterns": [
        {
          "month": 1,
          "monthName": "January",
          "avgQuantity": 20.5,
          "seasonalIndex": 0.95,
          "isHighSeason": false,
          "isLowSeason": false
        }
      ],
      "demandForecast": {
        "avgMonthlyDemand": 22,
        "forecastedDemand": [25, 27, 30, 28, 26, 24],
        "totalForecastedDemand": 160,
        "confidenceLevel": "high"
      },
      "supplierMetrics": {
        "avgLeadTime": 7,
        "leadTimeVariance": 2,
        "totalOrders": 15,
        "avgOrderCost": 1200,
        "avgHoldingCost": 100
      },
      "safetyStock": 18,
      "reorderPoint": 45,
      "eoq": 85
    },
    "recommendation": {
      "recommendedOrderQuantity": 100,
      "urgency": "medium",
      "reasoning": [
        "Building cushion stock for 3 months",
        "Adjusted to Economic Order Quantity for cost efficiency"
      ],
      "targetStock": 90,
      "currentStock": 75,
      "reorderPoint": 45,
      "eoq": 85,
      "daysOfStockRemaining": 30,
      "estimatedStockoutDate": "2024-02-15",
      "costAnalysis": {
        "estimatedOrderCost": 1200,
        "holdingCostPerMonth": 750
      }
    },
    "settings": {
      "cushionMonths": 3,
      "riskTolerance": "medium",
      "forecastPeriod": 6,
      "includeSeasonality": true,
      "aiEnhanced": false
    }
  },
  "message": "Stock order estimation completed successfully"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Product ID is required"
}
```

---

## 📝 **POST Endpoints**

### **3. Add Alloy Inventory**

```
POST /api/v2/inventory/add-inventory
```

**Description:** Add new inventory entry to the system

**Request Body:**

```json
{
  "alloyId": 123,
  "quantity": 50,
  "userId": 1
}
```

**Response:**

```json
{
  "message": "Entry Completed Successfully"
}
```

**Error Response:**

```json
{
  "message": "Something went wrong"
}
```

---

### **4. Bulk Stock Analysis**

```
POST /api/v2/inventory/bulk-stock-analysis
```

**Description:** Analyze multiple products simultaneously for comprehensive stock insights

**Request Body:**

```json
{
  "productIds": [123, 124, 125],
  "productType": "alloy",
  "cushionMonths": 3,
  "riskTolerance": "medium"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalProducts": 3,
      "successfulAnalyses": 3,
      "criticalStockProducts": 1,
      "totalRecommendedOrderValue": 3600
    },
    "analyses": [
      {
        "productId": 123,
        "success": true,
        "analysis": {
          "productInfo": {
            /* ... */
          },
          "recommendation": {
            /* ... */
          }
        }
      },
      {
        "productId": 124,
        "success": false,
        "error": "Product not found"
      }
    ]
  },
  "message": "Bulk stock analysis completed"
}
```

---

## 🔄 **PUT Endpoints (Stock Update APIs)**

### **5. Update Single Alloy Stock**

```
PUT /api/v2/inventory/update-stock
```

**Description:** Update in-house and/or showroom stock for a single alloy with flexible operations

**Request Body:**

```json
{
  "alloyId": 123,
  "inHouseStock": 50, // Optional - update in-house stock
  "showroomStock": 25, // Optional - update showroom stock
  "userId": 1, // Required - user performing the update
  "operation": "set" // Required - "set", "add", "subtract"
}
```

**Operation Types:**

- **`set`** - Direct assignment of stock values
- **`add`** - Add to existing stock levels
- **`subtract`** - Subtract from existing stock levels (minimum 0)

**Response:**

```json
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "alloyId": 123,
    "productName": "Alloy Wheel XYZ",
    "previousStock": {
      "inHouseStock": 30,
      "showroomStock": 20,
      "totalStock": 50
    },
    "updatedStock": {
      "inHouseStock": 50,
      "showroomStock": 25,
      "totalStock": 75
    },
    "operation": "set"
  }
}
```

**Error Responses:**

```json
{
  "success": false,
  "message": "Alloy ID is required"
}
```

```json
{
  "success": false,
  "message": "Alloy not found"
}
```

---

### **6. Batch Update Multiple Alloy Stock**

```
PUT /api/v2/inventory/batch-update-stock
```

**Description:** Update stock for multiple alloys in a single transaction

**Request Body:**

```json
{
  "updates": [
    {
      "alloyId": 123,
      "inHouseStock": 50,
      "showroomStock": 25
    },
    {
      "alloyId": 124,
      "inHouseStock": 30
    },
    {
      "alloyId": 125,
      "showroomStock": 15
    }
  ],
  "userId": 1,
  "operation": "set"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Batch stock update completed",
  "data": {
    "totalRequested": 3,
    "successful": 2,
    "failed": 1,
    "results": [
      {
        "alloyId": 123,
        "productName": "Alloy Wheel XYZ",
        "success": true,
        "updatedStock": {
          "inHouseStock": 50,
          "showroomStock": 25,
          "totalStock": 75
        }
      },
      {
        "alloyId": 124,
        "productName": "Alloy Wheel ABC",
        "success": true,
        "updatedStock": {
          "inHouseStock": 30,
          "showroomStock": 10,
          "totalStock": 40
        }
      }
    ],
    "errors": [
      {
        "alloyId": 125,
        "error": "Alloy not found"
      }
    ],
    "operation": "set"
  }
}
```

---

## 🎯 **Frontend Implementation Guide**

### **JavaScript/TypeScript API Functions**

```javascript
// inventory-api.js
const API_BASE = '/api/v2/inventory'

// Utility function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// 1. Get all inventory
export const getAllInventory = async () => {
  return apiRequest('/')
}

// 2. Get stock estimation
export const getStockEstimation = async params => {
  const queryString = new URLSearchParams(params).toString()
  return apiRequest(`/stock-estimation?${queryString}`)
}

// 3. Add inventory
export const addInventory = async data => {
  return apiRequest('/add-inventory', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 4. Update single stock
export const updateStock = async data => {
  return apiRequest('/update-stock', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// 5. Batch update stock
export const batchUpdateStock = async data => {
  return apiRequest('/batch-update-stock', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// 6. Bulk stock analysis
export const bulkStockAnalysis = async data => {
  return apiRequest('/bulk-stock-analysis', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}
```

### **React Hooks**

```javascript
// hooks/useInventory.js
import { useState, useEffect, useCallback } from 'react'
import * as inventoryAPI from '../api/inventory-api'

export const useInventory = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await inventoryAPI.getAllInventory()
      setInventory(data.result || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  return { inventory, loading, error, refetch: fetchInventory }
}

// hooks/useStockManagement.js
export const useStockManagement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateStock = useCallback(
    async (alloyId, stockData, operation = 'set') => {
      setLoading(true)
      setError(null)

      try {
        const response = await inventoryAPI.updateStock({
          alloyId,
          ...stockData,
          operation,
          userId: getCurrentUserId() // Implement this function
        })

        return response.data
      } catch (err) {
        setError(err.message)
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
      const response = await inventoryAPI.batchUpdateStock({
        updates,
        operation,
        userId: getCurrentUserId()
      })

      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateStock, batchUpdateStock, loading, error }
}
```

### **React Components Examples**

```jsx
// components/StockUpdateForm.jsx
import React, { useState } from 'react'
import { useStockManagement } from '../hooks/useStockManagement'

const StockUpdateForm = ({ alloyId, currentStock, onSuccess }) => {
  const { updateStock, loading, error } = useStockManagement()
  const [formData, setFormData] = useState({
    inHouseStock: currentStock?.inHouseStock || '',
    showroomStock: currentStock?.showroomStock || '',
    operation: 'set'
  })

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      const result = await updateStock(
        alloyId,
        {
          inHouseStock: parseInt(formData.inHouseStock) || undefined,
          showroomStock: parseInt(formData.showroomStock) || undefined
        },
        formData.operation
      )

      onSuccess?.(result)
      alert('Stock updated successfully!')
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='stock-update-form'>
      <div className='form-group'>
        <label>Operation Type:</label>
        <select
          value={formData.operation}
          onChange={e =>
            setFormData({ ...formData, operation: e.target.value })
          }
        >
          <option value='set'>Set Stock</option>
          <option value='add'>Add Stock</option>
          <option value='subtract'>Subtract Stock</option>
        </select>
      </div>

      <div className='form-group'>
        <label>In-House Stock:</label>
        <input
          type='number'
          min='0'
          value={formData.inHouseStock}
          onChange={e =>
            setFormData({ ...formData, inHouseStock: e.target.value })
          }
          placeholder='Enter in-house stock'
        />
      </div>

      <div className='form-group'>
        <label>Showroom Stock:</label>
        <input
          type='number'
          min='0'
          value={formData.showroomStock}
          onChange={e =>
            setFormData({ ...formData, showroomStock: e.target.value })
          }
          placeholder='Enter showroom stock'
        />
      </div>

      <button type='submit' disabled={loading}>
        {loading ? 'Updating...' : 'Update Stock'}
      </button>

      {error && <div className='error-message'>{error}</div>}
    </form>
  )
}

// components/InventoryDashboard.jsx
import React from 'react'
import { useInventory } from '../hooks/useInventory'

const InventoryDashboard = () => {
  const { inventory, loading, error, refetch } = useInventory()

  if (loading) return <div>Loading inventory...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className='inventory-dashboard'>
      <div className='dashboard-header'>
        <h2>Inventory Dashboard</h2>
        <button onClick={refetch}>Refresh</button>
      </div>

      <div className='inventory-grid'>
        {inventory.map(item => (
          <div key={item.id} className='inventory-item'>
            <h3>{item.product_name}</h3>
            <div className='stock-info'>
              <p>In-House: {item.in_house_stock}</p>
              <p>Showroom: {item.showroom_stock}</p>
              <p>
                Total:{' '}
                {parseInt(item.in_house_stock) + parseInt(item.showroom_stock)}
              </p>
            </div>
            <StockUpdateForm
              alloyId={item.id}
              currentStock={{
                inHouseStock: item.in_house_stock,
                showroomStock: item.showroom_stock
              }}
              onSuccess={() => refetch()}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### **Vue.js Example**

```javascript
// composables/useInventory.js
import { ref, onMounted } from 'vue'
import * as inventoryAPI from '../api/inventory-api'

export const useInventory = () => {
  const inventory = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchInventory = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await inventoryAPI.getAllInventory()
      inventory.value = data.result || []
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchInventory)

  return { inventory, loading, error, refetch: fetchInventory }
}
```

---

## 📊 **Response Status Codes**

| Status Code | Description                        |
| ----------- | ---------------------------------- |
| 200         | Success                            |
| 400         | Bad Request - Invalid parameters   |
| 404         | Not Found - Resource doesn't exist |
| 500         | Internal Server Error              |

---

## 🔐 **Authentication & Authorization**

All endpoints require:

- Valid user session
- `userId` in request body for modification endpoints
- Appropriate user permissions for inventory management

---

## 📝 **Notes**

1. **Stock Values**: All stock values are automatically constrained to non-negative integers
2. **Audit Trail**: Stock changes are logged in `stock_audit_log` table (if exists)
3. **Validation**: Comprehensive server-side validation for all inputs
4. **Error Handling**: Detailed error messages for debugging
5. **Performance**: Batch operations are optimized for multiple updates
6. **AI Features**: Stock estimation includes machine learning capabilities when enabled

---

## 🏷️ **Version Information**

- **API Version**: v2
- **Last Updated**: 2024-01-15
- **Compatibility**: Node.js 16+, Express 4.x, Knex.js 2.x
