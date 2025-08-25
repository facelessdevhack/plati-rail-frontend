import React, { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Space,
  Card,
  Row,
  Col,
  Tag,
  Divider,
  Alert,
  Typography,
  notification
} from 'antd'
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  SwapOutlined,
  FireOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  updateProductionPlan,
  getStepPresets,
  getPresetDetails
} from '../../redux/api/productionAPI'
import { getConversionOptions } from '../../redux/api/stockAPI'

const { Title, Text } = Typography
const { Option } = Select

const EditProductionPlanModal = ({ 
  visible, 
  onClose, 
  planData,
  onSuccess 
}) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [presetPreviewVisible, setPresetPreviewVisible] = useState(false)
  const [previewPresetName, setPreviewPresetName] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(null)

  // Redux state
  const { stepPresets, presetDetails } = useSelector(state => state.productionDetails)
  const { conversionOptions } = useSelector(state => state.stockDetails)
  const { user } = useSelector(state => state.userDetails)

  // Load initial data
  useEffect(() => {
    if (visible) {
      dispatch(getStepPresets())
      if (planData?.alloyId) {
        dispatch(getConversionOptions({ alloyId: planData.alloyId }))
      }
    }
  }, [visible, dispatch, planData])

  // Populate form when planData changes
  useEffect(() => {
    if (visible && planData) {
      form.setFieldsValue({
        quantity: planData.quantity,
        urgent: planData.urgent === 1 || planData.urgent === true,
        convertId: planData.convertToAlloyId,
        note: planData.note || '',
        presetName: planData.presetName || null
      })
      setSelectedPreset(planData.presetName || null)
    }
  }, [visible, planData, form])

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const updateData = {
        planId: planData.id,
        quantity: values.quantity,
        urgent: values.urgent || false,
        convertToAlloyId: values.convertId,
        note: values.note || null,
        presetName: selectedPreset || null,
        updatedBy: user?.id || user?.userId
      }

      console.log('Update data being sent:', updateData)
      console.log('Form values:', values)

      await dispatch(updateProductionPlan(updateData)).unwrap()

      notification.success({
        message: 'Success',
        description: 'Production plan updated successfully!'
      })

      form.resetFields()
      setSelectedPreset(null)
      onSuccess?.()
      onClose()
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error?.message || 'Failed to update production plan'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle preset preview
  const handlePreviewPreset = async (presetName) => {
    try {
      await dispatch(getPresetDetails({ presetName })).unwrap()
      setPreviewPresetName(presetName)
      setPresetPreviewVisible(true)
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to load preset details'
      })
    }
  }

  // Get category color for tags
  const getCategoryColor = (category) => {
    const colors = {
      basic: 'blue',
      chrome: 'gold',
      premium: 'purple',
      standard: 'green',
      urgent: 'red',
      custom: 'orange'
    }
    return colors[category] || 'default'
  }

  // Calculate available stock for validation
  const getAvailableStock = () => {
    if (!planData) return 0
    return (planData.inHouseStock || 0) + (planData.showroomStock || 0)
  }

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-3">
            <EditOutlined className="text-blue-600" />
            <span>Edit Production Plan #{planData?.id}</span>
            {planData?.urgent && (
              <Tag icon={<FireOutlined />} color="red">
                URGENT
              </Tag>
            )}
          </div>
        }
        open={visible}
        onCancel={() => {
          form.resetFields()
          setSelectedPreset(null)
          onClose()
        }}
        width={800}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          {/* Plan Information Display */}
          <Card className="mb-4 bg-gray-50">
            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                <div className="text-sm">
                  <Text strong>Source Alloy:</Text>
                  <div className="mt-1">
                    <Text className="text-blue-600">
                      {planData?.alloyName || `Alloy ${planData?.alloyId}`}
                    </Text>
                  </div>
                  {planData?.sourceModelName && (
                    <div className="text-xs text-gray-500">
                      {planData.sourceModelName} • {planData.sourceFinish}
                    </div>
                  )}
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="text-sm">
                  <Text strong>Current Target:</Text>
                  <div className="mt-1">
                    <Text className="text-green-600">
                      {planData?.convertName || `Alloy ${planData?.convertToAlloyId}`}
                    </Text>
                  </div>
                  {planData?.targetModelName && (
                    <div className="text-xs text-gray-500">
                      {planData.targetModelName} • {planData.targetFinish}
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Card>

          {/* Editable Fields */}
          <Row gutter={[16, 16]}>
            {/* Convert To Alloy */}
            <Col xs={24}>
              <Form.Item
                name="convertId"
                label={
                  <Space>
                    <SwapOutlined />
                    <span>Convert To (Target Alloy)</span>
                  </Space>
                }
                rules={[
                  {
                    required: true,
                    message: 'Please select target alloy to convert to!'
                  }
                ]}
              >
                <Select
                  showSearch
                  placeholder="Select target alloy to convert to"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option?.children?.props?.children?.[0]?.props?.children?.toLowerCase()?.includes(input.toLowerCase()) ||
                    option?.children?.props?.children?.[1]?.props?.children?.toLowerCase()?.includes(input.toLowerCase())
                  }
                  size="large"
                  loading={!conversionOptions}
                >
                  {(conversionOptions || []).map(alloy => (
                    <Option key={alloy.id} value={alloy.id}>
                      <div className='py-1'>
                        <div className='font-semibold text-gray-800'>{alloy.productName}</div>
                        <div className='text-xs text-gray-500 flex items-center justify-between'>
                          <span>{alloy.finishName} finish</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            (alloy.totalStock || 0) > 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            Stock: {alloy.totalStock || 0}
                          </span>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Quantity and Priority */}
            <Col xs={24} sm={16}>
              <Form.Item
                name="quantity"
                label={
                  <div className="flex items-center justify-between">
                    <span>Quantity</span>
                    <span className="text-xs text-gray-500 font-normal">
                      Available: {getAvailableStock()} units
                    </span>
                  </div>
                }
                rules={[
                  { required: true, message: 'Please enter quantity!' },
                  {
                    type: 'number',
                    min: 1,
                    max: getAvailableStock() || 10000,
                    message: `Quantity must be between 1 and ${getAvailableStock()} (available stock)`
                  }
                ]}
              >
                <InputNumber
                  placeholder="Enter quantity"
                  style={{ width: '100%' }}
                  size="large"
                  min={1}
                  max={getAvailableStock() || 10000}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="urgent"
                label="Priority"
                valuePropName="checked"
              >
                <div className="flex items-center gap-3 pt-2">
                  <Switch 
                    size="default"
                    onChange={(checked) => {
                      form.setFieldsValue({ urgent: checked })
                    }}
                  />
                  <span className="text-sm text-gray-600">
                    Mark as Urgent
                  </span>
                </div>
              </Form.Item>
            </Col>
          </Row>

          {/* Production Workflow Preset */}
          <Form.Item
            name="presetName"
            label={
              <div className="flex items-center justify-between w-full">
                <span>Production Workflow Preset (Optional)</span>
                {selectedPreset && (
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreviewPreset(selectedPreset)}
                  >
                    Preview Steps
                  </Button>
                )}
              </div>
            }
          >
            <Select
              placeholder="Select a preset workflow or leave empty"
              allowClear
              size="large"
              onChange={(value) => {
                setSelectedPreset(value)
                form.setFieldsValue({ presetName: value })
              }}
              value={selectedPreset}
              showSearch
              optionFilterProp="children"
            >
              {(stepPresets || [])
                .reduce((acc, preset) => {
                  const existingCategory = acc.find(
                    item => item.category === preset.presetCategory
                  )
                  if (existingCategory) {
                    existingCategory.presets.push(preset)
                  } else {
                    acc.push({
                      category: preset.presetCategory,
                      presets: [preset]
                    })
                  }
                  return acc
                }, [])
                .map(categoryGroup => (
                  <Select.OptGroup
                    key={categoryGroup.category}
                    label={categoryGroup.category?.toUpperCase()}
                  >
                    {categoryGroup.presets.map(preset => (
                      <Option
                        key={preset.presetName}
                        value={preset.presetName}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {preset.presetName}
                              <Tag
                                color={getCategoryColor(preset.presetCategory)}
                                size="small"
                              >
                                {preset.presetCategory?.toUpperCase()}
                              </Tag>
                            </div>
                            <div className="text-xs text-gray-500">
                              {preset.presetDescription} • {preset.stepCount || 0} steps
                            </div>
                          </div>
                        </div>
                      </Option>
                    ))}
                  </Select.OptGroup>
                ))}
            </Select>
          </Form.Item>

          {/* Notes */}
          <Form.Item
            name="note"
            label="Notes (Optional)"
          >
            <Input.TextArea
              placeholder="Add any notes or special instructions for this production plan..."
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          {/* Warning for active plans */}
          {planData?.inProductionQuantity > 0 && (
            <Alert
              message="Active Production Plan"
              description={`This plan has ${planData.inProductionQuantity} units currently in production. Changes may affect ongoing work.`}
              type="warning"
              icon={<InfoCircleOutlined />}
              className="mb-4"
            />
          )}

          <Divider />

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button
              size="large"
              onClick={() => {
                form.resetFields()
                setSelectedPreset(null)
                onClose()
              }}
              icon={<CloseOutlined />}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              Update Plan
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Preset Preview Modal */}
      <Modal
        title={`Preset Preview: ${previewPresetName}`}
        open={presetPreviewVisible}
        onCancel={() => {
          setPresetPreviewVisible(false)
          setPreviewPresetName(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setPresetPreviewVisible(false)
              setPreviewPresetName(null)
            }}
          >
            Close
          </Button>,
          <Button
            key="select"
            type="primary"
            onClick={() => {
              setSelectedPreset(previewPresetName)
              form.setFieldsValue({ presetName: previewPresetName })
              setPresetPreviewVisible(false)
              setPreviewPresetName(null)
            }}
            disabled={selectedPreset === previewPresetName}
          >
            {selectedPreset === previewPresetName
              ? 'Already Selected'
              : 'Select This Preset'}
          </Button>
        ]}
        width={600}
      >
        {presetDetails && presetDetails.length > 0 && (
          <div className="mt-4">
            <div className="mb-4">
              <Text strong>Category: </Text>
              <Tag color={getCategoryColor(presetDetails[0]?.presetCategory)}>
                {presetDetails[0]?.presetCategory?.toUpperCase()}
              </Tag>
            </div>

            <div className="mb-4">
              <Text strong>Description: </Text>
              <Text>
                {presetDetails[0]?.presetDescription || 'No description available'}
              </Text>
            </div>

            <Divider>Production Steps ({presetDetails.length})</Divider>

            <div className="space-y-3 max-h-300 overflow-y-auto">
              {presetDetails
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Text strong className="text-blue-600">
                            {step.stepOrder}
                          </Text>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium text-gray-900">
                          {step.stepName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {step.isRequired ? (
                            <span className="text-red-600">● Required Step</span>
                          ) : (
                            <span className="text-green-600">○ Optional Step</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default EditProductionPlanModal