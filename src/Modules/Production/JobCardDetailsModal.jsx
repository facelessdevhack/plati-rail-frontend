import React, { useState, useEffect } from 'react'
import {
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Progress,
  Timeline,
  Button,
  Space,
  Divider,
  Statistic,
  Alert,
  Tooltip,
  Badge,
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  notification,
  Tabs,
  Descriptions,
  Avatar,
  List,
  Empty
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  ArrowRightOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  ReloadOutlined,
  ToolOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  TagOutlined,
  WarningOutlined,
  SettingOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  BranchesOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { updateJobCardProgress, getPresetDetails, getJobCardProgress } from '../../redux/api/productionAPI'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs
const { confirm } = Modal

// Default Production Steps Configuration
const DEFAULT_PRODUCTION_STEPS = [
  { id: 1, name: 'Material Request', color: '#722ed1', icon: '📦', description: 'Request and prepare raw materials' },
  { id: 2, name: 'Painting', color: '#eb2f96', icon: '🎨', description: 'Apply base paint coating' },
  { id: 3, name: 'Machining', color: '#faad14', icon: '⚙️', description: 'Machine processing and shaping' },
  { id: 4, name: 'PVD Powder Coating', color: '#fa8c16', icon: '🔧', description: 'Apply powder coating layer' },
  { id: 5, name: 'PVD Process', color: '#a0d911', icon: '⚡', description: 'Physical vapor deposition process' },
  { id: 6, name: 'Milling', color: '#52c41a', icon: '🏭', description: 'Precision milling operations' },
  { id: 7, name: 'Acrylic Coating', color: '#13c2c2', icon: '💧', description: 'Apply acrylic protective layer' },
  { id: 8, name: 'Lacquer Finish', color: '#1890ff', icon: '✨', description: 'Final lacquer coating' },
  { id: 9, name: 'Packaging', color: '#2f54eb', icon: '📋', description: 'Package for shipment' },
  { id: 10, name: 'Quality Check', color: '#f5222d', icon: '🔍', description: 'Final quality inspection' },
  { id: 11, name: 'Dispatch', color: '#389e0d', icon: '🚚', description: 'Ready for delivery' }
]

const JobCardDetailsModal = ({ visible, onCancel, jobCard, onRefresh }) => {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.userDetails || {})
  
  // Local state
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [stepHistory, setStepHistory] = useState([])
  const [qaReports, setQaReports] = useState([])
  const [inventoryRequests, setInventoryRequests] = useState([])
  const [activeTab, setActiveTab] = useState('workflow')
  
  // Preset-related state
  const [presetSteps, setPresetSteps] = useState([])
  const [currentPlanStepId, setCurrentPlanStepId] = useState(null)
  const [jobCardProgress, setJobCardProgress] = useState([])
  const [isPresetBased, setIsPresetBased] = useState(false)
  
  const [form] = Form.useForm()

  // Determine if job card uses preset
  useEffect(() => {
    if (jobCard) {
      const usesPreset = jobCard.presetName && jobCard.stepAssignmentMode === 'preset'
      setIsPresetBased(usesPreset)
    }
  }, [jobCard])

  // Load job card details including preset steps
  useEffect(() => {
    if (visible && jobCard) {
      loadJobCardDetails()
    }
  }, [visible, jobCard])

  const loadJobCardDetails = async () => {
    try {
      setLoading(true)
      
      // Load preset steps if job card uses preset
      if (jobCard.presetName && jobCard.stepAssignmentMode === 'preset') {
        // TEMPORARY: Mock Black Milling preset for demonstration
        // Remove this when backend returns preset data properly
       
          try {
            const presetResult = await dispatch(getPresetDetails({ 
              presetName: jobCard.presetName 
            })).unwrap()
            
            // Handle different response structures
            const steps = presetResult?.data?.steps || presetResult?.steps || presetResult || []
            
            if (Array.isArray(steps) && steps.length > 0) {
              // Create a copy and sort steps by order to avoid frozen array issues
              const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)
              setPresetSteps(sortedSteps)
              console.log(`Loaded ${sortedSteps.length} preset steps for ${jobCard.presetName}`)
            } else {
              console.warn('No preset steps found for:', jobCard.presetName)
              setPresetSteps([])
            }
          } catch (error) {
            console.error('Failed to load preset details:', error)
            // Fallback to default steps
            setPresetSteps([])
          }
      }
      
      // Load job card progress
      try {
        const progressResult = await dispatch(getJobCardProgress(jobCard.id)).unwrap()
        if (progressResult && Array.isArray(progressResult)) {
          setJobCardProgress(progressResult)
          
          // Find current plan step ID from progress
          const currentProgress = progressResult.find(p => 
            p.stepOrder === jobCard.prodStep && p.status !== 'completed'
          )
          if (currentProgress) {
            setCurrentPlanStepId(currentProgress.planStepId || currentProgress.plan_step_id)
          }
        }
      } catch (error) {
        console.error('Failed to load job card progress:', error)
      }
      
      // Simulate loading additional details
      const steps = getProductionSteps()
      // For preset-based, prodStep is the position (1-based), for standard it's the step ID
      const completedStepsCount = Math.min(jobCard.prodStep - 1, steps.length - 1)
      const mockStepHistory = steps.slice(0, completedStepsCount).map((step, index) => ({
        stepId: step.id || step.stepOrder || (index + 1),
        stepName: step.name || step.stepName,
        status: 'completed',
        completedAt: moment().subtract(completedStepsCount - index, 'days').format(),
        completedBy: 'Production Team',
        notes: step.notes || ''
      }))
      setStepHistory(mockStepHistory)
      
      // Load QA reports if any
      if (jobCard.rejectedQuantity > 0) {
        setQaReports([{
          id: 1,
          date: moment().subtract(1, 'day').format(),
          rejectedQuantity: jobCard.rejectedQuantity,
          reason: jobCard.rejectionReason || 'Quality issues detected',
          inspector: 'QA Team'
        }])
      }
      
    } catch (error) {
      console.error('Error loading job card details:', error)
      notification.error({
        message: 'Failed to load details',
        description: 'Some job card details could not be loaded'
      })
    } finally {
      setLoading(false)
    }
  }

  // Get production steps based on preset or default
  const getProductionSteps = () => {
    if (isPresetBased && presetSteps.length > 0) {
      return presetSteps.map((step, index) => ({
        id: step.stepOrder,
        stepOrder: step.stepOrder,
        name: step.stepName,
        stepName: step.stepName,
        description: step.description || step.notes || '',
        estimatedDuration: step.estimatedDuration,
        estimatedDurationUnit: step.estimatedDurationUnit,
        color: getStepColor(index),
        icon: getStepIcon(step.stepName),
        assignedRoles: step.assignedRoles || [],
        qualityChecks: step.qualityChecks || []
      }))
    }
    return DEFAULT_PRODUCTION_STEPS
  }

  // Get step color based on index
  const getStepColor = (index) => {
    const colors = ['#722ed1', '#eb2f96', '#faad14', '#fa8c16', '#a0d911', '#52c41a', '#13c2c2', '#1890ff', '#2f54eb', '#f5222d', '#389e0d']
    return colors[index % colors.length]
  }

  // Get step icon based on name
  const getStepIcon = (stepName) => {
    const iconMap = {
      'material': '📦',
      'paint': '🎨',
      'machine': '⚙️',
      'coating': '🔧',
      'pvd': '⚡',
      'mill': '🏭',
      'acrylic': '💧',
      'lacquer': '✨',
      'pack': '📋',
      'quality': '🔍',
      'dispatch': '🚚',
      'ship': '🚚'
    }
    
    const lowerName = stepName.toLowerCase()
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) return icon
    }
    return '⚡'
  }

  // Handle job card update
  const handleUpdate = async (values) => {
    try {
      setLoading(true)
      
      await dispatch(updateJobCardProgress({
        jobCardId: jobCard.id,
        ...values
      })).unwrap()
      
      notification.success({
        message: 'Job Card Updated',
        description: 'Job card has been updated successfully'
      })
      
      setEditMode(false)
      onRefresh && onRefresh()
      
    } catch (error) {
      notification.error({
        message: 'Update Failed',
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle step progression with preset support
  const handleMoveToNextStep = () => {
    const steps = getProductionSteps()
    
    // Get current and next steps based on whether it's preset-based or standard
    const currentStep = isPresetBased 
      ? (steps[jobCard.prodStep - 1] || steps[0])
      : (steps.find(s => (s.id || s.stepOrder) === jobCard.prodStep) || steps[0])
      
    const nextStep = isPresetBased
      ? steps[jobCard.prodStep]
      : steps.find(s => (s.id || s.stepOrder) === jobCard.prodStep + 1)
      
    const currentStepName = currentStep?.name || currentStep?.stepName || 'Unknown'
    const nextStepName = nextStep?.name || nextStep?.stepName || 'Complete'

    confirm({
      title: 'Move Job Card to Next Step',
      content: (
        <div>
          <p>Move job card #{jobCard.id} from <strong>{currentStepName}</strong> to <strong>{nextStepName}</strong>?</p>
          <div className="text-sm text-gray-600 mt-2">
            <div>Plan: {jobCard.alloyName} → {jobCard.convertName}</div>
            <div>Quantity: {jobCard.quantity?.toLocaleString()}</div>
            {isPresetBased && (
              <div className="mt-2">
                <Tag color="blue" icon={<SettingOutlined />}>
                  Using Preset: {jobCard.presetName}
                </Tag>
              </div>
            )}
          </div>
        </div>
      ),
      okText: 'Move Forward',
      okType: 'primary',
      onOk: async () => {
        try {
          setLoading(true)
          
          // Build update data matching what the backend controller expects
          // The controller expects: jobCardId, prodStep, planStepId (optional), notes (optional)
          const updateData = {
            jobCardId: Number(jobCard.jobcardid || jobCard.id),  // Required
            prodStep: Number(jobCard.prodStep) + 1,               // Move to next step
            notes: ''                                              // Optional notes
          }
          
          // For custom/preset steps, include planStepId if available
          // The backend checks if the job card has custom steps
          if (jobCard.currentPlanStepId) {
            updateData.planStepId = Number(jobCard.currentPlanStepId)
          }
          
          console.log('Updating job card with data:', updateData)
          console.log('Current job card:', jobCard)
          
          await dispatch(updateJobCardProgress(updateData)).unwrap()
          
          notification.success({
            message: 'Step Updated Successfully',
            description: `Job card moved to ${nextStepName}`
          })
          
          onRefresh && onRefresh()
          onCancel()
          
        } catch (error) {
          console.error('Job card update error details:', error)
          
          // Extract more detailed error message
          const errorMessage = error?.message || 
                              error?.error || 
                              error?.details || 
                              error?.statusText ||
                              'Failed to update job card'
          
          notification.error({
            message: 'Update Failed',
            description: errorMessage,
            duration: 5
          })
        } finally {
          setLoading(false)
        }
      }
    })
  }

  if (!jobCard) return null

  const steps = getProductionSteps()
  const totalSteps = steps.length
  
  // For preset-based job cards, prodStep might be an index rather than stepId
  // So we need to get the step by position for presets
  const currentStep = isPresetBased 
    ? (steps[jobCard.prodStep - 1] || steps[0])  // Use index for presets (prodStep is 1-based)
    : (steps.find(s => (s.id || s.stepOrder) === jobCard.prodStep) || steps[0])  // Use ID for standard
    
  const nextStep = isPresetBased
    ? steps[jobCard.prodStep]  // Next step by index for presets
    : steps.find(s => (s.id || s.stepOrder) === jobCard.prodStep + 1)  // Next step by ID for standard
    
  const progress = Math.round((jobCard.prodStep / totalSteps) * 100)
  const isCompleted = jobCard.prodStep >= totalSteps

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onCancel}
      width={1400}
      footer={null}
      className="job-card-details-modal"
      styles={{
        body: { padding: 0 },
        content: { padding: 0, borderRadius: '16px', overflow: 'hidden' }
      }}
    >
      <div className="bg-gray-50">
        {/* Enhanced Hero Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-8">
          <div className="absolute top-4 right-4">
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              onClick={onCancel}
              className="text-white hover:bg-white hover:bg-opacity-20 border-none"
              size="large"
            />
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar 
                    size={64} 
                    style={{ 
                      backgroundColor: jobCard.isUrgent ? '#ff4d4f' : '#1890ff',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}
                  >
                    {jobCard.id}
                  </Avatar>
                  <div>
                    <Title level={2} className="text-white mb-0">
                      Job Card #{jobCard.id}
                    </Title>
                    <div className="flex items-center gap-2 mt-2">
                      {jobCard.isUrgent && (
                        <Tag color="red" icon={<FireOutlined />} className="text-base px-3 py-1">
                          URGENT
                        </Tag>
                      )}
                      {isCompleted && (
                        <Tag color="green" icon={<CheckCircleOutlined />} className="text-base px-3 py-1">
                          COMPLETED
                        </Tag>
                      )}
                      {isPresetBased && (
                        <Tag color="blue" icon={<SettingOutlined />} className="text-base px-3 py-1">
                          PRESET: {jobCard.presetName}
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-white/90 text-lg mb-2">
                  <span className="font-semibold">{jobCard.alloyName}</span>
                  <ArrowRightOutlined className="mx-3" />
                  <span className="font-semibold">{jobCard.convertName}</span>
                </div>
                
                <div className="flex items-center gap-6 text-white/80">
                  <span>
                    <TeamOutlined className="mr-2" />
                    {jobCard.createdBy || 'Production Team'}
                  </span>
                  <span>
                    <CalendarOutlined className="mr-2" />
                    Created {moment(jobCard.createdAt).fromNow()}
                  </span>
                  <span>
                    <DashboardOutlined className="mr-2" />
                    Plan #{jobCard.prodPlanId}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {jobCard.quantity?.toLocaleString()}
                </div>
                <div className="text-white/80">Total Units</div>
                <div className="mt-3">
                  <Progress 
                    type="circle" 
                    percent={progress} 
                    width={80}
                    strokeColor={{
                      '0%': '#fff',
                      '100%': '#87d068',
                    }}
                    trailColor="rgba(255,255,255,0.2)"
                    format={percent => <span className="text-white text-sm">{percent}%</span>}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <div className="p-6">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            size="large"
          >
            <TabPane 
              tab={
                <span>
                  <BranchesOutlined />
                  Workflow
                </span>
              } 
              key="workflow"
            >
              <Row gutter={[24, 24]}>
                {/* Production Steps Visualization */}
                <Col xs={24} lg={14}>
                  <Card 
                    title={
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RocketOutlined className="text-blue-500" />
                          <span>Production Workflow</span>
                          {isPresetBased && (
                            <Tag color="blue" icon={<SettingOutlined />}>
                              {jobCard.presetName} ({totalSteps} steps)
                            </Tag>
                          )}
                        </div>
                        <Tag color={currentStep.color}>
                          Current: {currentStep.name || currentStep.stepName}
                        </Tag>
                      </div>
                    }
                    className="h-full"
                  >
                    {steps.length > 0 ? (
                      <Steps 
                        current={jobCard.prodStep - 1} 
                        direction="vertical"
                        size="small"
                      >
                        {steps.map((step, index) => {
                          const stepId = step.id || step.stepOrder
                          
                          // For preset-based, use index comparison; for standard, use stepId comparison
                          const isActive = isPresetBased 
                            ? (index + 1) === jobCard.prodStep 
                            : stepId === jobCard.prodStep
                          const isCompleted = isPresetBased
                            ? jobCard.prodStep > (index + 1)
                            : jobCard.prodStep > stepId
                          const isPending = isPresetBased
                            ? jobCard.prodStep < (index + 1)
                            : jobCard.prodStep < stepId
                          
                          // Find progress for this step
                          const stepProgress = jobCardProgress.find(p => 
                            p.stepOrder === stepId || p.step_order === stepId
                          )
                          
                          return (
                            <Step
                              key={stepId}
                              title={
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{step.icon}</span>
                                    <span className={`font-medium ${isActive ? 'text-blue-600' : ''}`}>
                                      {step.stepName}
                                    </span>
                                    {step.estimatedDuration && (
                                      <Tag color="cyan" size="small">
                                        {step.estimatedDuration} {step.estimatedDurationUnit || 'hrs'}
                                      </Tag>
                                    )}
                                  </div>
                                  {isCompleted && stepProgress && (
                                    <Text type="secondary" className="text-xs">
                                      {stepProgress.completedAt 
                                        ? moment(stepProgress.completedAt).fromNow()
                                        : `Completed ${moment().subtract(jobCard.prodStep - stepId, 'days').fromNow()}`
                                      }
                                    </Text>
                                  )}
                                </div>
                              }
                              description={
                                <div>
                                  {step.description && (
                                    <Text type="secondary" className="text-xs">
                                      {step.description}
                                    </Text>
                                  )}
                                  {isActive && (
                                    <Alert
                                      message="Currently in progress"
                                      type="info"
                                      showIcon
                                      icon={<SyncOutlined spin />}
                                      className="mt-2"
                                    />
                                  )}
                                  {stepProgress?.notes && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded">
                                      <Text className="text-xs">Note: {stepProgress.notes}</Text>
                                    </div>
                                  )}
                                </div>
                              }
                              status={isCompleted ? 'finish' : isActive ? 'process' : 'wait'}
                              icon={isActive ? <SyncOutlined spin /> : undefined}
                            />
                          )
                        })}
                      </Steps>
                    ) : (
                      <Empty description="No workflow steps available" />
                    )}
                  </Card>
                </Col>

                {/* Right Column - Metrics & Actions */}
                <Col xs={24} lg={10}>
                  <Space direction="vertical" size="large" className="w-full">
                    {/* Production Metrics */}
                    <Card title="Production Metrics">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Accepted"
                            value={jobCard.acceptedQuantity || 0}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<CheckCircleOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Rejected"
                            value={jobCard.rejectedQuantity || 0}
                            valueStyle={{ color: jobCard.rejectedQuantity > 0 ? '#cf1322' : '#8c8c8c' }}
                            prefix={<CloseOutlined />}
                          />
                        </Col>
                      </Row>
                      
                      <Divider />
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Text type="secondary">Completion Rate</Text>
                          <Text strong>{progress}%</Text>
                        </div>
                        <Progress 
                          percent={progress} 
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                        
                        <div className="flex justify-between">
                          <Text type="secondary">Current Step</Text>
                          <Text strong>{jobCard.prodStep} of {totalSteps}</Text>
                        </div>
                        
                        {jobCard.rejectedQuantity > 0 && jobCard.rejectionReason && (
                          <Alert
                            message="Rejection Reason"
                            description={jobCard.rejectionReason}
                            type="warning"
                            showIcon
                            className="mt-4"
                          />
                        )}
                      </div>
                    </Card>

                    {/* Action Buttons */}
                    <Card>
                      <Space direction="vertical" className="w-full">
                        {!isCompleted && (
                          <Button
                            type="primary"
                            icon={<ArrowRightOutlined />}
                            loading={loading}
                            onClick={handleMoveToNextStep}
                            size="large"
                            block
                            className="bg-gradient-to-r from-blue-500 to-purple-500 border-0 hover:from-blue-600 hover:to-purple-600"
                          >
                            Move to {nextStep?.name || nextStep?.stepName || 'Complete'}
                          </Button>
                        )}
                        
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => setEditMode(true)}
                          size="large"
                          block
                        >
                          Edit Job Card
                        </Button>
                        
                        <Button
                          icon={<FileTextOutlined />}
                          size="large"
                          block
                        >
                          Generate Report
                        </Button>
                        
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={loadJobCardDetails}
                          loading={loading}
                          block
                        >
                          Refresh Details
                        </Button>
                      </Space>
                    </Card>
                  </Space>
                </Col>
              </Row>
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <InfoCircleOutlined />
                  Details
                </span>
              } 
              key="details"
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card title="Job Card Information">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Job Card ID">
                        #{jobCard.id}
                      </Descriptions.Item>
                      <Descriptions.Item label="Production Plan">
                        #{jobCard.prodPlanId}
                      </Descriptions.Item>
                      <Descriptions.Item label="Product">
                        {jobCard.alloyName} → {jobCard.convertName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Quantity">
                        {jobCard.quantity?.toLocaleString()} units
                      </Descriptions.Item>
                      <Descriptions.Item label="Assignment Mode">
                        <Tag color={isPresetBased ? 'blue' : 'default'}>
                          {jobCard.stepAssignmentMode || 'Manual'}
                        </Tag>
                      </Descriptions.Item>
                      {isPresetBased && (
                        <Descriptions.Item label="Preset">
                          <Tag color="blue" icon={<SettingOutlined />}>
                            {jobCard.presetName}
                          </Tag>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Priority">
                        {jobCard.isUrgent ? (
                          <Tag color="red" icon={<FireOutlined />}>URGENT</Tag>
                        ) : (
                          <Tag color="default">Normal</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Created By">
                        {jobCard.createdBy || 'System'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Created">
                        {moment(jobCard.createdAt).format('MMM DD, YYYY HH:mm')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Last Updated">
                        {moment(jobCard.updatedAt || jobCard.createdAt).fromNow()}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  {/* QA Reports */}
                  {qaReports.length > 0 && (
                    <Card title="Quality Assurance Reports" className="mb-6">
                      <Timeline>
                        {qaReports.map(report => (
                          <Timeline.Item 
                            key={report.id}
                            color="red"
                            dot={<ExclamationCircleOutlined />}
                          >
                            <div>
                              <Text strong>{report.rejectedQuantity} units rejected</Text>
                              <br />
                              <Text type="secondary">{report.reason}</Text>
                              <br />
                              <Text type="secondary" className="text-xs">
                                {moment(report.date).format('MMM DD, YYYY')} by {report.inspector}
                              </Text>
                            </div>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </Card>
                  )}

                  {/* Partial Quantity Info */}
                  {jobCard.isPartialQuantity && (
                    <Card title="Partial Quantity Information">
                      <Alert
                        message="Partial Quantity Job Card"
                        description={jobCard.reason || 'This is a partial quantity job card'}
                        type="info"
                        showIcon
                      />
                    </Card>
                  )}
                </Col>
              </Row>
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <HistoryOutlined />
                  History
                </span>
              } 
              key="history"
            >
              <Card title="Step Completion History">
                {stepHistory.length > 0 ? (
                  <Timeline mode="left">
                    {stepHistory.map((history, index) => (
                      <Timeline.Item 
                        key={history.stepId}
                        color="green"
                        label={moment(history.completedAt).format('MMM DD, HH:mm')}
                      >
                        <div>
                          <Text strong>{history.stepName}</Text>
                          <br />
                          <Text type="secondary">Completed by {history.completedBy}</Text>
                          {history.notes && (
                            <>
                              <br />
                              <Text className="text-xs">{history.notes}</Text>
                            </>
                          )}
                        </div>
                      </Timeline.Item>
                    ))}
                    <Timeline.Item color="blue" dot={<SyncOutlined spin />}>
                      <Text strong>Current: {currentStep.name || currentStep.stepName}</Text>
                      <br />
                      <Text type="secondary">In Progress</Text>
                    </Timeline.Item>
                  </Timeline>
                ) : (
                  <Empty description="No history available" />
                )}
              </Card>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </Modal>
  )
}

export default JobCardDetailsModal