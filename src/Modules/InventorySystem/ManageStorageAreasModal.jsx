import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Table,
  Space,
  message,
  Popconfirm,
  Tag,
  Collapse,
  Select,
  InputNumber,
  Empty,
  Spin,
  Typography,
  Divider,
  Card,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';

const { Panel } = Collapse;
const { Option } = Select;
const { Text } = Typography;

const ManageStorageAreasModal = ({
  visible,
  onCancel,
  onSuccess,
  locationId,
  locationName,
  storageAreas = []
}) => {
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);

  // Area types from API
  const [areaTypes, setAreaTypes] = useState([]);
  const [loadingAreaTypes, setLoadingAreaTypes] = useState(false);

  // Area form state
  const [areaForm] = Form.useForm();
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [areaFormVisible, setAreaFormVisible] = useState(false);
  const [savingArea, setSavingArea] = useState(false);

  // Position form state
  const [positionForm] = Form.useForm();
  const [editingPositionId, setEditingPositionId] = useState(null);
  const [positionFormVisible, setPositionFormVisible] = useState(null); // areaId or null
  const [savingPosition, setSavingPosition] = useState(false);

  // Fetch area types from API
  const fetchAreaTypes = async () => {
    if (!locationId) return;

    setLoadingAreaTypes(true);
    try {
      const response = await client.get(`/inventory/internal/locations/${locationId}/area-types`);
      if (response.data.success) {
        setAreaTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching area types:', error);
      // Fallback to default types if API fails
      setAreaTypes([
        { id: 1, typeCode: 'general', typeName: 'General Storage', color: 'default', allowMultiple: true, isAvailable: true },
        { id: 2, typeCode: 'production', typeName: 'Production Area', color: 'red', allowMultiple: false, isAvailable: true },
        { id: 3, typeCode: 'receiving', typeName: 'Receiving Area', color: 'blue', allowMultiple: true, isAvailable: true },
        { id: 4, typeCode: 'staging', typeName: 'Staging Area', color: 'orange', allowMultiple: true, isAvailable: true },
        { id: 5, typeCode: 'returns', typeName: 'Returns Area', color: 'purple', allowMultiple: true, isAvailable: true }
      ]);
    } finally {
      setLoadingAreaTypes(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setAreas(storageAreas);
      fetchAreaTypes();
    }
  }, [visible, storageAreas, locationId]);

  // Area handlers
  const handleAddArea = () => {
    setEditingAreaId(null);
    areaForm.resetFields();
    setAreaFormVisible(true);
  };

  const handleEditArea = (area) => {
    setEditingAreaId(area.id);
    areaForm.setFieldsValue({
      name: area.areaName || area.area_name,
      description: area.description,
      areaType: area.areaType || area.area_type || 'general',
      capacity: area.capacity
    });
    setAreaFormVisible(true);
  };

  const handleSaveArea = async () => {
    try {
      const values = await areaForm.validateFields();
      setSavingArea(true);

      if (editingAreaId) {
        // Update existing area
        await client.put(`/inventory/internal/areas/${editingAreaId}`, values);
        message.success('Storage area updated successfully');

        // Update local state
        setAreas(prev => prev.map(area =>
          area.id === editingAreaId
            ? { ...area, areaName: values.name, area_name: values.name, description: values.description, areaType: values.areaType, area_type: values.areaType, capacity: values.capacity }
            : area
        ));
      } else {
        // Create new area
        const response = await client.post(`/inventory/internal/locations/${locationId}/areas`, values);
        message.success('Storage area created successfully');

        // Add to local state
        const newArea = response.data.data;
        setAreas(prev => [...prev, {
          ...newArea,
          areaName: newArea.area_name || values.name,
          positions: []
        }]);
      }

      setAreaFormVisible(false);
      areaForm.resetFields();
      setEditingAreaId(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving storage area:', error);
      message.error(error.response?.data?.message || 'Failed to save storage area');
    } finally {
      setSavingArea(false);
    }
  };

  const handleDeleteArea = async (areaId) => {
    try {
      setLoading(true);
      await client.delete(`/inventory/internal/areas/${areaId}`);
      message.success('Storage area deleted successfully');

      // Remove from local state
      setAreas(prev => prev.filter(area => area.id !== areaId));
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting storage area:', error);
      message.error(error.response?.data?.message || 'Failed to delete storage area');
    } finally {
      setLoading(false);
    }
  };

  // Position handlers
  const handleAddPosition = (areaId) => {
    setEditingPositionId(null);
    positionForm.resetFields();
    setPositionFormVisible(areaId);
  };

  const handleEditPosition = (areaId, position) => {
    setEditingPositionId(position.id);
    positionForm.setFieldsValue({
      name: position.positionName || position.position_name,
      description: position.description,
      capacity: position.capacity
    });
    setPositionFormVisible(areaId);
  };

  const handleSavePosition = async (areaId) => {
    try {
      const values = await positionForm.validateFields();
      setSavingPosition(true);

      if (editingPositionId) {
        // Update existing position
        await client.put(`/inventory/internal/positions/${editingPositionId}`, values);
        message.success('Position updated successfully');

        // Update local state
        setAreas(prev => prev.map(area => {
          if (area.id === areaId) {
            return {
              ...area,
              positions: (area.positions || []).map(pos =>
                pos.id === editingPositionId
                  ? { ...pos, positionName: values.name, position_name: values.name, description: values.description, capacity: values.capacity }
                  : pos
              )
            };
          }
          return area;
        }));
      } else {
        // Create new position
        const response = await client.post(`/inventory/internal/areas/${areaId}/positions`, values);
        message.success('Position created successfully');

        // Add to local state
        const newPosition = response.data.data;
        setAreas(prev => prev.map(area => {
          if (area.id === areaId) {
            return {
              ...area,
              positions: [...(area.positions || []), {
                ...newPosition,
                positionName: newPosition.position_name || values.name
              }]
            };
          }
          return area;
        }));
      }

      setPositionFormVisible(null);
      positionForm.resetFields();
      setEditingPositionId(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving position:', error);
      message.error(error.response?.data?.message || 'Failed to save position');
    } finally {
      setSavingPosition(false);
    }
  };

  const handleDeletePosition = async (areaId, positionId) => {
    try {
      setLoading(true);
      await client.delete(`/inventory/internal/positions/${positionId}`);
      message.success('Position deleted successfully');

      // Remove from local state
      setAreas(prev => prev.map(area => {
        if (area.id === areaId) {
          return {
            ...area,
            positions: (area.positions || []).filter(pos => pos.id !== positionId)
          };
        }
        return area;
      }));
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting position:', error);
      message.error(error.response?.data?.message || 'Failed to delete position');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAreaFormVisible(false);
    setPositionFormVisible(null);
    setEditingAreaId(null);
    setEditingPositionId(null);
    areaForm.resetFields();
    positionForm.resetFields();
    onCancel?.();
  };

  // Position columns
  const positionColumns = (areaId) => [
    {
      title: 'Position Name',
      dataIndex: 'positionName',
      key: 'positionName',
      render: (_, record) => record.positionName || record.position_name
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-'
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPosition(areaId, record)}
          />
          <Popconfirm
            title="Delete this position?"
            description="This action cannot be undone if no inventory is stored here."
            onConfirm={() => handleDeletePosition(areaId, record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Build color and label maps from API data
  const areaTypeColors = areaTypes.reduce((acc, type) => {
    acc[type.typeCode] = type.color || 'default';
    return acc;
  }, {});

  const areaTypeLabels = areaTypes.reduce((acc, type) => {
    acc[type.typeCode] = type.typeName;
    return acc;
  }, {});

  // Helper to check if a type is available for selection
  const isTypeAvailable = (typeCode) => {
    const typeData = areaTypes.find(t => t.typeCode === typeCode);
    if (!typeData) return true;

    // If we're editing an area with this type, it's available
    if (editingAreaId) {
      const editingArea = areas.find(a => a.id === editingAreaId);
      if (editingArea && (editingArea.areaType === typeCode || editingArea.area_type === typeCode)) {
        return true;
      }
    }

    return typeData.isAvailable !== false;
  };

  return (
    <Modal
      title={
        <Space>
          <AppstoreOutlined />
          <span>Manage Storage Areas - {locationName}</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={900}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {/* Add Area Button */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary">
            Define storage areas and positions within this location to organize inventory better.
          </Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddArea}
          >
            Add Storage Area
          </Button>
        </div>

        {/* Area Form */}
        {areaFormVisible && (
          <Card
            size="small"
            title={editingAreaId ? 'Edit Storage Area' : 'New Storage Area'}
            style={{ marginBottom: '16px' }}
            extra={
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => {
                  setAreaFormVisible(false);
                  setEditingAreaId(null);
                  areaForm.resetFields();
                }}
              />
            }
          >
            <Form form={areaForm} layout="vertical">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="name"
                    label="Area Name"
                    rules={[{ required: true, message: 'Please enter area name' }]}
                  >
                    <Input placeholder="e.g., Rack A, Shelf 1, Zone B" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="areaType"
                    label="Area Type"
                    initialValue="general"
                    tooltip="Some area types may only be created once per location"
                  >
                    <Select loading={loadingAreaTypes}>
                      {areaTypes.map(type => (
                        <Option
                          key={type.typeCode}
                          value={type.typeCode}
                          disabled={!isTypeAvailable(type.typeCode)}
                        >
                          {type.typeName}
                          {!isTypeAvailable(type.typeCode) && !type.allowMultiple ? ' (already exists)' : ''}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="capacity"
                    label="Capacity (optional)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="Max items"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="description"
                label="Description (optional)"
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Additional details about this storage area..."
                  maxLength={255}
                />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => {
                    setAreaFormVisible(false);
                    setEditingAreaId(null);
                    areaForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={savingArea}
                    onClick={handleSaveArea}
                  >
                    {editingAreaId ? 'Update Area' : 'Create Area'}
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        )}

        {/* Areas List */}
        {areas.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No storage areas defined yet"
          >
            <Button type="primary" onClick={handleAddArea}>
              Create First Area
            </Button>
          </Empty>
        ) : (
          <Collapse accordion>
            {areas.map(area => (
              <Panel
                key={area.id}
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '8px' }}>
                    <Space>
                      <EnvironmentOutlined />
                      <span style={{ fontWeight: 500 }}>{area.areaName || area.area_name}</span>
                      <Tag color={areaTypeColors[area.areaType || area.area_type] || 'default'}>
                        {areaTypeLabels[area.areaType || area.area_type] || 'General Storage'}
                      </Tag>
                      {area.capacity && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Capacity: {area.capacity}
                        </Text>
                      )}
                    </Space>
                    <Space onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditArea(area)}
                      />
                      <Popconfirm
                        title="Delete this storage area?"
                        description="All positions in this area will also be deleted."
                        onConfirm={() => handleDeleteArea(area.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                }
              >
                {area.description && (
                  <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                    {area.description}
                  </Text>
                )}

                <Divider orientation="left" plain style={{ margin: '8px 0' }}>
                  Positions
                </Divider>

                {/* Add Position Button */}
                <div style={{ marginBottom: '12px' }}>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddPosition(area.id)}
                  >
                    Add Position
                  </Button>
                </div>

                {/* Position Form */}
                {positionFormVisible === area.id && (
                  <Card size="small" style={{ marginBottom: '12px' }}>
                    <Form form={positionForm} layout="inline" style={{ flexWrap: 'wrap', gap: '8px' }}>
                      <Form.Item
                        name="name"
                        rules={[{ required: true, message: 'Required' }]}
                        style={{ flex: 1, minWidth: '150px' }}
                      >
                        <Input placeholder="Position name (e.g., A1, B2)" />
                      </Form.Item>
                      <Form.Item
                        name="description"
                        style={{ flex: 2, minWidth: '200px' }}
                      >
                        <Input placeholder="Description (optional)" />
                      </Form.Item>
                      <Form.Item
                        name="capacity"
                        style={{ width: '100px' }}
                      >
                        <InputNumber placeholder="Capacity" min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item>
                        <Space>
                          <Button
                            type="primary"
                            size="small"
                            loading={savingPosition}
                            onClick={() => handleSavePosition(area.id)}
                          >
                            {editingPositionId ? 'Update' : 'Add'}
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setPositionFormVisible(null);
                              setEditingPositionId(null);
                              positionForm.resetFields();
                            }}
                          >
                            Cancel
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                )}

                {/* Positions Table */}
                {(area.positions || []).length > 0 ? (
                  <Table
                    size="small"
                    dataSource={area.positions || []}
                    columns={positionColumns(area.id)}
                    rowKey="id"
                    pagination={false}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No positions defined"
                    style={{ margin: '16px 0' }}
                  />
                )}
              </Panel>
            ))}
          </Collapse>
        )}
      </Spin>
    </Modal>
  );
};

export default ManageStorageAreasModal;
