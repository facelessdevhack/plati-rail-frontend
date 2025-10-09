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
  DownOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  getSuppliers,
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

  // Redux state
  const { suppliers, purchaseOrders, loading, error, pagination } = useSelector(
    state => state.purchaseSystem
  )

  // Local state
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [currentPage, pageSize, selectedSupplier, searchTerm])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(getSuppliers()).unwrap(),
        dispatch(
          getPurchaseOrders({
            page: currentPage,
            limit: pageSize,
            supplier_id: selectedSupplier,
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
      content: `Are you sure you want to delete order ${order.orderNumber}? This action cannot be undone.`,
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
      const exportData = order.items ? order.items.map(item => ({
        'Order Number': order.orderNumber || '',
        'Order Date': order.orderDate || '',
        'Supplier Name': order.supplierName || '',
        'Supplier Code': order.supplierCode || '',
        'Product Name': item.productName || '',
        'Model Name': item.modelName || '',
        'Size': item.size || '',
        'PCD': item.pcd || '',
        'Holes': item.holes || '',
        'Width': item.width || '',
        'Source Finish': item.sourceFinish || '',
        'Target Finish': item.targetFinish || '',
        'Quantity': item.quantity || 0,
        'Status': item.status || '',
        'Notes': item.notes || ''
      })) : [{
        'Order Number': order.orderNumber || '',
        'Order Date': order.orderDate || '',
        'Supplier Name': order.supplierName || '',
        'Supplier Code': order.supplierCode || '',
        'Total Items': order.totalItems || 0,
        'Total Quantity': order.totalQuantity || 0,
        'Status': order.orderStatus || '',
        'Notes': order.notes || '',
        'Expected Delivery Date': order.expectedDeliveryDate || ''
      }]

      // Excel Export - using simple HTML table method (like production plans)
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
      link.download = `purchase_order_${order.orderNumber}_${new Date().toISOString().split('T')[0]}.xls`
      link.click()
      message.success('Excel file downloaded successfully')
    } catch (error) {
      console.error('Export error:', error)
      message.error('Failed to export data')
    }
  }

  const handleExportAllPDF = async () => {
    try {
      if (purchaseOrders.length === 0) {
        message.warning('No orders to export')
        return
      }

      // Export each order individually (for now)
      for (const order of purchaseOrders) {
        await dispatch(exportPurchaseOrderPDF(order.id)).unwrap()
      }
      message.success(`${purchaseOrders.length} PDF files exported successfully`)
    } catch (error) {
      message.error('Failed to export PDFs')
    }
  }

  const handleExportAllExcel = async () => {
    try {
      if (purchaseOrders.length === 0) {
        message.warning('No orders to export')
        return
      }

      // Fetch detailed data for all orders to get items
      const allOrderItems = []
      for (const order of purchaseOrders) {
        try {
          const result = await dispatch(getPurchaseOrderById(order.id)).unwrap()
          const detailedOrder = result.data

          if (detailedOrder.items && detailedOrder.items.length > 0) {
            // Add each item as a separate row
            detailedOrder.items.forEach(item => {
              allOrderItems.push({
                'Order Number': detailedOrder.orderNumber || '',
                'Order Date': detailedOrder.orderDate ? new Date(detailedOrder.orderDate).toLocaleDateString('en-GB') : '',
                'Product Name': item.productName || '',
                'Model Name': item.modelName || '',
                'Size': item.size || '',
                'PCD': item.pcd || '',
                'Holes': item.holes || '',
                'Width': item.width || '',
                'Finish': item.targetFinish || item.sourceFinish || '',
                'Quantity': item.quantity || 0
              })
            })
          } else {
            // If no items, add order summary as one row
            allOrderItems.push({
              'Order Number': detailedOrder.orderNumber || '',
              'Order Date': detailedOrder.orderDate ? new Date(detailedOrder.orderDate).toLocaleDateString('en-GB') : '',
              'Product Name': 'No items',
              'Model Name': '',
              'Size': '',
              'PCD': '',
              'Holes': '',
              'Width': '',
              'Finish': '',
              'Quantity': detailedOrder.totalQuantity || 0
            })
          }
        } catch (error) {
          console.error('Error fetching order details:', error)
          // Add basic order info if fetch fails
          allOrderItems.push({
            'Order Number': order.orderNumber || '',
            'Order Date': order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : '',
            'Product Name': 'Error loading items',
            'Model Name': '',
            'Size': '',
            'PCD': '',
            'Holes': '',
            'Width': '',
            'Finish': '',
            'Quantity': order.totalQuantity || 0
          })
        }
      }

      if (allOrderItems.length === 0) {
        message.warning('No items to export')
        return
      }

      const exportData = allOrderItems

      // Excel Export - using simple HTML table method (like production plans)
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
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: text => (
        <Tag color='blue' icon={<ShoppingCartOutlined />}>
          {text}
        </Tag>
      ),
      sorter: true
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (text, record) => (
        <div>
          <div className='font-semibold'>{text}</div>
          <div className='text-xs text-gray-500'>{record.supplierName}</div>
        </div>
      ),
      sorter: true
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: date => (
        <span className='flex items-center'>
          <CalendarOutlined className='mr-1' />
          {new Date(date).toLocaleDateString('en-IN')}
        </span>
      ),
      sorter: true
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: count => <Badge count={count} showZero color='#52c41a' />,
      align: 'center'
    },
    {
      title: 'Total Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: quantity => <span className='font-semibold'>{quantity}</span>,
      align: 'center'
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: notes => (
        <Tooltip title={notes}>
          <span className='text-gray-600'>
            {notes || <span className='text-gray-400'>No notes</span>}
          </span>
        </Tooltip>
      )
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
              value={pagination.total}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Active Suppliers'
              value={suppliers.length}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Items'
              value={purchaseOrders.reduce(
                (sum, order) => sum + (order.total_items || 0),
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
              value={purchaseOrders.reduce(
                (sum, order) => sum + (order.total_quantity || 0),
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
              placeholder='Search by order number or supplier name...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder='Filter by Supplier'
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              style={{ width: 200 }}
              allowClear
            >
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.supplierName}
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
          dataSource={purchaseOrders}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `Showing ${range[0]}-${range[1]} of ${total} orders`
          }}
          onChange={handleTableChange}
          rowKey='id'
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create/Edit Order Modal */}
      <PurchaseOrderCreation
        visible={isCreateModalVisible}
        onClose={handleCreateModalClose}
        onSuccess={handleCreateSuccess}
        editOrder={selectedOrder}
        suppliers={suppliers}
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
