import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Select,
  Tag,
  Space,
  message,
  Tooltip,
  Spin,
  Empty,
  Typography,
  Row,
  Col,
  Statistic,
  Collapse,
  Switch,
  InputNumber,
  Popconfirm,
  Badge
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  ReloadOutlined,
  StarOutlined,
  StarFilled,
  SettingOutlined,
  NodeIndexOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const StepPositionMapping = () => {
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [priority, setPriority] = useState(0);
  const [linkLoading, setLinkLoading] = useState(false);

  const fetchStepPositions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v2/production/equipment/step-positions');
      if (response.data.success) {
        setSteps(response.data.steps || []);
        setAvailablePositions(response.data.availablePositions || []);
      }
    } catch (error) {
      console.error('Error fetching step positions:', error);
      message.error('Failed to load step positions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStepPositions();
  }, [fetchStepPositions]);

  const handleLinkPosition = async () => {
    if (!selectedStep || !selectedPositionId) {
      message.error('Please select a position');
      return;
    }

    setLinkLoading(true);
    try {
      const response = await axios.post('/api/v2/production/equipment/step-positions', {
        stepId: selectedStep.stepId,
        positionId: selectedPositionId,
        isPrimary,
        priority
      });

      if (response.data.success) {
        message.success('Position linked successfully');
        setLinkModalVisible(false);
        setSelectedStep(null);
        setSelectedPositionId(null);
        setIsPrimary(false);
        setPriority(0);
        fetchStepPositions();
      }
    } catch (error) {
      console.error('Error linking position:', error);
      message.error(error.response?.data?.message || 'Failed to link position');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkPosition = async (mappingId) => {
    try {
      const response = await axios.delete(`/api/v2/production/equipment/step-positions/${mappingId}`);
      if (response.data.success) {
        message.success('Position unlinked successfully');
        fetchStepPositions();
      }
    } catch (error) {
      console.error('Error unlinking position:', error);
      message.error('Failed to unlink position');
    }
  };

  const handleSetPrimary = async (mappingId) => {
    try {
      const response = await axios.put(`/api/v2/production/equipment/step-positions/${mappingId}`, {
        isPrimary: true
      });
      if (response.data.success) {
        message.success('Primary position updated');
        fetchStepPositions();
      }
    } catch (error) {
      console.error('Error updating primary:', error);
      message.error('Failed to update primary position');
    }
  };

  const openLinkModal = (step) => {
    setSelectedStep(step);
    setSelectedPositionId(null);
    setIsPrimary(false);
    setPriority(0);
    setLinkModalVisible(true);
  };

  // Calculate stats
  const totalSteps = steps.length;
  const stepsWithPositions = steps.filter(s => s.positions && s.positions.length > 0).length;
  const totalMappings = steps.reduce((acc, s) => acc + (s.positions?.length || 0), 0);
  const stepsWithEquipment = steps.filter(s => s.equipment && s.equipment.length > 0).length;

  // Group positions by location for easier selection
  const positionsByLocation = availablePositions.reduce((acc, pos) => {
    const key = `${pos.locationName} > ${pos.areaName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(pos);
    return acc;
  }, {});

  const columns = [
    {
      title: 'Step',
      dataIndex: 'stepName',
      key: 'stepName',
      width: 200,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Positions',
      dataIndex: 'positions',
      key: 'positions',
      render: (positions, record) => {
        if (!positions || positions.length === 0) {
          return <Text type="secondary">No positions assigned</Text>;
        }
        return (
          <Space wrap>
            {positions.map((pos) => (
              <Tag
                key={pos.id}
                color={pos.isPrimary ? 'gold' : 'blue'}
                icon={pos.isPrimary ? <StarFilled /> : <EnvironmentOutlined />}
                closable
                onClose={(e) => {
                  e.preventDefault();
                  handleUnlinkPosition(pos.id);
                }}
              >
                <Tooltip title={`${pos.locationName} > ${pos.areaName}`}>
                  {pos.positionName}
                </Tooltip>
              </Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Equipment',
      dataIndex: 'equipment',
      key: 'equipment',
      width: 200,
      render: (equipment) => {
        if (!equipment || equipment.length === 0) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Space wrap>
            {equipment.map((eq) => (
              <Tag key={eq.equipmentId} icon={<ToolOutlined />} color="purple">
                {eq.equipmentName}
                {eq.isRequired && <Badge status="error" style={{ marginLeft: 4 }} />}
              </Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Duration',
      dataIndex: 'defaultDurationMinutes',
      key: 'defaultDurationMinutes',
      width: 100,
      render: (val) => val ? `${val} min` : '-'
    },
    {
      title: 'Base Cost',
      dataIndex: 'baseCostPerUnit',
      key: 'baseCostPerUnit',
      width: 100,
      render: (val) => val ? `₹${Number(val).toFixed(2)}` : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Add Position">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => openLinkModal(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // Filter out already linked positions for the selected step
  const getAvailablePositionsForStep = () => {
    if (!selectedStep) return availablePositions;
    const linkedPositionIds = selectedStep.positions?.map(p => p.positionId) || [];
    return availablePositions.filter(p => !linkedPositionIds.includes(p.positionId));
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <NodeIndexOutlined style={{ marginRight: '8px' }} />
            Step-Position Mapping
          </Title>
          <Text type="secondary">Configure which production positions can perform each step</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchStepPositions} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Steps"
              value={totalSteps}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Steps with Positions"
              value={stepsWithPositions}
              suffix={`/ ${totalSteps}`}
              valueStyle={{ color: stepsWithPositions === totalSteps ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Mappings"
              value={totalMappings}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Steps with Equipment"
              value={stepsWithEquipment}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={steps}
          rowKey="stepId"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: <Empty description="No production steps found" />
          }}
        />
      </Card>

      {/* Available Positions Panel */}
      <Card style={{ marginTop: '24px' }}>
        <Collapse>
          <Panel header={`Available Production Positions (${availablePositions.length})`} key="1">
            {Object.entries(positionsByLocation).map(([location, positions]) => (
              <div key={location} style={{ marginBottom: '16px' }}>
                <Text strong>{location}</Text>
                <div style={{ marginTop: '8px' }}>
                  {positions.map((pos) => (
                    <Tag key={pos.positionId} icon={<EnvironmentOutlined />} style={{ marginBottom: '4px' }}>
                      {pos.positionName}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
            {availablePositions.length === 0 && (
              <Empty description="No production positions available. Create positions in production locations first." />
            )}
          </Panel>
        </Collapse>
      </Card>

      {/* Link Position Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            Link Position to Step
          </Space>
        }
        open={linkModalVisible}
        onCancel={() => setLinkModalVisible(false)}
        onOk={handleLinkPosition}
        confirmLoading={linkLoading}
        okText="Link Position"
      >
        {selectedStep && (
          <div style={{ marginBottom: '16px' }}>
            <Text>Linking position to: </Text>
            <Tag color="blue">{selectedStep.stepName}</Tag>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>Position *</Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Select a position"
            value={selectedPositionId}
            onChange={setSelectedPositionId}
            showSearch
            optionFilterProp="children"
          >
            {Object.entries(positionsByLocation).map(([location, positions]) => {
              const availablePos = positions.filter(p =>
                !selectedStep?.positions?.some(sp => sp.positionId === p.positionId)
              );
              if (availablePos.length === 0) return null;
              return (
                <Select.OptGroup key={location} label={location}>
                  {availablePos.map((pos) => (
                    <Option key={pos.positionId} value={pos.positionId}>
                      {pos.positionName}
                    </Option>
                  ))}
                </Select.OptGroup>
              );
            })}
          </Select>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Primary Position</Text>
            <Switch
              checked={isPrimary}
              onChange={setIsPrimary}
              checkedChildren={<StarFilled />}
              unCheckedChildren={<StarOutlined />}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
              Default position for this step
            </Text>
          </Col>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Priority</Text>
            <InputNumber
              min={0}
              max={100}
              value={priority}
              onChange={setPriority}
              style={{ width: '100%' }}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
              Higher = more preferred
            </Text>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default StepPositionMapping;
