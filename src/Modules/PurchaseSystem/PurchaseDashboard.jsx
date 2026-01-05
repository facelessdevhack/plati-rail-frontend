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
  Menu,
  Dropdown
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownOutlined,
  ToolOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  getVendors,
  getPurchaseOrders,
  getPurchaseOrderById,
  deletePurchaseOrder,
  exportPurchaseOrderPDF,
  clearError
} from '../../redux/api/purchaseSystemAPI'
import PurchaseOrderCreation from './PurchaseOrderCreation'
import PurchaseOrderDetails from './PurchaseOrderDetails'

const { Title } = Typography
const { Option } = Select
const { Search } = Input

const PurchaseDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Redux state - with default empty arrays to prevent undefined errors
  const {
    vendors = [],
    purchaseOrders = [],
    loading,
    error,
    pagination
  } = useSelector(state => state.purchaseSystem) || {}

  // Local state
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [currentPage, pageSize, selectedVendor, searchTerm])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(getVendors()).unwrap(),
        dispatch(
          getPurchaseOrders({
            page: currentPage,
            limit: pageSize,
            vendor_id: selectedVendor,
            search: searchTerm
          })
        ).unwrap()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleCreateOrder = () => {
    navigate('/purchase-orders/smart-purchasing')
  }

  const handleCreateModalClose = () => {
    setIsCreateModalVisible(false)
  }

  const handleCreateSuccess = () => {
    setIsCreateModalVisible(false)
    loadData()
    message.success('Purchase order created successfully')
  }

  const handleViewOrder = async order => {
    try {
      const result = await dispatch(getPurchaseOrderById(order.id)).unwrap()
      setSelectedOrder(result.data)
      setIsDetailsModalVisible(true)
    } catch (error) {
      message.error('Failed to load order details')
    }
  }

  const handleDetailsModalClose = () => {
    setIsDetailsModalVisible(false)
    setSelectedOrder(null)
  }

  const handleEditOrder = order => {
    setSelectedOrder(order)
    setIsCreateModalVisible(true)
  }

  const handleDeleteOrder = async order => {
    Modal.confirm({
      title: 'Delete Purchase Order',
      content: `Are you sure you want to delete order ${order.orderNumber || order.order_number}? This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No, Cancel',
      onOk: async () => {
        try {
          await dispatch(deletePurchaseOrder(order.id)).unwrap()
          message.success('Purchase order deleted successfully')
          loadData()
        } catch (error) {
          message.error('Failed to delete purchase order')
        }
      }
    })
  }

  const handleExportPDF = async order => {
    try {
      await dispatch(exportPurchaseOrderPDF(order.id)).unwrap()
      message.success('PDF exported successfully')
    } catch (error) {
      message.error('Failed to export PDF')
    }
  }

  const handleExportExcel = order => {
    try {
      // Export single order details with items
      const orderNumber = order.orderNumber || order.order_number || ''
      const vendorName = order.vendorName || order.vendor_name || ''

      const exportData = order.items ? order.items.map(item => ({
        'Order Number': orderNumber,
        'Order Date': order.orderDate || order.order_date || '',
        'Vendor Name': vendorName,
        'Mold Code': order.moldCode || order.mold_code || '',
        'Product Name': item.productName || item.product_name || '',
        'Model Name': item.modelName || item.model_name || '',
        'Size': item.size || '',
        'PCD': item.pcd || '',
        'Holes': item.holes || '',
        'Width': item.width || '',
        'Source Finish': item.sourceFinish || item.source_finish || '',
        'Target Finish': item.targetFinish || item.target_finish || '',
        'Quantity': item.quantity || 0,
        'Status': item.status || '',
        'Notes': item.notes || ''
      })) : [{
        'Order Number': orderNumber,
        'Order Date': order.orderDate || order.order_date || '',
        'Vendor Name': vendorName,
        'Mold Code': order.moldCode || order.mold_code || '',
        'Total Items': order.totalItems || order.total_items || 0,
        'Total Quantity': order.totalQuantity || order.total_quantity || 0,
        'Status': order.orderStatus || order.order_status || '',
        'Notes': order.notes || '',
        'Expected Delivery Date': order.expectedDeliveryDate || order.expected_delivery_date || ''
      }]

      // Excel Export - using simple HTML table method
      const tableHTML = `
        <table>
          <thead>
            <tr>
              ${Object.keys(exportData[0]).map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${exportData.map(row => `
              <tr>
                ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `

      const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `purchase_order_${orderNumber}_${new Date().toISOString().split('T')[0]}.xls`
      link.click()
      message.success('Excel file downloaded successfully')
    } catch (error) {
      console.error('Export error:', error)
      message.error('Failed to export data')
    }
  }

  const handleExportAllPDF = async () => {
    try {
      const orders = purchaseOrders || []
      if (orders.length === 0) {
        message.warning('No orders to export')
        return
      }

      // Export each order individually (for now)
      for (const order of orders) {
        await dispatch(exportPurchaseOrderPDF(order.id)).unwrap()
      }
      message.success(`${orders.length} PDF files exported successfully`)
    } catch (error) {
      message.error('Failed to export PDFs')
    }
  }

  const handleExportAllExcel = async () => {
    try {
      const orders = purchaseOrders || []
      if (orders.length === 0) {
        message.warning('No orders to export')
        return
      }

      // Fetch detailed data for all orders to get items
      const allOrderItems = []
      for (const order of orders) {
        try {
          const result = await dispatch(getPurchaseOrderById(order.id)).unwrap()
          const detailedOrder = result.data

          if (detailedOrder.items && detailedOrder.items.length > 0) {
            // Add each item as a separate row
            detailedOrder.items.forEach(item => {
              allOrderItems.push({
                'Order Number': detailedOrder.orderNumber || detailedOrder.order_number || '',
                'Order Date': detailedOrder.orderDate ? new Date(detailedOrder.orderDate).toLocaleDateString('en-GB') : '',
                'Vendor': detailedOrder.vendorName || detailedOrder.vendor_name || '',
                'Mold Code': detailedOrder.moldCode || detailedOrder.mold_code || '',
                'Product Name': item.productName || item.product_name || '',
                'Model Name': item.modelName || item.model_name || '',
                'Size': item.size || '',
                'PCD': item.pcd || '',
                'Holes': item.holes || '',
                'Width': item.width || '',
                'Finish': item.targetFinish || item.target_finish || item.sourceFinish || item.source_finish || '',
                'Quantity': item.quantity || 0
              })
            })
          } else {
            // If no items, add order summary as one row
            allOrderItems.push({
              'Order Number': detailedOrder.orderNumber || detailedOrder.order_number || '',
              'Order Date': detailedOrder.orderDate ? new Date(detailedOrder.orderDate).toLocaleDateString('en-GB') : '',
              'Vendor': detailedOrder.vendorName || detailedOrder.vendor_name || '',
              'Mold Code': detailedOrder.moldCode || detailedOrder.mold_code || '',
              'Product Name': 'No items',
              'Model Name': '',
              'Size': '',
              'PCD': '',
              'Holes': '',
              'Width': '',
              'Finish': '',
              'Quantity': detailedOrder.totalQuantity || detailedOrder.total_quantity || 0
            })
          }
        } catch (error) {
          console.error('Error fetching order details:', error)
          // Add basic order info if fetch fails
          allOrderItems.push({
            'Order Number': order.orderNumber || order.order_number || '',
            'Order Date': order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : '',
            'Vendor': order.vendorName || order.vendor_name || '',
            'Mold Code': order.moldCode || order.mold_code || '',
            'Product Name': 'Error loading items',
            'Model Name': '',
            'Size': '',
            'PCD': '',
            'Holes': '',
            'Width': '',
            'Finish': '',
            'Quantity': order.totalQuantity || order.total_quantity || 0
          })
        }
      }

      if (allOrderItems.length === 0) {
        message.warning('No items to export')
        return
      }

      const exportData = allOrderItems

      // Excel Export - using simple HTML table method
      const tableHTML = `
        <table>
          <thead>
            <tr>
              ${Object.keys(exportData[0]).map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${exportData.map(row => `
              <tr>
                ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `

      const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `purchase_order_items_${new Date().toISOString().split('T')[0]}.xls`
      link.click()
      message.success(`Excel file downloaded successfully with ${allOrderItems.length} items`)
    } catch (error) {
      console.error('Export error:', error)
      message.error('Failed to export data')
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  const handleTableChange = pagination => {
    setCurrentPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  const getExportMenu = order => (
    <Menu>
      <Menu.Item
        key='pdf'
        icon={<FilePdfOutlined />}
        onClick={() => handleExportPDF(order)}
      >
        Export as PDF
      </Menu.Item>
      <Menu.Item
        key='excel'
        icon={<FileExcelOutlined />}
        onClick={() => handleExportExcel(order)}
      >
        Export as Excel
      </Menu.Item>
    </Menu>
  )

  const getActionMenu = order => (
    <Menu>
      <Menu.Item
        key='view'
        icon={<EyeOutlined />}
        onClick={() => handleViewOrder(order)}
      >
        View Details
      </Menu.Item>
      <Menu.Item
        key='edit'
        icon={<EditOutlined />}
        onClick={() => handleEditOrder(order)}
      >
        Edit Order
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key='pdf'
        icon={<FilePdfOutlined />}
        onClick={() => handleExportPDF(order)}
      >
        Export as PDF
      </Menu.Item>
      <Menu.Item
        key='excel'
        icon={<FileExcelOutlined />}
        onClick={() => handleExportExcel(order)}
      >
        Export as Excel
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key='delete'
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDeleteOrder(order)}
      >
        Delete Order
      </Menu.Item>
    </Menu>
  )

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text, record) => (
        <Tag color='blue' icon={<ShoppingCartOutlined />}>
          {text || record.orderNumber}
        </Tag>
      ),
      sorter: true
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      render: (text, record) => (
        <div>
          <div className='font-semibold'>{text || record.vendorName}</div>
          <div className='text-xs text-gray-500'>
            {record.vendor_contact || record.vendorContact || ''}
          </div>
        </div>
      ),
      sorter: true
    },
    {
      title: 'Mold',
      dataIndex: 'mold_code',
      key: 'mold_code',
      render: (text, record) => {
        const moldCode = text || record.moldCode
        const moldType = record.mold_type || record.moldType
        return moldCode ? (
          <Tag color='purple' icon={<ToolOutlined />}>
            {moldCode}
            {moldType && <span className='text-xs'> ({moldType})</span>}
          </Tag>
        ) : (
          <span className='text-gray-400'>-</span>
        )
      }
    },
    {
      title: 'Order Date',
      dataIndex: 'order_date',
      key: 'order_date',
      render: (date, record) => (
        <span className='flex items-center'>
          <CalendarOutlined className='mr-1' />
          {new Date(date || record.orderDate).toLocaleDateString('en-IN')}
        </span>
      ),
      sorter: true
    },
    {
      title: 'Items',
      dataIndex: 'totalItems',
      key: 'totalItems',
      render: (count, record) => (
        <Badge count={count || record.total_items || 0} showZero color='#52c41a' />
      ),
      align: 'center'
    },
    {
      title: 'Quantity',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      render: (quantity, record) => (
        <span className='font-semibold'>{quantity || record.total_quantity || 0}</span>
      ),
      align: 'center'
    },
    {
      title: 'Status',
      dataIndex: 'order_status',
      key: 'order_status',
      render: (status, record) => {
        const orderStatus = status || record.orderStatus || 'pending'
        const statusColors = {
          pending: 'gold',
          approved: 'blue',
          in_progress: 'processing',
          completed: 'green',
          cancelled: 'red'
        }
        return (
          <Tag color={statusColors[orderStatus] || 'default'}>
            {orderStatus.replace('_', ' ').toUpperCase()}
          </Tag>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          overlay={getActionMenu(record)}
          trigger={['click']}
          placement='bottomRight'
        >
          <Button
            type='text'
            size='small'
            icon={<ExportOutlined />}
            onClick={e => e.preventDefault()}
          />
        </Dropdown>
      )
    }
  ]

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='mb-6'>
        <Row justify='space-between' align='middle'>
          <Col>
            <Title level={2} className='mb-0'>
              <ShopOutlined className='mr-2' />
              Purchase Orders
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh
              </Button>
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item
                      key='excel'
                      icon={<FileExcelOutlined />}
                      onClick={handleExportAllExcel}
                    >
                      Export All as Excel
                    </Menu.Item>
                    <Menu.Item
                      key='pdf'
                      icon={<FilePdfOutlined />}
                      onClick={handleExportAllPDF}
                    >
                      Export All as PDF
                    </Menu.Item>
                  </Menu>
                }
                trigger={['click']}
              >
                <Button icon={<ExportOutlined />}>
                  Export <DownOutlined />
                </Button>
              </Dropdown>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={handleCreateOrder}
              >
                Create Order
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className='mb-6'>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Orders'
              value={pagination?.total || (purchaseOrders || []).length}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Active Vendors'
              value={(vendors || []).length}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Items'
              value={(purchaseOrders || []).reduce(
                (sum, order) => sum + (order.totalItems || order.total_items || 0),
                0
              )}
              prefix={<FilePdfOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Quantity'
              value={(purchaseOrders || []).reduce(
                (sum, order) => sum + (order.totalQuantity || order.total_quantity || 0),
                0
              )}
              prefix={<FileExcelOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className='mb-6'>
        <Row gutter={16} align='middle'>
          <Col flex='auto'>
            <Search
              placeholder='Search by order number or vendor name...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder='Filter by Vendor'
              value={selectedVendor}
              onChange={setSelectedVendor}
              style={{ width: 200 }}
              allowClear
            >
              {(vendors || []).map(vendor => (
                <Option key={vendor.id} value={vendor.id}>
                  {vendor.vendorName || vendor.vendor_name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={purchaseOrders || []}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: pagination?.total || (purchaseOrders || []).length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `Showing ${range[0]}-${range[1]} of ${total} orders`
          }}
          onChange={handleTableChange}
          rowKey='id'
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Order Modal */}
      <PurchaseOrderCreation
        visible={isCreateModalVisible}
        onClose={handleCreateModalClose}
        onSuccess={handleCreateSuccess}
        editOrder={selectedOrder}
        vendors={vendors || []}
      />

      {/* Order Details Modal */}
      <PurchaseOrderDetails
        visible={isDetailsModalVisible}
        onClose={handleDetailsModalClose}
        order={selectedOrder}
      />
    </div>
  )
}

export default PurchaseDashboard
