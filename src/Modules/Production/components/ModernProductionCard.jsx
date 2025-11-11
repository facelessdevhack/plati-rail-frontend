import React from 'react'
import {
  EyeOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  MoreOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { Button, Dropdown, Tooltip, Progress } from 'antd'
import moment from 'moment'

// Glassmorphic Card Container
const GlassCard = ({ children, className = '', hover = false, onClick }) => (
  <div
    onClick={onClick}
    className={`
      relative rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/70
      border border-white/30 dark:border-slate-700/50
      shadow-2xl shadow-black/10
      ${hover ? 'hover:shadow-3xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 cursor-pointer' : ''}
      ${className}
    `}
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-white/20 to-transparent dark:from-white/10 dark:via-white/5 pointer-events-none" />
    <div className="relative h-full">{children}</div>
  </div>
)

// Modern Badge with Gradient
const StatusBadge = ({ status, text, icon }) => {
  const statusStyles = {
    completed: {
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/50',
      text: 'text-white'
    },
    in_progress: {
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      glow: 'shadow-blue-500/50',
      text: 'text-white'
    },
    pending: {
      bg: 'bg-gradient-to-r from-orange-400 to-amber-500',
      glow: 'shadow-orange-500/50',
      text: 'text-white'
    },
    urgent: {
      bg: 'bg-gradient-to-r from-red-500 to-rose-600',
      glow: 'shadow-red-500/50',
      text: 'text-white',
      animate: 'animate-pulse'
    },
    waiting: {
      bg: 'bg-gradient-to-r from-gray-400 to-slate-500',
      glow: 'shadow-gray-500/30',
      text: 'text-white'
    }
  }

  const style = statusStyles[status] || statusStyles.waiting

  return (
    <div className={`
      inline-flex items-center gap-2 px-4 py-2 rounded-full
      ${style.bg} ${style.text} ${style.animate || ''}
      shadow-lg ${style.glow}
      font-semibold text-xs tracking-wide uppercase
      backdrop-blur-sm
    `}>
      {icon && <span className="text-sm">{icon}</span>}
      <span>{text}</span>
    </div>
  )
}

// Product Flow Section
const ProductFlowSection = ({ sourceProduct, targetProduct, planId, urgent }) => (
  <div className="space-y-4">
    {/* Header with ID and Urgent Badge */}
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-white font-bold text-lg">#{planId}</span>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Plan ID</div>
          <div className="text-sm text-gray-900 dark:text-white font-semibold">#{planId}</div>
        </div>
      </div>
      {urgent && (
        <StatusBadge status="urgent" text="URGENT" icon="🔥" />
      )}
    </div>

    {/* Product Transformation Flow */}
    <div className="space-y-3">
      {/* Source Product */}
      <div className="group">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200/50 dark:border-slate-600/30 transition-all duration-300 group-hover:shadow-md">
          <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-gray-400 to-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">FROM ALLOY</div>
            <div className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={sourceProduct}>
              {sourceProduct}
            </div>
          </div>
        </div>
      </div>

      {/* Arrow Separator with Animation */}
      <div className="flex items-center justify-center">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-600 to-transparent" />
        <div className="mx-4 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce-slow">
          <ArrowRightOutlined className="text-white text-lg" />
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-600 to-transparent" />
      </div>

      {/* Target Product */}
      <div className="group">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200/50 dark:border-indigo-700/30 transition-all duration-300 group-hover:shadow-md group-hover:shadow-indigo-500/20">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <div className="w-6 h-6 rounded bg-white/30" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">TO ALLOY</div>
            <div className="font-semibold text-sm text-indigo-900 dark:text-indigo-300 truncate" title={targetProduct}>
              {targetProduct}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Quantity and Progress Section
const QuantityProgressSection = ({ total, allocated, remaining }) => {
  const percentage = total > 0 ? Math.round((allocated / total) * 100) : 0

  const getProgressColor = () => {
    if (percentage === 100) return { from: 'from-red-500', to: 'to-rose-600', glow: 'shadow-red-500/50' }
    if (percentage > 75) return { from: 'from-orange-500', to: 'to-amber-600', glow: 'shadow-orange-500/50' }
    if (percentage > 50) return { from: 'from-blue-500', to: 'to-indigo-600', glow: 'shadow-blue-500/50' }
    if (percentage > 0) return { from: 'from-emerald-500', to: 'to-teal-600', glow: 'shadow-emerald-500/50' }
    return { from: 'from-gray-400', to: 'to-slate-500', glow: 'shadow-gray-500/30' }
  }

  const colors = getProgressColor()

  return (
    <div className="space-y-4">
      {/* Total Quantity Display */}
      <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200/50 dark:border-slate-600/30">
        <div className="text-5xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent mb-2">
          {total.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold tracking-wider uppercase">
          Total Units
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Production Progress</span>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {percentage}%
          </span>
        </div>

        <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors.from} ${colors.to} rounded-full transition-all duration-1000 ease-out shadow-lg ${colors.glow}`}
            style={{ width: `${Math.max(percentage, 3)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-shimmer" />
          </div>
        </div>

        {/* Quantity Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/30 dark:border-blue-700/30">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {allocated.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Allocated</div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/30 dark:border-emerald-700/30">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {remaining.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Status and Timeline Section
const StatusTimelineSection = ({ stepName, status, createdAt, jobCardsCount, workflowInfo }) => {
  const getStatusIcon = () => {
    const icons = {
      completed: <CheckCircleOutlined className="text-2xl" />,
      in_progress: <ClockCircleOutlined className="text-2xl animate-spin-slow" />,
      pending: <ClockCircleOutlined className="text-2xl" />,
      waiting: <ClockCircleOutlined className="text-2xl opacity-50" />
    }
    return icons[status] || icons.waiting
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200/50 dark:border-slate-600/30">
        <div className="flex items-center gap-3 mb-4">
          {getStatusIcon()}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Current Status</div>
            <div className="font-semibold text-gray-900 dark:text-white">{stepName}</div>
          </div>
        </div>
        <StatusBadge status={status} text={status.replace('_', ' ')} />
      </div>

      {/* Timeline Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/30">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
            📅
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Created</div>
            <div className="font-semibold text-sm text-gray-900 dark:text-white">
              {moment(createdAt).format('MMM DD, YYYY')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {moment(createdAt).format('HH:mm A')}
            </div>
          </div>
        </div>

        {/* Job Cards Count */}
        {jobCardsCount > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200/30 dark:border-indigo-700/30">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold">{jobCardsCount}</span>
            </div>
            <div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Job Cards</div>
              <div className="text-sm text-indigo-900 dark:text-indigo-300 font-semibold">
                {jobCardsCount} active {jobCardsCount === 1 ? 'card' : 'cards'}
              </div>
            </div>
          </div>
        )}

        {/* Workflow Progress */}
        {workflowInfo?.hasCustomWorkflow && (
          <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Workflow Progress</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {workflowInfo.completedSteps}/{workflowInfo.totalSteps}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 shadow-lg shadow-indigo-500/30"
                style={{ width: `${(workflowInfo.completedSteps / workflowInfo.totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Production Card Component
const ModernProductionCard = ({
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
  const sourceProduct = record.alloyName || record.sourceProduct || record.sourceproductname || `Alloy ${record.alloyId}`
  const targetProduct = record.convertName || record.targetProduct || record.targetproductname || `Convert ${record.convertToAlloyId}`
  const hasWorkflowOrPreset = record.workflowInfo?.hasCustomWorkflow || record.hasWorkflowSteps || record.workflowInfo?.presetName || record.presetName || record.preset_name

  return (
    <GlassCard hover onClick={() => handleView(record)} className="overflow-hidden">
      <div className="p-6">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Product Flow - 4 columns */}
          <div className="lg:col-span-4">
            <ProductFlowSection
              sourceProduct={sourceProduct}
              targetProduct={targetProduct}
              planId={record.id}
              urgent={record.urgent}
            />
          </div>

          {/* Quantity Progress - 4 columns */}
          <div className="lg:col-span-4">
            <QuantityProgressSection
              total={record.quantity || 0}
              allocated={record.quantityTracking?.allocatedQuantity || 0}
              remaining={record.quantityTracking?.remainingQuantity || 0}
            />
          </div>

          {/* Status & Timeline - 4 columns */}
          <div className="lg:col-span-4">
            <StatusTimelineSection
              stepName={record.currentStepName || 'Not Started'}
              status={record.currentStepStatus || 'waiting'}
              createdAt={record.createdAt}
              jobCardsCount={record.jobCardsCount || 0}
              workflowInfo={record.workflowInfo}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-white/20 dark:border-slate-700/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {hasWorkflowOrPreset ? (
              <Tooltip title={getCreateJobCardTooltip(record)}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={e => {
                    e.stopPropagation()
                    handleCreateJobCard(record)
                  }}
                  disabled={!canCreateJobCard(record)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg shadow-indigo-500/30 h-11 px-6 font-semibold"
                >
                  Create Job Card
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Assign a preset/workflow to this production plan">
                <Button
                  size="large"
                  icon={<SettingOutlined />}
                  onClick={e => {
                    e.stopPropagation()
                    handleAssignPreset(record)
                  }}
                  className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/30 hover:bg-white dark:hover:bg-slate-700 h-11 px-6 font-semibold shadow-lg"
                >
                  Assign Preset
                </Button>
              </Tooltip>
            )}

            <Dropdown menu={getActionMenu(record)} trigger={['click']} placement="bottomRight">
              <Button
                size="large"
                icon={<MoreOutlined />}
                onClick={e => e.stopPropagation()}
                className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/30 hover:bg-white dark:hover:bg-slate-700 h-11 w-11 shadow-lg"
              />
            </Dropdown>
          </div>

          {/* View Details Button */}
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={e => {
              e.stopPropagation()
              handleView(record)
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold"
          >
            View Full Details
          </Button>
        </div>

        {/* Expandable Job Cards Section */}
        {record.jobCardsCount > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20 dark:border-slate-700/50">
            <Button
              type="text"
              onClick={e => {
                e.stopPropagation()
                handleExpand(!expandedRowKeys.includes(record.id), record)
              }}
              className="w-full h-10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-semibold rounded-xl"
            >
              {expandedRowKeys.includes(record.id) ? '▲ Hide' : '▼ Show'} Job Cards ({record.jobCardsCount})
            </Button>
          </div>
        )}
      </div>

      {/* Expanded Job Cards Content */}
      {expandedRowKeys.includes(record.id) && (
        <div className="px-6 pb-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/30">
            {expandedRowRender(record)}
          </div>
        </div>
      )}
    </GlassCard>
  )
}

export default ModernProductionCard
