import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  message,
  Badge,
  Progress,
  Modal,
  InputNumber,
  Checkbox
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  TruckOutlined,
  DownOutlined,
  RightOutlined,
  ExportOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const DispatchToSales = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [urgentFilter, setUrgentFilter] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [jobCardsData, setJobCardsData] = useState({}) // { planId: jobCards[] }
  const [loadingJobCards, setLoadingJobCards] = useState({})

  // Accept quantity modal
  const [acceptModalVisible, setAcceptModalVisible] = useState(false)
  const [selectedJobCard, setSelectedJobCard] = useState(null)
  const [acceptQuantity, setAcceptQuantity] = useState(0)

  // Export modal
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [todayDispatchedItems, setTodayDispatchedItems] = useState([])
  const [selectedExportItems, setSelectedExportItems] = useState([])
  const [loadingExport, setLoadingExport] = useState(false)

  const fetchDispatchReadyPlans = async (
    page = 1,
    search = searchText,
    urgent = urgentFilter,
    range = dateRange
  ) => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search,
        urgent,
        dispatchPending: 'true' // Server-side filter for plans with pending quantities at step 11
      }

      if (range && range[0] && range[1]) {
        params.startDate = range[0].format('YYYY-MM-DD')
        params.endDate = range[1].format('YYYY-MM-DD')
      }

      const response = await client.get('/production/plans-with-quantities', {
        params
      })

      // Backend returns productionPlans array and pagination object
      if (response.data.productionPlans) {
        setData(response.data.productionPlans)
        setPagination({
          ...pagination,
          current: page,
          total: response.data.pagination?.totalCount || response.data.productionPlans.length
        })
      }
    } catch (error) {
      console.error('Error fetching dispatch-ready plans:', error)
      message.error('Failed to fetch dispatch-ready production plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDispatchReadyPlans()
  }, [])

  const handleSearch = value => {
    setSearchText(value)
    fetchDispatchReadyPlans(1, value, urgentFilter, dateRange)
  }

  const handleUrgentChange = value => {
    setUrgentFilter(value)
    fetchDispatchReadyPlans(1, searchText, value, dateRange)
  }

  const handleDateChange = range => {
    setDateRange(range)
    fetchDispatchReadyPlans(1, searchText, urgentFilter, range)
  }

  const handleClearFilters = () => {
    setSearchText('')
    setUrgentFilter('')
    setDateRange(null)
    fetchDispatchReadyPlans(1, '', '', null)
  }

  // Fetch job cards for a production plan when row is expanded
  const fetchJobCardsForPlan = async prodPlanId => {
    setLoadingJobCards(prev => ({ ...prev, [prodPlanId]: true }))
    try {
      const res = await client.get(`/production/plan/${prodPlanId}/dispatch-job-cards`)
      setJobCardsData(prev => ({ ...prev, [prodPlanId]: res.data.jobCards }))
    } catch (error) {
      console.error('Error fetching job cards:', error)
      message.error('Failed to fetch job cards')
    } finally {
      setLoadingJobCards(prev => ({ ...prev, [prodPlanId]: false }))
    }
  }

  // Handle row expand/collapse
  const handleExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.id])
      if (!jobCardsData[record.id]) {
        fetchJobCardsForPlan(record.id)
      }
    } else {
      setExpandedRowKeys(expandedRowKeys.filter(k => k !== record.id))
    }
  }

  // Show accept quantity modal
  const showAcceptModal = jobCard => {
    setSelectedJobCard(jobCard)
    setAcceptQuantity(jobCard.pendingQuantity) // Default to all pending
    setAcceptModalVisible(true)
  }

  // Accept job card quantities
  const handleAcceptJobCard = async () => {
    if (!selectedJobCard) return

    if (acceptQuantity <= 0 || acceptQuantity > selectedJobCard.pendingQuantity) {
      message.error(
        `Please enter a valid quantity between 1 and ${selectedJobCard.pendingQuantity}`
      )
      return
    }

    try {
      const res = await client.post(
        `/production/step-progress/${selectedJobCard.stepProgressId}/accept-dispatch`,
        { acceptedQuantity: acceptQuantity }
      )

      message.success(`Accepted ${acceptQuantity} units`)

      if (res.data.data.planCompleted) {
        message.success('Production plan completed!')
      }

      // Close modal and refresh data
      setAcceptModalVisible(false)
      setSelectedJobCard(null)
      setAcceptQuantity(0)
      await fetchJobCardsForPlan(selectedJobCard.prodPlanId)
      await fetchDispatchReadyPlans(pagination.current)
    } catch (error) {
      console.error('Error accepting job card:', error)
      message.error(error.response?.data?.message || 'Failed to accept')
    }
  }

  // Fetch today's dispatched items for export
  const fetchTodayDispatchedItems = async () => {
    setLoadingExport(true)
    try {
      const today = moment().format('YYYY-MM-DD')
      const response = await client.get('/production/today-dispatched', {
        params: { date: today }
      })

      if (response.data.dispatchedItems) {
        setTodayDispatchedItems(response.data.dispatchedItems)
        setSelectedExportItems([]) // Reset selection
      }
    } catch (error) {
      console.error('Error fetching today dispatched items:', error)
      message.error('Failed to fetch dispatched items')
    } finally {
      setLoadingExport(false)
    }
  }

  // Show export modal
  const showExportModal = () => {
    fetchTodayDispatchedItems()
    setExportModalVisible(true)
  }

  // Handle export item selection
  const handleExportItemSelect = (itemId, checked) => {
    if (checked) {
      setSelectedExportItems([...selectedExportItems, itemId])
    } else {
      setSelectedExportItems(selectedExportItems.filter(id => id !== itemId))
    }
  }

  // Select/Deselect all export items
  const handleSelectAllExport = checked => {
    if (checked) {
      setSelectedExportItems(todayDispatchedItems.map(item => item.id))
    } else {
      setSelectedExportItems([])
    }
  }

  // Export selected items
  const handleExportDispatch = () => {
    if (selectedExportItems.length === 0) {
      message.warning('Please select at least one item to export')
      return
    }

    // Filter selected items
    const itemsToExport = todayDispatchedItems.filter(item =>
      selectedExportItems.includes(item.id)
    )

    // Group by production plan and concatenate job card numbers
    const groupedByPlan = itemsToExport.reduce((acc, item) => {
      const planId = item.prodPlanId
      if (!acc[planId]) {
        acc[planId] = {
          ...item,
          jobCardNumbers: [item.jobCardId]
        }
      } else {
        acc[planId].jobCardNumbers.push(item.jobCardId)
        acc[planId].acceptedQuantity += item.acceptedQuantity
      }
      return acc
    }, {})

    // Convert to array and format
    const exportData = Object.values(groupedByPlan).map(item => ({
      'Production Plan ID': item.prodPlanId,
      'Job Card Numbers': item.jobCardNumbers.join(', '),
      'Product Name': item.productName,
      'Model': item.modelName,
      'Size': item.inches + '"',
      'Finish': item.finish,
      'Accepted Quantity': item.acceptedQuantity,
      'Dispatched At': moment(item.dispatchedAt).format('DD-MM-YYYY HH:mm')
    }))

    // Convert to CSV
    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `dispatch_report_${moment().format('YYYY-MM-DD')}.csv`
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success(`Exported ${selectedExportItems.length} items`)
    setExportModalVisible(false)
  }

  // Render expandable job cards table
  const expandedRowRender = record => {
    const jobCards = jobCardsData[record.id] || []
    const loading = loadingJobCards[record.id]

    const columns = [
      {
        title: 'Job Card ID',
        dataIndex: 'jobCardId',
        render: id => <Text strong>#{id}</Text>
      },
      {
        title: 'Total Qty',
        dataIndex: 'jobCardQuantity',
        render: qty => <Text>{qty}</Text>
      },
      {
        title: 'Pending',
        dataIndex: 'pendingQuantity',
        render: qty => (
          <Tag color="orange" style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {qty}
          </Tag>
        )
      },
      {
        title: 'Accepted',
        dataIndex: 'acceptedQuantity',
        render: qty => <Tag color="green">{qty || 0}</Tag>
      },
      {
        title: 'Action',
        render: (_, jc) => (
          <Button
            type="primary"
            size="small"
            disabled={jc.pendingQuantity === 0}
            onClick={() => showAcceptModal(jc)}
          >
            Accept Quantity
          </Button>
        )
      }
    ]

    if (loading) {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <Text type="secondary">Loading job cards...</Text>
        </div>
      )
    }

    if (!jobCards.length) {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <Text type="secondary">No job cards at dispatch step</Text>
        </div>
      )
    }

    return (
      <Table
        columns={columns}
        dataSource={jobCards}
        pagination={false}
        rowKey="jobCardId"
        size="small"
        style={{ margin: '0 48px' }}
      />
    )
  }

  const columns = [
    {
      title: 'Plan ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>#{text}</Text>
          {record.isUrgent === 1 && (
            <Tag color="red" icon={<WarningOutlined />}>
              Urgent
            </Tag>
          )}
        </Space>
      ),
      sorter: (a, b) => a.id - b.id
    },
    {
      title: 'Product Details',
      key: 'product',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.targetProductName || 'N/A'}</Text>
          <Space size={4} wrap>
            <Tag color="blue">{record.targetModelName}</Tag>
            <Tag color="cyan">{record.targetInches}"</Tag>
            <Tag color="green">{record.targetFinish}</Tag>
          </Space>
          {record.sourceProductName && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              From: {record.sourceProductName}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Dispatch Pending',
      key: 'dispatchPending',
      width: 150,
      render: (_, record) => {
        const pendingQty = record.dispatchPendingQuantity || 0
        const totalQty = record.quantity || 0
        const percentage = totalQty > 0 ? (pendingQty / totalQty) * 100 : 0

        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text strong style={{ fontSize: '18px', color: '#ff9800' }}>
                {pendingQty}
              </Text>
              <Text type="secondary">/ {totalQty}</Text>
            </div>
            <Progress
              percent={Number(percentage.toFixed(1))}
              size="small"
              strokeColor={{
                '0%': '#ff9800',
                '100%': '#ff5722'
              }}
              status="active"
              format={percent => `${percent}%`}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Awaiting acceptance
            </Text>
          </Space>
        )
      },
      sorter: (a, b) =>
        (a.dispatchPendingQuantity || 0) - (b.dispatchPendingQuantity || 0)
    },
    {
      title: 'Production Progress',
      key: 'progress',
      width: 180,
      render: (_, record) => {
        const completed = record.completedQuantity || 0
        const total = record.quantity || 0
        const percentage = total > 0 ? (completed / total) * 100 : 0

        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>
                {completed} / {total}
              </Text>
            </Space>
            <Progress
              percent={Number(percentage.toFixed(1))}
              size="small"
              status={percentage === 100 ? 'success' : 'active'}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.completedJobCardsStatus || 0} / {record.totalJobCards || 0}{' '}
              cards done
            </Text>
          </Space>
        )
      }
    },
    {
      title: 'Quality',
      key: 'quality',
      width: 120,
      render: (_, record) => {
        const accepted = record.acceptedQuantity || 0
        const rejected = record.rejectedQuantity || 0
        const total = accepted + rejected
        const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0

        return (
          <Space direction="vertical" size={4}>
            <Space>
              <Badge status="success" />
              <Text>{accepted} accepted</Text>
            </Space>
            {rejected > 0 && (
              <Space>
                <Badge status="error" />
                <Text type="danger">{rejected} rejected</Text>
              </Space>
            )}
            {total > 0 && (
              <Tag color={acceptanceRate >= 95 ? 'green' : 'orange'}>
                {acceptanceRate.toFixed(1)}% Pass
              </Tag>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Timeline',
      key: 'timeline',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Created: {moment(record.createdAt).format('DD MMM YYYY')}
          </Text>
          {record.completedAt && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Completed: {moment(record.completedAt).format('DD MMM YYYY')}
            </Text>
          )}
          <Text strong style={{ fontSize: '12px' }}>
            {moment(record.createdAt).fromNow()}
          </Text>
        </Space>
      ),
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix()
    },
    {
      title: 'Current Step',
      key: 'currentStep',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tag color="processing">{record.currentStepName || 'N/A'}</Tag>
          {record.avgProgressPercentage && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Avg: {Number(record.avgProgressPercentage).toFixed(0)}% complete
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={expandedRowKeys.includes(record.id) ? <DownOutlined /> : <RightOutlined />}
          size="small"
          block
          onClick={() => handleExpand(!expandedRowKeys.includes(record.id), record)}
        >
          {expandedRowKeys.includes(record.id) ? 'Hide' : 'View'} Job Cards
        </Button>
      )
    }
  ]

  // Calculate summary statistics
  const summaryStats = {
    totalPlans: data.length,
    totalPendingUnits: data.reduce(
      (sum, item) => sum + (item.dispatchPendingQuantity || 0),
      0
    ),
    urgentPlans: data.filter(item => item.isUrgent === 1).length,
    fullyPendingPlans: data.filter(
      item =>
        item.dispatchPendingQuantity >= item.quantity &&
        item.dispatchPendingQuantity > 0
    ).length
  }

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}
          >
            <Space align="center">
              <RocketOutlined
                style={{ fontSize: '24px', color: '#1890ff' }}
              />
              <Title level={3} style={{ margin: 0 }}>
                Dispatch to Sales - Pending Acceptance
              </Title>
            </Space>
            <Space>
              <Button
                type="default"
                icon={<ExportOutlined />}
                onClick={showExportModal}
              >
                Export Today's Dispatch
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => fetchDispatchReadyPlans(pagination.current)}
              >
                Refresh
              </Button>
            </Space>
          </div>
        </Col>

        {/* Summary Statistics */}
        <Col span={24}>
          <Card bordered={false} className="shadow-sm">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Plans Pending"
                  value={summaryStats.totalPlans}
                  prefix={<TruckOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Pending Units"
                  value={summaryStats.totalPendingUnits}
                  suffix="units"
                  valueStyle={{ color: '#ff9800' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Urgent Plans"
                  value={summaryStats.urgentPlans}
                  prefix={<WarningOutlined />}
                  valueStyle={{
                    color: summaryStats.urgentPlans > 0 ? '#ff4d4f' : '#8c8c8c'
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Fully At Dispatch"
                  value={summaryStats.fullyPendingPlans}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#ff9800' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Filters */}
        <Col span={24}>
          <Card bordered={false} className="shadow-sm" bodyStyle={{ padding: '16px' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <Text
                  type="secondary"
                  strong
                  style={{
                    fontSize: '12px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}
                >
                  Search
                </Text>
                <Search
                  placeholder="Search Product, Model, Finish..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  onSearch={handleSearch}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ flex: '0 0 150px' }}>
                <Text
                  type="secondary"
                  strong
                  style={{
                    fontSize: '12px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}
                >
                  Priority
                </Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="All"
                  value={urgentFilter}
                  onChange={handleUrgentChange}
                  allowClear
                >
                  <Option value="1">Urgent Only</Option>
                  <Option value="0">Normal</Option>
                </Select>
              </div>

              <div style={{ flex: '1 1 280px' }}>
                <Text
                  type="secondary"
                  strong
                  style={{
                    fontSize: '12px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}
                >
                  Date Range
                </Text>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={handleDateChange}
                  format="DD-MM-YYYY"
                />
              </div>

              <div style={{ paddingTop: '20px' }}>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                  disabled={!searchText && !urgentFilter && !dateRange}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* Table */}
        <Col span={24}>
          <Card bordered={false} className="shadow-sm">
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey="id"
              expandable={{
                expandedRowRender,
                expandedRowKeys,
                onExpand: handleExpand
              }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: total => `Total ${total} dispatch-ready plans`,
                onChange: page => fetchDispatchReadyPlans(page)
              }}
              scroll={{ x: 1500 }}
              locale={{
                emptyText: (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <TruckOutlined
                      style={{ fontSize: '48px', color: '#d9d9d9' }}
                    />
                    <div style={{ marginTop: '16px' }}>
                      <Text type="secondary">
                        No production plans ready for dispatch
                      </Text>
                    </div>
                  </div>
                )
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Accept Quantity Modal */}
      <Modal
        title="Accept Dispatch Quantity"
        open={acceptModalVisible}
        onOk={handleAcceptJobCard}
        onCancel={() => {
          setAcceptModalVisible(false)
          setSelectedJobCard(null)
          setAcceptQuantity(0)
        }}
        okText="Accept"
        cancelText="Cancel"
      >
        {selectedJobCard && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text strong>Job Card #</Text>
              <Text>{selectedJobCard.jobCardId}</Text>
            </div>
            <div>
              <Text strong>Pending Quantity: </Text>
              <Tag color="orange" style={{ fontSize: '14px' }}>
                {selectedJobCard.pendingQuantity}
              </Tag>
            </div>
            <div>
              <Text strong>Enter Quantity to Accept:</Text>
              <InputNumber
                min={1}
                max={selectedJobCard.pendingQuantity}
                value={acceptQuantity}
                onChange={value => setAcceptQuantity(value)}
                style={{ width: '100%', marginTop: 8 }}
                size="large"
              />
            </div>
          </Space>
        )}
      </Modal>

      {/* Export Modal */}
      <Modal
        title="Export Today's Dispatch Report"
        open={exportModalVisible}
        onOk={handleExportDispatch}
        onCancel={() => setExportModalVisible(false)}
        okText="Export Selected"
        cancelText="Cancel"
        width={800}
        okButtonProps={{ disabled: selectedExportItems.length === 0 }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Text strong>
              Today's Dispatched Items ({todayDispatchedItems.length})
            </Text>
            <Checkbox
              checked={
                selectedExportItems.length === todayDispatchedItems.length &&
                todayDispatchedItems.length > 0
              }
              indeterminate={
                selectedExportItems.length > 0 &&
                selectedExportItems.length < todayDispatchedItems.length
              }
              onChange={e => handleSelectAllExport(e.target.checked)}
            >
              Select All
            </Checkbox>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loadingExport ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text type="secondary">Loading...</Text>
              </div>
            ) : todayDispatchedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text type="secondary">No items dispatched today</Text>
              </div>
            ) : (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {todayDispatchedItems.map(item => (
                  <Card
                    key={item.id}
                    size="small"
                    style={{
                      backgroundColor: selectedExportItems.includes(item.id)
                        ? '#e6f7ff'
                        : 'white'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Checkbox
                        checked={selectedExportItems.includes(item.id)}
                        onChange={e =>
                          handleExportItemSelect(item.id, e.target.checked)
                        }
                      />
                      <div style={{ flex: 1, marginLeft: 12 }}>
                        <Space direction="vertical" size={2}>
                          <Text strong>
                            Plan #{item.prodPlanId} | Job Card #{item.jobCardId}
                          </Text>
                          <Text>
                            {item.productName} - {item.modelName} {item.inches}"
                            {item.finish}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Accepted: {item.acceptedQuantity} units |{' '}
                            {moment(item.dispatchedAt).format(
                              'DD-MM-YYYY HH:mm'
                            )}
                          </Text>
                        </Space>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </div>

          {selectedExportItems.length > 0 && (
            <div
              style={{
                backgroundColor: '#f0f2f5',
                padding: '12px',
                borderRadius: '4px'
              }}
            >
              <Text strong>Selected: {selectedExportItems.length} items</Text>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  )
}

export default DispatchToSales
