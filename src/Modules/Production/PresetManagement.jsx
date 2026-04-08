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
  Spin,
  Descriptions
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  DragOutlined,
  CopyOutlined,
  ExportOutlined,
  AppstoreOutlined,
  BarsOutlined,
  BranchesOutlined,
  MoreOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  SearchOutlined,
  FieldTimeOutlined,
  OrderedListOutlined,
  FlagOutlined
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
  Painting: '🎨',
  Machining: '⚙️',
  'PVD Powder Coating': '🔧',
  'PVD Process': '⚡',
  Milling: '🏭',
  'Acrylic Coating': '💧',
  'Lacquer Finish': '✨',
  Packaging: '📋',
  'Quality Check': '🔍',
  Dispatch: '🚚'
}

// Step colors for visualization
const STEP_COLORS = [
  '#722ed1',
  '#eb2f96',
  '#faad14',
  '#fa8c16',
  '#a0d911',
  '#52c41a',
  '#13c2c2',
  '#1890ff',
  '#2f54eb',
  '#f5222d',
  '#389e0d'
]

const PresetManagement = () => {
  const dispatch = useDispatch()

  // Add gradient animation styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes gradient-xy {
        0%, 100% {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899);
        }
        25% {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
        }
        50% {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
        }
        75% {
          background: linear-gradient(180deg, #3b82f6, #8b5cf6, #ec4899);
        }
      }
      .animate-gradient-xy {
        background-size: 400% 400%;
        animation: gradient-xy 15s ease infinite;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])
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
  // presetDetails is already available from Redux state (line 134)

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
      setAvailableSteps(
        productionSteps.map(step => ({
          ...step,
          id: step.id?.toString(),
          icon: STEP_ICONS[step.stepName] || '⚡'
        }))
      )
    }
  }, [productionSteps])

  // Filter presets based on search
  const filteredPresets = (stepPresets || []).filter(preset => {
    const matchesSearch =
      preset.presetName?.toLowerCase().includes(searchText.toLowerCase()) ||
      preset.presetDescription?.toLowerCase().includes(searchText.toLowerCase())
    return matchesSearch
  })

  // Handle drag end for step reordering
  const handleDragEnd = result => {
    if (!result.destination) return

    const items = Array.from(selectedSteps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSelectedSteps(items)
  }

  // Add step to selected
  const handleAddStep = step => {
    if (selectedSteps.length >= 20) {
      notification.warning({
        message: 'Step Limit',
        description: 'Maximum 20 steps allowed per preset'
      })
      return
    }

    if (!selectedSteps.find(s => s.id === step.id)) {
      setSelectedSteps([
        ...selectedSteps,
        {
          ...step,
          stepOrder: selectedSteps.length + 1,
          estimatedDuration: stepDurations[step.id] || 2,
          estimatedDurationUnit: 'hours',
          isRequired: true
        }
      ])
    }
  }

  // Remove step from selected
  const handleRemoveStep = stepId => {
    setSelectedSteps(selectedSteps.filter(s => s.id !== stepId))
  }

  // Update step duration
  const handleUpdateStepDuration = (stepId, duration) => {
    setStepDurations({ ...stepDurations, [stepId]: duration })
    setSelectedSteps(
      selectedSteps.map(step =>
        step.id === stepId ? { ...step, estimatedDuration: duration } : step
      )
    )
  }

  // Toggle step required status
  const handleToggleRequired = stepId => {
    setSelectedSteps(
      selectedSteps.map(step =>
        step.id === stepId ? { ...step, isRequired: !step.isRequired } : step
      )
    )
  }

  // Create preset
  const handleCreatePreset = async values => {
    try {
      const steps = selectedSteps.map((step, index) => ({
        stepId: parseInt(step.id),
        stepOrder: index + 1,
        isRequired: step.isRequired !== false,
        estimatedDuration: step.estimatedDuration || 2,
        estimatedDurationUnit: step.estimatedDurationUnit || 'hours',
        notes: step.notes || ''
      }))

      await dispatch(
        createStepPreset({
          name: values.name,
          description: values.description,
          isActive: values.isActive !== false,
          steps
        })
      ).unwrap()

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
  const handleEditPreset = async preset => {
    console.log('🔧 Editing preset:', preset) // Debug log
    try {
      const details = await dispatch(
        getPresetDetails({
          presetId: preset.id || preset.presetId
        })
      ).unwrap()

      setSelectedPreset(preset)

      // Always set basic form values first, even if details fail to load
      editForm.setFieldsValue({
        name: preset.presetName || preset.preset_name,
        description:
          preset.presetDescription || preset.preset_description || '',
        isActive: preset.isActive !== false && preset.is_active !== false
      })

      if (details && details.length > 0) {
        // Form values already set above

        // Set selected steps
        const steps = [...details]
          .sort((a, b) => a.stepOrder - b.stepOrder)
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
      } else {
        // No details found, but still open the edit drawer
        console.warn(
          'No preset details found for:',
          preset.presetName || preset.preset_name
        )
        setSelectedSteps([])
      }

      setEditDrawerVisible(true)
    } catch (error) {
      console.error('Failed to load preset details:', error)
      // Still open the edit drawer even if details fail to load
      setSelectedSteps([])
      setEditDrawerVisible(true)
    }
  }

  // Update preset
  const handleUpdatePreset = async values => {
    try {
      const steps = selectedSteps.map((step, index) => ({
        stepId: parseInt(step.id),
        stepOrder: index + 1,
        isRequired: step.isRequired !== false,
        estimatedDuration: step.estimatedDuration || 2,
        estimatedDurationUnit: step.estimatedDurationUnit || 'hours',
        notes: step.notes || ''
      }))

      await dispatch(
        updateStepPreset({
          presetName: selectedPreset.presetName,
          presetData: {
            description: values.description,
            isActive: values.isActive !== false,
            steps
          }
        })
      ).unwrap()

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
  const handleDeletePreset = async presetName => {
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
  const handlePreviewPreset = async preset => {
    // Always show the modal first with basic info
    setSelectedPreset(preset)
    setPreviewModalVisible(true)

    // Then try to fetch detailed steps - Redux state will be updated automatically
    try {
      console.log('Loading preset details for:', preset.presetName)
      const result = await dispatch(
        getPresetDetails({
          presetId: preset.id || preset.presetId
        })
      ).unwrap()
      console.log('Preset details loaded:', result)
      // Redux state is automatically updated by the getPresetDetails thunk
    } catch (error) {
      console.error('Failed to load preset details:', error)
      // Don't show error notification since modal is already open
      // Just log the error for debugging
    }
  }

  // Duplicate preset
  const handleDuplicatePreset = async preset => {
    try {
      const details = await dispatch(
        getPresetDetails({
          presetId: preset.id || preset.presetId
        })
      ).unwrap()

      if (details && details.length > 0) {
        createForm.setFieldsValue({
          name: `${preset.presetName}_copy`,
          description: preset.presetDescription,
          isActive: true
        })

        const steps = [...details]
          .sort((a, b) => a.stepOrder - b.stepOrder)
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
  const calculateTotalDuration = steps => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return '0 hours'
    }

    const totalHours = steps.reduce((sum, step) => {
      const duration = step.estimatedDuration || 2
      const unit = step.estimatedDurationUnit || 'hours'
      const hoursMultiplier =
        unit === 'days' ? 24 : unit === 'minutes' ? 1 / 60 : 1
      return sum + duration * hoursMultiplier
    }, 0)

    if (totalHours >= 24) {
      return `${Math.round(totalHours / 24)} days`
    }
    return `${Math.round(totalHours)} hours`
  }

  // Preset card component
  const PresetCard = ({ preset }) => {
    const isActive = preset.isActive !== false

    return (
      <Card
        className='group hover:shadow-2xl transition-all duration-500 cursor-pointer h-full border-2 hover:border-blue-300 transform hover:-translate-y-1 bg-white'
        bodyStyle={{ padding: '20px' }}
        actions={[
          <Tooltip title='Preview Preset' key='preview'>
            <Button
              type='text'
              icon={
                <EyeOutlined className='text-blue-500 group-hover:text-blue-700 transition-colors' />
              }
              onClick={() => handlePreviewPreset(preset)}
              className='hover:bg-blue-50 transition-all duration-200'
            />
          </Tooltip>,
          <Tooltip title='Edit Preset' key='edit'>
            <Button
              type='text'
              icon={
                <EditOutlined className='text-green-500 group-hover:text-green-700 transition-colors' />
              }
              onClick={() => handleEditPreset(preset)}
              className='hover:bg-green-50 transition-all duration-200'
            />
          </Tooltip>,
          <Dropdown
            key='more'
            overlay={
              <Menu className='rounded-lg shadow-lg border'>
                <Menu.Item
                  key='duplicate'
                  icon={<CopyOutlined className='text-blue-500' />}
                  onClick={() => handleDuplicatePreset(preset)}
                  className='hover:bg-blue-50 transition-colors'
                >
                  <span className='font-medium'>Duplicate</span>
                </Menu.Item>
                <Menu.Item
                  key='export'
                  icon={<ExportOutlined />}
                  disabled
                  className='opacity-50'
                >
                  Export
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key='delete'
                  icon={<DeleteOutlined className='text-red-500' />}
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Delete Preset',
                      content: (
                        <div>
                          <p>
                            Are you sure you want to delete{' '}
                            <strong>{preset.presetName}</strong>?
                          </p>
                          <p className='text-gray-500 text-sm mt-2'>
                            This action cannot be undone.
                          </p>
                        </div>
                      ),
                      okText: 'Delete',
                      okType: 'danger',
                      onOk: () => handleDeletePreset(preset.presetName)
                    })
                  }}
                  className='hover:bg-red-50 transition-colors'
                >
                  <span className='font-medium'>Delete</span>
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button
              type='text'
              icon={
                <MoreOutlined className='text-gray-400 group-hover:text-gray-600 transition-colors' />
              }
              className='hover:bg-gray-50 transition-all duration-200'
            />
          </Dropdown>
        ]}
      >
        <div className='mb-4'>
          {/* Header with improved visual hierarchy */}
          <div className='flex items-start justify-between mb-3'>
            <div className='flex-1'>
              <Title
                level={4}
                className='mb-1 text-gray-800 group-hover:text-blue-700 transition-colors'
              >
                {preset.presetName}
              </Title>
              {!isActive && (
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'>
                  INACTIVE
                </span>
              )}
            </div>
            <div className='ml-3'>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : 'bg-gray-300'
                }`}
              >
                {preset.stepCount || 0}
              </div>
            </div>
          </div>

          {/* Enhanced description */}
          <Paragraph
            ellipsis={{ rows: 2, expandable: true }}
            className='text-gray-600 mb-4 text-sm leading-relaxed'
          >
            {preset.presetDescription || 'No description available'}
          </Paragraph>

          {/* Enhanced stats with better visual design */}
          <div className='grid grid-cols-2 gap-3'>
            <div
              className={`p-4 rounded-xl ${
                isActive
                  ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <div
                    className={`text-2xl font-bold ${
                      isActive ? 'text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    {preset.stepCount || 0}
                  </div>
                  <div className='text-xs text-gray-500 font-medium'>Steps</div>
                </div>
                <div
                  className={`text-2xl ${
                    isActive ? 'text-blue-400' : 'text-gray-400'
                  }`}
                >
                  📋
                </div>
              </div>
            </div>
            <div
              className={`p-4 rounded-xl ${
                preset.activeUsage > 0
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <div
                    className={`text-2xl font-bold ${
                      preset.activeUsage > 0
                        ? 'text-green-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {preset.activeUsage || 0}
                  </div>
                  <div className='text-xs text-gray-500 font-medium'>
                    Active Plans
                  </div>
                </div>
                <div
                  className={`text-2xl ${
                    preset.activeUsage > 0 ? 'text-green-400' : 'text-gray-400'
                  }`}
                >
                  🚀
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced visual indicators */}
          {preset.activeUsage > 0 && (
            <div className='mt-3'>
              <div className='flex items-center gap-2'>
                <div className='flex-1 bg-green-200 rounded-full h-2'>
                  <div
                    className='bg-green-500 h-2 rounded-full transition-all duration-500'
                    style={{
                      width: `${Math.min(preset.activeUsage * 10, 100)}%`
                    }}
                  ></div>
                </div>
                <span className='text-xs text-green-600 font-medium'>
                  Active
                </span>
              </div>
            </div>
          )}
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
        <div className='py-2'>
          <div className='flex items-center gap-3'>
            <Avatar
              size={48}
              style={{
                backgroundColor:
                  record.isActive !== false ? '#1890ff' : '#d9d9d9',
                fontSize: '20px'
              }}
            >
              {record.stepCount || 0}
            </Avatar>
            <div>
              <div className='font-medium text-base'>{record.presetName}</div>
              <div className='text-xs text-gray-500'>
                {record.presetDescription || 'No description'}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Steps',
      dataIndex: 'stepCount',
      key: 'stepCount',
      width: 100,
      align: 'center',
      render: count => (
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
      render: count => (
        <span
          className={count > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}
        >
          {count || 0}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: isActive => (
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
          <Tooltip title='Preview'>
            <Button
              type='text'
              icon={<EyeOutlined />}
              onClick={() => handlePreviewPreset(record)}
            />
          </Tooltip>
          <Tooltip title='Edit'>
            <Button
              type='text'
              icon={<EditOutlined />}
              onClick={() => handleEditPreset(record)}
            />
          </Tooltip>
          <Tooltip title='Duplicate'>
            <Button
              type='text'
              icon={<CopyOutlined />}
              onClick={() => handleDuplicatePreset(record)}
            />
          </Tooltip>
          <Popconfirm
            title='Delete Preset'
            description={`Are you sure you want to delete "${record.presetName}"?`}
            onConfirm={() => handleDeletePreset(record.presetName)}
            okText='Delete'
            okType='danger'
          >
            <Tooltip title='Delete'>
              <Button type='text' icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const activeCount = (stepPresets || []).filter(p => p.isActive !== false).length
  const inactiveCount = (stepPresets || []).filter(p => p.isActive === false).length

  return (
    <div style={{ width: '100%' }}>
      <div className='min-h-screen'>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontFamily: "'Staff Wide Test', serif", fontSize: 42, fontWeight: 400, color: '#1a1a1a', margin: '0 0 8px', lineHeight: '30px' }}>
            Production Step Presets
          </h1>
          <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
            <span style={{ background: '#d9fae6', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32 }}>
              {activeCount} Active
            </span>
            <span style={{ background: '#f3f3f5', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32 }}>
              {inactiveCount} Inactive
            </span>
            <span style={{ background: '#dbeafe', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32 }}>
              {stepPresets?.length || 0} Total
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
          padding: '12px 32px', marginBottom: 16,
          boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text" placeholder="Search presets by name or description..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }}
            />

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: '#f3f3f5', borderRadius: 123, padding: 2 }}>
              <button onClick={() => setViewMode('grid')} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 14px', borderRadius: 123, fontSize: 13, fontWeight: 500,
                fontFamily: "'Inter', sans-serif", border: 'none', cursor: 'pointer',
                background: viewMode === 'grid' ? 'white' : 'transparent',
                color: viewMode === 'grid' ? '#1a1a1a' : '#6b7280',
                boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}>
                <AppstoreOutlined /> Grid
              </button>
              <button onClick={() => setViewMode('table')} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 14px', borderRadius: 123, fontSize: 13, fontWeight: 500,
                fontFamily: "'Inter', sans-serif", border: 'none', cursor: 'pointer',
                background: viewMode === 'table' ? 'white' : 'transparent',
                color: viewMode === 'table' ? '#1a1a1a' : '#6b7280',
                boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}>
                <BarsOutlined /> Table
              </button>
            </div>

            <button onClick={loadData} disabled={loading} style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', minWidth: 100, justifyContent: 'center',
              background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400,
              fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', flexShrink: 0,
            }}>
              <ReloadOutlined spin={loading} style={{ fontSize: 14 }} /> Refresh
            </button>

            <button onClick={() => setCreateDrawerVisible(true)} style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px',
              background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500,
              fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              <PlusOutlined style={{ fontSize: 14 }} /> Create Preset
            </button>
          </div>

          {/* Results summary */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#6b7280' }}>
            <span>
              Showing <strong style={{ color: '#1a1a1a' }}>{filteredPresets.length}</strong> of <strong style={{ color: '#1a1a1a' }}>{stepPresets?.length || 0}</strong> presets
              {searchText && <span style={{ color: '#4a90ff', marginLeft: 8 }}>(filtered)</span>}
            </span>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ecb71' }} /> Active: {filteredPresets.filter(p => p.isActive !== false).length}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9ca3af' }} /> Inactive: {filteredPresets.filter(p => p.isActive === false).length}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className='p-0'>
          {loading ? (
            <div className='text-center py-12'>
              <Spin size='large' />
            </div>
          ) : filteredPresets.length === 0 ? (
            <Card className='text-center py-16 border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white'>
              <div className='max-w-md mx-auto'>
                <div className='mb-6'>
                  <div className='w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <SettingOutlined className='text-4xl text-blue-500' />
                  </div>
                  <Title level={3} className='text-gray-700 mb-2'>
                    {searchText
                      ? 'No Presets Found'
                      : 'No Production Presets Yet'}
                  </Title>
                  <Text className='text-gray-500 text-lg block'>
                    {searchText
                      ? 'Try adjusting your search terms'
                      : 'Get started by creating your first workflow template'}
                  </Text>
                </div>

                {!searchText && (
                  <div className='space-y-4'>
                    <Button
                      type='primary'
                      icon={<PlusOutlined />}
                      onClick={() => setCreateDrawerVisible(true)}
                      size='large'
                      className='bg-gradient-to-r from-blue-500 to-purple-600 border-0 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                    >
                      Create Your First Preset
                    </Button>

                    <div className='mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100'>
                      <div className='flex items-start gap-3'>
                        <div className='w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                          <span className='text-white text-xs font-bold'>
                            !
                          </span>
                        </div>
                        <div className='text-left'>
                          <Text className='text-blue-700 font-medium block mb-1'>
                            Quick Start Guide
                          </Text>
                          <Text className='text-blue-600 text-sm'>
                            Create workflow templates by combining production
                            steps. Presets help standardize your production
                            processes and save time.
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {searchText && (
                  <div className='mt-6'>
                    <Button
                      onClick={() => {
                        setSearchText('')
                      }}
                      size='large'
                      className='shadow-sm hover:shadow-md transition-shadow duration-200'
                    >
                      Clear Search
                    </Button>
                  </div>
                )}
              </div>
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
            <div style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
              overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {['Preset', 'Steps', 'Active Plans', 'Status', 'Actions'].map((h, i) => (
                        <th key={h} style={{
                          background: '#f3f3f5', padding: '12px 16px',
                          textAlign: ['Steps', 'Active Plans', 'Status', 'Actions'].includes(h) ? 'center' : 'left',
                          fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14,
                          fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5',
                          whiteSpace: 'nowrap', lineHeight: '20px',
                          paddingLeft: i === 0 ? 32 : undefined,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPresets.map((record, idx) => (
                      <tr key={record.presetName} style={{ borderBottom: '1px solid #f3f4f6' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', paddingLeft: 32 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: 12,
                              background: record.isActive !== false ? '#4a90ff' : '#d9d9d9',
                              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: 16, flexShrink: 0,
                            }}>{record.stepCount || 0}</div>
                            <div>
                              <div style={{ fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>{record.presetName}</div>
                              <div style={{ fontSize: 12, color: '#9ca3af' }}>{record.presetDescription || 'No description'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <span style={{ background: '#d9fae6', color: '#15803d', fontWeight: 600, fontSize: 13, padding: '4px 10px', borderRadius: 1234 }}>{record.stepCount || 0}</span>
                        </td>
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', fontWeight: 500, color: (record.activeUsage || 0) > 0 ? '#15803d' : '#9ca3af' }}>
                          {record.activeUsage || 0}
                        </td>
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '5px 13px', borderRadius: 33554400, fontSize: 12,
                            fontWeight: 400, fontFamily: "'Inter', sans-serif", lineHeight: '16px', color: '#1a1a1a',
                            background: record.isActive !== false ? '#d9fae6' : '#f3f3f5',
                            border: `1px solid ${record.isActive !== false ? 'rgba(78,203,113,0.2)' : 'rgba(160,160,168,0.3)'}`,
                          }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: record.isActive !== false ? '#4ecb71' : '#9ca3af' }} />
                            {record.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <button onClick={() => handlePreviewPreset(record)} title="Preview" style={{ background: 'none', border: '1px solid #e5e5e5', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 14 }}><EyeOutlined /></button>
                            <button onClick={() => handleEditPreset(record)} title="Edit" style={{ background: 'none', border: '1px solid #e5e5e5', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 14 }}><EditOutlined /></button>
                            <button onClick={() => handleDuplicatePreset(record)} title="Duplicate" style={{ background: 'none', border: '1px solid #e5e5e5', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 14 }}><CopyOutlined /></button>
                            <Popconfirm title={`Delete "${record.presetName}"?`} onConfirm={() => handleDeletePreset(record.presetName)} okText="Delete" okType="danger">
                              <button title="Delete" style={{ background: 'none', border: '1px solid #e5e5e5', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626', fontSize: 14 }}><DeleteOutlined /></button>
                            </Popconfirm>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Drawer */}
        <Drawer
          title={
            <div className='flex items-center gap-3'>
              <Avatar
                icon={editDrawerVisible ? <EditOutlined /> : <PlusOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <span>
                {editDrawerVisible
                  ? `Edit Preset: ${selectedPreset?.presetName}`
                  : 'Create New Preset'}
              </span>
            </div>
          }
          placement='right'
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
                type='primary'
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
            layout='vertical'
            onFinish={
              editDrawerVisible ? handleUpdatePreset : handleCreatePreset
            }
          >
            <Row gutter={16}>
              <Col span={editDrawerVisible ? 12 : 24}>
                <Form.Item
                  name='name'
                  label='Preset Name'
                  rules={[
                    { required: true, message: 'Please enter preset name' },
                    {
                      min: 3,
                      max: 50,
                      message: 'Name must be 3-50 characters'
                    },
                    {
                      pattern: /^[a-zA-Z0-9\s\-_]+$/,
                      message:
                        'Only letters, numbers, spaces, hyphens, and underscores allowed'
                    }
                  ]}
                >
                  <Input
                    placeholder='Enter preset name'
                    disabled={editDrawerVisible}
                    prefix={<SettingOutlined />}
                  />
                </Form.Item>
              </Col>
              {editDrawerVisible && (
                <Col span={12}>
                  <Form.Item
                    name='isActive'
                    label='Status'
                    valuePropName='checked'
                    initialValue={true}
                  >
                    <Switch
                      checkedChildren='Active'
                      unCheckedChildren='Inactive'
                    />
                  </Form.Item>
                </Col>
              )}
            </Row>

            <Form.Item
              name='description'
              label='Description'
              rules={[{ max: 200, message: 'Maximum 200 characters' }]}
            >
              <TextArea
                rows={3}
                placeholder='Enter preset description (optional)'
                showCount
                maxLength={200}
              />
            </Form.Item>
          </Form>

          <Divider />

          {/* Step Builder Section */}
          <div>
            <div className='flex items-center justify-between mb-4'>
              <Title level={5}>
                <BranchesOutlined className='mr-2' />
                Workflow Steps
              </Title>
              <Tag color='blue'>{selectedSteps.length} / 20 steps</Tag>
            </div>

            {selectedSteps.length > 0 && (
              <Alert
                message={`Total Duration: ${calculateTotalDuration(
                  selectedSteps
                )}`}
                type='info'
                showIcon
                className='mb-4'
              />
            )}

            <Row gutter={16}>
              {/* Available Steps */}
              <Col span={10}>
                <Card
                  title='Available Steps'
                  size='small'
                  className='h-96 overflow-hidden'
                >
                  <div className='overflow-y-auto h-80'>
                    <List
                      dataSource={availableSteps.filter(
                        step =>
                          !selectedSteps.find(s => s.id === step.id?.toString())
                      )}
                      renderItem={step => (
                        <List.Item
                          className='hover:bg-gray-50 cursor-pointer transition-colors'
                          onClick={() => handleAddStep(step)}
                        >
                          <div className='flex items-center justify-between w-full'>
                            <div className='flex items-center gap-2'>
                              <span className='text-lg'>{step.icon}</span>
                              <Text>{step.stepName}</Text>
                            </div>
                            <Button
                              type='text'
                              icon={<PlusCircleOutlined />}
                              size='small'
                              onClick={e => {
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
                  title='Selected Steps (Drag to reorder)'
                  size='small'
                  className='h-96 overflow-hidden'
                >
                  {selectedSteps.length === 0 ? (
                    <Empty description='No steps selected' className='mt-16' />
                  ) : (
                    <div className='overflow-y-auto h-80'>
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId='selected-steps'>
                          {provided => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
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
                                      <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-3'>
                                          <div {...provided.dragHandleProps}>
                                            <DragOutlined className='text-gray-400 cursor-move' />
                                          </div>
                                          <Badge
                                            count={index + 1}
                                            style={{
                                              backgroundColor:
                                                STEP_COLORS[
                                                  index % STEP_COLORS.length
                                                ]
                                            }}
                                          />
                                          <span className='text-lg'>
                                            {step.icon}
                                          </span>
                                          <div>
                                            <Text strong>{step.stepName}</Text>
                                            <div className='flex items-center gap-2 mt-1'>
                                              <InputNumber
                                                size='small'
                                                min={1}
                                                max={999}
                                                value={
                                                  step.estimatedDuration || 2
                                                }
                                                onChange={value =>
                                                  handleUpdateStepDuration(
                                                    step.id,
                                                    value
                                                  )
                                                }
                                                style={{ width: 60 }}
                                              />
                                              <Select
                                                size='small'
                                                value={
                                                  step.estimatedDurationUnit ||
                                                  'hours'
                                                }
                                                onChange={value => {
                                                  setSelectedSteps(
                                                    selectedSteps.map(s =>
                                                      s.id === step.id
                                                        ? {
                                                            ...s,
                                                            estimatedDurationUnit:
                                                              value
                                                          }
                                                        : s
                                                    )
                                                  )
                                                }}
                                                style={{ width: 80 }}
                                              >
                                                <Option value='minutes'>
                                                  mins
                                                </Option>
                                                <Option value='hours'>
                                                  hrs
                                                </Option>
                                                <Option value='days'>
                                                  days
                                                </Option>
                                              </Select>
                                              <Switch
                                                size='small'
                                                checked={
                                                  step.isRequired !== false
                                                }
                                                onChange={() =>
                                                  handleToggleRequired(step.id)
                                                }
                                                checkedChildren='Required'
                                                unCheckedChildren='Optional'
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          type='text'
                                          icon={<MinusCircleOutlined />}
                                          size='small'
                                          danger
                                          onClick={() =>
                                            handleRemoveStep(step.id)
                                          }
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

        {/* Enhanced Preview Modal */}
        <Modal
          title={
            <div className='flex items-center gap-3'>
              <Avatar
                icon={<EyeOutlined />}
                style={{ backgroundColor: '#52c41a' }}
              />
              <div>
                <span className='text-lg font-medium'>
                  Preview: {selectedPreset?.presetName}
                </span>
                <div className='text-sm text-gray-500'>
                  {selectedPreset?.stepCount || 0} steps •{' '}
                  {calculateTotalDuration(presetDetails || [])}
                </div>
              </div>
            </div>
          }
          open={previewModalVisible}
          onCancel={() => {
            setPreviewModalVisible(false)
            setSelectedPreset(null)
            // Redux state will be cleared automatically when component unmounts or by other means
          }}
          width={800}
          footer={[
            <Button
              key='close'
              onClick={() => {
                setPreviewModalVisible(false)
                setSelectedPreset(null)
              }}
            >
              Close
            </Button>,
            <Button
              key='edit'
              type='primary'
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
          <div className='space-y-6'>
            {/* Basic Information */}
            <div className='bg-gray-50 p-4 rounded-lg'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl'>
                    {selectedPreset?.stepCount || 0}
                  </div>
                  <div>
                    <Title level={4} className='mb-1 text-gray-800'>
                      {selectedPreset?.presetName}
                    </Title>
                    <div className='flex items-center gap-2'>
                      <Tag
                        color={
                          selectedPreset?.isActive !== false
                            ? 'green'
                            : 'default'
                        }
                      >
                        {selectedPreset?.isActive !== false
                          ? 'ACTIVE'
                          : 'INACTIVE'}
                      </Tag>
                      <span className='text-sm text-gray-500'>
                        Created by: {selectedPreset?.createdBy || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {presetDetails && presetDetails.length > 0
                      ? calculateTotalDuration(presetDetails)
                      : 'Not available'}
                  </div>
                  <div className='text-xs text-gray-500'>Total Duration</div>
                </div>
              </div>

              {selectedPreset?.presetDescription && (
                <div className='mt-3 p-3 bg-white rounded border border-gray-200'>
                  <Text className='text-gray-700'>
                    {selectedPreset.presetDescription}
                  </Text>
                </div>
              )}

              {/* Debug information
              {process.env.NODE_ENV === 'development' && (
                <div className='mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded'>
                  <Text className='text-xs text-yellow-700'>
                    Debug: presetDetails length = {presetDetails?.length || 0},
                    stepCount = {selectedPreset?.stepCount || 0}, presetDetails
                    type = {typeof presetDetails}, presetDetails sample ={' '}
                    {JSON.stringify(presetDetails?.slice(0, 1))}
                  </Text>
                </div>
              )} */}
            </div>

            {/* Quick Stats */}
            <div className='grid grid-cols-3 gap-4'>
              <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                    <span className='text-blue-600'>📋</span>
                  </div>
                  <div>
                    <div className='text-xl font-bold text-blue-700'>
                      {presetDetails && presetDetails.length > 0
                        ? presetDetails.length
                        : selectedPreset?.stepCount || 0}
                    </div>
                    <div className='text-xs text-blue-600'>Total Steps</div>
                  </div>
                </div>
              </div>

              <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                    <span className='text-green-600'>⚡</span>
                  </div>
                  <div>
                    <div className='text-xl font-bold text-green-700'>
                      {presetDetails && presetDetails.length > 0
                        ? presetDetails.filter(
                            step => step.isRequired !== false
                          ).length
                        : 'N/A'}
                    </div>
                    <div className='text-xs text-green-600'>Required Steps</div>
                  </div>
                </div>
              </div>

              {/* <div className='bg-purple-50 p-4 rounded-lg border border-purple-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                    <span className='text-purple-600'>⏱️</span>
                  </div>
                  <div>
                    <div className='text-xl font-bold text-purple-700'>
                      {presetDetails && presetDetails.length > 0
                        ? presetDetails
                            .filter(
                              step => step.estimatedDurationUnit === 'hours'
                            )
                            .reduce(
                              (sum, step) =>
                                sum + (step.estimatedDuration || 0),
                              0
                            ) +
                          presetDetails
                            .filter(
                              step => step.estimatedDurationUnit === 'days'
                            )
                            .reduce(
                              (sum, step) =>
                                sum + (step.estimatedDuration || 0) * 24,
                              0
                            ) +
                          presetDetails
                            .filter(
                              step => step.estimatedDurationUnit === 'minutes'
                            )
                            .reduce(
                              (sum, step) =>
                                sum + (step.estimatedDuration || 0) / 60,
                              0
                            )
                        : 'N/A'}
                    </div>
                    <div className='text-xs text-purple-600'>Est. Hours</div>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Workflow Steps */}
            <div>
              <div className='flex items-center gap-3 mb-4'>
                <BranchesOutlined className='text-blue-500' />
                <Title level={5} className='mb-0'>
                  Workflow Steps
                </Title>
                <Tag color='blue'>{presetDetails?.length || 0} steps</Tag>
              </div>
              {/* Debug: console.log(presetDetails[0], 'PRESET DETAILS') */}

              {presetDetails && presetDetails.length > 0 ? (
                <Timeline mode='left' className='mt-4'>
                  {presetDetails.map((step, index) => {
                    const stepColor = STEP_COLORS[index % STEP_COLORS.length]
                    const stepIcon = STEP_ICONS[step.stepName] || '📝'

                    return (
                      <Timeline.Item
                        key={step.stepId || index}
                        color={stepColor}
                        dot={stepIcon}
                        className='p-3 mb-3'
                      >
                        <div className='font-semibold text-gray-800 text-base'>
                          {typeof step.stepName === 'string'
                            ? step.stepName
                            : `Step ${step.stepId || index}`}
                        </div>

                        <div className='flex gap-4 mt-2 text-sm text-gray-600'>
                          {step.estimatedDuration && (
                            <span className='flex items-center'>
                              <FieldTimeOutlined className='mr-1' />
                              {typeof step.estimatedDuration === 'object'
                                ? JSON.stringify(step.estimatedDuration)
                                : step.estimatedDuration}{' '}
                              {typeof step.estimatedDurationUnit === 'object'
                                ? JSON.stringify(step.estimatedDurationUnit)
                                : step.estimatedDurationUnit}
                            </span>
                          )}
                          <span className='flex items-center'>
                            <OrderedListOutlined className='mr-1' />
                            Order:{' '}
                            {typeof step.stepOrder === 'object'
                              ? JSON.stringify(step.stepOrder)
                              : step.stepOrder}
                          </span>
                        </div>

                        {step.isRequired && (
                          <div className='mt-2'>
                            <Tag color='red'>Required</Tag>
                          </div>
                        )}

                        {step.notes && (
                          <div className='mt-2 text-sm text-gray-500 italic'>
                            Notes:{' '}
                            {typeof step.notes === 'object'
                              ? JSON.stringify(step.notes)
                              : step.notes}
                          </div>
                        )}
                      </Timeline.Item>
                    )
                  })}
                </Timeline>
              ) : (
                <div className='text-center py-8 bg-gray-50 rounded-lg border border-gray-200'>
                  <div className='text-gray-500'>
                    <div className='text-4xl mb-2'>📝</div>
                    <div>No workflow steps configured</div>
                    <div className='text-sm mt-1'>
                      This preset doesn't have any steps defined yet.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default PresetManagement
