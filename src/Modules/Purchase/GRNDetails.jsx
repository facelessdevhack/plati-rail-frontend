import PageTitle from "../../Core/Components/PageTitle"
import PlatiFormStyles from "../../Core/Components/FormStyles"
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Card, Button, Tag, Descriptions, Table, Popconfirm, message, Spin, Alert
} from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { getGRNById, completeGRN } from '../../redux/api/purchaseV2API'
import dayjs from 'dayjs'

export default function GRNDetails() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentGRN: grn, loading } = useSelector(s => s.purchaseV2)
  const { user } = useSelector(s => s.userDetails)

  const [completing, setCompleting] = useState(false)

  const isSM = [8, 5, 999].includes(Number(user?.roleId))

  useEffect(() => {
    dispatch(getGRNById(id))
  }, [id])

  const handleComplete = async () => {
    setCompleting(true)
    const result = await dispatch(completeGRN(id))
    setCompleting(false)
    if (result.payload?.success) {
      message.success('GRN completed — inventory updated')
      dispatch(getGRNById(id))
    } else {
      message.error(result.payload?.message || 'Failed to complete GRN')
    }
  }

  if (loading || !grn) return <div style={{ width: '100%' }}><Spin tip='Loading GRN…' /></div>

  const items = grn.items || []

  const columns = [
    { title: 'Item Code', dataIndex: 'itemCode', render: v => <span className='font-mono text-blue-700 text-xs'>{v}</span> },
    { title: 'Item Name', dataIndex: 'itemName' },
    { title: 'UOM', dataIndex: 'uom', width: 70 },
    { title: 'Ordered', dataIndex: 'quantityOrdered', width: 90 },
    { title: 'Received', dataIndex: 'quantityReceived', width: 90 },
    {
      title: 'Accepted',
      dataIndex: 'quantityAccepted',
      width: 90,
      render: v => <span className='text-green-700 font-semibold'>{v}</span>
    },
    {
      title: 'Rejected',
      dataIndex: 'quantityRejected',
      width: 90,
      render: v => <span className={v > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>{v || 0}</span>
    },
    { title: 'Rejection Reason', dataIndex: 'rejectionReason', render: v => v || '-' },
    { title: 'Batch No.', dataIndex: 'batchNumber', render: v => v || '-' },
    { title: 'Unit Price', dataIndex: 'unitPrice', render: v => `₹${Number(v || 0).toFixed(2)}` }
  ]

  const isCompleted = grn.status === 'completed'
  const purchaseType = grn.purchaseType || 'items'

  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <div className='flex items-center gap-3 mb-6'>
        <button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/grn')}>Back</button>
        <div className='flex-1'>
          <h1 className='text-2xl font-bold text-gray-800 mb-0'>{grn.grnNumber}</h1>
          <Tag color={isCompleted ? 'green' : 'orange'} className='mt-1'>
            {isCompleted ? 'COMPLETED' : 'DRAFT'}
          </Tag>
          {purchaseType === 'job_work' && <Tag color='purple' className='ml-1'>Job Work</Tag>}
        </div>
        {isSM && !isCompleted && (
          <Popconfirm
            title='Complete this GRN? This will update inventory and cannot be undone.'
            onConfirm={handleComplete}
            okText='Yes, Complete'
          >
            <button type='primary' icon={<CheckCircleOutlined />} loading={completing}>
              Complete GRN
            </button>
          </Popconfirm>
        )}
      </div>

      {isCompleted && purchaseType === 'items' && (
        <Alert
          message='GRN completed — inventory has been updated for accepted items.'
          type='success'
          showIcon
          className='mb-4'
        />
      )}
      {isCompleted && purchaseType === 'job_work' && (
        <Alert
          message='GRN completed — job work service confirmed. No inventory update (job work).'
          type='success'
          showIcon
          className='mb-4'
        />
      )}

      <Card className='mb-4'>
        <Descriptions bordered column={2} size='small'>
          <Descriptions.Item label='GRN Number'>{grn.grnNumber}</Descriptions.Item>
          <Descriptions.Item label='Status'>
            <Tag color={isCompleted ? 'green' : 'orange'}>{grn.status?.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label='PO Number'>
            {grn.orderNumber ? (
              <Link to={`/purchase/po/${grn.poId}`}>{grn.orderNumber}</Link>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Vendor'>{grn.vendorName || '-'}</Descriptions.Item>
          <Descriptions.Item label='Received By'>{grn.receivedByName || '-'}</Descriptions.Item>
          <Descriptions.Item label='Received Date'>
            {grn.receivedDate ? dayjs(grn.receivedDate).format('DD MMM YYYY') : '-'}
          </Descriptions.Item>
          {grn.vehicleNo && (
            <Descriptions.Item label='Vehicle No.'>{grn.vehicleNo}</Descriptions.Item>
          )}
          {grn.deliveryNote && (
            <Descriptions.Item label='Delivery Note'>{grn.deliveryNote}</Descriptions.Item>
          )}
          {grn.notes && (
            <Descriptions.Item label='Notes' span={2}>{grn.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={`Received Items (${items.length})`}>
        <Table
          dataSource={items}
          columns={columns}
          rowKey='id'
          pagination={false}
          size='small'
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  )
}
