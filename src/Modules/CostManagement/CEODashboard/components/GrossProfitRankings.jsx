import React, { useMemo, useState } from 'react'
import { Card, Table, Tag, Typography, Empty, Spin, Input, Space } from 'antd'
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons'

const { Text } = Typography

// Format currency for Indian Rupees with breakdown
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '₹0'
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 10000000) {
    const crores = Math.floor(absValue / 10000000)
    const lakhs = Math.floor((absValue % 10000000) / 100000)
    if (lakhs > 0) return `${sign}₹${crores}Cr ${lakhs}L`
    return `${sign}₹${crores}Cr`
  }
  if (absValue >= 100000) {
    const lakhs = Math.floor(absValue / 100000)
    const thousands = Math.floor((absValue % 100000) / 1000)
    if (thousands > 0) return `${sign}₹${lakhs}L ${thousands}K`
    return `${sign}₹${lakhs}L`
  }
  if (absValue >= 1000) {
    const thousands = Math.floor(absValue / 1000)
    return `${sign}₹${thousands}K`
  }
  return `${sign}₹${Math.round(absValue)}`
}

// Get color based on profit value
const getProfitColor = (profit) => {
  if (profit >= 500000) return '#52c41a' // Green for high profit (>5L)
  if (profit >= 100000) return '#1890ff' // Blue for good profit (>1L)
  if (profit >= 0) return '#faad14' // Orange for low profit
  return '#ff4d4f' // Red for loss
}

// Get margin tag color
const getMarginTagColor = (margin) => {
  if (margin >= 25) return 'green'
  if (margin >= 15) return 'blue'
  if (margin >= 5) return 'orange'
  return 'red'
}

/**
 * Gross Profit Rankings Component
 * Shows tables for Products and Dealers ranked by Gross Profit
 * Stacked vertically for better space utilization
 */
const GrossProfitRankings = ({
  products = [],
  dealers = [],
  loading
}) => {
  const [productSearch, setProductSearch] = useState('')
  const [dealerSearch, setDealerSearch] = useState('')

  // Sort all products by gross profit (highest to lowest)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.grossProfit || 0) - (a.grossProfit || 0))
  }, [products])

  // Sort all dealers by gross profit (highest to lowest)
  const sortedDealers = useMemo(() => {
    return [...dealers].sort((a, b) => (b.grossProfit || 0) - (a.grossProfit || 0))
  }, [dealers])

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!productSearch) return sortedProducts
    const search = productSearch.toLowerCase()
    return sortedProducts.filter(p =>
      (p.productName || '').toLowerCase().includes(search) ||
      (p.model || '').toLowerCase().includes(search)
    )
  }, [sortedProducts, productSearch])

  // Filter dealers based on search
  const filteredDealers = useMemo(() => {
    if (!dealerSearch) return sortedDealers
    const search = dealerSearch.toLowerCase()
    return sortedDealers.filter(d =>
      (d.dealerName || '').toLowerCase().includes(search) ||
      (d.district || '').toLowerCase().includes(search)
    )
  }, [sortedDealers, dealerSearch])

  // Export products to CSV
  const handleExportProducts = () => {
    const headers = ['#', 'Product Name', 'Model', 'Inches', 'Units', 'Revenue', 'COGS', 'Gross Profit', 'Margin %']
    const rows = filteredProducts.map((p, i) => [
      i + 1,
      p.productName || '-',
      p.model || '-',
      p.inches || '-',
      p.volume || 0,
      p.revenue || 0,
      (p.revenue || 0) - (p.grossProfit || 0),
      p.grossProfit || 0,
      (p.grossMargin || 0).toFixed(2)
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `products_gross_profit_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export dealers to CSV
  const handleExportDealers = () => {
    const headers = ['#', 'Dealer Name', 'District', 'Products', 'Revenue', 'COGS', 'Gross Profit', 'Margin %']
    const rows = filteredDealers.map((d, i) => [
      i + 1,
      d.dealerName || '-',
      d.district || '-',
      d.productCount || 0,
      d.revenue || 0,
      (d.revenue || 0) - (d.grossProfit || 0),
      d.grossProfit || 0,
      (d.grossMargin || 0).toFixed(2)
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `dealers_gross_profit_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Table columns for products
  const productColumns = [
    {
      title: '#',
      dataIndex: 'rank',
      key: 'rank',
      width: 50,
      fixed: 'left',
      render: (_, __, index) => (
        <Text strong style={{
          color: index < 3 ? '#52c41a' : (index < 7 ? '#1890ff' : '#666')
        }}>
          {index + 1}
        </Text>
      )
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
      fixed: 'left',
      width: 220,
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{text || 'Unknown'}</Text>
          {record.model && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              {record.model} {record.inches ? `• ${record.inches}"` : ''}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Units',
      dataIndex: 'volume',
      key: 'volume',
      width: 80,
      align: 'right',
      sorter: (a, b) => (a.volume || 0) - (b.volume || 0),
      render: (value) => <Text style={{ fontSize: 12 }}>{(value || 0).toLocaleString()}</Text>
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.revenue || 0) - (b.revenue || 0),
      render: (value) => <Text style={{ fontSize: 12, color: '#1890ff' }}>{formatCurrency(value)}</Text>
    },
    {
      title: 'COGS',
      key: 'cogs',
      width: 120,
      align: 'right',
      sorter: (a, b) => ((a.revenue || 0) - (a.grossProfit || 0)) - ((b.revenue || 0) - (b.grossProfit || 0)),
      render: (_, record) => {
        const cogs = (record.revenue || 0) - (record.grossProfit || 0)
        return <Text type="secondary" style={{ fontSize: 12 }}>{formatCurrency(cogs)}</Text>
      }
    },
    {
      title: 'Gross Profit',
      dataIndex: 'grossProfit',
      key: 'grossProfit',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.grossProfit || 0) - (b.grossProfit || 0),
      defaultSortOrder: 'descend',
      render: (value) => (
        <Text strong style={{ color: getProfitColor(value), fontSize: 12 }}>
          {formatCurrency(value)}
        </Text>
      )
    },
    {
      title: 'Margin',
      dataIndex: 'grossMargin',
      key: 'grossMargin',
      width: 80,
      align: 'center',
      sorter: (a, b) => (a.grossMargin || 0) - (b.grossMargin || 0),
      render: (value) => (
        <Tag color={getMarginTagColor(value)} style={{ margin: 0, fontSize: 11 }}>
          {(value || 0).toFixed(1)}%
        </Tag>
      )
    }
  ]

  // Table columns for dealers
  const dealerColumns = [
    {
      title: '#',
      dataIndex: 'rank',
      key: 'rank',
      width: 50,
      fixed: 'left',
      render: (_, __, index) => (
        <Text strong style={{
          color: index < 3 ? '#52c41a' : (index < 7 ? '#1890ff' : '#666')
        }}>
          {index + 1}
        </Text>
      )
    },
    {
      title: 'Dealer',
      dataIndex: 'dealerName',
      key: 'dealerName',
      ellipsis: true,
      fixed: 'left',
      width: 200,
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{text || 'Unknown'}</Text>
          {record.district && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              {record.district}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 80,
      align: 'center',
      sorter: (a, b) => (a.productCount || 0) - (b.productCount || 0),
      render: (value) => <Text style={{ fontSize: 12 }}>{value}</Text>
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.revenue || 0) - (b.revenue || 0),
      render: (value) => <Text style={{ fontSize: 12, color: '#1890ff' }}>{formatCurrency(value)}</Text>
    },
    {
      title: 'COGS',
      key: 'cogs',
      width: 120,
      align: 'right',
      sorter: (a, b) => ((a.revenue || 0) - (a.grossProfit || 0)) - ((b.revenue || 0) - (b.grossProfit || 0)),
      render: (_, record) => {
        const cogs = (record.revenue || 0) - (record.grossProfit || 0)
        return <Text type="secondary" style={{ fontSize: 12 }}>{formatCurrency(cogs)}</Text>
      }
    },
    {
      title: 'Gross Profit',
      dataIndex: 'grossProfit',
      key: 'grossProfit',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.grossProfit || 0) - (b.grossProfit || 0),
      defaultSortOrder: 'descend',
      render: (value) => (
        <Text strong style={{ color: getProfitColor(value), fontSize: 12 }}>
          {formatCurrency(value)}
        </Text>
      )
    },
    {
      title: 'Margin',
      dataIndex: 'grossMargin',
      key: 'grossMargin',
      width: 80,
      align: 'center',
      sorter: (a, b) => (a.grossMargin || 0) - (b.grossMargin || 0),
      render: (value) => (
        <Tag color={getMarginTagColor(value)} style={{ margin: 0, fontSize: 11 }}>
          {(value || 0).toFixed(1)}%
        </Tag>
      )
    }
  ]

  // Table summary for products
  const productSummary = (pageData) => {
    if (pageData.length === 0) return null
    const totalRevenue = pageData.reduce((sum, r) => sum + (r.revenue || 0), 0)
    const totalProfit = pageData.reduce((sum, r) => sum + (r.grossProfit || 0), 0)
    const totalCogs = totalRevenue - totalProfit
    const totalVolume = pageData.reduce((sum, r) => sum + (r.volume || 0), 0)
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return (
      <Table.Summary fixed>
        <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
          <Table.Summary.Cell index={0} colSpan={2}>
            <Text strong>Page Total ({pageData.length} items)</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">
            <Text strong>{totalVolume.toLocaleString()}</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">
            <Text strong style={{ color: '#1890ff' }}>{formatCurrency(totalRevenue)}</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">
            <Text type="secondary">{formatCurrency(totalCogs)}</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={5} align="right">
            <Text strong style={{ color: totalProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
              {formatCurrency(totalProfit)}
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={6} align="center">
            <Tag color={getMarginTagColor(avgMargin)}>{avgMargin.toFixed(1)}%</Tag>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    )
  }

  // Table summary for dealers
  const dealerSummary = (pageData) => {
    if (pageData.length === 0) return null
    const totalRevenue = pageData.reduce((sum, r) => sum + (r.revenue || 0), 0)
    const totalProfit = pageData.reduce((sum, r) => sum + (r.grossProfit || 0), 0)
    const totalCogs = totalRevenue - totalProfit
    const totalProducts = pageData.reduce((sum, r) => sum + (r.productCount || 0), 0)
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return (
      <Table.Summary fixed>
        <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
          <Table.Summary.Cell index={0} colSpan={2}>
            <Text strong>Page Total ({pageData.length} dealers)</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="center">
            <Text strong>{totalProducts}</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">
            <Text strong style={{ color: '#1890ff' }}>{formatCurrency(totalRevenue)}</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">
            <Text type="secondary">{formatCurrency(totalCogs)}</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={5} align="right">
            <Text strong style={{ color: totalProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
              {formatCurrency(totalProfit)}
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={6} align="center">
            <Tag color={getMarginTagColor(avgMargin)}>{avgMargin.toFixed(1)}%</Tag>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    )
  }

  if (loading) {
    return (
      <div>
        <Card title="Products by Gross Profit" style={{ borderRadius: 12, marginBottom: 16 }}>
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin size="large" />
          </div>
        </Card>
        <Card title="Dealers by Gross Profit" style={{ borderRadius: 12 }}>
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin size="large" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {/* Products Ranking - Full Width Table */}
      <Card
        title={
          <span>
            Products by Gross Profit
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal', marginLeft: 8 }}>
              ({sortedProducts.length} products)
            </Text>
          </span>
        }
        extra={
          <Space>
            <Input
              placeholder="Search products..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{ width: 200 }}
              allowClear
              size="small"
            />
            <button
              onClick={handleExportProducts}
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: '4px 12px',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <DownloadOutlined /> CSV
            </button>
          </Space>
        }
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderTop: '3px solid #1890ff',
          marginBottom: 16
        }}
      >
        {sortedProducts.length === 0 ? (
          <Empty description="No product data available" />
        ) : (
          <Table
            dataSource={filteredProducts.map((p, i) => ({ ...p, key: p.productId || i }))}
            columns={productColumns}
            size="small"
            pagination={{
              pageSize: 15,
              size: 'small',
              showSizeChanger: true,
              showTotal: (total) => `${total} products`,
              pageSizeOptions: ['15', '25', '50', '100']
            }}
            scroll={{ x: 900, y: 500 }}
            summary={productSummary}
          />
        )}
      </Card>

      {/* Dealers Ranking - Full Width Table */}
      <Card
        title={
          <span>
            Dealers by Gross Profit
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal', marginLeft: 8 }}>
              ({sortedDealers.length} dealers)
            </Text>
          </span>
        }
        extra={
          <Space>
            <Input
              placeholder="Search dealers..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={dealerSearch}
              onChange={(e) => setDealerSearch(e.target.value)}
              style={{ width: 200 }}
              allowClear
              size="small"
            />
            <button
              onClick={handleExportDealers}
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: '4px 12px',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <DownloadOutlined /> CSV
            </button>
          </Space>
        }
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderTop: '3px solid #52c41a'
        }}
      >
        {sortedDealers.length === 0 ? (
          <Empty description="No dealer data available" />
        ) : (
          <Table
            dataSource={filteredDealers.map((d, i) => ({ ...d, key: d.dealerId || i }))}
            columns={dealerColumns}
            size="small"
            pagination={{
              pageSize: 15,
              size: 'small',
              showSizeChanger: true,
              showTotal: (total) => `${total} dealers`,
              pageSizeOptions: ['15', '25', '50', '100']
            }}
            scroll={{ x: 850, y: 500 }}
            summary={dealerSummary}
          />
        )}
      </Card>
    </div>
  )
}

export default GrossProfitRankings
