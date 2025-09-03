import React, { useState, useMemo } from 'react'
import { Layout, Menu, theme, Avatar, Dropdown, Tooltip } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { entrySiderRoutes } from './Routes/entrySiderRoutes'
import { resetToInitialUser } from '../../redux/slices/user.slice'
const { Header, Footer, Sider } = Layout

const EntryLayout = ({ content, title, items = entrySiderRoutes }) => {
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
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('persist:root')
        dispatch(resetToInitialUser())
        navigate('/login')
        break
      case 'profile':
        navigate('/profile')
        break
      case 'settings':
        navigate('/settings')
        break
      default:
        break
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  // Function to get the active menu key based on current route
  const getActiveMenuKey = useMemo(() => {
    const currentPath = location.pathname

    // Create a mapping of paths to menu keys for entry routes
    const pathToKeyMap = {
      '/entry-dashboard': '1',
      '/add-daily-entry': '2',
      '/add-daily-entry-alloys': '2',
      '/add-daily-entry-tyres': '2',
      '/add-daily-entry-caps': '2',
      '/add-daily-entry-ppf': '2',
      '/add-inwards-entry': '3',
      '/add-payment-entry': '4',
      '/entry-daily-entry-dealers': '5',
      '/dealer-warranty': '6',
      '/stock-management': '7',
      '/entry-inventory-system': '8',
      '/dealers-list': '9',
      '/add-charges-entry': '6',
      '/add-cap-stock': '7',
      '/add-finish': '8',
      '/add-model': '9'
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

    // Default to first item if no match found
    return ['1']
  }, [location.pathname])

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
          className={`transition-all duration-300 ease-in-out border-b border-border/10 bg-gradient-to-r from-accent-50 to-primary-50 ${
            collapsed ? 'flex items-center justify-center py-4' : 'p-6'
          }`}
        >
          <div className='flex items-center space-x-3'>
            <div className={`w-8 h-8 bg-accent rounded-lg flex items-center justify-center transition-all duration-300 ${
              collapsed ? '' : 'mr-2'
            }`}>
              <span className='text-white font-bold text-lg'>P</span>
            </div>
            {!collapsed && (
              <div>
                <h3 className='text-lg font-bold text-accent'>Plati Entry</h3>
                <p className='text-xs text-secondary-600 -mt-1'>Data Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className='px-4 py-2'>
          <Menu
            theme='light'
            selectedKeys={getActiveMenuKey}
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
                <span>Entry System</span>
                <span>›</span>
                <span className='text-accent font-medium'>{title}</span>
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
                  className='bg-accent'
                />
                {!collapsed && (
                  <div className='text-left'>
                    <div className='text-sm font-medium text-foreground'>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Entry Staff
                    </div>
                  </div>
                )}
              </button>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <div className='flex-1 overflow-auto bg-gradient-to-br from-secondary-50/30 via-white to-accent-50/20'>
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
            © {new Date().getFullYear()} - Entry Management System
          </div>
        </Footer>
      </Layout>
    </Layout>
  )
}
export default EntryLayout
