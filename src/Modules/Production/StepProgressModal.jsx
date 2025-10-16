import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Alert,
  Descriptions,
  Space,
  Typography,
  Divider
} from 'antd'
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ToolOutlined
} from '@ant-design/icons'

const { TextArea } = Input
const { Text, Title } = Typography

const StepProgressModal = ({
  visible,
  onCancel,
  onSubmit,
  stepProgress,
  currentStepInfo,
  nextStepInfo,
  jobCard,
  loading = false
}) => {
  const [form] = Form.useForm()
  const [acceptedQty, setAcceptedQty] = useState(0)
  const [rejectedQty, setRejectedQty] = useState(0)
  const [pendingQty, setPendingQty] = useState(0)
  const [reworkQty, setReworkQty] = useState(0)

  // Fallback to job card quantity for backwards compatibility
  // For first step with 0 input quantity, use job card quantity
  const inputQuantity = (() => {
    const stepInput = stepProgress?.inputQuantity || 0
    const stepPending = stepProgress?.pendingQuantity || 0
    const jobQuantity = jobCard?.quantity || 0

    // If input quantity is 0 and this is first step (stepOrder === 1), use job card quantity
    if (stepInput === 0 && stepProgress?.stepOrder === 1) {
      return jobQuantity
    }

    return stepInput || stepPending || jobQuantity
  })()

  // Calculate remaining quantity
  const processedTotal = acceptedQty + rejectedQty + pendingQty + reworkQty
  const remainingQty = inputQuantity - processedTotal

  // Validation status
  const isBalanced = processedTotal === inputQuantity
  const isValid = processedTotal <= inputQuantity && processedTotal >= 0

  useEffect(() => {
    if (visible && stepProgress) {
      // Pre-fill with existing values if any
      form.setFieldsValue({
        acceptedQuantity: stepProgress.acceptedQuantity || 0,
        rejectedQuantity: stepProgress.rejectedQuantity || 0,
        pendingQuantity: stepProgress.pendingQuantity || inputQuantity,
        reworkQuantity: stepProgress.reworkQuantity || 0,
        rejectionReason: stepProgress.rejectionReason || ''
      })

      setAcceptedQty(stepProgress.acceptedQuantity || 0)
      setRejectedQty(stepProgress.rejectedQuantity || 0)
      setPendingQty(stepProgress.pendingQuantity || inputQuantity)
      setReworkQty(stepProgress.reworkQuantity || 0)
    }
  }, [visible, stepProgress, inputQuantity, form])

  const handleSubmit = async () => {
    try {
      await form.validateFields()
      const values = form.getFieldsValue()

      onSubmit({
        stepProgressId: stepProgress.id,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        pendingQuantity: pendingQty,
        reworkQuantity: reworkQty,
        rejectionReason: values.rejectionReason || ''
      })
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  // Debounce timer ref
  const debounceTimer = useRef(null)

  // Auto-calculate pending quantity with debounce
  const autoCalculatePending = useCallback(() => {
    const currentAccepted = acceptedQty || 0
    const currentRejected = rejectedQty || 0
    const currentRework = reworkQty || 0
    
    // Validate total doesn't exceed input
    const total = currentAccepted + currentRejected + currentRework
    if (total > inputQuantity) {
      // Don't auto-calculate if total exceeds input (validation will show error)
      return
    }
    
    // Auto-calculate pending
    const calculatedPending = inputQuantity - total
    if (calculatedPending >= 0) {
      setPendingQty(calculatedPending)
      form.setFieldsValue({ pendingQuantity: calculatedPending })
    }
  }, [acceptedQty, rejectedQty, reworkQty, inputQuantity, form])

  // Debounced calculation effect
  useEffect(() => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Set new timer for 300ms
    debounceTimer.current = setTimeout(() => {
      autoCalculatePending()
    }, 300)
    
    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [acceptedQty, rejectedQty, reworkQty, autoCalculatePending])

  const handleValuesChange = changedValues => {
    if ('acceptedQuantity' in changedValues)
      setAcceptedQty(changedValues.acceptedQuantity || 0)
    if ('rejectedQuantity' in changedValues)
      setRejectedQty(changedValues.rejectedQuantity || 0)
    if ('pendingQuantity' in changedValues)
      setPendingQty(changedValues.pendingQuantity || 0)
    if ('reworkQuantity' in changedValues)
      setReworkQty(changedValues.reworkQuantity || 0)
  }

  return (
    <Modal
      title={
        <Space>
          <ToolOutlined />
          <span>Process Step: {currentStepInfo?.name || 'Unknown Step'}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText='Process Step'
      okButtonProps={{
        disabled: !isBalanced || !isValid,
        loading
      }}
      width={700}
      destroyOnClose
    >
      <Space direction='vertical' style={{ width: '100%' }} size='large'>
        {/* Step Information */}
        <Descriptions bordered size='small' column={2}>
          <Descriptions.Item label='Current Step' span={2}>
            <Text strong>{currentStepInfo?.name || 'Unknown'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label='Next Step' span={2}>
            <Text type='secondary'>
              {nextStepInfo?.name || 'Final Step - Completion'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label='Input Quantity' span={2}>
            <Text strong style={{ fontSize: '16px' }}>
              {inputQuantity} units
            </Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider style={{ margin: '12px 0' }} />

        {/* Quantity Balance Alert */}
        {!isBalanced && processedTotal > 0 && (
          <Alert
            message={`Remaining: ${remainingQty} units`}
            description={
              remainingQty > 0
                ? 'You must account for all units before processing.'
                : 'Total processed quantity exceeds input quantity!'
            }
            type={remainingQty > 0 ? 'warning' : 'error'}
            showIcon
            icon={<ExclamationCircleOutlined />}
          />
        )}

        {isBalanced && processedTotal > 0 && (
          <Alert
            message='Quantities Balanced'
            description='All units accounted for. Ready to process.'
            type='success'
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}

        {/* Quality Input Form */}
        <Form
          form={form}
          layout='vertical'
          onValuesChange={handleValuesChange}
          initialValues={{
            acceptedQuantity: 0,
            rejectedQuantity: 0,
            pendingQuantity: inputQuantity,
            reworkQuantity: 0
          }}
        >
          <Form.Item
            label='Accepted Quantity'
            name='acceptedQuantity'
            rules={[
              { required: true, message: 'Please enter accepted quantity' },
              { type: 'number', min: 0, message: 'Must be non-negative' }
            ]}
            tooltip='Units that passed quality check and will move to next step'
          >
            <InputNumber
              min={0}
              max={inputQuantity}
              style={{ width: '100%' }}
              placeholder='Enter accepted quantity'
              addonAfter='units'
            />
          </Form.Item>

          <Form.Item
            label='Rejected Quantity'
            name='rejectedQuantity'
            rules={[
              { required: true, message: 'Please enter rejected quantity' },
              { type: 'number', min: 0, message: 'Must be non-negative' }
            ]}
            tooltip='Units that failed quality check and will be scrapped'
          >
            <InputNumber
              min={0}
              max={inputQuantity}
              style={{ width: '100%' }}
              placeholder='Enter rejected quantity'
              addonAfter='units'
            />
          </Form.Item>

          <Form.Item
            label='Pending Quantity'
            name='pendingQuantity'
            rules={[
              { required: true, message: 'Please enter pending quantity' },
              { type: 'number', min: 0, message: 'Must be non-negative' }
            ]}
            tooltip='Units not yet processed at this step (auto-calculated)'
          >
            <InputNumber
              min={0}
              max={inputQuantity}
              style={{ width: '100%' }}
              placeholder='Auto-calculated'
              addonAfter='units'
              disabled
            />
          </Form.Item>

          <Form.Item
            label='Rework Quantity'
            name='reworkQuantity'
            rules={[
              { required: true, message: 'Please enter rework quantity' },
              { type: 'number', min: 0, message: 'Must be non-negative' }
            ]}
            tooltip='Units requiring rework at this step'
          >
            <InputNumber
              min={0}
              max={inputQuantity}
              style={{ width: '100%' }}
              placeholder='Enter rework quantity'
              addonAfter='units'
            />
          </Form.Item>

          <Form.Item
            label='Rejection Reason'
            name='rejectionReason'
            rules={[
              {
                required: rejectedQty > 0,
                message:
                  'Rejection reason is required when rejected quantity > 0'
              }
            ]}
            tooltip='Required if any units were rejected'
          >
            <TextArea
              rows={3}
              placeholder='Enter reason for rejection (required if rejected quantity > 0)'
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>

        {/* Summary */}
        <Descriptions bordered size='small' column={2}>
          <Descriptions.Item label='Total Processed'>
            <Text strong>{processedTotal}</Text>
          </Descriptions.Item>
          <Descriptions.Item label='Remaining'>
            <Text strong type={remainingQty === 0 ? 'success' : 'warning'}>
              {remainingQty}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </Modal>
  )
}

export default StepProgressModal
