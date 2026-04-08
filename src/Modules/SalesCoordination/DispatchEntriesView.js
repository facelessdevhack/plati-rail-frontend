import React, { useEffect, useState, useMemo } from 'react'
import { message } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import {
  getDispatchEntriesAPI,
  sendForDispatchAPI,
  processDispatchEntryAPI,
  deleteDispatchEntryAPI,
  getDailyEntry
} from '../../redux/api/entriesAPI'
import { useDispatch } from 'react-redux'
import moment from 'moment'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

import PageTitle from '../../Core/Components/PageTitle'
import TabBar from '../../Core/Components/TabBar'
import StepBanner from '../../Core/Components/StepBanner'
import FilterBar from '../../Core/Components/FilterBar'
import DataTable from '../../Core/Components/DataTable'
import StatusBadge from '../../Core/Components/StatusBadge'
import { ProcessButton, DeleteButton } from '../../Core/Components/ActionButton'

const TABS = [
  { key: 'awaiting_approval', label: 'Export & Approve for Dispatch' },
  { key: 'sent_for_dispatch', label: 'Send for Physical Dispatch' },
  { key: 'approved', label: 'Dispatched & Complete' }
]

const STEP_GUIDANCE = {
  awaiting_approval: {
    title: 'Step 1: Awaiting Approval',
    steps: [
      'Step 1: Export entries and print for dispatch department',
      'Step 2: Review and approve each entry individually',
      'Step 3: Send approved entries for physical dispatch',
    ],
  },
  sent_for_dispatch: {
    title: 'Step 2: Send for Dispatch',
    steps: [
      'Step 1: Coordinate with Warehouse - Contact team',
      'Step 2: Receive Confirmation - Wait for physical dispatch notification',
      'Step 3: Mark Dispatched - Confirm each order individually',
    ],
  },
  approved: {
    title: 'Step 3: Dispatched & Complete',
    steps: [
      'Step 1: All entries have been physically dispatched',
      'Step 2: Export dealer-wise PDFs for invoices/delivery notes',
      'Step 3: Send documents to respective dealers',
    ],
  },
}

const DispatchEntriesView = () => {
  const dispatch = useDispatch()
  const [dispatchEntries, setDispatchEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [sendingId, setSendingId] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [activeTab, setActiveTab] = useState('awaiting_approval')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [searchText, setSearchText] = useState('')
  const [selectedDealer, setSelectedDealer] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // ─── Derived Data ───

  const dealerOptions = useMemo(() => {
    const selectedDateStr = selectedDate || null
    const tabEntries = dispatchEntries.filter(entry => {
      if (entry.dispatchStatus !== activeTab) return false
      if (activeTab === 'sent_for_dispatch') return true
      if (selectedDateStr) {
        if (activeTab === 'approved' && entry.processedAt)
          return moment(entry.processedAt).format('YYYY-MM-DD') === selectedDateStr
        if (entry.dateIST)
          return moment(entry.dateIST).format('YYYY-MM-DD') === selectedDateStr
      }
      return true
    })
    const dealers = [...new Set(tabEntries.map(e => e.dealerName).filter(Boolean))]
    return dealers.sort().map(d => ({ label: d, value: d }))
  }, [dispatchEntries, activeTab, selectedDate])

  const filteredEntries = useMemo(() => {
    const selectedDateStr = selectedDate || null
    const searchLower = searchText.toLowerCase().trim()
    return dispatchEntries.filter(entry => {
      if (entry.dispatchStatus !== activeTab) return false
      if (selectedDealer && entry.dealerName !== selectedDealer) return false
      if (searchLower) {
        const matches =
          (entry.dealerName && entry.dealerName.toLowerCase().includes(searchLower)) ||
          (entry.productName && entry.productName.toLowerCase().includes(searchLower)) ||
          (entry.id && entry.id.toString().includes(searchLower))
        if (!matches) return false
      }
      if (activeTab === 'sent_for_dispatch') return true
      if (selectedDateStr) {
        if (activeTab === 'approved' && entry.processedAt)
          return moment(entry.processedAt).format('YYYY-MM-DD') === selectedDateStr
        if (entry.dateIST)
          return moment(entry.dateIST).format('YYYY-MM-DD') === selectedDateStr
      }
      return true
    })
  }, [dispatchEntries, activeTab, selectedDate, searchText, selectedDealer])

  const statusCounts = useMemo(() => {
    const selectedDateStr = selectedDate || null
    const filterDate = (entries, field) => {
      if (!selectedDateStr) return entries
      return entries.filter(e => e[field] && moment(e[field]).format('YYYY-MM-DD') === selectedDateStr)
    }
    return {
      awaiting_approval: filterDate(dispatchEntries.filter(e => e.dispatchStatus === 'awaiting_approval'), 'dateIST').length,
      sent_for_dispatch: dispatchEntries.filter(e => e.dispatchStatus === 'sent_for_dispatch').length,
      approved: filterDate(dispatchEntries.filter(e => e.dispatchStatus === 'approved'), 'processedAt').length,
    }
  }, [dispatchEntries, selectedDate])

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, currentPage, pageSize])

  // ─── API Handlers ───

  useEffect(() => { fetchDispatchEntries() }, [])

  const fetchDispatchEntries = async () => {
    setLoading(true)
    try {
      const response = await dispatch(getDispatchEntriesAPI()).unwrap()
      setDispatchEntries(response.dispatchEntries || [])
    } catch (error) {
      message.error('Failed to load dispatch entries')
    } finally {
      setLoading(false)
    }
  }

  const handleSendForDispatch = async (entryId) => {
    setSendingId(entryId)
    try {
      const response = await sendForDispatchAPI({ dispatchEntryId: entryId })
      if (response.status === 200) { message.success('Entry sent for dispatch!'); fetchDispatchEntries() }
      else message.error(response.data?.message || 'Failed to send for dispatch')
    } catch (error) { message.error('Error sending for dispatch') }
    finally { setSendingId(null) }
  }

  const handleProcessEntry = async (entryId) => {
    setProcessingId(entryId)
    try {
      const response = await processDispatchEntryAPI({ dispatchEntryId: entryId })
      if (response.status === 200) { message.success('Entry dispatched successfully!'); fetchDispatchEntries() }
      else message.error(response.data?.message || 'Failed to process entry')
    } catch (error) { message.error('Error processing dispatch entry') }
    finally { setProcessingId(null) }
  }

  const handleDeleteEntry = async (entryId) => {
    setDeletingId(entryId)
    try {
      const response = await deleteDispatchEntryAPI({ dispatchEntryId: entryId })
      if (response.status === 200) { message.success('Entry deleted and stock restored!'); fetchDispatchEntries() }
      else message.error(response.data?.message || 'Failed to delete entry')
    } catch (error) { message.error('Error deleting dispatch entry') }
    finally { setDeletingId(null) }
  }

  // ─── Export Functions ───

  const handleExportTodayEntries = () => {
    const targetDate = selectedDate || dayjs().format('YYYY-MM-DD')
    const displayDate = moment(targetDate).format('DD MMM YYYY')
    const dateEntries = dispatchEntries.filter(entry => {
      const entryDate = entry.dateIST ? moment(entry.dateIST) : moment.utc(entry.date || entry.created_at)
      return entryDate.format('YYYY-MM-DD') === targetDate && entry.dispatchStatus === 'awaiting_approval'
    })
    if (dateEntries.length === 0) { message.warning(`No entries for ${displayDate}`); return }
    exportToPDF(dateEntries, `Dispatch Entries - ${displayDate}`)
  }

  const handleExportExcelTodayEntries = () => {
    const targetDate = selectedDate || dayjs().format('YYYY-MM-DD')
    const displayDate = moment(targetDate).format('DD MMM YYYY')
    const dateEntries = dispatchEntries.filter(entry => {
      const entryDate = entry.dateIST ? moment(entry.dateIST) : moment.utc(entry.date || entry.created_at)
      return entryDate.format('YYYY-MM-DD') === targetDate && entry.dispatchStatus === 'awaiting_approval'
    })
    if (dateEntries.length === 0) { message.warning(`No entries for ${displayDate}`); return }
    exportToExcel(dateEntries, `Dispatch Entries - ${displayDate}`)
  }

  const handleExportDealerWisePDFs = async () => {
    try {
      const dateStr = selectedDate || dayjs().format('YYYY-MM-DD')
      message.loading({ content: 'Generating dealer-wise PDFs...', key: 'dealerPdfExport' })
      const response = await fetch(`${process.env.REACT_APP_API_URL}/export/dispatch-approved-entries?date=${dateStr}`, {
        method: 'GET', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!response.ok) {
        let errorMessage = 'Failed to export PDFs'
        try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage } catch (e) {}
        throw new Error(errorMessage)
      }
      const blob = await response.blob()
      if (blob.size === 0) throw new Error('Downloaded file is empty')
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dispatch-approved-${dateStr}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success({ content: 'PDFs downloaded!', key: 'dealerPdfExport' })
    } catch (error) {
      message.error({ content: error.message || 'Failed to export PDFs', key: 'dealerPdfExport' })
    }
  }

  const handleExportDealerWiseExcel = async () => {
    try {
      message.loading({ content: 'Fetching entries...', key: 'dealerExport' })
      const response = await dispatch(getDailyEntry({})).unwrap()
      const processedEntries = response.data || []
      if (processedEntries.length === 0) { message.warning({ content: 'No entries found', key: 'dealerExport' }); return }
      exportDealerWiseToExcel(processedEntries, `Today's Processed Entries`)
      message.success({ content: 'Export completed!', key: 'dealerExport' })
    } catch (error) {
      message.error({ content: 'Failed to fetch entries', key: 'dealerExport' })
    }
  }

  const exportToPDF = (entries, reportTitle) => {
    const groupedByDealer = entries.reduce((g, e) => { const d = e.dealerName || 'Unknown'; if (!g[d]) g[d] = []; g[d].push(e); return g }, {})
    let html = `<html><head><title>${reportTitle}</title><style>body{font-family:Arial,sans-serif;padding:8px}h1{text-align:center;font-size:22px}.dealer-title{font-weight:bold;font-size:18px;background:#f5f5f5;padding:6px;border:1px solid #ddd;border-radius:6px;margin:12px 0 6px}table{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:12px}th,td{border:1px solid #ddd;padding:4px 6px}th{background:#f8f9fa;font-weight:bold}tr:nth-child(even){background:#f9f9f9}@media print{body{font-size:12px}}</style></head><body><h1>${reportTitle} - ${moment().format('DD MMM YYYY')}</h1>`
    Object.keys(groupedByDealer).forEach(dealer => {
      html += `<div class="dealer-title">${dealer}</div><table><thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Transport</th></tr></thead><tbody>`
      groupedByDealer[dealer].forEach(e => {
        const date = e.dateIST ? moment(e.dateIST).format('DD MMM YYYY HH:mm') : 'N/A'
        html += `<tr><td>${date}</td><td>${e.productName || 'N/A'}</td><td>${e.quantity || 0}</td><td style="color:${e.isTransportPaid ? '#52c41a' : '#ff4d4f'};font-weight:bold">${e.isTransportPaid ? 'Paid' : 'To Pay'}</td></tr>`
      })
      html += '</tbody></table>'
    })
    html += '</body></html>'
    const w = window.open('', '_blank', 'width=800,height=600')
    w.document.write(html); w.document.close(); w.onload = () => w.print()
    message.success('PDF export dialog opened.')
  }

  const exportToExcel = (entries, reportTitle) => {
    const sorted = [...entries].sort((a, b) => moment(b.dateIST || b.date).valueOf() - moment(a.dateIST || a.date).valueOf())
    const data = sorted.map((e, i) => ({
      'S.No': i + 1, 'Entry ID': e.id,
      Date: e.dateIST ? moment(e.dateIST).format('DD MMM YYYY hh:mm A') : 'N/A',
      Dealer: e.dealerName || 'N/A', Product: e.productName || 'N/A',
      Quantity: e.quantity || 0, Transport: e.isTransportPaid ? 'Paid' : 'To Pay',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 6 }, { wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 35 }, { wch: 10 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Dispatch Entries')
    XLSX.writeFile(wb, `${reportTitle.replace(/\s+/g, '_')}_${moment().format('DD-MM-YYYY')}.xlsx`)
    message.success('Excel exported!')
  }

  const exportDealerWiseToExcel = (entries, reportTitle) => {
    const getName = e => e.dealerName || e.dealer_name || 'Unknown'
    const grouped = entries.reduce((g, e) => { const d = getName(e); if (!g[d]) g[d] = []; g[d].push(e); return g }, {})
    const wb = XLSX.utils.book_new()
    const summaryData = []
    let sn = 1
    Object.keys(grouped).sort().forEach(dealer => {
      grouped[dealer].forEach(e => {
        summaryData.push({ 'S.No': sn++, Dealer: dealer, Product: e.productName || e.product_name || 'N/A', Quantity: e.quantity || 0, Transport: e.isTransportPaid !== undefined ? (e.isTransportPaid ? 'Paid' : 'To Pay') : 'N/A' })
      })
    })
    const ws = XLSX.utils.json_to_sheet(summaryData)
    ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws, 'All Dealers')
    XLSX.writeFile(wb, `${reportTitle.replace(/\s+/g, '_')}_${moment().format('DD-MM-YYYY')}.xlsx`)
  }

  // ─── Table Columns ───

  const columns = [
    {
      key: 'id', dataIndex: 'id', title: 'Entry ID',
      render: (val) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'date', dataIndex: 'dateIST', title: 'Date & Time',
      render: (_, record) => {
        const date = record.dateIST ? moment(record.dateIST) : moment.utc(record.date || record.created_at)
        return (
          <div style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
            {date.format('DD MMM YYYY')}<br />
            <span style={{ color: '#9ca3af', fontSize: 12 }}>{date.format('hh:mm A')}</span>
          </div>
        )
      },
    },
    { key: 'dealer', dataIndex: 'dealerName', title: 'Dealers' },
    { key: 'product', dataIndex: 'productName', title: 'Product' },
    {
      key: 'quantity', dataIndex: 'quantity', title: 'Quantity', align: 'center',
    },
    {
      key: 'transport', dataIndex: 'isTransportPaid', title: 'Transport', align: 'center',
      render: (_, record) => (
        <StatusBadge
          variant={record.isTransportPaid ? 'paid' : 'unpaid'}
          subText={record.isTransportPaid && record.transportAmount > 0 ? `Rs. ${record.transportAmount}` : undefined}
        >
          {record.isTransportPaid ? 'Paid' : 'Not Paid'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {record.dispatchStatus === 'approved' ? (
            <StatusBadge variant="dispatched">Completed</StatusBadge>
          ) : (
            <ProcessButton
              onClick={() => record.dispatchStatus === 'awaiting_approval'
                ? handleSendForDispatch(record.id)
                : handleProcessEntry(record.id)
              }
              loading={sendingId === record.id || processingId === record.id}
            />
          )}
          <DeleteButton
            onConfirm={() => handleDeleteEntry(record.id)}
            loading={deletingId === record.id}
            description="Stock will be restored."
          />
        </div>
      ),
    },
  ]

  // ─── Export Menu ───

  const exportMenuItems = [
    { key: 'pdf', label: 'Export PDF', icon: <FilePdfOutlined />, onClick: handleExportTodayEntries },
    { key: 'excel', label: 'Export Excel', icon: <FileExcelOutlined />, onClick: handleExportExcelTodayEntries },
    ...(activeTab === 'approved' ? [
      { key: 'dealer-pdf', label: 'Dealer Wise (PDF)', icon: <FilePdfOutlined />, onClick: handleExportDealerWisePDFs },
      { key: 'dealer-excel', label: 'Dealer Wise (Excel)', icon: <FileExcelOutlined />, onClick: handleExportDealerWiseExcel },
    ] : []),
  ]

  // ─── Render ───

  const guidance = STEP_GUIDANCE[activeTab]

  return (
    <div style={{ width: '100%' }}>
      <PageTitle>Dispatch Orders</PageTitle>

      <TabBar
        tabs={TABS}
        activeKey={activeTab}
        onChange={(key) => { setActiveTab(key); setSearchText(''); setSelectedDealer(null); setCurrentPage(1) }}
        counts={statusCounts}
      />

      <StepBanner title={guidance.title} steps={guidance.steps} />

      <FilterBar
        searchText={searchText}
        onSearchChange={(val) => { setSearchText(val); setCurrentPage(1) }}
        selectedDealer={selectedDealer}
        onDealerChange={(val) => { setSelectedDealer(val); setCurrentPage(1) }}
        dealerOptions={dealerOptions}
        selectedDate={selectedDate}
        onDateChange={(val) => { setSelectedDate(val); setCurrentPage(1) }}
        onRefresh={fetchDispatchEntries}
        loading={loading}
        exportMenuItems={exportMenuItems}
      />

      <DataTable
        columns={columns}
        data={paginatedEntries}
        rowKey="id"
        loading={loading}
        emptyText="No entries found"
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredEntries.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      />
    </div>
  )
}

export default DispatchEntriesView
