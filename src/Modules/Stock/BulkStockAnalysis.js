import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Select,
  InputNumber,
  Checkbox,
  Alert,
  Statistic,
  Tag,
  Progress,
  Space,
  Tooltip,
  Modal,
  Form,
  notification,
  Typography,
  Badge,
  Spin,
  Empty,
  Divider
} from 'antd'
import {
  PlayCircleOutlined,
  SettingOutlined,
  ExportOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  DollarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useBulkStockAnalysis } from '../../hooks/useStockAnalysis'
import { useSelector } from 'react-redux'

const { Title, Text } = Typography
const { Option } = Select

const BulkStockAnalysis = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [selectedProducts, setSelectedProducts] = useState([])
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [settings, setSettings] = useState({
    cushionMonths: 3,
    riskTolerance: 'medium',
    productType: 'alloy'
  })

  // Get available products from Redux store
  const { allAlloys, loading: productsLoading } = useSelector(
    state => state.stockDetails
  )

  const { data, loading, error, analyzeBulk, clearData, clearError } =
    useBulkStockAnalysis()

  const handleRunAnalysis = async () => {
    if (selectedProducts.length === 0) {
      notification.warning({
        message: 'No Products Selected',
        description: 'Please select at least one product to analyze.'
      })
      return
    }

    await analyzeBulk(selectedProducts, settings)
  }

  const handleSettingsUpdate = values => {
    setSettings(values)
    setSettingsVisible(false)
    notification.success({
      message: 'Settings Updated',
      description: 'Analysis settings have been updated.'
    })
  }

  const getUrgencyTag = urgency => {
    const configs = {
      critical: { color: 'red', icon: <ExclamationCircleOutlined /> },
      high: { color: 'orange', icon: <WarningOutlined /> },
      medium: { color: 'blue', icon: <ClockCircleOutlined /> },
      normal: { color: 'green', icon: <CheckCircleOutlined /> }
    }
    const config = configs[urgency] || configs.normal
    return (
      <Tag color={config.color} icon={config.icon}>
        {urgency?.toUpperCase()}
      </Tag>
    )
  }

  // Product selection table columns
  const productColumns = [
    {
      title: 'Select',
      key: 'select',
      render: (_, record) => (
        <Checkbox
          checked={selectedProducts.includes(record.id)}
          onChange={e => {
            if (e.target.checked) {
              setSelectedProducts([...selectedProducts, record.id])
            } else {
              setSelectedProducts(
                selectedProducts.filter(id => id !== record.id)
              )
            }
          }}
        />
      )
    },
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => (
        <div>
          <div className='font-medium'>{record.modelName || 'N/A'}</div>
          <div className='text-sm text-gray-500'>
            {record.inches}" • {record.finish}
          </div>
        </div>
      )
    },
    {
      title: 'Current Stock',
      dataIndex: 'inHouseStock',
      key: 'stock',
      render: stock => (
        <div className='text-center'>
          <div className='text-lg font-semibold'>{stock || 0}</div>
          <div className='text-xs text-gray-500'>units</div>
        </div>
      )
    },
    {
      title: 'Stock Status',
      key: 'status',
      render: (_, record) => {
        const stock = record.inHouseStock || 0
        if (stock === 0) return <Tag color='red'>Out of Stock</Tag>
        if (stock <= 10) return <Tag color='orange'>Low Stock</Tag>
        return <Tag color='green'>In Stock</Tag>
      }
    }
  ]

  // Analysis results table columns
  const resultsColumns = [
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => {
        if (!record.success) {
          return (
            <div>
              <div className='font-medium text-red-600'>
                ID: {record.productId}
              </div>
              <div className='text-sm text-red-500'>{record.error}</div>
            </div>
          )
        }
        return (
          <div>
            <div className='font-medium'>
              {record.analysis?.productInfo?.currentStock?.productName || 'N/A'}
            </div>
            <div className='text-sm text-gray-500'>ID: {record.productId}</div>
          </div>
        )
      }
    },
    {
      title: 'Current Stock',
      key: 'currentStock',
      render: (_, record) => {
        if (!record.success) return <Text type='secondary'>-</Text>
        return (
          <div className='text-center'>
            <div className='text-lg font-semibold'>
              {record.analysis?.productInfo?.currentStock?.totalStock || 0}
            </div>
            <div className='text-xs text-gray-500'>units</div>
          </div>
        )
      }
    },
    {
      title: 'Recommended Order',
      key: 'recommendedOrder',
      render: (_, record) => {
        if (!record.success) return <Text type='secondary'>-</Text>
        return (
          <div className='text-center'>
            <div className='text-lg font-semibold text-green-600'>
              {record.analysis?.recommendation?.recommendedOrderQuantity || 0}
            </div>
            <div className='text-xs text-gray-500'>units</div>
          </div>
        )
      }
    },
    {
      title: 'Urgency',
      key: 'urgency',
      render: (_, record) => {
        if (!record.success) return <Text type='secondary'>-</Text>
        return getUrgencyTag(record.analysis?.recommendation?.urgency)
      }
    },
    {
      title: 'Days Remaining',
      key: 'daysRemaining',
      render: (_, record) => {
        if (!record.success) return <Text type='secondary'>-</Text>
        const days = record.analysis?.recommendation?.daysOfStockRemaining
        return (
          <div className='text-center'>
            <div
              className={`text-lg font-semibold ${
                days <= 30
                  ? 'text-red-600'
                  : days <= 60
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}
            >
              {days || 0}
            </div>
            <div className='text-xs text-gray-500'>days</div>
          </div>
        )
      }
    },
    {
      title: 'Est. Cost',
      key: 'estimatedCost',
      render: (_, record) => {
        if (!record.success) return <Text type='secondary'>-</Text>
        return (
          <div className='text-center'>
            <div className='font-semibold'>
              $
              {(
                record.analysis?.recommendation?.costAnalysis
                  ?.estimatedOrderCost || 0
              ).toLocaleString()}
            </div>
          </div>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        if (!record.success) return null
        return (
          <Space>
            <Tooltip title='View Details'>
              <Button
                type='text'
                icon={<EyeOutlined />}
                onClick={() => navigate(`/stock-analysis/${record.productId}`)}
              />
            </Tooltip>
            <Tooltip title='Create Order'>
              <Button
                type='text'
                icon={<ShoppingCartOutlined />}
                onClick={() => {
                  // Handle create order logic
                  notification.info({
                    message: 'Create Order',
                    description: 'Order creation feature will be implemented.'
                  })
                }}
              />
            </Tooltip>
          </Space>
        )
      }
    }
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6'>
      {/* Header */}
      <div className='bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-8 mb-8'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0'>
          <div className='space-y-2'>
            <div className='flex items-center space-x-3'>
              <div className='w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center'>
                <BarChartOutlined className='text-white text-xl' />
              </div>
              <div>
                <h1 className='text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
                  📊 Bulk Stock Analysis
                </h1>
                <p className='text-gray-600 text-lg'>
                  Analyze multiple products simultaneously for comprehensive
                  planning
                </p>
              </div>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
              style={{ borderRadius: '12px' }}
            >
              Settings
            </Button>
            <Button
              type='primary'
              icon={<PlayCircleOutlined />}
              onClick={handleRunAnalysis}
              loading={loading}
              disabled={selectedProducts.length === 0}
              style={{ borderRadius: '12px' }}
            >
              Run Analysis ({selectedProducts.length} items)
            </Button>
            {data && (
              <Button
                icon={<ExportOutlined />}
                style={{ borderRadius: '12px' }}
              >
                Export Results
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <Card
        title='📦 Select Products for Analysis'
        className='mb-8 bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
        extra={
          <div className='flex items-center space-x-4'>
            <Button
              size='small'
              onClick={() =>
                setSelectedProducts(allAlloys?.map(p => p.id) || [])
              }
            >
              Select All
            </Button>
            <Button size='small' onClick={() => setSelectedProducts([])}>
              Clear All
            </Button>
            <Badge count={selectedProducts.length} showZero />
          </div>
        }
      >
        {productsLoading ? (
          <Spin tip='Loading products...' />
        ) : (
          <Table
            columns={productColumns}
            dataSource={allAlloys || []}
            rowKey='id'
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true
            }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      {/* Analysis Results */}
      {data && (
        <>
          {/* Summary Cards */}
          <Row gutter={[24, 24]} className='mb-8'>
            <Col xs={24} sm={12} lg={6}>
              <Card className='h-full bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
                <Statistic
                  title='Total Products'
                  value={data.summary.totalProducts}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className='h-full bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
                <Statistic
                  title='Successful Analyses'
                  value={data.summary.successfulAnalyses}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className='h-full bg-gradient-to-br from-red-50 to-red-100 border-red-200'>
                <Statistic
                  title='Critical Stock Items'
                  value={data.summary.criticalStockProducts}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className='h-full bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
                <Statistic
                  title='Total Order Value'
                  value={data.summary.totalRecommendedOrderValue}
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<DollarOutlined />}
                  precision={0}
                  formatter={value => `$${value.toLocaleString()}`}
                />
              </Card>
            </Col>
          </Row>

          {/* Critical Items Alert */}
          {data.summary.criticalStockProducts > 0 && (
            <Alert
              message='⚠️ Critical Stock Alert'
              description={`${data.summary.criticalStockProducts} products require immediate attention due to critical stock levels.`}
              type='warning'
              showIcon
              className='mb-8'
            />
          )}

          {/* Results Table */}
          <Card
            title='📋 Analysis Results'
            className='bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
            extra={
              <div className='flex items-center space-x-2'>
                <Text type='secondary'>
                  {data.summary.successfulAnalyses} of{' '}
                  {data.summary.totalProducts} analyzed
                </Text>
                <Progress
                  percent={
                    (data.summary.successfulAnalyses /
                      data.summary.totalProducts) *
                    100
                  }
                  size='small'
                  style={{ width: 100 }}
                />
              </div>
            }
          >
            <Table
              columns={resultsColumns}
              dataSource={data.analyses}
              rowKey='productId'
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`
              }}
              scroll={{ x: 1200 }}
              rowClassName={record => {
                if (!record.success) return 'bg-red-50'
                const urgency = record.analysis?.recommendation?.urgency
                if (urgency === 'critical') return 'bg-red-50'
                if (urgency === 'high') return 'bg-orange-50'
                return ''
              }}
            />
          </Card>
        </>
      )}

      {/* Error Display */}
      {error && (
        <Alert
          message='Analysis Failed'
          description={error}
          type='error'
          showIcon
          closable
          onClose={clearError}
          className='mb-8'
        />
      )}

      {/* Settings Modal */}
      <Modal
        title='Bulk Analysis Settings'
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout='vertical'
          initialValues={settings}
          onFinish={handleSettingsUpdate}
        >
          <Form.Item name='productType' label='Product Type'>
            <Select>
              <Option value='alloy'>Alloy Wheels</Option>
              <Option value='tyre'>Tyres</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name='cushionMonths'
            label='Cushion Months'
            help='Safety buffer period (1-12 months)'
          >
            <InputNumber min={1} max={12} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name='riskTolerance'
            label='Risk Tolerance'
            help='Conservative = low, Balanced = medium, Aggressive = high'
          >
            <Select>
              <Option value='low'>Low (Conservative)</Option>
              <Option value='medium'>Medium (Balanced)</Option>
              <Option value='high'>High (Aggressive)</Option>
            </Select>
          </Form.Item>

          <div className='flex justify-end space-x-2'>
            <Button onClick={() => setSettingsVisible(false)}>Cancel</Button>
            <Button type='primary' htmlType='submit'>
              Apply Settings
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default BulkStockAnalysis
