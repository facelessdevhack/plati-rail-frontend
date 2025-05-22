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
  message
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { mockApiResponses } from '../../Utils/mockProductionData'

const ProductionPlanDetails = () => {
  const { planId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [jobCards, setJobCards] = useState([])

  useEffect(() => {
    if (planId) {
      fetchPlanDetails()
      fetchRelatedJobCards()
    }
  }, [planId])

  const fetchPlanDetails = async () => {
    try {
      setLoading(true)
      const response = await client.get(
        `/v2/production/production-plans/${planId}`
      )
      if (response.data && response.data.result) {
        setPlan(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching plan details:', error)
      // message.error('Failed to load plan details. Using mock data instead.')
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getProductionPlanById(planId)
      setPlan(mockResponse.result)
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedJobCards = async () => {
    try {
      const response = await client.get(
        `/v2/production/plan-job-cards/${planId}`
      )
      if (response.data && response.data.result) {
        setJobCards(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching job cards:', error)
      // message.error('Failed to load related job cards. Using mock data instead.')
      // Use mock data when API fails
      const mockJobCards = mockApiResponses
        .getJobCards()
        .result.filter(card => card.prodPlanId === parseInt(planId))
      setJobCards(mockJobCards)
    }
  }

  const getStatusTag = status => {
    if (!status) return <Tag>UNKNOWN</Tag>

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

  const handleCreateJobCard = () => {
    navigate(`/production-job-card/create/${planId}`)
  }

  const handleGoBack = () => {
    navigate('/production-plans')
  }

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
            <Button onClick={handleGoBack} className='mt-4'>
              Back to Production Plans
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className='w-full p-5 bg-background-grey'>
      <div className='mb-4'>
        <Button onClick={handleGoBack}>Back to Production Plans</Button>
      </div>

      <div className='p-6 mb-6 bg-white rounded-lg shadow'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-2xl font-bold'>Production Plan Details</h2>
          <div className='flex items-center space-x-2'>
            {getStatusTag(plan.status)}
            {plan.urgent && <Tag color='red'>URGENT</Tag>}
          </div>
        </div>

        <Descriptions
          bordered
          column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}
        >
          <Descriptions.Item label='Plan ID'>{plan.id}</Descriptions.Item>
          <Descriptions.Item label='Alloy'>{plan.alloyName}</Descriptions.Item>
          <Descriptions.Item label='Conversion Alloy'>
            {plan.convertName}
          </Descriptions.Item>
          <Descriptions.Item label='Quantity'>
            {plan.quantity}
          </Descriptions.Item>
          <Descriptions.Item label='Created By'>
            {plan.createdBy}
          </Descriptions.Item>
          <Descriptions.Item label='Created At'>
            {new Date(plan.createdAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <div className='mb-4'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-xl font-semibold'>Job Cards</h3>
            <Button onClick={handleCreateJobCard}>Create Job Card</Button>
          </div>

          {jobCards.length === 0 ? (
            <div className='p-4 text-center bg-gray-50 rounded-md'>
              <p>
                No job cards have been created for this production plan yet.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {jobCards.map(jobCard => (
                <Card key={jobCard.id} className='shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-lg font-medium'>
                        Job Card #{jobCard.id}
                      </div>
                      <div className='mt-1 text-sm text-gray-500'>
                        Created: {new Date(jobCard.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Space>
                      {getStatusTag(jobCard.status)}
                      <Button
                        onClick={() =>
                          navigate(`/production-job-card/${jobCard.id}`)
                        }
                      >
                        View Details
                      </Button>
                    </Space>
                  </div>
                  <Divider className='my-3' />
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <div>
                      <div className='text-sm font-medium text-gray-500'>
                        Quantity
                      </div>
                      <div>{jobCard.quantity}</div>
                    </div>
                    <div>
                      <div className='text-sm font-medium text-gray-500'>
                        Current Step
                      </div>
                      <div>{jobCard.stepName || '-'}</div>
                    </div>
                    <div>
                      <div className='text-sm font-medium text-gray-500'>
                        Last Updated
                      </div>
                      <div>{new Date(jobCard.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Divider />

        <div>
          <h3 className='mb-4 text-xl font-semibold'>Production Timeline</h3>
          <Timeline mode='left'>
            <Timeline.Item label={new Date(plan.createdAt).toLocaleString()}>
              Production Plan Created
            </Timeline.Item>
            {jobCards.map(jobCard => (
              <Timeline.Item
                key={jobCard.id}
                label={new Date(jobCard.createdAt).toLocaleString()}
                color='blue'
              >
                Job Card #{jobCard.id} Created
              </Timeline.Item>
            ))}
            {/* Additional timeline items based on job card status changes would go here */}
          </Timeline>
        </div>
      </div>
    </div>
  )
}

export default ProductionPlanDetails
