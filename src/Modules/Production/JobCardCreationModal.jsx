import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Alert,
  Row,
  Col,
  Card,
  Typography,
  Statistic,
  Progress,
  notification,
  Button
} from 'antd'
import {
  PlayCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'

import { createJobCard } from '../../redux/api/productionAPI'

const { Title, Text } = Typography
const { TextArea } = Input

const JobCardCreationModal = ({
  visible,
  onCancel,
  onSuccess,
  selectedPlan = null
}) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()

  // Redux state
  const { user } = useSelector(state => state.userDetails || {})

  // Local state
  const [submitting, setSubmitting] = useState(false)
  const [allocationInfo, setAllocationInfo] = useState({
    totalQuantity: 0,
    allocatedQuantity: 0,
    remainingQuantity: 0,
    completedQuantity: 0,
    percentage: 0
  })
  const [showReasonField, setShowReasonField] = useState(false)

  // Set allocation info when plan is provided
  useEffect(() => {
    if (selectedPlan && visible) {
      console.log('🔍 Selected Plan in Job Card Modal:', selectedPlan)
      console.log('📋 Production Steps:', selectedPlan.productionSteps)

      const tracking = selectedPlan.quantityTracking || {}
      const allocInfo = {
        totalQuantity: selectedPlan.quantity || 0,
        allocatedQuantity: tracking.totalJobCardQuantity || 0,
        remainingQuantity: tracking.remainingQuantity || selectedPlan.quantity || 0,
        completedQuantity: tracking.completedQuantity || 0,
        percentage: selectedPlan.quantity
          ? Math.round(((tracking.totalJobCardQuantity || 0) / selectedPlan.quantity) * 100)
          : 0
      }
      setAllocationInfo(allocInfo)

      // Set default quantity to remaining quantity
      form.setFieldsValue({
        quantity: allocInfo.remainingQuantity > 0 ? allocInfo.remainingQuantity : 1
      })
    }
  }, [selectedPlan, visible, form])

  // Handle quantity change
  const handleQuantityChange = value => {
    const shouldShowReason = value && allocationInfo.remainingQuantity && value < allocationInfo.remainingQuantity
    setShowReasonField(shouldShowReason)

    if (!shouldShowReason) {
      form.setFieldsValue({ reason: '' })
    }
  }

  // Handle form submission
  const handleSubmit = async values => {
    try {
      setSubmitting(true)

      if (!selectedPlan?.id) {
        notification.error({
          message: 'Production Plan Required',
          description: 'Please select a production plan'
        })
        return
      }

      if (!values.quantity) {
        notification.error({
          message: 'Quantity Required',
          description: 'Please enter the quantity for this job card'
        })
        return
      }

      const payload = {
        prodPlanId: parseInt(selectedPlan.id),
        quantity: parseInt(values.quantity),
        notes: values.notes || '',
        isPartialQuantity: showReasonField,
        reason: showReasonField ? values.reason : '',
        createdBy: user?.id || user?.name || 'System'
      }

      await dispatch(createJobCard(payload)).unwrap()

      notification.success({
        message: 'Job Card Created Successfully',
        description: `Job card created for ${values.quantity} units`
      })

      onSuccess && onSuccess()
      handleReset()
    } catch (error) {
      console.error('Job card creation error:', error)
      notification.error({
        message: 'Creation Failed',
        description: error.message || 'Failed to create job card'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Reset form
  const handleReset = () => {
    form.resetFields()
    setShowReasonField(false)
    onCancel()
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <PlayCircleOutlined className="text-blue-600 text-xl" />
          <div>
            <div className="text-lg font-semibold">Create Job Card</div>
            <div className="text-xs text-slate-500 font-normal">
              Production Plan #{selectedPlan?.id}
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleReset}
      onOk={() => form.submit()}
      okText="Create Job Card"
      okButtonProps={{
        loading: submitting,
        disabled: allocationInfo.remainingQuantity === 0,
        icon: <PlayCircleOutlined />
      }}
      width={700}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Production Plan Info */}
        {selectedPlan && (
          <Card className="mb-4 bg-gradient-to-r from-blue-50 to-slate-50">
            <Row gutter={16}>
              <Col span={12}>
                <div className="mb-3">
                  <Text type="secondary" className="text-xs">Source Product</Text>
                  <div className="font-semibold">{selectedPlan.sourceProductName || 'N/A'}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="mb-3">
                  <Text type="secondary" className="text-xs">Target Product</Text>
                  <div className="font-semibold">{selectedPlan.targetProductName || 'N/A'}</div>
                </div>
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Quantity"
                  value={selectedPlan.quantity}
                  valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Allocated"
                  value={allocationInfo.allocatedQuantity}
                  valueStyle={{ color: '#fa8c16', fontSize: '18px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Available"
                  value={allocationInfo.remainingQuantity}
                  valueStyle={{
                    color: allocationInfo.remainingQuantity > 0 ? '#52c41a' : '#ff4d4f',
                    fontSize: '18px'
                  }}
                />
              </Col>
            </Row>
            <Progress
              percent={allocationInfo.percentage}
              strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              className="mt-3"
            />
          </Card>
        )}

        {allocationInfo.remainingQuantity === 0 && (
          <Alert
            message="No Quantity Available"
            description="This plan has been fully allocated. No additional job cards can be created."
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        {/* Quantity Input */}
        <Form.Item
          name="quantity"
          label={<span className="font-medium">Job Card Quantity</span>}
          rules={[
            { required: true, message: 'Please enter quantity' },
            { type: 'number', min: 1, message: 'Minimum quantity is 1' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve()
                if (value > allocationInfo.remainingQuantity) {
                  return Promise.reject(`Cannot exceed ${allocationInfo.remainingQuantity} units`)
                }
                return Promise.resolve()
              }
            }
          ]}
        >
          <InputNumber
            placeholder="Enter quantity"
            size="large"
            min={1}
            max={allocationInfo.remainingQuantity || 1}
            className="w-full"
            onChange={handleQuantityChange}
            disabled={allocationInfo.remainingQuantity === 0}
            addonAfter="units"
          />
        </Form.Item>

        {/* Quick quantity buttons */}
        {allocationInfo.remainingQuantity > 0 && (
          <div className="flex gap-2 -mt-2 mb-4">
            <Button
              size="small"
              onClick={() => {
                const qty = Math.floor(allocationInfo.remainingQuantity / 4)
                form.setFieldsValue({ quantity: qty })
                handleQuantityChange(qty)
              }}
            >
              25%
            </Button>
            <Button
              size="small"
              onClick={() => {
                const qty = Math.floor(allocationInfo.remainingQuantity / 2)
                form.setFieldsValue({ quantity: qty })
                handleQuantityChange(qty)
              }}
            >
              50%
            </Button>
            <Button
              size="small"
              onClick={() => {
                const qty = Math.floor(allocationInfo.remainingQuantity * 0.75)
                form.setFieldsValue({ quantity: qty })
                handleQuantityChange(qty)
              }}
            >
              75%
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                form.setFieldsValue({ quantity: allocationInfo.remainingQuantity })
                handleQuantityChange(allocationInfo.remainingQuantity)
              }}
            >
              100%
            </Button>
          </div>
        )}

        {/* Notes */}
        <Form.Item
          name="notes"
          label={<span className="font-medium">Notes (Optional)</span>}
        >
          <TextArea
            placeholder="Add any special instructions or notes..."
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Partial Quantity Reason */}
        {showReasonField && (
          <Alert
            message="Partial Quantity Allocation"
            description={
              <Form.Item
                name="reason"
                label="Please explain why you're creating a partial quantity job card"
                rules={[
                  { required: true, message: 'Reason is required for partial quantities' }
                ]}
                className="mb-0 mt-3"
              >
                <TextArea
                  placeholder="Provide reason for partial quantity allocation..."
                  rows={2}
                  maxLength={300}
                  showCount
                />
              </Form.Item>
            }
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
        )}

        {/* Workflow Steps Display */}
        {selectedPlan?.productionSteps && selectedPlan.productionSteps.length > 0 && (
          <Card className="mt-4 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <InfoCircleOutlined className="text-blue-600" />
              <span className="font-semibold text-slate-700">Workflow Steps</span>
              {selectedPlan.presetName && (
                <span className="text-xs text-slate-500 ml-auto">
                  Preset: {selectedPlan.presetName}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {selectedPlan.productionSteps
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map((step, index) => (
                  <div
                    key={step.id || index}
                    className="flex items-center gap-3 p-2 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                      {step.stepOrder || index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{step.stepName}</div>
                      {step.isRequired && (
                        <div className="text-xs text-orange-600">
                          <CheckCircleOutlined className="mr-1" />
                          Required Step
                        </div>
                      )}
                    </div>
                    {index < selectedPlan.productionSteps.length - 1 && (
                      <ArrowRightOutlined className="text-slate-400 text-xs" />
                    )}
                  </div>
                ))}
            </div>

            <Alert
              message="Job card will inherit this workflow"
              description="These steps will be automatically assigned to the job card upon creation."
              type="info"
              className="mt-3"
              showIcon
            />
          </Card>
        )}

        {/* Fallback if no steps */}
        {(!selectedPlan?.productionSteps || selectedPlan.productionSteps.length === 0) && (
          <Alert
            message="Workflow"
            description="This job card will use the workflow preset already assigned to the production plan."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            className="mt-4"
          />
        )}
      </Form>
    </Modal>
  )
}

export default JobCardCreationModal
