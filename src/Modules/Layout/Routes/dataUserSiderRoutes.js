import { Link } from 'react-router-dom';
import {
  DashboardOutlined,
  ToolOutlined,
  FileSearchOutlined,
  AppstoreOutlined,
  RocketOutlined
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
];
