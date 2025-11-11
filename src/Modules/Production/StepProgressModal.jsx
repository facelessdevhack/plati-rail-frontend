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
        <div className="flex items-center gap-2">
          <ToolOutlined className="text-blue-600" />
          <span className="font-semibold">Process Step: {currentStepInfo?.name || stepProgress?.stepName || 'Unknown Step'}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText='Process Step'
      okButtonProps={{
        disabled: !isBalanced || !isValid,
        loading,
        className: 'bg-blue-600 hover:bg-blue-700'
      }}
      width="90%"
      style={{ maxWidth: '700px' }}
      destroyOnClose
      centered
    >
      <div className="space-y-4">
        {/* Step Information */}
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-4 border border-blue-200">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Current Step</p>
              <p className="text-base font-semibold text-slate-800">
                {currentStepInfo?.name || stepProgress?.stepName || 'Unknown'}
              </p>
            </div>
            {jobCard && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Job Card</p>
                <p className="text-base font-semibold text-slate-800">
                  #{jobCard.jobCardId || jobCard.id}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-600 mb-1">Input Quantity</p>
              <p className="text-lg font-bold text-blue-600">
                {inputQuantity.toLocaleString()} units
              </p>
            </div>
          </div>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label={<span className="text-sm font-medium text-green-700">✓ Accepted Quantity</span>}
              name='acceptedQuantity'
              rules={[
                { required: true, message: 'Please enter accepted quantity' },
                { type: 'number', min: 0, message: 'Must be non-negative' }
              ]}
              tooltip='Units that passed quality check'
            >
              <InputNumber
                min={0}
                max={inputQuantity}
                className="w-full"
                placeholder='Enter accepted quantity'
                addonAfter='units'
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-red-700">✗ Rejected Quantity</span>}
              name='rejectedQuantity'
              rules={[
                { required: true, message: 'Please enter rejected quantity' },
                { type: 'number', min: 0, message: 'Must be non-negative' }
              ]}
              tooltip='Units that failed quality check'
            >
              <InputNumber
                min={0}
                max={inputQuantity}
                className="w-full"
                placeholder='Enter rejected quantity'
                addonAfter='units'
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-amber-700">⏳ Pending Quantity</span>}
              name='pendingQuantity'
              rules={[
                { required: true, message: 'Please enter pending quantity' },
                { type: 'number', min: 0, message: 'Must be non-negative' }
              ]}
              tooltip='Auto-calculated based on other quantities'
            >
              <InputNumber
                min={0}
                max={inputQuantity}
                className="w-full"
                placeholder='Auto-calculated'
                addonAfter='units'
                disabled
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-purple-700">↻ Rework Quantity</span>}
              name='reworkQuantity'
              rules={[
                { required: true, message: 'Please enter rework quantity' },
                { type: 'number', min: 0, message: 'Must be non-negative' }
              ]}
              tooltip='Units requiring rework'
            >
              <InputNumber
                min={0}
                max={inputQuantity}
                className="w-full"
                placeholder='Enter rework quantity'
                addonAfter='units'
                size="large"
              />
            </Form.Item>
          </div>

          <Form.Item
            label={<span className="text-sm font-medium text-slate-700">Rejection Reason</span>}
            name='rejectionReason'
            rules={[
              {
                required: rejectedQty > 0,
                message: 'Rejection reason is required when rejected quantity > 0'
              }
            ]}
            tooltip='Required if any units were rejected'
          >
            <TextArea
              rows={3}
              placeholder='Enter reason for rejection (required if rejected quantity > 0)'
              maxLength={500}
              showCount
              className="w-full"
            />
          </Form.Item>
        </Form>

        {/* Summary */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-600 mb-1">Total Processed</p>
              <p className="text-2xl font-bold text-slate-800">{processedTotal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Remaining</p>
              <p className={`text-2xl font-bold ${remainingQty === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                {remainingQty.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default StepProgressModal
