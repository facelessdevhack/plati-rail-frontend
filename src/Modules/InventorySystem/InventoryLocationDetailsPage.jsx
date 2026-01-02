import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  Tag,
  Statistic,
  Space,
  message,
  Badge,
  Spin,
  Empty,
  Breadcrumb,
  Input,
  Select,
  Typography,
  Descriptions,
  Tabs,
  Progress,
  Modal,
  Form,
  InputNumber,
  Radio
} from 'antd'
import {
  EnvironmentOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  ShopOutlined,
  InboxOutlined,
  DatabaseOutlined,
  SearchOutlined,
  BoxPlotOutlined,
  SwapOutlined,
  FilterOutlined,
  PlusOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { client } from '../../Utils/axiosClient'
import AddInventoryToLocationModal from './AddInventoryToLocationModal'
import TransferInventoryModal from './TransferInventoryModal'
import ManageStorageAreasModal from './ManageStorageAreasModal'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input

const InventoryLocationDetailsPage = () => {
  const { locationId } = useParams()
  const navigate = useNavigate()

  const [location, setLocation] = useState(null)
  const [inventory, setInventory] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('inventory')

  // Filters
  const [searchText, setSearchText] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState(null)

  // Modals
  const [addInventoryModalVisible, setAddInventoryModalVisible] =
    useState(false)
  const [transferModalVisible, setTransferModalVisible] = useState(false)
  const [storageAreasModalVisible, setStorageAreasModalVisible] =
    useState(false)

  // Adjustment Modal
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false)
  const [adjustmentLoading, setAdjustmentLoading] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null)
  const [adjustmentForm] = Form.useForm()

  const fetchLocationDetails = useCallback(async () => {
    setLoading(true)
    try {
      const response = await client.get('/inventory/internal/locations')
      const locations = response.data.data || []
      const found = locations.find(loc => loc.id === parseInt(locationId))
      if (found) {
        setLocation(found)
      } else {
        message.error('Location not found')
        navigate('/inventory-locations')
      }
    } catch (error) {
      message.error('Failed to fetch location details')
      console.error('Error fetching location:', error)
    } finally {
      setLoading(false)
    }
  }, [locationId, navigate])

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true)
    try {
      const response = await client.get(
        `/inventory/internal/locations/${locationId}/inventory`
      )
      setInventory(response.data.data?.inventory_items || [])
    } catch (error) {
      message.error('Failed to fetch inventory')
      console.error('Error fetching inventory:', error)
    } finally {
      setInventoryLoading(false)
    }
  }, [locationId])

  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true)
    try {
      const response = await client.get('/inventory/internal/movements', {
        params: { locationId, limit: 100 }
      })
      setMovements(response.data.data?.movements || [])
    } catch (error) {
      message.error('Failed to fetch movements')
      console.error('Error fetching movements:', error)
    } finally {
      setMovementsLoading(false)
    }
  }, [locationId])

  useEffect(() => {
    fetchLocationDetails()
    fetchInventory()
  }, [fetchLocationDetails, fetchInventory])

  useEffect(() => {
    if (activeTab === 'movements' && movements.length === 0) {
      fetchMovements()
    }
  }, [activeTab, movements.length, fetchMovements])

  const getLocationTypeColor = type => {
    const colors = {
      warehouse: 'blue',
      production: 'green',
      storage: 'orange'
    }
    return colors[type] || 'default'
  }

  const getLocationTypeIcon = type => {
    const icons = {
      warehouse: <ShopOutlined />,
      production: <DatabaseOutlined />,
      storage: <InboxOutlined />
    }
    return icons[type] || <EnvironmentOutlined />
  }

  const getMovementTypeConfig = type => {
    const config = {
      in: { color: 'green', label: 'Stock In' },
      out: { color: 'red', label: 'Stock Out' },
      transfer_in: { color: 'cyan', label: 'Transfer In' },
      transfer_out: { color: 'orange', label: 'Transfer Out' },
      adjustment: { color: 'purple', label: 'Adjustment' },
      reservation: { color: 'gold', label: 'Reservation' },
      release: { color: 'lime', label: 'Release' }
    }
    return config[type] || { color: 'default', label: type }
  }

  // Adjustment Modal Handlers
  const openAdjustmentModal = record => {
    setSelectedInventoryItem(record)
    adjustmentForm.setFieldsValue({
      productType: record.productType,
      productId: record.productId,
      adjustmentType: 'increase',
      quantity: 1,
      reason: '',
      notes: ''
    })
    setAdjustmentModalVisible(true)
  }

  const handleAdjustmentSubmit = async () => {
    try {
      const values = await adjustmentForm.validateFields()
      setAdjustmentLoading(true)

      await client.post('/inventory/internal/adjustment', {
        productType: values.productType,
        productId: values.productId,
        adjustmentType: values.adjustmentType,
        quantity: values.quantity,
        reason: values.reason,
        notes: values.notes
      })

      message.success('Inventory adjustment completed successfully')
      setAdjustmentModalVisible(false)
      adjustmentForm.resetFields()
      setSelectedInventoryItem(null)
      fetchInventory()
      if (activeTab === 'movements') {
        fetchMovements()
      }
    } catch (error) {
      console.error('Adjustment error:', error)
      message.error(
        error.response?.data?.message || 'Failed to create adjustment'
      )
    } finally {
      setAdjustmentLoading(false)
    }
  }

  // Filter inventory based on search and product type
  const filteredInventory = inventory.filter(item => {
    // Backend adds product_details (snake_case), handle both cases
    const details = item.productDetails || item.product_details
    const productName =
      item.productType === 'alloy'
        ? details?.productName || details?.product_name || ''
        : details?.brand
        ? `${details.brand} ${details.size || ''}`
        : ''

    const matchesSearch =
      !searchText ||
      item.productId?.toString().includes(searchText) ||
      item.productType?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.areaName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.positionName?.toLowerCase().includes(searchText.toLowerCase()) ||
      productName.toLowerCase().includes(searchText.toLowerCase())

    const matchesProductType =
      !productTypeFilter || item.productType === productTypeFilter

    return matchesSearch && matchesProductType
  })

  // Calculate stats
  const inventoryStats = {
    totalItems: inventory.reduce((sum, item) => sum + (item.quantity || 0), 0),
    totalReserved: inventory.reduce(
      (sum, item) => sum + (item.reservedQuantity || 0),
      0
    ),
    totalAvailable: inventory.reduce(
      (sum, item) => sum + (item.availableQuantity || 0),
      0
    ),
    uniqueProducts: new Set(
      inventory.map(item => `${item.productType}-${item.productId}`)
    ).size,
    alloyCount: inventory.filter(item => item.productType === 'alloy').length,
    tyreCount: inventory.filter(item => item.productType === 'tyre').length
  }

  const inventoryColumns = [
    {
      title: 'Product',
      key: 'product',
      render: record => {
        // Backend adds product_details (snake_case), handle both cases
        const details = record.productDetails || record.product_details
        const productName =
          record.productType === 'alloy'
            ? details?.productName || details?.product_name
            : details?.brand
            ? `${details.brand} ${details.size || ''}`.trim()
            : null

        return (
          <div>
            <div style={{ marginBottom: '4px' }}>
              <Tag color={record.productType === 'alloy' ? 'blue' : 'green'}>
                {record.productType?.toUpperCase()}
              </Tag>
              <span
                style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}
              >
                #{record.productId}
              </span>
            </div>
            {productName && (
              <div style={{ fontWeight: 500, fontSize: '13px' }}>
                {productName}
              </div>
            )}
          </div>
        )
      },
      width: 280
    },
    {
      title: 'Storage Location',
      key: 'storage',
      render: record => (
        <div>
          {record.areaName ? (
            <>
              <div style={{ fontWeight: 500 }}>{record.areaName}</div>
              {record.positionName && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Position: {record.positionName}
                </div>
              )}
            </>
          ) : (
            <Text type='secondary'>Default Area</Text>
          )}
        </div>
      ),
      width: 180
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: record => (
        <div>
          <div
            style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}
          >
            {record.quantity || 0}
          </div>
        </div>
      ),
      width: 100,
      align: 'center'
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reserved',
      render: val => (
        <Tag color={val > 0 ? 'orange' : 'default'}>{val || 0}</Tag>
      ),
      width: 100,
      align: 'center'
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'available',
      render: val => <Tag color={val > 0 ? 'green' : 'red'}>{val || 0}</Tag>,
      width: 100,
      align: 'center'
    },
    {
      title: 'Cost/Unit',
      dataIndex: 'costPerUnit',
      key: 'costPerUnit',
      render: val => (val ? `₹${parseFloat(val).toLocaleString()}` : '-'),
      width: 120,
      align: 'right'
    },
    {
      title: 'Total Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      render: val => (val ? `₹${parseFloat(val).toLocaleString()}` : '-'),
      width: 140,
      align: 'right'
    },
    {
      title: 'Action',
      key: 'action',
      render: record => (
        <Button
          type='link'
          size='small'
          onClick={() => openAdjustmentModal(record)}
        >
          Adjust
        </Button>
      ),
      width: 80,
      align: 'center',
      fixed: 'right'
    }
  ]

  const movementsColumns = [
    {
      title: 'Date/Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => (date ? new Date(date).toLocaleString() : '-'),
      width: 170
    },
    {
      title: 'Type',
      dataIndex: 'movementType',
      key: 'movementType',
      render: type => {
        const config = getMovementTypeConfig(type)
        return <Tag color={config.color}>{config.label}</Tag>
      },
      width: 120
    },
    {
      title: 'Product',
      key: 'product',
      render: record => (
        <div>
          <Tag
            color={record.productType === 'alloy' ? 'blue' : 'green'}
            style={{ marginRight: '4px' }}
          >
            {record.productType?.toUpperCase()}
          </Tag>
          <span>#{record.productId}</span>
        </div>
      ),
      width: 150
    },
    {
      title: 'Change',
      dataIndex: 'quantityChange',
      key: 'quantityChange',
      render: (val, record) => {
        const isPositive = ['in', 'transfer_in', 'release'].includes(
          record.movementType
        )
        return (
          <span
            style={{
              fontWeight: 'bold',
              color: isPositive ? '#52c41a' : '#ff4d4f',
              fontSize: '14px'
            }}
          >
            {isPositive ? '+' : '-'}
            {Math.abs(val)}
          </span>
        )
      },
      width: 100,
      align: 'center'
    },
    {
      title: 'Previous → New',
      key: 'quantity_change',
      render: record => (
        <span style={{ color: '#666' }}>
          {record.previousQuantity} → {record.newQuantity}
        </span>
      ),
      width: 120
    },
    {
      title: 'Reference',
      key: 'reference',
      render: record => (
        <div>
          <Tag>{record.referenceType || 'N/A'}</Tag>
          {record.referenceId && (
            <span
              style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}
            >
              #{record.referenceId}
            </span>
          )}
        </div>
      ),
      width: 150
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      width: 200
    }
  ]

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size='large' />
      </div>
    )
  }

  if (!location) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description='Location not found' />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button
            type='primary'
            onClick={() => navigate('/inventory-locations')}
          >
            Back to Locations
          </Button>
        </div>
      </div>
    )
  }

  const tabItems = [
    {
      key: 'inventory',
      label: (
        <span>
          <BoxPlotOutlined />
          Inventory ({inventory.length})
        </span>
      ),
      children: (
        <div>
          {/* Filters */}
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={8}>
              <Search
                placeholder='Search by product name, ID, type, area...'
                allowClear
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder='Filter by product type'
                allowClear
                style={{ width: '100%' }}
                value={productTypeFilter}
                onChange={setProductTypeFilter}
              >
                <Option value='alloy'>Alloy</Option>
                <Option value='tyre'>Tyre</Option>
              </Select>
            </Col>
            <Col span={10} style={{ textAlign: 'right' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchInventory}
                loading={inventoryLoading}
              >
                Refresh
              </Button>
            </Col>
          </Row>

          {/* Inventory Table */}
          <Table
            columns={inventoryColumns}
            dataSource={filteredInventory}
            rowKey='id'
            loading={inventoryLoading}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: total => `Total ${total} items`
            }}
            locale={{
              emptyText: (
                <Empty description='No inventory items in this location' />
              )
            }}
            size='middle'
          />
        </div>
      )
    },
    {
      key: 'movements',
      label: (
        <span>
          <SwapOutlined />
          Recent Movements ({movements.length})
        </span>
      ),
      children: (
        <div>
          <Row style={{ marginBottom: '16px' }}>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchMovements}
                loading={movementsLoading}
              >
                Refresh
              </Button>
            </Col>
          </Row>

          <Table
            columns={movementsColumns}
            dataSource={movements}
            rowKey='id'
            loading={movementsLoading}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: total => `Total ${total} movements`
            }}
            locale={{
              emptyText: (
                <Empty description='No movements recorded for this location' />
              )
            }}
            size='middle'
          />
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item>
          <Link to='/inventory-locations'>Inventory Locations</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{location.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify='space-between' align='middle'>
          <Col>
            <Space align='center'>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/inventory-locations')}
              />
              <div>
                <Title
                  level={3}
                  style={{ margin: 0, display: 'flex', alignItems: 'center' }}
                >
                  {getLocationTypeIcon(location.locationType)}
                  <span style={{ marginLeft: '12px' }}>{location.name}</span>
                  <Tag
                    color={getLocationTypeColor(location.locationType)}
                    style={{ marginLeft: '12px' }}
                  >
                    {location.locationType?.toUpperCase()}
                  </Tag>
                  <Badge
                    status={location.isActive ? 'success' : 'error'}
                    text={location.isActive ? 'Active' : 'Inactive'}
                    style={{ marginLeft: '12px' }}
                  />
                </Title>
                {location.description && (
                  <Text
                    type='secondary'
                    style={{ marginTop: '4px', display: 'block' }}
                  >
                    {location.description}
                  </Text>
                )}
                {location.address && (
                  <Text
                    type='secondary'
                    style={{ fontSize: '12px', display: 'block' }}
                  >
                    <EnvironmentOutlined /> {location.address}
                  </Text>
                )}
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => setAddInventoryModalVisible(true)}
              >
                Add Inventory
              </Button>
              <Button
                icon={<SwapOutlined />}
                onClick={() => setTransferModalVisible(true)}
                disabled={inventory.length === 0}
              >
                Transfer
              </Button>
              <Button
                icon={<AppstoreOutlined />}
                onClick={() => setStorageAreasModalVisible(true)}
              >
                Storage Areas
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchLocationDetails()
                  fetchInventory()
                }}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card size='small'>
            <Statistic
              title='Total Items'
              value={inventoryStats.totalItems}
              prefix={<BoxPlotOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size='small'>
            <Statistic
              title='Available'
              value={inventoryStats.totalAvailable}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size='small'>
            <Statistic
              title='Reserved'
              value={inventoryStats.totalReserved}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size='small'>
            <Statistic
              title='Unique Products'
              value={inventoryStats.uniqueProducts}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size='small'>
            <Statistic
              title='Alloys'
              value={inventoryStats.alloyCount}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size='small'>
            <Statistic
              title='Tyres'
              value={inventoryStats.tyreCount}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Location Details Card */}
      <Card size='small' style={{ marginBottom: '24px' }}>
        <Descriptions column={4} size='small'>
          <Descriptions.Item label='Storage Areas'>
            {location.areas?.length || 0} areas
          </Descriptions.Item>
          <Descriptions.Item label='Created'>
            {location.createdAt
              ? new Date(location.createdAt).toLocaleDateString()
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Last Updated'>
            {location.updatedAt
              ? new Date(location.updatedAt).toLocaleDateString()
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Utilization'>
            <Progress
              percent={
                inventoryStats.totalItems > 0
                  ? Math.min(
                      100,
                      Math.round((inventoryStats.totalItems / 1000) * 100)
                    )
                  : 0
              }
              size='small'
              style={{ width: '120px' }}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tabs for Inventory and Movements */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* Add Inventory Modal */}
      <AddInventoryToLocationModal
        visible={addInventoryModalVisible}
        onCancel={() => setAddInventoryModalVisible(false)}
        onSuccess={() => {
          setAddInventoryModalVisible(false)
          fetchInventory()
          fetchLocationDetails()
        }}
        locationId={locationId}
        locationName={location?.name}
        storageAreas={location?.areas || []}
      />

      {/* Transfer Inventory Modal */}
      <TransferInventoryModal
        visible={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        onSuccess={() => {
          setTransferModalVisible(false)
          fetchInventory()
          fetchLocationDetails()
          if (activeTab === 'movements') {
            fetchMovements()
          }
        }}
        sourceLocationId={locationId}
        sourceLocationName={location?.name}
        inventoryItems={inventory}
      />

      {/* Manage Storage Areas Modal */}
      <ManageStorageAreasModal
        visible={storageAreasModalVisible}
        onCancel={() => setStorageAreasModalVisible(false)}
        onSuccess={() => {
          fetchLocationDetails()
        }}
        locationId={locationId}
        locationName={location?.name}
        storageAreas={location?.areas || []}
      />

      {/* Inventory Adjustment Modal */}
      <Modal
        title='Manual Inventory Adjustment'
        open={adjustmentModalVisible}
        onCancel={() => {
          setAdjustmentModalVisible(false)
          adjustmentForm.resetFields()
          setSelectedInventoryItem(null)
        }}
        footer={null}
        width={500}
        destroyOnClose
      >
        <Form
          form={adjustmentForm}
          layout='vertical'
          onFinish={handleAdjustmentSubmit}
        >
          <Form.Item label='Product'>
            <Input
              value={
                selectedInventoryItem
                  ? `${selectedInventoryItem.productType?.toUpperCase()} #${selectedInventoryItem.productId} - ${
                      (selectedInventoryItem.productDetails ||
                        selectedInventoryItem.product_details)?.productName ||
                      (selectedInventoryItem.productDetails ||
                        selectedInventoryItem.product_details)?.product_name ||
                      (selectedInventoryItem.productDetails ||
                        selectedInventoryItem.product_details)?.brand ||
                      'Unknown'
                    }`
                  : ''
              }
              disabled
            />
          </Form.Item>

          <Form.Item name='productType' hidden>
            <Input />
          </Form.Item>

          <Form.Item name='productId' hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name='adjustmentType'
            label='Adjustment Type'
            rules={[
              { required: true, message: 'Please select adjustment type' }
            ]}
          >
            <Radio.Group>
              <Radio.Button value='increase'>
                <span style={{ color: '#52c41a' }}>+ Increase Stock</span>
              </Radio.Button>
              <Radio.Button value='decrease'>
                <span style={{ color: '#ff4d4f' }}>- Decrease Stock</span>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name='quantity'
            label='Quantity'
            rules={[
              { required: true, message: 'Please enter quantity' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1' }
            ]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder='Enter quantity to adjust'
            />
          </Form.Item>

          <Form.Item
            name='reason'
            label='Reason for Adjustment'
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <Select placeholder='Select reason for adjustment'>
              <Option value='Stock Count Correction'>
                Stock Count Correction
              </Option>
              <Option value='Damaged Goods'>Damaged Goods</Option>
              <Option value='Lost/Missing'>Lost/Missing</Option>
              <Option value='Found Stock'>Found Stock</Option>
              <Option value='System Error Correction'>
                System Error Correction
              </Option>
              <Option value='Return to Supplier'>Return to Supplier</Option>
              <Option value='Quality Issue'>Quality Issue</Option>
              <Option value='Other'>Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name='notes' label='Additional Notes'>
            <Input.TextArea
              rows={3}
              placeholder='Enter any additional details about this adjustment...'
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setAdjustmentModalVisible(false)
                  adjustmentForm.resetFields()
                  setSelectedInventoryItem(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type='primary'
                htmlType='submit'
                loading={adjustmentLoading}
              >
                Submit Adjustment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InventoryLocationDetailsPage
