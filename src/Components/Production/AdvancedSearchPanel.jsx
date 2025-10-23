import React, { useState, useCallback, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Divider,
  Collapse,
  Checkbox,
  Tooltip,
  AutoComplete,
  Slider,
  Switch,
  Badge,
  Dropdown,
  Menu,
  Typography,
  message
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  SaveOutlined,
  DownloadOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons'
import moment from 'moment'
import { debounce } from 'lodash'

const { Panel } = Collapse
const { Search } = Input
const { Option } = Select
const { Text } = Typography

const AdvancedSearchPanel = ({
  data,
  onSearch,
  onFilter,
  loading = false,
  className = '',
  savedFilters = [],
  onSaveFilter
}) => {
  const [activePanel, setActivePanel] = useState(['basic'])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [advancedMode, setAdvancedMode] = useState(false)

  // Filter options
  const filterOptions = useMemo(() => ({
    // Basic filters
    status: {
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Status', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Quality Check', value: 'quality_check' },
        { label: 'Completed', value: 'completed' },
        { label: 'Paused', value: 'paused' }
      ]
    },
    priority: {
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'All Priorities', value: 'all' },
        { label: 'Urgent', value: 'urgent' },
        { label: 'Normal', value: 'normal' }
      ]
    },
    createdBy: {
      label: 'Created By',
      type: 'autocomplete',
      options: []
    },

    // Advanced filters
    dateRange: {
      label: 'Date Range',
      type: 'daterange'
    },
    quantity: {
      label: 'Quantity Range',
      type: 'slider',
      min: 1,
      max: 1000,
      step: 10
    },
    progress: {
      label: 'Progress',
      type: 'slider',
      min: 0,
      max: 100,
      step: 5
    },
    hasNotes: {
      label: 'Has Notes',
      type: 'switch'
    },
    recentlyUpdated: {
      label: 'Recently Updated',
      type: 'switch'
    }
  }), [])

  // Generate suggestions for autocomplete
  const generateSuggestions = useCallback((field, query) => {
    if (!data || !query) return []

    switch (field) {
      case 'createdBy':
        const creators = [...new Set(data.map(item =>
          item.createdBy || item.created_by || 'Unknown'
        ))]
        return creators.map(creator => ({
          value: creator,
          label: creator
        }))
      case 'product':
        const products = [...new Set(data.map(item =>
          item.alloyName || item.productName || ''
        ))]
        return products
          .filter(product => product.toLowerCase().includes(query.toLowerCase()))
          .map(product => ({
            value: product,
            label: product
          }))
      default:
        return []
    }
  }, [data])

  // Debounced search
  const debouncedSearch = useMemo(() =>
    debounce((value) => {
      setSearchTerm(value)
      onSearch && onSearch(value, filters)
    }, 300)
  , [onSearch])

  // Handle filter change
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter && onFilter(searchTerm, newFilters)
  }, [filters, searchTerm, onFilter, onSearch])

  // Clear all filters
  const handleClear = useCallback(() => {
    setSearchTerm('')
    setFilters({})
    onSearch && onSearch('', {})
    onFilter && onFilter('', {})
  }, [onSearch, onFilter])

  // Save current filter
  const handleSaveFilter = useCallback(() => {
    const filterConfig = {
      id: `filter_${Date.now()}`,
      name: filters.dateRange?.[0]
        ? `${moment(filters.dateRange[0]).format('MMM DD')} - ${moment(filters.dateRange[1]).format('MMM DD')}`
        : 'Custom Filter',
      searchTerm,
      filters,
      createdAt: new Date().toISOString()
    }

    onSaveFilter && onSaveFilter(filterConfig)
    message.success('Filter saved successfully')
  }, [searchTerm, filters, onSaveFilter])

  // Load saved filter
  const handleLoadFilter = useCallback((savedFilter) => {
    setSearchTerm(savedFilter.searchTerm || '')
    setFilters(savedFilter.filters || {})
    onSearch && onSearch(savedFilter.searchTerm || '', savedFilter.filters || {})
  }, [onSearch])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value =>
      value !== undefined &&
      value !== 'all' &&
      (Array.isArray(value) ? value.length > 0 : value !== false)
    ).length
  }, [filters])

  // Get filter summary
  const getFilterSummary = useCallback(() => {
    const summary = []

    if (filters.status && filters.status !== 'all') {
      summary.push(`Status: ${filters.status}`)
    }
    if (filters.priority && filters.priority !== 'all') {
      summary.push(`Priority: ${filters.priority}`)
    }
    if (filters.dateRange?.length === 2) {
      summary.push(`Date: ${moment(filters.dateRange[0]).format('MMM DD')} - ${moment(filters.dateRange[1]).format('MMM DD')}`)
    }
    if (filters.quantity) {
      summary.push(`Quantity: ${filters.quantity[0]}-${filters.quantity[1]}`)
    }
    if (filters.progress) {
      summary.push(`Progress: ${filters.progress[0]}-${filters.progress[1]}%`)
    }
    if (filters.hasNotes) {
      summary.push('Has Notes')
    }
    if (filters.recentlyUpdated) {
      summary.push('Recently Updated')
    }

    return summary
  }, [filters])

  // Render filter input
  const renderFilterInput = (key, option) => {
    const value = filters[key]

    switch (option.type) {
      case 'select':
        return (
          <Select
            value={value || 'all'}
            onChange={(val) => handleFilterChange(key, val)}
            style={{ width: '100%' }}
            placeholder={`Select ${option.label.toLowerCase()}`}
          >
            {option.options.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        )

      case 'autocomplete':
        return (
          <AutoComplete
            value={value || ''}
            options={generateSuggestions(key, value || '')}
            onSelect={(val) => handleFilterChange(key, val)}
            onSearch={(val) => handleFilterChange(key, val)}
            style={{ width: '100%' }}
            placeholder={`Search ${option.label.toLowerCase()}`}
          />
        )

      case 'daterange':
        return (
          <DatePicker.RangePicker
            value={value || null}
            onChange={(dates) => handleFilterChange(key, dates)}
            style={{ width: '100%' }}
            placeholder={['Start Date', 'End Date']}
          />
        )

      case 'slider':
        return (
          <div>
            <Slider
              range
              min={option.min}
              max={option.max}
              step={option.step}
              value={value || [option.min, option.max]}
              onChange={(val) => handleFilterChange(key, val)}
              style={{ width: '100%', marginTop: 8 }}
            />
            {value && (
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{value[0]}</span>
                <span>{value[1]}</span>
              </div>
            )}
          </div>
        )

      case 'switch':
        return (
          <Switch
            checked={value || false}
            onChange={(val) => handleFilterChange(key, val)}
          />
        )

      default:
        return null
    }
  }

  return (
    <Card className={`advanced-search-panel ${className || ''}`}>
      <div className="mb-4">
        <Row justify="space-between" align="middle">
          <Col flex="auto">
            <Space>
              <Search
                placeholder="Search by product name, job card ID, or notes..."
                allowClear
                enterButton
                size="large"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => debouncedSearch(e.target.value)}
                onSearch={debouncedSearch}
                style={{ width: 300 }}
              />

              <Badge count={activeFilterCount} size="small">
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setAdvancedMode(!advancedMode)}
                >
                  {advancedMode ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </Badge>
            </Space>
          </Col>

          <Col>
            <Space>
              <Tooltip title="Clear all filters">
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  disabled={activeFilterCount === 0 && !searchTerm}
                >
                  Clear
                </Button>
              </Tooltip>

              <Tooltip title="Save current filter">
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSaveFilter}
                  disabled={activeFilterCount === 0 && !searchTerm}
                >
                  Save
                </Button>
              </Tooltip>

              {savedFilters.length > 0 && (
                <Dropdown
                  overlay={
                    <Menu>
                      {savedFilters.map(filter => (
                        <Menu.Item
                          key={filter.id}
                          onClick={() => handleLoadFilter(filter)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{filter.name}</span>
                            <small className="text-gray-400">
                              {moment(filter.createdAt).format('MMM DD')}
                            </small>
                          </div>
                        </Menu.Item>
                      ))}
                    </Menu>
                  }
                  trigger={['click']}
                >
                  <Button icon={<DownOutlined />}>
                    Saved Filters
                  </Button>
                </Dropdown>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="mb-4">
          <Space wrap>
            <Text type="secondary">Active Filters:</Text>
            {getFilterSummary().map((filter, index) => (
              <Tag
                key={index}
                closable
                onClose={() => {
                  const [key, ..._] = filter.split(': ')
                  if (key === 'Status') {
                    handleFilterChange('status', 'all')
                  } else if (key === 'Priority') {
                    handleFilterChange('priority', 'all')
                  } else {
                    handleFilterChange(key.toLowerCase().replace(/\s+/g, ''), undefined)
                  }
                }}
              >
                {filter}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Advanced Filters */}
      {advancedMode && (
        <Collapse
          activeKey={activePanel}
          onChange={setActivePanel}
          ghost
        >
          <Panel header="Basic Filters" key="basic">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <div className="mb-2">
                  <Text strong>{filterOptions.status.label}</Text>
                </div>
                {renderFilterInput('status', filterOptions.status)}
              </Col>
              <Col span={6}>
                <div className="mb-2">
                  <Text strong>{filterOptions.priority.label}</Text>
                </div>
                {renderFilterInput('priority', filterOptions.priority)}
              </Col>
              <Col span={6}>
                <div className="mb-2">
                  <Text strong>{filterOptions.createdBy.label}</Text>
                </div>
                {renderFilterInput('createdBy', filterOptions.createdBy)}
              </Col>
            </Row>
          </Panel>

          <Panel header="Advanced Filters" key="advanced">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div className="mb-2">
                  <Text strong>{filterOptions.dateRange.label}</Text>
                </div>
                {renderFilterInput('dateRange', filterOptions.dateRange)}
              </Col>
              <Col span={8}>
                <div className="mb-2">
                  <Text strong>{filterOptions.quantity.label}</Text>
                </div>
                {renderFilterInput('quantity', filterOptions.quantity)}
              </Col>
              <Col span={8}>
                <div className="mb-2">
                  <Text strong>{filterOptions.progress.label}</Text>
                </div>
                {renderFilterInput('progress', filterOptions.progress)}
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="flex items-center justify-between">
                  <Text strong>{filterOptions.hasNotes.label}</Text>
                  {renderFilterInput('hasNotes', filterOptions.hasNotes)}
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-center justify-between">
                  <Text strong>{filterOptions.recentlyUpdated.label}</Text>
                  {renderFilterInput('recentlyUpdated', filterOptions.recentlyUpdated)}
                </div>
              </Col>
            </Row>
          </Panel>

          <Panel
            header="Quick Filters"
            key="quick"
            extra={
              <Tooltip title="Quick filters for common scenarios">
                <InfoCircleOutlined />
              </Tooltip>
            }
          >
            <Space wrap>
              <Button
                size="small"
                onClick={() => {
                  setSearchTerm('')
                  setFilters({ status: 'in_progress' })
                  onSearch && onSearch('', { status: 'in_progress' })
                }}
              >
                In Progress Only
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setSearchTerm('')
                  setFilters({ status: 'pending' })
                  onSearch && onSearch('', { status: 'pending' })
                }}
              >
                Pending Only
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setSearchTerm('')
                  setFilters({ priority: 'urgent' })
                  onSearch && onSearch('', { priority: 'urgent' })
                }}
              >
                Urgent Items
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setSearchTerm('')
                  setFilters({
                    dateRange: [
                      moment().subtract(7, 'days'),
                      moment()
                    ]
                  })
                  onSearch && onSearch('', {
                    dateRange: [
                      moment().subtract(7, 'days'),
                      moment()
                    ]
                  })
                }}
              >
                Last 7 Days
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setSearchTerm('')
                  setFilters({
                    dateRange: [
                      moment().subtract(30, 'days'),
                      moment()
                    ]
                  })
                  onSearch && onSearch('', {
                    dateRange: [
                      moment().subtract(30, 'days'),
                      moment()
                    ]
                  })
                }}
              >
                Last 30 Days
              </Button>
            </Space>
          </Panel>
        </Collapse>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <Text type="secondary">Searching...</Text>
        </div>
      )}

      {/* Results Summary */}
      {!loading && data && (
        <div className="mt-4 pt-4 border-t">
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary">
                Found {data.length} items
                {activeFilterCount > 0 && ` with ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''}`}
              </Text>
            </Col>
            <Col>
              <Text type="secondary" className="text-right">
                {activeFilterCount > 0 ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={handleClear}
                  >
                    Clear Filters
                  </Button>
                ) : 'No filters applied'}
              </Text>
            </Col>
          </Row>
        </div>
      )}
    </Card>
  )
}

export default AdvancedSearchPanel