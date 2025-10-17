import { Link } from 'react-router-dom'
import {
  DashboardOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  TruckOutlined,
  SettingOutlined,
  FileTextOutlined,
  DollarOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'

function getItemLayout (label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
    style:
      icon === null
        ? {
            color: '#6C757D',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '16px 0 8px 0',
            cursor: 'default',
            pointerEvents: 'none',
            padding: '0 12px'
          }
        : {
            margin: '2px 0',
            borderRadius: '8px',
            overflow: 'hidden'
          }
  }
}

export const saleCoSidebarRoutes = [
  // Sales Coordinator Dashboard - Main Entry Point
  getItemLayout(
    <Link to='/sales-coordinator-dashboard'>
      <span style={{ fontWeight: 600 }}>Dashboard</span>
    </Link>,
    'sales-coordinator-dashboard',
    <DashboardOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <Link to='/sales-create-order-alloys'>📋 Create Order</Link>,
    'sales-create-order'
  ),
  getItemLayout(
    <Link to='/sales-pending-entries'>⏳ Pending Entries</Link>,
    'sales-pending-entries'
  ),
  getItemLayout(
    <Link to='/sales-inprod-entries'>🔄 In Production</Link>,
    'sales-inprod-entries'
  ),
  getItemLayout(
    <Link to='/sales-dispatch-entries'>📦 Dispatch Approval</Link>,
    'sales-dispatch-entries'
  )

  // Sales Coordination System - Primary Section
  // getItemLayout(
  //   'Sales Coordination',
  //   'sales-coordination-system',
  //   <SyncOutlined style={{ fontSize: '16px' }} />,
  //   [

  //   ]
  // )
]
