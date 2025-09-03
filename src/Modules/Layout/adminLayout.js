import React, { useState, useMemo } from 'react'
import { Layout, Menu, theme, Avatar, Dropdown, Badge, Tooltip } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
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
import ProductionNotificationSystem from '../../Components/ProductionNotificationSystem'
import { resetToInitialUser } from '../../redux/slices/user.slice'
const { Header, Footer, Sider } = Layout

const AdminLayout = ({ content, title, items = adminSiderRoutes }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.userDetails)
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true
    }
  ]

  const handleUserMenuClick = ({ key }) => {
    switch (key) {
      case 'logout':
        // Clear local storage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('persist:root')
        
        // Reset Redux state
        dispatch(resetToInitialUser())
        
        // Navigate to login page
        navigate('/login')
        break
      case 'profile':
        // Handle profile
        navigate('/profile')
        break
      case 'settings':
        // Handle settings
        navigate('/settings')
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
      '/stock-management': '1a-new',
      '/dealer-warranty': '1c',
      '/inventory-management': '13',
      '/inventory-analysis': '14',
      '/inventory-reports': '15',
      '/admin-daily-entry-dealers': '2',
      // Production system routes
      '/production-system-summary': '5a',
      '/production-plans': '6',
      '/smart-production': '6a',
      '/production-workflow': '6b',
      '/job-cards': '6c',
      '/quality-assurance': '6d',
      '/production-analytics': '6e',
      '/production-presets': '7a',
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
    if (['1a', '1a-new'].includes(activeKey)) {
      return ['stock-menu'] // Stock Management submenu
    }
    if (['3', '4'].includes(activeKey)) {
      return ['sub1'] // Dealer Metrics submenu
    }
    if (['5a', '6', '6a', '6b', '6c', '6d', '6e', '7a', '8', '9', '10', '11', '12'].includes(activeKey)) {
      return ['sub2'] // Production submenu
    }

    return []
  }, [getActiveMenuKey])

  return (
    <Layout className='min-h-screen bg-background'>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={value => setCollapsed(value)}
        className='shadow-lg border-r border-border/20'
        width={280}
        collapsedWidth={80}
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
        {/* Logo Section */}
        <div
          className={`transition-all duration-300 ease-in-out border-b border-border/10 bg-gradient-to-r from-primary-50 to-accent-50 ${
            collapsed ? 'flex items-center justify-center py-4' : 'p-6'
          }`}
        >
          <div className='flex items-center space-x-3'>
            <div className={`w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-all duration-300 ${
              collapsed ? '' : 'mr-2'
            }`}>
              <span className='text-white font-bold text-lg'>P</span>
            </div>
            {!collapsed && (
              <div>
                <h3 className='text-lg font-bold text-primary'>Plati India</h3>
                <p className='text-xs text-secondary-600 -mt-1'>Manufacturing ERP</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className='px-4 py-2'>
          <Menu
            theme='light'
            selectedKeys={getActiveMenuKey}
            defaultOpenKeys={getOpenKeys}
            mode='inline'
            items={items}
            className='border-none bg-transparent'
            style={{
              background: 'transparent',
              fontSize: '14px',
              fontWeight: '500'
            }}
          />
        </div>
      </Sider>

      <Layout className='bg-background'>
        {/* Enhanced Header */}
        <Header className='bg-white border-b border-border/20 shadow-sm px-6 h-16 flex items-center justify-between sticky top-0 z-10'>
          <div className='flex items-center space-x-4'>
            <Tooltip title={collapsed ? 'Expand Menu' : 'Collapse Menu'}>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className='flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary-100 transition-all duration-200 hover:shadow-sm'
              >
                {collapsed ? <MenuUnfoldOutlined className='text-secondary-600' /> : <MenuFoldOutlined className='text-secondary-600' />}
              </button>
            </Tooltip>
            <div className='h-6 w-px bg-border' />
            <div className='flex flex-col'>
              <h1 className='text-lg font-semibold text-foreground truncate'>
                {title}
              </h1>
              <div className='flex items-center space-x-1 text-xs text-secondary-500'>
                <span>Dashboard</span>
                <span>›</span>
                <span className='text-primary font-medium'>{title}</span>
              </div>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            {/* Dark Mode Toggle */}
            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <button
                onClick={toggleDarkMode}
                className='flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary-100 transition-all duration-200 hover:shadow-sm'
              >
                {darkMode ? <SunOutlined className='text-secondary-600' /> : <MoonOutlined className='text-secondary-600' />}
              </button>
            </Tooltip>

            {/* Production Notifications */}
            <ProductionNotificationSystem />

            {/* User Profile Dropdown */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick
              }}
              placement='bottomRight'
              arrow
            >
              <button className='flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-secondary-50 transition-all duration-200 border border-transparent hover:border-secondary-200 hover:shadow-sm'>
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  className='bg-primary'
                />
                {!collapsed && (
                  <div className='text-left'>
                    <div className='text-sm font-medium text-foreground'>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {user?.email}
                    </div>
                  </div>
                )}
              </button>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <div className='flex-1 overflow-auto bg-gradient-to-br from-secondary-50/30 via-white to-primary-50/20'>
          <div className='animate-in p-6'>
            <div className='max-w-[1600px] mx-auto'>
              {content}
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <Footer className='bg-white border-t border-border/20 text-center py-3'>
          <div className='text-xs text-secondary-500'>
            <span className='font-medium text-secondary-700'>
              Plati India Pvt. Ltd.
            </span>{' '}
            © {new Date().getFullYear()} - All rights reserved | Manufacturing ERP System
          </div>
        </Footer>
      </Layout>
    </Layout>
  )
}
export default AdminLayout
