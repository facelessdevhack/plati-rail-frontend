
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
  Statistic
} from 'antd'
import {
  ReloadOutlined,
  RollbackOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'

const { Title, Text } = Typography

const RejectedStockManagement = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const fetchRejectedStock = async (page = 1) => {
    setLoading(true)
    try {
      const response = await client.get(
        '/production/rejected-stock',
        {
          params: { page, limit: pagination.pageSize }
        }
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

          <Popconfirm
            title='Start Rework?'
            description={`Create a new Rework Plan for ${record.rejectedQuantity} items?`}
            onConfirm={() => handleAction(record.rejectionId, 'create_rework_plan')}
            okText='Create Plan'
            okType='danger'
            cancelText='Cancel'
            icon={<ToolOutlined style={{ color: 'orange' }} />}
          >
            <Button type='primary' danger icon={<ToolOutlined />}>
              Create Rework Plan
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

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
           <Card bordered={false} className="shadow-sm"> 
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey='rejectionId'
              pagination={{
                ...pagination,
                onChange: page => fetchRejectedStock(page)
              }}
              locale={{
                emptyText: <div style={{padding: '40px', textAlign: 'center'}}><Text type="secondary">No rejected stock pending resolution</Text></div>
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default RejectedStockManagement
