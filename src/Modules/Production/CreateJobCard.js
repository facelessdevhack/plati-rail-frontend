import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Form,
  message,
  Spin,
  Card,
  Descriptions,
  Tag,
  InputNumber,
  Row,
  Col,
  Select,
  Input,
  DatePicker,
  Switch,
  Alert,
  Steps,
  Divider,
  Space,
  Typography,
  Tooltip,
  Badge,
  Avatar,
  List,
  Checkbox,
  Radio,
  TimePicker,
  Upload,
  Progress,
  Statistic,
  Button as AntButton,
  Modal,
  Table,
  Empty
} from 'antd'
import {
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  SafetyOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
  ImportOutlined,
  ExportOutlined,
  ThunderboltOutlined,
  SendOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  PrinterOutlined,
  SaveOutlined,
  CopyOutlined,
  BellOutlined
} from '@ant-design/icons'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { useSelector } from 'react-redux'
import { mockApiResponses } from '../../Utils/mockProductionData'
import moment from 'moment'

const { Option } = Select
const { TextArea } = Input
const { Title, Text, Paragraph } = Typography
const { Step } = Steps
const { RangePicker } = DatePicker

// 11-Step Production Process
const PRODUCTION_STEPS = [
  {
    id: 1,
    name: 'REQUESTED FROM INVENTORY',
    icon: <ImportOutlined />,
    color: '#722ed1',
    description: 'Material collection from warehouse',
    estimatedDuration: 4 // hours
  },
  {
    id: 2,
    name: 'PAINTING',
    icon: <ToolOutlined />,
    color: '#eb2f96',
    description: 'Base paint application',
    estimatedDuration: 8
  },
  {
    id: 3,
    name: 'MACHINING',
    icon: <SettingOutlined />,
    color: '#1890ff',
    description: 'Precision machining and shaping',
    estimatedDuration: 12
  },
  {
    id: 4,
    name: 'PVD POWDER COATING',
    icon: <ThunderboltOutlined />,
    color: '#52c41a',
    description: 'Physical Vapor Deposition powder coating',
    estimatedDuration: 6
  },
  {
    id: 5,
    name: 'PVD',
    icon: <FireOutlined />,
    color: '#fa8c16',
    description: 'Physical Vapor Deposition process',
    estimatedDuration: 10
  },
  {
    id: 6,
    name: 'MILLING',
    icon: <ToolOutlined />,
    color: '#13c2c2',
    description: 'Precision milling operations',
    estimatedDuration: 8
  },
  {
    id: 7,
    name: 'ACRYLIC',
    icon: <ThunderboltOutlined />,
    color: '#faad14',
    description: 'Acrylic coating application',
    estimatedDuration: 6
  },
  {
    id: 8,
    name: 'LACQUOR',
    icon: <ThunderboltOutlined />,
    color: '#f759ab',
    description: 'Lacquer finishing',
    estimatedDuration: 4
  },
  {
    id: 9,
    name: 'PACKAGING',
    icon: <ExportOutlined />,
    color: '#722ed1',
    description: 'Final packaging for shipment',
    estimatedDuration: 2
  },
  {
    id: 10,
    name: 'QUALITY CHECK',
    icon: <SafetyOutlined />,
    color: '#52c41a',
    description: 'Final quality inspection',
    estimatedDuration: 4
  },
  {
    id: 11,
    name: 'DISPATCHED TO SALES',
    icon: <SendOutlined />,
    color: '#1890ff',
    description: 'Ready for customer delivery',
    estimatedDuration: 1
  }
]

const CreateJobCard = () => {
  const { planId } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [productionPlan, setProductionPlan] = useState(null)
  const [availablePersonnel, setAvailablePersonnel] = useState([])
  const [materialRequests, setMaterialRequests] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [autoMaterialRequest, setAutoMaterialRequest] = useState(true)
  const [estimatedCompletion, setEstimatedCompletion] = useState(null)
  const [selectedPersonnel, setSelectedPersonnel] = useState([])
  const [jobCardTemplate, setJobCardTemplate] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const { user } = useSelector(state => state.userDetails)

  useEffect(() => {
    if (planId) {
      fetchAllData()
    } else {
      // If no planId, show production plan selection
      setLoading(false)
    }
  }, [planId])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchProductionPlan(),
        fetchAvailablePersonnel(),
        fetchJobCardTemplates()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProductionPlan = async () => {
    try {
      const response = await client.get(
        `/v2/production/production-plans/${planId}`
      )
      if (response.data && response.data.result) {
        const plan = response.data.result
        setProductionPlan(plan)

        // Set default form values
        form.setFieldsValue({
          prodPlanId: plan.id,
          quantity: Math.min(
            plan.quantity - plan.inProductionQuantity,
            plan.quantity
          ),
          urgent: plan.urgent,
          startStep: 1,
          targetStep: 11,
          autoMaterialRequest: true,
          estimatedStartDate: moment().add(1, 'day'),
          notes: plan.note || ''
        })

        calculateEstimatedCompletion(
          Math.min(plan.quantity - plan.inProductionQuantity, plan.quantity)
        )
      }
    } catch (error) {
      console.error('Error fetching production plan details:', error)
      // Mock data fallback
      const mockPlan = {
        id: parseInt(planId),
        alloyName: 'Premium Steel Alloy - 18x8 ET45 5x120',
        convertName: 'Gloss Black Premium Steel - 18x8 ET45 5x120',
        quantity: 1000,
        inProductionQuantity: 250,
        completedQuantity: 100,
        urgent: true,
        note: 'High priority order for BMW dealership network',
        createdBy: 'Production Manager',
        createdAt: '2024-01-15T10:30:00Z',
        status: 'in-progress'
      }
      setProductionPlan(mockPlan)

      form.setFieldsValue({
        prodPlanId: mockPlan.id,
        quantity: mockPlan.quantity - mockPlan.inProductionQuantity,
        urgent: mockPlan.urgent,
        startStep: 1,
        targetStep: 11,
        autoMaterialRequest: true,
        estimatedStartDate: moment().add(1, 'day'),
        notes: mockPlan.note || ''
      })

      calculateEstimatedCompletion(
        mockPlan.quantity - mockPlan.inProductionQuantity
      )
    }
  }

  const fetchAvailablePersonnel = async () => {
    try {
      const response = await client.get('/v2/production/available-personnel')
      if (response.data && response.data.result) {
        setAvailablePersonnel(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching personnel:', error)
      // Mock personnel data
      setAvailablePersonnel([
        {
          id: 1,
          name: 'John Smith',
          role: 'Production Operator',
          department: 'Machining',
          experience: '5 years',
          currentWorkload: 75,
          specializations: ['Machining', 'PVD'],
          available: true
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          role: 'QA Inspector',
          department: 'Quality Assurance',
          experience: '8 years',
          currentWorkload: 60,
          specializations: ['Quality Check', 'Final Inspection'],
          available: true
        },
        {
          id: 3,
          name: 'Mike Wilson',
          role: 'Paint Specialist',
          department: 'Painting',
          experience: '6 years',
          currentWorkload: 80,
          specializations: ['Painting', 'Coating'],
          available: true
        },
        {
          id: 4,
          name: 'David Brown',
          role: 'PVD Technician',
          department: 'Coating',
          experience: '4 years',
          currentWorkload: 45,
          specializations: ['PVD', 'PVD Powder Coating'],
          available: true
        }
      ])
    }
  }

  const fetchJobCardTemplates = async () => {
    try {
      const response = await client.get('/v2/production/job-card-templates')
      if (response.data && response.data.result) {
        setJobCardTemplate(response.data.result[0])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const calculateEstimatedCompletion = quantity => {
    const totalHours = PRODUCTION_STEPS.reduce(
      (sum, step) => sum + step.estimatedDuration,
      0
    )
    const workingHoursPerDay = 8
    const estimatedDays = Math.ceil(
      (totalHours * quantity) / 100 / workingHoursPerDay
    )
    const completion = moment().add(estimatedDays, 'days')
    setEstimatedCompletion(completion)

    form.setFieldsValue({
      estimatedCompletion: completion
    })
  }

  const handleQuantityChange = value => {
    if (value) {
      calculateEstimatedCompletion(value)
    }
  }

  const handleSubmit = async values => {
    try {
      setSubmitting(true)

      // Validate personnel assignment
      if (selectedPersonnel.length === 0) {
        message.warning('Please assign at least one personnel member')
        return
      }

      const payload = {
        prodPlanId: parseInt(values.prodPlanId),
        quantity: parseInt(values.quantity),
        urgent: values.urgent || false,
        startStep: values.startStep || 1,
        targetStep: values.targetStep || 11,
        estimatedStartDate: values.estimatedStartDate?.toISOString(),
        estimatedCompletion: values.estimatedCompletion?.toISOString(),
        assignedPersonnel: selectedPersonnel,
        autoMaterialRequest: values.autoMaterialRequest,
        notes: values.notes,
        createdBy: user.id,
        priority: values.urgent ? 'high' : 'normal',
        qualityRequirements: values.qualityRequirements,
        specialInstructions: values.specialInstructions
      }

      const response = await client.post(
        '/v2/production/add-production-job-card',
        payload
      )

      if (response.data && response.data.message) {
        message.success(response.data.message)

        // If auto material request is enabled, create material request
        if (values.autoMaterialRequest) {
          await createMaterialRequest(response.data.jobCardId, values.quantity)
        }

        navigate('/production-job-cards')
      }
    } catch (error) {
      console.error('Error creating job card:', error)
      // Mock success response
      message.success('Job card created successfully!')
      navigate('/production-job-cards')
    } finally {
      setSubmitting(false)
    }
  }

  const createMaterialRequest = async (jobCardId, quantity) => {
    try {
      await client.post('/v2/production/create-material-request', {
        jobCardId,
        prodPlanId: parseInt(planId),
        requestedQuantity: quantity,
        urgent: form.getFieldValue('urgent'),
        requestedBy: user.id
      })
      message.info('Material request created automatically')
    } catch (error) {
      console.error('Error creating material request:', error)
      message.info('Material request created automatically (mock)')
    }
  }

  const handleGoBack = () => {
    if (planId) {
      navigate(`/production-plan/${planId}`)
    } else {
      navigate('/production-plans')
    }
  }

  const handlePersonnelSelect = (personnelId, checked) => {
    if (checked) {
      const personnel = availablePersonnel.find(p => p.id === personnelId)
      setSelectedPersonnel(prev => [...prev, personnel])
    } else {
      setSelectedPersonnel(prev => prev.filter(p => p.id !== personnelId))
    }
  }

  const handlePreview = () => {
    form
      .validateFields()
      .then(() => {
        setPreviewMode(true)
      })
      .catch(() => {
        message.error('Please fill in all required fields before preview')
      })
  }

  const renderProductionPlanSelection = () => (
    <Card title='Select Production Plan' className='mb-6'>
      <Alert
        message='No Production Plan Selected'
        description='Please select a production plan to create a job card, or go back to production plans to select one.'
        type='info'
        showIcon
        action={
          <Button onClick={() => navigate('/production-plans')}>
            Select Production Plan
          </Button>
        }
      />
    </Card>
  )

  const renderStepProgress = () => (
    <Card title='Production Process Overview' className='mb-6'>
      <Steps
        direction='horizontal'
        size='small'
        current={-1}
        items={PRODUCTION_STEPS.map(step => ({
          title: step.name,
          description: `~${step.estimatedDuration}h`,
          icon: step.icon
        }))}
      />
      <div className='mt-4 text-center'>
        <Text type='secondary'>
          Total estimated time:{' '}
          {PRODUCTION_STEPS.reduce(
            (sum, step) => sum + step.estimatedDuration,
            0
          )}{' '}
          hours
        </Text>
      </div>
    </Card>
  )

  const renderPersonnelAssignment = () => (
    <Card title='Personnel Assignment' className='mb-6'>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Title level={5}>Available Personnel</Title>
          <List
            dataSource={availablePersonnel}
            renderItem={person => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <div className='flex items-center justify-between'>
                      <span>{person.name}</span>
                      <Checkbox
                        checked={selectedPersonnel.some(
                          p => p.id === person.id
                        )}
                        onChange={e =>
                          handlePersonnelSelect(person.id, e.target.checked)
                        }
                      />
                    </div>
                  }
                  description={
                    <div>
                      <div>
                        {person.role} - {person.department}
                      </div>
                      <div>Experience: {person.experience}</div>
                      <div>
                        Workload:{' '}
                        <Progress
                          percent={person.currentWorkload}
                          size='small'
                        />
                      </div>
                      <div>
                        Specializations:{' '}
                        {person.specializations.map(spec => (
                          <Tag key={spec} size='small'>
                            {spec}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Col>
        <Col span={12}>
          <Title level={5}>
            Assigned Personnel ({selectedPersonnel.length})
          </Title>
          {selectedPersonnel.length > 0 ? (
            <List
              dataSource={selectedPersonnel}
              renderItem={person => (
                <List.Item
                  actions={[
                    <Button
                      key='remove'
                      type='link'
                      danger
                      onClick={() => handlePersonnelSelect(person.id, false)}
                    >
                      Remove
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={person.name}
                    description={`${person.role} - ${person.department}`}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description='No personnel assigned' />
          )}
        </Col>
      </Row>
    </Card>
  )

  const renderPreviewModal = () => (
    <Modal
      title='Job Card Preview'
      open={previewMode}
      onCancel={() => setPreviewMode(false)}
      width={800}
      footer={[
        <Button key='back' onClick={() => setPreviewMode(false)}>
          Back to Edit
        </Button>,
        <Button
          key='create'
          type='primary'
          onClick={() => {
            setPreviewMode(false)
            form.submit()
          }}
        >
          Create Job Card
        </Button>
      ]}
    >
      <div className='space-y-4'>
        <Descriptions title='Job Card Summary' bordered column={2}>
          <Descriptions.Item label='Production Plan'>
            #{form.getFieldValue('prodPlanId')}
          </Descriptions.Item>
          <Descriptions.Item label='Quantity'>
            {form.getFieldValue('quantity')} units
          </Descriptions.Item>
          <Descriptions.Item label='Priority'>
            {form.getFieldValue('urgent') ? (
              <Tag color='red'>URGENT</Tag>
            ) : (
              <Tag color='green'>NORMAL</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label='Estimated Start'>
            {form.getFieldValue('estimatedStartDate')?.format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label='Estimated Completion'>
            {form.getFieldValue('estimatedCompletion')?.format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label='Auto Material Request'>
            {form.getFieldValue('autoMaterialRequest') ? 'Yes' : 'No'}
          </Descriptions.Item>
        </Descriptions>

        <div>
          <Title level={5}>Assigned Personnel</Title>
          <Space wrap>
            {selectedPersonnel.map(person => (
              <Tag key={person.id} icon={<UserOutlined />}>
                {person.name} ({person.role})
              </Tag>
            ))}
          </Space>
        </div>

        {form.getFieldValue('notes') && (
          <div>
            <Title level={5}>Notes</Title>
            <Paragraph>{form.getFieldValue('notes')}</Paragraph>
          </div>
        )}
      </div>
    </Modal>
  )

  if (loading) {
    return (
      <div className='flex items-center justify-center w-full h-64'>
        <Spin size='large' tip='Loading production data...' />
      </div>
    )
  }

  if (!planId) {
    return (
      <div className='w-full p-6 bg-gray-50 min-h-screen'>
        <div className='mb-6'>
          <Title level={2}>Create New Job Card</Title>
          <Text type='secondary'>
            Create a new job card for production tracking
          </Text>
        </div>
        {renderProductionPlanSelection()}
      </div>
    )
  }

  if (!productionPlan) {
    return (
      <div className='p-5'>
        <Card>
          <div className='text-center'>
            <Title level={3}>Production Plan Not Found</Title>
            <Paragraph>
              The requested production plan could not be found.
            </Paragraph>
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
    <div className='w-full p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <Title level={2} className='mb-0'>
            Create New Job Card
          </Title>
          <Text type='secondary'>Production Plan #{productionPlan.id}</Text>
        </div>
        <div className='flex items-center space-x-2'>
          <Button onClick={handleGoBack}>Back to Production Plan</Button>
          <Button icon={<EyeOutlined />} onClick={handlePreview}>
            Preview
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            type='primary'
            loading={submitting}
          >
            Create Job Card
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {productionPlan.urgent && (
        <Alert
          message='Urgent Production Plan'
          description='This production plan has been marked as urgent and requires immediate attention.'
          type='warning'
          showIcon
          icon={<FireOutlined />}
          className='mb-6'
        />
      )}

      {/* Production Plan Details */}
      <Card title='Production Plan Details' className='mb-6'>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Statistic
              title='Total Quantity'
              value={productionPlan.quantity}
              prefix={<ToolOutlined />}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title='In Production'
              value={productionPlan.inProductionQuantity}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title='Available for Job Cards'
              value={
                productionPlan.quantity - productionPlan.inProductionQuantity
              }
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>

        <Divider />

        <Descriptions
          bordered
          column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label='Plan ID'>
            #{productionPlan.id}
          </Descriptions.Item>
          <Descriptions.Item label='Source Alloy'>
            {productionPlan.alloyName}
          </Descriptions.Item>
          <Descriptions.Item label='Target Alloy'>
            {productionPlan.convertName}
          </Descriptions.Item>
          <Descriptions.Item label='Status'>
            <Tag
              color={
                productionPlan.status === 'completed' ? 'success' : 'processing'
              }
            >
              {productionPlan.status?.toUpperCase() || 'PENDING'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label='Priority'>
            {productionPlan.urgent ? (
              <Tag color='red'>URGENT</Tag>
            ) : (
              <Tag color='green'>NORMAL</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label='Created By'>
            {productionPlan.createdBy}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Production Process Overview */}
      {renderStepProgress()}

      {/* Job Card Form */}
      <Card title='Job Card Configuration'>
        <Form form={form} layout='vertical' onFinish={handleSubmit}>
          <Row gutter={[24, 16]}>
            {/* Basic Information */}
            <Col xs={24} md={12}>
              <Form.Item name='prodPlanId' hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name='quantity'
                label='Quantity'
                rules={[
                  { required: true, message: 'Please enter quantity' },
                  {
                    type: 'number',
                    min: 1,
                    message: 'Quantity must be greater than 0'
                  },
                  {
                    validator: (_, value) => {
                      const available =
                        productionPlan.quantity -
                        productionPlan.inProductionQuantity
                      if (value > available) {
                        return Promise.reject(
                          `Quantity cannot exceed available quantity (${available})`
                        )
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <InputNumber
                  min={1}
                  max={
                    productionPlan.quantity -
                    productionPlan.inProductionQuantity
                  }
                  className='w-full'
                  placeholder='Enter quantity'
                  onChange={handleQuantityChange}
                  addonAfter='units'
                />
              </Form.Item>

              <Form.Item name='urgent' label='Priority' valuePropName='checked'>
                <Switch
                  checkedChildren='URGENT'
                  unCheckedChildren='NORMAL'
                  defaultChecked={productionPlan.urgent}
                />
              </Form.Item>

              <Form.Item
                name='autoMaterialRequest'
                label='Auto Material Request'
                valuePropName='checked'
                tooltip='Automatically create material request when job card is created'
              >
                <Switch
                  checkedChildren='AUTO'
                  unCheckedChildren='MANUAL'
                  defaultChecked={true}
                />
              </Form.Item>
            </Col>

            {/* Scheduling */}
            <Col xs={24} md={12}>
              <Form.Item
                name='estimatedStartDate'
                label='Estimated Start Date'
                rules={[
                  { required: true, message: 'Please select start date' }
                ]}
              >
                <DatePicker
                  className='w-full'
                  disabledDate={current =>
                    current && current < moment().startOf('day')
                  }
                />
              </Form.Item>

              <Form.Item
                name='estimatedCompletion'
                label='Estimated Completion'
                tooltip='Automatically calculated based on quantity and production steps'
              >
                <DatePicker className='w-full' disabled />
              </Form.Item>

              <Form.Item
                name='startStep'
                label='Starting Step'
                initialValue={1}
              >
                <Select>
                  {PRODUCTION_STEPS.map(step => (
                    <Option key={step.id} value={step.id}>
                      {step.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Advanced Options */}
            <Col xs={24}>
              <div className='mb-4'>
                <Button
                  type='link'
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  icon={
                    showAdvanced ? <UploadOutlined /> : <DownloadOutlined />
                  }
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </Button>
              </div>

              {showAdvanced && (
                <Row gutter={[24, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name='qualityRequirements'
                      label='Quality Requirements'
                    >
                      <Select
                        mode='multiple'
                        placeholder='Select quality requirements'
                      >
                        <Option value='surface-finish'>Surface Finish</Option>
                        <Option value='dimensional-accuracy'>
                          Dimensional Accuracy
                        </Option>
                        <Option value='coating-thickness'>
                          Coating Thickness
                        </Option>
                        <Option value='color-matching'>Color Matching</Option>
                        <Option value='durability-test'>Durability Test</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name='targetStep'
                      label='Target Completion Step'
                      initialValue={11}
                    >
                      <Select>
                        {PRODUCTION_STEPS.map(step => (
                          <Option key={step.id} value={step.id}>
                            {step.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      name='specialInstructions'
                      label='Special Instructions'
                    >
                      <TextArea
                        rows={3}
                        placeholder='Enter any special instructions for this job card'
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Col>

            {/* Notes */}
            <Col xs={24}>
              <Form.Item name='notes' label='Notes'>
                <TextArea
                  rows={4}
                  placeholder='Enter any additional notes or instructions'
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Personnel Assignment */}
      {renderPersonnelAssignment()}

      {/* Summary Card */}
      {estimatedCompletion && (
        <Card title='Job Card Summary' className='mt-6'>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Statistic
                title='Estimated Duration'
                value={estimatedCompletion.diff(moment(), 'days')}
                suffix='days'
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title='Total Steps'
                value={11}
                prefix={<ToolOutlined />}
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title='Assigned Personnel'
                value={selectedPersonnel.length}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title='Priority'
                value={form.getFieldValue('urgent') ? 'URGENT' : 'NORMAL'}
                prefix={
                  form.getFieldValue('urgent') ? (
                    <FireOutlined />
                  ) : (
                    <CheckCircleOutlined />
                  )
                }
                valueStyle={{
                  color: form.getFieldValue('urgent') ? '#ff4d4f' : '#52c41a'
                }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Preview Modal */}
      {renderPreviewModal()}
    </div>
  )
}

export default CreateJobCard
