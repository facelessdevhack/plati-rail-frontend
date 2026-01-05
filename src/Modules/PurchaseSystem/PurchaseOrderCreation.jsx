import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  Table,
  Space,
  message,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Tag,
  Tooltip,
  Empty,
  Spin,
  DatePicker
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ShoppingCartOutlined,
  InfoCircleOutlined,
  ToolOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrderById,
  getVendors,
  getMoldsForPurchase
} from '../../redux/api/purchaseSystemAPI'
import { getStockManagement } from '../../redux/api/stockAPI'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const PurchaseOrderCreation = ({
  visible,
  onClose,
  onSuccess,
  editOrder,
  vendors: propVendors
}) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const { loading, vendors: storeVendors, molds: storeMolds } = useSelector(state => state.purchaseSystem)

  // Use vendors from props or store
  const vendors = propVendors || storeVendors || []
  const molds = storeMolds || []

  // Local state
  const [orderItems, setOrderItems] = useState([])
  const [alloys, setAlloys] = useState([])
  const [loadingAlloys, setLoadingAlloys] = useState(false)
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [loadingMolds, setLoadingMolds] = useState(false)
  const [selectedAlloy, setSelectedAlloy] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [localVendors, setLocalVendors] = useState([])
  const [localMolds, setLocalMolds] = useState([])

  const isEditing = !!editOrder

  useEffect(() => {
    if (visible) {
      loadAlloys()
      loadVendors()
      loadMolds()
      if (isEditing) {
        loadOrderData()
      } else {
        resetForm()
      }
    }
  }, [visible, isEditing])

  const loadAlloys = async () => {
    try {
      setLoadingAlloys(true)
      const result = await dispatch(getStockManagement({})).unwrap()
      setAlloys(result?.data || [])
    } catch (error) {
      message.error('Failed to load alloys')
    } finally {
      setLoadingAlloys(false)
    }
  }

  const loadVendors = async () => {
    try {
      setLoadingVendors(true)
      const result = await dispatch(getVendors()).unwrap()
      setLocalVendors(result?.data || result || [])
    } catch (error) {
      console.error('Failed to load vendors:', error)
    } finally {
      setLoadingVendors(false)
    }
  }

  const loadMolds = async () => {
    try {
      setLoadingMolds(true)
      const result = await dispatch(getMoldsForPurchase()).unwrap()
      setLocalMolds(result?.data || result || [])
    } catch (error) {
      console.error('Failed to load molds:', error)
    } finally {
      setLoadingMolds(false)
    }
  }

  const loadOrderData = async () => {
    try {
      const result = await dispatch(getPurchaseOrderById(editOrder.id)).unwrap()
      const order = result.data

      form.setFieldsValue({
        vendor_id: order.vendorId || order.vendor_id,
        mold_id: order.moldId || order.mold_id,
        expected_delivery_date: order.expectedDeliveryDate || order.expected_delivery_date,
        notes: order.notes
      })

      setOrderItems(order.items || [])
    } catch (error) {
      message.error('Failed to load order data')
    }
  }

  const resetForm = () => {
    form.resetFields()
    setOrderItems([])
    setSelectedAlloy(null)
    setQuantity(1)
    setSearchTerm('')
  }

  const handleAddItem = () => {
    if (!selectedAlloy || !quantity || quantity <= 0) {
      message.warning('Please select an alloy and enter a valid quantity')
      return
    }

    // Check if item already exists
    const existingItemIndex = orderItems.findIndex(
      item => item.productId === selectedAlloy.id
    )

    if (existingItemIndex !== -1) {
      // Update existing item
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex].quantity += quantity
      setOrderItems(updatedItems)
    } else {
      // Add new item
      const newItem = {
        productId: selectedAlloy.id,
        productName: selectedAlloy.product_name,
        productCode: selectedAlloy.product_code || '',
        modelName: selectedAlloy.model_name,
        size: selectedAlloy.size || '',
        pcd: selectedAlloy.pcd || '',
        holes: selectedAlloy.holes || '',
        width: selectedAlloy.width || '',
        finish: selectedAlloy.finish || selectedAlloy.finish_name || '',
        quantity: quantity
      }
      setOrderItems([...orderItems, newItem])
    }

    // Reset selection
    setSelectedAlloy(null)
    setQuantity(1)
  }

  const handleRemoveItem = index => {
    const updatedItems = orderItems.filter((_, i) => i !== index)
    setOrderItems(updatedItems)
  }

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity <= 0) return

    const updatedItems = [...orderItems]
    updatedItems[index].quantity = newQuantity
    setOrderItems(updatedItems)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (orderItems.length === 0) {
        message.warning('Please add at least one item to the order')
        return
      }

      const orderData = {
        vendor_id: values.vendor_id,
        mold_id: values.mold_id || null,
        expected_delivery_date: values.expected_delivery_date
          ? values.expected_delivery_date.format('YYYY-MM-DD')
          : null,
        items: orderItems,
        notes: values.notes || ''
      }

      if (isEditing) {
        await dispatch(
          updatePurchaseOrder({ id: editOrder.id, orderData })
        ).unwrap()
        message.success('Purchase order updated successfully')
      } else {
        await dispatch(createPurchaseOrder(orderData)).unwrap()
        message.success('Purchase order created successfully')
      }

      onSuccess()
    } catch (error) {
      message.error(error.message || 'Failed to save order')
    }
  }

  const filteredAlloys = alloys.filter(
    alloy =>
      alloy.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alloy.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alloy.unique_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTotalQuantity = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }

  // Use local vendors or props vendors
  const displayVendors = localVendors.length > 0 ? localVendors : vendors
  const displayMolds = localMolds.length > 0 ? localMolds : molds

  const itemsColumns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      render: (text, record) => (
        <div>
          <div className='font-semibold'>{text}</div>
          <div className='text-xs text-gray-500'>{record.modelName}</div>
        </div>
      )
    },
    {
      title: 'Size/Specs',
      dataIndex: 'size',
      key: 'size',
      render: (text, record) => (
        <div>
          <Tag color='blue'>{text}</Tag>
          {record.pcd && record.holes && (
            <Tag color='green' className='mt-1'>
              {record.pcd}/{record.holes}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: 'Finish',
      dataIndex: 'finish',
      key: 'finish',
      render: (text) => (
        <Tag color='orange'>{text || 'N/A'}</Tag>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record, index) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={value => handleQuantityChange(index, value)}
          style={{ width: 100 }}
        />
      ),
      align: 'center'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record, index) => (
        <Button
          type='text'
          danger
          size='small'
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(index)}
        />
      ),
      align: 'center'
    }
  ]

  return (
    <Modal
      title={
        <div className='flex items-center'>
          <ShoppingCartOutlined className='mr-2' />
          {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key='cancel' onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key='submit'
          type='primary'
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleSubmit}
          disabled={orderItems.length === 0}
        >
          {isEditing ? 'Update Order' : 'Create Order'}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout='vertical'
        initialValues={{
          vendor_id: undefined,
          mold_id: undefined,
          notes: ''
        }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name='vendor_id'
              label='Vendor'
              rules={[{ required: true, message: 'Please select a vendor' }]}
            >
              <Select
                placeholder='Select a vendor'
                showSearch
                loading={loadingVendors}
                filterOption={(input, option) =>
                  option.children?.props?.children?.[0]?.props?.children
                    ?.toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
              >
                {displayVendors.map(vendor => (
                  <Option key={vendor.id} value={vendor.id}>
                    <div>
                      <div className='font-semibold'>
                        {vendor.vendorName || vendor.vendor_name}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {vendor.contactPerson || vendor.contact_person || 'No contact'}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name='mold_id'
              label={
                <span>
                  <ToolOutlined className='mr-1' />
                  Mold (Optional)
                </span>
              }
              tooltip='Select a mold if this order is related to mold manufacturing'
            >
              <Select
                placeholder='Select a mold'
                showSearch
                allowClear
                loading={loadingMolds}
                filterOption={(input, option) =>
                  option.children?.props?.children?.[0]?.props?.children
                    ?.toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
              >
                {displayMolds.map(mold => (
                  <Option key={mold.id} value={mold.id}>
                    <div>
                      <div className='font-semibold'>
                        {mold.moldCode || mold.mold_code}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {mold.moldType || mold.mold_type}
                        {(mold.sizeInches || mold.size_inches) && ` - ${mold.sizeInches || mold.size_inches}"`}
                        {(mold.modelName || mold.model_name) && ` - ${mold.modelName || mold.model_name}`}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name='expected_delivery_date'
              label='Expected Delivery Date'
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder='Select expected delivery date'
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name='notes' label='Notes'>
              <TextArea
                placeholder='Add any notes for this order...'
                rows={2}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Order Items</Divider>

        {/* Item Selection */}
        <Card className='mb-4' title='Add Items'>
          <Row gutter={16} align='middle'>
            <Col span={8}>
              <Select
                placeholder='Select alloy'
                value={selectedAlloy}
                onChange={setSelectedAlloy}
                showSearch
                filterOption={false}
                onSearch={setSearchTerm}
                notFoundContent={
                  loadingAlloys ? <Spin size='small' /> : 'No alloys found'
                }
                style={{ width: '100%' }}
              >
                {filteredAlloys.map(alloy => (
                  <Option key={alloy.id} value={alloy}>
                    <div>
                      <div className='font-semibold'>{alloy.product_name}</div>
                      <div className='text-xs text-gray-500'>
                        {alloy.model_name} - {alloy.unique_id}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <InputNumber
                placeholder='Qty'
                min={1}
                value={quantity}
                onChange={setQuantity}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                disabled={!selectedAlloy}
                block
              >
                Add Item
              </Button>
            </Col>
            <Col span={8}>
              <div className='text-right'>
                <Text type='secondary'>
                  <InfoCircleOutlined className='mr-1' />
                  {alloys.length} alloys available
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Order Items Table */}
        <Card
          title={
            <div className='flex justify-between items-center'>
              <span>Order Items</span>
              <Tag color='green'>Total Quantity: {getTotalQuantity()}</Tag>
            </div>
          }
        >
          {orderItems.length > 0 ? (
            <Table
              columns={itemsColumns}
              dataSource={orderItems}
              pagination={false}
              size='small'
              rowKey='productId'
            />
          ) : (
            <Empty
              description='No items added to the order yet'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      </Form>
    </Modal>
  )
}

export default PurchaseOrderCreation
