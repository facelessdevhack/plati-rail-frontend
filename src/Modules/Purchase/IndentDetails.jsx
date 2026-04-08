import PageTitle from "../../Core/Components/PageTitle"
import PlatiFormStyles from "../../Core/Components/FormStyles"
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Tag, Button, Spin, Descriptions, Table, Space, Tooltip } from 'antd'
import { ArrowLeftOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { getIndentById, closeIndent } from '../../redux/api/purchaseV2API'

const STATUS_COLOR = { submitted: 'blue', po_raised: 'orange', partially_received: 'purple', fully_received: 'green', closed: 'default' }

export default function IndentDetails() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentIndent: indent, loading } = useSelector(s => s.purchaseV2)
  const { user } = useSelector(s => s.userDetails)

  const isPC = [10, 5, 999].includes(Number(user?.roleId))
  const isPM = [9, 5, 999].includes(Number(user?.roleId))

  useEffect(() => { dispatch(getIndentById(id)) }, [id])

  if (loading && !indent) return <div className='flex justify-center items-center h-64'><Spin size='large' /></div>
  if (!indent) return null

  const itemColumns = [
    { title: 'Item Code', dataIndex: 'itemCode', render: v => <span className='font-mono text-sm'>{v}</span> },
    { title: 'Item Name', dataIndex: 'itemName' },
    { title: 'Category', dataIndex: 'categoryName' },
    { title: 'Specification', dataIndex: 'specification', render: v => v || '-' },
    { title: 'UOM', dataIndex: 'uom' },
    { title: 'Requested', dataIndex: 'quantityRequested', render: v => <span className='font-semibold'>{v}</span> },
    {
      title: 'PO Raised',
      dataIndex: 'quantityPoRaised',
      render: (v, r) => (
        <span className={parseFloat(v) < parseFloat(r.quantityRequested) ? 'text-orange-500' : 'text-green-600'}>{v || 0}</span>
      )
    },
    {
      title: 'Received',
      dataIndex: 'quantityReceived',
      render: (v, r) => (
        <span className={parseFloat(v) >= parseFloat(r.quantityRequested) ? 'text-green-600' : parseFloat(v) > 0 ? 'text-orange-500' : 'text-gray-400'}>{v || 0}</span>
      )
    },
    { title: 'Est. Price', dataIndex: 'estimatedUnitPrice', render: v => v > 0 ? `₹${v}` : '-' }
  ]

  const poColumns = [
    {
      title: 'PO Number',
      dataIndex: 'orderNumber',
      render: (v, r) => <button className='text-blue-600 font-mono hover:underline' onClick={() => navigate(`/purchase/po/${r.id}`)}>{v}</button>
    },
    { title: 'Vendor', dataIndex: 'vendorName' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: v => <Tag color={v === 'received' ? 'green' : v === 'partially_received' ? 'orange' : 'blue'}>{v?.replace('_', ' ').toUpperCase()}</Tag>
    },
    { title: 'Date', dataIndex: 'createdAt', render: v => new Date(v).toLocaleDateString() }
  ]

  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <button className='flex items-center text-gray-500 hover:text-gray-700 mb-4' onClick={() => navigate('/purchase/indents')}>
        <ArrowLeftOutlined className='mr-2' /> Back to Indents
      </button>

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold font-mono'>{indent.indentNumber}</h1>
          <div className='flex items-center gap-2 mt-1'>
            <Tag color={STATUS_COLOR[indent.status]}>{indent.status?.replace(/_/g, ' ').toUpperCase()}</Tag>
            <Tag color={indent.purchaseType === 'job_work' ? 'purple' : 'blue'}>
              {indent.purchaseType === 'job_work' ? 'Job Work' : 'Items Purchase'}
            </Tag>
          </div>
        </div>
        <Space>
          {isPC && indent.status === 'submitted' && (
            <button type='primary' icon={<ShoppingCartOutlined />} onClick={() => navigate(`/purchase/po/create?indentId=${indent.id}`)}>
              Create PO
            </button>
          )}
          {isPM && ['fully_received', 'po_raised', 'partially_received'].includes(indent.status) && (
            <Tooltip title='Mark as closed/archived'>
              <button onClick={async () => { await dispatch(closeIndent(id)); dispatch(getIndentById(id)) }}>
                Close Indent
              </button>
            </Tooltip>
          )}
        </Space>
      </div>

      {/* Source PR */}
      {indent.prNumber && (
        <div className='bg-blue-50 rounded-xl border border-blue-100 p-4 mb-4 flex items-center justify-between'>
          <div>
            <span className='text-sm text-blue-600 font-semibold'>Source Requisition: </span>
            <span className='font-mono'>{indent.prNumber}</span>
            {indent.requesterName && <span className='text-gray-500 ml-2'>by {indent.requesterName}</span>}
            {indent.department && <span className='text-gray-400 ml-1'>({indent.department})</span>}
          </div>
        </div>
      )}

      {/* Indent info */}
      <div className='bg-white rounded-xl shadow-sm border p-6 mb-4'>
        <Descriptions column={3} size='small'>
          <Descriptions.Item label='Created By'>{indent.createdByName}</Descriptions.Item>
          <Descriptions.Item label='Required By'>{indent.requiredDate ? new Date(indent.requiredDate).toLocaleDateString() : '-'}</Descriptions.Item>
          <Descriptions.Item label='Created'>{new Date(indent.createdAt).toLocaleDateString()}</Descriptions.Item>
          {indent.notes && <Descriptions.Item label='Notes' span={3}>{indent.notes}</Descriptions.Item>}
        </Descriptions>
      </div>

      {/* Line items */}
      <div className='bg-white rounded-xl shadow-sm border overflow-hidden mb-4'>
        <div className='bg-gray-50 px-6 py-3 border-b'>
          <h3 className='font-semibold text-gray-700'>Items ({indent.items?.length || 0})</h3>
        </div>
        <Table dataSource={indent.items || []} columns={itemColumns} rowKey='id' pagination={false} size='small' />
      </div>

      {/* Linked POs */}
      {indent.purchaseOrders?.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border overflow-hidden'>
          <div className='bg-orange-50 px-6 py-3 border-b border-orange-100'>
            <h3 className='font-semibold text-orange-700'>Purchase Orders ({indent.purchaseOrders.length})</h3>
          </div>
          <Table dataSource={indent.purchaseOrders} columns={poColumns} rowKey='id' pagination={false} size='small' />
        </div>
      )}
    </div>
  )
}
