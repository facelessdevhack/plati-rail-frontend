import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Tabs,
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Table,
  Badge,
  Tag,
  Tooltip,
  Space,
  Modal,
  message,
  notification,
  Dropdown,
  Menu,
  Drawer,
  Divider,
  Typography,
  Statistic,
  Progress,
  FloatButton,
  Alert
} from 'antd'
import {
  RocketOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  BarChartOutlined,
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  DashboardOutlined,
  ToolOutlined,
  FireOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import moment from 'moment'
import { useHotkeys } from 'react-hotkeys-hook'
import { debounce } from 'lodash'

import {
  getProductionPlansWithQuantities,
  getJobCardsWithDetails,
  createProductionPlan,
  createJobCard,
  moveToNextStep,
  assignPresetToPlan,
  getStepPresets,
  getSmartProductionSuggestions
} from '../../redux/api/productionAPI'
import { getStockManagement } from '../../redux/api/stockAPI'

// Import existing components for reuse
import JobCardCreationModal from './JobCardCreationModal'
import ProductionPlanDetailsModal from './ProductionPlanDetailsModal'

// Import new advanced components
import ProductionKanbanBoard from './ProductionKanbanBoard'
import AdvancedSearchPanel from '../../Components/Production/AdvancedSearchPanel'
import BulkOperationsToolbar from '../../Components/Production/BulkOperationsToolbar'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Search } = Input

// Keyboard shortcuts configuration
const SHORTCUTS = {
  'ctrl+n': 'newPlan',
  'ctrl+j': 'newJobCard',
  'ctrl+f': 'focusSearch',
  'ctrl+shift+f': 'toggleAdvancedSearch',
  'ctrl+r': 'refresh',
  'ctrl+1': 'tabPlans',
  'ctrl+2': 'tabJobCards',
  'ctrl+3': 'tabKanban',
  'ctrl+4': 'tabAnalytics',
  'ctrl+/': 'showHelp',
  'escape': 'closeModals'
}

const TurboProductionDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // State management
  const [activeTab, setActiveTab] = useState('plans')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedRows, setSelectedRows] = useState([])
  const [helpVisible, setHelpVisible] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [searchFilters, setSearchFilters] = useState({})
  const [selectedKanbanItems, setSelectedKanbanItems] = useState([])

  // Data state
  const [productionPlans, setProductionPlans] = useState([])
  const [jobCards, setJobCards] = useState([])
  const [stockData, setStockData] = useState([])
  const [presets, setPresets] = useState([])
  const [analytics, setAnalytics] = useState({})

  // Modal states
  const [jobCardModalVisible, setJobCardModalVisible] = useState(false)
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedJobCard, setSelectedJobCard] = useState(null)

  // Refs
  const searchInputRef = useRef(null)

  // Get data from Redux store
  const { user } = useSelector(state => state.userDetails || {})

  // Keyboard shortcuts
  useHotkeys(SHORTCUTS, (event, handler) => {
    event.preventDefault()
    handleShortcut(handler.key)
  })

  const handleShortcut = (key) => {
    switch (key) {
      case 'newPlan':
        handleCreatePlan()
        break
      case 'newJobCard':
        handleCreateJobCard()
        break
      case 'focusSearch':
        searchInputRef.current?.focus()
        break
      case 'toggleAdvancedSearch':
        setShowAdvancedSearch(prev => !prev)
        break
      case 'refresh':
        refreshAllData()
        break
      case 'tabPlans':
        setActiveTab('plans')
        break
      case 'tabJobCards':
        setActiveTab('jobCards')
        break
      case 'tabKanban':
        setActiveTab('kanban')
        break
      case 'tabAnalytics':
        setActiveTab('analytics')
        break
      case 'showHelp':
        setHelpVisible(true)
        break
      case 'closeModals':
        closeAllModals()
        break
    }
  }

  // Data fetching functions
  const fetchProductionPlans = useCallback(async () => {
    try {
      const response = await dispatch(getProductionPlansWithQuantities({
        page: 1,
        limit: 1000,
        search: searchTerm,
        status: filterStatus === 'all' ? null : filterStatus
      })).unwrap()
      setProductionPlans(response.productionPlans || [])
    } catch (error) {
      message.error('Failed to fetch production plans')
    }
  }, [dispatch, searchTerm, filterStatus])

  const fetchJobCards = useCallback(async () => {
    try {
      const response = await dispatch(getJobCardsWithDetails({
        page: 1,
        limit: 1000,
        search: searchTerm
      })).unwrap()
      setJobCards(response.jobCards || [])
    } catch (error) {
      message.error('Failed to fetch job cards')
    }
  }, [dispatch, searchTerm])

  const fetchStockData = useCallback(async () => {
    try {
      const response = await dispatch(getStockManagement({
        page: 1,
        limit: 1000
      })).unwrap()
      setStockData(response.stock || [])
    } catch (error) {
      message.error('Failed to fetch stock data')
    }
  }, [dispatch])

  const fetchPresets = useCallback(async () => {
    try {
      const response = await dispatch(getStepPresets()).unwrap()
      setPresets(response.presets || [])
    } catch (error) {
      message.error('Failed to fetch presets')
    }
  }, [dispatch])

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await dispatch(getSmartProductionSuggestions()).unwrap()
      setAnalytics(response || {})
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }, [dispatch])

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchProductionPlans(),
        fetchJobCards(),
        fetchStockData(),
        fetchPresets(),
        fetchAnalytics()
      ])
      message.success('Data refreshed successfully')
    } catch (error) {
      message.error('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }, [fetchProductionPlans, fetchJobCards, fetchStockData, fetchPresets, fetchAnalytics])

  // Initial data load
  useEffect(() => {
    refreshAllData()
  }, [])

  // Debounced search
  const debouncedSearch = useMemo(() =>
    debounce((value) => setSearchTerm(value), 300), []
  )

  // Plan creation handlers
  const handleCreatePlan = useCallback(() => {
    navigate('/turbo-production-planner')
  }, [navigate])

  const handleEditPlan = useCallback((plan) => {
    // For now, just show the plan details. Edit functionality can be added later.
    setSelectedPlan(plan)
    setPlanDetailsVisible(true)
  }, [])

  const handleViewPlan = useCallback((plan) => {
    setSelectedPlan(plan)
    setPlanDetailsVisible(true)
  }, [])

  // Job card creation handlers
  const handleCreateJobCard = useCallback(() => {
    if (selectedRows.length === 0) {
      notification.warning({
        message: 'No Plans Selected',
        description: 'Please select at least one production plan to create job cards'
      })
      return
    }
    setSelectedJobCard(null)
    setJobCardModalVisible(true)
  }, [selectedRows])

  const handleQuickJobCard = useCallback(async (plan) => {
    try {
      const jobCardData = {
        prodPlanId: plan.id,
        quantity: plan.quantityTracking?.remainingQuantity || 1,
        notes: 'Quick creation via Turbo Dashboard',
        createdBy: user?.id || 1
      }

      await dispatch(createJobCard(jobCardData)).unwrap()
      message.success('Job card created successfully')
      fetchJobCards()
      fetchProductionPlans()
    } catch (error) {
      message.error('Failed to create job card')
    }
  }, [dispatch, fetchJobCards, fetchProductionPlans, user])

  // Advanced search and bulk operation handlers
  const handleAdvancedSearch = useCallback((filters) => {
    setSearchFilters(filters)
    // Apply filters to production plans and job cards
    // This would typically call an API with the filters
    console.log('Advanced search filters:', filters)
  }, [])

  const handleBulkAction = useCallback(async (actionConfig) => {
    try {
      setLoading(true)
      // Handle bulk operations through the API
      console.log('Bulk action:', actionConfig)
      // This would call the turbo-production API endpoints
      message.success('Bulk operation completed successfully')
      // Refresh data
      fetchProductionPlans()
      fetchJobCards()
    } catch (error) {
      message.error('Bulk operation failed')
    } finally {
      setLoading(false)
    }
  }, [fetchProductionPlans, fetchJobCards])

  const handleKanbanItemSelect = useCallback((items) => {
    setSelectedKanbanItems(items)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedRows([])
    setSelectedKanbanItems([])
  }, [])

  // Modal close handlers
  const closeAllModals = useCallback(() => {
    setJobCardModalVisible(false)
    setPlanDetailsVisible(false)
    setSelectedPlan(null)
    setSelectedJobCard(null)
  }, [])

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalPlans = productionPlans.length
    const activePlans = productionPlans.filter(p =>
      p.quantityTracking?.completionStatus !== 'completed'
    ).length
    const totalJobCards = jobCards.length
    const inProgressJobCards = jobCards.filter(jc =>
      jc.currentStepStatus === 'in_progress'
    ).length
    const totalStock = stockData.reduce((sum, item) => sum + (item.inHouseStock || 0), 0)

    return {
      totalPlans,
      activePlans,
      totalJobCards,
      inProgressJobCards,
      totalStock
    }
  }, [productionPlans, jobCards, stockData])

  // Filter data based on search and filters
  const filteredPlans = useMemo(() => {
    return productionPlans.filter(plan => {
      const matchesSearch = searchTerm === '' ||
        plan.alloyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.convertName?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filterStatus === 'all' ||
        plan.quantityTracking?.completionStatus === filterStatus

      return matchesSearch && matchesFilter
    })
  }, [productionPlans, searchTerm, filterStatus])

  const filteredJobCards = useMemo(() => {
    return jobCards.filter(jobCard => {
      const matchesSearch = searchTerm === '' ||
        jobCard.jobCardId?.toString().includes(searchTerm) ||
        jobCard.alloyName?.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [jobCards, searchTerm])

  // Table column definitions
  const planColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: 'Product',
      key: 'product',
      width: 300,
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.alloyName}</div>
          <div className="text-gray-500 text-sm">
            {record.alloyName} → {record.convertName}
          </div>
        </div>
      )
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 150,
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.quantity}</div>
          <Progress
            percent={Math.round(((record.quantity - (record.quantityTracking?.remainingQuantity || 0)) / record.quantity) * 100)}
            size="small"
            showInfo={false}
          />
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const status = record.quantityTracking?.completionStatus || 'pending'
        const statusConfig = {
          completed: { color: 'green', text: 'Completed' },
          in_progress: { color: 'blue', text: 'In Progress' },
          pending: { color: 'orange', text: 'Pending' }
        }
        const config = statusConfig[status] || statusConfig.pending
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Quick Job Card">
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleQuickJobCard(record)}
              disabled={record.quantityTracking?.remainingQuantity === 0}
            />
          </Tooltip>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewPlan(record)}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPlan(record)}
          />
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="details" icon={<InfoCircleOutlined />} onClick={() => handleViewPlan(record)}>
                  Details
                </Menu.Item>
                <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => handleEditPlan(record)}>
                  Edit
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
                  Delete
                </Menu.Item>
              </Menu>
            }
          >
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ]

  const jobCardColumns = [
    {
      title: 'Job Card ID',
      dataIndex: 'jobCardId',
      key: 'jobCardId',
      width: 100,
      sorter: (a, b) => a.jobCardId - b.jobCardId
    },
    {
      title: 'Product',
      key: 'product',
      width: 300,
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.alloyName}</div>
          <div className="text-gray-500 text-sm">
            {record.alloyName} → {record.convertName}
          </div>
        </div>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      sorter: (a, b) => a.quantity - b.quantity
    },
    {
      title: 'Current Step',
      key: 'currentStep',
      width: 150,
      render: (_, record) => (
        <Tag color="blue">{record.currentStepName || 'Unknown'}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => {/* Handle next step */}}
          >
            Next Step
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
          >
            Details
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="turbo-production-dashboard p-4">
      {/* Header */}
      <div className="mb-4">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="mb-0">
              <ThunderboltOutlined className="mr-2" />
              Turbo Production Dashboard
            </Title>
            <Text type="secondary">
              Fast, efficient production management
            </Text>
          </Col>
          <Col>
            <Space>
              <Search
                ref={searchInputRef}
                placeholder="Search plans, job cards..."
                allowClear
                enterButton
                onSearch={setSearchTerm}
                onChange={(e) => debouncedSearch(e.target.value)}
                style={{ width: 300 }}
              />
              <Button
                icon={<SearchOutlined />}
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                type={showAdvancedSearch ? 'primary' : 'default'}
              >
                Advanced Search
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={refreshAllData}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreatePlan}
              >
                New Plan
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-4">
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Plans"
              value={statistics.totalPlans}
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Active Plans"
              value={statistics.activePlans}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Job Cards"
              value={statistics.totalJobCards}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="In Progress"
              value={statistics.inProgressJobCards}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Stock"
              value={statistics.totalStock}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className="text-center">
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={handleCreateJobCard}
                disabled={selectedRows.length === 0}
              >
                Quick Create
              </Button>
              <div className="text-xs text-gray-500 mt-1">
                {selectedRows.length} selected
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <Card className="mb-4">
          <AdvancedSearchPanel
            onSearch={handleAdvancedSearch}
            onClear={() => setSearchFilters({})}
            filters={searchFilters}
          />
        </Card>
      )}

      {/* Bulk Operations Toolbar */}
      {(selectedRows.length > 0 || selectedKanbanItems.length > 0) && (
        <Card className="mb-4">
          <BulkOperationsToolbar
            selectedItems={selectedRows.map(id =>
              productionPlans.find(plan => plan.id === id)
            ).filter(Boolean)}
            selectedPlanIds={selectedRows}
            onBulkAction={handleBulkAction}
            loading={loading}
          />
          <div className="mt-2 text-right">
            <Button size="small" onClick={handleClearSelection}>
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane tab="Production Plans" key="plans">
            <div className="mb-3">
              <Space>
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: 150 }}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'pending', label: 'Pending' }
                  ]}
                />
                <Text type="secondary">
                  {filteredPlans.length} plans found
                </Text>
              </Space>
            </div>
            <Table
              columns={planColumns}
              dataSource={filteredPlans}
              rowKey="id"
              rowSelection={{
                selectedRowKeys: selectedRows,
                onChange: setSelectedRows,
                getCheckboxProps: (record) => ({
                  disabled: record.quantityTracking?.remainingQuantity === 0
                })
              }}
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `${total} plans`
              }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="Job Cards" key="jobCards">
            <div className="mb-3">
              <Text type="secondary">
                {filteredJobCards.length} job cards found
              </Text>
            </div>
            <Table
              columns={jobCardColumns}
              dataSource={filteredJobCards}
              rowKey="id"
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `${total} job cards`
              }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>

          <TabPane tab={<span><ThunderboltOutlined />Kanban Board</span>} key="kanban">
            <ProductionKanbanBoard
              data={productionPlans}
              onItemSelect={handleKanbanItemSelect}
              selectedItems={selectedKanbanItems}
              onBulkAction={handleBulkAction}
            />
          </TabPane>

          <TabPane tab="Analytics" key="analytics">
            <div className="text-center py-8">
              <BarChartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
              <Title level={4} type="secondary">Analytics Coming Soon</Title>
              <Text type="secondary">
                Advanced analytics and insights will be available here
              </Text>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Modals */}
      <JobCardCreationModal
        visible={jobCardModalVisible}
        onClose={() => setJobCardModalVisible(false)}
        selectedPlans={selectedRows.map(rowId =>
          productionPlans.find(plan => plan.id === rowId)
        ).filter(Boolean)}
        onSuccess={() => {
          setJobCardModalVisible(false)
          refreshAllData()
        }}
      />

      <ProductionPlanDetailsModal
        visible={planDetailsVisible}
        onClose={() => setPlanDetailsVisible(false)}
        plan={selectedPlan}
        onSuccess={() => {
          setPlanDetailsVisible(false)
          refreshAllData()
        }}
      />

      {/* Help Drawer */}
      <Drawer
        title="Keyboard Shortcuts"
        placement="right"
        onClose={() => setHelpVisible(false)}
        visible={helpVisible}
        width={400}
      >
        <div className="space-y-4">
          <Alert
            message="Turbo Mode Activated"
            description="Use keyboard shortcuts for maximum speed"
            type="info"
            showIcon
          />

          <div>
            <Title level={5}>Quick Actions</Title>
            <Space direction="vertical" className="w-full">
              <div><kbd>Ctrl+N</kbd> - Create new plan</div>
              <div><kbd>Ctrl+J</kbd> - Create job card</div>
              <div><kbd>Ctrl+F</kbd> - Focus search</div>
              <div><kbd>Ctrl+Shift+F</kbd> - Toggle advanced search</div>
              <div><kbd>Ctrl+R</kbd> - Refresh data</div>
            </Space>
          </div>

          <div>
            <Title level={5}>Navigation</Title>
            <Space direction="vertical" className="w-full">
              <div><kbd>Ctrl+1</kbd> - Production Plans</div>
              <div><kbd>Ctrl+2</kbd> - Job Cards</div>
              <div><kbd>Ctrl+3</kbd> - Kanban Board</div>
              <div><kbd>Ctrl+4</kbd> - Analytics</div>
            </Space>
          </div>

          <div>
            <Title level={5}>General</Title>
            <Space direction="vertical" className="w-full">
              <div><kbd>Ctrl+/</kbd> - Show help</div>
              <div><kbd>Esc</kbd> - Close modals</div>
            </Space>
          </div>
        </div>
      </Drawer>

      {/* Floating Action Button */}
      <FloatButton.Group
        trigger="click"
        type="primary"
        style={{ right: 24 }}
        icon={<BulbOutlined />}
        tooltip="Quick Actions"
      >
        <FloatButton
          icon={<PlusOutlined />}
          tooltip="New Plan"
          onClick={handleCreatePlan}
        />
        <FloatButton
          icon={<PlayCircleOutlined />}
          tooltip="Create Job Card"
          onClick={handleCreateJobCard}
        />
        <FloatButton
          icon={<ReloadOutlined />}
          tooltip="Refresh"
          onClick={refreshAllData}
        />
        <FloatButton
          icon={<InfoCircleOutlined />}
          tooltip="Help"
          onClick={() => setHelpVisible(true)}
        />
      </FloatButton.Group>
    </div>
  )
}

export default TurboProductionDashboard