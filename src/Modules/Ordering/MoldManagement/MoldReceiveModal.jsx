import React, { useEffect } from 'react'
import { Modal, Form, Select, InputNumber, Input, Descriptions, Tag, message, Alert } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { receiveMoldFromVendor } from '../../../redux/api/moldManagementAPI'

const { Option } = Select
const { TextArea } = Input

const MoldReceiveModal = ({ visible, onClose, onSuccess, mold }) => {
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  const { isReceiving } = useSelector((state) => state.moldManagement)

  useEffect(() => {
    if (visible && mold) {
      form.resetFields()
      form.setFieldsValue({
        conditionAtReturn: mold.condition || 'good'
      })
    }
  }, [visible, mold, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      await dispatch(
        receiveMoldFromVendor({
          moldId: mold.id,
          cyclesUsed: values.cyclesUsed,
          quantityProduced: values.quantityProduced,
          conditionAtReturn: values.conditionAtReturn,
          notes: values.notes
        })
      ).unwrap()

      onSuccess()
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields')
      } else {
        message.error(error.message || 'Failed to receive mold')
      }
    }
  }

  if (!mold) return null

  const daysWithVendor = mold.dispatchedToVendorAt
    ? Math.floor((new Date() - new Date(mold.dispatchedToVendorAt)) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <Modal
      title="Receive Mold from Vendor"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Receive Mold"
      confirmLoading={isReceiving}
      width={600}
      destroyOnClose
    >
      {/* Mold Info Summary */}
      <Descriptions bordered size="small" column={2} className="mb-4">
        <Descriptions.Item label="Mold Code">{mold.moldCode}</Descriptions.Item>
        <Descriptions.Item label="Mold Name">{mold.moldName}</Descriptions.Item>
        <Descriptions.Item label="Current Vendor">{mold.vendorName || 'Unknown'}</Descriptions.Item>
        <Descriptions.Item label="Days with Vendor">{daysWithVendor} days</Descriptions.Item>
        <Descriptions.Item label="Dispatched On">
          {mold.dispatchedToVendorAt
            ? new Date(mold.dispatchedToVendorAt).toLocaleDateString()
            : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Cycles at Dispatch">
          {mold.usedLifeCycles || 0}
        </Descriptions.Item>
      </Descriptions>

      {mold.expectedReturnDate && new Date(mold.expectedReturnDate) < new Date() && (
        <Alert
          message="Overdue Return"
          description={`This mold was expected to be returned by ${new Date(mold.expectedReturnDate).toLocaleDateString()}`}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="cyclesUsed"
          label="Cycles Used at Vendor"
          rules={[{ required: true, message: 'Please enter cycles used' }]}
          tooltip="Total number of production cycles completed at the vendor"
        >
          <InputNumber
            placeholder="e.g., 500"
            min={0}
            style={{ width: '100%' }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="quantityProduced"
          label="Quantity Produced at Vendor"
          rules={[{ required: true, message: 'Please enter quantity produced' }]}
          tooltip="Total quantity of units produced using this mold at the vendor"
        >
          <InputNumber
            placeholder="e.g., 2500"
            min={0}
            style={{ width: '100%' }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="conditionAtReturn"
          label="Condition at Return"
          rules={[{ required: true, message: 'Please select condition' }]}
        >
          <Select placeholder="Select condition on return">
            <Option value="excellent">Excellent</Option>
            <Option value="good">Good</Option>
            <Option value="fair">Fair</Option>
            <Option value="needs_repair">Needs Repair</Option>
            <Option value="damaged">Damaged</Option>
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="Return Notes">
          <TextArea
            rows={3}
            placeholder="Add any notes about this return (observations, issues found, etc.)"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default MoldReceiveModal
