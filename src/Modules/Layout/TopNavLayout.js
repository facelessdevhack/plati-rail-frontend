import React, { useMemo } from 'react'
import { Avatar, Dropdown, Badge } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  FileTextOutlined,
  RocketOutlined,
  ToolOutlined,
  TeamOutlined,
  DatabaseOutlined,
  TruckOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  SwapOutlined,
  HistoryOutlined,
  AuditOutlined,
  DollarOutlined,
  LineChartOutlined,
  BankOutlined,
  ShopOutlined,
  InboxOutlined,
  AppstoreOutlined,
  TagsOutlined,
  FormOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  ClockCircleOutlined,
  StockOutlined
} from '@ant-design/icons'
import { topNavSections, getActiveNav, getSectionsForRole } from './Routes/topNavRoutes'
import ProductionNotificationSystem from '../../Components/ProductionNotificationSystem'
import { resetToInitialUser } from '../../redux/slices/user.slice'

const ICON_MAP = {
  'dashboard': <DashboardOutlined />,
  'file': <FileTextOutlined />,
  'rocket': <RocketOutlined />,
  'tool': <ToolOutlined />,
  'setting': <SettingOutlined />,
  'database': <DatabaseOutlined />,
  'truck': <TruckOutlined />,
  'warning': <ExclamationCircleOutlined />,
  'delete': <DeleteOutlined />,
  'team': <TeamOutlined />,
  'environment': <EnvironmentOutlined />,
  'swap': <SwapOutlined />,
  'history': <HistoryOutlined />,
  'audit': <AuditOutlined />,
  'dollar': <DollarOutlined />,
  'line-chart': <LineChartOutlined />,
  'bank': <BankOutlined />,
  'shop': <ShopOutlined />,
  'inbox': <InboxOutlined />,
  'appstore': <AppstoreOutlined />,
  'tags': <TagsOutlined />,
  'form': <FormOutlined />,
  'unordered-list': <UnorderedListOutlined />,
  'bar-chart': <BarChartOutlined />,
  'safety': <SafetyCertificateOutlined />,
  'edit': <EditOutlined />,
  'clock': <ClockCircleOutlined />,
  'package': <InboxOutlined />,
  'factory': <ToolOutlined />,
  'invoice': <FileTextOutlined />,
  'stock': <StockOutlined />,
  'crown': <DashboardOutlined />,
  'calculator': <DollarOutlined />,
}

const TopNavLayout = ({ content }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.userDetails)

  const roleId = Number(user?.roleId)
  const visibleSections = useMemo(() => getSectionsForRole(roleId), [roleId])
  const activeNav = useMemo(() => getActiveNav(location.pathname), [location.pathname])

  const activeSection = useMemo(() => {
    return topNavSections.find(s => s.key === activeNav.section)
  }, [activeNav.section])

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true }
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

  return (
    <div className="topnav-layout">
      {/* ===== TOP BAR ===== */}
      <header className="topnav-header">
        <div className="topnav-header-inner">
          {/* Logo */}
          <div
            className="topnav-logo"
            onClick={() => navigate(visibleSections[0]?.defaultPath || '/admin-dashboard')}
          >
            <img
              src="/assets/images/plati-logomark.png"
              alt="Plati"
              className="topnav-logo-img"
            />
          </div>

          {/* Primary Navigation */}
          <nav className="topnav-primary">
            {visibleSections.map(section => (
              <button
                key={section.key}
                className={`topnav-primary-item ${activeNav.section === section.key ? 'active' : ''}`}
                onClick={() => navigate(section.defaultPath)}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Right: Notifications + User */}
          <div className="topnav-right">
            <ProductionNotificationSystem />
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              arrow
            >
              <button className="topnav-avatar-btn">
                <Avatar size={36} icon={<UserOutlined />} className="topnav-avatar" />
              </button>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* ===== SUB-NAVIGATION BAR ===== */}
      {activeSection && activeSection.subNav.length > 0 && (
        <div className="topnav-subnav">
          <div className="topnav-subnav-inner">
            {activeSection.subNav.map(item => (
              <button
                key={item.key}
                className={`topnav-subnav-item ${activeNav.subNavKey === item.key ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="topnav-subnav-icon">
                  {ICON_MAP[item.icon] || <FileTextOutlined />}
                </span>
                <span className="topnav-subnav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== CONTENT ===== */}
      <main className="topnav-content">
        <div className="topnav-content-inner">
          {content}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="topnav-footer">
        <div className="topnav-footer-line" />
        <p className="topnav-footer-text">
          <span className="topnav-footer-copyright">&copy;</span>
          {' '}PLATI INDIA {new Date().getFullYear()} | ALL RIGHTS RESERVED. | ERP SYSTEM
        </p>
      </footer>

      <style>{`
        .topnav-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #F8F4F0;
        }

        /* ===== TOP BAR ===== */
        .topnav-header {
          height: 72px;
          background: #F8F4F0;
          border-bottom: 1px solid #f0f0f0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .topnav-header-inner {
          max-width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 60px;
          gap: 24px;
        }

        /* Logo */
        .topnav-logo {
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          height: 48px;
        }

        .topnav-logo-img {
          height: 36px;
          width: auto;
          object-fit: contain;
        }

        /* Primary Nav */
        .topnav-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: center;
        }

        .topnav-primary-item {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #374151;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .topnav-primary-item:hover {
          background: #f5f5f5;
          color: #111827;
        }

        .topnav-primary-item.active {
          color: #f26c2d;
          font-weight: 600;
        }

        /* Right section */
        .topnav-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .topnav-avatar-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .topnav-avatar {
          background: #f26c2d !important;
        }

        /* ===== SUB-NAVIGATION BAR ===== */
        .topnav-subnav {
          height: 56px;
          background: #F8F4F0;
          border-bottom: 1px solid #f0f0f0;
          position: sticky;
          top: 72px;
          z-index: 99;
        }

        .topnav-subnav-inner {
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 60px;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .topnav-subnav-inner::-webkit-scrollbar {
          display: none;
        }

        .topnav-subnav-item {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          padding: 6px 14px;
          border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .topnav-subnav-item:hover {
          background: #f9fafb;
          color: #374151;
        }

        .topnav-subnav-item.active {
          background: #f26c2d;
          color: white;
          font-weight: 600;
        }

        .topnav-subnav-item.active .topnav-subnav-icon {
          color: white;
        }

        .topnav-subnav-icon {
          font-size: 16px;
          display: flex;
          align-items: center;
          color: #9ca3af;
        }

        .topnav-subnav-item.active .topnav-subnav-icon {
          color: white;
        }

        /* ===== CONTENT ===== */
        .topnav-content {
          flex: 1;
          overflow: auto;
        }

        .topnav-content-inner {
          padding: 32px 60px;
          max-width: 100%;
        }

        /* ===== FOOTER ===== */
        .topnav-footer {
          text-align: center;
          padding: 24px 60px;
        }

        .topnav-footer-line {
          height: 1px;
          background: #e5e7eb;
          margin-bottom: 20px;
        }

        .topnav-footer-text {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #9ca3af;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin: 0;
        }

        .topnav-footer-copyright {
          font-size: 12px;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1200px) {
          .topnav-header-inner,
          .topnav-subnav-inner,
          .topnav-content-inner,
          .topnav-footer {
            padding-left: 24px;
            padding-right: 24px;
          }
        }

        @media (max-width: 768px) {
          .topnav-header-inner {
            padding: 0 16px;
            gap: 12px;
          }

          .topnav-primary {
            overflow-x: auto;
            scrollbar-width: none;
          }

          .topnav-primary::-webkit-scrollbar {
            display: none;
          }

          .topnav-primary-item {
            font-size: 13px;
            padding: 6px 12px;
          }

          .topnav-subnav-inner {
            padding: 0 16px;
          }

          .topnav-content-inner {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default TopNavLayout
