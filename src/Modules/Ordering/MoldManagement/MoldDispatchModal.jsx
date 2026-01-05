import React, { useEffect } from 'react'
import { Modal, Form, Select, DatePicker, Input, Descriptions, Tag, message } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { dispatchMoldToVendor } from '../../../redux/api/moldManagementAPI'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const MoldDispatchModal = ({ visible, onClose, onSuccess, mold, vendors }) => {
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  const { isDispatching } = useSelector((state) => state.moldManagement)

  useEffect(() => {
    if (visible) {
      form.resetFields()
      // Set default expected return date to 30 days from now
      form.setFieldsValue({
        expectedReturnDate: dayjs().add(30, 'day')
      })
    }
  }, [visible, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      await dispatch(
        dispatchMoldToVendor({
          moldId: mold.id,
          vendorId: values.vendorId,
          expectedReturnDate: values.expectedReturnDate
            ? values.expectedReturnDate.format('YYYY-MM-DD')
            : null,
          notes: values.notes
        })
      ).unwrap()

      onSuccess()
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields')
      } else {
        message.error(error.message || 'Failed to dispatch mold')
      }
    }
  }

  if (!mold) return null

  return (
    <Modal
      title="Dispatch Mold to Vendor"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Dispatch"
      confirmLoading={isDispatching}
      width={600}
      destroyOnClose
    >
      {/* Mold Info Summary */}
      <Descriptions bordered size="small" column={2} className="mb-4">
        <Descriptions.Item label="Mold Code">{mold.moldCode}</Descriptions.Item>
        <Descriptions.Item label="Mold Name">{mold.moldName}</Descriptions.Item>
        <Descriptions.Item label="Current Status">
          <Tag color="green">In House</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Used Cycles">{mold.usedLifeCycles || 0}</Descriptions.Item>
        <Descriptions.Item label="Condition">
          <Tag color="blue">{mold.condition?.replace('_', ' ').toUpperCase() || 'N/A'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Life Remaining">
          {mold.lifePercentage?.toFixed(1) || 0}%
        </Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical">
        <Form.Item
          name="vendorId"
          label="Select Vendor"
          rules={[{ required: true, message: 'Please select a vendor' }]}
        >
          <Select
            placeholder="Select vendor to dispatch to"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {vendors.map((vendor) => (
              <Option key={vendor.id} value={vendor.id}>
                {vendor.vendorName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="expectedReturnDate"
          label="Expected Return Date"
          rules={[{ required: true, message: 'Please select expected return date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < dayjs().endOf('day')}
          />
        </Form.Item>

        <Form.Item name="notes" label="Dispatch Notes">
          <TextArea
            rows={3}
            placeholder="Add any notes about this dispatch (condition, special instructions, etc.)"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default MoldDispatchModal
