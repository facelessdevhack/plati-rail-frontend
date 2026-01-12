import React, { useEffect, useState, useMemo } from 'react'
import { Table, Button, Tag, message, Space, Popconfirm, Tabs, Badge, Steps, Card, Alert, DatePicker } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SendOutlined,
  PrinterOutlined,
  CarOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import {
  getDispatchEntriesAPI,
  sendForDispatchAPI,
  processDispatchEntryAPI,
  deleteDispatchEntryAPI,
  getDailyEntry
} from '../../redux/api/entriesAPI'
import { useDispatch } from 'react-redux'
import moment from 'moment'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

const DispatchEntriesView = () => {
  const dispatch = useDispatch()
  const [dispatchEntries, setDispatchEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [sendingId, setSendingId] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [activeTab, setActiveTab] = useState('awaiting_approval')
  const [selectedDate, setSelectedDate] = useState(dayjs())

  // Filter entries based on active tab and selected date
  // - 'awaiting_approval': filter by dateIST (entry creation date)
  // - 'sent_for_dispatch': show ALL entries regardless of date (pending backlog)
  // - 'approved' (dispatched): filter by processedAt (when item was dispatched)
  const filteredEntries = useMemo(() => {
    const selectedDateStr = selectedDate ? selectedDate.format('YYYY-MM-DD') : null

    return dispatchEntries.filter(entry => {
      // Filter by status (tab)
      const matchesStatus = entry.dispatchStatus === activeTab

      // Sent for dispatch - show ALL entries regardless of date (pending backlog)
      if (activeTab === 'sent_for_dispatch') {
        return matchesStatus
      }

      // Filter by date if selected
      if (selectedDateStr) {
        // For dispatched entries, use processedAt (when item was dispatched)
        if (activeTab === 'approved' && entry.processedAt) {
          const processedDate = moment(entry.processedAt).format('YYYY-MM-DD')
          return matchesStatus && processedDate === selectedDateStr
        }
        // For awaiting_approval, use dateIST (entry creation date)
        if (entry.dateIST) {
          const entryDate = moment(entry.dateIST).format('YYYY-MM-DD')
          return matchesStatus && entryDate === selectedDateStr
        }
      }

      return matchesStatus
    })
  }, [dispatchEntries, activeTab, selectedDate])

  // Count entries by status (filtered by selected date where applicable)
  // - awaiting_approval: filter by dateIST
  // - sent_for_dispatch: NO date filter (show total backlog count)
  // - approved: filter by processedAt
  const statusCounts = useMemo(() => {
    const selectedDateStr = selectedDate ? selectedDate.format('YYYY-MM-DD') : null

    const filterByDateIST = (entries) => {
      if (!selectedDateStr) return entries
      return entries.filter(e => {
        if (e.dateIST) {
          const entryDate = moment(e.dateIST).format('YYYY-MM-DD')
          return entryDate === selectedDateStr
        }
        return false
      })
    }

    const filterByProcessedAt = (entries) => {
      if (!selectedDateStr) return entries
      return entries.filter(e => {
        if (e.processedAt) {
          const processedDate = moment(e.processedAt).format('YYYY-MM-DD')
          return processedDate === selectedDateStr
        }
        return false
      })
    }

    const awaitingApproval = dispatchEntries.filter(e => e.dispatchStatus === 'awaiting_approval')
    const sentForDispatch = dispatchEntries.filter(e => e.dispatchStatus === 'sent_for_dispatch')
    const approved = dispatchEntries.filter(e => e.dispatchStatus === 'approved')

    return {
      awaiting_approval: filterByDateIST(awaitingApproval).length,
      sent_for_dispatch: sentForDispatch.length,  // Show total count (no date filter - pending backlog)
      approved: filterByProcessedAt(approved).length  // Use processedAt for dispatched entries
    }
  }, [dispatchEntries, selectedDate])

  useEffect(() => {
    fetchDispatchEntries()
  }, [])

  const fetchDispatchEntries = async () => {
    setLoading(true)
    try {
      const response = await dispatch(getDispatchEntriesAPI()).unwrap()
      setDispatchEntries(response.dispatchEntries || [])
    } catch (error) {
      console.error('Error fetching dispatch entries:', error)
      message.error('Failed to load dispatch entries')
    } finally {
      setLoading(false)
    }
  }

  const handleSendForDispatch = async entryId => {
    setSendingId(entryId)
    try {
      const response = await sendForDispatchAPI({
        dispatchEntryId: entryId
      })
      if (response.status === 200) {
        message.success('Entry sent for dispatch!')
        fetchDispatchEntries() // Refresh the list
      } else {
        message.error(response.data?.message || 'Failed to send for dispatch')
      }
    } catch (error) {
      console.error('Error sending for dispatch:', error)
      message.error('Error sending for dispatch')
    } finally {
      setSendingId(null)
    }
  }

  const handleProcessEntry = async entryId => {
    setProcessingId(entryId)
    try {
      const response = await processDispatchEntryAPI({
        dispatchEntryId: entryId
      })
      if (response.status === 200) {
        message.success('Entry dispatched successfully!')
        fetchDispatchEntries() // Refresh the list
      } else {
        message.error(response.data?.message || 'Failed to process entry')
      }
    } catch (error) {
      console.error('Error processing dispatch entry:', error)
      message.error('Error processing dispatch entry')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteEntry = async entryId => {
    setDeletingId(entryId)
    try {
      const response = await deleteDispatchEntryAPI({
        dispatchEntryId: entryId
      })
      if (response.status === 200) {
        message.success('Entry deleted and stock restored!')
        fetchDispatchEntries() // Refresh the list
      } else {
        message.error(response.data?.message || 'Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting dispatch entry:', error)
      message.error('Error deleting dispatch entry')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportDispatchEntries = () => {
    if (dispatchEntries.length === 0) {
      message.warning('No dispatch entries to export')
      return
    }

    exportToPDF(dispatchEntries, 'Dispatch Entries Report')
  }

  const handleExportTodayEntries = () => {
    const targetDate = selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    const displayDate = selectedDate ? selectedDate.format('DD MMM YYYY') : dayjs().format('DD MMM YYYY')

    // Filter entries for selected date (using IST) and only awaiting_approval status
    const dateEntries = dispatchEntries.filter(entry => {
      // Use IST date from backend if available, otherwise convert to IST
      const entryDate = entry.dateIST ? moment(entry.dateIST) : moment.utc(entry.date || entry.created_at)
      const matchesDate = entryDate.format('YYYY-MM-DD') === targetDate
      const isAwaitingApproval = entry.dispatchStatus === 'awaiting_approval'
      return matchesDate && isAwaitingApproval
    })

    if (dateEntries.length === 0) {
      message.warning(`No awaiting approval entries found for ${displayDate}`)
      return
    }

    exportToPDF(dateEntries, `Dispatch Entries - ${displayDate}`)
  }

  const handleExportExcelDispatchEntries = () => {
    if (dispatchEntries.length === 0) {
      message.warning('No dispatch entries to export')
      return
    }

    exportToExcel(dispatchEntries, 'Dispatch Entries Report')
  }

  const handleExportExcelTodayEntries = () => {
    const targetDate = selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    const displayDate = selectedDate ? selectedDate.format('DD MMM YYYY') : dayjs().format('DD MMM YYYY')

    // Filter entries for selected date (using IST) and only awaiting_approval status
    const dateEntries = dispatchEntries.filter(entry => {
      // Use IST date from backend if available, otherwise convert to IST
      const entryDate = entry.dateIST ? moment(entry.dateIST) : moment.utc(entry.date || entry.created_at)
      const matchesDate = entryDate.format('YYYY-MM-DD') === targetDate
      const isAwaitingApproval = entry.dispatchStatus === 'awaiting_approval'
      return matchesDate && isAwaitingApproval
    })

    if (dateEntries.length === 0) {
      message.warning(`No awaiting approval entries found for ${displayDate}`)
      return
    }

    exportToExcel(dateEntries, `Dispatch Entries - ${displayDate}`)
  }

  const handleExportDealerWiseExcel = async () => {
    try {
      message.loading({ content: 'Fetching today\'s processed entries...', key: 'dealerExport' })

      // Fetch today's processed entries from entry_master
      const response = await dispatch(getDailyEntry({})).unwrap()
      const processedEntries = response.data || []

      if (processedEntries.length === 0) {
        message.warning({ content: 'No processed entries found for today', key: 'dealerExport' })
        return
      }

      message.loading({ content: 'Generating dealer-wise Excel...', key: 'dealerExport' })
      exportDealerWiseToExcel(processedEntries, `Today's Processed Entries`)
      message.success({ content: 'Export completed!', key: 'dealerExport' })
    } catch (error) {
      console.error('Error fetching processed entries:', error)
      message.error({ content: 'Failed to fetch processed entries', key: 'dealerExport' })
    }
  }

  const handleExportDealerWisePDFs = async () => {
    try {
      const dateStr = selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
      message.loading({ content: `Generating dealer-wise PDFs for ${selectedDate.format('DD MMM YYYY')}...`, key: 'dealerPdfExport' })

      // Download ZIP file from backend API with date parameter
      const response = await fetch(`${process.env.REACT_APP_API_URL}/export/dispatch-approved-entries?date=${dateStr}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        // Try to parse error message from JSON response
        let errorMessage = 'Failed to export PDFs'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          // Response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Check content type - be lenient as proxies may modify headers
      const contentType = response.headers.get('content-type') || ''
      console.log('Response Content-Type:', contentType)

      // Create blob and download
      const blob = await response.blob()

      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dispatch-approved-${dateStr}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.success({ content: 'PDFs downloaded successfully!', key: 'dealerPdfExport' })
    } catch (error) {
      console.error('Error exporting dealer-wise PDFs:', error)
      message.error({ content: error.message || 'Failed to export dealer-wise PDFs', key: 'dealerPdfExport' })
    }
  }

  const exportToPDF = (entries, reportTitle) => {
    try {
      // Group entries by dealer
      const groupedByDealer = entries.reduce((groups, entry) => {
        const dealerName = entry.dealerName || 'Unknown Dealer'
        if (!groups[dealerName]) {
          groups[dealerName] = []
        }
        groups[dealerName].push(entry)
        return groups
      }, {})

      // Create HTML content for PDF with proper tables
      let htmlContent = `
        <html>
          <head>
            <title>${reportTitle} - ${moment().format('DD MMM YYYY')}</title>
            <style>
              @page {
                size: A4;
                margin: 10mm;
                orientation: portrait;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 26px;
                margin: 0;
                padding: 8px;
                color: #000;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
              }
              h1 {
                text-align: center;
                margin-bottom: 12px;
                font-size: 26px;
                color: #333;
                font-weight: bold;
              }
              .dealer-section {
                margin-bottom: 20px;
                page-break-inside: avoid;
              }
              .dealer-title {
                font-weight: bold;
                font-size: 22px;
                margin-bottom: 8px;
                text-align: center;
                background-color: #f5f5f5;
                padding: 6px;
                border: 1px solid #ddd;
                border-radius: 6px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 12px;
                font-size: 18px;
                table-layout: fixed;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 4px 6px;
                text-align: left;
                word-wrap: break-word;
              }
              th {
                background-color: #f8f9fa;
                font-weight: bold;
                color: #333;
                font-size: 16px;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .date-col {
                width: 20%;
              }
              .product-col {
                width: 45%;
              }
              .quantity-col {
                width: 15%;
                text-align: center;
                font-weight: bold;
              }
              .stock-col {
                width: 15%;
                text-align: center;
                font-weight: bold;
              }
              .transport-col {
                width: 5%;
                text-align: center;
                font-weight: bold;
              }
              .no-entries {
                text-align: center;
                font-style: italic;
                color: #666;
                padding: 5px;
              }
              @media print {
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                body {
                  font-size: 16px !important;
                  line-height: 1.4 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                h1 {
                  font-size: 21px !important;
                  margin-bottom: 10px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .dealer-title {
                  font-size: 18px !important;
                  padding: 8px !important;
                  margin-bottom: 8px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                th, td {
                  padding: 6px 8px !important;
                  font-size: 13px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                th {
                  font-size: 13px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .dealer-section {
                  margin-bottom: 12px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            </style>
          </head>
          <body>
            <h1>${reportTitle} - ${moment().format('DD MMM YYYY')}</h1>
      `

      Object.keys(groupedByDealer).forEach(dealerName => {
        htmlContent += `
              <div class="dealer-section">
                <div class="dealer-title">${dealerName}</div>
                <table>
                  <thead>
                    <tr>
                      <th class="date-col">Date</th>
                      <th class="product-col">Product</th>
                      <th class="quantity-col">Quantity</th>
                      <th class="transport-col"></th>
                    </tr>
                  </thead>
                  <tbody>
        `

        if (groupedByDealer[dealerName].length === 0) {
          htmlContent += `
                    <tr>
                      <td colspan="6" class="no-entries">No entries found</td>
                    </tr>
          `
        } else {
          groupedByDealer[dealerName].forEach(entry => {
            // Use IST date from backend if available, otherwise convert to IST
            const formattedDate = entry.dateIST
              ? moment(entry.dateIST).format('DD MMM YYYY HH:mm')
              : (entry.date ? moment.utc(entry.date).format('DD MMM YYYY HH:mm') : 'N/A')
            const product = entry.productName || 'N/A'
            const quantity = entry.quantity || 0
            const transportPaid = entry.isTransportPaid ? 'Paid' : 'To Pay'

            htmlContent += `
                      <tr>
                        <td>${formattedDate}</td>
                        <td>${product}</td>
                        <td>${quantity}</td>
                        <td style="color: ${
                          entry.isTransportPaid ? '#52c41a' : '#ff4d4f'
                        }; font-weight: bold;">${transportPaid}</td>
                      </tr>
            `
          })
        }

        htmlContent += `
                  </tbody>
                </table>
              </div>
        `
      })

      htmlContent += `
          </body>
        </html>
      `

      // Create a temporary iframe to print the content
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      printWindow.document.write(htmlContent)
      printWindow.document.title = `${reportTitle} - ${moment().format(
        'DD MMM YYYY'
      )}`
      printWindow.document.close()

      // Wait for the content to load, then trigger print
      printWindow.onload = () => {
        printWindow.print()
      }

      message.success(
        'PDF export dialog opened. Please choose "Save as PDF" in the print dialog.'
      )
    } catch (error) {
      console.error('Error exporting dispatch entries to PDF:', error)
      message.error('Failed to export dispatch entries to PDF')
    }
  }

  const exportToExcel = (entries, reportTitle) => {
    try {
      // Sort entries by date (newest first)
      const sortedEntries = [...entries].sort((a, b) => {
        const aDate = a.dateIST ? moment(a.dateIST) : moment.utc(a.date || a.created_at)
        const bDate = b.dateIST ? moment(b.dateIST) : moment.utc(b.date || b.created_at)
        return bDate.valueOf() - aDate.valueOf()
      })

      // Prepare data for Excel
      const excelData = sortedEntries.map((entry, index) => {
        const entryDate = entry.dateIST
          ? moment(entry.dateIST).format('DD MMM YYYY hh:mm A')
          : (entry.date ? moment.utc(entry.date).format('DD MMM YYYY hh:mm A') : 'N/A')

        return {
          'S.No': index + 1,
          'Entry ID': entry.id,
          'Date': entryDate,
          'Dealer': entry.dealerName || 'N/A',
          'Product': entry.productName || 'N/A',
          'Quantity': entry.quantity || 0,
          'Price': `₹${(entry.price || 0).toFixed(2)}`,
          'Total Price': `₹${((entry.price || 0) * (entry.quantity || 0)).toFixed(2)}`,
          'Transport': entry.isTransportPaid ? 'Paid' : 'To Pay',
          'Claim': entry.isClaim ? 'Yes' : 'No',
          'Status': 'Awaiting Approval'
        }
      })

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const colWidths = [
        { wch: 8 },   // S.No
        { wch: 12 },  // Entry ID
        { wch: 20 },  // Date
        { wch: 25 },  // Dealer
        { wch: 30 },  // Product
        { wch: 10 },  // Quantity
        { wch: 12 },  // Price
        { wch: 15 },  // Total Price
        { wch: 12 },  // Transport
        { wch: 8 },   // Claim
        { wch: 15 }   // Status
      ]
      ws['!cols'] = colWidths

      // Create workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Dispatch Entries')

      // Generate filename with date
      const fileName = `${reportTitle.replace(/\s+/g, '_')}_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`

      // Download the file
      XLSX.writeFile(wb, fileName)

      message.success(`Excel exported successfully: ${fileName}`)
    } catch (error) {
      console.error('Error exporting dispatch entries to Excel:', error)
      message.error('Failed to export dispatch entries to Excel')
    }
  }

  const exportDealerWiseToExcel = (entries, reportTitle) => {
    try {
      // Helper to get dealer name (handles both camelCase and snake_case)
      const getDealerName = (entry) => entry.dealerName || entry.dealer_name || 'Unknown Dealer'
      // Helper to get product name
      const getProductName = (entry) => entry.productName || entry.product_name || 'N/A'
      // Helper to get transport status (dispatch_entries uses isTransportPaid, entry_master uses isTransport)
      const getTransportStatus = (entry) => {
        if (entry.isTransportPaid !== undefined) return entry.isTransportPaid ? 'Paid' : 'To Pay'
        if (entry.isTransport !== undefined) return entry.isTransport === 1 ? 'Paid' : 'To Pay'
        return 'N/A'
      }
      // Helper to get date
      const getFormattedDate = (entry) => {
        if (entry.dateIST) return moment(entry.dateIST).format('DD MMM YYYY HH:mm')
        if (entry.date) return moment(entry.date).format('DD MMM YYYY HH:mm')
        if (entry.createdAt) return moment(entry.createdAt).format('DD MMM YYYY HH:mm')
        if (entry.created_at) return moment(entry.created_at).format('DD MMM YYYY HH:mm')
        return 'N/A'
      }

      // Group entries by dealer (same grouping as PDF export)
      const groupedByDealer = entries.reduce((groups, entry) => {
        const dealerName = getDealerName(entry)
        if (!groups[dealerName]) {
          groups[dealerName] = []
        }
        groups[dealerName].push(entry)
        return groups
      }, {})

      // Sort dealer names alphabetically
      const sortedDealerNames = Object.keys(groupedByDealer).sort()

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Create a summary sheet with all dealers
      const summaryData = []
      let serialNo = 1

      sortedDealerNames.forEach(dealerName => {
        const dealerEntries = groupedByDealer[dealerName]

        // Add dealer header row
        summaryData.push({
          'S.No': '',
          'Date': dealerName,
          'Product': '',
          'Quantity': '',
          'Transport': ''
        })

        // Add entries for this dealer
        dealerEntries.forEach(entry => {
          summaryData.push({
            'S.No': serialNo++,
            'Date': getFormattedDate(entry),
            'Product': getProductName(entry),
            'Quantity': entry.quantity || 0,
            'Transport': getTransportStatus(entry)
          })
        })

        // Add dealer total row
        const totalQuantity = dealerEntries.reduce((sum, e) => sum + (e.quantity || 0), 0)
        summaryData.push({
          'S.No': '',
          'Date': '',
          'Product': `Total for ${dealerName}`,
          'Quantity': totalQuantity,
          'Transport': ''
        })

        // Add empty row for spacing between dealers
        summaryData.push({
          'S.No': '',
          'Date': '',
          'Product': '',
          'Quantity': '',
          'Transport': ''
        })
      })

      // Create summary worksheet
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)

      // Set column widths for summary sheet
      summaryWs['!cols'] = [
        { wch: 8 },   // S.No
        { wch: 25 },  // Date / Dealer Name
        { wch: 40 },  // Product
        { wch: 12 },  // Quantity
        { wch: 12 }   // Transport
      ]

      XLSX.utils.book_append_sheet(wb, summaryWs, 'All Dealers')

      // Create individual sheets for each dealer
      sortedDealerNames.forEach(dealerName => {
        const dealerEntries = groupedByDealer[dealerName]

        // Prepare data for dealer sheet (matching PDF format)
        const dealerData = dealerEntries.map((entry, index) => {
          return {
            'S.No': index + 1,
            'Date': getFormattedDate(entry),
            'Product': getProductName(entry),
            'Quantity': entry.quantity || 0,
            'Transport': getTransportStatus(entry)
          }
        })

        // Add total row
        const totalQuantity = dealerEntries.reduce((sum, e) => sum + (e.quantity || 0), 0)
        dealerData.push({
          'S.No': '',
          'Date': '',
          'Product': 'TOTAL',
          'Quantity': totalQuantity,
          'Transport': ''
        })

        // Create worksheet for this dealer
        const dealerWs = XLSX.utils.json_to_sheet(dealerData)

        // Set column widths
        dealerWs['!cols'] = [
          { wch: 8 },   // S.No
          { wch: 22 },  // Date
          { wch: 40 },  // Product
          { wch: 12 },  // Quantity
          { wch: 12 }   // Transport
        ]

        // Truncate sheet name to max 31 characters (Excel limit)
        const sheetName = dealerName.length > 31 ? dealerName.substring(0, 28) + '...' : dealerName
        XLSX.utils.book_append_sheet(wb, dealerWs, sheetName)
      })

      // Generate filename with date
      const fileName = `${reportTitle.replace(/\s+/g, '_')}_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`

      // Download the file
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Error exporting dealer-wise entries to Excel:', error)
      message.error('Failed to export dealer-wise entries to Excel')
    }
  }

  const columns = [
    {
      title: 'Entry ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left'
    },
    {
      title: 'Date',
      dataIndex: 'dateIST',
      key: 'dateIST',
      width: 150,
      render: (date, record) => {
        if (!date) return 'N/A'
        // Use IST date from backend if available, otherwise convert to IST
        const istDate = moment(date).format('DD MMM YYYY HH:mm')
        return istDate
      }
    },
    {
      title: 'Dealer',
      dataIndex: 'dealerName',
      key: 'dealerName',
      width: 200
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: 250
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center'
    },
    {
      title: 'Transport Paid',
      dataIndex: 'isTransportPaid',
      key: 'isTransportPaid',
      width: 120,
      align: 'center',
      render: isTransportPaid => {
        return (
          <span
            style={{
              color: isTransportPaid ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold'
            }}
          >
            {isTransportPaid ? 'Paid' : 'To Pay'}
          </span>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'dispatchStatus',
      key: 'dispatchStatus',
      width: 150,
      render: status => {
        if (status === 'approved') {
          return (
            <Tag icon={<CheckCircleOutlined />} color='success'>
              Approved
            </Tag>
          )
        }
        if (status === 'sent_for_dispatch') {
          return (
            <Tag icon={<SendOutlined />} color='blue'>
              Sent for Dispatch
            </Tag>
          )
        }
        return (
          <Tag icon={<ClockCircleOutlined />} color='warning'>
            Awaiting Approval
          </Tag>
        )
      }
    },
    // Only show Processed At column for dispatched entries
    ...(activeTab === 'approved' ? [{
      title: 'Dispatched At',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 160,
      render: (processedAt) => {
        if (!processedAt) return 'N/A'
        return moment(processedAt).format('DD MMM YYYY HH:mm')
      }
    }] : []),
    {
      title: 'Action',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_, record) => {
        // Approved entries - no actions available
        if (record.dispatchStatus === 'approved') {
          return (
            <Tag color='success'>Completed</Tag>
          )
        }

        return (
          <Space>
            {record.dispatchStatus === 'awaiting_approval' ? (
              <Button
                type='default'
                size='small'
                icon={<SendOutlined />}
                loading={sendingId === record.id}
                onClick={() => handleSendForDispatch(record.id)}
              >
                Send for Dispatch
              </Button>
            ) : (
              <Button
                type='primary'
                size='small'
                icon={<CheckCircleOutlined />}
                loading={processingId === record.id}
                onClick={() => handleProcessEntry(record.id)}
              >
                Item Dispatched
              </Button>
            )}
            <Popconfirm
              title='Delete this entry?'
              description='Stock will be restored. This action cannot be undone.'
              onConfirm={() => handleDeleteEntry(record.id)}
              okText='Yes, Delete'
              cancelText='Cancel'
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                size='small'
                icon={<DeleteOutlined />}
                loading={deletingId === record.id}
              >
                Delete
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  // Get current step based on active tab
  const getCurrentStep = () => {
    if (activeTab === 'awaiting_approval') return 0
    if (activeTab === 'sent_for_dispatch') return 1
    return 2
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold'>📦 Dispatch Entries</h2>
          <p className='text-gray-600 mt-1'>
            Manage dispatch workflow - approve, send for dispatch, and track entries
          </p>
        </div>
        <Space>
          <DatePicker
            value={selectedDate}
            onChange={(date) => setSelectedDate(date || dayjs())}
            format="DD MMM YYYY"
            allowClear={false}
            style={{ width: 150 }}
          />
          <Button onClick={fetchDispatchEntries} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Workflow Steps Banner */}
      <Card className='mb-6' styles={{ body: { padding: '16px 24px' } }}>
        <Steps
          current={getCurrentStep()}
          size='small'
          items={[
            {
              title: 'Step 1: Export & Print',
              description: "Export today's entries and print",
              icon: <PrinterOutlined />
            },
            {
              title: 'Step 2: Send for Dispatch',
              description: 'Mark printed entries as sent',
              icon: <CarOutlined />
            },
            {
              title: 'Step 3: Item Dispatched',
              description: 'Confirm physical dispatch & export',
              icon: <DownloadOutlined />
            }
          ]}
        />
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'awaiting_approval',
            label: (
              <span>
                <ClockCircleOutlined /> Step 1: Awaiting Approval{' '}
                <Badge count={statusCounts.awaiting_approval} overflowCount={9999} style={{ backgroundColor: '#faad14' }} />
              </span>
            )
          },
          {
            key: 'sent_for_dispatch',
            label: (
              <span>
                <SendOutlined /> Step 2: Sent for Dispatch{' '}
                <Badge count={statusCounts.sent_for_dispatch} overflowCount={9999} style={{ backgroundColor: '#1890ff' }} />
              </span>
            )
          },
          {
            key: 'approved',
            label: (
              <span>
                <CheckCircleOutlined /> Step 3: Dispatched{' '}
                <Badge count={statusCounts.approved} overflowCount={9999} style={{ backgroundColor: '#52c41a' }} />
              </span>
            )
          }
        ]}
      />

      {/* Tab-specific action bar and helper */}
      {activeTab === 'awaiting_approval' && (
        <Alert
          type='info'
          showIcon
          icon={<PrinterOutlined />}
          message={`Export & Print Entries for ${selectedDate.format('DD MMM YYYY')}`}
          description={
            <div className='flex items-center justify-between'>
              <span>Export entries to print and send to the dispatch department. After printing, click "Send for Dispatch" on each entry.</span>
              <Space className='ml-4'>
                <Button
                  type='primary'
                  icon={<ExportOutlined />}
                  onClick={handleExportTodayEntries}
                >
                  Export (PDF)
                </Button>
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={handleExportExcelTodayEntries}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                >
                  Export (Excel)
                </Button>
              </Space>
            </div>
          }
          className='mb-4'
        />
      )}

      {activeTab === 'sent_for_dispatch' && (
        <Alert
          type='warning'
          showIcon
          icon={<CarOutlined />}
          message='Awaiting Physical Dispatch'
          description='These entries have been sent to dispatch. Once the items are physically dispatched, click "Item Dispatched" to complete the process.'
          className='mb-4'
        />
      )}

      {activeTab === 'approved' && (
        <Alert
          type='success'
          showIcon
          icon={<CheckCircleOutlined />}
          message='Dispatch Completed - Export Dealer-wise PDFs'
          description={
            <div className='flex items-center justify-between'>
              <span>These entries have been dispatched. Export dealer-wise PDFs to send invoices/delivery notes to dealers.</span>
              <Space className='ml-4'>
                <Button
                  type='primary'
                  icon={<FilePdfOutlined />}
                  onClick={handleExportDealerWisePDFs}
                  style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                >
                  Dealer Wise (PDFs)
                </Button>
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={handleExportDealerWiseExcel}
                  style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}
                >
                  Dealer Wise (Excel)
                </Button>
              </Space>
            </div>
          }
          className='mb-4'
        />
      )}

      <Table
        columns={columns}
        dataSource={filteredEntries}
        rowKey='id'
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: total => `Total ${total} entries`
        }}
      />

      {activeTab === 'awaiting_approval' && (
        <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <h3 className='font-semibold mb-2'>📌 Step 1: Export & Print</h3>
          <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'>
            <li>Click <strong>"Export Today (PDF)"</strong> to generate a printable list</li>
            <li>Print the document and send it to the dispatch department</li>
            <li>After printing, click <strong>"Send for Dispatch"</strong> on each entry to move it to Step 2</li>
            <li>Stock has already been reserved for these entries</li>
          </ul>
        </div>
      )}

      {activeTab === 'sent_for_dispatch' && (
        <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <h3 className='font-semibold mb-2'>📌 Step 2: Awaiting Physical Dispatch</h3>
          <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'>
            <li>These entries have been printed and sent to the dispatch team</li>
            <li>Wait for physical items to be dispatched from the warehouse</li>
            <li>Once dispatched, click <strong>"Item Dispatched"</strong> to confirm and complete the entry</li>
            <li>Entry will then move to the "Dispatched" tab</li>
          </ul>
        </div>
      )}

      {activeTab === 'approved' && (
        <div className='mt-4 p-4 bg-green-50 border border-green-200 rounded-lg'>
          <h3 className='font-semibold mb-2'>📌 Step 3: Dispatch Completed</h3>
          <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'>
            <li>These entries have been physically dispatched</li>
            <li>Click <strong>"Dealer Wise (PDFs)"</strong> to download individual PDFs for each dealer</li>
            <li>Send these PDFs as invoices/delivery notes to the respective dealers</li>
            <li>Entries are finalized in the system - stock has been deducted</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default DispatchEntriesView
