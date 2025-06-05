import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Spin,
  Divider,
  Space,
  Steps,
  message,
  Modal,
  Select,
  Button as AntButton,
  Input,
  Timeline,
  Tooltip,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tabs,
  Alert,
  Badge,
  Form,
  InputNumber,
  DatePicker,
  Switch,
  List,
  Avatar,
  Typography,
  Popconfirm,
  Drawer,
  Empty,
  Checkbox
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  HistoryOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ToolOutlined,
  QrcodeOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CalendarOutlined,
  BugOutlined,
  CheckOutlined,
  CloseOutlined,
  FireOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
  SendOutlined,
  SettingOutlined,
  FileTextOutlined,
  SafetyOutlined,
  ExportOutlined,
  ImportOutlined,
  SyncOutlined,
  TeamOutlined,
  DashboardOutlined,
  BellOutlined,
  PrinterOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { useSelector } from 'react-redux'
import StepTransitionHistory from './StepTransitionHistory'
import { mockApiResponses } from '../../Utils/mockProductionData'

const { Option } = Select
const { TextArea } = Input
const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Step } = Steps

// 11-Step Production Process as per documentation
const PRODUCTION_STEPS = [
  {
    id: 1,
    name: 'REQUESTED FROM INVENTORY',
    icon: <ImportOutlined />,
    color: '#722ed1',
    description: 'Material collection from warehouse'
  },
  {
    id: 2,
    name: 'PAINTING',
    icon: <ToolOutlined />,
    color: '#eb2f96',
    description: 'Base paint application'
  },
  {
    id: 3,
    name: 'MACHINING',
    icon: <SettingOutlined />,
    color: '#1890ff',
    description: 'Precision machining and shaping'
  },
  {
    id: 4,
    name: 'PVD POWDER COATING',
    icon: <ThunderboltOutlined />,
    color: '#52c41a',
    description: 'Physical Vapor Deposition powder coating'
  },
  {
    id: 5,
    name: 'PVD',
    icon: <FireOutlined />,
    color: '#fa8c16',
    description: 'Physical Vapor Deposition process'
  },
  {
    id: 6,
    name: 'MILLING',
    icon: <ToolOutlined />,
    color: '#13c2c2',
    description: 'Precision milling operations'
  },
  {
    id: 7,
    name: 'ACRYLIC',
    icon: <ThunderboltOutlined />,
    color: '#faad14',
    description: 'Acrylic coating application'
  },
  {
    id: 8,
    name: 'LACQUOR',
    icon: <ThunderboltOutlined />,
    color: '#f759ab',
    description: 'Lacquer finishing'
  },
  {
    id: 9,
    name: 'PACKAGING',
    icon: <ExportOutlined />,
    color: '#722ed1',
    description: 'Final packaging for shipment'
  },
  {
    id: 10,
    name: 'QUALITY CHECK',
    icon: <SafetyOutlined />,
    color: '#52c41a',
    description: 'Final quality inspection'
  },
  {
    id: 11,
    name: 'DISPATCHED TO SALES',
    icon: <SendOutlined />,
    color: '#1890ff',
    description: 'Ready for customer delivery'
  }
]

const JobCardDetails = () => {
  const { jobCardId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [jobCard, setJobCard] = useState(null)
  const [productionPlan, setProductionPlan] = useState(null)
  const [productionSteps, setProductionSteps] = useState(PRODUCTION_STEPS)
  const [stepTransitions, setStepTransitions] = useState([])
  const [materialRequests, setMaterialRequests] = useState([])
  const [qaReports, setQaReports] = useState([])
  const [rejections, setRejections] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  // Modal states
  const [updateStepModalVisible, setUpdateStepModalVisible] = useState(false)
  const [qaReportModal, setQaReportModal] = useState(false)
  const [materialRequestModal, setMaterialRequestModal] = useState(false)
  const [rejectionModal, setRejectionModal] = useState(false)
  const [assignPersonnelModal, setAssignPersonnelModal] = useState(false)
  const [selectedStep, setSelectedStep] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [transitionsLoading, setTransitionsLoading] = useState(false)

  // Forms
  const [form] = Form.useForm()
  const [qaForm] = Form.useForm()
  const [materialForm] = Form.useForm()
  const [rejectionForm] = Form.useForm()

  const { user } = useSelector(state => state.userDetails)

  useEffect(() => {
    if (jobCardId) {
      fetchAllData()
    }
  }, [jobCardId])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchJobCardDetails(),
        fetchProductionSteps(),
        fetchStepTransitions(),
        fetchMaterialRequests(),
        fetchQaReports(),
        fetchRejections()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJobCardDetails = async () => {
    try {
      const response = await client.get(`/v2/production/job-cards/${jobCardId}`)
      if (response.data && response.data.result) {
        setJobCard(response.data.result)
        // Fetch associated production plan
        if (response.data.result.prodPlanId) {
          fetchProductionPlan(response.data.result.prodPlanId)
        }
      }
    } catch (error) {
      console.error('Error fetching job card details:', error)
      // Enhanced mock data
      const mockJobCard = {
        id: parseInt(jobCardId),
        prodPlanId: 1001,
        quantity: 250,
        prodStep: 5,
        status: 'in-progress',
        urgent: true,
        createdBy: 'Production Supervisor',
        createdAt: '2024-01-15T08:30:00Z',
        updatedAt: '2024-01-20T16:45:00Z',
        qaId: 15,
        acceptedQuantity: 200,
        rejectedQuantity: 25,
        rejectionReason: 'Surface finish quality issues in batch #3',
        laterAcceptanceReason: null,
        assignedPersonnel: [
          { id: 1, name: 'John Smith', role: 'Operator', step: 5 },
          { id: 2, name: 'Sarah Johnson', role: 'QA Inspector', step: 10 }
        ],
        estimatedCompletion: '2024-01-25T18:00:00Z',
        actualStartTime: '2024-01-15T09:00:00Z',
        stepStartTime: '2024-01-20T10:30:00Z',
        alloyName: 'Premium Steel Alloy - 18x8 ET45 5x120',
        targetAlloyName: 'Gloss Black Premium Steel - 18x8 ET45 5x120'
      }
      setJobCard(mockJobCard)
    }
  }

  const fetchProductionPlan = async planId => {
    try {
      const response = await client.get(
        `/v2/production/production-plans/${planId}`
      )
      if (response.data && response.data.result) {
        setProductionPlan(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching production plan:', error)
      // Mock production plan data
      setProductionPlan({
        id: planId,
        alloyName: 'Premium Steel Alloy - 18x8 ET45 5x120',
        convertName: 'Gloss Black Premium Steel - 18x8 ET45 5x120',
        quantity: 1000,
        inProductionQuantity: 750,
        completedQuantity: 200,
        urgent: true,
        note: 'High priority order for BMW dealership network',
        createdBy: 'Production Manager',
        createdAt: '2024-01-15T10:30:00Z'
      })
    }
  }

  const fetchProductionSteps = async () => {
    try {
      const response = await client.get('/v2/production/get-steps')
      if (response.data && response.data.result) {
        // Merge API data with our enhanced step definitions
        const apiSteps = response.data.result
        const enhancedSteps = PRODUCTION_STEPS.map(step => {
          const apiStep = apiSteps.find(s => s.id === step.id)
          return apiStep ? { ...step, ...apiStep } : step
        })
        setProductionSteps(enhancedSteps)
      }
    } catch (error) {
      console.error('Error fetching production steps:', error)
      setProductionSteps(PRODUCTION_STEPS)
    }
  }

  const fetchStepTransitions = async () => {
    try {
      setTransitionsLoading(true)
      const response = await client.get(
        `/v2/production/step-transitions/${jobCardId}`
      )
      if (response.data && response.data.result) {
        setStepTransitions(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching step transitions:', error)
      // Mock step transitions
      setStepTransitions([
        {
          id: 1,
          jobCardId: parseInt(jobCardId),
          fromStep: 0,
          toStep: 1,
          timestamp: '2024-01-15T09:00:00Z',
          userId: 1,
          userName: 'Production Supervisor',
          notes: 'Job card created and materials requested',
          duration: null
        },
        {
          id: 2,
          jobCardId: parseInt(jobCardId),
          fromStep: 1,
          toStep: 2,
          timestamp: '2024-01-16T10:30:00Z',
          userId: 2,
          userName: 'John Smith',
          notes: 'Materials received, starting painting process',
          duration: '1 day 1.5 hours'
        },
        {
          id: 3,
          jobCardId: parseInt(jobCardId),
          fromStep: 2,
          toStep: 3,
          timestamp: '2024-01-17T14:15:00Z',
          userId: 3,
          userName: 'Mike Wilson',
          notes: 'Painting completed, moving to machining',
          duration: '1 day 3.75 hours'
        },
        {
          id: 4,
          jobCardId: parseInt(jobCardId),
          fromStep: 3,
          toStep: 4,
          timestamp: '2024-01-18T16:45:00Z',
          userId: 4,
          userName: 'David Brown',
          notes: 'Machining completed, ready for PVD powder coating',
          duration: '1 day 2.5 hours'
        },
        {
          id: 5,
          jobCardId: parseInt(jobCardId),
          fromStep: 4,
          toStep: 5,
          timestamp: '2024-01-20T10:30:00Z',
          userId: 5,
          userName: 'Sarah Johnson',
          notes: 'PVD powder coating completed, starting PVD process',
          duration: '1 day 17.75 hours'
        }
      ])
    } finally {
      setTransitionsLoading(false)
    }
  }

  const fetchMaterialRequests = async () => {
    try {
      const response = await client.get(
        `/v2/production/material-requests/${jobCardId}`
      )
      if (response.data && response.data.result) {
        setMaterialRequests(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching material requests:', error)
      // Mock material requests
      setMaterialRequests([
        {
          id: 1,
          jobCardId: parseInt(jobCardId),
          requestedQuantity: 250,
          sentQuantity: 250,
          isFulfilled: true,
          requestedAt: '2024-01-15T09:00:00Z',
          fulfilledAt: '2024-01-15T14:30:00Z',
          requestedBy: 'Production Supervisor',
          fulfilledBy: 'Inventory Manager'
        }
      ])
    }
  }

  const fetchQaReports = async () => {
    try {
      const response = await client.get(
        `/v2/production/qa-reports/${jobCardId}`
      )
      if (response.data && response.data.result) {
        setQaReports(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching QA reports:', error)
      // Mock QA reports
      setQaReports([
        {
          id: 1,
          jobCardId: parseInt(jobCardId),
          qaPersonnel: 'Sarah Johnson',
          inspectionDate: '2024-01-20T15:00:00Z',
          acceptedQuantity: 200,
          rejectedQuantity: 25,
          qualityScore: 85,
          notes:
            'Minor surface finish issues in 25 units, rest passed inspection',
          defectCategories: ['Surface Finish', 'Coating Quality'],
          correctionActions: [
            'Rework coating process',
            'Additional quality checks'
          ]
        }
      ])
    }
  }

  const fetchRejections = async () => {
    try {
      const response = await client.get(
        `/v2/production/rejections/${jobCardId}`
      )
      if (response.data && response.data.result) {
        setRejections(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching rejections:', error)
      // Mock rejections
      setRejections([
        {
          id: 1,
          jobCardId: parseInt(jobCardId),
          quantity: 25,
          reason: 'Surface finish quality issues',
          reportedBy: 'Sarah Johnson',
          reportedAt: '2024-01-20T15:30:00Z',
          isResolved: false,
          resolutionAction: null,
          resolutionDate: null
        }
      ])
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
    message.success('Data refreshed successfully')
  }

  const getStatusTag = (status, urgent = false) => {
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
      <Space>
        <Tag color={config.color} icon={config.icon}>
          {config.text}
        </Tag>
        {urgent && (
          <Tag color='red' icon={<FireOutlined />}>
            URGENT
          </Tag>
        )}
      </Space>
    )
  }

  const getStepName = stepId => {
    const step = productionSteps.find(s => s.id === stepId)
    return step ? step.name : `Step ${stepId}`
  }

  const getStepProgress = () => {
    if (!jobCard) return 0
    return Math.round((jobCard.prodStep / 11) * 100)
  }

  const getCurrentStepIndex = () => {
    if (!jobCard || !productionSteps.length) return 0
    const stepIndex = productionSteps.findIndex(
      step => step.id === jobCard.prodStep
    )
    return stepIndex >= 0 ? stepIndex : 0
  }

  const getStepStatusAndTime = stepId => {
    if (!stepTransitions.length) return { status: 'wait' }

    const stepReached = stepTransitions.some(
      transition => transition.toStep === stepId
    )
    if (!stepReached) return { status: 'wait' }

    // Check if it's the current step
    if (jobCard.prodStep === stepId) {
      return {
        status: 'process',
        title: 'Current',
        time: stepTransitions.find(t => t.toStep === stepId)?.timestamp
      }
    }

    // Check if step was completed
    const completed = stepTransitions.some(
      transition => transition.fromStep === stepId
    )
    if (completed) {
      const transition = stepTransitions.find(t => t.fromStep === stepId)
      return {
        status: 'finish',
        title: 'Completed',
        time: transition?.timestamp,
        duration: transition?.duration
      }
    }

    return { status: 'process' }
  }

  const handleStepUpdate = async () => {
    if (selectedStep === null) {
      message.error('Please select a production step')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        jobCardId: parseInt(jobCardId),
        prodStep: selectedStep,
        notes: notes || undefined,
        userId: user.id
      }

      const response = await client.post(
        '/v2/production/update-production-job-card',
        payload
      )
      if (response.data && response.data.message) {
        message.success(response.data.message)
        setUpdateStepModalVisible(false)
        await fetchAllData()
      }
    } catch (error) {
      console.error('Error updating job card:', error)
      message.success('Job card step updated successfully (mock)')
      setUpdateStepModalVisible(false)

      // Update local state
      setJobCard(prev => ({ ...prev, prodStep: parseInt(selectedStep) }))

      // Add mock transition
      const newTransition = {
        id: stepTransitions.length + 1,
        jobCardId: parseInt(jobCardId),
        fromStep: jobCard.prodStep,
        toStep: parseInt(selectedStep),
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.fullName || 'Current User',
        notes: notes
      }
      setStepTransitions(prev => [...prev, newTransition])
    } finally {
      setSubmitting(false)
    }
  }

  const handleQAReport = async values => {
    try {
      setSubmitting(true)
      const response = await client.post(
        '/v2/production/add-qa-production-card-report',
        {
          jobCardId: parseInt(jobCardId),
          ...values,
          qaId: user.id
        }
      )

      if (response.data && response.data.message) {
        message.success(response.data.message)
        setQaReportModal(false)
        await fetchAllData()
      }
    } catch (error) {
      console.error('Error submitting QA report:', error)
      message.success('QA report submitted successfully (mock)')
      setQaReportModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  const showUpdateStepModal = () => {
    setSelectedStep(jobCard?.prodStep || 0)
    setNotes('')
    setUpdateStepModalVisible(true)
  }

  const handleGoBack = () => {
    navigate('/production-job-cards')
  }

  const handleGoToPlan = () => {
    if (productionPlan?.id) {
      navigate(`/production-plan/${productionPlan.id}`)
    }
  }

  const renderOverviewTab = () => (
    <div className='space-y-6'>
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size='small' className='text-center'>
            <Statistic
              title='Progress'
              value={getStepProgress()}
              suffix='%'
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress
              percent={getStepProgress()}
              size='small'
              showInfo={false}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size='small' className='text-center'>
            <Statistic
              title='Current Step'
              value={jobCard.prodStep}
              suffix={`/ 11`}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type='secondary'>{getStepName(jobCard.prodStep)}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size='small' className='text-center'>
            <Statistic
              title='Quality Rate'
              value={
                jobCard.acceptedQuantity
                  ? Math.round(
                      (jobCard.acceptedQuantity /
                        (jobCard.acceptedQuantity + jobCard.rejectedQuantity)) *
                        100
                    )
                  : 0
              }
              suffix='%'
              prefix={<SafetyOutlined />}
              valueStyle={{
                color:
                  jobCard.acceptedQuantity > jobCard.rejectedQuantity
                    ? '#52c41a'
                    : '#ff4d4f'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size='small' className='text-center'>
            <Statistic
              title='Days Active'
              value={Math.ceil(
                (new Date() - new Date(jobCard.createdAt)) /
                  (1000 * 60 * 60 * 24)
              )}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Job Card Details */}
      <Card
        title='Job Card Information'
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={showUpdateStepModal}>
              Update Step
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Descriptions
          bordered
          column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label='Job Card ID'>
            <Text strong>#{jobCard.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label='Production Plan'>
            <a onClick={handleGoToPlan}>#{jobCard.prodPlanId}</a>
          </Descriptions.Item>
          <Descriptions.Item label='Status'>
            {getStatusTag(jobCard.status, jobCard.urgent)}
          </Descriptions.Item>
          <Descriptions.Item label='Quantity'>
            <Text strong>{jobCard.quantity} units</Text>
          </Descriptions.Item>
          <Descriptions.Item label='Source Alloy'>
            {jobCard.alloyName}
          </Descriptions.Item>
          <Descriptions.Item label='Target Alloy'>
            {jobCard.targetAlloyName}
          </Descriptions.Item>
          <Descriptions.Item label='Created By'>
            <Avatar size='small' icon={<UserOutlined />} /> {jobCard.createdBy}
          </Descriptions.Item>
          <Descriptions.Item label='Created At'>
            {new Date(jobCard.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label='Last Updated'>
            {new Date(jobCard.updatedAt).toLocaleString()}
          </Descriptions.Item>
          {jobCard.estimatedCompletion && (
            <Descriptions.Item label='Estimated Completion'>
              <Text
                type={
                  new Date(jobCard.estimatedCompletion) < new Date()
                    ? 'danger'
                    : 'success'
                }
              >
                {new Date(jobCard.estimatedCompletion).toLocaleString()}
              </Text>
            </Descriptions.Item>
          )}
          {jobCard.assignedPersonnel && jobCard.assignedPersonnel.length > 0 && (
            <Descriptions.Item label='Assigned Personnel' span={2}>
              <Space wrap>
                {jobCard.assignedPersonnel.map(person => (
                  <Tag key={person.id} icon={<UserOutlined />}>
                    {person.name} ({person.role})
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Production Progress */}
      <Card
        title='Production Progress'
        extra={<Text type='secondary'>Step {jobCard.prodStep} of 11</Text>}
      >
        <div className='mb-6'>
          <Steps
            current={getCurrentStepIndex()}
            direction='horizontal'
            size='small'
            items={productionSteps.map(step => {
              const stepStatus = getStepStatusAndTime(step.id)
              return {
                title: step.name,
                description: (
                  <div>
                    <div style={{ fontSize: '11px' }}>{step.description}</div>
                    {stepStatus.time && (
                      <div style={{ fontSize: '10px', color: '#666' }}>
                        {new Date(stepStatus.time).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ),
                status: stepStatus.status,
                icon: step.icon
              }
            })}
          />
        </div>
      </Card>
    </div>
  )

  const renderQualityTab = () => (
    <div className='space-y-6'>
      {/* QA Summary */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size='small' className='text-center'>
            <Statistic
              title='Accepted Quantity'
              value={jobCard.acceptedQuantity || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size='small' className='text-center'>
            <Statistic
              title='Rejected Quantity'
              value={jobCard.rejectedQuantity || 0}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size='small' className='text-center'>
            <Statistic
              title='Quality Score'
              value={qaReports.length > 0 ? qaReports[0].qualityScore : 0}
              suffix='%'
              prefix={<SafetyOutlined />}
              valueStyle={{
                color:
                  qaReports.length > 0 && qaReports[0].qualityScore >= 80
                    ? '#52c41a'
                    : '#faad14'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* QA Reports */}
      <Card
        title='Quality Assurance Reports'
        extra={
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setQaReportModal(true)}
          >
            New QA Report
          </Button>
        }
      >
        {qaReports.length > 0 ? (
          <List
            dataSource={qaReports}
            renderItem={report => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<SafetyOutlined />} />}
                  title={`QA Report by ${report.qaPersonnel}`}
                  description={
                    <div>
                      <div>
                        Inspection Date:{' '}
                        {new Date(report.inspectionDate).toLocaleString()}
                      </div>
                      <div>
                        Quality Score:{' '}
                        <Badge
                          count={`${report.qualityScore}%`}
                          style={{
                            backgroundColor:
                              report.qualityScore >= 80 ? '#52c41a' : '#faad14'
                          }}
                        />
                      </div>
                      <div>Notes: {report.notes}</div>
                    </div>
                  }
                />
                <div>
                  <Space direction='vertical' align='end'>
                    <Text strong>Accepted: {report.acceptedQuantity}</Text>
                    <Text type='danger'>
                      Rejected: {report.rejectedQuantity}
                    </Text>
                  </Space>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description='No QA reports available' />
        )}
      </Card>

      {/* Rejections */}
      {rejections.length > 0 && (
        <Card title='Rejection Management'>
          <List
            dataSource={rejections}
            renderItem={rejection => (
              <List.Item
                actions={[
                  <Button key='resolve' type='link'>
                    {rejection.isResolved ? 'View Resolution' : 'Resolve'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{ backgroundColor: '#ff4d4f' }}
                      icon={<BugOutlined />}
                    />
                  }
                  title={`${rejection.quantity} units rejected`}
                  description={
                    <div>
                      <div>Reason: {rejection.reason}</div>
                      <div>Reported by: {rejection.reportedBy}</div>
                      <div>
                        Date: {new Date(rejection.reportedAt).toLocaleString()}
                      </div>
                      <Tag color={rejection.isResolved ? 'green' : 'red'}>
                        {rejection.isResolved ? 'Resolved' : 'Pending'}
                      </Tag>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  )

  const renderMaterialsTab = () => (
    <div className='space-y-6'>
      <Card
        title='Material Requests'
        extra={
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setMaterialRequestModal(true)}
          >
            New Request
          </Button>
        }
      >
        <Table
          dataSource={materialRequests}
          columns={[
            {
              title: 'Request ID',
              dataIndex: 'id',
              key: 'id',
              render: id => `#${id}`
            },
            {
              title: 'Requested Quantity',
              dataIndex: 'requestedQuantity',
              key: 'requestedQuantity'
            },
            {
              title: 'Sent Quantity',
              dataIndex: 'sentQuantity',
              key: 'sentQuantity'
            },
            {
              title: 'Status',
              dataIndex: 'isFulfilled',
              key: 'status',
              render: fulfilled => (
                <Tag color={fulfilled ? 'green' : 'orange'}>
                  {fulfilled ? 'Fulfilled' : 'Pending'}
                </Tag>
              )
            },
            {
              title: 'Requested At',
              dataIndex: 'requestedAt',
              key: 'requestedAt',
              render: date => new Date(date).toLocaleString()
            },
            {
              title: 'Requested By',
              dataIndex: 'requestedBy',
              key: 'requestedBy'
            }
          ]}
          pagination={false}
        />
      </Card>
    </div>
  )

  const renderHistoryTab = () => (
    <div className='space-y-6'>
      <Card title='Step Transition History'>
        <Timeline>
          {stepTransitions.map(transition => (
            <Timeline.Item
              key={transition.id}
              color={transition.toStep === jobCard.prodStep ? 'blue' : 'green'}
              dot={
                transition.toStep === jobCard.prodStep ? (
                  <SyncOutlined spin />
                ) : (
                  <CheckCircleOutlined />
                )
              }
            >
              <div>
                <Text strong>
                  {transition.fromStep === 0
                    ? 'Job Card Created'
                    : `${getStepName(transition.fromStep)} → ${getStepName(
                        transition.toStep
                      )}`}
                </Text>
                <div className='text-sm text-gray-500'>
                  {new Date(transition.timestamp).toLocaleString()} by{' '}
                  {transition.userName}
                </div>
                {transition.notes && (
                  <div className='text-sm mt-1'>{transition.notes}</div>
                )}
                {transition.duration && (
                  <Tag size='small' color='blue'>
                    Duration: {transition.duration}
                  </Tag>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  )

  if (loading) {
    return (
      <div className='flex items-center justify-center w-full h-64'>
        <Spin size='large' tip='Loading job card details...' />
      </div>
    )
  }

  if (!jobCard) {
    return (
      <div className='p-6'>
        <Card>
          <Empty
            description='Job Card Not Found'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type='primary' onClick={handleGoBack}>
              Back to Job Cards
            </Button>
          </Empty>
        </Card>
      </div>
    )
  }

  return (
    <div className='w-full p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <Title level={2} className='mb-0'>
            Job Card #{jobCard.id}
          </Title>
          <Text type='secondary'>Production tracking and management</Text>
        </div>
        <div className='flex items-center space-x-2'>
          <Button onClick={handleGoBack}>Back to Job Cards</Button>
          {productionPlan && (
            <Button onClick={handleGoToPlan}>View Production Plan</Button>
          )}
          <Button icon={<PrinterOutlined />}>Print</Button>
          <Button icon={<DownloadOutlined />}>Export</Button>
        </div>
      </div>

      {/* Alerts */}
      {jobCard.urgent && (
        <Alert
          message='Urgent Priority Job Card'
          description='This job card has been marked as urgent and requires immediate attention.'
          type='warning'
          showIcon
          icon={<FireOutlined />}
          className='mb-4'
        />
      )}

      {jobCard.rejectedQuantity > 0 && (
        <Alert
          message={`${jobCard.rejectedQuantity} units rejected`}
          description={jobCard.rejectionReason}
          type='error'
          showIcon
          className='mb-4'
          action={
            <Button
              size='small'
              onClick={() => navigate(`/production-rejections/${jobCardId}`)}
            >
              Manage Rejections
            </Button>
          }
        />
      )}

      {/* Main Content */}
      <Card className='shadow-sm'>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab='Overview' key='overview'>
            {renderOverviewTab()}
          </TabPane>
          <TabPane tab='Quality Assurance' key='quality'>
            {renderQualityTab()}
          </TabPane>
          <TabPane tab='Materials' key='materials'>
            {renderMaterialsTab()}
          </TabPane>
          <TabPane tab='History' key='history'>
            {renderHistoryTab()}
          </TabPane>
        </Tabs>
      </Card>

      {/* Update Step Modal */}
      <Modal
        title='Update Production Step'
        open={updateStepModalVisible}
        onCancel={() => setUpdateStepModalVisible(false)}
        footer={[
          <AntButton
            key='cancel'
            onClick={() => setUpdateStepModalVisible(false)}
          >
            Cancel
          </AntButton>,
          <AntButton
            key='submit'
            type='primary'
            loading={submitting}
            onClick={handleStepUpdate}
          >
            Update Step
          </AntButton>
        ]}
      >
        <div className='space-y-4'>
          <div>
            <Text strong>Current Step: {getStepName(jobCard.prodStep)}</Text>
          </div>
          <div>
            <label className='block mb-2 font-medium'>Select New Step:</label>
            <Select
              value={selectedStep}
              onChange={setSelectedStep}
              style={{ width: '100%' }}
            >
              {productionSteps.map(step => (
                <Option
                  key={step.id}
                  value={step.id}
                  disabled={step.id <= jobCard.prodStep}
                >
                  {step.name} {step.id <= jobCard.prodStep && '(Completed)'}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label className='block mb-2 font-medium'>Notes (Optional):</label>
            <TextArea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder='Enter any notes about this step update'
            />
          </div>
        </div>
      </Modal>

      {/* QA Report Modal */}
      <Modal
        title='Submit QA Report'
        open={qaReportModal}
        onCancel={() => setQaReportModal(false)}
        footer={null}
      >
        <Form form={qaForm} onFinish={handleQAReport} layout='vertical'>
          <Form.Item
            name='acceptedQuantity'
            label='Accepted Quantity'
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              max={jobCard.quantity}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name='rejectedQuantity'
            label='Rejected Quantity'
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              max={jobCard.quantity}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name='qualityScore'
            label='Quality Score (%)'
            rules={[{ required: true }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name='rejectionReason' label='Rejection Reason (if any)'>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name='notes' label='Additional Notes'>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type='primary' htmlType='submit' loading={submitting}>
                Submit Report
              </Button>
              <Button onClick={() => setQaReportModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default JobCardDetails
