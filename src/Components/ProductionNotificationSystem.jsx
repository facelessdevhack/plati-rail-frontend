import React, { useState, useEffect, useCallback } from 'react'
import {
  notification,
  Badge,
  Drawer,
  List,
  Typography,
  Button,
  Space,
  Tag,
  Avatar,
  Tooltip,
  Empty,
  Alert,
  Divider
} from 'antd'
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  ToolOutlined,
  CloseOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import moment from 'moment'
import { client } from '../Utils/axiosClient'

const { Title, Text } = Typography

// Notification Types (must match notifications_master.notification_type check constraint)
const NOTIFICATION_TYPES = {
  JOB_CARD_ASSIGNED: 'job_card_assigned',
  STEP_COMPLETED: 'step_completed',
  STEP_READY: 'step_ready',
  URGENT_JOB: 'urgent_job',
  QUALITY_REJECTION: 'quality_rejection',
  PRODUCTION_ALERT: 'production_alert'
}

// Production Steps for reference
const PRODUCTION_STEPS = [
  { id: 1, name: 'Material Request', icon: '📦' },
  { id: 2, name: 'Painting', icon: '🎨' },
  { id: 3, name: 'Machining', icon: '⚙️' },
  { id: 4, name: 'PVD Powder Coating', icon: '🔧' },
  { id: 5, name: 'PVD Process', icon: '⚡' },
  { id: 6, name: 'Milling', icon: '🏭' },
  { id: 7, name: 'Acrylic Coating', icon: '💧' },
  { id: 8, name: 'Lacquer Finish', icon: '✨' },
  { id: 9, name: 'Packaging', icon: '📋' },
  { id: 10, name: 'Quality Check', icon: '🔍' },
  { id: 11, name: 'Dispatch', icon: '🚚' }
]

const ProductionNotificationSystem = () => {
  const { user } = useSelector(state => state.userDetails || {})

  // State management
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    stepUpdates: true,
    qualityAlerts: true,
    urgentPlans: true,
    bottleneckAlerts: true,
    inventoryAlerts: true,
    systemNotifications: true
  })

  // WebSocket connection for real-time updates
  const [ws, setWs] = useState(null)

  // Initialize WebSocket connection
  useEffect(() => {
    if (user?.token) {
      connectWebSocket()
    }

    // Load existing notifications
    loadNotifications()

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [user?.token])

  // Connect to WebSocket for real-time updates
  const connectWebSocket = useCallback(() => {
    // Real-time updates need a dedicated WebSocket server; only connect when
    // one is configured, otherwise the app runs on manual refresh + polling.
    const wsUrl = process.env.REACT_APP_WS_URL
    if (!wsUrl) {
      setIsConnected(false)
      return
    }
    try {
      const websocket = new WebSocket(`${wsUrl}/production-notifications`)
      
      websocket.onopen = () => {
        console.log('WebSocket connected for production notifications')
        setIsConnected(true)
        
        // Send authentication
        websocket.send(JSON.stringify({
          type: 'auth',
          token: user?.token
        }))
      }

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleRealtimeNotification(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      websocket.onclose = () => {
        console.log('WebSocket disconnected - this is normal in development mode')
        setIsConnected(false)
        
        // Don't auto-reconnect in development to avoid spam
        if (process.env.NODE_ENV === 'production') {
          setTimeout(connectWebSocket, 10000)
        }
      }

      websocket.onerror = (error) => {
        console.log('WebSocket connection failed - this is expected in development mode without WebSocket server')
        setIsConnected(false)
      }

      setWs(websocket)
    } catch (error) {
      console.log('WebSocket not available in development mode - this is normal')
      setIsConnected(false)
    }
  }, [user?.token])

  // Handle real-time notifications
  const handleRealtimeNotification = (data) => {
    const newNotification = {
      id: data.id || Date.now(),
      type: data.type,
      title: data.title,
      message: data.message,
      jobCardId: data.jobCardId,
      planId: data.planId,
      stepId: data.stepId,
      priority: data.priority || 'normal',
      timestamp: new Date().toISOString(),
      read: false,
      data: data.additionalData || {}
    }

    // Add to notifications list
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)

    // Show system notification if settings allow
    if (shouldShowNotification(data.type)) {
      showSystemNotification(newNotification)
    }
  }

  // Check if notification should be shown based on settings
  const shouldShowNotification = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.STEP_COMPLETED:
      case NOTIFICATION_TYPES.STEP_READY:
      case NOTIFICATION_TYPES.JOB_CARD_ASSIGNED:
        return notificationSettings.stepUpdates
      case NOTIFICATION_TYPES.QUALITY_REJECTION:
        return notificationSettings.qualityAlerts
      case NOTIFICATION_TYPES.URGENT_JOB:
        return notificationSettings.urgentPlans
      case NOTIFICATION_TYPES.PRODUCTION_ALERT:
        return notificationSettings.systemNotifications
      default:
        return true
    }
  }

  // Show system notification
  const showSystemNotification = (notificationData) => {
    const config = getNotificationConfig(notificationData.type)
    
    notification[config.type]({
      message: notificationData.title,
      description: notificationData.message,
      icon: config.icon,
      duration: config.duration,
      placement: 'topRight'
    })
  }

  // Get notification configuration
  const getNotificationConfig = (type) => {
    const configs = {
      [NOTIFICATION_TYPES.JOB_CARD_ASSIGNED]: {
        type: 'info',
        icon: <ToolOutlined style={{ color: '#1890ff' }} />,
        duration: 5
      },
      [NOTIFICATION_TYPES.STEP_COMPLETED]: {
        type: 'success',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 4
      },
      [NOTIFICATION_TYPES.STEP_READY]: {
        type: 'info',
        icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
        duration: 5
      },
      [NOTIFICATION_TYPES.URGENT_JOB]: {
        type: 'error',
        icon: <FireOutlined style={{ color: '#f5222d' }} />,
        duration: 0 // Don't auto-close urgent notifications
      },
      [NOTIFICATION_TYPES.QUALITY_REJECTION]: {
        type: 'error',
        icon: <ExclamationCircleOutlined style={{ color: '#f5222d' }} />,
        duration: 8
      },
      [NOTIFICATION_TYPES.PRODUCTION_ALERT]: {
        type: 'warning',
        icon: <BellOutlined style={{ color: '#fa8c16' }} />,
        duration: 6
      }
    }

    return configs[type] || {
      type: 'info',
      icon: <BellOutlined />,
      duration: 4
    }
  }

  // Map a notifications_master row (camelCased by the API) to the shape the UI renders
  const normalizeNotification = (n) => ({
    id: n.id,
    type: n.notificationType,
    title: n.title,
    message: n.body,
    jobCardId: n.jobCardId,
    planId: n.prodPlanId,
    stepId: n.data?.stepId,
    priority: n.data?.priority || 'normal',
    timestamp: n.createdAt,
    read: n.isRead,
    data: n.data || {}
  })

  // Load existing notifications
  const loadNotifications = async () => {
    try {
      setLoading(true)

      const [listRes, countRes] = await Promise.all([
        client.get('/notifications/my-notifications', { silent: true }),
        client.get('/notifications/unread-count', { silent: true })
      ])

      setNotifications((listRes.data.notifications || []).map(normalizeNotification))
      setUnreadCount(countRes.data.unreadCount || 0)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await client.post(`/notifications/mark-read/${notificationId}`, null, { silent: true })
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await client.post('/notifications/mark-all-read', null, { silent: true })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Get notification icon and color
  const getNotificationIcon = (type, priority) => {
    const config = getNotificationConfig(type)
    
    if (priority === 'urgent') {
      return <FireOutlined style={{ color: '#f5222d' }} />
    }
    
    return config.icon
  }

  // Get step name for step-related notifications
  const getStepName = (stepId) => {
    const step = PRODUCTION_STEPS.find(s => s.id === stepId)
    return step ? `${step.icon} ${step.name}` : `Step ${stepId}`
  }

  // Render notification item
  const renderNotificationItem = (item) => {
    const isUnread = !item.read
    const timeAgo = moment(item.timestamp).fromNow()
    
    return (
      <List.Item
        className={`cursor-pointer transition-colors ${isUnread ? 'bg-blue-50' : ''}`}
        onClick={() => !item.read && markAsRead(item.id)}
        actions={[
          <Tooltip title={timeAgo}>
            <Text className="text-xs text-gray-500">
              {moment(item.timestamp).format('HH:mm')}
            </Text>
          </Tooltip>
        ]}
      >
        <List.Item.Meta
          avatar={
            <Badge dot={isUnread}>
              <Avatar 
                icon={getNotificationIcon(item.type, item.priority)} 
                size="small"
                style={{ backgroundColor: 'transparent', color: 'inherit' }}
              />
            </Badge>
          }
          title={
            <div className="flex items-center justify-between">
              <Text strong={isUnread} className={isUnread ? 'text-blue-600' : ''}>
                {item.title}
              </Text>
              <div className="flex items-center space-x-2">
                {item.priority === 'urgent' && (
                  <Tag color="red" size="small">URGENT</Tag>
                )}
                {item.jobCardId && (
                  <Tag color="blue" size="small">#{item.jobCardId}</Tag>
                )}
              </div>
            </div>
          }
          description={
            <div>
              <Text className="text-sm">{item.message}</Text>
              {item.stepId && (
                <div className="text-xs text-gray-500 mt-1">
                  Step: {getStepName(item.stepId)}
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    )
  }

  return (
    <>
      {/* Notification Bell Icon */}
      <Tooltip title="Production Notifications">
        <Badge count={unreadCount} offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined />}
            onClick={() => setDrawerVisible(true)}
            className={`notification-bell ${!isConnected ? 'opacity-50' : ''}`}
          />
        </Badge>
      </Tooltip>

      {/* Notifications Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellOutlined />
              <span>Production Notifications</span>
              <Badge count={unreadCount} size="small" />
            </div>
            {process.env.REACT_APP_WS_URL && (
              <div className="flex items-center space-x-2">
                <Tooltip title={isConnected ? 'Real-time connected' : 'Disconnected'}>
                  <Badge
                    status={isConnected ? 'success' : 'error'}
                    text={isConnected ? 'Live' : 'Offline'}
                  />
                </Tooltip>
              </div>
            )}
          </div>
        }
        placement="right"
        closable={false}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadNotifications}
              loading={loading}
              size="small"
            />
            <Button
              onClick={markAllAsRead}
              size="small"
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={() => setDrawerVisible(false)}
              size="small"
            />
          </Space>
        }
      >
        {/* Connection Status Alert (only relevant when a WebSocket server is configured) */}
        {process.env.REACT_APP_WS_URL && !isConnected && (
          <Alert
            message="Connection Lost"
            description="Real-time notifications are currently unavailable. Trying to reconnect..."
            type="warning"
            showIcon
            className="mb-4"
            size="small"
          />
        )}

        {/* Notifications List */}
        <List
          loading={loading}
          dataSource={notifications}
          renderItem={renderNotificationItem}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No notifications yet"
              />
            )
          }}
          size="small"
        />

        {/* Notification Settings */}
        <Divider />
        <div className="text-center">
          <Button
            icon={<SettingOutlined />}
            type="link"
            onClick={() => {
              // Handle notification settings - could open a settings modal
              console.log('Open notification settings')
            }}
          >
            Notification Settings
          </Button>
        </div>
      </Drawer>
    </>
  )
}

export default ProductionNotificationSystem