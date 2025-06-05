import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Button as AntButton,
  message,
  Badge,
  Tooltip,
  Spin,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Avatar,
  Dropdown,
  Menu,
  Switch,
  Empty,
  Divider,
  Typography,
  Alert,
  Timeline,
  Steps,
  Popover,
  Drawer,
  List,
  Checkbox,
  Modal
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  EyeOutlined,
  EditOutlined,
  MoreOutlined,
  AppstoreOutlined,
  BarsOutlined,
  FireOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ToolOutlined,
  ExportOutlined,
  PlusOutlined,
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined,
  BellOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  SyncOutlined,
  UserOutlined
} from '@ant-design/icons'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { mockApiResponses } from '../../Utils/mockProductionData'

const { Option } = Select
const { RangePicker } = DatePicker
const { Title, Text } = Typography
const { Step } = Steps

const JobCardsList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [jobCards, setJobCards] = useState([])
  const [filteredJobCards, setFilteredJobCards] = useState([])
  const [productionSteps, setProductionSteps] = useState([])
  const [productionPlans, setProductionPlans] = useState([])
  const [sortedInfo, setSortedInfo] = useState({})
  const [viewMode, setViewMode] = useState('table') // 'table' or 'cards'
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [planSelectionModal, setPlanSelectionModal] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    productionStep: 'all',
    dateRange: null,
    urgentOnly: false,
    qaStatus: 'all',
    assignedTo: 'all'
  })

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    pending: 0,
    urgent: 0,
    qaRequired: 0,
    rejected: 0,
    efficiency: 0
  })

  useEffect(() => {
    fetchJobCards()
    fetchProductionSteps()
    fetchProductionPlans()
  }, [])

  useEffect(() => {
    applyFilters()
    calculateDashboardStats()
  }, [filters, jobCards])

  const fetchJobCards = async () => {
    try {
      setLoading(true)
      const response = await client.get('/v2/production/job-cards')
      if (response.data && response.data.result) {
        setJobCards(response.data.result)
        setFilteredJobCards(response.data.result)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching job cards:', error)
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getJobCards()
      setJobCards(mockResponse.result)
      setFilteredJobCards(mockResponse.result)
      setLoading(false)
    }
  }

  const fetchProductionSteps = async () => {
    try {
      const response = await client.get('/v2/production/get-steps')
      if (response.data && response.data.result) {
        setProductionSteps(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching production steps:', error)
      const mockResponse = mockApiResponses.getProductionSteps()
      setProductionSteps(mockResponse.result)
    }
  }

  const fetchProductionPlans = async () => {
    try {
      const response = await client.get('/v2/production/production-plans')
      if (response.data && response.data.result) {
        // Filter plans that have available quantity for job cards
        const availablePlans = response.data.result.filter(
          plan =>
            plan.quantity - plan.inProductionQuantity > 0 && !plan.isCompleted
        )
        setProductionPlans(availablePlans)
      }
    } catch (error) {
      console.error('Error fetching production plans:', error)
      // Mock production plans data
      const mockPlans = [
        {
          id: 1001,
          alloyName: 'Premium Steel Alloy - 18x8 ET45 5x120',
          convertName: 'Gloss Black Premium Steel - 18x8 ET45 5x120',
          quantity: 1000,
          inProductionQuantity: 250,
          urgent: true,
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 1002,
          alloyName: 'Aluminum Alloy - 19x9 ET35 5x112',
          convertName: 'Matte Black Aluminum - 19x9 ET35 5x112',
          quantity: 500,
          inProductionQuantity: 100,
          urgent: false,
          createdAt: '2024-01-16T14:20:00Z'
        },
        {
          id: 1003,
          alloyName: 'Chrome Steel - 20x10 ET40 5x114.3',
          convertName: 'Polished Chrome - 20x10 ET40 5x114.3',
          quantity: 300,
          inProductionQuantity: 50,
          urgent: true,
          createdAt: '2024-01-17T09:15:00Z'
        }
      ]
      setProductionPlans(mockPlans)
    }
  }

  const calculateDashboardStats = () => {
    const stats = {
      total: filteredJobCards.length,
      inProgress: filteredJobCards.filter(card => card.status === 'in-progress')
        .length,
      completed: filteredJobCards.filter(card => card.status === 'completed')
        .length,
      pending: filteredJobCards.filter(card => card.status === 'pending')
        .length,
      urgent: filteredJobCards.filter(card => card.urgent).length,
      qaRequired: filteredJobCards.filter(card => card.prodStep === 10).length,
      rejected: filteredJobCards.filter(card => card.rejectedQuantity > 0)
        .length,
      efficiency:
        filteredJobCards.length > 0
          ? Math.round(
              (filteredJobCards.filter(card => card.status === 'completed')
                .length /
                filteredJobCards.length) *
                100
            )
          : 0
    }
    setDashboardStats(stats)
  }

  const applyFilters = () => {
    let result = [...jobCards]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        card =>
          (card.id && card.id.toString().includes(searchLower)) ||
          (card.planId && card.planId.toString().includes(searchLower)) ||
          (card.alloyName &&
            card.alloyName.toLowerCase().includes(searchLower)) ||
          (card.createdBy && card.createdBy.toLowerCase().includes(searchLower))
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(card => card.status === filters.status)
    }

    // Apply production step filter
    if (filters.productionStep !== 'all') {
      result = result.filter(
        card => card.prodStep === parseInt(filters.productionStep)
      )
    }

    // Apply QA status filter
    if (filters.qaStatus !== 'all') {
      if (filters.qaStatus === 'required') {
        result = result.filter(card => card.prodStep === 10)
      } else if (filters.qaStatus === 'passed') {
        result = result.filter(card => card.acceptedQuantity > 0)
      } else if (filters.qaStatus === 'rejected') {
        result = result.filter(card => card.rejectedQuantity > 0)
      }
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange
      result = result.filter(card => {
        const cardDate = new Date(card.createdAt)
        return cardDate >= start && cardDate <= end
      })
    }

    // Apply urgent only filter
    if (filters.urgentOnly) {
      result = result.filter(card => card.urgent)
    }

    setFilteredJobCards(result)
  }

  const handleChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      productionStep: 'all',
      dateRange: null,
      urgentOnly: false,
      qaStatus: 'all',
      assignedTo: 'all'
    })
    setSortedInfo({})
  }

  const getStatusTag = status => {
    if (!status) return <Tag color='default'>PENDING</Tag>

    const statusConfig = {
      completed: {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: 'COMPLETED'
      },
      'in-progress': {
        color: 'processing',
        icon: <SyncOutlined spin />,
        text: 'IN PROGRESS'
      },
      pending: {
        color: 'warning',
        icon: <ClockCircleOutlined />,
        text: 'PENDING'
      },
      'on-hold': {
        color: 'error',
        icon: <PauseCircleOutlined />,
        text: 'ON HOLD'
      },
      rejected: { color: 'error', icon: <StopOutlined />, text: 'REJECTED' }
    }

    const config = statusConfig[status] || {
      color: 'default',
      icon: null,
      text: status.toUpperCase()
    }

    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const getStepProgress = (currentStep, totalSteps = 11) => {
    return Math.round((currentStep / totalSteps) * 100)
  }

  const getStepName = stepId => {
    const step = productionSteps.find(s => s.id === stepId)
    return step ? step.name : `Step ${stepId}`
  }

  const getUrgencyIndicator = urgent => {
    if (urgent) {
      return (
        <Tooltip title='Urgent Priority'>
          <Badge count={<FireOutlined style={{ color: '#ff4d4f' }} />} />
        </Tooltip>
      )
    }
    return null
  }

  const getQAStatusIndicator = card => {
    if (card.prodStep === 10) {
      return (
        <Tooltip title='QA Required'>
          <Badge status='warning' text='QA Required' />
        </Tooltip>
      )
    }
    if (card.acceptedQuantity > 0) {
      return (
        <Tooltip title={`${card.acceptedQuantity} units accepted`}>
          <Badge status='success' text='QA Passed' />
        </Tooltip>
      )
    }
    if (card.rejectedQuantity > 0) {
      return (
        <Tooltip title={`${card.rejectedQuantity} units rejected`}>
          <Badge status='error' text='QA Failed' />
        </Tooltip>
      )
    }
    return null
  }

  const goToJobCardDetails = jobCardId => {
    navigate(`/production-job-card/${jobCardId}`)
  }

  const handleBulkAction = action => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select job cards first')
      return
    }

    switch (action) {
      case 'export':
        message.success(`Exporting ${selectedRowKeys.length} job cards`)
        break
      case 'update-step':
        message.info('Bulk step update feature coming soon')
        break
      case 'assign-qa':
        message.info('Bulk QA assignment feature coming soon')
        break
      default:
        break
    }
  }

  const bulkActionMenu = (
    <Menu onClick={({ key }) => handleBulkAction(key)}>
      <Menu.Item key='export' icon={<ExportOutlined />}>
        Export Selected
      </Menu.Item>
      <Menu.Item key='update-step' icon={<ToolOutlined />}>
        Update Production Step
      </Menu.Item>
      <Menu.Item key='assign-qa' icon={<UserOutlined />}>
        Assign QA Personnel
      </Menu.Item>
    </Menu>
  )

  const columns = [
    {
      title: 'Job Card',
      key: 'jobCard',
      width: 120,
      render: (_, record) => (
        <div className='flex items-center space-x-2'>
          <Avatar
            size='small'
            style={{ backgroundColor: record.urgent ? '#ff4d4f' : '#1890ff' }}
          >
            {record.id}
          </Avatar>
          {getUrgencyIndicator(record.urgent)}
        </div>
      ),
      sorter: (a, b) => a.id - b.id,
      sortOrder: sortedInfo.columnKey === 'jobCard' && sortedInfo.order
    },
    {
      title: 'Production Plan',
      key: 'plan',
      width: 140,
      render: (_, record) => (
        <div>
          <Text strong>#{record.prodPlanId}</Text>
          <br />
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {record.alloyName}
          </Text>
        </div>
      ),
      sorter: (a, b) => a.prodPlanId - b.prodPlanId,
      sortOrder: sortedInfo.columnKey === 'plan' && sortedInfo.order
    },
    {
      title: 'Quantity & Progress',
      key: 'quantity',
      width: 160,
      render: (_, record) => (
        <div>
          <div className='flex items-center justify-between mb-1'>
            <Text strong>{record.quantity} units</Text>
            <Text type='secondary'>{getStepProgress(record.prodStep)}%</Text>
          </div>
          <Progress
            percent={getStepProgress(record.prodStep)}
            size='small'
            status={record.status === 'completed' ? 'success' : 'active'}
            showInfo={false}
          />
          <Text type='secondary' style={{ fontSize: '11px' }}>
            Step {record.prodStep}/11
          </Text>
        </div>
      ),
      sorter: (a, b) => a.quantity - b.quantity,
      sortOrder: sortedInfo.columnKey === 'quantity' && sortedInfo.order
    },
    {
      title: 'Current Step',
      key: 'currentStep',
      width: 180,
      render: (_, record) => {
        const stepName = getStepName(record.prodStep)
        const stepColor =
          record.prodStep <= 3
            ? 'blue'
            : record.prodStep <= 6
            ? 'orange'
            : record.prodStep <= 9
            ? 'purple'
            : 'green'

        return (
          <div>
            <Tag color={stepColor} icon={<ToolOutlined />}>
              {stepName}
            </Tag>
            <br />
            <Text type='secondary' style={{ fontSize: '11px' }}>
              {record.stepStartTime &&
                `Started: ${new Date(
                  record.stepStartTime
                ).toLocaleDateString()}`}
            </Text>
          </div>
        )
      },
      sorter: (a, b) => a.prodStep - b.prodStep,
      sortOrder: sortedInfo.columnKey === 'currentStep' && sortedInfo.order
    },
    {
      title: 'Status & QA',
      key: 'statusQA',
      width: 140,
      render: (_, record) => (
        <div className='space-y-1'>
          {getStatusTag(record.status)}
          {getQAStatusIndicator(record)}
        </div>
      ),
      sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
      sortOrder: sortedInfo.columnKey === 'statusQA' && sortedInfo.order
    },
    {
      title: 'Timeline',
      key: 'timeline',
      width: 120,
      render: (_, record) => (
        <div>
          <div className='text-xs text-gray-500'>
            Created: {new Date(record.createdAt).toLocaleDateString()}
          </div>
          <div className='text-xs text-gray-500'>
            Updated: {new Date(record.updatedAt).toLocaleDateString()}
          </div>
          {record.estimatedCompletion && (
            <div className='text-xs text-blue-500'>
              ETA: {new Date(record.estimatedCompletion).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      sortOrder: sortedInfo.columnKey === 'timeline' && sortedInfo.order
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size='small'>
          <Tooltip title='View Details'>
            <AntButton
              type='primary'
              size='small'
              icon={<EyeOutlined />}
              onClick={() => goToJobCardDetails(record.id)}
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key='edit' icon={<EditOutlined />}>
                  Edit Job Card
                </Menu.Item>
                <Menu.Item key='assign' icon={<UserOutlined />}>
                  Assign Personnel
                </Menu.Item>
                <Menu.Item key='update-step' icon={<ToolOutlined />}>
                  Update Step
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key='history' icon={<ClockCircleOutlined />}>
                  View History
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <AntButton size='small' icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: record => ({
      disabled: record.status === 'completed'
    })
  }

  const renderDashboardStats = () => (
    <Row gutter={[16, 16]} className='mb-6'>
      <Col xs={24} sm={12} md={6} lg={4} xl={3}>
        <Card size='small' className='text-center'>
          <Statistic
            title='Total Job Cards'
            value={dashboardStats.total}
            prefix={<DashboardOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4} xl={3}>
        <Card size='small' className='text-center'>
          <Statistic
            title='In Progress'
            value={dashboardStats.inProgress}
            prefix={<SyncOutlined spin />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4} xl={3}>
        <Card size='small' className='text-center'>
          <Statistic
            title='Completed'
            value={dashboardStats.completed}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4} xl={3}>
        <Card size='small' className='text-center'>
          <Statistic
            title='Urgent'
            value={dashboardStats.urgent}
            prefix={<FireOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4} xl={3}>
        <Card size='small' className='text-center'>
          <Statistic
            title='QA Required'
            value={dashboardStats.qaRequired}
            prefix={<WarningOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4} xl={3}>
        <Card size='small' className='text-center'>
          <Statistic
            title='Rejected'
            value={dashboardStats.rejected}
            prefix={<StopOutlined />}
            valueStyle={{ color: '#f5222d' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4} xl={3}>
        <Card size='small' className='text-center'>
          <Statistic
            title='Efficiency'
            value={dashboardStats.efficiency}
            suffix='%'
            prefix={<TrophyOutlined />}
            valueStyle={{
              color:
                dashboardStats.efficiency >= 80
                  ? '#52c41a'
                  : dashboardStats.efficiency >= 60
                  ? '#faad14'
                  : '#ff4d4f'
            }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4} xl={3}>
        <Card size='small' className='text-center'>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleCreateJobCard}
            className='w-full'
          >
            New Job Card
          </Button>
        </Card>
      </Col>
    </Row>
  )

  const renderCardView = () => (
    <Row gutter={[16, 16]}>
      {filteredJobCards.map(card => (
        <Col xs={24} sm={12} md={8} lg={6} xl={4} key={card.id}>
          <Card
            size='small'
            className={`hover:shadow-lg transition-shadow cursor-pointer ${
              card.urgent ? 'border-red-400' : ''
            }`}
            onClick={() => goToJobCardDetails(card.id)}
            actions={[
              <EyeOutlined
                key='view'
                onClick={e => {
                  e.stopPropagation()
                  goToJobCardDetails(card.id)
                }}
              />,
              <EditOutlined key='edit' onClick={e => e.stopPropagation()} />,
              <MoreOutlined key='more' onClick={e => e.stopPropagation()} />
            ]}
          >
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Text strong>Job Card #{card.id}</Text>
                {getUrgencyIndicator(card.urgent)}
              </div>

              <div>
                <Text type='secondary'>Plan #{card.prodPlanId}</Text>
                <br />
                <Text style={{ fontSize: '12px' }}>{card.alloyName}</Text>
              </div>

              <div>
                <div className='flex items-center justify-between mb-1'>
                  <Text>{card.quantity} units</Text>
                  <Text type='secondary'>
                    {getStepProgress(card.prodStep)}%
                  </Text>
                </div>
                <Progress
                  percent={getStepProgress(card.prodStep)}
                  size='small'
                  status={card.status === 'completed' ? 'success' : 'active'}
                  showInfo={false}
                />
              </div>

              <div>
                <Tag color='blue' size='small'>
                  {getStepName(card.prodStep)}
                </Tag>
              </div>

              <div className='space-y-1'>
                {getStatusTag(card.status)}
                {getQAStatusIndicator(card)}
              </div>

              <div className='text-xs text-gray-500'>
                Updated: {new Date(card.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )

  const renderFilterDrawer = () => (
    <Drawer
      title='Advanced Filters'
      placement='right'
      onClose={() => setFilterDrawerVisible(false)}
      visible={filterDrawerVisible}
      width={400}
    >
      <div className='space-y-4'>
        <div>
          <Text strong>Search</Text>
          <Input
            placeholder='Search by ID, plan ID, alloy, or creator'
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className='mt-2'
          />
        </div>

        <div>
          <Text strong>Status</Text>
          <Select
            className='w-full mt-2'
            placeholder='Filter by status'
            value={filters.status}
            onChange={value => setFilters({ ...filters, status: value })}
          >
            <Option value='all'>All Statuses</Option>
            <Option value='pending'>Pending</Option>
            <Option value='in-progress'>In Progress</Option>
            <Option value='completed'>Completed</Option>
            <Option value='on-hold'>On Hold</Option>
            <Option value='rejected'>Rejected</Option>
          </Select>
        </div>

        <div>
          <Text strong>Production Step</Text>
          <Select
            className='w-full mt-2'
            placeholder='Filter by production step'
            value={filters.productionStep}
            onChange={value =>
              setFilters({ ...filters, productionStep: value })
            }
          >
            <Option value='all'>All Steps</Option>
            {productionSteps.map(step => (
              <Option key={step.id} value={step.id.toString()}>
                Step {step.id}: {step.name}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <Text strong>QA Status</Text>
          <Select
            className='w-full mt-2'
            placeholder='Filter by QA status'
            value={filters.qaStatus}
            onChange={value => setFilters({ ...filters, qaStatus: value })}
          >
            <Option value='all'>All QA Status</Option>
            <Option value='required'>QA Required</Option>
            <Option value='passed'>QA Passed</Option>
            <Option value='rejected'>QA Rejected</Option>
          </Select>
        </div>

        <div>
          <Text strong>Date Range</Text>
          <RangePicker
            className='w-full mt-2'
            onChange={dates => setFilters({ ...filters, dateRange: dates })}
            value={filters.dateRange}
          />
        </div>

        <div>
          <Checkbox
            checked={filters.urgentOnly}
            onChange={e =>
              setFilters({ ...filters, urgentOnly: e.target.checked })
            }
          >
            Show urgent only
          </Checkbox>
        </div>

        <Divider />

        <div className='flex space-x-2'>
          <AntButton
            type='primary'
            onClick={() => setFilterDrawerVisible(false)}
          >
            Apply Filters
          </AntButton>
          <AntButton onClick={clearFilters}>Clear All</AntButton>
        </div>
      </div>
    </Drawer>
  )

  const handleCreateJobCard = () => {
    if (productionPlans.length === 0) {
      Modal.confirm({
        title: 'No Production Plans Available',
        content:
          'You need to create a production plan first before creating job cards. Would you like to go to Production Plans?',
        okText: 'Go to Production Plans',
        cancelText: 'Cancel',
        onOk: () => navigate('/production-plans')
      })
    } else {
      setPlanSelectionModal(true)
    }
  }

  const handlePlanSelection = planId => {
    setPlanSelectionModal(false)
    navigate(`/production-job-card/create/${planId}`)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Spin size='large' tip='Loading job cards...' />
      </div>
    )
  }

  return (
    <div className='w-full p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <Title level={2} className='mb-0'>
            Production Job Cards
          </Title>
          <Text type='secondary'>
            Manage and track all production job cards
          </Text>
        </div>
        <div className='flex items-center space-x-2'>
          <Tooltip title='Refresh Data'>
            <AntButton icon={<ReloadOutlined />} onClick={fetchJobCards} />
          </Tooltip>
          <Tooltip title='Advanced Filters'>
            <AntButton
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerVisible(true)}
            />
          </Tooltip>
          <Tooltip title='Export Data'>
            <AntButton icon={<ExportOutlined />} />
          </Tooltip>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleCreateJobCard}
          >
            New Job Card
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      {renderDashboardStats()}

      {/* Quick Filters & Controls */}
      <Card className='mb-6'>
        <div className='flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center lg:justify-between'>
          <div className='flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center'>
            <Input
              placeholder='Quick search...'
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              style={{ width: 250 }}
            />

            <Select
              placeholder='Status'
              value={filters.status}
              onChange={value => setFilters({ ...filters, status: value })}
              style={{ width: 120 }}
            >
              <Option value='all'>All Status</Option>
              <Option value='pending'>Pending</Option>
              <Option value='in-progress'>In Progress</Option>
              <Option value='completed'>Completed</Option>
            </Select>

            <Select
              placeholder='Step'
              value={filters.productionStep}
              onChange={value =>
                setFilters({ ...filters, productionStep: value })
              }
              style={{ width: 150 }}
            >
              <Option value='all'>All Steps</Option>
              {productionSteps.slice(0, 5).map(step => (
                <Option key={step.id} value={step.id.toString()}>
                  {step.name}
                </Option>
              ))}
            </Select>

            <Switch
              checkedChildren='Urgent Only'
              unCheckedChildren='All'
              checked={filters.urgentOnly}
              onChange={checked =>
                setFilters({ ...filters, urgentOnly: checked })
              }
            />
          </div>

          <div className='flex items-center space-x-2'>
            {selectedRowKeys.length > 0 && (
              <Dropdown overlay={bulkActionMenu} trigger={['click']}>
                <AntButton>
                  Bulk Actions ({selectedRowKeys.length}) <MoreOutlined />
                </AntButton>
              </Dropdown>
            )}

            <div className='flex items-center space-x-1 bg-gray-100 rounded p-1'>
              <Tooltip title='Table View'>
                <AntButton
                  size='small'
                  type={viewMode === 'table' ? 'primary' : 'text'}
                  icon={<BarsOutlined />}
                  onClick={() => setViewMode('table')}
                />
              </Tooltip>
              <Tooltip title='Card View'>
                <AntButton
                  size='small'
                  type={viewMode === 'cards' ? 'primary' : 'text'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('cards')}
                />
              </Tooltip>
            </div>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {dashboardStats.urgent > 0 && (
        <Alert
          message={`${dashboardStats.urgent} urgent job cards require immediate attention`}
          type='warning'
          showIcon
          icon={<FireOutlined />}
          className='mb-4'
          action={
            <AntButton
              size='small'
              onClick={() => setFilters({ ...filters, urgentOnly: true })}
            >
              View Urgent
            </AntButton>
          }
        />
      )}

      {dashboardStats.qaRequired > 0 && (
        <Alert
          message={`${dashboardStats.qaRequired} job cards are waiting for quality assurance`}
          type='info'
          showIcon
          icon={<BellOutlined />}
          className='mb-4'
          action={
            <AntButton
              size='small'
              onClick={() => setFilters({ ...filters, qaStatus: 'required' })}
            >
              View QA Queue
            </AntButton>
          }
        />
      )}

      {/* Main Content */}
      <Card className='shadow-sm'>
        {filteredJobCards.length === 0 ? (
          <Empty
            description='No job cards found'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type='primary' onClick={handleCreateJobCard}>
              Create First Job Card
            </Button>
          </Empty>
        ) : viewMode === 'table' ? (
          <Table
            columns={columns}
            dataSource={filteredJobCards}
            rowKey='id'
            loading={loading}
            onChange={handleChange}
            rowSelection={rowSelection}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} job cards`
            }}
            scroll={{ x: 1200 }}
            size='small'
          />
        ) : (
          renderCardView()
        )}
      </Card>

      {/* Filter Drawer */}
      {renderFilterDrawer()}

      {/* Production Plan Selection Modal */}
      <Modal
        title='Select Production Plan'
        visible={planSelectionModal}
        onCancel={() => setPlanSelectionModal(false)}
        footer={null}
        width={800}
      >
        <div className='mb-4'>
          <Text type='secondary'>
            Choose a production plan to create a job card for:
          </Text>
        </div>

        <List
          dataSource={productionPlans}
          renderItem={plan => (
            <List.Item
              className='hover:bg-gray-50 cursor-pointer rounded p-3'
              onClick={() => handlePlanSelection(plan.id)}
              actions={[
                <AntButton
                  type='primary'
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    handlePlanSelection(plan.id)
                  }}
                >
                  Create Job Card
                </AntButton>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      backgroundColor: plan.urgent ? '#ff4d4f' : '#1890ff'
                    }}
                    icon={plan.urgent ? <FireOutlined /> : <ToolOutlined />}
                  />
                }
                title={
                  <div className='flex items-center space-x-2'>
                    <Text strong>Plan #{plan.id}</Text>
                    {plan.urgent && (
                      <Tag color='red' size='small'>
                        URGENT
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div className='space-y-1'>
                    <div>
                      <Text strong>From:</Text> {plan.alloyName}
                    </div>
                    <div>
                      <Text strong>To:</Text> {plan.convertName}
                    </div>
                    <div className='flex items-center space-x-4'>
                      <span>
                        <Text strong>Available:</Text>{' '}
                        {plan.quantity - plan.inProductionQuantity} units
                      </span>
                      <span>
                        <Text strong>Total:</Text> {plan.quantity} units
                      </span>
                    </div>
                    <div>
                      <Text type='secondary'>
                        Created: {new Date(plan.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />

        {productionPlans.length === 0 && (
          <Empty
            description='No production plans available'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <AntButton
              type='primary'
              onClick={() => {
                setPlanSelectionModal(false)
                navigate('/production-plans')
              }}
            >
              Create Production Plan
            </AntButton>
          </Empty>
        )}
      </Modal>
    </div>
  )
}

export default JobCardsList
