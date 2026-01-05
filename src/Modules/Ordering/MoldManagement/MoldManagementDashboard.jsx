import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Tooltip,
  Modal,
  message,
  Row,
  Col,
  Statistic,
  Typography,
  Badge,
  Progress,
  Dropdown,
  Menu,
  Tabs,
  Alert
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ToolOutlined,
  SendOutlined,
  ImportOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  SettingOutlined,
  DownOutlined,
  FileExcelOutlined,
  HistoryOutlined,
  AlertOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  getMolds,
  getMoldById,
  deleteMold,
  getMoldDashboard,
  getMoldAlerts,
  getVendors,
  getInchesMaster,
  getModelMaster
} from '../../../redux/api/moldManagementAPI'
import {
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMold,
  toggleCreateModal,
  toggleDetailsModal,
  toggleDispatchModal,
  toggleReceiveModal,
  clearError
} from '../../../redux/slices/moldManagement.slice'
import MoldCreateModal from './MoldCreateModal'
import MoldDetailsModal from './MoldDetailsModal'
import MoldDispatchModal from './MoldDispatchModal'
import MoldReceiveModal from './MoldReceiveModal'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input
const { TabPane } = Tabs

const MoldManagementDashboard = () => {
  const dispatch = useDispatch()

  // Redux state
  const {
    molds,
    totalMolds,
    currentPage,
    pageSize,
    loading,
    error,
    dashboard,
    alerts,
    unreadAlertsCount,
    vendors,
    filters,
    showCreateModal,
    showDetailsModal,
    showDispatchModal,
    showReceiveModal,
    selectedMold
  } = useSelector((state) => state.moldManagement)

  // Local state
  const [activeTab, setActiveTab] = useState('all')

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [currentPage, pageSize, filters])

  useEffect(() => {
    if (error) {
      message.error(error.message || 'An error occurred')
      dispatch(clearError())
    }
  }, [error, dispatch])

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(
          getMolds({
            page: currentPage,
            limit: pageSize,
            search: filters.search,
            status: filters.status,
            vendorId: filters.vendorId
          })
        ).unwrap(),
        dispatch(getMoldDashboard()).unwrap(),
        dispatch(getMoldAlerts({ isResolved: false })).unwrap(),
        dispatch(getVendors()).unwrap(),
        dispatch(getInchesMaster()).unwrap(),
        dispatch(getModelMaster()).unwrap()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleRefresh = () => {
    loadData()
    message.success('Data refreshed')
  }

  const handleSearch = (value) => {
    dispatch(setFilters({ search: value }))
    dispatch(setCurrentPage(1))
  }

  const handleStatusFilter = (value) => {
    dispatch(setFilters({ status: value }))
    dispatch(setCurrentPage(1))
  }

  const handleVendorFilter = (value) => {
    dispatch(setFilters({ vendorId: value }))
    dispatch(setCurrentPage(1))
  }

  const handleClearFilters = () => {
    dispatch(clearFilters())
    dispatch(setCurrentPage(1))
  }

  const handleTableChange = (pagination) => {
    dispatch(setCurrentPage(pagination.current))
    dispatch(setPageSize(pagination.pageSize))
  }

  const handleViewMold = async (mold) => {
    try {
      await dispatch(getMoldById(mold.id)).unwrap()
      dispatch(toggleDetailsModal())
    } catch (error) {
      message.error('Failed to load mold details')
    }
  }

  const handleEditMold = (mold) => {
    dispatch(setSelectedMold(mold))
    dispatch(toggleCreateModal())
  }

  const handleDeleteMold = (mold) => {
    Modal.confirm({
      title: 'Delete Mold',
      content: `Are you sure you want to delete mold "${mold.moldCode}"? This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await dispatch(deleteMold(mold.id)).unwrap()
          message.success('Mold deleted successfully')
          loadData()
        } catch (error) {
          message.error('Failed to delete mold')
        }
      }
    })
  }

  const handleDispatchMold = (mold) => {
    dispatch(setSelectedMold(mold))
    dispatch(toggleDispatchModal())
  }

  const handleReceiveMold = (mold) => {
    dispatch(setSelectedMold(mold))
    dispatch(toggleReceiveModal())
  }

  const handleCreateSuccess = () => {
    dispatch(toggleCreateModal())
    loadData()
    message.success('Mold saved successfully')
  }

  const handleDispatchSuccess = () => {
    dispatch(toggleDispatchModal())
    loadData()
    message.success('Mold dispatched successfully')
  }

  const handleReceiveSuccess = () => {
    dispatch(toggleReceiveModal())
    loadData()
    message.success('Mold received successfully')
  }

  const getStatusColor = (status) => {
    const colors = {
      in_house: 'green',
      with_vendor: 'blue',
      under_maintenance: 'orange',
      retired: 'gray',
      damaged: 'red'
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      in_house: 'In House',
      with_vendor: 'With Vendor',
      under_maintenance: 'Under Maintenance',
      retired: 'Retired',
      damaged: 'Damaged'
    }
    return labels[status] || status
  }

  const getConditionColor = (condition) => {
    const colors = {
      excellent: 'green',
      good: 'blue',
      fair: 'orange',
      needs_repair: 'volcano',
      damaged: 'red'
    }
    return colors[condition] || 'default'
  }

  const getLifeProgressColor = (percentage) => {
    if (percentage > 60) return '#52c41a'
    if (percentage > 30) return '#faad14'
    return '#ff4d4f'
  }

  const getActionMenu = (record) => (
    <Menu>
      <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => handleViewMold(record)}>
        View Details
      </Menu.Item>
      <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => handleEditMold(record)}>
        Edit Mold
      </Menu.Item>
      <Menu.Divider />
      {record.status === 'in_house' && (
        <Menu.Item
          key="dispatch"
          icon={<SendOutlined />}
          onClick={() => handleDispatchMold(record)}
        >
          Dispatch to Vendor
        </Menu.Item>
      )}
      {record.status === 'with_vendor' && (
        <Menu.Item
          key="receive"
          icon={<ImportOutlined />}
          onClick={() => handleReceiveMold(record)}
        >
          Receive from Vendor
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDeleteMold(record)}
      >
        Delete Mold
      </Menu.Item>
    </Menu>
  )

  const columns = [
    {
      title: 'Mold Code',
      dataIndex: 'moldCode',
      key: 'moldCode',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.modelName && (
            <>
              <br />
              <Text type="secondary" className="text-xs">
                {record.modelName}
              </Text>
            </>
          )}
        </div>
      ),
      sorter: true
    },
    {
      title: 'Type / Size',
      key: 'typeSize',
      render: (_, record) => (
        <div>
          <Tag color="purple">{record.moldType?.replace('_', ' ').toUpperCase() || 'N/A'}</Tag>
          {record.size && (
            <>
              <br />
              <Text type="secondary">{record.size}"</Text>
            </>
          )}
        </div>
      )
    },
    {
      title: 'Life Remaining',
      key: 'life',
      render: (_, record) => (
        <div style={{ width: 120 }}>
          <Progress
            percent={record.lifePercentage || 0}
            size="small"
            strokeColor={getLifeProgressColor(record.lifePercentage)}
            format={(percent) => `${percent?.toFixed(0)}%`}
          />
          <Text type="secondary" className="text-xs">
            {record.remainingLifeCycles || 0} / {record.totalLifeCycles || 0} cycles
          </Text>
        </div>
      ),
      sorter: true
    },
    {
      title: 'Total Produced',
      dataIndex: 'totalProducedQuantity',
      key: 'totalProducedQuantity',
      render: (qty) => (
        <Text strong className="text-blue-600">
          {(qty || 0).toLocaleString()}
        </Text>
      ),
      align: 'center',
      sorter: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>,
      filters: [
        { text: 'In House', value: 'in_house' },
        { text: 'With Vendor', value: 'with_vendor' },
        { text: 'Under Maintenance', value: 'under_maintenance' },
        { text: 'Retired', value: 'retired' },
        { text: 'Damaged', value: 'damaged' }
      ]
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition) => (
        <Tag color={getConditionColor(condition)}>
          {condition?.replace('_', ' ').toUpperCase() || 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Current Vendor',
      key: 'vendor',
      render: (_, record) => (
        <div>
          {record.currentVendorId ? (
            <>
              <ShopOutlined className="mr-1" />
              <Text>{record.vendorName || 'Unknown Vendor'}</Text>
              {record.dispatchedToVendorAt && (
                <>
                  <br />
                  <Text type="secondary" className="text-xs">
                    Since: {new Date(record.dispatchedToVendorAt).toLocaleDateString()}
                  </Text>
                </>
              )}
            </>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown overlay={getActionMenu(record)} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<SettingOutlined />} onClick={(e) => e.preventDefault()} />
        </Dropdown>
      )
    }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="mb-0">
              <ToolOutlined className="mr-2" />
              Mold Management
            </Title>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                Refresh
              </Button>
              <Button icon={<FileExcelOutlined />}>Export</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  dispatch(setSelectedMold(null))
                  dispatch(toggleCreateModal())
                }}
              >
                Add Mold
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Alerts Banner */}
      {unreadAlertsCount > 0 && (
        <Alert
          message={
            <span>
              <AlertOutlined className="mr-2" />
              You have {unreadAlertsCount} unread alert{unreadAlertsCount > 1 ? 's' : ''} requiring
              attention
            </span>
          }
          type="warning"
          showIcon
          closable
          className="mb-4"
          action={
            <Button size="small" type="link">
              View Alerts
            </Button>
          }
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Molds"
              value={dashboard.totalMolds || totalMolds}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="In House"
              value={dashboard.moldsInHouse || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="With Vendors"
              value={dashboard.moldsWithVendors || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Under Maintenance"
              value={dashboard.moldsUnderMaintenance || 0}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Critical Life"
              value={dashboard.criticalLifeMolds || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Produced"
              value={dashboard.totalProductionQuantity || 0}
              valueStyle={{ color: '#722ed1' }}
              suffix="units"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search by mold code or name..."
              value={filters.search}
              onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
              onSearch={handleSearch}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Filter by Status"
              value={filters.status || undefined}
              onChange={handleStatusFilter}
              style={{ width: 180 }}
              allowClear
            >
              <Option value="in_house">In House</Option>
              <Option value="with_vendor">With Vendor</Option>
              <Option value="under_maintenance">Under Maintenance</Option>
              <Option value="retired">Retired</Option>
              <Option value="damaged">Damaged</Option>
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Filter by Vendor"
              value={filters.vendorId || undefined}
              onChange={handleVendorFilter}
              style={{ width: 200 }}
              allowClear
            >
              {vendors.map((vendor) => (
                <Option key={vendor.id} value={vendor.id}>
                  {vendor.vendorName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button onClick={handleClearFilters}>Clear Filters</Button>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <ToolOutlined /> All Molds
              </span>
            }
            key="all"
          />
          <TabPane
            tab={
              <span>
                <CheckCircleOutlined /> In House
              </span>
            }
            key="in_house"
          />
          <TabPane
            tab={
              <span>
                <ShopOutlined /> With Vendors
              </span>
            }
            key="with_vendor"
          />
          <TabPane
            tab={
              <span>
                <WarningOutlined /> Low Life
              </span>
            }
            key="low_life"
          />
          <TabPane
            tab={
              <span>
                <HistoryOutlined /> History
              </span>
            }
            key="history"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={molds}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalMolds,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} molds`
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modals */}
      <MoldCreateModal
        visible={showCreateModal}
        onClose={() => dispatch(toggleCreateModal())}
        onSuccess={handleCreateSuccess}
        editMold={selectedMold}
      />

      <MoldDetailsModal
        visible={showDetailsModal}
        onClose={() => dispatch(toggleDetailsModal())}
        mold={selectedMold}
      />

      <MoldDispatchModal
        visible={showDispatchModal}
        onClose={() => dispatch(toggleDispatchModal())}
        onSuccess={handleDispatchSuccess}
        mold={selectedMold}
        vendors={vendors}
      />

      <MoldReceiveModal
        visible={showReceiveModal}
        onClose={() => dispatch(toggleReceiveModal())}
        onSuccess={handleReceiveSuccess}
        mold={selectedMold}
      />
    </div>
  )
}

export default MoldManagementDashboard
