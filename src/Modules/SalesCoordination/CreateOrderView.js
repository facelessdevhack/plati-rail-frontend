import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getDealersDropdown, getAllProducts } from '../../redux/api/stockAPI'
import { setEntry, resetEntry } from '../../redux/slices/entry.slice'
import {
  addCoordinatedEntryAPI,
  getAllCoordinationEntriesAPI,
  deletePendingEntryAPI,
  deleteDispatchEntryAPI
} from '../../redux/api/entriesAPI'
import moment from 'moment'
import {
  Radio,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Table,
  Tag,
  Popconfirm,
  message,
  Pagination
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
  PlusOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'

const ORDER_TYPES = [
  { value: 1, label: 'Alloy Wheels' }
  // { value: 2, label: 'Tyres' },
  // { value: 3, label: 'Caps' },
  // { value: 4, label: 'PPF' },
  // { value: 5, label: 'Charges' },
]

const CreateOrderView = () => {
  const dispatch = useDispatch()
  const { entry } = useSelector(state => state.entryDetails)
  const { dealersDropdown, allProducts } = useSelector(
    state => state.stockDetails
  )

  const [orderType, setOrderType] = useState(1)
  const [coordinationEntries, setCoordinationEntries] = useState([])
  const [deletingId, setDeletingId] = useState(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [reloadAPI, setReloadAPI] = useState(false)
  const [transportPaid, setTransportPaid] = useState(false)
  const [transportAmount, setTransportAmount] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Filter today's entries for selected order type
  const allEntries = useMemo(() => {
    const today = moment().format('YYYY-MM-DD')
    return coordinationEntries.filter(e => {
      const entryDate = e.dateIST
        ? moment(e.dateIST)
        : moment.utc(e.date || e.created_at)
      return entryDate.format('YYYY-MM-DD') === today
    })
  }, [coordinationEntries])

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return allEntries.slice(start, start + pageSize)
  }, [allEntries, currentPage])

  const getAndSetTodayDate = useCallback(() => {
    const dateToSet = moment().format('YYYY-MM-DD HH:mm:ss')
    dispatch(setEntry({ ...entry, date: dateToSet }))
  }, [dispatch])

  const fetchCoordinationEntries = useCallback(async () => {
    try {
      const response = await dispatch(getAllCoordinationEntriesAPI()).unwrap()
      const filtered =
        response.entries?.filter(e => e.productType === orderType) || []
      setCoordinationEntries(filtered)
    } catch (error) {
      console.error('Error fetching coordination entries:', error)
    }
  }, [dispatch, orderType])

  useEffect(() => {
    dispatch(getDealersDropdown({}))
    dispatch(getAllProducts({ type: orderType }))
    fetchCoordinationEntries()
    getAndSetTodayDate()
  }, [orderType])

  useEffect(() => {
    fetchCoordinationEntries()
  }, [reloadAPI])

  const handleOrderTypeChange = e => {
    setOrderType(e.target.value)
    dispatch(resetEntry())
    setTransportPaid(false)
    setTransportAmount('')
    setSpecialInstructions('')
    setCurrentPage(1)
    setTimeout(() => getAndSetTodayDate(), 0)
  }

  const handleCreateOrder = async () => {
    if (!entry.dealerId || !entry.dealerName) {
      message.error('Please select a dealer before submitting.')
      return
    }
    if (!entry.productId || !entry.productName) {
      message.error('Please select a product before submitting.')
      return
    }
    if (!entry.quantity) {
      message.error('Please enter a quantity before submitting.')
      return
    }

    setIsCreatingOrder(true)
    try {
      const payload = {
        ...entry,
        productType: orderType,
        isTransportPaid: transportPaid,
        transportAmount: transportPaid ? parseFloat(transportAmount) || 0 : 0,
        specialInstructions: specialInstructions || null
      }
      const addEntryResponse = await addCoordinatedEntryAPI(payload)
      if (addEntryResponse.status === 200) {
        const responseData = addEntryResponse.data
        if (responseData.routedTo === 'dispatch_entries') {
          message.success(
            'Order created! Stock available — sent to dispatch queue.'
          )
        } else if (responseData.routedTo === 'currently_inprod_master') {
          message.info('Order created! Product is currently in production.')
        } else if (responseData.routedTo === 'pending_entry_master') {
          message.warning('Order pending — product is out of stock.')
        } else {
          message.success('Order created successfully!')
        }
        dispatch(resetEntry())
        setTransportPaid(false)
        setTransportAmount('')
        setSpecialInstructions('')
        getAndSetTodayDate()
        setReloadAPI(prev => !prev)
      }
    } catch (error) {
      console.error(error)
      message.error('Error creating order. Please try again.')
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const handleReset = () => {
    dispatch(resetEntry())
    setTransportPaid(false)
    setTransportAmount('')
    setSpecialInstructions('')
    getAndSetTodayDate()
  }

  const handleDeleteEntry = async record => {
    setDeletingId(record.id)
    try {
      let response
      if (record.entryStatus === 'pending') {
        response = await deletePendingEntryAPI({ pendingEntryId: record.id })
      } else if (record.entryStatus === 'dispatch') {
        response = await deleteDispatchEntryAPI({ dispatchEntryId: record.id })
      } else if (record.entryStatus === 'in_production') {
        message.warning('Cannot delete entries in production.')
        setDeletingId(null)
        return
      } else {
        message.error('Unknown entry type.')
        setDeletingId(null)
        return
      }
      if (response.status === 200) {
        message.success('Entry deleted successfully!')
        setReloadAPI(prev => !prev)
      } else {
        message.error(response.data?.message || 'Failed to delete entry')
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete entry')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportTodayOrders = () => {
    if (allEntries.length === 0) {
      message.warning('No orders to export')
      return
    }
    const typeLabel =
      ORDER_TYPES.find(t => t.value === orderType)?.label || 'Orders'
    const sortedEntries = [...allEntries].sort(
      (a, b) => moment(b.date).valueOf() - moment(a.date).valueOf()
    )

    let htmlContent = `<html><head><title>${typeLabel} Orders - ${moment().format(
      'DD MMM YYYY'
    )}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; }
        h1 { text-align: center; font-size: 20px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background: #f9f9f9; }
      </style></head><body>
      <h1>${typeLabel} Orders - ${moment().format('DD MMM YYYY')}</h1>
      <table><thead><tr><th>Date</th><th>Dealer</th><th>Product</th><th>Qty</th><th>Status</th><th>Transport</th></tr></thead><tbody>`

    sortedEntries.forEach(e => {
      const date = e.dateIST
        ? moment(e.dateIST).format('DD MMM YYYY hh:mm A')
        : moment.utc(e.date).format('DD MMM YYYY hh:mm A')
      const statusMap = {
        dispatch: 'Awaiting Dispatch',
        pending: 'Out of Stock',
        in_production: 'In Production'
      }
      htmlContent += `<tr><td>${date}</td><td>${
        e.dealerName || 'N/A'
      }</td><td>${e.productName || 'N/A'}</td><td>${e.quantity || 0}</td><td>${
        statusMap[e.entryStatus] || 'Unknown'
      }</td><td style="color:${
        e.isTransportPaid ? '#52c41a' : '#ff4d4f'
      };font-weight:bold">${e.isTransportPaid ? 'Paid' : 'Not Paid'}</td></tr>`
    })

    htmlContent += '</tbody></table></body></html>'
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => printWindow.print()
    message.success('Export dialog opened.')
  }

  const getTransportDisplay = record => {
    if (record.isTransportPaid) {
      return (
        <div>
          <span className='co-transport-badge paid'>Paid</span>
          {record.transportAmount > 0 && (
            <div className='co-transport-amount'>
              Rs. {record.transportAmount}
            </div>
          )}
        </div>
      )
    }
    return <span className='co-transport-badge unpaid'>Not Paid</span>
  }

  const getStatusDisplay = record => {
    const statusConfig = {
      dispatch: { label: 'Awaiting Dispatch', className: 'dispatch' },
      pending: { label: 'Out of Stock', className: 'outofstock' },
      in_production: { label: 'In Production', className: 'inprod' }
    }
    const config = statusConfig[record.entryStatus] || {
      label: record.statusLabel || 'Unknown',
      className: 'default'
    }
    return (
      <span className={`co-status-badge ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className='co-page'>
      <h1 className='co-page-title'>Create Sales Order</h1>

      <div className='co-layout'>
        {/* ===== LEFT: Create Order Form ===== */}
        <div className='co-form-card'>
          <div className='co-form-inner'>
            {/* Header */}
            <div className='co-form-header'>
              <EditOutlined className='co-form-header-icon' />
              <span className='co-form-header-title'>Create New Order</span>
            </div>

            {/* Order Type Radio */}
            <div className='co-field'>
              <label className='co-label'>Select Order Type</label>
              <Radio.Group
                value={orderType}
                onChange={handleOrderTypeChange}
                className='co-radio-group'
              >
                {ORDER_TYPES.map(t => (
                  <Radio key={t.value} value={t.value}>
                    {t.label}
                  </Radio>
                ))}
              </Radio.Group>
            </div>

            {/* Date and Time */}
            <div className='co-field'>
              <label className='co-label'>Date and Time</label>
              <Input
                type='datetime-local'
                value={
                  entry?.date
                    ? moment(entry.date).format('YYYY-MM-DDTHH:mm:ss')
                    : ''
                }
                onChange={e => dispatch(setEntry({ date: e.target.value }))}
                className='co-input'
              />
            </div>

            {/* Dealer */}
            <div className='co-field'>
              <label className='co-label'>
                Dealer <span className='co-required'>*</span>
              </label>
              <Select
                showSearch
                className='co-select'
                options={dealersDropdown || []}
                value={entry.dealerId || undefined}
                placeholder='Select Dealer'
                onChange={(val, opt) =>
                  dispatch(
                    setEntry({ dealerId: val, dealerName: opt?.label || null })
                  )
                }
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </div>

            {/* Product */}
            <div className='co-field'>
              <label className='co-label'>
                Product <span className='co-required'>*</span>
              </label>
              <Select
                showSearch
                className='co-select'
                options={allProducts || []}
                value={entry.productId || undefined}
                placeholder='Select Product'
                onChange={(val, opt) =>
                  dispatch(
                    setEntry({
                      productId: val,
                      productName: opt?.label || null,
                      productType: orderType
                    })
                  )
                }
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </div>

            {/* Quantity */}
            <div className='co-field'>
              <label className='co-label'>
                Quantity <span className='co-required'>*</span>
              </label>
              <div className='co-quantity-wrapper'>
                <Input
                  type='number'
                  value={entry.quantity || ''}
                  onChange={e =>
                    dispatch(setEntry({ quantity: +e.target.value }))
                  }
                  placeholder='20'
                  className='co-input'
                />
                <span className='co-quantity-unit'>units</span>
              </div>
            </div>

            {/* Transport charges */}
            <div className='co-field'>
              <Radio
                checked={transportPaid}
                onChange={e =>
                  setTransportPaid(e.target.checked || !transportPaid)
                }
                onClick={() => setTransportPaid(!transportPaid)}
                className='co-transport-radio'
              >
                Transport charges are paid
              </Radio>
              {transportPaid && (
                <div className='co-transport-box'>
                  <label className='co-transport-box-label'>Enter Amount</label>
                  <div className='co-transport-input-wrap'>
                    <span className='co-transport-currency'>₹</span>
                    <Input
                      type='number'
                      value={transportAmount}
                      onChange={e => setTransportAmount(e.target.value)}
                      placeholder='0.00'
                      className='co-transport-input'
                    />
                  </div>
                  <p className='co-transport-hint'>
                    This amount will be recorded against the order
                  </p>
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div className='co-field'>
              <label className='co-label'>
                Special Instructions{' '}
                <span className='co-optional'>(Optional)</span>
              </label>
              <Input.TextArea
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                placeholder='Add any packaging notes, delivery preferences, or special handling instructions...'
                rows={3}
                className='co-textarea'
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className='co-form-actions'>
            <button className='co-btn-reset' onClick={handleReset}>
              <ReloadOutlined /> Reset
            </button>
            <button
              className='co-btn-create'
              onClick={handleCreateOrder}
              disabled={isCreatingOrder}
            >
              <PlusOutlined />{' '}
              {isCreatingOrder ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>

        {/* ===== RIGHT: Orders List ===== */}
        <div className='co-orders-card'>
          <div className='co-orders-header'>
            <div>
              <h2 className='co-orders-title'>Orders List</h2>
              <p className='co-orders-subtitle'>
                Total {allEntries.length} Orders today
              </p>
            </div>
            <button
              className='co-btn-export'
              onClick={handleExportTodayOrders}
              disabled={allEntries.length === 0}
            >
              <ExportOutlined /> Export Today
            </button>
          </div>

          {/* Table */}
          <div className='co-table-wrap'>
            <table className='co-table'>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Dealers</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Transport</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='co-table-empty'>
                      No orders yet today
                    </td>
                  </tr>
                ) : (
                  paginatedEntries.map(record => {
                    const date = record.dateIST
                      ? moment(record.dateIST)
                      : moment.utc(record.date || record.created_at)
                    return (
                      <tr key={record.id}>
                        <td className='co-td-date'>
                          {date.format('DD MMM YYYY')}
                          <br />
                          <span className='co-td-time'>
                            {date.format('hh:mm A')}
                          </span>
                        </td>
                        <td>{record.dealerName || 'N/A'}</td>
                        <td>{record.productName || 'N/A'}</td>
                        <td className='co-td-center'>{record.quantity || 0}</td>
                        <td>{getTransportDisplay(record)}</td>
                        <td>{getStatusDisplay(record)}</td>
                        <td className='co-td-center'>
                          <Popconfirm
                            title='Delete this entry?'
                            description='This action cannot be undone.'
                            onConfirm={() => handleDeleteEntry(record)}
                            okText='Yes'
                            cancelText='No'
                            okButtonProps={{ danger: true }}
                          >
                            <button
                              className='co-btn-delete'
                              disabled={deletingId !== null}
                            >
                              <DeleteOutlined />
                            </button>
                          </Popconfirm>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {allEntries.length > pageSize && (
            <div className='co-pagination'>
              <Pagination
                current={currentPage}
                total={allEntries.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showTotal={(total, range) =>
                  `Showing ${range[0]}-${range[1]} of ${total} results`
                }
                size='small'
              />
            </div>
          )}
        </div>
      </div>

      {/* Information Box */}
      <div className='co-info-box'>
        <div className='co-info-header'>
          <InfoCircleOutlined className='co-info-icon' />
          <span className='co-info-title'>Information</span>
        </div>
        <ul className='co-info-list'>
          <li>Create orders for dealers based on product type</li>
          <li>System will automatically check stock availability</li>
          <li>Orders will be routed based on stock status</li>
          <li>
            All orders require sales coordinator approval before final dispatch
          </li>
        </ul>
      </div>

      <style>{`
        .co-page {
          width: 100%;
        }

        .co-page-title {
          font-family: 'Staff Wide Test', serif;
          font-size: 42px;
          font-weight: 400;
          color: #1a1a1a;
          margin: 0 0 24px 0;
          font-style: normal;
          line-height: 30px;
        }

        /* Layout: left form + right table */
        .co-layout {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 20px;
          align-items: start;
        }

        /* ===== FORM CARD ===== */
        .co-form-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .co-form-inner {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .co-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .co-form-header-icon {
          font-size: 20px;
          color: #3b82f6;
        }

        .co-form-header-title {
          font-family: 'Inter', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #3b82f6;
        }

        /* Fields */
        .co-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .co-label {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }

        .co-required {
          color: #ef4444;
        }

        .co-optional {
          color: #9ca3af;
          font-weight: 400;
          font-size: 13px;
        }

        .co-radio-group {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .co-radio-group .ant-radio-wrapper {
          font-size: 14px;
          color: #374151;
        }

        .co-input,
        .co-select {
          width: 100%;
        }

        .co-input .ant-input,
        .co-input,
        .co-select .ant-select-selector {
          height: 44px !important;
          border-radius: 12px !important;
          font-size: 14px !important;
        }

        .co-select {
          height: 44px;
        }

        .co-select .ant-select-selector {
          border-radius: 12px !important;
          height: 44px !important;
          display: flex !important;
          align-items: center !important;
        }

        .co-textarea {
          border-radius: 12px !important;
          font-size: 14px !important;
        }

        /* Quantity with unit */
        .co-quantity-wrapper {
          position: relative;
        }

        .co-quantity-unit {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          color: #9ca3af;
          pointer-events: none;
        }

        /* Transport */
        .co-transport-radio .ant-radio-wrapper {
          font-size: 14px;
          font-weight: 500;
        }

        .co-transport-box {
          background: #dbeafe;
          border: 1px solid #4a90ff;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .co-transport-box-label {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }

        .co-transport-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0 12px;
          height: 44px;
        }

        .co-transport-currency {
          font-size: 16px;
          color: #374151;
          font-weight: 500;
        }

        .co-transport-input {
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          height: 100% !important;
        }

        .co-transport-input:focus {
          box-shadow: none !important;
        }

        .co-transport-hint {
          font-size: 12px;
          color: #a0a0a8;
          margin: 0;
        }

        /* Form Actions */
        .co-form-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          border-top: 1px solid #f3f4f6;
        }

        .co-btn-reset {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .co-btn-reset:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .co-btn-create {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .co-btn-create:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .co-btn-create:disabled {
          opacity: 0.5;
          cursor: wait;
        }

        /* ===== ORDERS CARD ===== */
        .co-orders-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .co-orders-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px 32px 16px;
        }

        .co-orders-title {
          font-family: 'Inter', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .co-orders-subtitle {
          font-size: 13px;
          color: #f26c2d;
          margin: 4px 0 0;
          font-weight: 500;
        }

        .co-btn-export {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #dcfce7;
          border: none;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #15803d;
          cursor: pointer;
          transition: all 0.2s;
        }

        .co-btn-export:hover:not(:disabled) {
          background: #bbf7d0;
        }

        .co-btn-export:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ===== TABLE ===== */
        .co-table-wrap {
          overflow-x: auto;
        }

        .co-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .co-table thead th {
          background: #f9fafb;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #6b7280;
          font-size: 13px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .co-table thead th:first-child {
          padding-left: 32px;
        }

        .co-table tbody td {
          padding: 14px 16px;
          color: #374151;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .co-table tbody td:first-child {
          padding-left: 32px;
        }

        .co-table tbody tr:hover {
          background: #fafafa;
        }

        .co-td-date {
          white-space: nowrap;
          font-size: 13px;
        }

        .co-td-time {
          color: #9ca3af;
          font-size: 12px;
        }

        .co-td-center {
          text-align: center;
        }

        .co-table-empty {
          text-align: center;
          padding: 40px 16px !important;
          color: #9ca3af;
          font-style: italic;
        }

        /* Transport badges */
        .co-transport-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .co-transport-badge.paid {
          background: #dcfce7;
          color: #15803d;
        }

        .co-transport-badge.paid::before {
          content: '●';
          font-size: 8px;
        }

        .co-transport-badge.unpaid {
          background: #fee2e2;
          color: #dc2626;
        }

        .co-transport-badge.unpaid::before {
          content: '●';
          font-size: 8px;
        }

        .co-transport-amount {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        /* Status badges */
        .co-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }

        .co-status-badge::before {
          content: '●';
          font-size: 8px;
        }

        .co-status-badge.dispatch {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .co-status-badge.dispatch::before {
          color: #7c3aed;
        }

        .co-status-badge.outofstock {
          background: #fff7ed;
          color: #c2410c;
        }

        .co-status-badge.outofstock::before {
          content: '⚠';
          font-size: 10px;
        }

        .co-status-badge.inprod {
          background: #ecfeff;
          color: #0891b2;
        }

        .co-status-badge.inprod::before {
          color: #0891b2;
        }

        .co-status-badge.default {
          background: #f3f4f6;
          color: #6b7280;
        }

        /* Delete button */
        .co-btn-delete {
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #9ca3af;
          transition: all 0.2s;
        }

        .co-btn-delete:hover {
          color: #ef4444;
          border-color: #fca5a5;
          background: #fef2f2;
        }

        /* Pagination */
        .co-pagination {
          padding: 16px 32px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: center;
        }

        /* ===== INFO BOX ===== */
        .co-info-box {
          margin-top: 24px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 16px;
          padding: 24px 32px;
        }

        .co-info-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .co-info-icon {
          font-size: 18px;
          color: #f26c2d;
        }

        .co-info-title {
          font-size: 16px;
          font-weight: 600;
          color: #f26c2d;
        }

        .co-info-list {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .co-info-list li {
          font-size: 13px;
          color: #78350f;
          line-height: 1.6;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .co-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default CreateOrderView
