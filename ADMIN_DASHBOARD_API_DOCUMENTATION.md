# Admin Dashboard API Documentation

## 📋 **Overview**

This document provides comprehensive documentation for the Admin Dashboard API in the Plati System ERP. This single endpoint provides all the data needed for a complete sales analytics dashboard with KPIs, charts, and detailed breakdowns for administrative users.

**Base URL:** `/api/v2/dashboard`  
**Authentication:** Required  
**Content-Type:** `application/json`

---

## 🎯 **Main Endpoint**

### **Admin Sales Dashboard**

```
GET /api/v2/dashboard/sales-dashboard
```

**Description:** Comprehensive admin sales analytics endpoint that provides four main segments: Total Sales Quantity, Total Sales Amount, Top Selling Products, and Top Dealers with advanced filtering and chart-ready data for administrative oversight.

---

## 📊 **Four Main Segments**

### **1. Total Sales (Quantity)**

- Total units sold across all products
- Quantity trends over time
- Growth percentage comparisons
- Average quantity per order

### **2. Total Sales (Amount)**

- Total revenue generated
- Revenue trends and patterns
- Growth percentage analysis
- Average order values

### **3. Top Selling Products**

- Rankings by quantity and revenue
- Product performance metrics
- Category breakdowns
- Price analysis

### **4. Top Dealers**

- Customer performance rankings
- Purchase behavior analysis
- Dealer type segmentation
- Relationship metrics

---

## 🔍 **Query Parameters**

| Parameter     | Type    | Required | Default     | Description                                  |
| ------------- | ------- | -------- | ----------- | -------------------------------------------- |
| `startDate`   | String  | No       | 30 days ago | Start date (YYYY-MM-DD format)               |
| `endDate`     | String  | No       | Today       | End date (YYYY-MM-DD format)                 |
| `dealerId`    | Integer | No       | null        | Filter by specific dealer ID                 |
| `productId`   | Integer | No       | null        | Filter by specific product ID                |
| `chartPeriod` | String  | No       | 'daily'     | Chart grouping: 'daily', 'weekly', 'monthly' |

---

## 📝 **Request Examples**

### **Basic Request**

```bash
GET /api/v2/dashboard/sales-dashboard
```

### **Date Range Filter**

```bash
GET /api/v2/dashboard/sales-dashboard?startDate=2024-01-01&endDate=2024-03-31
```

### **Dealer-Specific Analysis**

```bash
GET /api/v2/dashboard/sales-dashboard?dealerId=123&chartPeriod=weekly
```

### **Product Performance**

```bash
GET /api/v2/dashboard/sales-dashboard?productId=456&startDate=2024-01-01&endDate=2024-12-31
```

### **Multi-Filter Analysis**

```bash
GET /api/v2/dashboard/sales-dashboard?dealerId=123&productId=456&startDate=2024-01-01&endDate=2024-03-31&chartPeriod=monthly
```

---

## 📤 **Response Structure**

### **Success Response (200)**

```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalSales": {
        "quantity": 12500,
        "amount": 2500000.5,
        "orders": 350,
        "avgOrderValue": 7142.86,
        "avgOrderQuantity": 35.71,
        "totalDealers": 45,
        "totalProducts": 120,
        "quantityGrowth": 15.5,
        "amountGrowth": 22.3,
        "ordersGrowth": 8.7
      }
    },
    "charts": {
      "salesTrend": {
        "labels": ["2024-01-01", "2024-01-02", "2024-01-03"],
        "datasets": {
          "quantity": [150, 200, 175],
          "amount": [30000, 40000, 35000],
          "orders": [5, 8, 6]
        }
      },
      "productCategoryBreakdown": {
        "labels": ["Brand A", "Brand B", "Brand C"],
        "datasets": {
          "quantity": [5000, 4000, 3500],
          "amount": [1000000, 800000, 700000],
          "orders": [150, 120, 80]
        }
      },
      "dealerTypeBreakdown": {
        "labels": ["Retail", "Wholesale", "Distributor"],
        "datasets": {
          "quantity": [6000, 4000, 2500],
          "amount": [1200000, 800000, 500000],
          "dealerCount": [25, 15, 5],
          "orders": [200, 100, 50]
        }
      },
      "monthlyComparison": {
        "labels": ["2024-01", "2024-02", "2024-03"],
        "datasets": {
          "quantity": [4000, 4200, 4300],
          "amount": [800000, 840000, 860000],
          "orders": [120, 125, 130]
        }
      }
    },
    "topLists": {
      "topProducts": [
        {
          "productId": 123,
          "productName": "Alloy Wheel Premium 17\"",
          "alloyName": "AW-17-PREM",
          "size": "17x7.5",
          "brand": "Premium",
          "totalQuantitySold": 850,
          "totalAmountSold": 170000.0,
          "totalOrders": 45,
          "avgPrice": 200.0,
          "avgQuantityPerOrder": 18.89
        }
      ],
      "topDealers": [
        {
          "dealerId": 456,
          "dealerName": "ABC Auto Parts",
          "dealerType": "Retail",
          "phone": "+91-9876543210",
          "address": "123 Main Street",
          "city": "Mumbai",
          "state": "Maharashtra",
          "totalQuantityPurchased": 1200,
          "totalAmountPurchased": 240000.0,
          "totalOrders": 25,
          "avgOrderValue": 9600.0,
          "uniqueProductsPurchased": 15,
          "lastOrderDate": "2024-01-15T10:30:00.000Z"
        }
      ],
      "topCombinations": [
        {
          "productName": "Alloy Wheel Premium 17\"",
          "dealerName": "ABC Auto Parts",
          "totalQuantity": 150,
          "totalAmount": 30000.0,
          "totalOrders": 8
        }
      ]
    },
    "metadata": {
      "dateRange": {
        "start": "2024-01-01",
        "end": "2024-01-31",
        "chartPeriod": "daily"
      },
      "filters": {
        "dealerId": null,
        "productId": null
      },
      "generatedAt": "2024-01-31T12:00:00.000Z",
      "recordCount": {
        "totalRecords": 350,
        "topProducts": 10,
        "topDealers": 10,
        "topCombinations": 5
      }
    }
  },
  "message": "Sales dashboard data retrieved successfully"
}
```

### **Error Response (500)**

```json
{
  "success": false,
  "message": "Failed to fetch sales dashboard data",
  "error": "Database connection error"
}
```

---

## 📊 **KPI Metrics Explained**

### **Total Sales KPIs**

- **quantity:** Total units sold
- **amount:** Total revenue generated
- **orders:** Total number of orders
- **avgOrderValue:** Average monetary value per order
- **avgOrderQuantity:** Average units per order
- **totalDealers:** Number of unique dealers
- **totalProducts:** Number of unique products sold
- **quantityGrowth:** Percentage growth in quantity vs previous period
- **amountGrowth:** Percentage growth in revenue vs previous period
- **ordersGrowth:** Percentage growth in orders vs previous period

### **Product Metrics**

- **totalQuantitySold:** Units sold for the product
- **totalAmountSold:** Revenue generated by the product
- **totalOrders:** Number of orders containing the product
- **avgPrice:** Average selling price
- **avgQuantityPerOrder:** Average units per order

### **Dealer Metrics**

- **totalQuantityPurchased:** Total units purchased by dealer
- **totalAmountPurchased:** Total amount spent by dealer
- **totalOrders:** Number of orders placed by dealer
- **avgOrderValue:** Average order value for the dealer
- **uniqueProductsPurchased:** Number of different products purchased
- **lastOrderDate:** Most recent order date

---

## 📈 **Chart Data Usage**

### **Sales Trend Chart (Line Chart)**

```javascript
// Chart.js example
const salesTrendConfig = {
  type: 'line',
  data: {
    labels: response.data.charts.salesTrend.labels,
    datasets: [
      {
        label: 'Quantity',
        data: response.data.charts.salesTrend.datasets.quantity,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Amount',
        data: response.data.charts.salesTrend.datasets.amount,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  }
}
```

### **Product Category Breakdown (Pie Chart)**

```javascript
// Chart.js example
const categoryBreakdownConfig = {
  type: 'pie',
  data: {
    labels: response.data.charts.productCategoryBreakdown.labels,
    datasets: [
      {
        data: response.data.charts.productCategoryBreakdown.datasets.amount,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
      }
    ]
  }
}
```

### **Dealer Type Analysis (Doughnut Chart)**

```javascript
// Chart.js example
const dealerTypeConfig = {
  type: 'doughnut',
  data: {
    labels: response.data.charts.dealerTypeBreakdown.labels,
    datasets: [
      {
        data: response.data.charts.dealerTypeBreakdown.datasets.amount,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }
    ]
  }
}
```

---

## 💻 **React Frontend Implementation**

### **JavaScript/TypeScript API Client**

```javascript
class SalesDashboardAPI {
  constructor(baseURL) {
    this.baseURL = baseURL
  }

  async getSalesDashboard(filters = {}) {
    const params = new URLSearchParams()

    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.dealerId) params.append('dealerId', filters.dealerId)
    if (filters.productId) params.append('productId', filters.productId)
    if (filters.chartPeriod) params.append('chartPeriod', filters.chartPeriod)

    const response = await fetch(
      `${this.baseURL}/api/v2/dashboard/sales-dashboard?${params}`
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }
}

// Usage
const api = new SalesDashboardAPI('http://localhost:3000')

// Get basic dashboard data
const dashboardData = await api.getSalesDashboard()

// Get filtered data
const filteredData = await api.getSalesDashboard({
  startDate: '2024-01-01',
  endDate: '2024-03-31',
  dealerId: 123,
  chartPeriod: 'weekly'
})
```

### **React Hook Example**

```jsx
import { useState, useEffect } from 'react'

const useSalesDashboard = (filters = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams(filters)
        const response = await fetch(
          `/api/v2/dashboard/sales-dashboard?${params}`
        )

        if (!response.ok) throw new Error('Failed to fetch dashboard data')

        const result = await response.json()
        setData(result.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [JSON.stringify(filters)])

  return { data, loading, error }
}

// Usage in component
const AdminSalesDashboard = () => {
  const [filters, setFilters] = useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    chartPeriod: 'monthly'
  })

  const { data, loading, error } = useSalesDashboard(filters)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className='admin-sales-dashboard'>
      <div className='kpis'>
        <div className='kpi-card'>
          <h3>Total Sales Quantity</h3>
          <p>{data.kpis.totalSales.quantity.toLocaleString()}</p>
          <span
            className={
              data.kpis.totalSales.quantityGrowth >= 0 ? 'positive' : 'negative'
            }
          >
            {data.kpis.totalSales.quantityGrowth}%
          </span>
        </div>
        <div className='kpi-card'>
          <h3>Total Sales Amount</h3>
          <p>₹{data.kpis.totalSales.amount.toLocaleString()}</p>
          <span
            className={
              data.kpis.totalSales.amountGrowth >= 0 ? 'positive' : 'negative'
            }
          >
            {data.kpis.totalSales.amountGrowth}%
          </span>
        </div>
      </div>

      <div className='charts'>{/* Chart components here */}</div>

      <div className='top-lists'>
        <div className='top-products'>
          <h3>Top Products</h3>
          {data.topLists.topProducts.map(product => (
            <div key={product.productId} className='product-item'>
              <span>{product.productName}</span>
              <span>₹{product.totalAmountSold.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className='top-dealers'>
          <h3>Top Dealers</h3>
          {data.topLists.topDealers.map(dealer => (
            <div key={dealer.dealerId} className='dealer-item'>
              <span>{dealer.dealerName}</span>
              <span>₹{dealer.totalAmountPurchased.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## 🔧 **Error Handling**

### **Common Error Scenarios**

1. **Invalid Date Format:** Ensure dates are in YYYY-MM-DD format
2. **Invalid IDs:** Check that dealerId and productId exist in database
3. **Invalid Chart Period:** Use only 'daily', 'weekly', or 'monthly'
4. **Database Connection:** Handle network and database errors gracefully

### **Error Response Format**

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## 🚀 **Performance Considerations**

### **Optimization Tips**

1. **Use appropriate date ranges** - Avoid very large date ranges for better performance
2. **Implement caching** - Cache results for frequently accessed data
3. **Pagination** - Consider pagination for very large datasets
4. **Indexing** - Ensure proper database indexes on date and ID columns

### **Rate Limiting**

- Recommended: Maximum 60 requests per minute per user
- Implement client-side caching to reduce API calls

---

## 📋 **Testing Examples**

### **cURL Examples**

```bash
# Basic request
curl -X GET "http://localhost:3000/api/v2/dashboard/sales-dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/v2/dashboard/sales-dashboard?startDate=2024-01-01&endDate=2024-03-31&dealerId=123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Postman Collection**

```json
{
  "info": {
    "name": "Admin Dashboard API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Admin Sales Dashboard",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v2/dashboard/sales-dashboard?startDate=2024-01-01&endDate=2024-03-31",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v2", "dashboard", "sales-dashboard"],
          "query": [
            { "key": "startDate", "value": "2024-01-01" },
            { "key": "endDate", "value": "2024-03-31" }
          ]
        }
      }
    }
  ]
}
```

---

## 📚 **Additional Resources**

### **Related Documentation**

- [Database Schema Documentation](./PLATI_SYSTEM_DATABASE_SCHEMA.md)
- [Inventory API Documentation](./INVENTORY_API_ENDPOINTS.md)
- [Authentication Guide](./AUTH_GUIDE.md)

### **Support**

For technical support or questions about this API, please contact the development team or create an issue in the project repository.

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-31  
**API Version:** v2
