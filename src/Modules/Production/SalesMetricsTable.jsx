import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Input,
  Select,
  Row,
  Col,
  Tag,
  Typography,
  Statistic,
  Button,
  Space,
  Tooltip,
  Progress,
  DatePicker
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  DollarCircleOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { getSalesPerformanceMetrics } from '../../redux/api/productionAPI'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input

const SalesMetricsTable = () => {
  const dispatch = useDispatch()
  
  // Redux state
  const {
    salesMetrics = [],
    salesSummary = {},
    salesPagination = {},
    salesFilters = {},
    salesMetricsLoading = false
  } = useSelector(state => state.productionDetails || {})

  // Local state for filters
  const [localFilters, setLocalFilters] = useState({
    timeframe: '1m',
    search: '',
    sortBy: 'total_sold',
    sortOrder: 'desc'
  })

  // Load data on component mount and when filters change
  useEffect(() => {
    loadSalesMetrics()
  }, [localFilters.timeframe, localFilters.sortBy, localFilters.sortOrder])

  const loadSalesMetrics = (page = 1, limit = 10) => {
    dispatch(getSalesPerformanceMetrics({
      page,
      limit,
      ...localFilters
    }))
  }

  const handleSearch = (value) => {
    setLocalFilters(prev => ({ ...prev, search: value }))
    loadSalesMetrics(1, (salesPagination && salesPagination.pageSize) || 10)
  }

  const handleTimeframeChange = (value) => {
    setLocalFilters(prev => ({ ...prev, timeframe: value }))
  }

  const handleSortChange = (sortBy, sortOrder) => {
    setLocalFilters(prev => ({ ...prev, sortBy, sortOrder }))
  }

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field && sorter.order) {
      const sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc'
      handleSortChange(sorter.field, sortOrder)
    }
    loadSalesMetrics(pagination.current, pagination.pageSize)
  }

  const getActivityLevelColor = (level) => {
    switch (level) {
      case 'High Activity': return 'green'
      case 'Medium Activity': return 'orange'
      case 'Low Activity': return 'red'
      default: return 'default'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('en-IN') : 'N/A'
  }

  const getTimeframeLabel = (timeframe) => {
    const labels = {
      'this_month': 'This Month',
      'last_month': 'Last Month',
      '1m': 'Last 30 Days',
      '3m': 'Last 3 Months',
      '6m': 'Last 6 Months',
      '1y': 'Last Year'
    }
    return labels[timeframe] || 'Last 30 Days'
  }

  const columns = [
    {
      title: 'Product Details',
      key: 'product',
      width: 250,
      render: (_, record) => (
        <div>
          <div className="font-medium text-sm mb-1">{record.productName}</div>
          <div className="text-xs text-gray-500">ID: {record.productId}</div>
        </div>
      )
    },
    {
      title: 'Units Sold',
      dataIndex: 'totalSold',
      key: 'total_sold',
      width: 120,
      sorter: true,
      render: (value) => (
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{value}</div>
          <div className="text-xs text-gray-500">units</div>
        </div>
      )
    },
    {
      title: 'Revenue',
      dataIndex: 'totalRevenue',
      key: 'total_revenue',
      width: 140,
      sorter: true,
      render: (value) => (
        <div className="text-center">
          <div className="text-sm font-bold text-green-600">{formatCurrency(value)}</div>
          <div className="text-xs text-gray-500">total</div>
        </div>
      )
    },
    {
      title: 'Avg Price',
      dataIndex: 'avgPrice',
      key: 'avg_price',
      width: 120,
      sorter: true,
      render: (value) => (
        <div className="text-center">
          <div className="text-sm font-medium">{formatCurrency(value)}</div>
          <div className="text-xs text-gray-500">per unit</div>
        </div>
      )
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'order_count',
      width: 100,
      sorter: true,
      render: (value, record) => (
        <div className="text-center">
          <div className="text-sm font-bold">{value}</div>
          <div className="text-xs text-gray-500">{record.uniqueDealers} dealers</div>
        </div>
      )
    },
    {
      title: 'Activity Level',
      dataIndex: 'activityLevel',
      key: 'activity_level',
      width: 130,
      render: (value) => (
        <Tag color={getActivityLevelColor(value)} className="text-center w-full">
          {value}
        </Tag>
      )
    },
    {
      title: 'Top Dealer',
      dataIndex: 'topDealer',
      key: 'top_dealer',
      width: 150,
      render: (value) => (
        <div className="text-xs">
          <UserOutlined className="mr-1" />
          {value}
        </div>
      )
    },
    {
      title: 'Last Sale',
      dataIndex: 'lastSaleDate',
      key: 'last_sale_date',
      width: 120,
      sorter: true,
      render: (value) => (
        <div className="text-xs text-gray-600">
          <CalendarOutlined className="mr-1" />
          {formatDate(value)}
        </div>
      )
    }
  ]

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined className="text-blue-600" />
            <span>Sales Performance Metrics</span>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => loadSalesMetrics(1, (salesPagination && salesPagination.pageSize) || 10)}
            loading={salesMetricsLoading}
            size="small"
          >
            Refresh
          </Button>
        </div>
      }
      className="h-full"
    >
      {/* Summary Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={4}>
          <Card size="small" className="text-center">
            <Statistic
              title="Total Revenue"
              value={(salesSummary && salesSummary.totalRevenue) || 0}
              formatter={(value) => formatCurrency(value)}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small" className="text-center">
            <Statistic
              title="Units Sold"
              value={(salesSummary && salesSummary.totalUnitsSold) || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small" className="text-center">
            <Statistic
              title="Total Orders"
              value={(salesSummary && salesSummary.totalOrders) || 0}
              valueStyle={{ color: '#fa8c16', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small" className="text-center">
            <Statistic
              title="Active Dealers"
              value={(salesSummary && salesSummary.activeDealers) || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small" className="text-center">
            <Statistic
              title="Products Sold"
              value={(salesSummary && salesSummary.uniqueProductsSold) || 0}
              valueStyle={{ color: '#eb2f96', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small" className="text-center">
            <Statistic
              title="Avg Price"
              value={(salesSummary && salesSummary.avgSellingPrice) || 0}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#13c2c2', fontSize: '16px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={8}>
          <Search
            placeholder="Search products..."
            allowClear
            onSearch={handleSearch}
            loading={salesMetricsLoading}
          />
        </Col>
        <Col xs={24} md={6}>
          <Select
            value={localFilters.timeframe}
            onChange={handleTimeframeChange}
            className="w-full"
            size="middle"
          >
            <Option value="this_month">📅 This Month</Option>
            <Option value="last_month">📅 Last Month</Option>
            <Option value="1m">📅 Last 30 Days</Option>
            <Option value="3m">📅 Last 3 Months</Option>
            <Option value="6m">📅 Last 6 Months</Option>
            <Option value="1y">📅 Last Year</Option>
          </Select>
        </Col>
        <Col xs={24} md={10}>
          <div className="text-sm text-gray-600">
            <strong>Period:</strong> {getTimeframeLabel(localFilters.timeframe)} • 
            <strong> Total Products:</strong> {(salesPagination && salesPagination.totalCount) || 0}
          </div>
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={salesMetrics}
        rowKey="productId"
        loading={salesMetricsLoading}
        onChange={handleTableChange}
        pagination={{
          current: (salesPagination && salesPagination.currentPage) || 1,
          pageSize: (salesPagination && salesPagination.pageSize) || 10,
          total: (salesPagination && salesPagination.totalCount) || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} products`,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        scroll={{ x: 1000 }}
        size="small"
      />

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 text-center">
        Last updated: {new Date().toLocaleTimeString()} • 
        Real-time sales data • Period: {getTimeframeLabel(localFilters.timeframe)}
      </div>
    </Card>
  )
}

export default SalesMetricsTable