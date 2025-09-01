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
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  TruckOutlined,
  PlusOutlined
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
  getItemLayout('Stock Management', 'stock-menu', <StockOutlined />, [
    getItemLayout(
      <Link to='/stock-dashboard'>Stock Dashboard</Link>,
      '1a'
    ),
    getItemLayout(
      <Link to='/stock-management'>Stock Management</Link>,
      '1a-new'
    )
  ]),
  getItemLayout(
    <Link to='/dealer-warranty'>Dealer Warranty</Link>,
    '1c',
    <SafetyCertificateOutlined />
  ),
  getItemLayout(
    <Link to='/inventory-management-v2'>Inventory Management</Link>,
    'inventory-v2',
    <DatabaseOutlined />
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
    getItemLayout(<Link to='/production-dashboard'>Production Dashboard</Link>, '5a'),
    getItemLayout(<Link to='/production-plans'>Production Plans</Link>, '6'),
    getItemLayout(<Link to='/smart-production'>🚀 Smart Production Planner</Link>, '6a'),
    getItemLayout(<Link to='/job-cards'>📋 Job Card Management</Link>, '6c'),
    getItemLayout(<Link to='/production-presets'>Preset Management</Link>, '7a')
  ])
  //   getItemLayout("Team", "sub2", <TeamOutlined />, [
  //     getItemLayout("Team 1", "6"),
  //     getItemLayout("Team 2", "8"),
  //   ]),
  //   getItemLayout("Files", "9", <FileOutlined />),
]
