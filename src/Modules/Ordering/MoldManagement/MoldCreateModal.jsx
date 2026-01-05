import React, { useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Divider,
  message
} from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { createMold, updateMold } from '../../../redux/api/moldManagementAPI'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const MoldCreateModal = ({ visible, onClose, onSuccess, editMold }) => {
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  const { isCreating, isUpdating, inchesMaster = [], modelMaster = [] } = useSelector(
    (state) => state.moldManagement
  )

  const moldType = Form.useWatch('moldType', form)

  useEffect(() => {
    if (visible) {
      if (editMold) {
        form.setFieldsValue({
          ...editMold,
          sizeId: editMold.sizeId || null,
          modelId: editMold.modelId || null,
          purchaseDate: editMold.purchaseDate ? dayjs(editMold.purchaseDate) : null,
          warrantyExpiryDate: editMold.warrantyExpiryDate
            ? dayjs(editMold.warrantyExpiryDate)
            : null
        })
      } else {
        form.resetFields()
      }
    }
  }, [visible, editMold, form])

  // Clear size when mold type changes to non-alloy
  useEffect(() => {
    if (moldType && moldType !== 'alloy_wheel') {
      form.setFieldValue('sizeId', null)
    }
  }, [moldType, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const payload = {
        mold_type: values.moldType,
        size_id: values.sizeId || null,
        model_id: values.modelId || null,
        description: values.description || null,
        total_life_cycles: values.totalLifeCycles,
        condition: values.condition || 'good',
        purchase_date: values.purchaseDate ? values.purchaseDate.format('YYYY-MM-DD') : null,
        purchase_cost: values.purchaseCost || null,
        warranty_expiry_date: values.warrantyExpiryDate
          ? values.warrantyExpiryDate.format('YYYY-MM-DD')
          : null,
        notes: values.notes || null
      }

      if (editMold) {
        await dispatch(updateMold({ moldId: editMold.id, ...payload })).unwrap()
        message.success('Mold updated successfully')
      } else {
        await dispatch(createMold(payload)).unwrap()
        message.success('Mold created successfully')
      }

      onSuccess()
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields')
      } else {
        message.error(error.message || 'Failed to save mold')
      }
    }
  }

  return (
    <Modal
      title={editMold ? 'Edit Mold' : 'Add New Mold'}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={editMold ? 'Update' : 'Create'}
      confirmLoading={isCreating || isUpdating}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ condition: 'good' }}>
        <Divider orientation="left">Basic Information</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="moldType"
              label="Mold Type"
              rules={[{ required: true, message: 'Please select mold type' }]}
            >
              <Select placeholder="Select mold type">
                <Option value="alloy_wheel">Alloy Wheel</Option>
                <Option value="tyre">Tyre</Option>
                <Option value="cap">Cap</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="sizeId"
              label="Size (Inches)"
              tooltip="Only applicable for Alloy Wheel molds"
            >
              <Select
                placeholder="Select size"
                disabled={moldType !== 'alloy_wheel'}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {inchesMaster.map((inch) => (
                  <Option key={inch.id} value={inch.id}>
                    {inch.inches}"
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="modelId" label="Model">
              <Select
                placeholder="Select model"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {modelMaster.map((model) => (
                  <Option key={model.id} value={model.id}>
                    {model.modelName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="description" label="Description">
              <TextArea rows={2} placeholder="Brief description of the mold..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Lifecycle Management</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="totalLifeCycles"
              label="Total Life Cycles"
              rules={[{ required: true, message: 'Please enter total life cycles' }]}
            >
              <InputNumber
                placeholder="e.g., 10000"
                min={1}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="condition" label="Condition">
              <Select placeholder="Select condition">
                <Option value="excellent">Excellent</Option>
                <Option value="good">Good</Option>
                <Option value="fair">Fair</Option>
                <Option value="needs_repair">Needs Repair</Option>
                <Option value="damaged">Damaged</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Purchase Information</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="purchaseDate" label="Purchase Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="purchaseCost" label="Purchase Cost">
              <InputNumber
                placeholder="e.g., 50000"
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="warrantyExpiryDate" label="Warranty Expiry Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="notes" label="Notes">
          <TextArea rows={3} placeholder="Additional notes about the mold..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default MoldCreateModal
