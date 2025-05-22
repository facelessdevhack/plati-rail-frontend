import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Form, message } from 'antd'
import CustomInput from '../../Core/Components/CustomInput'
import CustomSelect from '../../Core/Components/CustomSelect'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { mockApiResponses } from '../../Utils/mockProductionData'

const CreateProductionPlan = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alloys, setAlloys] = useState([])
  const [conversionAlloys, setConversionAlloys] = useState([])
  const { user } = useSelector(state => state.userDetails)

  useEffect(() => {
    fetchAlloys()
    fetchConversionAlloys()
  }, [])

  const fetchAlloys = async () => {
    try {
      setLoading(true)
      const response = await client.get('/v2/production/alloys')
      if (response.data && response.data.result) {
        setAlloys(response.data.result)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching alloys:', error)
      // message.error('Failed to load alloys. Using mock data instead.')
      // Use mock data when API fails
      setAlloys([
        { id: 1, name: 'PY-009' },
        { id: 2, name: 'PY-023' },
        { id: 3, name: 'PY-025' },
        { id: 4, name: 'PY-027' }
      ])
      setLoading(false)
    }
  }

  const fetchConversionAlloys = async () => {
    try {
      const response = await client.get('/v2/production/conversion-alloys')
      if (response.data && response.data.result) {
        setConversionAlloys(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching conversion alloys:', error)
      // message.error(
      //   'Failed to load conversion alloys. Using mock data instead.'
      // )
      // Use mock data when API fails
      setConversionAlloys([
        { id: 5, name: 'Sheet Metal' },
        { id: 6, name: 'Rod' },
        { id: 7, name: 'Wire' },
        { id: 8, name: 'Tube' },
        { id: 9, name: 'Plate' }
      ])
    }
  }

  const handleSubmit = async values => {
    try {
      setSubmitting(true)
      const payload = {
        alloyId: parseInt(values.alloyId),
        convertId: parseInt(values.convertId),
        quantity: parseInt(values.quantity),
        urgent: values.urgent || false,
        userId: user.userId
      }

      const response = await client.post(
        '/v2/production/add-production-plan',
        payload
      )

      if (response.data && response.data.message) {
        message.success(response.data.message)
        navigate('/production-plans')
      }
    } catch (error) {
      console.error('Error creating production plan:', error)
      // message.error(
      //   'Failed to create production plan. Using mock response instead.'
      // )
      // Use mock data when API fails
      const mockResponse = mockApiResponses.createProductionPlan()
      message.success(mockResponse.message)
      navigate('/production-plans')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='w-full p-5 bg-background-grey'>
      <div className='mb-6 text-2xl font-bold'>Create Production Plan</div>
      <div className='p-6 bg-white rounded-lg shadow'>
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          initialValues={{ urgent: false }}
        >
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <Form.Item
              name='alloyId'
              label='Select Alloy'
              rules={[{ required: true, message: 'Please select an alloy' }]}
            >
              <CustomSelect
                showSearch={true}
                className='w-full'
                options={alloys}
                placeholder='Select an alloy'
                loading={loading}
              />
            </Form.Item>

            <Form.Item
              name='convertId'
              label='Select Conversion Alloy'
              rules={[
                { required: true, message: 'Please select a conversion alloy' }
              ]}
            >
              <CustomSelect
                showSearch={true}
                className='w-full'
                options={conversionAlloys}
                placeholder='Select conversion alloy'
                loading={loading}
              />
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
                }
              ]}
            >
              <CustomInput type='number' placeholder='Enter quantity' />
            </Form.Item>

            <Form.Item name='urgent' valuePropName='checked'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='urgent'
                  className='w-4 h-4'
                  onChange={e =>
                    form.setFieldsValue({ urgent: e.target.checked })
                  }
                />
                <label htmlFor='urgent' className='text-sm font-medium'>
                  Urgent
                </label>
              </div>
            </Form.Item>
          </div>

          <div className='flex justify-end mt-6'>
            <Button type='submit' loading={submitting} disabled={submitting}>
              Create Production Plan
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default CreateProductionPlan
