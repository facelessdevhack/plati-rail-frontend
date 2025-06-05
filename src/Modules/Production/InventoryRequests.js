import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button as AntButton,
  message,
  Modal,
  InputNumber,
  Form,
  Descriptions,
  Table,
  Tag
} from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { useSelector } from 'react-redux'

const InventoryRequests = () => {
  const { planId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [productionPlan, setProductionPlan] = useState(null)
  const [fulfillModalVisible, setFulfillModalVisible] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const { user } = useSelector(state => state.userDetails)

  useEffect(() => {
    if (planId) {
      fetchInventoryRequests()
      fetchProductionPlan()
    } else {
      fetchAllInventoryRequests()
    }
  }, [planId])

  const fetchInventoryRequests = async () => {
    try {
      setLoading(true)
      const endpoint = planId
        ? `/v2/production/inventory-requests/${planId}`
        : '/v2/production/inventory-requests'

      const response = await client.get(endpoint)
      if (response.data && response.data.result) {
        setRequests(response.data.result)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching inventory requests:', error)
      message.error('Failed to load inventory requests')
      setLoading(false)
    }
  }

  const fetchAllInventoryRequests = async () => {
    try {
      setLoading(true)
      const response = await client.get('/v2/production/inventory-requests')
      if (response.data && response.data.result) {
        setRequests(response.data.result)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching inventory requests:', error)
      message.error('Failed to load inventory requests')
      setLoading(false)
    }
  }

  const fetchProductionPlan = async () => {
    try {
      const response = await client.get(
        `/v2/production/production-plans/${planId}`
      )
      if (response.data && response.data.result) {
        setProductionPlan(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching production plan:', error)
    }
  }

  const createInventoryRequest = async () => {
    if (!productionPlan) return

    try {
      setSubmitting(true)
      const payload = {
        prodPlanId: parseInt(planId),
        quantity: productionPlan.quantity,
        userId: user.userId
      }

      const response = await client.post('/v2/inventory/request', payload)

      if (response.data && response.data.message) {
        message.success(response.data.message)
        fetchInventoryRequests()
      }
    } catch (error) {
      console.error('Error creating inventory request:', error)
      message.error('Failed to create inventory request')
    } finally {
      setSubmitting(false)
    }
  }

  const showFulfillModal = request => {
    setSelectedRequest(request)
    form.setFieldsValue({
      sentQuantity: request.requestedQuantity
    })
    setFulfillModalVisible(true)
  }

  const handleFulfillRequest = async values => {
    try {
      setSubmitting(true)
      const payload = {
        jobCardId: selectedRequest.id,
        sentQuantity: parseInt(values.sentQuantity),
        isFulfilled: values.sentQuantity >= selectedRequest.requestedQuantity
      }

      const response = await client.post('/v2/inventory/update', payload)

      if (response.data && response.data.message) {
        message.success(response.data.message)
        setFulfillModalVisible(false)
        fetchInventoryRequests()
      }
    } catch (error) {
      console.error('Error fulfilling inventory request:', error)
      message.error('Failed to fulfill inventory request')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatus = request => {
    if (request.isFulfilled) {
      return <Tag color='green'>FULFILLED</Tag>
    } else if (request.sentQuantity > 0) {
      return <Tag color='blue'>PARTIAL</Tag>
    } else {
      return <Tag color='orange'>PENDING</Tag>
    }
  }

  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Production Plan ID',
      dataIndex: 'prodPlanId',
      key: 'prodPlanId',
      render: planId => (
        <a onClick={() => navigate(`/production-plan/${planId}`)}>{planId}</a>
      )
    },
    {
      title: 'Alloy',
      dataIndex: 'alloyName',
      key: 'alloyName'
    },
    {
      title: 'Requested Quantity',
      dataIndex: 'requestedQuantity',
      key: 'requestedQuantity'
    },
    {
      title: 'Sent Quantity',
      dataIndex: 'sentQuantity',
      key: 'sentQuantity',
      render: qty => qty || 0
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatus(record)
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => new Date(date).toLocaleString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <span style={{ fontSize: '12px' }}>
          {!record.isFulfilled && (
            <AntButton type='link' onClick={() => showFulfillModal(record)}>
              Fulfill
            </AntButton>
          )}
        </span>
      )
    }
  ]

  return (
    <div className='w-full p-5 bg-background-grey'>
      <div className='flex items-center justify-between mb-6'>
        <div className='text-2xl font-bold'>
          {planId
            ? 'Production Plan Inventory Requests'
            : 'All Inventory Requests'}
        </div>
        <>
          {planId && (
            <Button onClick={() => navigate(`/production-plan/${planId}`)}>
              Back to Production Plan
            </Button>
          )}
          {planId && productionPlan && requests.length === 0 && (
            <Button onClick={createInventoryRequest} loading={submitting}>
              Create Inventory Request
            </Button>
          )}
        </>
      </div>

      {productionPlan && (
        <div className='p-6 mb-6 bg-white rounded-lg shadow'>
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
            <Descriptions.Item label='Quantity'>
              {productionPlan.quantity}
            </Descriptions.Item>
            <Descriptions.Item label='Status'>
              {productionPlan.status ? (
                <Tag
                  color={
                    productionPlan.status === 'completed' ? 'green' : 'blue'
                  }
                >
                  {productionPlan.status.toUpperCase()}
                </Tag>
              ) : (
                <Tag color='blue'>PENDING</Tag>
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
      )}

      <div className='bg-white rounded-lg shadow'>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey='id'
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title='Fulfill Inventory Request'
        open={fulfillModalVisible}
        onCancel={() => setFulfillModalVisible(false)}
        footer={[
          <AntButton key='cancel' onClick={() => setFulfillModalVisible(false)}>
            Cancel
          </AntButton>,
          <AntButton
            key='submit'
            type='primary'
            loading={submitting}
            onClick={() => form.submit()}
          >
            Fulfill Request
          </AntButton>
        ]}
      >
        {selectedRequest && (
          <div className='space-y-4'>
            <div>
              <p className='mb-2'>
                Request ID: <strong>{selectedRequest.id}</strong>
              </p>
              <p className='mb-2'>
                Requested Quantity:{' '}
                <strong>{selectedRequest.requestedQuantity}</strong>
              </p>
              <p className='mb-2'>
                Already Sent:{' '}
                <strong>{selectedRequest.sentQuantity || 0}</strong>
              </p>
            </div>

            <Form form={form} layout='vertical' onFinish={handleFulfillRequest}>
              <Form.Item
                name='sentQuantity'
                label='Quantity to Send'
                rules={[
                  { required: true, message: 'Please enter quantity to send' },
                  { type: 'number', min: 1, message: 'Must be greater than 0' },
                  {
                    type: 'number',
                    max: selectedRequest?.requestedQuantity,
                    message: `Cannot exceed ${selectedRequest?.requestedQuantity}`
                  }
                ]}
              >
                <InputNumber
                  min={1}
                  max={selectedRequest?.requestedQuantity}
                  className='w-full'
                  placeholder='Enter quantity to send'
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default InventoryRequests
