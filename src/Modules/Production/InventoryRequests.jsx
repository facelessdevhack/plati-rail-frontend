import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Empty,
  message,
  Modal,
  Form,
  InputNumber
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExportOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { client } from '../../Utils/axiosClient'

const { Title, Text } = Typography
const { Option } = Select

const InventoryRequests = () => {
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [form] = Form.useForm()

  // Filter states
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchInventoryRequests()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchText, statusFilter, requests])

  const fetchInventoryRequests = async () => {
    setLoading(true)
    try {
      const response = await client.get('/production/inventory-requests')
      setRequests(response.data)
      setFilteredRequests(response.data)
    } catch (error) {
      message.error('Failed to fetch inventory requests')
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...requests]

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        req =>
          req.jobCardId.toLowerCase().includes(searchText.toLowerCase()) ||
          req.alloyName.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter)
    }

    setFilteredRequests(filtered)
  }

  const getStatusTag = status => {
    const statusConfig = {
      pending: { color: 'orange', icon: <ClockCircleOutlined /> },
      partial: { color: 'blue', icon: <ClockCircleOutlined /> },
      completed: { color: 'green', icon: <CheckCircleOutlined /> }
    }
    const config = statusConfig[status] || { color: 'default', icon: null }
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.toUpperCase()}
      </Tag>
    )
  }

  const handleMarkAsDone = record => {
    setSelectedRequest(record)
    form.setFieldsValue({
      receivedQuantity: record.quantityReceived || 0
    })
    setIsModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const { receivedQuantity } = values

      await client.put(`/production/inventory-requests/${selectedRequest.id}`, {
        quantityReceived: receivedQuantity
      })

      message.success(
        `Job ${selectedRequest.jobCardId} updated - Received: ${receivedQuantity} units`
      )
      setIsModalVisible(false)
      setSelectedRequest(null)
      form.resetFields()
      fetchInventoryRequests()
    } catch (error) {
      message.error('Failed to update quantity')
      console.error('Error updating quantity:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    setSelectedRequest(null)
    form.resetFields()
  }

  const handleDelete = record => {
    setSelectedRequest(record)
    setIsDeleteModalVisible(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await client.delete(`/production/inventory-requests/${selectedRequest.id}`)

      message.success(
        `Inventory request for Job ${selectedRequest.jobCardId} deleted successfully`
      )
      setIsDeleteModalVisible(false)
      setSelectedRequest(null)
      fetchInventoryRequests()
    } catch (error) {
      message.error('Failed to delete inventory request')
      console.error('Error deleting request:', error)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false)
    setSelectedRequest(null)
  }

  const handleExportPDF = () => {
    try {
      // Filter incomplete requests (not completed)
      const incompleteRequests = requests.filter(r => r.status !== 'completed')

      if (incompleteRequests.length === 0) {
        message.info('No incomplete requests to export')
        return
      }

      // Group by alloy name and sum quantities
      const groupedData = incompleteRequests.reduce((acc, request) => {
        const key = request.alloyName
        if (acc[key]) {
          acc[key].quantityRequested += request.quantityRequested
        } else {
          acc[key] = {
            alloyName: request.alloyName,
            quantityRequested: request.quantityRequested
          }
        }
        return acc
      }, {})

      // Convert to array and sort by alloy name
      const exportData = Object.values(groupedData).sort((a, b) =>
        a.alloyName.localeCompare(b.alloyName)
      )

      // Create PDF
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(18)
      doc.text('Inventory Request', 14, 20)

      // Add date
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)

      // Prepare table data
      const tableData = exportData.map(item => [
        item.alloyName,
        item.quantityRequested.toString(),
        '' // Blank for manual entry
      ])

      // Calculate column widths
      const pageWidth = doc.internal.pageSize.getWidth()
      const margins = 28 // 14 on each side
      const availableWidth = pageWidth - margins
      const alloyNameWidth = availableWidth * 0.7
      const qtyWidth = (availableWidth * 0.3) / 2

      // Generate table using autoTable
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 35,
          head: [['Alloy Name', 'Qty Required', 'Qty Received']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [24, 144, 255],
            textColor: 255,
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 10
          },
          columnStyles: {
            0: { cellWidth: alloyNameWidth, halign: 'left' },
            1: { cellWidth: qtyWidth, halign: 'center' },
            2: {
              cellWidth: qtyWidth,
              halign: 'center',
              fillColor: [245, 245, 245]
            }
          },
          margin: { left: 14, right: 14 }
        })
      } else {
        // Fallback if autoTable is not available
        console.error('autoTable is not available on jsPDF instance')
        throw new Error('PDF table generation failed - autoTable not found')
      }

      // Add footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }

      // Save PDF
      const fileName = `Inventory_Request_${
        new Date().toISOString().split('T')[0]
      }.pdf`
      doc.save(fileName)

      message.success(
        `PDF exported successfully: ${exportData.length} unique alloys`
      )
    } catch (error) {
      message.error('Failed to export PDF')
      console.error('Error generating PDF:', error)
    }
  }

  const columns = [
    {
      title: 'Job ID',
      dataIndex: 'jobCardId',
      key: 'jobCardId',
      width: 150,
      sorter: (a, b) => a.jobCardId.localeCompare(b.jobCardId),
      render: text => <Text strong>{text}</Text>
    },
    {
      title: 'Alloy Name',
      dataIndex: 'alloyName',
      key: 'alloyName',
      width: 300,
      sorter: (a, b) => a.alloyName.localeCompare(b.alloyName),
      render: text => <Text>{text}</Text>
    },
    {
      title: 'Quantity Requested',
      dataIndex: 'quantityRequested',
      key: 'quantityRequested',
      width: 150,
      align: 'center',
      sorter: (a, b) => a.quantityRequested - b.quantityRequested,
      render: qty => (
        <Text strong style={{ color: '#1890ff' }}>
          {qty}
        </Text>
      )
    },
    {
      title: 'Quantity Received',
      dataIndex: 'quantityReceived',
      key: 'quantityReceived',
      width: 150,
      align: 'center',
      sorter: (a, b) => a.quantityReceived - b.quantityReceived,
      render: (qty, record) => {
        const percentage =
          record.quantityRequested > 0
            ? (qty / record.quantityRequested) * 100
            : 0
        const color =
          percentage === 100
            ? '#52c41a'
            : percentage > 0
            ? '#faad14'
            : '#f5222d'
        return (
          <Space direction='vertical' size={0} style={{ width: '100%' }}>
            <Text strong style={{ color }}>
              {qty}
            </Text>
            <Text type='secondary' style={{ fontSize: '12px' }}>
              {percentage.toFixed(0)}%
            </Text>
          </Space>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type='primary'
            icon={<CheckCircleOutlined />}
            onClick={() => handleMarkAsDone(record)}
            disabled={record.status === 'completed'}
            size='small'
          >
            Done
          </Button>
          {record.status !== 'completed' && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              size='small'
            >
              Delete
            </Button>
          )}
        </Space>
      )
    }
  ]

  const stats = useMemo(() => {
    const total = requests.length
    const pending = requests.filter(r => r.status === 'pending').length
    const partial = requests.filter(r => r.status === 'partial').length
    const completed = requests.filter(r => r.status === 'completed').length

    return { total, pending, partial, completed }
  }, [requests])

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Requests'
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Pending'
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Partial'
              value={stats.partial}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Completed'
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card
        title={<Title level={4}>Inventory Requests</Title>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchInventoryRequests}>
              Refresh
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExportPDF}>
              Export PDF
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={16}>
            <Input
              placeholder='Search by Job ID or Alloy Name...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              placeholder='Filter by Status'
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value='all'>All Status</Option>
              <Option value='pending'>Pending</Option>
              <Option value='partial'>Partial</Option>
              <Option value='completed'>Completed</Option>
            </Select>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredRequests}
          loading={loading}
          rowKey='id'
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: total => `Total ${total} requests`
          }}
          locale={{
            emptyText: (
              <Empty
                description='No inventory requests found'
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>

      {/* Receive Quantity Modal */}
      <Modal
        title='Update Received Quantity'
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText='Save'
        cancelText='Cancel'
        width={500}
      >
        {selectedRequest && (
          <div style={{ marginBottom: '20px' }}>
            <Row gutter={16}>
              <Col span={24}>
                <Text strong>Job ID: </Text>
                <Text>{selectedRequest.jobCardId}</Text>
              </Col>
              <Col span={24} style={{ marginTop: '8px' }}>
                <Text strong>Alloy: </Text>
                <Text>{selectedRequest.alloyName}</Text>
              </Col>
              <Col span={24} style={{ marginTop: '8px' }}>
                <Text strong>Quantity Requested: </Text>
                <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
                  {selectedRequest.quantityRequested}
                </Text>
              </Col>
            </Row>
          </div>
        )}

        <Form form={form} layout='vertical'>
          <Form.Item
            label='Received Quantity'
            name='receivedQuantity'
            rules={[
              { required: true, message: 'Please enter received quantity' },
              {
                type: 'number',
                min: 0,
                message: 'Quantity must be greater than or equal to 0'
              },
              {
                validator: (_, value) => {
                  if (
                    selectedRequest &&
                    value > selectedRequest.quantityRequested
                  ) {
                    return Promise.reject(
                      new Error(
                        `Received quantity cannot exceed requested quantity (${selectedRequest.quantityRequested})`
                      )
                    )
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder='Enter received quantity'
              min={0}
              max={selectedRequest?.quantityRequested}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title='Delete Inventory Request'
        open={isDeleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText='Delete'
        cancelText='Cancel'
        okType='danger'
        width={400}
      >
        {selectedRequest && (
          <div>
            <p>Are you sure you want to delete this inventory request?</p>
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fff2f0',
              borderRadius: '6px',
              border: '1px solid #ffccc7'
            }}>
              <Row gutter={8}>
                <Col span={8}>
                  <Text strong>Job ID:</Text>
                </Col>
                <Col span={16}>
                  <Text>{selectedRequest.jobCardId}</Text>
                </Col>
              </Row>
              <Row gutter={8} style={{ marginTop: '8px' }}>
                <Col span={8}>
                  <Text strong>Alloy:</Text>
                </Col>
                <Col span={16}>
                  <Text>{selectedRequest.alloyName}</Text>
                </Col>
              </Row>
              <Row gutter={8} style={{ marginTop: '8px' }}>
                <Col span={8}>
                  <Text strong>Quantity:</Text>
                </Col>
                <Col span={16}>
                  <Text>{selectedRequest.quantityRequested}</Text>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default InventoryRequests
