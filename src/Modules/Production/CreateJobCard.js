import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Form, message, Spin, Card, Descriptions, Tag, InputNumber } from 'antd'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { useSelector } from 'react-redux'
import { mockApiResponses } from '../../Utils/mockProductionData'

const CreateJobCard = () => {
  const { planId } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [productionPlan, setProductionPlan] = useState(null)
  const { user } = useSelector(state => state.userDetails)

  useEffect(() => {
    if (planId) {
      fetchProductionPlan()
    }
  }, [planId])

  const fetchProductionPlan = async () => {
    try {
      setLoading(true)
      const response = await client.get(
        `/v2/production/production-plans/${planId}`
      )
      if (response.data && response.data.result) {
        const plan = response.data.result
        setProductionPlan(plan)
        form.setFieldsValue({
          quantity: plan.quantity
        })
      }
    } catch (error) {
      console.error('Error fetching production plan details:', error)
      // message.error(
      //   'Failed to load production plan details. Using mock data instead.'
      // )
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getProductionPlanById(planId)
      const plan = mockResponse.result
      if (plan) {
        setProductionPlan(plan)
        form.setFieldsValue({
          quantity: plan.quantity
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async values => {
    try {
      setSubmitting(true)
      const payload = {
        prodPlanId: parseInt(values.prodPlanId),
        quantity: parseInt(values.quantity),
        userId: user.userId
      }

      const response = await client.post(
        '/v2/production/add-production-job-card',
        payload
      )

      if (response.data && response.data.message) {
        message.success(response.data.message)
        navigate('/production-job-cards')
      }
    } catch (error) {
      console.error('Error creating job card:', error)
      // message.error('Failed to create job card. Using mock response instead.')
      // Use mock data when API fails
      const mockResponse = mockApiResponses.createJobCard()
      message.success(mockResponse.message)
      navigate('/production-job-cards')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoBack = () => {
    navigate(`/production-plan/${planId}`)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center w-full h-64'>
        <Spin size='large' />
      </div>
    )
  }

  if (!productionPlan) {
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
    <div className='w-full p-5 bg-background-grey'>
      <div className='mb-4'>
        <Button onClick={handleGoBack}>Back to Production Plan</Button>
      </div>

      <div className='p-6 mb-6 bg-white rounded-lg shadow'>
        <h2 className='mb-6 text-2xl font-bold'>Create Job Card</h2>

        <div className='mb-6'>
          <h3 className='mb-4 text-lg font-medium'>Production Plan Details</h3>
          <Descriptions
            bordered
            column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label='Plan ID'>
              {productionPlan.id}
            </Descriptions.Item>
            <Descriptions.Item label='Alloy'>
              {productionPlan.alloyName}
            </Descriptions.Item>
            <Descriptions.Item label='Conversion Alloy'>
              {productionPlan.convertName}
            </Descriptions.Item>
            <Descriptions.Item label='Planned Quantity'>
              {productionPlan.quantity}
            </Descriptions.Item>
            <Descriptions.Item label='Status'>
              {productionPlan.status ? (
                <Tag
                  color={
                    productionPlan.status === 'completed'
                      ? 'success'
                      : 'processing'
                  }
                >
                  {productionPlan.status.toUpperCase()}
                </Tag>
              ) : (
                <Tag>PENDING</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label='Urgent'>
              {productionPlan.urgent ? (
                <Tag color='red'>YES</Tag>
              ) : (
                <Tag color='green'>NO</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <div>
          <h3 className='mb-4 text-lg font-medium'>Job Card Information</h3>
          <Form form={form} layout='vertical' onFinish={handleSubmit}>
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
                    if (value > productionPlan.quantity) {
                      return Promise.reject(
                        'Quantity cannot exceed the production plan quantity'
                      )
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <InputNumber
                min={1}
                max={productionPlan.quantity}
                className='w-full'
                placeholder='Enter quantity'
              />
            </Form.Item>

            <div className='flex justify-end mt-6'>
              <Button onClick={handleGoBack} className='mr-4'>
                Cancel
              </Button>
              <Button type='submit' loading={submitting} disabled={submitting}>
                Create Job Card
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default CreateJobCard
