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
  ThunderboltOutlined,
  LineChartOutlined,
  ShopOutlined,
  BankOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ControlOutlined,
  HistoryOutlined,
  AuditOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  TruckOutlined,
  EnvironmentOutlined,
  SwapOutlined,
  InboxOutlined,
  UploadOutlined,
  FileAddOutlined,
  ImportOutlined,
  FileSearchOutlined,
  AppstoreOutlined,
  UserOutlined,
  CrownOutlined
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

export const superadminSiderRoutes = [
  // ============ DASHBOARDS ============
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dashboards</span>,
    'dashboards-divider',
    null,
    []
  ),

  // Admin Dashboard
  getItemLayout(
    <Link to='/admin-dashboard'>
      <span style={{ fontWeight: 600 }}>👑 Admin Dashboard</span>
    </Link>,
    'admin-dashboard',
    <DashboardOutlined style={{ fontSize: '16px' }} />
  ),

  // Sales Coordination Dashboard
  getItemLayout(
    <Link to='/sales-coordinator-dashboard'>
      <span style={{ fontWeight: 600 }}>📊 Sales Coordination</span>
    </Link>,
    'sales-coordination-dashboard',
    <ControlOutlined style={{ fontSize: '16px' }} />
  ),

  // Production Dashboard
  getItemLayout(
    <Link to='/production-dashboard'>
      <span style={{ fontWeight: 600 }}>🏭 Production Dashboard</span>
    </Link>,
    'production-dashboard',
    <ToolOutlined style={{ fontSize: '16px' }} />
  ),

  // Profit Dashboard
  getItemLayout(
    <Link to='/profit-dashboard'>
      <span style={{ fontWeight: 600 }}>💰 Profit Dashboard</span>
    </Link>,
    'profit-dashboard',
    <LineChartOutlined style={{ fontSize: '16px' }} />
  ),

  // ============ DATA ENTRY ============
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Entry</span>,
    'data-entry-divider',
    null,
    []
  ),

  // Daily Entries (Admin)
  getItemLayout(
    <Link to='/admin-daily-entry-dealers'>
      <span style={{ fontWeight: 600 }}>📋 Daily Entries (Admin)</span>
    </Link>,
    'admin-daily-entries',
    <FileTextOutlined style={{ fontSize: '16px' }} />
  ),

  // Outwards Entry
  getItemLayout(
    <Link to='/add-daily-entry'>Outwards Entry</Link>,
    'outwards-entry',
    <FileAddOutlined style={{ fontSize: '16px' }} />
  ),

  // Inwards Entry
  getItemLayout(
    <Link to='/add-inwards-entry'>Inwards Entry</Link>,
    'inwards-entry',
    <ImportOutlined style={{ fontSize: '16px' }} />
  ),

  // Payment Entry
  getItemLayout(
    <Link to='/add-payment-entry'>Payment Entry</Link>,
    'payment-entry',
    <BankOutlined style={{ fontSize: '16px' }} />
  ),

  // Dealer Selection
  getItemLayout(
    <Link to='/entry-daily-entry-dealers'>Dealer Selection</Link>,
    'dealer-selection',
    <TeamOutlined style={{ fontSize: '16px' }} />
  ),

  // Pricing Entries
  getItemLayout(
    <Link to='/data-entry-pricing'>
      <span style={{ fontWeight: 600 }}>💰 Pricing Entries</span>
    </Link>,
    'pricing-entries',
    <DollarOutlined style={{ fontSize: '16px' }} />
  ),

  // ============ SALES COORDINATION ============
  getItemLayout('Sales Coordination', 'sales-coordination-menu', <SyncOutlined style={{ fontSize: '16px' }} />, [
    getItemLayout(
      <Link to='/sales-create-order'>📋 Create Order</Link>,
      'sales-create-order'
    ),
    getItemLayout(
      <Link to='/sales-create-order-alloys'>📋 Create Order (Alloys)</Link>,
      'sales-create-order-alloys'
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

  // ============ PRODUCTION SYSTEM ============
  getItemLayout('Production System', 'production-menu', <ToolOutlined style={{ fontSize: '16px' }} />, [
    getItemLayout(
      <Link to='/production-dashboard'>Production Dashboard</Link>,
      'prod-dashboard'
    ),
    getItemLayout(
      <Link to='/user-production-steps'><TeamOutlined style={{ marginRight: '8px' }} />User Step Assignments</Link>,
      'user-production-steps'
    ),
    getItemLayout(
      <Link to='/equipment-management'><SettingOutlined style={{ marginRight: '8px' }} />Equipment Management</Link>,
      'equipment-management'
    ),
    getItemLayout(
      <Link to='/step-position-mapping'><EnvironmentOutlined style={{ marginRight: '8px' }} />Step-Position Mapping</Link>,
      'step-position-mapping'
    ),
    getItemLayout(
      <Link to='/production-plans'>Production Plans</Link>,
      'production-plans'
    ),
    getItemLayout(
      <Link to='/production-plans-v2'>Production Plans V2</Link>,
      'production-plans-v2'
    ),
    getItemLayout(
      <Link to='/smart-production'><RocketOutlined style={{ marginRight: '8px' }} />Smart Planner</Link>,
      'smart-production'
    ),
    getItemLayout(
      <Link to='/job-cards'>Job Card Management</Link>,
      'job-cards'
    ),
    getItemLayout(
      <Link to='/production-presets'>Preset Management</Link>,
      'production-presets'
    ),
    getItemLayout(
      <Link to='/inventory-requests'><DatabaseOutlined style={{ marginRight: '8px' }} />Inventory Requests</Link>,
      'inventory-requests'
    ),
    getItemLayout(
      <Link to='/dispatch-to-sales'><TruckOutlined style={{ marginRight: '8px' }} />Dispatch to Sales</Link>,
      'dispatch-to-sales'
    ),
    getItemLayout(
      <Link to='/rejected-stock'><ExclamationCircleOutlined style={{ marginRight: '8px' }} />Rejected Stock</Link>,
      'rejected-stock'
    ),
    getItemLayout(
      <Link to='/discarded-stock-management'><DeleteOutlined style={{ marginRight: '8px' }} />Discarded Stock</Link>,
      'discarded-stock'
    )
  ]),

  // ============ MANUFACTURING SYSTEM ============
  getItemLayout('Manufacturing System', 'manufacturing-system-menu', <ShopOutlined style={{ fontSize: '16px' }} />, [
    getItemLayout(
      <Link to='/purchase-orders'><ShopOutlined style={{ marginRight: '8px' }} />Purchase Orders</Link>,
      'purchase-orders'
    ),
    getItemLayout(
      <Link to='/mold-management'><ToolOutlined style={{ marginRight: '8px' }} />Mold Management</Link>,
      'mold-management'
    )
  ]),

  // ============ INVENTORY SYSTEM ============
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

  // ============ STOCK TRACKING ============
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

  // ============ COST MANAGEMENT ============
  getItemLayout('Cost Management', 'cost-management-menu', <DollarOutlined style={{ fontSize: '16px' }} />, [
    getItemLayout(
      <Link to='/cost-categories'><SettingOutlined style={{ marginRight: '8px' }} />Cost Categories</Link>,
      'cost-categories'
    ),
    getItemLayout(
      <Link to='/monthly-overheads'><BankOutlined style={{ marginRight: '8px' }} />Monthly Overheads</Link>,
      'monthly-overheads'
    ),
    getItemLayout(
      <Link to='/profit-dashboard'><LineChartOutlined style={{ marginRight: '8px' }} />Profit Dashboard</Link>,
      'cost-profit-dashboard'
    )
  ]),

  // ============ BUSINESS OPERATIONS ============
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business</span>,
    'business-divider',
    null,
    []
  ),

  // Warranty Management
  getItemLayout(
    <Link to='/dealer-warranty'>
      <span style={{ fontWeight: 600 }}>🛡️ Warranty Management</span>
    </Link>,
    'warranty-management',
    <SafetyCertificateOutlined style={{ fontSize: '16px' }} />
  ),

  // ============ ADMINISTRATION ============
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Administration</span>,
    'admin-divider',
    null,
    []
  ),

  // Master Data
  getItemLayout(
    'Master Data',
    'masters',
    <SettingOutlined style={{ fontSize: '16px' }} />,
    [
      getItemLayout(
        <Link to='/dealers-list'>Dealer Management</Link>,
        'dealers-list'
      ),
      getItemLayout(
        <Link to='/users-list'>User Management</Link>,
        'users-list'
      )
    ]
  ),

  // User Management
  getItemLayout(
    'User Management',
    'user-management-menu',
    <UserOutlined style={{ fontSize: '16px' }} />,
    [
      getItemLayout(
        <Link to='/user-production-steps'><TeamOutlined style={{ marginRight: '8px' }} />User Step Assignments</Link>,
        'user-step-assignments'
      )
    ]
  )
]
