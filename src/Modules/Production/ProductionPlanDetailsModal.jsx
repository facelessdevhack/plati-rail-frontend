import React, { useEffect, useState } from 'react'
import {
  Modal,
  Descriptions,
  Steps,
  Tag,
  Button,
  Divider,
  Progress,
  Card,
  Row,
  Col,
  Timeline,
  Statistic,
  Typography,
  Space,
  Spin,
  Alert
} from 'antd'
import {
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  FireOutlined,
  CalendarOutlined,
  SettingOutlined,
  BarcodeOutlined,
  SwapOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'
import { getProductionPlanDetails } from '../../redux/api/productionAPI'
import JobCardCreationModal from './JobCardCreationModal'

const { Title, Text } = Typography
const { Step } = Steps

const ProductionPlanDetailsModal = ({ 
  visible, 
  onClose, 
  planId, 
  planData 
}) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [planDetails, setPlanDetails] = useState(null)
  const [jobCardModalVisible, setJobCardModalVisible] = useState(false)
  const [selectedPlanForJobCard, setSelectedPlanForJobCard] = useState(null)

  // Load plan details when modal opens
  useEffect(() => {
    if (visible && planId) {
      fetchPlanDetails()
    }
  }, [visible, planId])

  const fetchPlanDetails = async () => {
    setLoading(true)
    try {
      // Try to fetch detailed plan data from API
      if (planId) {
        const response = await dispatch(getProductionPlanDetails(planId)).unwrap()
        setPlanDetails(response.planDetails)
      } else {
        // Fallback to planData passed from listing
        setPlanDetails(planData)
      }
    } catch (error) {
      console.error('Error fetching plan details:', error)
      // Fallback to planData if API fails
      setPlanDetails(planData)
    } finally {
      setLoading(false)
    }
  }

  // Get status color and icon
  const getStatusConfig = (status) => {
    const configs = {
      'Pending': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        description: 'Plan created, waiting to start production' 
      },
      'In Progress': { 
        color: 'blue', 
        icon: <SettingOutlined />, 
        description: 'Production is currently active' 
      },
      'Quality Check': { 
        color: 'purple', 
        icon: <ExclamationCircleOutlined />, 
        description: 'Under quality inspection' 
      },
      'Completed': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        description: 'Production completed successfully' 
      },
      'Cancelled': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        description: 'Production plan cancelled' 
      },
      'On Hold': { 
        color: 'gray', 
        icon: <ExclamationCircleOutlined />, 
        description: 'Production temporarily paused' 
      }
    }
    return configs[status] || configs['Pending']
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!planDetails) return 0
    
    const status = planDetails.status || 'Pending'
    const progressMap = {
      'Pending': 0,
      'In Progress': 50,
      'Quality Check': 80,
      'Completed': 100,
      'Cancelled': 0,
      'On Hold': 25
    }
    return progressMap[status] || 0
  }

  // Handle job card creation
  const handleCreateJobCard = () => {
    if (planDetails) {
      setSelectedPlanForJobCard(planDetails)
      setJobCardModalVisible(true)
    }
  }

  // Check if job card can be created
  const canCreateJobCard = () => {
    if (!planDetails) return false
    const completedStatuses = ['Completed', 'Cancelled']
    return !completedStatuses.includes(planDetails.status) && planDetails.quantity > 0
  }

  // Handle job card creation success
  const handleJobCardSuccess = () => {
    setJobCardModalVisible(false)
    // Optionally reload plan details to show updated information
    fetchPlanDetails()
  }

  // Get production steps with status (real data from API)
  const getProductionStepsWithStatus = () => {
    if (!planDetails || !planDetails.productionSteps) return []
    
    return planDetails.productionSteps.map((step, index) => ({
      id: step.id || index + 1,
      name: step.stepName || `Step ${step.stepOrder}`,
      status: index === 0 ? 'completed' : index === 1 ? 'in_progress' : 'pending', // Mock status for demo
      stepOrder: step.stepOrder,
      isRequired: step.isRequired,
      completedAt: index === 0 ? '2025-08-22T10:00:00Z' : null,
      startedAt: index === 1 ? '2025-08-22T16:00:00Z' : null
    }))
  }

  if (!planDetails) {
    return (
      <Modal
        title="Production Plan Details"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
      >
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-4">Loading plan details...</div>
        </div>
      </Modal>
    )
  }

  const statusConfig = getStatusConfig(planDetails.status || 'Pending')
  const progress = calculateProgress()

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarcodeOutlined className="text-blue-600" />
            <span>Production Plan #{planDetails.id}</span>
            {planDetails.urgent && (
              <Tag icon={<FireOutlined />} color="red" className="ml-2">
                URGENT
              </Tag>
            )}
          </div>
          {canCreateJobCard() && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleCreateJobCard}
              size="small"
            >
              Create Job Card
            </Button>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button key="edit" type="primary">
          Edit Plan
        </Button>
      ]}
      className="production-details-modal"
    >
      <div className="space-y-6">
        {/* Status and Progress Overview */}
        <Card className="border-l-4 border-l-blue-500">
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div className="text-center">
                <div className="text-2xl mb-2" style={{ color: statusConfig.color }}>
                  {statusConfig.icon}
                </div>
                <Tag color={statusConfig.color} className="mb-2">
                  {planDetails.status || 'Pending'}
                </Tag>
                <div className="text-xs text-gray-500">
                  {statusConfig.description}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="text-center">
                <Progress
                  type="circle"
                  percent={progress}
                  size={80}
                  strokeColor={statusConfig.color}
                />
                <div className="text-xs text-gray-500 mt-2">
                  Overall Progress
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" className="w-full">
                <Statistic
                  title="Quantity"
                  value={planDetails.quantity}
                  suffix="units"
                  valueStyle={{ fontSize: '20px' }}
                />
                <div className="text-xs text-gray-500">
                  Production Target
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Plan Information */}
        <Card title="Plan Information" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item 
              label="Plan ID" 
              span={1}
            >
              <Text code>#{planDetails.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item 
              label="Created Date" 
              span={1}
            >
              <Space>
                <CalendarOutlined />
                {moment(planDetails.createdAt).format('MMM DD, YYYY HH:mm')}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item 
              label="Created By" 
              span={1}
            >
              <Space>
                <UserOutlined />
                {planDetails.createdBy || 'Unknown User'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item 
              label="Priority" 
              span={1}
            >
              <Tag color={planDetails.urgent ? 'red' : 'default'}>
                {planDetails.urgent ? 'URGENT' : 'NORMAL'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Alloy Conversion Details */}
        <Card 
          title={
            <Space>
              <SwapOutlined />
              Alloy Conversion Details
            </Space>
          } 
          size="small"
        >
          <Row gutter={[24, 16]} className="items-center">
            {/* Source Alloy */}
            <Col xs={24} md={10}>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  📦 Source Alloy
                </div>
                <div className="font-semibold text-blue-800 mb-1">
                  {planDetails.alloyName || `Alloy ${planDetails.alloyId}`}
                </div>
                {planDetails.sourceModelName && (
                  <div className="text-sm text-blue-700">
                    Model: {planDetails.sourceModelName}
                  </div>
                )}
                {planDetails.sourceFinish && (
                  <div className="text-sm text-blue-700">
                    Finish: {planDetails.sourceFinish}
                  </div>
                )}
                <div className="text-xs text-blue-600 mt-2">
                  ID: {planDetails.alloyId}
                </div>
              </div>
            </Col>

            {/* Arrow */}
            <Col xs={24} md={4} className="text-center">
              <div className="text-2xl text-gray-400">
                →
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Convert To
              </div>
            </Col>

            {/* Target Alloy */}
            <Col xs={24} md={10}>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-900 mb-2">
                  🎯 Target Alloy
                </div>
                <div className="font-semibold text-green-800 mb-1">
                  {planDetails.convertName || `Alloy ${planDetails.convertToAlloyId}`}
                </div>
                {planDetails.targetModelName && (
                  <div className="text-sm text-green-700">
                    Model: {planDetails.targetModelName}
                  </div>
                )}
                {planDetails.targetFinish && (
                  <div className="text-sm text-green-700">
                    Finish: {planDetails.targetFinish}
                  </div>
                )}
                <div className="text-xs text-green-600 mt-2">
                  ID: {planDetails.convertToAlloyId}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Production Steps */}
        <Card 
          title={
            <Space>
              <SettingOutlined />
              Production Steps
            </Space>
          } 
          size="small"
        >
          {getProductionStepsWithStatus().length > 0 ? (
            <Timeline
              items={getProductionStepsWithStatus().map((step, index) => ({
              dot: step.status === 'completed' 
                ? <CheckCircleOutlined className="text-green-500" />
                : step.status === 'in_progress'
                ? <ClockCircleOutlined className="text-blue-500" />
                : <div className="w-3 h-3 border-2 border-gray-300 rounded-full bg-white" />,
              color: step.status === 'completed' 
                ? 'green' 
                : step.status === 'in_progress' 
                ? 'blue' 
                : 'gray',
              children: (
                <div>
                  <div className="font-medium">
                    {step.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {step.status === 'completed' && step.completedAt && (
                      <span>Completed: {moment(step.completedAt).format('MMM DD, HH:mm')}</span>
                    )}
                    {step.status === 'in_progress' && step.startedAt && (
                      <span>Started: {moment(step.startedAt).format('MMM DD, HH:mm')}</span>
                    )}
                    {step.status === 'pending' && (
                      <span>Waiting to start</span>
                    )}
                  </div>
                </div>
              )
            }))}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <SettingOutlined className="text-4xl mb-4" />
              <div>No production steps defined for this plan</div>
              <div className="text-sm">Steps will be added when job cards are created</div>
            </div>
          )}
        </Card>

        {/* Production Metrics */}
        <Card title="Production Metrics" size="small">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Target Quantity"
                value={planDetails.quantity}
                suffix="units"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="In Production"
                value={planDetails.inProductionQuantity || 0}
                suffix="units"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Completed"
                value={planDetails.status === 'Completed' ? planDetails.quantity : 0}
                suffix="units"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Remaining"
                value={planDetails.quantity - (planDetails.inProductionQuantity || 0)}
                suffix="units"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
          </Row>
        </Card>

        {/* Additional Notes */}
        {planDetails.note && (
          <Card title="Notes" size="small">
            <div className="bg-gray-50 p-3 rounded">
              <Text>{planDetails.note}</Text>
            </div>
          </Card>
        )}
      </div>

      {/* Job Card Creation Modal */}
      <JobCardCreationModal
        visible={jobCardModalVisible}
        onCancel={() => setJobCardModalVisible(false)}
        onSuccess={handleJobCardSuccess}
        selectedPlan={selectedPlanForJobCard}
      />
    </Modal>
  )
}

export default ProductionPlanDetailsModal