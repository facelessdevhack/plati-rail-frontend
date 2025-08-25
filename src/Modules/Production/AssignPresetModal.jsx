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
  Spin
} from 'antd'
import {
  SettingOutlined,
  SearchOutlined,
  CheckOutlined,
  EyeOutlined
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

  // Filter presets based on search term
  const filteredPresets = (stepPresets || []).filter(preset =>
    preset.presetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    preset.presetDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle preset preview
  const handlePreviewPreset = async (presetName) => {
    try {
      setLoading(true)
      await dispatch(getPresetDetails({ presetName })).unwrap()
      setPreviewPreset(presetName)
      setPreviewVisible(true)
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to load preset details'
      })
    } finally {
      setLoading(false)
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
        presetName: selectedPreset 
      })).unwrap()

      notification.success({
        message: 'Success',
        description: `Preset "${selectedPreset}" has been assigned to production plan #${planData?.id}!`
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
            <SettingOutlined className="text-blue-600" />
            <span>Assign Preset to Plan #{planData?.id}</span>
          </div>
        }
        open={visible}
        onCancel={handleClose}
        width={700}
        footer={[
          <Button key="cancel" onClick={handleClose}>
            Cancel
          </Button>,
          <Button
            key="assign"
            type="primary"
            loading={loading}
            onClick={handleAssignPreset}
            disabled={!selectedPreset}
            icon={<CheckOutlined />}
          >
            Assign Selected Preset
          </Button>
        ]}
      >
        {/* Plan Information */}
        <Card className="mb-4 bg-gray-50" size="small">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <Text strong>Source Alloy: </Text>
              <Text className="text-blue-600">
                {planData?.alloyName || `Alloy ${planData?.alloyId}`}
              </Text>
            </div>
            <div>
              <Text strong>Target: </Text>
              <Text className="text-green-600">
                {planData?.convertName || `Convert ${planData?.convertToAlloyId}`}
              </Text>
            </div>
            <div>
              <Text strong>Quantity: </Text>
              <Text>{planData?.quantity}</Text>
            </div>
          </div>
        </Card>

        {/* Search */}
        <div className="mb-4">
          <Search
            placeholder="Search presets by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={setSearchTerm}
            enterButton={<SearchOutlined />}
            size="large"
            allowClear
          />
        </div>

        {/* Presets List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredPresets.length === 0 ? (
            <Empty description="No presets found" />
          ) : (
            <List
              dataSource={filteredPresets}
              renderItem={(preset) => (
                <List.Item
                  className={`cursor-pointer transition-all hover:bg-blue-50 rounded-lg p-3 ${
                    selectedPreset === preset.presetName ? 'bg-blue-50 border-blue-200 border' : ''
                  }`}
                  onClick={() => setSelectedPreset(preset.presetName)}
                  actions={[
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePreviewPreset(preset.presetName)
                      }}
                      title="Preview Preset"
                    />
                  ]}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Text strong className="text-base">
                          {preset.presetName}
                        </Text>
                        {selectedPreset === preset.presetName && (
                          <CheckOutlined className="text-blue-600" />
                        )}
                      </div>
                    </div>
                    <Text type="secondary" className="text-sm">
                      {preset.presetDescription || 'No description available'}
                    </Text>
                    <div className="mt-1">
                      <Text type="secondary" className="text-xs">
                        {preset.stepCount || 0} steps
                      </Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
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

export default AssignPresetModal