import React, { useState, useEffect, useMemo } from 'react'
import {
  Table, Tag, Space, Input, Select, DatePicker, message, Modal, InputNumber, Checkbox, Progress, Badge
} from 'antd'
import { Button as AntButton } from 'antd'
import {
  ReloadOutlined, CheckCircleOutlined, WarningOutlined, DownOutlined, RightOutlined, FilePdfOutlined, ExportOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

import PageTitle from '../../Core/Components/PageTitle'
import StatusBadge from '../../Core/Components/StatusBadge'
import { ProcessButton } from '../../Core/Components/ActionButton'
import DataTablePagination from '../../Core/Components/DataTablePagination'
import InfoBox from '../../Core/Components/InfoBox'

const DispatchToSales = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [urgentFilter, setUrgentFilter] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [jobCardsData, setJobCardsData] = useState({})
  const [loadingJobCards, setLoadingJobCards] = useState({})
  const [acceptModalVisible, setAcceptModalVisible] = useState(false)
  const [selectedJobCard, setSelectedJobCard] = useState(null)
  const [acceptQuantity, setAcceptQuantity] = useState(0)
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [todayDispatchedItems, setTodayDispatchedItems] = useState([])
  const [selectedExportItems, setSelectedExportItems] = useState([])
  const [loadingExport, setLoadingExport] = useState(false)

  // ─── Data Fetching ───

  const fetchDispatchReadyPlans = async (page = 1, search = searchText, urgent = urgentFilter, range = dateRange) => {
    setLoading(true)
    try {
      const params = { page, limit: pagination.pageSize, search, urgent, dispatchPending: 'true' }
      if (range && range[0] && range[1]) { params.startDate = range[0].format('YYYY-MM-DD'); params.endDate = range[1].format('YYYY-MM-DD') }
      const response = await client.get('/production/plans-with-quantities', { params })
      if (response.data.productionPlans) {
        setData(response.data.productionPlans)
        setPagination({ ...pagination, current: page, total: response.data.pagination?.totalCount || response.data.productionPlans.length })
      }
    } catch (error) { message.error('Failed to fetch dispatch-ready plans') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDispatchReadyPlans() }, [])

  const fetchJobCardsForPlan = async (prodPlanId) => {
    setLoadingJobCards(prev => ({ ...prev, [prodPlanId]: true }))
    try {
      const res = await client.get(`/production/plan/${prodPlanId}/dispatch-job-cards`)
      setJobCardsData(prev => ({ ...prev, [prodPlanId]: res.data.jobCards }))
    } catch (error) { message.error('Failed to fetch job cards') }
    finally { setLoadingJobCards(prev => ({ ...prev, [prodPlanId]: false })) }
  }

  const handleExpand = (expanded, record) => {
    if (expanded) { setExpandedRowKeys([...expandedRowKeys, record.id]); if (!jobCardsData[record.id]) fetchJobCardsForPlan(record.id) }
    else { setExpandedRowKeys(expandedRowKeys.filter(k => k !== record.id)) }
  }

  // ─── Handlers ───

  const showAcceptModal = (jc) => { setSelectedJobCard(jc); setAcceptQuantity(jc.pendingQuantity); setAcceptModalVisible(true) }

  const handleAcceptJobCard = async () => {
    if (!selectedJobCard) return
    if (acceptQuantity <= 0 || acceptQuantity > selectedJobCard.pendingQuantity) { message.error(`Enter 1-${selectedJobCard.pendingQuantity}`); return }
    try {
      const res = await client.post(`/production/step-progress/${selectedJobCard.stepProgressId}/accept-dispatch`, { acceptedQuantity: acceptQuantity })
      message.success(`Accepted ${acceptQuantity} units`)
      if (res.data.data.planCompleted) message.success('Production plan completed!')
      setAcceptModalVisible(false); setSelectedJobCard(null); setAcceptQuantity(0)
      await fetchJobCardsForPlan(selectedJobCard.prodPlanId)
      await fetchDispatchReadyPlans(pagination.current)
    } catch (error) { message.error(error.response?.data?.message || 'Failed to accept') }
  }

  // ─── Export ───

  const fetchTodayDispatchedItems = async () => {
    setLoadingExport(true)
    try {
      const res = await client.get('/production/today-dispatched', { params: { date: moment().format('YYYY-MM-DD') } })
      if (res.data.dispatchedItems) { setTodayDispatchedItems(res.data.dispatchedItems); setSelectedExportItems([]) }
    } catch (error) { message.error('Failed to fetch dispatched items') }
    finally { setLoadingExport(false) }
  }

  const showExportModal = () => { fetchTodayDispatchedItems(); setExportModalVisible(true) }

  const handleExportPdf = (exportAll = false) => {
    const items = exportAll ? todayDispatchedItems : todayDispatchedItems.filter(item => selectedExportItems.includes(item.id))
    if (items.length === 0) { message.warning('No items to export'); return }
    const grouped = items.reduce((acc, item) => {
      const name = `${item.productName} ${item.modelName} ${item.inches}" ${item.finish}`
      if (acc[name]) acc[name].qty += item.acceptedQuantity; else acc[name] = { alloyName: name, qty: item.acceptedQuantity }
      return acc
    }, {})
    const exportData = Object.values(grouped).sort((a, b) => a.alloyName.localeCompare(b.alloyName))
    try {
      const doc = new jsPDF()
      doc.setFontSize(18); doc.text('DISPATCH REPORT', doc.internal.pageSize.width / 2, 20, { align: 'center' })
      doc.setFontSize(12); doc.text(`Date: ${moment().format('DD/MM/YYYY')}`, doc.internal.pageSize.width / 2, 28, { align: 'center' })
      const tableData = exportData.map((item, i) => [(i + 1).toString(), item.alloyName, item.qty.toString(), ''])
      const totalQty = exportData.reduce((s, i) => s + i.qty, 0)
      tableData.push(['', 'TOTAL', totalQty.toString(), ''])
      doc.autoTable({ startY: 38, head: [['S.No.', 'Alloy Name', 'Qty Dispatched', 'Qty Received']], body: tableData, theme: 'grid', headStyles: { fillColor: [24, 144, 255], textColor: 255, fontSize: 11, fontStyle: 'bold', halign: 'center' }, bodyStyles: { fontSize: 10 }, columnStyles: { 0: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 35, halign: 'center' }, 3: { cellWidth: 35, halign: 'center', fillColor: [245, 245, 245] } }, margin: { left: 14, right: 14 } })
      doc.save(`Dispatch_Report_${moment().format('YYYY-MM-DD')}.pdf`)
      message.success(`PDF exported: ${exportData.length} unique alloys`)
      setExportModalVisible(false)
    } catch (error) { message.error('Failed to export PDF') }
  }

  // ─── Stats ───

  const stats = useMemo(() => ({
    totalPlans: data.length,
    totalPendingUnits: data.reduce((s, i) => s + (i.dispatchPendingQuantity || 0), 0),
    urgentPlans: data.filter(i => i.isUrgent === 1).length,
  }), [data])

  // ─── Expanded Row ───

  const expandedRowRender = (record) => {
    const jobCards = jobCardsData[record.id] || []
    const isLoading = loadingJobCards[record.id]
    if (isLoading) return <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Loading job cards...</div>
    if (!jobCards.length) return <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No job cards at dispatch step</div>

    return (
      <div style={{ margin: '0 48px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Job Card ID', 'Total Qty', 'Pending', 'Accepted', 'Action'].map(h => (
                <th key={h} style={{ background: '#f9fafb', padding: '8px 12px', textAlign: h === 'Action' ? 'center' : 'left', fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 13, borderBottom: '1px solid #e5e5e5' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobCards.map(jc => (
              <tr key={jc.jobCardId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>#{jc.jobCardId}</td>
                <td style={{ padding: '10px 12px' }}>{jc.jobCardQuantity}</td>
                <td style={{ padding: '10px 12px' }}><StatusBadge variant="pending">{jc.pendingQuantity}</StatusBadge></td>
                <td style={{ padding: '10px 12px' }}><StatusBadge variant="paid">{jc.acceptedQuantity || 0}</StatusBadge></td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <ProcessButton onClick={() => showAcceptModal(jc)} disabled={jc.pendingQuantity === 0}>Accept</ProcessButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ─── Main Table Columns ───

  const columns = [
    {
      key: 'id', dataIndex: 'id', title: 'Plan ID',
      render: (val, record) => (
        <div>
          <span style={{ fontWeight: 600 }}>#{val}</span>
          {record.isUrgent === 1 && <div style={{ marginTop: 4 }}><StatusBadge variant="outofstock">Urgent</StatusBadge></div>}
        </div>
      ),
    },
    {
      key: 'product', title: 'Product Details',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.targetProductName || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {record.targetModelName} · {record.targetInches}" · {record.targetFinish}
          </div>
          {record.sourceProductName && (
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>From: {record.sourceProductName}</div>
          )}
        </div>
      ),
    },
    {
      key: 'dispatchPending', title: 'Dispatch Pending', align: 'center',
      render: (_, record) => {
        const pending = record.dispatchPendingQuantity || 0
        const total = record.quantity || 0
        const pct = total > 0 ? (pending / total) * 100 : 0
        return (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#f26c2d' }}>{pending}</span>
            <span style={{ color: '#9ca3af', fontSize: 13 }}> / {total}</span>
            <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, marginTop: 4 }}>
              <div style={{ height: '100%', background: '#f26c2d', borderRadius: 2, width: `${Math.min(pct, 100)}%` }} />
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Awaiting acceptance</div>
          </div>
        )
      },
    },
    {
      key: 'progress', title: 'Production Progress', align: 'center',
      render: (_, record) => {
        const completed = record.completedQuantity || 0
        const total = record.quantity || 0
        const pct = total > 0 ? (completed / total) * 100 : 0
        return (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: 500 }}>{completed} / {total}</span>
            <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, marginTop: 4 }}>
              <div style={{ height: '100%', background: pct >= 100 ? '#4ecb71' : '#4a90ff', borderRadius: 2, width: `${Math.min(pct, 100)}%` }} />
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              {record.completedJobCardsStatus || 0} / {record.totalJobCards || 0} cards done
            </div>
          </div>
        )
      },
    },
    {
      key: 'quality', title: 'Quality', align: 'center',
      render: (_, record) => {
        const accepted = record.acceptedQuantity || 0
        const rejected = record.rejectedQuantity || 0
        const total = accepted + rejected
        const passRate = total > 0 ? (accepted / total) * 100 : 0
        return (
          <div style={{ textAlign: 'center', fontSize: 13 }}>
            <div><span style={{ color: '#4ecb71' }}>✓ {accepted}</span>{rejected > 0 && <span style={{ color: '#dc2626', marginLeft: 8 }}>✗ {rejected}</span>}</div>
            {total > 0 && (
              <StatusBadge variant={passRate >= 95 ? 'paid' : 'pending'}>{passRate.toFixed(0)}% Pass</StatusBadge>
            )}
          </div>
        )
      },
    },
    {
      key: 'timeline', title: 'Timeline',
      render: (_, record) => (
        <div style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#6b7280' }}>
          <div>Created: {moment(record.createdAt).format('DD MMM YYYY')}</div>
          {record.completedAt && <div>Done: {moment(record.completedAt).format('DD MMM YYYY')}</div>}
          <div style={{ fontWeight: 500, color: '#1a1a1a', marginTop: 2 }}>{moment(record.createdAt).fromNow()}</div>
        </div>
      ),
    },
    {
      key: 'currentStep', title: 'Current Step', align: 'center',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <StatusBadge variant="inprod">{record.currentStepName || 'N/A'}</StatusBadge>
          {record.avgProgressPercentage && (
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Avg: {Number(record.avgProgressPercentage).toFixed(0)}%</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (_, record) => (
        <button
          onClick={() => handleExpand(!expandedRowKeys.includes(record.id), record)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#4a90ff', border: 'none', borderRadius: 12,
            padding: 8, fontSize: 14, fontWeight: 400,
            fontFamily: "'Inter', sans-serif", color: 'white',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {expandedRowKeys.includes(record.id) ? <DownOutlined /> : <RightOutlined />}
          {expandedRowKeys.includes(record.id) ? 'Hide' : 'View'} Job Cards
        </button>
      ),
    },
  ]

  // ─── Render ───

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <PageTitle>Dispatch to Sales</PageTitle>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <span style={{ background: '#f7d6ca', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32 }}>
            {stats.totalPlans} Plans · {stats.totalPendingUnits} Units Pending
          </span>
          {stats.urgentPlans > 0 && (
            <span style={{ background: '#fef2f2', color: '#dc2626', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32, border: '1px solid rgba(229,62,62,0.2)' }}>
              {stats.urgentPlans} Urgent
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
        padding: '12px 32px', marginBottom: 16,
        boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text" placeholder="Search Product, Model, Finish..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchDispatchReadyPlans(1, searchText, urgentFilter, dateRange)}
            style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }}
          />
          <Select style={{ width: 160, height: 40 }} value={urgentFilter || undefined} placeholder="Priority" onChange={val => { setUrgentFilter(val || ''); fetchDispatchReadyPlans(1, searchText, val || '', dateRange) }} allowClear className="plati-filter-dealer"
            options={[{ value: '1', label: 'Urgent Only' }, { value: '0', label: 'Normal' }]}
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={range => { setDateRange(range); fetchDispatchReadyPlans(1, searchText, urgentFilter, range) }}
            format="DD MMM YYYY"
            placeholder={['Start Date', 'End Date']}
            className="plati-filter-daterange"
            style={{ height: 40, borderRadius: 123, borderColor: '#a0a0a8', minWidth: 260 }}
          />
          <button onClick={() => fetchDispatchReadyPlans(pagination.current)} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', minWidth: 100, justifyContent: 'center',
            background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400,
            fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', flexShrink: 0,
          }}>
            <ReloadOutlined spin={loading} style={{ fontSize: 14 }} /> Refresh
          </button>
          <button onClick={showExportModal} style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', minWidth: 100, justifyContent: 'center',
            background: '#1a1a1a', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500,
            fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', flexShrink: 0,
          }}>
            <ExportOutlined style={{ fontSize: 14 }} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
        overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
      }}>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          expandable={{ expandedRowRender, expandedRowKeys, onExpand: handleExpand }}
          pagination={false}
          scroll={{ x: 1200 }}
          locale={{ emptyText: <div style={{ padding: 40, textAlign: 'center', color: '#f55e34', fontWeight: 500 }}>No dispatch-ready plans found</div> }}
          style={{ fontSize: 14 }}
          className="plati-table"
        />
        <DataTablePagination
          currentPage={pagination.current}
          totalItems={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(page) => fetchDispatchReadyPlans(page)}
          onPageSizeChange={(size) => { setPagination(p => ({ ...p, pageSize: size })); fetchDispatchReadyPlans(1) }}
        />
      </div>

      <InfoBox
        title="Information"
        items={[
          'Shows production plans with units ready at the dispatch step',
          'Expand rows to view individual job cards and accept quantities',
          'Accepted quantities are moved to in-house stock for sales allocation',
          'Export generates a PDF dispatch report with signature sections',
        ]}
      />

      {/* Accept Quantity Modal */}
      <Modal title="Accept Dispatch Quantity" open={acceptModalVisible}
        onOk={handleAcceptJobCard}
        onCancel={() => { setAcceptModalVisible(false); setSelectedJobCard(null); setAcceptQuantity(0) }}
        okText="Accept" cancelText="Cancel"
      >
        {selectedJobCard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 16, background: '#f9fafb', borderRadius: 12, fontSize: 13, fontFamily: "'Inter', sans-serif", lineHeight: 1.8 }}>
              <div><strong>Job Card #</strong> {selectedJobCard.jobCardId}</div>
              <div><strong>Pending:</strong> <StatusBadge variant="pending">{selectedJobCard.pendingQuantity}</StatusBadge></div>
            </div>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Enter Quantity to Accept:</div>
              <InputNumber min={1} max={selectedJobCard.pendingQuantity} value={acceptQuantity} onChange={v => setAcceptQuantity(v)} style={{ width: '100%' }} size="large" />
            </div>
          </div>
        )}
      </Modal>

      {/* Export Modal */}
      <Modal title="Export Today's Dispatch Report" open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)} width={800}
        footer={[
          <AntButton key="cancel" onClick={() => setExportModalVisible(false)}>Cancel</AntButton>,
          <AntButton key="pdf-selected" icon={<FilePdfOutlined />} onClick={() => handleExportPdf(false)} disabled={selectedExportItems.length === 0} style={{ background: '#ff4d4f', borderColor: '#ff4d4f', color: 'white' }}>
            Export PDF ({selectedExportItems.length})
          </AntButton>,
          <AntButton key="pdf-all" type="primary" icon={<FilePdfOutlined />} onClick={() => handleExportPdf(true)} disabled={todayDispatchedItems.length === 0} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
            Export PDF (All)
          </AntButton>,
        ]}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Today's Dispatched Items ({todayDispatchedItems.length})</span>
          <Checkbox
            checked={selectedExportItems.length === todayDispatchedItems.length && todayDispatchedItems.length > 0}
            indeterminate={selectedExportItems.length > 0 && selectedExportItems.length < todayDispatchedItems.length}
            onChange={e => e.target.checked ? setSelectedExportItems(todayDispatchedItems.map(i => i.id)) : setSelectedExportItems([])}
          >Select All</Checkbox>
        </div>
        <div style={{ maxHeight: 350, overflowY: 'auto' }}>
          {loadingExport ? <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>Loading...</div>
          : todayDispatchedItems.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>No items dispatched today</div>
          : todayDispatchedItems.map(item => (
            <div key={item.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12, background: selectedExportItems.includes(item.id) ? '#eff6ff' : 'white' }}>
              <Checkbox checked={selectedExportItems.includes(item.id)} onChange={e => e.target.checked ? setSelectedExportItems([...selectedExportItems, item.id]) : setSelectedExportItems(selectedExportItems.filter(id => id !== item.id))} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>{item.productName} - {item.modelName} {item.inches}" {item.finish}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Accepted: {item.acceptedQuantity} units · Plan #{item.prodPlanId} · {moment(item.dispatchedAt).format('DD-MM-YYYY HH:mm')}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

export default DispatchToSales
