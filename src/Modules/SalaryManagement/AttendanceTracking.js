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
  Upload,
  Statistic,
  Row,
  Col,
  TimePicker
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  UploadOutlined,
  DownloadOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AttendanceTracking = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceSummary();
    fetchAttendance();
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

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedEmployee) params.employee_id = selectedEmployee;
      if (dateRange.length === 2) {
        params.from_date = dateRange[0].format('YYYY-MM-DD');
        params.to_date = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await axios.get('/v2/attendance', { params });
      setAttendance(response.data.data);
    } catch (error) {
      message.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const response = await axios.get('/v2/attendance/summary');
      setAttendanceSummary(response.data.data);
    } catch (error) {
      message.error('Failed to fetch attendance summary');
    }
  };

  const handleMarkAttendance = () => {
    setEditingAttendance(null);
    form.resetFields();
    form.setFieldsValue({
      attendance_date: moment(),
      status: 'present'
    });
    setModalVisible(true);
  };

  const handleEditAttendance = (record) => {
    setEditingAttendance(record);
    form.setFieldsValue({
      ...record,
      attendance_date: moment(record.attendance_date),
      check_in_time: record.check_in_time ? moment(record.check_in_time, 'HH:mm') : null,
      check_out_time: record.check_out_time ? moment(record.check_out_time, 'HH:mm') : null
    });
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      const formData = {
        ...values,
        attendance_date: values.attendance_date.format('YYYY-MM-DD'),
        check_in_time: values.check_in_time ? values.check_in_time.format('HH:mm') : null,
        check_out_time: values.check_out_time ? values.check_out_time.format('HH:mm') : null
      };

      if (editingAttendance) {
        await axios.put(`/v2/attendance/${editingAttendance.id}`, formData);
        message.success('Attendance updated successfully');
      } else {
        await axios.post('/v2/attendance', formData);
        message.success('Attendance marked successfully');
        
        // Auto-calculate salary when attendance is added
        await axios.post('/v2/salary/auto-calculate', {
          employee_id: values.employee_id,
          attendance_date: formData.attendance_date
        });
      }

      setModalVisible(false);
      fetchAttendance();
      fetchAttendanceSummary();
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to save attendance');
      }
    }
  };

  const handleBulkUpload = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    axios.post('/v2/attendance/bulk-upload', formData)
      .then(response => {
        message.success(`Processed ${response.data.data.success.length} records successfully`);
        fetchAttendance();
        fetchAttendanceSummary();
      })
      .catch(error => {
        message.error('Bulk upload failed');
      });

    return false;
  };

  const handleBulkMark = async () => {
    try {
      const values = await bulkForm.validateFields();
      
      const formData = {
        attendance_date: values.attendance_date.format('YYYY-MM-DD'),
        status: values.status,
        remarks: values.remarks
      };

      await axios.post('/v2/attendance/bulk-mark', formData);
      message.success('Bulk attendance marked successfully');
      setBulkModalVisible(false);
      fetchAttendance();
      fetchAttendanceSummary();
    } catch (error) {
      message.error('Failed to mark bulk attendance');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'green',
      absent: 'red',
      'half-day': 'orange',
      leave: 'blue',
      holiday: 'purple',
      weekend: 'gray'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'attendance_date',
      key: 'attendance_date',
      render: (date) => moment(date).format('DD-MM-YYYY'),
      sorter: (a, b) => moment(a.attendance_date).unix() - moment(b.attendance_date).unix(),
    },
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
      title: 'Check In',
      dataIndex: 'check_in_time',
      key: 'check_in_time',
      render: (time) => time || '-',
    },
    {
      title: 'Check Out',
      dataIndex: 'check_out_time',
      key: 'check_out_time',
      render: (time) => time || '-',
    },
    {
      title: 'Total Hours',
      dataIndex: 'total_hours',
      key: 'total_hours',
      render: (hours) => hours ? `${hours}h` : '-',
    },
    {
      title: 'Overtime',
      dataIndex: 'overtime_hours',
      key: 'overtime_hours',
      render: (hours) => hours ? `${hours}h` : '0h',
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
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (remarks) => remarks || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          icon={<EditOutlined />} 
          onClick={() => handleEditAttendance(record)}
          size="small"
        />
      ),
    },
  ];

  return (
    <div>
      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Today's Present"
              value={attendanceSummary.today?.summary?.find(s => s.status === 'present')?.count || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Today's Absent"
              value={attendanceSummary.today?.summary?.find(s => s.status === 'absent')?.count || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={attendanceSummary.today?.totalEmployees || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Monthly Avg Hours"
              value={attendanceSummary.monthly?.avg_hours || 0}
              precision={1}
              suffix="h"
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Attendance Tracking</h2>
            <Space>
              <Button 
                icon={<CalendarOutlined />}
                onClick={() => setBulkModalVisible(true)}
              >
                Bulk Mark
              </Button>
              <Upload
                beforeUpload={handleBulkUpload}
                showUploadList={false}
                accept=".xlsx,.xls"
              >
                <Button icon={<UploadOutlined />}>
                  Bulk Import
                </Button>
              </Upload>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleMarkAttendance}
              >
                Mark Attendance
              </Button>
            </Space>
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
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD-MM-YYYY"
              />
              <Button onClick={fetchAttendance}>Search</Button>
            </Space>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={attendance}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} records`,
          }}
        />
      </Card>

      {/* Mark Attendance Modal */}
      <Modal
        title={editingAttendance ? 'Edit Attendance' : 'Mark Attendance'}
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
              name="attendance_date"
              label="Date"
              rules={[{ required: true, message: 'Date is required' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Status is required' }]}
            >
              <Select>
                <Option value="present">Present</Option>
                <Option value="absent">Absent</Option>
                <Option value="half-day">Half Day</Option>
                <Option value="leave">Leave</Option>
                <Option value="holiday">Holiday</Option>
                <Option value="weekend">Weekend</Option>
              </Select>
            </Form.Item>

            <Form.Item name="check_in_time" label="Check In Time">
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>

            <Form.Item name="check_out_time" label="Check Out Time">
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>

            <Form.Item name="overtime_hours" label="Overtime Hours">
              <Input type="number" step="0.5" />
            </Form.Item>
          </div>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Mark Modal */}
      <Modal
        title="Bulk Mark Attendance"
        open={bulkModalVisible}
        onOk={handleBulkMark}
        onCancel={() => setBulkModalVisible(false)}
      >
        <Form form={bulkForm} layout="vertical">
          <Form.Item
            name="attendance_date"
            label="Date"
            rules={[{ required: true, message: 'Date is required' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Status is required' }]}
          >
            <Select>
              <Option value="present">Present</Option>
              <Option value="absent">Absent</Option>
              <Option value="holiday">Holiday</Option>
              <Option value="weekend">Weekend</Option>
            </Select>
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} placeholder="Reason for bulk marking..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendanceTracking;