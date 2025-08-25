import React, { useState, useEffect, useRef } from 'react'
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
  InputNumber,
  Tooltip,
  Timeline,
  Avatar,
  Empty,
  Statistic,
  Drawer,
  List,
  Alert,
  Dropdown,
  Menu,
  Switch,
  Progress,
  Spin
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SaveOutlined,
  CloseOutlined,
  ReloadOutlined,
  SettingOutlined,
  DragOutlined,
  CopyOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  BarsOutlined,
  FireOutlined,
  StarOutlined,
  RocketOutlined,
  BranchesOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import Layout from '../Layout/layout'
import {
  getStepPresets,
  getPresetDetails,
  createStepPreset,
  updateStepPreset,
  deleteStepPreset,
  getProductionSteps
} from '../../redux/api/productionAPI'
import moment from 'moment'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

// Default step icons mapping
const STEP_ICONS = {
  'Material Request': '📦',
  'Painting': '🎨',
  'Machining': '⚙️',
  'PVD Powder Coating': '🔧',
  'PVD Process': '⚡',
  'Milling': '🏭',
  'Acrylic Coating': '💧',
  'Lacquer Finish': '✨',
  'Packaging': '📋',
  'Quality Check': '🔍',
  'Dispatch': '🚚'
}

// Step colors for visualization
const STEP_COLORS = [
  '#722ed1', '#eb2f96', '#faad14', '#fa8c16', '#a0d911',
  '#52c41a', '#13c2c2', '#1890ff', '#2f54eb', '#f5222d', '#389e0d'
]

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
  } = useSelector(state => state.productionDetails || {})
  const { user } = useSelector(state => state.userDetails || {})

  // States
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false)
  const [editDrawerVisible, setEditDrawerVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  
  // Step builder states
  const [selectedSteps, setSelectedSteps] = useState([])
  const [availableSteps, setAvailableSteps] = useState([])
  const [stepDurations, setStepDurations] = useState({})
  
  // Form instances
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await dispatch(getStepPresets())
    await dispatch(getProductionSteps())
  }

  // Update available steps when production steps load
  useEffect(() => {
    if (productionSteps && productionSteps.length > 0) {
      setAvailableSteps(productionSteps.map(step => ({
        ...step,
        id: step.id?.toString(),
        icon: STEP_ICONS[step.stepName] || '⚡'
      })))
    }
  }, [productionSteps])

  // Filter presets based on search and category
  const filteredPresets = (stepPresets || []).filter(preset => {
    const matchesSearch = preset.presetName?.toLowerCase().includes(searchText.toLowerCase()) ||
                          preset.presetDescription?.toLowerCase().includes(searchText.toLowerCase())
    const matchesCategory = filterCategory === 'all' || preset.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Handle drag end for step reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(selectedSteps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    setSelectedSteps(items)
  }

  // Add step to selected
  const handleAddStep = (step) => {
    if (selectedSteps.length >= 20) {
      notification.warning({
        message: 'Step Limit',
        description: 'Maximum 20 steps allowed per preset'
      })
      return
    }
    
    if (!selectedSteps.find(s => s.id === step.id)) {
      setSelectedSteps([...selectedSteps, { 
        ...step, 
        stepOrder: selectedSteps.length + 1,
        estimatedDuration: stepDurations[step.id] || 2,
        estimatedDurationUnit: 'hours',
        isRequired: true
      }])
    }
  }

  // Remove step from selected
  const handleRemoveStep = (stepId) => {
    setSelectedSteps(selectedSteps.filter(s => s.id !== stepId))
  }

  // Update step duration
  const handleUpdateStepDuration = (stepId, duration) => {
    setStepDurations({ ...stepDurations, [stepId]: duration })
    setSelectedSteps(selectedSteps.map(step => 
      step.id === stepId 
        ? { ...step, estimatedDuration: duration }
        : step
    ))
  }

  // Toggle step required status
  const handleToggleRequired = (stepId) => {
    setSelectedSteps(selectedSteps.map(step => 
      step.id === stepId 
        ? { ...step, isRequired: !step.isRequired }
        : step
    ))
  }

  // Create preset
  const handleCreatePreset = async (values) => {
    try {
      const steps = selectedSteps.map((step, index) => ({
        stepId: parseInt(step.id),
        stepOrder: index + 1,
        isRequired: step.isRequired !== false,
        estimatedDuration: step.estimatedDuration || 2,
        estimatedDurationUnit: step.estimatedDurationUnit || 'hours',
        notes: step.notes || ''
      }))

      await dispatch(createStepPreset({
        name: values.name,
        description: values.description,
        category: values.category,
        isActive: values.isActive !== false,
        steps
      })).unwrap()

      notification.success({
        message: 'Success',
        description: 'Preset created successfully!'
      })

      setCreateDrawerVisible(false)
      createForm.resetFields()
      setSelectedSteps([])
      loadData()
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error?.message || 'Failed to create preset'
      })
    }
  }

  // Edit preset
  const handleEditPreset = async (preset) => {
    try {
      const details = await dispatch(getPresetDetails({ 
        presetName: preset.presetName 
      })).unwrap()
      
      setSelectedPreset(preset)
      
      if (details && details.length > 0) {
        // Set form values
        editForm.setFieldsValue({
          name: preset.presetName,
          description: preset.presetDescription,
          category: preset.category || 'standard',
          isActive: preset.isActive !== false
        })
        
        // Set selected steps
        const steps = details.sort((a, b) => a.stepOrder - b.stepOrder)
          .map(step => ({
            id: step.stepId?.toString(),
            stepName: step.stepName,
            icon: STEP_ICONS[step.stepName] || '⚡',
            stepOrder: step.stepOrder,
            isRequired: step.isRequired !== false,
            estimatedDuration: step.estimatedDuration || 2,
            estimatedDurationUnit: step.estimatedDurationUnit || 'hours',
            notes: step.notes || ''
          }))
        setSelectedSteps(steps)
      }
      
      setEditDrawerVisible(true)
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to load preset details'
      })
    }
  }

  // Update preset
  const handleUpdatePreset = async (values) => {
    try {
      const steps = selectedSteps.map((step, index) => ({
        stepId: parseInt(step.id),
        stepOrder: index + 1,
        isRequired: step.isRequired !== false,
        estimatedDuration: step.estimatedDuration || 2,
        estimatedDurationUnit: step.estimatedDurationUnit || 'hours',
        notes: step.notes || ''
      }))

      await dispatch(updateStepPreset({
        presetName: selectedPreset.presetName,
        presetData: {
          description: values.description,
          category: values.category,
          isActive: values.isActive !== false,
          steps
        }
      })).unwrap()

      notification.success({
        message: 'Success',
        description: 'Preset updated successfully!'
      })

      setEditDrawerVisible(false)
      editForm.resetFields()
      setSelectedSteps([])
      setSelectedPreset(null)
      loadData()
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error?.message || 'Failed to update preset'
      })
    }
  }

  // Delete preset
  const handleDeletePreset = async (presetName) => {
    try {
      const response = await dispatch(deleteStepPreset({ presetName })).unwrap()
      
      notification.success({
        message: 'Success',
        description: `Preset deleted successfully!`
      })
      
      loadData()
    } catch (error) {
      if (error?.message?.includes('currently being used')) {
        notification.warning({
          message: 'Cannot Delete',
          description: 'This preset is being used in active production plans',
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

  // Preview preset
  const handlePreviewPreset = async (preset) => {
    try {
      await dispatch(getPresetDetails({ 
        presetName: preset.presetName 
      })).unwrap()
      setSelectedPreset(preset)
      setPreviewModalVisible(true)
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to load preset details'
      })
    }
  }

  // Duplicate preset
  const handleDuplicatePreset = async (preset) => {
    try {
      const details = await dispatch(getPresetDetails({ 
        presetName: preset.presetName 
      })).unwrap()
      
      if (details && details.length > 0) {
        createForm.setFieldsValue({
          name: `${preset.presetName}_copy`,
          description: preset.presetDescription,
          category: preset.category || 'standard',
          isActive: true
        })
        
        const steps = details.sort((a, b) => a.stepOrder - b.stepOrder)
          .map(step => ({
            id: step.stepId?.toString(),
            stepName: step.stepName,
            icon: STEP_ICONS[step.stepName] || '⚡',
            stepOrder: step.stepOrder,
            isRequired: step.isRequired !== false,
            estimatedDuration: step.estimatedDuration || 2,
            estimatedDurationUnit: step.estimatedDurationUnit || 'hours',
            notes: step.notes || ''
          }))
        setSelectedSteps(steps)
        setCreateDrawerVisible(true)
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to duplicate preset'
      })
    }
  }

  // Calculate total duration
  const calculateTotalDuration = (steps) => {
    const totalHours = steps.reduce((sum, step) => {
      const duration = step.estimatedDuration || 2
      const unit = step.estimatedDurationUnit || 'hours'
      const hoursMultiplier = unit === 'days' ? 24 : unit === 'minutes' ? 1/60 : 1
      return sum + (duration * hoursMultiplier)
    }, 0)
    
    if (totalHours >= 24) {
      return `${Math.round(totalHours / 24)} days`
    }
    return `${Math.round(totalHours)} hours`
  }

  // Preset card component
  const PresetCard = ({ preset }) => {
    const isActive = preset.isActive !== false
    const category = preset.category || 'standard'
    const categoryColors = {
      basic: 'blue',
      standard: 'green',
      premium: 'purple',
      chrome: 'orange',
      urgent: 'red',
      custom: 'cyan'
    }
    
    return (
      <Card
        className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
        actions={[
          <Tooltip title="Preview">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => handlePreviewPreset(preset)}
            />
          </Tooltip>,
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEditPreset(preset)}
            />
          </Tooltip>,
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item 
                  key="duplicate"
                  icon={<CopyOutlined />}
                  onClick={() => handleDuplicatePreset(preset)}
                >
                  Duplicate
                </Menu.Item>
                <Menu.Item 
                  key="export"
                  icon={<ExportOutlined />}
                  disabled
                >
                  Export
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  key="delete"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Delete Preset',
                      content: `Are you sure you want to delete "${preset.presetName}"?`,
                      okText: 'Delete',
                      okType: 'danger',
                      onOk: () => handleDeletePreset(preset.presetName)
                    })
                  }}
                >
                  Delete
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ]}
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Title level={4} className="mb-0">
              {preset.presetName}
            </Title>
            <Space>
              <Tag color={categoryColors[category]}>
                {category.toUpperCase()}
              </Tag>
              {!isActive && (
                <Tag color="default">INACTIVE</Tag>
              )}
            </Space>
          </div>
          
          <Paragraph 
            ellipsis={{ rows: 2 }} 
            className="text-gray-600 mb-4"
          >
            {preset.presetDescription || 'No description available'}
          </Paragraph>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {preset.stepCount || 0}
              </div>
              <div className="text-xs text-gray-500">Total Steps</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-2xl font-bold text-green-600">
                {preset.activeUsage || 0}
              </div>
              <div className="text-xs text-gray-500">Active Plans</div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Table columns
  const columns = [
    {
      title: 'Preset',
      key: 'preset',
      fixed: 'left',
      width: 300,
      render: (_, record) => (
        <div className="py-2">
          <div className="flex items-center gap-3">
            <Avatar 
              size={48}
              style={{ 
                backgroundColor: record.isActive !== false ? '#1890ff' : '#d9d9d9',
                fontSize: '20px'
              }}
            >
              {record.stepCount || 0}
            </Avatar>
            <div>
              <div className="font-medium text-base">{record.presetName}</div>
              <div className="text-xs text-gray-500">
                {record.presetDescription || 'No description'}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const categoryColors = {
          basic: 'blue',
          standard: 'green',
          premium: 'purple',
          chrome: 'orange',
          urgent: 'red',
          custom: 'cyan'
        }
        return (
          <Tag color={categoryColors[category || 'standard']}>
            {(category || 'standard').toUpperCase()}
          </Tag>
        )
      }
    },
    {
      title: 'Steps',
      dataIndex: 'stepCount',
      key: 'stepCount',
      width: 100,
      align: 'center',
      render: (count) => (
        <Badge 
          count={count || 0} 
          style={{ backgroundColor: '#52c41a' }}
          showZero
        />
      )
    },
    {
      title: 'Active Plans',
      dataIndex: 'activeUsage',
      key: 'activeUsage',
      width: 120,
      align: 'center',
      render: (count) => (
        <span className={count > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
          {count || 0}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive !== false ? 'green' : 'default'}>
          {isActive !== false ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Preview">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreviewPreset(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditPreset(record)}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicatePreset(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Preset"
            description={`Are you sure you want to delete "${record.presetName}"?`}
            onConfirm={() => handleDeletePreset(record.presetName)}
            okText="Delete"
            okType="danger"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <Title level={2} className="text-white mb-2">
                  <SettingOutlined className="mr-3" />
                  Production Step Presets
                </Title>
                <Text className="text-white/90 text-lg">
                  Manage and customize workflow templates for production plans
                </Text>
              </div>
              <div className="text-center">
                <Statistic
                  title={<span className="text-white/80">Total Presets</span>}
                  value={stepPresets?.length || 0}
                  valueStyle={{ color: '#fff', fontSize: '36px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Space size="large">
                <Input.Search
                  placeholder="Search presets..."
                  allowClear
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 300 }}
                  prefix={<EyeOutlined className="text-gray-400" />}
                />
                <Select
                  value={filterCategory}
                  onChange={setFilterCategory}
                  style={{ width: 150 }}
                >
                  <Option value="all">All Categories</Option>
                  <Option value="basic">Basic</Option>
                  <Option value="standard">Standard</Option>
                  <Option value="premium">Premium</Option>
                  <Option value="chrome">Chrome</Option>
                  <Option value="urgent">Urgent</Option>
                  <Option value="custom">Custom</Option>
                </Select>
              </Space>
              
              <Space>
                <Button.Group>
                  <Button
                    icon={<AppstoreOutlined />}
                    type={viewMode === 'grid' ? 'primary' : 'default'}
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </Button>
                  <Button
                    icon={<BarsOutlined />}
                    type={viewMode === 'table' ? 'primary' : 'default'}
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </Button>
                </Button.Group>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadData}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateDrawerVisible(true)}
                  size="large"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 border-0 hover:from-blue-600 hover:to-purple-600"
                >
                  Create Preset
                </Button>
              </Space>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          ) : filteredPresets.length === 0 ? (
            <Card className="text-center py-12">
              <Empty
                description={
                  <div>
                    <Text className="text-gray-500">
                      {searchText || filterCategory !== 'all' 
                        ? 'No presets found matching your criteria'
                        : 'No presets created yet'}
                    </Text>
                    {!searchText && filterCategory === 'all' && (
                      <div className="mt-4">
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setCreateDrawerVisible(true)}
                        >
                          Create Your First Preset
                        </Button>
                      </div>
                    )}
                  </div>
                }
              />
            </Card>
          ) : viewMode === 'grid' ? (
            <Row gutter={[16, 16]}>
              {filteredPresets.map(preset => (
                <Col xs={24} sm={12} lg={8} xl={6} key={preset.presetName}>
                  <PresetCard preset={preset} />
                </Col>
              ))}
            </Row>
          ) : (
            <Card>
              <Table
                columns={columns}
                dataSource={filteredPresets}
                rowKey="presetName"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} presets`
                }}
                scroll={{ x: 1200 }}
              />
            </Card>
          )}
        </div>

        {/* Create/Edit Drawer */}
        <Drawer
          title={
            <div className="flex items-center gap-3">
              <Avatar 
                icon={editDrawerVisible ? <EditOutlined /> : <PlusOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <span>
                {editDrawerVisible ? `Edit Preset: ${selectedPreset?.presetName}` : 'Create New Preset'}
              </span>
            </div>
          }
          placement="right"
          width={800}
          open={createDrawerVisible || editDrawerVisible}
          onClose={() => {
            setCreateDrawerVisible(false)
            setEditDrawerVisible(false)
            createForm.resetFields()
            editForm.resetFields()
            setSelectedSteps([])
            setSelectedPreset(null)
          }}
          extra={
            <Space>
              <Button 
                onClick={() => {
                  setCreateDrawerVisible(false)
                  setEditDrawerVisible(false)
                  createForm.resetFields()
                  editForm.resetFields()
                  setSelectedSteps([])
                  setSelectedPreset(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={isCreating || isUpdating}
                onClick={() => {
                  const form = editDrawerVisible ? editForm : createForm
                  form.submit()
                }}
                disabled={selectedSteps.length === 0}
              >
                {editDrawerVisible ? 'Update' : 'Create'} Preset
              </Button>
            </Space>
          }
        >
          <Form
            form={editDrawerVisible ? editForm : createForm}
            layout="vertical"
            onFinish={editDrawerVisible ? handleUpdatePreset : handleCreatePreset}
          >
            <Row gutter={16}>
              <Col span={editDrawerVisible ? 24 : 12}>
                <Form.Item
                  name="name"
                  label="Preset Name"
                  rules={[
                    { required: true, message: 'Please enter preset name' },
                    { min: 3, max: 50, message: 'Name must be 3-50 characters' },
                    { 
                      pattern: /^[a-zA-Z0-9\s\-_]+$/, 
                      message: 'Only letters, numbers, spaces, hyphens, and underscores allowed' 
                    }
                  ]}
                >
                  <Input 
                    placeholder="Enter preset name"
                    disabled={editDrawerVisible}
                    prefix={<SettingOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={editDrawerVisible ? 12 : 12}>
                <Form.Item
                  name="category"
                  label="Category"
                  rules={[{ required: true, message: 'Please select category' }]}
                  initialValue="standard"
                >
                  <Select placeholder="Select category">
                    <Option value="basic">Basic</Option>
                    <Option value="standard">Standard</Option>
                    <Option value="premium">Premium</Option>
                    <Option value="chrome">Chrome</Option>
                    <Option value="urgent">Urgent</Option>
                    <Option value="custom">Custom</Option>
                  </Select>
                </Form.Item>
              </Col>
              {editDrawerVisible && (
                <Col span={12}>
                  <Form.Item
                    name="isActive"
                    label="Status"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch 
                      checkedChildren="Active" 
                      unCheckedChildren="Inactive"
                    />
                  </Form.Item>
                </Col>
              )}
            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ max: 200, message: 'Maximum 200 characters' }]}
            >
              <TextArea
                rows={3}
                placeholder="Enter preset description (optional)"
                showCount
                maxLength={200}
              />
            </Form.Item>
          </Form>

          <Divider />

          {/* Step Builder Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Title level={5}>
                <BranchesOutlined className="mr-2" />
                Workflow Steps
              </Title>
              <Tag color="blue">
                {selectedSteps.length} / 20 steps
              </Tag>
            </div>

            {selectedSteps.length > 0 && (
              <Alert
                message={`Total Duration: ${calculateTotalDuration(selectedSteps)}`}
                type="info"
                showIcon
                className="mb-4"
              />
            )}

            <Row gutter={16}>
              {/* Available Steps */}
              <Col span={10}>
                <Card 
                  title="Available Steps" 
                  size="small"
                  className="h-96 overflow-hidden"
                >
                  <div className="overflow-y-auto h-80">
                    <List
                      dataSource={availableSteps.filter(step => 
                        !selectedSteps.find(s => s.id === step.id?.toString())
                      )}
                      renderItem={step => (
                        <List.Item
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleAddStep(step)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{step.icon}</span>
                              <Text>{step.stepName}</Text>
                            </div>
                            <Button
                              type="text"
                              icon={<PlusCircleOutlined />}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddStep(step)
                              }}
                            />
                          </div>
                        </List.Item>
                      )}
                      locale={{ emptyText: 'All steps added' }}
                    />
                  </div>
                </Card>
              </Col>

              {/* Selected Steps with Drag & Drop */}
              <Col span={14}>
                <Card 
                  title="Selected Steps (Drag to reorder)" 
                  size="small"
                  className="h-96 overflow-hidden"
                >
                  {selectedSteps.length === 0 ? (
                    <Empty 
                      description="No steps selected"
                      className="mt-16"
                    />
                  ) : (
                    <div className="overflow-y-auto h-80">
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="selected-steps">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                              {selectedSteps.map((step, index) => (
                                <Draggable 
                                  key={step.id} 
                                  draggableId={step.id} 
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`mb-2 p-3 bg-white border rounded-lg ${
                                        snapshot.isDragging ? 'shadow-lg' : ''
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div {...provided.dragHandleProps}>
                                            <DragOutlined className="text-gray-400 cursor-move" />
                                          </div>
                                          <Badge 
                                            count={index + 1} 
                                            style={{ backgroundColor: STEP_COLORS[index % STEP_COLORS.length] }}
                                          />
                                          <span className="text-lg">{step.icon}</span>
                                          <div>
                                            <Text strong>{step.stepName}</Text>
                                            <div className="flex items-center gap-2 mt-1">
                                              <InputNumber
                                                size="small"
                                                min={1}
                                                max={999}
                                                value={step.estimatedDuration || 2}
                                                onChange={(value) => handleUpdateStepDuration(step.id, value)}
                                                style={{ width: 60 }}
                                              />
                                              <Select
                                                size="small"
                                                value={step.estimatedDurationUnit || 'hours'}
                                                onChange={(value) => {
                                                  setSelectedSteps(selectedSteps.map(s => 
                                                    s.id === step.id 
                                                      ? { ...s, estimatedDurationUnit: value }
                                                      : s
                                                  ))
                                                }}
                                                style={{ width: 80 }}
                                              >
                                                <Option value="minutes">mins</Option>
                                                <Option value="hours">hrs</Option>
                                                <Option value="days">days</Option>
                                              </Select>
                                              <Switch
                                                size="small"
                                                checked={step.isRequired !== false}
                                                onChange={() => handleToggleRequired(step.id)}
                                                checkedChildren="Required"
                                                unCheckedChildren="Optional"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          type="text"
                                          icon={<MinusCircleOutlined />}
                                          size="small"
                                          danger
                                          onClick={() => handleRemoveStep(step.id)}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        </Drawer>

        {/* Preview Modal */}
        <Modal
          title={
            <div className="flex items-center gap-3">
              <Avatar 
                icon={<EyeOutlined />}
                style={{ backgroundColor: '#52c41a' }}
              />
              <span>Preview: {selectedPreset?.presetName}</span>
            </div>
          }
          open={previewModalVisible}
          onCancel={() => {
            setPreviewModalVisible(false)
            setSelectedPreset(null)
          }}
          width={700}
          footer={[
            <Button 
              key="close" 
              onClick={() => setPreviewModalVisible(false)}
            >
              Close
            </Button>,
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setPreviewModalVisible(false)
                handleEditPreset(selectedPreset)
              }}
            >
              Edit Preset
            </Button>
          ]}
        >
          {presetDetails && presetDetails.length > 0 && (
            <div>
              <div className="mb-6">
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Name">
                    {selectedPreset?.presetName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Category">
                    <Tag color="blue">
                      {(selectedPreset?.category || 'standard').toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Description" span={2}>
                    {selectedPreset?.presetDescription || 'No description'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Steps">
                    {presetDetails.length}
                  </Descriptions.Item>
                  <Descriptions.Item label="Est. Duration">
                    {calculateTotalDuration(presetDetails)}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <Divider>Workflow Steps</Divider>

              <Timeline mode="left">
                {presetDetails
                  .sort((a, b) => a.stepOrder - b.stepOrder)
                  .map((step, index) => (
                    <Timeline.Item
                      key={step.id}
                      color={STEP_COLORS[index % STEP_COLORS.length]}
                      label={
                        <Tag color={STEP_COLORS[index % STEP_COLORS.length]}>
                          Step {step.stepOrder}
                        </Tag>
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {STEP_ICONS[step.stepName] || '⚡'}
                        </span>
                        <div>
                          <Text strong className="text-base">
                            {step.stepName}
                          </Text>
                          <div className="flex items-center gap-3 mt-1">
                            <Tag color="cyan">
                              {step.estimatedDuration || 2} {step.estimatedDurationUnit || 'hours'}
                            </Tag>
                            {step.isRequired !== false ? (
                              <Tag color="green">Required</Tag>
                            ) : (
                              <Tag color="default">Optional</Tag>
                            )}
                          </div>
                          {step.notes && (
                            <Text type="secondary" className="text-xs mt-1">
                              {step.notes}
                            </Text>
                          )}
                        </div>
                      </div>
                    </Timeline.Item>
                  ))}
              </Timeline>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  )
}

export default PresetManagement