import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Tag,
  Statistic,
  Divider,
  Space,
  Popconfirm,
  message,
  Badge,
  Tooltip,
  Progress
} from 'antd';
import {
  EnvironmentOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BoxPlotOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Option } = Select;

const LocationsManagement = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await client.get('/inventory/internal/locations');
      setLocations(response.data.data);
    } catch (error) {
      message.error('Failed to fetch locations');
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async (values) => {
    try {
      await client.post('/inventory/internal/locations', {
        name: values.name,
        description: values.description,
        address: values.address,
        locationType: values.locationType
      });
      message.success('Location created successfully');
      setModalVisible(false);
      form.resetFields();
      fetchLocations();
    } catch (error) {
      message.error('Failed to create location');
      console.error('Error creating location:', error);
    }
  };

  const handleUpdateLocation = async (values) => {
    try {
      await client.put(`/inventory/internal/locations/${editingLocation.id}`, {
        name: values.name,
        description: values.description,
        address: values.address,
        locationType: values.locationType,
        isActive: values.isActive
      });
      message.success('Location updated successfully');
      setModalVisible(false);
      setEditingLocation(null);
      form.resetFields();
      fetchLocations();
    } catch (error) {
      message.error('Failed to update location');
      console.error('Error updating location:', error);
    }
  };

  const handleSubmit = (values) => {
    if (editingLocation) {
      handleUpdateLocation(values);
    } else {
      handleCreateLocation(values);
    }
  };

  const openCreateModal = () => {
    setEditingLocation(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (location) => {
    setEditingLocation(location);
    form.setFieldsValue({
      name: location.name,
      description: location.description,
      address: location.address,
      locationType: location.location_type,
      isActive: location.is_active
    });
    setModalVisible(true);
  };

  const getLocationTypeColor = (type) => {
    const colors = {
      'warehouse': 'blue',
      'production': 'green',
      'storage': 'orange'
    };
    return colors[type] || 'default';
  };

  const calculateLocationUtilization = (summary) => {
    if (!summary || summary.length === 0) return 0;
    const totalProducts = summary.reduce((sum, item) => sum + item.product_count, 0);
    return Math.min(100, (totalProducts / 50) * 100); // Assuming 50 products is 100% utilization
  };

  const columns = [
    {
      title: 'Location',
      key: 'location',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <EnvironmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            {record.name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.description}
          </div>
          {record.address && (
            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
              📍 {record.address}
            </div>
          )}
        </div>
      ),
      width: 250
    },
    {
      title: 'Type',
      dataIndex: 'location_type',
      key: 'location_type',
      render: (type) => (
        <Tag color={getLocationTypeColor(type)}>
          {type?.toUpperCase()}
        </Tag>
      ),
      width: 100
    },
    {
      title: 'Storage Areas',
      key: 'areas',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.areas?.length || 0} Areas
          </div>
          {record.areas && record.areas.length > 0 && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              {record.areas.slice(0, 2).map(area => area.area_name).join(', ')}
              {record.areas.length > 2 && ` +${record.areas.length - 2} more`}
            </div>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Inventory Summary',
      key: 'inventory',
      render: (record) => {
        const summary = record.inventory_summary || [];
        const totalQuantity = summary.reduce((sum, item) => sum + item.total_quantity, 0);
        const totalValue = summary.reduce((sum, item) => sum + item.total_value, 0);
        const utilization = calculateLocationUtilization(summary);
        
        return (
          <div>
            <Row gutter={8}>
              <Col span={12}>
                <Statistic
                  title="Items"
                  value={totalQuantity}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Value"
                  value={totalValue}
                  formatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>Utilization</div>
              <Progress 
                percent={utilization} 
                size="small" 
                status={utilization > 80 ? 'exception' : 'normal'}
              />
            </div>
          </div>
        );
      },
      width: 150
    },
    {
      title: 'Product Types',
      key: 'product_types',
      render: (record) => {
        const summary = record.inventory_summary || [];
        return (
          <div>
            {summary.map((item, index) => (
              <Tag key={index} size="small">
                {item.product_type?.toUpperCase()}: {item.product_count}
              </Tag>
            ))}
            {summary.length === 0 && <span style={{ color: '#ccc' }}>No inventory</span>}
          </div>
        );
      },
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Badge 
          status={isActive ? 'success' : 'error'} 
          text={isActive ? 'Active' : 'Inactive'} 
        />
      ),
      width: 80
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Tooltip title="View Inventory">
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/inventory/locations/${record.id}/inventory`)}
            />
          </Tooltip>
          <Tooltip title="Edit Location">
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Add Inventory">
            <Button 
              type="link" 
              icon={<BoxPlotOutlined />}
              onClick={() => navigate(`/inventory/locations/${record.id}/add`)}
            />
          </Tooltip>
        </Space>
      ),
      width: 120
    }
  ];

  const getTotalStats = () => {
    const totalLocations = locations.length;
    const activeLocations = locations.filter(loc => loc.is_active).length;
    const totalItems = locations.reduce((sum, loc) => {
      return sum + (loc.inventory_summary || []).reduce((itemSum, item) => itemSum + item.total_quantity, 0);
    }, 0);
    const totalValue = locations.reduce((sum, loc) => {
      return sum + (loc.inventory_summary || []).reduce((valueSum, item) => valueSum + item.total_value, 0);
    }, 0);

    return { totalLocations, activeLocations, totalItems, totalValue };
  };

  const stats = getTotalStats();

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <EnvironmentOutlined style={{ marginRight: '8px' }} />
              Locations Management
            </h1>
            <p style={{ margin: 0, color: '#666' }}>
              Manage warehouse locations, storage areas, and inventory distribution
            </p>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Add Location
            </Button>
          </Col>
        </Row>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Locations"
              value={stats.totalLocations}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Locations"
              value={stats.activeLocations}
              suffix={`/${stats.totalLocations}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={stats.totalItems}
              prefix={<BoxPlotOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats.totalValue}
              formatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Locations Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={locations}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} locations`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create/Edit Location Modal */}
      <Modal
        title={editingLocation ? 'Edit Location' : 'Create New Location'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingLocation(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            locationType: 'warehouse',
            isActive: true
          }}
        >
          <Form.Item
            name="name"
            label="Location Name"
            rules={[
              { required: true, message: 'Please enter location name' },
              { min: 2, message: 'Location name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="e.g., Main Warehouse A1" />
          </Form.Item>

          <Form.Item
            name="locationType"
            label="Location Type"
            rules={[{ required: true, message: 'Please select location type' }]}
          >
            <Select placeholder="Select location type">
              <Option value="warehouse">Warehouse</Option>
              <Option value="production">Production</Option>
              <Option value="storage">Storage</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea 
              rows={3} 
              placeholder="Optional description of the location and its purpose"
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="Physical Address"
          >
            <TextArea 
              rows={2} 
              placeholder="Physical address or location details"
            />
          </Form.Item>

          {editingLocation && (
            <Form.Item
              name="isActive"
              label="Status"
              valuePropName="checked"
            >
              <Select>
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingLocation ? 'Update Location' : 'Create Location'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LocationsManagement;