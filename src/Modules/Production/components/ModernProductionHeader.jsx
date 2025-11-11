import React from 'react'
import {
  SearchOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownloadOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { Button, Input, Select, DatePicker } from 'antd'
import moment from 'moment'

const { RangePicker } = DatePicker

// Glassmorphic Card Component
const GlassCard = ({ children, className = '', hover = false }) => (
  <div
    className={`
      relative rounded-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-800/90
      border border-white/20 dark:border-slate-700/50
      shadow-xl shadow-black/5
      ${hover ? 'hover:scale-[1.02] transition-transform duration-300' : ''}
      ${className}
    `}
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent dark:from-white/10 pointer-events-none" />
    <div className="relative">{children}</div>
  </div>
)

// Stat Card Component
const StatCard = ({ label, value, change, trend, icon, iconBg }) => (
  <GlassCard hover className="p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          {label}
        </p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {change && (
          <div className="flex items-center gap-1">
            {trend === 'up' && <RiseOutlined className="text-emerald-500" />}
            {trend === 'down' && <RiseOutlined className="text-red-500 rotate-180" />}
            <span
              className={`text-sm font-medium ${
                trend === 'up' ? 'text-emerald-500' :
                trend === 'down' ? 'text-red-500' :
                'text-gray-500'
              }`}
            >
              {change}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${iconBg}`}>
        {icon}
      </div>
    </div>
  </GlassCard>
)

const ModernProductionHeader = ({
  totalPlansCount,
  productionPlans,
  searchTerm,
  localSearch,
  setLocalSearch,
  handleSearch,
  filters,
  handleFilterChange,
  handleDateRangeChange,
  isTodayFilter,
  handleTodayFilter,
  handleClearFilters,
  handleCreatePlan,
  exportMenuItems,
  getTotalQuantity,
  navigate
}) => {
  // Calculate stats
  const urgentCount = productionPlans.filter(p => p.urgent).length
  const activeCount = productionPlans.filter(p => {
    const stepStatus = p.currentStepStatus
    return ['pending', 'in_progress'].includes(stepStatus)
  }).length
  const completedToday = productionPlans.filter(p => {
    const today = moment().format('YYYY-MM-DD')
    return moment(p.updatedAt).format('YYYY-MM-DD') === today &&
           p.currentStepStatus === 'completed'
  }).length

  const urgentOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'true', label: 'Urgent' },
    { value: 'false', label: 'Normal' }
  ]

  return (
    <div className="min-h-[400px] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/30 p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Production Plans
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage and monitor your production workflow • {totalPlansCount} total plans
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              icon={<DownloadOutlined />}
              className="backdrop-blur-xl bg-white/70 dark:bg-white/10 border-white/20 hover:bg-white/90 dark:hover:bg-white/20 shadow-lg h-10"
              disabled={productionPlans.length === 0}
            >
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreatePlan}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg shadow-indigo-500/25 h-10"
            >
              Create Plan
            </Button>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={() => navigate('/smart-production')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/25 h-10"
            >
              🚀 Smart Planner
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <GlassCard className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
              <Input
                type="text"
                placeholder="Search production plans..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                onPressEnter={handleSearch}
                className="pl-12 h-12 bg-white/50 dark:bg-white/5 border-white/20 focus:border-indigo-500/50 focus:ring-indigo-500/25 rounded-lg"
                allowClear
              />
            </div>

            {/* Today Button */}
            <Button
              type={isTodayFilter ? 'primary' : 'default'}
              onClick={handleTodayFilter}
              icon={<CalendarOutlined />}
              className={`h-12 min-w-[120px] ${
                isTodayFilter
                  ? 'bg-indigo-600 hover:bg-indigo-700 border-0'
                  : 'bg-white/50 dark:bg-white/5 border-white/20'
              }`}
            >
              Today
            </Button>

            {/* Date Range Picker */}
            <RangePicker
              value={
                filters.dateRange
                  ? [moment(filters.dateRange[0]), moment(filters.dateRange[1])]
                  : null
              }
              onChange={handleDateRangeChange}
              placeholder={['Start Date', 'End Date']}
              className="h-12 bg-white/50 dark:bg-white/5 border-white/20 min-w-[280px]"
              disabled={isTodayFilter}
            />

            {/* Priority Filter */}
            <div className="flex items-center gap-2 min-w-[180px]">
              <FilterOutlined className="text-lg text-gray-500" />
              <Select
                value={filters.urgent}
                onChange={value => handleFilterChange('urgent', value)}
                options={urgentOptions}
                className="flex-1"
                placeholder="Priority"
                style={{ width: '100%' }}
                size="large"
              />
            </div>

            {/* Clear Filters */}
            {(searchTerm || filters.urgent || filters.dateRange || isTodayFilter) && (
              <Button
                onClick={handleClearFilters}
                className="h-12 bg-white/50 dark:bg-white/5 border-white/20 hover:bg-white/70"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </GlassCard>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Quantity"
            value={getTotalQuantity()}
            change="+12.5%"
            trend="up"
            icon={<CheckCircleOutlined className="text-2xl text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20"
          />
          <StatCard
            label="Active Plans"
            value={activeCount}
            change="+8.2%"
            trend="up"
            icon={<ClockCircleOutlined className="text-2xl text-blue-600 dark:text-blue-400" />}
            iconBg="bg-gradient-to-br from-blue-500/20 to-blue-600/20"
          />
          <StatCard
            label="Completed Today"
            value={completedToday}
            change="+5.1%"
            trend="up"
            icon={<RiseOutlined className="text-2xl text-purple-600 dark:text-purple-400" />}
            iconBg="bg-gradient-to-br from-purple-500/20 to-purple-600/20"
          />
          <StatCard
            label="Urgent Plans"
            value={urgentCount}
            change={urgentCount > 0 ? '-2' : 'None'}
            trend={urgentCount > 0 ? 'down' : 'neutral'}
            icon={<WarningOutlined className="text-2xl text-orange-600 dark:text-orange-400" />}
            iconBg="bg-gradient-to-br from-orange-500/20 to-red-500/20"
          />
        </div>
      </div>
    </div>
  )
}

export default ModernProductionHeader
