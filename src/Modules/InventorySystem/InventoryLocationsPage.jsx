import React, { useState, useEffect, useCallback } from 'react';
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
  Space,
  message,
  Badge,
  Tooltip,
  Empty,
  Typography
} from 'antd';
import {
  EnvironmentOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  BoxPlotOutlined,
  ReloadOutlined,
  ShopOutlined,
  InboxOutlined,
  DatabaseOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { client } from '../../Utils/axiosClient';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const InventoryLocationsPage = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form] = Form.useForm();

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.get('/inventory/internal/locations');
      setLocations(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch locations');
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

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

  const openEditModal = (location, e) => {
    e.stopPropagation();
    setEditingLocation(location);
    form.setFieldsValue({
      name: location.name,
      description: location.description,
      address: location.address,
      locationType: location.locationType,
      isActive: location.isActive
    });
    setModalVisible(true);
  };

  const viewLocationDetails = (location) => {
    navigate(`/inventory-locations/${location.id}`);
  };

  const getLocationTypeColor = (type) => {
    const colors = {
      'warehouse': 'blue',
      'production': 'green',
      'storage': 'orange'
    };
    return colors[type] || 'default';
  };

  const getLocationTypeIcon = (type) => {
    const icons = {
      'warehouse': <ShopOutlined />,
      'production': <DatabaseOutlined />,
      'storage': <InboxOutlined />
    };
    return icons[type] || <EnvironmentOutlined />;
  };

  const calculateLocationStats = (summary) => {
    if (!summary || summary.length === 0) {
      return { totalQuantity: 0, totalValue: 0, productCount: 0 };
    }
    return {
      totalQuantity: summary.reduce((sum, item) => sum + (item.totalQuantity || 0), 0),
      totalValue: summary.reduce((sum, item) => sum + parseFloat(item.totalValue || 0), 0),
      productCount: summary.reduce((sum, item) => sum + (item.productCount || 0), 0)
    };
  };

  const columns = [
    {
      title: 'Location',
      key: 'location',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            {getLocationTypeIcon(record.locationType)}
            <span style={{ marginLeft: '8px' }}>{record.name}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {record.description}
          </div>
          {record.address && (
            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
              📍 {record.address}
            </div>
          )}
        </div>
      ),
      width: 280
    },
    {
      title: 'Type',
      dataIndex: 'locationType',
      key: 'locationType',
      render: (type) => (
        <Tag color={getLocationTypeColor(type)}>
          {type?.toUpperCase()}
        </Tag>
      ),
      width: 120
    },
    {
      title: 'Storage Areas',
      key: 'areas',
      render: (record) => {
        const areas = record.areas || [];
        return (
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {areas.length} Areas
            </div>
            {areas.length > 0 && (
              <div style={{ fontSize: '11px', color: '#666' }}>
                {areas.slice(0, 2).map(area => area.areaName).join(', ')}
                {areas.length > 2 && ` +${areas.length - 2} more`}
              </div>
            )}
          </div>
        );
      },
      width: 140
    },
    {
      title: 'Inventory Summary',
      key: 'inventory',
      render: (record) => {
        const summary = record.inventory_summary || [];
        const stats = calculateLocationStats(summary);

        return (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Total Items"
                  value={stats.totalQuantity}
                  valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Products"
                  value={stats.productCount}
                  valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                />
              </Col>
            </Row>
          </div>
        );
      },
      width: 200
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Badge
          status={isActive ? 'success' : 'error'}
          text={isActive ? 'Active' : 'Inactive'}
        />
      ),
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => viewLocationDetails(record)}
            >
              View Details
            </Button>
          </Tooltip>
          <Tooltip title="Edit Location">
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={(e) => openEditModal(record, e)}
            />
          </Tooltip>
        </Space>
      ),
      width: 200
    }
  ];

  // Calculate overall stats
  const overallStats = locations.reduce((acc, loc) => {
    const summary = loc.inventory_summary || [];
    const stats = calculateLocationStats(summary);
    return {
      totalLocations: acc.totalLocations + 1,
      activeLocations: acc.activeLocations + (loc.isActive ? 1 : 0),
      totalItems: acc.totalItems + stats.totalQuantity,
      totalProducts: acc.totalProducts + stats.productCount
    };
  }, { totalLocations: 0, activeLocations: 0, totalItems: 0, totalProducts: 0 });

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <EnvironmentOutlined style={{ marginRight: '12px' }} />
              Inventory Locations
            </Title>
            <Text type="secondary">Manage warehouse locations and view their inventory</Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchLocations}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
              >
                Add Location
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Locations"
              value={overallStats.totalLocations}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Locations"
              value={overallStats.activeLocations}
              valueStyle={{ color: '#52c41a' }}
              prefix={<Badge status="success" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Items in Stock"
              value={overallStats.totalItems}
              prefix={<BoxPlotOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Unique Products"
              value={overallStats.totalProducts}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Locations Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={locations}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} locations`
          }}
          locale={{
            emptyText: <Empty description="No locations found" />
          }}
          onRow={(record) => ({
            onClick: () => viewLocationDetails(record),
            style: { cursor: 'pointer' }
          })}
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
        >
          <Form.Item
            name="name"
            label="Location Name"
            rules={[{ required: true, message: 'Please enter location name' }]}
          >
            <Input placeholder="e.g., Main Warehouse" />
          </Form.Item>

          <Form.Item
            name="locationType"
            label="Location Type"
            rules={[{ required: true, message: 'Please select location type' }]}
          >
            <Select placeholder="Select location type">
              <Option value="warehouse">Warehouse</Option>
              <Option value="production">Production Floor</Option>
              <Option value="storage">Storage Area</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter location description" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
          >
            <Input placeholder="Enter address (optional)" />
          </Form.Item>

          {editingLocation && (
            <Form.Item
              name="isActive"
              label="Status"
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

export default InventoryLocationsPage;
