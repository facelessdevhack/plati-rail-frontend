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
  ClockCircleOutlined
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

  // Sales Coordination
  getItemLayout('Sales Coordination', 'sales-coordination-menu', <SyncOutlined style={{ fontSize: '16px' }} />, [
    getItemLayout(
      <Link to='/sales-pending-entries'>⏳ Pending Entries</Link>,
      'sales-pending'
    ),
    getItemLayout(
      <Link to='/sales-inprod-entries'>🔄 In Production</Link>,
      'sales-inprod'
    )
  ]),

  // Inventory Management
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inventory</span>,
    'inventory-divider',
    null,
    []
  ),
  
  getItemLayout(
    <Link to='/entry-inventory-system'>Inventory System</Link>,
    '8',
    <DatabaseOutlined style={{ fontSize: '16px' }} />
  ),
  
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
