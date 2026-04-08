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
  DollarOutlined,
  DeleteOutlined
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
  deletePaymentEntryAPI,
  getAllDealersOrders
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
import DataTablePagination from '../../../Core/Components/DataTablePagination'

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
    dispatch(getAllDealersOrders({ id, page: currentPage, limit: pageSize }))
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
            <div style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
              padding: '12px 32px', marginBottom: 16,
              boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type='text'
                  placeholder='Search...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1, minWidth: 200, height: 40,
                    border: '1px solid #a0a0a8', borderRadius: 123,
                    padding: '0 16px', fontSize: 16,
                    fontFamily: "'Inter', sans-serif", color: '#1a1a1a',
                    outline: 'none', background: 'white',
                  }}
                />
                <DatePicker.RangePicker
                  onChange={handleDateChange}
                  format='DD MMM YYYY'
                  placeholder={['Start Date', 'End Date']}
                  className='plati-filter-daterange'
                  style={{
                    height: 40, borderRadius: 123,
                    borderColor: '#a0a0a8', minWidth: 280,
                  }}
                />
                <button
                  onClick={handleRecalculateBalance}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    height: 40, padding: '0 16px', minWidth: 100,
                    justifyContent: 'center', background: '#f3f3f5',
                    border: 'none', borderRadius: 123, fontSize: 14,
                    fontWeight: 400, fontFamily: "'Inter', sans-serif",
                    color: '#1a1a1a', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <ReloadOutlined style={{ fontSize: 14 }} /> Recalculate
                </button>
                <button
                  onClick={showDownloadModal}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    height: 40, padding: '0 16px', minWidth: 100,
                    justifyContent: 'center', background: '#1a1a1a',
                    border: 'none', borderRadius: 123, fontSize: 14,
                    fontWeight: 500, fontFamily: "'Inter', sans-serif",
                    color: 'white', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <DownloadOutlined style={{ fontSize: 14 }} /> Export
                </button>
              </div>
            </div>
            <div style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
              overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {isAdmin && (
                        <th style={{ background: '#f3f3f5', padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14, fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5', width: 48, paddingLeft: 32 }}>
                          <input
                            type='checkbox'
                            checked={selectedEntries.length > 0 && selectedEntries.length === filteredDealers?.filter(e => e.isChecked === 0).length}
                            onChange={handleSelectAllUncheckedEntries}
                            disabled={!filteredDealers?.filter(e => e.isChecked === 0).length}
                            style={{ cursor: 'pointer', width: 18, height: 18 }}
                          />
                        </th>
                      )}
                      {['Date', 'Product', 'Quantity', 'Amount', 'Entry Type', 'Status', 'Balance after Entry', 'Actions'].map((h, i) => (
                        <th key={h} style={{
                          background: '#f3f3f5', padding: '12px 16px',
                          textAlign: ['Quantity', 'Amount', 'Status', 'Actions'].includes(h) ? 'center' : 'left',
                          fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14,
                          fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5',
                          whiteSpace: 'nowrap', lineHeight: '20px',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!sortedFilteredDealers || sortedFilteredDealers.length === 0 ? (
                      <tr><td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No entries found</td></tr>
                    ) : (
                      sortedFilteredDealers.map((record, idx) => {
                        const statusText = record.paymentStatus === 1 ? 'Pending' : record.paymentStatus === 2 ? 'Partial' : record.paymentStatus === 3 ? 'Paid' : '-'
                        const statusVariant = record.paymentStatus === 1 ? 'outofstock' : record.paymentStatus === 2 ? 'pending' : record.paymentStatus === 3 ? 'paid' : 'paid'
                        const balVal = record?.entryCurrentBal || record?.currentBal
                        return (
                          <tr key={record.entryId || idx} style={{ borderBottom: '1px solid #f3f4f6' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            {isAdmin && (
                              <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', paddingLeft: 32 }}>
                                <input
                                  type='checkbox'
                                  checked={selectedEntries.includes(record.entryId)}
                                  onChange={() => {
                                    if (selectedEntries.includes(record.entryId)) setSelectedEntries(selectedEntries.filter(id => id !== record.entryId))
                                    else setSelectedEntries([...selectedEntries, record.entryId])
                                  }}
                                  disabled={record.isChecked === 1}
                                  style={{ cursor: 'pointer', width: 18, height: 18 }}
                                />
                              </td>
                            )}
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif", fontSize: 13, whiteSpace: 'nowrap' }}>
                              {moment(record.date).format('DD MMM YYYY')}<br />
                              <span style={{ color: '#9ca3af', fontSize: 12 }}>{moment(record.date).format('dddd')}</span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{record.productName || '-'}</td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>{record.quantity || '-'}</td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>{record.isClaim === 1 ? 'Claimed' : formatINR(record.price)}</td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{record.source || '-'}</td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '5px 13px', borderRadius: 33554400, fontSize: 12,
                                fontWeight: 400, fontFamily: "'Inter', sans-serif", lineHeight: '16px', color: '#1a1a1a',
                                background: statusVariant === 'paid' ? '#d9fae6' : statusVariant === 'pending' ? '#fff7ed' : '#fef2f2',
                                border: `1px solid ${statusVariant === 'paid' ? 'rgba(78,203,113,0.2)' : statusVariant === 'pending' ? 'rgba(242,108,45,0.2)' : 'rgba(229,62,62,0.2)'}`,
                              }}>
                                <span style={{
                                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                  background: statusVariant === 'paid' ? '#4ecb71' : statusVariant === 'pending' ? '#f26c2d' : '#e53e3e',
                                }} />
                                {statusText}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif", fontWeight: 500, color: balVal < 0 ? '#dc2626' : '#15803d' }}>
                              {balVal !== null && balVal !== undefined ? formatINR(balVal) : '₹0'}
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    if (record.source === 'Purchase') handleCheckPurchaseEntry(record.entryId)
                                    else if (record.sourceType == 4) handleCheckChargesEntry(record.entryId)
                                    else handleCheckEntry(record.entryId)
                                  }}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '8px 16px', borderRadius: 12, fontSize: 14,
                                    fontWeight: 400, fontFamily: "'Inter', sans-serif",
                                    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                                    background: record.isChecked === 1 ? '#4a90ff' : '#f3f3f5',
                                    color: record.isChecked === 1 ? 'white' : '#1a1a1a',
                                  }}
                                >
                                  {record.isChecked === 1 ? '✓ Checked' : 'Unchecked'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                currentPage={currentPage}
                totalItems={searchQuery ? filteredDealers?.length : dealerEntriesPagination?.total || dealerEntryCount || 0}
                pageSize={pageSize}
                onPageChange={(page) => handlePages(page, pageSize)}
                onPageSizeChange={(size) => { handlePages(1, size) }}
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
              <div style={{ marginBottom: 16, padding: '12px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#15803d', fontWeight: 500, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
                  {selectedPayments.length} payment{selectedPayments.length > 1 ? 's' : ''} selected
                </span>
                <button onClick={handleCheckMultiplePayments} style={{ background: '#4a90ff', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Check Selected</button>
                <button onClick={() => setSelectedPayments([])} style={{ background: '#f3f3f5', color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Clear</button>
              </div>
            )}

            {/* Filter Bar */}
            <div style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
              padding: '12px 32px', marginBottom: 16,
              boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type='text' placeholder='Search payments...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }}
                />
                <DatePicker.RangePicker
                  onChange={handleDateChange}
                  format='DD MMM YYYY'
                  placeholder={['Start Date', 'End Date']}
                  className='plati-filter-daterange'
                  style={{ height: 40, borderRadius: 123, borderColor: '#a0a0a8', minWidth: 280 }}
                />
                {isAdmin && (
                  <button onClick={showPaymentModalFunction} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', background: '#15803d', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <PlusOutlined style={{ fontSize: 14 }} /> Add Payment
                  </button>
                )}
                <button onClick={showDownloadModal} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', minWidth: 100, justifyContent: 'center', background: '#1a1a1a', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', flexShrink: 0 }}>
                  <DownloadOutlined style={{ fontSize: 14 }} /> Export
                </button>
              </div>
            </div>

            {/* Payments Table */}
            <div style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
              overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {isAdmin && (
                        <th style={{ background: '#f3f3f5', padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14, fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5', width: 48, paddingLeft: 32 }}>
                          <input type='checkbox'
                            checked={selectedPayments.length > 0 && selectedPayments.length === filteredPayments?.filter(p => p.isPaid === 0).length}
                            onChange={handleSelectAllUncheckedPayments}
                            disabled={!filteredPayments?.filter(p => p.isPaid === 0).length}
                            style={{ cursor: 'pointer', width: 18, height: 18 }}
                          />
                        </th>
                      )}
                      {['Date', 'Description', 'Amount', 'Mode of Payment', 'Transport Charges', 'Balance after Entry', ...(isAdmin ? ['Actions', 'Checked'] : [])].map(h => (
                        <th key={h} style={{
                          background: '#f3f3f5', padding: '12px 16px',
                          textAlign: ['Amount', 'Transport Charges', 'Actions', 'Checked'].includes(h) ? 'center' : 'left',
                          fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14,
                          fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5',
                          whiteSpace: 'nowrap', lineHeight: '20px',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!sortedFilteredPayments || sortedFilteredPayments.length === 0 ? (
                      <tr><td colSpan={isAdmin ? 9 : 6} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No payment entries found</td></tr>
                    ) : (
                      sortedFilteredPayments.map((record, idx) => {
                        const balVal = record?.entryCurrentBal || record?.currentBal
                        return (
                          <tr key={record.id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            {isAdmin && (
                              <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', paddingLeft: 32 }}>
                                <input type='checkbox'
                                  checked={selectedPayments.includes(record.id)}
                                  onChange={() => {
                                    if (selectedPayments.includes(record.id)) setSelectedPayments(selectedPayments.filter(i => i !== record.id))
                                    else setSelectedPayments([...selectedPayments, record.id])
                                  }}
                                  disabled={record.isPaid === 1}
                                  style={{ cursor: 'pointer', width: 18, height: 18 }}
                                />
                              </td>
                            )}
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif", fontSize: 13, whiteSpace: 'nowrap' }}>
                              {moment(record.paymentDate).format('DD MMM YYYY')}<br />
                              <span style={{ color: '#9ca3af', fontSize: 12 }}>{moment(record.paymentDate).format('dddd')}</span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif" }}>{record.description || '-'}</td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', fontFamily: "'Inter', sans-serif", fontWeight: 500, color: '#15803d' }}>{formatINR(record.amount)}</td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif" }}>{getPaymentMethodLabel(record.paymentMethod)}</td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>{record.transportationCharges || '-'}</td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif", fontWeight: 500, color: balVal < 0 ? '#dc2626' : '#15803d' }}>
                              {balVal !== null && balVal !== undefined ? formatINR(balVal) : '₹0'}
                            </td>
                            {isAdmin && (
                              <>
                                <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                  <button onClick={() => handleDeletePaymentEntry(record)} style={{
                                    background: 'rgba(26,26,26,0.2)', border: 'none', borderRadius: 12,
                                    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#1a1a1a', fontSize: 16, margin: '0 auto',
                                  }}>
                                    <DeleteOutlined />
                                  </button>
                                </td>
                                <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                  <button onClick={() => handleCheckPaymentEntry(record.id)} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '8px 16px', borderRadius: 12, fontSize: 14,
                                    fontWeight: 400, fontFamily: "'Inter', sans-serif",
                                    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                                    background: record.isPaid === 1 ? '#4a90ff' : '#f3f3f5',
                                    color: record.isPaid === 1 ? 'white' : '#1a1a1a',
                                  }}>
                                    {record.isPaid === 1 ? '✓ Checked' : 'Unchecked'}
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                currentPage={currentPage}
                totalItems={searchQuery ? filteredPayments?.length : paymentEntriesPagination?.total || pmEntryCount || 0}
                pageSize={pageSize}
                onPageChange={(page) => handlePages(page, pageSize)}
                onPageSizeChange={(size) => { handlePages(1, size) }}
              />
            </div>
          </div>
        )
      case 3:
        const orders = allDealersOrders || []
        return (
          <div className='pt-6'>
            <div style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
              overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {['Order Date', 'Payment Status', 'Total Amount', 'Pending Amount', 'Payment Date'].map(h => (
                        <th key={h} style={{
                          background: '#f3f3f5', padding: '12px 16px',
                          textAlign: ['Total Amount', 'Pending Amount'].includes(h) ? 'center' : 'left',
                          fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14,
                          fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5',
                          whiteSpace: 'nowrap', lineHeight: '20px',
                          paddingLeft: h === 'Order Date' ? 32 : undefined,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No orders found</td></tr>
                    ) : (
                      orders.map((record, idx) => {
                        const statusConfig = { 1: { dot: '#e53e3e', text: 'Pending' }, 2: { dot: '#f26c2d', text: 'Partial' }, 3: { dot: '#4ecb71', text: 'Completed' } }
                        const status = statusConfig[record.paymentStatus] || statusConfig[1]
                        const pendingAmt = record.paymentStatus === 1 ? record.totalAmount : record.pendingAmount
                        return (
                          <tr key={record.id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif", fontSize: 13, whiteSpace: 'nowrap', paddingLeft: 32 }}>
                              {moment(record.orderDate).format('DD MMM YYYY')}<br />
                              <span style={{ color: '#9ca3af', fontSize: 12 }}>{moment(record.orderDate).format('dddd')}</span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '5px 13px', borderRadius: 33554400, fontSize: 12,
                                fontWeight: 400, fontFamily: "'Inter', sans-serif", lineHeight: '16px', color: '#1a1a1a',
                                background: record.paymentStatus === 3 ? '#d9fae6' : record.paymentStatus === 2 ? '#fff7ed' : '#fef2f2',
                                border: `1px solid ${record.paymentStatus === 3 ? 'rgba(78,203,113,0.2)' : record.paymentStatus === 2 ? 'rgba(242,108,45,0.2)' : 'rgba(229,62,62,0.2)'}`,
                              }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: status.dot }} />
                                {status.text}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                              {formatINR(record.totalAmount)}
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', fontFamily: "'Inter', sans-serif", fontWeight: 500, color: pendingAmt > 0 ? '#dc2626' : '#9ca3af' }}>
                              {formatINR(pendingAmt)}
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif", fontSize: 13, color: record.paymentDate ? '#1a1a1a' : '#9ca3af' }}>
                              {record.paymentDate ? moment(record.paymentDate).format('DD MMM YYYY') : 'Not received'}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                currentPage={currentPage}
                totalItems={dealersOrdersCount || orders.length || 0}
                pageSize={pageSize}
                onPageChange={(page) => handlePages(page, pageSize)}
                onPageSizeChange={(size) => { handlePages(1, size) }}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Determine the color class based on the balance

  const uncheckedEntries = allDealerEntries?.filter(entry => entry.isChecked === 0).length || 0
  const uncheckedPayments = allPMEntries?.filter(entry => entry.isPaid === 0).length || 0
  const overdueAmount = dealerInfo?.overdueAmount || 0

  const TABS_CONFIG = [
    { key: 'entries', label: 'Entries', tabKey: 1 },
    { key: 'payments', label: 'Payments', tabKey: 2 },
    { key: 'orders', label: 'Orders', tabKey: 3 },
  ]

  const tabCounts = {
    entries: uncheckedEntries,
    payments: uncheckedPayments,
  }

  return (
    <div style={{ width: '100%' }}>
      {(loader || spinLoader) && (
        <Spin
          size='large'
          spinning={loader || spinLoader}
          className='fixed inset-0 z-50 bg-white/80 backdrop-blur-sm'
        />
      )}

      {/* Header: Dealer Name + Balance Card */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h1 style={{
            fontFamily: "'Staff Wide Test', serif",
            fontSize: 42, fontWeight: 400, color: '#1a1a1a',
            margin: '0 0 8px', lineHeight: '30px',
          }}>
            {state?.name}
          </h1>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(26,26,26,0.6)', lineHeight: '20px' }}>
            Dealer ID: {id} {dealerInfo?.region ? `(${dealerInfo.region})` : ''}
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(26,26,26,0.5)', marginTop: 2 }}>
            {dealerInfo?.salesPerson ? `Assigned To: ${dealerInfo.salesPerson}` : ''}
          </div>
        </div>

        {/* Balance Card */}
        <div style={{
          background: 'white', border: '1px solid #e5e5e5', borderRadius: 16,
          padding: '16px 24px', minWidth: 200, textAlign: 'right',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(26,26,26,0.6)', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
            <WalletOutlined /> Current Balance
          </div>
          {(() => {
            const bal = dealerInfo?.currentBal ?? allDealerEntries?.[0]?.entryCurrentBal ?? allDealerEntries?.[0]?.currentBal ?? 0
            const overdue = dealerInfo?.overdueAmount || overdueAmount || 0
            return (
              <>
                <div style={{
                  fontSize: 28, fontWeight: 700, fontFamily: "'Inter', sans-serif",
                  color: bal < 0 ? '#dc2626' : '#15803d',
                  lineHeight: 1.2,
                }}>
                  {formatINR(bal)}
                </div>
                {overdue > 0 && (
                  <div style={{ fontSize: 12, color: '#f55e34', marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
                    Overdue · ₹{Math.abs(overdue).toLocaleString('en-IN')}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #a0a0a8', marginBottom: 16, marginTop: 24 }}>
        {TABS_CONFIG.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.tabKey); setSelectedEntries([]); setSelectedPayments([]) }}
            style={{
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.tabKey ? '2px solid #f55e34' : '1px solid transparent',
              marginBottom: -1, padding: '12px 24px',
              fontFamily: "'Inter', sans-serif", fontSize: 16,
              fontWeight: activeTab === tab.tabKey ? 600 : 400,
              color: '#1a1a1a', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              whiteSpace: 'nowrap', lineHeight: '24px',
            }}
          >
            {tab.label}
            {tabCounts[tab.key] > 0 && (
              <span style={{
                background: '#f7d6ca', color: '#f55e34',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: 12, fontWeight: 600,
                padding: '4px 8px', borderRadius: 1234,
                minWidth: 24, textAlign: 'center', lineHeight: '16px',
              }}>
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent(activeTab)}
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
