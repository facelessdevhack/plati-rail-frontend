import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getPurchaseOrders } from '../../redux/api/purchaseV2API'
import moment from 'moment'

import PageTitle from '../../Core/Components/PageTitle'
import StatusBadge from '../../Core/Components/StatusBadge'
import DataTablePagination from '../../Core/Components/DataTablePagination'

const STATUS_VARIANT = { pending: 'pending', approved: 'inprod', sent: 'inprod', partially_received: 'dispatched', received: 'paid', cancelled: 'outofstock' }

export default function POList() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { purchaseOrders, purchaseOrdersPagination, loading } = useSelector(s => s.purchaseV2)
  const { user } = useSelector(s => s.userDetails)
  const [status, setStatus] = useState(null)
  const [search, setSearch] = useState('')
  const isPC = [10, 5, 999].includes(Number(user?.roleId))

  const load = (page = 1) => dispatch(getPurchaseOrders({ page, limit: 20, status: status || undefined, search: search || undefined }))
  useEffect(() => { load(1) }, [])

  const columns = [
    { key: 'order', title: 'Order Number', render: r => <button onClick={e => { e.stopPropagation(); navigate(`/purchase/po/${r.id}`) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#4a90ff', fontFamily: "'Inter', sans-serif", fontSize: 14, padding: 0 }}>{r.orderNumber}</button> },
    { key: 'status', title: 'Status', align: 'center', render: r => <StatusBadge variant={STATUS_VARIANT[r.status] || 'paid'}>{r.status?.replace(/_/g, ' ').toUpperCase()}</StatusBadge> },
    { key: 'vendor', title: 'Vendor', render: r => r.vendorName || '-' },
    { key: 'indent', title: 'Indent', render: r => r.indentNumber ? <span style={{ fontSize: 12, color: '#6b7280' }}>{r.indentNumber}</span> : '-' },
    { key: 'total', title: 'Total (₹)', align: 'right', render: r => r.totalAmount ? `₹${Number(r.totalAmount).toLocaleString('en-IN')}` : '-' },
    { key: 'delivery', title: 'Expected Delivery', render: r => r.expectedDeliveryDate ? moment(r.expectedDeliveryDate).format('DD MMM YYYY') : '-' },
    { key: 'date', title: 'Created', render: r => <div style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{moment(r.createdAt).format('DD MMM YYYY')}<br /><span style={{ color: '#9ca3af', fontSize: 12 }}>{moment(r.createdAt).format('hh:mm A')}</span></div> },
    { key: 'actions', title: 'Actions', align: 'center', render: r => <button onClick={e => { e.stopPropagation(); navigate(`/purchase/po/${r.id}`) }} style={{ background: '#4a90ff', border: 'none', borderRadius: 10, padding: '5px 12px', fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer' }}>View</button> },
  ]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <PageTitle>Purchase Orders</PageTitle>
        {isPC && <button onClick={() => navigate('/purchase/po/create')} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', marginTop: 8 }}><PlusOutlined style={{ fontSize: 14 }} /> Create PO</button>}
      </div>
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, padding: '12px 32px', marginBottom: 16, boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="text" placeholder="Search PO number or vendor..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }} />
          <Select placeholder="Status" allowClear value={status} onChange={setStatus} style={{ width: 180, height: 40 }} className="plati-filter-dealer"
            options={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'sent', label: 'Sent' }, { value: 'partially_received', label: 'Partially Received' }, { value: 'received', label: 'Received' }, { value: 'cancelled', label: 'Cancelled' }]} />
          <button onClick={() => load(1)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', flexShrink: 0 }}><span style={{ fontSize: 16 }}>↻</span> Refresh</button>
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr>{columns.map((c, i) => <th key={c.key} style={{ background: '#f3f3f5', padding: '12px 16px', textAlign: c.align || 'left', fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14, fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5', whiteSpace: 'nowrap', paddingLeft: i === 0 ? 32 : undefined }}>{c.title}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
              : !purchaseOrders?.length ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No purchase orders found</td></tr>
              : purchaseOrders.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => navigate(`/purchase/po/${r.id}`)} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{columns.map((c, i) => <td key={c.key} style={{ padding: '14px 16px', color: '#1a1a1a', verticalAlign: 'middle', fontSize: 14, fontFamily: "'Inter', sans-serif", textAlign: c.align, paddingLeft: i === 0 ? 32 : undefined }}>{c.render(r)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
        <DataTablePagination currentPage={purchaseOrdersPagination?.currentPage || 1} totalItems={purchaseOrdersPagination?.total || 0} pageSize={20} onPageChange={load} onPageSizeChange={() => {}} />
      </div>
    </div>
  )
}
