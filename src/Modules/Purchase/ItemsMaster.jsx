import PageTitle from "../../Core/Components/PageTitle"
import PlatiFormStyles from "../../Core/Components/FormStyles"
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Badge
} from 'antd'
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons'
import {
  getItems, createItem, updateItem, toggleItemActive,
  getItemCategories, getItemSubcategories
} from '../../redux/api/purchaseV2API'

const UOM_OPTIONS = ['pcs', 'kg', 'ltr', 'mtr', 'box', 'set', 'roll', 'nos', 'pair', 'dozen']

export default function ItemsMaster() {
  const dispatch = useDispatch()
  const { items, itemsPagination, itemCategories, itemSubcategories, loading } = useSelector(s => s.purchaseV2)

  const [modal, setModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState(null)
  const [filterSub, setFilterSub] = useState(null)
  const [selectedCatId, setSelectedCatId] = useState(null)

  useEffect(() => {
    dispatch(getItemCategories({ includeInactive: false }))
    dispatch(getItemSubcategories({ includeInactive: false }))
    dispatch(getItems({ includeInactive: true }))
  }, [])

  const load = (page = 1) => {
    dispatch(getItems({
      page,
      limit: 50,
      search: search || undefined,
      categoryId: filterCat || undefined,
      subcategoryId: filterSub || undefined,
      includeInactive: true
    }))
  }

  const openModal = (item = null) => {
    setEditingItem(item)
    if (item) {
      form.setFieldsValue({
        itemName: item.itemName,
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId || undefined,
        uom: item.uom,
        description: item.description
      })
      setSelectedCatId(item.categoryId)
    } else {
      form.resetFields()
      setSelectedCatId(null)
    }
    setModal(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    if (editingItem) {
      await dispatch(updateItem({ id: editingItem.id, ...values }))
      message.success('Item updated')
    } else {
      await dispatch(createItem(values))
      message.success('Item created')
    }
    await load()
    setSaving(false)
    setModal(false)
  }

  const subOptions = itemSubcategories.filter(s => s.categoryId === selectedCatId)

  const columns = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      render: v => <span className='font-mono text-blue-700 font-semibold'>{v}</span>,
      width: 120
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      render: (v, r) => <span className={!r.isActive ? 'text-gray-400 line-through' : 'font-medium'}>{v}</span>
    },
    { title: 'Category', dataIndex: 'categoryName', render: v => <Tag color='blue'>{v}</Tag> },
    { title: 'Subcategory', dataIndex: 'subcategoryName', render: v => v ? <Tag>{v}</Tag> : '-' },
    { title: 'UOM', dataIndex: 'uom', width: 80 },
    {
      title: 'Status',
      dataIndex: 'isActive',
      width: 90,
      render: v => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Actions',
      width: 200,
      render: (_, r) => (
        <Space>
          <button size='small' icon={<EditOutlined />} onClick={() => openModal(r)}>Edit</button>
          <Popconfirm
            title={`${r.isActive ? 'Deactivate' : 'Activate'} "${r.itemName}"?`}
            onConfirm={async () => {
              await dispatch(toggleItemActive(r.id))
              load()
            }}
          >
            <button size='small'>{r.isActive ? 'Deactivate' : 'Activate'}</button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ width: '100%' }}>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 style={{ fontFamily: "'Staff Wide Test', serif", fontSize: 42, fontWeight: 400, color: '#1a1a1a', margin: 0, lineHeight: '30px' }}>Items Master</h1>
          <p className='text-gray-500 text-sm'>Manage the purchasable items catalog</p>
        </div>
        <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer' }}>Add Item</button>
      </div>

      {/* Filters */}
      <div className='flex gap-3 mb-4 flex-wrap'>
        <Input
          placeholder='Search by code, name or description'
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onPressEnter={() => load(1)}
          style={{ width: 280 }}
          allowClear
          onClear={() => { setSearch(''); load(1) }}
        />
        <Select
          placeholder='Filter by category'
          style={{ width: 200 }}
          allowClear
          value={filterCat}
          onChange={v => { setFilterCat(v); setFilterSub(null) }}
          options={itemCategories.map(c => ({ value: c.id, label: c.name }))}
        />
        <Select
          placeholder='Filter by subcategory'
          style={{ width: 200 }}
          allowClear
          value={filterSub}
          onChange={setFilterSub}
          disabled={!filterCat}
          options={itemSubcategories
            .filter(s => s.categoryId === filterCat)
            .map(s => ({ value: s.id, label: s.name }))}
        />
        <button type='primary' onClick={() => load(1)}>Search</button>
        <button onClick={() => { setSearch(''); setFilterCat(null); setFilterSub(null); dispatch(getItems({ includeInactive: true })) }}>Clear</button>
      </div>

      <div className='bg-white rounded-xl shadow-sm border overflow-hidden'>
        <Table
          dataSource={items}
          columns={columns}
          rowKey='id'
          loading={loading}
          pagination={{
            current: itemsPagination.currentPage,
            pageSize: itemsPagination.pageSize,
            total: itemsPagination.total,
            showTotal: (t) => `${t} items`,
            onChange: load
          }}
        />
      </div>

      <PlatiFormStyles />
      <Modal
        title={<span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>{editingItem ? 'Edit Item' : 'New Item'}</span>}
        open={modal}
        onCancel={() => setModal(false)}
        onOk={handleSave}
        okText='Save'
        confirmLoading={saving}
        styles={{ body: { padding: '16px 24px 24px' } }}
      >
        <div className="plati-form">
        <Form form={form} layout='vertical'>
          <Form.Item name='itemName' label='Item Name' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name='categoryId' label='Category' rules={[{ required: true }]}>
            <Select
              placeholder='Select category'
              options={itemCategories.map(c => ({ value: c.id, label: c.name }))}
              onChange={v => { setSelectedCatId(v); form.setFieldValue('subcategoryId', undefined) }}
            />
          </Form.Item>
          <Form.Item name='subcategoryId' label='Subcategory'>
            <Select
              placeholder={selectedCatId ? 'Select subcategory (optional)' : 'Select category first'}
              disabled={!selectedCatId || subOptions.length === 0}
              allowClear
              options={subOptions.map(s => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
          <Form.Item name='uom' label='Unit of Measure' rules={[{ required: true }]}>
            <Select
              options={UOM_OPTIONS.map(u => ({ value: u, label: u }))}
              showSearch
            />
          </Form.Item>
          <Form.Item name='description' label='Description'>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
        </div>
      </Modal>
    </div>
  )
}
