import React, { useState, useMemo } from 'react'
import { Layout, Menu, theme } from 'antd'
import { useLocation } from 'react-router-dom'
import { adminSiderRoutes } from './Routes/adminSiderRoutes'
const { Header, Footer, Sider } = Layout

const AdminLayout = ({ content, title, items = adminSiderRoutes }) => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const {
    token: { colorBgContainer }
  } = theme.useToken()

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
    <Layout
      style={{
        minHeight: '100vh'
      }}
    >
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={value => setCollapsed(value)}
      >
        <div
          className={`transition-all duration-200 ${
            collapsed ? 'flex items-center justify-center my-10' : 'p-10'
          }`}
        >
          <img
            className={`transition-all duration-200 ${
              collapsed ? 'z-10 h-8 p-1.5' : 'z-10'
            }`}
            src='/assets/logo.png'
            alt='Plati India'
          />
        </div>

        <Menu
          theme='dark'
          selectedKeys={getActiveMenuKey}
          defaultOpenKeys={getOpenKeys}
          mode='inline'
          items={items}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            padding: '0 0px 0px 20px'
          }}
          className='flex items-center justify-start'
        >
          <div className='flex items-center justify-start text-2xl font-semibold text-left text-black font-poppins'>
            {title}
          </div>
        </Header>
        {content}
        <Footer
          className='bg-white'
          style={{
            textAlign: 'center'
          }}
        >
          Plati India Pvt. Ltd. ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  )
}
export default AdminLayout
