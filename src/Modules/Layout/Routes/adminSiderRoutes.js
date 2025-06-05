import { Link } from 'react-router-dom'
import {
  CodeSandboxOutlined,
  StockOutlined,
  PieChartOutlined,
  AlertOutlined,
  BarChartOutlined,
  UserOutlined,
  ToolOutlined,
  DashboardOutlined,
  TeamOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'

function getItemLayout (label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label
  }
}

export const adminSiderRoutes = [
  getItemLayout(
    <Link to='/admin-dashboard'>Admin Dashboard</Link>,
    '1',
    <DashboardOutlined />
  ),
  getItemLayout(
    <Link to='/dealer-metrics'>Dealer Metrics</Link>,
    '1b',
    <TeamOutlined />
  ),
  getItemLayout(
    <Link to='/stock-dashboard'>Stock Dashboard</Link>,
    '1a',
    <StockOutlined />
  ),
  getItemLayout(
    <Link to='/dealer-warranty'>Dealer Warranty</Link>,
    '1c',
    <SafetyCertificateOutlined />
  ),
  getItemLayout(
    <Link to='/admin-daily-entry-dealers'>Select Dealers</Link>,
    '2',
    <PieChartOutlined />
  ),
  // getItemLayout(
  //   <Link to="/admin-alerts-list">Alerts</Link>,
  //   "3",
  //   <AlertOutlined />
  // ),
  getItemLayout('Dealer Metrics', 'sub1', <BarChartOutlined />, [
    getItemLayout(<Link to='/admin-dealer-metrics'>Overall</Link>, '3'),
    getItemLayout(<Link to='/admin-dealer-metrics-for-size'>By Size</Link>, '4')
  ]),
  getItemLayout('Production', 'sub2', <ToolOutlined />, [
    getItemLayout(
      <Link to='/production-dashboard'>Production Dashboard</Link>,
      '5'
    ),
    getItemLayout(<Link to='/production-plans'>Production Plans</Link>, '6'),
    getItemLayout(<Link to='/production-plan/create'>Create Plan</Link>, '7'),
    getItemLayout(<Link to='/production-job-cards'>Job Cards</Link>, '8'),
    getItemLayout(
      <Link to='/production-workflow'>Production Workflow</Link>,
      '9'
    ),
    getItemLayout(
      <Link to='/production-qa-reporting'>QA Reporting</Link>,
      '10'
    ),
    getItemLayout(
      <Link to='/production-rejections'>Rejection Management</Link>,
      '11'
    ),
    getItemLayout(
      <Link to='/production-inventory-requests'>Inventory Requests</Link>,
      '12'
    )
  ])
  //   getItemLayout("Team", "sub2", <TeamOutlined />, [
  //     getItemLayout("Team 1", "6"),
  //     getItemLayout("Team 2", "8"),
  //   ]),
  //   getItemLayout("Files", "9", <FileOutlined />),
]
