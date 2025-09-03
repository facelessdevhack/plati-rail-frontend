import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Tabs,
  DatePicker,
  Modal,
  Spin,
  message,
  Alert,
  Typography,
  Avatar,
  Tag,
  Space,
  Tooltip,
  Statistic,
  Input,
  Button as AntButton,
  Badge,
  Divider
} from 'antd'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { 
  SyncOutlined, 
  UserOutlined, 
  SearchOutlined,
  ArrowLeftOutlined,
  WalletOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import CustomInput from '../../Core/Components/CustomInput'
import { editEntryAPI } from '../../redux/api/entriesAPI'
import Button from '../../Core/Components/CustomButton'
import {
  updateChargesEntryById,
  updateDealerEntryById,
  updatePaymentEntryById
} from '../../redux/slices/entry.slice'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'
import CustomSelect from '../../Core/Components/CustomSelect'
import CustomTable from '../../Core/Components/CustomTable'
import { getAllDealersOrders } from '../../redux/api/entriesAPI'
import { renderPaymentStatus } from '../../Utils/renderPaymentStatus'

const { Text, Title } = Typography;
const { Search } = Input;

const AdminOrderDashboard = () => {
  const [activeTab, setActiveTab] = useState(1)
  const [dealerInfo, setDealerInfo] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false) // State to manage modal visibility
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [checkedEntry, setCheckedEntry] = useState(false)
  const [cashAmount, setCashAmount] = useState(null)
  const today = moment().format('YYYY-MM-DD')
  const [entryDate, setEntryDate] = useState(today)
  const [description, setDescription] = useState('CASH')
  const [paymentMethod, setPaymentMethod] = useState(6)
  const [middleDealerId, setMiddleDealerId] = useState(null)
  const [loader, setLoader] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const { user } = useSelector(state => state.userDetails)

  const navigate = useNavigate()
  const { state } = useLocation()
  const { id } = useParams()
  const dispatch = useDispatch()
  const {
    allPMEntries,
    pmEntryCount,
    dealerEntryCount,
    spinLoader,
    allMiddleDealers,
    adminPaymentMethods,
    allAdminPaymentMethods,
    allDealersOrders,
    dealersOrdersCount
  } = useSelector(state => state.entryDetails)
  const { allProducts } = useSelector(state => state.stockDetails)

  const ROLE_ADMIN = 5

  const isAdmin = user.roleId === ROLE_ADMIN

  const getDealerInfo = async () => {
    try {
      const result = await client.get(`/master/dealer-info?id=${id}`)
      if (result) {
        console.log(result.data)
        setDealerInfo(result.data?.[0])
      }
    } catch (e) {
      console.log(e, 'ERROR OF DEALER INFO')
    }
  }

  useEffect(() => {
    dispatch(getAllDealersOrders({ id, page: currentPage, limit: pageSize }))
    getDealerInfo()
    console.log(allDealersOrders, 'ALL DEALERS ORDERS')
  }, [dispatch, currentPage, pageSize])

  // Filter dealers based on the search query
  const filteredDealers = allDealersOrders?.filter(entry =>
    entry?.productName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // // Filter payments based on the search query
  // const filteredPayments = allPMEntries?.filter(entry =>
  //     entry?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  const handleDownloadReport = async ({
    dealerId,
    dealerName,
    startDate,
    endDate
  }) => {
    try {
      setLoader(true)
      const response = await client.post(
        '/export/export-entries',
        {
          dealerId: +dealerId,
          dealerName,
          startDate,
          endDate
        },
        {
          responseType: 'blob' // Important for downloading files
        }
      )

      // Create a blob URL for the downloaded file
      const url = window.URL.createObjectURL(new Blob([response.data]))

      // Format the file name
      const formattedStartDate = moment(startDate)
      const formattedEndDate = moment(endDate)

      let fileName

      if (formattedStartDate.isValid() && formattedEndDate.isValid()) {
        // Both dates are valid
        const startDateFormatted = formattedStartDate.format('DD-MM-YYYY') // Adjust format as needed
        const endDateFormatted = formattedEndDate.format('DD-MM-YYYY') // Adjust format as needed
        fileName = `${dealerName} (${startDateFormatted} - ${endDateFormatted}).pdf`
      } else {
        // Use only dealer name if any date is invalid
        fileName = `${dealerName}.pdf`
      }

      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName) // Use the dynamic file name
      document.body.appendChild(link)
      link.click()
      link.remove()
      setLoader(false)
      return response.data // Return the response data if needed for further processing
    } catch (error) {
      setLoader(false)
      console.log(error, 'error')
      return error
    }
  }

  const handleAddPMEntry = async ({ amount, paymentDate }) => {
    try {
      setLoader(true)
      const response = await client.post('entries/create-pm-entry', {
        dealerId: id,
        dealerName: state?.name,
        description: description,
        amount,
        paymentMethod: paymentMethod,
        middleDealerId,
        payment_date: paymentDate
      })
      if (response) {
        setMiddleDealerId(null)
        setCashAmount(null)
        setEntryDate(today)
        setLoader(false)
        setPaymentMethod(6)
        setDescription('CASH')
        setCheckedEntry(!checkedEntry)
      }
      return response.data
    } catch (e) {
      setLoader(false)
      console.log(e, 'ERROR')
    }
  }

  const showDownloadModal = () => {
    setIsModalVisible(true)
  }

  const handleModalOk = async () => {
    // Call your download logic here
    await handleDownloadReport({
      dealerId: id,
      dealerName: state?.name,
      startDate,
      endDate
    })
    setIsModalVisible(false)
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
  }

  const showPaymentModalFunction = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentModalOk = async () => {
    await handleAddPMEntry({
      amount: cashAmount,
      paymentDate: entryDate
    })
    setShowPaymentModal(false)
    setCashAmount(null)
    setEntryDate(today)
    setDescription('CASH')
    setPaymentMethod(6)
    setMiddleDealerId(null)
  }

  const handlePaymentModalCancel = () => {
    setShowPaymentModal(false)
    setCashAmount(null)
    setEntryDate(today)
    setDescription('CASH')
    setPaymentMethod(6)
    setMiddleDealerId(null)
  }

  // Model and Functions for Editing Entry
  const showEditModalFunction = data => {
    setEditingEntry(data)
    setShowEditModal(true)
  }

  const handleEditModalOk = async () => {
    const finalEditingEntry =
      editingEntry.id === undefined
        ? {
            ...editingEntry,
            id: editingEntry?.inwardsEntryId || editingEntry.entryId
          }
        : editingEntry
    try {
      setLoader(true)
      const editEntryResponse = await editEntryAPI(finalEditingEntry)
      if (editEntryResponse) {
        setCheckedEntry(!checkedEntry)
        console.log(editEntryResponse, 'editEntryResponse')
        setLoader(false)
        setShowEditModal(false)
      } else {
        message.error('Unable to edit entry')
      }
    } catch (e) {
      message.info('Unable to edit entry')
      setLoader(false)
      setShowEditModal(false)
    }
  }

  const handleEditModalCancel = () => {
    setEditingEntry(null)
    setShowEditModal(false)
  }

  const getPaymentMethodLabel = methodId => {
    console.log(methodId, 'METHOD ID')
    const method = allAdminPaymentMethods.find(method => method.id === methodId)
    return method ? method.methodName : 'Unknown Method'
  }

  const formatINR = value => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getBalanceColor = value => {
    if (value === null || value === undefined) return ''
    return value < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'
  }

  // Clean columns without action buttons
  const columns = [
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: text => (
        <div className='flex flex-col'>
          <Text className='text-sm font-medium text-gray-900'>
            {moment(text).format('DD MMM YYYY') || '-'}
          </Text>
          <Text className='text-xs text-gray-500'>
            {moment(text).format('dddd') || ''}
          </Text>
        </div>
      ),
      sorter: (a, b) => moment(a.orderDate).unix() - moment(b.orderDate).unix(),
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        const statusConfig = {
          1: { color: '#DC2626', bg: '#FEF2F2', text: 'Pending' },
          2: { color: '#059669', bg: '#F0FDF4', text: 'Completed' },
          3: { color: '#D97706', bg: '#FFFBEB', text: 'Partial' }
        };
        const config = statusConfig[status] || statusConfig[1];
        return (
          <div className='flex items-center'>
            <div 
              className='w-2 h-2 rounded-full mr-2'
              style={{ backgroundColor: config.color }}
            ></div>
            <Text 
              className='text-sm font-medium'
              style={{ color: config.color }}
            >
              {config.text}
            </Text>
          </div>
        );
      },
      filters: [
        { text: 'Pending', value: 1 },
        { text: 'Completed', value: 2 },
        { text: 'Partial', value: 3 },
      ],
      onFilter: (value, record) => record.paymentStatus === value,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: text => (
        <Text className='text-sm font-semibold text-gray-900'>
          {formatINR(text)}
        </Text>
      ),
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: 'Pending Amount',
      dataIndex: 'pendingAmount', 
      key: 'pendingAmount',
      render: (text, record) => {
        const pendingAmount = record.paymentStatus === 1 
          ? record.totalAmount 
          : text;
        const isOverdue = pendingAmount > 0;
        return (
          <Text 
            className={`text-sm font-medium ${
              isOverdue ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            {formatINR(pendingAmount)}
          </Text>
        );
      },
      sorter: (a, b) => {
        const aPending = a.paymentStatus === 1 ? a.totalAmount : a.pendingAmount;
        const bPending = b.paymentStatus === 1 ? b.totalAmount : b.pendingAmount;
        return (aPending || 0) - (bPending || 0);
      },
    },
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: text => (
        <Text className={`text-sm ${
          text ? 'text-gray-900' : 'text-gray-400 italic'
        }`}>
          {text ? moment(text).format('DD MMM YYYY') : 'Not received'}
        </Text>
      ),
      sorter: (a, b) => {
        if (!a.paymentDate && !b.paymentDate) return 0;
        if (!a.paymentDate) return 1;
        if (!b.paymentDate) return -1;
        return moment(a.paymentDate).unix() - moment(b.paymentDate).unix();
      },
    }
  ]

  const handleDateChange = dates => {
    if (dates) {
      setStartDate(dates[0].startOf('day').toISOString())
      setEndDate(dates[1].endOf('day').toISOString())
    } else {
      setStartDate(null)
      setEndDate(null)
    }
  }

  const handlePages = (page, currentPageSize) => {
    setCurrentPage(page)
    setPageSize(currentPageSize)
  }

  const handleRefreshOrders = async () => {
    try {
      setLoader(true)
      const response = await client.post('/entries/create-single-order', {
        dealerId: id
      })
      if (response) {
        setLoader(false)
        console.log(response, 'RESPONSE')
        Alert.success('Order Created Successfully')
        dispatch(
          getAllDealersOrders({ id, page: currentPage, limit: pageSize })
        )
      }
    } catch (e) {
      setLoader(false)
      console.log(e, 'ERROR')
      dispatch(getAllDealersOrders({ id, page: currentPage, limit: pageSize }))
      Alert.error('Unable to create order')
    }
  }

  // Handle Tab Content Render
  const handleTabContentRender = () => {
    switch (activeTab) {
      case 1:
        return (
          <div className='pt-6'>
            <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6'>
              <div className='flex-1 max-w-md'>
                <Search
                  placeholder='Search orders...'
                  allowClear
                  size='large'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  prefix={<SearchOutlined />}
                />
              </div>
              <div className='flex items-center gap-3'>
                <Tooltip title='Refresh Orders'>
                  <AntButton
                    icon={<ReloadOutlined />}
                    onClick={handleRefreshOrders}
                    size='large'
                    className='hover:bg-blue-50 hover:border-blue-300'
                    loading={loader}
                  >
                    Refresh
                  </AntButton>
                </Tooltip>
                <DatePicker.RangePicker
                  onChange={handleDateChange}
                  size='large'
                  className='min-w-[280px]'
                  placeholder={['Start Date', 'End Date']}
                  suffixIcon={<CalendarOutlined />}
                />
              </div>
            </div>
            <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
              <CustomTable
                data={allDealersOrders}
                columns={columns}
                titleOnTop={false}
                position='bottomRight'
                expandable={false}
                totalCount={dealersOrdersCount}
                currentPage={currentPage}
                handlePageChange={handlePages}
                pageSize={pageSize}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Determine the color class based on the balance

  return (
    <div className='layout-container min-h-screen bg-gradient-to-br from-secondary-50/30 via-white to-primary-50/20 p-6'>
      {(loader || spinLoader) && (
        <Spin
          size='large'
          spinning={loader || spinLoader}
          className='fixed inset-0 z-50 bg-white/80 backdrop-blur-sm'
        />
      )}
      
      {/* Header Section */}
      <div className='content-section mb-6'>
        <div className='flex items-start justify-between mb-6'>
          {/* Back Button and Title */}
          <div className='flex items-center space-x-4'>
            <Tooltip title='Back to Dealers'>
              <AntButton 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/admin-daily-entry-dealers')}
                className='hover:bg-gray-50 hover:border-gray-300'
                size='large'
              />
            </Tooltip>
            <div className='flex items-center space-x-4'>
              <Avatar 
                size={64} 
                icon={<UserOutlined />} 
                className='bg-primary-100 text-primary-600 border-2 border-primary-200'
              />
              <div>
                <Title level={2} className='mb-1'>{dealerInfo?.dealerName || 'Order Dashboard'}</Title>
                <Text type='secondary' className='text-base'>
                  {dealerInfo?.district ? `${dealerInfo.district} • Dealer ID: ${id}` : `Dealer ID: ${id}`}
                </Text>
              </div>
            </div>
          </div>
          
          {/* Balance Card */}
          <Card className='min-w-[200px] shadow-lg border-l-4' style={{ borderLeftColor: dealerInfo?.currentBal < 0 ? '#EF4444' : '#10B981' }}>
            <Statistic
              title={
                <div className='flex items-center space-x-2'>
                  <WalletOutlined className='text-gray-500' />
                  <span>Current Balance</span>
                </div>
              }
              value={dealerInfo?.currentBal || 0}
              formatter={(value) => (
                <span className={getBalanceColor(value)}>
                  {formatINR(value)}
                </span>
              )}
              precision={0}
            />
          </Card>
        </div>
        
        {/* Quick Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className='text-center hover:shadow-md transition-shadow'>
              <Statistic
                title='Total Orders'
                value={dealersOrdersCount || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#374151' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className='text-center hover:shadow-md transition-shadow'>
              <Statistic
                title='Pending Orders'
                value={allDealersOrders?.filter(order => order.paymentStatus === 1).length || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#DC2626' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className='text-center hover:shadow-md transition-shadow'>
              <Statistic
                title='Completed Orders'
                value={allDealersOrders?.filter(order => order.paymentStatus === 2).length || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#059669' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className='text-center hover:shadow-md transition-shadow'>
              <Statistic
                title='Total Amount'
                value={allDealersOrders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0}
                prefix={<DollarOutlined />}
                formatter={(value) => formatINR(value)}
                valueStyle={{ color: '#374151' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
      
      {/* Main Content */}
      <div className='content-section'>
        <Tabs 
          activeKey={activeTab.toString()} 
          onChange={(key) => setActiveTab(parseInt(key))}
          size='large'
          className='professional-tabs'
          items={[
            {
              key: '1',
              label: (
                <div className='flex items-center space-x-2'>
                  <FileTextOutlined />
                  <span>Orders</span>
                  <Badge count={dealersOrdersCount} showZero style={{ backgroundColor: '#6B7280' }} />
                </div>
              ),
              children: handleTabContentRender()
            }
          ]}
        />
      </div>
    </div>
  )
}

export default AdminOrderDashboard
