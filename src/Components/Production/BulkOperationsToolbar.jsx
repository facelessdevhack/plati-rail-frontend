import React, { useState, useCallback, useMemo } from 'react'
import {
  Button,
  Dropdown,
  Menu,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  Divider,
  message,
  notification,
  Popconfirm,
  Checkbox,
  Tag,
  Tooltip,
  Badge,
  Card,
  Row,
  Col
} from 'antd'
import {
  ThunderboltOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  RocketOutlined,
  ToolOutlined,
  FireOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import moment from 'moment'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const BulkOperationsToolbar = ({
  selectedItems = [],
  selectedPlanIds = [],
  onBulkAction,
  loading = false,
  className = ''
}) => {
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)
  const [actionForm] = Form.useForm()
  const [customActionModalVisible, setCustomActionModalVisible] = useState(false)

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalPlans = selectedItems.length || selectedPlanIds.length
    const urgentPlans = selectedItems.filter(item => item.urgent).length
    const inProgressPlans = selectedItems.filter(item =>
      item.quantityTracking?.completionStatus === 'in_progress'
    ).length
    const totalQuantity = selectedItems.reduce((sum, item) =>
      sum + (item.quantity || 0), 0
    )
    const remainingQuantity = selectedItems.reduce((sum, item) =>
      sum + (item.quantityTracking?.remainingQuantity || 0), 0
    )

    return {
      totalPlans,
      urgentPlans,
      inProgressPlans,
      totalQuantity,
      remainingQuantity
    }
  }, [selectedItems, selectedPlanIds])

  // Bulk action configurations
  const bulkActions = useMemo(() => [
    {
      key: 'createJobCards',
      label: 'Create Job Cards',
      icon: <PlayCircleOutlined />,
      color: 'primary',
      description: 'Create job cards for selected plans',
      requiresQuantity: true,
      disabled: statistics.remainingQuantity === 0
    },
    {
      key: 'assignPreset',
      label: 'Assign Preset',
      icon: <SettingOutlined />,
      color: 'default',
      description: 'Assign preset to selected plans',
      requiresQuantity: false
    },
    {
      key: 'moveToNextStep',
      label: 'Move to Next Step',
      icon: <ThunderboltOutlined />,
      color: 'primary',
      description: 'Move job cards to next step',
      requiresQuantity: false
    },
    {
      key: 'pause',
      label: 'Pause Work',
      icon: <PauseCircleOutlined />,
      color: 'warning',
      description: 'Pause work on selected items',
      requiresQuantity: false
    },
    {
      key: 'resume',
      label: 'Resume Work',
      icon: <PlayCircleOutlined />,
      color: 'success',
      description: 'Resume work on paused items',
      requiresQuantity: false
    },
    {
      key: 'complete',
      label: 'Complete',
      icon: <CheckCircleOutlined />,
      color: 'success',
      description: 'Mark selected items as completed',
      requiresQuantity: false
    },
    {
      key: 'edit',
      label: 'Edit Items',
      icon: <EditOutlined />,
      color: 'default',
      description: 'Edit selected items',
      requiresQuantity: false
    },
    {
      key: 'delete',
      label: 'Delete Items',
      icon: <DeleteOutlined />,
      color: 'danger',
      description: 'Delete selected items',
      requiresQuantity: false
    },
    {
      key: 'export',
      label: 'Export Data',
      icon: <DownloadOutlined />,
      color: 'default',
      description: 'Export selected items data',
      requiresQuantity: false
    }
  ], [])

  // Get available actions based on selection
  const getAvailableActions = useCallback(() => {
    return bulkActions.filter(action => {
      if (action.key === 'createJobCards') {
        return statistics.remainingQuantity > 0
      }
      return true
    })
  }, [bulkActions, statistics])

  // Handle bulk action
  const handleBulkAction = useCallback((actionKey) => {
    if (selectedItems.length === 0 && selectedPlanIds.length === 0) {
      message.warning('Please select items to perform bulk actions')
      return
    }

    const action = bulkActions.find(a => a.key === actionKey)
    if (!action) return

    switch (actionKey) {
      case 'createJobCards':
        setCurrentAction(action)
        setActionModalVisible(true)
        break
      case 'assignPreset':
        handleAssignPreset()
        break
      case 'moveToNextStep':
        handleMoveToNextStep()
        break
      case 'pause':
        handlePauseWork()
        break
      case 'resume':
        handleResumeWork()
        break
      case 'complete':
        setCurrentAction(action)
        setActionModalVisible(true)
        break
      case 'edit':
        setCurrentAction(action)
        setActionModalVisible(true)
        break
      case 'delete':
        handleDeleteItems()
        break
      case 'export':
        handleExportData()
        break
      default:
        setCustomActionModalVisible(true)
        break
    }
  }, [selectedItems, selectedPlanIds, bulkActions, statistics])

  // Handle assign preset
  const handleAssignPreset = useCallback(async () => {
    try {
      const presetName = 'Standard Production Workflow'
      const results = await onBulkAction({
        type: 'ASSIGN_PRESET',
        selectedItems,
        selectedPlanIds,
        presetName,
        options: {
          autoSelectBestMatch: true,
          overwriteExisting: false
        }
      })

      notification.success({
        message: 'Preset Assigned Successfully',
        description: `Assigned preset to ${results?.successful || 0} plans`
      })
    } catch (error) {
      message.error('Failed to assign preset')
    }
  }, [onBulkAction, selectedItems, selectedPlanIds])

  // Handle move to next step
  const handleMoveToNextStep = useCallback(async () => {
    try {
      const results = await onBulkAction({
        type: 'MOVE_TO_NEXT_STEP',
        selectedItems,
        selectedPlanIds,
        options: {
          skipCompleted: true,
          validateStepDependencies: true
        }
      })

      notification.success({
        message: 'Items Moved Successfully',
        description: `Moved ${results?.successful || 0} items to next step`
      })
    } catch (error) {
      message.error('Failed to move items')
    }
  }, [onBulkAction, selectedItems, selectedPlanIds])

  // Handle pause work
  const handlePauseWork = useCallback(async () => {
    try {
      const results = await onBulkAction({
        type: 'PAUSE_WORK',
        selectedItems,
        selectedPlanIds,
        reason: 'Bulk pause operation'
      })

      notification.success({
        message: 'Work Paused',
        description: `Paused work on ${results?.successful || 0} items`
      })
    } catch (error) {
      message.error('Failed to pause work')
    }
  }, [onBulkAction, selectedItems, selectedPlanIds])

  // Handle resume work
  const handleResumeWork = useCallback(async () => {
    try {
      const results = await onBulkAction({
        type: 'RESUME_WORK',
        selectedItems,
        selectedPlanIds,
        reason: 'Bulk resume operation'
      })

      notification.success({
        message: 'Work Resumed',
        description: `Resumed work on ${results?.successful || 0} items`
      })
    } catch (error) {
      message.error('Failed to resume work')
    }
  }, [onBulkAction, selectedItems, selectedPlanIds])

  // Handle delete items
  const handleDeleteItems = useCallback(async () => {
    Modal.confirm({
      title: 'Delete Selected Items',
      content: `Are you sure you want to delete ${selectedItems.length + selectedPlanIds.length} selected items? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const results = await onBulkAction({
            type: 'DELETE_ITEMS',
            selectedItems,
            selectedPlanIds
          })

          notification.success({
            message: 'Items Deleted',
            description: `Deleted ${results?.successful || 0} items`
          })
        } catch (error) {
          message.error('Failed to delete items')
        }
      }
    })
  }, [selectedItems, selectedPlanIds, onBulkAction])

  // Handle export data
  const handleExportData = useCallback(() => {
    try {
      const exportData = {
        type: 'BULK_EXPORT',
        selectedItems,
        selectedPlanIds,
        format: 'excel',
        includeDetails: true,
        timestamp: moment().toISOString()
      }

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bulk-export-${moment().format('YYYY-MM-DD-HH-mm')}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      message.success('Export data downloaded successfully')
    } catch (error) {
      message.error('Failed to export data')
    }
  }, [selectedItems, selectedPlanIds])

  // Handle action modal submission
  const handleActionSubmit = useCallback(async () => {
    try {
      const values = await actionForm.validateFields()
      const actionConfig = {
        type: currentAction.key.toUpperCase(),
        selectedItems,
        selectedPlanIds,
        options: values
      }

      const results = await onBulkAction(actionConfig)

      notification.success({
        message: `${currentAction.label} Completed`,
        description: `Successfully processed ${results?.successful || 0} items`
      })

      setActionModalVisible(false)
      setCurrentAction(null)
      actionForm.resetFields()
    } catch (error) {
      message.error(`Failed to ${currentAction.label.toLowerCase()}`)
    }
  }, [currentAction, actionForm, onBulkAction, selectedItems, selectedPlanIds])

  // Get action form fields
  const getActionFormFields = useCallback((action) => {
    switch (action?.key) {
      case 'createJobCards':
        return [
          {
            name: 'quantity',
            label: 'Quantity per Job Card',
            type: 'number',
            min: 1,
            max: statistics.remainingQuantity,
            initialValue: Math.min(10, statistics.remainingQuantity),
            rules: [
              { required: true, message: 'Please enter quantity' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1' }
            ]
          },
          {
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 3
          },
          {
            name: 'priority',
            label: 'Priority',
            type: 'select',
            initialValue: 'normal',
            options: [
              { label: 'Normal', value: 'normal' },
              { label: 'Urgent', value: 'urgent' }
            ]
          }
        ]

      case 'complete':
        return [
          {
            name: 'completionNotes',
            label: 'Completion Notes',
            type: 'textarea',
            rows: 4
          },
          {
            name: 'qualityChecked',
            label: 'Quality Checked',
            type: 'checkbox',
            initialValue: true
          }
        ]

      case 'edit':
        return [
          {
            name: 'quantity',
            label: 'Quantity',
            type: 'number',
            min: 1
          },
          {
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 3
          },
          {
            name: 'priority',
            label: 'Priority',
            type: 'select',
            options: [
              { label: 'Normal', value: 'normal' },
              { label: 'Urgent', value: 'urgent' }
            ]
          }
        ]

      default:
        return []
    }
  }, [statistics])

  return (
    <div className={`bulk-operations-toolbar ${className || ''}`}>
      {/* Selection Summary */}
      <Card className="mb-4">
        <Row justify="space-between" align="middle">
          <Col flex="auto">
            <Space>
              <Title level={4} className="mb-0">
                {statistics.totalPlans} Item{statistics.totalPlans !== 1 ? 's' : ''} Selected
              </Title>
              <div className="flex flex-wrap gap-2">
                {statistics.urgentPlans > 0 && (
                  <Tag color="red" icon={<FireOutlined />}>
                    {statistics.urgentPlans} Urgent
                  </Tag>
                )}
                {statistics.inProgressPlans > 0 && (
                  <Tag color="blue" icon={<ClockCircleOutlined />}>
                    {statistics.inProgressPlans} In Progress
                  </Tag>
                )}
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Total Qty: {statistics.totalQuantity.toLocaleString()}
                </Tag>
                <Tag color="orange" icon={<ClockCircleOutlined />}>
                  Remaining: {statistics.remainingQuantity.toLocaleString()}
                </Tag>
              </div>
            </Space>
          </Col>

          <Col>
            <Space>
              <Button
                type="default"
                size="small"
                onClick={() => {/* Handle select all */}}
              >
                Select All
              </Button>
              <Button
                size="small"
                onClick={() => {/* Handle clear selection */}}
              >
                Clear Selection
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Bulk Actions */}
      <Card>
        <div className="p-4">
          <Title level={5} className="mb-4">
            <RocketOutlined /> Bulk Operations
          </Title>

          <div className="flex flex-wrap gap-2 mb-4">
            {getAvailableActions().map(action => (
              <Button
                key={action.key}
                type={action.color === 'primary' ? 'primary' : 'default'}
                icon={action.icon}
                onClick={() => handleBulkAction(action.key)}
                disabled={statistics.totalPlans === 0}
                loading={loading}
                size="small"
              >
                {action.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Text type="secondary">
              Available actions for {statistics.totalPlans} selected items
            </Text>
            {statistics.remainingQuantity === 0 && (
              <Tag color="orange">No remaining quantity for job cards</Tag>
            )}
          </div>

          <Divider />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.urgentPlans}
              </div>
              <div className="text-sm text-gray-600">Urgent Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.inProgressPlans}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.remainingQuantity.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Remaining Units</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Modal */}
      <Modal
        title={`Bulk ${currentAction?.label}`}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false)
          setCurrentAction(null)
          actionForm.resetFields()
        }}
        onOk={handleActionSubmit}
        confirmLoading={loading}
        okText={currentAction?.label}
        width={600}
      >
        <Form form={actionForm} layout="vertical">
          {getActionFormFields(currentAction).map((field, index) => (
            <Form.Item
              key={index}
              name={field.name}
              label={field.label}
              rules={field.rules}
            >
              {field.type === 'number' && (
                <InputNumber {...field} />
              )}
              {field.type === 'textarea' && (
                <TextArea rows={field.rows} {...field} />
              )}
              {field.type === 'select' && (
                <Select {...field}>
                  {field.options?.map(opt => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              )}
              {field.type === 'checkbox' && (
                <Checkbox {...field}>
                  {field.label}
                </Checkbox>
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {/* Custom Action Modal */}
      <Modal
        title="Custom Bulk Action"
        open={customActionModalVisible}
        onCancel={() => setCustomActionModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className="text-center py-8">
          <RocketOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Title level={4}>Custom Actions</Title>
          <Paragraph>
            Additional bulk operations will be available here soon. You can create custom workflows and operations tailored to your specific production needs.
          </Paragraph>
          <Button type="primary" onClick={() => setCustomActionModalVisible(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default BulkOperationsToolbar