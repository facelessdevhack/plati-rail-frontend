import PageTitle from "../../Core/Components/PageTitle"
import PlatiFormStyles from "../../Core/Components/FormStyles"
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Form, Input, DatePicker, Button, Select, Table, InputNumber, Space,
  message, Alert, Spin, Tag, Modal
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { getRequisitions, getItems, getItemCategories, createIndent } from '../../redux/api/purchaseV2API'
import { client, getError } from '../../Utils/axiosClient'

const { Option } = Select
const { TextArea } = Input

export default function CreateIndent() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { requisitions, items, itemCategories, loading, error } = useSelector(s => s.purchaseV2)

  const [selectedPR, setSelectedPR] = useState(null)
  const [prList, setPrList] = useState([])
  const [form] = Form.useForm()
  const [lineItems, setLineItems] = useState([])
  const [itemSearchModal, setItemSearchModal] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [prLoading, setPrLoading] = useState(false)

  useEffect(() => {
    loadApprovedPRs()
    dispatch(getItemCategories())
    dispatch(getItems({ limit: 100 }))
  }, [])

  const loadApprovedPRs = async () => {
    setPrLoading(true)
    try {
      const result = await dispatch(getRequisitions({ status: 'approved', limit: 100 })).unwrap()
      setPrList(result.data || [])
    } catch (_) {}
    setPrLoading(false)
  }

  const handlePRSelect = (prId) => {
    const pr = prList.find(p => p.id === prId)
    setSelectedPR(pr)
  }

  const addItem = (item) => {
    if (lineItems.find(i => i.itemId === item.id)) {
      message.warning('Item already added')
      return
    }
    setLineItems(prev => [...prev, {
      key: item.id,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      categoryName: item.categoryName,
      uom: item.uom,
      quantityRequested: 1,
      specification: '',
      estimatedUnitPrice: 0
    }])
    setItemSearchModal(false)
  }

  const removeItem = (itemId) => {
    setLineItems(prev => prev.filter(i => i.itemId !== itemId))
  }

  const updateItem = (itemId, field, value) => {
    setLineItems(prev => prev.map(i => i.itemId === itemId ? { ...i, [field]: value } : i))
  }

  const handleSubmit = async () => {
    if (!selectedPR) { message.error('Please select a Purchase Requisition'); return }
    if (lineItems.length === 0) { message.error('Add at least one item'); return }
    try {
      await form.validateFields()
    } catch (_) { return }

    setSubmitting(true)
    const values = form.getFieldsValue()
    const result = await dispatch(createIndent({
      prId: selectedPR.id,
      requiredDate: values.requiredDate?.format('YYYY-MM-DD'),
      notes: values.notes,
      items: lineItems.map(i => ({
        itemId: i.itemId,
        quantityRequested: i.quantityRequested,
        uom: i.uom,
        specification: i.specification,
        estimatedUnitPrice: i.estimatedUnitPrice
      }))
    }))
    setSubmitting(false)

    if (result.payload?.success) {
      message.success('Indent created successfully')
      navigate('/purchase/indents')
    } else {
      message.error(result.payload?.message || 'Failed to create indent')
    }
  }

  const filteredItems = items.filter(i =>
    !itemSearch || i.itemName?.toLowerCase().includes(itemSearch.toLowerCase()) || i.itemCode?.toLowerCase().includes(itemSearch.toLowerCase())
  )

  const itemColumns = [
    { title: 'Item Code', dataIndex: 'itemCode', width: 100 },
    { title: 'Item Name', dataIndex: 'itemName' },
    { title: 'Category', dataIndex: 'categoryName' },
    {
      title: 'UOM',
      dataIndex: 'uom',
      render: (v, r) => (
        <Input size='small' value={r.uom} style={{ width: 60 }} onChange={e => updateItem(r.itemId, 'uom', e.target.value)} />
      )
    },
    {
      title: 'Qty Requested',
      dataIndex: 'quantityRequested',
      render: (v, r) => (
        <InputNumber size='small' min={0.01} value={v} style={{ width: 80 }} onChange={val => updateItem(r.itemId, 'quantityRequested', val)} />
      )
    },
    {
      title: 'Specification',
      dataIndex: 'specification',
      render: (v, r) => (
        <Input size='small' value={v} placeholder='brand, grade, size...' onChange={e => updateItem(r.itemId, 'specification', e.target.value)} />
      )
    },
    {
      title: 'Est. Unit Price',
      dataIndex: 'estimatedUnitPrice',
      render: (v, r) => (
        <InputNumber size='small' min={0} prefix='₹' value={v} style={{ width: 100 }} onChange={val => updateItem(r.itemId, 'estimatedUnitPrice', val)} />
      )
    },
    {
      title: '',
      render: (_, r) => <button size='small' danger icon={<DeleteOutlined />} onClick={() => removeItem(r.itemId)} />
    }
  ]

  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 style={{ fontFamily: "'Staff Wide Test', serif", fontSize: 42, fontWeight: 400, color: '#1a1a1a', margin: 0, lineHeight: '30px' }}>Create Purchase Indent</h1>
          <p className='text-gray-500 text-sm'>Select an approved requisition and add catalog items</p>
        </div>
        <button onClick={() => navigate('/purchase/indents')}>Cancel</button>
      </div>

      {error && <Alert type='error' message={error?.message || String(error)} className='mb-4' />}

      {/* Select PR */}
      <div className='bg-white rounded-xl shadow-sm border p-6 mb-4'>
        <h2 className='font-semibold text-gray-700 mb-3'>1. Select Purchase Requisition</h2>
        <Select
          className='w-full max-w-lg'
          placeholder='Select an approved requisition...'
          loading={prLoading}
          showSearch
          filterOption={(input, opt) => opt?.label?.toLowerCase().includes(input.toLowerCase())}
          onChange={handlePRSelect}
          options={prList.map(pr => ({
            value: pr.id,
            label: `${pr.prNumber} — ${pr.requesterName} (${pr.department || 'No dept'})`,
          }))}
        />

        {selectedPR && (
          <div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100'>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              <div><span className='text-gray-500'>PR Number:</span> <span className='font-mono font-semibold'>{selectedPR.prNumber}</span></div>
              <div><span className='text-gray-500'>Type:</span> <Tag color={selectedPR.purchaseType === 'job_work' ? 'purple' : 'blue'}>{selectedPR.purchaseType === 'job_work' ? 'Job Work' : 'Items'}</Tag></div>
              <div><span className='text-gray-500'>Requester:</span> {selectedPR.requesterName}</div>
              <div><span className='text-gray-500'>Urgency:</span> <Tag>{selectedPR.urgency?.toUpperCase()}</Tag></div>
              <div className='col-span-2'><span className='text-gray-500'>Description:</span> <p className='mt-1'>{selectedPR.itemsDescription}</p></div>
            </div>
          </div>
        )}
      </div>

      {/* Indent details */}
      <div className='bg-white rounded-xl shadow-sm border p-6 mb-4'>
        <h2 className='font-semibold text-gray-700 mb-3'>2. Indent Details</h2>
        <Form form={form} layout='vertical'>
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item name='requiredDate' label='Required By Date'>
              <DatePicker className='w-full' />
            </Form.Item>
            <Form.Item name='notes' label='Notes'>
              <TextArea rows={2} />
            </Form.Item>
          </div>
        </Form>
      </div>

      {/* Line items */}
      <div className='bg-white rounded-xl shadow-sm border p-6 mb-4'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='font-semibold text-gray-700'>3. Items / Services</h2>
          <button icon={<PlusOutlined />} onClick={() => setItemSearchModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer' }}>Add Item</button>
        </div>
        {lineItems.length === 0 ? (
          <div className='text-center py-8 text-gray-400'>
            No items added yet. Click "Add Item" to select from the catalog.
          </div>
        ) : (
          <Table dataSource={lineItems} columns={itemColumns} rowKey='itemId' pagination={false} size='small' scroll={{ x: 700 }} />
        )}
      </div>

      <div className='flex justify-end gap-3'>
        <button onClick={() => navigate('/purchase/indents')}>Cancel</button>
        <button type='primary' loading={submitting} onClick={handleSubmit}>
          Create Indent
        </button>
      </div>

      {/* Item search modal */}
      <Modal
        title='Select Item from Catalog'
        open={itemSearchModal}
        onCancel={() => setItemSearchModal(false)}
        footer={null}
        width={700}
      >
        <Input.Search
          placeholder='Search item name or code...'
          value={itemSearch}
          onChange={e => setItemSearch(e.target.value)}
          className='mb-3'
          allowClear
        />
        <Table
          dataSource={filteredItems}
          rowKey='id'
          size='small'
          pagination={{ pageSize: 8 }}
          columns={[
            { title: 'Code', dataIndex: 'itemCode', width: 90 },
            { title: 'Name', dataIndex: 'itemName' },
            { title: 'Category', dataIndex: 'categoryName' },
            { title: 'UOM', dataIndex: 'uom', width: 60 },
            {
              title: '',
              render: (_, r) => <button size='small' type='primary' onClick={() => addItem(r)}>Add</button>
            }
          ]}
        />
      </Modal>
    </div>
  )
}
