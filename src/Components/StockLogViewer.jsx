import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Button,
  DatePicker,
  Select,
  Input,
  Space,
  Tag,
  Tooltip,
  Modal,
  Form,
  Row,
  Col,
  Typography,
  Divider
} from 'antd'
import {
  ReloadOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text } = Typography

const StockLogViewer = () => {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 })
  const [filters, setFilters] = useState({})
  const [selectedLog, setSelectedLog] = useState(null)
  const [detailsVisible, setDetailsVisible] = useState(false)

  // Fetch stock logs
  const fetchStockLogs = async (page = 1, pageSize = 50) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page,
        limit: pageSize,
        ...filters
      })

      const response = await fetch(`/api/v2/stock-logging/logs?${params}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.data)
        setPagination({
          current: page,
          pageSize,
          total: data.pagination.total
        })
      } else {
        console.error('Failed to fetch stock logs:', data.message)
      }
    } catch (error) {
      console.error('Error fetching stock logs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle table pagination
  const handleTableChange = (pagination) => {
    fetchStockLogs(pagination.current, pagination.pageSize)
  }

  // Apply filters
  const applyFilters = () => {
    fetchStockLogs(1, pagination.pageSize)
  }

  // Clear filters
  const clearFilters = () => {
    setFilters({})
    fetchStockLogs(1, pagination.pageSize)
  }

  // View log details
  const viewLogDetails = (log) => {
    setSelectedLog(log)
    setDetailsVisible(true)
  }

  // Format date
  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD MMM YYYY HH:mm:ss')
  }

  // Get action tag color
  const getActionTagColor = (actionCode) => {
    const colors = {
      'STOCK_ADD': 'green',
      'STOCK_SALE': 'red',
      'STOCK_TRANSFER_IN': 'blue',
      'STOCK_TRANSFER_OUT': 'orange',
      'STOCK_ADJUSTMENT': 'purple',
      'STOCK_DAMAGE': 'red',
      'STOCK_COUNT': 'cyan',
      'PRODUCTION_REQUEST': 'blue',
      'PRODUCTION_RETURN': 'green',
      'DISPATCH_ALLOCATED': 'orange',
      'DISPATCH_SHIPPED': 'red',
      'RETURN_RECEIVED': 'green',
      'INITIAL_STOCK': 'purple'
    }
    return colors[actionCode] || 'default'
  }

  // Action name mapping
  const getActionName = (actionCode) => {
    const names = {
      'STOCK_ADD': 'Stock Added',
      'STOCK_SALE': 'Stock Sold',
      'STOCK_TRANSFER_IN': 'Transfer In',
      'STOCK_TRANSFER_OUT': 'Transfer Out',
      'STOCK_ADJUSTMENT': 'Stock Adjustment',
      'STOCK_DAMAGE': 'Stock Damage',
      'STOCK_COUNT': 'Physical Count',
      'PRODUCTION_REQUEST': 'Production Request',
      'PRODUCTION_RETURN': 'Production Return',
      'DISPATCH_ALLOCATED': 'Dispatch Allocated',
      'DISPATCH_SHIPPED': 'Dispatch Shipped',
      'RETURN_RECEIVED': 'Return Received',
      'INITIAL_STOCK': 'Initial Stock'
    }
    return names[actionCode] || actionCode
  }

  // Table columns
  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => formatDate(date),
      sorter: true
    },
    {
      title: 'Product ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 100,
      render: (id) => <Text strong>{id}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'product_type',
      key: 'product_type',
      width: 80,
      render: (type) => <Tag color="blue">{type?.toUpperCase()}</Tag>
    },
    {
      title: 'Action',
      dataIndex: 'action_code',
      key: 'action_code',
      width: 120,
      render: (actionCode) => (
        <Tag color={getActionTagColor(actionCode)}>
          {getActionName(actionCode)}
        </Tag>
      )
    },
    {
      title: 'Previous Stock',
      key: 'previous_stock',
      width: 120,
      render: (_, record) => (
        <div>
          <div>In: {record.previous_in_house_stock || 0}</div>
          <div>Show: {record.previous_showroom_stock || 0}</div>
        </div>
      )
    },
    {
      title: 'New Stock',
      key: 'new_stock',
      width: 120,
      render: (_, record) => (
        <div>
          <div>In: {record.new_in_house_stock || 0}</div>
          <div>Show: {record.new_showroom_stock || 0}</div>
        </div>
      )
    },
    {
      title: 'Change',
      key: 'change',
      width: 80,
      render: (_, record) => {
        const change = record.total_change || 0
        return (
          <Text strong style={{ color: change > 0 ? '#52c41a' : '#ff4d4f' }}>
            {change > 0 ? '+' : ''}{change}
          </Text>
        )
      }
    },
    {
      title: 'Reference',
      dataIndex: 'reference_number',
      key: 'reference_number',
      width: 120,
      render: (ref) => ref ? <Text code>{ref}</Text> : '-'
    },
    {
      title: 'User',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      width: 120,
      render: (name) => name || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewLogDetails(record)}
          />
        </Tooltip>
      )
    }
  ]

  useEffect(() => {
    fetchStockLogs()
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Stock Movement Logs</Title>
      
      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Form layout="inline">
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Space>
                <label>Product ID:</label>
                <Input
                  placeholder="Product ID"
                  value={filters.productId || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    productId: e.target.value || undefined 
                  }))}
                  style={{ width: 120 }}
                />
              </Space>
            </Col>
            
            <Col>
              <Space>
                <label>Action:</label>
                <Select
                  placeholder="Select action"
                  value={filters.actionCode}
                  onChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    actionCode: value || undefined 
                  }))}
                  style={{ width: 150 }}
                  allowClear
                >
                  <Option value="STOCK_ADD">Stock Added</Option>
                  <Option value="STOCK_SALE">Stock Sold</Option>
                  <Option value="STOCK_TRANSFER_IN">Transfer In</Option>
                  <Option value="STOCK_TRANSFER_OUT">Transfer Out</Option>
                  <Option value="STOCK_ADJUSTMENT">Stock Adjustment</Option>
                </Select>
              </Space>
            </Col>
            
            <Col>
              <Space>
                <label>Date Range:</label>
                <RangePicker
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setFilters(prev => ({
                        ...prev,
                        startDate: dates[0].format('YYYY-MM-DD'),
                        endDate: dates[1].format('YYYY-MM-DD')
                      }))
                    } else {
                      setFilters(prev => ({
                        ...prev,
                        startDate: undefined,
                        endDate: undefined
                      }))
                    }
                  }}
                />
              </Space>
            </Col>
            
            <Col>
              <Space>
                <Button 
                  type="primary" 
                  icon={<FilterOutlined />}
                  onClick={applyFilters}
                >
                  Apply Filters
                </Button>
                <Button 
                  onClick={clearFilters}
                >
                  Clear
                </Button>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={() => fetchStockLogs(pagination.current, pagination.pageSize)}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Logs Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title="Stock Movement Details"
        visible={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedLog && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Title level={5}>Basic Information</Title>
                <Space direction="vertical">
                  <Text><strong>Log ID:</strong> {selectedLog.id}</Text>
                  <Text><strong>Date:</strong> {formatDate(selectedLog.created_at)}</Text>
                  <Text><strong>Product ID:</strong> {selectedLog.product_id}</Text>
                  <Text><strong>Product Type:</strong> {selectedLog.product_type?.toUpperCase()}</Text>
                  <Text><strong>Action:</strong> {getActionName(selectedLog.action_code)}</Text>
                  <Text><strong>User:</strong> {selectedLog.created_by_name || '-'}</Text>
                </Space>
              </Col>
              
              <Col span={12}>
                <Title level={5}>Stock Changes</Title>
                <Space direction="vertical">
                  <Text>
                    <strong>Previous:</strong> In: {selectedLog.previous_in_house_stock || 0}, 
                    Show: {selectedLog.previous_showroom_stock || 0}
                  </Text>
                  <Text>
                    <strong>New:</strong> In: {selectedLog.new_in_house_stock || 0}, 
                    Show: {selectedLog.new_showroom_stock || 0}
                  </Text>
                  <Text>
                    <strong>Change:</strong> 
                    <span style={{ color: (selectedLog.total_change || 0) > 0 ? '#52c41a' : '#ff4d4f' }}>
                      {' '}{(selectedLog.total_change || 0) > 0 ? '+' : ''}{selectedLog.total_change || 0}
                    </span>
                  </Text>
                  <Text><strong>Quantity:</strong> {selectedLog.quantity}</Text>
                  <Text><strong>Batch:</strong> {selectedLog.batch_number || '-'}</Text>
                </Space>
              </Col>
            </Row>
            
            {(selectedLog.notes || selectedLog.reason || selectedLog.reference_number) && (
              <>
                <Divider />
                <Row gutter={16}>
                  <Col span={24}>
                    <Title level={5}>Additional Information</Title>
                    {selectedLog.reference_number && (
                      <Text><strong>Reference:</strong> {selectedLog.reference_number}<br /></Text>
                    )}
                    {selectedLog.notes && (
                      <Text><strong>Notes:</strong> {selectedLog.notes}<br /></Text>
                    )}
                    {selectedLog.reason && (
                      <Text><strong>Reason:</strong> {selectedLog.reason}</Text>
                    )}
                  </Col>
                </Row>
              </>
            )}
            
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Space>
                  <Tag color={getActionTagColor(selectedLog.action_code)}>
                    {getActionName(selectedLog.action_code)}
                  </Tag>
                  <Tag color="blue">{selectedLog.product_type?.toUpperCase()}</Tag>
                  <Tag color={selectedLog.is_manual_entry ? 'orange' : 'green'}>
                    {selectedLog.is_manual_entry ? 'Manual' : 'System'}
                  </Tag>
                </Space>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text type="secondary">Log ID: {selectedLog.id}</Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StockLogViewer