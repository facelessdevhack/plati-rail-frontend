import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Select,
  DatePicker,
  Modal,
  Form,
  Space,
  Card,
  Tag,
  message,
  Statistic,
  Row,
  Col,
  Progress,
  Descriptions,
  Popconfirm,
  Input
} from 'antd';
import {
  PlayCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;

const SalaryProcessing = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [salarySummary, setSalarySummary] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEmployees();
    fetchSalaries();
    fetchSalarySummary();
  }, [selectedMonth, selectedYear]);

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

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/v2/salary', {
        params: {
          month: selectedMonth,
          year: selectedYear
        }
      });
      setSalaries(response.data.data);
    } catch (error) {
      message.error('Failed to fetch salaries');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalarySummary = async () => {
    try {
      const response = await axios.get('/v2/salary/summary', {
        params: {
          month: selectedMonth,
          year: selectedYear
        }
      });
      setSalarySummary(response.data.data);
    } catch (error) {
      message.error('Failed to fetch salary summary');
    }
  };

  const handleProcessSingle = async (employeeId) => {
    try {
      await axios.post('/v2/salary/process-employee', {
        employee_id: employeeId,
        month: selectedMonth,
        year: selectedYear
      });
      message.success('Salary processed successfully');
      fetchSalaries();
      fetchSalarySummary();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to process salary');
    }
  };

  const handleProcessAll = async () => {
    Modal.confirm({
      title: 'Process All Salaries',
      content: `Are you sure you want to process salaries for all employees for ${moment().month(selectedMonth - 1).format('MMMM')} ${selectedYear}?`,
      onOk: async () => {
        try {
          const response = await axios.post('/v2/salary/process-all', {
            month: selectedMonth,
            year: selectedYear
          });
          message.success(`Processed ${response.data.data.success.length} salaries successfully`);
          fetchSalaries();
          fetchSalarySummary();
        } catch (error) {
          message.error('Failed to process salaries');
        }
      }
    });
  };

  const handlePaymentUpdate = async (salaryId, status) => {
    setSelectedSalary(salaryId);
    if (status === 'paid') {
      form.setFieldsValue({
        payment_status: status,
        payment_date: moment(),
        payment_mode: 'bank_transfer'
      });
      setPaymentModalVisible(true);
    } else {
      try {
        await axios.put(`/v2/salary/payment-status/${salaryId}`, {
          payment_status: status
        });
        message.success('Payment status updated');
        fetchSalaries();
        fetchSalarySummary();
      } catch (error) {
        message.error('Failed to update payment status');
      }
    }
  };

  const handleBulkPayment = () => {
    if (selectedRows.length === 0) {
      message.warning('Please select salary records to update');
      return;
    }

    form.setFieldsValue({
      payment_status: 'paid',
      payment_date: moment(),
      payment_mode: 'bank_transfer'
    });
    setPaymentModalVisible(true);
  };

  const handlePaymentModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      const payload = {
        ...values,
        payment_date: values.payment_date.format('YYYY-MM-DD')
      };

      if (selectedRows.length > 0) {
        // Bulk update
        await axios.put('/v2/salary/bulk-payment-status', {
          salary_ids: selectedRows,
          ...payload
        });
        message.success(`Updated payment status for ${selectedRows.length} records`);
        setSelectedRows([]);
      } else {
        // Single update
        await axios.put(`/v2/salary/payment-status/${selectedSalary}`, payload);
        message.success('Payment status updated');
      }

      setPaymentModalVisible(false);
      fetchSalaries();
      fetchSalarySummary();
    } catch (error) {
      message.error('Failed to update payment status');
    }
  };

  const handleDownloadPayslip = async (salaryId) => {
    try {
      const response = await axios.get(`/v2/salary/slip/${salaryId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${salaryId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('Failed to download payslip');
    }
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      processing: 'blue',
      paid: 'green'
    };
    return colors[status] || 'default';
  };

  const columns = [
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
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Tag color="blue">{dept}</Tag>
    },
    {
      title: 'Present Days',
      dataIndex: 'present_days',
      key: 'present_days',
      render: (days) => `${days} days`
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basic_salary',
      key: 'basic_salary',
      render: (amount) => `₹${amount?.toLocaleString()}`
    },
    {
      title: 'Gross Salary',
      dataIndex: 'gross_salary',
      key: 'gross_salary',
      render: (amount) => `₹${amount?.toLocaleString()}`
    },
    {
      title: 'Deductions',
      dataIndex: 'total_deductions',
      key: 'total_deductions',
      render: (amount) => `₹${amount?.toLocaleString()}`
    },
    {
      title: 'Net Salary',
      dataIndex: 'net_salary',
      key: 'net_salary',
      render: (amount) => (
        <strong style={{ color: '#52c41a' }}>
          ₹{amount?.toLocaleString()}
        </strong>
      )
    },
    {
      title: 'Payment Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => (
        <Tag color={getPaymentStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {!record.payment_status || record.payment_status === 'pending' ? (
            <Popconfirm
              title="Process salary for this employee?"
              onConfirm={() => handleProcessSingle(record.employee_id)}
            >
              <Button 
                icon={<PlayCircleOutlined />} 
                size="small"
                type="primary"
              >
                Process
              </Button>
            </Popconfirm>
          ) : (
            <Button 
              icon={<CheckCircleOutlined />} 
              size="small"
              disabled
            >
              Processed
            </Button>
          )}
          
          {record.payment_status && (
            <Select
              size="small"
              value={record.payment_status}
              onChange={(status) => handlePaymentUpdate(record.id, status)}
              style={{ width: 100 }}
            >
              <Option value="pending">Pending</Option>
              <Option value="processing">Processing</Option>
              <Option value="paid">Paid</Option>
            </Select>
          )}

          {record.payment_status === 'paid' && (
            <Button 
              icon={<DownloadOutlined />} 
              size="small"
              onClick={() => handleDownloadPayslip(record.id)}
            >
              Payslip
            </Button>
          )}
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys) => {
      setSelectedRows(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: !record.payment_status || record.payment_status === 'paid'
    })
  };

  return (
    <div>
      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Processed"
              value={salarySummary.totalProcessed?.count || 0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={salarySummary.totalProcessed?.amount || 0}
              precision={0}
              prefix="₹"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Paid"
              value={salarySummary.paymentStatus?.find(s => s.payment_status === 'paid')?.count || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={salarySummary.paymentStatus?.find(s => s.payment_status === 'pending')?.count || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Salary Processing - {moment().month(selectedMonth - 1).format('MMMM')} {selectedYear}</h2>
            <Space>
              {selectedRows.length > 0 && (
                <Button 
                  type="primary"
                  onClick={handleBulkPayment}
                >
                  Mark as Paid ({selectedRows.length})
                </Button>
              )}
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={handleProcessAll}
              >
                Process All
              </Button>
            </Space>
          </div>
          
          <div style={{ marginTop: 16 }}>
            <Space>
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                style={{ width: 120 }}
              >
                {moment.months().map((month, index) => (
                  <Option key={index + 1} value={index + 1}>{month}</Option>
                ))}
              </Select>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 100 }}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = moment().year() - 2 + i;
                  return (
                    <Option key={year} value={year}>{year}</Option>
                  );
                })}
              </Select>
            </Space>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={salaries}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          expandable={{
            expandedRowRender: (record) => (
              <Descriptions size="small" column={3}>
                <Descriptions.Item label="Absent Days">{record.absent_days}</Descriptions.Item>
                <Descriptions.Item label="Leave Days">{record.leave_days}</Descriptions.Item>
                <Descriptions.Item label="Overtime Hours">{record.overtime_hours}h</Descriptions.Item>
                <Descriptions.Item label="HRA">₹{record.hra?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="DA">₹{record.da?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Overtime Amount">₹{record.overtime_amount?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Employee PF">₹{record.employee_pf?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Professional Tax">₹{record.professional_tax?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="TDS">₹{record.tds?.toLocaleString()}</Descriptions.Item>
              </Descriptions>
            ),
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} records`,
          }}
        />
      </Card>

      {/* Payment Update Modal */}
      <Modal
        title="Update Payment Status"
        open={paymentModalVisible}
        onOk={handlePaymentModalOk}
        onCancel={() => setPaymentModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="payment_status"
            label="Payment Status"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="processing">Processing</Option>
              <Option value="paid">Paid</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="payment_date"
            label="Payment Date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="payment_mode"
            label="Payment Mode"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="bank_transfer">Bank Transfer</Option>
              <Option value="cash">Cash</Option>
              <Option value="cheque">Cheque</Option>
            </Select>
          </Form.Item>

          <Form.Item name="transaction_reference" label="Transaction Reference">
            <Input placeholder="Transaction ID or reference number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SalaryProcessing;