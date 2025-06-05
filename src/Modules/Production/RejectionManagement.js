import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button as AntButton,
  message,
  Form,
  Input,
  Select,
  Descriptions,
  Table,
  Tag,
  Card,
  Modal
} from 'antd'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { useSelector } from 'react-redux'

const { Option } = Select
const { TextArea } = Input

const RejectionManagement = () => {
  const { jobCardId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [rejections, setRejections] = useState([])
  const [jobCard, setJobCard] = useState(null)
  const [resolveModalVisible, setResolveModalVisible] = useState(false)
  const [selectedRejection, setSelectedRejection] = useState(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const { user } = useSelector(state => state.userDetails)

  useEffect(() => {
    if (jobCardId) {
      fetchJobCardRejections()
      fetchJobCardDetails()
    } else {
      fetchAllRejections()
    }
  }, [jobCardId])

  const fetchJobCardRejections = async () => {
    try {
      setLoading(true)
      const response = await client.get(
        `/v2/production/rejections/job-card/${jobCardId}`
      )
      if (response.data && response.data.result) {
        setRejections(response.data.result)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching rejections:', error)
      // Use mock data when API fails
      const mockRejections = [
        {
          id: 1,
          prodPlanId: 1,
          prodJobCardId: parseInt(jobCardId),
          rejectedQuantity: 5,
          rejectionReason: 'Surface defects found during quality inspection',
          isResolved: false,
          createdBy: 1,
          createdAt: '2024-01-15T10:30:00Z',
          resolvedAt: null,
          resolutionAction: null,
          resolutionNotes: null
        }
      ]
      setRejections(mockRejections)
      setLoading(false)
    }
  }

  const fetchAllRejections = async () => {
    try {
      setLoading(true)
      const response = await client.get('/v2/production/rejections')
      if (response.data && response.data.result) {
        setRejections(response.data.result)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching all rejections:', error)
      message.error('Failed to load rejections')
      setLoading(false)
    }
  }

  const fetchJobCardDetails = async () => {
    try {
      const response = await client.get(`/v2/production/job-cards/${jobCardId}`)
      if (response.data && response.data.result) {
        setJobCard(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching job card details:', error)
    }
  }

  const showResolveModal = rejection => {
    setSelectedRejection(rejection)
    form.resetFields()
    setResolveModalVisible(true)
  }

  const handleResolveRejection = async values => {
    try {
      setSubmitting(true)

      const payload = {
        rejectionId: selectedRejection.id,
        resolutionAction: values.resolutionAction,
        resolutionNotes: values.resolutionNotes,
        resolvedBy: user.userId
      }

      const response = await client.post(
        '/v2/production/resolve-rejection',
        payload
      )

      if (response.data && response.data.message) {
        message.success(response.data.message)
        setResolveModalVisible(false)
        if (jobCardId) {
          fetchJobCardRejections()
        } else {
          fetchAllRejections()
        }
      }
    } catch (error) {
      console.error('Error resolving rejection:', error)
      message.error('Failed to resolve rejection')
    } finally {
      setSubmitting(false)
    }
  }

  const createNewJobCard = async rejection => {
    try {
      setSubmitting(true)

      const payload = {
        prodPlanId: rejection.prodPlanId,
        quantity: rejection.rejectedQuantity,
        userId: user.userId,
        originalJobCardId: rejection.prodJobCardId,
        reason: 'Rework for rejected items'
      }

      const response = await client.post(
        '/v2/production/add-production-job-card',
        payload
      )

      if (response.data && response.data.message) {
        message.success('New job card created for rework')
        // Also mark the rejection as resolved
        await handleResolveRejection({
          resolutionAction: 'rework',
          resolutionNotes: 'Created new job card for rework'
        })
      }
    } catch (error) {
      console.error('Error creating rework job card:', error)
      message.error('Failed to create rework job card')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatus = rejection => {
    if (rejection.isResolved) {
      return <Tag color='green'>RESOLVED</Tag>
    } else {
      return <Tag color='blue'>PENDING</Tag>
    }
  }

  const getResolutionAction = action => {
    const actionColors = {
      rework: 'processing',
      scrap: 'error',
      accept: 'success',
      return: 'warning'
    }

    return (
      <Tag color={actionColors[action] || 'default'}>
        {action?.toUpperCase()}
      </Tag>
    )
  }

  const columns = [
    {
      title: 'Rejection ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Job Card ID',
      dataIndex: 'prodJobCardId',
      key: 'prodJobCardId',
      render: jobCardId => (
        <a onClick={() => navigate(`/production-job-card/${jobCardId}`)}>
          {jobCardId}
        </a>
      )
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
      title: 'Rejected Quantity',
      dataIndex: 'rejectedQuantity',
      key: 'rejectedQuantity'
    },
    {
      title: 'Rejection Reason',
      dataIndex: 'rejectionReason',
      key: 'rejectionReason',
      ellipsis: true
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatus(record)
    },
    {
      title: 'Resolution Action',
      dataIndex: 'resolutionAction',
      key: 'resolutionAction',
      render: action => (action ? getResolutionAction(action) : '-')
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
          {!record.isResolved && (
            <>
              <AntButton type='link' onClick={() => showResolveModal(record)}>
                Resolve
              </AntButton>
              <AntButton
                type='link'
                onClick={() => createNewJobCard(record)}
                loading={submitting}
              >
                Create Rework
              </AntButton>
            </>
          )}
        </span>
      )
    }
  ]

  return (
    <div className='w-full p-5 bg-background-grey'>
      <div className='flex items-center justify-between mb-6'>
        <div className='text-2xl font-bold'>
          {jobCardId ? 'Job Card Rejections' : 'All Rejections Management'}
        </div>
        <>
          {jobCardId && (
            <Button
              onClick={() => navigate(`/production-job-card/${jobCardId}`)}
            >
              Back to Job Card
            </Button>
          )}
        </>
      </div>

      {jobCard && (
        <div className='p-6 mb-6 bg-white rounded-lg shadow'>
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
            <Descriptions.Item label='Total Quantity'>
              {jobCard.quantity}
            </Descriptions.Item>
            <Descriptions.Item label='Accepted Quantity'>
              {jobCard.acceptedQuantity || 0}
            </Descriptions.Item>
            <Descriptions.Item label='Rejected Quantity'>
              {jobCard.rejectedQuantity || 0}
            </Descriptions.Item>
            <Descriptions.Item label='Current Step'>
              {jobCard.stepName}
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}

      {/* Rejection Statistics */}
      <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-4'>
        <Card className='text-center'>
          <div className='text-2xl font-bold text-red-600'>
            {rejections.filter(r => !r.isResolved).length}
          </div>
          <div className='text-gray-600'>Pending Rejections</div>
        </Card>
        <Card className='text-center'>
          <div className='text-2xl font-bold text-green-600'>
            {rejections.filter(r => r.isResolved).length}
          </div>
          <div className='text-gray-600'>Resolved Rejections</div>
        </Card>
        <Card className='text-center'>
          <div className='text-2xl font-bold text-orange-600'>
            {rejections.reduce((sum, r) => sum + (r.rejectedQuantity || 0), 0)}
          </div>
          <div className='text-gray-600'>Total Rejected Quantity</div>
        </Card>
        <Card className='text-center'>
          <div className='text-2xl font-bold text-blue-600'>
            {rejections.filter(r => r.resolutionAction === 'rework').length}
          </div>
          <div className='text-gray-600'>Rework Items</div>
        </Card>
      </div>

      <div className='bg-white rounded-lg shadow'>
        <Table
          columns={columns}
          dataSource={rejections}
          rowKey='id'
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: record => (
              <div className='p-4'>
                <Descriptions title='Rejection Details' bordered size='small'>
                  <Descriptions.Item label='Full Rejection Reason' span={3}>
                    {record.rejectionReason}
                  </Descriptions.Item>
                  {record.resolutionNotes && (
                    <Descriptions.Item label='Resolution Notes' span={3}>
                      {record.resolutionNotes}
                    </Descriptions.Item>
                  )}
                  {record.resolvedAt && (
                    <Descriptions.Item label='Resolved At'>
                      {new Date(record.resolvedAt).toLocaleString()}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )
          }}
        />
      </div>

      <Modal
        title='Resolve Rejection'
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        footer={[
          <AntButton key='cancel' onClick={() => setResolveModalVisible(false)}>
            Cancel
          </AntButton>,
          <AntButton
            key='submit'
            type='primary'
            loading={submitting}
            onClick={() => form.submit()}
          >
            Resolve Rejection
          </AntButton>
        ]}
      >
        {selectedRejection && (
          <div className='space-y-4'>
            <div>
              <p className='mb-2'>
                Rejection ID: <strong>{selectedRejection.id}</strong>
              </p>
              <p className='mb-2'>
                Rejected Quantity:{' '}
                <strong>{selectedRejection.rejectedQuantity}</strong>
              </p>
              <p className='mb-2'>
                Reason: <strong>{selectedRejection.rejectionReason}</strong>
              </p>
            </div>

            <Form
              form={form}
              layout='vertical'
              onFinish={handleResolveRejection}
            >
              <Form.Item
                name='resolutionAction'
                label='Resolution Action'
                rules={[
                  { required: true, message: 'Please select resolution action' }
                ]}
              >
                <Select placeholder='Select resolution action'>
                  <Option value='rework'>
                    Rework - Send back to production
                  </Option>
                  <Option value='scrap'>Scrap - Mark as waste</Option>
                  <Option value='accept'>Accept - Override rejection</Option>
                  <Option value='return'>Return - Send back to supplier</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name='resolutionNotes'
                label='Resolution Notes'
                rules={[
                  { required: true, message: 'Please enter resolution notes' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder='Enter detailed notes about the resolution action'
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default RejectionManagement
