
import React, { useEffect, useState } from 'react'
import {
  Table,
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Modal,
  Input,
  message,
  Tooltip,
  Row,
  Col,
  Image,
  Empty
} from 'antd'
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const DiscardedStockManagement = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [processingId, setProcessingId] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [adminNote, setAdminNote] = useState('')

  const fetchDiscardRequests = async () => {
    setLoading(true)
    try {
      const response = await client.get('/production/discard-requests', {
        params: { status: 'pending' }
      })

      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching discard requests:', error)
      message.error('Failed to load discard requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscardRequests()
  }, [])

  const handleProcess = async (action) => {
    if (!selectedRequest) return

    setProcessingId(selectedRequest.id)
    try {
      const response = await client.post(
        `/production/discard-requests/${selectedRequest.id}/process`,
        { action, adminNote }
      )

      if (response.data.success) {
        message.success(response.data.message)
        setModalVisible(false)
        setSelectedRequest(null)
        setAdminNote('')
        fetchDiscardRequests()
      }
    } catch (error) {
      console.error('Error processing discard request:', error)
      message.error(error.response?.data?.message || 'Failed to process request')
    } finally {
      setProcessingId(null)
    }
  }

  const columns = [
    {
      title: 'Requested Date',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: date => (
        <Tooltip title={moment(date).format('LLLL')}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text>{moment(date).format('DD/MM/YYYY')}</Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>{moment(date).fromNow()}</Text>
          </div>
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
          <Tag color='blue' style={{ marginTop: '4px' }}>JC #{record.jobCardId}</Tag>
        </Space>
      )
    },
    {
      title: 'Discard Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      render: qty => (
        <Tag color='error' style={{ fontSize: '14px', padding: '4px 10px' }}>
          <strong>{qty}</strong>
        </Tag>
      )
    },
    {
      title: 'Requested By',
      key: 'requestedBy',
      render: (_, record) => (
        <Text>{record.requestedByFirstName} {record.requestedByLastName}</Text>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: reason => <Tooltip title={reason}>{reason}</Tooltip>
    },
    {
      title: 'Photos',
      dataIndex: 'photoUrls',
      key: 'photos',
      render: (urls) => {
        const photos = typeof urls === 'string' ? JSON.parse(urls) : urls
        return (
          <Space>
            {photos && photos.length > 0 ? (
               <Tag icon={<EyeOutlined />} color="cyan" style={{cursor: 'pointer'}} onClick={() => {
                 setSelectedRequest(data.find(d => JSON.stringify(d.photoUrls) === JSON.stringify(urls))) // Safe way to find the record
                 setModalVisible(true)
               }}>
                 {photos.length} Photo(s)
               </Tag>
            ) : (
              <Text type="secondary">No Photos</Text>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type='primary'
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRequest(record)
            setModalVisible(true)
          }}
        >
          Review
        </Button>
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
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Discarded Stock Management
              </Title>
              <Text type="secondary">Review and approve pending discard requests from production rejections</Text>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchDiscardRequests}
              loading={loading}
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
              rowKey='id'
              locale={{
                emptyText: <Empty description="No pending discard requests found" />
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Review Discard Request"
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setSelectedRequest(null)
          setAdminNote('')
        }}
        width={800}
        footer={[
          <Button key="back" onClick={() => {
            setModalVisible(false)
            setSelectedRequest(null)
            setAdminNote('')
          }}>
            Cancel
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            loading={processingId === selectedRequest?.id}
            onClick={() => handleProcess('rejected')}
          >
            Reject Request
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={processingId === selectedRequest?.id}
            onClick={() => handleProcess('approved')}
          >
            Approve Discard
          </Button>,
        ]}
      >
        {selectedRequest && (
          <div style={{ padding: '10px 0' }}>
            <Row gutter={24}>
              <Col span={12}>
                <Title level={5}>Request Details</Title>
                <Paragraph>
                  <Text strong>Product: </Text>{selectedRequest.alloyName}<br />
                  <Text strong>Finish: </Text>{selectedRequest.finishName}<br />
                  <Text strong>Job Card: </Text>#{selectedRequest.jobCardId}<br />
                  <Text strong>Quantity: </Text><Text type="danger" strong>{selectedRequest.quantity}</Text><br />
                  <Text strong>Requested By: </Text>{selectedRequest.requestedByFirstName} {selectedRequest.requestedByLastName}<br />
                  <Text strong>Date: </Text>{moment(selectedRequest.requestedAt).format('DD MMM YYYY HH:mm')}<br />
                </Paragraph>

                <Title level={5}>Reason for Discard</Title>
                <div style={{ backgroundColor: '#fffbe6', padding: '12px', border: '1px solid #ffe58f', borderRadius: '4px', marginBottom: '16px' }}>
                  <Text>{selectedRequest.reason}</Text>
                </div>

                <Title level={5}>Admin Notes</Title>
                <TextArea
                  rows={4}
                  placeholder="Add a reason for approval or rejection (optional)"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                />
              </Col>
              <Col span={12}>
                <Title level={5}>Evidence Photos</Title>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Space wrap size={12}>
                    {(() => {
                      const photos = typeof selectedRequest.photoUrls === 'string' 
                        ? JSON.parse(selectedRequest.photoUrls) 
                        : selectedRequest.photoUrls
                      
                      if (!photos || photos.length === 0) {
                        return <Empty description="No photos uploaded" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      }

                      return photos.map((url, idx) => (
                        <div key={idx} style={{ border: '1px solid #d9d9d9', padding: '4px', borderRadius: '4px' }}>
                          <Image
                            width={160}
                            height={120}
                            src={url}
                            fallback="https://via.placeholder.com/160x120?text=Image+Loading..."
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      ))
                    })()}
                  </Space>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DiscardedStockManagement
