import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
  Space,
  Typography,
  Alert,
  Divider,
  Tag,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  ToolOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'

const { Text } = Typography
const { Option } = Select

const CreateReworkPlanModal = ({ visible, onCancel, onSuccess, rejectionRecord }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [availableTargetFinishes, setAvailableTargetFinishes] = useState([])
  const [loadingFinishes, setLoadingFinishes] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (visible && rejectionRecord) {
      form.resetFields()
      form.setFieldsValue({
        quantity: rejectionRecord.rejectedQuantity,
        urgent: true,
        convertToAlloyId: rejectionRecord.originalConvertToAlloyId // Use original conversion by default
      })

      // Fetch available target finishes for this alloy
      fetchAvailableTargetFinishes()
    }
  }, [visible, rejectionRecord])

  const fetchAvailableTargetFinishes = async () => {
    if (!rejectionRecord?.alloyId) return

    setLoadingFinishes(true)
    try {
      console.log('🔍 Finding finishes for:', rejectionRecord.alloyName, {
        modelName: rejectionRecord.modelName,
        inchesId: rejectionRecord.inchesId,
        pcdId: rejectionRecord.pcdId,
        holesId: rejectionRecord.holesId,
        widthId: rejectionRecord.widthId,
        finishId: rejectionRecord.finishId,
        currentFinish: rejectionRecord.finishName
      })

      // Fetch only alloys matching the EXACT specifications using backend filters
      const response = await client.get('/alloys/stock/management', {
        params: {
          page: 1,
          limit: 1000,
          modelName: rejectionRecord.modelName,
          inchesId: rejectionRecord.inchesId,
          pcdId: rejectionRecord.pcdId,
          holesId: rejectionRecord.holesId,
          widthId: rejectionRecord.widthId
        }
      })

      console.log('📦 Full response:', response.data)

      // Backend returns data in 'data' array, not 'stockManagementData'
      if (response.data?.data) {
        const stockData = response.data.data
        console.log(`📊 Received ${stockData.length} alloys from backend with matching specs`)

        // Log first item to see structure
        if (stockData.length > 0) {
          console.log('🔬 Sample alloy structure:', stockData[0])
        }

        // Filter only different finishes (backend already filtered by specs)
        const matchedAlloys = stockData.filter(alloy => {
          console.log(`🧪 Checking alloy: ${alloy.productName}`, {
            alloyFinishId: alloy.finishId,
            rejectionFinishId: rejectionRecord.finishId,
            alloyFinish: alloy.finish,
            rejectionFinish: rejectionRecord.finishName,
            isDifferentFinishId: alloy.finishId !== rejectionRecord.finishId,
            isDifferentFinishName: alloy.finish !== rejectionRecord.finishName
          })

          const differentFinish =
            alloy.finishId !== rejectionRecord.finishId &&
            alloy.finish !== rejectionRecord.finishName

          if (differentFinish) {
            console.log(`  ✅ Match: ${alloy.productName} | Finish: ${alloy.finish} | Stock: ${alloy.inHouseStock || 0}`)
          }

          return differentFinish && (alloy.inHouseStock || 0) >= 0
        })

        console.log(`Total matches before dedup: ${matchedAlloys.length}`)

        // Map to finish options with EXACT same structure as Smart Production Planner
        const availableFinishes = matchedAlloys
          .map(alloy => ({
            value: alloy.finish, // Use finish name as value (IMPORTANT!)
            label: alloy.finish,
            stock: alloy.inHouseStock || 0,
            alloyId: alloy.id,
            finishId: alloy.finishId,
            productName: alloy.productName
          }))
          .filter((finish, index, arr) => {
            // Remove duplicates by finish name
            const firstIndex = arr.findIndex(f => f.value === finish.value)
            if (firstIndex !== index) {
              console.log(`  Duplicate removed: ${finish.value}`)
            }
            return firstIndex === index
          })
          .sort((a, b) => a.label.localeCompare(b.label))

        console.log(
          `Final finishes (${availableFinishes.length}):`,
          availableFinishes.map(f => `${f.label} (Stock: ${f.stock})`)
        )

        setAvailableTargetFinishes(availableFinishes)
      }
    } catch (error) {
      console.error('Error fetching target finishes:', error)
    } finally {
      setLoadingFinishes(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // Find the alloy ID from the selected finish name
      const selectedFinish = availableTargetFinishes.find(
        f => f.value === values.convertToAlloyId
      )

      if (!selectedFinish) {
        console.error('Selected finish not found in available finishes')
        return
      }

      console.log('📤 Submitting rework plan:', {
        finishName: values.convertToAlloyId,
        alloyId: selectedFinish.alloyId,
        quantity: values.quantity,
        urgent: values.urgent
      })

      const response = await client.post(
        `/production/rejected-stock/${rejectionRecord.rejectionId}/process`,
        {
          action: 'create_rework_plan',
          quantity: values.quantity,
          convertToAlloyId: selectedFinish.alloyId, // Send the alloy ID, not the finish name
          urgent: values.urgent
        }
      )

      if (response.data.success) {
        onSuccess(response.data.message, response.data.planId)
        form.resetFields()
        onCancel()
      }
    } catch (error) {
      console.error('Error creating rework plan:', error)
      // Error message will be shown by parent component
    } finally {
      setLoading(false)
    }
  }

  if (!rejectionRecord) return null

  const selectedTargetFinish = availableTargetFinishes.find(
    f => f.value === form.getFieldValue('convertToAlloyId')
  )

  return (
    <Modal
      title={
        <Space>
          <ToolOutlined style={{ color: '#ff7a45' }} />
          <span>Create Rework Production Plan</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Create Rework Plan"
      cancelText="Cancel"
      confirmLoading={loading}
      width={700}
      okButtonProps={{
        danger: true,
        icon: <ToolOutlined />
      }}
    >
      <Divider />

      {/* Source Product Info */}
      <Alert
        message="Rejected Stock Information"
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Product:</Text>
                <br />
                <Text strong>{rejectionRecord.alloyName}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Current Finish:</Text>
                <br />
                <Text strong>{rejectionRecord.finishName}</Text>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Job Card:</Text>
                <br />
                <Tag color="blue">#{rejectionRecord.jobCardId}</Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">Rejected Quantity:</Text>
                <br />
                <Tag color="volcano" style={{ fontSize: '14px' }}>
                  <strong>{rejectionRecord.rejectedQuantity} units</strong>
                </Tag>
              </Col>
            </Row>
            {rejectionRecord.rejectionReason && (
              <Row>
                <Col span={24}>
                  <Text type="secondary">Rejection Reason:</Text>
                  <br />
                  <Text italic>{rejectionRecord.rejectionReason}</Text>
                </Col>
              </Row>
            )}
          </Space>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* Rework Plan Configuration */}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          quantity: rejectionRecord?.rejectedQuantity,
          urgent: true
        }}
      >
        <Form.Item
          label={
            <Space>
              <Text strong>Rework Quantity</Text>
              <Text type="secondary">(Max: {rejectionRecord.rejectedQuantity})</Text>
            </Space>
          }
          name="quantity"
          rules={[
            { required: true, message: 'Please enter rework quantity' },
            {
              type: 'number',
              min: 1,
              max: rejectionRecord.rejectedQuantity,
              message: `Quantity must be between 1 and ${rejectionRecord.rejectedQuantity}`
            }
          ]}
        >
          <InputNumber
            min={1}
            max={rejectionRecord.rejectedQuantity}
            style={{ width: '100%' }}
            placeholder="Enter quantity to rework"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <Text strong>Convert To (Target Finish)</Text>
              <Text type="secondary">Select target finish for rework</Text>
            </Space>
          }
          name="convertToAlloyId"
          rules={[{ required: true, message: 'Please select target finish' }]}
        >
          <Select
            placeholder="Select target finish"
            loading={loadingFinishes}
            showSearch
            optionFilterProp="children"
            notFoundContent={
              loadingFinishes ? 'Loading finishes...' : 'No compatible finishes found'
            }
          >
            {availableTargetFinishes.map(finish => (
              <Option key={finish.value} value={finish.value}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <span>
                    <strong>{finish.label}</strong> - {finish.productName}
                  </span>
                  <Tag color={finish.stock > 0 ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                    Stock: {finish.stock}
                  </Tag>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <ThunderboltOutlined style={{ color: '#faad14' }} />
              <Text strong>Urgent Priority</Text>
            </Space>
          }
          name="urgent"
          valuePropName="checked"
        >
          <Switch
            checkedChildren="Urgent"
            unCheckedChildren="Normal"
            defaultChecked
          />
        </Form.Item>
      </Form>

      {/* Conversion Preview */}
      {selectedTargetFinish && (
        <>
          <Divider />
          <Alert
            message="Rework Plan Preview"
            description={
              <div style={{ marginTop: 8 }}>
                <Row align="middle" gutter={16}>
                  <Col span={10}>
                    <Statistic
                      title="From"
                      value={rejectionRecord.finishName}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={4} style={{ textAlign: 'center' }}>
                    <ArrowRightOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  </Col>
                  <Col span={10}>
                    <Statistic
                      title="To"
                      value={selectedTargetFinish.label}
                      valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                    />
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Quantity"
                      value={form.getFieldValue('quantity') || 0}
                      suffix="units"
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Priority"
                      value={form.getFieldValue('urgent') ? 'Urgent' : 'Normal'}
                      valueStyle={{
                        fontSize: '16px',
                        color: form.getFieldValue('urgent') ? '#ff4d4f' : '#1890ff'
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Target Stock"
                      value={selectedTargetFinish.stock}
                      suffix="units"
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                </Row>
              </div>
            }
            type="success"
            style={{ marginTop: 16 }}
          />
        </>
      )}

      <Divider />

      <Alert
        message="Note"
        description="Creating a rework plan will mark this rejection as resolved and create a new production plan for the specified quantity."
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Modal>
  )
}

export default CreateReworkPlanModal
