import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Form,
  InputNumber,
  Select,
  Input,
  message,
  Descriptions,
  Spin,
  Tag
} from 'antd'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { useSelector } from 'react-redux'

const { Option } = Select
const { TextArea } = Input

const QAReporting = () => {
  const { jobCardId } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [jobCard, setJobCard] = useState(null)
  const [qaPersonnel, setQAPersonnel] = useState([])
  const { user } = useSelector(state => state.userDetails)

  useEffect(() => {
    if (jobCardId) {
      fetchJobCardDetails()
      fetchQAPersonnel()
    }
  }, [jobCardId])

  const fetchJobCardDetails = async () => {
    try {
      setLoading(true)
      const response = await client.get(`/v2/production/job-cards/${jobCardId}`)
      if (response.data && response.data.result) {
        setJobCard(response.data.result)
        // Pre-fill form if QA data exists
        if (response.data.result.acceptedQuantity !== null) {
          form.setFieldsValue({
            acceptedQuantity: response.data.result.acceptedQuantity,
            rejectedQuantity: response.data.result.rejectedQuantity,
            rejectionReason: response.data.result.rejectionReason,
            qaId: response.data.result.qaId
          })
        }
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching job card details:', error)
      message.error('Failed to load job card details')
      setLoading(false)
    }
  }

  const fetchQAPersonnel = async () => {
    try {
      const response = await client.get('/v2/production/qa-personnel')
      if (response.data && response.data.result) {
        setQAPersonnel(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching QA personnel:', error)
      // Use mock data when API fails
      setQAPersonnel([
        { id: 1, name: 'QA Inspector 1' },
        { id: 2, name: 'QA Inspector 2' },
        { id: 3, name: 'QA Supervisor' }
      ])
    }
  }

  const handleSubmit = async values => {
    try {
      setSubmitting(true)

      const payload = {
        acceptedQuantity: parseInt(values.acceptedQuantity || 0),
        rejectedQuantity: parseInt(values.rejectedQuantity || 0),
        rejectionReason: values.rejectionReason || '',
        planId: jobCard.prodPlanId,
        jobCardId: parseInt(jobCardId),
        qaId: parseInt(values.qaId)
      }

      // Validate that accepted + rejected = total quantity
      const totalQA = payload.acceptedQuantity + payload.rejectedQuantity
      if (totalQA !== jobCard.quantity) {
        message.error(
          `Total QA quantity (${totalQA}) must equal job card quantity (${jobCard.quantity})`
        )
        return
      }

      const response = await client.post(
        '/v2/production/add-qa-production-card-report',
        payload
      )

      if (response.data && response.data.message) {
        message.success(response.data.message)
        navigate(`/production-job-card/${jobCardId}`)
      }
    } catch (error) {
      console.error('Error submitting QA report:', error)
      message.error('Failed to submit QA report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLaterAcceptance = async values => {
    try {
      setSubmitting(true)

      const payload = {
        jobCardId: parseInt(jobCardId),
        laterAcceptanceReason: values.laterAcceptanceReason,
        acceptedQuantity: parseInt(values.laterAcceptedQuantity)
      }

      const response = await client.post(
        '/v2/production/update-qa-production-card-report',
        payload
      )

      if (response.data && response.data.message) {
        message.success(response.data.message)
        fetchJobCardDetails()
      }
    } catch (error) {
      console.error('Error updating QA report:', error)
      message.error('Failed to update QA report')
    } finally {
      setSubmitting(false)
    }
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
            <Button
              onClick={() => navigate('/production-job-cards')}
              className='mt-4'
            >
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
        <Button onClick={() => navigate(`/production-job-card/${jobCardId}`)}>
          Back to Job Card Details
        </Button>
      </div>

      <div className='p-6 mb-6 bg-white rounded-lg shadow'>
        <h2 className='mb-6 text-2xl font-bold'>Quality Assurance Report</h2>

        <div className='mb-6'>
          <h3 className='mb-4 text-lg font-medium'>Job Card Information</h3>
          <Descriptions
            bordered
            column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label='Job Card ID'>
              {jobCard.id}
            </Descriptions.Item>
            <Descriptions.Item label='Production Plan ID'>
              {jobCard.prodPlanId}
            </Descriptions.Item>
            <Descriptions.Item label='Alloy'>
              {jobCard.alloyName}
            </Descriptions.Item>
            <Descriptions.Item label='Total Quantity'>
              {jobCard.quantity}
            </Descriptions.Item>
            <Descriptions.Item label='Current Step'>
              {jobCard.stepName}
            </Descriptions.Item>
            <Descriptions.Item label='Status'>
              {jobCard.status ? (
                <Tag color={jobCard.status === 'completed' ? 'green' : 'blue'}>
                  {jobCard.status.toUpperCase()}
                </Tag>
              ) : (
                <Tag color='blue'>PENDING</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Form form={form} layout='vertical' onFinish={handleSubmit}>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <Form.Item
              name='qaId'
              label='QA Inspector'
              rules={[
                { required: true, message: 'Please select QA inspector' }
              ]}
            >
              <Select placeholder='Select QA inspector'>
                {qaPersonnel.map(qa => (
                  <Option key={qa.id} value={qa.id}>
                    {qa.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name='acceptedQuantity'
              label='Accepted Quantity'
              rules={[
                { required: true, message: 'Please enter accepted quantity' },
                { type: 'number', min: 0, message: 'Must be 0 or greater' }
              ]}
            >
              <InputNumber
                min={0}
                max={jobCard.quantity}
                className='w-full'
                placeholder='Enter accepted quantity'
              />
            </Form.Item>

            <Form.Item
              name='rejectedQuantity'
              label='Rejected Quantity'
              rules={[
                { required: true, message: 'Please enter rejected quantity' },
                { type: 'number', min: 0, message: 'Must be 0 or greater' }
              ]}
            >
              <InputNumber
                min={0}
                max={jobCard.quantity}
                className='w-full'
                placeholder='Enter rejected quantity'
              />
            </Form.Item>

            <Form.Item
              name='rejectionReason'
              label='Rejection Reason'
              rules={[
                {
                  validator: (_, value) => {
                    const rejectedQty = form.getFieldValue('rejectedQuantity')
                    if (rejectedQty > 0 && !value) {
                      return Promise.reject(
                        'Rejection reason is required when quantity is rejected'
                      )
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <TextArea
                rows={4}
                placeholder='Enter reason for rejection (required if rejected quantity > 0)'
              />
            </Form.Item>
          </div>

          <div className='flex justify-end mt-6'>
            <Button type='submit' loading={submitting} disabled={submitting}>
              Submit QA Report
            </Button>
          </div>
        </Form>

        {/* Later Acceptance Section - Show only if there are rejected items */}
        {jobCard.rejectedQuantity > 0 && (
          <div className='mt-8 p-4 border-t'>
            <h3 className='mb-4 text-lg font-medium'>Later Acceptance</h3>
            <Form layout='vertical' onFinish={handleLaterAcceptance}>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <Form.Item
                  name='laterAcceptedQuantity'
                  label='Later Accepted Quantity'
                  rules={[
                    {
                      required: true,
                      message: 'Please enter quantity to accept'
                    },
                    {
                      type: 'number',
                      min: 1,
                      max: jobCard.rejectedQuantity,
                      message: `Must be between 1 and ${jobCard.rejectedQuantity}`
                    }
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={jobCard.rejectedQuantity}
                    className='w-full'
                    placeholder='Enter quantity to accept later'
                  />
                </Form.Item>

                <Form.Item
                  name='laterAcceptanceReason'
                  label='Reason for Later Acceptance'
                  rules={[
                    {
                      required: true,
                      message: 'Please enter reason for later acceptance'
                    }
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder='Enter reason for accepting previously rejected items'
                  />
                </Form.Item>
              </div>

              <div className='flex justify-end mt-4'>
                <Button
                  type='submit'
                  loading={submitting}
                  disabled={submitting}
                >
                  Update Later Acceptance
                </Button>
              </div>
            </Form>
          </div>
        )}
      </div>
    </div>
  )
}

export default QAReporting
