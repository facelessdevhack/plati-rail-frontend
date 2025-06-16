import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Card,
  Image,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  message,
  Modal
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  EditOutlined
} from '@ant-design/icons'
import { warrantyService } from './services/warrantyService'
import moment from 'moment'

const { Option } = Select
const { RangePicker } = DatePicker

const DealerWarrantyList = () => {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState({
    dealerId: '',
    searchText: '',
    productType: '',
    registerStatus: '',
    dateRange: null
  })
  const [dealers, setDealers] = useState([])
  const [previewImage, setPreviewImage] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('')

  // Fetch dealers for filter dropdown
  const fetchDealers = async () => {
    try {
      const response = await warrantyService.getDealers()
      if (response.success) {
        setDealers(response.data)
      }
    } catch (error) {
      console.error('Error fetching dealers:', error)
      message.error('Failed to fetch dealers')
    }
  }

  // Fetch warranty registrations
  const fetchWarrantyData = async (params = {}) => {
    setLoading(true)
    try {
      const response = await warrantyService.getAllProductRegistrations(
        filters.dealerId
      )

      if (response.success) {
        let filteredData = response.data

        // Apply client-side filters
        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase()
          filteredData = filteredData.filter(
            item =>
              item.customerName?.toLowerCase().includes(searchLower) ||
              item.warrantyCardNo?.toLowerCase().includes(searchLower) ||
              item.vehicleNo?.toLowerCase().includes(searchLower) ||
              item.mobileNo?.toString().includes(filters.searchText) ||
              item.dealerName?.toLowerCase().includes(searchLower)
          )
        }

        if (filters.productType) {
          filteredData = filteredData.filter(
            item => item.productType === filters.productType
          )
        }

        if (filters.registerStatus) {
          filteredData = filteredData.filter(
            item => item.registerStatus === filters.registerStatus
          )
        }

        if (filters.dateRange && filters.dateRange.length === 2) {
          const [startDate, endDate] = filters.dateRange
          filteredData = filteredData.filter(item => {
            const itemDate = moment(item.dop)
            return itemDate.isBetween(startDate, endDate, 'day', '[]')
          })
        }

        setData(filteredData)
        setPagination(prev => ({
          ...prev,
          total: filteredData.length
        }))
      }
    } catch (error) {
      console.error('Error fetching warranty data:', error)
      message.error('Failed to fetch warranty data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDealers()
    fetchWarrantyData()
  }, [])

  useEffect(() => {
    fetchWarrantyData()
  }, [filters])

  const handleTableChange = paginationInfo => {
    setPagination(paginationInfo)
  }

  const handlePreview = (imageUrl, title) => {
    setPreviewImage(imageUrl)
    setPreviewTitle(title)
    setPreviewVisible(true)
  }

  const handlePreviewCancel = () => {
    setPreviewVisible(false)
    setPreviewImage('')
    setPreviewTitle('')
  }

  const handleEditWarranty = record => {
    navigate(`/dealer-warranty/edit/${record.id}`)
  }

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'verified':
        return 'green'
      case 'pending':
        return 'orange'
      case 'draft':
        return 'blue'
      case 'inactive':
      case 'rejected':
        return 'red'
      default:
        return 'default'
    }
  }

  const getProductTypeColor = type => {
    switch (type?.toLowerCase()) {
      case 'alloy':
      case 'alloys':
        return 'blue'
      case 'tyres':
        return 'purple'
      case 'caps':
        return 'cyan'
      case 'ppf':
        return 'magenta'
      default:
        return 'default'
    }
  }

  const getOtpStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'green'
      case 'notverified':
        return 'red'
      default:
        return 'orange'
    }
  }

  const columns = [
    {
      title: 'S.No',
      key: 'serial',
      width: 60,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Warranty Card',
      dataIndex: 'warrantyCardImage',
      key: 'warrantyCardImage',
      width: 120,
      render: (imageUrl, record) => (
        <div className='flex flex-col items-center space-y-2'>
          {imageUrl ? (
            <div
              className='cursor-pointer'
              onClick={() =>
                handlePreview(
                  imageUrl,
                  `Warranty Card - ${record.warrantyCardNo}`
                )
              }
            >
              <Image
                width={80}
                height={60}
                src={imageUrl}
                alt='Warranty Card'
                style={{ objectFit: 'cover', borderRadius: '4px' }}
                preview={false}
              />
            </div>
          ) : (
            <div className='w-20 h-15 bg-gray-200 flex items-center justify-center rounded text-xs text-gray-500'>
              No Image
            </div>
          )}
          <div className='text-xs text-center'>
            <div className='font-medium'>{record.warrantyCardNo}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Vehicle Image',
      dataIndex: 'vehicleImage',
      key: 'vehicleImage',
      width: 120,
      render: (imageUrl, record) => (
        <div className='flex flex-col items-center space-y-2'>
          {imageUrl ? (
            <div
              className='cursor-pointer'
              onClick={() =>
                handlePreview(imageUrl, `Vehicle - ${record.vehicleNo}`)
              }
            >
              <Image
                width={80}
                height={60}
                src={imageUrl}
                alt='Vehicle'
                style={{ objectFit: 'cover', borderRadius: '4px' }}
                preview={false}
              />
            </div>
          ) : (
            <div className='w-20 h-15 bg-gray-200 flex items-center justify-center rounded text-xs text-gray-500'>
              No Image
            </div>
          )}
          <div className='text-xs text-center'>
            <div className='font-medium'>{record.vehicleNo}</div>
            <div className='text-gray-500'>{record.vehicleModel}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Customer Details',
      key: 'customer_details',
      width: 200,
      render: (_, record) => (
        <div className='space-y-1'>
          <div className='font-medium text-gray-900'>{record.customerName}</div>
          <div className='text-sm text-gray-600'>{record.mobileNo}</div>
          {record.emailAddress && (
            <div className='text-sm text-gray-600'>{record.emailAddress}</div>
          )}
        </div>
      )
    },
    {
      title: 'Product Info',
      key: 'product_info',
      width: 200,
      render: (_, record) => (
        <div className='space-y-2'>
          <div className='text-sm'>
            {record.warrantyCardNo && (
              <div className='flex justify-between items-center'>
                <strong>Warranty Card No:</strong> {record.warrantyCardNo}
              </div>
            )}
            {record.alloyModelName && (
              <div className='flex justify-between items-center'>
                <strong>Model:</strong> {record.alloyModelName}
              </div>
            )}
            {record.pcdName > 0 && (
              <div className='flex justify-between items-center'>
                <strong>PCD:</strong> {record.pcdName}
              </div>
            )}
            {record.inchesName > 0 && (
              <div className='flex justify-between items-center'>
                <strong>Inch:</strong> {record.inchesName}
              </div>
            )}
            {record.finishName && (
              <div className='flex justify-between items-center'>
                <strong>Finish:</strong> {record.finishName}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Dealer',
      dataIndex: 'dealerName',
      key: 'dealerName',
      width: 150,
      render: dealerName => (
        <div className='font-medium text-gray-900'>{dealerName}</div>
      )
    },
    {
      title: 'Purchase Date',
      dataIndex: 'dop',
      key: 'dop',
      width: 120,
      render: date => (
        <div className='text-sm'>
          {date ? moment(date).format('DD/MM/YYYY') : 'N/A'}
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <div className='space-y-1'>
          <Tag color={getStatusColor(record.registerStatus)}>
            {record.registerStatus || 'Unknown'}
          </Tag>
          <Tag color={getOtpStatusColor(record.otpVerified)} size='small'>
            {record.otpVerified === 'NotVerified'
              ? 'OTP Pending'
              : 'OTP Verified'}
          </Tag>
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: amount => (
        <div className='font-medium'>
          {amount ? `₹${parseFloat(amount).toLocaleString('en-IN')}` : 'N/A'}
        </div>
      )
    },
    {
      title: 'Entry Details',
      key: 'entry_details',
      width: 150,
      render: (_, record) => (
        <div className='text-sm space-y-1'>
          <div>
            <strong>By:</strong> {record.enteredAt}
          </div>
          <div>
            {record.enteredDateGmt
              ? moment(record.enteredDateGmt).format('DD/MM/YYYY hh:mm A')
              : 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size='middle'>
          <Button
            type='primary'
            icon={<EditOutlined />}
            size='small'
            onClick={() => handleEditWarranty(record)}
            title='Edit Warranty'
          >
            Edit
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className='p-6'>
      <Card>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>
            Dealer Warranty Registrations
          </h2>

          {/* Filters */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4'>
            <Input
              placeholder='Search customer, warranty card, vehicle...'
              prefix={<SearchOutlined />}
              value={filters.searchText}
              onChange={e =>
                setFilters(prev => ({ ...prev, searchText: e.target.value }))
              }
              allowClear
            />

            <Select
              placeholder='Select Dealer'
              value={filters.dealerId}
              onChange={value =>
                setFilters(prev => ({ ...prev, dealerId: value }))
              }
              allowClear
              showSearch
              optionFilterProp='children'
            >
              {dealers.map(dealer => (
                <Option key={dealer.id} value={dealer.id}>
                  {dealer.buyer_name || dealer.dealerName || dealer.name}
                </Option>
              ))}
            </Select>

            <Select
              placeholder='Product Type'
              value={filters.productType}
              onChange={value =>
                setFilters(prev => ({ ...prev, productType: value }))
              }
              allowClear
            >
              <Option value='Alloy'>Alloy</Option>
              <Option value='Tyres'>Tyres</Option>
              <Option value='Caps'>Caps</Option>
              <Option value='PPF'>PPF</Option>
            </Select>

            <Select
              placeholder='Status'
              value={filters.registerStatus}
              onChange={value =>
                setFilters(prev => ({ ...prev, registerStatus: value }))
              }
              allowClear
            >
              <Option value='Draft'>Draft</Option>
              <Option value='Active'>Active</Option>
              <Option value='Pending'>Pending</Option>
              <Option value='Inactive'>Inactive</Option>
              <Option value='Verified'>Verified</Option>
            </Select>

            <RangePicker
              value={filters.dateRange}
              onChange={dates =>
                setFilters(prev => ({ ...prev, dateRange: dates }))
              }
              format='DD/MM/YYYY'
              placeholder={['Start Date', 'End Date']}
            />
          </div>

          <div className='flex justify-between items-center'>
            <div className='text-sm text-gray-600'>
              Total Records: {data.length}
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchWarrantyData()}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey='id'
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500, y: 600 }}
          size='small'
          bordered
        />
      </Card>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handlePreviewCancel}
        width={800}
        centered
      >
        <img
          alt='Preview'
          style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
          src={previewImage}
        />
      </Modal>
    </div>
  )
}

export default DealerWarrantyList
