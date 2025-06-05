import React, { useState, useEffect } from 'react'
import {
  Table,
  Input,
  Select,
  DatePicker,
  Button as AntButton,
  Tag,
  Space,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Dropdown,
  Menu,
  Avatar,
  Progress,
  Empty,
  Divider,
  Alert,
  Timeline,
  Steps,
  Modal,
  Form,
  InputNumber,
  Switch,
  Checkbox,
  List,
  Typography,
  Popover,
  Drawer
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  PlusOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  CalendarOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  TrendingUpOutlined,
  WarningOutlined,
  ToolOutlined,
  SafetyOutlined,
  ShoppingCartOutlined,
  BugOutlined,
  ThunderboltOutlined,
  SendOutlined,
  ImportOutlined,
  SettingOutlined,
  TeamOutlined,
  DashboardOutlined,
  TableOutlined,
  AppstoreOutlined,
  SyncOutlined,
  StopOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { mockApiResponses } from '../../Utils/mockProductionData'

const { Option } = Select
const { RangePicker } = DatePicker
const { Title, Text } = Typography

// 11-Step Production Process
const PRODUCTION_STEPS = [
  {
    id: 1,
    name: 'REQUESTED FROM INVENTORY',
    icon: <ImportOutlined />,
    color: '#722ed1'
  },
  { id: 2, name: 'PAINTING', icon: <ToolOutlined />, color: '#eb2f96' },
  { id: 3, name: 'MACHINING', icon: <SettingOutlined />, color: '#1890ff' },
  {
    id: 4,
    name: 'PVD POWDER COATING',
    icon: <ThunderboltOutlined />,
    color: '#52c41a'
  },
  { id: 5, name: 'PVD', icon: <FireOutlined />, color: '#fa8c16' },
  { id: 6, name: 'MILLING', icon: <ToolOutlined />, color: '#13c2c2' },
  { id: 7, name: 'ACRYLIC', icon: <ThunderboltOutlined />, color: '#faad14' },
  { id: 8, name: 'LACQUOR', icon: <ThunderboltOutlined />, color: '#f759ab' },
  { id: 9, name: 'PACKAGING', icon: <ExportOutlined />, color: '#722ed1' },
  { id: 10, name: 'QUALITY CHECK', icon: <SafetyOutlined />, color: '#52c41a' },
  {
    id: 11,
    name: 'DISPATCHED TO SALES',
    icon: <SendOutlined />,
    color: '#1890ff'
  }
]

const ProductionPlansList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState([])
  const [filteredPlans, setFilteredPlans] = useState([])
  const [jobCards, setJobCards] = useState([])
  const [inventoryRequests, setInventoryRequests] = useState([])
  const [rejections, setRejections] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: null,
    alloyId: null,
    urgentOnly: false,
    hasIssues: false,
    productionStep: 'all'
  })
  const [sortedInfo, setSortedInfo] = useState({})
  const [alloys, setAlloys] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    urgent: 0,
    withIssues: 0,
    materialPending: 0,
    qaRequired: 0
  })
  const [viewMode, setViewMode] = useState('table') // 'table', 'cards', 'timeline'
  const [selectedPlans, setSelectedPlans] = useState([])
  const [bulkActionModal, setBulkActionModal] = useState(false)
  const [productionOverview, setProductionOverview] = useState(false)

  useEffect(() => {
    fetchAllData()
    fetchAlloys()
  }, [])

  useEffect(() => {
    applyFilters()
    calculateStats()
  }, [filters, plans, jobCards, rejections, inventoryRequests])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchProductionPlans(),
        fetchJobCards(),
        fetchInventoryRequests(),
        fetchRejections()
      ])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const fetchProductionPlans = async () => {
    try {
      const response = await client.get('/v2/production/production-plans')
      if (response.data && response.data.result) {
        setPlans(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching production plans:', error)
      // Enhanced mock data with production tracking
      const mockPlans = [
        {
          id: 1,
          alloyId: 101,
          convertToAlloyId: 201,
          alloyName: 'Steel Alloy A - 17x8 ET35 5x112',
          convertName: 'Premium Steel Alloy B - 17x8 ET35 5x112 Gloss Black',
          quantity: 1000,
          inProductionQuantity: 750,
          completedQuantity: 200,
          rejectedQuantity: 50,
          urgent: true,
          note: 'High priority order for BMW dealership network',
          isCompleted: false,
          status: 'in-progress',
          createdBy: 'Production Manager',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T14:45:00Z',
          jobCardsCount: 3,
          activeJobCards: 2,
          completedJobCards: 1,
          pendingMaterials: 2,
          qualityIssues: 1,
          currentSteps: [3, 10, 1] // Steps where job cards are currently at
        },
        {
          id: 2,
          alloyId: 102,
          convertToAlloyId: 202,
          alloyName: 'Aluminum Alloy C - 18x8 ET45 5x114.3',
          convertName: 'Matte Black Aluminum Alloy D - 18x8 ET45 5x114.3',
          quantity: 500,
          inProductionQuantity: 500,
          completedQuantity: 0,
          rejectedQuantity: 0,
          urgent: false,
          note: 'Standard production run',
          isCompleted: false,
          status: 'in-progress',
          createdBy: 'Production Supervisor',
          createdAt: '2024-01-18T09:00:00Z',
          updatedAt: '2024-01-20T16:30:00Z',
          jobCardsCount: 2,
          activeJobCards: 2,
          completedJobCards: 0,
          pendingMaterials: 0,
          qualityIssues: 0,
          currentSteps: [5, 7] // Steps where job cards are currently at
        },
        {
          id: 3,
          alloyId: 103,
          convertToAlloyId: 203,
          alloyName: 'Carbon Fiber Alloy E - 19x9 ET35 5x120',
          convertName: 'Gloss Carbon Fiber Alloy F - 19x9 ET35 5x120',
          quantity: 200,
          inProductionQuantity: 0,
          completedQuantity: 200,
          rejectedQuantity: 0,
          urgent: false,
          note: 'Completed successfully',
          isCompleted: true,
          status: 'completed',
          createdBy: 'Production Manager',
          createdAt: '2024-01-10T08:00:00Z',
          updatedAt: '2024-01-17T17:00:00Z',
          jobCardsCount: 1,
          activeJobCards: 0,
          completedJobCards: 1,
          pendingMaterials: 0,
          qualityIssues: 0,
          currentSteps: [11] // Dispatched to sales
        }
      ]
      setPlans(mockPlans)
    }
  }

  const fetchJobCards = async () => {
    try {
      const response = await client.get('/v2/production/all-job-cards')
      if (response.data && response.data.result) {
        setJobCards(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching job cards:', error)
      // Mock job cards data
      setJobCards([
        {
          id: 1,
          prodPlanId: 1,
          prodStep: 3,
          status: 'in-progress',
          quantity: 500
        },
        {
          id: 2,
          prodPlanId: 1,
          prodStep: 10,
          status: 'qa-pending',
          quantity: 250
        },
        {
          id: 3,
          prodPlanId: 1,
          prodStep: 1,
          status: 'waiting-materials',
          quantity: 250
        },
        {
          id: 4,
          prodPlanId: 2,
          prodStep: 5,
          status: 'in-progress',
          quantity: 250
        },
        {
          id: 5,
          prodPlanId: 2,
          prodStep: 7,
          status: 'in-progress',
          quantity: 250
        },
        {
          id: 6,
          prodPlanId: 3,
          prodStep: 11,
          status: 'completed',
          quantity: 200
        }
      ])
    }
  }

  const fetchInventoryRequests = async () => {
    try {
      const response = await client.get('/v2/production/all-inventory-requests')
      if (response.data && response.data.result) {
        setInventoryRequests(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching inventory requests:', error)
      // Mock inventory requests
      setInventoryRequests([
        { id: 1, prodPlanId: 1, isFulfilled: false, status: 'pending' },
        { id: 2, prodPlanId: 1, isFulfilled: false, status: 'partial' },
        { id: 3, prodPlanId: 2, isFulfilled: true, status: 'fulfilled' },
        { id: 4, prodPlanId: 3, isFulfilled: true, status: 'fulfilled' }
      ])
    }
  }

  const fetchRejections = async () => {
    try {
      const response = await client.get('/v2/production/all-rejections')
      if (response.data && response.data.result) {
        setRejections(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching rejections:', error)
      // Mock rejections
      setRejections([
        { id: 1, prodPlanId: 1, isResolved: false, severity: 'medium' },
        { id: 2, prodPlanId: 1, isResolved: true, severity: 'low' }
      ])
    }
  }

  const fetchAlloys = async () => {
    try {
      const response = await client.get('/v2/production/alloys')
      if (response.data && response.data.result) {
        const formattedAlloys = response.data.result.map(alloy => ({
          value: alloy.id,
          label: alloy.name
        }))
        setAlloys(formattedAlloys)
      }
    } catch (error) {
      console.error('Error fetching alloys:', error)
      const mockAlloys = [
        { id: 101, name: 'Steel Alloy A - 17x8 ET35 5x112' },
        { id: 102, name: 'Aluminum Alloy C - 18x8 ET45 5x114.3' },
        { id: 103, name: 'Carbon Fiber Alloy E - 19x9 ET35 5x120' }
      ]
      const formattedAlloys = mockAlloys.map(alloy => ({
        value: alloy.id,
        label: alloy.name
      }))
      setAlloys(formattedAlloys)
    }
  }

  const calculateStats = () => {
    const total = filteredPlans.length
    const pending = filteredPlans.filter(p => p.status === 'pending').length
    const inProgress = filteredPlans.filter(
      p => p.status === 'in-progress'
    ).length
    const completed = filteredPlans.filter(p => p.status === 'completed').length
    const urgent = filteredPlans.filter(p => p.urgent).length

    // Enhanced production-specific stats
    const withIssues = filteredPlans.filter(p =>
      rejections.some(r => r.prodPlanId === p.id && !r.isResolved)
    ).length

    const materialPending = filteredPlans.filter(p =>
      inventoryRequests.some(r => r.prodPlanId === p.id && !r.isFulfilled)
    ).length

    const qaRequired = filteredPlans.filter(p =>
      jobCards.some(
        j =>
          j.prodPlanId === p.id &&
          j.prodStep === 10 &&
          j.status === 'qa-pending'
      )
    ).length

    setStats({
      total,
      pending,
      inProgress,
      completed,
      urgent,
      withIssues,
      materialPending,
      qaRequired
    })
  }

  const applyFilters = () => {
    let result = [...plans]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        plan =>
          (plan.alloyName &&
            plan.alloyName.toLowerCase().includes(searchLower)) ||
          (plan.convertName &&
            plan.convertName.toLowerCase().includes(searchLower)) ||
          plan.id.toString().includes(searchLower) ||
          (plan.note && plan.note.toLowerCase().includes(searchLower))
      )
    }

    if (filters.status !== 'all') {
      result = result.filter(plan => plan.status === filters.status)
    }

    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange
      result = result.filter(plan => {
        const planDate = new Date(plan.createdAt)
        return planDate >= start && planDate <= end
      })
    }

    if (filters.alloyId) {
      result = result.filter(
        plan =>
          plan.alloyId === filters.alloyId ||
          plan.convertToAlloyId === filters.alloyId
      )
    }

    if (filters.urgentOnly) {
      result = result.filter(plan => plan.urgent)
    }

    if (filters.hasIssues) {
      result = result.filter(plan =>
        rejections.some(r => r.prodPlanId === plan.id && !r.isResolved)
      )
    }

    if (filters.productionStep !== 'all') {
      const stepId = parseInt(filters.productionStep)
      result = result.filter(plan =>
        jobCards.some(j => j.prodPlanId === plan.id && j.prodStep === stepId)
      )
    }

    setFilteredPlans(result)
  }

  const handleChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateRange: null,
      alloyId: null,
      urgentOnly: false,
      hasIssues: false,
      productionStep: 'all'
    })
    setSortedInfo({})
  }

  const handleCreatePlan = () => {
    navigate('/production-plan/create')
  }

  const viewPlanDetails = planId => {
    navigate(`/production-plan/${planId}`)
  }

  const getStatusIcon = status => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'in-progress':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />
      case 'pending':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />
    }
  }

  const getStatusColor = status => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in-progress':
        return 'processing'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStepIcon = stepId => {
    const step = PRODUCTION_STEPS.find(s => s.id === stepId)
    return step ? step.icon : <ToolOutlined />
  }

  const getStepColor = stepId => {
    const step = PRODUCTION_STEPS.find(s => s.id === stepId)
    return step ? step.color : '#1890ff'
  }

  const getPlanIssues = planId => {
    const planRejections = rejections.filter(
      r => r.prodPlanId === planId && !r.isResolved
    )
    const planMaterialIssues = inventoryRequests.filter(
      r => r.prodPlanId === planId && !r.isFulfilled
    )
    const planQaRequired = jobCards.filter(
      j =>
        j.prodPlanId === planId &&
        j.prodStep === 10 &&
        j.status === 'qa-pending'
    )

    return {
      qualityIssues: planRejections.length,
      materialIssues: planMaterialIssues.length,
      qaRequired: planQaRequired.length
    }
  }

  const renderProductionProgress = plan => {
    const planJobCards = jobCards.filter(j => j.prodPlanId === plan.id)
    if (planJobCards.length === 0)
      return <Text type='secondary'>No job cards</Text>

    return (
      <div>
        <div style={{ marginBottom: 8 }}>
          <Text strong>{planJobCards.length} Job Cards</Text>
        </div>
        <Space wrap>
          {planJobCards.map(card => (
            <Tooltip
              key={card.id}
              title={`Job Card #${card.id} - Step ${card.prodStep}: ${
                PRODUCTION_STEPS.find(s => s.id === card.prodStep)?.name
              }`}
            >
              <Avatar
                size='small'
                style={{ backgroundColor: getStepColor(card.prodStep) }}
                icon={getStepIcon(card.prodStep)}
              />
            </Tooltip>
          ))}
        </Space>
        <div style={{ marginTop: 4 }}>
          <Progress
            percent={Math.round(
              (planJobCards.reduce((sum, card) => sum + card.prodStep / 11, 0) /
                planJobCards.length) *
                100
            )}
            size='small'
            showInfo={false}
          />
        </div>
      </div>
    )
  }

  const renderIssuesIndicator = plan => {
    const issues = getPlanIssues(plan.id)
    const totalIssues =
      issues.qualityIssues + issues.materialIssues + issues.qaRequired

    if (totalIssues === 0) {
      return (
        <Tag color='success' icon={<CheckCircleOutlined />}>
          No Issues
        </Tag>
      )
    }

    return (
      <Popover
        content={
          <div>
            {issues.qualityIssues > 0 && (
              <div>
                <BugOutlined style={{ color: '#ff4d4f' }} />{' '}
                {issues.qualityIssues} Quality Issues
              </div>
            )}
            {issues.materialIssues > 0 && (
              <div>
                <ShoppingCartOutlined style={{ color: '#faad14' }} />{' '}
                {issues.materialIssues} Material Pending
              </div>
            )}
            {issues.qaRequired > 0 && (
              <div>
                <SafetyOutlined style={{ color: '#1890ff' }} />{' '}
                {issues.qaRequired} QA Required
              </div>
            )}
          </div>
        }
        title='Production Issues'
      >
        <Tag color='error' icon={<WarningOutlined />}>
          {totalIssues} Issues
        </Tag>
      </Popover>
    )
  }

  const getActionMenu = record => (
    <Menu>
      <Menu.Item
        key='view'
        icon={<EyeOutlined />}
        onClick={() => viewPlanDetails(record.id)}
      >
        View Details
      </Menu.Item>
      <Menu.Item key='edit' icon={<EditOutlined />}>
        Edit Plan
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key='jobcards'
        icon={<ToolOutlined />}
        onClick={() => navigate(`/production-job-cards?planId=${record.id}`)}
      >
        Manage Job Cards
      </Menu.Item>
      <Menu.Item
        key='materials'
        icon={<ShoppingCartOutlined />}
        onClick={() => navigate(`/production-materials?planId=${record.id}`)}
      >
        Material Requests
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key='delete' icon={<DeleteOutlined />} danger>
        Delete Plan
      </Menu.Item>
    </Menu>
  )

  const columns = [
    {
      title: 'Plan',
      key: 'plan',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge count={record.id} style={{ backgroundColor: '#1890ff' }} />
            {record.urgent && <FireOutlined style={{ color: '#ff4d4f' }} />}
          </div>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {new Date(record.createdAt).toLocaleDateString()}
          </Text>
        </div>
      ),
      sorter: (a, b) => a.id - b.id,
      sortOrder: sortedInfo.columnKey === 'id' && sortedInfo.order
    },
    {
      title: 'Alloy Conversion',
      key: 'alloyDetails',
      width: 250,
      render: (_, record) => (
        <div>
          <div
            className='font-medium text-gray-900'
            style={{ fontSize: '14px' }}
          >
            {record.alloyName}
          </div>
          <div className='text-sm text-gray-500' style={{ fontSize: '12px' }}>
            → {record.convertName}
          </div>
        </div>
      ),
      sorter: (a, b) => a.alloyName.localeCompare(b.alloyName),
      sortOrder: sortedInfo.columnKey === 'alloyName' && sortedInfo.order
    },
    {
      title: 'Quantity & Progress',
      key: 'quantity',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text strong>{record.quantity?.toLocaleString()}</Text>
            <Text type='secondary'>units</Text>
          </div>
          <Progress
            percent={Math.round(
              ((record.completedQuantity || 0) / record.quantity) * 100
            )}
            size='small'
            strokeColor='#52c41a'
            showInfo={false}
          />
          <div style={{ fontSize: '11px', color: '#666', marginTop: 2 }}>
            {record.completedQuantity || 0} completed,{' '}
            {record.inProductionQuantity || 0} in progress
          </div>
        </div>
      ),
      sorter: (a, b) => a.quantity - b.quantity,
      sortOrder: sortedInfo.columnKey === 'quantity' && sortedInfo.order
    },
    {
      title: 'Production Status',
      key: 'production',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Tag
              color={getStatusColor(record.status)}
              icon={getStatusIcon(record.status)}
            >
              {record.status?.toUpperCase()}
            </Tag>
          </div>
          {renderProductionProgress(record)}
        </div>
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
      sortOrder: sortedInfo.columnKey === 'status' && sortedInfo.order
    },
    {
      title: 'Issues & Alerts',
      key: 'issues',
      width: 140,
      render: (_, record) => renderIssuesIndicator(record)
    },
    {
      title: 'Actions',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
          <AntButton type='text' icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ]

  const renderTimelineView = () => (
    <Timeline mode='left'>
      {filteredPlans.map(plan => (
        <Timeline.Item
          key={plan.id}
          label={new Date(plan.createdAt).toLocaleDateString()}
          color={plan.urgent ? 'red' : 'blue'}
          dot={plan.urgent ? <FireOutlined /> : <ToolOutlined />}
        >
          <Card size='small' hoverable onClick={() => viewPlanDetails(plan.id)}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start'
              }}
            >
              <div>
                <Text strong>Plan #{plan.id}</Text>
                {plan.urgent && (
                  <FireOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
                )}
                <br />
                <Text>{plan.alloyName}</Text>
                <br />
                <Text type='secondary'>→ {plan.convertName}</Text>
                <br />
                <Text strong>{plan.quantity} units</Text>
              </div>
              <div>
                {getStatusIcon(plan.status)}
                <br />
                {renderIssuesIndicator(plan)}
              </div>
            </div>
          </Card>
        </Timeline.Item>
      ))}
    </Timeline>
  )

  const renderCardView = () => (
    <Row gutter={[16, 16]}>
      {filteredPlans.map(plan => (
        <Col xs={24} sm={12} lg={8} xl={6} key={plan.id}>
          <Card
            hoverable
            className='h-full'
            actions={[
              <EyeOutlined
                key='view'
                onClick={() => viewPlanDetails(plan.id)}
              />,
              <ToolOutlined
                key='jobcards'
                onClick={() =>
                  navigate(`/production-job-cards?planId=${plan.id}`)
                }
              />,
              <MoreOutlined key='more' />
            ]}
          >
            <div className='flex justify-between items-start mb-3'>
              <Badge count={plan.id} style={{ backgroundColor: '#1890ff' }} />
              {plan.urgent && <FireOutlined className='text-red-500' />}
            </div>

            <div className='mb-3'>
              <div className='font-medium text-lg'>{plan.alloyName}</div>
              <div className='text-gray-500 text-sm'>→ {plan.convertName}</div>
            </div>

            <div className='mb-3'>
              <div className='text-2xl font-bold text-blue-600'>
                {plan.quantity?.toLocaleString()}
              </div>
              <div className='text-xs text-gray-500'>Units</div>
              <Progress
                percent={Math.round(
                  ((plan.completedQuantity || 0) / plan.quantity) * 100
                )}
                size='small'
                strokeColor='#52c41a'
              />
            </div>

            <div className='mb-3'>{renderProductionProgress(plan)}</div>

            <div className='flex justify-between items-center'>
              <Tag
                color={getStatusColor(plan.status)}
                icon={getStatusIcon(plan.status)}
              >
                {plan.status?.toUpperCase()}
              </Tag>
              {renderIssuesIndicator(plan)}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )

  return (
    <div className='w-full p-5 bg-background-grey min-h-screen'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Production Plans</h1>
          <p className='text-gray-600 mt-1'>
            Manage and track your complete production workflow with real-time
            monitoring
          </p>
        </div>
        <Space className='mt-4 md:mt-0'>
          <Button
            icon={<DashboardOutlined />}
            onClick={() => navigate('/production-dashboard')}
          >
            Dashboard
          </Button>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => setProductionOverview(true)}
          >
            Production Overview
          </Button>
          <Button icon={<ExportOutlined />}>Export</Button>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleCreatePlan}
          >
            Create Plan
          </Button>
        </Space>
      </div>

      {/* Enhanced Statistics Cards */}
      <Row gutter={[16, 16]} className='mb-6'>
        <Col xs={12} sm={6} md={3}>
          <Card className='text-center'>
            <Statistic
              title='Total Plans'
              value={stats.total}
              valueStyle={{ color: '#1890ff', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className='text-center'>
            <Statistic
              title='In Progress'
              value={stats.inProgress}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
              suffix={
                stats.total > 0 && (
                  <div className='mt-2'>
                    <Progress
                      percent={Math.round(
                        (stats.inProgress / stats.total) * 100
                      )}
                      size='small'
                      showInfo={false}
                    />
                  </div>
                )
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className='text-center'>
            <Statistic
              title='Completed'
              value={stats.completed}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
              suffix={
                stats.total > 0 && (
                  <div className='mt-2'>
                    <Progress
                      percent={Math.round(
                        (stats.completed / stats.total) * 100
                      )}
                      size='small'
                      showInfo={false}
                      strokeColor='#52c41a'
                    />
                  </div>
                )
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className='text-center'>
            <Statistic
              title='Urgent'
              value={stats.urgent}
              valueStyle={{ color: '#ff4d4f', fontSize: '20px' }}
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className='text-center'>
            <Statistic
              title='Quality Issues'
              value={stats.withIssues}
              valueStyle={{ color: '#ff4d4f', fontSize: '20px' }}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className='text-center'>
            <Statistic
              title='Material Pending'
              value={stats.materialPending}
              valueStyle={{ color: '#faad14', fontSize: '20px' }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className='text-center'>
            <Statistic
              title='QA Required'
              value={stats.qaRequired}
              valueStyle={{ color: '#1890ff', fontSize: '20px' }}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className='text-center'>
            <Statistic
              title='Job Cards'
              value={jobCards.length}
              valueStyle={{ color: '#722ed1', fontSize: '20px' }}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Critical Alerts */}
      {stats.withIssues > 0 && (
        <Alert
          message='Production Issues Detected'
          description={`${stats.withIssues} production plan(s) have unresolved quality issues that need immediate attention.`}
          type='error'
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <AntButton
              size='small'
              danger
              onClick={() => setFilters({ ...filters, hasIssues: true })}
            >
              View Issues
            </AntButton>
          }
        />
      )}

      {stats.materialPending > 0 && (
        <Alert
          message='Material Requests Pending'
          description={`${stats.materialPending} production plan(s) are waiting for material fulfillment.`}
          type='warning'
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <AntButton
              size='small'
              onClick={() => navigate('/production-materials')}
            >
              Manage Materials
            </AntButton>
          }
        />
      )}

      {stats.qaRequired > 0 && (
        <Alert
          message='Quality Inspection Required'
          description={`${stats.qaRequired} job card(s) are waiting for quality inspection at Step 10.`}
          type='info'
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <AntButton size='small' onClick={() => navigate('/production-qa')}>
              QA Dashboard
            </AntButton>
          }
        />
      )}

      {/* Enhanced Filters */}
      <Card className='mb-6 shadow-sm'>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-4'>
          <Input
            placeholder='Search plans, alloys, notes...'
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            className='w-full'
            placeholder='Filter by status'
            value={filters.status}
            onChange={value => setFilters({ ...filters, status: value })}
          >
            <Option value='all'>All Statuses</Option>
            <Option value='pending'>Pending</Option>
            <Option value='in-progress'>In Progress</Option>
            <Option value='completed'>Completed</Option>
          </Select>
          <Select
            className='w-full'
            placeholder='Filter by production step'
            value={filters.productionStep}
            onChange={value =>
              setFilters({ ...filters, productionStep: value })
            }
          >
            <Option value='all'>All Steps</Option>
            {PRODUCTION_STEPS.map(step => (
              <Option key={step.id} value={step.id.toString()}>
                Step {step.id}: {step.name}
              </Option>
            ))}
          </Select>
          <Select
            className='w-full'
            placeholder='Filter by alloy'
            value={filters.alloyId}
            onChange={value => setFilters({ ...filters, alloyId: value })}
            allowClear
          >
            {alloys.map(alloy => (
              <Option key={alloy.value} value={alloy.value}>
                {alloy.label}
              </Option>
            ))}
          </Select>
          <RangePicker
            className='w-full'
            onChange={dates => setFilters({ ...filters, dateRange: dates })}
            value={filters.dateRange}
            placeholder={['Start Date', 'End Date']}
          />
        </div>

        <div className='flex flex-col md:flex-row justify-between items-start md:items-center'>
          <div className='flex items-center space-x-4 mb-2 md:mb-0'>
            <Checkbox
              checked={filters.urgentOnly}
              onChange={e =>
                setFilters({ ...filters, urgentOnly: e.target.checked })
              }
            >
              <FireOutlined className='text-red-500 mr-1' />
              Urgent Only
            </Checkbox>
            <Checkbox
              checked={filters.hasIssues}
              onChange={e =>
                setFilters({ ...filters, hasIssues: e.target.checked })
              }
            >
              <BugOutlined className='text-red-500 mr-1' />
              With Issues
            </Checkbox>
          </div>

          <Space>
            <AntButton icon={<ReloadOutlined />} onClick={fetchAllData}>
              Refresh
            </AntButton>
            <AntButton icon={<FilterOutlined />} onClick={clearFilters}>
              Clear Filters
            </AntButton>
            <AntButton.Group>
              <AntButton
                type={viewMode === 'table' ? 'primary' : 'default'}
                icon={<TableOutlined />}
                onClick={() => setViewMode('table')}
              />
              <AntButton
                type={viewMode === 'cards' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('cards')}
              />
              <AntButton
                type={viewMode === 'timeline' ? 'primary' : 'default'}
                icon={<CalendarOutlined />}
                onClick={() => setViewMode('timeline')}
              />
            </AntButton.Group>
          </Space>
        </div>
      </Card>

      {/* Content */}
      <Card className='shadow-sm'>
        <div className='flex justify-between items-center mb-4'>
          <div className='text-lg font-medium'>
            {filteredPlans.length} Plans Found
          </div>
          {selectedPlans.length > 0 && (
            <Space>
              <Text>{selectedPlans.length} selected</Text>
              <AntButton
                type='primary'
                onClick={() => setBulkActionModal(true)}
              >
                Bulk Actions
              </AntButton>
            </Space>
          )}
        </div>

        {filteredPlans.length === 0 ? (
          <Empty
            description='No production plans found'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleCreatePlan}
            >
              Create Your First Plan
            </Button>
          </Empty>
        ) : (
          <>
            {viewMode === 'table' && (
              <Table
                columns={columns}
                dataSource={filteredPlans}
                rowKey='id'
                loading={loading}
                onChange={handleChange}
                rowSelection={{
                  selectedRowKeys: selectedPlans,
                  onChange: setSelectedPlans
                }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} plans`
                }}
                scroll={{ x: 1200 }}
              />
            )}
            {viewMode === 'cards' && renderCardView()}
            {viewMode === 'timeline' && renderTimelineView()}
          </>
        )}
      </Card>

      {/* Production Overview Drawer */}
      <Drawer
        title='Production Overview'
        placement='right'
        width={600}
        open={productionOverview}
        onClose={() => setProductionOverview(false)}
      >
        <div>
          <Title level={4}>11-Step Production Process</Title>
          <Steps direction='vertical' size='small'>
            {PRODUCTION_STEPS.map(step => {
              const cardsInStep = jobCards.filter(j => j.prodStep === step.id)
              return (
                <Steps.Step
                  key={step.id}
                  title={step.name}
                  icon={step.icon}
                  description={
                    <div>
                      <Text>Step {step.id}</Text>
                      <br />
                      <Badge
                        count={cardsInStep.length}
                        style={{ backgroundColor: step.color }}
                      />
                      <Text type='secondary'> job cards active</Text>
                    </div>
                  }
                />
              )
            })}
          </Steps>
        </div>
      </Drawer>
    </div>
  )
}

export default ProductionPlansList
