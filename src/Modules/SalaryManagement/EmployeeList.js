import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Modal, 
  Form, 
  Space, 
  Card, 
  Tag, 
  message, 
  Popconfirm,
  Upload
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [form] = Form.useForm();

  const departments = ['HR', 'IT', 'Finance', 'Operations', 'Sales', 'Marketing', 'Production'];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchText) params.search = searchText;
      if (selectedDepartment) params.department = selectedDepartment;
      
      const response = await axios.get('/v2/employees', { params });
      setEmployees(response.data.data);
    } catch (error) {
      message.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchEmployees();
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditEmployee = (record) => {
    setEditingEmployee(record);
    form.setFieldsValue({
      ...record,
      date_of_joining: moment(record.date_of_joining),
      date_of_birth: record.date_of_birth ? moment(record.date_of_birth) : null
    });
    setModalVisible(true);
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await axios.delete(`/v2/employees/${id}`);
      message.success('Employee terminated successfully');
      fetchEmployees();
    } catch (error) {
      message.error('Failed to terminate employee');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      const formData = {
        ...values,
        date_of_joining: values.date_of_joining.format('YYYY-MM-DD'),
        date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null
      };

      if (editingEmployee) {
        await axios.put(`/v2/employees/${editingEmployee.id}`, formData);
        message.success('Employee updated successfully');
      } else {
        await axios.post('/v2/employees', formData);
        message.success('Employee created successfully');
      }

      setModalVisible(false);
      fetchEmployees();
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to save employee');
      }
    }
  };

  const handleBulkUpload = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    axios.post('/v2/employees/bulk-import', formData)
      .then(response => {
        message.success(`Imported ${response.data.data.success.length} employees successfully`);
        fetchEmployees();
      })
      .catch(error => {
        message.error('Bulk upload failed');
      });

    return false; // Prevent automatic upload
  };

  const columns = [
    {
      title: 'Employee Code',
      dataIndex: 'employee_code',
      key: 'employee_code',
      sorter: true,
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (department) => (
        <Tag color="blue">{department}</Tag>
      ),
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basic_salary',
      key: 'basic_salary',
      render: (salary) => `₹${salary?.toLocaleString()}`,
    },
    {
      title: 'Joining Date',
      dataIndex: 'date_of_joining',
      key: 'date_of_joining',
      render: (date) => moment(date).format('DD-MM-YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'employment_status',
      key: 'employment_status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditEmployee(record)}
            size="small"
          />
          <Popconfirm
            title="Are you sure to terminate this employee?"
            onConfirm={() => handleDeleteEmployee(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Employee Management</h2>
            <Space>
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
                onClick={handleAddEmployee}
              >
                Add Employee
              </Button>
            </Space>
          </div>
          
          <div style={{ marginTop: 16 }}>
            <Space>
              <Input
                placeholder="Search employees..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 300 }}
              />
              <Select
                placeholder="Select Department"
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                style={{ width: 200 }}
                allowClear
              >
                {departments.map(dept => (
                  <Option key={dept} value={dept}>{dept}</Option>
                ))}
              </Select>
              <Button onClick={handleSearch}>Search</Button>
            </Space>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} employees`,
          }}
        />
      </Card>

      <Modal
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="employee_code"
              label="Employee Code"
              rules={[{ required: true, message: 'Employee code is required' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Invalid email format' }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, message: 'First name is required' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, message: 'Last name is required' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="phone" label="Phone">
              <Input />
            </Form.Item>

            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Department is required' }]}
            >
              <Select>
                {departments.map(dept => (
                  <Option key={dept} value={dept}>{dept}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="designation"
              label="Designation"
              rules={[{ required: true, message: 'Designation is required' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="date_of_joining"
              label="Date of Joining"
              rules={[{ required: true, message: 'Date of joining is required' }]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item name="date_of_birth" label="Date of Birth">
              <Input type="date" />
            </Form.Item>

            <Form.Item name="gender" label="Gender">
              <Select>
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="basic_salary"
              label="Basic Salary"
              rules={[{ required: true, message: 'Basic salary is required' }]}
            >
              <Input type="number" />
            </Form.Item>

            <Form.Item name="hra" label="HRA">
              <Input type="number" />
            </Form.Item>

            <Form.Item name="da" label="DA">
              <Input type="number" />
            </Form.Item>

            <Form.Item name="special_allowance" label="Special Allowance">
              <Input type="number" />
            </Form.Item>

            <Form.Item name="other_allowances" label="Other Allowances">
              <Input type="number" />
            </Form.Item>

            <Form.Item name="pf_applicable" label="PF Applicable" valuePropName="checked">
              <Input type="checkbox" />
            </Form.Item>

            <Form.Item name="pf_number" label="PF Number">
              <Input />
            </Form.Item>

            <Form.Item name="pan_number" label="PAN Number">
              <Input />
            </Form.Item>

            <Form.Item name="aadhar_number" label="Aadhar Number">
              <Input />
            </Form.Item>

            <Form.Item name="bank_account_number" label="Bank Account Number">
              <Input />
            </Form.Item>

            <Form.Item name="bank_name" label="Bank Name">
              <Input />
            </Form.Item>

            <Form.Item name="bank_ifsc" label="Bank IFSC">
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item name="city" label="City">
              <Input />
            </Form.Item>

            <Form.Item name="state" label="State">
              <Input />
            </Form.Item>

            <Form.Item name="pincode" label="Pincode">
              <Input />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeList;