import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, Select, message } from 'antd'
import {
  EnvironmentOutlined, PlusOutlined, EditOutlined, EyeOutlined,
  ShopOutlined, InboxOutlined, DatabaseOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { client } from '../../Utils/axiosClient'

import PageTitle from '../../Core/Components/PageTitle'
import KpiCard from '../../Core/Components/KpiCard'
import StatusBadge from '../../Core/Components/StatusBadge'
import DataTablePagination from '../../Core/Components/DataTablePagination'
import PlatiFormStyles from '../../Core/Components/FormStyles'

const { TextArea } = Input
const { Option } = Select

const InventoryLocationsPage = () => {
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [form] = Form.useForm()

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    try {
      const response = await client.get('/inventory/internal/locations')
      setLocations(response.data.data || [])
    } catch (error) {
      message.error('Failed to fetch locations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLocations() }, [fetchLocations])

  const handleSubmit = async (values) => {
    try {
      if (editingLocation) {
        await client.put(`/inventory/internal/locations/${editingLocation.id}`, values)
        message.success('Location updated')
      } else {
        await client.post('/inventory/internal/locations', values)
        message.success('Location created')
      }
      setModalVisible(false); setEditingLocation(null); form.resetFields(); fetchLocations()
    } catch (error) { message.error('Failed to save location') }
  }

  const openEditModal = (location, e) => {
    e.stopPropagation()
    setEditingLocation(location)
    form.setFieldsValue({ name: location.name, description: location.description, address: location.address, locationType: location.locationType, isActive: location.isActive })
    setModalVisible(true)
  }

  const calculateLocationStats = (summary) => {
    if (!summary || summary.length === 0) return { totalQuantity: 0, totalValue: 0, productCount: 0 }
    return {
      totalQuantity: summary.reduce((s, i) => s + (i.totalQuantity || 0), 0),
      totalValue: summary.reduce((s, i) => s + parseFloat(i.totalValue || 0), 0),
      productCount: summary.reduce((s, i) => s + (i.productCount || 0), 0),
    }
  }

  const overallStats = locations.reduce((acc, loc) => {
    const stats = calculateLocationStats(loc.inventory_summary || [])
    return {
      totalLocations: acc.totalLocations + 1,
      activeLocations: acc.activeLocations + (loc.isActive ? 1 : 0),
      totalItems: acc.totalItems + stats.totalQuantity,
      totalProducts: acc.totalProducts + stats.productCount,
    }
  }, { totalLocations: 0, activeLocations: 0, totalItems: 0, totalProducts: 0 })

  const paginatedLocations = locations.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const columns = [
    {
      key: 'location', title: 'Location',
      render: (record) => {
        const icons = { warehouse: <ShopOutlined />, production: <DatabaseOutlined />, storage: <InboxOutlined /> }
        return (
          <div>
            <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#4a90ff' }}>{icons[record.locationType] || <EnvironmentOutlined />}</span>
              {record.name}
            </div>
            {record.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{record.description}</div>}
            {record.address && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>📍 {record.address}</div>}
          </div>
        )
      },
    },
    {
      key: 'type', title: 'Type', align: 'center',
      render: (record) => {
        const variant = record.locationType === 'warehouse' ? 'inprod' : record.locationType === 'production' ? 'paid' : 'pending'
        return <StatusBadge variant={variant}>{record.locationType?.toUpperCase()}</StatusBadge>
      },
    },
    {
      key: 'areas', title: 'Storage Areas', align: 'center',
      render: (record) => {
        const areas = record.areas || []
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{areas.length}</div>
            {areas.length > 0 && <div style={{ fontSize: 11, color: '#6b7280' }}>{areas.slice(0, 2).map(a => a.areaName).join(', ')}{areas.length > 2 && ` +${areas.length - 2}`}</div>}
          </div>
        )
      },
    },
    {
      key: 'inventory', title: 'Inventory', align: 'center',
      render: (record) => {
        const stats = calculateLocationStats(record.inventory_summary || [])
        return (
          <div style={{ textAlign: 'center', fontSize: 13 }}>
            <div><span style={{ fontWeight: 600, color: '#4a90ff' }}>{stats.totalQuantity}</span> items</div>
            <div style={{ color: '#6b7280' }}>{stats.productCount} products</div>
          </div>
        )
      },
    },
    {
      key: 'status', title: 'Status', align: 'center',
      render: (record) => <StatusBadge variant={record.isActive ? 'paid' : 'outofstock'}>{record.isActive ? 'Active' : 'Inactive'}</StatusBadge>,
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (record) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => navigate(`/inventory-locations/${record.id}`)} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: '#4a90ff', border: 'none', borderRadius: 12,
            padding: 8, fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', whiteSpace: 'nowrap',
          }}><EyeOutlined /> View</button>
          <button onClick={(e) => openEditModal(record, e)} style={{
            background: 'rgba(26,26,26,0.2)', border: 'none', borderRadius: 10, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1a1a1a', fontSize: 14,
          }}><EditOutlined /></button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <PageTitle>Inventory Locations</PageTitle>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button onClick={fetchLocations} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px',
            background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400,
            fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer',
          }}><span style={{ fontSize: 16 }}>↻</span> Refresh</button>
          <button onClick={() => { setEditingLocation(null); form.resetFields(); setModalVisible(true) }} style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px',
            background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500,
            fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', whiteSpace: 'nowrap',
          }}><PlusOutlined style={{ fontSize: 14 }} /> Add Location</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <KpiCard title="Total Locations" value={overallStats.totalLocations} icon={<EnvironmentOutlined />} accentColor="blue" />
        <KpiCard title="Active Locations" value={overallStats.activeLocations} icon={<EnvironmentOutlined />} accentColor="green" />
        <KpiCard title="Total Items in Stock" value={overallStats.totalItems} icon={<InboxOutlined />} accentColor="orange" />
        <KpiCard title="Unique Products" value={overallStats.totalProducts} icon={<DatabaseOutlined />} accentColor="purple" />
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
                    background: '#f3f3f5', padding: '12px 16px', textAlign: col.align || 'left',
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
              ) : paginatedLocations.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No locations found</td></tr>
              ) : (
                paginatedLocations.map((record) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                    onClick={() => navigate(`/inventory-locations/${record.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {columns.map((col, i) => (
                      <td key={col.key} style={{
                        padding: '14px 16px', color: '#1a1a1a', verticalAlign: 'middle',
                        fontSize: 14, fontFamily: "'Inter', sans-serif", lineHeight: '20px',
                        textAlign: col.align, paddingLeft: i === 0 ? 32 : undefined,
                      }}>{col.render(record)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          currentPage={currentPage}
          totalItems={locations.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        />
      </div>

      {/* Create/Edit Modal */}
      <PlatiFormStyles />
      <Modal
        title={<span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>{editingLocation ? 'Edit Location' : 'Create New Location'}</span>}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingLocation(null); form.resetFields() }}
        footer={null} width={600}
        styles={{ body: { padding: '16px 24px 24px' } }}
      >
        <div className="plati-form">
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="name" label="Location Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g., Main Warehouse" />
            </Form.Item>
            <Form.Item name="locationType" label="Location Type" rules={[{ required: true, message: 'Required' }]}>
              <Select placeholder="Select type"><Option value="warehouse">Warehouse</Option><Option value="production">Production Floor</Option><Option value="storage">Storage Area</Option></Select>
            </Form.Item>
            <Form.Item name="description" label="Description">
              <TextArea rows={3} placeholder="Enter description" />
            </Form.Item>
            <Form.Item name="address" label="Address">
              <Input placeholder="Enter address (optional)" />
            </Form.Item>
            {editingLocation && (
              <Form.Item name="isActive" label="Status">
                <Select><Option value={true}>Active</Option><Option value={false}>Inactive</Option></Select>
              </Form.Item>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16 }}>
              <button type="button" onClick={() => setModalVisible(false)} style={{ background: '#e5e5e5', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ background: '#4a90ff', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer' }}>{editingLocation ? 'Update Location' : 'Create Location'}</button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default InventoryLocationsPage
