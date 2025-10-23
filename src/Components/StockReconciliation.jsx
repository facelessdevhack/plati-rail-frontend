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
  Modal,
  Form,
  Row,
  Col,
  Typography,
  Divider,
  Alert,
  InputNumber,
  Tabs,
  Statistic
} from 'antd'
import {
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text } = Typography
const { TabPane } = Tabs

const StockReconciliation = () => {
  const [loading, setLoading] = useState(false)
  const [reconciliations, setReconciliations] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [reconcileModalVisible, setReconcileModalVisible] = useState(false)
  const [form] = Form.useForm()

  // Fetch reconciliations
  const fetchReconciliations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v2/stock-logging/reconciliations')
      const data = await response.json()

      if (data.success) {
        setReconciliations(data.data)
      } else {
        console.error('Failed to fetch reconciliations:', data.message)
      }
    } catch (error) {
      console.error('Error fetching reconciliations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get current stock
  const getCurrentStock = async (productId, productType) => {
    try {
      const response = await fetch(
        `/api/v2/stock-logging/products/${productId}/stock?productType=${productType}`
      )
      const data = await response.json()
      return data.success ? data.data : null
    } catch (error) {
      console.error('Error fetching current stock:', error)
      return null
    }
  }

  // Create new reconciliation
  const createReconciliation = async values => {
    setLoading(true)
    try {
      // Get current system stock
      const systemStock = await getCurrentStock(
        values.productId,
        values.productType
      )

      if (!systemStock) {
        throw new Error('Failed to fetch current stock')
      }

      const reconciliationData = {
        ...values,
        systemStock,
        physicalStock: {
          inHouse: values.physicalInHouse || 0,
          showroom: values.physicalShowroom || 0,
          reserved: values.physicalReserved || 0,
          total:
            (values.physicalInHouse || 0) +
            (values.physicalShowroom || 0) +
            (values.physicalReserved || 0)
        },
        userId: 1 // This should come from auth context
      }

      const response = await fetch('/api/v2/stock-logging/reconciliations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reconciliationData)
      })

      const data = await response.json()

      if (data.success) {
        setReconcileModalVisible(false)
        form.resetFields()
        fetchReconciliations()
        Modal.success({
          title: 'Success',
          content: 'Stock reconciliation created successfully!'
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Error creating reconciliation:', error)
      Modal.error({
        title: 'Error',
        content: error.message || 'Failed to create reconciliation'
      })
    } finally {
      setLoading(false)
    }
  }

  // View reconciliation details
  const viewReconciliationDetails = record => {
    setSelectedProduct(record)
  }

  // Format date
  const formatDate = dateString => {
    return dayjs(dateString).format('DD MMM YYYY')
  }

  // Get discrepancy status
  const getDiscrepancyStatus = record => {
    const discrepancy = Math.abs(record.total_discrepancy || 0)
    if (discrepancy === 0) {
      return {
        color: 'success',
        text: 'No Discrepancy',
        icon: <CheckCircleOutlined />
      }
    } else if (discrepancy <= 5) {
      return {
        color: 'warning',
        text: 'Minor Discrepancy',
        icon: <ExclamationCircleOutlined />
      }
    } else {
      return {
        color: 'error',
        text: 'Major Discrepancy',
        icon: <ExclamationCircleOutlined />
      }
    }
  }

  // Reconciliation table columns
  const reconciliationColumns = [
    {
      title: 'Date',
      dataIndex: 'reconciliation_date',
      key: 'reconciliation_date',
      width: 120,
      render: date => formatDate(date)
    },
    {
      title: 'Product ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 100,
      render: (id, record) => (
        <div>
          <Text strong>{id}</Text>
          <br />
          <Tag color='blue'>{record.product_type?.toUpperCase()}</Tag>
        </div>
      )
    },
    {
      title: 'System Stock',
      key: 'system_stock',
      width: 100,
      render: (_, record) => (
        <div>
          <Text>In: {record.system_in_house_stock}</Text>
          <br />
          <Text>Show: {record.system_showroom_stock}</Text>
          <br />
          <Text strong>Total: {record.system_total_stock}</Text>
        </div>
      )
    },
    {
      title: 'Physical Stock',
      key: 'physical_stock',
      width: 100,
      render: (_, record) => (
        <div>
          <Text>In: {record.physical_in_house_stock}</Text>
          <br />
          <Text>Show: {record.physical_showroom_stock}</Text>
          <br />
          <Text strong>Total: {record.physical_total_stock}</Text>
        </div>
      )
    },
    {
      title: 'Discrepancy',
      key: 'discrepancy',
      width: 120,
      render: (_, record) => {
        const status = getDiscrepancyStatus(record)
        return (
          <Space direction='vertical'>
            <Text
              strong
              style={{
                color:
                  status.color === 'error'
                    ? '#ff4d4f'
                    : status.color === 'warning'
                    ? '#faad14'
                    : '#52c41a'
              }}
            >
              {record.total_discrepancy > 0 ? '+' : ''}
              {record.total_discrepancy}
            </Text>
            <Tag color={status.color} style={{ fontSize: '12px' }}>
              {status.text}
            </Tag>
          </Space>
        )
      }
    },
    {
      title: 'Type',
      dataIndex: 'reconciliation_type',
      key: 'reconciliation_type',
      width: 100,
      render: type => (
        <Tag
          color={
            type === 'full' ? 'blue' : type === 'partial' ? 'orange' : 'green'
          }
        >
          {type?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: status => (
        <Tag
          color={
            status === 'approved'
              ? 'green'
              : status === 'submitted'
              ? 'orange'
              : 'default'
          }
        >
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Counted By',
      dataIndex: 'counted_by_name',
      key: 'counted_by_name',
      width: 120,
      render: name => name || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button size='small' onClick={() => viewReconciliationDetails(record)}>
          View Details
        </Button>
      )
    }
  ]

  useEffect(() => {
    fetchReconciliations()
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Title level={2}>Stock Reconciliation</Title>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => setReconcileModalVisible(true)}
        >
          New Reconciliation
        </Button>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Reconciliations'
              value={reconciliations.length}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='With Discrepancies'
              value={
                reconciliations.filter(r => r.total_discrepancy !== 0).length
              }
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Approved'
              value={
                reconciliations.filter(r => r.status === 'approved').length
              }
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Discrepancy'
              value={reconciliations.reduce(
                (sum, r) => sum + Math.abs(r.total_discrepancy || 0),
                0
              )}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Reconciliation Table */}
      <Card>
        <Table
          columns={reconciliationColumns}
          dataSource={reconciliations}
          rowKey='id'
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* New Reconciliation Modal */}
      <Modal
        title='Create New Stock Reconciliation'
        visible={reconcileModalVisible}
        onCancel={() => setReconcileModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout='vertical' onFinish={createReconciliation}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Reconciliation Date'
                name='reconciliationDate'
                rules={[{ required: true, message: 'Please select date' }]}
                initialValue={dayjs()}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Product Type'
                name='productType'
                rules={[
                  { required: true, message: 'Please select product type' }
                ]}
                initialValue='alloy'
              >
                <Select>
                  <Option value='alloy'>Alloy</Option>
                  <Option value='tyre'>Tyre</Option>
                  <Option value='ppf'>PPF</Option>
                  <Option value='caps'>Caps</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label='Product ID'
            name='productId'
            rules={[{ required: true, message: 'Please enter product ID' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder='Enter product ID'
              min={1}
            />
          </Form.Item>

          <Form.Item label='Physical Stock Counts'>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name='physicalInHouse'
                  label='In-House Stock'
                  initialValue={0}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder='0'
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name='physicalShowroom'
                  label='Showroom Stock'
                  initialValue={0}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder='0'
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name='physicalReserved'
                  label='Reserved Stock'
                  initialValue={0}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder='0'
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Count Method'
                name='countMethod'
                initialValue='manual'
              >
                <Select>
                  <Option value='manual'>Manual Count</Option>
                  <Option value='barcode'>Barcode Scan</Option>
                  <Option value='rfid'>RFID Scan</Option>
                  <Option value='system'>System Generated</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Reconciliation Type'
                name='reconciliationType'
                initialValue='full'
              >
                <Select>
                  <Option value='full'>Full Count</Option>
                  <Option value='partial'>Partial Count</Option>
                  <Option value='spot_check'>Spot Check</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label='Notes' name='notes'>
            <Input.TextArea
              rows={3}
              placeholder='Enter any additional notes about this reconciliation'
            />
          </Form.Item>

          <Form.Item
            label='Discrepancy Reason (if any)'
            name='discrepancyReason'
          >
            <Input.TextArea
              rows={2}
              placeholder='Explain any stock discrepancies found'
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReconcileModalVisible(false)}>
                Cancel
              </Button>
              <Button type='primary' htmlType='submit' loading={loading}>
                Create Reconciliation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title='Reconciliation Details'
        visible={!!selectedProduct}
        onCancel={() => setSelectedProduct(null)}
        footer={[
          <Button key='close' onClick={() => setSelectedProduct(null)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedProduct && (
          <div>
            <Title level={4}>Reconciliation Summary</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Space direction='vertical'>
                  <Text>
                    <strong>Date:</strong>{' '}
                    {formatDate(selectedProduct.reconciliation_date)}
                  </Text>
                  <Text>
                    <strong>Type:</strong>{' '}
                    {selectedProduct.reconciliation_type?.toUpperCase()}
                  </Text>
                  <Text>
                    <strong>Count Method:</strong>{' '}
                    {selectedProduct.count_method || '-'}
                  </Text>
                  <Text>
                    <strong>Status:</strong>{' '}
                    <Tag
                      color={
                        selectedProduct.status === 'approved'
                          ? 'green'
                          : 'orange'
                      }
                    >
                      {selectedProduct.status?.toUpperCase()}
                    </Tag>
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction='vertical'>
                  <Text>
                    <strong>Counted By:</strong>{' '}
                    {selectedProduct.counted_by_name || '-'}
                  </Text>
                  <Text>
                    <strong>Reviewed By:</strong>{' '}
                    {selectedProduct.reviewed_by_name || '-'}
                  </Text>
                  <Text>
                    <strong>Created:</strong>{' '}
                    {formatDate(selectedProduct.created_at)}
                  </Text>
                </Space>
              </Col>
            </Row>

            <Divider />

            <Title level={4}>Stock Comparison</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Card size='small' title='System Stock'>
                  <Space direction='vertical'>
                    <Text>
                      <strong>In-House:</strong>{' '}
                      {selectedProduct.system_in_house_stock}
                    </Text>
                    <Text>
                      <strong>Showroom:</strong>{' '}
                      {selectedProduct.system_showroom_stock}
                    </Text>
                    <Text>
                      <strong>Reserved:</strong>{' '}
                      {selectedProduct.system_reserved_stock}
                    </Text>
                    <Text>
                      <strong>Total:</strong>
                      {selectedProduct.system_total_stock}
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size='small' title='Physical Stock'>
                  <Space direction='vertical'>
                    <Text>
                      <strong>In-House:</strong>{' '}
                      {selectedProduct.physical_in_house_stock}
                    </Text>
                    <Text>
                      <strong>Showroom:</strong>{' '}
                      {selectedProduct.physical_showroom_stock}
                    </Text>
                    <Text>
                      <strong>Reserved:</strong>{' '}
                      {selectedProduct.physical_reserved_stock}
                    </Text>
                    <Text>
                      <strong>Total:</strong>
                      {selectedProduct.physical_total_stock}
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={24}>
                <Alert
                  message={`Total Discrepancy: ${
                    selectedProduct.total_discrepancy > 0 ? '+' : ''
                  }${selectedProduct.total_discrepancy} units`}
                  type={
                    Math.abs(selectedProduct.total_discrepancy || 0) > 0
                      ? 'warning'
                      : 'success'
                  }
                  showIcon
                />
              </Col>
            </Row>

            {selectedProduct.notes && (
              <>
                <Divider />
                <Title level={4}>Notes</Title>
                <Text>{selectedProduct.notes}</Text>
              </>
            )}

            {selectedProduct.discrepancy_reason && (
              <>
                <Divider />
                <Title level={4}>Discrepancy Explanation</Title>
                <Text>{selectedProduct.discrepancy_reason}</Text>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StockReconciliation
