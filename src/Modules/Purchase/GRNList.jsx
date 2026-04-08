import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getGRNs } from '../../redux/api/purchaseV2API'
import moment from 'moment'

import PageTitle from '../../Core/Components/PageTitle'
import StatusBadge from '../../Core/Components/StatusBadge'
import DataTablePagination from '../../Core/Components/DataTablePagination'

export default function GRNList() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { grnList, grnPagination, loading } = useSelector(s => s.purchaseV2)
  const { user } = useSelector(s => s.userDetails)
  const [status, setStatus] = useState(null)
  const [search, setSearch] = useState('')
  const isSM = [8, 5, 999].includes(Number(user?.roleId))

  const load = (page = 1) => dispatch(getGRNs({ page, limit: 20, status: status || undefined, search: search || undefined }))
  useEffect(() => { load(1) }, [])

  const columns = [
    { key: 'grn', title: 'GRN Number', render: r => <button onClick={e => { e.stopPropagation(); navigate(`/purchase/grn/${r.id}`) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#4a90ff', fontFamily: "'Inter', sans-serif", fontSize: 14, padding: 0 }}>{r.grnNumber}</button> },
    { key: 'status', title: 'Status', align: 'center', render: r => <StatusBadge variant={r.status === 'completed' ? 'paid' : 'pending'}>{r.status?.toUpperCase()}</StatusBadge> },
    { key: 'po', title: 'PO Number', render: r => r.orderNumber ? <span style={{ fontSize: 12, color: '#6b7280' }}>{r.orderNumber}</span> : '-' },
    { key: 'vendor', title: 'Vendor', render: r => r.vendorName || '-' },
    { key: 'receivedBy', title: 'Received By', render: r => r.receivedByName || '-' },
    { key: 'date', title: 'Received Date', render: r => r.receivedDate ? <div style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{moment(r.receivedDate).format('DD MMM YYYY')}<br /><span style={{ color: '#9ca3af', fontSize: 12 }}>{moment(r.receivedDate).format('hh:mm A')}</span></div> : '-' },
    { key: 'actions', title: 'Actions', align: 'center', render: r => <button onClick={e => { e.stopPropagation(); navigate(`/purchase/grn/${r.id}`) }} style={{ background: '#4a90ff', border: 'none', borderRadius: 10, padding: '5px 12px', fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer' }}>View</button> },
  ]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <PageTitle>Goods Received Notes</PageTitle>
        {isSM && <button onClick={() => navigate('/purchase/grn/create')} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', marginTop: 8 }}><PlusOutlined style={{ fontSize: 14 }} /> Create GRN</button>}
      </div>
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, padding: '12px 32px', marginBottom: 16, boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="text" placeholder="Search GRN or PO number..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }} />
          <Select placeholder="Status" allowClear value={status} onChange={setStatus} style={{ width: 160, height: 40 }} className="plati-filter-dealer"
            options={[{ value: 'draft', label: 'Draft' }, { value: 'completed', label: 'Completed' }]} />
          <button onClick={() => load(1)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', flexShrink: 0 }}><span style={{ fontSize: 16 }}>↻</span> Refresh</button>
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr>{columns.map((c, i) => <th key={c.key} style={{ background: '#f3f3f5', padding: '12px 16px', textAlign: c.align || 'left', fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14, fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5', whiteSpace: 'nowrap', paddingLeft: i === 0 ? 32 : undefined }}>{c.title}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
              : !grnList?.length ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No GRNs found</td></tr>
              : grnList.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => navigate(`/purchase/grn/${r.id}`)} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{columns.map((c, i) => <td key={c.key} style={{ padding: '14px 16px', color: '#1a1a1a', verticalAlign: 'middle', fontSize: 14, fontFamily: "'Inter', sans-serif", textAlign: c.align, paddingLeft: i === 0 ? 32 : undefined }}>{c.render(r)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
        <DataTablePagination currentPage={grnPagination?.currentPage || 1} totalItems={grnPagination?.total || 0} pageSize={20} onPageChange={load} onPageSizeChange={() => {}} />
      </div>
    </div>
  )
}
