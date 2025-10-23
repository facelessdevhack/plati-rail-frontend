import { useState, useEffect, useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { message } from 'antd'

// Mock WebSocket implementation - replace with actual WebSocket when available
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.listeners = {}
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback({ data }))
    }
  }

  send(data) {
    // Mock sending data
    console.log('WebSocket send:', data)
  }

  connect() {
    // Mock connection
    setTimeout(() => {
      this.connected = true
      this.emit('open', { connected: true })

      // Simulate receiving some data
      this.simulateDataUpdates()
    }, 1000)
  }

  disconnect() {
    this.connected = false
    this.emit('close', { code: 1000, reason: 'Normal closure' })
  }

  simulateDataUpdates() {
    if (!this.connected) return

    // Simulate production plan updates
    setInterval(() => {
      if (this.connected) {
        const updates = [
          { type: 'PLAN_CREATED', data: { id: Math.floor(Math.random() * 1000) } },
          { type: 'JOB_CARD_CREATED', data: { jobCardId: Math.floor(Math.random() * 1000) } },
          { type: 'STEP_COMPLETED', data: { planId: Math.floor(Math.random() * 1000) } }
        ]

        const randomUpdate = updates[Math.floor(Math.random() * updates.length)]
        this.emit('message', { data: JSON.stringify(randomUpdate) })
      }
    }, 10000) // Update every 10 seconds
  }
}

export const useRealTimeProduction = () => {
  const dispatch = useDispatch()
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [realtimeStats, setRealtimeStats] = useState({
    activePlans: 0,
    jobCardsInProgress: 0,
    recentActivity: []
  })

  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const listenersRef = useRef({})

  // WebSocket connection
  const connect = useCallback(() => {
    try {
      // Replace with actual WebSocket URL when available
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/production'
      wsRef.current = new MockWebSocket(wsUrl)

      wsRef.current.addEventListener('open', () => {
        console.log('WebSocket connected')
        setConnected(true)
        setConnectionStatus('connected')
        message.success('Real-time updates connected')

        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      })

      wsRef.current.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data)
          handleRealtimeUpdate(data)
          setLastUpdate(new Date())
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      })

      wsRef.current.addEventListener('close', (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setConnected(false)
        setConnectionStatus('disconnected')

        // Attempt to reconnect
        if (event.code !== 1000) { // Not a normal closure
          scheduleReconnect()
        }
      })

      wsRef.current.addEventListener('error', (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        message.error('Real-time connection error')
      })

      wsRef.current.connect()
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }, [])

  // Reconnection logic
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionStatus('reconnecting')
      message.info('Attempting to reconnect...')
      connect()
    }, 3000) // Wait 3 seconds before reconnecting
  }, [connect])

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((data) => {
    console.log('Real-time update received:', data)

    // Update stats
    setRealtimeStats(prev => {
      const newStats = { ...prev }

      switch (data.type) {
        case 'PLAN_CREATED':
          newStats.activePlans = prev.activePlans + 1
          newStats.recentActivity = [
            { type: 'PLAN_CREATED', message: 'New production plan created', timestamp: new Date() },
            ...prev.recentActivity.slice(0, 9) // Keep last 10 activities
          ]
          break
        case 'JOB_CARD_CREATED':
          newStats.jobCardsInProgress = prev.jobCardsInProgress + 1
          newStats.recentActivity = [
            { type: 'JOB_CARD_CREATED', message: 'New job card created', timestamp: new Date() },
            ...prev.recentActivity.slice(0, 9)
          ]
          break
        case 'STEP_COMPLETED':
          newStats.recentActivity = [
            { type: 'STEP_COMPLETED', message: 'Production step completed', timestamp: new Date() },
            ...prev.recentActivity.slice(0, 9)
          ]
          break
        case 'PLAN_COMPLETED':
          newStats.activePlans = Math.max(0, prev.activePlans - 1)
          newStats.recentActivity = [
            { type: 'PLAN_COMPLETED', message: 'Production plan completed', timestamp: new Date() },
            ...prev.recentActivity.slice(0, 9)
          ]
          break
      }

      return newStats
    })

    // Trigger update notifications
    if (listenersRef.current[data.type]) {
      listenersRef.current[data.type].forEach(callback => {
        callback(data)
      })
    }
  }, [])

  // Send data to WebSocket
  const send = useCallback((data) => {
    if (wsRef.current && connected) {
      try {
        wsRef.current.send(JSON.stringify(data))
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
      }
    }
  }, [connected])

  // Subscribe to specific update types
  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current[eventType]) {
      listenersRef.current[eventType] = []
    }
    listenersRef.current[eventType].push(callback)

    // Return unsubscribe function
    return () => {
      listenersRef.current[eventType] = listenersRef.current[eventType].filter(cb => cb !== callback)
    }
  }, [])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.disconnect()
      wsRef.current = null
    }

    setConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  // Manual refresh trigger
  const triggerRefresh = useCallback(() => {
    send({ type: 'TRIGGER_REFRESH', timestamp: Date.now() })
  }, [send])

  // Connection status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#52c41a'
      case 'reconnecting': return '#faad14'
      case 'error': return '#ff4d4f'
      default: return '#d9d9d9'
    }
  }

  // Connection status text
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected'
      case 'reconnecting': return 'Reconnecting...'
      case 'error': return 'Connection Error'
      default: return 'Disconnected'
    }
  }

  // Connect on mount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    // Connection state
    connected,
    connectionStatus,
    getStatusColor,
    getStatusText,
    lastUpdate,

    // Data
    realtimeStats,

    // Actions
    connect,
    disconnect,
    send,
    subscribe,
    triggerRefresh,

    // Manual reconnect
    reconnect: () => {
      disconnect()
      setTimeout(connect, 1000)
    }
  }
}

export default useRealTimeProduction