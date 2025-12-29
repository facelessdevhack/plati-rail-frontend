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
  Divider,
  Space,
  Popconfirm,
  message,
  Badge,
  Tooltip,
  Tabs,
  InputNumber,
  DatePicker,
  Switch,
  Descriptions,
  Progress,
  Empty
} from 'antd';
import {
  ToolOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  DollarOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  ExportOutlined,
  EnvironmentOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const EquipmentManagement = () => {
  // State
  const [equipment, setEquipment] = useState([]);
  const [positions, setPositions] = useState([]);
  const [productionSteps, setProductionSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [activeTab, setActiveTab] = useState('1');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    totalValue: 0
  });
  const [form] = Form.useForm();
  const [linkForm] = Form.useForm();

  // Fetch equipment data
  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.get('/production/equipment');
      if (response.data.success) {
        setEquipment(response.data.equipment || []);
        setStats(response.data.stats || {
          total: 0,
          active: 0,
          maintenance: 0,
          totalValue: 0
        });
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      message.error('Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch positions for linking
  const fetchPositions = useCallback(async () => {
    try {
      const response = await client.get('/inventory/internal/locations');
      if (response.data.success) {
        // Extract positions from locations
        const allPositions = [];
        response.data.data.forEach(location => {
          if (location.areas) {
            location.areas.forEach(area => {
              if (area.positions) {
                area.positions.forEach(position => {
                  allPositions.push({
                    ...position,
                    areaName: area.area_name,
                    locationName: location.name,
                    locationId: location.id,
                    areaId: area.id
                  });
                });
              }
            });
          }
        });
        setPositions(allPositions);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  }, []);

  // Fetch production steps
  const fetchProductionSteps = useCallback(async () => {
    try {
      const response = await client.get('/production/steps');
      if (response.data.success) {
        setProductionSteps(response.data.steps || []);
      }
    } catch (error) {
      console.error('Error fetching production steps:', error);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
    fetchPositions();
    fetchProductionSteps();
  }, [fetchEquipment, fetchPositions, fetchProductionSteps]);

  // Handle create/update equipment
  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        purchaseDate: values.purchaseDate?.format('YYYY-MM-DD'),
        warrantyExpiry: values.warrantyExpiry?.format('YYYY-MM-DD'),
        lastMaintenanceDate: values.lastMaintenanceDate?.format('YYYY-MM-DD'),
        nextMaintenanceDate: values.nextMaintenanceDate?.format('YYYY-MM-DD')
      };

      if (editingEquipment) {
        await client.put(`/production/equipment/${editingEquipment.id}`, payload);
        message.success('Equipment updated successfully');
      } else {
        await client.post('/production/equipment', payload);
        message.success('Equipment created successfully');
      }

      setModalVisible(false);
      setEditingEquipment(null);
      form.resetFields();
      fetchEquipment();
    } catch (error) {
      console.error('Error saving equipment:', error);
      message.error(error.response?.data?.message || 'Failed to save equipment');
    }
  };

  // Handle delete equipment
  const handleDelete = async (id) => {
    try {
      await client.delete(`/production/equipment/${id}`);
      message.success('Equipment deleted successfully');
      fetchEquipment();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      message.error('Failed to delete equipment');
    }
  };

  // Handle link equipment to position
  const handleLinkToPosition = async (values) => {
    try {
      await client.post(`/production/equipment/${selectedEquipment.id}/position`, {
        positionId: values.positionId,
        isPrimary: values.isPrimary
      });
      message.success('Equipment linked to position successfully');
      setLinkModalVisible(false);
      linkForm.resetFields();
      fetchEquipment();
    } catch (error) {
      console.error('Error linking equipment:', error);
      message.error('Failed to link equipment to position');
    }
  };

  // Handle link equipment to step
  const handleLinkToStep = async (equipmentId, stepId, config) => {
    try {
      await client.post(`/production/equipment/${equipmentId}/step`, {
        stepId,
        ...config
      });
      message.success('Equipment linked to step successfully');
      fetchEquipment();
    } catch (error) {
      console.error('Error linking equipment to step:', error);
      message.error('Failed to link equipment to step');
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingEquipment(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Open edit modal
  const openEditModal = (record) => {
    setEditingEquipment(record);
    form.setFieldsValue({
      ...record,
      purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate) : null,
      warrantyExpiry: record.warrantyExpiry ? dayjs(record.warrantyExpiry) : null,
      lastMaintenanceDate: record.lastMaintenanceDate ? dayjs(record.lastMaintenanceDate) : null,
      nextMaintenanceDate: record.nextMaintenanceDate ? dayjs(record.nextMaintenanceDate) : null
    });
    setModalVisible(true);
  };

  // Open detail modal
  const openDetailModal = (record) => {
    setSelectedEquipment(record);
    setDetailModalVisible(true);
  };

  // Open link modal
  const openLinkModal = (record) => {
    setSelectedEquipment(record);
    linkForm.resetFields();
    setLinkModalVisible(true);
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      maintenance: 'orange',
      inactive: 'default',
      retired: 'red'
    };
    return colors[status] || 'default';
  };

  // Filter equipment
  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch =
      eq.equipmentName?.toLowerCase().includes(searchText.toLowerCase()) ||
      eq.equipmentCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      eq.equipmentType?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Table columns
  const columns = [
    {
      title: 'Equipment',
      key: 'equipment',
      width: 250,
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <ToolOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            {record.equipmentName}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Code: {record.equipmentCode}
          </div>
          {record.equipmentType && (
            <Tag color="blue" style={{ marginTop: '4px' }}>{record.equipmentType}</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Location',
      key: 'location',
      width: 200,
      render: (record) => (
        record.positions?.length > 0 ? (
          <div>
            {record.positions.map((pos, idx) => (
              <Tag key={idx} icon={<EnvironmentOutlined />}>
                {pos.positionName}
                {pos.isPrimary && <Badge status="success" style={{ marginLeft: 4 }} />}
              </Tag>
            ))}
          </div>
        ) : (
          <span style={{ color: '#999' }}>Not assigned</span>
        )
      )
    },
    {
      title: 'Costing',
      key: 'costing',
      width: 150,
      render: (record) => (
        <div style={{ fontSize: '12px' }}>
          {record.costPerUse > 0 && <div>Per Use: ₹{record.costPerUse}</div>}
          {record.costPerHour > 0 && <div>Per Hour: ₹{record.costPerHour}</div>}
          {record.costPerUnit > 0 && <div>Per Unit: ₹{record.costPerUnit}</div>}
          {!record.costPerUse && !record.costPerHour && !record.costPerUnit && (
            <span style={{ color: '#999' }}>Not configured</span>
          )}
        </div>
      )
    },
    {
      title: 'Capacity',
      key: 'capacity',
      width: 120,
      render: (record) => (
        <div style={{ fontSize: '12px' }}>
          {record.capacityPerHour && <div>{record.capacityPerHour}/hr</div>}
          {record.capacityPerDay && <div>{record.capacityPerDay}/day</div>}
        </div>
      )
    },
    {
      title: 'Maintenance',
      key: 'maintenance',
      width: 150,
      render: (record) => {
        if (!record.nextMaintenanceDate) return <span style={{ color: '#999' }}>Not scheduled</span>;

        const nextDate = dayjs(record.nextMaintenanceDate);
        const daysUntil = nextDate.diff(dayjs(), 'day');
        const isOverdue = daysUntil < 0;
        const isUpcoming = daysUntil <= 7 && daysUntil >= 0;

        return (
          <Tooltip title={`Next: ${nextDate.format('DD MMM YYYY')}`}>
            <Tag
              color={isOverdue ? 'red' : isUpcoming ? 'orange' : 'green'}
              icon={isOverdue ? <WarningOutlined /> : <CalendarOutlined />}
            >
              {isOverdue ? `Overdue by ${Math.abs(daysUntil)}d` : `In ${daysUntil}d`}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openDetailModal(record)}
            />
          </Tooltip>
          <Tooltip title="Link to Position">
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={() => openLinkModal(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this equipment?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Stats */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Equipment"
              value={stats.total}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active"
              value={stats.active}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Under Maintenance"
              value={stats.maintenance}
              valueStyle={{ color: '#faad14' }}
              prefix={<SettingOutlined spin />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats.totalValue}
              prefix="₹"
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card
        title={
          <span>
            <ToolOutlined style={{ marginRight: '8px' }} />
            Equipment Management
          </span>
        }
        extra={
          <Space>
            <Input
              placeholder="Search equipment..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="retired">Retired</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchEquipment}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Add Equipment
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredEquipment}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} equipment`
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingEquipment(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Tabs defaultActiveKey="1">
            <TabPane tab="Basic Info" key="1">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="equipmentCode"
                    label="Equipment Code"
                    rules={[{ required: true, message: 'Please enter equipment code' }]}
                  >
                    <Input placeholder="e.g., PVD-001" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="equipmentName"
                    label="Equipment Name"
                    rules={[{ required: true, message: 'Please enter equipment name' }]}
                  >
                    <Input placeholder="e.g., PVD Chamber 1" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="equipmentType" label="Equipment Type">
                    <Select placeholder="Select type" allowClear>
                      <Option value="PVD Chamber">PVD Chamber</Option>
                      <Option value="Spray Gun">Spray Gun</Option>
                      <Option value="CNC Machine">CNC Machine</Option>
                      <Option value="Polishing Machine">Polishing Machine</Option>
                      <Option value="Sandblasting Unit">Sandblasting Unit</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label="Status" initialValue="active">
                    <Select>
                      <Option value="active">Active</Option>
                      <Option value="maintenance">Under Maintenance</Option>
                      <Option value="inactive">Inactive</Option>
                      <Option value="retired">Retired</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="manufacturer" label="Manufacturer">
                    <Input placeholder="Manufacturer name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="modelNumber" label="Model Number">
                    <Input placeholder="Model number" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="Description">
                <TextArea rows={3} placeholder="Equipment description..." />
              </Form.Item>
            </TabPane>

            <TabPane tab="Costing" key="2">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="costPerUse" label="Cost Per Use (₹)">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="costPerHour" label="Cost Per Hour (₹)">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="costPerUnit" label="Cost Per Unit (₹)">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="consumablesCostPerUse" label="Consumables Per Use (₹)">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="powerCostPerHour" label="Power Cost/Hour (₹)">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </Col>
              </Row>
              <Divider>Purchase & Depreciation</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="purchaseCost" label="Purchase Cost (₹)">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="purchaseDate" label="Purchase Date">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="warrantyExpiry" label="Warranty Expiry">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="usefulLifeYears" label="Useful Life (Years)">
                    <InputNumber min={1} max={50} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="salvageValue" label="Salvage Value (₹)">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="depreciationMethod" label="Depreciation Method">
                    <Select placeholder="Select method">
                      <Option value="straight_line">Straight Line</Option>
                      <Option value="declining_balance">Declining Balance</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="Capacity & Maintenance" key="3">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="capacityPerHour" label="Capacity Per Hour (units)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="capacityPerDay" label="Capacity Per Day (units)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Divider>Maintenance Schedule</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="maintenanceIntervalDays" label="Maintenance Interval (days)">
                    <InputNumber min={1} style={{ width: '100%' }} placeholder="90" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="lastMaintenanceDate" label="Last Maintenance">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="nextMaintenanceDate" label="Next Maintenance">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
          </Tabs>

          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingEquipment(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingEquipment ? 'Update' : 'Create'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={
          <span>
            <ToolOutlined style={{ marginRight: '8px' }} />
            Equipment Details: {selectedEquipment?.equipmentName}
          </span>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedEquipment && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="Overview" key="1">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Code">{selectedEquipment.equipmentCode}</Descriptions.Item>
                <Descriptions.Item label="Name">{selectedEquipment.equipmentName}</Descriptions.Item>
                <Descriptions.Item label="Type">{selectedEquipment.equipmentType || '-'}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedEquipment.status)}>
                    {selectedEquipment.status?.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Manufacturer">{selectedEquipment.manufacturer || '-'}</Descriptions.Item>
                <Descriptions.Item label="Model">{selectedEquipment.modelNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  {selectedEquipment.description || '-'}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab="Costing" key="2">
              <Row gutter={16}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Cost Per Use"
                      value={selectedEquipment.costPerUse || 0}
                      prefix="₹"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Cost Per Hour"
                      value={selectedEquipment.costPerHour || 0}
                      prefix="₹"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Cost Per Unit"
                      value={selectedEquipment.costPerUnit || 0}
                      prefix="₹"
                    />
                  </Card>
                </Col>
              </Row>
              <Divider>Asset Value</Divider>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Purchase Cost">
                  ₹{selectedEquipment.purchaseCost || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Current Book Value">
                  ₹{selectedEquipment.currentBookValue || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Salvage Value">
                  ₹{selectedEquipment.salvageValue || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Depreciation Method">
                  {selectedEquipment.depreciationMethod || 'Straight Line'}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab="Positions & Steps" key="3">
              <h4>Assigned Positions</h4>
              {selectedEquipment.positions?.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  {selectedEquipment.positions.map((pos, idx) => (
                    <Tag key={idx} color="blue" style={{ marginBottom: 8 }}>
                      <EnvironmentOutlined /> {pos.locationName} / {pos.areaName} / {pos.positionName}
                      {pos.isPrimary && <Badge status="success" text="Primary" style={{ marginLeft: 8 }} />}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Empty description="No positions assigned" />
              )}

              <Divider />
              <h4>Required For Steps</h4>
              {selectedEquipment.steps?.length > 0 ? (
                <div>
                  {selectedEquipment.steps.map((step, idx) => (
                    <Tag key={idx} color="green" style={{ marginBottom: 8 }}>
                      <SettingOutlined /> {step.stepName}
                      {step.isRequired && <Badge status="processing" text="Required" style={{ marginLeft: 8 }} />}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Empty description="Not linked to any production steps" />
              )}
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* Link to Position Modal */}
      <Modal
        title={`Link ${selectedEquipment?.equipmentName} to Position`}
        open={linkModalVisible}
        onCancel={() => {
          setLinkModalVisible(false);
          linkForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={linkForm}
          layout="vertical"
          onFinish={handleLinkToPosition}
        >
          <Form.Item
            name="positionId"
            label="Select Position"
            rules={[{ required: true, message: 'Please select a position' }]}
          >
            <Select
              showSearch
              placeholder="Search and select position"
              optionFilterProp="children"
            >
              {positions.map(pos => (
                <Option key={pos.id} value={pos.id}>
                  {pos.locationName} / {pos.areaName} / {pos.position_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="isPrimary"
            label="Primary Position"
            valuePropName="checked"
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setLinkModalVisible(false);
                linkForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Link Equipment
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentManagement;
