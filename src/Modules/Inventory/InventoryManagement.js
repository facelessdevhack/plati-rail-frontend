import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Tooltip,
  Badge,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
  Tabs,
  Alert,
  message,
  Switch
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  LineChartOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BuildOutlined,
  RocketOutlined
} from '@ant-design/icons'
import {
  useInventory,
  useStockManagement,
  useStockAnalysis
} from '../../hooks/useInventory'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs
const { Search } = Input

const InventoryManagement = () => {
  const { inventory, loading, error, refetch } = useInventory()
  const {
    updateStock,
    batchUpdateStock,
    addInventory,
    loading: managementLoading
  } = useStockManagement()
  const {
    getStockEstimation,
    bulkStockAnalysis,
    loading: analysisLoading
  } = useStockAnalysis()

  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [updateModalVisible, setUpdateModalVisible] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false)
  const [batchUpdateModalVisible, setBatchUpdateModalVisible] = useState(false)
  const [productionRequestModalVisible, setProductionRequestModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [productionRequestLoading, setProductionRequestLoading] = useState(false)
  
  // Filter and search state
  const [searchText, setSearchText] = useState('')
  const [selectedInches, setSelectedInches] = useState(null)
  const [selectedPcd, setSelectedPcd] = useState(null)
  const [selectedProductType, setSelectedProductType] = useState(null)
  
  // Master data state
  const [inchesOptions, setInchesOptions] = useState([])
  const [pcdOptions, setPcdOptions] = useState([])
  const [masterDataLoading, setMasterDataLoading] = useState(false)

  const [updateForm] = Form.useForm()
  const [addForm] = Form.useForm()
  const [analysisForm] = Form.useForm()
  const [batchForm] = Form.useForm()
  const [productionRequestForm] = Form.useForm()

  // Filter inventory data
  const filteredInventory = React.useMemo(() => {
    if (!inventory.length) return []
    
    return inventory.filter(item => {
      // Search text filter
      const matchesSearch = !searchText || 
        item.productName?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.color?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.uniqueId?.toLowerCase().includes(searchText.toLowerCase())
      
      // Product type filter
      const matchesProductType = !selectedProductType || item.productType === selectedProductType
      
      // Size filter
      const matchesInches = !selectedInches || 
        item.size === selectedInches || 
        item.inches === selectedInches ||  
        item.size?.toString() === selectedInches?.toString()
      
      // PCD filter
      const matchesPcd = !selectedPcd || 
        item.pcd === selectedPcd || 
        item.pcd?.toString() === selectedPcd?.toString()
      
      return matchesSearch && matchesProductType && matchesInches && matchesPcd
    })
  }, [inventory, searchText, selectedProductType, selectedInches, selectedPcd])
  
  // Generate filter options from inventory data
  useEffect(() => {
    if (inventory.length > 0) {
      setMasterDataLoading(true)
      
      // Generate unique sizes for filter
      const uniqueSizes = [...new Set(inventory.map(item => item.size || item.inches).filter(Boolean))]
      const sizeOptions = uniqueSizes.sort((a, b) => {
        // Try to sort numerically if possible, otherwise alphabetically
        const numA = parseFloat(a)
        const numB = parseFloat(b)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB
        }
        return a.toString().localeCompare(b.toString())
      }).map(size => ({ label: size, value: size }))
      
      setInchesOptions(sizeOptions)
      
      // Generate unique PCD values for filter
      const uniquePcds = [...new Set(inventory.map(item => item.pcd).filter(Boolean))]
      const pcdOptions = uniquePcds.sort((a, b) => {
        // Try to sort numerically if possible, otherwise alphabetically
        const numA = parseFloat(a)
        const numB = parseFloat(b)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB
        }
        return a.toString().localeCompare(b.toString())
      }).map(pcd => ({ label: pcd, value: pcd }))
      
      setPcdOptions(pcdOptions)
      
      setMasterDataLoading(false)
    }
  }, [inventory])

  // Calculate statistics (based on filtered data)
  const stats = React.useMemo(() => {
    if (!filteredInventory.length)
      return { total: 0, lowStock: 0, totalValue: 0, outOfStock: 0 }

    const total = filteredInventory.length
    const lowStock = filteredInventory.filter(
      item => {
        const stock = parseInt(item.inHouseStock || 0)
        return stock > 0 && stock < 10
      }
    ).length
    const outOfStock = filteredInventory.filter(
      item => parseInt(item.inHouseStock || 0) === 0
    ).length
    const totalValue = filteredInventory.reduce(
      (sum, item) => {
        const price = parseFloat(item.price || 0)
        const stock = parseInt(item.inHouseStock || 0)
        return sum + (price * stock)
      },
      0
    )

    return { total, lowStock, totalValue, outOfStock }
  }, [filteredInventory])
  
  const clearFilters = () => {
    setSearchText('')
    setSelectedProductType(null)
    setSelectedInches(null)
    setSelectedPcd(null)
  }

  const handleUpdateStock = record => {
    setSelectedItem(record)
    updateForm.setFieldsValue({
      alloyId: record.id,
      inHouseStock: record.inHouseStock,
      operation: 'set'
    })
    setUpdateModalVisible(true)
  }

  const handleStockAnalysis = record => {
    setSelectedItem(record)
    analysisForm.setFieldsValue({
      productId: record.id,
      productType: 'alloy',
      cushionMonths: 3,
      riskTolerance: 'medium',
      forecastPeriod: 6,
      includeSeasonality: true,
      aiEnhanced: false
    })
    setAnalysisModalVisible(true)
  }

  const handleProductionRequest = record => {
    setSelectedItem(record)
    productionRequestForm.setFieldsValue({
      alloyId: record.id,
      convertId: record.id, // Default to same alloy
      quantity: 10, // Default quantity
      urgent: false,
      customSteps: [],
      presetName: null
    })
    setProductionRequestModalVisible(true)
  }

  const handleBulkAnalysis = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select items for bulk analysis')
      return
    }

    try {
      const result = await bulkStockAnalysis(selectedRowKeys, {
        productType: 'alloy',
        cushionMonths: 3,
        riskTolerance: 'medium'
      })
      setAnalysisData(result)
      setAnalysisModalVisible(true)
    } catch (error) {
      console.error('Bulk analysis failed:', error)
    }
  }

  const onUpdateFinish = async values => {
    try {
      await updateStock(
        values.alloyId,
        {
          inHouseStock: values.inHouseStock
        },
        values.operation
      )

      setUpdateModalVisible(false)
      updateForm.resetFields()
      refetch()
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  const onAddFinish = async values => {
    try {
      await addInventory(values)
      setAddModalVisible(false)
      addForm.resetFields()
      refetch()
    } catch (error) {
      console.error('Add inventory failed:', error)
    }
  }

  const onAnalysisFinish = async values => {
    try {
      const result = await getStockEstimation(values)
      setAnalysisData(result)
    } catch (error) {
      console.error('Analysis failed:', error)
    }
  }

  const onBatchUpdateFinish = async values => {
    try {
      const updates = selectedRowKeys.map(id => ({
        alloyId: id,
        inHouseStock: values.inHouseStock
      }))

      await batchUpdateStock(updates, values.operation)
      setBatchUpdateModalVisible(false)
      batchForm.resetFields()
      setSelectedRowKeys([])
      refetch()
    } catch (error) {
      console.error('Batch update failed:', error)
    }
  }

  const onProductionRequestFinish = async values => {
    try {
      setProductionRequestLoading(true)
      
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'http://localhost:4000/v2/production/add-production-plan',
        values,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        message.success(`Production plan created successfully! Plan ID: ${response.data.data.planId}`)
        setProductionRequestModalVisible(false)
        productionRequestForm.resetFields()
        // Optionally refresh inventory data
        refetch()
      } else {
        message.error('Failed to create production plan: ' + response.data.message)
      }
    } catch (error) {
      console.error('Production request failed:', error)
      message.error('Failed to create production plan: ' + (error.response?.data?.message || error.message))
    } finally {
      setProductionRequestLoading(false)
    }
  }

  const getStockStatus = (inHouse, showroom = 0) => {
    const inHouseStock = parseInt(inHouse || 0)
    const showroomStock = parseInt(showroom || 0)
    const total = inHouseStock + showroomStock
    
    if (total === 0) return { status: 'error', text: 'Out of Stock' }
    if (total < 10) return { status: 'warning', text: 'Low Stock' }
    return { status: 'success', text: 'In Stock' }
  }

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      width: 250,
      render: (text, record) => (
        <div>
          <Text strong>{text || 'N/A'}</Text>
          <br />
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {record.brand || record.model || 'N/A'} | {record.pcd || 'N/A'} PCD
          </Text>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'productType',
      key: 'productType',
      width: 80,
      sorter: (a, b) => (a.productType || '').localeCompare(b.productType || ''),
      render: text => {
        const colorMap = {
          alloy: 'blue',
          tyre: 'green', 
          ppf: 'purple',
          caps: 'orange'
        }
        return (
          <Tag color={colorMap[text] || 'default'}>
            {text ? text.toUpperCase() : 'N/A'}
          </Tag>
        )
      }
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 80,
      sorter: (a, b) => {
        // Extract numeric value from size (e.g., "18"" -> 18)
        const aSize = parseInt(a.size) || 0
        const bSize = parseInt(b.size) || 0
        return aSize - bSize
      },
      render: text => (
        <Tag color="blue">{text || 'N/A'}</Tag>
      )
    },
    {
      title: 'In-House Stock',
      dataIndex: 'inHouseStock',
      key: 'inHouseStock',
      width: 120,
      sorter: (a, b) => {
        const aStock = parseInt(a.inHouseStock) || 0
        const bStock = parseInt(b.inHouseStock) || 0
        return aStock - bStock
      },
      sortDirections: ['descend', 'ascend'],
      render: text => {
        const stock = parseInt(text) || 0
        return (
          <Badge 
            count={stock} 
            showZero={true}
            overflowCount={999999}
            style={{ 
              backgroundColor: stock > 0 ? '#52c41a' : '#ff4d4f' 
            }} 
          />
        )
      }
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: text => {
        const price = parseFloat(text) || 0
        return price > 0 ? `₹${price.toLocaleString()}` : 'N/A'
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const stockStatus = getStockStatus(
          record.inHouseStock,
          record.showroomStock
        )
        return (
          <Tag
            color={
              stockStatus.status === 'error'
                ? 'red'
                : stockStatus.status === 'warning'
                ? 'orange'
                : 'green'
            }
            icon={
              stockStatus.status === 'error' ? (
                <CloseCircleOutlined />
              ) : stockStatus.status === 'warning' ? (
                <WarningOutlined />
              ) : (
                <CheckCircleOutlined />
              )
            }
          >
            {stockStatus.text}
          </Tag>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space>
          <Tooltip title='Update Stock'>
            <Button
              type='primary'
              size='small'
              icon={<EditOutlined />}
              onClick={() => handleUpdateStock(record)}
            />
          </Tooltip>
          <Tooltip title='Stock Analysis'>
            <Button
              type='default'
              size='small'
              icon={<LineChartOutlined />}
              onClick={() => handleStockAnalysis(record)}
            />
          </Tooltip>
          <Tooltip title='Request Production'>
            <Button
              type='default'
              size='small'
              icon={<BuildOutlined />}
              onClick={() => handleProductionRequest(record)}
              style={{ 
                color: '#1890ff', 
                borderColor: '#1890ff' 
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE
    ]
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2}>Inventory Management</Title>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Products'
              value={stats.total}
              prefix={<Badge status='processing' />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Low Stock Items'
              value={stats.lowStock}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: stats.lowStock > 0 ? '#faad14' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Out of Stock'
              value={stats.outOfStock}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{
                color: stats.outOfStock > 0 ? '#ff4d4f' : '#3f8600'
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Inventory Value'
              value={stats.totalValue}
              prefix='₹'
              precision={0}
              formatter={value => value.toLocaleString()}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align='middle'>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder='Search by product name, model, or color...'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              enterButton
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              placeholder='Product Type'
              value={selectedProductType}
              onChange={setSelectedProductType}
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: 'Alloys', value: 'alloy' },
                { label: 'Tyres', value: 'tyre' },
                { label: 'PPF', value: 'ppf' },
                { label: 'Caps', value: 'caps' }
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              placeholder='Filter by Sizes'
              value={selectedInches}
              onChange={setSelectedInches}
              allowClear
              loading={masterDataLoading}
              style={{ width: '100%' }}
              options={inchesOptions}
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              placeholder='Filter by PCD'
              value={selectedPcd}
              onChange={setSelectedPcd}
              allowClear
              loading={masterDataLoading}
              style={{ width: '100%' }}
              options={pcdOptions}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button onClick={clearFilters}>
                Clear Filters
              </Button>
              <Text type='secondary'>
                {filteredInventory.length} of {inventory.length} products
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Card>
        <div
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Space>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              Add Inventory
            </Button>
            <Button
              type='default'
              icon={<ReloadOutlined />}
              onClick={refetch}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>

          <Space>
            {selectedRowKeys.length > 0 && (
              <>
                <Button
                  type='default'
                  icon={<EditOutlined />}
                  onClick={() => setBatchUpdateModalVisible(true)}
                >
                  Batch Update ({selectedRowKeys.length})
                </Button>
                <Button
                  type='default'
                  icon={<LineChartOutlined />}
                  onClick={handleBulkAnalysis}
                  loading={analysisLoading}
                >
                  Bulk Analysis ({selectedRowKeys.length})
                </Button>
                <Button
                  type='default'
                  icon={<BuildOutlined />}
                  onClick={() => {
                    if (selectedRowKeys.length === 0) {
                      message.warning('Please select items for bulk production request')
                      return
                    }
                    message.info(`Bulk production request for ${selectedRowKeys.length} items - Feature coming soon!`)
                  }}
                  style={{ 
                    color: '#52c41a', 
                    borderColor: '#52c41a' 
                  }}
                >
                  Bulk Production ({selectedRowKeys.length})
                </Button>
              </>
            )}
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button icon={<ImportOutlined />}>Import</Button>
          </Space>
        </div>

        {error && (
          <Alert
            message='Error'
            description={error}
            type='error'
            closable
            style={{ marginBottom: '16px' }}
          />
        )}

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredInventory}
          rowKey='id'
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Update Stock Modal */}
      <Modal
        title='Update Stock'
        open={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false)
          updateForm.resetFields()
        }}
        onOk={() => updateForm.submit()}
        confirmLoading={managementLoading}
      >
        <Form form={updateForm} layout='vertical' onFinish={onUpdateFinish}>
          <Form.Item name='alloyId' hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label='Operation Type'
            name='operation'
            rules={[
              { required: true, message: 'Please select operation type' }
            ]}
          >
            <Select>
              <Option value='set'>Set Stock</Option>
              <Option value='add'>Add Stock</Option>
              <Option value='subtract'>Subtract Stock</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='In-House Stock'
                name='inHouseStock'
                rules={[
                  { required: true, message: 'Please enter in-house stock' }
                ]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Add Inventory Modal */}
      <Modal
        title='Add New Inventory Item'
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false)
          addForm.resetFields()
        }}
        onOk={() => addForm.submit()}
        confirmLoading={managementLoading}
        width={800}
      >
        <Form form={addForm} layout='vertical' onFinish={onAddFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Product Type'
                name='productType'
                rules={[{ required: true, message: 'Please select product type' }]}
              >
                <Select
                  placeholder='Select product type'
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    // Reset form when product type changes
                    addForm.setFieldsValue({
                      productName: '',
                      model: '',
                      size: '',
                      price: ''
                    })
                  }}
                >
                  <Option value='alloy'>Alloy Wheels</Option>
                  <Option value='tyre'>Tyres</Option>
                  <Option value='ppf'>PPF (Paint Protection Film)</Option>
                  <Option value='caps'>Caps & Accessories</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Product Name'
                name='productName'
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input placeholder='e.g., PY-8533 18" FLAT SILVER' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label='Model/Brand'
                name='model'
                rules={[{ required: true, message: 'Please enter model/brand' }]}
              >
                <Input placeholder='e.g., PY-8533, Michelin' />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label='Size'
                name='size'
                rules={[{ required: true, message: 'Please enter size' }]}
              >
                <Input placeholder='e.g., 18", 225/45R18' />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label='Price (₹)'
                name='price'
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder='0'
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Initial Stock Quantity'
                name='quantity'
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder='0'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Color/Finish'
                name='color'
              >
                <Input placeholder='e.g., Silver, Black, Chrome' />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label='Additional Notes'
            name='notes'
          >
            <Input.TextArea 
              rows={2} 
              placeholder='Any additional specifications or notes...'
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Stock Analysis Modal */}
      <Modal
        title='Stock Analysis & Estimation'
        open={analysisModalVisible}
        onCancel={() => {
          setAnalysisModalVisible(false)
          setAnalysisData(null)
          analysisForm.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Tabs defaultActiveKey='1'>
          <TabPane tab='Analysis Parameters' key='1'>
            <Form
              form={analysisForm}
              layout='vertical'
              onFinish={onAnalysisFinish}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label='Product Type'
                    name='productType'
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value='alloy'>Alloy</Option>
                      <Option value='tyre'>Tyre</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Cushion Months'
                    name='cushionMonths'
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={1} max={12} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label='Risk Tolerance'
                    name='riskTolerance'
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value='low'>Low</Option>
                      <Option value='medium'>Medium</Option>
                      <Option value='high'>High</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Forecast Period (Months)'
                    name='forecastPeriod'
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={1} max={24} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label='Include Seasonality'
                    name='includeSeasonality'
                    valuePropName='checked'
                  >
                    <Select>
                      <Option value={true}>Yes</Option>
                      <Option value={false}>No</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='AI Enhanced'
                    name='aiEnhanced'
                    valuePropName='checked'
                  >
                    <Select>
                      <Option value={true}>Yes</Option>
                      <Option value={false}>No</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type='primary'
                  htmlType='submit'
                  loading={analysisLoading}
                  block
                >
                  Run Analysis
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab='Analysis Results' key='2' disabled={!analysisData}>
            {analysisData && (
              <div>
                <Alert
                  message='Analysis Complete'
                  description={analysisData.message}
                  type='success'
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title='Recommended Order Qty'
                      value={
                        analysisData.data?.recommendation
                          ?.recommendedOrderQuantity || 0
                      }
                      suffix='units'
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title='Current Stock'
                      value={
                        analysisData.data?.productInfo?.currentStock
                          ?.totalStock || 0
                      }
                      suffix='units'
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title='Days Remaining'
                      value={
                        analysisData.data?.recommendation
                          ?.daysOfStockRemaining || 0
                      }
                      suffix='days'
                    />
                  </Col>
                </Row>

                <Divider />

                <Title level={4}>Recommendation Details</Title>
                {analysisData.data?.recommendation?.reasoning?.map(
                  (reason, index) => (
                    <p key={index}>• {reason}</p>
                  )
                )}
              </div>
            )}
          </TabPane>
        </Tabs>
      </Modal>

      {/* Batch Update Modal */}
      <Modal
        title={`Batch Update Stock (${selectedRowKeys.length} items)`}
        open={batchUpdateModalVisible}
        onCancel={() => {
          setBatchUpdateModalVisible(false)
          batchForm.resetFields()
        }}
        onOk={() => batchForm.submit()}
        confirmLoading={managementLoading}
      >
        <Form form={batchForm} layout='vertical' onFinish={onBatchUpdateFinish}>
          <Form.Item
            label='Operation Type'
            name='operation'
            rules={[
              { required: true, message: 'Please select operation type' }
            ]}
          >
            <Select>
              <Option value='set'>Set Stock</Option>
              <Option value='add'>Add Stock</Option>
              <Option value='subtract'>Subtract Stock</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label='In-House Stock' name='inHouseStock'>
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder='Leave empty to skip'
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Production Request Modal */}
      <Modal
        title={`Request Production - ${selectedItem?.productName || 'Item'}`}
        open={productionRequestModalVisible}
        onCancel={() => {
          setProductionRequestModalVisible(false)
          productionRequestForm.resetFields()
        }}
        onOk={() => productionRequestForm.submit()}
        confirmLoading={productionRequestLoading}
        width={700}
      >
        <div style={{ marginBottom: '16px' }}>
          <Alert
            message="Production Request"
            description="Create a new production plan to manufacture more units of this product. This will integrate with your existing production workflow."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        </div>

        <Form form={productionRequestForm} layout='vertical' onFinish={onProductionRequestFinish}>
          <Form.Item name='alloyId' hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Source Product'
                tooltip="The product that will be used as raw material"
              >
                <Input 
                  value={selectedItem?.productName || 'N/A'} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Target Product ID'
                name='convertId'
                rules={[{ required: true, message: 'Please enter target product ID' }]}
                tooltip="The ID of the product you want to produce (usually same as source for replenishment)"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder="Enter target product ID"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Production Quantity'
                name='quantity'
                rules={[
                  { required: true, message: 'Please enter quantity' },
                  { type: 'number', min: 1, message: 'Quantity must be at least 1' }
                ]}
              >
                <InputNumber 
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="Enter quantity to produce"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Priority'
                name='urgent'
                valuePropName='checked'
              >
                <Space>
                  <Switch />
                  <span>Mark as Urgent</span>
                  <Tooltip title="Urgent production plans will be prioritized in the production queue">
                    <WarningOutlined style={{ color: '#faad14' }} />
                  </Tooltip>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label='Production Preset (Optional)'
            name='presetName'
            tooltip="Select a pre-configured production workflow or leave empty for default steps"
          >
            <Select
              placeholder="Select production preset (optional)"
              allowClear
            >
              <Option value="standard_wheel">Standard Wheel Production</Option>
              <Option value="premium_finish">Premium Finish Process</Option>
              <Option value="custom_design">Custom Design Process</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label='Additional Notes'
            name='notes'
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Any special instructions or requirements for this production run..."
            />
          </Form.Item>

          <div style={{ backgroundColor: '#fafafa', padding: '12px', borderRadius: '6px', marginTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <RocketOutlined /> This will create a new production plan that will be visible in the Production Management system. 
              The plan will go through your standard 11-step manufacturing workflow.
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default InventoryManagement
