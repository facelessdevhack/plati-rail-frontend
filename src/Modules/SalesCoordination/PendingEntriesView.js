import React, { useEffect, useState, useMemo } from 'react'
import { Button, message } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import { getPendingEntriesAPI, movePendingToMasterAPI, deletePendingEntryAPI } from '../../redux/api/entriesAPI'
import { useDispatch } from 'react-redux'
import moment from 'moment'
import * as XLSX from 'xlsx'

import PageTitle from '../../Core/Components/PageTitle'
import FilterBar from '../../Core/Components/FilterBar'
import DataTable from '../../Core/Components/DataTable'
import StatusBadge from '../../Core/Components/StatusBadge'
import { ProcessButton, DeleteButton } from '../../Core/Components/ActionButton'
import InfoBox from '../../Core/Components/InfoBox'
import PendingOrderHistoryModal, { formatOrderTime } from './PendingOrderHistoryModal'

const PendingEntriesView = () => {
  const dispatch = useDispatch()
  const [pendingEntries, setPendingEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [dealerFilter, setDealerFilter] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [historyEntry, setHistoryEntry] = useState(null)

  // ─── Data ───

  useEffect(() => { fetchPendingEntries() }, [])

  const fetchPendingEntries = async () => {
    setLoading(true)
    try {
      const response = await dispatch(getPendingEntriesAPI()).unwrap()
      const entries = response.pendingEntries || []
      const sorted = [...entries].sort((a, b) => {
        const aCanProcess = (a.inHouseStock || 0) >= (a.quantity || 0)
        const bCanProcess = (b.inHouseStock || 0) >= (b.quantity || 0)
        if (aCanProcess !== bCanProcess) return bCanProcess ? 1 : -1
        const aDate = a.dateIST ? moment(a.dateIST) : moment.utc(a.date || a.created_at || 0).utcOffset(330)
        const bDate = b.dateIST ? moment(b.dateIST) : moment.utc(b.date || b.created_at || 0).utcOffset(330)
        return bDate - aDate
      })
      setPendingEntries(sorted)
    } catch (error) {
      message.error('Failed to load pending entries')
    } finally {
      setLoading(false)
    }
  }

  const uniqueDealers = useMemo(() => {
    const dealers = [...new Set(pendingEntries.map(e => e.dealerName).filter(Boolean))]
    return dealers.sort().map(d => ({ label: d, value: d }))
  }, [pendingEntries])

  const filteredEntries = useMemo(() => {
    return pendingEntries.filter(entry => {
      const searchLower = searchText.toLowerCase().trim()
      if (searchLower) {
        const matches =
          (entry.dealerName && entry.dealerName.toLowerCase().includes(searchLower)) ||
          (entry.productName && entry.productName.toLowerCase().includes(searchLower)) ||
          (entry.id && entry.id.toString().includes(searchLower))
        if (!matches) return false
      }
      if (dealerFilter && entry.dealerName !== dealerFilter) return false
      if (dateRange && dateRange[0] && dateRange[1]) {
        const entryDate = entry.dateIST ? moment(entry.dateIST) : moment.utc(entry.date || entry.created_at).utcOffset(330)
        const start = moment(dateRange[0].valueOf()).startOf('day')
        const end = moment(dateRange[1].valueOf()).endOf('day')
        if (!entryDate.isSameOrAfter(start) || !entryDate.isSameOrBefore(end)) return false
      }
      return true
    })
  }, [pendingEntries, searchText, dealerFilter, dateRange])

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, currentPage, pageSize])

  // ─── Handlers ───

  const handleProcessEntry = async (entryId) => {
    setProcessingId(entryId)
    try {
      const response = await movePendingToMasterAPI({ pendingEntryId: entryId })
      if (response.status === 200) { message.success('Entry processed! Stock is now available.'); fetchPendingEntries() }
      else message.error(response.data?.message || 'Failed to process entry')
    } catch (error) { message.error('Insufficient stock or error processing entry') }
    finally { setProcessingId(null) }
  }

  const handleDeleteEntry = async (entryId) => {
    setDeletingId(entryId)
    try {
      const response = await deletePendingEntryAPI({ pendingEntryId: entryId })
      if (response.status === 200) { message.success('Pending entry deleted!'); fetchPendingEntries() }
      else message.error(response.data?.message || 'Failed to delete entry')
    } catch (error) { message.error(error.response?.data?.message || 'Failed to delete entry') }
    finally { setDeletingId(null) }
  }

  // ─── Exports ───

  const exportToExcel = () => {
    if (filteredEntries.length === 0) { message.warning('No entries to export'); return }
    const data = filteredEntries.map((e, i) => ({
      'S.No': i + 1, 'Entry ID': e.id,
      Date: e.dateIST ? moment(e.dateIST).format('DD MMM YYYY hh:mm A') : 'N/A',
      Dealer: e.dealerName || 'N/A', Product: e.productName || 'N/A',
      Quantity: e.quantity || 0, 'Current Stock': e.inHouseStock || 0,
      'Times Ordered': e.orderCount || 1, 'Last Ordered (IST)': formatOrderTime(e.lastOrderedAt || e.createdAt),
      Status: e.pendingStatus === 'awaiting_stock' ? 'Awaiting Stock' : e.pendingStatus,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pending Entries')
    XLSX.writeFile(wb, `Pending_Entries_${moment().format('DD-MM-YYYY_HHmm')}.xlsx`)
    message.success('Excel exported!')
  }

  const exportToPDF = () => {
    if (filteredEntries.length === 0) { message.warning('No entries to export'); return }
    const grouped = filteredEntries.reduce((g, e) => { const d = e.dealerName || 'Unknown'; if (!g[d]) g[d] = []; g[d].push(e); return g }, {})
    let html = `<html><head><style>body{font-family:Arial,sans-serif;font-size:14px;padding:20px}h1{text-align:center;color:#333;margin-bottom:30px}.dealer-header{background:#f0f2f5;padding:10px;font-weight:bold;border:1px solid #d9d9d9;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #d9d9d9;padding:8px;text-align:left}th{background:#fafafa;font-weight:bold}@media print{@page{margin:15mm}}</style></head><body><h1>Pending Entries Report - ${moment().format('DD MMM YYYY')}</h1>`
    Object.entries(grouped).forEach(([dealer, entries]) => {
      html += `<div class="dealer-header">${dealer}</div><table><thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Times ordered</th><th>Last ordered (IST)</th><th>Stock</th><th>Status</th></tr></thead><tbody>`
      entries.forEach(e => {
        const date = e.dateIST ? moment(e.dateIST).format('DD MMM YYYY') : 'N/A'
        html += `<tr><td>${date}</td><td>${e.productName || 'N/A'}</td><td>${e.quantity || 0}</td><td>${e.orderCount || 1}</td><td>${formatOrderTime(e.lastOrderedAt || e.createdAt)}</td><td style="color:${(e.inHouseStock || 0) > 0 ? '#52c41a' : '#ff4d4f'}">${e.inHouseStock || 0}</td><td>${e.pendingStatus === 'awaiting_stock' ? 'Awaiting Stock' : e.pendingStatus}</td></tr>`
      })
      html += '</tbody></table>'
    })
    html += '</body></html>'
    const w = window.open('', '_blank')
    w.document.write(html); w.document.close(); w.onload = () => w.print()
    message.success('PDF print dialog opened')
  }

  const exportMenuItems = [
    { key: 'pdf', label: 'PDF Export', icon: <FilePdfOutlined />, onClick: exportToPDF },
    { key: 'excel', label: 'Excel Export', icon: <FileExcelOutlined />, onClick: exportToExcel },
  ]

  // ─── Stock Status Helper ───

  const getStockStatus = (record) => {
    const stock = record.inHouseStock || 0
    const qty = record.quantity || 0
    if (stock >= qty) {
      return <StatusBadge variant="paid" subText={`Available: ${stock}`}>In Stock</StatusBadge>
    }
    if (stock > 0) {
      return <StatusBadge variant="pending" subText={`Available: ${stock}`}>Insufficient</StatusBadge>
    }
    return <StatusBadge variant="outofstock" subText={`Available: ${stock}`}>Out of Stock</StatusBadge>
  }

  // ─── Columns ───

  const columns = [
    {
      key: 'id', dataIndex: 'id', title: 'Entry ID',
      render: (val) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'date', dataIndex: 'dateIST', title: 'Date & Time',
      render: (_, record) => {
        const date = record.dateIST ? moment(record.dateIST) : moment.utc(record.date || record.created_at).utcOffset(330)
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
    { key: 'quantity', dataIndex: 'quantity', title: 'Quantity', align: 'center' },
    {
      key: 'orderCount', dataIndex: 'orderCount', title: 'Times ordered', align: 'center',
      render: (count, record) => (
        <Button type="link" onClick={() => setHistoryEntry(record)}
          aria-label={`View order history for entry ${record.id}`}>
          {count || 1} {Number(count || 1) === 1 ? 'time' : 'times'} · History
        </Button>
      ),
    },
    {
      key: 'lastOrderedAt', title: 'Last ordered (IST)',
      render: (_, record) => formatOrderTime(record.lastOrderedAt || record.createdAt),
    },
    {
      key: 'stock', title: 'Stock', align: 'center',
      render: (_, record) => getStockStatus(record),
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (_, record) => {
        const hasEnoughStock = (record.inHouseStock || 0) >= (record.quantity || 0)
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ProcessButton
              onClick={() => handleProcessEntry(record.id)}
              loading={processingId === record.id}
              disabled={!hasEnoughStock}
            />
            <DeleteButton
              onConfirm={() => handleDeleteEntry(record.id)}
              loading={deletingId === record.id}
            />
          </div>
        )
      },
    },
  ]

  // ─── Custom Filter Bar (with DateRange instead of single date) ───

  // Uses shared FilterBar component

  // ─── Render ───

  return (
    <div style={{ width: '100%' }}>
      <PageTitle>Pending Orders</PageTitle>

      <div style={{ marginBottom: 8, fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#f55e34', fontWeight: 500 }}>
        Total {filteredEntries.length} entries
      </div>

      <FilterBar
        searchText={searchText}
        onSearchChange={(val) => { setSearchText(val); setCurrentPage(1) }}
        selectedDealer={dealerFilter}
        onDealerChange={(val) => { setDealerFilter(val); setCurrentPage(1) }}
        dealerOptions={uniqueDealers}
        dateRange={dateRange}
        onDateRangeChange={(dates) => { setDateRange(dates); setCurrentPage(1) }}
        onRefresh={fetchPendingEntries}
        loading={loading}
        exportMenuItems={exportMenuItems}
      />

      <DataTable
        columns={columns}
        data={paginatedEntries}
        rowKey="id"
        loading={loading}
        emptyText="No pending entries found"
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredEntries.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      />

      <InfoBox
        title="Information"
        items={[
          'These entries are waiting for stock to become available',
          'Stock or available production capacity could not fulfill these orders',
          'Repeats from the same dealer and entering user for the same product and order type increase Times ordered; pending quantity stays unchanged',
          'Click "History" to see when each order was recorded and its requested quantity',
          'Click "Process" when stock is available to send the order for dispatch approval',
          'System will automatically check stock availability before processing',
        ]}
      />
      {historyEntry && (
        <PendingOrderHistoryModal key={historyEntry.id} entry={historyEntry} onClose={() => setHistoryEntry(null)} />
      )}
    </div>
  )
}

export default PendingEntriesView
