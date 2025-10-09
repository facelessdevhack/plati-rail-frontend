import React, { useState } from 'react'
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Divider,
  Card,
  Row,
  Col,
  Tooltip,
  Badge,
  Empty
} from 'antd'
import {
  ShopOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  UserOutlined,
  NumberOutlined,
  InfoCircleOutlined,
  ExportOutlined
} from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { exportPurchaseOrderPDF } from '../../redux/api/purchaseSystemAPI'

const { Title, Text, Paragraph } = Typography

const PurchaseOrderDetails = ({ visible, onClose, order }) => {
  const dispatch = useDispatch()
  const [exporting, setExporting] = useState({ pdf: false })

  const handleExportPDF = async () => {
    try {
      setExporting({ ...exporting, pdf: true })
      await dispatch(exportPurchaseOrderPDF(order.id)).unwrap()
    } catch (error) {
      console.error('Export PDF failed:', error)
    } finally {
      setExporting({ ...exporting, pdf: false })
    }
  }

  const getSpecificationTag = (label, value) => (
    <div className='flex justify-between items-center py-1'>
      <Text type='secondary' className='text-xs'>
        {label}:
      </Text>
      <Tag className='ml-2'>{value}</Tag>
    </div>
  )

  const itemsColumns = [
    {
      title: '#',
      key: 'index',
      render: (_, record, index) => (
        <Badge count={index + 1} showZero color='#1890ff' />
      ),
      width: 50,
      align: 'center'
    },
    {
      title: 'Product Details',
      key: 'product',
      render: (_, record) => (
        <div>
          {console.log(record, 'RECORDING')}
          <div className='font-semibold text-base'>{record.productName}</div>
          <div className='text-sm text-gray-600'>{record.modelName}</div>
          <Tag color='blue' className='mt-1'>
            {record.size}
          </Tag>
          <Tag color='green' className='mt-1'>
            {record.pcd}/{record.holes}
          </Tag>
        </div>
      )
    },
    {
      title: 'Specifications',
      key: 'specifications',
      render: (_, record) => (
        <div className='space-y-1'>
          {record.width && getSpecificationTag('Width', record.width)}
          {record.sourceFinish &&
            getSpecificationTag('Source Finish', record.sourceFinish)}
          {record.targetFinish &&
            getSpecificationTag('Target Finish', record.targetFinish)}
        </div>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: quantity => (
        <div className='text-center'>
          <Badge
            count={quantity}
            showZero
            color='#52c41a'
            style={{ fontSize: '16px' }}
          />
        </div>
      ),
      width: 100,
      align: 'center'
    }
  ]

  const getTotalQuantity = () => {
    return (
      order?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
    )
  }

  const getTotalItems = () => {
    console.log(order, 'ORDER')
    return order?.items?.length || 0
  }

  if (!order) return null

  return (
    <Modal
      title={
        <div className='flex items-center'>
          <ShopOutlined className='mr-2' />
          Order Details - {order.orderNumber}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key='close' onClick={onClose}>
          Close
        </Button>,
        <Space>
          <Button
            icon={<FilePdfOutlined />}
            loading={exporting.pdf}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </Space>
      ]}
    >
      <div className='space-y-6'>
        {/* Order Header */}
        <Card
          title={
            <Title level={4}>
              <FileTextOutlined className='mr-2' />
              Order Information
            </Title>
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <Descriptions column={1} size='small' bordered>
                <Descriptions.Item label='Order Number'>
                  <Tag color='blue' icon={<NumberOutlined />}>
                    {order.orderNumber}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label='Order Date'>
                  <span className='flex items-center'>
                    <CalendarOutlined className='mr-2' />
                    {new Date(order.orderDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label='Total Items'>
                  <Badge count={order.total_items} showZero color='#1890ff' />
                </Descriptions.Item>
                <Descriptions.Item label='Total Quantity'>
                  <Badge
                    count={order.total_quantity}
                    showZero
                    color='#52c41a'
                  />
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <Descriptions column={1} size='small' bordered>
                <Descriptions.Item label='Supplier'>
                  <div>
                    <div className='font-semibold'>{order.supplierName}</div>
                    <div className='text-xs text-gray-500 mt-1'>
                      <UserOutlined className='mr-1' />
                      {order.contactPerson || 'N/A'}
                    </div>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label='Contact'>
                  <div className='space-y-1'>
                    {order.phone && (
                      <div className='flex items-center text-sm'>
                        <PhoneOutlined className='mr-2 text-gray-400' />
                        {order.phone}
                      </div>
                    )}
                    {order.email && (
                      <div className='flex items-center text-sm'>
                        <MailOutlined className='mr-2 text-gray-400' />
                        {order.email}
                      </div>
                    )}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label='Address'>
                  {order.address ? (
                    <div className='flex items-start text-sm'>
                      <EnvironmentOutlined className='mr-2 text-gray-400 mt-1' />
                      <span>{order.address}</span>
                    </div>
                  ) : (
                    <Text type='secondary'>Not provided</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>

          {order.notes && (
            <div className='mt-4'>
              <Title level={5}>
                <InfoCircleOutlined className='mr-2' />
                Notes
              </Title>
              <Paragraph className='bg-gray-50 p-3 rounded'>
                {order.notes}
              </Paragraph>
            </div>
          )}
        </Card>

        {/* Order Items */}
        <Card
          title={
            <div className='flex justify-between items-center'>
              <Title level={4} className='mb-0'>
                <ExportOutlined className='mr-2' />
                Order Items
              </Title>
              <div className='flex space-x-4'>
                <Badge count={getTotalItems()} showZero color='#1890ff'>
                  <Text type='secondary'>Items</Text>
                </Badge>
                <Badge count={getTotalQuantity()} showZero color='#52c41a'>
                  <Text type='secondary'>Quantity</Text>
                </Badge>
              </div>
            </div>
          }
        >
          {order.items && order.items.length > 0 ? (
            <Table
              columns={itemsColumns}
              dataSource={order.items}
              pagination={false}
              rowKey='alloy_id'
              size='middle'
            />
          ) : (
            <Empty
              description='No items in this order'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>

        {/* Summary */}
        <Card
          title={
            <Title level={4}>
              <InfoCircleOutlined className='mr-2' />
              Order Summary
            </Title>
          }
        >
          <Row gutter={16}>
            <Col span={8}>
              <div className='text-center p-4 bg-blue-50 rounded'>
                <div className='text-2xl font-bold text-blue-600'>
                  {getTotalItems()}
                </div>
                <div className='text-gray-600'>Total Items</div>
              </div>
            </Col>
            <Col span={8}>
              <div className='text-center p-4 bg-green-50 rounded'>
                <div className='text-2xl font-bold text-green-600'>
                  {getTotalQuantity()}
                </div>
                <div className='text-gray-600'>Total Quantity</div>
              </div>
            </Col>
            <Col span={8}>
              <div className='text-center p-4 bg-purple-50 rounded'>
                <div className='text-2xl font-bold text-purple-600'>
                  {order.items?.length || 0}
                </div>
                <div className='text-gray-600'>Product Types</div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </Modal>
  )
}

export default PurchaseOrderDetails
