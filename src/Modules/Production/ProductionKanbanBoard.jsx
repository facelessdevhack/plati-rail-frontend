import React, { useState, useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import {
  Card,
  Row,
  Col,
  Badge,
  Tag,
  Button,
  Space,
  Tooltip,
  Avatar,
  Progress,
  Typography,
  Dropdown,
  Menu,
  Modal,
  Form,
  Input,
  message,
  notification,
  Divider
} from 'antd'
import {
  MoreOutlined,
  EditOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import moment from 'moment'
// import { useRealTimeProduction } from '../../Hooks'

// Temporary mock for useRealTimeProduction - replace with actual import when path issue is resolved
const useRealTimeProduction = () => ({
  connected: true,
  subscribe: (event, callback) => {
    console.log(`Mock: Subscribed to ${event}`)
    return () => console.log(`Mock: Unsubscribed from ${event}`)
  }
})

const { Title, Text } = Typography
const { TextArea } = Input

const ProductionKanbanBoard = ({ productionPlans, jobCards, onAction, className }) => {
  const [selectedCard, setSelectedCard] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)
  const [editForm] = Form.useForm()

  // Real-time updates
  const { connected, subscribe } = useRealTimeProduction()

  // Subscribe to real-time updates
  React.useEffect(() => {
    const unsubscribe = subscribe('JOBCARD_UPDATED', (data) => {
      console.log('Real-time job card update:', data)
      // Handle real-time updates here
    })

    return unsubscribe
  }, [subscribe])

  // Define workflow columns
  const workflowColumns = [
    {
      id: 'pending',
      title: 'Pending',
      icon: <ClockCircleOutlined />,
      color: '#faad14',
      description: 'Waiting to start'
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: <PlayCircleOutlined />,
      color: '#1890ff',
      description: 'Currently being worked on'
    },
    {
      id: 'quality_check',
      title: 'Quality Check',
      icon: <ToolOutlined />,
      color: '#722ed1',
      description: 'Quality control in progress'
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      description: 'Successfully completed'
    },
    {
      id: 'paused',
      title: 'Paused',
      icon: <PauseCircleOutlined />,
      color: '#ff7a45',
      description: 'Temporarily on hold'
    }
  ]

  // Group job cards by status
  const columnsData = useMemo(() => {
    return workflowColumns.map(column => {
      const columnJobCards = jobCards.filter(card => {
        const status = card.currentStepStatus || 'pending'
        return status === column.id
      })

      return {
        ...column,
        jobCards: columnJobCards,
        count: columnJobCards.length
      }
    })
  }, [jobCards, workflowColumns])

  // Handle drag and drop
  const handleDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result

    if (!destination ||
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    const draggedCard = jobCards.find(card => card.id.toString() === draggableId)
    if (!draggedCard) return

    // Update card status
    const newStatus = destination.droppableId
    onAction && onAction({
      type: 'UPDATE_CARD_STATUS',
      cardId: draggedCard.id,
      oldStatus: source.droppableId,
      newStatus,
      card: draggedCard
    })

    // Show success notification
    notification.success({
      message: 'Job Card Updated',
      description: `Moved ${draggedCard.alloyName} from ${source.droppableId} to ${newStatus}`,
      duration: 3
    })
  }, [jobCards, onAction])

  // Handle card actions
  const handleCardAction = useCallback((actionType, card) => {
    setSelectedCard(card)
    setCurrentAction(actionType)

    switch (actionType) {
      case 'details':
        setDetailModalVisible(true)
        break
      case 'edit':
        setEditModalVisible(true)
        editForm.setFieldsValue({
          notes: card.notes || '',
          quantity: card.quantity,
          priority: card.priority || 'normal'
        })
        break
      case 'next_step':
        setActionModalVisible(true)
        break
      case 'pause':
        onAction && onAction({
          type: 'PAUSE_CARD',
          cardId: card.id,
          card
        })
        break
      case 'resume':
        onAction && onAction({
          type: 'RESUME_CARD',
          cardId: card.id,
          card
        })
        break
      case 'complete':
        setActionModalVisible(true)
        break
      default:
        break
    }
  }, [onAction, editForm])

  // Card actions menu
  const getCardActions = (card) => {
    const actions = []

    if (card.currentStepStatus === 'pending') {
      actions.push({
        key: 'start',
        icon: <PlayCircleOutlined />,
        label: 'Start Work',
        onClick: () => handleCardAction('next_step', card)
      })
    }

    if (card.currentStepStatus === 'in_progress') {
      actions.push({
        key: 'pause',
        icon: <PauseCircleOutlined />,
        label: 'Pause',
        onClick: () => handleCardAction('pause', card)
      })
    }

    if (card.currentStepStatus === 'paused') {
      actions.push({
        key: 'resume',
        icon: <PlayCircleOutlined />,
        label: 'Resume',
        onClick: () => handleCardAction('resume', card)
      })
    }

    actions.push(
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit',
        onClick: () => handleCardAction('edit', card)
      },
      {
        key: 'details',
        icon: <EyeOutlined />,
        label: 'Details',
        onClick: () => handleCardAction('details', card)
      }
    )

    return actions
  }

  // Handle action modal submission
  const handleActionSubmit = useCallback(() => {
    if (!selectedCard || !currentAction) return

    switch (currentAction) {
      case 'next_step':
        onAction && onAction({
          type: 'MOVE_TO_NEXT_STEP',
          cardId: selectedCard.id,
          card: selectedCard
        })
        break
      case 'complete':
        onAction && onAction({
          type: 'COMPLETE_CARD',
          cardId: selectedCard.id,
          card: selectedCard
        })
        break
      default:
        break
    }

    setActionModalVisible(false)
    setCurrentAction(null)
    setSelectedCard(null)
  }, [selectedCard, currentAction, onAction])

  // Handle edit submission
  const handleEditSubmit = useCallback(async () => {
    try {
      const values = await editForm.validateFields()

      onAction && onAction({
        type: 'UPDATE_CARD',
        cardId: selectedCard.id,
        updates: values,
        card: selectedCard
      })

      setEditModalVisible(false)
      setSelectedCard(null)
      editForm.resetFields()

      message.success('Job card updated successfully')
    } catch (error) {
      console.error('Failed to update job card:', error)
    }
  }, [editForm, selectedCard, onAction])

  // Render job card
  const renderJobCard = (card, index) => (
    <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
      <div className="mb-2">
        <Card
          size="small"
          hoverable
          className="kanban-card cursor-move"
          style={{
            marginBottom: 8,
            borderLeft: `4px solid ${workflowColumns.find(col => col.id === card.currentStepStatus)?.color || '#d9d9d9'}`
          }}
          actions={[
            <Dropdown
              overlay={<Menu items={getCardActions(card)} />}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
              />
            </Dropdown>
          ]}
        >
          <Card.Meta
            avatar={
              <Avatar size="small" icon={<ToolOutlined />} />
            }
            title={
              <div className="flex items-center justify-between">
                <Text strong className="text-sm">
                  {card.alloyName || `Job Card #${card.jobCardId}`}
                </Text>
                <Badge
                  count={card.quantity || 0}
                  size="small"
                  style={{ backgroundColor: '#52c41a' }}
                />
              </div>
            }
            description={
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Text type="secondary" className="text-xs">
                    {card.convertName || 'No conversion'}
                  </Text>
                  <Tag color="blue" size="small">
                    {card.currentStepName || 'Not Started'}
                  </Tag>
                </div>

                {card.progress > 0 && (
                  <Progress
                    percent={card.progress}
                    size="small"
                    showInfo={false}
                    strokeColor="#52c41a"
                  />
                )}

                <div className="flex items-center justify-between">
                  <Text type="secondary" className="text-xs">
                    <CalendarOutlined /> {moment(card.createdAt).format('MMM DD')}
                  </Text>
                  {card.priority === 'urgent' && (
                    <Tag color="red" size="small">URGENT</Tag>
                  )}
                </div>

                {card.notes && (
                  <Text type="secondary" className="text-xs italic">
                    {card.notes.length > 50
                      ? `${card.notes.substring(0, 50)}...`
                      : card.notes
                    }
                  </Text>
                )}
              </div>
            }
          />
        </Card>
      </div>
    </Draggable>
  )

  return (
    <div className={`production-kanban-board ${className || ''}`}>
      {/* Connection Status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Title level={4}>Production Workflow Board</Title>
          <Badge
            count={connected ? 'Live' : 'Offline'}
            color={connected ? 'green' : 'red'}
            style={{ marginTop: 4 }}
          />
        </div>
        <Space>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => {/* Handle bulk actions */}}
          >
            Quick Actions
          </Button>
          <Button
            icon={<ToolOutlined />}
            onClick={() => {/* Handle workflow management */}}
          >
            Manage Workflow
          </Button>
        </Space>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Row gutter={16}>
          {columnsData.map(column => (
            <Col span={24 / workflowColumns.length} key={column.id}>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-column ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    style={{
                      minHeight: 400,
                      backgroundColor: snapshot.isDraggingOver ? '#f0f8ff' : '#fafafa',
                      border: `2px dashed ${column.color}`,
                      borderRadius: 8,
                      padding: 16
                    }}
                  >
                    {/* Column Header */}
                    <div className="mb-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {column.icon}
                        <Title level={5} className="mb-0">
                          {column.title}
                        </Title>
                        <Badge
                          count={column.count}
                          style={{ backgroundColor: column.color }}
                        />
                      </div>
                      <Text type="secondary" className="text-xs">
                        {column.description}
                      </Text>
                    </div>

                    {/* Cards Container */}
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {column.jobCards.map((card, index) => renderJobCard(card, index))}
                    </div>

                    {/* Empty State */}
                    {column.jobCards.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2 opacity-20">
                          {column.icon}
                        </div>
                        <Text type="secondary" className="text-sm">
                          No items in {column.title.toLowerCase()}
                        </Text>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </Col>
          ))}
        </Row>
      </DragDropContext>

      {/* Details Modal */}
      <Modal
        title={`Job Card Details #${selectedCard?.jobCardId}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedCard && (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Product:</Text>
                <div>{selectedCard.alloyName}</div>
              </Col>
              <Col span={12}>
                <Text strong>Conversion:</Text>
                <div>{selectedCard.convertName}</div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Quantity:</Text>
                <div>{selectedCard.quantity}</div>
              </Col>
              <Col span={8}>
                <Text strong>Current Step:</Text>
                <div>{selectedCard.currentStepName}</div>
              </Col>
              <Col span={8}>
                <Text strong>Status:</Text>
                <Tag color={workflowColumns.find(col => col.id === selectedCard.currentStepStatus)?.color}>
                  {selectedCard.currentStepStatus}
                </Tag>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Created:</Text>
                <div>{moment(selectedCard.createdAt).format('YYYY-MM-DD HH:mm')}</div>
              </Col>
              <Col span={12}>
                <Text strong>Progress:</Text>
                <Progress percent={selectedCard.progress} />
              </Col>
            </Row>
            {selectedCard.notes && (
              <div>
                <Text strong>Notes:</Text>
                <div>{selectedCard.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Job Card"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          editForm.resetFields()
        }}
        onOk={handleEditSubmit}
        okText="Save Changes"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Action Modal */}
      <Modal
        title={`${currentAction === 'complete' ? 'Complete' : 'Move to Next Step'}`}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false)
          setCurrentAction(null)
          setSelectedCard(null)
        }}
        onOk={handleActionSubmit}
        okText={currentAction === 'complete' ? 'Complete' : 'Next Step'}
        cancelText="Cancel"
      >
        <div className="space-y-4">
          <div>
            <Text strong>Job Card:</Text>
            <div>{selectedCard?.alloyName}</div>
          </div>
          <div>
            <Text strong>Current Step:</Text>
            <div>{selectedCard?.currentStepName}</div>
          </div>
          <div>
            <Text>Are you sure you want to {currentAction === 'complete' ? 'complete' : 'move to the next step'} this job card?</Text>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProductionKanbanBoard