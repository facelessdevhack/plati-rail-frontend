import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { message, Modal, Form, InputNumber, Select } from 'antd'
import { ExportOutlined, FileExcelOutlined } from '@ant-design/icons'
import moment from 'moment'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { client } from '../../Utils/axiosClient'

import PageTitle from '../../Core/Components/PageTitle'
import DataTable from '../../Core/Components/DataTable'
import StatusBadge from '../../Core/Components/StatusBadge'
import { ProcessButton, DeleteButton } from '../../Core/Components/ActionButton'
import InfoBox from '../../Core/Components/InfoBox'

const InventoryRequests = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => { fetchInventoryRequests() }, [])

  const fetchInventoryRequests = async () => {
    setLoading(true)
    try {
      const response = await client.get('/production/inventory-requests')
      setRequests(response.data)
    } catch (error) {
      message.error('Failed to fetch inventory requests')
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = useMemo(() => {
    let filtered = [...requests]
    if (searchText) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(req =>
        String(req.jobCardId || '').includes(searchText) ||
        String(req.id || '').includes(searchText) ||
        String(req.planId || '').includes(searchText) ||
        (req.alloyName || '').toLowerCase().includes(search)
      )
    }
    if (statusFilter !== 'all') filtered = filtered.filter(req => req.status === statusFilter)
    return filtered
  }, [requests, searchText, statusFilter])

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRequests.slice(start, start + pageSize)
  }, [filteredRequests, currentPage, pageSize])

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    partial: requests.filter(r => r.status === 'partial').length,
    completed: requests.filter(r => r.status === 'completed').length,
  }), [requests])

  // ─── Handlers ───

  const handleMarkAsDone = (record) => {
    setSelectedRequest(record)
    // default to the full requested amount — the common case; the operator
    // lowers it for a partial delivery
    form.setFieldsValue({ receivedQuantity: record.quantityRequested || 0 })
    setIsModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      await client.put(`/production/inventory-requests/${selectedRequest.id}`, { quantityReceived: values.receivedQuantity })
      message.success(`Job ${selectedRequest.jobCardId} updated - Received: ${values.receivedQuantity} units`)
      setIsModalVisible(false); setSelectedRequest(null); form.resetFields()
      fetchInventoryRequests()
    } catch (error) {
      if (error?.errorFields) return // antd form validation — already shown inline
      // the backend explains WHY (insufficient stock, bounds) — show it
      message.error(error?.response?.data?.message || 'Failed to update quantity')
    }
  }

  const handleDelete = async (record) => {
    try {
      await client.delete(`/production/inventory-requests/${record.id}`)
      message.success(`Request for Job ${record.jobCardId} deleted`)
      fetchInventoryRequests()
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to delete inventory request')
    }
  }

  const handleExportPDF = () => {
    const incompleteRequests = requests.filter(r => r.status !== 'completed')
    if (incompleteRequests.length === 0) { message.info('No incomplete requests to export'); return }
    // sum what is still OWED — partially received requests only need the rest
    const groupedData = incompleteRequests.reduce((acc, req) => {
      const remaining = Math.max(0, (req.quantityRequested || 0) - (req.quantityReceived || 0))
      if (remaining === 0) return acc
      if (acc[req.alloyName]) acc[req.alloyName].quantityRequested += remaining
      else acc[req.alloyName] = { alloyName: req.alloyName, quantityRequested: remaining }
      return acc
    }, {})
    const exportData = Object.values(groupedData).sort((a, b) => a.alloyName.localeCompare(b.alloyName))
    try {
      const doc = new jsPDF()
      doc.setFontSize(18); doc.text('Inventory Request', 14, 20)
      doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)
      const tableData = exportData.map(item => [item.alloyName, item.quantityRequested.toString(), ''])
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({ startY: 35, head: [['Alloy Name', 'Qty Required', 'Qty Received']], body: tableData, theme: 'grid', headStyles: { fillColor: [24, 144, 255], textColor: 255, fontSize: 11, fontStyle: 'bold', halign: 'center' }, bodyStyles: { fontSize: 10 }, margin: { left: 14, right: 14 } })
      }
      doc.save(`Inventory_Request_${new Date().toISOString().split('T')[0]}.pdf`)
      message.success(`PDF exported: ${exportData.length} unique alloys`)
    } catch (error) {
      message.error('Failed to export PDF')
    }
  }

  // ─── Status Helper ───

  const getStatusBadge = (status) => {
    if (status === 'completed') return <StatusBadge variant="paid">Completed</StatusBadge>
    if (status === 'partial') return <StatusBadge variant="inprod">Partial</StatusBadge>
    return <StatusBadge variant="pending">Pending</StatusBadge>
  }

  // ─── Columns ───

  const columns = [
    {
      key: 'jobCardId', dataIndex: 'jobCardId', title: 'Job Card',
      render: (val, record) => (
        <div>
          <span style={{ fontWeight: 600 }}>#{val}</span>
          {record.planId && (
            <div>
              <button
                onClick={() => navigate(`/production-plan/${record.planId}`)}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontSize: 12, color: '#0891b2', fontFamily: "'Inter', sans-serif"
                }}
                title="Open the production plan"
              >
                Plan #{record.planId} ↗
              </button>
            </div>
          )}
        </div>
      ),
    },
    { key: 'alloyName', dataIndex: 'alloyName', title: 'Material' },
    {
      key: 'createdAt', dataIndex: 'createdAt', title: 'Requested',
      render: (val) => (
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {val ? moment(val).format('DD MMM YYYY') : '—'}
        </span>
      ),
    },
    {
      key: 'quantityReceived', dataIndex: 'quantityReceived', title: 'Received', align: 'center',
      render: (val, record) => {
        const requested = record.quantityRequested || 0
        const received = val || 0
        const remaining = Math.max(0, requested - received)
        const color = remaining === 0 && requested > 0 ? '#15803d' : received > 0 ? '#0891b2' : '#1a1a1a'
        return (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: 600, color }}>{received}</span>
            <span style={{ color: '#9ca3af' }}> / {requested}</span>
            {remaining > 0 && (
              <div style={{ fontSize: 12, color: '#f26c2d', fontWeight: 500 }}>{remaining} to issue</div>
            )}
          </div>
        )
      },
    },
    {
      // can the warehouse actually fulfill what's left?
      key: 'availableStock', dataIndex: 'availableStock', title: 'Stock', align: 'center',
      render: (val, record) => {
        const remaining = Math.max(0, (record.quantityRequested || 0) - (record.quantityReceived || 0))
        if (remaining === 0) return <span style={{ color: '#d1d5db' }}>—</span>
        const stock = parseInt(val) || 0
        const enough = stock >= remaining
        return (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: 600, color: enough ? '#15803d' : '#dc2626' }}>
              {stock.toLocaleString()}
            </span>
            <div style={{ fontSize: 12, color: enough ? '#9ca3af' : '#dc2626', fontWeight: enough ? 400 : 500 }}>
              {enough ? 'available' : `short ${remaining - stock}`}
            </div>
          </div>
        )
      },
    },
    {
      key: 'status', dataIndex: 'status', title: 'Status', align: 'center',
      render: (status) => getStatusBadge(status),
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ProcessButton
            onClick={() => handleMarkAsDone(record)}
            disabled={record.status === 'completed'}
          >
            Receive
          </ProcessButton>
          {/* material already issued can't just be deleted — the backend
              blocks it; don't offer the dead affordance */}
          {(record.quantityReceived || 0) === 0 && record.status !== 'completed' && (
            <DeleteButton onConfirm={() => handleDelete(record)} />
          )}
        </div>
      ),
    },
  ]

  const exportMenuItems = [
    { key: 'pdf', label: 'Export PDF', icon: <ExportOutlined />, onClick: handleExportPDF },
  ]

  // ─── Render ───

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <PageTitle>Inventory Requests</PageTitle>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <span style={{ background: '#f7d6ca', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32 }}>
            {stats.pending} Pending
          </span>
          <span style={{ background: '#dbeafe', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32 }}>
            {stats.partial} Partial
          </span>
          <span style={{ background: '#d9fae6', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32 }}>
            {stats.completed} Completed
          </span>
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
            type="text" placeholder="Search by Job ID or Alloy Name..."
            value={searchText}
            onChange={e => { setSearchText(e.target.value); setCurrentPage(1) }}
            style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }}
          />
          <Select
            style={{ width: 200, height: 40 }}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setCurrentPage(1) }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partial' },
              { value: 'completed', label: 'Completed' },
            ]}
            className="plati-filter-dealer"
          />
          <button onClick={fetchInventoryRequests} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', minWidth: 100, justifyContent: 'center',
            background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400,
            fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', flexShrink: 0,
          }}>
            <span style={{ fontSize: 16 }}>↻</span> Refresh
          </button>
          <button onClick={handleExportPDF} style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', minWidth: 100, justifyContent: 'center',
            background: '#1a1a1a', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500,
            fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', flexShrink: 0,
          }}>
            <ExportOutlined style={{ fontSize: 14 }} /> Export PDF
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedRequests}
        rowKey="id"
        loading={loading}
        emptyText="No inventory requests found"
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredRequests.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      />

      <InfoBox
        title="Information"
        items={[
          'Requests come from production job cards (Step Tracking → Request materials)',
          '"Receive" records the running total received — the difference is issued from stock immediately',
          'Received units automatically enter production: they are accepted at the job card\'s first step and move to the next one',
          'Partial deliveries stay open (Partial status) until the full requested quantity is received',
          'A request that has already received material cannot be deleted — set its received quantity back to 0 first',
          'Export PDF generates a grouped summary of outstanding material requirements',
        ]}
      />

      {/* Receive Quantity Modal */}
      <Modal
        title="Receive materials"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => { setIsModalVisible(false); setSelectedRequest(null); form.resetFields() }}
        okText="Save" cancelText="Cancel" width={500}
        okButtonProps={{ style: { background: '#f26c2d', borderRadius: 999 } }}
        cancelButtonProps={{ style: { borderRadius: 999 } }}
        styles={{ content: { borderRadius: 20 } }}
      >
        {selectedRequest && (() => {
          const requested = selectedRequest.quantityRequested || 0
          const received = selectedRequest.quantityReceived || 0
          const remaining = Math.max(0, requested - received)
          const stock = parseInt(selectedRequest.availableStock) || 0
          return (
            <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', border: '1px solid #e5e5e5', borderRadius: 16 }}>
              <div style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#374151', lineHeight: 1.9 }}>
                <div><strong>Job card:</strong> #{selectedRequest.jobCardId}{selectedRequest.planId ? ` · Plan #${selectedRequest.planId}` : ''}</div>
                <div><strong>Material:</strong> {selectedRequest.alloyName}</div>
                <div>
                  <strong>Requested:</strong> {requested}
                  {' · '}<strong>already received:</strong> {received}
                  {remaining > 0 && <>{' · '}<strong style={{ color: '#f26c2d' }}>{remaining} still to issue</strong></>}
                </div>
                <div>
                  <strong>Stock available:</strong>{' '}
                  <span style={{ fontWeight: 600, color: stock >= remaining ? '#15803d' : '#dc2626' }}>
                    {stock.toLocaleString()} units
                  </span>
                  {stock < remaining && <span style={{ color: '#dc2626' }}> — not enough for the full remainder</span>}
                </div>
              </div>
            </div>
          )
        })()}
        <Form form={form} layout="vertical">
          <Form.Item
            label="Total received (running total, not just this delivery)"
            name="receivedQuantity"
            extra={selectedRequest?.quantityReceived > 0
              ? `Currently ${selectedRequest.quantityReceived} — saving a higher number issues the difference from stock and moves it into production; a lower number returns it (only units the next step hasn't consumed can be pulled back).`
              : 'Saving issues this many units from stock — they enter the job card\'s production flow immediately.'}
            rules={[
              { required: true, message: 'Please enter received quantity' },
              { type: 'number', min: 0, message: 'Must be >= 0' },
              { validator: (_, value) => selectedRequest && value > selectedRequest.quantityRequested ? Promise.reject(`Cannot exceed ${selectedRequest.quantityRequested}`) : Promise.resolve() },
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Enter received quantity" min={0} max={selectedRequest?.quantityRequested} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InventoryRequests
