import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Tag,
  Progress,
  Space,
  Popconfirm,
  message,
  Badge,
  Tooltip,
  Divider,
  Statistic,
  Timeline
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ToolOutlined,
  UserOutlined,
  CalendarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;

const ProductionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState({ alloys: [], tyres: [] });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRequests();
    fetchLocations();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await client.get('/inventory/production/requests');
      setRequests(response.data.data.requests);
    } catch (error) {
      message.error('Failed to fetch production requests');
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await client.get('/inventory/internal/locations');
      setLocations(response.data.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchProducts = async (productType) => {
    try {
      const response = await client.get(`/inventory/products/${productType}`);
      setProducts(prev => ({
        ...prev,
        [productType + 's']: response.data.data
      }));
    } catch (error) {
      console.error(`Error fetching ${productType} products:`, error);
    }
  };

  const handleCreateRequest = async (values) => {
    try {
      const requestData = {
        items: values.items.map(item => ({
          productType: item.productType,
          productId: item.productId,
          quantity: item.quantity,
          preferredLocationId: item.preferredLocationId,
          notes: item.notes
        })),
        productionOrderId: values.productionOrderId,
        requiredDate: values.requiredDate?.format('YYYY-MM-DD'),
        priority: values.priority,
        notes: values.notes
      };

      await client.post('/inventory/production/requests', requestData);
      message.success('Production request created successfully');
      setModalVisible(false);
      form.resetFields();
      fetchRequests();
    } catch (error) {
      message.error('Failed to create production request');
      console.error('Error creating request:', error);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await client.post(`/inventory/production/requests/${requestId}/approve`);
      message.success('Production request approved and materials reserved');
      fetchRequests();
    } catch (error) {
      message.error('Failed to approve request: ' + (error.response?.data?.message || error.message));
      console.error('Error approving request:', error);
    }
  };

  const handleCancelRequest = async (requestId, reason) => {
    try {
      await client.post(`/inventory/production/requests/${requestId}/cancel`, { reason });
      message.success('Production request cancelled');
      fetchRequests();
    } catch (error) {
      message.error('Failed to cancel request');
      console.error('Error cancelling request:', error);
    }
  };

  const viewRequestDetails = async (requestId) => {
    try {
      const response = await client.get(`/inventory/production/requests/${requestId}`);
      setSelectedRequest(response.data.data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch request details');
      console.error('Error fetching details:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      approved: 'blue',
      in_progress: 'purple',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'green',
      normal: 'blue',
      high: 'orange',
      urgent: 'red'
    };
    return colors[priority] || 'default';
  };

  const columns = [
    {
      title: 'Request',
      key: 'request',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.request_number}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Created: {moment(record.created_at).format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            By: {record.requested_by_name}
          </div>
        </div>
      ),
      width: 150
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      ),
      width: 100
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority?.toUpperCase()}
        </Tag>
      ),
      width: 80
    },
    {
      title: 'Items',
      key: 'items',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.total_items} Items
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Fulfilled: {record.fulfilled_items}
          </div>
          <Progress 
            percent={record.progress_percentage} 
            size="small" 
            style={{ marginTop: '4px' }}
          />
        </div>
      ),
      width: 120
    },
    {
      title: 'Required Date',
      dataIndex: 'required_date',
      key: 'required_date',
      render: (date, record) => {
        if (!date) return '-';
        const isOverdue = moment(date).isBefore(moment()) && 
                         record.status !== 'completed';
        return (
          <div style={{ color: isOverdue ? 'red' : 'inherit' }}>
            {moment(date).format('DD/MM/YYYY')}
            {isOverdue && (
              <div style={{ fontSize: '10px', color: 'red' }}>
                Overdue
              </div>
            )}
          </div>
        );
      },
      width: 100
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order_id',
      key: 'production_order_id',
      render: (id) => id ? `PO-${id}` : '-',
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => viewRequestDetails(record.id)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Approve Request">
              <Popconfirm
                title="Approve this request?"
                description="This will reserve inventory for the requested items."
                onConfirm={() => handleApproveRequest(record.id)}
                okText="Approve"
                cancelText="Cancel"
              >
                <Button 
                  type="link" 
                  icon={<CheckCircleOutlined />}
                  style={{ color: 'green' }}
                />
              </Popconfirm>
            </Tooltip>
          )}
          {['pending', 'approved'].includes(record.status) && (
            <Tooltip title="Cancel Request">
              <Popconfirm
                title="Cancel this request?"
                description="Please provide a reason for cancellation"
                onConfirm={(e) => {
                  const reason = prompt('Please provide a reason for cancellation:');
                  if (reason) handleCancelRequest(record.id, reason);
                }}
                okText="Cancel Request"
                cancelText="Keep"
                okType="danger"
              >
                <Button 
                  type="link" 
                  icon={<CloseCircleOutlined />}
                  style={{ color: 'red' }}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
      width: 120
    }
  ];

  const getRequestStats = () => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const inProgress = requests.filter(r => r.status === 'in_progress').length;
    const completed = requests.filter(r => r.status === 'completed').length;

    return { total, pending, approved, inProgress, completed };
  };

  const stats = getRequestStats();

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <FileTextOutlined style={{ marginRight: '8px' }} />
              Production Material Requests
            </h1>
            <p style={{ margin: 0, color: '#666' }}>
              Manage material requests from production teams
            </p>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setModalVisible(true);
              }}
            >
              New Request
            </Button>
          </Col>
        </Row>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Total Requests"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Requests Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={requests}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create Request Modal */}
      <Modal
        title="Create Production Material Request"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRequest}
          initialValues={{
            priority: 'normal',
            items: [{}]
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority">
                  <Option value="low">Low</Option>
                  <Option value="normal">Normal</Option>
                  <Option value="high">High</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="requiredDate"
                label="Required Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="productionOrderId"
            label="Production Order ID (Optional)"
          >
            <Input placeholder="Link to production order" />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4>Request Items</h4>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                    Add Item
                  </Button>
                </div>

                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} style={{ marginBottom: '16px' }} size="small">
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'productType']}
                          label="Product Type"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Select 
                            placeholder="Select type"
                            onChange={(value) => fetchProducts(value)}
                          >
                            <Option value="alloy">Alloy</Option>
                            <Option value="tyre">Tyre</Option>
                            <Option value="ppf">PPF</Option>
                            <Option value="caps">Caps</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'productId']}
                          label="Product"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Select placeholder="Select product">
                            {/* Product options would be populated based on productType */}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Quantity"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input type="number" min={1} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'preferredLocationId']}
                          label="Preferred Location"
                        >
                          <Select placeholder="Select location">
                            {locations.map(loc => (
                              <Option key={loc.id} value={loc.id}>
                                {loc.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Form.Item label=" ">
                          <Button 
                            type="text" 
                            danger 
                            onClick={() => remove(name)}
                            disabled={fields.length === 1}
                          >
                            Remove
                          </Button>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      {...restField}
                      name={[name, 'notes']}
                      label="Item Notes"
                    >
                      <TextArea rows={2} placeholder="Optional notes for this item" />
                    </Form.Item>
                  </Card>
                ))}
              </>
            )}
          </Form.List>

          <Form.Item
            name="notes"
            label="General Notes"
          >
            <TextArea rows={3} placeholder="Additional notes or special instructions" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Request Details Modal */}
      <Modal
        title={`Request Details - ${selectedRequest?.request_number}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={null}
        width={900}
      >
        {selectedRequest && (
          <div>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <Statistic
                  title="Status"
                  value={selectedRequest.status?.toUpperCase()}
                  valueStyle={{ color: getStatusColor(selectedRequest.status) }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Priority"
                  value={selectedRequest.priority?.toUpperCase()}
                  valueStyle={{ color: getPriorityColor(selectedRequest.priority) }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Progress"
                  value={selectedRequest.progress_percentage}
                  suffix="%"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Required Date"
                  value={selectedRequest.required_date ? 
                    moment(selectedRequest.required_date).format('DD/MM/YYYY') : 'Not set'}
                />
              </Col>
            </Row>

            <Divider />

            <h4>Request Items</h4>
            <Table
              dataSource={selectedRequest.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Product',
                  render: (record) => (
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {record.product_details?.product_name || record.product_details?.brand}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {record.product_type?.toUpperCase()} • {record.product_details?.size}
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Requested',
                  dataIndex: 'quantity_requested',
                  width: 80
                },
                {
                  title: 'Fulfilled',
                  dataIndex: 'quantity_fulfilled',
                  width: 80
                },
                {
                  title: 'Progress',
                  render: (record) => (
                    <Progress 
                      percent={record.fulfillment_percentage}
                      size="small"
                    />
                  ),
                  width: 100
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (status) => (
                    <Tag size="small" color={getStatusColor(status)}>
                      {status?.toUpperCase()}
                    </Tag>
                  ),
                  width: 80
                }
              ]}
            />

            {selectedRequest.notes && (
              <div style={{ marginTop: '16px' }}>
                <h4>Notes</h4>
                <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  {selectedRequest.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductionRequests;