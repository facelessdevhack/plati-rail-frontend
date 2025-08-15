import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  Space,
  Card,
  Tag,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { TabPane } = Tabs;

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState('applications');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEmployees();
    fetchLeaveApplications();
    fetchLeaveBalance();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/v2/employees', {
        params: { status: 'active' }
      });
      setEmployees(response.data.data);
    } catch (error) {
      message.error('Failed to fetch employees');
    }
  };

  const fetchLeaveApplications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedEmployee) params.employee_id = selectedEmployee;
      if (selectedStatus) params.status = selectedStatus;

      const response = await axios.get('/v2/leave/applications', { params });
      setLeaves(response.data.data);
    } catch (error) {
      message.error('Failed to fetch leave applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const response = await axios.get('/v2/leave/balance');
      setLeaveBalance(response.data.data);
    } catch (error) {
      message.error('Failed to fetch leave balance');
    }
  };

  const handleApplyLeave = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      const formData = {
        ...values,
        from_date: values.leave_dates[0].format('YYYY-MM-DD'),
        to_date: values.leave_dates[1].format('YYYY-MM-DD')
      };
      delete formData.leave_dates;

      await axios.post('/v2/leave/apply', formData);
      message.success('Leave application submitted successfully');
      
      setModalVisible(false);
      fetchLeaveApplications();
      fetchLeaveBalance();
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to apply for leave');
      }
    }
  };

  const handleLeaveAction = async (leaveId, status, rejectionReason = '') => {
    try {
      await axios.put(`/v2/leave/status/${leaveId}`, {
        status,
        rejection_reason: rejectionReason
      });
      
      message.success(`Leave ${status} successfully`);
      fetchLeaveApplications();
      fetchLeaveBalance();
    } catch (error) {
      message.error(`Failed to ${status} leave`);
    }
  };

  const handleApprove = (leaveId) => {
    Modal.confirm({
      title: 'Approve Leave',
      content: 'Are you sure you want to approve this leave application?',
      onOk: () => handleLeaveAction(leaveId, 'approved')
    });
  };

  const handleReject = (leaveId) => {
    Modal.confirm({
      title: 'Reject Leave',
      content: (
        <div>
          <p>Are you sure you want to reject this leave application?</p>
          <Input.TextArea 
            placeholder="Reason for rejection..."
            id="rejectionReason"
          />
        </div>
      ),
      onOk: () => {
        const reason = document.getElementById('rejectionReason').value;
        handleLeaveAction(leaveId, 'rejected', reason);
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red',
      cancelled: 'gray'
    };
    return colors[status] || 'default';
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      casual: 'blue',
      sick: 'red',
      earned: 'green',
      maternity: 'purple',
      paternity: 'cyan',
      unpaid: 'gray'
    };
    return colors[type] || 'default';
  };

  const leaveColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div>{record.first_name} {record.last_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.employee_code}</div>
        </div>
      ),
    },
    {
      title: 'Leave Type',
      dataIndex: 'leave_type',
      key: 'leave_type',
      render: (type) => (
        <Tag color={getLeaveTypeColor(type)}>
          {type?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'From Date',
      dataIndex: 'from_date',
      key: 'from_date',
      render: (date) => moment(date).format('DD-MM-YYYY')
    },
    {
      title: 'To Date',
      dataIndex: 'to_date',
      key: 'to_date',
      render: (date) => moment(date).format('DD-MM-YYYY')
    },
    {
      title: 'Days',
      dataIndex: 'total_days',
      key: 'total_days',
      render: (days) => `${days} day${days > 1 ? 's' : ''}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Applied On',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).format('DD-MM-YYYY')
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                icon={<CheckOutlined />}
                size="small"
                type="primary"
                onClick={() => handleApprove(record.id)}
              >
                Approve
              </Button>
              <Button
                icon={<CloseOutlined />}
                size="small"
                danger
                onClick={() => handleReject(record.id)}
              >
                Reject
              </Button>
            </>
          )}
          {record.rejection_reason && (
            <Tag color="red" title={record.rejection_reason}>
              Rejected
            </Tag>
          )}
        </Space>
      )
    }
  ];

  const balanceColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div>{record.first_name} {record.last_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.employee_code}</div>
        </div>
      ),
    },
    {
      title: 'Casual Leave',
      key: 'casual',
      render: (_, record) => (
        <div>
          <Progress
            percent={(record.casual_leave_balance / record.casual_leave_total) * 100}
            size="small"
            format={() => `${record.casual_leave_balance}/${record.casual_leave_total}`}
          />
        </div>
      )
    },
    {
      title: 'Sick Leave',
      key: 'sick',
      render: (_, record) => (
        <div>
          <Progress
            percent={(record.sick_leave_balance / record.sick_leave_total) * 100}
            size="small"
            format={() => `${record.sick_leave_balance}/${record.sick_leave_total}`}
            strokeColor="#ff4d4f"
          />
        </div>
      )
    },
    {
      title: 'Earned Leave',
      key: 'earned',
      render: (_, record) => (
        <div>
          <Progress
            percent={(record.earned_leave_balance / record.earned_leave_total) * 100}
            size="small"
            format={() => `${record.earned_leave_balance}/${record.earned_leave_total}`}
            strokeColor="#52c41a"
          />
        </div>
      )
    },
    {
      title: 'Total Available',
      key: 'total',
      render: (_, record) => {
        const total = record.casual_leave_balance + record.sick_leave_balance + record.earned_leave_balance;
        return <strong>{total} days</strong>;
      }
    }
  ];

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Leave Applications" key="applications">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Leave Applications</h3>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleApplyLeave}
                >
                  Apply Leave
                </Button>
              </div>
              
              <div style={{ marginTop: 16 }}>
                <Space>
                  <Select
                    placeholder="Select Employee"
                    value={selectedEmployee}
                    onChange={setSelectedEmployee}
                    style={{ width: 200 }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {employees.map(emp => (
                      <Option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Select Status"
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    style={{ width: 120 }}
                    allowClear
                  >
                    <Option value="pending">Pending</Option>
                    <Option value="approved">Approved</Option>
                    <Option value="rejected">Rejected</Option>
                  </Select>
                  <Button onClick={fetchLeaveApplications}>Search</Button>
                </Space>
              </div>
            </div>

            <Table
              columns={leaveColumns}
              dataSource={leaves}
              rowKey="id"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} applications`,
              }}
            />
          </TabPane>

          <TabPane tab="Leave Balance" key="balance">
            <div style={{ marginBottom: 16 }}>
              <h3>Leave Balance Summary</h3>
            </div>

            <Table
              columns={balanceColumns}
              dataSource={leaveBalance}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} employees`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        title="Apply for Leave"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="employee_id"
            label="Employee"
            rules={[{ required: true, message: 'Employee is required' }]}
          >
            <Select
              showSearch
              placeholder="Select Employee"
              optionFilterProp="children"
            >
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="leave_type"
              label="Leave Type"
              rules={[{ required: true, message: 'Leave type is required' }]}
            >
              <Select>
                <Option value="casual">Casual Leave</Option>
                <Option value="sick">Sick Leave</Option>
                <Option value="earned">Earned Leave</Option>
                <Option value="maternity">Maternity Leave</Option>
                <Option value="paternity">Paternity Leave</Option>
                <Option value="unpaid">Unpaid Leave</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="leave_dates"
              label="Leave Dates"
              rules={[{ required: true, message: 'Leave dates are required' }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Reason is required' }]}
          >
            <TextArea rows={3} placeholder="Please provide a reason for leave..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeaveManagement;