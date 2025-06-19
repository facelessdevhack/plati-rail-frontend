import React, { useState, useEffect } from 'react'
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
  message
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
  CloseCircleOutlined
} from '@ant-design/icons'
import {
  useInventory,
  useStockManagement,
  useStockAnalysis
} from '../../hooks/useInventory'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

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
  const [selectedItem, setSelectedItem] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)

  const [updateForm] = Form.useForm()
  const [addForm] = Form.useForm()
  const [analysisForm] = Form.useForm()
  const [batchForm] = Form.useForm()

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!inventory.length)
      return { total: 0, lowStock: 0, totalValue: 0, outOfStock: 0 }

    const total = inventory.length
    const lowStock = inventory.filter(
      item => parseInt(item.in_house_stock) + parseInt(item.showroom_stock) < 10
    ).length
    const outOfStock = inventory.filter(
      item =>
        parseInt(item.in_house_stock) + parseInt(item.showroom_stock) === 0
    ).length
    const totalValue = inventory.reduce(
      (sum, item) =>
        sum +
        parseFloat(item.price || 0) *
          (parseInt(item.in_house_stock) + parseInt(item.showroom_stock)),
      0
    )

    return { total, lowStock, totalValue, outOfStock }
  }, [inventory])

  const handleUpdateStock = record => {
    setSelectedItem(record)
    updateForm.setFieldsValue({
      alloyId: record.id,
      inHouseStock: record.in_house_stock,
      showroomStock: record.showroom_stock,
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
          inHouseStock: values.inHouseStock,
          showroomStock: values.showroomStock
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
        inHouseStock: values.inHouseStock,
        showroomStock: values.showroomStock
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

  const getStockStatus = (inHouse, showroom) => {
    const total = parseInt(inHouse) + parseInt(showroom)
    if (total === 0) return { status: 'error', text: 'Out of Stock' }
    if (total < 10) return { status: 'warning', text: 'Low Stock' }
    return { status: 'success', text: 'In Stock' }
  }

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 250,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {record.brand} | {record.size}
          </Text>
        </div>
      )
    },
    {
      title: 'In-House Stock',
      dataIndex: 'in_house_stock',
      key: 'in_house_stock',
      width: 120,
      render: text => (
        <Badge count={text} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: 'Showroom Stock',
      dataIndex: 'showroom_stock',
      key: 'showroom_stock',
      width: 120,
      render: text => (
        <Badge count={text} style={{ backgroundColor: '#1890ff' }} />
      )
    },
    {
      title: 'Total Stock',
      key: 'total_stock',
      width: 100,
      render: (_, record) => {
        const total =
          parseInt(record.in_house_stock) + parseInt(record.showroom_stock)
        const stockStatus = getStockStatus(
          record.in_house_stock,
          record.showroom_stock
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
          >
            {total}
          </Tag>
        )
      }
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: text => `₹${parseFloat(text || 0).toLocaleString()}`
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const stockStatus = getStockStatus(
          record.in_house_stock,
          record.showroom_stock
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
      width: 200,
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
          dataSource={inventory}
          rowKey='id'
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
          }}
          scroll={{ x: 1200 }}
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
            <Col span={12}>
              <Form.Item
                label='Showroom Stock'
                name='showroomStock'
                rules={[
                  { required: true, message: 'Please enter showroom stock' }
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
        title='Add New Inventory'
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false)
          addForm.resetFields()
        }}
        onOk={() => addForm.submit()}
        confirmLoading={managementLoading}
        width={600}
      >
        <Form form={addForm} layout='vertical' onFinish={onAddFinish}>
          <Form.Item
            label='Alloy ID'
            name='alloyId'
            rules={[{ required: true, message: 'Please enter alloy ID' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label='Quantity'
            name='quantity'
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
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
            <Col span={12}>
              <Form.Item label='Showroom Stock' name='showroomStock'>
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
    </div>
  )
}

export default InventoryManagement
