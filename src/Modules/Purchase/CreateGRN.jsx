import PageTitle from "../../Core/Components/PageTitle"
import PlatiFormStyles from "../../Core/Components/FormStyles"
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Form, Input, DatePicker, Button, Table, InputNumber,
  Card, message, Spin, Alert, Select, Tag
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { getPurchaseOrders, getPurchaseOrderById, createGRN, completeGRN } from '../../redux/api/purchaseV2API'
import dayjs from 'dayjs'

export default function CreateGRN() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { purchaseOrders, currentPurchaseOrder: po, loading } = useSelector(s => s.purchaseV2)
  const { user } = useSelector(s => s.userDetails)

  const [form] = Form.useForm()
  const [selectedPoId, setSelectedPoId] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingPo, setLoadingPo] = useState(false)

  useEffect(() => {
    dispatch(getPurchaseOrders({ status: 'sent', limit: 100 }))
    const prefilledPoId = searchParams.get('poId')
    if (prefilledPoId) {
      handleSelectPO(Number(prefilledPoId))
    }
  }, [])

  const handleSelectPO = async (poId) => {
    setSelectedPoId(poId)
    setLoadingPo(true)
    const result = await dispatch(getPurchaseOrderById(poId))
    setLoadingPo(false)
    if (result.payload?.data) {
      const poItems = result.payload.data.items || []
      setLineItems(poItems.map(item => ({
        poItemId: item.id,
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        quantityOrdered: Number(item.quantity),
        quantityReceived: Number(item.quantity),
        quantityAccepted: Number(item.quantity),
        quantityRejected: 0,
        rejectionReason: '',
        unitPrice: Number(item.unitPrice || 0),
        batchNumber: ''
      })))
    }
  }

  const updateLine = (idx, field, value) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantityReceived') {
        updated.quantityAccepted = value
        updated.quantityRejected = 0
      }
      if (field === 'quantityAccepted') {
        updated.quantityRejected = Math.max(0, updated.quantityReceived - value)
      }
      return updated
    }))
  }

  const handleSubmit = async (complete = false) => {
    const values = await form.validateFields()
    if (!selectedPoId) return message.error('Please select a PO')

    setSaving(true)
    const grnPayload = {
      poId: selectedPoId,
      receivedBy: user?.userId || user?.id,
      receivedDate: values.receivedDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
      vehicleNo: values.vehicleNo,
      deliveryNote: values.deliveryNote,
      notes: values.notes,
      items: lineItems.map(i => ({
        poItemId: i.poItemId,
        itemId: i.itemId,
        quantityOrdered: i.quantityOrdered,
        quantityReceived: i.quantityReceived,
        quantityAccepted: i.quantityAccepted,
        quantityRejected: i.quantityRejected,
        rejectionReason: i.rejectionReason,
        unitPrice: i.unitPrice,
        batchNumber: i.batchNumber
      }))
    }

    const result = await dispatch(createGRN(grnPayload))
    if (!result.payload?.success) {
      setSaving(false)
      return message.error(result.payload?.message || 'Failed to create GRN')
    }

    const grnId = result.payload.data?.id
    if (complete && grnId) {
      await dispatch(completeGRN(grnId))
      message.success('GRN created and completed — inventory updated')
    } else {
      message.success('GRN saved as draft')
    }
    setSaving(false)
    navigate('/purchase/grn')
  }

  const itemColumns = [
    { title: 'Item Code', dataIndex: 'itemCode', width: 110, render: v => <span className='font-mono text-blue-700 text-xs'>{v}</span> },
    { title: 'Item Name', dataIndex: 'itemName' },
    { title: 'UOM', dataIndex: 'uom', width: 70 },
    { title: 'Ordered', dataIndex: 'quantityOrdered', width: 90 },
    {
      title: 'Received',
      dataIndex: 'quantityReceived',
      width: 110,
      render: (v, _, idx) => (
        <InputNumber min={0} max={lineItems[idx]?.quantityOrdered} value={v} onChange={val => updateLine(idx, 'quantityReceived', val)} style={{ width: '100%' }} />
      )
    },
    {
      title: 'Accepted',
      dataIndex: 'quantityAccepted',
      width: 110,
      render: (v, _, idx) => (
        <InputNumber min={0} max={lineItems[idx]?.quantityReceived} value={v} onChange={val => updateLine(idx, 'quantityAccepted', val)} style={{ width: '100%' }} />
      )
    },
    {
      title: 'Rejected',
      dataIndex: 'quantityRejected',
      width: 90,
      render: v => <span className={v > 0 ? 'text-red-600 font-semibold' : ''}>{v}</span>
    },
    {
      title: 'Rejection Reason',
      dataIndex: 'rejectionReason',
      render: (v, _, idx) => (
        <Input
          value={v}
          onChange={e => updateLine(idx, 'rejectionReason', e.target.value)}
          placeholder='If rejected…'
          disabled={lineItems[idx]?.quantityRejected === 0}
        />
      )
    },
    {
      title: 'Batch No.',
      dataIndex: 'batchNumber',
      width: 120,
      render: (v, _, idx) => (
        <Input value={v} onChange={e => updateLine(idx, 'batchNumber', e.target.value)} placeholder='Optional' />
      )
    }
  ]

  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <div className='flex items-center gap-3 mb-6'>
        <button onClick={() => navigate('/purchase/grn')} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}><ArrowLeftOutlined style={{ fontSize: 14 }} /> Back</button>
        <div>
          <h1 className='text-2xl font-bold text-gray-800 mb-0'>Create GRN</h1>
          <p className='text-gray-500 text-sm'>Record goods received against a Purchase Order</p>
        </div>
      </div>

      <Card className='mb-4'>
        <Form form={form} layout='vertical'>
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item label='Purchase Order' required>
              <Select
                placeholder='Select PO'
                value={selectedPoId}
                onChange={handleSelectPO}
                loading={loading}
                showSearch
                optionFilterProp='label'
                options={purchaseOrders.map(p => ({
                  value: p.id,
                  label: `${p.orderNumber} — ${p.vendorName || 'Unknown vendor'}`
                }))}
              />
            </Form.Item>
            <Form.Item name='receivedDate' label='Received Date'>
              <DatePicker style={{ width: '100%' }} defaultValue={dayjs()} />
            </Form.Item>
            <Form.Item name='vehicleNo' label='Vehicle Number'>
              <Input placeholder='e.g. MH-12-AB-1234' />
            </Form.Item>
            <Form.Item name='deliveryNote' label='Delivery Note / Challan No.'>
              <Input />
            </Form.Item>
            <Form.Item name='notes' label='Notes' className='col-span-2'>
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>
        </Form>
      </Card>

      {loadingPo && <Spin tip='Loading PO items…' className='block text-center mb-4' />}

      {po && selectedPoId === po.id && lineItems.length > 0 && (
        <Card
          title={`Items from PO ${po.orderNumber}`}
          className='mb-4'
          extra={<Tag color='blue'>{po.vendorName}</Tag>}
        >
          <Alert
            message='Enter the received, accepted, and rejected quantities for each item. Rejected qty will be auto-calculated.'
            type='info'
            showIcon
            className='mb-3'
          />
          <Table
            dataSource={lineItems}
            columns={itemColumns}
            rowKey='poItemId'
            pagination={false}
            size='small'
            scroll={{ x: 1000 }}
          />
        </Card>
      )}

      <div className='flex justify-end gap-3'>
        <button onClick={() => navigate('/purchase/grn')} style={{ background: '#e5e5e5', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}>Cancel</button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={saving || !selectedPoId || lineItems.length === 0}
          style={{ background: '#f3f3f5', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', opacity: saving || !selectedPoId || lineItems.length === 0 ? 0.5 : 1 }}
        >
          Save as Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={saving || !selectedPoId || lineItems.length === 0}
          style={{ background: '#4a90ff', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', opacity: saving || !selectedPoId || lineItems.length === 0 ? 0.5 : 1 }}
        >
          Save & Complete (Update Inventory)
        </button>
      </div>
    </div>
  )
}
