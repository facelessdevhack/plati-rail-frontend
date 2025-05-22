import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Timeline, Spin, Empty, Tag, Tooltip, message } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  UserOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import { mockApiResponses } from '../../Utils/mockProductionData'

const StepTransitionHistory = ({ jobCardId }) => {
  const [loading, setLoading] = useState(true)
  const [transitions, setTransitions] = useState([])
  const [productionSteps, setProductionSteps] = useState([])

  useEffect(() => {
    if (jobCardId) {
      fetchStepTransitions()
      fetchProductionSteps()
    }
  }, [jobCardId])

  const fetchStepTransitions = async () => {
    try {
      setLoading(true)
      const response = await client.get(
        `/v2/production/step-transitions/${jobCardId}`
      )
      if (response.data && response.data.result) {
        setTransitions(response.data.result)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching step transitions:', error)
      // message.error('Failed to load step transitions. Using mock data instead.')
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getStepTransitions(jobCardId)
      setTransitions(mockResponse.result)
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
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getProductionSteps()
      setProductionSteps(mockResponse.result)
    }
  }

  const getStepName = stepId => {
    const step = productionSteps.find(s => s.id === stepId)
    return step ? step.name : `Step ${stepId}`
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center w-full py-8'>
        <Spin size='small' />
      </div>
    )
  }

  if (!transitions.length) {
    return (
      <Card title='Step Transition History' className='mb-6'>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description='No transition history available'
        />
      </Card>
    )
  }

  return (
    <Card title='Step Transition History' className='mb-6'>
      <Timeline mode='left'>
        {transitions.map((transition, index) => (
          <Timeline.Item
            key={index}
            color={transition.isLatest ? 'green' : 'blue'}
            label={
              <Tooltip title={new Date(transition.timestamp).toLocaleString()}>
                {new Date(transition.timestamp).toLocaleDateString()}
              </Tooltip>
            }
            dot={
              transition.isLatest ? (
                <CheckCircleOutlined className='timeline-clock-icon' />
              ) : (
                <ClockCircleOutlined className='timeline-clock-icon' />
              )
            }
          >
            <div className='mb-1'>
              <strong>
                {transition.fromStep !== undefined
                  ? `${getStepName(transition.fromStep)} → ${getStepName(
                      transition.toStep
                    )}`
                  : `Started at ${getStepName(transition.toStep)}`}
              </strong>
            </div>
            {transition.duration && (
              <div className='text-xs text-gray-500 mb-1'>
                Duration: {transition.duration}
              </div>
            )}
            {transition.notes && (
              <div className='text-sm mb-1'>Notes: {transition.notes}</div>
            )}
            <div className='text-xs text-gray-500'>
              <UserOutlined className='mr-1' />
              Changed by: {transition.changedBy || 'System'}
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  )
}

export default StepTransitionHistory
