import React, { useEffect, useState, useMemo } from 'react'
import {
  Row,
  Col,
  Input,
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Tooltip,
  message,
  Card,
  Statistic
} from 'antd'
import {
  SearchOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FilePdfOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getDispatchEntriesAPI } from '../../redux/api/entriesAPI'
import moment from 'moment'

const { Text, Title } = Typography
const { Search } = Input

const DispatchEntriesPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { dispatchEntries } = useSelector(state => state.entryDetails)

  // State management
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [groupedData, setGroupedData] = useState([])

  useEffect(() => {
    fetchTodayEntries()
  }, [dispatch])

  useEffect(() => {
    // Ensure dispatchEntries is an array
    const entriesArray = Array.isArray(dispatchEntries) ? dispatchEntries : []

    // Filter entries for today only (using the date field or created_at)
    const today = moment().format('YYYY-MM-DD')
    const todayEntries = entriesArray.filter(entry => {
      // Use dateIST if available (from backend), otherwise fallback to date or created_at
      const entryDate = entry.dateIST
        ? moment(entry.dateIST).format('YYYY-MM-DD')
        : moment(entry.date || entry.createdAt).format('YYYY-MM-DD')
      return entryDate === today
    })

    // Group entries by dealer
    const grouped = todayEntries.reduce((acc, entry) => {
      const dealerId = entry.dealerId
      if (!acc[dealerId]) {
        acc[dealerId] = {
          dealerId: entry.dealerId,
          dealerName: entry.dealerName,
          entries: [],
          totalQuantity: 0,
          entryCount: 0
        }
      }
      acc[dealerId].entries.push(entry)
      acc[dealerId].totalQuantity += entry.quantity || 0
      acc[dealerId].entryCount += 1
      return acc
    }, {})

    // Convert to array and filter based on search
    let groupedArray = Object.values(grouped)

    if (searchQuery) {
      groupedArray = groupedArray.filter(
        group =>
          group.dealerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.dealerId?.toString().includes(searchQuery) ||
          group.entries.some(
            entry =>
              entry.productName
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              entry.id?.toString().includes(searchQuery)
          )
      )
    }

    setGroupedData(groupedArray)
  }, [searchQuery, dispatchEntries])

  const fetchTodayEntries = async () => {
    setLoading(true)
    try {
      await dispatch(getDispatchEntriesAPI())
    } catch (error) {
      message.error('Failed to fetch dispatch entries')
      console.error('Error fetching dispatch entries:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = value => {
    setSearchQuery(value)
  }

  // Handle view dealer details
  const handleViewDealer = (dealerId, dealerName) => {
    navigate(`/admin-dealers/${dealerId}`, {
      state: { id: dealerId, name: dealerName }
    })
  }

  // Handle export dispatch entries
  const handleExportDispatchEntries = () => {
    if (groupedData.length === 0) {
      message.warning('No dispatch entries available to export')
      return
    }

    // Sort dealers by name for consistent export order
    const sortedDealerGroups = [...groupedData].sort((a, b) =>
      a.dealerName?.localeCompare(b.dealerName)
    )

    // Export individual PDF for each dealer
    sortedDealerGroups.forEach((dealerGroup, index) => {
      setTimeout(() => {
        exportIndividualDealerPDF(dealerGroup)
      }, index * 500) // Small delay between exports to avoid browser blocking
    })

    message.success(
      `Exporting ${sortedDealerGroups.length} separate PDFs - one for each dealer`
    )
  }

  // Export individual dealer PDF function - Clean Corporate Design
  const exportIndividualDealerPDF = dealerGroup => {
    try {
      const { dealerName, dealerId, entries, entryCount, totalQuantity } =
        dealerGroup
      const reportTitle = `${dealerName} - Dispatch Entries - ${moment().format(
        'DD MMM YYYY'
      )}`

      // Create HTML content for individual dealer PDF with clean corporate design
      let htmlContent = `
                <html>
                  <head>
                    <title>${reportTitle}</title>
                    <style>
                      @page {
                        size: A4;
                        margin: 15mm;
                        orientation: portrait;
                      }
                      body {
                        font-family: Arial, Helvetica, sans-serif;
                        font-size: 12px;
                        margin: 0;
                        padding: 0;
                        color: #2c3e50;
                        background: #ffffff;
                        line-height: 1.4;
                      }

                      /* Clean Header Section */
                      .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #34495e;
                        padding-bottom: 15px;
                      }

                      .company-logo {
                        width: 50px;
                        height: 50px;
                        background: #000;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 16px;
                        color: white;
                      }

                      .header-info {
                        text-align: right;
                      }

                      .company-name {
                        font-size: 18px;
                        font-weight: bold;
                        margin: 0;
                        color: #2c3e50;
                      }

                      .document-title {
                        font-size: 14px;
                        margin: 2px 0 0 0;
                        color: #7f8c8d;
                      }

                      /* Main Document Title */
                      .main-title {
                        text-align: center;
                        margin: 20px 0 30px 0;
                        font-size: 24px;
                        font-weight: bold;
                        color: #2c3e50;
                        text-transform: uppercase;
                      }

                      /* Dealer Information Box */
                      .dealer-info {
                        background: #f8f9fa;
                        border: 1px solid #e9ecef;
                        padding: 20px;
                        margin-bottom: 25px;
                        border-radius: 4px;
                      }

                      .dealer-header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 1px solid #dee2e6;
                        padding-bottom: 15px;
                      }

                      .dealer-name {
                        font-size: 20px;
                        font-weight: bold;
                        color: #2c3e50;
                        margin: 0;
                      }

                      .dealer-id {
                        font-size: 14px;
                        color: #7f8c8d;
                        margin-top: 5px;
                      }

                      .stats-row {
                        display: flex;
                        justify-content: space-around;
                        text-align: center;
                      }

                      .stat-item {
                        flex: 1;
                        padding: 0 10px;
                      }

                      .stat-label {
                        font-size: 12px;
                        color: #7f8c8d;
                        text-transform: uppercase;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                        margin-bottom: 5px;
                      }

                      .stat-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #2c3e50;
                      }

                      .stat-unit {
                        font-size: 12px;
                        color: #7f8c8d;
                        margin-top: 2px;
                      }

                      /* Clean Table Design */
                      .table-wrapper {
                        border: 1px solid #dee2e6;
                        border-radius: 4px;
                        overflow: hidden;
                        margin-bottom: 25px;
                      }

                      .table-caption {
                        background: #f8f9fa;
                        padding: 12px;
                        text-align: center;
                        font-weight: 600;
                        color: #495057;
                        border-bottom: 1px solid #dee2e6;
                        font-size: 14px;
                      }

                      table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 0;
                      }

                      th {
                        background: #34495e;
                        color: white;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        padding: 12px 10px;
                        text-align: left;
                        font-size: 11px;
                        border-bottom: 1px solid #2c3e50;
                      }

                      td {
                        padding: 12px 10px;
                        border-bottom: 1px solid #dee2e6;
                        vertical-align: top;
                      }

                      tr:nth-child(even) {
                        background-color: #f8f9fa;
                      }

                      .sno-col {
                        width: 8%;
                        text-align: center;
                        font-weight: 600;
                        color: #34495e;
                      }

                      .date-col {
                        width: 20%;
                        text-align: center;
                        color: #495057;
                      }

                      .product-col {
                        width: 52%;
                        color: #2c3e50;
                        font-weight: 500;
                      }

                      .qty-col {
                        width: 20%;
                        text-align: center;
                        font-weight: 600;
                        color: #28a745;
                      }

                      .no-entries {
                        text-align: center;
                        font-style: italic;
                        color: #7f8c8d;
                        padding: 30px;
                        background: #f8f9fa;
                        font-size: 14px;
                      }

                      /* Clean Footer */
                      .footer {
                        margin-top: 40px;
                        padding: 20px 0;
                        border-top: 1px solid #dee2e6;
                        text-align: center;
                        color: #7f8c8d;
                        font-size: 11px;
                      }

                      .footer-note {
                        font-weight: 600;
                        color: #495057;
                        margin-bottom: 15px;
                      }

                      .footer-info {
                        display: flex;
                        justify-content: center;
                        gap: 30px;
                        margin-top: 10px;
                      }

                      .footer-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                      }

                      /* Print Optimization */
                      @media print {
                        body {
                          font-size: 10px !important;
                        }
                        .main-title {
                          font-size: 20px !important;
                          margin-bottom: 20px !important;
                        }
                        .dealer-name {
                          font-size: 18px !important;
                        }
                        .stat-value {
                          font-size: 20px !important;
                        }
                        th, td {
                          padding: 8px 6px !important;
                          font-size: 9px !important;
                        }
                        th {
                          font-size: 10px !important;
                        }
                        .footer {
                          font-size: 9px !important;
                          margin-top: 30px !important;
                        }
                      }
                    </style>
                  </head>
                  <body>
                    <!-- Header Section -->
                    <div class="header">
                      <div class="company-logo">
                        <img src="${
                          window.location.origin
                        }/assets/logo.png" alt="Plati Logo" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #34495e;">
                          PLATI
                        </div>
                      </div>
                      <div class="header-info">
                        <div class="company-name">PLATI INDIA PVT. LTD.</div>
                      </div>
                    </div>

                    <!-- Dealer Information Section -->
                    <div class="dealer-info">
                      <div class="dealer-header">
                        <div class="dealer-name">${dealerName}</div>
                      </div>

                      <div class="stats-row">
                        <div class="stat-item">
                          <div class="stat-label">Total Quantity</div>
                          <div class="stat-value">${totalQuantity}</div>
                          <div class="stat-unit">pieces</div>
                        </div>
                        <div class="stat-item">
                          <div class="stat-label">Report Date</div>
                          <div class="stat-value">${moment().format('DD')}</div>
                          <div class="stat-unit">${moment().format(
                            'MMM YYYY'
                          )}</div>
                        </div>
                      </div>
                    </div>

                    <!-- Table Section -->
                    <div class="table-wrapper">
                      <table>
                        <thead>
                            <tr>
                                <th class="sno-col">S.No</th>
                                <th class="date-col">Date</th>
                                <th class="product-col">Product Name</th>
                                <th class="qty-col">Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
            `

      if (entries.length === 0) {
        htmlContent += `
                    <tr>
                        <td colspan="4" class="no-entries">
                            No dispatch entries found for this dealer
                        </td>
                    </tr>
                `
      } else {
        entries.forEach((entry, entryIndex) => {
          const productName = entry.productName || 'N/A'
          const quantity = entry.quantity || 0
          const date = entry.dateIST
            ? moment(entry.dateIST).format('DD MMM YYYY')
            : moment(entry.date || entry.createdAt).format('DD MMM YYYY')

          htmlContent += `
                        <tr>
                            <td class="sno-col">${entryIndex + 1}</td>
                            <td class="date-col">${date}</td>
                            <td class="product-col">${productName}</td>
                            <td class="qty-col">${quantity}</td>
                        </tr>
                    `
        })
      }

      htmlContent += `
                        </tbody>
                    </table>
                    </div>
                  </body>
                </html>
            `

      // Create a temporary window to print the content
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      printWindow.document.write(htmlContent)
      printWindow.document.title = reportTitle
      printWindow.document.close()

      // Wait for the content to load, then trigger print
      printWindow.onload = () => {
        printWindow.print()
      }
    } catch (error) {
      console.error('Error exporting individual dealer PDF:', error)
      message.error(`Failed to export PDF for ${dealerGroup.dealerName}`)
    }
  }

  // Main table columns (grouped by dealer)
  const mainColumns = [
    {
      title: 'Dealer',
      dataIndex: 'dealerName',
      key: 'dealerName',
      width: 300,
      render: (text, record) => (
        <div>
          <div className='font-semibold text-foreground text-base'>{text}</div>
          <div className='text-xs text-gray-500'>ID: {record.dealerId}</div>
        </div>
      ),
      sorter: (a, b) => a.dealerName?.localeCompare(b.dealerName)
    },
    {
      title: 'Total Entries',
      dataIndex: 'entryCount',
      key: 'entryCount',
      width: 150,
      render: count => (
        <Tag
          style={{
            backgroundColor: '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #BFDBFE',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {count} {count === 1 ? 'Entry' : 'Entries'}
        </Tag>
      ),
      sorter: (a, b) => a.entryCount - b.entryCount
    },
    {
      title: 'Total Quantity',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 150,
      render: qty => (
        <div className='font-semibold text-green-600 text-base'>{qty} pcs</div>
      ),
      sorter: (a, b) => a.totalQuantity - b.totalQuantity
    }
  ]

  // Expanded row columns (individual entries)
  const expandedColumns = [
    {
      title: 'Entry ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: id => (
        <Tag color='blue' style={{ fontWeight: '600' }}>
          #{id}
        </Tag>
      )
    },
    {
      title: 'Date & Time',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      render: (date, record) => {
        const displayDate = date || record.createdAt
        return (
          <div>
            <div className='font-semibold'>
              {moment(displayDate).format('DD MMM YYYY')}
            </div>
            <div className='text-xs text-gray-500'>
              {moment(displayDate).format('hh:mm A')}
            </div>
          </div>
        )
      }
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (text, record) => (
        <div className='flex items-center gap-2'>
          <InboxOutlined style={{ color: '#6B7280' }} />
          <div>
            <div className='font-medium'>{text}</div>
            <div className='text-xs text-gray-500'>
              Type: {record.productType === 1 ? 'Alloy' : 'Tyre'}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: qty => (
        <Tag
          style={{
            backgroundColor: '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #BFDBFE',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {qty}
        </Tag>
      )
    },
    {
      title: 'In House Stock',
      dataIndex: 'inHouseStock',
      key: 'inHouseStock',
      width: 120,
      render: stock => (
        <div
          className={`font-semibold ${
            stock > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {stock || 0} pcs
        </div>
      )
    }
  ]

  // Expandable row render
  const expandedRowRender = record => {
    return (
      <Table
        columns={expandedColumns}
        dataSource={record.entries}
        rowKey='id'
        pagination={false}
        size='small'
        style={{
          backgroundColor: '#F9FAFB'
        }}
      />
    )
  }

  // Calculate statistics
  const totalDealers = groupedData.length
  const totalEntries = groupedData.reduce(
    (sum, group) => sum + group.entryCount,
    0
  )
  const totalQuantity = groupedData.reduce(
    (sum, group) => sum + group.totalQuantity,
    0
  )

  return (
    <div className='layout-container'>
      {/* Enhanced Controls Section */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #F3F4F6'
        }}
      >
        <Row gutter={[20, 16]} align='middle'>
          <Col xs={24} lg={14}>
            <div style={{ position: 'relative' }}>
              <Search
                placeholder='🔍 Search by dealer name, product, or entry ID...'
                allowClear
                enterButton={
                  <Button
                    type='primary'
                    style={{
                      backgroundColor: '#667eea',
                      borderColor: '#667eea',
                      height: '48px',
                      borderRadius: '0 8px 8px 0',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    Search
                  </Button>
                }
                size='large'
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onSearch={handleSearch}
                style={{
                  height: '48px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  border: '2px solid #E5E7EB'
                }}
                className='w-full'
              />
            </div>
          </Col>
          <Col xs={24} lg={10}>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: { xs: 'stretch', lg: 'flex-end' }
              }}
            >
              <Tooltip title='Export individual PDF files for each dealer'>
                <Button
                  type='primary'
                  icon={<FilePdfOutlined />}
                  onClick={handleExportDispatchEntries}
                  style={{
                    backgroundColor: '#DC2626',
                    borderColor: '#DC2626',
                    height: '48px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                    transition: 'all 0.3s ease',
                    flex: { xs: 1, lg: 'none' }
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow =
                      '0 6px 16px rgba(220, 38, 38, 0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(220, 38, 38, 0.3)'
                  }}
                >
                  <span style={{ display: { xs: 'none', sm: 'inline' } }}>
                    Export PDFs
                  </span>
                </Button>
              </Tooltip>
              <Tooltip title='Refresh entries list'>
                <Button
                  icon={<SyncOutlined spin={loading} />}
                  onClick={fetchTodayEntries}
                  loading={loading}
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderColor: '#D1D5DB',
                    color: '#374151',
                    height: '48px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#E5E7EB'
                    e.currentTarget.style.borderColor = '#9CA3AF'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6'
                    e.currentTarget.style.borderColor = '#D1D5DB'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <span style={{ display: { xs: 'none', sm: 'inline' } }}>
                    Refresh
                  </span>
                  <span style={{ display: { xs: 'inline', sm: 'none' } }}>
                    🔄
                  </span>
                </Button>
              </Tooltip>
            </div>
          </Col>
        </Row>

        {/* Quick Stats Bar */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #F3F4F6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981'
                }}
              />
              <Text style={{ fontSize: '13px', color: '#6B7280' }}>
                {groupedData.length} dealers with {totalEntries} entries
              </Text>
            </div>
            {groupedData.length > 0 && (
              <Text style={{ fontSize: '13px', color: '#6B7280' }}>•</Text>
            )}
            {groupedData.length > 0 && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '13px', color: '#6B7280' }}>
                  Last updated:
                </span>
                <Text
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151'
                  }}
                >
                  {moment().format('h:mm A')}
                </Text>
              </div>
            )}
          </div>
          {searchQuery && (
            <Button
              type='text'
              size='small'
              onClick={() => {
                setSearchQuery('')
                handleSearch('')
              }}
              style={{
                color: '#667eea',
                fontSize: '13px',
                height: '28px',
                padding: '0 8px'
              }}
            >
              Clear search
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Table Section */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #F3F4F6',
          overflow: 'hidden'
        }}
      >
        {/* Table Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <Title
                level={4}
                style={{
                  margin: 0,
                  color: '#1F2937',
                  fontSize: '18px',
                  fontWeight: '700'
                }}
              >
                📋 Dealer Dispatch Entries
              </Title>
              <Text
                style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginTop: '4px',
                  display: 'block'
                }}
              >
                Click on any dealer to view their detailed entries
              </Text>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#667eea'
                }}
              />
              <Text
                style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  fontWeight: '500'
                }}
              >
                {groupedData.length} dealers
              </Text>
            </div>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={mainColumns}
          dataSource={groupedData}
          rowKey='dealerId'
          loading={{
            spinning: loading,
            indicator: (
              <div
                style={{
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <SyncOutlined
                  spin
                  style={{ fontSize: '32px', color: '#667eea' }}
                />
                <Text style={{ color: '#6B7280', fontSize: '16px' }}>
                  Loading dispatch entries...
                </Text>
              </div>
            )
          }}
          expandable={{
            expandedRowRender,
            defaultExpandAllRows: false,
            expandIcon: ({ expanded, onExpand, record }) => (
              <Button
                type='text'
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  onExpand(record, e)
                }}
                style={{
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '12px',
                  height: '28px',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                icon={expanded ? '▲' : '▼'}
              >
                {expanded ? 'Hide' : 'Show'}
              </Button>
            )
          }}
          pagination={{
            defaultPageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => (
              <div
                style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  fontWeight: '500'
                }}
              >
                Showing {range[0]}-{range[1]} of {total} dealers
                <span
                  style={{
                    marginLeft: '16px',
                    fontSize: '13px',
                    color: '#9CA3AF'
                  }}
                >
                  ({totalEntries} total entries)
                </span>
              </div>
            ),
            pageSizeOptions: ['10', '15', '25', '50'],
            style: {
              margin: '16px 24px',
              paddingTop: '16px',
              borderTop: '1px solid #F3F4F6'
            }
          }}
          scroll={{ x: 1200 }}
          rowClassName={(record, index) =>
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
          style={{
            fontSize: '14px'
          }}
          components={{
            header: {
              cell: props => (
                <th
                  {...props}
                  style={{
                    ...props.style,
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '16px',
                    borderBottom: '2px solid #667eea'
                  }}
                />
              )
            }
          }}
        />

        {/* Custom CSS for table styling */}
        <style jsx>{`
          :global(.table-row-light:hover) {
            background-color: #f8faff !important;
            cursor: pointer;
          }
          :global(.table-row-dark:hover) {
            background-color: #f0f4ff !important;
            cursor: pointer;
          }
          :global(.ant-table-tbody > tr > td) {
            padding: 16px;
            border-bottom: 1px solid #f3f4f6;
            transition: all 0.2s ease;
          }
          :global(.ant-table-thead > tr > th) {
            background: linear-gradient(
              135deg,
              #667eea 0%,
              #764ba2 100%
            ) !important;
            color: white !important;
            font-weight: 700 !important;
            font-size: 13px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            padding: 16px !important;
            border-bottom: 2px solid #667eea !important;
          }
          :global(.ant-table-expanded-row) {
            background: #f8fafc !important;
          }
          :global(.ant-table-expanded-row td) {
            background: #f8fafc !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          :global(.ant-table-pagination.ant-pagination) {
            margin: 16px 24px !important;
          }
          :global(.ant-table-empty) {
            padding: 60px 20px !important;
          }
          :global(.ant-table-empty .ant-empty-description) {
            color: #6b7280 !important;
            font-size: 16px !important;
          }
        `}</style>

        {/* Empty State */}
        {!loading && groupedData.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#6B7280'
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '16px',
                opacity: 0.5
              }}
            >
              📭
            </div>
            <Title
              level={4}
              style={{
                color: '#374151',
                marginBottom: '8px'
              }}
            >
              No dispatch entries found
            </Title>
            <Text style={{ fontSize: '16px' }}>
              {searchQuery
                ? `No entries match your search "${searchQuery}"`
                : 'There are no dispatch entries awaiting approval for today.'}
            </Text>
            {searchQuery && (
              <div style={{ marginTop: '16px' }}>
                <Button
                  type='primary'
                  onClick={() => {
                    setSearchQuery('')
                    handleSearch('')
                  }}
                  style={{
                    backgroundColor: '#667eea',
                    borderColor: '#667eea'
                  }}
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DispatchEntriesPage
