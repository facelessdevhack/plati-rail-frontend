import React, { useState, useMemo } from 'react'
import { Layout, Menu, theme, Avatar, Dropdown, Badge, Tooltip } from 'antd'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  BellOutlined, 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { adminSiderRoutes } from './Routes/adminSiderRoutes'
const { Header, Footer, Sider } = Layout

const AdminLayout = ({ content, title, items = adminSiderRoutes }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const location = useLocation()
  const { user } = useSelector(state => state.userDetails)
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ]

  const handleUserMenuClick = ({ key }) => {
    switch (key) {
      case 'logout':
        // Handle logout
        break
      case 'profile':
        // Handle profile
        break
      case 'settings':
        // Handle settings
        break
      default:
        break
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    // Implement dark mode toggle logic
    document.documentElement.classList.toggle('dark')
  }

  // Function to get the active menu key based on current route
  const getActiveMenuKey = useMemo(() => {
    const currentPath = location.pathname

    // Create a mapping of paths to menu keys
    const pathToKeyMap = {
      '/admin-dashboard': '1',
      '/dealer-metrics': '1b',
      '/stock-dashboard': '1a',
      '/dealer-warranty': '1c',
      '/admin-daily-entry-dealers': '2',
      '/admin-daily-entry-dealers-details': '3',
      '/admin-daily-entry-dealers-details-by-size': '4',
      '/admin-daily-entry-dealers-details-by-size-details': '5',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer': '6',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details':
        '7',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product':
        '8',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details':
        '9',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date':
        '10',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details':
        '11',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time':
        '12',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details':
        '13',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user':
        '14',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details':
        '15',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status':
        '16',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details':
        '17',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type':
        '18',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details':
        '19',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category':
        '20',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category-details':
        '21',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category-details-by-subcategory':
        '22',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category-details-by-subcategory-details':
        '23',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category-details-by-subcategory-details-by-brand':
        '24',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category-details-by-subcategory-details-by-brand-details':
        '25',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category-details-by-subcategory-details-by-brand-details-by-model':
        '26',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category-details-by-subcategory-details-by-brand-details-by-model-details':
        '27',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category-details-by-subcategory-details-by-brand-details-by-model-details-by-variant':
        '28',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category-details-by-subcategory-details-by-brand-details-by-model-details-by-variant-details':
        '29',
      '/admin-daily-entry-dealers-details-by-size-details-by-dealer-details-by-product-details-by-date-details-by-time-details-by-user-details-by-status-details-by-type-details-by-category-details-by-subcategory-details-by-brand-details-by-model-details-by-variant-details-by-color':
        '30'
    }

    // Check for exact matches first
    if (pathToKeyMap[currentPath]) {
      return [pathToKeyMap[currentPath]]
    }

    // Check for partial matches (for dynamic routes)
    for (const [path, key] of Object.entries(pathToKeyMap)) {
      if (currentPath.startsWith(path)) {
        return [key]
      }
    }

    // Special handling for dynamic routes
    if (
      currentPath.includes('/production-plan/') &&
      !currentPath.includes('/create')
    ) {
      return ['6'] // Production Plans
    }
    if (currentPath.includes('/production-job-card/')) {
      return ['8'] // Job Cards
    }
    if (currentPath.includes('/production-qa-report/')) {
      return ['10'] // QA Reporting
    }
    if (currentPath.includes('/production-rejections/')) {
      return ['11'] // Rejection Management
    }
    if (currentPath.includes('/production-inventory-requests/')) {
      return ['12'] // Inventory Requests
    }
    if (currentPath.includes('/admin-dealer-metrics-details/')) {
      return ['3'] // Overall Dealer Metrics
    }
    if (currentPath.includes('/admin-dealer-metrics-by-size/')) {
      return ['4'] // Dealer Metrics By Size
    }

    // Default to first item if no match found
    return ['1']
  }, [location.pathname])

  // Function to get open submenu keys
  const getOpenKeys = useMemo(() => {
    const activeKey = getActiveMenuKey[0]

    // If the active key belongs to a submenu, return the submenu key
    if (['3', '4'].includes(activeKey)) {
      return ['sub1'] // Dealer Metrics submenu
    }
    if (['5', '6', '7', '8', '9', '10', '11', '12'].includes(activeKey)) {
      return ['sub2'] // Production submenu
    }

    return []
  }, [getActiveMenuKey])

  return (
    <Layout className="min-h-screen bg-background">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={value => setCollapsed(value)}
        className="shadow-lg border-r border-border"
        style={{
          background: 'linear-gradient(135deg, #313C6F 0%, #273059 100%)',
        }}
      >
        {/* Logo Section */}
        <div
          className={`transition-all duration-300 ease-in-out border-b border-white/10 ${
            collapsed ? 'flex items-center justify-center py-4' : 'p-6'
          }`}
        >
          <img
            className={`transition-all duration-300 ${
              collapsed ? 'h-8 w-auto' : 'h-10 w-auto'
            }`}
            src='/assets/logo.png'
            alt='Plati India'
          />
        </div>

        {/* Navigation Menu */}
        <Menu
          theme='dark'
          selectedKeys={getActiveMenuKey}
          defaultOpenKeys={getOpenKeys}
          mode='inline'
          items={items}
          className="border-none bg-transparent"
          style={{
            background: 'transparent',
          }}
        />
      </Sider>
      
      <Layout className="bg-background">
        {/* Enhanced Header */}
        <Header className="bg-white/80 backdrop-blur-sm border-b border-border shadow-sm px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Tooltip title={collapsed ? 'Expand Menu' : 'Collapse Menu'}>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            </Tooltip>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold text-foreground truncate">
              {title}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
              >
                {darkMode ? <SunOutlined /> : <MoonOutlined />}
              </button>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <Badge count={3} size="small">
                <button className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors">
                  <BellOutlined className="text-lg" />
                </button>
              </Badge>
            </Tooltip>

            {/* User Profile Dropdown */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              arrow
            >
              <button className="flex items-center space-x-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  className="bg-primary"
                />
                {!collapsed && (
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user?.email}
                    </div>
                  </div>
                )}
              </button>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <div className="animate-in">
            {content}
          </div>
        </div>

        {/* Enhanced Footer */}
        <Footer className="bg-white/80 backdrop-blur-sm border-t border-border text-center py-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Plati India Pvt. Ltd.</span> © {new Date().getFullYear()} - All rights reserved
          </div>
        </Footer>
      </Layout>
    </Layout>
  )
}
export default AdminLayout
