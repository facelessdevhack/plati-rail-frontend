import { Link } from 'react-router-dom'
import {
  DashboardOutlined,
  BarChartOutlined,
  StockOutlined,
  DatabaseOutlined,
  ToolOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  SettingOutlined,
  RocketOutlined,
  LineChartOutlined,
  ShopOutlined,
  BankOutlined
} from '@ant-design/icons'

function getItemLayout (label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
    style: icon === null ? {
      color: '#6C757D',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      margin: '16px 0 8px 0',
      cursor: 'default',
      pointerEvents: 'none',
      padding: '0 12px'
    } : {
      margin: '2px 0',
      borderRadius: '8px',
      overflow: 'hidden'
    }
  }
}

export const adminSiderRoutes = [
  // Main Dashboard
  getItemLayout(
    <Link to='/admin-dashboard'>
      <span style={{ fontWeight: 600 }}>Dashboard</span>
    </Link>,
    '1',
    <DashboardOutlined style={{ fontSize: '16px' }} />
  ),
  
  // Daily Entries - Top Level
  getItemLayout(
    <Link to='/admin-daily-entry-dealers'>
      <span style={{ fontWeight: 600 }}>Daily Entries</span>
    </Link>,
    'daily-entries',
    <FileTextOutlined style={{ fontSize: '16px' }} />
  ),
  
  // Production System with all nested routes
  getItemLayout('Production System', 'production-menu', <ToolOutlined style={{ fontSize: '16px' }} />, [
    getItemLayout(
      <Link to='/production-dashboard'>Production Dashboard</Link>,
      '5a'
    ),
    getItemLayout(
      <Link to='/production-plans'>Production Plans</Link>,
      '6'
    ),
    getItemLayout(
      <Link to='/smart-production'><RocketOutlined style={{ marginRight: '8px' }} />Smart Planner</Link>,
      '6a'
    ),
    getItemLayout(
      <Link to='/job-cards'>Job Card Management</Link>,
      '6c'
    ),
    getItemLayout(
      <Link to='/production-presets'>Preset Management</Link>,
      '7a'
    )
  ]),

  getItemLayout(
    <Link to='/inventory-management-v2'>Inventory Management</Link>,
    'inventory-v2'
  ),
  
  // Warranty Management
  getItemLayout(
    <Link to='/dealer-warranty'>
      <span style={{ fontWeight: 600 }}>Warranty Management</span>
    </Link>,
    'warranty-management',
    <SafetyCertificateOutlined style={{ fontSize: '16px' }} />
  )
]
