import React from 'react'
import { Column } from '@ant-design/plots'

const SalesChart = ({ salesHistory = [], height = 200 }) => {
  // Use mock data for testing if no data available
  const mockData = [
    { month: 'Jul', quantity: 45, orders: 12 },
    { month: 'Aug', quantity: 67, orders: 15 },
    { month: 'Sep', quantity: 38, orders: 8 },
    { month: 'Oct', quantity: 89, orders: 22 },
    { month: 'Nov', quantity: 56, orders: 14 },
    { month: 'Dec', quantity: 72, orders: 18 }
  ]

  const effectiveData =
    !salesHistory || salesHistory.length === 0 ? mockData : salesHistory

  // Prepare data for the chart
  const chartData = effectiveData
    .map((item, index) => {
      const quantity = item?.quantity || item?.sales || 0
      const month = item?.month || `Month ${index + 1}`

      return {
        month: month,
        sales: parseInt(quantity) || 0,
        orders: parseInt(item?.orders || 0)
      }
    })
    .reverse() // Reverse to show chronological order

  const config = {
    data: chartData,
    xField: 'month',
    yField: 'sales',
    height: height,
    columnWidthRatio: 0.8,
    color: '#1890ff',
    label: {
      position: 'top',
      style: {
        fill: '#262626',
        fontSize: 16,
        fontWeight: 'bold',
        opacity: 1,
        background: {
          fill: '#ffffff',
          stroke: '#e0e0e0',
          lineWidth: 1,
          radius: 8,
          padding: [4, 8]
        }
      }
    },
    tooltip: {
      formatter: data => {
        const sales =
          data?.sales === null || data?.sales === undefined ? 0 : data.sales
        const month = data?.month || 'Unknown'
        return {
          name: 'Units Sold',
          value: `${sales} units in ${month}`
        }
      }
    },
    xAxis: {
      type: 'cat',
      tickCount: Math.min(chartData.length, 6),
      label: {
        autoHide: true,
        autoRotate: false
      }
    },
    yAxis: {
      title: {
        text: 'Units Sold'
      }
    },
    interactions: [
      {
        type: 'active-region',
        enable: false
      }
    ]
  }

  return <Column {...config} />
}

export default SalesChart
