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
  Spin
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ShoppingCartOutlined,
  InfoCircleOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrderById
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
  suppliers
}) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const { loading } = useSelector(state => state.purchaseSystem)

  // Local state
  const [orderItems, setOrderItems] = useState([])
  const [alloys, setAlloys] = useState([])
  const [loadingAlloys, setLoadingAlloys] = useState(false)
  const [selectedAlloy, setSelectedAlloy] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const isEditing = !!editOrder

  useEffect(() => {
    if (visible) {
      loadAlloys()
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

  const loadOrderData = async () => {
    try {
      const result = await dispatch(getPurchaseOrderById(editOrder.id)).unwrap()
      const order = result.data

      form.setFieldsValue({
        supplier_id: order.supplierId,
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
        sourceFinish: selectedAlloy.source_finish || '',
        targetFinish: selectedAlloy.target_finish || '',
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
        supplier_id: values.supplier_id,
        items: orderItems,
        notes: values.notes || ''
      }

      if (isEditing) {
        await dispatch(
          updatePurchaseOrder({ id: editOrder.id, ...orderData })
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
          supplier_id: undefined,
          notes: ''
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name='supplier_id'
              label='Supplier'
              rules={[{ required: true, message: 'Please select a supplier' }]}
            >
              <Select
                placeholder='Select a supplier'
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >=
                  0
                }
              >
                {suppliers.map(supplier => (
                  <Option key={supplier.id} value={supplier.id}>
                    <div>
                      <div className='font-semibold'>
                        {supplier.supplierName}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {supplier.supplierCode}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name='notes' label='Notes'>
              <TextArea
                placeholder='Add any notes for this order...'
                rows={1}
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
