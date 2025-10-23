import { Link } from 'react-router-dom';
import {
  DashboardOutlined,
  ToolOutlined,
  FileSearchOutlined,
  AppstoreOutlined,
  RocketOutlined,
  ControlOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  AuditOutlined
} from '@ant-design/icons';

function getItemLayout(label, key, icon, children) {
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
  };
}

export const dataUserSiderRoutes = [
  // Sales Coordination Dashboard - Top Level
  getItemLayout(
    <Link to='/sales-coordinator-dashboard'>
      <span style={{ fontWeight: 600 }}>📊 Sales Coordination</span>
    </Link>,
    'sales-coordination-dashboard',
    <ControlOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <Link to='/production-dashboard'>
      <span style={{ fontWeight: 600 }}>Production Dashboard</span>
    </Link>,
    'production-dashboard',
    <DashboardOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <Link to='/production-plans'>
      <span style={{ fontWeight: 600 }}>Production Plans</span>
    </Link>,
    'production-plans',
    <FileSearchOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <Link to='/smart-production'>
      <span style={{ fontWeight: 600 }}>Smart Production Planner</span>
    </Link>,
    'smart-production',
    <RocketOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <Link to='/job-cards'>
      <span style={{ fontWeight: 600 }}>Job Cards</span>
    </Link>,
    'job-cards',
    <ToolOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <Link to='/production-presets'>
      <span style={{ fontWeight: 600 }}>Preset Management</span>
    </Link>,
    'production-presets',
    <AppstoreOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inventory</span>,
    'inventory-divider',
    null,
    []
  ),
  getItemLayout(
    <Link to='/inventory-management-v2'>
      <span style={{ fontWeight: 600 }}>Inventory Management</span>
    </Link>,
    'inventory-management',
    <DatabaseOutlined style={{ fontSize: '16px' }} />
  ),

  // Stock Logging System
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock Tracking</span>,
    'stock-tracking-divider',
    null,
    []
  ),
  getItemLayout(
    <Link to='/stock-logs'>
      <span style={{ fontWeight: 600 }}>Stock Logs</span>
    </Link>,
    'stock-logs',
    <HistoryOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <Link to='/stock-reconciliation'>
      <span style={{ fontWeight: 600 }}>Stock Reconciliation</span>
    </Link>,
    'stock-reconciliation',
    <AuditOutlined style={{ fontSize: '16px' }} />
  ),
];
