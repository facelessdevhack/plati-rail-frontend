import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Alert,
  Badge,
  Tooltip,
  Dropdown,
  Menu,
  Typography,
  Empty,
  Spin,
  notification,
  Divider,
  Modal,
  Form,
  InputNumber
} from 'antd'
import {
  StockOutlined,
  WarningOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ExclamationCircleTwoTone,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  RiseOutlined,
  TrendingDownOutlined,
  ShoppingCartOutlined,
  ToolOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { getAllAlloys } from '../../redux/api/stockAPI'
import { Pie, Column, Line } from '@ant-design/plots'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const StockDashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // State management
  const [activeTab, setActiveTab] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [filterModel, setFilterModel] = useState(null)
  const [filterFinish, setFilterFinish] = useState(null)
  const [filterSize, setFilterSize] = useState(null)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('ascend')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [form] = Form.useForm()

  // Redux state
  const { allAlloys, loading, totalAlloysCount, allModels, allFinishes } =
    useSelector(state => state.stockDetails)

  useEffect(() => {
    dispatch(getAllAlloys({ page: 1 }))
  }, [dispatch])

  // Calculate stock metrics
  const stockMetrics = useMemo(() => {
    if (!allAlloys?.length)
      return { total: 0, lowStock: 0, outOfStock: 0, healthy: 0 }

    const total = allAlloys.length
    const lowStock = allAlloys.filter(item => {
      const stock = item.inHouseStock || 0
      return stock > 0 && stock <= 10 // Assuming 10 is low stock threshold
    }).length

    const outOfStock = allAlloys.filter(
      item => (item.inHouseStock || 0) === 0
    ).length
    const healthy = total - lowStock - outOfStock

    return { total, lowStock, outOfStock, healthy }
  }, [allAlloys])

  // Filter and search logic
  const filteredData = useMemo(() => {
    if (!allAlloys) return []

    let filtered = allAlloys.filter(item => {
      const matchesSearch =
        !searchText ||
        item.modelName?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.finish?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.inches?.toString().includes(searchText)

      const matchesModel = !filterModel || item.modelName === filterModel
      const matchesFinish = !filterFinish || item.finish === filterFinish
      const matchesSize = !filterSize || item.inches?.toString() === filterSize

      return matchesSearch && matchesModel && matchesFinish && matchesSize
    })

    // Apply tab filter
    switch (activeTab) {
      case 'low':
        filtered = filtered.filter(item => {
          const stock = item.inHouseStock || 0
          return stock > 0 && stock <= 10
        })
        break
      case 'out':
        filtered = filtered.filter(item => (item.inHouseStock || 0) === 0)
        break
      case 'healthy':
        filtered = filtered.filter(item => (item.inHouseStock || 0) > 10)
        break
      default:
        break
    }

    return filtered
  }, [allAlloys, searchText, filterModel, filterFinish, filterSize, activeTab])

  // Stock level distribution for pie chart
  const stockDistributionData = [
    { type: 'Healthy Stock', value: stockMetrics.healthy, color: '#52c41a' },
    { type: 'Low Stock', value: stockMetrics.lowStock, color: '#faad14' },
    { type: 'Out of Stock', value: stockMetrics.outOfStock, color: '#ff4d4f' }
  ].filter(item => item.value > 0)

  // Top models by stock quantity
  const topModelsData = useMemo(() => {
    if (!allAlloys?.length) return []

    const modelStock = {}
    allAlloys.forEach(item => {
      const model = item.modelName || 'Unknown'
      modelStock[model] = (modelStock[model] || 0) + (item.inHouseStock || 0)
    })

    return Object.entries(modelStock)
      .map(([model, stock]) => ({ model, stock }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 10)
  }, [allAlloys])

  // Stock status tag renderer
  const getStockStatusTag = stock => {
    if (stock === 0) {
      return (
        <Tag color='red' icon={<CloseCircleTwoTone twoToneColor='#ff4d4f' />}>
          Out of Stock
        </Tag>
      )
    } else if (stock <= 10) {
      return (
        <Tag
          color='orange'
          icon={<ExclamationCircleTwoTone twoToneColor='#faad14' />}
        >
          Low Stock
        </Tag>
      )
    } else {
      return (
        <Tag color='green' icon={<CheckCircleTwoTone twoToneColor='#52c41a' />}>
          In Stock
        </Tag>
      )
    }
  }

  // Table columns
  const columns = [
    {
      title: 'Product Details',
      key: 'product',
      render: (_, record) => (
        <div className='space-y-1'>
          <div className='font-semibold text-gray-800'>
            {record.modelName || 'N/A'}
          </div>
          <div className='text-sm text-gray-500'>
            {record.inches}" • {record.pcd}x{record.holes} • {record.finish}
          </div>
        </div>
      )
    },
    {
      title: 'Specifications',
      key: 'specs',
      render: (_, record) => (
        <div className='space-y-1'>
          <div>
            <Text strong>CB:</Text> {record.cb}
          </div>
          <div>
            <Text strong>Width:</Text> {record.width}
          </div>
          <div>
            <Text strong>Offset:</Text> {record.offset}
          </div>
        </div>
      )
    },
    {
      title: 'Stock Level',
      key: 'stock',
      sorter: (a, b) => (a.inHouseStock || 0) - (b.inHouseStock || 0),
      render: (_, record) => {
        const stock = record.inHouseStock || 0
        return (
          <div className='space-y-2'>
            <div className='flex items-center space-x-2'>
              <span className='text-2xl font-bold'>{stock}</span>
              <span className='text-gray-500'>pcs</span>
            </div>
            {getStockStatusTag(stock)}
            {stock > 0 && stock <= 10 && (
              <Progress
                percent={(stock / 50) * 100}
                size='small'
                strokeColor='#faad14'
                trailColor='#f0f0f0'
              />
            )}
          </div>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title='View Details'>
            <Button
              type='text'
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title='Edit Stock'>
            <Button
              type='text'
              icon={<EditOutlined />}
              onClick={() => handleEditStock(record)}
            />
          </Tooltip>
          <Tooltip title='More Actions'>
            <Tooltip title='Stock Analysis'>
              <Button
                type='text'
                icon={<BarChartOutlined />}
                onClick={() => navigate(`/stock-analysis/${record.id}`)}
              />
            </Tooltip>
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item key='reorder' icon={<ShoppingCartOutlined />}>
                    Create Reorder
                  </Menu.Item>
                  <Menu.Item key='history' icon={<LineChartOutlined />}>
                    View History
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item key='delete' icon={<DeleteOutlined />} danger>
                    Delete Item
                  </Menu.Item>
                </Menu>
              }
            >
              <Button type='text' icon={<ToolOutlined />} />
            </Dropdown>
          </Tooltip>
        </Space>
      )
    }
  ]

  // Chart configurations
  const pieConfig = {
    data: stockDistributionData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}\n{percentage}'
    },
    interactions: [{ type: 'element-active' }]
  }

  const columnConfig = {
    data: topModelsData,
    xField: 'model',
    yField: 'stock',
    color: '#1890ff',
    columnWidthRatio: 0.6,
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.8
      }
    }
  }

  // Event handlers
  const handleViewDetails = record => {
    Modal.info({
      title: 'Product Details',
      width: 600,
      content: (
        <div className='space-y-4 mt-4'>
          <Row gutter={16}>
            <Col span={12}>
              <div>
                <strong>Model:</strong> {record.modelName}
              </div>
              <div>
                <strong>Size:</strong> {record.inches}"
              </div>
              <div>
                <strong>PCD:</strong> {record.pcd}
              </div>
              <div>
                <strong>Holes:</strong> {record.holes}
              </div>
            </Col>
            <Col span={12}>
              <div>
                <strong>CB:</strong> {record.cb}
              </div>
              <div>
                <strong>Finish:</strong> {record.finish}
              </div>
              <div>
                <strong>Width:</strong> {record.width}
              </div>
              <div>
                <strong>Offset:</strong> {record.offset}
              </div>
            </Col>
          </Row>
          <Divider />
          <div>
            <strong>Current Stock:</strong>
            <span className='ml-2 text-xl font-bold'>
              {record.inHouseStock || 0} pcs
            </span>
          </div>
          {getStockStatusTag(record.inHouseStock || 0)}
        </div>
      )
    })
  }

  const handleEditStock = record => {
    setSelectedItem(record)
    form.setFieldsValue({
      stock: record.inHouseStock || 0,
      showroomStock: record.showroomStock || 0
    })
    setEditModalVisible(true)
  }

  const handleUpdateStock = async () => {
    try {
      const values = await form.validateFields()
      // API call to update stock would go here
      notification.success({
        message: 'Stock Updated',
        description: 'Stock levels have been updated successfully.'
      })
      setEditModalVisible(false)
      dispatch(getAllAlloys({ page: 1 }))
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  const handleRefresh = () => {
    dispatch(getAllAlloys({ page: 1 }))
    notification.success({
      message: 'Refreshed',
      description: 'Stock data has been refreshed.'
    })
  }

  const tabItems = [
    {
      label: (
        <div className='flex items-center space-x-2'>
          <span>All Stock</span>
          <Badge count={stockMetrics.total} showZero />
        </div>
      ),
      key: 'all'
    },
    {
      label: (
        <div className='flex items-center space-x-2'>
          <span>Healthy</span>
          <Badge count={stockMetrics.healthy} showZero color='green' />
        </div>
      ),
      key: 'healthy'
    },
    {
      label: (
        <div className='flex items-center space-x-2'>
          <span>Low Stock</span>
          <Badge count={stockMetrics.lowStock} showZero color='orange' />
        </div>
      ),
      key: 'low'
    },
    {
      label: (
        <div className='flex items-center space-x-2'>
          <span>Out of Stock</span>
          <Badge count={stockMetrics.outOfStock} showZero color='red' />
        </div>
      ),
      key: 'out'
    }
  ]

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Spin size='large' tip='Loading stock data...' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6'>
      {/* Header */}
      <div className='bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-8 mb-8'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0'>
          <div className='space-y-2'>
            <div className='flex items-center space-x-3'>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center'>
                <StockOutlined className='text-white text-xl' />
              </div>
              <div>
                <h1 className='text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
                  📦 Stock Management Dashboard
                </h1>
                <p className='text-gray-600 text-lg'>
                  Comprehensive inventory tracking and management
                </p>
              </div>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => navigate('/add-stock')}
              style={{ borderRadius: '12px' }}
            >
              Add Stock
            </Button>
            <Button
              icon={<BarChartOutlined />}
              onClick={() => navigate('/bulk-stock-analysis')}
              style={{ borderRadius: '12px' }}
            >
              Bulk Analysis
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              style={{ borderRadius: '12px' }}
            >
              Refresh
            </Button>
            <Button
              icon={<DownloadOutlined />}
              style={{ borderRadius: '12px' }}
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <Row gutter={[24, 24]} className='mb-8'>
        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
            <Statistic
              title='Total Items'
              value={stockMetrics.total}
              valueStyle={{ color: '#1890ff' }}
              prefix={<StockOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
            <Statistic
              title='Healthy Stock'
              value={stockMetrics.healthy}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleTwoTone twoToneColor='#52c41a' />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
            <Statistic
              title='Low Stock'
              value={stockMetrics.lowStock}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleTwoTone twoToneColor='#faad14' />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className='h-full bg-gradient-to-br from-red-50 to-red-100 border-red-200'>
            <Statistic
              title='Out of Stock'
              value={stockMetrics.outOfStock}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleTwoTone twoToneColor='#ff4d4f' />}
            />
          </Card>
        </Col>
      </Row>

      {/* Analytics Charts */}
      <Row gutter={[24, 24]} className='mb-8'>
        <Col xs={24} lg={12}>
          <Card
            title='Stock Distribution'
            className='h-full bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
          >
            {stockDistributionData.length > 0 ? (
              <Pie {...pieConfig} height={300} />
            ) : (
              <Empty description='No stock data available' />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title='Top Models by Stock Quantity'
            className='h-full bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
          >
            {topModelsData.length > 0 ? (
              <Column {...columnConfig} height={300} />
            ) : (
              <Empty description='No model data available' />
            )}
          </Card>
        </Col>
      </Row>

      {/* Stock Alerts */}
      {(stockMetrics.lowStock > 0 || stockMetrics.outOfStock > 0) && (
        <Alert
          message='Stock Level Warnings'
          description={
            <div>
              {stockMetrics.outOfStock > 0 && (
                <div className='text-red-600'>
                  ⚠️ {stockMetrics.outOfStock} items are out of stock
                </div>
              )}
              {stockMetrics.lowStock > 0 && (
                <div className='text-orange-600'>
                  📉 {stockMetrics.lowStock} items have low stock levels
                </div>
              )}
            </div>
          }
          type='warning'
          showIcon
          className='mb-6'
        />
      )}

      {/* Main Content */}
      <div className='bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-8'>
        {/* Filters and Search */}
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <Search
              placeholder='Search products...'
              style={{ width: 300 }}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder='Filter by Model'
              style={{ width: 150 }}
              allowClear
              onChange={setFilterModel}
            >
              {/* Add model options here */}
            </Select>
            <Select
              placeholder='Filter by Finish'
              style={{ width: 150 }}
              allowClear
              onChange={setFilterFinish}
            >
              {/* Add finish options here */}
            </Select>
            <Select
              placeholder='Filter by Size'
              style={{ width: 120 }}
              allowClear
              onChange={setFilterSize}
            >
              {/* Add size options here */}
            </Select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='mb-6'>
          <div className='flex flex-wrap gap-2'>
            {tabItems.map(tab => (
              <Button
                key={tab.key}
                type={activeTab === tab.key ? 'primary' : 'default'}
                onClick={() => setActiveTab(tab.key)}
                className='rounded-lg'
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stock Table */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey='id'
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
          }}
          scroll={{ x: 1200 }}
          className='stock-table'
        />
      </div>

      {/* Edit Stock Modal */}
      <Modal
        title='Update Stock Levels'
        open={editModalVisible}
        onOk={handleUpdateStock}
        onCancel={() => setEditModalVisible(false)}
        okText='Update Stock'
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            name='stock'
            label='In-House Stock'
            rules={[{ required: true, message: 'Please enter stock quantity' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder='Enter stock quantity'
            />
          </Form.Item>
          <Form.Item name='showroomStock' label='Showroom Stock'>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder='Enter showroom stock quantity'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default StockDashboard
