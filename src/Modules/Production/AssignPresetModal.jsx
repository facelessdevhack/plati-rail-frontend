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
  Tag,
  Avatar,
  Row,
  Col,
  Timeline,
  Badge
} from 'antd'
import {
  SettingOutlined,
  SearchOutlined,
  CheckOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  NumberOutlined,
  FlagOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { getStepPresets, getPresetDetails, assignPresetToPlan } from '../../redux/api/productionAPI'

const { Title, Text } = Typography
const { Search } = Input

const AssignPresetModal = ({ 
  visible, 
  onClose, 
  planData,
  onSuccess 
}) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewPreset, setPreviewPreset] = useState(null)

  // Redux state
  const { stepPresets, presetDetails } = useSelector(state => state.productionDetails)
  const { user } = useSelector(state => state.userDetails)

  // Load presets when modal opens
  useEffect(() => {
    if (visible) {
      dispatch(getStepPresets())
    }
  }, [visible, dispatch])

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

  // Get preset icon based on category
  const getPresetIcon = (category) => {
    const icons = {
      basic: <SettingOutlined />,
      chrome: <FlagOutlined />,
      premium: <PlayCircleOutlined />,
      standard: <ClockCircleOutlined />,
      urgent: <FlagOutlined />,
      custom: <SettingOutlined />
    }
    return icons[category] || <SettingOutlined />
  }

  // Filter presets based on search term
  const filteredPresets = (stepPresets || []).filter(preset =>
    preset.presetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    preset.presetDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle preset preview
  const handlePreviewPreset = async (preset) => {
    try {
      setPreviewLoading(true)
      await dispatch(getPresetDetails({ presetId: preset.id })).unwrap()
      setPreviewPreset(preset)
      setPreviewVisible(true)
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to load preset details: ' + (error?.message || 'Unknown error')
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  // Handle preset assignment
  const handleAssignPreset = async () => {
    if (!selectedPreset) {
      notification.warning({
        message: 'No Preset Selected',
        description: 'Please select a preset to assign to this production plan.'
      })
      return
    }

    try {
      setLoading(true)
      
      // Call the actual API to assign preset
      await dispatch(assignPresetToPlan({
        planId: planData.id,
        presetId: selectedPreset.id
      })).unwrap()

      notification.success({
        message: 'Success',
        description: `Preset "${selectedPreset.presetName}" has been assigned to production plan #${planData?.id}!`
      })

      setSelectedPreset(null)
      setSearchTerm('')
      onSuccess?.()
      onClose()
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error?.message || 'Failed to assign preset to production plan'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    setSelectedPreset(null)
    setSearchTerm('')
    setPreviewVisible(false)
    setPreviewPreset(null)
    onClose()
  }

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <SettingOutlined className="text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">Assign Production Preset</div>
              <div className="text-sm text-gray-500">Plan #{planData?.id} • {planData?.quantity} units</div>
            </div>
          </div>
        }
        open={visible}
        onCancel={handleClose}
        width={900}
        footer={[
          <Button key="cancel" size="large" onClick={handleClose}>
            Cancel
          </Button>,
          <Button
            key="assign"
            type="primary"
            size="large"
            loading={loading}
            onClick={handleAssignPreset}
            disabled={!selectedPreset}
            icon={<CheckOutlined />}
            className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
          >
            Assign Selected Preset
          </Button>
        ]}
      >
        {/* Enhanced Plan Information */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-sm">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                  <SettingOutlined className="text-blue-600 text-lg" />
                </div>
                <Text type="secondary" className="text-xs block mb-1">Source Alloy</Text>
                <Text strong className="text-sm text-blue-700">
                  {planData?.alloyName || `Alloy ${planData?.alloyId}`}
                </Text>
                {planData?.sourceModelName && (
                  <Text type="secondary" className="text-xs block mt-1">
                    {planData.sourceModelName}
                  </Text>
                )}
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                  <FlagOutlined className="text-green-600 text-lg" />
                </div>
                <Text type="secondary" className="text-xs block mb-1">Target Alloy</Text>
                <Text strong className="text-sm text-green-700">
                  {planData?.convertName || `Convert ${planData?.convertToAlloyId}`}
                </Text>
                {planData?.targetModelName && (
                  <Text type="secondary" className="text-xs block mt-1">
                    {planData.targetModelName}
                  </Text>
                )}
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                  <NumberOutlined className="text-purple-600 text-lg" />
                </div>
                <Text type="secondary" className="text-xs block mb-1">Quantity</Text>
                <Text strong className="text-sm text-purple-700">
                  {planData?.quantity} units
                </Text>
                {planData?.inProductionQuantity > 0 && (
                  <Badge
                    count="In Production"
                    size="small"
                    className="mt-1"
                    style={{ backgroundColor: '#faad14' }}
                  />
                )}
              </div>
            </Col>
          </Row>
        </Card>

        {/* Enhanced Search */}
        <div className="mb-6">
          <Search
            placeholder="Search presets by name, description, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={setSearchTerm}
            enterButton={
              <Button type="primary" icon={<SearchOutlined />} className="bg-blue-500">
                Search
              </Button>
            }
            size="large"
            allowClear
            className="rounded-lg"
          />
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-500">
              Found {filteredPresets.length} preset{filteredPresets.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* Enhanced Presets Grid */}
        <div className="max-h-96 overflow-y-auto px-1">
          {filteredPresets.length === 0 ? (
            <Empty
              description={
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🔧</div>
                  <div className="text-lg font-medium text-gray-600 mb-1">No presets found</div>
                  <div className="text-sm text-gray-400">
                    {searchTerm ? 'Try adjusting your search terms' : 'No presets are available yet'}
                  </div>
                </div>
              }
              image={null}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {filteredPresets.map((preset) => (
                <Col xs={24} sm={12} lg={8} key={preset.id}>
                  <Card
                    hoverable
                    className={`transition-all duration-200 cursor-pointer ${
                      selectedPreset?.id === preset.id
                        ? 'border-blue-500 shadow-lg transform -translate-y-1'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPreset(preset)}
                    actions={[
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        loading={previewLoading && previewPreset?.id === preset.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePreviewPreset(preset)
                        }}
                        title="Preview Preset"
                        key="preview"
                      />
                    ]}
                  >
                    <div className="relative">
                      {selectedPreset?.id === preset.id && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckOutlined className="text-white text-xs" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-3">
                        <Avatar
                          size="large"
                          className="bg-gradient-to-br from-blue-400 to-purple-500"
                          icon={getPresetIcon(preset.presetCategory)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 truncate">
                            {preset.presetName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {preset.presetCategory?.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <Text
                          type="secondary"
                          className="text-sm line-clamp-2"
                          ellipsis={{ tooltip: preset.presetDescription }}
                        >
                          {preset.presetDescription || 'No description available'}
                        </Text>
                      </div>

                      <div className="flex items-center justify-between">
                        <Space size="small">
                          <Tag
                            color={getCategoryColor(preset.presetCategory)}
                            className="text-xs"
                          >
                            {preset.presetCategory?.toUpperCase()}
                          </Tag>
                          <Badge
                            count={`${preset.stepCount || 0} steps`}
                            size="small"
                            className="bg-gray-100 text-gray-600"
                          />
                        </Space>
                        {preset.isActive === false && (
                          <Tag color="red" size="small">Inactive</Tag>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Modal>

      {/* Preset Preview Modal */}
      <Modal
        title={`Preset Preview: ${previewPreset}`}
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false)
          setPreviewPreset(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setPreviewVisible(false)
              setPreviewPreset(null)
            }}
          >
            Close
          </Button>,
          <Button
            key="select"
            type="primary"
            onClick={() => {
              setSelectedPreset(previewPreset)
              setPreviewVisible(false)
              setPreviewPreset(null)
            }}
            disabled={selectedPreset === previewPreset}
          >
            {selectedPreset === previewPreset
              ? 'Already Selected'
              : 'Select This Preset'}
          </Button>
        ]}
        width={600}
      >
        {presetDetails && presetDetails.length > 0 && (
          <div className="mt-4">
            <div className="mb-4">
              <Text strong>Description: </Text>
              <Text>
                {presetDetails[0]?.presetDescription || 'No description available'}
              </Text>
            </div>

            <Divider>Production Steps ({presetDetails.length})</Divider>

            <div className="space-y-3 max-h-300 overflow-y-auto">
              {[...presetDetails]
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

export default AssignPresetModal