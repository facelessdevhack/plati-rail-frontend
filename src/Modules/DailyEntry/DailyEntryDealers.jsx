import React, { useEffect, useState, useMemo } from 'react'
import { message, Modal } from 'antd'
import { ReloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getAllDealers } from '../../redux/api/stockAPI'
import { client } from '../../Utils/axiosClient'

import PageTitle from '../../Core/Components/PageTitle'
import FilterBar from '../../Core/Components/FilterBar'
import DataTable from '../../Core/Components/DataTable'
import StatusBadge from '../../Core/Components/StatusBadge'
import DataTablePagination from '../../Core/Components/DataTablePagination'

const AdminDailyEntryDealersPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { allDealers, dealersPagination } = useSelector(state => state.stockDetails)
  const { user } = useSelector(state => state.userDetails)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [recalculatingAll, setRecalculatingAll] = useState(false)

  // ─── Data ───

  useEffect(() => { fetchDealers() }, [currentPage, pageSize, searchQuery])

  const fetchDealers = async () => {
    setLoading(true)
    try {
      const params = { page: currentPage, limit: pageSize }
      if (user.roleId !== 5) params.id = user.userId
      if (searchQuery) params.search = searchQuery
      await dispatch(getAllDealers(params))
    } catch (error) {
      console.error('Error fetching dealers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDealerClick = (dealer) => {
    navigate(`/admin-dealers/${dealer.value}`, {
      state: { id: dealer.value, name: dealer.label },
    })
  }

  const handleRecalculateAll = async () => {
    const hide = message.loading('Recalculating orders for all dealers...', 0)
    try {
      setRecalculatingAll(true)
      const response = await client.post('/entries/recalculate-all-orders')
      hide()
      if (response.data?.success) {
        const { summary } = response.data
        message.success(`Recalculated for ${summary.successful.length} of ${summary.totalDealers} dealers`)
        if (summary.failed.length > 0) {
          message.warning(`${summary.failed.length} dealers failed`)
        }
        await fetchDealers()
      }
    } catch (error) {
      hide()
      message.error('Failed to recalculate orders.')
    } finally {
      setRecalculatingAll(false)
    }
  }

  const confirmRecalculateAll = () => {
    if (recalculatingAll) { message.info('Already in progress'); return }
    Modal.confirm({
      title: 'Recalculate All Dealer Orders?',
      content: 'This may take several minutes. Please do not close this page.',
      okText: 'Yes, Recalculate',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: handleRecalculateAll,
    })
  }

  // ─── Columns ───

  const columns = [
    {
      key: 'dealer', dataIndex: 'label', title: 'Dealers',
      render: (text) => <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{text}</span>,
    },
    {
      key: 'salesPerson', dataIndex: 'salesPerson', title: 'Sales Person',
      render: (val) => val || '—',
    },
    {
      key: 'pending', dataIndex: 'uncheckedCount', title: 'Pending Entries', align: 'center',
      render: (count) => <span style={{ fontWeight: 500 }}>{count || 0}</span>,
    },
    {
      key: 'overdue', dataIndex: 'overdueAmount', title: 'Overdue Amount', align: 'center',
      render: (amount) => {
        const amt = parseFloat(amount) || 0
        if (amt > 0) {
          return (
            <StatusBadge variant="outofstock" subText="Over 25 days">
              ₹ {amt.toLocaleString('en-IN')}
            </StatusBadge>
          )
        }
        return <StatusBadge variant="paid">No Overdue</StatusBadge>
      },
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (_, record) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDealerClick(record) }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#4a90ff',
            border: 'none',
            borderRadius: 12,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 400,
            fontFamily: "'Inter', sans-serif",
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            lineHeight: '20px',
          }}
        >
          View Details →
        </button>
      ),
    },
  ]

  // ─── Render ───

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <PageTitle>Daily Dealer Sales Entries</PageTitle>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingTop: 8 }}>
          <button
            onClick={fetchDealers}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#a0a0a8', border: 'none', borderRadius: 123,
              padding: '6px 12px', fontSize: 14, fontWeight: 400,
              fontFamily: "'Inter', sans-serif", color: 'white',
              cursor: 'pointer', lineHeight: '20px',
            }}
          >
            <ReloadOutlined spin={loading} style={{ fontSize: 14 }} /> Refresh
          </button>
          <button
            onClick={confirmRecalculateAll}
            disabled={recalculatingAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f7d6ca', border: 'none', borderRadius: 123,
              padding: '6px 12px', fontSize: 14, fontWeight: 400,
              fontFamily: "'Inter', sans-serif", color: '#1a1a1a',
              cursor: 'pointer', opacity: recalculatingAll ? 0.5 : 1,
              lineHeight: '20px',
            }}
          >
            <ReloadOutlined spin={recalculatingAll} style={{ fontSize: 14 }} /> Refresh All Orders
          </button>
        </div>
      </div>

      <FilterBar
        searchText={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1) }}
        selectedDealer={null}
        onDealerChange={() => {}}
        dealerOptions={[]}
        onRefresh={fetchDealers}
        loading={loading}
        exportMenuItems={[]}
      />

      <div style={{
        background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
        overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="plati-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={{
                    background: '#f3f3f5', padding: '12px 16px', textAlign: col.align || 'left',
                    fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14,
                    fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5',
                    whiteSpace: 'nowrap', lineHeight: '20px',
                    paddingLeft: col.key === 'dealer' ? 32 : undefined,
                  }}>
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>Loading...</td></tr>
              ) : !allDealers || allDealers.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No dealers found</td></tr>
              ) : (
                allDealers.map(row => (
                  <tr
                    key={row.value}
                    onClick={() => handleDealerClick(row)}
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {columns.map(col => (
                      <td key={col.key} style={{
                        padding: '14px 16px', color: '#1a1a1a', borderBottom: '1px solid #f3f4f6',
                        verticalAlign: 'middle', fontSize: 14, fontFamily: "'Inter', sans-serif",
                        lineHeight: '20px', textAlign: col.align,
                        paddingLeft: col.key === 'dealer' ? 32 : undefined,
                      }}>
                        {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          currentPage={currentPage}
          totalItems={dealersPagination?.total || allDealers?.length || 0}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        />
      </div>
    </div>
  )
}

export default AdminDailyEntryDealersPage
