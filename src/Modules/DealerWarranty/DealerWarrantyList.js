import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, DatePicker, message, Modal } from 'antd'
import { EditOutlined, FileExcelOutlined } from '@ant-design/icons'
import { warrantyService } from './services/warrantyService'
import moment from 'moment'
import * as XLSX from 'xlsx'

import PageTitle from '../../Core/Components/PageTitle'
import FilterBar from '../../Core/Components/FilterBar'
import StatusBadge from '../../Core/Components/StatusBadge'
import DataTablePagination from '../../Core/Components/DataTablePagination'

const DealerWarrantyList = () => {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchText, setSearchText] = useState('')
  const [selectedDealer, setSelectedDealer] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [dealers, setDealers] = useState([])
  const [previewImage, setPreviewImage] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('')

  // ─── Data ───

  useEffect(() => { fetchDealers(); fetchWarrantyData() }, [])

  const fetchDealers = async () => {
    try {
      const response = await warrantyService.getDealers()
      let dealerList = []
      if (response?.success && response.data) dealerList = Array.isArray(response.data) ? response.data : []
      else if (Array.isArray(response)) dealerList = response
      else if (response?.data && Array.isArray(response.data)) dealerList = response.data
      setDealers(dealerList)
    } catch (error) {
      console.error('Error fetching dealers for filter:', error)
      setDealers([])
    }
  }

  const fetchWarrantyData = async () => {
    setLoading(true)
    try {
      const response = await warrantyService.getAllProductRegistrations(selectedDealer || '')
      let responseData = []
      if (response?.success && response.data) responseData = Array.isArray(response.data) ? response.data : []
      else if (Array.isArray(response)) responseData = response
      else if (response?.data && Array.isArray(response.data)) responseData = response.data
      setData(responseData)
    } catch (error) {
      message.error('Failed to fetch warranty data')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWarrantyData() }, [selectedDealer])

  const filteredData = useMemo(() => {
    let filtered = [...data]
    if (searchText) {
      const s = searchText.toLowerCase().trim()
      filtered = filtered.filter(item =>
        [item.customerName, item.warrantyCardNo, item.vehicleNo, item.mobileNo, item.dealerName, item.alloyModelName, item.finishName]
          .some(f => String(f || '').toLowerCase().includes(s))
      )
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(item => {
        const d = moment(item.dop)
        return d.isBetween(dateRange[0], dateRange[1], 'day', '[]')
      })
    }
    return filtered
  }, [data, searchText, dateRange])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const dealerOptions = useMemo(() =>
    dealers.map(d => ({ label: d.buyer_name || d.dealerName || d.name, value: d.id })),
  [dealers])

  // ─── Handlers ───

  const handlePreview = (url, title) => { setPreviewImage(url); setPreviewTitle(title); setPreviewVisible(true) }
  const handleEditWarranty = (record) => { navigate(`/dealer-warranty/edit/${record.id}`) }

  const handleExportToExcel = () => {
    if (filteredData.length === 0) { message.warning('No data to export'); return }
    const excelData = filteredData.map((r, i) => ({
      'S.No': i + 1, 'Warranty Card No': r.warrantyCardNo || 'N/A', 'Vehicle No': r.vehicleNo || 'N/A',
      'Customer Name': r.customerName || 'N/A', 'Mobile No': r.mobileNo || 'N/A',
      'Alloy Model': r.alloyModelName || 'N/A', 'Finish': r.finishName || 'N/A',
      'Dealer': r.dealerName || 'N/A', 'Purchase Date': r.dop ? moment(r.dop).format('DD/MM/YYYY') : 'N/A',
      'OTP Status': r.otpVerified === 'NotVerified' ? 'OTP Pending' : 'OTP Verified',
      'Amount': r.amount ? `₹${parseFloat(r.amount).toLocaleString('en-IN')}` : 'N/A',
    }))
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Warranty Registrations')
    XLSX.writeFile(wb, `Warranty_Registrations_${moment().format('DD-MM-YYYY')}.xlsx`)
    message.success(`Exported ${excelData.length} records`)
  }

  const exportMenuItems = [
    { key: 'excel', label: 'Export Excel', icon: <FileExcelOutlined />, onClick: handleExportToExcel },
  ]

  // ─── Table Columns ───

  const columns = [
    {
      key: 'date', title: 'Purchase Date',
      render: (record) => (
        <div style={{ whiteSpace: 'nowrap', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
          {record.dop ? moment(record.dop).format('DD MMM YYYY') : 'N/A'}<br />
          <span style={{ color: '#9ca3af', fontSize: 13 }}>{record.enteredDateGmt ? moment(record.enteredDateGmt).format('hh:mm A') : ''}</span>
        </div>
      ),
    },
    {
      key: 'dealer', title: 'Dealers',
      render: (record) => <span style={{ fontWeight: 500, fontSize: 14, fontFamily: "'Inter', sans-serif" }}>{record.dealerName || 'N/A'}</span>,
    },
    {
      key: 'warranty', title: 'Warranty & Vehicle Info.',
      render: (record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {record.warrantyCardImage ? (
              <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => handlePreview(record.warrantyCardImage, `Warranty Card - ${record.warrantyCardNo}`)}>
                <img src={record.warrantyCardImage} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover', border: '1px solid #e5e5e5' }} />
              </div>
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 20, background: '#f3f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>N/A</div>
            )}
            <div style={{ fontWeight: 400, fontSize: 14, color: '#1a1a1a', fontFamily: "'Inter', sans-serif" }}>{record.warrantyCardNo || 'N/A'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {record.vehicleImage ? (
              <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => handlePreview(record.vehicleImage, `Vehicle - ${record.vehicleNo}`)}>
                <img src={record.vehicleImage} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover', border: '1px solid #e5e5e5' }} />
              </div>
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 20, background: '#f3f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>N/A</div>
            )}
            <div style={{ fontWeight: 400, fontSize: 14, color: '#1a1a1a', fontFamily: "'Inter', sans-serif" }}>{record.vehicleNo || 'N/A'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'customer', title: 'Customer Details',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 14, fontFamily: "'Inter', sans-serif", color: '#1a1a1a' }}>{record.customerName || 'N/A'}</div>
          <div style={{ fontSize: 14, color: '#1a1a1a', fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>{record.mobileNo || ''}</div>
          <StatusBadge variant={record.otpVerified === 'NotVerified' ? 'outofstock' : 'paid'}>
            {record.otpVerified === 'NotVerified' ? 'OTP Pending' : 'OTP Verified'}
          </StatusBadge>
        </div>
      ),
    },
    {
      key: 'product', title: 'Product Info',
      render: (record) => (
        <div style={{ fontSize: 14, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4a90ff' }}>Price:</span> <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{record.amount ? `₹${parseFloat(record.amount).toLocaleString('en-IN')}` : 'N/A'}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4a90ff' }}>Model:</span> <span style={{ color: '#1a1a1a' }}>{record.alloyModelName || 'N/A'}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4a90ff' }}>Alloy Size:</span> <span style={{ color: '#1a1a1a' }}>{record.inchesName || 'N/A'}{record.pcdName ? ` ${record.pcdName}` : ''}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4a90ff' }}>Finish:</span> <span style={{ color: '#1a1a1a' }}>{record.finishName || 'N/A'}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4a90ff' }}>Quantity (units):</span> <span style={{ color: '#1a1a1a' }}>{record.noOfAlloys || record.quantity || 'N/A'}</span></div>
        </div>
      ),
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (record) => (
        <button onClick={() => handleEditWarranty(record)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#4a90ff', border: 'none', borderRadius: 12,
          padding: '10px 16px', fontSize: 14, fontWeight: 400,
          fontFamily: "'Inter', sans-serif", color: 'white',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <EditOutlined /> Edit
        </button>
      ),
    },
  ]

  // ─── Render ───

  return (
    <div style={{ width: '100%' }}>
      <PageTitle>Dealer Warranty Registrations</PageTitle>

      <FilterBar
        searchText={searchText}
        onSearchChange={(val) => { setSearchText(val); setCurrentPage(1) }}
        selectedDealer={selectedDealer}
        onDealerChange={(val) => { setSelectedDealer(val); setCurrentPage(1) }}
        dealerOptions={dealerOptions}
        dateRange={dateRange}
        onDateRangeChange={(dates) => { setDateRange(dates); setCurrentPage(1) }}
        onRefresh={fetchWarrantyData}
        loading={loading}
        exportMenuItems={exportMenuItems}
      />

      {/* Table */}
      <div style={{
        background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
        overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={col.key} style={{
                    background: '#f3f3f5', padding: '12px 16px',
                    textAlign: col.align || 'left',
                    fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14,
                    fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5',
                    whiteSpace: 'nowrap', lineHeight: '20px',
                    paddingLeft: i === 0 ? 32 : undefined,
                  }}>{col.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No warranty registrations found</td></tr>
              ) : (
                paginatedData.map((record, idx) => (
                  <tr key={record.id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {columns.map((col, i) => (
                      <td key={col.key} style={{
                        padding: '14px 16px', color: '#1a1a1a', verticalAlign: 'middle',
                        fontSize: 14, fontFamily: "'Inter', sans-serif", lineHeight: '20px',
                        textAlign: col.align,
                        paddingLeft: i === 0 ? 32 : undefined,
                      }}>
                        {col.render(record)}
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
          totalItems={filteredData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        />
      </div>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={<span style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>{previewTitle}</span>}
        footer={null}
        onCancel={() => { setPreviewVisible(false); setPreviewImage('') }}
        width={540}
        centered
        styles={{ body: { padding: '24px 32px 32px' } }}
      >
        <div style={{ background: '#f3f3f5', borderRadius: 16, overflow: 'hidden', padding: 0 }}>
          <img
            alt="Preview"
            style={{ width: '100%', display: 'block', borderRadius: 16, objectFit: 'contain' }}
            src={previewImage}
          />
        </div>
      </Modal>
    </div>
  )
}

export default DealerWarrantyList
