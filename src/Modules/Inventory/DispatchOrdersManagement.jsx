import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  Button,
  Card,
  Form,
  Input,
  Select,
  Modal,
  Space,
  Tag,
  Descriptions,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Steps,
  Divider,
  message,
  Popconfirm,
  Typography,
  List,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  TruckOutlined,
  InboxOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

// Redux actions
import {
  fetchDispatchOrders,
  createDispatchOrder,
  searchInventory,
  setLoading,
  setError
} from '../../redux/slices/internal-inventory.slice';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Step } = Steps;

const DispatchOrdersManagement = () => {
  const dispatch = useDispatch();
  const { 
    dispatchOrders, 
    loading, 
    error 
  } = useSelector(state => state.internalInventory);

  // Local state
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [inventorySearchResults, setInventorySearchResults] = useState([]);
  const [dealers, setDealers] = useState([]);

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchDispatchOrders());
    fetchDealersData();
  }, [dispatch]);

  // Fetch dealers directly
  const fetchDealersData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/v2/inventory/dealers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const result = await response.json();
        setDealers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching dealers:', error);
    }
  };

  // Status configurations
  const statusConfig = {
    draft: { color: 'default', label: 'Draft' },
    confirmed: { color: 'blue', label: 'Confirmed' },
    packed: { color: 'orange', label: 'Packed' },
    shipped: { color: 'green', label: 'Shipped' },
    cancelled: { color: 'red', label: 'Cancelled' }
  };

  // Priority configurations
  const priorityConfig = {
    low: { color: 'default', label: 'Low' },
    medium: { color: 'blue', label: 'Medium' },
    high: { color: 'orange', label: 'High' },
    urgent: { color: 'red', label: 'Urgent' }
  };

  // Table columns for dispatch orders
  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => viewOrderDetails(record)}
        >
          {text || `DO-${record.id}`}
        </Button>
      ),
    },
    {
      title: 'Dealer',
      dataIndex: ['dealer', 'name'],
      key: 'dealerName',
      render: (text, record) => record.dealer_name || text || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = statusConfig[status] || statusConfig.draft;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const config = priorityConfig[priority] || priorityConfig.medium;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'itemCount',
      render: (items) => (
        <Badge count={items?.length || 0} showZero />
      ),
    },
    {
      title: 'Expected Date',
      dataIndex: 'expectedShipDate',
      key: 'expectedShipDate',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A',
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => viewOrderDetails(record)}
            size="small"
          />
          {record.status === 'draft' && (
            <Button 
              icon={<CheckOutlined />}
              onClick={() => handleConfirmOrder(record.id)}
              type="primary"
              size="small"
            />
          )}
          {record.status === 'confirmed' && (
            <Button 
              icon={<InboxOutlined />}
              onClick={() => handlePackOrder(record.id)}
              type="primary"
              size="small"
            />
          )}
          {record.status === 'packed' && (
            <Button 
              icon={<TruckOutlined />}
              onClick={() => handleShipOrder(record.id)}
              type="primary"
              size="small"
            />
          )}
          {['draft', 'confirmed'].includes(record.status) && (
            <Popconfirm
              title="Are you sure you want to cancel this order?"
              onConfirm={() => handleCancelOrder(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                icon={<CloseOutlined />}
                danger
                size="small"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Handle creating new dispatch order
  const handleCreateOrder = async (values) => {
    try {
      const orderData = {
        ...values,
        expected_ship_date: values.expectedShipDate?.format('YYYY-MM-DD'),
        items: selectedItems
      };

      await dispatch(createDispatchOrder(orderData)).unwrap();
      message.success('Dispatch order created successfully');
      setIsModalVisible(false);
      form.resetFields();
      setSelectedItems([]);
      dispatch(fetchDispatchOrders());
    } catch (error) {
      message.error(`Failed to create dispatch order: ${error.message}`);
    }
  };

  // Handle order status changes
  const handleConfirmOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/v2/inventory/dispatch/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        message.success('Order confirmed successfully');
        dispatch(fetchDispatchOrders());
      } else {
        throw new Error('Failed to confirm order');
      }
    } catch (error) {
      message.error(`Failed to confirm order: ${error.message}`);
    }
  };

  const handlePackOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/v2/inventory/dispatch/orders/${orderId}/pack`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        message.success('Order packed successfully');
        dispatch(fetchDispatchOrders());
      } else {
        throw new Error('Failed to pack order');
      }
    } catch (error) {
      message.error(`Failed to pack order: ${error.message}`);
    }
  };

  const handleShipOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/v2/inventory/dispatch/orders/${orderId}/ship`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        message.success('Order shipped successfully');
        dispatch(fetchDispatchOrders());
      } else {
        throw new Error('Failed to ship order');
      }
    } catch (error) {
      message.error(`Failed to ship order: ${error.message}`);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/v2/inventory/dispatch/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        message.success('Order cancelled successfully');
        dispatch(fetchDispatchOrders());
      } else {
        throw new Error('Failed to cancel order');
      }
    } catch (error) {
      message.error(`Failed to cancel order: ${error.message}`);
    }
  };

  // View order details
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setViewModalVisible(true);
  };

  // Search inventory for adding items
  const handleInventorySearch = async (searchParams) => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams(searchParams).toString();
      const response = await fetch(`http://localhost:4000/v2/inventory/search?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const results = await response.json();
        setInventorySearchResults(results.data?.inventory || []);
      }
    } catch (error) {
      message.error('Failed to search inventory');
    }
  };

  // Add item to dispatch order
  const addItemToOrder = (inventoryItem) => {
    const existingItemIndex = selectedItems.findIndex(
      item => item.inventory_id === inventoryItem.id
    );

    if (existingItemIndex >= 0) {
      message.warning('Item already added to order');
      return;
    }

    const newItem = {
      inventory_id: inventoryItem.id,
      product_type: inventoryItem.product_type,
      product_id: inventoryItem.product_id,
      quantity: 1,
      available_quantity: inventoryItem.available_quantity,
      unit_price: inventoryItem.unit_price || 0,
      product_details: inventoryItem.product_details,
      location_name: inventoryItem.location_name
    };

    setSelectedItems([...selectedItems, newItem]);
  };

  // Remove item from dispatch order
  const removeItemFromOrder = (index) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updatedItems);
  };

  // Update item quantity
  const updateItemQuantity = (index, quantity) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].quantity = quantity;
    setSelectedItems(updatedItems);
  };

  // Get status step
  const getStatusStep = (status) => {
    const steps = ['draft', 'confirmed', 'packed', 'shipped'];
    return status === 'cancelled' ? -1 : steps.indexOf(status);
  };

  return (
    <div className="dispatch-orders-management">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Dispatch Orders Management</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Create Dispatch Order
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <Form 
          form={searchForm}
          layout="inline"
          onFinish={(values) => {
            // Implement search/filter logic here
            console.log('Search values:', values);
          }}
        >
          <Form.Item name="orderNumber">
            <Input placeholder="Order Number" prefix={<SearchOutlined />} />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="Status" style={{ width: 120 }}>
              <Option value="">All Status</Option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <Option key={key} value={key}>{config.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dealerId">
            <Select placeholder="Dealer" style={{ width: 200 }}>
              <Option value="">All Dealers</Option>
              {dealers.map(dealer => (
                <Option key={dealer.id} value={dealer.id}>{dealer.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Search
            </Button>
          </Form.Item>
          <Form.Item>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                searchForm.resetFields();
                dispatch(fetchDispatchOrders());
              }}
            >
              Reset
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Dispatch Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={dispatchOrders}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} orders`,
          }}
        />
      </Card>

      {/* Create Dispatch Order Modal */}
      <Modal
        title="Create Dispatch Order"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedItems([]);
          setInventorySearchResults([]);
        }}
        width={1000}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrder}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dealer_id"
                label="Dealer"
                rules={[{ required: true, message: 'Please select a dealer' }]}
              >
                <Select placeholder="Select dealer">
                  {dealers.map(dealer => (
                    <Option key={dealer.id} value={dealer.id}>
                      {dealer.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true }]}
                initialValue="medium"
              >
                <Select>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <Option key={key} value={key}>{config.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="expectedShipDate" label="Expected Ship Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="order_number" label="Order Number (Optional)">
                <Input placeholder="Auto-generated if empty" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>

          <Divider>Order Items</Divider>

          {/* Inventory Search */}
          <Card size="small" className="mb-4">
            <Form
              layout="inline"
              onFinish={handleInventorySearch}
            >
              <Form.Item name="query">
                <Input placeholder="Search products..." />
              </Form.Item>
              <Form.Item name="productType">
                <Select placeholder="Type" style={{ width: 100 }}>
                  <Option value="">All</Option>
                  <Option value="alloy">Alloy</Option>
                  <Option value="tyre">Tyre</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">Search Inventory</Button>
              </Form.Item>
            </Form>

            {inventorySearchResults.length > 0 && (
              <List
                size="small"
                dataSource={inventorySearchResults}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button 
                        size="small" 
                        onClick={() => addItemToOrder(item)}
                      >
                        Add
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={`${item.product_details?.product_name || item.product_details?.brand || 'Product'} - ${item.location_name}`}
                      description={`Available: ${item.available_quantity} | Price: ₹${item.unit_price || 0}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <Card size="small" title="Selected Items">
              <Table
                size="small"
                dataSource={selectedItems}
                pagination={false}
                columns={[
                  {
                    title: 'Product',
                    render: (_, item) => (
                      <div>
                        <div>{item.product_details?.product_name || item.product_details?.brand}</div>
                        <Text type="secondary">{item.location_name}</Text>
                      </div>
                    ),
                  },
                  {
                    title: 'Available',
                    dataIndex: 'available_quantity',
                  },
                  {
                    title: 'Quantity',
                    render: (_, item, index) => (
                      <InputNumber
                        min={1}
                        max={item.available_quantity}
                        value={item.quantity}
                        onChange={(value) => updateItemQuantity(index, value)}
                      />
                    ),
                  },
                  {
                    title: 'Unit Price',
                    render: (_, item) => `₹${item.unit_price || 0}`,
                  },
                  {
                    title: 'Total',
                    render: (_, item) => `₹${(item.quantity * (item.unit_price || 0)).toFixed(2)}`,
                  },
                  {
                    title: 'Action',
                    render: (_, item, index) => (
                      <Button 
                        size="small" 
                        danger 
                        onClick={() => removeItemFromOrder(index)}
                      >
                        Remove
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button 
              type="primary" 
              htmlType="submit"
              disabled={selectedItems.length === 0}
            >
              Create Order
            </Button>
          </div>
        </Form>
      </Modal>

      {/* View Order Details Modal */}
      <Modal
        title="Dispatch Order Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedOrder && (
          <div>
            {/* Order Status Steps */}
            <Steps 
              current={getStatusStep(selectedOrder.status)}
              status={selectedOrder.status === 'cancelled' ? 'error' : 'process'}
              className="mb-6"
            >
              <Step title="Draft" />
              <Step title="Confirmed" />
              <Step title="Packed" />
              <Step title="Shipped" />
            </Steps>

            {/* Order Information */}
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Order Number">
                {selectedOrder.orderNumber || `DO-${selectedOrder.id}`}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusConfig[selectedOrder.status]?.color}>
                  {statusConfig[selectedOrder.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Dealer">
                {selectedOrder.dealer_name}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={priorityConfig[selectedOrder.priority]?.color}>
                  {priorityConfig[selectedOrder.priority]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Expected Ship Date">
                {selectedOrder.expectedShipDate ? 
                  dayjs(selectedOrder.expectedShipDate).format('DD/MM/YYYY') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {dayjs(selectedOrder.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>
                {selectedOrder.notes || 'No notes'}
              </Descriptions.Item>
            </Descriptions>

            {/* Order Items */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="mt-6">
                <Title level={4}>Order Items</Title>
                <Table
                  size="small"
                  dataSource={selectedOrder.items}
                  pagination={false}
                  columns={[
                    {
                      title: 'Product',
                      render: (_, item) => (
                        <div>
                          <div>{item.product_name || item.brand}</div>
                          <Text type="secondary">{item.product_type}</Text>
                        </div>
                      ),
                    },
                    { title: 'Quantity', dataIndex: 'quantity' },
                    { 
                      title: 'Unit Price', 
                      dataIndex: 'unit_price',
                      render: (price) => `₹${price || 0}`
                    },
                    { 
                      title: 'Total', 
                      render: (_, item) => `₹${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}`
                    },
                    { 
                      title: 'Status', 
                      dataIndex: 'status',
                      render: (status) => (
                        <Tag color={status === 'fulfilled' ? 'green' : 'default'}>
                          {status || 'pending'}
                        </Tag>
                      )
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DispatchOrdersManagement;