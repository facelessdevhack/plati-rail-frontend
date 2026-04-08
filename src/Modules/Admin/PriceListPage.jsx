import React, { useState, useEffect, useMemo } from 'react'
import { Modal, Form, Input, message, Popconfirm } from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'

import PageTitle from '../../Core/Components/PageTitle'
import StatusBadge from '../../Core/Components/StatusBadge'
import DataTablePagination from '../../Core/Components/DataTablePagination'
import PlatiFormStyles from '../../Core/Components/FormStyles'

const PriceListPage = () => {
  const navigate = useNavigate()
  const [priceLists, setPriceLists] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingPriceList, setEditingPriceList] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [form] = Form.useForm()

  useEffect(() => { fetchPriceLists() }, [searchText, currentPage, pageSize])

  const fetchPriceLists = async () => {
    setLoading(true)
    try {
      const response = await client.get('/master/price-lists', {
        params: { page: currentPage, limit: pageSize, search: searchText }
      })
      if (response.data?.data) {
        setPriceLists(response.data.data)
        setTotal(response.data.pagination?.total || response.data.data.length)
      }
    } catch (error) {
      message.error('Failed to fetch price lists')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => { setEditingPriceList(null); form.resetFields(); setIsModalVisible(true) }
  const handleEdit = (record) => { setEditingPriceList(record); form.setFieldsValue({ name: record.name }); setIsModalVisible(true) }

  const handleDelete = async (id) => {
    try {
      await client.delete(`/master/price-lists/${id}`)
      message.success('Price list deleted')
      fetchPriceLists()
    } catch (error) { message.error('Failed to delete') }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingPriceList) {
        await client.put(`/master/price-lists/${editingPriceList.id}`, values)
        message.success('Updated successfully')
      } else {
        await client.post('/master/price-lists', values)
        message.success('Created successfully')
      }
      setIsModalVisible(false); fetchPriceLists()
    } catch (error) { message.error('Failed to save') }
  }

  const totalItems = priceLists.reduce((s, l) => s + (parseInt(l.item_count) || 0), 0)

  const columns = [
    {
      key: 'id', title: 'ID',
      render: (record) => <span style={{ fontWeight: 500 }}>{record.id}</span>,
    },
    {
      key: 'name', title: 'Price List Name',
      render: (record) => (
        <button onClick={() => navigate(`/price-lists/edit/${record.id}`)} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500,
          color: '#4a90ff', fontFamily: "'Inter', sans-serif", fontSize: 14, padding: 0,
        }}>{record.name}</button>
      ),
    },
    {
      key: 'count', title: 'Items Count', align: 'center',
      render: (record) => {
        const count = parseInt(record.item_count) || 0
        return <StatusBadge variant={count > 0 ? 'paid' : 'default'}>{count} items</StatusBadge>
      },
    },
    {
      key: 'created', title: 'Created',
      render: (record) => (
        <div style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
          {moment(record.created_at).format('DD MMM YYYY')}<br />
          <span style={{ color: '#9ca3af', fontSize: 12 }}>{moment(record.created_at).format('hh:mm A')}</span>
        </div>
      ),
    },
    {
      key: 'updated', title: 'Updated',
      render: (record) => (
        <div style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
          {moment(record.updated_at).format('DD MMM YYYY')}<br />
          <span style={{ color: '#9ca3af', fontSize: 12 }}>{moment(record.updated_at).format('hh:mm A')}</span>
        </div>
      ),
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (record) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => navigate(`/price-lists/edit/${record.id}`)} title="Edit Prices" style={{
            background: '#4a90ff', border: 'none', borderRadius: 10, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: 14,
          }}><SettingOutlined /></button>
          <Popconfirm title="Delete this price list?" onConfirm={() => handleDelete(record.id)} okText="Yes" okType="danger">
            <button title="Delete" style={{
              background: 'rgba(26,26,26,0.2)', border: 'none', borderRadius: 10, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1a1a1a', fontSize: 14,
            }}><DeleteOutlined /></button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <PageTitle>Price Lists Management</PageTitle>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <span style={{ background: '#d9fae6', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32 }}>
            {priceLists.length} Lists
          </span>
          <span style={{ background: '#dbeafe', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 1234, display: 'flex', alignItems: 'center', height: 32 }}>
            {totalItems} Items
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
        padding: '12px 32px', marginBottom: 16,
        boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text" placeholder="Search price lists..."
            value={searchText}
            onChange={e => { setSearchText(e.target.value); setCurrentPage(1) }}
            style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }}
          />
          <button onClick={fetchPriceLists} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', minWidth: 100, justifyContent: 'center',
            background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400,
            fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', flexShrink: 0,
          }}>
            <span style={{ fontSize: 16 }}>↻</span> Refresh
          </button>
          <button onClick={handleAdd} style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px',
            background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500,
            fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            <PlusOutlined style={{ fontSize: 14 }} /> Add Price List
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'white', border: '1px solid #e5e5e5', borderRadius: 20,
        overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={col.key} style={{
                    background: '#f3f3f5', padding: '12px 16px',
                    textAlign: col.align || 'left',
                    fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14,
                    fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5',
                    whiteSpace: 'nowrap', lineHeight: '20px',
                    paddingLeft: i === 0 ? 32 : undefined,
                  }}>{col.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
              ) : priceLists.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No price lists found</td></tr>
              ) : (
                priceLists.map((record, idx) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {columns.map((col, i) => (
                      <td key={col.key} style={{
                        padding: '14px 16px', color: '#1a1a1a', verticalAlign: 'middle',
                        fontSize: 14, fontFamily: "'Inter', sans-serif", lineHeight: '20px',
                        textAlign: col.align,
                        paddingLeft: i === 0 ? 32 : undefined,
                      }}>
                        {col.render(record)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          currentPage={currentPage}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        />
      </div>

      {/* Add/Edit Modal */}
      <PlatiFormStyles />
      <Modal
        title={<span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>{editingPriceList ? 'Edit Price List' : 'Add New Price List'}</span>}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => { setIsModalVisible(false); form.resetFields() }}
        okText="Save" cancelText="Cancel"
        styles={{ body: { padding: '16px 24px 24px' } }}
      >
        <div className="plati-form">
          <Form form={form} layout="vertical" name="priceListForm">
            <Form.Item label="Price List Name" name="name"
              rules={[{ required: true, message: 'Please input name' }, { min: 2, message: 'Min 2 chars' }]}
            >
              <Input placeholder="Enter price list name" />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default PriceListPage
