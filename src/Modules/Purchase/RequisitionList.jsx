import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Select } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { getRequisitions, getPendingRequisitionCount } from '../../redux/api/purchaseV2API'
import moment from 'moment'

import PageTitle from '../../Core/Components/PageTitle'
import StatusBadge from '../../Core/Components/StatusBadge'
import DataTablePagination from '../../Core/Components/DataTablePagination'

const STATUS_VARIANT = { pending: 'pending', approved: 'paid', rejected: 'outofstock', indent_created: 'inprod' }
const URGENCY_VARIANT = { normal: 'paid', urgent: 'pending', critical: 'outofstock' }

export default function RequisitionList() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { requisitions, requisitionsPagination, pendingRequisitionCount, loading } = useSelector(s => s.purchaseV2)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const load = (p = page) => {
    dispatch(getRequisitions({ page: p, limit: pageSize, status: statusFilter || undefined, urgency: urgencyFilter || undefined, search: search || undefined }))
    dispatch(getPendingRequisitionCount())
  }

  useEffect(() => { load(1); setPage(1) }, [statusFilter, urgencyFilter])
  useEffect(() => { load() }, [])

  const columns = [
    {
      key: 'prNumber', title: 'PR Number',
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); navigate(`/purchase/requisitions/${r.id}`) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#4a90ff', fontFamily: "'Inter', sans-serif", fontSize: 14, padding: 0, fontVariantNumeric: 'tabular-nums' }}>
          {r.prNumber}
        </button>
      ),
    },
    { key: 'requester', title: 'Requester', render: (r) => r.requesterName },
    { key: 'department', title: 'Department', render: (r) => r.department || '-' },
    {
      key: 'type', title: 'Type', align: 'center',
      render: (r) => <StatusBadge variant={r.purchaseType === 'job_work' ? 'dispatched' : 'inprod'}>{r.purchaseType === 'job_work' ? 'Job Work' : 'Items'}</StatusBadge>,
    },
    {
      key: 'urgency', title: 'Urgency', align: 'center',
      render: (r) => <StatusBadge variant={URGENCY_VARIANT[r.urgency] || 'paid'}>{r.urgency?.toUpperCase()}</StatusBadge>,
    },
    {
      key: 'status', title: 'Status', align: 'center',
      render: (r) => <StatusBadge variant={STATUS_VARIANT[r.status] || 'paid'}>{r.status?.replace('_', ' ').toUpperCase()}</StatusBadge>,
    },
    {
      key: 'requiredBy', title: 'Required By',
      render: (r) => r.requiredByDate ? moment(r.requiredByDate).format('DD MMM YYYY') : '-',
    },
    {
      key: 'date', title: 'Date',
      render: (r) => (
        <div style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
          {moment(r.createdAt).format('DD MMM YYYY')}<br />
          <span style={{ color: '#9ca3af', fontSize: 12 }}>{moment(r.createdAt).format('hh:mm A')}</span>
        </div>
      ),
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); navigate(`/purchase/requisitions/${r.id}`) }} style={{ background: '#4a90ff', border: 'none', borderRadius: 10, padding: '5px 12px', fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer' }}>View</button>
          {r.status === 'pending' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); navigate(`/purchase/requisitions/${r.id}`) }} title="Approve" style={{ background: '#d9fae6', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#15803d', fontSize: 14 }}><CheckCircleOutlined /></button>
              <button onClick={(e) => { e.stopPropagation(); navigate(`/purchase/requisitions/${r.id}`) }} title="Reject" style={{ background: '#fef2f2', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#e53e3e', fontSize: 14 }}><CloseCircleOutlined /></button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <PageTitle>Purchase Requisitions</PageTitle>
        {pendingRequisitionCount > 0 && (
          <span style={{ background: '#f7d6ca', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32, marginTop: 8 }}>
            {pendingRequisitionCount} pending approval
          </span>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, padding: '12px 32px', marginBottom: 16, boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="text" placeholder="Search PR number, requester..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }}
          />
          <Select placeholder="Status" allowClear value={statusFilter || undefined} onChange={v => setStatusFilter(v || '')} style={{ width: 150, height: 40 }} className="plati-filter-dealer"
            options={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'indent_created', label: 'Indent Created' }]}
          />
          <Select placeholder="Urgency" allowClear value={urgencyFilter || undefined} onChange={v => setUrgencyFilter(v || '')} style={{ width: 140, height: 40 }} className="plati-filter-dealer"
            options={[{ value: 'normal', label: 'Normal' }, { value: 'urgent', label: 'Urgent' }, { value: 'critical', label: 'Critical' }]}
          />
          <button onClick={() => load(1)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: 16 }}>↻</span> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={col.key} style={{
                    background: '#f3f3f5', padding: '12px 16px', textAlign: col.align || 'left',
                    fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14, fontFamily: "'Inter', sans-serif",
                    borderBottom: '1px solid #e5e5e5', whiteSpace: 'nowrap', lineHeight: '20px',
                    paddingLeft: i === 0 ? 32 : undefined,
                  }}>{col.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
              ) : !requisitions || requisitions.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No requisitions found</td></tr>
              ) : requisitions.map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                  onClick={() => navigate(`/purchase/requisitions/${record.id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {columns.map((col, i) => (
                    <td key={col.key} style={{
                      padding: '14px 16px', color: '#1a1a1a', verticalAlign: 'middle',
                      fontSize: 14, fontFamily: "'Inter', sans-serif", lineHeight: '20px',
                      textAlign: col.align, paddingLeft: i === 0 ? 32 : undefined,
                    }}>{col.render(record)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          currentPage={page}
          totalItems={requisitionsPagination?.total || 0}
          pageSize={pageSize}
          onPageChange={(p) => { setPage(p); load(p) }}
          onPageSizeChange={() => {}}
        />
      </div>
    </div>
  )
}
