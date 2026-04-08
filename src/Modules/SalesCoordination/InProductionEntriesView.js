import React, { useEffect, useState, useMemo } from 'react'
import { message } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import { getInProductionEntriesAPI, moveInProdToMasterAPI, deleteInProductionEntryAPI } from '../../redux/api/entriesAPI'
import { useDispatch } from 'react-redux'
import moment from 'moment'
import * as XLSX from 'xlsx'

import PageTitle from '../../Core/Components/PageTitle'
import FilterBar from '../../Core/Components/FilterBar'
import DataTable from '../../Core/Components/DataTable'
import StatusBadge from '../../Core/Components/StatusBadge'
import { ProcessButton, DeleteButton } from '../../Core/Components/ActionButton'
import InfoBox from '../../Core/Components/InfoBox'

const InProductionEntriesView = () => {
  const dispatch = useDispatch()
  const [inProdEntries, setInProdEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [dealerFilter, setDealerFilter] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // ─── Data ───

  useEffect(() => { fetchInProdEntries() }, [])

  const fetchInProdEntries = async () => {
    setLoading(true)
    try {
      const response = await dispatch(getInProductionEntriesAPI()).unwrap()
      setInProdEntries(response.inProdEntries || [])
    } catch (error) {
      message.error('Failed to load in-production entries')
    } finally {
      setLoading(false)
    }
  }

  const uniqueDealers = useMemo(() => {
    const dealers = [...new Set(inProdEntries.map(e => e.dealerName).filter(Boolean))]
    return dealers.sort().map(d => ({ label: d, value: d }))
  }, [inProdEntries])

  const filteredEntries = useMemo(() => {
    return inProdEntries.filter(entry => {
      const searchLower = searchText.toLowerCase().trim()
      if (searchLower) {
        const matches =
          (entry.dealerName && entry.dealerName.toLowerCase().includes(searchLower)) ||
          (entry.productName && entry.productName.toLowerCase().includes(searchLower)) ||
          (entry.id && entry.id.toString().includes(searchLower)) ||
          (entry.productionPlanId && entry.productionPlanId.toString().includes(searchLower))
        if (!matches) return false
      }
      if (dealerFilter && entry.dealerName !== dealerFilter) return false
      if (dateRange && dateRange[0] && dateRange[1]) {
        const entryDate = entry.dateIST ? moment(entry.dateIST) : moment.utc(entry.date || entry.created_at)
        const start = moment(dateRange[0].valueOf()).startOf('day')
        const end = moment(dateRange[1].valueOf()).endOf('day')
        if (!entryDate.isSameOrAfter(start) || !entryDate.isSameOrBefore(end)) return false
      }
      return true
    })
  }, [inProdEntries, searchText, dealerFilter, dateRange])

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, currentPage, pageSize])

  // ─── Handlers ───

  const handleProcessEntry = async (entryId) => {
    setProcessingId(entryId)
    try {
      const response = await moveInProdToMasterAPI({ inProdEntryId: entryId })
      if (response.status === 200) { message.success('Entry processed! Stock allocated.'); fetchInProdEntries() }
      else message.error(response.data?.message || 'Failed to process entry')
    } catch (error) { message.error('Production not completed or insufficient stock') }
    finally { setProcessingId(null) }
  }

  const handleDeleteEntry = async (entryId) => {
    setDeletingId(entryId)
    try {
      const response = await deleteInProductionEntryAPI({ inProdEntryId: entryId })
      if (response.status === 200) { message.success('Entry deleted! Production plan quantity restored.'); fetchInProdEntries() }
      else message.error(response.data?.message || 'Failed to delete entry')
    } catch (error) { message.error('Failed to delete entry') }
    finally { setDeletingId(null) }
  }

  // ─── Exports ───

  const exportToExcel = () => {
    if (filteredEntries.length === 0) { message.warning('No entries to export'); return }
    const data = filteredEntries.map((e, i) => ({
      'S.No': i + 1, 'Entry ID': e.id,
      Date: e.dateIST ? moment(e.dateIST).format('DD MMM YYYY hh:mm A') : 'N/A',
      Dealer: e.dealerName || 'N/A', Product: e.productName || 'N/A',
      Quantity: e.quantity || 0, 'In-House Stock': e.inHouseStock || 0,
      'Production Plan': `Plan #${e.productionPlanId}`,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'In Production Entries')
    XLSX.writeFile(wb, `In_Production_Entries_${moment().format('DD-MM-YYYY_HHmm')}.xlsx`)
    message.success('Excel exported!')
  }

  const exportToPDF = () => {
    if (filteredEntries.length === 0) { message.warning('No entries to export'); return }
    const grouped = filteredEntries.reduce((g, e) => { const d = e.dealerName || 'Unknown'; if (!g[d]) g[d] = []; g[d].push(e); return g }, {})
    let html = `<html><head><style>body{font-family:Arial,sans-serif;font-size:13px;padding:20px}h1{text-align:center;color:#333;margin-bottom:25px}.dealer-header{background:#f0f2f5;padding:8px 12px;font-weight:bold;border:1px solid #d9d9d9;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:5px}th,td{border:1px solid #d9d9d9;padding:6px;text-align:left}th{background:#fafafa;font-weight:bold;font-size:12px}@media print{@page{margin:10mm}}</style></head><body><h1>In-Production Entries - ${moment().format('DD MMM YYYY')}</h1>`
    Object.entries(grouped).forEach(([dealer, entries]) => {
      html += `<div class="dealer-header">${dealer}</div><table><thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Stock</th></tr></thead><tbody>`
      entries.forEach(e => {
        const date = e.dateIST ? moment(e.dateIST).format('DD MMM YYYY') : 'N/A'
        const hasStock = (e.inHouseStock || 0) >= (e.quantity || 0)
        html += `<tr><td>${date}</td><td>${e.productName || 'N/A'}</td><td>${e.quantity || 0}</td><td style="color:${hasStock ? '#52c41a' : '#faad14'}">${e.inHouseStock || 0}</td></tr>`
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

  // ─── Stock Status ───

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
    { key: 'quantity', dataIndex: 'quantity', title: 'Quantity', align: 'center' },
    {
      key: 'status', title: 'Status', align: 'center',
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
              description="Production plan quantity will be restored."
            />
          </div>
        )
      },
    },
  ]

  // ─── Render ───

  return (
    <div style={{ width: '100%' }}>
      <PageTitle>In-Production Orders</PageTitle>

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
        onRefresh={fetchInProdEntries}
        loading={loading}
        exportMenuItems={exportMenuItems}
      />

      <DataTable
        columns={columns}
        data={paginatedEntries}
        rowKey="id"
        loading={loading}
        emptyText="No in-production entries found"
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredEntries.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      />

      <InfoBox
        title="Information"
        items={[
          'These entries are linked to active production plans',
          'Production status shows total allocated quantity vs available quantity',
          'Process button becomes active when in-house stock is sufficient',
          'Stock Status column shows real-time in-house stock availability',
          'System verifies stock availability before processing',
          'Multiple entries may be linked to the same production plan',
        ]}
      />
    </div>
  )
}

export default InProductionEntriesView
