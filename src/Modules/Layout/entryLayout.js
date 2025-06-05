import React, { useState, useMemo } from 'react'
import { Layout, Menu, theme } from 'antd'
import { useLocation } from 'react-router-dom'
import { adminSiderRoutes } from './Routes/adminSiderRoutes'
const { Header, Footer, Sider } = Layout

const EntryLayout = ({ content, title, items = adminSiderRoutes }) => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const {
    token: { colorBgContainer }
  } = theme.useToken()

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
        {/* <Footer
          className="bg-white"
          style={{
            textAlign: "center",
          }}
        >
          Plati India Pvt. Ltd. ©{new Date().getFullYear()}
        </Footer> */}
      </Layout>
    </Layout>
  )
}
export default EntryLayout
