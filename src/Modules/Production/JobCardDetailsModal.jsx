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
  notification
} from 'antd'
import {
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  FireOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  HistoryOutlined,
  QrcodeOutlined
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import moment from 'moment'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps
const { TextArea } = Input
const { Option } = Select

// Production Steps Configuration
const PRODUCTION_STEPS = [
  { id: 1, name: 'Material Request', color: '#722ed1', icon: '📦', description: 'Material requested from inventory' },
  { id: 2, name: 'Painting', color: '#eb2f96', icon: '🎨', description: 'Base paint application' },
  { id: 3, name: 'Machining', color: '#faad14', icon: '⚙️', description: 'Initial shaping and precision work' },
  { id: 4, name: 'PVD Powder Coating', color: '#fa8c16', icon: '🔧', description: 'Specialized powder coating' },
  { id: 5, name: 'PVD Process', color: '#a0d911', icon: '⚡', description: 'Physical Vapor Deposition' },
  { id: 6, name: 'Milling', color: '#52c41a', icon: '🏭', description: 'Precision milling operations' },
  { id: 7, name: 'Acrylic Coating', color: '#13c2c2', icon: '💧', description: 'Acrylic protective coating' },
  { id: 8, name: 'Lacquer Finish', color: '#1890ff', icon: '✨', description: 'Lacquer finishing' },
  { id: 9, name: 'Packaging', color: '#2f54eb', icon: '📋', description: 'Final packaging' },
  { id: 10, name: 'Quality Check', color: '#f5222d', icon: '🔍', description: 'Final inspection' },
  { id: 11, name: 'Dispatch', color: '#389e0d', icon: '🚚', description: 'Ready for delivery' }
]

const JobCardDetailsModal = ({ visible, onCancel, jobCard, onRefresh }) => {
  const { user } = useSelector(state => state.userDetails || {})
  
  // Local state
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [stepHistory, setStepHistory] = useState([])
  const [qaReports, setQaReports] = useState([])
  const [inventoryRequests, setInventoryRequests] = useState([])
  
  // Form for editing
  const [form] = Form.useForm()

  // Load additional data when modal opens
  useEffect(() => {
    if (visible && jobCard) {
      loadJobCardDetails()
      form.setFieldsValue({
        quantity: jobCard.quantity,
        notes: jobCard.notes || ''
      })
    }
  }, [visible, jobCard, form])

  // Load detailed job card information
  const loadJobCardDetails = async () => {
    try {
      setLoading(true)
      
      // Load step history
      const historyResponse = await fetch(`/v2/production/job-card/${jobCard.id}/history`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      })
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setStepHistory(historyData.history || [])
      }

      // Load QA reports
      const qaResponse = await fetch(`/v2/production/job-card/${jobCard.id}/qa-reports`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      })
      
      if (qaResponse.ok) {
        const qaData = await qaResponse.json()
        setQaReports(qaData.reports || [])
      }

      // Load inventory requests
      const inventoryResponse = await fetch(`/v2/production/job-card/${jobCard.id}/inventory-requests`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      })
      
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json()
        setInventoryRequests(inventoryData.requests || [])
      }
    } catch (error) {
      console.error('Error loading job card details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle job card update
  const handleUpdate = async (values) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/v2/production/job-card/${jobCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          quantity: values.quantity,
          notes: values.notes
        })
      })

      if (response.ok) {
        notification.success({
          message: 'Job Card Updated',
          description: 'Job card details have been updated successfully'
        })
        setEditMode(false)
        onRefresh && onRefresh()
      } else {
        throw new Error('Failed to update job card')
      }
    } catch (error) {
      notification.error({
        message: 'Update Failed',
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle step progression
  const handleMoveToNextStep = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/v2/production/update-production-job-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          jobCardId: jobCard.id,
          prodStep: jobCard.prodStep + 1
        })
      })

      if (response.ok) {
        const nextStepName = PRODUCTION_STEPS.find(s => s.id === jobCard.prodStep + 1)?.name || 'Complete'
        notification.success({
          message: 'Step Updated',
          description: `Job card moved to ${nextStepName}`
        })
        onRefresh && onRefresh()
        onCancel() // Close modal after successful update
      } else {
        throw new Error('Failed to update step')
      }
    } catch (error) {
      notification.error({
        message: 'Update Failed',
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  if (!jobCard) return null

  const currentStep = PRODUCTION_STEPS.find(s => s.id === jobCard.prodStep) || PRODUCTION_STEPS[0]
  const nextStep = PRODUCTION_STEPS.find(s => s.id === jobCard.prodStep + 1)
  const progress = Math.round((jobCard.prodStep / 11) * 100)
  const isCompleted = jobCard.prodStep >= 11

  // QA Summary
  const qaData = qaReports.length > 0 ? qaReports[qaReports.length - 1] : null
  const totalAccepted = qaReports.reduce((sum, qa) => sum + (qa.acceptedQuantity || 0), 0)
  const totalRejected = qaReports.reduce((sum, qa) => sum + (qa.rejectedQuantity || 0), 0)

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <QrcodeOutlined className="text-blue-500" />
          <span>Job Card #{jobCard.id} Details</span>
          {jobCard.isUrgent && (
            <Tag color="red" icon={<FireOutlined />}>
              URGENT
            </Tag>
          )}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={
        <div className="flex items-center justify-between">
          <Space>
            <Button onClick={onCancel}>Close</Button>
            {editMode ? (
              <>
                <Button 
                  icon={<CloseOutlined />} 
                  onClick={() => {
                    setEditMode(false)
                    form.resetFields()
                  }}
                >
                  Cancel Edit
                </Button>
                <Button 
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={loading}
                  onClick={() => form.submit()}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button 
                icon={<EditOutlined />}
                onClick={() => setEditMode(true)}
              >
                Edit Job Card
              </Button>
            )}
          </Space>
          <Space>
            {!isCompleted && (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                loading={loading}
                onClick={handleMoveToNextStep}
              >
                Move to {nextStep?.name || 'Complete'}
              </Button>
            )}
          </Space>
        </div>
      }
      className="job-card-details-modal"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <Row gutter={[24, 24]}>
          <Col span={16}>
            <Card title="Job Card Information" size="small">
              {editMode ? (
                <Form form={form} layout="vertical" onFinish={handleUpdate}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Production Plan"
                      >
                        <Input 
                          value={`#${jobCard.prodPlanId} - ${jobCard.alloyName} → ${jobCard.convertName}`}
                          disabled
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="quantity"
                        label="Quantity"
                        rules={[
                          { required: true, message: 'Please enter quantity' },
                          { type: 'number', min: 1, message: 'Quantity must be at least 1' }
                        ]}
                      >
                        <InputNumber
                          min={1}
                          className="w-full"
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="notes"
                        label="Notes"
                      >
                        <TextArea 
                          rows={3}
                          placeholder="Optional notes for this job card..."
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              ) : (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div className="space-y-3">
                      <div>
                        <Text className="text-gray-600">Production Plan:</Text>
                        <div className="font-medium">#{jobCard.prodPlanId}</div>
                      </div>
                      <div>
                        <Text className="text-gray-600">Source Alloy:</Text>
                        <div className="font-medium">{jobCard.alloyName}</div>
                      </div>
                      <div>
                        <Text className="text-gray-600">Convert To:</Text>
                        <div className="font-medium">{jobCard.convertName}</div>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-3">
                      <div>
                        <Text className="text-gray-600">Quantity:</Text>
                        <div className="font-medium">{jobCard.quantity?.toLocaleString()}</div>
                      </div>
                      <div>
                        <Text className="text-gray-600">Created:</Text>
                        <div className="font-medium">{moment(jobCard.createdAt).format('MMM DD, YYYY HH:mm')}</div>
                      </div>
                      <div>
                        <Text className="text-gray-600">Created By:</Text>
                        <div className="font-medium">{jobCard.createdBy || 'System'}</div>
                      </div>
                    </div>
                  </Col>
                  {jobCard.notes && (
                    <Col span={24}>
                      <div>
                        <Text className="text-gray-600">Notes:</Text>
                        <div className="mt-1 p-3 bg-gray-50 rounded">
                          {jobCard.notes}
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              )}
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="Current Status" size="small">
              <div className="text-center space-y-4">
                <div>
                  <div className="text-3xl mb-2">{currentStep.icon}</div>
                  <Title level={4} style={{ color: currentStep.color, margin: 0 }}>
                    {currentStep.name}
                  </Title>
                  <Text className="text-gray-600">{currentStep.description}</Text>
                </div>
                
                <div>
                  <Progress
                    type="circle"
                    percent={progress}
                    strokeColor={currentStep.color}
                    format={() => `${jobCard.prodStep}/11`}
                  />
                </div>
                
                <div>
                  <Statistic
                    title="Progress"
                    value={progress}
                    suffix="%"
                    valueStyle={{ color: currentStep.color }}
                  />
                </div>

                {isCompleted && (
                  <Alert
                    message="Job Card Completed"
                    description="This job card has completed all production steps"
                    type="success"
                    icon={<CheckCircleOutlined />}
                  />
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Quality Assurance Summary */}
        {qaReports.length > 0 && (
          <Card title="Quality Assurance Summary" size="small">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="Total Accepted"
                  value={totalAccepted}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Rejected"
                  value={totalRejected}
                  valueStyle={{ color: '#f5222d' }}
                  prefix={<CloseOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Acceptance Rate"
                  value={totalAccepted + totalRejected > 0 ? Math.round((totalAccepted / (totalAccepted + totalRejected)) * 100) : 0}
                  suffix="%"
                  valueStyle={{ color: totalAccepted / (totalAccepted + totalRejected) >= 0.9 ? '#52c41a' : '#faad14' }}
                />
              </Col>
            </Row>
            
            {qaData?.rejectionReason && (
              <Alert
                message="Latest QA Report"
                description={
                  <div>
                    <Text strong>Rejection Reason:</Text> {qaData.rejectionReason}
                    {qaData.laterAcceptanceReason && (
                      <div className="mt-2">
                        <Text strong>Later Acceptance:</Text> {qaData.laterAcceptanceReason}
                      </div>
                    )}
                  </div>
                }
                type={qaData.rejectedQuantity > 0 ? 'warning' : 'info'}
                className="mt-4"
              />
            )}
          </Card>
        )}

        {/* Production Steps Timeline */}
        <Card title="Production Timeline" size="small">
          <Steps
            current={jobCard.prodStep - 1}
            size="small"
            direction="horizontal"
            className="mb-6"
          >
            {PRODUCTION_STEPS.map((step, index) => (
              <Step
                key={step.id}
                title={step.name}
                description={step.description}
                icon={
                  jobCard.prodStep > step.id ? <CheckCircleOutlined /> :
                  jobCard.prodStep === step.id ? <PlayCircleOutlined /> :
                  <ClockCircleOutlined />
                }
              />
            ))}
          </Steps>
          
          {/* Step History */}
          {stepHistory.length > 0 && (
            <>
              <Divider>Step History</Divider>
              <Timeline>
                {stepHistory.map((history, index) => {
                  const step = PRODUCTION_STEPS.find(s => s.id === history.stepId) || {}
                  return (
                    <Timeline.Item
                      key={index}
                      dot={
                        <Badge
                          count={step.icon}
                          style={{ backgroundColor: step.color }}
                        />
                      }
                    >
                      <div>
                        <Text strong>{step.name}</Text>
                        <div className="text-sm text-gray-600">
                          {moment(history.timestamp).format('MMM DD, YYYY HH:mm')}
                        </div>
                        {history.notes && (
                          <div className="text-sm mt-1">{history.notes}</div>
                        )}
                        {history.assignedUser && (
                          <div className="text-sm text-blue-600">
                            Assigned to: {history.assignedUser}
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  )
                })}
              </Timeline>
            </>
          )}
        </Card>

        {/* Inventory Requests */}
        {inventoryRequests.length > 0 && (
          <Card title="Material Requests" size="small">
            <div className="space-y-3">
              {inventoryRequests.map((request, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <Text strong>Request #{request.id}</Text>
                    <div className="text-sm text-gray-600">
                      Requested: {request.quantity} | 
                      Sent: {request.sentQuantity || 0} |
                      Date: {moment(request.createdAt).format('MMM DD, YYYY')}
                    </div>
                  </div>
                  <Tag color={request.isFulfilled ? 'green' : 'orange'}>
                    {request.isFulfilled ? 'Fulfilled' : 'Pending'}
                  </Tag>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Modal>
  )
}

export default JobCardDetailsModal