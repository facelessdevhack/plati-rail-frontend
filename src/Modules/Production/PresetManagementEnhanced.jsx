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
  Descriptions,
  Radio,
  Segmented,
  FloatButton,
  BackTop,
  Tour,
  Carousel,
  message,
  Skeleton
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
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  FireOutlined,
  RocketOutlined,
  StarOutlined,
  TrophyOutlined,
  DashboardOutlined,
  FilterOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
  BookOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  TeamOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  HeartOutlined,
  LikeOutlined,
  DislikeOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  UploadOutlined,
  SyncOutlined,
  LoadingOutlined
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

// Enhanced step icons with animations
const STEP_ICONS = {
  'Material Request': { icon: '📦', color: '#1890ff' },
  'Painting': { icon: '🎨', color: '#722ed1' },
  'Machining': { icon: '⚙️', color: '#fa8c16' },
  'PVD Powder Coating': { icon: '🔧', color: '#eb2f96' },
  'PVD Process': { icon: '⚡', color: '#13c2c2' },
  'Milling': { icon: '🏭', color: '#52c41a' },
  'Acrylic Coating': { icon: '💧', color: '#1890ff' },
  'Lacquer Finish': { icon: '✨', color: '#faad14' },
  'Packaging': { icon: '📋', color: '#8c8c8c' },
  'Quality Check': { icon: '🔍', color: '#f5222d' },
  'Dispatch': { icon: '🚚', color: '#fa541c' }
}

// Enhanced color palette
const PRESET_COLORS = {
  basic: { bg: '#e6f7ff', border: '#91d5ff', text: '#1890ff' },
  standard: { bg: '#f6ffed', border: '#b7eb8f', text: '#52c41a' },
  premium: { bg: '#f9f0ff', border: '#d3adf7', text: '#722ed1' },
  chrome: { bg: '#fff7e6', border: '#ffd591', text: '#fa8c16' },
  urgent: { bg: '#fff1f0', border: '#ffccc7', text: '#f5222d' },
  custom: { bg: '#e6fffb', border: '#87e8de', text: '#13c2c2' }
}

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

  // Enhanced states
  const [viewMode, setViewMode] = useState('grid') // 'grid', 'table', 'card', 'timeline'
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false)
  const [editDrawerVisible, setEditDrawerVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name') // 'name', 'created', 'usage', 'steps'
  const [sortOrder, setSortOrder] = useState('asc')
  const [showFavorites, setShowFavorites] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [animatingCards, setAnimatingCards] = useState(new Set())
  const [hoveredPreset, setHoveredPreset] = useState(null)

  // Step builder states
  const [selectedSteps, setSelectedSteps] = useState([])
  const [availableSteps, setAvailableSteps] = useState([])
  const [stepDurations, setStepDurations] = useState({})
  const [draggedStep, setDraggedStep] = useState(null)

  // Form instances
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  // Tour steps for onboarding
  const tourSteps = [
    {
      title: 'Welcome to Preset Management',
      description: 'Manage your production workflow presets efficiently with our enhanced interface.',
      target: () => document.querySelector('.preset-header'),
    },
    {
      title: 'Create New Presets',
      description: 'Click here to create custom production workflows with drag-and-drop step builder.',
      target: () => document.querySelector('.create-preset-btn'),
    },
    {
      title: 'View Statistics',
      description: 'See real-time statistics about your presets and their usage.',
      target: () => document.querySelector('.stats-section'),
    },
    {
      title: 'Filter and Search',
      description: 'Easily find presets using our advanced search and filtering options.',
      target: () => document.querySelector('.filter-section'),
    }
  ]

  // Load data on mount
  useEffect(() => {
    loadData()
    // Show tour for first-time users
    const hasSeenTour = localStorage.getItem('preset-tour-seen')
    if (!hasSeenTour) {
      setTimeout(() => setShowTour(true), 1000)
    }
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(getStepPresets()),
        dispatch(getProductionSteps())
      ])
    } catch (error) {
      message.error('Failed to load data')
    }
  }

  // Update available steps when production steps load
  useEffect(() => {
    if (productionSteps && productionSteps.length > 0) {
      setAvailableSteps(productionSteps.map(step => ({
        ...step,
        id: step.id?.toString(),
        ...STEP_ICONS[step.stepName]
      })))
    }
  }, [productionSteps])

  // Enhanced filtering and sorting
  const filteredAndSortedPresets = (stepPresets || [])
    .filter(preset => {
      const matchesSearch = preset.presetName?.toLowerCase().includes(searchText.toLowerCase()) ||
                            preset.presetDescription?.toLowerCase().includes(searchText.toLowerCase())
      const matchesCategory = filterCategory === 'all' || preset.category === filterCategory
      const matchesFavorites = !showFavorites || preset.isFavorite
      return matchesSearch && matchesCategory && matchesFavorites
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.presetName?.localeCompare(b.presetName) || 0
          break
        case 'usage':
          comparison = (b.activeUsage || 0) - (a.activeUsage || 0)
          break
        case 'steps':
          comparison = (b.stepCount || 0) - (a.stepCount || 0)
          break
        case 'created':
          comparison = new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          break
        default:
          comparison = 0
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Handle drag end with enhanced animations
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(selectedSteps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSelectedSteps(items)
    setDraggedStep(null)

    // Add animation feedback
    setAnimatingCards(new Set([reorderedItem.id]))
    setTimeout(() => {
      setAnimatingCards(new Set())
    }, 500)
  }

  // Enhanced step addition with animation
  const handleAddStep = (step) => {
    if (selectedSteps.length >= 20) {
      notification.warning({
        message: 'Step Limit Reached',
        description: 'Maximum 20 steps allowed per preset',
        icon: <InfoCircleOutlined style={{ color: '#fa8c16' }} />
      })
      return
    }

    if (!selectedSteps.find(s => s.id === step.id)) {
      const newStep = {
        ...step,
        stepOrder: selectedSteps.length + 1,
        estimatedDuration: stepDurations[step.id] || 2,
        estimatedDurationUnit: 'hours',
        isRequired: true
      }
      setSelectedSteps([...selectedSteps, newStep])

      // Animate the new step
      setAnimatingCards(new Set([step.id]))
      setTimeout(() => {
        setAnimatingCards(new Set())
      }, 300)

      message.success(`Added "${step.stepName}" to workflow`)
    }
  }

  // Remove step with animation
  const handleRemoveStep = (stepId) => {
    setAnimatingCards(new Set([stepId]))
    setTimeout(() => {
      setSelectedSteps(selectedSteps.filter(s => s.id !== stepId))
      setAnimatingCards(new Set())
    }, 200)
  }

  // Enhanced update step duration
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

  // Enhanced create preset with better feedback
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
        message: '✅ Preset Created Successfully',
        description: `"${values.name}" has been added to your preset library`,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 4
      })

      setCreateDrawerVisible(false)
      createForm.resetFields()
      setSelectedSteps([])
      loadData()
    } catch (error) {
      notification.error({
        message: '❌ Creation Failed',
        description: error?.message || 'Failed to create preset',
        icon: <InfoCircleOutlined style={{ color: '#f5222d' }} />
      })
    }
  }

  // Enhanced edit preset
  const handleEditPreset = async (preset) => {
    try {
      const details = await dispatch(getPresetDetails({
        presetName: preset.presetName
      })).unwrap()

      setSelectedPreset(preset)

      if (details && details.length > 0) {
        editForm.setFieldsValue({
          name: preset.presetName,
          description: preset.presetDescription,
          category: preset.category || 'standard',
          isActive: preset.isActive !== false
        })

        const steps = details.sort((a, b) => a.stepOrder - b.stepOrder)
          .map(step => ({
            id: step.stepId?.toString(),
            stepName: step.stepName,
            ...STEP_ICONS[step.stepName] || { icon: '⚡', color: '#1890ff' },
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
        message: '❌ Failed to Load Preset',
        description: 'Could not load preset details for editing',
        icon: <InfoCircleOutlined style={{ color: '#f5222d' }} />
      })
    }
  }

  // Enhanced update preset
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
        message: '✅ Preset Updated Successfully',
        description: `"${selectedPreset.presetName}" has been updated`,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 4
      })

      setEditDrawerVisible(false)
      editForm.resetFields()
      setSelectedSteps([])
      setSelectedPreset(null)
      loadData()
    } catch (error) {
      notification.error({
        message: '❌ Update Failed',
        description: error?.message || 'Failed to update preset',
        icon: <InfoCircleOutlined style={{ color: '#f5222d' }} />
      })
    }
  }

  // Enhanced delete preset
  const handleDeletePreset = async (presetName) => {
    try {
      const response = await dispatch(deleteStepPreset({ presetName })).unwrap()

      notification.success({
        message: '✅ Preset Deleted',
        description: `"${presetName}" has been removed from your preset library`,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
      })

      loadData()
    } catch (error) {
      if (error?.message?.includes('currently being used')) {
        notification.warning({
          message: '⚠️ Cannot Delete Active Preset',
          description: 'This preset is being used in active production plans and cannot be deleted.',
          icon: <InfoCircleOutlined style={{ color: '#fa8c16' }} />,
          duration: 6
        })
      } else {
        notification.error({
          message: '❌ Delete Failed',
          description: error?.message || 'Failed to delete preset',
          icon: <InfoCircleOutlined style={{ color: '#f5222d' }} />
        })
      }
    }
  }

  // Enhanced preview preset
  const handlePreviewPreset = async (preset) => {
    try {
      await dispatch(getPresetDetails({
        presetName: preset.presetName
      })).unwrap()
      setSelectedPreset(preset)
      setPreviewModalVisible(true)
    } catch (error) {
      notification.error({
        message: '❌ Preview Failed',
        description: 'Failed to load preset details for preview',
        icon: <InfoCircleOutlined style={{ color: '#f5222d' }} />
      })
    }
  }

  // Enhanced duplicate preset
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
            ...STEP_ICONS[step.stepName] || { icon: '⚡', color: '#1890ff' },
            stepOrder: step.stepOrder,
            isRequired: step.isRequired !== false,
            estimatedDuration: step.estimatedDuration || 2,
            estimatedDurationUnit: step.estimatedDurationUnit || 'hours',
            notes: step.notes || ''
          }))
        setSelectedSteps(steps)
        setCreateDrawerVisible(true)

        message.success(`Preset duplicated as "${preset.presetName}_copy"`)
      }
    } catch (error) {
      notification.error({
        message: '❌ Duplicate Failed',
        description: 'Failed to duplicate preset',
        icon: <InfoCircleOutlined style={{ color: '#f5222d' }} />
      })
    }
  }

  // Calculate total duration with enhanced formatting
  const calculateTotalDuration = (steps) => {
    const totalHours = steps.reduce((sum, step) => {
      const duration = step.estimatedDuration || 2
      const unit = step.estimatedDurationUnit || 'hours'
      const hoursMultiplier = unit === 'days' ? 24 : unit === 'minutes' ? 1/60 : 1
      return sum + (duration * hoursMultiplier)
    }, 0)

    if (totalHours >= 24) {
      const days = Math.floor(totalHours / 24)
      const hours = Math.round(totalHours % 24)
      return hours > 0 ? `${days}d ${hours}h` : `${days} days`
    }
    return `${Math.round(totalHours)}h`
  }

  // Enhanced preset card component with animations
  const PresetCard = ({ preset, index }) => {
    const isActive = preset.isActive !== false
    const category = preset.category || 'standard'
    const categoryColor = PRESET_COLORS[category] || PRESET_COLORS.standard
    const isHovered = hoveredPreset === preset.presetName
    const isAnimating = animatingCards.has(preset.presetName)

    return (
      <Card
        className={`preset-card hover:shadow-2xl transition-all duration-500 cursor-pointer h-full transform ${
          isHovered ? '-translate-y-2 scale-105' : ''
        } ${isAnimating ? 'animate-pulse' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${categoryColor.bg} 0%, #ffffff 100%)`,
          borderColor: categoryColor.border,
          borderWidth: 2,
          borderStyle: 'solid'
        }}
        onMouseEnter={() => setHoveredPreset(preset.presetName)}
        onMouseLeave={() => setHoveredPreset(null)}
        actions={[
          <Tooltip title="Preview Preset" key="preview">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: categoryColor.text }} />}
              onClick={() => handlePreviewPreset(preset)}
              className="hover:scale-110 transition-transform"
            />
          </Tooltip>,
          <Tooltip title="Edit Preset" key="edit">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: categoryColor.text }} />}
              onClick={() => handleEditPreset(preset)}
              className="hover:scale-110 transition-transform"
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
                  key="favorite"
                  icon={preset.isFavorite ? <HeartOutlined style={{ color: '#f5222d' }} /> : <HeartOutlined />}
                  onClick={() => {
                    // Toggle favorite logic here
                    message.success(preset.isFavorite ? 'Removed from favorites' : 'Added to favorites')
                  }}
                >
                  {preset.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key="delete"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Delete Preset',
                      content: `Are you sure you want to delete "${preset.presetName}"? This action cannot be undone.`,
                      okText: 'Delete',
                      okType: 'danger',
                      cancelText: 'Cancel',
                      onOk: () => handleDeletePreset(preset.presetName)
                    })
                  }}
                >
                  Delete
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
            key="more"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ color: categoryColor.text }} />}
              className="hover:scale-110 transition-transform"
            />
          </Dropdown>
        ]}
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <Title
              level={4}
              className="mb-0 font-bold"
              style={{ color: categoryColor.text }}
            >
              {preset.presetName}
            </Title>
            <Space size="small">
              <Tag
                color={categoryColor.text}
                style={{
                  background: categoryColor.bg,
                  borderColor: categoryColor.border,
                  fontWeight: 'bold'
                }}
              >
                {category.toUpperCase()}
              </Tag>
              {!isActive && (
                <Tag color="default">INACTIVE</Tag>
              )}
              {preset.isFavorite && (
                <HeartOutlined style={{ color: '#f5222d' }} />
              )}
            </Space>
          </div>

          <Paragraph
            ellipsis={{ rows: 2 }}
            className="text-gray-600 mb-4"
            style={{ minHeight: '40px' }}
          >
            {preset.presetDescription || 'No description available'}
          </Paragraph>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className="p-3 rounded-lg text-center transform hover:scale-105 transition-all"
              style={{ background: categoryColor.bg }}
            >
              <div className="text-2xl font-bold" style={{ color: categoryColor.text }}>
                {preset.stepCount || 0}
              </div>
              <div className="text-xs text-gray-600 font-medium">Steps</div>
            </div>
            <div
              className="p-3 rounded-lg text-center transform hover:scale-105 transition-all"
              style={{ background: '#f0f9ff' }}
            >
              <div className="text-2xl font-bold text-green-600">
                {preset.activeUsage || 0}
              </div>
              <div className="text-xs text-gray-600 font-medium">Active Plans</div>
            </div>
          </div>

          {/* Mini progress bar for visual appeal */}
          <div className="mt-4">
            <Progress
              percent={Math.min((preset.activeUsage || 0) * 20, 100)}
              showInfo={false}
              strokeColor={categoryColor.text}
              trailColor="#f0f0f0"
              height={4}
            />
            <div className="text-xs text-gray-500 mt-1">
              Usage: {preset.activeUsage || 0} active plans
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Enhanced timeline view component
  const TimelineView = ({ presets }) => (
    <Timeline mode="left" className="preset-timeline">
      {presets.map((preset, index) => {
        const category = preset.category || 'standard'
        const categoryColor = PRESET_COLORS[category] || PRESET_COLORS.standard

        return (
          <Timeline.Item
            key={preset.presetName}
            color={categoryColor.text}
            dot={
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: categoryColor.text }}
              >
                {preset.stepCount || 0}
              </div>
            }
          >
            <Card
              size="small"
              className="timeline-card hover:shadow-lg transition-all duration-300"
              style={{ borderColor: categoryColor.border }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Title level={5} className="mb-0">
                      {preset.presetName}
                    </Title>
                    <Tag
                      color={categoryColor.text}
                      style={{
                        background: categoryColor.bg,
                        borderColor: categoryColor.border
                      }}
                    >
                      {category.toUpperCase()}
                    </Tag>
                  </div>
                  <Text type="secondary" className="text-sm">
                    {preset.presetDescription || 'No description'}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Statistic
                    title="Active Plans"
                    value={preset.activeUsage || 0}
                    valueStyle={{ fontSize: '16px' }}
                  />
                  <Space>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreviewPreset(preset)}
                    />
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEditPreset(preset)}
                    />
                  </Space>
                </div>
              </div>
            </Card>
          </Timeline.Item>
        )
      })}
    </Timeline>
  )

  // Enhanced table columns
  const columns = [
    {
      title: 'Preset',
      key: 'preset',
      fixed: 'left',
      width: 300,
      sorter: true,
      render: (_, record) => (
        <div className="py-2">
          <div className="flex items-center gap-3">
            <Avatar
              size={48}
              style={{
                backgroundColor: record.isActive !== false ? '#1890ff' : '#d9d9d9',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            >
              {record.stepCount || 0}
            </Avatar>
            <div className="flex-1">
              <div className="font-medium text-base flex items-center gap-2">
                {record.presetName}
                {record.isFavorite && <HeartOutlined style={{ color: '#f5222d' }} />}
              </div>
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
      filters: [
        { text: 'Basic', value: 'basic' },
        { text: 'Standard', value: 'standard' },
        { text: 'Premium', value: 'premium' },
        { text: 'Chrome', value: 'chrome' },
        { text: 'Urgent', value: 'urgent' },
        { text: 'Custom', value: 'custom' }
      ],
      onFilter: (value, record) => record.category === value,
      render: (category) => {
        const categoryColor = PRESET_COLORS[category] || PRESET_COLORS.standard
        return (
          <Tag
            color={categoryColor.text}
            style={{
              background: categoryColor.bg,
              borderColor: categoryColor.border,
              fontWeight: 'bold'
            }}
          >
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
      sorter: (a, b) => (a.stepCount || 0) - (b.stepCount || 0),
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
      sorter: (a, b) => (a.activeUsage || 0) - (b.activeUsage || 0),
      render: (count) => (
        <div className={count > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
          <div className="text-lg font-bold">{count || 0}</div>
          <div className="text-xs">active</div>
        </div>
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
              className="hover:scale-110 transition-transform"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditPreset(record)}
              className="hover:scale-110 transition-transform"
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicatePreset(record)}
              className="hover:scale-110 transition-transform"
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
                className="hover:scale-110 transition-transform"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Enhanced Header Section */}
        <div className="preset-header bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-8 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 right-20 w-24 h-24 bg-white rounded-full animate-bounce"></div>
            <div className="absolute top-20 right-40 w-16 h-16 bg-white rounded-full animate-ping"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <Avatar
                    size={64}
                    icon={<SettingOutlined />}
                    className="bg-white/20 backdrop-blur-sm"
                  />
                  <div>
                    <Title level={2} className="text-white mb-2 font-bold">
                      Production Step Presets
                    </Title>
                    <Text className="text-white/90 text-lg">
                      Manage and customize workflow templates for production plans
                    </Text>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <ThunderboltOutlined className="text-yellow-300" />
                    <Text className="text-white/80">
                      {stepPresets?.length || 0} total presets
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlayCircleOutlined className="text-green-300" />
                    <Text className="text-white/80">
                      {stepPresets?.filter(p => p.isActive !== false).length || 0} active
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <TeamOutlined className="text-blue-300" />
                    <Text className="text-white/80">
                      {stepPresets?.reduce((sum, p) => sum + (p.activeUsage || 0), 0) || 0} total usage
                    </Text>
                  </div>
                </div>
              </div>

              <div className="text-center stats-section">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <Statistic
                    title={<span className="text-white/80 font-medium">Total Presets</span>}
                    value={stepPresets?.length || 0}
                    valueStyle={{ color: '#fff', fontSize: '42px', fontWeight: 'bold' }}
                    prefix={<DashboardOutlined />}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Controls Section */}
        <div className="bg-white shadow-lg border-b sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex items-center gap-4 flex-1 filter-section">
                <div className="relative">
                  <Input.Search
                    placeholder="Search presets by name or description..."
                    allowClear
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 320 }}
                    prefix={<SearchOutlined className="text-gray-400" />}
                    size="large"
                    className="search-input"
                  />
                </div>

                <Select
                  value={filterCategory}
                  onChange={setFilterCategory}
                  style={{ width: 150 }}
                  size="large"
                  placeholder="Category"
                >
                  <Option value="all">All Categories</Option>
                  <Option value="basic">Basic</Option>
                  <Option value="standard">Standard</Option>
                  <Option value="premium">Premium</Option>
                  <Option value="chrome">Chrome</Option>
                  <Option value="urgent">Urgent</Option>
                  <Option value="custom">Custom</Option>
                </Select>

                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 140 }}
                  size="large"
                  placeholder="Sort by"
                >
                  <Option value="name">Name</Option>
                  <Option value="usage">Usage</Option>
                  <Option value="steps">Steps</Option>
                  <Option value="created">Created</Option>
                </Select>

                <Button
                  icon={sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  size="large"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checkedChildren={<HeartOutlined />}
                  unCheckedChildren={<HeartOutlined />}
                  checked={showFavorites}
                  onChange={setShowFavorites}
                  title="Show favorites only"
                />

                <Segmented
                  options={[
                    { label: 'Grid', value: 'grid', icon: <AppstoreOutlined /> },
                    { label: 'Table', value: 'table', icon: <BarsOutlined /> },
                    { label: 'Timeline', value: 'timeline', icon: <ClockCircleOutlined /> }
                  ]}
                  value={viewMode}
                  onChange={setViewMode}
                />

                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadData}
                  loading={loading}
                  size="large"
                  className="hover:scale-105 transition-transform"
                >
                  Refresh
                </Button>

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateDrawerVisible(true)}
                  size="large"
                  className="create-preset-btn bg-gradient-to-r from-blue-500 to-purple-500 border-0 hover:from-blue-600 hover:to-purple-600 hover:scale-105 transition-all shadow-lg"
                >
                  Create Preset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content Section */}
        <div className="max-w-7xl mx-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <Spin size="large" />
              <div className="mt-4 text-gray-500">Loading presets...</div>
            </div>
          ) : filteredAndSortedPresets.length === 0 ? (
            <Card className="text-center py-16">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Title level={4} className="text-gray-500">
                      {searchText || filterCategory !== 'all' || showFavorites
                        ? 'No presets found matching your criteria'
                        : 'No presets created yet'}
                    </Title>
                    <Text className="text-gray-400">
                      {searchText || filterCategory !== 'all' || showFavorites
                        ? 'Try adjusting your search terms or filters'
                        : 'Create your first production preset to get started'}
                    </Text>
                    {!searchText && filterCategory === 'all' && !showFavorites && (
                      <div className="mt-6">
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          size="large"
                          onClick={() => setCreateDrawerVisible(true)}
                          className="hover:scale-105 transition-transform"
                        >
                          Create Your First Preset
                        </Button>
                      </div>
                    )}
                  </div>
                }
              />
            </Card>
          ) : (
            <>
              {/* View mode rendering */}
              {viewMode === 'grid' && (
                <Row gutter={[20, 20]}>
                  {filteredAndSortedPresets.map((preset, index) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={preset.presetName}>
                      <div style={{ animationDelay: `${index * 100}ms` }}>
                        <PresetCard preset={preset} index={index} />
                      </div>
                    </Col>
                  ))}
                </Row>
              )}

              {viewMode === 'table' && (
                <Card className="shadow-lg">
                  <Table
                    columns={columns}
                    dataSource={filteredAndSortedPresets}
                    rowKey="presetName"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} presets`,
                      className: "pagination-styled"
                    }}
                    scroll={{ x: 1200 }}
                    className="preset-table"
                  />
                </Card>
              )}

              {viewMode === 'timeline' && (
                <Card className="shadow-lg p-6">
                  <TimelineView presets={filteredAndSortedPresets} />
                </Card>
              )}
            </>
          )}
        </div>

        {/* Enhanced Create/Edit Drawer */}
        <Drawer
          title={
            <div className="flex items-center gap-3">
              <Avatar
                icon={editDrawerVisible ? <EditOutlined /> : <PlusOutlined />}
                style={{ backgroundColor: '#1890ff' }}
                size="large"
              />
              <div>
                <Title level={4} className="mb-0">
                  {editDrawerVisible ? `Edit Preset: ${selectedPreset?.presetName}` : 'Create New Preset'}
                </Title>
                <Text type="secondary" className="text-sm">
                  Build your custom production workflow
                </Text>
              </div>
            </div>
          }
          placement="right"
          width={900}
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
                className="bg-gradient-to-r from-blue-500 to-purple-500 border-0"
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
                  label={
                    <span className="flex items-center gap-2">
                      <SettingOutlined />
                      Preset Name
                    </span>
                  }
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
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={editDrawerVisible ? 12 : 12}>
                <Form.Item
                  name="category"
                  label={
                    <span className="flex items-center gap-2">
                      <AppstoreOutlined />
                      Category
                    </span>
                  }
                  rules={[{ required: true, message: 'Please select category' }]}
                  initialValue="standard"
                >
                  <Select placeholder="Select category" size="large">
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
                    label={
                      <span className="flex items-center gap-2">
                        <PoweroffOutlined />
                        Status
                      </span>
                    }
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              )}
            </Row>

            <Form.Item
              name="description"
              label={
                <span className="flex items-center gap-2">
                  <FileTextOutlined />
                  Description
                </span>
              }
              rules={[{ max: 200, message: 'Maximum 200 characters' }]}
            >
              <TextArea
                rows={3}
                placeholder="Enter preset description (optional)"
                showCount
                maxLength={200}
                size="large"
              />
            </Form.Item>
          </Form>

          <Divider />

          {/* Enhanced Step Builder Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Title level={5} className="flex items-center gap-2 mb-0">
                <BranchesOutlined />
                Workflow Steps Builder
              </Title>
              <div className="flex items-center gap-3">
                <Tag color="blue" className="text-sm">
                  {selectedSteps.length} / 20 steps
                </Tag>
                {selectedSteps.length > 0 && (
                  <Alert
                    message={`Total Duration: ${calculateTotalDuration(selectedSteps)}`}
                    type="info"
                    showIcon
                    className="mb-0"
                  />
                )}
              </div>
            </div>

            <Row gutter={16}>
              {/* Available Steps */}
              <Col span={10}>
                <Card
                  title={
                    <span className="flex items-center gap-2">
                      <DashboardOutlined />
                      Available Steps
                    </span>
                  }
                  size="small"
                  className="h-96 overflow-hidden shadow-sm"
                >
                  <div className="overflow-y-auto h-80">
                    <List
                      dataSource={availableSteps.filter(step =>
                        !selectedSteps.find(s => s.id === step.id?.toString())
                      )}
                      renderItem={step => (
                        <List.Item
                          className="hover:bg-blue-50 cursor-pointer transition-all duration-200 rounded-lg p-2"
                          onClick={() => handleAddStep(step)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <span className="text-xl" style={{ color: step.color }}>
                                {step.icon}
                              </span>
                              <div>
                                <Text strong>{step.stepName}</Text>
                                <div className="text-xs text-gray-500">
                                  Click to add to workflow
                                </div>
                              </div>
                            </div>
                            <Button
                              type="text"
                              icon={<PlusCircleOutlined />}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddStep(step)
                              }}
                              className="hover:scale-110 transition-transform"
                            />
                          </div>
                        </List.Item>
                      )}
                      locale={{ emptyText: 'All steps added' }}
                    />
                  </div>
                </Card>
              </Col>

              {/* Selected Steps with Enhanced Drag & Drop */}
              <Col span={14}>
                <Card
                  title={
                    <span className="flex items-center gap-2">
                      <ThunderboltOutlined />
                      Selected Steps (Drag to reorder)
                    </span>
                  }
                  size="small"
                  className="h-96 overflow-hidden shadow-sm"
                >
                  {selectedSteps.length === 0 ? (
                    <Empty
                      description="No steps selected"
                      className="mt-16"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
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
                                      className={`mb-3 p-4 bg-white border-2 rounded-xl transition-all duration-300 ${
                                        snapshot.isDragging
                                          ? 'shadow-xl scale-105 rotate-2'
                                          : 'hover:shadow-lg'
                                      } ${animatingCards.has(step.id) ? 'animate-pulse' : ''}`}
                                      style={{
                                        ...provided.draggableProps.style,
                                        borderColor: step.color,
                                        borderStyle: 'solid'
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div {...provided.dragHandleProps}>
                                            <DragOutlined className="text-gray-400 cursor-move hover:text-gray-600 transition-colors" />
                                          </div>
                                          <Badge
                                            count={index + 1}
                                            style={{
                                              backgroundColor: step.color,
                                              fontSize: '12px',
                                              fontWeight: 'bold'
                                            }}
                                          />
                                          <span className="text-2xl" style={{ color: step.color }}>
                                            {step.icon}
                                          </span>
                                          <div className="flex-1">
                                            <Text strong className="text-base">
                                              {step.stepName}
                                            </Text>
                                            <div className="flex items-center gap-3 mt-2">
                                              <InputNumber
                                                size="small"
                                                min={1}
                                                max={999}
                                                value={step.estimatedDuration || 2}
                                                onChange={(value) => handleUpdateStepDuration(step.id, value)}
                                                style={{ width: 70 }}
                                                placeholder="Duration"
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
                                                style={{ width: 85 }}
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
                                          className="hover:scale-110 transition-transform"
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
            <div className="flex items-center gap-3">
              <Avatar
                icon={<EyeOutlined />}
                style={{ backgroundColor: '#52c41a' }}
                size="large"
              />
              <div>
                <Title level={4} className="mb-0">
                  Preview: {selectedPreset?.presetName}
                </Title>
                <Text type="secondary" className="text-sm">
                  Complete workflow visualization
                </Text>
              </div>
            </div>
          }
          open={previewModalVisible}
          onCancel={() => {
            setPreviewModalVisible(false)
            setSelectedPreset(null)
          }}
          width={800}
          footer={[
            <Button
              key="close"
              onClick={() => setPreviewModalVisible(false)}
              size="large"
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
              size="large"
              className="bg-gradient-to-r from-blue-500 to-purple-500 border-0"
            >
              Edit Preset
            </Button>
          ]}
        >
          {presetDetails && presetDetails.length > 0 && (
            <div>
              <div className="mb-6">
                <Descriptions column={2} bordered size="small" className="preview-descriptions">
                  <Descriptions.Item label="Preset Name">
                    <Text strong>{selectedPreset?.presetName}</Text>
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
                    <Badge count={presetDetails.length} style={{ backgroundColor: '#52c41a' }} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Est. Duration">
                    <Text strong className="text-green-600">
                      {calculateTotalDuration(presetDetails)}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <Divider>Production Workflow Timeline</Divider>

              <Timeline mode="left" className="preview-timeline">
                {presetDetails
                  .sort((a, b) => a.stepOrder - b.stepOrder)
                  .map((step, index) => {
                    const stepIcon = STEP_ICONS[step.stepName] || { icon: '⚡', color: '#1890ff' }
                    return (
                      <Timeline.Item
                        key={step.id}
                        color={stepIcon.color}
                        dot={
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
                            style={{ backgroundColor: stepIcon.color }}
                          >
                            <span className="text-sm font-bold">
                              {step.stepOrder}
                            </span>
                          </div>
                        }
                        label={
                          <div className="text-sm text-gray-500">
                            Step {step.stepOrder}
                          </div>
                        }
                      >
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-100 hover:border-blue-200 transition-colors">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">
                              {stepIcon.icon}
                            </span>
                            <Text strong className="text-lg">
                              {step.stepName}
                            </Text>
                          </div>
                          <div className="flex items-center gap-3">
                            <Tag color="cyan">
                              <ClockCircleOutlined />
                              {step.estimatedDuration || 2} {step.estimatedDurationUnit || 'hours'}
                            </Tag>
                            {step.isRequired !== false ? (
                              <Tag color="green">
                                <CheckCircleOutlined />
                                Required
                              </Tag>
                            ) : (
                              <Tag color="default">
                                <InfoCircleOutlined />
                                Optional
                              </Tag>
                            )}
                          </div>
                          {step.notes && (
                            <Text type="secondary" className="text-xs mt-2 block">
                              <BookOutlined className="mr-1" />
                              {step.notes}
                            </Text>
                          )}
                        </div>
                      </Timeline.Item>
                    )
                  })}
              </Timeline>
            </div>
          )}
        </Modal>

        {/* Interactive Tour */}
        <Tour
          steps={tourSteps}
          open={showTour}
          onClose={() => {
            setShowTour(false)
            localStorage.setItem('preset-tour-seen', 'true')
          }}
        />

        {/* Floating Action Buttons */}
        <FloatButton.Group
          trigger="hover"
          type="primary"
          style={{ right: 24 }}
          icon={<QuestionCircleOutlined />}
        >
          <FloatButton
            icon={<BulbOutlined />}
            tooltip="Show Tour"
            onClick={() => setShowTour(true)}
          />
          <FloatButton
            icon={<BookOutlined />}
            tooltip="View Documentation"
            onClick={() => message.info('Documentation coming soon!')}
          />
          <FloatButton.BackTop visibilityHeight={300} />
        </FloatButton.Group>
      </div>
    </Layout>
  )
}

export default PresetManagement