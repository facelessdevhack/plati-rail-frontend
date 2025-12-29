import { Link } from 'react-router-dom'
import {
  DashboardOutlined,
  FileAddOutlined,
  ImportOutlined,
  BankOutlined,
  StockOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  SettingOutlined,
  TeamOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ControlOutlined,
  EnvironmentOutlined,
  SwapOutlined,
  InboxOutlined,
  HistoryOutlined,
  AuditOutlined
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

export const entrySiderRoutes = [
  // Sales Coordination Dashboard - Top Level
  getItemLayout(
    <Link to='/sales-coordinator-dashboard'>
      <span style={{ fontWeight: 600 }}>📊 Sales Coordination</span>
    </Link>,
    'sales-coordination-dashboard',
    <ControlOutlined style={{ fontSize: '16px' }} />
  ),

  // Data Entry Operations
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Entry</span>,
    'entry-divider',
    null,
    []
  ),
  
  getItemLayout(
    <Link to='/add-daily-entry'>Outwards Entry</Link>,
    '2',
    <FileAddOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <Link to='/add-inwards-entry'>Inwards Entry</Link>,
    '3',
    <ImportOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <Link to='/add-payment-entry'>Payment Entry</Link>,
    '4',
    <BankOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <Link to='/entry-daily-entry-dealers'>Dealer Selection</Link>,
    '5',
    <TeamOutlined style={{ fontSize: '16px' }} />
  ),
  getItemLayout(
    <Link to='/data-entry-pricing'>💰 Pricing Entries</Link>,
    '6',
    <DollarOutlined style={{ fontSize: '16px' }} />
  ),

  // Sales Coordination
  getItemLayout('Sales Coordination', 'sales-coordination-menu', <SyncOutlined style={{ fontSize: '16px' }} />, [
    getItemLayout(
      <Link to='/sales-create-order'>📋 Create Order</Link>,
      'sales-create-order'
    ),
    getItemLayout(
      <Link to='/sales-dispatch-entries'>📦 Dispatch Entries</Link>,
      'sales-dispatch'
    ),
    getItemLayout(
      <Link to='/sales-pending-entries'>⏳ Pending Entries</Link>,
      'sales-pending'
    ),
    getItemLayout(
      <Link to='/sales-inprod-entries'>🔄 In Production</Link>,
      'sales-inprod'
    )
  ]),

  // Inventory System
  getItemLayout('Inventory System', 'inventory-system-menu', <InboxOutlined style={{ fontSize: '16px' }} />, [
    getItemLayout(
      <Link to='/inventory-locations'><EnvironmentOutlined style={{ marginRight: '8px' }} />Inventory Locations</Link>,
      'inventory-locations'
    ),
    getItemLayout(
      <Link to='/inventory-movements'><SwapOutlined style={{ marginRight: '8px' }} />Inventory Movements</Link>,
      'inventory-movements'
    ),
    getItemLayout(
      <Link to='/inventory-management-v2'><DatabaseOutlined style={{ marginRight: '8px' }} />Inventory Management</Link>,
      'inventory-v2'
    )
  ]),

  // Stock Tracking
  getItemLayout('Stock Tracking', 'stock-logging-menu', <HistoryOutlined style={{ fontSize: '16px' }} />, [
    getItemLayout(
      <Link to='/stock-logs'><HistoryOutlined style={{ marginRight: '8px' }} />Stock Logs</Link>,
      'stock-logs'
    ),
    getItemLayout(
      <Link to='/stock-reconciliation'><AuditOutlined style={{ marginRight: '8px' }} />Stock Reconciliation</Link>,
      'stock-reconciliation'
    )
  ]),
  
  // Business Operations
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business</span>,
    'business-divider',
    null,
    []
  ),
  
  getItemLayout(
    <Link to='/dealer-warranty'>Warranty Management</Link>,
    '6',
    <SafetyCertificateOutlined style={{ fontSize: '16px' }} />
  ),
  
  // System Administration
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Administration</span>,
    'admin-divider',
    null,
    []
  ),
  
  getItemLayout(
    'Master Data',
    'masters',
    <SettingOutlined style={{ fontSize: '16px' }} />,
    [
      getItemLayout(
        <Link to='/dealers-list'>Dealer Management</Link>,
        '9'
      )
    ]
  )
  //   getItemLayout(
  //     <Link to="/admin-orders">Orders</Link>,
  //     "2",
  //     <CodeSandboxOutlined />
  //   ),
  //   getItemLayout(
  //     <Link to="/admin-alerts-list">Alerts</Link>,
  //     "3",
  //     <AlertOutlined />
  //   ),
  //   getItemLayout(
  //     <Link to="/admin-stock-list">Stock</Link>,
  //     "4",
  //     <StockOutlined />
  //   ),
  //   getItemLayout("User", "sub1", <UserOutlined />, [
  //     getItemLayout("Tom", "3"),
  //     getItemLayout("Bill", "4"),
  //     getItemLayout("Alex", "5"),
  //   ]),
  //   getItemLayout("Team", "sub2", <TeamOutlined />, [
  //     getItemLayout("Team 1", "6"),
  //     getItemLayout("Team 2", "8"),
  //   ]),
  //   getItemLayout("Files", "9", <FileOutlined />),
]
