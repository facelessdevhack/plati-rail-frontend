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
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const getTrendProfit = row => {
  if (row?.netProfit !== null && row?.netProfit !== undefined) return Number(row.netProfit)
  return Number(row?.grossProfit || 0) -
    Number(row?.operatingExpenses || 0) -
    Number(row?.scrapLoss || 0) -
    Number(row?.productionVarianceLoss || 0)
}

/**
 * Revenue & Profit Trend Chart
 * Grouped bar chart showing revenue, gross profit and indicative profit by month
 */
const RevenueProfitTrend = ({ trends, loading, period }) => {
  // Transform data for Chart.js
  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return null

    const labels = trends.map(t =>
      `${MONTH_NAMES[(t.month || 1) - 1]} '${String(t.year || '').slice(-2)}`
    )

    const revenueData = trends.map(t => (t.revenue || 0) / 100000) // Convert to Lakhs
    const profitData = trends.map(t => (t.grossProfit || 0) / 100000) // Convert to Lakhs
    const indicativeProfitData = trends.map(t => getTrendProfit(t) / 100000)

    return {
      labels,
      datasets: [
        {
          label: 'Sales',
          data: revenueData,
          backgroundColor: '#f26c2d',
          borderColor: '#f26c2d',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Gross Profit',
          data: profitData,
          backgroundColor: '#4ecb71',
          borderColor: '#4ecb71',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Net Profit',
          data: indicativeProfitData,
          backgroundColor: '#1a1a1a',
          borderColor: '#1a1a1a',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    }
  }, [trends])

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw
            const rawValue = value * 100000
            return `${context.dataset.label}: ₹${rawValue.toLocaleString('en-IN')}`
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
          font: { size: 10 }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₹ Lakhs)',
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
        title="Sales and profit over time"
        className="pnl-section-card"
        bordered={false}
      >
        <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  if (!trends || trends.length === 0) {
    return (
      <Card
        title="Sales and profit over time"
        className="pnl-section-card"
        bordered={false}
      >
        <Empty description="No trend data available" style={{ height: 350 }} />
      </Card>
    )
  }

  return (
    <Card
      title="Sales and profit over time"
      className="pnl-section-card"
      bordered={false}
      extra={period?.displayLabel ? <Text type="secondary">{period.displayLabel}</Text> : null}
    >
      <div style={{ height: 320 }}>
        {chartData && <Bar data={chartData} options={options} />}
      </div>
    </Card>
  )
}

export default RevenueProfitTrend
