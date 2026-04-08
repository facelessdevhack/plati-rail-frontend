import React, { useEffect, useState, useMemo } from 'react'
import { DatePicker, message, Popconfirm } from 'antd'
import {
  ReloadOutlined, RollbackOutlined, ToolOutlined, CheckCircleOutlined, DeleteOutlined, ExportOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'
import CreateReworkPlanModal from './CreateReworkPlanModal'
import DiscardQuantityModal from './DiscardQuantityModal'

import PageTitle from '../../Core/Components/PageTitle'
import DataTable from '../../Core/Components/DataTable'
import StatusBadge from '../../Core/Components/StatusBadge'
import DataTablePagination from '../../Core/Components/DataTablePagination'
import InfoBox from '../../Core/Components/InfoBox'

const RejectedStockManagement = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [reworkModalVisible, setReworkModalVisible] = useState(false)
  const [discardModalVisible, setDiscardModalVisible] = useState(false)
  const [selectedRejection, setSelectedRejection] = useState(null)

  // ─── Data ───

  const fetchRejectedStock = async (page = 1, search = searchText, range = dateRange) => {
    setLoading(true)
    try {
      const params = { page, limit: pagination.pageSize, search }
      if (range && range[0] && range[1]) {
        params.startDate = range[0].format('YYYY-MM-DD')
        params.endDate = range[1].format('YYYY-MM-DD')
      }
      const response = await client.get('/production/rejected-stock', { params })
      if (response.data.success) {
        setData(response.data.data)
        setPagination({ ...pagination, current: page, total: response.data.pagination.total })
      }
    } catch (error) {
      message.error('Failed to load rejected stock')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRejectedStock() }, [])

  const handleAction = async (id, action) => {
    setLoading(true)
    try {
      const response = await client.post(`/production/rejected-stock/${id}/process`, { action })
      if (response.data.success) { message.success(response.data.message); fetchRejectedStock(pagination.current) }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to process')
    } finally {
      setLoading(false)
    }
  }

  const handleReworkSuccess = () => {
    message.success('Rework plan created')
    fetchRejectedStock(pagination.current)
  }

  // ─── Columns ───

  const columns = [
    {
      key: 'date', dataIndex: 'rejectionDate', title: 'Date',
      render: (date) => (
        <div style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
          {moment(date).format('DD MMM YYYY')}<br />
          <span style={{ color: '#9ca3af', fontSize: 12 }}>{moment(date).format('dddd')}</span>
        </div>
      ),
    },
    {
      key: 'product', title: 'Product Info',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.alloyName}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{record.finishName}</div>
        </div>
      ),
    },
    {
      key: 'jobCard', dataIndex: 'jobCardId', title: 'Job Card', align: 'center',
      render: (id) => <StatusBadge variant="inprod">#{id}</StatusBadge>,
    },
    {
      key: 'rejectedQty', dataIndex: 'rejectedQuantity', title: 'Rejected Qty', align: 'center',
      render: (qty) => <span style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>{qty}</span>,
    },
    {
      key: 'overview', title: 'Overview',
      render: (_, record) => (
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          <div>Reason: {record.rejectionReason || 'N/A'}</div>
          <div>By: {record.createdByFirstName} {record.createdByLastName}</div>
        </div>
      ),
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Popconfirm
            title={`Return ${record.rejectedQuantity} items to Main Stock?`}
            onConfirm={() => handleAction(record.rejectionId, 'return_to_source')}
            okText="Return" cancelText="Cancel"
            icon={<CheckCircleOutlined style={{ color: '#4ecb71' }} />}
          >
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#d9fae6', border: 'none', borderRadius: 10,
              padding: '6px 12px', fontSize: 13, fontWeight: 500,
              fontFamily: "'Inter', sans-serif", color: '#15803d',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              <RollbackOutlined /> Return
            </button>
          </Popconfirm>
          <button onClick={() => { setSelectedRejection(record); setReworkModalVisible(true) }} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#4a90ff', border: 'none', borderRadius: 10,
            padding: '6px 12px', fontSize: 13, fontWeight: 500,
            fontFamily: "'Inter', sans-serif", color: 'white',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            <ToolOutlined /> Rework
          </button>
          <button onClick={() => { setSelectedRejection(record); setDiscardModalVisible(true) }} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(26,26,26,0.2)', border: 'none', borderRadius: 10,
            padding: '6px 12px', fontSize: 13, fontWeight: 500,
            fontFamily: "'Inter', sans-serif", color: '#1a1a1a',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            <DeleteOutlined /> Discard
          </button>
        </div>
      ),
    },
  ]

  // ─── Render ───

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <PageTitle>Rejected Stock Management</PageTitle>
        <span style={{ background: '#fef2f2', color: '#dc2626', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32, border: '1px solid rgba(229,62,62,0.2)', marginTop: 8 }}>
          {pagination.total} Rejected Items
        </span>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
        padding: '12px 32px', marginBottom: 16,
        boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text" placeholder="Search Product, Model, Finish or Job Card ID..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchRejectedStock(1, searchText, dateRange)}
            style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }}
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={range => { setDateRange(range); fetchRejectedStock(1, searchText, range) }}
            format="DD MMM YYYY"
            placeholder={['Start Date', 'End Date']}
            className="plati-filter-daterange"
            style={{ height: 40, borderRadius: 123, borderColor: '#a0a0a8', minWidth: 260 }}
          />
          <button onClick={() => fetchRejectedStock(pagination.current)} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', minWidth: 100, justifyContent: 'center',
            background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400,
            fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', flexShrink: 0,
          }}>
            <ReloadOutlined spin={loading} style={{ fontSize: 14 }} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
        overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={{
                    background: '#f3f3f5', padding: '12px 16px',
                    textAlign: col.align || 'left',
                    fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14,
                    fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5',
                    whiteSpace: 'nowrap', lineHeight: '20px',
                    paddingLeft: col.key === 'date' ? 32 : undefined,
                  }}>{col.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
              ) : !data || data.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No rejected stock pending resolution</td></tr>
              ) : (
                data.map((record, idx) => (
                  <tr key={record.rejectionId || idx} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {columns.map(col => (
                      <td key={col.key} style={{
                        padding: '14px 16px', color: '#1a1a1a', verticalAlign: 'middle',
                        fontSize: 14, fontFamily: "'Inter', sans-serif", lineHeight: '20px',
                        textAlign: col.align,
                        paddingLeft: col.key === 'date' ? 32 : undefined,
                      }}>
                        {col.render ? col.render(record[col.dataIndex], record) : record[col.dataIndex]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          currentPage={pagination.current}
          totalItems={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(page) => fetchRejectedStock(page, searchText, dateRange)}
          onPageSizeChange={(size) => { setPagination(p => ({ ...p, pageSize: size })); fetchRejectedStock(1, searchText, dateRange) }}
        />
      </div>

      <InfoBox
        title="Information"
        items={[
          'Rejected stock items are flagged during quality checks in production',
          'Return to Stock — adds units back to main inventory',
          'Create Rework Plan — sends items back through production for fixing',
          'Discard — permanently removes items from inventory (use with caution)',
        ]}
      />

      <CreateReworkPlanModal
        visible={reworkModalVisible}
        onCancel={() => { setReworkModalVisible(false); setSelectedRejection(null) }}
        onSuccess={handleReworkSuccess}
        rejectionRecord={selectedRejection}
      />

      <DiscardQuantityModal
        visible={discardModalVisible}
        onCancel={() => { setDiscardModalVisible(false); setSelectedRejection(null) }}
        onSuccess={() => fetchRejectedStock(pagination.current)}
        rejectionRecord={selectedRejection}
      />
    </div>
  )
}

export default RejectedStockManagement
