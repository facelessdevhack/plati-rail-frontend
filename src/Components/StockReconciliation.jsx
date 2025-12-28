import React, { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Card,
  Button,
  DatePicker,
  Select,
  Space,
  Tag,
  Modal,
  Row,
  Col,
  Typography,
  Divider,
  Alert,
  Tabs,
  Statistic,
  Timeline,
  Tooltip,
  message,
  Spin,
  Empty,
  Badge,
  Descriptions
} from 'antd'
import {
  ReloadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  CameraOutlined,
  HistoryOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  FileSearchOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CheckOutlined,
  SearchOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { client } from '../Utils/axiosClient'

dayjs.extend(relativeTime)

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text } = Typography
const { TabPane } = Tabs

const StockReconciliation = () => {
  // State for discrepancies
  const [loading, setLoading] = useState(false)
  const [discrepancies, setDiscrepancies] = useState([])
  const [discrepancyPagination, setDiscrepancyPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [discrepancyFilters, setDiscrepancyFilters] = useState({
    status: '',
    severity: '',
    dateRange: null
  })

  // State for runs history
  const [runs, setRuns] = useState([])
  const [runsLoading, setRunsLoading] = useState(false)
  const [runsPagination, setRunsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // State for details modal
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [discrepancyDetails, setDiscrepancyDetails] = useState(null)

  // State for actions
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [snapshotLoading, setSnapshotLoading] = useState(false)

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    detected: 0,
    investigating: 0,
    resolved: 0,
    critical: 0
  })

  // Fetch discrepancies
  const fetchDiscrepancies = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page,
        limit: pageSize
      })

      if (discrepancyFilters.status) {
        params.append('status', discrepancyFilters.status)
      }
      if (discrepancyFilters.severity) {
        params.append('severity', discrepancyFilters.severity)
      }
      if (discrepancyFilters.dateRange && discrepancyFilters.dateRange[0]) {
        params.append('startDate', discrepancyFilters.dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', discrepancyFilters.dateRange[1].format('YYYY-MM-DD'))
      }

      const response = await client.get(`/stock-reconciliation/discrepancies?${params}`)

      if (response.data.success) {
        setDiscrepancies(response.data.data.discrepancies || [])
        setDiscrepancyPagination({
          current: page,
          pageSize,
          total: response.data.data.pagination?.total || 0
        })

        // Calculate summary stats
        const stats = {
          total: response.data.data.pagination?.total || 0,
          detected: 0,
          investigating: 0,
          resolved: 0,
          critical: 0
        }

        ;(response.data.data.discrepancies || []).forEach(d => {
          if (d.status === 'detected') stats.detected++
          if (d.status === 'investigating') stats.investigating++
          if (d.status === 'resolved') stats.resolved++
          if (d.severity === 'critical') stats.critical++
        })

        setSummaryStats(stats)
      }
    } catch (error) {
      console.error('Error fetching discrepancies:', error)
      message.error('Failed to fetch discrepancies')
    } finally {
      setLoading(false)
    }
  }, [discrepancyFilters])

  // Fetch reconciliation runs
  const fetchRuns = useCallback(async (page = 1, pageSize = 10) => {
    setRunsLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: pageSize })
      const response = await client.get(`/stock-reconciliation/runs?${params}`)

      if (response.data.success) {
        setRuns(response.data.data.runs || [])
        setRunsPagination({
          current: page,
          pageSize,
          total: response.data.data.pagination?.total || 0
        })
      }
    } catch (error) {
      console.error('Error fetching runs:', error)
      message.error('Failed to fetch reconciliation history')
    } finally {
      setRunsLoading(false)
    }
  }, [])

  // Fetch discrepancy details
  const fetchDiscrepancyDetails = async (discrepancyId) => {
    setDetailsLoading(true)
    try {
      const response = await client.get(`/stock-reconciliation/discrepancies/${discrepancyId}`)

      if (response.data.success) {
        setDiscrepancyDetails(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching details:', error)
      message.error('Failed to fetch discrepancy details')
    } finally {
      setDetailsLoading(false)
    }
  }

  // Trigger manual reconciliation
  const triggerReconciliation = async () => {
    setTriggerLoading(true)
    try {
      const response = await client.post('/stock-reconciliation/trigger', {
        mode: 'snapshot_to_current'
      })

      if (response.data.success) {
        message.success(`Reconciliation completed! Found ${response.data.data.productsWithDiscrepancies} products with discrepancies.`)
        fetchDiscrepancies()
        fetchRuns()
      }
    } catch (error) {
      console.error('Error triggering reconciliation:', error)
      message.error(error.response?.data?.message || 'Failed to trigger reconciliation')
    } finally {
      setTriggerLoading(false)
    }
  }

  // Create snapshots
  const createSnapshots = async () => {
    setSnapshotLoading(true)
    try {
      const response = await client.post('/stock-reconciliation/snapshots')

      if (response.data.success) {
        message.success(response.data.data.message || 'Snapshots created successfully!')
      }
    } catch (error) {
      console.error('Error creating snapshots:', error)
      message.error(error.response?.data?.message || 'Failed to create snapshots')
    } finally {
      setSnapshotLoading(false)
    }
  }

  // Update discrepancy status
  const updateDiscrepancyStatus = async (id, newStatus) => {
    try {
      const response = await client.patch(`/stock-reconciliation/discrepancies/${id}`, {
        status: newStatus
      })

      if (response.data.success) {
        message.success(`Status updated to ${newStatus}`)
        fetchDiscrepancies(discrepancyPagination.current, discrepancyPagination.pageSize)

        if (detailsModalVisible && selectedDiscrepancy?.id === id) {
          setDiscrepancyDetails(prev => prev ? { ...prev, discrepancy: { ...prev.discrepancy, status: newStatus } } : null)
        }
      }
    } catch (error) {
      console.error('Error updating status:', error)
      message.error('Failed to update status')
    }
  }

  // View discrepancy details
  const viewDetails = (record) => {
    setSelectedDiscrepancy(record)
    setDetailsModalVisible(true)
    fetchDiscrepancyDetails(record.id)
  }

  // Format helpers
  const formatDate = (dateString) => dayjs(dateString).format('DD MMM YYYY')
  const formatDateTime = (dateString) => dayjs(dateString).format('DD MMM YYYY HH:mm')
  const formatRelativeTime = (dateString) => dayjs(dateString).fromNow()

  // Get severity color and icon
  const getSeverityConfig = (severity) => {
    const configs = {
      critical: { color: 'red', icon: <CloseCircleOutlined />, text: 'Critical' },
      high: { color: 'orange', icon: <WarningOutlined />, text: 'High' },
      medium: { color: 'gold', icon: <ExclamationCircleOutlined />, text: 'Medium' },
      low: { color: 'blue', icon: <MinusOutlined />, text: 'Low' }
    }
    return configs[severity] || configs.low
  }

  // Get status color and icon
  const getStatusConfig = (status) => {
    const configs = {
      detected: { color: 'error', icon: <ExclamationCircleOutlined />, text: 'Detected' },
      investigating: { color: 'processing', icon: <SearchOutlined />, text: 'Investigating' },
      resolved: { color: 'success', icon: <CheckCircleOutlined />, text: 'Resolved' },
      ignored: { color: 'default', icon: <MinusOutlined />, text: 'Ignored' }
    }
    return configs[status] || configs.detected
  }

  // Get run status config
  const getRunStatusConfig = (status) => {
    const configs = {
      running: { color: 'processing', icon: <SyncOutlined spin />, text: 'Running' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: 'Failed' }
    }
    return configs[status] || configs.running
  }

  // Get movement type icon
  const getMovementIcon = (type) => {
    switch (type) {
      case 'production_dispatch':
        return <ArrowUpOutlined style={{ color: '#52c41a' }} />
      case 'sales_entry':
        return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
      case 'adjustment':
        return <SyncOutlined style={{ color: '#1890ff' }} />
      case 'snapshot':
        return <CameraOutlined style={{ color: '#722ed1' }} />
      default:
        return <MinusOutlined />
    }
  }

  // Discrepancies table columns
  const discrepancyColumns = [
    {
      title: 'Product',
      key: 'product',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.productName || `Product #${record.productId}`}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.size || 'N/A'} | {record.brand || 'N/A'}
          </Text>
        </div>
      )
    },
    {
      title: 'Snapshot Date',
      dataIndex: 'snapshotDate',
      key: 'snapshotDate',
      width: 120,
      render: date => date ? formatDate(date) : '-'
    },
    {
      title: 'Starting Stock',
      dataIndex: 'startInHouseStock',
      key: 'startInHouseStock',
      width: 100,
      align: 'right',
      render: val => val?.toLocaleString() || '0'
    },
    {
      title: 'Expected',
      dataIndex: 'expectedInHouseStock',
      key: 'expectedInHouseStock',
      width: 100,
      align: 'right',
      render: val => val?.toLocaleString() || '0'
    },
    {
      title: 'Actual',
      dataIndex: 'actualInHouseStock',
      key: 'actualInHouseStock',
      width: 100,
      align: 'right',
      render: val => val?.toLocaleString() || '0'
    },
    {
      title: 'Discrepancy',
      dataIndex: 'inHouseDiscrepancy',
      key: 'inHouseDiscrepancy',
      width: 120,
      align: 'right',
      render: (val) => {
        const isPositive = val > 0
        const isNegative = val < 0
        return (
          <Text strong style={{ color: isNegative ? '#ff4d4f' : isPositive ? '#52c41a' : 'inherit' }}>
            {isPositive ? '+' : ''}{val?.toLocaleString() || '0'}
          </Text>
        )
      }
    },
    {
      title: 'Movements',
      key: 'movements',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '11px' }}>
            <ArrowUpOutlined style={{ color: '#52c41a' }} /> Prod: +{record.totalProductionIn || 0}
          </Text>
          <Text style={{ fontSize: '11px' }}>
            <ArrowDownOutlined style={{ color: '#ff4d4f' }} /> Sales: -{record.totalSalesOut || 0}
          </Text>
          <Text style={{ fontSize: '11px' }}>
            <SyncOutlined style={{ color: '#1890ff' }} /> Adj: {record.totalAdjustments || 0}
          </Text>
        </Space>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: severity => {
        const config = getSeverityConfig(severity)
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        const config = getStatusConfig(status)
        return (
          <Select
            value={status}
            size="small"
            style={{ width: '100%' }}
            onChange={(val) => updateDiscrepancyStatus(record.id, val)}
          >
            <Option value="detected">
              <Badge status="error" /> Detected
            </Option>
            <Option value="investigating">
              <Badge status="processing" /> Investigating
            </Option>
            <Option value="resolved">
              <Badge status="success" /> Resolved
            </Option>
            <Option value="ignored">
              <Badge status="default" /> Ignored
            </Option>
          </Select>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewDetails(record)}
        >
          Details
        </Button>
      )
    }
  ]

  // Runs history table columns
  const runsColumns = [
    {
      title: 'Run Date',
      dataIndex: 'runDate',
      key: 'runDate',
      width: 120,
      render: date => formatDate(date)
    },
    {
      title: 'Type',
      dataIndex: 'runType',
      key: 'runType',
      width: 100,
      render: type => (
        <Tag color={type === 'daily_cron' ? 'blue' : 'purple'}>
          {type === 'daily_cron' ? 'Scheduled' : 'Manual'}
        </Tag>
      )
    },
    {
      title: 'Mode',
      dataIndex: 'reconciliationMode',
      key: 'reconciliationMode',
      width: 150,
      render: mode => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {mode === 'snapshot_to_current' ? 'Snapshot → Current' : 'Snapshot → Snapshot'}
        </Text>
      )
    },
    {
      title: 'Date Range',
      key: 'dateRange',
      width: 180,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {formatDate(record.startDate)} → {formatDate(record.endDate)}
        </Text>
      )
    },
    {
      title: 'Products Checked',
      dataIndex: 'totalProductsChecked',
      key: 'totalProductsChecked',
      width: 120,
      align: 'right'
    },
    {
      title: 'Discrepancies',
      dataIndex: 'productsWithDiscrepancies',
      key: 'productsWithDiscrepancies',
      width: 120,
      align: 'right',
      render: val => (
        <Text type={val > 0 ? 'danger' : 'success'} strong>
          {val}
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: status => {
        const config = getRunStatusConfig(status)
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 100,
      render: (_, record) => {
        if (record.startedAt && record.completedAt) {
          const duration = dayjs(record.completedAt).diff(dayjs(record.startedAt), 'second')
          return `${duration}s`
        }
        return '-'
      }
    },
    {
      title: 'Started',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 150,
      render: date => (
        <Tooltip title={formatDateTime(date)}>
          {formatRelativeTime(date)}
        </Tooltip>
      )
    }
  ]

  // Initial load
  useEffect(() => {
    fetchDiscrepancies()
    fetchRuns()
  }, [fetchDiscrepancies, fetchRuns])

  // Refetch when filters change
  useEffect(() => {
    fetchDiscrepancies(1, discrepancyPagination.pageSize)
  }, [discrepancyFilters])

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <FileSearchOutlined style={{ marginRight: '12px' }} />
            Stock Reconciliation
          </Title>
          <Text type="secondary">
            Automated daily stock verification and discrepancy tracking
          </Text>
        </div>
        <Space>
          <Tooltip title="Create manual snapshots of current stock levels">
            <Button
              icon={<CameraOutlined />}
              onClick={createSnapshots}
              loading={snapshotLoading}
            >
              Create Snapshots
            </Button>
          </Tooltip>
          <Tooltip title="Run reconciliation comparing yesterday's snapshot to current stock">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={triggerReconciliation}
              loading={triggerLoading}
            >
              Run Reconciliation
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Total Discrepancies"
              value={summaryStats.total}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Detected"
              value={summaryStats.detected}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Investigating"
              value={summaryStats.investigating}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SearchOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Resolved"
              value={summaryStats.resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Critical"
              value={summaryStats.critical}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Last Run"
              value={runs[0] ? formatRelativeTime(runs[0].startedAt) : 'Never'}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs defaultActiveKey="discrepancies">
          <TabPane
            tab={
              <span>
                <ExclamationCircleOutlined />
                Discrepancies
                {summaryStats.detected > 0 && (
                  <Badge count={summaryStats.detected} style={{ marginLeft: 8 }} />
                )}
              </span>
            }
            key="discrepancies"
          >
            {/* Filters */}
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={6}>
                <Select
                  placeholder="Filter by Status"
                  allowClear
                  style={{ width: '100%' }}
                  value={discrepancyFilters.status || undefined}
                  onChange={val => setDiscrepancyFilters(prev => ({ ...prev, status: val || '' }))}
                >
                  <Option value="detected">Detected</Option>
                  <Option value="investigating">Investigating</Option>
                  <Option value="resolved">Resolved</Option>
                  <Option value="ignored">Ignored</Option>
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Filter by Severity"
                  allowClear
                  style={{ width: '100%' }}
                  value={discrepancyFilters.severity || undefined}
                  onChange={val => setDiscrepancyFilters(prev => ({ ...prev, severity: val || '' }))}
                >
                  <Option value="critical">Critical</Option>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Col>
              <Col span={8}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={discrepancyFilters.dateRange}
                  onChange={val => setDiscrepancyFilters(prev => ({ ...prev, dateRange: val }))}
                />
              </Col>
              <Col span={4}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchDiscrepancies(1, discrepancyPagination.pageSize)}
                >
                  Refresh
                </Button>
              </Col>
            </Row>

            {/* Discrepancies Table */}
            <Table
              columns={discrepancyColumns}
              dataSource={discrepancies}
              rowKey="id"
              loading={loading}
              pagination={{
                ...discrepancyPagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} discrepancies`
              }}
              onChange={(pagination) => {
                fetchDiscrepancies(pagination.current, pagination.pageSize)
              }}
              scroll={{ x: 1400 }}
              size="small"
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                Run History
              </span>
            }
            key="history"
          >
            <Table
              columns={runsColumns}
              dataSource={runs}
              rowKey="id"
              loading={runsLoading}
              pagination={{
                ...runsPagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} runs`
              }}
              onChange={(pagination) => {
                fetchRuns(pagination.current, pagination.pageSize)
              }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <FileSearchOutlined />
            Discrepancy Details
            {selectedDiscrepancy && (
              <Tag color={getSeverityConfig(selectedDiscrepancy.severity).color}>
                {getSeverityConfig(selectedDiscrepancy.severity).text}
              </Tag>
            )}
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false)
          setSelectedDiscrepancy(null)
          setDiscrepancyDetails(null)
        }}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          discrepancyDetails?.discrepancy?.status !== 'resolved' && (
            <Button
              key="resolve"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => {
                updateDiscrepancyStatus(selectedDiscrepancy.id, 'resolved')
              }}
            >
              Mark Resolved
            </Button>
          )
        ]}
        width={900}
      >
        {detailsLoading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Spin size="large" />
          </div>
        ) : discrepancyDetails ? (
          <div>
            {/* Product Info */}
            <Descriptions
              title="Product Information"
              bordered
              size="small"
              column={2}
              style={{ marginBottom: '24px' }}
            >
              <Descriptions.Item label="Product ID">
                {discrepancyDetails.discrepancy?.productId}
              </Descriptions.Item>
              <Descriptions.Item label="Product Name">
                {discrepancyDetails.discrepancy?.productName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Size">
                {discrepancyDetails.discrepancy?.size || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Brand">
                {discrepancyDetails.discrepancy?.brand || '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Stock Comparison */}
            <Title level={5}>Stock Comparison</Title>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Starting Stock"
                    value={discrepancyDetails.discrepancy?.startInHouseStock || 0}
                    prefix={<CameraOutlined />}
                  />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    Snapshot: {discrepancyDetails.discrepancy?.snapshotDate ? formatDate(discrepancyDetails.discrepancy.snapshotDate) : '-'}
                  </Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Expected Stock"
                    value={discrepancyDetails.discrepancy?.expectedInHouseStock || 0}
                    prefix={<SyncOutlined />}
                  />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    After movements
                  </Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Actual Stock"
                    value={discrepancyDetails.discrepancy?.actualInHouseStock || 0}
                    prefix={<CheckCircleOutlined />}
                  />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    Current in system
                  </Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card
                  size="small"
                  style={{
                    textAlign: 'center',
                    backgroundColor: discrepancyDetails.discrepancy?.inHouseDiscrepancy !== 0 ? '#fff2f0' : '#f6ffed'
                  }}
                >
                  <Statistic
                    title="Discrepancy"
                    value={discrepancyDetails.discrepancy?.inHouseDiscrepancy || 0}
                    valueStyle={{
                      color: discrepancyDetails.discrepancy?.inHouseDiscrepancy < 0 ? '#ff4d4f' :
                             discrepancyDetails.discrepancy?.inHouseDiscrepancy > 0 ? '#52c41a' : 'inherit'
                    }}
                    prefix={discrepancyDetails.discrepancy?.inHouseDiscrepancy < 0 ? <ArrowDownOutlined /> :
                            discrepancyDetails.discrepancy?.inHouseDiscrepancy > 0 ? <ArrowUpOutlined /> : <MinusOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Movement Summary */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Alert
                  message={`Production In: +${discrepancyDetails.discrepancy?.totalProductionIn || 0}`}
                  type="success"
                  icon={<ArrowUpOutlined />}
                  showIcon
                />
              </Col>
              <Col span={8}>
                <Alert
                  message={`Sales Out: -${discrepancyDetails.discrepancy?.totalSalesOut || 0}`}
                  type="error"
                  icon={<ArrowDownOutlined />}
                  showIcon
                />
              </Col>
              <Col span={8}>
                <Alert
                  message={`Adjustments: ${discrepancyDetails.discrepancy?.totalAdjustments || 0}`}
                  type="info"
                  icon={<SyncOutlined />}
                  showIcon
                />
              </Col>
            </Row>

            <Divider />

            {/* Movement Timeline */}
            <Title level={5}>Movement Breakdown</Title>
            {discrepancyDetails.movements && discrepancyDetails.movements.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Timeline>
                  {discrepancyDetails.movements.map((movement, index) => (
                    <Timeline.Item
                      key={index}
                      dot={getMovementIcon(movement.movementType)}
                    >
                      <div>
                        <Text strong>
                          {movement.movementType === 'production_dispatch' && 'Production Dispatch'}
                          {movement.movementType === 'sales_entry' && 'Sales Entry'}
                          {movement.movementType === 'adjustment' && 'Manual Adjustment'}
                          {movement.movementType === 'snapshot' && 'Snapshot'}
                        </Text>
                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                          {formatDateTime(movement.movementDate)}
                        </Text>
                      </div>
                      <div>
                        <Text
                          style={{
                            color: movement.inHouseChange > 0 ? '#52c41a' :
                                   movement.inHouseChange < 0 ? '#ff4d4f' : 'inherit'
                          }}
                        >
                          {movement.inHouseChange > 0 ? '+' : ''}{movement.inHouseChange}
                        </Text>
                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                          Running total: {movement.runningInHouseTotal}
                        </Text>
                      </div>
                      {movement.description && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {movement.description}
                        </Text>
                      )}
                      {movement.movementSourceTable && (
                        <div>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Source: {movement.movementSourceTable} #{movement.movementSourceId}
                          </Text>
                        </div>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            ) : (
              <Empty description="No movement details available" />
            )}

            {/* Notes */}
            {discrepancyDetails.discrepancy?.notes && (
              <>
                <Divider />
                <Title level={5}>Notes</Title>
                <Text>{discrepancyDetails.discrepancy.notes}</Text>
              </>
            )}

            {discrepancyDetails.discrepancy?.resolutionNotes && (
              <>
                <Divider />
                <Title level={5}>Resolution Notes</Title>
                <Text>{discrepancyDetails.discrepancy.resolutionNotes}</Text>
              </>
            )}
          </div>
        ) : (
          <Empty description="Failed to load details" />
        )}
      </Modal>
    </div>
  )
}

export default StockReconciliation
