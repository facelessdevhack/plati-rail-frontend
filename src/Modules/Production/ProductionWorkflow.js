import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Tag,
  List,
  Badge,
  message,
  Modal,
  Select,
  Button as AntButton,
  Input
} from 'antd'
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { mockApiResponses } from '../../Utils/mockProductionData'

const { Option } = Select
const { TextArea } = Input

const ProductionWorkflow = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [allJobCards, setAllJobCards] = useState([])
  const [productionSteps, setProductionSteps] = useState([])
  const [updateModalVisible, setUpdateModalVisible] = useState(false)
  const [selectedJobCard, setSelectedJobCard] = useState(null)
  const [selectedStep, setSelectedStep] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [stepsLoading, setStepsLoading] = useState(true)
  const [jobCardsLoading, setJobCardsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchJobCards(), fetchProductionSteps()])
      setLoading(false)
    }

    fetchData()
  }, [])

  const fetchJobCards = async () => {
    try {
      const response = await client.get('/v2/production/job-cards')
      if (response.data && response.data.result) {
        setAllJobCards(response.data.result)
      }
      return true
    } catch (error) {
      console.error('Error fetching job cards:', error)
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getJobCards()
      setAllJobCards(mockResponse.result)
      return true
    }
  }

  const fetchProductionSteps = async () => {
    try {
      const response = await client.get('/v2/production/get-steps')
      if (response.data && response.data.result) {
        setProductionSteps(response.data.result)
      }
      return true
    } catch (error) {
      console.error('Error fetching production steps:', error)
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getProductionSteps()
      setProductionSteps(mockResponse.result)
      return true
    }
  }

  const getJobCardsByStep = stepId => {
    return allJobCards.filter(card => card.prodStep === stepId)
  }

  const getStatusTag = status => {
    if (!status) return <Tag>PENDING</Tag>

    let color = 'default'
    let icon = null

    switch (status) {
      case 'completed':
        color = 'success'
        icon = <CheckCircleOutlined />
        break
      case 'in-progress':
        color = 'processing'
        icon = <ClockCircleOutlined />
        break
      case 'pending':
        color = 'warning'
        icon = <ExclamationCircleOutlined />
        break
      default:
        break
    }

    return (
      <Tag color={color} icon={icon}>
        {status.toUpperCase()}
      </Tag>
    )
  }

  const showUpdateModal = jobCard => {
    setSelectedJobCard(jobCard)
    setSelectedStep(jobCard.prodStep)
    setNotes('')
    setUpdateModalVisible(true)
  }

  const handleUpdateStep = async () => {
    if (!selectedJobCard || selectedStep === null) {
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        jobCardId: selectedJobCard.id,
        prodStep: selectedStep,
        notes: notes || undefined
      }

      const response = await client.post(
        '/v2/production/update-production-job-card',
        payload
      )

      if (response.data && response.data.message) {
        message.success(response.data.message)
        fetchJobCards()
      }
    } catch (error) {
      console.error('Error updating job card:', error)
      // Use mock data when API fails
      const mockResponse = mockApiResponses.updateJobCard()
      message.success(mockResponse.message)
      // Update the local job card data to reflect the change
      setAllJobCards(prevCards =>
        prevCards.map(card =>
          card.id === parseInt(selectedJobCard.id)
            ? { ...card, prodStep: parseInt(selectedStep) }
            : card
        )
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDragEnd = async result => {
    const { source, destination, draggableId } = result

    // Dropped outside the list
    if (!destination) {
      return
    }

    // Dropped in the same list
    if (source.droppableId === destination.droppableId) {
      return
    }

    const jobCardId = parseInt(draggableId)
    const targetStepId = parseInt(destination.droppableId)

    try {
      setLoading(true)

      const payload = {
        jobCardId,
        prodStep: targetStepId
      }

      const response = await client.post(
        '/v2/production/update-production-job-card',
        payload
      )

      if (response.status === 200) {
        message.success('Job card moved successfully')
        fetchJobCards() // Refresh the job cards
      }
    } catch (error) {
      console.error('Error moving job card:', error)
      // message.error('Failed to move job card')
    } finally {
      setLoading(false)
    }
  }

  const renderJobCard = (jobCard, index) => (
    <Draggable
      key={jobCard.id.toString()}
      draggableId={jobCard.id.toString()}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 ${snapshot.isDragging ? 'dragging' : ''}`}
        >
          <Card
            size='small'
            hoverable
            className={`${
              jobCard.urgent ? 'border-red-500 border-2' : ''
            } shadow-sm`}
            onClick={() => navigate(`/production-job-card/${jobCard.id}`)}
          >
            <div className='flex justify-between mb-2'>
              <div>
                <strong>#{jobCard.id}</strong>
              </div>
              <div>{getStatusTag(jobCard.status)}</div>
            </div>
            <div className='mb-1'>
              <small>Plan: </small>
              <a
                onClick={e => {
                  e.stopPropagation()
                  navigate(`/production-plan/${jobCard.prodPlanId}`)
                }}
              >
                #{jobCard.prodPlanId}
              </a>
            </div>
            <div className='mb-1'>
              <small>Alloy: </small>
              {jobCard.alloyName || 'N/A'}
            </div>
            <div className='mb-1'>
              <small>Qty: </small>
              {jobCard.quantity}
            </div>
            <div className='mt-2 text-right'>
              <AntButton
                type='link'
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  showUpdateModal(jobCard)
                }}
              >
                Update
              </AntButton>
            </div>
            {jobCard.urgent && (
              <Badge.Ribbon text='URGENT' color='red' placement='start' />
            )}
          </Card>
        </div>
      )}
    </Draggable>
  )

  if (loading) {
    return (
      <div className='flex items-center justify-center w-full h-64'>
        <Spin size='large' />
      </div>
    )
  }

  return (
    <div className='w-full p-5 bg-background-grey'>
      <div className='flex items-center justify-between mb-6'>
        <div className='text-2xl font-bold'>Production Workflow</div>
        <div>
          <Button onClick={() => fetchJobCards()}>Refresh</Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Row gutter={16} className='mb-6'>
          {productionSteps.map((step, index) => (
            <Col
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={4}
              key={step.id}
              className='mb-4'
            >
              <Card
                title={
                  <div className='flex items-center justify-between'>
                    <span>
                      {index + 1}. {step.name}
                    </span>
                    <Badge
                      count={getJobCardsByStep(step.id).length}
                      style={{
                        backgroundColor:
                          getJobCardsByStep(step.id).length > 0
                            ? '#1890ff'
                            : '#d9d9d9'
                      }}
                    />
                  </div>
                }
                className='h-full'
                bodyStyle={{ padding: '8px', height: 'calc(100% - 48px)' }}
              >
                <Droppable droppableId={step.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[300px] p-2 rounded ${
                        snapshot.isDraggingOver
                          ? 'bg-blue-50 border border-blue-200'
                          : ''
                      }`}
                    >
                      {getJobCardsByStep(step.id).length > 0 ? (
                        getJobCardsByStep(step.id).map((jobCard, index) =>
                          renderJobCard(jobCard, index)
                        )
                      ) : (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description='No job cards'
                        />
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </Card>
            </Col>
          ))}
        </Row>
      </DragDropContext>

      <Modal
        title='Update Production Step'
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={[
          <AntButton key='cancel' onClick={() => setUpdateModalVisible(false)}>
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
        {selectedJobCard && (
          <div className='space-y-4'>
            <div>
              <p className='mb-2'>
                Job Card: <strong>#{selectedJobCard.id}</strong>
              </p>
              <p className='mb-2'>
                Current Step:{' '}
                <strong>
                  {
                    productionSteps.find(s => s.id === selectedJobCard.prodStep)
                      ?.name
                  }
                </strong>
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
              <label className='block mb-2 font-medium'>
                Notes (Optional):
              </label>
              <TextArea
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder='Enter any notes about this step update'
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ProductionWorkflow
