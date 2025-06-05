import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Spin,
  Divider,
  Space,
  Timeline,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tabs,
  Alert,
  Badge,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  Button as AntButton,
  List,
  Avatar,
  Typography,
  Steps,
  Popconfirm,
  Drawer,
  InputNumber,
  DatePicker,
  Switch
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  ToolOutlined,
  ShoppingCartOutlined,
  BugOutlined,
  CheckOutlined,
  CloseOutlined,
  FireOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  SendOutlined,
  SettingOutlined,
  SafetyOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { mockApiResponses } from '../../Utils/mockProductionData'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input
const { Step } = Steps

// 11-Step Production Process as per documentation
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

const ProductionPlanDetails = () => {
  const { planId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [jobCards, setJobCards] = useState([])
  const [inventoryRequests, setInventoryRequests] = useState([])
  const [rejections, setRejections] = useState([])
  const [productionSteps, setProductionSteps] = useState(PRODUCTION_STEPS)
  const [qaReports, setQaReports] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  // Modal states
  const [createJobCardModal, setCreateJobCardModal] = useState(false)
  const [updatePlanModal, setUpdatePlanModal] = useState(false)
  const [stepUpdateModal, setStepUpdateModal] = useState(false)
  const [qaReportModal, setQaReportModal] = useState(false)
  const [materialRequestModal, setMaterialRequestModal] = useState(false)
  const [selectedJobCard, setSelectedJobCard] = useState(null)
  const [form] = Form.useForm()
  const [qaForm] = Form.useForm()
  const [materialForm] = Form.useForm()

  useEffect(() => {
    if (planId) {
      fetchAllData()
    }
  }, [planId])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchPlanDetails(),
        fetchJobCards(),
        fetchInventoryRequests(),
        fetchRejections(),
        fetchQaReports()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlanDetails = async () => {
    try {
      const response = await client.get(
        `/v2/production/production-plans/${planId}`
      )
      if (response.data && response.data.result) {
        setPlan(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching plan details:', error)
      // Enhanced mock data with proper alloy information
      setPlan({
        id: parseInt(planId),
        alloyId: 101,
        convertToAlloyId: 201,
        alloyName: 'Steel Alloy A - 17x8 ET35 5x112',
        convertName: 'Premium Steel Alloy B - 17x8 ET35 5x112 Gloss Black',
        quantity: 1000,
        inProductionQuantity: 750,
        completedQuantity: 200,
        rejectedQuantity: 50,
        urgent: true,
        note: 'High priority order for major client - BMW dealership network',
        isCompleted: false,
        createdBy: 'Production Manager',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T14:45:00Z'
      })
    }
  }

  const fetchJobCards = async () => {
    try {
      const response = await client.get(
        `/v2/production/plan-job-cards/${planId}`
      )
      if (response.data && response.data.result) {
        setJobCards(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching job cards:', error)
      // Enhanced mock job cards with proper 11-step tracking
      setJobCards([
        {
          id: 1,
          prodPlanId: parseInt(planId),
          quantity: 500,
          prodStep: 3,
          stepName: 'MACHINING',
          status: 'in-progress',
          createdBy: 'Production Supervisor A',
          createdAt: '2024-01-16T09:00:00Z',
          updatedAt: '2024-01-20T11:30:00Z',
          qaId: null,
          acceptedQuantity: null,
          rejectedQuantity: null,
          rejectionReason: null,
          laterAcceptanceReason: null,
          progress: 27 // 3/11 steps = ~27%
        },
        {
          id: 2,
          prodPlanId: parseInt(planId),
          quantity: 250,
          prodStep: 10,
          stepName: 'QUALITY CHECK',
          status: 'qa-pending',
          createdBy: 'Production Supervisor B',
          createdAt: '2024-01-17T14:00:00Z',
          updatedAt: '2024-01-19T16:45:00Z',
          qaId: 3,
          acceptedQuantity: null,
          rejectedQuantity: null,
          rejectionReason: null,
          laterAcceptanceReason: null,
          progress: 91 // 10/11 steps = ~91%
        },
        {
          id: 3,
          prodPlanId: parseInt(planId),
          quantity: 250,
          prodStep: 1,
          stepName: 'REQUESTED FROM INVENTORY',
          status: 'waiting-materials',
          createdBy: 'Production Supervisor C',
          createdAt: '2024-01-20T08:00:00Z',
          updatedAt: '2024-01-20T08:00:00Z',
          qaId: null,
          acceptedQuantity: null,
          rejectedQuantity: null,
          rejectionReason: null,
          laterAcceptanceReason: null,
          progress: 9 // 1/11 steps = ~9%
        }
      ])
    }
  }

  const fetchInventoryRequests = async () => {
    try {
      const response = await client.get(
        `/v2/production/inventory-requests/${planId}`
      )
      if (response.data && response.data.result) {
        setInventoryRequests(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching inventory requests:', error)
      // Enhanced mock inventory requests
      setInventoryRequests([
        {
          id: 1,
          prodPlanId: parseInt(planId),
          requestedQuantity: 1000,
          sentQuantity: 1000,
          isFulfilled: true,
          createdBy: 'System Auto-Generated',
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T15:30:00Z',
          materialType: 'Raw Steel Alloy A - 17x8 ET35 5x112',
          status: 'fulfilled',
          autoGenerated: true
        },
        {
          id: 2,
          prodPlanId: parseInt(planId),
          requestedQuantity: 50,
          sentQuantity: 30,
          isFulfilled: false,
          createdBy: 'Production Manager',
          createdAt: '2024-01-18T10:00:00Z',
          updatedAt: '2024-01-18T10:00:00Z',
          materialType: 'PVD Coating Material',
          status: 'partial',
          autoGenerated: false
        },
        {
          id: 3,
          prodPlanId: parseInt(planId),
          requestedQuantity: 25,
          sentQuantity: 0,
          isFulfilled: false,
          createdBy: 'Production Manager',
          createdAt: '2024-01-19T14:00:00Z',
          updatedAt: '2024-01-19T14:00:00Z',
          materialType: 'Lacquer Coating Material',
          status: 'pending',
          autoGenerated: false
        }
      ])
    }
  }

  const fetchRejections = async () => {
    try {
      const response = await client.get(`/v2/production/rejections/${planId}`)
      if (response.data && response.data.result) {
        setRejections(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching rejections:', error)
      // Enhanced mock rejections
      setRejections([
        {
          id: 1,
          prodPlanId: parseInt(planId),
          prodJobCardId: 1,
          isResolved: false,
          createdBy: 'QA Inspector Alice',
          createdAt: '2024-01-19T14:30:00Z',
          reason: 'Surface finish quality issues - minor scratches detected',
          quantity: 20,
          step: 'MACHINING',
          severity: 'medium',
          canBeReworked: true,
          estimatedReworkTime: '2 hours'
        },
        {
          id: 2,
          prodPlanId: parseInt(planId),
          prodJobCardId: 2,
          isResolved: true,
          createdBy: 'QA Inspector Bob',
          createdAt: '2024-01-18T16:00:00Z',
          reason: 'Minor coating defects - acceptable after review',
          quantity: 5,
          step: 'ACRYLIC',
          severity: 'low',
          canBeReworked: false,
          laterAcceptanceReason: 'Defects within acceptable tolerance limits',
          resolvedAt: '2024-01-19T10:00:00Z'
        }
      ])
    }
  }

  const fetchQaReports = async () => {
    try {
      const response = await client.get(`/v2/production/qa-reports/${planId}`)
      if (response.data && response.data.result) {
        setQaReports(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching QA reports:', error)
      // Enhanced mock QA reports
      setQaReports([
        {
          id: 1,
          jobCardId: 1,
          qaInspector: 'Alice Johnson',
          qaId: 2,
          inspectionDate: '2024-01-19T10:00:00Z',
          acceptedQuantity: 480,
          rejectedQuantity: 20,
          qualityScore: 96,
          notes:
            'Overall excellent quality. Minor surface finish issues on 20 units - can be reworked.',
          inspectionCriteria: [
            { criterion: 'Surface Finish', score: 95, passed: true },
            { criterion: 'Dimensional Accuracy', score: 98, passed: true },
            { criterion: 'Coating Adhesion', score: 97, passed: true },
            { criterion: 'Visual Inspection', score: 94, passed: true }
          ]
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

  const handleStepUpdate = async (jobCardId, newStep) => {
    try {
      const response = await client.post(
        '/v2/production/update-production-job-card',
        {
          id: jobCardId,
          prodStep: newStep
        }
      )

      if (response.data && response.data.success) {
        message.success('Production step updated successfully')
        fetchJobCards()
      }
    } catch (error) {
      console.error('Error updating step:', error)
      // Mock update
      setJobCards(prev =>
        prev.map(card =>
          card.id === jobCardId
            ? {
                ...card,
                prodStep: newStep,
                stepName: PRODUCTION_STEPS.find(s => s.id === newStep)?.name,
                progress: Math.round((newStep / 11) * 100),
                status:
                  newStep === 11
                    ? 'completed'
                    : newStep === 10
                    ? 'qa-pending'
                    : 'in-progress',
                updatedAt: new Date().toISOString()
              }
            : card
        )
      )
      message.success('Production step updated successfully (mock)')
    }
  }

  const handleQaReport = async values => {
    try {
      const response = await client.post(
        '/v2/production/add-qa-production-card-report',
        {
          jobCardId: selectedJobCard.id,
          qaId: values.qaId,
          acceptedQuantity: values.acceptedQuantity,
          rejectedQuantity: values.rejectedQuantity,
          rejectionReason: values.rejectionReason,
          laterAcceptanceReason: values.laterAcceptanceReason
        }
      )

      if (response.data && response.data.success) {
        message.success('QA report submitted successfully')
        setQaReportModal(false)
        fetchJobCards()
        fetchQaReports()
      }
    } catch (error) {
      console.error('Error submitting QA report:', error)
      // Mock QA report
      message.success('QA report submitted successfully (mock)')
      setQaReportModal(false)
    }
  }

  const handleMaterialRequest = async values => {
    try {
      const response = await client.post(
        '/v2/production/create-inventory-request',
        {
          prodPlanId: planId,
          requestedQuantity: values.quantity,
          materialType: values.materialType,
          urgent: values.urgent
        }
      )

      if (response.data && response.data.success) {
        message.success('Material request created successfully')
        setMaterialRequestModal(false)
        fetchInventoryRequests()
      }
    } catch (error) {
      console.error('Error creating material request:', error)
      // Mock material request
      const newRequest = {
        id: Date.now(),
        prodPlanId: parseInt(planId),
        requestedQuantity: values.quantity,
        sentQuantity: 0,
        isFulfilled: false,
        createdBy: 'Current User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        materialType: values.materialType,
        status: 'pending',
        autoGenerated: false
      }
      setInventoryRequests(prev => [...prev, newRequest])
      message.success('Material request created successfully (mock)')
      setMaterialRequestModal(false)
    }
  }

  const getStatusTag = (status, urgent = false) => {
    let color = 'default'
    let icon = null

    switch (status) {
      case 'completed':
        color = 'success'
        icon = <CheckCircleOutlined />
        break
      case 'in-progress':
        color = 'processing'
        icon = <ClockCircleOutlined />
        break
      case 'qa-pending':
        color = 'warning'
        icon = <SafetyOutlined />
        break
      case 'waiting-materials':
        color = 'orange'
        icon = <ExclamationCircleOutlined />
        break
      case 'rejected':
        color = 'error'
        icon = <CloseOutlined />
        break
      default:
        color = 'default'
    }

    return (
      <Tag color={color} icon={icon}>
        {status?.toUpperCase().replace('-', ' ') || 'UNKNOWN'}
        {urgent && <FireOutlined style={{ marginLeft: 4 }} />}
      </Tag>
    )
  }

  const getPriorityTag = urgent => {
    return urgent ? (
      <Tag color='red' icon={<FireOutlined />}>
        URGENT
      </Tag>
    ) : (
      <Tag color='blue'>NORMAL</Tag>
    )
  }

  const getProgressColor = progress => {
    if (progress >= 90) return '#52c41a'
    if (progress >= 70) return '#1890ff'
    if (progress >= 50) return '#faad14'
    return '#ff4d4f'
  }

  const calculateOverallProgress = () => {
    if (!plan || !jobCards.length) return 0
    const totalProgress = jobCards.reduce(
      (sum, card) => sum + (card.progress || 0),
      0
    )
    return Math.round(totalProgress / jobCards.length)
  }

  const calculateCompletionRate = () => {
    if (!plan) return 0
    return Math.round(((plan.completedQuantity || 0) / plan.quantity) * 100)
  }

  const calculateQualityRate = () => {
    const totalAccepted = qaReports.reduce(
      (sum, report) => sum + (report.acceptedQuantity || 0),
      0
    )
    const totalInspected = qaReports.reduce(
      (sum, report) =>
        sum + (report.acceptedQuantity || 0) + (report.rejectedQuantity || 0),
      0
    )
    return totalInspected > 0
      ? Math.round((totalAccepted / totalInspected) * 100)
      : 0
  }

  const getStepIcon = stepId => {
    const step = PRODUCTION_STEPS.find(s => s.id === stepId)
    return step ? step.icon : <ToolOutlined />
  }

  const getStepColor = stepId => {
    const step = PRODUCTION_STEPS.find(s => s.id === stepId)
    return step ? step.color : '#1890ff'
  }

  // Enhanced Job Cards Table Columns
  const jobCardColumns = [
    {
      title: 'Job Card',
      dataIndex: 'id',
      key: 'id',
      render: (id, record) => (
        <div>
          <Text strong>#{id}</Text>
          <br />
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {record.quantity} units
          </Text>
        </div>
      )
    },
    {
      title: 'Production Step',
      key: 'step',
      render: (_, record) => (
        <div>
          <Space>
            <Avatar
              size='small'
              style={{ backgroundColor: getStepColor(record.prodStep) }}
              icon={getStepIcon(record.prodStep)}
            />
            <div>
              <Text strong>{record.stepName}</Text>
              <br />
              <Text type='secondary' style={{ fontSize: '12px' }}>
                Step {record.prodStep}/11
              </Text>
            </div>
          </Space>
        </div>
      )
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress, record) => (
        <div>
          <Progress
            percent={progress}
            size='small'
            strokeColor={getProgressColor(progress)}
            format={percent => `${percent}%`}
          />
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {record.status?.replace('-', ' ')}
          </Text>
        </div>
      )
    },
    {
      title: 'QA Status',
      key: 'qa',
      render: (_, record) => (
        <div>
          {record.prodStep === 10 && !record.qaId && (
            <Tag color='orange'>QA Pending</Tag>
          )}
          {record.qaId && record.acceptedQuantity !== null && (
            <div>
              <Text type='success'>✓ {record.acceptedQuantity}</Text>
              <br />
              <Text type='danger'>✗ {record.rejectedQuantity || 0}</Text>
            </div>
          )}
          {record.prodStep < 10 && <Text type='secondary'>Not at QA step</Text>}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space direction='vertical' size='small'>
          <Space>
            <Tooltip title='View Details'>
              <AntButton
                icon={<EyeOutlined />}
                size='small'
                onClick={() => navigate(`/production-job-card/${record.id}`)}
              />
            </Tooltip>
            {record.status !== 'completed' && record.prodStep < 11 && (
              <Tooltip title='Advance Step'>
                <Popconfirm
                  title={`Move to step ${record.prodStep + 1}?`}
                  onConfirm={() =>
                    handleStepUpdate(record.id, record.prodStep + 1)
                  }
                >
                  <AntButton
                    icon={<ArrowRightOutlined />}
                    size='small'
                    type='primary'
                  />
                </Popconfirm>
              </Tooltip>
            )}
          </Space>
          {record.prodStep === 10 && !record.qaId && (
            <AntButton
              icon={<SafetyOutlined />}
              size='small'
              type='primary'
              onClick={() => {
                setSelectedJobCard(record)
                setQaReportModal(true)
              }}
            >
              QA Report
            </AntButton>
          )}
        </Space>
      )
    }
  ]

  // Enhanced Inventory Requests Table Columns
  const inventoryColumns = [
    {
      title: 'Request',
      key: 'request',
      render: (_, record) => (
        <div>
          <Text strong>#{record.id}</Text>
          {record.autoGenerated && (
            <Tag color='blue' size='small' style={{ marginLeft: 4 }}>
              AUTO
            </Tag>
          )}
          <br />
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {new Date(record.createdAt).toLocaleDateString()}
          </Text>
        </div>
      )
    },
    {
      title: 'Material Type',
      dataIndex: 'materialType',
      key: 'materialType',
      render: text => <Text>{text}</Text>
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => (
        <div>
          <Text strong>{record.sentQuantity || 0}</Text>
          <Text type='secondary'>/{record.requestedQuantity}</Text>
          <br />
          <Progress
            percent={Math.round(
              ((record.sentQuantity || 0) / record.requestedQuantity) * 100
            )}
            size='small'
            showInfo={false}
          />
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const colors = {
          fulfilled: 'success',
          partial: 'warning',
          pending: 'processing'
        }
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>
      }
    },
    {
      title: 'Requested By',
      dataIndex: 'createdBy',
      key: 'createdBy'
    }
  ]

  if (loading) {
    return (
      <div className='flex items-center justify-center w-full h-64'>
        <Spin size='large' />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className='p-5'>
        <Card>
          <div className='text-center'>
            <h3 className='text-lg font-semibold'>Production Plan Not Found</h3>
            <p className='mt-2'>
              The requested production plan could not be found.
            </p>
            <Button
              onClick={() => navigate('/production-plans')}
              className='mt-4'
            >
              Back to Production Plans
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className='w-full p-5 bg-gray-50'>
      {/* Header Actions */}
      <div className='mb-6'>
        <Row justify='space-between' align='middle'>
          <Col>
            <Space>
              <Button onClick={() => navigate('/production-plans')}>
                ← Back to Production Plans
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
              >
                Refresh
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => setCreateJobCardModal(true)}
              >
                Create Job Card
              </Button>
              <Button
                icon={<ShoppingCartOutlined />}
                onClick={() => setMaterialRequestModal(true)}
              >
                Request Materials
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => setUpdatePlanModal(true)}
              >
                Update Plan
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Plan Header */}
      <Card className='mb-6'>
        <Row justify='space-between' align='top'>
          <Col span={16}>
            <Title level={2} style={{ margin: 0 }}>
              Production Plan #{plan.id}
              {plan.urgent && (
                <FireOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
              )}
            </Title>
            <Paragraph type='secondary' style={{ marginTop: 8 }}>
              <Text strong>Convert:</Text> {plan.alloyName} → {plan.convertName}
            </Paragraph>
            <Paragraph type='secondary'>
              {plan.note || 'No additional notes'}
            </Paragraph>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space direction='vertical' size='small'>
              {getPriorityTag(plan.urgent)}
              {getStatusTag(plan.isCompleted ? 'completed' : 'in-progress')}
              <Text type='secondary'>
                Created: {new Date(plan.createdAt).toLocaleDateString()}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} className='mb-6'>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Quantity'
              value={plan.quantity}
              suffix='units'
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='In Production'
              value={plan.inProductionQuantity || 0}
              suffix='units'
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Completed'
              value={plan.completedQuantity || 0}
              suffix='units'
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Rejected'
              value={plan.rejectedQuantity || 0}
              suffix='units'
              prefix={<CloseOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress Overview */}
      <Row gutter={[16, 16]} className='mb-6'>
        <Col span={8}>
          <Card title='Overall Progress'>
            <Progress
              type='circle'
              percent={calculateOverallProgress()}
              strokeColor={getProgressColor(calculateOverallProgress())}
              format={percent => `${percent}%`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title='Completion Rate'>
            <Progress
              type='circle'
              percent={calculateCompletionRate()}
              strokeColor='#52c41a'
              format={percent => `${percent}%`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title='Quality Rate'>
            <Progress
              type='circle'
              percent={calculateQualityRate()}
              strokeColor='#1890ff'
              format={percent => `${percent}%`}
            />
          </Card>
        </Col>
      </Row>

      {/* 11-Step Production Process Overview */}
      <Card title='Production Process Overview' className='mb-6'>
        <Steps
          current={-1}
          size='small'
          direction='horizontal'
          style={{ marginBottom: 16 }}
        >
          {PRODUCTION_STEPS.map(step => (
            <Step
              key={step.id}
              title={step.name}
              icon={step.icon}
              description={`Step ${step.id}`}
            />
          ))}
        </Steps>

        {/* Active Job Cards in Steps */}
        <Row gutter={[8, 8]}>
          {PRODUCTION_STEPS.map(step => {
            const cardsInStep = jobCards.filter(
              card => card.prodStep === step.id
            )
            return (
              <Col span={2.18} key={step.id}>
                <Card
                  size='small'
                  style={{
                    backgroundColor:
                      cardsInStep.length > 0 ? step.color + '20' : '#f5f5f5',
                    borderColor: cardsInStep.length > 0 ? step.color : '#d9d9d9'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <Avatar
                      size='small'
                      style={{ backgroundColor: step.color }}
                      icon={step.icon}
                    />
                    <br />
                    <Text style={{ fontSize: '10px' }}>{step.name}</Text>
                    <br />
                    <Badge
                      count={cardsInStep.length}
                      style={{ backgroundColor: step.color }}
                    />
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>

      {/* Alerts for Critical Issues */}
      {rejections.filter(r => !r.isResolved).length > 0 && (
        <Alert
          message='Active Quality Issues'
          description={`There are ${
            rejections.filter(r => !r.isResolved).length
          } unresolved quality issue(s) that need immediate attention.`}
          type='error'
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <AntButton
              size='small'
              danger
              onClick={() => setActiveTab('rejections')}
            >
              View Issues
            </AntButton>
          }
        />
      )}

      {inventoryRequests.filter(r => !r.isFulfilled).length > 0 && (
        <Alert
          message='Pending Material Requests'
          description={`${
            inventoryRequests.filter(r => !r.isFulfilled).length
          } material request(s) are pending fulfillment.`}
          type='warning'
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <AntButton size='small' onClick={() => setActiveTab('inventory')}>
              View Requests
            </AntButton>
          }
        />
      )}

      {/* Detailed Information Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab='Overview' key='overview'>
            <Descriptions bordered column={2}>
              <Descriptions.Item label='Source Alloy'>
                {plan.alloyName}
              </Descriptions.Item>
              <Descriptions.Item label='Target Alloy'>
                {plan.convertName}
              </Descriptions.Item>
              <Descriptions.Item label='Total Quantity'>
                {plan.quantity} units
              </Descriptions.Item>
              <Descriptions.Item label='Priority'>
                {getPriorityTag(plan.urgent)}
              </Descriptions.Item>
              <Descriptions.Item label='Created By'>
                {plan.createdBy}
              </Descriptions.Item>
              <Descriptions.Item label='Last Updated'>
                {new Date(plan.updatedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label='Active Job Cards' span={2}>
                <Space>
                  {jobCards.map(card => (
                    <Tag key={card.id} color={getStepColor(card.prodStep)}>
                      #{card.id} - Step {card.prodStep}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </TabPane>

          <TabPane tab={`Job Cards (${jobCards.length})`} key='jobcards'>
            <Table
              columns={jobCardColumns}
              dataSource={jobCards}
              rowKey='id'
              pagination={{ pageSize: 10 }}
              expandable={{
                expandedRowRender: record => (
                  <div style={{ padding: 16 }}>
                    <Title level={5}>
                      Production Timeline for Job Card #{record.id}
                    </Title>
                    <Steps
                      current={record.prodStep - 1}
                      size='small'
                      direction='vertical'
                      style={{ maxHeight: 300, overflow: 'auto' }}
                    >
                      {PRODUCTION_STEPS.map(step => (
                        <Step
                          key={step.id}
                          title={step.name}
                          icon={step.icon}
                          description={
                            step.id <= record.prodStep
                              ? step.id === record.prodStep
                                ? 'Current Step'
                                : 'Completed'
                              : 'Pending'
                          }
                          status={
                            step.id < record.prodStep
                              ? 'finish'
                              : step.id === record.prodStep
                              ? 'process'
                              : 'wait'
                          }
                        />
                      ))}
                    </Steps>
                  </div>
                )
              }}
            />
          </TabPane>

          <TabPane
            tab={`Material Requests (${inventoryRequests.length})`}
            key='inventory'
          >
            <div style={{ marginBottom: 16 }}>
              <AntButton
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => setMaterialRequestModal(true)}
              >
                New Material Request
              </AntButton>
            </div>
            <Table
              columns={inventoryColumns}
              dataSource={inventoryRequests}
              rowKey='id'
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane
            tab={`Quality Issues (${rejections.length})`}
            key='rejections'
          >
            <List
              dataSource={rejections}
              renderItem={item => (
                <List.Item
                  actions={[
                    item.isResolved ? (
                      <Tag color='success'>Resolved</Tag>
                    ) : (
                      <Space>
                        {item.canBeReworked && (
                          <AntButton type='primary' size='small'>
                            Send for Rework
                          </AntButton>
                        )}
                        <AntButton size='small'>Mark Resolved</AntButton>
                      </Space>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: item.isResolved
                            ? '#52c41a'
                            : item.severity === 'high'
                            ? '#ff4d4f'
                            : item.severity === 'medium'
                            ? '#faad14'
                            : '#1890ff'
                        }}
                        icon={
                          item.isResolved ? <CheckOutlined /> : <BugOutlined />
                        }
                      />
                    }
                    title={
                      <Space>
                        <Text strong>
                          Job Card #{item.prodJobCardId} - {item.step}
                        </Text>
                        <Tag
                          color={
                            item.severity === 'high'
                              ? 'red'
                              : item.severity === 'medium'
                              ? 'orange'
                              : 'blue'
                          }
                        >
                          {item.severity?.toUpperCase()}
                        </Tag>
                        {item.canBeReworked && (
                          <Tag color='green'>Can Rework</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Text>{item.reason}</Text>
                        <br />
                        <Text type='secondary'>
                          Quantity: {item.quantity} units | Reported:{' '}
                          {new Date(item.createdAt).toLocaleDateString()} |
                          Reporter: {item.createdBy}
                        </Text>
                        {item.estimatedReworkTime && (
                          <>
                            <br />
                            <Text type='secondary'>
                              Est. Rework Time: {item.estimatedReworkTime}
                            </Text>
                          </>
                        )}
                        {item.laterAcceptanceReason && (
                          <>
                            <br />
                            <Text type='success'>
                              Resolution: {item.laterAcceptanceReason}
                            </Text>
                          </>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane tab='Production Timeline' key='timeline'>
            <Timeline mode='left'>
              <Timeline.Item
                label={new Date(plan.createdAt).toLocaleString()}
                color='blue'
                dot={<PlusOutlined />}
              >
                <Text strong>Production Plan Created</Text>
                <br />
                <Text type='secondary'>By {plan.createdBy}</Text>
                <br />
                <Text type='secondary'>
                  Convert {plan.quantity} units: {plan.alloyName} →{' '}
                  {plan.convertName}
                </Text>
              </Timeline.Item>

              {inventoryRequests.map(request => (
                <Timeline.Item
                  key={`inv-${request.id}`}
                  label={new Date(request.createdAt).toLocaleString()}
                  color={request.isFulfilled ? 'green' : 'orange'}
                  dot={<ShoppingCartOutlined />}
                >
                  <Text strong>
                    Material Request{' '}
                    {request.autoGenerated ? '(Auto-Generated)' : ''}
                  </Text>
                  <br />
                  <Text type='secondary'>
                    {request.materialType}: {request.sentQuantity || 0}/
                    {request.requestedQuantity} units
                  </Text>
                  <br />
                  <Tag color={request.isFulfilled ? 'success' : 'warning'}>
                    {request.status.toUpperCase()}
                  </Tag>
                </Timeline.Item>
              ))}

              {jobCards.map(jobCard => (
                <Timeline.Item
                  key={`job-${jobCard.id}`}
                  label={new Date(jobCard.createdAt).toLocaleString()}
                  color={jobCard.status === 'completed' ? 'green' : 'blue'}
                  dot={<ToolOutlined />}
                >
                  <Text strong>Job Card #{jobCard.id} Created</Text>
                  <br />
                  <Text type='secondary'>
                    Quantity: {jobCard.quantity} units | Current:{' '}
                    {jobCard.stepName} (Step {jobCard.prodStep}/11)
                  </Text>
                  <br />
                  <Progress
                    percent={jobCard.progress}
                    size='small'
                    style={{ width: 200 }}
                  />
                </Timeline.Item>
              ))}

              {rejections.map(rejection => (
                <Timeline.Item
                  key={`rej-${rejection.id}`}
                  label={new Date(rejection.createdAt).toLocaleString()}
                  color='red'
                  dot={<BugOutlined />}
                >
                  <Text strong>Quality Issue Reported</Text>
                  <br />
                  <Text type='secondary'>
                    Job Card #{rejection.prodJobCardId} at {rejection.step}:{' '}
                    {rejection.reason}
                  </Text>
                  <br />
                  <Tag color='red'>{rejection.severity?.toUpperCase()}</Tag>
                  {rejection.isResolved && <Tag color='green'>RESOLVED</Tag>}
                </Timeline.Item>
              ))}
            </Timeline>
          </TabPane>

          <TabPane tab='QA Reports' key='qa'>
            <List
              dataSource={qaReports}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: '#1890ff' }}
                        icon={<SafetyOutlined />}
                      />
                    }
                    title={`QA Report - Job Card #${item.jobCardId}`}
                    description={
                      <div>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Text strong>Inspector:</Text> {item.qaInspector}
                          </Col>
                          <Col span={8}>
                            <Text strong>Quality Score:</Text>
                            <Progress
                              percent={item.qualityScore}
                              size='small'
                              style={{ marginLeft: 8, width: 100 }}
                            />
                          </Col>
                          <Col span={8}>
                            <Text strong>Date:</Text>{' '}
                            {new Date(item.inspectionDate).toLocaleDateString()}
                          </Col>
                        </Row>
                        <Row gutter={16} style={{ marginTop: 8 }}>
                          <Col span={8}>
                            <Text type='success'>
                              Accepted: {item.acceptedQuantity}
                            </Text>
                          </Col>
                          <Col span={8}>
                            <Text type='danger'>
                              Rejected: {item.rejectedQuantity}
                            </Text>
                          </Col>
                          <Col span={8}>
                            <Text>
                              Total:{' '}
                              {item.acceptedQuantity + item.rejectedQuantity}
                            </Text>
                          </Col>
                        </Row>

                        {/* Inspection Criteria */}
                        {item.inspectionCriteria && (
                          <div style={{ marginTop: 12 }}>
                            <Text strong>Inspection Criteria:</Text>
                            <Row gutter={[8, 8]} style={{ marginTop: 4 }}>
                              {item.inspectionCriteria.map(
                                (criteria, index) => (
                                  <Col span={6} key={index}>
                                    <Card size='small'>
                                      <Text style={{ fontSize: '12px' }}>
                                        {criteria.criterion}
                                      </Text>
                                      <br />
                                      <Text
                                        strong
                                        type={
                                          criteria.passed ? 'success' : 'danger'
                                        }
                                      >
                                        {criteria.score}%
                                      </Text>
                                    </Card>
                                  </Col>
                                )
                              )}
                            </Row>
                          </div>
                        )}

                        {item.notes && (
                          <div style={{ marginTop: 8 }}>
                            <Text strong>Notes:</Text> {item.notes}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* QA Report Modal */}
      <Modal
        title={`QA Report - Job Card #${selectedJobCard?.id}`}
        open={qaReportModal}
        onCancel={() => setQaReportModal(false)}
        footer={null}
        width={600}
      >
        <Form form={qaForm} layout='vertical' onFinish={handleQaReport}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='acceptedQuantity'
                label='Accepted Quantity'
                rules={[
                  { required: true, message: 'Please enter accepted quantity' }
                ]}
              >
                <InputNumber
                  min={0}
                  max={selectedJobCard?.quantity}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='rejectedQuantity'
                label='Rejected Quantity'
                rules={[
                  { required: true, message: 'Please enter rejected quantity' }
                ]}
              >
                <InputNumber
                  min={0}
                  max={selectedJobCard?.quantity}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='rejectionReason' label='Rejection Reason (if any)'>
            <TextArea rows={3} placeholder='Describe any quality issues...' />
          </Form.Item>

          <Form.Item
            name='laterAcceptanceReason'
            label='Later Acceptance Reason (if applicable)'
          >
            <TextArea
              rows={2}
              placeholder='Reason for accepting despite minor issues...'
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <AntButton type='primary' htmlType='submit'>
                Submit QA Report
              </AntButton>
              <AntButton onClick={() => setQaReportModal(false)}>
                Cancel
              </AntButton>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Material Request Modal */}
      <Modal
        title='Create Material Request'
        open={materialRequestModal}
        onCancel={() => setMaterialRequestModal(false)}
        footer={null}
      >
        <Form
          form={materialForm}
          layout='vertical'
          onFinish={handleMaterialRequest}
        >
          <Form.Item
            name='materialType'
            label='Material Type'
            rules={[{ required: true, message: 'Please enter material type' }]}
          >
            <Input placeholder='e.g., PVD Coating Material, Lacquer, etc.' />
          </Form.Item>

          <Form.Item
            name='quantity'
            label='Quantity'
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name='urgent'
            label='Urgent Request'
            valuePropName='checked'
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <AntButton type='primary' htmlType='submit'>
                Create Request
              </AntButton>
              <AntButton onClick={() => setMaterialRequestModal(false)}>
                Cancel
              </AntButton>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Job Card Modal */}
      <Modal
        title='Create New Job Card'
        open={createJobCardModal}
        onCancel={() => setCreateJobCardModal(false)}
        footer={null}
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            name='quantity'
            label='Quantity'
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber
              min={1}
              max={plan?.quantity - (plan?.inProductionQuantity || 0)}
              style={{ width: '100%' }}
              placeholder='Enter quantity for this job card'
            />
          </Form.Item>
          <Form.Item name='notes' label='Notes (Optional)'>
            <TextArea
              rows={3}
              placeholder='Additional notes for this job card...'
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <AntButton type='primary' htmlType='submit'>
                Create Job Card
              </AntButton>
              <AntButton onClick={() => setCreateJobCardModal(false)}>
                Cancel
              </AntButton>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Plan Modal */}
      <Modal
        title='Update Production Plan'
        open={updatePlanModal}
        onCancel={() => setUpdatePlanModal(false)}
        footer={null}
      >
        <Form form={form} layout='vertical' initialValues={plan}>
          <Form.Item name='urgent' label='Priority' valuePropName='checked'>
            <Switch checkedChildren='URGENT' unCheckedChildren='NORMAL' />
          </Form.Item>
          <Form.Item name='note' label='Notes'>
            <TextArea rows={3} placeholder='Update production plan notes...' />
          </Form.Item>
          <Form.Item>
            <Space>
              <AntButton type='primary' htmlType='submit'>
                Update Plan
              </AntButton>
              <AntButton onClick={() => setUpdatePlanModal(false)}>
                Cancel
              </AntButton>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProductionPlanDetails
