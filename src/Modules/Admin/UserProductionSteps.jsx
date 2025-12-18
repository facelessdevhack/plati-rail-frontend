import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Input,
  Tooltip,
  Popconfirm,
  Alert,
  Spin
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  ToolOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';

const { Option } = Select;
const { Search } = Input;

const UserProductionSteps = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [availableSteps, setAvailableSteps] = useState([]);
  const [stats, setStats] = useState({});
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [bulkSelectedSteps, setBulkSelectedSteps] = useState([]);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users with their step assignments
      const usersResponse = await client.get('/user-production-steps');

      // Fetch statistics
      const statsResponse = await client.get('/user-production-steps/stats');

      if (usersResponse.data.success) {
        setUsers(usersResponse.data.users);
        setAvailableSteps(usersResponse.data.availableSteps);
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load user production steps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Assign a production step to a user
  const handleAssignStep = async (userId, stepId) => {
    try {
      const response = await client.post(
        '/user-production-steps/assign',
        { userId, stepId }
      );

      if (response.data.success) {
        message.success(response.data.message);
        fetchData();
      }
    } catch (error) {
      console.error('Error assigning step:', error);
      message.error(error.response?.data?.message || 'Failed to assign production step');
    }
  };

  // Bulk assign production steps
  const handleBulkAssign = async () => {
    if (!selectedUser || bulkSelectedSteps.length === 0) {
      message.warning('Please select a user and at least one production step');
      return;
    }

    try {
      const response = await client.post(
        '/user-production-steps/bulk-assign',
        {
          userId: selectedUser,
          stepIds: bulkSelectedSteps
        }
      );

      if (response.data.success) {
        const { results } = response.data;
        message.success(
          `Assigned: ${results.assigned.length}, Reactivated: ${results.reactivated.length}, Already Active: ${results.alreadyActive.length}`
        );
        setIsModalVisible(false);
        setBulkSelectedSteps([]);
        setSelectedUser(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error bulk assigning steps:', error);
      message.error(error.response?.data?.message || 'Failed to bulk assign steps');
    }
  };

  // Unassign a production step from a user
  const handleUnassignStep = async (assignmentId) => {
    try {
      const response = await client.delete(
        `/user-production-steps/${assignmentId}`
      );

      if (response.data.success) {
        message.success('Production step unassigned successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Error unassigning step:', error);
      message.error('Failed to unassign production step');
    }
  };

  // Get step name by ID
  const getStepName = (stepId) => {
    const step = availableSteps.find(s => s.stepId === stepId);
    return step ? step.stepName : 'Unknown Step';
  };

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table columns
  const columns = [
    {
      title: 'User',
      dataIndex: 'fullName',
      key: 'fullName',
      fixed: 'left',
      width: 250,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.email}</div>
          <div style={{ fontSize: '11px', color: '#a0a0a0', marginTop: 2 }}>
            Role: {record.roleId}
          </div>
        </div>
      )
    },
    {
      title: 'Assigned Production Steps',
      key: 'assignedSteps',
      render: (_, record) => {
        const activeSteps = record.assignedSteps.filter(a => a.isActive);
        const assignedStepIds = activeSteps.map(a => a.stepId);
        const availableToAssign = availableSteps.filter(
          step => !assignedStepIds.includes(step.stepId)
        );

        return (
          <div>
            {/* Current assigned steps */}
            <div style={{ marginBottom: 12 }}>
              {activeSteps.length === 0 ? (
                <Tag color="default" icon={<CloseCircleOutlined />}>No steps assigned</Tag>
              ) : (
                <Space size={[0, 8]} wrap>
                  {activeSteps.map(assignment => (
                    <Tag
                      key={assignment.assignmentId}
                      color="blue"
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        handleUnassignStep(assignment.assignmentId);
                      }}
                      style={{ fontSize: '12px', padding: '2px 8px' }}
                    >
                      {getStepName(assignment.stepId)}
                    </Tag>
                  ))}
                  <Tag color="green" style={{ fontSize: '11px' }}>
                    {activeSteps.length} / {availableSteps.length} assigned
                  </Tag>
                </Space>
              )}
            </div>

            {/* Assign more steps */}
            <div>
              <Space>
                <Select
                  placeholder="+ Assign another step"
                  style={{ width: 200 }}
                  onChange={(stepId) => {
                    handleAssignStep(record.userId, stepId);
                  }}
                  disabled={availableToAssign.length === 0}
                  size="small"
                >
                  {availableToAssign.map(step => (
                    <Option key={step.stepId} value={step.stepId}>
                      {step.stepName}
                    </Option>
                  ))}
                </Select>
                {availableToAssign.length === 0 && (
                  <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: '11px' }}>
                    All steps assigned
                  </Tag>
                )}
              </Space>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Production Steps"
              value={stats.totalSteps || 0}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Assignments"
              value={stats.activeAssignments || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Unassigned Users"
              value={stats.usersWithNoSteps || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>User Production Step Assignments</span>
          </Space>
        }
        extra={
          <Space>
            <Search
              placeholder="Search users..."
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Bulk Assign
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Alert
          message="Production Step Management"
          description="Assign production steps to users to control which steps they can access in the mobile app. Users will only see job cards for their assigned steps."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="userId"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`
          }}
        />
      </Card>

      {/* Bulk Assign Modal */}
      <Modal
        title="Bulk Assign Production Steps"
        visible={isModalVisible}
        onOk={handleBulkAssign}
        onCancel={() => {
          setIsModalVisible(false);
          setBulkSelectedSteps([]);
          setSelectedUser(null);
        }}
        width={600}
        okText="Assign Steps"
        okButtonProps={{ disabled: !selectedUser || bulkSelectedSteps.length === 0 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Select User
            </label>
            <Select
              placeholder="Choose a user"
              style={{ width: '100%' }}
              value={selectedUser}
              onChange={setSelectedUser}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map(user => (
                <Option key={user.userId} value={user.userId}>
                  {user.fullName} ({user.email})
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Select Production Steps
            </label>
            <Select
              mode="multiple"
              placeholder="Choose production steps"
              style={{ width: '100%' }}
              value={bulkSelectedSteps}
              onChange={setBulkSelectedSteps}
              maxTagCount="responsive"
            >
              {availableSteps.map(step => (
                <Option key={step.stepId} value={step.stepId}>
                  {step.stepName}
                </Option>
              ))}
            </Select>
          </div>

          {selectedUser && bulkSelectedSteps.length > 0 && (
            <Alert
              message={`You are about to assign ${bulkSelectedSteps.length} production step(s) to ${users.find(u => u.userId === selectedUser)?.fullName}`}
              type="warning"
              showIcon
            />
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default UserProductionSteps;
