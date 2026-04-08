import PageTitle from "../../Core/Components/PageTitle"
import PlatiFormStyles from "../../Core/Components/FormStyles"
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Form, Input, Select, DatePicker, Button, Table, InputNumber,
  Card, message, Spin, Alert, Descriptions, Tag
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { getIndents, getIndentById, createPurchaseOrder, getVendors } from '../../redux/api/purchaseV2API'
import dayjs from 'dayjs'

export default function CreatePO() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { indents, currentIndent, vendors, loading } = useSelector(s => s.purchaseV2)

  const [form] = Form.useForm()
  const [selectedIndentId, setSelectedIndentId] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingIndent, setLoadingIndent] = useState(false)

  useEffect(() => {
    dispatch(getIndents({ status: 'submitted', limit: 100 }))
    dispatch(getVendors())
    const prefilledId = searchParams.get('indentId')
    if (prefilledId) {
      handleSelectIndent(Number(prefilledId))
    }
  }, [])

  const handleSelectIndent = async (indentId) => {
    setSelectedIndentId(indentId)
    setLoadingIndent(true)
    const result = await dispatch(getIndentById(indentId))
    setLoadingIndent(false)
    if (result.payload?.data) {
      const items = result.payload.data.items || []
      setLineItems(items.map(item => ({
        indentItemId: item.id,
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        quantityOrdered: item.quantityRequested - (item.quantityPoRaised || 0),
        unitPrice: item.estimatedUnitPrice || 0,
        specification: item.specification || ''
      })))
    }
  }

  const updateLineItem = (idx, field, value) => {
    setLineItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantityOrdered || 0) * (item.unitPrice || 0), 0)

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (!selectedIndentId) return message.error('Please select an indent')
    if (lineItems.length === 0) return message.error('No items to order')

    const orderItems = lineItems
      .filter(i => i.quantityOrdered > 0)
      .map(i => ({
        indentItemId: i.indentItemId,
        itemId: i.itemId,
        quantity: i.quantityOrdered,
        unit_price: i.unitPrice,
        specification: i.specification
      }))

    if (orderItems.length === 0) return message.error('All quantities are zero')

    setSaving(true)
    const result = await dispatch(createPurchaseOrder({
      indentId: selectedIndentId,
      vendorId: values.vendorId,
      expectedDeliveryDate: values.expectedDeliveryDate?.format('YYYY-MM-DD'),
      notes: values.notes,
      items: orderItems
    }))
    setSaving(false)

    if (result.payload?.success) {
      message.success(result.payload.message || 'Purchase Order created')
      navigate('/purchase/po')
    } else {
      message.error(result.payload?.message || 'Failed to create PO')
    }
  }

  const itemColumns = [
    { title: 'Item Code', dataIndex: 'itemCode', width: 110, render: v => <span className='font-mono text-blue-700'>{v}</span> },
    { title: 'Item Name', dataIndex: 'itemName' },
    { title: 'UOM', dataIndex: 'uom', width: 70 },
    {
      title: 'Qty to Order',
      dataIndex: 'quantityOrdered',
      width: 130,
      render: (v, _, idx) => (
        <InputNumber
          min={0}
          value={v}
          onChange={val => updateLineItem(idx, 'quantityOrdered', val)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Unit Price (₹)',
      dataIndex: 'unitPrice',
      width: 130,
      render: (v, _, idx) => (
        <InputNumber
          min={0}
          precision={2}
          value={v}
          onChange={val => updateLineItem(idx, 'unitPrice', val)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Amount (₹)',
      width: 120,
      render: (_, r) => <span className='font-semibold'>{((r.quantityOrdered || 0) * (r.unitPrice || 0)).toFixed(2)}</span>
    },
    {
      title: 'Specification',
      dataIndex: 'specification',
      render: (v, _, idx) => (
        <Input
          value={v}
          onChange={e => updateLineItem(idx, 'specification', e.target.value)}
          placeholder='Brand, grade, size…'
        />
      )
    }
  ]

  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <div className='flex items-center gap-3 mb-6'>
        <button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/po')}>Back</button>
        <div>
          <h1 className='text-2xl font-bold text-gray-800 mb-0'>Create Purchase Order</h1>
          <p className='text-gray-500 text-sm'>Raise a PO against a purchase indent</p>
        </div>
      </div>

      <Card className='mb-4'>
        <Form form={form} layout='vertical'>
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item label='Purchase Indent' required>
              <Select
                placeholder='Select approved indent'
                value={selectedIndentId}
                onChange={handleSelectIndent}
                loading={loading}
                showSearch
                optionFilterProp='label'
                options={indents.map(i => ({
                  value: i.id,
                  label: `${i.indentNumber} — ${i.requesterName || ''} (${i.purchaseType})`
                }))}
              />
            </Form.Item>
            <Form.Item name='vendorId' label='Vendor' rules={[{ required: true, message: 'Select vendor' }]}>
              <Select
                placeholder='Select vendor'
                showSearch
                optionFilterProp='label'
                options={vendors.map(v => ({ value: v.id, label: v.vendorName }))}
              />
            </Form.Item>
            <Form.Item name='expectedDeliveryDate' label='Expected Delivery Date'>
              <DatePicker style={{ width: '100%' }} disabledDate={d => d && d < dayjs().startOf('day')} />
            </Form.Item>
            <Form.Item name='notes' label='Notes'>
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>
        </Form>
      </Card>

      {loadingIndent && <Spin tip='Loading indent items…' className='block text-center mb-4' />}

      {currentIndent && selectedIndentId === currentIndent.id && (
        <Card
          title={`Items from Indent ${currentIndent.indentNumber}`}
          className='mb-4'
          extra={<Tag color={currentIndent.purchaseType === 'job_work' ? 'purple' : 'blue'}>{currentIndent.purchaseType}</Tag>}
        >
          {lineItems.length === 0 ? (
            <Alert message='All items in this indent already have POs raised' type='info' showIcon />
          ) : (
            <Table
              dataSource={lineItems}
              columns={itemColumns}
              rowKey='indentItemId'
              pagination={false}
              size='small'
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={5} className='text-right font-semibold'>Total</Table.Summary.Cell>
                  <Table.Summary.Cell className='font-bold text-green-700'>₹{totalAmount.toFixed(2)}</Table.Summary.Cell>
                  <Table.Summary.Cell />
                </Table.Summary.Row>
              )}
            />
          )}
        </Card>
      )}

      <div className='flex justify-end gap-3'>
        <button onClick={() => navigate('/purchase/po')} style={{ background: '#e5e5e5', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}>Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={saving || !selectedIndentId || lineItems.length === 0}
          style={{ background: '#4a90ff', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', opacity: saving || !selectedIndentId || lineItems.length === 0 ? 0.5 : 1 }}
        >
          Create Purchase Order
        </button>
      </div>
    </div>
  )
}
