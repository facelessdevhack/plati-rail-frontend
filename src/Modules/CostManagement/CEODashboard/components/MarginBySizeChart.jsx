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
 * Margin by Size Chart
 * Horizontal bar chart showing profit margin by wheel size
 */
const MarginBySizeChart = ({ bySize, loading }) => {
  // Transform and sort data
  const { chartData, processedData } = useMemo(() => {
    if (!bySize || bySize.length === 0) return { chartData: null, processedData: [] }

    const processed = bySize
      .filter(item => item.size !== 'Unknown' && item.size !== null)
      .map(item => ({
        size: `${item.size}"`,
        margin: item.grossMargin,
        revenue: item.revenue,
        profit: item.grossProfit,
        quantity: item.totalQuantity
      }))
      .sort((a, b) => b.margin - a.margin)

    const data = {
      labels: processed.map(item => item.size),
      datasets: [{
        label: 'Gross Margin',
        data: processed.map(item => item.margin),
        backgroundColor: processed.map(item => getMarginColor(item.margin)),
        borderColor: processed.map(item => getMarginColor(item.margin)),
        borderWidth: 1,
        borderRadius: 4
      }]
    }

    return { chartData: data, processedData: processed }
  }, [bySize])

  // Chart options for horizontal bar
  const options = {
    indexAxis: 'y',
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
              `Margin: ${item.margin.toFixed(1)}%`,
              `Revenue: ${formatCurrency(item.revenue)}`,
              `Profit: ${formatCurrency(item.profit)}`,
              `Units: ${item.quantity.toLocaleString()}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Gross Margin (%)',
          font: { size: 11 }
        },
        ticks: {
          callback: (value) => `${value}%`,
          font: { size: 10 }
        },
        grid: {
          color: '#f0f0f0'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Wheel Size',
          font: { size: 11 }
        },
        ticks: {
          font: { size: 11 }
        },
        grid: {
          display: false
        }
      }
    }
  }

  // Plugin to draw target line at 20%
  const targetLinePlugin = {
    id: 'targetLine',
    afterDraw: (chart) => {
      const { ctx, scales } = chart
      const xScale = scales.x
      const yScale = scales.y

      // Draw vertical line at 20%
      const x = xScale.getPixelForValue(20)
      const yStart = yScale.top
      const yEnd = yScale.bottom

      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = '#ff4d4f'
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 1
      ctx.moveTo(x, yStart)
      ctx.lineTo(x, yEnd)
      ctx.stroke()

      // Draw label
      ctx.font = '10px Arial'
      ctx.fillStyle = '#ff4d4f'
      ctx.textAlign = 'left'
      ctx.fillText('Target: 20%', x + 5, yStart + 12)
      ctx.restore()
    }
  }

  if (loading) {
    return (
      <Card
        title="Margin by Wheel Size"
        style={{ borderRadius: 12, height: '100%' }}
      >
        <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  if (!bySize || bySize.length === 0) {
    return (
      <Card
        title="Margin by Wheel Size"
        style={{ borderRadius: 12, height: '100%' }}
      >
        <Empty description="No size data available" style={{ height: 320 }} />
      </Card>
    )
  }

  return (
    <Card
      title="Profit Margin by Wheel Size"
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}
      extra={
        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
          <span><span style={{ color: '#52c41a' }}>■</span> {'≥25%'}</span>
          <span><span style={{ color: '#1890ff' }}>■</span> 15-25%</span>
          <span><span style={{ color: '#faad14' }}>■</span> 10-15%</span>
          <span><span style={{ color: '#ff4d4f' }}>■</span> {'<10%'}</span>
        </div>
      }
    >
      <div style={{ height: 320 }}>
        {chartData && (
          <Bar
            data={chartData}
            options={options}
            plugins={[targetLinePlugin]}
          />
        )}
      </div>
    </Card>
  )
}

export default MarginBySizeChart
