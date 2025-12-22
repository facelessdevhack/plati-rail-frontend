
import React, { useEffect, useState } from 'react'
import {
  Table,
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Row,
  Col,
  Statistic,
  Input,
  DatePicker
} from 'antd'
import {
  ReloadOutlined,
  RollbackOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
   SearchOutlined,
  ClearOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'
import CreateReworkPlanModal from './CreateReworkPlanModal'
import DiscardQuantityModal from './DiscardQuantityModal'

const { Title, Text } = Typography
const { Search } = Input
const { RangePicker } = DatePicker

const RejectedStockManagement = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [reworkModalVisible, setReworkModalVisible] = useState(false)
  const [discardModalVisible, setDiscardModalVisible] = useState(false)
  const [selectedRejection, setSelectedRejection] = useState(null)

  const fetchRejectedStock = async (page = 1, search = searchText, range = dateRange) => {
    setLoading(true)
    try {
      const params = { 
        page, 
        limit: pagination.pageSize,
        search
      }

      if (range && range[0] && range[1]) {
        params.startDate = range[0].format('YYYY-MM-DD')
        params.endDate = range[1].format('YYYY-MM-DD')
      }

      const response = await client.get(
        '/production/rejected-stock',
        { params }
      )

      if (response.data.success) {
        setData(response.data.data)
        setPagination({
          ...pagination,
          current: page,
          total: response.data.pagination.total
        })
      }
    } catch (error) {
      console.error('Error fetching rejected stock:', error)
      message.error('Failed to load rejected stock listing')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRejectedStock()
  }, [])

  const handleSearch = (value) => {
    setSearchText(value)
    fetchRejectedStock(1, value, dateRange)
  }

  const handleDateChange = (range) => {
    setDateRange(range)
    fetchRejectedStock(1, searchText, range)
  }

  const handleClearFilters = () => {
    setSearchText('')
    setDateRange(null)
    fetchRejectedStock(1, '', null)
  }

  const handleAction = async (id, action) => {
    setLoading(true)
    try {
      const response = await client.post(
        `/production/rejected-stock/${id}/process`,
        { action }
      )

      if (response.data.success) {
        message.success(response.data.message)
        fetchRejectedStock(pagination.current) // Refresh
      }
    } catch (error) {
      console.error('Error processing rejected stock:', error)
      const errorMsg =
        error.response?.data?.message || 'Failed to process request'
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'rejectionDate',
      key: 'rejectionDate',
      render: date => (
        <Tooltip title={moment(date).format('LLLL')}>
          {moment(date).format('DD/MM/YYYY')}
        </Tooltip>
      )
    },
    {
      title: 'Product Info',
      key: 'product',
      render: (_, record) => (
        <Space direction='vertical' size={0}>
          <Text strong>{record.alloyName}</Text>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {record.finishName}
          </Text>
        </Space>
      )
    },
    {
      title: 'Job Card',
      dataIndex: 'jobCardId',
      key: 'jobCardId',
      render: id => <Tag color='blue'>#{id}</Tag>
    },
    {
      title: 'Rejected Qty',
      dataIndex: 'rejectedQuantity',
      key: 'rejectedQuantity',
      align: 'center',
      render: qty => (
        <Tag color='volcano' style={{ fontSize: '14px', padding: '4px 10px' }}>
          <strong>{qty}</strong>
        </Tag>
      )
    },
    {
      title: 'Overview',
      key: 'overview',
      render: (_, record) => (
        <Space direction='vertical' size={0}>
            <Text type="secondary" style={{fontSize: '12px'}}>Reason: {record.rejectionReason || 'N/A'}</Text>
            <Text type="secondary" style={{fontSize: '12px'}}>By: {record.createdByFirstName} {record.createdByLastName}</Text>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title='Return to Source?'
            description={`Add ${record.rejectedQuantity} items back to Main Stock?`}
            onConfirm={() => handleAction(record.rejectionId, 'return_to_source')}
            okText='Return'
            okType='primary'
            cancelText='Cancel'
            icon={<CheckCircleOutlined style={{ color: 'green' }} />}
          >
            <Button type='default' icon={<RollbackOutlined />}>
              Return to Stock
            </Button>
          </Popconfirm>

          <Button
            type='primary'
            danger
            icon={<ToolOutlined />}
            onClick={() => {
              setSelectedRejection(record)
              setReworkModalVisible(true)
            }}
          >
            Create Rework Plan
          </Button>

          <Button
            type='default'
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setSelectedRejection(record)
              setDiscardModalVisible(true)
            }}
          >
            Discard
          </Button>
        </Space>
      )
    }
  ]

  const handleReworkSuccess = (successMessage, planId) => {
    message.success(successMessage || 'Rework plan created successfully')
    fetchRejectedStock(pagination.current) // Refresh the list
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
              marginBottom: '20px'
            }}
          >
            <Title level={3} style={{ margin: 0 }}>
              Rejected Stock Management
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchRejectedStock(pagination.current)}
            >
              Refresh
            </Button>
          </div>
        </Col>

        <Col span={24}>
          <Card bordered={false} className="shadow-sm mb-4" bodyStyle={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <div style={{ flex: '1 1 300px' }}>
                <Text type="secondary" strong style={{ fontSize: '12px', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Search</Text>
                <Search
                  placeholder="Search Product, Model, Finish or Job Card ID..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  onSearch={handleSearch}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ flex: '1 1 280px' }}>
                <Text type="secondary" strong style={{ fontSize: '12px', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Date Range</Text>
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
                  disabled={!searchText && !dateRange}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        <Col span={24}>
           <Card bordered={false} className="shadow-sm"> 
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey='rejectionId'
              pagination={{
                ...pagination,
                onChange: (page) => fetchRejectedStock(page, searchText, dateRange)
              }}
              locale={{
                emptyText: <div style={{padding: '40px', textAlign: 'center'}}><Text type="secondary">No rejected stock pending resolution</Text></div>
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Create Rework Plan Modal */}
      <CreateReworkPlanModal
        visible={reworkModalVisible}
        onCancel={() => {
          setReworkModalVisible(false)
          setSelectedRejection(null)
        }}
        onSuccess={handleReworkSuccess}
        rejectionRecord={selectedRejection}
      />

      {/* Discard Quantity Modal */}
      <DiscardQuantityModal
        visible={discardModalVisible}
        onCancel={() => {
          setDiscardModalVisible(false)
          setSelectedRejection(null)
        }}
        onSuccess={() => fetchRejectedStock(pagination.current)}
        rejectionRecord={selectedRejection}
      />
    </div>
  )
}

export default RejectedStockManagement
