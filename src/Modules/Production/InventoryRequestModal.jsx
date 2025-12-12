import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  InputNumber,
  Alert,
  Space,
  Typography,
  Divider
} from 'antd'
import {
  ShoppingCartOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'

const { Text } = Typography

const InventoryRequestModal = ({
  visible,
  onCancel,
  onSubmit,
  stepProgress,
  jobCard,
  loading = false
}) => {
  const [form] = Form.useForm()
  const [requestedQty, setRequestedQty] = useState(0)

  // Get maximum requestable quantity (input quantity of the step)
  const maxQuantity = stepProgress?.inputQuantity || 0

  useEffect(() => {
    if (visible && stepProgress) {
      // Pre-fill with input quantity as default
      form.setFieldsValue({
        quantityRequested: maxQuantity
      })
      setRequestedQty(maxQuantity)
    }
  }, [visible, stepProgress, maxQuantity, form])

  const handleSubmit = async () => {
    try {
      await form.validateFields()
      const values = form.getFieldsValue()

      console.log('Job Card Data:', jobCard)
      console.log('Step Progress Data:', stepProgress)

      onSubmit({
        stepProgressId: stepProgress.id,
        jobCardId: jobCard?.jobCardId || jobCard?.id,
        alloyId: jobCard?.alloyId || jobCard?.alloy_id,
        alloyName: jobCard?.alloyName || jobCard?.alloy_name || jobCard?.productName || null,
        quantityRequested: requestedQty
      })
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleValuesChange = changedValues => {
    if ('quantityRequested' in changedValues) {
      setRequestedQty(changedValues.quantityRequested || 0)
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ShoppingCartOutlined className="text-blue-600" />
          <span className="font-semibold">Request Inventory</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText='Submit Request'
      okButtonProps={{
        disabled: requestedQty <= 0 || requestedQty > maxQuantity,
        loading,
        className: 'bg-blue-600 hover:bg-blue-700'
      }}
      width={600}
      destroyOnClose
      centered
    >
      <div className="space-y-4">
        {/* Step Information */}
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-4 border border-blue-200">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Step Name</p>
              <p className="text-base font-semibold text-slate-800">
                {stepProgress?.stepName || 'Unknown Step'}
              </p>
            </div>
            {jobCard && (
              <>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Job Card</p>
                  <p className="text-base font-semibold text-slate-800">
                    #{jobCard.jobCardId || jobCard.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Alloy Product</p>
                  <p className="text-base font-semibold text-slate-800">
                    {jobCard?.alloyName || jobCard?.alloy_name || jobCard?.productName || `Alloy #${jobCard?.alloyId || jobCard?.alloy_id || 'Unknown'}`}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-slate-600 mb-1">Available Quantity</p>
              <p className="text-lg font-bold text-blue-600">
                {maxQuantity.toLocaleString()} units
              </p>
            </div>
          </div>
        </div>

        <Alert
          message="Inventory Request"
          description="Enter the quantity you need to request from inventory. Maximum quantity is based on this step's input quantity."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />

        <Divider className="my-4" />

        {/* Quantity Input Form */}
        <Form
          form={form}
          layout='vertical'
          onValuesChange={handleValuesChange}
          initialValues={{
            quantityRequested: maxQuantity
          }}
        >
          <Form.Item
            label={<span className="text-sm font-medium text-blue-700">Quantity to Request</span>}
            name='quantityRequested'
            rules={[
              { required: true, message: 'Please enter quantity to request' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1' },
              { type: 'number', max: maxQuantity, message: `Maximum quantity is ${maxQuantity}` }
            ]}
            tooltip={`Maximum quantity you can request: ${maxQuantity} units`}
          >
            <InputNumber
              min={1}
              max={maxQuantity}
              className="w-full"
              placeholder='Enter quantity to request'
              addonAfter='units'
              size="large"
            />
          </Form.Item>
        </Form>

        {/* Summary */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-600 mb-1">Requesting</p>
              <p className="text-2xl font-bold text-blue-600">{requestedQty.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Max Available</p>
              <p className="text-2xl font-bold text-slate-800">{maxQuantity.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default InventoryRequestModal
