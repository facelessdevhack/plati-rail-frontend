import React, { useEffect, useState } from 'react'
import {
  Modal,
  List,
  Button,
  Input,
  Space,
  Card,
  Divider,
  Typography,
  notification,
  Empty,
  Spin,
  Avatar,
  Tag,
  Progress,
  Tooltip,
  Badge,
  Row,
  Col,
  Statistic,
  Timeline,
  Alert,
  Descriptions,
  Segmented,
  Switch,
  Rate,
  Skeleton,
  message,
  Drawer,
  BackTop
} from 'antd'
import {
  SettingOutlined,
  SearchOutlined,
  CheckOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  StarOutlined,
  StarFilled,
  FireOutlined,
  TrophyOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  HeartOutlined,
  HeartFilled,
  BookOutlined,
  BulbOutlined,
  DashboardOutlined,
  TeamOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  LikeOutlined,
  DislikeOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  UploadOutlined,
  SyncOutlined,
  LoadingOutlined,
  WarningOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { getStepPresets, getPresetDetails, assignPresetToPlan } from '../../redux/api/productionAPI'
import moment from 'moment'

const { Title, Text, Paragraph } = Typography
const { Search } = Input

// Enhanced step icons with animations
const STEP_ICONS = {
  'Material Request': { icon: '📦', color: '#1890ff', name: 'Material Request' },
  'Painting': { icon: '🎨', color: '#722ed1', name: 'Painting' },
  'Machining': { icon: '⚙️', color: '#fa8c16', name: 'Machining' },
  'PVD Powder Coating': { icon: '🔧', color: '#eb2f96', name: 'PVD Powder Coating' },
  'PVD Process': { icon: '⚡', color: '#13c2c2', name: 'PVD Process' },
  'Milling': { icon: '🏭', color: '#52c41a', name: 'Milling' },
  'Acrylic Coating': { icon: '💧', color: '#1890ff', name: 'Acrylic Coating' },
  'Lacquer Finish': { icon: '✨', color: '#faad14', name: 'Lacquer Finish' },
  'Packaging': { icon: '📋', color: '#8c8c8c', name: 'Packaging' },
  'Quality Check': { icon: '🔍', color: '#f5222d', name: 'Quality Check' },
  'Dispatch': { icon: '🚚', color: '#fa541c', name: 'Dispatch' }
}

// Enhanced category colors
const CATEGORY_COLORS = {
  basic: { bg: '#e6f7ff', border: '#91d5ff', text: '#1890ff', icon: '📝' },
  standard: { bg: '#f6ffed', border: '#b7eb8f', text: '#52c41a', icon: '⭐' },
  premium: { bg: '#f9f0ff', border: '#d3adf7', text: '#722ed1', icon: '💎' },
  chrome: { bg: '#fff7e6', border: '#ffd591', text: '#fa8c16', icon: '🔶' },
  urgent: { bg: '#fff1f0', border: '#ffccc7', text: '#f5222d', icon: '🚨' },
  custom: { bg: '#e6fffb', border: '#87e8de', text: '#13c2c2', icon: '🎯' }
}

const AssignPresetModal = ({
  visible,
  onClose,
  planData,
  onSuccess
}) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewPreset, setPreviewPreset] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid', 'list', 'timeline'
  const [sortBy, setSortBy] = useState('name') // 'name', 'usage', 'steps', 'rating'
  const [filterCategory, setFilterCategory] = useState('all')
  const [showFavorites, setShowFavorites] = useState(false)
  const [hoveredPreset, setHoveredPreset] = useState(null)
  const [animatingCards, setAnimatingCards] = useState(new Set())

  // Redux state
  const { stepPresets, presetDetails } = useSelector(state => state.productionDetails)
  const { user } = useSelector(state => state.userDetails)

  // Load presets when modal opens
  useEffect(() => {
    if (visible) {
      dispatch(getStepPresets())
      // Reset search and filters when modal opens
      setSearchTerm('')
      setFilterCategory('all')
      setShowFavorites(false)
      setViewMode('grid')
      setSortBy('name')
    }
  }, [visible, dispatch])

  // Enhanced filter presets
  const filteredPresets = (stepPresets || [])
    .filter(preset => {
      const matchesSearch = preset.presetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            preset.presetDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || preset.category === filterCategory
      const matchesFavorites = !showFavorites || preset.isFavorite
      const isActive = preset.isActive !== false

      return matchesSearch && matchesCategory && matchesFavorites && isActive
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.presetName?.localeCompare(b.presetName) || 0
        case 'usage':
          return (b.activeUsage || 0) - (a.activeUsage || 0)
        case 'steps':
          return (b.stepCount || 0) - (a.stepCount || 0)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        default:
          return 0
      }
    })

  // Handle preset preview with enhanced feedback
  const handlePreviewPreset = async (presetName) => {
    try {
      setLoading(true)
      await dispatch(getPresetDetails({ presetName })).unwrap()
      setPreviewPreset(presetName)
      setPreviewVisible(true)
      message.success(`Loaded preview for "${presetName}"`)
    } catch (error) {
      notification.error({
        message: '❌ Preview Failed',
        description: 'Failed to load preset details for preview',
        icon: <InfoCircleOutlined style={{ color: '#f5222d' }} />
      })
    } finally {
      setLoading(false)
    }
  }

  // Enhanced preset assignment with better feedback
  const handleAssignPreset = async () => {
    if (!selectedPreset) {
      notification.warning({
        message: '⚠️ No Preset Selected',
        description: 'Please select a preset to assign to this production plan.',
        icon: <InfoCircleOutlined style={{ color: '#fa8c16' }} />
      })
      return
    }

    try {
      setLoading(true)

      await dispatch(assignPresetToPlan({
        planId: planData.id,
        presetName: selectedPreset
      })).unwrap()

      // Success notification with enhanced details
      notification.success({
        message: '✅ Preset Assigned Successfully',
        description: (
          <div>
            <div>"{selectedPreset}" has been assigned to production plan #{planData?.id}</div>
            <div className="text-sm mt-1">
              <ClockCircleOutlined className="mr-1" />
              Assigned at {moment().format('HH:mm:ss')}
            </div>
          </div>
        ),
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 5
      })

      setSelectedPreset(null)
      setSearchTerm('')
      onSuccess?.()
      onClose()
    } catch (error) {
      notification.error({
        message: '❌ Assignment Failed',
        description: error?.message || 'Failed to assign preset to production plan',
        icon: <InfoCircleOutlined style={{ color: '#f5222d' }} />
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle modal close with confirmation if needed
  const handleClose = () => {
    if (selectedPreset) {
      Modal.confirm({
        title: 'Discard Selection?',
        content: `You have selected "${selectedPreset}" but haven't assigned it yet. Are you sure you want to close?`,
        okText: 'Yes, Close',
        cancelText: 'Cancel',
        onOk: () => {
          setSelectedPreset(null)
          setSearchTerm('')
          setPreviewVisible(false)
          setPreviewPreset(null)
          onClose()
        }
      })
    } else {
      setSelectedPreset(null)
      setSearchTerm('')
      setPreviewVisible(false)
      setPreviewPreset(null)
      onClose()
    }
  }

  // Enhanced preset selection with animation
  const handleSelectPreset = (presetName) => {
    setAnimatingCards(new Set([presetName]))
    setTimeout(() => {
      setSelectedPreset(presetName)
      setAnimatingCards(new Set())
    }, 200)

    message.success(`Selected "${presetName}"`, 1)
  }

  // Calculate preset metrics
  const calculatePresetMetrics = (preset) => {
    const totalDuration = presetDetails?.reduce((sum, step) => {
      const duration = step.estimatedDuration || 2
      const unit = step.estimatedDurationUnit || 'hours'
      const hoursMultiplier = unit === 'days' ? 24 : unit === 'minutes' ? 1/60 : 1
      return sum + (duration * hoursMultiplier)
    }, 0) || 0

    return {
      totalSteps: presetDetails?.length || preset.stepCount || 0,
      totalDuration,
      requiredSteps: presetDetails?.filter(step => step.isRequired !== false).length || 0,
      estimatedDays: Math.ceil(totalDuration / 8) // Assuming 8 hours work day
    }
  }

  // Enhanced preset card component
  const PresetCard = ({ preset }) => {
    const isSelected = selectedPreset === preset.presetName
    const isHovered = hoveredPreset === preset.presetName
    const isAnimating = animatingCards.has(preset.presetName)
    const category = preset.category || 'standard'
    const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.standard
    const metrics = calculatePresetMetrics(preset)

    return (
      <Card
        className={`preset-card cursor-pointer transition-all duration-300 transform ${
          isHovered ? '-translate-y-2 scale-105 shadow-2xl' : 'shadow-lg hover:shadow-xl'
        } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
          isAnimating ? 'animate-pulse' : ''
        }`}
        style={{
          background: isSelected
            ? `linear-gradient(135deg, #e6f7ff 0%, ${categoryColor.bg} 100%)`
            : `linear-gradient(135deg, #ffffff 0%, ${categoryColor.bg} 100%)`,
          borderColor: isSelected ? '#1890ff' : categoryColor.border,
          borderWidth: 2
        }}
        onMouseEnter={() => setHoveredPreset(preset.presetName)}
        onMouseLeave={() => setHoveredPreset(null)}
        onClick={() => handleSelectPreset(preset.presetName)}
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryColor.icon}</span>
              <Title level={5} className="mb-0 font-bold" style={{ color: categoryColor.text }}>
                {preset.presetName}
              </Title>
            </div>
            <div className="flex items-center gap-1">
              {isSelected && (
                <CheckCircleOutlined className="text-green-500 text-lg animate-bounce" />
              )}
              {preset.isFavorite && (
                <HeartFilled style={{ color: '#f5222d' }} />
              )}
            </div>
          </div>

          <Paragraph
            ellipsis={{ rows: 2 }}
            className="text-gray-600 mb-4"
            style={{ minHeight: '40px' }}
          >
            {preset.presetDescription || 'No description available'}
          </Paragraph>

          {/* Enhanced metrics display */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className="p-3 rounded-lg text-center"
              style={{ background: categoryColor.bg }}
            >
              <div className="text-xl font-bold" style={{ color: categoryColor.text }}>
                {metrics.totalSteps}
              </div>
              <div className="text-xs text-gray-600">Steps</div>
            </div>
            <div
              className="p-3 rounded-lg text-center"
              style={{ background: '#f0f9ff' }}
            >
              <div className="text-xl font-bold text-green-600">
                {metrics.estimatedDays}
              </div>
              <div className="text-xs text-gray-600">Days</div>
            </div>
          </div>

          {/* Visual indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Usage:</span>
              <span className="font-medium text-blue-600">
                {preset.activeUsage || 0} active plans
              </span>
            </div>

            <Progress
              percent={Math.min((preset.activeUsage || 0) * 25, 100)}
              showInfo={false}
              strokeColor={categoryColor.text}
              trailColor="#f0f0f0"
              height={3}
            />

            {/* Rating */}
            {preset.rating && (
              <div className="flex items-center gap-1">
                <Rate
                  disabled
                  defaultValue={preset.rating}
                  style={{ fontSize: '12px' }}
                />
                <span className="text-xs text-gray-500">
                  ({preset.reviewCount || 0} reviews)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Tag
              color={categoryColor.text}
              style={{
                background: categoryColor.bg,
                borderColor: categoryColor.border,
                fontSize: '10px',
                fontWeight: 'bold'
              }}
            >
              {category.toUpperCase()}
            </Tag>
            {metrics.requiredSteps > 0 && (
              <Tag color="green" style={{ fontSize: '10px' }}>
                {metrics.requiredSteps} required
              </Tag>
            )}
          </div>

          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handlePreviewPreset(preset.presetName)
            }}
            className="hover:scale-110 transition-transform"
          />
        </div>
      </Card>
    )
  }

  // Enhanced list view component
  const PresetListItem = ({ preset }) => {
    const isSelected = selectedPreset === preset.presetName
    const category = preset.category || 'standard'
    const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.standard
    const metrics = calculatePresetMetrics(preset)

    return (
      <List.Item
        className={`preset-list-item cursor-pointer transition-all duration-300 rounded-lg p-4 ${
          isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50 border-2 border-transparent'
        }`}
        onClick={() => handleSelectPreset(preset.presetName)}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3">
              <Avatar
                size={48}
                style={{
                  backgroundColor: categoryColor.text,
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}
              >
                {categoryColor.icon}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Text strong className="text-lg">
                    {preset.presetName}
                  </Text>
                  {isSelected && (
                    <CheckCircleOutlined className="text-green-500" />
                  )}
                  {preset.isFavorite && (
                    <HeartFilled style={{ color: '#f5222d' }} />
                  )}
                </div>
                <Text type="secondary" className="text-sm">
                  {preset.presetDescription || 'No description available'}
                </Text>
                <div className="flex items-center gap-3 mt-2">
                  <Tag
                    color={categoryColor.text}
                    style={{
                      background: categoryColor.bg,
                      borderColor: categoryColor.border
                    }}
                  >
                    {category.toUpperCase()}
                  </Tag>
                  <span className="text-xs text-gray-500">
                    {metrics.totalSteps} steps • {metrics.estimatedDays} days
                  </span>
                  <span className="text-xs text-blue-600">
                    {preset.activeUsage || 0} active plans
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handlePreviewPreset(preset.presetName)
              }}
              className="hover:scale-110 transition-transform"
            />
            {preset.rating && (
              <div className="text-right">
                <Rate
                  disabled
                  defaultValue={preset.rating}
                  style={{ fontSize: '14px' }}
                />
                <div className="text-xs text-gray-500">
                  ({preset.reviewCount || 0})
                </div>
              </div>
            )}
          </div>
        </div>
      </List.Item>
    )
  }

  return (
    <>
      <Modal
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                icon={<SettingOutlined />}
                style={{ backgroundColor: '#1890ff' }}
                size="large"
              />
              <div>
                <Title level={4} className="mb-0">
                  Assign Preset to Plan #{planData?.id}
                </Title>
                <Text type="secondary" className="text-sm">
                  Choose a workflow template for this production plan
                </Text>
              </div>
            </div>
            <div className="text-right">
              <Text type="secondary" className="text-xs">
                Plan ID: {planData?.id}
              </Text>
            </div>
          </div>
        }
        open={visible}
        onCancel={handleClose}
        width={900}
        footer={[
          <Button key="cancel" onClick={handleClose} size="large">
            Cancel
          </Button>,
          <Button
            key="assign"
            type="primary"
            loading={loading}
            onClick={handleAssignPreset}
            disabled={!selectedPreset}
            icon={<CheckCircleOutlined />}
            size="large"
            className="bg-gradient-to-r from-blue-500 to-purple-500 border-0 hover:from-blue-600 hover:to-purple-600"
          >
            {selectedPreset ? `Assign "${selectedPreset}"` : 'Select a Preset'}
          </Button>
        ]}
        className="assign-preset-modal"
      >
        {/* Enhanced Plan Information */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Text strong className="text-sm">Source Alloy:</Text>
                  <Tag color="blue" className="text-sm font-medium">
                    {planData?.alloyName || `Alloy ${planData?.alloyId}`}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <Text strong className="text-sm">Target:</Text>
                  <Tag color="green" className="text-sm font-medium">
                    {planData?.convertName || `Convert ${planData?.convertToAlloyId}`}
                  </Tag>
                </div>
              </div>

              <div className="h-12 w-px bg-gray-300" />

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Text strong className="text-sm">Quantity:</Text>
                  <Text className="text-lg font-bold text-gray-700">
                    {planData?.quantity}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Text strong className="text-sm">Priority:</Text>
                  <Tag color="orange" className="text-sm">
                    {planData?.priority || 'Normal'}
                  </Tag>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stepPresets?.length || 0}
              </div>
              <div className="text-xs text-gray-500">Available Presets</div>
            </div>
          </div>
        </Card>

        {/* Enhanced Search and Filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search
                  placeholder="Search presets by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onSearch={setSearchTerm}
                  enterButton={<SearchOutlined />}
                  size="large"
                  allowClear
                  className="preset-search"
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
                <Option value="rating">Rating</Option>
              </Select>

              <Switch
                checkedChildren={<HeartFilled />}
                unCheckedChildren={<HeartOutlined />}
                checked={showFavorites}
                onChange={setShowFavorites}
                title="Show favorites only"
              />
            </div>

            <div className="flex items-center gap-2">
              <Segmented
                options={[
                  { label: 'Grid', value: 'grid', icon: <DashboardOutlined /> },
                  { label: 'List', value: 'list', icon: <BarChartOutlined /> }
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
            </div>
          </div>

          {/* Filter summary */}
          {(searchTerm || filterCategory !== 'all' || showFavorites) && (
            <div className="flex items-center gap-2 mb-4">
              <Text type="secondary" className="text-sm">
                Filters applied:
              </Text>
              {searchTerm && (
                <Tag closable onClose={() => setSearchTerm('')}>
                  Search: "{searchTerm}"
                </Tag>
              )}
              {filterCategory !== 'all' && (
                <Tag closable onClose={() => setFilterCategory('all')}>
                  Category: {filterCategory}
                </Tag>
              )}
              {showFavorites && (
                <Tag closable onClose={() => setShowFavorites(false)}>
                  <HeartFilled /> Favorites only
                </Tag>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Presets Display */}
        <div className="preset-list-container">
          {filteredPresets.length === 0 ? (
            <div className="text-center py-12">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Title level={4} className="text-gray-500">
                      {searchTerm || filterCategory !== 'all' || showFavorites
                        ? 'No presets found matching your criteria'
                        : 'No presets available'}
                    </Title>
                    <Text className="text-gray-400">
                      {searchTerm || filterCategory !== 'all' || showFavorites
                        ? 'Try adjusting your search terms or filters'
                        : 'Create presets in the Preset Management section'}
                    </Text>
                  </div>
                }
              />
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <Row gutter={[16, 16]}>
                  {filteredPresets.map(preset => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={preset.presetName}>
                      <PresetCard preset={preset} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <List
                  dataSource={filteredPresets}
                  renderItem={preset => (
                    <PresetListItem preset={preset} />
                  )}
                  className="preset-list"
                />
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Enhanced Preset Preview Modal */}
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
                Preset Preview: {previewPreset}
              </Title>
              <Text type="secondary" className="text-sm">
                Complete workflow visualization
              </Text>
            </div>
          </div>
        }
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false)
          setPreviewPreset(null)
        }}
        width={800}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setPreviewVisible(false)
              setPreviewPreset(null)
            }}
            size="large"
          >
            Close
          </Button>,
          <Button
            key="select"
            type="primary"
            onClick={() => {
              handleSelectPreset(previewPreset)
              setPreviewVisible(false)
              setPreviewPreset(null)
            }}
            disabled={selectedPreset === previewPreset}
            size="large"
            className="bg-gradient-to-r from-blue-500 to-purple-500 border-0"
          >
            {selectedPreset === previewPreset
              ? '✅ Already Selected'
              : 'Select This Preset'}
          </Button>
        ]}
      >
        {presetDetails && presetDetails.length > 0 && (
          <div>
            {/* Preset summary */}
            <div className="mb-6">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Preset Name">
                  <Text strong>{previewPreset}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag color="blue">
                    {(presetDetails[0]?.category || 'standard').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  {presetDetails[0]?.presetDescription || 'No description available'}
                </Descriptions.Item>
                <Descriptions.Item label="Total Steps">
                  <Badge count={presetDetails.length} style={{ backgroundColor: '#52c41a' }} />
                </Descriptions.Item>
                <Descriptions.Item label="Required Steps">
                  <Badge
                    count={presetDetails.filter(step => step.isRequired !== false).length}
                    style={{ backgroundColor: '#fa8c16' }}
                  />
                </Descriptions.Item>
              </Descriptions>
            </div>

            <Divider>Production Workflow Timeline</Divider>

            {/* Enhanced timeline view */}
            <Timeline mode="left" className="preview-timeline">
              {presetDetails
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map((step, index) => {
                  const stepIcon = STEP_ICONS[step.stepName] || {
                    icon: '⚡',
                    color: '#1890ff',
                    name: step.stepName
                  }

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
                        <div className="text-sm text-gray-500 font-medium">
                          Step {step.stepOrder}
                        </div>
                      }
                    >
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">
                            {stepIcon.icon}
                          </span>
                          <div>
                            <Text strong className="text-lg">
                              {step.stepName}
                            </Text>
                            <div className="text-xs text-gray-500 mt-1">
                              {stepIcon.name}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                          <Tag color="cyan" className="flex items-center gap-1">
                            <ClockCircleOutlined />
                            {step.estimatedDuration || 2} {step.estimatedDurationUnit || 'hours'}
                          </Tag>
                          {step.isRequired !== false ? (
                            <Tag color="green" className="flex items-center gap-1">
                              <CheckCircleOutlined />
                              Required
                            </Tag>
                          ) : (
                            <Tag color="default" className="flex items-center gap-1">
                              <InfoCircleOutlined />
                              Optional
                            </Tag>
                          )}
                        </div>

                        {step.notes && (
                          <Alert
                            message={step.notes}
                            type="info"
                            showIcon
                            className="mt-3"
                            size="small"
                          />
                        )}
                      </div>
                    </Timeline.Item>
                  )
                })}
            </Timeline>

            {/* Quick summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Text strong>Estimated Total Duration:</Text>
                  <Text className="ml-2 text-lg font-bold text-blue-600">
                    {presetDetails.reduce((sum, step) => {
                      const duration = step.estimatedDuration || 2
                      const unit = step.estimatedDurationUnit || 'hours'
                      const hoursMultiplier = unit === 'days' ? 24 : unit === 'minutes' ? 1/60 : 1
                      return sum + (duration * hoursMultiplier)
                    }, 0)} hours
                  </Text>
                </div>
                <div>
                  <Text strong>Work Days:</Text>
                  <Text className="ml-2 text-lg font-bold text-green-600">
                    ~{Math.ceil(presetDetails.reduce((sum, step) => {
                      const duration = step.estimatedDuration || 2
                      const unit = step.estimatedDurationUnit || 'hours'
                      const hoursMultiplier = unit === 'days' ? 24 : unit === 'minutes' ? 1/60 : 1
                      return sum + (duration * hoursMultiplier)
                    }, 0) / 8)} days
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default AssignPresetModal