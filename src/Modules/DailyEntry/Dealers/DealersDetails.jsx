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
  Button as AntButton,
  Space,
  Typography,
  Statistic,
  Badge,
  Avatar,
  Tooltip,
  Divider,
  Input
} from 'antd'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { 
  DownloadOutlined, 
  UserOutlined,
  WalletOutlined,
  ReloadOutlined,
  PlusOutlined,
  FileTextOutlined,
  SearchOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  DollarOutlined
} from '@ant-design/icons'
import CustomTable from '../../../Core/Components/CustomTable'
import CustomInput from '../../../Core/Components/CustomInput'
import {
  editEntryAPI,
  editInwardsEntryAPI,
  getAdminPaymentMethods,
  getAllEntriesAdmin,
  getAllPaymentMethods,
  getMiddleDealers,
  getPaymentEntries,
  checkMultipleEntriesAPI,
  deletePaymentEntryAPI
} from '../../../redux/api/entriesAPI'

import Button from '../../../Core/Components/CustomButton'
import {
  updateChargesEntryById,
  updateDealerEntryById,
  updatePaymentEntryById
} from '../../../redux/slices/entry.slice'
import { client } from '../../../Utils/axiosClient'
import moment from 'moment'
import CustomSelect from '../../../Core/Components/CustomSelect'
import { getAllProducts } from '../../../redux/api/stockAPI'

const { Title, Text } = Typography;
const { Search } = Input;

const AdminDealerDetails = () => {
  const [activeTab, setActiveTab] = useState(1)
  const [dealerInfo, setDealerInfo] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
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
  const [selectedEntries, setSelectedEntries] = useState([])
  const [selectedPayments, setSelectedPayments] = useState([])
  const { user } = useSelector(state => state.userDetails)

  const navigate = useNavigate()
  const { state } = useLocation()
  const { id } = useParams()
  const dispatch = useDispatch()
  const {
    allDealerEntries,
    allPMEntries,
    pmEntryCount,
    dealerEntryCount,
    dealerEntriesPagination,
    paymentEntriesPagination,
    spinLoader,
    allMiddleDealers,
    adminPaymentMethods,
    allAdminPaymentMethods
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
    dispatch(
      getAllEntriesAdmin({
        dealerId: id,
        page: currentPage,
        limit: pageSize,
        startDate,
        endDate,
        sortField,
        sortOrder
      })
    )
    dispatch(
      getPaymentEntries({
        dealerId: id,
        page: currentPage,
        limit: pageSize,
        startDate,
        endDate,
        sortField,
        sortOrder
      })
    )
    dispatch(getMiddleDealers({}))
    dispatch(getAdminPaymentMethods({}))
    dispatch(getAllPaymentMethods({}))
    getDealerInfo()
    dispatch(getAllProducts({}))
  }, [
    dispatch,
    currentPage,
    pageSize,
    startDate,
    endDate,
    sortField,
    sortOrder,
    checkedEntry,
    id
  ])

  // Filter dealers based on the search query (client-side filtering for search)
  const filteredDealers = searchQuery 
    ? allDealerEntries?.filter(entry =>
        String(entry?.productName || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : allDealerEntries

  // Filter payments based on the search query (client-side filtering for search)
  const filteredPayments = searchQuery
    ? allPMEntries?.filter(entry =>
        String(entry?.description || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : allPMEntries

  // Check Entry Function for Entries
  const handleCheckEntry = async entryId => {
    try {
      setLoader(true)
      const checkEntryResponse = await client.post(`/entries/check-entry`, {
        entryId
      })
      if (checkEntryResponse) {
        console.log(checkEntryResponse, 'CHECK ENTRY RESPONSE')
        dispatch(updateDealerEntryById({ entryId, checked: 1 }))
        setCheckedEntry(!checkedEntry)
        setLoader(false)
      }
    } catch (e) {
      setLoader(false)
      console.log(e, 'CHECK ENTRY ERROR')
    }
  }

  // Check Purchase Entry Function for Entries
  const handleCheckPurchaseEntry = async entryId => {
    try {
      setLoader(true)
      const checkEntryResponse = await client.post(
        `/entries/check-purchase-entry`,
        {
          entryId
        }
      )
      if (checkEntryResponse) {
        console.log(checkEntryResponse, 'CHECK ENTRY RESPONSE')
        dispatch(updateDealerEntryById({ entryId, checked: 1 }))
        setCheckedEntry(!checkedEntry)
        setLoader(false)
      }
    } catch (e) {
      setLoader(false)
      console.log(e, 'CHECK ENTRY ERROR')
    }
  }

  // Check Entry Function for Payments
  const handleCheckPaymentEntry = async entryId => {
    try {
      setLoader(true)
      const checkEntryResponse = await client.post(
        `/entries/check-payment-entry`,
        {
          entryId
        }
      )
      if (checkEntryResponse) {
        console.log(checkEntryResponse, 'CHECK ENTRY RESPONSE')
        dispatch(updatePaymentEntryById({ entryId, checked: 1 }))
        setCheckedEntry(!checkedEntry)
        setLoader(false)
      }
    } catch (e) {
      setLoader(false)
      console.log(e, 'CHECK ENTRY ERROR')
    }
  }

  // Check Entry Function for Charges
  const handleCheckChargesEntry = async entryId => {
    try {
      setLoader(true)
      const checkEntryResponse = await client.post(
        `/entries/check-charges-entry`,
        {
          entryId
        }
      )
      if (checkEntryResponse) {
        console.log(checkEntryResponse, 'CHECK ENTRY RESPONSE')
        dispatch(updateChargesEntryById({ entryId, checked: 1 }))
        setCheckedEntry(!checkedEntry)
        setLoader(false)
      }
    } catch (e) {
      setLoader(false)
      console.log(e, 'CHECK ENTRY ERROR')
    }
  }
// Delete Payment Entry Function
  const handleDeletePaymentEntry = async (record) => {
    Modal.confirm({
      title: 'Delete Payment Entry',
      content: (
        <div>
          <p>Are you sure you want to delete this payment entry?</p>
          <p><strong>Description:</strong> {record.description}</p>
          <p><strong>Amount:</strong> {formatINR(record.amount)}</p>
          <p><strong>Date:</strong> {moment(record.paymentDate).format('DD/MM/YYYY')}</p>
          <p className="text-red-500 text-sm">
            Note: This entry will be archived and can be restored if needed.
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoader(true)
          const response = await deletePaymentEntryAPI({
            paymentId: record.id,
            reason: 'Deleted by admin from dealer details page'
          })
          
          if (response.data?.message) {
            message.success('Payment entry deleted and archived successfully!')
            // Refresh the payment entries
            getPaymentEntries({ dealerId: id })
            getDealerInfo() // Refresh dealer info to update balance
          } else {
            message.error('Failed to delete payment entry')
          }
        } catch (error) {
          console.error('Error deleting payment entry:', error)
          message.error('Failed to delete payment entry')
        } finally {
          setLoader(false)
        }
      }
    })
  }

  // Multi-select entry check function
  const handleCheckMultipleEntries = async () => {
    if (selectedEntries.length === 0) {
      message.warning('Please select at least one entry to check')
      return
    }

    try {
      setLoader(true)
      const response = await checkMultipleEntriesAPI({
        entryIds: selectedEntries,
        entryType: 1 // Regular entries
      })

      if (response) {
        message.success(`${response.checkedCount || selectedEntries.length} entries checked successfully`)
        setSelectedEntries([])
        setCheckedEntry(!checkedEntry)
        setLoader(false)
      }
    } catch (e) {
      setLoader(false)
      message.error('Failed to check entries')
      console.log(e, 'MULTI-CHECK ENTRY ERROR')
    }
  }

  // Multi-select payment check function
  const handleCheckMultiplePayments = async () => {
    if (selectedPayments.length === 0) {
      message.warning('Please select at least one payment to check')
      return
    }

    try {
      setLoader(true)
      const response = await checkMultipleEntriesAPI({
        entryIds: selectedPayments,
        entryType: 2 // Payment entries
      })

      if (response) {
        message.success(`${response.checkedCount || selectedPayments.length} payments checked successfully`)
        setSelectedPayments([])
        setCheckedEntry(!checkedEntry)
        setLoader(false)
      }
    } catch (e) {
      setLoader(false)
      message.error('Failed to check payments')
      console.log(e, 'MULTI-CHECK PAYMENT ERROR')
    }
  }

  // Handle selection change for entries
  const handleEntrySelectionChange = (selectedRowKeys) => {
    setSelectedEntries(selectedRowKeys)
  }

  // Handle selection change for payments
  const handlePaymentSelectionChange = (selectedRowKeys) => {
    setSelectedPayments(selectedRowKeys)
  }

  // Select all unchecked entries
  const handleSelectAllUncheckedEntries = () => {
    const uncheckedEntries = filteredDealers.filter(entry => entry.isChecked === 0).map(entry => entry.entryId)
    setSelectedEntries(uncheckedEntries)
  }

  // Select all unchecked payments
  const handleSelectAllUncheckedPayments = () => {
    const uncheckedPayments = filteredPayments.filter(payment => payment.isPaid === 0).map(payment => payment.id)
    setSelectedPayments(uncheckedPayments)
  }

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

  // Columns for Entries
  const columns = [
    ...(isAdmin
      ? [
          {
            title: () => (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedEntries.length > 0 && selectedEntries.length === filteredDealers.filter(entry => entry.isChecked === 0).length}
                  onChange={handleSelectAllUncheckedEntries}
                  disabled={filteredDealers.filter(entry => entry.isChecked === 0).length === 0}
                  className="cursor-pointer"
                />
              </div>
            ),
            dataIndex: 'entryId',
            key: 'entryId',
            render: (text, record) => (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedEntries.includes(text)}
                  onChange={() => {
                    if (selectedEntries.includes(text)) {
                      setSelectedEntries(selectedEntries.filter(id => id !== text))
                    } else {
                      setSelectedEntries([...selectedEntries, text])
                    }
                  }}
                  disabled={record.isChecked === 1}
                  className="cursor-pointer"
                />
              </div>
            ),
            width: 60,
            align: 'center'
          }
        ]
      : []),
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: text => <div>{moment(text).format('DD/MM/YYYY') || '-'}</div>
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      render: text => <div>{text || '-'}</div>
    },
    {
      title: <div className='flex justify-center items-center'>Quantity</div>,
      dataIndex: 'quantity',
      key: 'quantity',
      render: text => (
        <div className='flex justify-center items-center'>{text || '-'}</div>
      )
    },
    {
      title: <div className='flex justify-center items-center'>Amount</div>,
      dataIndex: 'price',
      key: 'price',
      render: (text, record) => (
        <div className='flex justify-center items-center'>
          <div>{record.isClaim === 1 ? 'Claimed' : formatINR(text)}</div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: text => (
        <div>
          {text === 1
            ? 'Pending'
            : text === 2
            ? 'Partial'
            : text === 3
            ? 'Paid'
            : '-'}
        </div>
      )
    },
    {
      title: 'Entry Type',
      dataIndex: 'source',
      key: 'source',
      render: text => <div>{text || '-'}</div>
    },
    {
      title: 'Balance After Entry',
      dataIndex: 'currentBal',
      key: 'currentBal',
      render: (value, record) => (
        <div>
          {value !== null && value !== undefined ? (
            <span className={getBalanceColor(record?.entryCurrentBal || value)}>
              {formatINR(record?.entryCurrentBal || value)}
            </span>
          ) : (
            '₹0'
          )}
        </div>
      )
    },
    ...(isAdmin
      ? [
          {
            title: 'Checked',
            dataIndex: 'isChecked',
            key: 'isChecked',
            render: (text, record) => (
              <Button
                size='slim'
                padding='slim'
                onClick={() => {
                  if (record.source === 'Purchase') {
                    handleCheckPurchaseEntry(record.entryId)
                  } else if (record.sourceType == 4) {
                    handleCheckChargesEntry(record.entryId)
                  } else {
                    handleCheckEntry(record.entryId)
                  }
                }}
              >
                <div>{text === 1 ? 'Checked' : 'Unchecked'}</div>
              </Button>
            )
          }
        ]
      : [])
  ]

  // Columns for Payments
  const paymentColumns = [
    ...(isAdmin
      ? [
          {
            title: () => (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedPayments.length > 0 && selectedPayments.length === filteredPayments.filter(payment => payment.isPaid === 0).length}
                  onChange={handleSelectAllUncheckedPayments}
                  disabled={filteredPayments.filter(payment => payment.isPaid === 0).length === 0}
                  className="cursor-pointer"
                />
              </div>
            ),
            dataIndex: 'id',
            key: 'id',
            render: (text, record) => (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedPayments.includes(text)}
                  onChange={() => {
                    if (selectedPayments.includes(text)) {
                      setSelectedPayments(selectedPayments.filter(id => id !== text))
                    } else {
                      setSelectedPayments([...selectedPayments, text])
                    }
                  }}
                  disabled={record.isPaid === 1}
                  className="cursor-pointer"
                />
              </div>
            ),
            width: 60,
            align: 'center'
          }
        ]
      : []),
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: text => <div>{moment(text).format('DD/MM/YYYY')}</div>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: text => <div>{text}</div>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: text => (
        <div className='flex justify-between items-center'>
          {formatINR(text)}
        </div>
      )
    },
    {
      title: 'Mode of Payment',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (text, record) => <div>{getPaymentMethodLabel(text)}</div>
    },
    {
      title: 'Transportation Charges',
      dataIndex: 'transportationCharges',
      key: 'transportationCharges',
      render: text => <div>{text}</div>
    },
    {
      title: 'Balance After Entry',
      dataIndex: 'currentBal',
      key: 'currentBal',
      render: (value, record) => (
        <div>
          {value !== null && value !== undefined ? (
            <span className={getBalanceColor(record.entryCurrentBal || value)}>
              {formatINR(record.entryCurrentBal || value)}
            </span>
          ) : (
            '₹0'
          )}
        </div>
      )
    },
    ...(isAdmin
      ? [
          {
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
              <Button
                size="slim"
                padding="slim"
                type="primary"
                danger
                onClick={() => handleDeletePaymentEntry(record)}
              >
                Delete
              </Button>
            )
          },
          {
            title: 'Checked',
            dataIndex: 'isPaid',
            key: 'isPaid',
            render: (text, record) => (
              <Button
                size='slim'
                padding='slim'
                onClick={() => handleCheckPaymentEntry(record.id)}
              >
                {text === 1 ? 'Checked' : 'Unchecked'}
              </Button>
            )
          }
        ]
      : [])
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
    if (currentPageSize !== pageSize) {
      setPageSize(currentPageSize)
    }
  }

  const handleOrderDashboard = () => {
    console.log(id, 'RECORD')
    navigate(`/admin-orders-dashboard/${id}`, {
      state: { id: id }
    })
  }

  const handleRecalculateBalance = async () => {
    try {
      setLoader(true)
      const response = await client.post(
        '/entries/recalculate-dealer-balance',
        {
          dealerId: id
        }
      )

      if (response.data.success) {
        message.success('Dealer balance recalculated successfully!')
        // Refresh dealer info to get updated balance
        getDealerInfo()
      } else {
        message.error(response.data.message || 'Failed to recalculate balance')
      }
    } catch (error) {
      console.error('Error recalculating balance:', error)
      message.error('Failed to recalculate dealer balance')
    } finally {
      setLoader(false)
    }
  }

  // Render tab content
  const renderTabContent = (tabKey) => {
    switch (tabKey) {
      case 1:
        const sortedFilteredDealers = [...filteredDealers].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )

        return (
          <div className='pt-6'>
            {isAdmin && selectedEntries.length > 0 && (
              <div className='mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-blue-800 font-medium'>
                    {selectedEntries.length} entr{selectedEntries.length > 1 ? 'ies' : 'y'} selected
                  </span>
                  <AntButton
                    type='primary'
                    size='small'
                    onClick={handleCheckMultipleEntries}
                    className='bg-blue-600 border-blue-600 hover:bg-blue-700'
                  >
                    Check Selected
                  </AntButton>
                  <AntButton
                    size='small'
                    onClick={() => setSelectedEntries([])}
                  >
                    Clear Selection
                  </AntButton>
                </div>
              </div>
            )}
            <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6'>
              <div className='flex-1 max-w-md'>
                <Search
                  placeholder='Search entries...'
                  allowClear
                  size='large'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  prefix={<SearchOutlined />}
                />
              </div>
              <div className='flex items-center gap-3'>
                <Tooltip title='Check Orders'>
                  <AntButton
                    icon={<FileTextOutlined />}
                    onClick={handleOrderDashboard}
                    size='large'
                    className='hover:bg-blue-50 hover:border-blue-300'
                  >
                    Orders
                  </AntButton>
                </Tooltip>
                {isAdmin && (
                  <Tooltip title='Add Payment Entry'>
                    <AntButton
                      type='primary'
                      icon={<PlusOutlined />}
                      onClick={showPaymentModalFunction}
                      size='large'
                      className='bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700'
                    >
                      Add Payment
                    </AntButton>
                  </Tooltip>
                )}
                <Tooltip title='Recalculate Balance'>
                  <AntButton
                    icon={<ReloadOutlined />}
                    onClick={handleRecalculateBalance}
                    size='large'
                    className='hover:bg-orange-50 hover:border-orange-300'
                  >
                    Recalculate
                  </AntButton>
                </Tooltip>
                <Tooltip title='Export Report'>
                  <AntButton
                    icon={<DownloadOutlined />}
                    onClick={showDownloadModal}
                    size='large'
                    className='hover:bg-gray-50 hover:border-gray-300'
                  >
                    Export
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
                isAdmin={isAdmin}
                editFunction={showEditModalFunction}
                data={sortedFilteredDealers}
                titleOnTop={false}
                position='bottomRight'
                columns={columns}
                expandable={false}
                totalCount={searchQuery ? filteredDealers?.length : dealerEntriesPagination?.total || dealerEntryCount}
                currentPage={currentPage}
                handlePageChange={handlePages}
                currentPageSize={pageSize}
                showSort={true}
              />
            </div>
          </div>
        )
      case 2:
        const sortedFilteredPayments = [...filteredPayments].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
        return (
          <div className='pt-6'>
            {isAdmin && selectedPayments.length > 0 && (
              <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-green-800 font-medium'>
                    {selectedPayments.length} payment{selectedPayments.length > 1 ? 's' : ''} selected
                  </span>
                  <AntButton
                    type='primary'
                    size='small'
                    onClick={handleCheckMultiplePayments}
                    className='bg-green-600 border-green-600 hover:bg-green-700'
                  >
                    Check Selected
                  </AntButton>
                  <AntButton
                    size='small'
                    onClick={() => setSelectedPayments([])}
                  >
                    Clear Selection
                  </AntButton>
                </div>
              </div>
            )}
            <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6'>
              <div className='flex-1 max-w-md'>
                <Search
                  placeholder='Search payments...'
                  allowClear
                  size='large'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  prefix={<SearchOutlined />}
                />
              </div>
              <div className='flex items-center gap-3'>
                {isAdmin && (
                  <Tooltip title='Add Payment Entry'>
                    <AntButton
                      type='primary'
                      icon={<PlusOutlined />}
                      onClick={showPaymentModalFunction}
                      size='large'
                      className='bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700'
                    >
                      Add Payment
                    </AntButton>
                  </Tooltip>
                )}
                {isAdmin && (
                  <Tooltip title='Recalculate Balance'>
                    <AntButton
                      icon={<ReloadOutlined />}
                      onClick={handleRecalculateBalance}
                      size='large'
                      className='hover:bg-orange-50 hover:border-orange-300'
                    >
                      Recalculate
                    </AntButton>
                  </Tooltip>
                )}
                <Tooltip title='Export Report'>
                  <AntButton
                    icon={<DownloadOutlined />}
                    onClick={showDownloadModal}
                    size='large'
                    className='hover:bg-gray-50 hover:border-gray-300'
                  >
                    Export
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
                isAdmin={isAdmin}
                editFunction={showEditModalFunction}
                data={sortedFilteredPayments}
                titleOnTop={false}
                position='bottomRight'
                columns={paymentColumns}
                expandable={false}
                totalCount={searchQuery ? filteredPayments?.length : paymentEntriesPagination?.total || pmEntryCount}
                currentPage={currentPage}
                handlePageChange={handlePages}
                currentPageSize={pageSize}
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
                <Title level={2} className='mb-1'>{state?.name}</Title>
                <Text type='secondary' className='text-base'>Dealer ID: {id}</Text>
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
                title='Total Entries'
                value={dealerEntryCount || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#374151' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className='text-center hover:shadow-md transition-shadow'>
              <Statistic
                title='Payment Entries'
                value={pmEntryCount || 0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#374151' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className='text-center hover:shadow-md transition-shadow'>
              <Statistic
                title='Unchecked Entries'
                value={allDealerEntries?.filter(entry => entry.isChecked === 0).length || 0}
                valueStyle={{ color: '#DC2626' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className='text-center hover:shadow-md transition-shadow'>
              <Statistic
                title='Unchecked Payments'
                value={allPMEntries?.filter(entry => entry.isPaid === 0).length || 0}
                valueStyle={{ color: '#DC2626' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
      
      {/* Main Content */}
      <div className='content-section'>
        <Tabs
          activeKey={activeTab.toString()}
          onChange={(key) => {
            setActiveTab(parseInt(key))
            setSelectedEntries([])
            setSelectedPayments([])
          }}
          size='large'
          className='professional-tabs'
          items={[
            {
              key: '1',
              label: (
                <div className='flex items-center space-x-2'>
                  <FileTextOutlined />
                  <span>Entries</span>
                </div>
              ),
              children: renderTabContent(1)
            },
            {
              key: '2', 
              label: (
                <div className='flex items-center space-x-2'>
                  <DollarOutlined />
                  <span>Payments</span>
                </div>
              ),
              children: renderTabContent(2)
            }
          ]}
        />

      </div>
      
      {/* Download Report Modal */}
      <Modal
        title={
          <div className='flex items-center space-x-3'>
            <DownloadOutlined className='text-primary' />
            <span>Download Report for {state?.name}</span>
          </div>
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={500}
        footer={
          <div className='flex justify-end items-center gap-3'>
            <AntButton onClick={handleModalCancel} size='large'>
              Cancel
            </AntButton>
            <AntButton 
              type='primary' 
              onClick={handleModalOk} 
              size='large'
              icon={<DownloadOutlined />}
              style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}
            >
              Download Report
            </AntButton>
          </div>
        }
            >
        <div className='py-4'>
          <div className='mb-4'>
            <Text type='secondary' className='text-sm'>
              Select date range to export data for specific period. Leave empty to export all data.
            </Text>
          </div>
          <DatePicker.RangePicker
            onChange={handleDateChange}
            style={{ width: '100%' }}
            size='large'
            placeholder={['Start Date', 'End Date']}
            suffixIcon={<CalendarOutlined />}
          />
        </div>
            </Modal>

      {/* Add Payment Entry Modal */}
      <Modal
        title={
          <div className='flex items-center space-x-3'>
            <PlusOutlined className='text-green-600' />
            <span>Add Payment Entry for {state?.name}</span>
          </div>
        }
        open={showPaymentModal}
        onOk={handlePaymentModalOk}
        onCancel={handlePaymentModalCancel}
        width={600}
        footer={
          <div className='flex justify-end items-center gap-3'>
            <AntButton onClick={handlePaymentModalCancel} size='large'>
              Cancel
            </AntButton>
            <AntButton
              type='primary'
              onClick={handlePaymentModalOk}
              size='large'
              icon={<PlusOutlined />}
              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
              disabled={!cashAmount || !entryDate}
            >
              Create Payment Entry
            </AntButton>
          </div>
        }
            >
              <div>
                {loader && (
                  <Spin
                    size='large'
                    spinning={loader}
                    fullscreen={true}
                    className='z-20'
                  ></Spin>
                )}
                <div>
                  <div>Enter Description</div>
                  <CustomInput
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <div>Enter Amount</div>
                  <CustomInput
                    type='number'
                    value={cashAmount}
                    onChange={e => setCashAmount(e.target.value)}
                  />
                </div>
                <div>
                  <div>Payment Date</div>
                  <CustomInput
                    type='date'
                    value={entryDate}
                    onChange={e => {
                      setEntryDate(e.target.value)
                      console.log(e.target.value, 'PAYMENT DATE')
                    }}
                  />
                </div>
                <div>
                  <div>Select Mid-Dealer</div>
                  <CustomSelect
                    showSearch={true}
                    className='w-full'
                    options={allMiddleDealers}
                    value={middleDealerId}
                    onChange={(e, l) => setMiddleDealerId(e)}
                  />
                </div>
                <div>
                  <div>Payment Method</div>
                  <div className='flex justify-start'>
                    {adminPaymentMethods?.map(method => (
                      <label
                        key={method}
                        className='mr-4 flex justify-start gap-x-2'
                      >
                        <input
                          type='radio'
                          name='paymentMethod'
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                        />
                        {method.methodName}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Modal>

      {/* Edit Entry Modal */}
      <Modal
        title={
          <div className='flex items-center space-x-3'>
            <FileTextOutlined className='text-blue-600' />
            <span>Edit Entry</span>
          </div>
        }
        open={showEditModal}
        onOk={handleEditModalOk}
        onCancel={handleEditModalCancel}
        width={600}
        footer={
          <div className='flex justify-end items-center gap-3'>
            <AntButton onClick={handleEditModalCancel} size='large'>
              Cancel
            </AntButton>
            <AntButton
              type='primary'
              onClick={handleEditModalOk}
              size='large'
              style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}
            >
              Update Entry
            </AntButton>
          </div>
        }
            >
              <div>
                {loader && (
                  <Spin
                    size='large'
                    spinning={loader}
                    fullscreen={true}
                    className='z-20'
                  ></Spin>
                )}
                {editingEntry && editingEntry.sourceType === 2 ? (
                  <div className='flex flex-col gap-y-2'>
                    <div>
                      <div>Change Description</div>
                      <CustomInput
                        value={editingEntry?.description}
                        onChange={e => {
                          setEditingEntry({
                            ...editingEntry,
                            description: e.target.value
                          })
                        }}
                      />
                    </div>
                    <div>
                      <div>Change Pricing</div>
                      <CustomInput
                        value={
                          editingEntry?.sourceType === 2
                            ? editingEntry?.amount
                            : editingEntry?.price
                        }
                        onChange={e => {
                          if (editingEntry?.sourceType === 2) {
                            setEditingEntry({
                              ...editingEntry,
                              amount: e.target.value
                            })
                          } else {
                            setEditingEntry({
                              ...editingEntry,
                              price: e.target.value
                            })
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className='flex flex-col gap-y-2'>
                    <div>
                      <div>Select Product</div>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allProducts}
                        value={editingEntry?.productId}
                        onChange={(e, l) => {
                          setEditingEntry({
                            ...editingEntry,
                            productId: e,
                            productName: l ? l.label : null
                          })
                        }}
                      />
                    </div>
                    <div>
                      <div>Change Quantity</div>
                      <CustomInput
                        value={editingEntry?.quantity}
                        onChange={e => {
                          setEditingEntry({
                            ...editingEntry,
                            quantity: e.target.value
                          })
                        }}
                      />
                    </div>
                    <div>
                      <div>Change Pricing</div>
                      <CustomInput
                        value={
                          editingEntry?.sourceType === 2
                            ? editingEntry?.amount
                            : editingEntry?.price
                        }
                        onChange={e => {
                          if (editingEntry?.sourceType === 2) {
                            setEditingEntry({
                              ...editingEntry,
                              amount: e.target.value
                            })
                          } else {
                            setEditingEntry({
                              ...editingEntry,
                              price: e.target.value
                            })
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className='flex items-center gap-x-2'>
                        <input
                          type='checkbox'
                          checked={editingEntry?.isClaim === 1}
                          onChange={e => {
                            setEditingEntry({
                              ...editingEntry,
                              isClaim: e.target.checked ? 1 : 0
                            })
                          }}
                        />
                        <span>Is this a claim?</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </Modal>
    </div>
  )
}

export default AdminDealerDetails
