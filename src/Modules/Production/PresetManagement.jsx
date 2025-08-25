import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Space,
  Tag,
  Popconfirm,
  notification,
  Typography,
  Divider,
  Badge,
  Row,
  Col,
  Transfer,
  InputNumber
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SaveOutlined,
  CloseOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import Layout from '../Layout/layout'
import {
  getStepPresets,
  getPresetDetails,
  createStepPreset,
  updateStepPreset,
  deleteStepPreset,
  getProductionSteps
} from '../../redux/api/productionAPI'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const PresetManagement = () => {
  const dispatch = useDispatch()
  const {
    stepPresets,
    presetDetails,
    productionSteps,
    loading,
    isCreating,
    isUpdating,
    isDeleting
  } = useSelector(state => state.productionDetails)
  const { user } = useSelector(state => state.userDetails)

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(null)

  // Form instances
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  // Transfer component for step selection
  const [targetKeys, setTargetKeys] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])

  // Load data on component mount
  useEffect(() => {
    dispatch(getStepPresets())
    dispatch(getProductionSteps())
  }, [dispatch])

  // Prepare transfer data for step selection
  const getTransferData = () => {
    return (productionSteps || []).map(step => ({
      key: step.id.toString(),
      title: step.stepName,
      description: `Step ID: ${step.id}`,
      chosen: targetKeys.includes(step.id.toString())
    }))
  }

  // Handle preview preset
  const handlePreviewPreset = async presetName => {
    try {
      await dispatch(getPresetDetails({ presetName })).unwrap()
      setSelectedPreset(presetName)
      setPreviewModalVisible(true)
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to load preset details'
      })
    }
  }

  // Handle create preset
  const handleCreatePreset = async values => {
    try {
      // Prepare steps data from target keys
      const steps = targetKeys.map((key, index) => ({
        stepId: parseInt(key),
        isRequired: true, // Default all steps as required
        stepOrder: index + 1
      }))

      const presetData = {
        name: values.name,
        description: values.description,
        steps: steps,
        userId: user?.id || 1
      }

      await dispatch(createStepPreset(presetData)).unwrap()

      notification.success({
        message: 'Success',
        description: 'Preset created successfully!'
      })

      setCreateModalVisible(false)
      createForm.resetFields()
      setTargetKeys([])
      dispatch(getStepPresets()) // Refresh list
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error?.message || 'Failed to create preset'
      })
    }
  }

  // Handle edit preset
  const handleEditPreset = async presetName => {
    try {
      await dispatch(getPresetDetails({ presetName })).unwrap()
      setSelectedPreset(presetName)

      // Set form values
      const preset = presetDetails?.[0]
      if (preset) {
        editForm.setFieldsValue({
          name: preset.presetName,
          description: preset.presetDescription
        })

        // Set target keys for transfer
        const stepKeys = (presetDetails || []).map(step =>
          step.stepId?.toString()
        )
        setTargetKeys(stepKeys)
      }

      setEditModalVisible(true)
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to load preset for editing'
      })
    }
  }

  // Handle update preset
  const handleUpdatePreset = async values => {
    try {
      const steps = targetKeys.map((key, index) => ({
        stepId: parseInt(key),
        isRequired: true,
        stepOrder: index + 1
      }))

      const presetData = {
        presetName: selectedPreset,
        presetData: {
          description: values.description,
            steps: steps,
          userId: user?.id || 1
        }
      }

      await dispatch(updateStepPreset(presetData)).unwrap()

      notification.success({
        message: 'Success',
        description: 'Preset updated successfully!'
      })

      setEditModalVisible(false)
      editForm.resetFields()
      setTargetKeys([])
      setSelectedPreset(null)
      dispatch(getStepPresets()) // Refresh list
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error?.message || 'Failed to update preset'
      })
    }
  }

  // Handle delete preset
  const handleDeletePreset = async presetName => {
    try {
      const response = await dispatch(deleteStepPreset({ presetName })).unwrap()

      notification.success({
        message: 'Success',
        description: `Preset deleted successfully! ${
          response.totalUsageHistory > 0
            ? `(Used in ${response.totalUsageHistory} plans historically)`
            : ''
        }`
      })

      dispatch(getStepPresets()) // Refresh list
    } catch (error) {
      if (error?.message?.includes('currently being used')) {
        notification.warning({
          message: 'Cannot Delete Preset',
          description:
            'This preset is currently being used in active production plans. Complete those plans before deleting.',
          duration: 6
        })
      } else {
        notification.error({
          message: 'Error',
          description: error?.message || 'Failed to delete preset'
        })
      }
    }
  }

  // Handle transfer change
  const handleTransferChange = (nextTargetKeys, direction, moveKeys) => {
    if (nextTargetKeys.length > 20) {
      notification.warning({
        message: 'Step Limit Reached',
        description: 'Maximum 20 steps allowed per preset'
      })
      return
    }
    setTargetKeys(nextTargetKeys)
  }

  const handleTransferSelectChange = (
    sourceSelectedKeys,
    targetSelectedKeys
  ) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys])
  }

  // Table columns
  const columns = [
    {
      title: 'Preset Name',
      dataIndex: 'presetName',
      key: 'presetName',
      render: (text, record) => (
        <div>
          <div className='font-medium text-blue-600'>{text}</div>
          <div className='text-xs text-gray-500'>
            {record.stepCount || 0} steps
          </div>
        </div>
      )
    },
    {
      title: 'Steps',
      key: 'stepCount',
      render: (_, record) => <span>{record.stepCount || 0} steps</span>
    },
    {
      title: 'Description',
      dataIndex: 'presetDescription',
      key: 'presetDescription',
      ellipsis: true,
      render: text => (
        <Text ellipsis title={text}>
          {text || 'No description'}
        </Text>
      )
    },
    {
      title: 'Steps',
      dataIndex: 'stepCount',
      key: 'stepCount',
      align: 'center',
      render: count => (
        <Badge count={count || 0} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size='small'>
          <Button
            type='text'
            icon={<EyeOutlined />}
            onClick={() => handlePreviewPreset(record.presetName)}
            title='Preview Preset'
          />
        </Space>
      )
    }
  ]

  return (
    <Layout>
      <div className='p-6 bg-gray-50 min-h-screen'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <Title level={2} className='mb-2'>
                <SettingOutlined className='mr-2' />
                Production Step Presets
              </Title>
              <Text type='secondary'>
                View predefined workflows for production plans
              </Text>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => dispatch(getStepPresets())}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </div>
        </div>

        {/* Presets Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={stepPresets || []}
            rowKey='presetName'
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} presets`
            }}
            scroll={{ x: 800 }}
          />
        </Card>

        {/* Create Preset Modal */}
        <Modal
          title='Create New Preset'
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false)
            createForm.resetFields()
            setTargetKeys([])
          }}
          footer={null}
          width={800}
          destroyOnClose
        >
          <Form
            form={createForm}
            layout='vertical'
            onFinish={handleCreatePreset}
            className='mt-4'
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={24}>
                <Form.Item
                  name='name'
                  label='Preset Name'
                  rules={[
                    { required: true, message: 'Please enter preset name!' },
                    { min: 3, message: 'Name must be at least 3 characters' },
                    {
                      max: 50,
                      message: 'Name must be less than 50 characters'
                    },
                    {
                      pattern: /^[a-zA-Z0-9\s\-_]+$/,
                      message:
                        'Name can only contain letters, numbers, spaces, hyphens, and underscores'
                    }
                  ]}
                >
                  <Input
                    placeholder='Enter preset name (3-50 characters)'
                    showCount
                    maxLength={50}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name='description'
              label='Description'
              rules={[
                {
                  max: 200,
                  message: 'Description must be less than 200 characters'
                }
              ]}
            >
              <TextArea
                rows={3}
                placeholder='Enter preset description (optional, max 200 characters)'
                showCount
                maxLength={200}
              />
            </Form.Item>

            <Divider>Select Production Steps</Divider>

            <div className='mb-4'>
              <Text type='secondary'>
                Select the production steps for this preset. Steps will be
                executed in the order shown.
              </Text>
              <div className='text-xs text-gray-500 mt-1'>
                Maximum 20 steps allowed • Current selection:{' '}
                {targetKeys.length} steps
                {targetKeys.length >= 20 && (
                  <span className='text-red-500 ml-2'>⚠️ Maximum reached</span>
                )}
              </div>
            </div>

            <Transfer
              dataSource={getTransferData()}
              titles={['Available Steps', 'Selected Steps']}
              targetKeys={targetKeys}
              selectedKeys={selectedKeys}
              onChange={handleTransferChange}
              onSelectChange={handleTransferSelectChange}
              render={item => `${item.title}`}
              listStyle={{
                width: 300,
                height: 300
              }}
              showSearch
              searchPlaceholder='Search steps'
            />

            <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
              <Button
                size='large'
                onClick={() => {
                  setCreateModalVisible(false)
                  createForm.resetFields()
                  setTargetKeys([])
                }}
              >
                Cancel
              </Button>
              <Button
                type='primary'
                size='large'
                htmlType='submit'
                loading={isCreating}
                icon={<SaveOutlined />}
                disabled={targetKeys.length === 0}
              >
                Create Preset
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Edit Preset Modal */}
        <Modal
          title={`Edit Preset: ${selectedPreset}`}
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false)
            editForm.resetFields()
            setTargetKeys([])
            setSelectedPreset(null)
          }}
          footer={null}
          width={800}
          destroyOnClose
        >
          <Form
            form={editForm}
            layout='vertical'
            onFinish={handleUpdatePreset}
            className='mt-4'
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item name='name' label='Preset Name'>
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name='category'
                  label='Category'
                  rules={[
                    { required: true, message: 'Please select category!' }
                  ]}
                >
                  <Select placeholder='Select category'>
                    <Option value='basic'>Basic</Option>
                    <Option value='chrome'>Chrome</Option>
                    <Option value='premium'>Premium</Option>
                    <Option value='standard'>Standard</Option>
                    <Option value='urgent'>Urgent</Option>
                    <Option value='custom'>Custom</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name='description'
              label='Description'
              rules={[
                {
                  max: 200,
                  message: 'Description must be less than 200 characters'
                }
              ]}
            >
              <TextArea rows={3} placeholder='Enter preset description' />
            </Form.Item>

            <Divider>Update Production Steps</Divider>

            <Transfer
              dataSource={getTransferData()}
              titles={['Available Steps', 'Selected Steps']}
              targetKeys={targetKeys}
              selectedKeys={selectedKeys}
              onChange={handleTransferChange}
              onSelectChange={handleTransferSelectChange}
              render={item => `${item.title}`}
              listStyle={{
                width: 300,
                height: 300
              }}
              showSearch
              searchPlaceholder='Search steps'
            />

            <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
              <Button
                size='large'
                onClick={() => {
                  setEditModalVisible(false)
                  editForm.resetFields()
                  setTargetKeys([])
                  setSelectedPreset(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type='primary'
                size='large'
                htmlType='submit'
                loading={isUpdating}
                icon={<SaveOutlined />}
                disabled={targetKeys.length === 0}
              >
                Update Preset
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Preview Preset Modal */}
        <Modal
          title={`Preview: ${selectedPreset}`}
          open={previewModalVisible}
          onCancel={() => {
            setPreviewModalVisible(false)
            setSelectedPreset(null)
          }}
          footer={[
            <Button key='close' onClick={() => setPreviewModalVisible(false)}>
              Close
            </Button>
          ]}
          width={600}
        >
          {presetDetails && presetDetails.length > 0 && (
            <div className='mt-4'>
              <div className='mb-4'>
                <Text strong>Description: </Text>
                <Text>
                  {presetDetails[0]?.presetDescription || 'No description'}
                </Text>
              </div>

              <Divider>Production Steps ({presetDetails.length})</Divider>

              <div className='space-y-3'>
                {presetDetails
                  .sort((a, b) => a.stepOrder - b.stepOrder)
                  .map((step, index) => (
                    <div
                      key={step.id}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <Badge
                          count={step.stepOrder}
                          style={{ backgroundColor: '#1890ff' }}
                        />
                        <div>
                          <Text strong>{step.stepName}</Text>
                          <div className='text-xs text-gray-500'>
                            {step.isRequired ? 'Required' : 'Optional'} Step
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  )
}

export default PresetManagement
