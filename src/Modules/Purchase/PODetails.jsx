import PageTitle from "../../Core/Components/PageTitle"
import PlatiFormStyles from "../../Core/Components/FormStyles"
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Card, Button, Tag, Descriptions, Table, Select, Popconfirm, message, Spin, Space
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { getPurchaseOrderById, updatePurchaseOrderStatus } from '../../redux/api/purchaseV2API'
import dayjs from 'dayjs'

const STATUS_COLORS = {
  pending: 'orange', approved: 'blue', sent: 'cyan',
  partially_received: 'purple', received: 'green', cancelled: 'red'
}

const STATUS_TRANSITIONS = {
  pending: ['approved', 'cancelled'],
  approved: ['sent', 'cancelled'],
  sent: ['partially_received', 'received', 'cancelled'],
  partially_received: ['received', 'cancelled']
}

export default function PODetails() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentPurchaseOrder: po, loading } = useSelector(s => s.purchaseV2)
  const { user } = useSelector(s => s.userDetails)

  const [updating, setUpdating] = useState(false)

  const isPC = [10, 5, 999].includes(Number(user?.roleId))
  const isSM = [8, 5, 999].includes(Number(user?.roleId))

  useEffect(() => {
    dispatch(getPurchaseOrderById(id))
  }, [id])

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true)
    const result = await dispatch(updatePurchaseOrderStatus({ id, status: newStatus }))
    setUpdating(false)
    if (result.payload?.success) {
      message.success(`Status updated to ${newStatus}`)
      dispatch(getPurchaseOrderById(id))
    } else {
      message.error(result.payload?.message || 'Failed to update status')
    }
  }

  if (loading || !po) return <div style={{ width: '100%' }}><Spin tip='Loading PO…' /></div>

  const transitions = STATUS_TRANSITIONS[po.status] || []
  const items = po.items || []
  const grns = po.goodsReceivedNotes || []

  const itemColumns = [
    { title: 'Item Code', dataIndex: 'itemCode', render: v => <span className='font-mono text-blue-700'>{v}</span> },
    { title: 'Item Name', dataIndex: 'itemName' },
    { title: 'UOM', dataIndex: 'uom' },
    { title: 'Ordered Qty', dataIndex: 'quantity' },
    { title: 'Unit Price', dataIndex: 'unitPrice', render: v => `₹${Number(v || 0).toFixed(2)}` },
    { title: 'Amount', render: (_, r) => `₹${(Number(r.quantity || 0) * Number(r.unitPrice || 0)).toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={STATUS_COLORS[v] || 'default'}>{v || 'pending'}</Tag> }
  ]

  const grnColumns = [
    {
      title: 'GRN Number',
      dataIndex: 'grnNumber',
      render: (v, r) => <Link to={`/purchase/grn/${r.id}`}>{v}</Link>
    },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={v === 'completed' ? 'green' : 'orange'}>{v}</Tag> },
    { title: 'Received By', dataIndex: 'receivedByName' },
    { title: 'Date', dataIndex: 'receivedDate', render: v => v ? dayjs(v).format('DD MMM YYYY') : '-' }
  ]

  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <div className='flex items-center gap-3 mb-6'>
        <button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/po')}>Back</button>
        <div className='flex-1'>
          <h1 className='text-2xl font-bold text-gray-800 mb-0'>{po.orderNumber}</h1>
          <Tag color={STATUS_COLORS[po.status]} className='mt-1'>{po.status?.replace(/_/g, ' ').toUpperCase()}</Tag>
        </div>
        {(isPC || isSM) && transitions.length > 0 && (
          <Space>
            {transitions.map(s => (
              <Popconfirm key={s} title={`Update status to "${s}"?`} onConfirm={() => handleStatusUpdate(s)}>
                <button loading={updating} type={s === 'cancelled' ? 'default' : 'primary'} danger={s === 'cancelled'}>
                  Mark as {s.replace(/_/g, ' ')}
                </button>
              </Popconfirm>
            ))}
          </Space>
        )}
        {isSM && ['approved', 'sent', 'partially_received'].includes(po.status) && (
          <button onClick={() => navigate(`/purchase/grn/create?poId=${po.id}`)}>
            Create GRN
          </button>
        )}
      </div>

      <Card className='mb-4'>
        <Descriptions bordered column={2} size='small'>
          <Descriptions.Item label='Order Number'>{po.orderNumber}</Descriptions.Item>
          <Descriptions.Item label='Status'>
            <Tag color={STATUS_COLORS[po.status]}>{po.status?.replace(/_/g, ' ').toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label='Vendor'>{po.vendorName || '-'}</Descriptions.Item>
          <Descriptions.Item label='Indent'>
            {po.indentNumber ? (
              <Link to={`/purchase/indents/${po.indentId}`}>{po.indentNumber}</Link>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Expected Delivery'>
            {po.expectedDeliveryDate ? dayjs(po.expectedDeliveryDate).format('DD MMM YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Created At'>
            {dayjs(po.createdAt).format('DD MMM YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label='Total Amount' span={2}>
            <span className='text-lg font-bold text-green-700'>₹{Number(po.totalAmount || 0).toFixed(2)}</span>
          </Descriptions.Item>
          {po.notes && <Descriptions.Item label='Notes' span={2}>{po.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Card title='Order Items' className='mb-4'>
        <Table dataSource={items} columns={itemColumns} rowKey='id' pagination={false} size='small' />
      </Card>

      <Card title={`GRNs (${grns.length})`}>
        {grns.length === 0 ? (
          <p className='text-gray-400 text-sm'>No GRNs created yet</p>
        ) : (
          <Table dataSource={grns} columns={grnColumns} rowKey='id' pagination={false} size='small' />
        )}
      </Card>
    </div>
  )
}
