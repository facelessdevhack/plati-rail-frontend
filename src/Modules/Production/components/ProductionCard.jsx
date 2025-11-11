import React from 'react'
import { Button, Badge, Tag, Progress, Dropdown } from 'antd'
import {
  PlayCircleOutlined,
  SettingOutlined,
  MoreOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import moment from 'moment'

const ProductionCard = ({
  record,
  handleView,
  handleCreateJobCard,
  handleAssignPreset,
  canCreateJobCard,
  getCreateJobCardTooltip,
  getActionMenu,
  expandedRowKeys,
  handleExpand,
  expandedRowRender
}) => {
  const sourceProduct = record.alloyName || record.sourceProduct || `Alloy ${record.alloyId}`
  const targetProduct = record.convertName || record.targetProduct || `Convert ${record.convertToAlloyId}`
  const hasWorkflowOrPreset = record.workflowInfo?.hasCustomWorkflow || record.presetName
  const percentage = record.quantity > 0 ? Math.round((record.quantityTracking?.allocatedQuantity / record.quantity) * 100) : 0

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleView(record)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
              <span className="text-blue-600 font-semibold text-sm">#{record.id}</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Plan ID</div>
              <div className="font-medium text-gray-900">#{record.id}</div>
            </div>
          </div>
          {record.urgent && (
            <Badge count="URGENT" style={{ backgroundColor: '#ef4444' }} />
          )}
        </div>

        {/* Product Flow */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">From</div>
              <div className="font-medium text-gray-900 truncate">{sourceProduct}</div>
            </div>
            <ArrowRightOutlined className="text-gray-400" />
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">To</div>
              <div className="font-medium text-blue-600 truncate">{targetProduct}</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-xs text-gray-500 mb-1">Quantity</div>
            <div className="text-lg font-semibold text-gray-900">{record.quantity?.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Allocated</div>
            <div className="text-lg font-semibold text-blue-600">
              {record.quantityTracking?.allocatedQuantity?.toLocaleString() || 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Remaining</div>
            <div className="text-lg font-semibold text-green-600">
              {record.quantityTracking?.remainingQuantity?.toLocaleString() || 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Progress</div>
            <div className="text-lg font-semibold text-gray-900">{percentage}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Progress
            percent={percentage}
            strokeColor={percentage === 100 ? '#ef4444' : percentage > 50 ? '#f59e0b' : '#3b82f6'}
            showInfo={false}
          />
        </div>

        {/* Status and Date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag color={
              record.currentStepStatus === 'completed' ? 'green' :
              record.currentStepStatus === 'in_progress' ? 'blue' :
              record.currentStepStatus === 'pending' ? 'orange' : 'default'
            }>
              {record.currentStepName || 'Not Started'}
            </Tag>
            {record.jobCardsCount > 0 && (
              <Tag color="purple">{record.jobCardsCount} Job Cards</Tag>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <ClockCircleOutlined />
            <span>{moment(record.createdAt).format('MMM DD, YYYY')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          {hasWorkflowOrPreset ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={e => {
                e.stopPropagation()
                handleCreateJobCard(record)
              }}
              disabled={!canCreateJobCard(record)}
            >
              Create Job Card
            </Button>
          ) : (
            <Button
              icon={<SettingOutlined />}
              onClick={e => {
                e.stopPropagation()
                handleAssignPreset(record)
              }}
            >
              Assign Preset
            </Button>
          )}
          <Dropdown menu={getActionMenu(record)} trigger={['click']}>
            <Button
              icon={<MoreOutlined />}
              onClick={e => e.stopPropagation()}
            />
          </Dropdown>
          {record.jobCardsCount > 0 && (
            <Button
              type="link"
              onClick={e => {
                e.stopPropagation()
                handleExpand(!expandedRowKeys.includes(record.id), record)
              }}
              className="ml-auto"
            >
              {expandedRowKeys.includes(record.id) ? 'Hide' : 'Show'} Job Cards
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Job Cards */}
      {expandedRowKeys.includes(record.id) && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          {expandedRowRender(record)}
        </div>
      )}
    </div>
  )
}

export default ProductionCard
