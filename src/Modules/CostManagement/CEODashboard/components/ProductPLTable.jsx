import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Card, Table, Input, Button, Space, Tag, Tooltip, Typography } from 'antd'
import { SearchOutlined, DownloadOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler)

const { Text } = Typography

// Format currency for Indian Rupees
const formatCurrency = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toFixed(0)}`
}

// Format percentage
const formatPercent = (value) => `${value.toFixed(1)}%`

// Get margin color based on value
const getMarginColor = (margin) => {
  if (margin >= 25) return 'green'
  if (margin >= 15) return 'blue'
  if (margin >= 10) return 'orange'
  return 'red'
}

// Trend indicator component
const TrendIndicator = ({ current, previous }) => {
  if (previous === 0 || previous === null || previous === undefined) {
    return <MinusOutlined style={{ color: '#999' }} />
  }

  const change = ((current - previous) / previous) * 100

  if (Math.abs(change) < 1) {
    return <MinusOutlined style={{ color: '#999' }} />
  }

  if (change > 0) {
    return (
      <Tooltip title={`+${change.toFixed(1)}% vs previous`}>
        <ArrowUpOutlined style={{ color: '#52c41a' }} />
      </Tooltip>
    )
  }

  return (
    <Tooltip title={`${change.toFixed(1)}% vs previous`}>
      <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
    </Tooltip>
  )
}

// Mini sparkline for trend visualization using Chart.js canvas
const TrendSparkline = ({ data }) => {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return

    // Destroy previous chart if exists
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const ctx = canvasRef.current.getContext('2d')

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 30)
    gradient.addColorStop(0, 'rgba(24, 144, 255, 0.3)')
    gradient.addColorStop(1, 'rgba(24, 144, 255, 0)')

    chartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data: data,
          borderColor: '#1890ff',
          borderWidth: 1.5,
          fill: true,
          backgroundColor: gradient,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        elements: {
          line: { tension: 0.4 }
        }
      }
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data])

  if (!data || data.length === 0) {
    return <Text type="secondary">-</Text>
  }

  return <canvas ref={canvasRef} width={80} height={30} />
}

/**
 * Product P&L Table Component
 * Sortable, searchable table with export functionality
 */
const ProductPLTable = ({ products = [], loading, onViewDetails }) => {
  const [searchText, setSearchText] = useState('')
  const [pageSize, setPageSize] = useState(10)

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchText) return products

    const lowerSearch = searchText.toLowerCase()
    return products.filter(p =>
      p.productName?.toLowerCase().includes(lowerSearch) ||
      p.model?.toLowerCase().includes(lowerSearch) ||
      p.inches?.toString().includes(lowerSearch)
    )
  }, [products, searchText])

  // Export to CSV
  const handleExport = () => {
    const headers = ['Product Name', 'Model', 'Inches', 'Units Sold', 'Revenue', 'COGS', 'Gross Profit', 'Margin %']
    const rows = filteredProducts.map(p => [
      p.productName || '-',
      p.model || '-',
      p.inches || '-',
      p.volume || 0,
      p.revenue || 0,
      p.cogs || 0,
      p.grossProfit || 0,
      p.grossMargin?.toFixed(2) || '0'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `product_pl_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      title: 'Product',
      key: 'product',
      fixed: 'left',
      width: 200,
      sorter: (a, b) => (a.productName || '').localeCompare(b.productName || ''),
      render: (_, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>{record.productName || 'Unknown'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.model} • {record.inches}"
          </Text>
        </div>
      )
    },
    {
      title: 'Units Sold',
      dataIndex: 'volume',
      key: 'volume',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.volume || 0) - (b.volume || 0),
      render: (value) => (
        <Text>{value?.toLocaleString() || 0}</Text>
      )
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.revenue || 0) - (b.revenue || 0),
      render: (value) => (
        <Text strong style={{ color: '#1890ff' }}>{formatCurrency(value || 0)}</Text>
      )
    },
    {
      title: 'COGS',
      dataIndex: 'cogs',
      key: 'cogs',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.cogs || 0) - (b.cogs || 0),
      render: (value) => (
        <Text type="secondary">{formatCurrency(value || 0)}</Text>
      )
    },
    {
      title: 'Gross Profit',
      dataIndex: 'grossProfit',
      key: 'grossProfit',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.grossProfit || 0) - (b.grossProfit || 0),
      render: (value) => (
        <Text strong style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(value || 0)}
        </Text>
      )
    },
    {
      title: 'Margin %',
      dataIndex: 'grossMargin',
      key: 'grossMargin',
      width: 100,
      align: 'center',
      sorter: (a, b) => (a.grossMargin || 0) - (b.grossMargin || 0),
      render: (value) => (
        <Tag color={getMarginColor(value || 0)}>
          {formatPercent(value || 0)}
        </Tag>
      )
    },
    {
      title: 'Trend',
      key: 'trend',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space>
          {record.trendData ? (
            <TrendSparkline data={record.trendData} />
          ) : (
            <TrendIndicator
              current={record.grossProfit}
              previous={record.previousGrossProfit}
            />
          )}
        </Space>
      )
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onViewDetails?.(record)}
            size="small"
          />
        </Tooltip>
      )
    }
  ]

  return (
    <Card
      title="Product P&L Details"
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      extra={
        <Space>
          <Input
            placeholder="Search products..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={filteredProducts.length === 0}
          >
            Export CSV
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey={(record) => `${record.model}-${record.inches}-${record.productName}`}
        loading={loading}
        pagination={{
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (_, size) => setPageSize(size)
        }}
        scroll={{ x: 1000 }}
        size="middle"
        summary={(pageData) => {
          if (pageData.length === 0) return null

          const totalRevenue = pageData.reduce((sum, r) => sum + (r.revenue || 0), 0)
          const totalCogs = pageData.reduce((sum, r) => sum + (r.cogs || 0), 0)
          const totalProfit = pageData.reduce((sum, r) => sum + (r.grossProfit || 0), 0)
          const totalVolume = pageData.reduce((sum, r) => sum + (r.volume || 0), 0)
          const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

          return (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                <Table.Summary.Cell index={0}>
                  <Text strong>Page Total ({pageData.length} items)</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>{totalVolume.toLocaleString()}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong style={{ color: '#1890ff' }}>{formatCurrency(totalRevenue)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text type="secondary">{formatCurrency(totalCogs)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Text strong style={{ color: totalProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {formatCurrency(totalProfit)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="center">
                  <Tag color={getMarginColor(avgMargin)}>{formatPercent(avgMargin)}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} />
              </Table.Summary.Row>
            </Table.Summary>
          )
        }}
      />
    </Card>
  )
}

export default ProductPLTable
