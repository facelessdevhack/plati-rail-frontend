import React, { useMemo } from 'react'
import { Card, Empty, Spin, Typography, Tag, Space } from 'antd'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bubble } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(LinearScale, PointElement, Tooltip, Legend)

const { Text } = Typography

// Quadrant colors and labels
const QUADRANT_CONFIG = {
  stars: { color: '#52c41a', label: 'Stars', description: 'High Volume, High Margin' },
  niche: { color: '#722ed1', label: 'Niche', description: 'Low Volume, High Margin' },
  volume_drivers: { color: '#faad14', label: 'Volume Drivers', description: 'High Volume, Low Margin' },
  dogs: { color: '#ff4d4f', label: 'Dogs', description: 'Low Volume, Low Margin' }
}

// Format currency for Indian Rupees
const formatCurrency = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toFixed(0)}`
}

/**
 * Profitability Matrix (BCG-style)
 * Scatter/Bubble plot showing Volume vs Margin with quadrant analysis
 */
const ProfitabilityMatrix = ({ profitabilityMatrix, loading }) => {
  // Calculate averages and quadrant summary
  const { chartData, avgVolume, avgMargin, quadrantSummary, processedData } = useMemo(() => {
    if (!profitabilityMatrix || profitabilityMatrix.length === 0) {
      return { chartData: null, avgVolume: 0, avgMargin: 20, quadrantSummary: {}, processedData: [] }
    }

    // Process data
    const processed = profitabilityMatrix.map(p => ({
      productName: p.productName,
      model: p.model,
      inches: p.inches,
      volume: p.volume,
      margin: p.grossMargin,
      revenue: p.revenue,
      profit: p.grossProfit,
      quadrant: p.quadrant,
      // Bubble radius based on revenue (scaled)
      radius: Math.max(5, Math.min(25, Math.sqrt(p.revenue / 10000)))
    }))

    // Calculate averages
    const totalVolume = processed.reduce((sum, d) => sum + d.volume, 0)
    const calculatedAvgVolume = processed.length > 0 ? totalVolume / processed.length : 0
    const calculatedAvgMargin = 20 // Use 20% as benchmark margin

    // Group by quadrant
    const summary = { stars: 0, niche: 0, volume_drivers: 0, dogs: 0 }
    processed.forEach(d => {
      if (summary[d.quadrant] !== undefined) {
        summary[d.quadrant]++
      }
    })

    // Create datasets grouped by quadrant
    const quadrants = ['stars', 'niche', 'volume_drivers', 'dogs']
    const datasets = quadrants.map(q => ({
      label: QUADRANT_CONFIG[q].label,
      data: processed
        .filter(p => p.quadrant === q)
        .map(p => ({
          x: p.volume,
          y: p.margin,
          r: p.radius,
          ...p
        })),
      backgroundColor: QUADRANT_CONFIG[q].color + 'B3', // Add transparency
      borderColor: QUADRANT_CONFIG[q].color,
      borderWidth: 1
    }))

    return {
      chartData: { datasets },
      avgVolume: calculatedAvgVolume,
      avgMargin: calculatedAvgMargin,
      quadrantSummary: summary,
      processedData: processed
    }
  }, [profitabilityMatrix])

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw
            return [
              `${point.model || 'Unknown'} ${point.inches || ''}"`,
              `Volume: ${point.volume} units`,
              `Margin: ${point.margin.toFixed(1)}%`,
              `Revenue: ${formatCurrency(point.revenue)}`,
              `Profit: ${formatCurrency(point.profit)}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Sales Volume (Units)',
          font: { size: 11 }
        },
        grid: {
          color: '#f0f0f0'
        },
        ticks: {
          font: { size: 10 }
        }
      },
      y: {
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
      }
    }
  }

  // Plugin to draw quadrant lines and labels
  const quadrantPlugin = {
    id: 'quadrantLines',
    afterDraw: (chart) => {
      const { ctx, scales } = chart
      const xScale = scales.x
      const yScale = scales.y

      ctx.save()

      // Draw vertical line at average volume
      const xAvg = xScale.getPixelForValue(avgVolume)
      ctx.beginPath()
      ctx.strokeStyle = '#999'
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 1
      ctx.moveTo(xAvg, yScale.top)
      ctx.lineTo(xAvg, yScale.bottom)
      ctx.stroke()

      // Draw horizontal line at 20% margin
      const yAvg = yScale.getPixelForValue(avgMargin)
      ctx.beginPath()
      ctx.moveTo(xScale.left, yAvg)
      ctx.lineTo(xScale.right, yAvg)
      ctx.stroke()

      ctx.setLineDash([])

      // Draw quadrant labels
      const padding = 10
      ctx.font = 'bold 11px Arial'

      // Stars (top-right)
      ctx.fillStyle = '#52c41a'
      ctx.textAlign = 'right'
      ctx.fillText('Stars ★', xScale.right - padding, yScale.top + 20)

      // Niche (top-left)
      ctx.fillStyle = '#722ed1'
      ctx.textAlign = 'left'
      ctx.fillText('Niche', xScale.left + padding, yScale.top + 20)

      // Volume Drivers (bottom-right)
      ctx.fillStyle = '#faad14'
      ctx.textAlign = 'right'
      ctx.fillText('Volume Drivers', xScale.right - padding, yScale.bottom - 10)

      // Dogs (bottom-left)
      ctx.fillStyle = '#ff4d4f'
      ctx.textAlign = 'left'
      ctx.fillText('Dogs', xScale.left + padding, yScale.bottom - 10)

      ctx.restore()
    }
  }

  if (loading) {
    return (
      <Card
        title="Profitability Matrix"
        style={{ borderRadius: 12, height: '100%' }}
      >
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  if (!profitabilityMatrix || profitabilityMatrix.length === 0) {
    return (
      <Card
        title="Profitability Matrix"
        style={{ borderRadius: 12, height: '100%' }}
      >
        <Empty description="No matrix data available" style={{ height: 400 }} />
      </Card>
    )
  }

  return (
    <Card
      title="Product Profitability Matrix"
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}
      extra={
        <Space size={8}>
          {Object.entries(QUADRANT_CONFIG).map(([key, config]) => (
            <Tag key={key} color={config.color} style={{ margin: 0 }}>
              {config.label}: {quadrantSummary[key] || 0}
            </Tag>
          ))}
        </Space>
      }
    >
      <div style={{ height: 400 }}>
        {chartData && (
          <Bubble
            data={chartData}
            options={options}
            plugins={[quadrantPlugin]}
          />
        )}
      </div>
      <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: '#fafafa', borderRadius: 8 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          <strong>How to read:</strong> Bubble size = Revenue. Position = Volume vs Margin.
          Stars (keep investing) | Niche (protect margin) | Volume Drivers (improve margin) | Dogs (review for discontinuation)
        </Text>
      </div>
    </Card>
  )
}

export default ProfitabilityMatrix
