import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Timeline,
  Tabs,
  message
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import axios from 'axios';
import moment from 'moment';

const { TabPane } = Tabs;

const SalaryDashboard = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch multiple dashboard endpoints
      const [
        employeeStats,
        attendanceSummary,
        salarySummary,
        leaveApplications,
        recentPayrolls
      ] = await Promise.all([
        axios.get('/v2/employees/stats'),
        axios.get('/v2/attendance/summary'),
        axios.get('/v2/salary/summary'),
        axios.get('/v2/leave/applications?status=pending'),
        axios.get('/v2/salary', { params: { limit: 10 } })
      ]);

      setDashboardData({
        employees: employeeStats.data.data,
        attendance: attendanceSummary.data.data,
        salary: salarySummary.data.data,
        pendingLeaves: leaveApplications.data.data,
        recentPayrolls: recentPayrolls.data.data
      });
    } catch (error) {
      message.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Attendance trend data for chart
  const attendanceTrendData = dashboardData.attendance?.lateComingTrend?.map(item => ({
    date: moment(item.attendance_date).format('DD/MM'),
    count: parseInt(item.count)
  })) || [];

  // Department wise salary data
  const departmentSalaryData = dashboardData.salary?.departmentWise?.map(item => ({
    department: item.department || 'Unknown',
    amount: parseFloat(item.total),
    count: parseInt(item.count)
  })) || [];

  // Payment status pie chart data
  const paymentStatusData = dashboardData.salary?.paymentStatus?.map(item => ({
    status: item.payment_status,
    count: parseInt(item.count),
    amount: parseFloat(item.amount)
  })) || [];

  const quickStats = [
    {
      title: 'Total Employees',
      value: dashboardData.employees?.totalEmployees || 0,
      icon: <UserOutlined />,
      color: '#1890ff'
    },
    {
      title: "Today's Present",
      value: dashboardData.attendance?.today?.summary?.find(s => s.status === 'present')?.count || 0,
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    },
    {
      title: 'Monthly Salary',
      value: dashboardData.salary?.totalProcessed?.amount || 0,
      icon: <DollarOutlined />,
      color: '#722ed1',
      prefix: '₹',
      precision: 0
    },
    {
      title: 'Pending Leaves',
      value: dashboardData.pendingLeaves?.length || 0,
      icon: <ExclamationCircleOutlined />,
      color: '#fa8c16'
    }
  ];

  const recentPayrollColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div>{record.first_name} {record.last_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.employee_code}</div>
        </div>
      )
    },
    {
      title: 'Net Salary',
      dataIndex: 'net_salary',
      key: 'net_salary',
      render: (amount) => `₹${amount?.toLocaleString()}`
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => {
        const colors = { pending: 'orange', processing: 'blue', paid: 'green' };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).format('DD-MM-YYYY')
    }
  ];

  const pendingLeaveColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => `${record.first_name} ${record.last_name}`
    },
    {
      title: 'Type',
      dataIndex: 'leave_type',
      key: 'leave_type',
      render: (type) => <Tag color="blue">{type?.toUpperCase()}</Tag>
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => (
        <span>
          {moment(record.from_date).format('DD/MM')} - {moment(record.to_date).format('DD/MM')}
          ({record.total_days} days)
        </span>
      )
    },
    {
      title: 'Applied',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).fromNow()
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Salary Management Dashboard</h1>
        <p style={{ color: '#666' }}>
          Overview of employee salaries, attendance, and leave management for {moment().format('MMMM YYYY')}
        </p>
      </div>

      {/* Quick Stats */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        {quickStats.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                precision={stat.precision}
                prefix={stat.prefix}
                suffix={stat.suffix}
                valueStyle={{ color: stat.color }}
                prefix={stat.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Late Coming Trend (Last 7 Days)" loading={loading}>
            {attendanceTrendData.length > 0 ? (
              <Line
                data={attendanceTrendData}
                xField="date"
                yField="count"
                height={200}
                smooth
                point={{ size: 3 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>No data available</div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Department-wise Salary Distribution" loading={loading}>
            {departmentSalaryData.length > 0 ? (
              <Column
                data={departmentSalaryData}
                xField="department"
                yField="amount"
                height={200}
                meta={{
                  amount: { formatter: (value) => `₹${(value / 1000).toFixed(0)}K` }
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>No data available</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Payment Status and Department Progress */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card title="Payment Status Distribution" loading={loading}>
            {paymentStatusData.length > 0 ? (
              <Pie
                data={paymentStatusData}
                angleField="count"
                colorField="status"
                radius={0.75}
                height={250}
                legend={{ position: 'bottom' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>No data available</div>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="PF & ESI Contributions" loading={loading}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Employee PF"
                  value={dashboardData.salary?.deductions?.total_employee_pf || 0}
                  precision={0}
                  prefix="₹"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Employer PF"
                  value={dashboardData.salary?.deductions?.total_employer_pf || 0}
                  precision={0}
                  prefix="₹"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Statistic
                  title="ESI"
                  value={dashboardData.salary?.deductions?.total_employee_esi || 0}
                  precision={0}
                  prefix="₹"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="TDS"
                  value={dashboardData.salary?.deductions?.total_tds || 0}
                  precision={0}
                  prefix="₹"
                  valueStyle={{ color: '#fa541c' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Department-wise Employees" loading={loading}>
            {dashboardData.employees?.departmentWise?.map((dept, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{dept.department || 'Unknown'}</span>
                  <span>{dept.count} employees</span>
                </div>
                <Progress 
                  percent={(dept.count / dashboardData.employees?.totalEmployees) * 100} 
                  size="small"
                  showInfo={false}
                />
              </div>
            )) || <div>No department data</div>}
          </Card>
        </Col>
      </Row>

      {/* Tables Row */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Recent Payroll Processing" loading={loading}>
            <Table
              columns={recentPayrollColumns}
              dataSource={dashboardData.recentPayrolls?.slice(0, 5) || []}
              size="small"
              pagination={false}
              rowKey="id"
            />
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button type="link">View All Payrolls</Button>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Pending Leave Approvals" loading={loading}>
            <Table
              columns={pendingLeaveColumns}
              dataSource={dashboardData.pendingLeaves?.slice(0, 5) || []}
              size="small"
              pagination={false}
              rowKey="id"
            />
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button type="link">View All Leave Applications</Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginTop: '24px' }}>
        <Space size="large">
          <Button type="primary" icon={<UserOutlined />}>
            Add Employee
          </Button>
          <Button icon={<CalendarOutlined />}>
            Mark Attendance
          </Button>
          <Button icon={<DollarOutlined />}>
            Process Salary
          </Button>
          <Button icon={<ClockCircleOutlined />}>
            Apply Leave
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default SalaryDashboard;