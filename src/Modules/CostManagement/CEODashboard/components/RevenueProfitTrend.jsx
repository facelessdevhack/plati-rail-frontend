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
          label: 'Revenue',
          data: revenueData,
          backgroundColor: '#1890ff',
          borderColor: '#1890ff',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Gross Profit',
          data: profitData,
          backgroundColor: '#52c41a',
          borderColor: '#52c41a',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Indicative Profit',
          data: indicativeProfitData,
          backgroundColor: '#722ed1',
          borderColor: '#722ed1',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    }
  }, [trends])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!trends || trends.length === 0) return null

    const totalRevenue = trends.reduce((sum, t) => sum + (t.revenue || 0), 0)
    const totalProfit = trends.reduce((sum, t) => sum + (t.grossProfit || 0), 0)
    const totalIndicativeProfit = trends.reduce((sum, t) => sum + getTrendProfit(t), 0)
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return {
      totalRevenue: totalRevenue / 10000000, // Crores
      totalProfit: totalProfit / 10000000,
      totalIndicativeProfit: totalIndicativeProfit / 10000000,
      avgMargin: avgMargin.toFixed(1)
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
        title="Revenue & Profit Trend"
        style={{ borderRadius: 12, height: '100%' }}
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
        title="Revenue & Profit Trend"
        style={{ borderRadius: 12, height: '100%' }}
      >
        <Empty description="No trend data available" style={{ height: 350 }} />
      </Card>
    )
  }

  return (
    <Card
      title={`Revenue and profit trend${period?.displayLabel ? ` • ${period.displayLabel}` : ''}`}
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}
      extra={
        summaryStats && (
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <span>
              <Text type="secondary">Total Rev: </Text>
              <Text strong style={{ color: '#1890ff' }}>₹{summaryStats.totalRevenue.toFixed(1)}Cr</Text>
            </span>
            <span>
              <Text type="secondary">Total Profit: </Text>
              <Text strong style={{ color: '#52c41a' }}>₹{summaryStats.totalProfit.toFixed(1)}Cr</Text>
            </span>
            <span>
              <Text type="secondary">Avg Margin: </Text>
              <Text strong>{summaryStats.avgMargin}%</Text>
            </span>
            <span>
              <Text type="secondary">Indicative profit: </Text>
              <Text strong style={{ color: '#722ed1' }}>
                ₹{summaryStats.totalIndicativeProfit.toFixed(1)}Cr
              </Text>
            </span>
          </div>
        )
      }
    >
      <div style={{ height: 320 }}>
        {chartData && <Bar data={chartData} options={options} />}
      </div>
    </Card>
  )
}

export default RevenueProfitTrend
