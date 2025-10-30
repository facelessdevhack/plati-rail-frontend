import React, { useEffect, useState } from 'react'
import { Table, Button, Tag, message, Space, Popconfirm } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ExportOutlined
} from '@ant-design/icons'
import {
  getDispatchEntriesAPI,
  processDispatchEntryAPI,
  deleteDispatchEntryAPI
} from '../../redux/api/entriesAPI'
import { useDispatch } from 'react-redux'
import moment from 'moment'

const DispatchEntriesView = () => {
  const dispatch = useDispatch()
  const [dispatchEntries, setDispatchEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

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

    try {
      // Group entries by dealer
      const groupedByDealer = dispatchEntries.reduce((groups, entry) => {
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
            <title>Dispatch Entries - ${moment().format('DD MMM YYYY')}</title>
            <style>
              @page {
                size: A6;
                margin: 10mm;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 26px;
                margin: 0;
                padding: 8px;
                color: #000;
                width: 148mm;
                height: 105mm;
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
                margin-bottom: 15px;
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
              }
              th, td {
                border: 1px solid #ddd;
                padding: 4px 6px;
                text-align: left;
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
                width: 30%;
              }
              .product-col {
                width: 50%;
              }
              .quantity-col {
                width: 20%;
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
            <h1>Dispatch Entries Report - ${moment().format('DD MMM YYYY')}</h1>
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
                    </tr>
                  </thead>
                  <tbody>
        `

        if (groupedByDealer[dealerName].length === 0) {
          htmlContent += `
                    <tr>
                      <td colspan="3" class="no-entries">No entries found</td>
                    </tr>
          `
        } else {
          groupedByDealer[dealerName].forEach(entry => {
            const formattedDate = moment(entry.date).format('DD MMM YYYY HH:mm')
            const product = entry.productName || 'N/A'
            const quantity = entry.quantity || 0

            htmlContent += `
                      <tr>
                        <td>${formattedDate}</td>
                        <td>${product}</td>
                        <td>${quantity}</td>
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
      printWindow.document.title = `Dispatch Entries - ${moment().format(
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
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: date => moment(date).format('DD MMM YYYY HH:mm')
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
      title: 'Status',
      dataIndex: 'dispatchStatus',
      key: 'dispatchStatus',
      width: 150,
      render: status => (
        <Tag icon={<ClockCircleOutlined />} color='processing'>
          {status === 'awaiting_approval' ? 'Awaiting Approval' : status}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type='primary'
            size='small'
            icon={<CheckCircleOutlined />}
            loading={processingId === record.id}
            onClick={() => handleProcessEntry(record.id)}
          >
            Dispatch
          </Button>
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
  ]

  return (
    <div className='p-6'>
      <div className='mb-6 flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold'>📦 Dispatch Entries</h2>
          <p className='text-gray-600 mt-1'>
            Entries with stock available, awaiting sales coordinator approval
          </p>
        </div>
        <Space>
          <Button
            type='primary'
            icon={<ExportOutlined />}
            onClick={handleExportDispatchEntries}
            disabled={dispatchEntries.length === 0}
          >
            Export
          </Button>
          <Button onClick={fetchDispatchEntries} loading={loading}>
            Refresh
          </Button>
          <Tag color='blue' style={{ fontSize: '14px', padding: '4px 12px' }}>
            {dispatchEntries.length} Awaiting
          </Tag>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={dispatchEntries}
        rowKey='id'
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: total => `Total ${total} entries`
        }}
      />

      <div className='mt-4 p-4 bg-blue-50 rounded-lg'>
        <h3 className='font-semibold mb-2'>📌 Information</h3>
        <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'>
          <li>
            These entries have stock available and are awaiting your approval
          </li>
          <li>Stock has already been reserved for these entries</li>
          <li>
            Click "Dispatch" to approve and move the entry to entry_master
          </li>
          <li>Once dispatched, the entry will be finalized in the system</li>
        </ul>
      </div>
    </div>
  )
}

export default DispatchEntriesView
