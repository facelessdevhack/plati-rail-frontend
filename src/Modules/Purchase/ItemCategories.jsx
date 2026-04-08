import PageTitle from "../../Core/Components/PageTitle"
import PlatiFormStyles from "../../Core/Components/FormStyles"
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Table, Button, Modal, Form, Input, Tag, Space, message, Popconfirm, Collapse, Tabs
} from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import {
  getItemCategories, createItemCategory, updateItemCategory, toggleItemCategoryActive,
  getItemSubcategories, createItemSubcategory, updateItemSubcategory, toggleSubcategoryActive
} from '../../redux/api/purchaseV2API'

const { Panel } = Collapse
const { TabPane } = Tabs

export default function ItemCategories() {
  const dispatch = useDispatch()
  const { itemCategories, itemSubcategories } = useSelector(s => s.purchaseV2)

  const [catModal, setCatModal] = useState(false)
  const [subModal, setSubModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [editingSub, setEditingSub] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [catForm] = Form.useForm()
  const [subForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    dispatch(getItemCategories({ includeInactive: true }))
    dispatch(getItemSubcategories({ includeInactive: true }))
  }, [])

  const openCatModal = (cat = null) => {
    setEditingCat(cat)
    catForm.setFieldsValue(cat ? { name: cat.name, description: cat.description } : {})
    setCatModal(true)
  }

  const openSubModal = (categoryId, sub = null) => {
    setSelectedCategoryId(categoryId)
    setEditingSub(sub)
    subForm.setFieldsValue(sub ? { name: sub.name, description: sub.description } : {})
    setSubModal(true)
  }

  const handleCatSave = async () => {
    const values = await catForm.validateFields()
    setLoading(true)
    if (editingCat) {
      await dispatch(updateItemCategory({ id: editingCat.id, ...values }))
    } else {
      await dispatch(createItemCategory(values))
    }
    await dispatch(getItemCategories({ includeInactive: true }))
    setLoading(false)
    setCatModal(false)
    message.success(editingCat ? 'Category updated' : 'Category created')
  }

  const handleSubSave = async () => {
    const values = await subForm.validateFields()
    setLoading(true)
    if (editingSub) {
      await dispatch(updateItemSubcategory({ id: editingSub.id, ...values }))
    } else {
      await dispatch(createItemSubcategory({ ...values, categoryId: selectedCategoryId }))
    }
    await dispatch(getItemSubcategories({ includeInactive: true }))
    setLoading(false)
    setSubModal(false)
    message.success(editingSub ? 'Subcategory updated' : 'Subcategory created')
  }

  const catColumns = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      render: (v, r) => <span className={!r.isActive ? 'text-gray-400 line-through' : 'font-semibold'}>{v}</span>
    },
    { title: 'Description', dataIndex: 'description', render: v => v || '-' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: v => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Actions',
      render: (_, r) => (
        <Space>
          <button size='small' icon={<EditOutlined />} onClick={() => openCatModal(r)}>Edit</button>
          <button size='small' icon={<PlusOutlined />} onClick={() => openSubModal(r.id)}>Add Sub</button>
          <Popconfirm title={`${r.isActive ? 'Deactivate' : 'Activate'} this category?`}
            onConfirm={async () => { await dispatch(toggleItemCategoryActive(r.id)); dispatch(getItemCategories({ includeInactive: true })) }}>
            <button size='small'>{r.isActive ? 'Deactivate' : 'Activate'}</button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const getSubsForCategory = (catId) => itemSubcategories.filter(s => s.categoryId === catId)

  const subColumns = (catId) => [
    {
      title: 'Subcategory Name',
      dataIndex: 'name',
      render: (v, r) => <span className={!r.isActive ? 'text-gray-400 line-through' : ''}>{v}</span>
    },
    { title: 'Description', dataIndex: 'description', render: v => v || '-' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: v => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Actions',
      render: (_, r) => (
        <Space>
          <button size='small' icon={<EditOutlined />} onClick={() => openSubModal(catId, r)}>Edit</button>
          <Popconfirm title={`${r.isActive ? 'Deactivate' : 'Activate'} this subcategory?`}
            onConfirm={async () => { await dispatch(toggleSubcategoryActive(r.id)); dispatch(getItemSubcategories({ includeInactive: true })) }}>
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
          <h1 style={{ fontFamily: "'Staff Wide Test', serif", fontSize: 42, fontWeight: 400, color: '#1a1a1a', margin: 0, lineHeight: '30px' }}>Item Categories</h1>
          <p className='text-gray-500 text-sm'>Manage categories and subcategories for the items catalog</p>
        </div>
        <button onClick={() => openCatModal()} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer' }}>Add Category</button>
      </div>

      <div className='bg-white rounded-xl shadow-sm border overflow-hidden'>
        <Table
          dataSource={itemCategories}
          columns={catColumns}
          rowKey='id'
          expandable={{
            expandedRowRender: r => (
              <div className='p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='font-semibold text-gray-600'>Subcategories of "{r.name}"</span>
                  <button size='small' icon={<PlusOutlined />} onClick={() => openSubModal(r.id)}>Add Subcategory</button>
                </div>
                <Table
                  dataSource={getSubsForCategory(r.id)}
                  columns={subColumns(r.id)}
                  rowKey='id'
                  pagination={false}
                  size='small'
                  locale={{ emptyText: 'No subcategories yet' }}
                />
              </div>
            )
          }}
        />
      </div>

      <PlatiFormStyles />
      {/* Category Modal */}
      <Modal title={<span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>{editingCat ? 'Edit Category' : 'New Category'}</span>} open={catModal} onCancel={() => setCatModal(false)}
        onOk={handleCatSave} okText='Save' confirmLoading={loading} styles={{ body: { padding: '16px 24px 24px' } }}>
        <div className="plati-form">
        <Form form={catForm} layout='vertical'>
          <Form.Item name='name' label='Category Name' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name='description' label='Description'>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
        </div>
      </Modal>

      {/* Subcategory Modal */}
      <Modal title={<span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>{editingSub ? 'Edit Subcategory' : 'New Subcategory'}</span>} open={subModal} onCancel={() => setSubModal(false)}
        onOk={handleSubSave} okText='Save' confirmLoading={loading} styles={{ body: { padding: '16px 24px 24px' } }}>
        <div className="plati-form">
        <Form form={subForm} layout='vertical'>
          <Form.Item name='name' label='Subcategory Name' rules={[{ required: true }]}>
            <Input />
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
