import React, { useState } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Card,
  Alert
} from 'antd'
import { useStockManagement } from '../../hooks/useInventory'

const { Option } = Select

const StockUpdateForm = ({ alloyId, currentStock, onSuccess }) => {
  const { updateStock, loading, error } = useStockManagement()
  const [form] = Form.useForm()

  const [formData, setFormData] = useState({
    inHouseStock: currentStock?.inHouseStock || '',
    showroomStock: currentStock?.showroomStock || '',
    operation: 'set'
  })

  const handleSubmit = async values => {
    try {
      const result = await updateStock(
        alloyId,
        {
          inHouseStock: values.inHouseStock
            ? parseInt(values.inHouseStock)
            : undefined,
          showroomStock: values.showroomStock
            ? parseInt(values.showroomStock)
            : undefined
        },
        values.operation
      )

      if (onSuccess) {
        onSuccess(result)
      }

      form.resetFields()
    } catch (err) {
      console.error('Stock update failed:', err)
    }
  }

  return (
    <Card title='Update Stock' size='small'>
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        initialValues={formData}
      >
        <Form.Item
          label='Operation Type'
          name='operation'
          rules={[{ required: true, message: 'Please select operation type' }]}
        >
          <Select>
            <Option value='set'>Set Stock</Option>
            <Option value='add'>Add Stock</Option>
            <Option value='subtract'>Subtract Stock</Option>
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label='In-House Stock' name='inHouseStock'>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder='Enter in-house stock'
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label='Showroom Stock' name='showroomStock'>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder='Enter showroom stock'
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type='primary' htmlType='submit' loading={loading} block>
            {loading ? 'Updating...' : 'Update Stock'}
          </Button>
        </Form.Item>

        {error && (
          <Alert
            message='Error'
            description={error}
            type='error'
            style={{ marginTop: '16px' }}
          />
        )}
      </Form>
    </Card>
  )
}

export default StockUpdateForm
