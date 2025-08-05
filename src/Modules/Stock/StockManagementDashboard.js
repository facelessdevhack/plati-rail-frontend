import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Statistic,
  Modal,
  Form,
  InputNumber,
  notification,
  Tooltip,
  Tag,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Popconfirm,
  Badge
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  getStockManagement,
  updateStock,
  createStockProduct,
  deleteStockProduct,
  getAllModels,
  getAllSizes,
  getAllPcd,
  getAllHoles,
  getAllFinishes,
  getAllCbs,
  getAllWidths,
  getAllOffsets
} from '../../redux/api/stockAPI'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const StockManagementDashboard = () => {
  console.log('=== StockManagementDashboard component STARTED ===')
  const dispatch = useDispatch()
  console.log('=== dispatch created ===')
  console.log('useSelector about to run...')
  
  // Redux state
  const { 
    stockManagementData, 
    stockPagination, 
    stockSummary, 
    loading,
    allModels,
    allSizes,
    allPcd,
    allHoles,
    allFinishes,
    allCbs,
    allWidths,
    allOffsets
  } = useSelector(state => {
    console.log('=== useSelector running, Redux state.stockDetails:', state.stockDetails)
    return state.stockDetails
  })
  
  console.log('=== State variables created ===')
  console.log('=== About to create local state ===')

  // Local state management
  console.log('=== Creating local state 1 ===')
  const [searchText, setSearchText] = useState('')
  console.log('=== Creating local state 2 ===')
  const [filterType, setFilterType] = useState('all')
  console.log('=== Creating local state 3 ===')
  const [selectedPcd, setSelectedPcd] = useState(null)
  console.log('=== Creating local state 4 ===')
  const [selectedInches, setSelectedInches] = useState(null)

  // Modal states
  console.log('=== Creating modal states ===')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  console.log('=== Creating forms ===')
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  console.log('=== Forms created ===')
  console.log('=== About to define functions ===')

  // Fetch stock management data
  const fetchStockData = (page = 1, pageSize = 50, search = '', filter = 'all', pcd = null, inches = null) => {
    dispatch(getStockManagement({ page, limit: pageSize, search, filter, pcd, inches }))
  }

  // Fetch master data for dropdowns
  const fetchMasterData = () => {
    console.log('Fetching master data...')
    dispatch(getAllModels())
    dispatch(getAllSizes())
    dispatch(getAllPcd())
    dispatch(getAllHoles())
    dispatch(getAllFinishes())
    dispatch(getAllCbs())
    dispatch(getAllWidths())
    dispatch(getAllOffsets())
  }

  // Update stock
  const handleUpdateStock = async (values) => {
    try {
      const result = await dispatch(updateStock({
        alloyId: selectedRecord.id,
        in_house_stock: values.in_house_stock,
        showroom_stock: values.showroom_stock,
        reason: values.reason || 'Manual update'
      })).unwrap()

      notification.success({
        message: 'Success',
        description: 'Stock updated successfully'
      })

      setEditModalVisible(false)
      form.resetFields()
      fetchStockData(stockPagination.current, stockPagination.pageSize, searchText, filterType, selectedPcd, selectedInches)
    } catch (error) {
      console.error('Error updating stock:', error)
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to update stock. Please try again.'
      })
    }
  }

  // Create new product
  const handleCreateProduct = async (values) => {
    try {
      await dispatch(createStockProduct(values)).unwrap()

      notification.success({
        message: 'Success',
        description: 'Product created successfully'
      })

      setAddModalVisible(false)
      addForm.resetFields()
      fetchStockData(stockPagination.current, stockPagination.pageSize, searchText, filterType, selectedPcd, selectedInches)
    } catch (error) {
      console.error('Error creating product:', error)
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to create product. Please try again.'
      })
    }
  }

  // Delete product
  const handleDeleteProduct = async (record) => {
    try {
      await dispatch(deleteStockProduct({ alloyId: record.id })).unwrap()

      notification.success({
        message: 'Success',
        description: 'Product deleted successfully'
      })

      fetchStockData(stockPagination.current, stockPagination.pageSize, searchText, filterType, selectedPcd, selectedInches)
    } catch (error) {
      console.error('Error deleting product:', error)
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to delete product. Please try again.'
      })
    }
  }

  // Get stock status
  const getStockStatus = (inHouseStock, showroomStock) => {
    const totalStock = (inHouseStock || 0) + (showroomStock || 0)
    
    if (totalStock === 0) {
      return { status: 'Out of Stock', color: 'red', icon: <CloseCircleOutlined /> }
    } else if (totalStock < 10) {
      return { status: 'Low Stock', color: 'orange', icon: <ExclamationCircleOutlined /> }
    } else {
      return { status: 'In Stock', color: 'green', icon: <CheckCircleOutlined /> }
    }
  }

  // Table columns
  const columns = [
    {
      title: 'Size & PCD',
      key: 'size_pcd',
      width: 150,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-blue-600">{record.inches}"</div>
          <div className="text-sm text-gray-500">{record.pcd}</div>
        </div>
      ),
      sorter: (a, b) => {
        const aSize = parseInt(a.inches) || 0
        const bSize = parseInt(b.inches) || 0
        if (aSize !== bSize) return aSize - bSize
        return (a.pcd || '').localeCompare(b.pcd || '')
      }
    },
    {
      title: 'Product Details',
      key: 'product',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.productName}</div>
          <div className="text-sm text-gray-500">
            {record.modelName} • {record.holes} holes • {record.finish}
          </div>
        </div>
      )
    },
    {
      title: 'In-House Stock',
      dataIndex: 'inHouseStock',
      key: 'inHouseStock',
      width: 120,
      sorter: (a, b) => (a.inHouseStock || 0) - (b.inHouseStock || 0),
      render: (stock) => (
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{stock || 0}</div>
        </div>
      )
    },
    {
      title: 'Showroom Stock',
      dataIndex: 'showroom_stock', 
      key: 'showroom_stock',
      width: 120,
      sorter: (a, b) => (a.showroom_stock || 0) - (b.showroom_stock || 0),
      render: (stock) => (
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{stock || 0}</div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const { status, color, icon } = getStockStatus(record.inHouseStock, record.showroom_stock)
        return (
          <Tag color={color} icon={icon}>
            {status}
          </Tag>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Stock">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedRecord(record)
                form.setFieldsValue({
                  in_house_stock: record.inHouseStock || 0,
                  showroom_stock: record.showroom_stock || 0
                })
                setEditModalVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="Delete Product">
            <Popconfirm
              title="Are you sure you want to delete this product?"
              description="This action cannot be undone."
              onConfirm={() => handleDeleteProduct(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ]

  // Table pagination config
  const handleTableChange = (paginationConfig) => {
    fetchStockData(paginationConfig.current, paginationConfig.pageSize, searchText, filterType, selectedPcd, selectedInches)
  }

  // Search handler
  const handleSearch = (value) => {
    setSearchText(value)
    fetchStockData(1, stockPagination.pageSize, value, filterType, selectedPcd, selectedInches)
  }

  // Filter handler
  const handleFilterChange = (value) => {
    setFilterType(value)
    fetchStockData(1, stockPagination.pageSize, searchText, value, selectedPcd, selectedInches)
  }

  // PCD filter handler
  const handlePcdFilter = (value) => {
    setSelectedPcd(value)
    fetchStockData(1, stockPagination.pageSize, searchText, filterType, value, selectedInches)
  }

  // Inches filter handler
  const handleInchesFilter = (value) => {
    setSelectedInches(value)
    fetchStockData(1, stockPagination.pageSize, searchText, filterType, selectedPcd, value)
  }

  // Clear filters handler
  const handleClearFilters = () => {
    setSelectedPcd(null)
    setSelectedInches(null)
    setSearchText('')
    setFilterType('all')
    fetchStockData(1, stockPagination.pageSize, '', 'all', null, null)
  }

  // Refresh handler
  const handleRefresh = () => {
    fetchStockData(stockPagination.current, stockPagination.pageSize, searchText, filterType, selectedPcd, selectedInches)
  }

  console.log('=== All functions defined, about to define useEffect ===')

  // Load data on component mount
  useEffect(() => {
    console.log('=== useEffect running ===')
    fetchStockData()
    fetchMasterData()
  }, [])
  

  console.log('=== useEffect defined, about to return JSX ===')

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="mb-2">
          📦 Stock Management Dashboard
        </Title>
        <Text type="secondary">
          Manage inventory levels sorted by wheel size and PCD
        </Text>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total In-House"
              value={stockSummary.total_in_house}
              valueStyle={{ color: '#1890ff' }}
              suffix="pcs"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Showroom"
              value={stockSummary.total_showroom}
              valueStyle={{ color: '#52c41a' }}
              suffix="pcs"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={stockSummary.low_stock_count}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={stockSummary.out_of_stock_count}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Stock Alerts */}
      {(stockSummary.low_stock_count > 0 || stockSummary.out_of_stock_count > 0) && (
        <Alert
          message="Stock Level Warnings"
          description={
            <div>
              {stockSummary.out_of_stock_count > 0 && (
                <div>⚠️ {stockSummary.out_of_stock_count} items are out of stock</div>
              )}
              {stockSummary.low_stock_count > 0 && (
                <div>📉 {stockSummary.low_stock_count} items have low stock levels</div>
              )}
            </div>
          }
          type="warning"
          showIcon
          className="mb-6"
        />
      )}

      {/* Controls */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Search
              placeholder="Search products..."
              style={{ width: 300 }}
              onSearch={handleSearch}
              onChange={(e) => e.target.value === '' && handleSearch('')}
              allowClear
            />
            <Select
              placeholder="Filter by stock level"
              style={{ width: 200 }}
              value={filterType}
              onChange={handleFilterChange}
            >
              <Option value="all">All Items</Option>
              <Option value="in_stock">In Stock</Option>
              <Option value="low_stock">Low Stock</Option>
              <Option value="out_of_stock">Out of Stock</Option>
            </Select>
            <Select
              placeholder="Filter by PCD"
              style={{ width: 150 }}
              value={selectedPcd}
              onChange={handlePcdFilter}
              allowClear
            >
              {(allPcd || []).map(pcd => (
                <Option key={pcd.value} value={pcd.label}>
                  {pcd.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filter by Size"
              style={{ width: 150 }}
              value={selectedInches}
              onChange={handleInchesFilter}
              allowClear
            >
              {(allSizes || []).map(size => (
                <Option key={size.value} value={size.label}>
                  {size.label}"
                </Option>
              ))}
            </Select>
            <Button
              onClick={handleClearFilters}
              disabled={!selectedPcd && !selectedInches && !searchText && filterType === 'all'}
            >
              Clear Filters
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              Add Product
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Stock Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={stockManagementData}
          rowKey="id"
          loading={loading}
          pagination={{
            ...stockPagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Edit Stock Modal */}
      <Modal
        title={`Edit Stock - ${selectedRecord?.product_name}`}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleUpdateStock}
          layout="vertical"
        >
          <Form.Item
            name="in_house_stock"
            label="In-House Stock"
            rules={[
              { required: true, message: 'Please enter in-house stock' },
              { type: 'number', min: 0, message: 'Stock cannot be negative' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter in-house stock quantity"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="showroom_stock"
            label="Showroom Stock"
            rules={[
              { type: 'number', min: 0, message: 'Stock cannot be negative' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter showroom stock quantity"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Change"
          >
            <Input.TextArea
              placeholder="Enter reason for stock change (optional)"
              rows={2}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Update Stock
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Add Product Modal */}
      <Modal
        title="Add New Alloy Product"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false)
          addForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={addForm}
          onFinish={handleCreateProduct}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="product_name"
                label="Product Name"
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="model_id"
                label="Model"
                rules={[{ required: true, message: 'Please select model' }]}
              >
                <Select placeholder="Select model">
                  {(allModels || []).map(model => (
                    <Option key={model.id} value={model.id}>
                      {model.model_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="inches_id"
                label="Size (Inches)"
                rules={[{ required: true, message: 'Please select size' }]}
              >
                {console.log(allSizes, "ALL SIZES")}
                <Select placeholder="Select size">
                  {(allSizes || []).map(inch => (
                    <Option key={inch.value} value={inch.value}>
                      {inch.label}"
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pcd_id"
                label="PCD"
                rules={[{ required: true, message: 'Please select PCD' }]}
              >
                <Select placeholder="Select PCD">
                  {(allPcd || []).map(pcd => (
                    <Option key={pcd.value} value={pcd.value}>
                      {pcd.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="holes_id"
                label="Holes"
                rules={[{ required: true, message: 'Please select holes' }]}
              >
                <Select placeholder="Select holes">
                  {(allHoles || []).map(hole => (
                    <Option key={hole.id} value={hole.id}>
                      {hole.holes}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="finish_id"
                label="Finish"
                rules={[{ required: true, message: 'Please select finish' }]}
              >
                <Select placeholder="Select finish">
                  {(allFinishes || []).map(finish => (
                    <Option key={finish.id} value={finish.id}>
                      {finish.finish}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cb_id"
                label="CB"
                rules={[{ required: true, message: 'Please select CB' }]}
              >
                <Select placeholder="Select CB">
                  {(allCbs || []).map(cb => (
                    <Option key={cb.id} value={cb.id}>
                      {cb.cb}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="width_id" 
                label="Width"
                rules={[{ required: true, message: 'Please select width' }]}
              >
                <Select placeholder="Select width">
                  {(allWidths || []).map(width => (
                    <Option key={width.id} value={width.id}>
                      {width.width}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="offset_id"
                label="Offset"
                rules={[{ required: true, message: 'Please select offset' }]}
              >
                <Select placeholder="Select offset">
                  {(allOffsets || []).map(offset => (
                    <Option key={offset.id} value={offset.id}>
                      {offset.offset}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="in_house_stock"
                label="Initial In-House Stock"
                rules={[{ type: 'number', min: 0, message: 'Stock cannot be negative' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter initial stock"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="showroom_stock"
                label="Initial Showroom Stock"
                rules={[{ type: 'number', min: 0, message: 'Stock cannot be negative' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter showroom stock"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="costing"
            label="Cost Price (Optional)"
            rules={[{ type: 'number', min: 0, message: 'Cost cannot be negative' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter cost price"
              min={0}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setAddModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Add Product
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default StockManagementDashboard