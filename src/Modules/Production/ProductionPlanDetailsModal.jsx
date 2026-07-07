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
  Alert,
  Tabs
} from 'antd'
import {
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  CalendarOutlined,
  SettingOutlined,
  BarcodeOutlined,
  SwapOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'
import { getProductionPlanDetails, getJobCardStepProgress } from '../../redux/api/productionAPI'
import JobCardCreationModal from './JobCardCreationModal'
import StepManagementView from './StepManagementView'

const { Title, Text } = Typography
const { Step } = Steps
const { TabPane } = Tabs

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
  const [qualityTrackingData, setQualityTrackingData] = useState([])
  const [qualityLoading, setQualityLoading] = useState(false)
  // true when the details fetch failed and we're showing the listing-row
  // summary instead — previously this fallback was silent
  const [usedFallback, setUsedFallback] = useState(false)

  // Load plan details when modal opens
  useEffect(() => {
    if (visible && planId) {
      loadPlanData()
    }
  }, [visible, planId])

  const loadPlanData = async () => {
    setLoading(true)
    setUsedFallback(false)
    try {
      // Try to fetch detailed plan data from API
      if (planId) {
        const response = await dispatch(getProductionPlanDetails(planId)).unwrap()
        setPlanDetails(response.planDetails)

        // Fetch quality tracking with the job cards from response
        await fetchQualityTrackingWithJobCards(response.planDetails?.jobCards || [])
      } else {
        // Fallback to planData passed from listing
        setPlanDetails(planData)
        setUsedFallback(true)
      }
    } catch (error) {
      console.error('Error fetching plan details:', error)
      // Fallback to planData if API fails — but SAY so instead of silently
      // presenting a stale/partial summary as the real thing
      setPlanDetails(planData)
      setUsedFallback(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchQualityTrackingWithJobCards = async (jobCards) => {
    setQualityLoading(true)
    try {
      console.log('📊 Quality Tracking Debug:', {
        planId,
        totalJobCards: jobCards.length,
        jobCards: jobCards.map(jc => ({
          id: jc.id,
          jobCardId: jc.jobCardId,
          quantity: jc.quantity,
          completedSteps: jc.completedStepsCount
        }))
      })

      // If no job cards, set empty data
      if (jobCards.length === 0) {
        console.log('⚠️ No job cards found for this production plan')
        setQualityTrackingData([])
        return
      }

      // Fetch quality data for all job cards and aggregate
      const allStepProgress = []

      for (const jobCard of jobCards) {
        try {
          // Use jobCardId or id, whichever is available
          const cardId = jobCard.jobCardId || jobCard.id
          console.log(`🔄 Fetching step progress for job card ${cardId}...`)
          const stepResponse = await dispatch(getJobCardStepProgress(cardId)).unwrap()
          const steps = stepResponse.data || []
          console.log(`✅ Job card ${cardId}: ${steps.length} steps found`, steps)
          allStepProgress.push(...steps)
        } catch (error) {
          const cardId = jobCard.jobCardId || jobCard.id
          console.error(`❌ Error fetching step progress for job card ${cardId}:`, error)
        }
      }

      console.log('📈 Total step progress entries:', allStepProgress.length)

      // Aggregate by step
      const aggregatedSteps = allStepProgress.reduce((acc, step) => {
        const key = `${step.stepOrder}-${step.stepName}`
        if (!acc[key]) {
          acc[key] = {
            ...step,
            id: `aggregated-${step.stepOrder}`,
            inputQuantity: 0,
            acceptedQuantity: 0,
            rejectedQuantity: 0,
            pendingQuantity: 0,
            reworkQuantity: 0
          }
        }

        acc[key].inputQuantity += step.inputQuantity || 0
        acc[key].acceptedQuantity += step.acceptedQuantity || 0
        acc[key].rejectedQuantity += step.rejectedQuantity || 0
        acc[key].pendingQuantity += step.pendingQuantity || 0
        acc[key].reworkQuantity += step.reworkQuantity || 0

        return acc
      }, {})

      const aggregatedData = Object.values(aggregatedSteps).sort((a, b) => a.stepOrder - b.stepOrder)
      console.log('📊 Aggregated quality data:', aggregatedData)
      setQualityTrackingData(aggregatedData)
    } catch (error) {
      console.error('❌ Error fetching quality tracking data:', error)
    } finally {
      setQualityLoading(false)
    }
  }

  // Get status color and icon
  // ONE status vocabulary, shared with the listing's Status column:
  // Pending = orange, In Progress = blue, Completed = green.
  // (The old map also carried unreachable "Quality Check"(purple)/"Cancelled"/
  // "On Hold" entries — purple conflicted with the table where it means
  // Rework.)
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
      'Completed': {
        color: 'green',
        icon: <CheckCircleOutlined />,
        description: 'Production completed successfully'
      }
    }
    return configs[status] || configs['Pending']
  }

  // Derive status from REAL fields — the API sends no `status` string, so the
  // old `planDetails.status || 'Pending'` rendered "Pending" forever, even on
  // completed plans
  const getDerivedStatus = () => {
    if (!planDetails) return 'Pending'
    if (planDetails.isCompleted === true || planDetails.isCompleted === 1) {
      return 'Completed'
    }
    if (
      (planDetails.statistics?.completedQuantity || 0) > 0 ||
      (planDetails.jobCards?.length || 0) > 0
    ) {
      return 'In Progress'
    }
    return 'Pending'
  }

  // Real progress from the API's statistics (was a hardcoded status→% map
  // that always evaluated to 0)
  const calculateProgress = () => {
    if (!planDetails) return 0
    if (planDetails.isCompleted === true || planDetails.isCompleted === 1) {
      return 100
    }
    return planDetails.statistics?.completionPercentage || 0
  }

  // Handle job card creation
  const handleCreateJobCard = () => {
    if (planDetails) {
      setSelectedPlanForJobCard(planDetails)
      setJobCardModalVisible(true)
    }
  }

  // Check if job card can be created (real completion flag — the old check
  // read a `status` string the API never sends, so it was always true)
  const canCreateJobCard = () => {
    if (!planDetails) return false
    if (planDetails.isCompleted === true || planDetails.isCompleted === 1) {
      return false
    }
    return planDetails.quantity > 0
  }

  // Handle job card creation success
  const handleJobCardSuccess = () => {
    setJobCardModalVisible(false)
    // Reload plan details and quality tracking to show updated information
    loadPlanData()
  }

  // Get production steps with REAL status derived from the aggregated
  // job-card step progress (the old version hardcoded step 1 "completed",
  // step 2 "in_progress" with literal fake 2025-08-22 timestamps)
  const getProductionStepsWithStatus = () => {
    if (!planDetails || !planDetails.productionSteps) return []

    return planDetails.productionSteps.map((step, index) => {
      const agg = qualityTrackingData.find(
        q => q.stepOrder === step.stepOrder
      )
      let status = 'pending'
      if (agg && (agg.inputQuantity || 0) > 0) {
        status =
          (agg.pendingQuantity || 0) === 0 ? 'completed' : 'in_progress'
      }
      return {
        id: step.id || index + 1,
        name: step.stepName || `Step ${step.stepOrder}`,
        status,
        stepOrder: step.stepOrder,
        isRequired: step.isRequired,
        completedAt: null,
        startedAt: null
      }
    })
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

  const derivedStatus = getDerivedStatus()
  const statusConfig = getStatusConfig(derivedStatus)
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
        // NOTE: the old "Edit Plan" primary button here had NO onClick —
        // a dead affordance. Removed until it is actually wired up.
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      className="production-details-modal"
    >
      {usedFallback && (
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message="Showing summary data from the list — full details could not be loaded."
        />
      )}
      <Tabs defaultActiveKey="overview" type="card">
        <TabPane tab="Overview" key="overview">
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
                  {derivedStatus}
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
                // real number from the API — the old read keyed on a `status`
                // string the API never sends, so this was always 0
                value={planDetails.statistics?.completedQuantity || 0}
                suffix="units"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Remaining"
                value={
                  planDetails.statistics?.remainingQuantity ??
                  planDetails.quantity - (planDetails.inProductionQuantity || 0)
                }
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
        </TabPane>

        <TabPane tab="Quality Tracking" key="quality">
          {qualityLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spin tip="Loading quality tracking data..." />
            </div>
          ) : qualityTrackingData.length > 0 ? (
            <StepManagementView
              jobCard={{ quantity: planDetails.quantity }}
              stepProgressData={qualityTrackingData}
              onProcessStep={() => {}}
              loading={false}
            />
          ) : (
            <div className="text-center py-12">
              <Alert
                message="No Quality Tracking Data Available"
                description={
                  <div>
                    <p>Quality tracking data will appear here once:</p>
                    <ol className="list-decimal list-inside mt-2 text-left">
                      <li>Job cards are created for this production plan</li>
                      <li>Job cards are processed through the quality tracking workflow</li>
                      <li>Steps are completed with accepted/rejected quantities</li>
                    </ol>
                    <p className="mt-3">
                      {planDetails?.jobCards?.length > 0
                        ? `This plan has ${planDetails.jobCards.length} job card(s), but no quality data has been recorded yet.`
                        : 'This plan has no job cards yet. Create a job card to begin tracking quality data.'
                      }
                    </p>
                  </div>
                }
                type="info"
                showIcon
              />
            </div>
          )}
        </TabPane>
      </Tabs>

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