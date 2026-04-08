import React, { useState, useEffect, useMemo } from 'react'
import { message, Modal, Form, InputNumber, Select } from 'antd'
import { ExportOutlined, FileExcelOutlined } from '@ant-design/icons'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { client } from '../../Utils/axiosClient'

import PageTitle from '../../Core/Components/PageTitle'
import DataTable from '../../Core/Components/DataTable'
import StatusBadge from '../../Core/Components/StatusBadge'
import { ProcessButton, DeleteButton } from '../../Core/Components/ActionButton'
import InfoBox from '../../Core/Components/InfoBox'

const InventoryRequests = () => {
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
        (req.alloyName || '').toLowerCase().includes(search) ||
        (req.productName || '').toLowerCase().includes(search)
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
    form.setFieldsValue({ receivedQuantity: record.quantityReceived || 0 })
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
      message.error('Failed to update quantity')
    }
  }

  const handleDelete = async (record) => {
    try {
      await client.delete(`/production/inventory-requests/${record.id}`)
      message.success(`Request for Job ${record.jobCardId} deleted`)
      fetchInventoryRequests()
    } catch (error) {
      message.error('Failed to delete inventory request')
    }
  }

  const handleExportPDF = () => {
    const incompleteRequests = requests.filter(r => r.status !== 'completed')
    if (incompleteRequests.length === 0) { message.info('No incomplete requests to export'); return }
    const groupedData = incompleteRequests.reduce((acc, req) => {
      if (acc[req.alloyName]) acc[req.alloyName].quantityRequested += req.quantityRequested
      else acc[req.alloyName] = { alloyName: req.alloyName, quantityRequested: req.quantityRequested }
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
    if (status === 'partial') return <StatusBadge variant="pending">Partial</StatusBadge>
    return <StatusBadge variant="outofstock">Pending</StatusBadge>
  }

  // ─── Columns ───

  const columns = [
    {
      key: 'jobCardId', dataIndex: 'jobCardId', title: 'Job ID',
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    { key: 'alloyName', dataIndex: 'alloyName', title: 'Alloy Name' },
    {
      key: 'quantityRequested', dataIndex: 'quantityRequested', title: 'Qty Requested', align: 'center',
      render: (val) => <span style={{ fontWeight: 600, color: '#4a90ff' }}>{val}</span>,
    },
    {
      key: 'quantityReceived', dataIndex: 'quantityReceived', title: 'Qty Received', align: 'center',
      render: (val, record) => {
        const pct = record.quantityRequested > 0 ? (val / record.quantityRequested) * 100 : 0
        const color = pct === 100 ? '#15803d' : pct > 0 ? '#f26c2d' : '#dc2626'
        return (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: 600, color }}>{val}</span>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{pct.toFixed(0)}%</div>
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
            Done
          </ProcessButton>
          {record.status !== 'completed' && (
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
          'Inventory requests are created from job cards when materials are needed',
          'Mark requests as "Done" when materials are received from inventory',
          'Partial fulfillment is tracked automatically based on received quantity',
          'Export PDF generates a grouped summary of pending alloy requirements',
        ]}
      />

      {/* Receive Quantity Modal */}
      <Modal
        title="Update Received Quantity"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => { setIsModalVisible(false); setSelectedRequest(null); form.resetFields() }}
        okText="Save" cancelText="Cancel" width={500}
      >
        {selectedRequest && (
          <div style={{ marginBottom: 16, padding: 16, background: '#f9fafb', borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#374151', lineHeight: 1.8 }}>
              <div><strong>Job ID:</strong> {selectedRequest.jobCardId}</div>
              <div><strong>Alloy:</strong> {selectedRequest.alloyName}</div>
              <div><strong>Quantity Requested:</strong> <span style={{ color: '#4a90ff', fontWeight: 600 }}>{selectedRequest.quantityRequested}</span></div>
            </div>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item label="Received Quantity" name="receivedQuantity"
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
