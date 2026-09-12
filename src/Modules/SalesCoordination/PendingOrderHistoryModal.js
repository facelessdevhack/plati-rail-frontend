import React, { useEffect, useState } from 'react'
import { Alert, Button, Modal, Table } from 'antd'
import moment from 'moment'
import { getPendingEntryOrderHistoryAPI } from '../../redux/api/entriesAPI'

export const formatOrderTime = value => value
  ? moment.utc(value).utcOffset(330).format('DD MMM YYYY hh:mm A')
  : 'N/A'

const statusLabels = {
  awaiting_stock: 'Awaiting stock',
  moved_to_dispatch: 'Sent for dispatch',
  cancelled: 'Cancelled',
  merged: 'Merged',
}

const columns = [
  { title: 'Recorded at (IST)', dataIndex: 'recordedAt', render: formatOrderTime },
  { title: 'Order date (IST)', dataIndex: 'orderedAt', render: formatOrderTime },
  { title: 'Requested quantity', dataIndex: 'quantity', align: 'center' },
  { title: 'Pending order status', dataIndex: 'pendingStatus', render: value => statusLabels[value] || value },
  { title: 'Entered by (user ID)', dataIndex: 'createdBy', align: 'center' },
  { title: 'Source entry', dataIndex: 'sourcePendingEntryId', align: 'center' },
]

const PendingOrderHistoryModal = ({ entry, onClose }) => {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ history: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    getPendingEntryOrderHistoryAPI({ pendingEntryId: entry.id, page, pageSize: 20 })
      .then(data => { if (active) setResult(data) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [entry.id, page, retry])

  return (
    <Modal title={`Order history · Entry ${entry.id}`} open onCancel={onClose} footer={null} width={1000}>
      <p>{entry.dealerName} · {entry.productName}</p>
      <p>
        {entry.orderCount || 1} times ordered · Pending quantity: {entry.quantity}.
        {' '}Repeat submissions do not increase the pending quantity.
      </p>
      {error ? (
        <Alert type="error" showIcon message="Could not load order history."
          action={<Button onClick={() => setRetry(value => value + 1)}>Retry</Button>} />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={result.history} loading={loading}
          scroll={{ x: 1000, y: '45vh' }} pagination={{ current: page, pageSize: 20, total: result.total,
            showSizeChanger: false, onChange: setPage }} />
      )}
    </Modal>
  )
}

export default PendingOrderHistoryModal
