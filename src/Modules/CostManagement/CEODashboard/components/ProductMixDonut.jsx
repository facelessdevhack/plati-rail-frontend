import React, { useMemo } from 'react'
import { Card, Empty, Spin, Typography } from 'antd'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

const { Text } = Typography

// Format currency for Indian Rupees
const formatCurrency = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toFixed(0)}`
}

// Color palette for the donut chart
const COLORS = [
  '#1890ff',
  '#52c41a',
  '#faad14',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#fa541c',
  '#2f54eb',
  '#a0d911',
  '#595959'
]

/**
 * Product Mix Donut Chart
 * Shows revenue breakdown by top products
 */
const ProductMixDonut = ({ productMix, loading }) => {
  // Transform data for Chart.js
  const chartData = useMemo(() => {
    if (!productMix || productMix.length === 0) return null

    const labels = productMix.map(p =>
      p.model || p.productName?.substring(0, 20) || 'Unknown'
    )

    const data = productMix.map(p => p.revenue)

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: COLORS.slice(0, productMix.length),
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 8
      }]
    }
  }, [productMix])

  // Calculate total revenue for center statistic
  const totalRevenue = useMemo(() => {
    if (!productMix || productMix.length === 0) return 0
    return productMix.reduce((sum, item) => sum + (item.revenue || 0), 0)
  }, [productMix])

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { size: 10 },
          generateLabels: (chart) => {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0]
                const value = dataset.data[i]
                const percentage = productMix[i]?.percentage || 0
                return {
                  text: `${label}: ${percentage.toFixed(1)}%`,
                  fillStyle: dataset.backgroundColor[i],
                  hidden: false,
                  index: i
                }
              })
            }
            return []
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw
            const percentage = productMix[context.dataIndex]?.percentage || 0
            return `${formatCurrency(value)} (${percentage.toFixed(1)}%)`
          }
        }
      }
    }
  }

  // Center text plugin
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw: (chart) => {
      const { ctx, width, height } = chart
      ctx.save()

      // Total Revenue label
      ctx.font = '12px Arial'
      ctx.fillStyle = '#8c8c8c'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Total Revenue', width / 2, height / 2 - 12)

      // Amount
      ctx.font = 'bold 18px Arial'
      ctx.fillStyle = '#262626'
      ctx.fillText(formatCurrency(totalRevenue), width / 2, height / 2 + 12)

      ctx.restore()
    }
  }

  if (loading) {
    return (
      <Card
        title="Product Mix by Revenue"
        style={{ borderRadius: 12, height: '100%' }}
      >
        <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  if (!productMix || productMix.length === 0) {
    return (
      <Card
        title="Product Mix by Revenue"
        style={{ borderRadius: 12, height: '100%' }}
      >
        <Empty description="No product data available" style={{ height: 320 }} />
      </Card>
    )
  }

  return (
    <Card
      title="Product Mix by Revenue"
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>Top 10 Products</Text>}
    >
      <div style={{ height: 320 }}>
        {chartData && (
          <Doughnut
            data={chartData}
            options={options}
            plugins={[centerTextPlugin]}
          />
        )}
      </div>
    </Card>
  )
}

export default ProductMixDonut
