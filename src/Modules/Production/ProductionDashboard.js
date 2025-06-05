import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button as AntButton,
  Divider,
  Timeline,
  Alert,
  Badge,
  Tabs,
  Steps,
  List,
  Avatar,
  Tooltip,
  Typography,
  Spin,
  Empty,
  Modal,
  Drawer,
  Select,
  DatePicker,
  notification
} from 'antd'
import {
  PlusOutlined,
  RiseOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  BarChartOutlined,
  ToolOutlined,
  SafetyOutlined,
  DashboardOutlined,
  TeamOutlined,
  BellOutlined,
  SyncOutlined,
  StopOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  TrophyOutlined,
  AlertOutlined,
  UserOutlined,
  CalendarOutlined,
  SettingOutlined
} from '@ant-design/icons'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { useSelector } from 'react-redux'

const { TabPane } = Tabs
const { Step } = Steps
const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const ProductionDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [realTimeLoading, setRealTimeLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [stepAnalysisVisible, setStepAnalysisVisible] = useState(false)
  const [materialRequestsVisible, setMaterialRequestsVisible] = useState(false)
  const [apiStatus, setApiStatus] = useState({
    metrics: 'loading',
    jobCards: 'loading',
    urgentPlans: 'loading',
    steps: 'loading',
    rejections: 'loading',
    qa: 'loading',
    materialRequests: 'loading',
    stepAnalytics: 'loading',
    realTime: 'loading',
    capacity: 'loading'
  })
  const [dashboardData, setDashboardData] = useState({
    metrics: {},
    recentJobCards: [],
    urgentPlans: [],
    productionSteps: [],
    rejections: [],
    qaMetrics: {},
    materialRequests: [],
    stepAnalytics: {},
    realTimeStatus: {},
    capacityMetrics: {}
  })
  const { user } = useSelector(state => state.userDetails)

  useEffect(() => {
    fetchDashboardData()
    // Set up real-time updates
    const interval = setInterval(fetchRealTimeData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Show notification when APIs are connected or have errors
  useEffect(() => {
    const successCount = Object.values(apiStatus).filter(
      status => status === 'success'
    ).length
    const errorCount = Object.values(apiStatus).filter(
      status => status === 'error'
    ).length
    const totalApis = Object.keys(apiStatus).length

    if (successCount === totalApis && !loading) {
      notification.success({
        message: 'Dashboard Connected',
        description: 'All production APIs are connected and working properly.',
        duration: 3,
        placement: 'topRight'
      })
    } else if (errorCount > 0 && !loading) {
      notification.warning({
        message: 'API Connection Issues',
        description: `${errorCount} out of ${totalApis} APIs are using fallback data. Some features may show mock data.`,
        duration: 5,
        placement: 'topRight'
      })
    }
  }, [apiStatus, loading])

  // Function to get overall API health status
  const getApiHealthStatus = () => {
    const statuses = Object.values(apiStatus)
    const successCount = statuses.filter(status => status === 'success').length
    const errorCount = statuses.filter(status => status === 'error').length
    const totalCount = statuses.length

    if (successCount === totalCount)
      return { status: 'healthy', color: 'success', text: 'All APIs Connected' }
    if (errorCount === totalCount)
      return { status: 'error', color: 'error', text: 'All APIs Offline' }
    return {
      status: 'partial',
      color: 'warning',
      text: `${successCount}/${totalCount} APIs Connected`
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Get date range for metrics (last 30 days by default)
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      console.log('🚀 Starting dashboard API calls...')
      console.log('📅 Date range:', { startDate, endDate })

      // Initialize with mock data
      let dashboardResults = {
        metrics: getMockMetrics(),
        recentJobCards: getMockJobCards(),
        urgentPlans: getMockUrgentPlans(),
        productionSteps: getMockSteps(),
        rejections: getMockRejections(),
        qaMetrics: getMockQAMetrics(),
        materialRequests: getMockMaterialRequests(),
        stepAnalytics: getMockStepAnalytics(),
        realTimeStatus: getMockRealTimeStatus(),
        capacityMetrics: getMockCapacityMetrics()
      }

      // API call helper function
      const makeApiCall = async (endpoint, fallbackData, statusKey) => {
        try {
          console.log(`📡 Calling ${statusKey}: ${endpoint}`)
          const response = await client.get(endpoint)

          if (response.data && response.data.success) {
            console.log(`✅ ${statusKey} API call successful`)
            setApiStatus(prev => ({ ...prev, [statusKey]: 'success' }))
            return response.data.result
          } else {
            console.warn(`⚠️ ${statusKey} API returned unsuccessful response`)
            setApiStatus(prev => ({ ...prev, [statusKey]: 'error' }))
            return fallbackData
          }
        } catch (error) {
          console.warn(`❌ ${statusKey} API call failed:`, error.message)
          setApiStatus(prev => ({ ...prev, [statusKey]: 'error' }))
          return fallbackData
        }
      }

      // Make API calls sequentially to avoid overwhelming the server
      console.log('📡 Making API calls...')

      // 1. Dashboard Metrics
      dashboardResults.metrics = await makeApiCall(
        `/dashboard/metrics?startDate=${startDate}&endDate=${endDate}`,
        getMockMetrics(),
        'metrics'
      )

      // 2. Recent Job Cards
      dashboardResults.recentJobCards = await makeApiCall(
        '/dashboard/job-cards/recent?limit=10',
        getMockJobCards(),
        'jobCards'
      )

      // 3. Urgent Plans
      dashboardResults.urgentPlans = await makeApiCall(
        '/dashboard/production-plans/urgent?limit=20&status=active',
        getMockUrgentPlans(),
        'urgentPlans'
      )

      // 4. Production Steps (existing endpoint)
      dashboardResults.productionSteps = await makeApiCall(
        '/production/get-steps',
        getMockSteps(),
        'steps'
      )

      // 5. Recent Rejections
      dashboardResults.rejections = await makeApiCall(
        '/dashboard/rejections/recent?limit=10&resolved=false',
        getMockRejections(),
        'rejections'
      )

      // 6. QA Metrics
      dashboardResults.qaMetrics = await makeApiCall(
        `/dashboard/qa/metrics?startDate=${startDate}&endDate=${endDate}`,
        getMockQAMetrics(),
        'qa'
      )

      // 7. Material Requests
      dashboardResults.materialRequests = await makeApiCall(
        '/dashboard/material-requests/status?limit=20',
        getMockMaterialRequests(),
        'materialRequests'
      )

      // 8. Step Analytics
      dashboardResults.stepAnalytics = await makeApiCall(
        `/dashboard/analytics/step-performance?startDate=${startDate}&endDate=${endDate}`,
        getMockStepAnalytics(),
        'stepAnalytics'
      )

      // 9. Real-time Status
      dashboardResults.realTimeStatus = await makeApiCall(
        '/dashboard/real-time/status',
        getMockRealTimeStatus(),
        'realTime'
      )

      // 10. Capacity Metrics
      dashboardResults.capacityMetrics = await makeApiCall(
        '/dashboard/capacity/metrics?period=weekly',
        getMockCapacityMetrics(),
        'capacity'
      )

      // Enhance production steps with analytics if we have real data
      if (
        dashboardResults.stepAnalytics &&
        dashboardResults.stepAnalytics.stepCompletion
      ) {
        dashboardResults.productionSteps = dashboardResults.productionSteps.map(
          step => {
            const analytics =
              dashboardResults.stepAnalytics.stepCompletion.find(
                sc => sc.stepId === step.id
              )
            return {
              ...step,
              activeJobs: analytics?.inProgress || step.activeJobs || 0,
              avgTime: analytics?.avgTime || step.avgTime || 0,
              efficiency:
                calculateStepEfficiency(analytics) || step.efficiency || 95
            }
          }
        )
      }

      // Set the final dashboard data
      setDashboardData(dashboardResults)

      // Log summary
      const apiStatusValues = Object.values(apiStatus)
      const successCount = apiStatusValues.filter(
        status => status === 'success'
      ).length
      const errorCount = apiStatusValues.filter(
        status => status === 'error'
      ).length

      console.log('📊 API Call Summary:', {
        total: 10,
        successful: successCount,
        failed: errorCount,
        apiStatus
      })

      setLoading(false)
    } catch (error) {
      console.error('❌ Critical error in fetchDashboardData:', error)

      // Set all API statuses to error
      setApiStatus({
        metrics: 'error',
        jobCards: 'error',
        urgentPlans: 'error',
        steps: 'error',
        rejections: 'error',
        qa: 'error',
        materialRequests: 'error',
        stepAnalytics: 'error',
        realTime: 'error',
        capacity: 'error'
      })

      // Use mock data as fallback
      setDashboardData({
        metrics: getMockMetrics(),
        recentJobCards: getMockJobCards(),
        urgentPlans: getMockUrgentPlans(),
        productionSteps: getMockSteps(),
        rejections: getMockRejections(),
        qaMetrics: getMockQAMetrics(),
        materialRequests: getMockMaterialRequests(),
        stepAnalytics: getMockStepAnalytics(),
        realTimeStatus: getMockRealTimeStatus(),
        capacityMetrics: getMockCapacityMetrics()
      })
      setLoading(false)
    }
  }

  const fetchRealTimeData = async () => {
    try {
      setRealTimeLoading(true)
      const response = await client.get('/dashboard/real-time/status')
      if (response.data && response.data.success && response.data.result) {
        setDashboardData(prev => ({
          ...prev,
          realTimeStatus: response.data.result
        }))
        setApiStatus(prev => ({ ...prev, realTime: 'success' }))
      } else {
        setApiStatus(prev => ({ ...prev, realTime: 'error' }))
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error)
      setApiStatus(prev => ({ ...prev, realTime: 'error' }))
    } finally {
      setRealTimeLoading(false)
    }
  }

  // Function to refresh specific dashboard sections
  const refreshDashboardSection = async section => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      let response
      switch (section) {
        case 'metrics':
          response = await client.get(
            `/dashboard/metrics?startDate=${startDate}&endDate=${endDate}`
          )
          if (response.data?.success) {
            setDashboardData(prev => ({
              ...prev,
              metrics: response.data.result
            }))
            setApiStatus(prev => ({ ...prev, metrics: 'success' }))
          }
          break
        case 'jobCards':
          response = await client.get('/dashboard/job-cards/recent?limit=10')
          if (response.data?.success) {
            setDashboardData(prev => ({
              ...prev,
              recentJobCards: response.data.result
            }))
            setApiStatus(prev => ({ ...prev, jobCards: 'success' }))
          }
          break
        case 'urgentPlans':
          response = await client.get(
            '/dashboard/production-plans/urgent?limit=20&status=active'
          )
          if (response.data?.success) {
            setDashboardData(prev => ({
              ...prev,
              urgentPlans: response.data.result
            }))
            setApiStatus(prev => ({ ...prev, urgentPlans: 'success' }))
          }
          break
        case 'materialRequests':
          response = await client.get(
            '/dashboard/material-requests/status?limit=20'
          )
          if (response.data?.success) {
            setDashboardData(prev => ({
              ...prev,
              materialRequests: response.data.result
            }))
            setApiStatus(prev => ({ ...prev, materialRequests: 'success' }))
          }
          break
        case 'qa':
          response = await client.get(
            `/dashboard/qa/metrics?startDate=${startDate}&endDate=${endDate}`
          )
          if (response.data?.success) {
            setDashboardData(prev => ({
              ...prev,
              qaMetrics: response.data.result
            }))
            setApiStatus(prev => ({ ...prev, qa: 'success' }))
          }
          break
        default:
          console.warn('Unknown section:', section)
      }
    } catch (error) {
      console.error(`Error refreshing ${section}:`, error)
      setApiStatus(prev => ({ ...prev, [section]: 'error' }))
    }
  }

  // Helper function to calculate step efficiency
  const calculateStepEfficiency = analytics => {
    if (!analytics || !analytics.completed) return 95
    const total = analytics.completed + analytics.inProgress
    if (total === 0) return 95
    return Math.round((analytics.completed / total) * 100)
  }

  // Job Card Table Columns
  const jobCardColumns = [
    {
      title: 'Job Card ID',
      dataIndex: 'id',
      key: 'id',
      render: id => <Text strong>#{id}</Text>
    },
    {
      title: 'Alloy',
      dataIndex: 'alloyName',
      key: 'alloyName',
      render: name => (
        <Text ellipsis style={{ maxWidth: 200 }} title={name}>
          {name}
        </Text>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: quantity => <Text>{quantity}</Text>
    },
    {
      title: 'Current Step',
      key: 'currentStep',
      render: (_, record) => (
        <div>
          <Text strong>Step {record.prodStep}</Text>
          <br />
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {record.stepName}
          </Text>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => getStatusTag(status)
    },
    {
      title: 'Priority',
      dataIndex: 'urgent',
      key: 'urgent',
      render: urgent =>
        urgent ? (
          <Tag color='red' icon={<FireOutlined />}>
            URGENT
          </Tag>
        ) : (
          <Tag color='default'>NORMAL</Tag>
        )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size='small'>
          <AntButton
            size='small'
            type='link'
            onClick={() => navigate(`/production-job-card/${record.id}`)}
          >
            View
          </AntButton>
        </Space>
      )
    }
  ]

  // Enhanced Mock Data with 11-Step Process
  const getMockMetrics = () => ({
    totalPlans: 45,
    activePlans: 12,
    completedPlans: 28,
    totalJobCards: 67,
    activeJobCards: 23,
    completedJobCards: 38,
    totalProduced: 15420,
    totalAccepted: 14890,
    totalRejected: 530,
    rejectionRate: 3.4,
    completionRate: 87.2,
    avgProductionTime: 4.2,
    materialUtilization: 94.8,
    capacityUtilization: 78.5,
    onTimeDelivery: 92.3
  })

  const getMockSteps = () => [
    {
      id: 1,
      name: 'REQUESTED FROM INVENTORY',
      description: 'Material collection from warehouse',
      activeJobs: 5,
      avgTime: 0.5,
      efficiency: 98
    },
    {
      id: 2,
      name: 'PAINTING',
      description: 'Base paint application',
      activeJobs: 8,
      avgTime: 2.1,
      efficiency: 95
    },
    {
      id: 3,
      name: 'MACHINING',
      description: 'Precision machining and shaping',
      activeJobs: 12,
      avgTime: 4.5,
      efficiency: 92
    },
    {
      id: 4,
      name: 'PVD POWDER COATING',
      description: 'Physical Vapor Deposition powder coating',
      activeJobs: 6,
      avgTime: 3.2,
      efficiency: 89
    },
    {
      id: 5,
      name: 'PVD',
      description: 'Physical Vapor Deposition process',
      activeJobs: 4,
      avgTime: 2.8,
      efficiency: 91
    },
    {
      id: 6,
      name: 'MILLING',
      description: 'Precision milling operations',
      activeJobs: 7,
      avgTime: 3.5,
      efficiency: 94
    },
    {
      id: 7,
      name: 'ACRYLIC',
      description: 'Acrylic coating application',
      activeJobs: 3,
      avgTime: 1.8,
      efficiency: 96
    },
    {
      id: 8,
      name: 'LACQUOR',
      description: 'Lacquer finishing',
      activeJobs: 5,
      avgTime: 2.2,
      efficiency: 93
    },
    {
      id: 9,
      name: 'PACKAGING',
      description: 'Final packaging for shipment',
      activeJobs: 9,
      avgTime: 1.2,
      efficiency: 97
    },
    {
      id: 10,
      name: 'QUALITY CHECK',
      description: 'Final quality inspection',
      activeJobs: 11,
      avgTime: 1.5,
      efficiency: 88
    },
    {
      id: 11,
      name: 'DISPATCHED TO SALES',
      description: 'Ready for customer delivery',
      activeJobs: 2,
      avgTime: 0.3,
      efficiency: 99
    }
  ]

  const getMockMaterialRequests = () => [
    {
      id: 1,
      prodPlanId: 1001,
      alloyName: 'Premium Steel Alloy - 18x8 ET45 5x120',
      requestedQuantity: 1000,
      sentQuantity: 950,
      isFulfilled: false,
      status: 'partial',
      createdAt: '2024-01-15T10:30:00Z',
      estimatedFulfillment: '2024-01-16T14:00:00Z'
    },
    {
      id: 2,
      prodPlanId: 1002,
      alloyName: 'Aluminum Alloy - 19x9 ET35 5x112',
      requestedQuantity: 500,
      sentQuantity: 500,
      isFulfilled: true,
      status: 'fulfilled',
      createdAt: '2024-01-15T08:20:00Z',
      fulfilledAt: '2024-01-15T12:30:00Z'
    },
    {
      id: 3,
      prodPlanId: 1003,
      alloyName: 'Chrome Steel - 20x10 ET40 5x114.3',
      requestedQuantity: 300,
      sentQuantity: 0,
      isFulfilled: false,
      status: 'pending',
      createdAt: '2024-01-16T09:45:00Z',
      estimatedFulfillment: '2024-01-17T16:00:00Z'
    }
  ]

  const getMockStepAnalytics = () => ({
    bottlenecks: [
      {
        stepId: 10,
        stepName: 'QUALITY CHECK',
        avgWaitTime: 4.2,
        efficiency: 88
      },
      {
        stepId: 4,
        stepName: 'PVD POWDER COATING',
        avgWaitTime: 3.8,
        efficiency: 89
      },
      { stepId: 3, stepName: 'MACHINING', avgWaitTime: 2.1, efficiency: 92 }
    ],
    throughput: {
      daily: 145,
      weekly: 987,
      monthly: 4234
    },
    stepCompletion: [
      { stepId: 1, completed: 234, inProgress: 5, avgTime: 0.5 },
      { stepId: 2, completed: 229, inProgress: 8, avgTime: 2.1 },
      { stepId: 3, completed: 221, inProgress: 12, avgTime: 4.5 },
      { stepId: 4, completed: 209, inProgress: 6, avgTime: 3.2 },
      { stepId: 5, completed: 203, inProgress: 4, avgTime: 2.8 },
      { stepId: 6, completed: 199, inProgress: 7, avgTime: 3.5 },
      { stepId: 7, completed: 192, inProgress: 3, avgTime: 1.8 },
      { stepId: 8, completed: 189, inProgress: 5, avgTime: 2.2 },
      { stepId: 9, completed: 184, inProgress: 9, avgTime: 1.2 },
      { stepId: 10, completed: 175, inProgress: 11, avgTime: 1.5 },
      { stepId: 11, completed: 164, inProgress: 2, avgTime: 0.3 }
    ]
  })

  const getMockRealTimeStatus = () => ({
    activeStations: 28,
    totalStations: 32,
    currentShift: 'Day Shift',
    shiftProgress: 65,
    alertsCount: 3,
    criticalIssues: 1,
    lastUpdated: new Date().toISOString()
  })

  const getMockCapacityMetrics = () => ({
    currentCapacity: 78.5,
    plannedCapacity: 85.0,
    maxCapacity: 100.0,
    utilizationTrend: [72, 75, 78, 82, 79, 78, 81],
    bottleneckSteps: [3, 4, 10],
    recommendedActions: [
      'Add additional QA personnel for Step 10',
      'Optimize PVD coating schedule',
      'Consider parallel machining setup'
    ]
  })

  const getMockJobCards = () => [
    {
      id: 1001,
      prodPlanId: 5,
      alloyName: 'Premium Steel Alloy - 18x8 ET45 5x120',
      quantity: 100,
      prodStep: 3,
      stepName: 'MACHINING',
      status: 'in-progress',
      urgent: true,
      createdAt: '2024-01-15T10:30:00Z',
      estimatedCompletion: '2024-01-18T16:00:00Z',
      qaId: null,
      acceptedQuantity: 0,
      rejectedQuantity: 0
    },
    {
      id: 1002,
      prodPlanId: 8,
      alloyName: 'Aluminum Alloy - 19x9 ET35 5x112',
      quantity: 250,
      prodStep: 10,
      stepName: 'QUALITY CHECK',
      status: 'qa-required',
      urgent: false,
      createdAt: '2024-01-15T09:15:00Z',
      estimatedCompletion: '2024-01-17T14:00:00Z',
      qaId: 15,
      acceptedQuantity: 0,
      rejectedQuantity: 0
    },
    {
      id: 1003,
      prodPlanId: 12,
      alloyName: 'Chrome Steel - 20x10 ET40 5x114.3',
      quantity: 75,
      prodStep: 11,
      stepName: 'DISPATCHED TO SALES',
      status: 'completed',
      urgent: false,
      createdAt: '2024-01-14T14:20:00Z',
      completedAt: '2024-01-16T11:30:00Z',
      qaId: 12,
      acceptedQuantity: 73,
      rejectedQuantity: 2
    }
  ]

  const getMockUrgentPlans = () => [
    {
      id: 5,
      alloyName: 'Premium Steel Alloy - 18x8 ET45 5x120',
      convertName: 'Gloss Black Premium Steel - 18x8 ET45 5x120',
      quantity: 100,
      inProductionQuantity: 100,
      urgent: true,
      createdAt: '2024-01-15T08:00:00Z',
      estimatedCompletion: '2024-01-18T16:00:00Z'
    }
  ]

  const getMockRejections = () => [
    {
      id: 1,
      prodJobCardId: 1001,
      prodPlanId: 5,
      rejectedQuantity: 5,
      rejectionReason: 'Surface defects in PVD coating',
      stepId: 5,
      stepName: 'PVD',
      isResolved: false,
      createdAt: '2024-01-15T14:30:00Z',
      qaPersonnel: 'John Smith'
    },
    {
      id: 2,
      prodJobCardId: 1002,
      prodPlanId: 8,
      rejectedQuantity: 3,
      rejectionReason: 'Dimensional tolerance exceeded',
      stepId: 3,
      stepName: 'MACHINING',
      isResolved: true,
      createdAt: '2024-01-14T11:20:00Z',
      resolvedAt: '2024-01-15T09:45:00Z',
      qaPersonnel: 'Sarah Johnson'
    }
  ]

  const getMockQAMetrics = () => ({
    totalInspected: 1250,
    totalAccepted: 1195,
    totalRejected: 55,
    acceptanceRate: 95.6,
    avgInspectionTime: 2.1,
    qaPersonnelActive: 8,
    qaPersonnelTotal: 12,
    topRejectionReasons: [
      { reason: 'Surface defects', count: 25, stepId: 5 },
      { reason: 'Dimensional issues', count: 18, stepId: 3 },
      { reason: 'Material composition', count: 12, stepId: 2 }
    ],
    qaBottlenecks: [
      {
        stepId: 10,
        stepName: 'QUALITY CHECK',
        waitingJobs: 11,
        avgWaitTime: 4.2
      }
    ]
  })

  const getStatusTag = status => {
    const statusConfig = {
      completed: { color: 'success', icon: <CheckCircleOutlined /> },
      'in-progress': { color: 'processing', icon: <SyncOutlined spin /> },
      'qa-required': { color: 'warning', icon: <SafetyOutlined /> },
      pending: { color: 'default', icon: <ClockCircleOutlined /> },
      'on-hold': { color: 'error', icon: <PauseCircleOutlined /> },
      rejected: { color: 'error', icon: <StopOutlined /> }
    }

    const config = statusConfig[status] || statusConfig['pending']
    return (
      <Tag color={config.color} icon={config.icon}>
        {status?.toUpperCase().replace('-', ' ')}
      </Tag>
    )
  }

  const getMaterialRequestStatusTag = status => {
    const statusConfig = {
      fulfilled: { color: 'success', icon: <CheckCircleOutlined /> },
      partial: { color: 'warning', icon: <ExclamationCircleOutlined /> },
      pending: { color: 'default', icon: <ClockCircleOutlined /> },
      delayed: { color: 'error', icon: <WarningOutlined /> }
    }

    const config = statusConfig[status] || statusConfig['pending']
    return (
      <Tag color={config.color} icon={config.icon}>
        {status?.toUpperCase()}
      </Tag>
    )
  }

  const getStepEfficiencyColor = efficiency => {
    if (efficiency >= 95) return '#52c41a'
    if (efficiency >= 90) return '#faad14'
    return '#ff4d4f'
  }

  const renderRealTimeStatus = () => (
    <Card className='mb-6'>
      <div className='flex items-center justify-between mb-4'>
        <Title level={4} className='mb-0'>
          Real-Time Production Status
        </Title>
        <div className='flex items-center space-x-2'>
          {apiStatus.realTime === 'success' && (
            <>
              <Badge status='processing' />
              <Text type='secondary'>
                Last updated:{' '}
                {new Date(
                  dashboardData.realTimeStatus.lastUpdated || Date.now()
                ).toLocaleTimeString()}
              </Text>
            </>
          )}
          {apiStatus.realTime === 'error' && (
            <Tag color='error' icon={<ExclamationCircleOutlined />}>
              API Error - Using Mock Data
            </Tag>
          )}
          <AntButton
            size='small'
            icon={<ReloadOutlined />}
            loading={realTimeLoading}
            onClick={fetchRealTimeData}
            title='Refresh real-time data'
          />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Statistic
            title='Active Stations'
            value={dashboardData.realTimeStatus.activeStations || 0}
            suffix={`/ ${dashboardData.realTimeStatus.totalStations || 32}`}
            prefix={<PlayCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={24} sm={6}>
          <Statistic
            title='Current Shift'
            value={dashboardData.realTimeStatus.currentShift || 'Day Shift'}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
          <Progress
            percent={dashboardData.realTimeStatus.shiftProgress || 0}
            size='small'
            showInfo={false}
            className='mt-2'
          />
        </Col>
        <Col xs={24} sm={6}>
          <Statistic
            title='Active Alerts'
            value={dashboardData.realTimeStatus.alertsCount || 0}
            prefix={<BellOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col xs={24} sm={6}>
          <Statistic
            title='Critical Issues'
            value={dashboardData.realTimeStatus.criticalIssues || 0}
            prefix={<AlertOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
      </Row>
    </Card>
  )

  const render11StepProcess = () => (
    <Card
      title='11-Step Production Process'
      className='mb-6'
      extra={
        <AntButton
          icon={<EyeOutlined />}
          onClick={() => setStepAnalysisVisible(true)}
        >
          Detailed Analysis
        </AntButton>
      }
    >
      <Steps
        direction='vertical'
        size='small'
        current={-1}
        className='production-steps'
      >
        {dashboardData.productionSteps.map((step, index) => (
          <Step
            key={step.id}
            title={
              <div className='flex items-center justify-between'>
                <span>{step.name}</span>
                <div className='flex items-center space-x-2'>
                  <Badge
                    count={step.activeJobs}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                  <Tag color={getStepEfficiencyColor(step.efficiency)}>
                    {step.efficiency}%
                  </Tag>
                </div>
              </div>
            }
            description={
              <div>
                <Text type='secondary'>{step.description}</Text>
                <div className='mt-1 text-xs text-gray-500'>
                  Avg Time: {step.avgTime}h | Active Jobs: {step.activeJobs}
                </div>
              </div>
            }
            icon={
              <Avatar
                size='small'
                style={{
                  backgroundColor: getStepEfficiencyColor(step.efficiency),
                  color: 'white'
                }}
              >
                {step.id}
              </Avatar>
            }
          />
        ))}
      </Steps>
    </Card>
  )

  const renderMaterialRequestsStatus = () => {
    const pendingRequests = dashboardData.materialRequests.filter(
      req => !req.isFulfilled
    )

    return (
      <Card
        title='Material Requests Status'
        className='mb-6'
        extra={
          <AntButton
            icon={<EyeOutlined />}
            onClick={() => setMaterialRequestsVisible(true)}
          >
            View All
          </AntButton>
        }
      >
        {pendingRequests.length > 0 ? (
          <List
            dataSource={pendingRequests.slice(0, 3)}
            renderItem={request => (
              <List.Item
                actions={[
                  getMaterialRequestStatusTag(request.status),
                  <AntButton
                    size='small'
                    type='link'
                    onClick={() =>
                      navigate(`/inventory-requests/${request.id}`)
                    }
                  >
                    View
                  </AntButton>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{
                        backgroundColor:
                          request.status === 'pending' ? '#ff4d4f' : '#faad14'
                      }}
                      icon={<ToolOutlined />}
                    />
                  }
                  title={`Plan #${request.prodPlanId}`}
                  description={
                    <div>
                      <div>{request.alloyName}</div>
                      <div className='text-xs text-gray-500'>
                        Requested: {request.requestedQuantity} | Sent:{' '}
                        {request.sentQuantity} | Pending:{' '}
                        {request.requestedQuantity - request.sentQuantity}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description='All material requests fulfilled' />
        )}
      </Card>
    )
  }

  const renderQABottlenecks = () => (
    <Card title='QA Bottlenecks & Alerts' className='mb-6'>
      {dashboardData.qaMetrics.qaBottlenecks?.length > 0 ? (
        <List
          dataSource={dashboardData.qaMetrics.qaBottlenecks}
          renderItem={bottleneck => (
            <List.Item
              actions={[
                <AntButton
                  size='small'
                  type='primary'
                  onClick={() =>
                    navigate(
                      `/production-qa-reporting?step=${bottleneck.stepId}`
                    )
                  }
                >
                  Resolve
                </AntButton>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{ backgroundColor: '#ff4d4f' }}
                    icon={<WarningOutlined />}
                  />
                }
                title={`${bottleneck.stepName} - QA Bottleneck`}
                description={
                  <div>
                    <div>{bottleneck.waitingJobs} jobs waiting for QA</div>
                    <div className='text-xs text-gray-500'>
                      Average wait time: {bottleneck.avgWaitTime} hours
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description='No QA bottlenecks detected' />
      )}
    </Card>
  )

  const renderOverviewTab = () => (
    <div>
      {/* Real-time Status */}
      {renderRealTimeStatus()}

      {/* Key Metrics */}
      <Row gutter={[16, 16]} className='mb-6'>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Active Production Plans'
              value={dashboardData.metrics.activePlans}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Active Job Cards'
              value={dashboardData.metrics.activeJobCards}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Capacity Utilization'
              value={dashboardData.capacityMetrics.currentCapacity}
              suffix='%'
              prefix={<DashboardOutlined />}
              valueStyle={{
                color:
                  dashboardData.capacityMetrics.currentCapacity > 80
                    ? '#52c41a'
                    : '#faad14'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='On-Time Delivery'
              value={dashboardData.metrics.onTimeDelivery}
              suffix='%'
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {dashboardData.urgentPlans.length > 0 && (
        <Alert
          message={`${dashboardData.urgentPlans.length} urgent production plan(s) require immediate attention`}
          type='warning'
          icon={<FireOutlined />}
          action={
            <AntButton
              size='small'
              onClick={() => navigate('/production-plans')}
            >
              View Plans
            </AntButton>
          }
          className='mb-6'
          showIcon
        />
      )}

      {dashboardData.materialRequests.filter(r => !r.isFulfilled).length >
        0 && (
        <Alert
          message={`${
            dashboardData.materialRequests.filter(r => !r.isFulfilled).length
          } material request(s) pending fulfillment`}
          type='info'
          icon={<BellOutlined />}
          action={
            <AntButton
              size='small'
              onClick={() => setMaterialRequestsVisible(true)}
            >
              View Requests
            </AntButton>
          }
          className='mb-6'
          showIcon
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* Recent Job Cards */}
          <Card
            title={
              <div className='flex items-center justify-between'>
                <span>Recent Job Cards</span>
                <div className='flex items-center space-x-2'>
                  {apiStatus.jobCards === 'error' && (
                    <Tag color='orange' size='small'>
                      Mock Data
                    </Tag>
                  )}
                  <AntButton
                    size='small'
                    icon={<ReloadOutlined />}
                    onClick={() => refreshDashboardSection('jobCards')}
                    title='Refresh job cards data'
                  />
                </div>
              </div>
            }
            className='mb-6'
          >
            <Table
              columns={jobCardColumns}
              dataSource={dashboardData.recentJobCards}
              rowKey='id'
              loading={loading}
              pagination={false}
              size='small'
            />
            <div className='mt-4 text-center'>
              <AntButton
                type='link'
                onClick={() => navigate('/production-job-cards')}
              >
                View All Job Cards
              </AntButton>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          {/* QA Bottlenecks */}
          {renderQABottlenecks()}

          {/* Material Requests */}
          {renderMaterialRequestsStatus()}
        </Col>
      </Row>
    </div>
  )

  const renderProductionFlowTab = () => (
    <div>
      {render11StepProcess()}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title='Step Performance Analytics'>
            <List
              dataSource={dashboardData.stepAnalytics.bottlenecks}
              renderItem={bottleneck => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: '#ff4d4f' }}
                        icon={<WarningOutlined />}
                      />
                    }
                    title={`${bottleneck.stepName} - Bottleneck`}
                    description={
                      <div>
                        <div>
                          Average wait time: {bottleneck.avgWaitTime} hours
                        </div>
                        <div>Efficiency: {bottleneck.efficiency}%</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title='Throughput Metrics'>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title='Daily'
                  value={dashboardData.stepAnalytics.throughput?.daily}
                  suffix='units'
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title='Weekly'
                  value={dashboardData.stepAnalytics.throughput?.weekly}
                  suffix='units'
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title='Monthly'
                  value={dashboardData.stepAnalytics.throughput?.monthly}
                  suffix='units'
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )

  const renderQATab = () => (
    <div>
      {/* QA Metrics */}
      <Row gutter={[16, 16]} className='mb-6'>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='QA Acceptance Rate'
              value={dashboardData.qaMetrics.acceptanceRate}
              suffix='%'
              prefix={<CheckCircleOutlined />}
              valueStyle={{
                color:
                  dashboardData.qaMetrics.acceptanceRate > 95
                    ? '#52c41a'
                    : '#faad14'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Active QA Personnel'
              value={dashboardData.qaMetrics.qaPersonnelActive}
              suffix={`/ ${dashboardData.qaMetrics.qaPersonnelTotal}`}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Avg Inspection Time'
              value={dashboardData.qaMetrics.avgInspectionTime}
              suffix='hrs'
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Total Rejected'
              value={dashboardData.qaMetrics.totalRejected}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title='Top Rejection Reasons'>
            <List
              dataSource={dashboardData.qaMetrics.topRejectionReasons}
              renderItem={reason => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: '#ff4d4f' }}
                        icon={<ExclamationCircleOutlined />}
                      />
                    }
                    title={reason.reason}
                    description={
                      <div>
                        <div>Count: {reason.count}</div>
                        <div className='text-xs text-gray-500'>
                          Step {reason.stepId}:{' '}
                          {
                            dashboardData.productionSteps.find(
                              s => s.id === reason.stepId
                            )?.name
                          }
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title='Recent Rejections'>
            <List
              dataSource={dashboardData.rejections.slice(0, 5)}
              renderItem={rejection => (
                <List.Item
                  actions={[
                    rejection.isResolved ? (
                      <Tag color='success'>Resolved</Tag>
                    ) : (
                      <AntButton
                        size='small'
                        type='primary'
                        onClick={() =>
                          navigate(`/production-rejections/${rejection.id}`)
                        }
                      >
                        Resolve
                      </AntButton>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: rejection.isResolved
                            ? '#52c41a'
                            : '#ff4d4f'
                        }}
                        icon={
                          rejection.isResolved ? (
                            <CheckCircleOutlined />
                          ) : (
                            <ExclamationCircleOutlined />
                          )
                        }
                      />
                    }
                    title={`Job Card #${rejection.prodJobCardId}`}
                    description={
                      <div>
                        <div>{rejection.rejectionReason}</div>
                        <div className='text-xs text-gray-500'>
                          Step: {rejection.stepName} | QA:{' '}
                          {rejection.qaPersonnel}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )

  const renderAnalyticsTab = () => (
    <div>
      {/* Capacity Metrics */}
      <Row gutter={[16, 16]} className='mb-6'>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Current Capacity'
              value={dashboardData.capacityMetrics.currentCapacity}
              suffix='%'
              prefix={<DashboardOutlined />}
              valueStyle={{
                color:
                  dashboardData.capacityMetrics.currentCapacity > 80
                    ? '#52c41a'
                    : '#faad14'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Planned Capacity'
              value={dashboardData.capacityMetrics.plannedCapacity}
              suffix='%'
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Material Utilization'
              value={dashboardData.metrics.materialUtilization}
              suffix='%'
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Rejection Rate'
              value={dashboardData.metrics.rejectionRate}
              suffix='%'
              prefix={<WarningOutlined />}
              valueStyle={{
                color:
                  dashboardData.metrics.rejectionRate > 5
                    ? '#ff4d4f'
                    : '#52c41a'
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title='Capacity Utilization Trend'>
            <div className='mb-4'>
              <Text type='secondary'>
                7-day capacity utilization trend showing production efficiency
              </Text>
            </div>
            {/* Placeholder for chart - would integrate with actual charting library */}
            <div className='h-64 bg-gray-50 rounded flex items-center justify-center'>
              <Text type='secondary'>Capacity Utilization Chart</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title='Recommended Actions'>
            <List
              dataSource={dashboardData.capacityMetrics.recommendedActions}
              renderItem={(action, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: '#1890ff' }}
                        icon={<SettingOutlined />}
                      />
                    }
                    title={`Action ${index + 1}`}
                    description={action}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )

  return (
    <div className='w-full p-5 bg-background-grey'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <Title level={2} className='mb-0'>
            Production Dashboard
          </Title>
          <div className='flex items-center space-x-3'>
            <Text type='secondary'>
              Comprehensive production monitoring and control center
            </Text>
            {!loading && (
              <Tag
                color={getApiHealthStatus().color}
                icon={
                  getApiHealthStatus().status === 'healthy' ? (
                    <CheckCircleOutlined />
                  ) : getApiHealthStatus().status === 'error' ? (
                    <ExclamationCircleOutlined />
                  ) : (
                    <WarningOutlined />
                  )
                }
              >
                {getApiHealthStatus().text}
              </Tag>
            )}
          </div>
        </div>
        <Space>
          <AntButton
            icon={<ReloadOutlined />}
            onClick={fetchDashboardData}
            loading={loading}
            title='Refresh all dashboard data'
          >
            Refresh
          </AntButton>
          <Button
            icon={<PlusOutlined />}
            onClick={() => navigate('/production-plan/create')}
          >
            New Production Plan
          </Button>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => navigate('/production-workflow')}
          >
            View Workflow
          </Button>
        </Space>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className='dashboard-tabs'
      >
        <TabPane tab='Overview' key='overview'>
          {renderOverviewTab()}
        </TabPane>
        <TabPane tab='Production Flow' key='flow'>
          {renderProductionFlowTab()}
        </TabPane>
        <TabPane tab='Quality Assurance' key='qa'>
          {renderQATab()}
        </TabPane>
        <TabPane tab='Analytics' key='analytics'>
          {renderAnalyticsTab()}
        </TabPane>
      </Tabs>

      {/* Step Analysis Modal */}
      <Modal
        title='Detailed Step Analysis'
        visible={stepAnalysisVisible}
        onCancel={() => setStepAnalysisVisible(false)}
        footer={null}
        width={1000}
      >
        <Table
          dataSource={dashboardData.stepAnalytics.stepCompletion}
          columns={[
            {
              title: 'Step',
              key: 'step',
              render: (_, record) => {
                const step = dashboardData.productionSteps.find(
                  s => s.id === record.stepId
                )
                return (
                  <div>
                    <Text strong>Step {record.stepId}</Text>
                    <br />
                    <Text type='secondary'>{step?.name}</Text>
                  </div>
                )
              }
            },
            {
              title: 'Completed',
              dataIndex: 'completed',
              key: 'completed',
              render: value => <Text style={{ color: '#52c41a' }}>{value}</Text>
            },
            {
              title: 'In Progress',
              dataIndex: 'inProgress',
              key: 'inProgress',
              render: value => <Text style={{ color: '#1890ff' }}>{value}</Text>
            },
            {
              title: 'Avg Time (hrs)',
              dataIndex: 'avgTime',
              key: 'avgTime',
              render: value => <Text>{value}</Text>
            },
            {
              title: 'Efficiency',
              key: 'efficiency',
              render: (_, record) => {
                const step = dashboardData.productionSteps.find(
                  s => s.id === record.stepId
                )
                return (
                  <Tag color={getStepEfficiencyColor(step?.efficiency || 0)}>
                    {step?.efficiency || 0}%
                  </Tag>
                )
              }
            }
          ]}
          rowKey='stepId'
          pagination={false}
          size='small'
        />
      </Modal>

      {/* Material Requests Modal */}
      <Drawer
        title='Material Requests Status'
        placement='right'
        onClose={() => setMaterialRequestsVisible(false)}
        visible={materialRequestsVisible}
        width={600}
      >
        <List
          dataSource={dashboardData.materialRequests}
          renderItem={request => (
            <List.Item
              actions={[
                getMaterialRequestStatusTag(request.status),
                <AntButton
                  size='small'
                  type='link'
                  onClick={() => navigate(`/inventory-requests/${request.id}`)}
                >
                  View Details
                </AntButton>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      backgroundColor: request.isFulfilled
                        ? '#52c41a'
                        : '#ff4d4f'
                    }}
                    icon={<ToolOutlined />}
                  />
                }
                title={`Plan #${request.prodPlanId}`}
                description={
                  <div>
                    <div>{request.alloyName}</div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Requested: {request.requestedQuantity} | Sent:{' '}
                      {request.sentQuantity} | Pending:{' '}
                      {request.requestedQuantity - request.sentQuantity}
                    </div>
                    <div className='text-xs text-gray-500'>
                      Created:{' '}
                      {new Date(request.createdAt).toLocaleDateString()}
                      {request.estimatedFulfillment && (
                        <span>
                          {' '}
                          | ETA:{' '}
                          {new Date(
                            request.estimatedFulfillment
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  )
}

export default ProductionDashboard
