import React, { useMemo } from 'react'
import { Card, Empty, Spin, Typography } from 'antd'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const { Text } = Typography

// Format currency for Indian Rupees
const formatCurrency = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toFixed(0)}`
}

// Get color based on margin percentage
const getMarginColor = (margin) => {
  if (margin >= 25) return '#52c41a' // Green - excellent
  if (margin >= 15) return '#1890ff' // Blue - good
  if (margin >= 10) return '#faad14' // Yellow - moderate
  return '#ff4d4f' // Red - needs attention
}

/**
 * Top Models Chart
 * Column chart showing top models by gross profit
 */
const TopModelsChart = ({ byModel, loading }) => {
  // Transform data
  const { chartData, processedData } = useMemo(() => {
    if (!byModel || byModel.length === 0) return { chartData: null, processedData: [] }

    const processed = byModel
      .filter(item => item.model !== 'Unknown' && item.model !== null)
      .slice(0, 10)
      .map(item => ({
        model: item.model || 'Unknown',
        profit: item.grossProfit / 100000, // Convert to Lakhs
        revenue: item.revenue,
        margin: item.grossMargin,
        quantity: item.totalQuantity
      }))

    const data = {
      labels: processed.map(item => item.model),
      datasets: [{
        label: 'Gross Profit',
        data: processed.map(item => item.profit),
        backgroundColor: processed.map(item => getMarginColor(item.margin)),
        borderColor: processed.map(item => getMarginColor(item.margin)),
        borderWidth: 1,
        borderRadius: 4
      }]
    }

    return { chartData: data, processedData: processed }
  }, [byModel])

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const idx = context.dataIndex
            const item = processedData[idx]
            return [
              `Profit: ${formatCurrency(item.profit * 100000)}`,
              `Revenue: ${formatCurrency(item.revenue)}`,
              `Margin: ${item.margin.toFixed(1)}%`,
              `Units: ${item.quantity.toLocaleString()}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Gross Profit (₹ Lakhs)',
          font: { size: 11 }
        },
        ticks: {
          callback: (value) => `₹${value}L`,
          font: { size: 10 }
        },
        grid: {
          color: '#f0f0f0'
        }
      }
    }
  }

  if (loading) {
    return (
      <Card
        title="Top Models by Profit"
        style={{ borderRadius: 12, height: '100%' }}
      >
        <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  if (!byModel || byModel.length === 0) {
    return (
      <Card
        title="Top Models by Profit"
        style={{ borderRadius: 12, height: '100%' }}
      >
        <Empty description="No model data available" style={{ height: 320 }} />
      </Card>
    )
  }

  return (
    <Card
      title="Top 10 Models by Gross Profit"
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>Values in Lakhs</Text>}
    >
      <div style={{ height: 320 }}>
        {chartData && <Bar data={chartData} options={options} />}
      </div>
    </Card>
  )
}

export default TopModelsChart
