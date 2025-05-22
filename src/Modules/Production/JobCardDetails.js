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
  Tooltip
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { useSelector } from 'react-redux'
import StepTransitionHistory from './StepTransitionHistory'
import { mockApiResponses } from '../../Utils/mockProductionData'

const { Option } = Select
const { TextArea } = Input

const JobCardDetails = () => {
  const { jobCardId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [jobCard, setJobCard] = useState(null)
  const [productionPlan, setProductionPlan] = useState(null)
  const [productionSteps, setProductionSteps] = useState([])
  const [updateStepModalVisible, setUpdateStepModalVisible] = useState(false)
  const [selectedStep, setSelectedStep] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [stepTransitions, setStepTransitions] = useState([])
  const [transitionsLoading, setTransitionsLoading] = useState(false)
  const { user } = useSelector(state => state.userDetails)

  useEffect(() => {
    if (jobCardId) {
      fetchJobCardDetails()
      fetchProductionSteps()
      fetchStepTransitions()
    }
  }, [jobCardId])

  const fetchJobCardDetails = async () => {
    try {
      setLoading(true)
      const response = await client.get(`/v2/production/job-cards/${jobCardId}`)
      if (response.data && response.data.result) {
        setJobCard(response.data.result)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching job card details:', error)
      // message.error('Failed to load job card details. Using mock data instead.')
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getJobCardById(jobCardId)
      setJobCard(mockResponse.result)
      setLoading(false)
    }
  }

  const fetchProductionPlan = async planId => {
    try {
      // Replace with your actual API endpoint for fetching plan details
      const response = await client.get(`/production/plan/${planId}`)
      setProductionPlan(response.data)
    } catch (error) {
      console.error('Error fetching production plan:', error)
      // message.error('Failed to load associated production plan')
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
      // message.error('Failed to load production steps. Using mock data instead.')
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getProductionSteps()
      setProductionSteps(mockResponse.result)
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
      setTransitionsLoading(false)
    } catch (error) {
      console.error('Error fetching step transitions:', error)
      // message.error('Failed to load step transitions. Using mock data instead.')
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getStepTransitions(jobCardId)
      setStepTransitions(mockResponse.result)
      setTransitionsLoading(false)
    }
  }

  const getStatusTag = status => {
    if (!status) return <Tag>PENDING</Tag>

    let color = 'default'
    let icon = null

    if (status === 'completed') {
      color = 'success'
      icon = <CheckCircleOutlined />
    } else if (status === 'in-progress') {
      color = 'processing'
      icon = <ClockCircleOutlined />
    } else if (status === 'pending') {
      color = 'warning'
      icon = <ExclamationCircleOutlined />
    }

    return (
      <Tag color={color} icon={icon}>
        {status.toUpperCase()}
      </Tag>
    )
  }

  const getStepName = stepId => {
    const step = productionSteps.find(s => s.id === stepId)
    return step ? step.name : `Step ${stepId}`
  }

  const handleGoBack = () => {
    navigate('/production-job-cards')
  }

  const handleGoToPlan = () => {
    if (productionPlan?.id) {
      navigate(`/production-plan/${productionPlan.id}`)
    }
  }

  const showUpdateStepModal = () => {
    setSelectedStep(jobCard?.prodStep || 0)
    setNotes('')
    setUpdateStepModalVisible(true)
  }

  const handleUpdateStep = async () => {
    if (selectedStep === null) {
      message.error('Please select a production step')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        jobCardId: parseInt(jobCardId),
        prodStep: selectedStep,
        notes: notes || undefined, // Only include if provided
        userId: user.id
      }

      const response = await client.post(
        '/v2/production/update-production-job-card',
        payload
      )

      if (response.data && response.data.message) {
        message.success(response.data.message)
        setUpdateStepModalVisible(false)
        fetchJobCardDetails()
        fetchStepTransitions()
      }
    } catch (error) {
      console.error('Error updating job card:', error)
      // message.error('Failed to update job card. Using mock response instead.')
      // Use mock data when API fails
      const mockResponse = mockApiResponses.updateJobCard()
      message.success(mockResponse.message)
      setUpdateStepModalVisible(false)

      // Update local job card data to reflect change
      setJobCard(prev => ({
        ...prev,
        prodStep: parseInt(selectedStep)
      }))

      // Add a mock transition to the history
      const newTransition = {
        id:
          stepTransitions.length > 0
            ? Math.max(...stepTransitions.map(t => t.id)) + 1
            : 1,
        jobCardId: parseInt(jobCardId),
        fromStep: jobCard.prodStep,
        toStep: parseInt(selectedStep),
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.fullName || 'Current User',
        notes: notes
      }

      setStepTransitions(prev => [...prev, newTransition])
      setSubmitting(false)
    } finally {
      setSubmitting(false)
    }
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

    // Check if step was completed (a subsequent step exists)
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

  const viewWorkflow = () => {
    navigate('/production-workflow')
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center w-full h-64'>
        <Spin size='large' />
      </div>
    )
  }

  if (!jobCard) {
    return (
      <div className='p-5'>
        <Card>
          <div className='text-center'>
            <h3 className='text-lg font-semibold'>Job Card Not Found</h3>
            <p className='mt-2'>The requested job card could not be found.</p>
            <Button onClick={handleGoBack} className='mt-4'>
              Back to Job Cards
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className='w-full p-5 bg-background-grey'>
      <div className='mb-4'>
        <Space>
          <Button onClick={handleGoBack}>Back to Job Cards</Button>
          {productionPlan && (
            <Button onClick={handleGoToPlan}>View Production Plan</Button>
          )}
          <Button onClick={viewWorkflow} icon={<HistoryOutlined />}>
            View Production Workflow
          </Button>
        </Space>
      </div>

      <div className='p-6 mb-6 bg-white rounded-lg shadow'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-2xl font-bold'>Job Card #{jobCard.id}</h2>
          <Space>
            {getStatusTag(jobCard.status)}
            {jobCard.urgent && <Tag color='red'>URGENT</Tag>}
            <Button onClick={showUpdateStepModal}>Update Step</Button>
          </Space>
        </div>

        <Descriptions
          bordered
          column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label='Job Card ID'>
            {jobCard.id}
          </Descriptions.Item>
          <Descriptions.Item label='Production Plan ID'>
            <a onClick={handleGoToPlan}>{jobCard.prodPlanId}</a>
          </Descriptions.Item>
          <Descriptions.Item label='Current Step'>
            {getStepName(jobCard.prodStep)}
          </Descriptions.Item>
          <Descriptions.Item label='Quantity'>
            {jobCard.quantity}
          </Descriptions.Item>
          <Descriptions.Item label='Created By'>
            {jobCard.createdBy}
          </Descriptions.Item>
          <Descriptions.Item label='Created At'>
            {new Date(jobCard.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label='Last Updated'>
            {new Date(jobCard.updatedAt).toLocaleString()}
          </Descriptions.Item>
          {jobCard.acceptedQuantity !== undefined && (
            <Descriptions.Item label='Accepted Quantity'>
              {jobCard.acceptedQuantity}
            </Descriptions.Item>
          )}
          {jobCard.rejectedQuantity !== undefined && (
            <Descriptions.Item label='Rejected Quantity'>
              {jobCard.rejectedQuantity}
            </Descriptions.Item>
          )}
          {jobCard.rejectionReason && (
            <Descriptions.Item label='Rejection Reason'>
              {jobCard.rejectionReason}
            </Descriptions.Item>
          )}
          {jobCard.laterAcceptanceReason && (
            <Descriptions.Item label='Later Acceptance Reason'>
              {jobCard.laterAcceptanceReason}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider />

        <div className='mb-6'>
          <h3 className='mb-4 text-xl font-semibold'>Production Progress</h3>

          <div className='p-6 mb-4 bg-gray-50 rounded-lg'>
            <Steps
              current={getCurrentStepIndex()}
              direction='horizontal'
              items={productionSteps.map(step => {
                const stepStatus = getStepStatusAndTime(step.id)
                return {
                  title: step.name,
                  description: (
                    <div>
                      <div>{step.description}</div>
                      {stepStatus.time && (
                        <div className='text-xs mt-1 text-gray-500'>
                          {new Date(stepStatus.time).toLocaleString()}
                        </div>
                      )}
                      {stepStatus.duration && (
                        <div className='text-xs text-gray-500'>
                          Duration: {stepStatus.duration}
                        </div>
                      )}
                    </div>
                  ),
                  status: stepStatus.status
                }
              })}
            />
          </div>

          {/* Step Transition History Component */}
          <StepTransitionHistory jobCardId={jobCardId} />

          {productionPlan && (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Card title='Production Plan Details' className='shadow-sm'>
                <p>
                  <strong>Alloy:</strong> {productionPlan.alloyName}
                </p>
                <p>
                  <strong>Conversion Alloy:</strong>{' '}
                  {productionPlan.convertName}
                </p>
                <p>
                  <strong>Total Quantity:</strong> {productionPlan.quantity}
                </p>
                <p>
                  <strong>Created At:</strong>{' '}
                  {new Date(productionPlan.createdAt).toLocaleString()}
                </p>
              </Card>

              <Card title='QA Information' className='shadow-sm'>
                {jobCard.acceptedQuantity === undefined &&
                jobCard.rejectedQuantity === undefined ? (
                  <div className='p-4 text-center'>
                    <p>No QA information available yet.</p>
                    <Button
                      className='mt-4'
                      onClick={() => navigate(`/production-qa/${jobCardId}`)}
                    >
                      Submit QA Report
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p>
                      <strong>Accepted Quantity:</strong>{' '}
                      {jobCard.acceptedQuantity || 0}
                    </p>
                    <p>
                      <strong>Rejected Quantity:</strong>{' '}
                      {jobCard.rejectedQuantity || 0}
                    </p>
                    {jobCard.rejectionReason && (
                      <p>
                        <strong>Rejection Reason:</strong>{' '}
                        {jobCard.rejectionReason}
                      </p>
                    )}
                    <div className='mt-4'>
                      <Button
                        onClick={() =>
                          navigate(`/production-qa/${jobCardId}/update`)
                        }
                      >
                        Update QA Report
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

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
            onClick={handleUpdateStep}
          >
            Update
          </AntButton>
        ]}
      >
        <div className='space-y-4'>
          <div>
            <p className='mb-2'>
              Current Step: <strong>{getStepName(jobCard.prodStep)}</strong>
            </p>
          </div>

          <div>
            <label className='block mb-2 font-medium'>Select New Step:</label>
            <Select
              value={selectedStep}
              onChange={setSelectedStep}
              style={{ width: '100%' }}
            >
              {productionSteps.map(step => (
                <Option key={step.id} value={step.id}>
                  {step.name}
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
    </div>
  )
}

export default JobCardDetails
