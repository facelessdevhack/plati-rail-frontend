import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  Tag,
  Statistic,
  Space,
  message,
  Badge,
  Spin,
  Empty,
  Breadcrumb,
  Input,
  Select,
  Typography,
  Descriptions,
  Tabs,
  Progress,
  Modal,
  Form,
  InputNumber,
  Radio,
  Tooltip
} from 'antd'
import {
  EnvironmentOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  ShopOutlined,
  InboxOutlined,
  DatabaseOutlined,
  SearchOutlined,
  BoxPlotOutlined,
  SwapOutlined,
  FilterOutlined,
  PlusOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { client } from '../../Utils/axiosClient'
import AddInventoryToLocationModal from './AddInventoryToLocationModal'
import TransferInventoryModal from './TransferInventoryModal'
import ManageStorageAreasModal from './ManageStorageAreasModal'
import KpiCard from '../../Core/Components/KpiCard'
import StatusBadge from '../../Core/Components/StatusBadge'
import DataTablePagination from '../../Core/Components/DataTablePagination'
import PlatiFormStyles from '../../Core/Components/FormStyles'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input

const InventoryLocationDetailsPage = () => {
  const { locationId } = useParams()
  const navigate = useNavigate()

  const [location, setLocation] = useState(null)
  const [inventory, setInventory] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('inventory')

  // Filters
  const [searchText, setSearchText] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState(null)

  // Modals
  const [addInventoryModalVisible, setAddInventoryModalVisible] =
    useState(false)
  const [transferModalVisible, setTransferModalVisible] = useState(false)
  const [storageAreasModalVisible, setStorageAreasModalVisible] =
    useState(false)

  // Adjustment Modal
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false)
  const [adjustmentLoading, setAdjustmentLoading] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null)
  const [adjustmentForm] = Form.useForm()

  // Tab table pagination
  const [invPage, setInvPage] = useState(1)
  const [invPageSize, setInvPageSize] = useState(15)
  const [movPage, setMovPage] = useState(1)
  const [movPageSize, setMovPageSize] = useState(15)

  const fetchLocationDetails = useCallback(async () => {
    setLoading(true)
    try {
      const response = await client.get('/inventory/internal/locations')
      const locations = response.data.data || []
      const found = locations.find(loc => loc.id === parseInt(locationId))
      if (found) {
        setLocation(found)
      } else {
        message.error('Location not found')
        navigate('/inventory-locations')
      }
    } catch (error) {
      message.error('Failed to fetch location details')
      console.error('Error fetching location:', error)
    } finally {
      setLoading(false)
    }
  }, [locationId, navigate])

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true)
    try {
      const response = await client.get(
        `/inventory/internal/locations/${locationId}/inventory`
      )
      setInventory(response.data.data?.inventory_items || [])
    } catch (error) {
      message.error('Failed to fetch inventory')
      console.error('Error fetching inventory:', error)
    } finally {
      setInventoryLoading(false)
    }
  }, [locationId])

  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true)
    try {
      const response = await client.get('/inventory/internal/movements', {
        params: { locationId, limit: 100 }
      })
      setMovements(response.data.data?.movements || [])
    } catch (error) {
      message.error('Failed to fetch movements')
      console.error('Error fetching movements:', error)
    } finally {
      setMovementsLoading(false)
    }
  }, [locationId])

  useEffect(() => {
    fetchLocationDetails()
    fetchInventory()
  }, [fetchLocationDetails, fetchInventory])

  useEffect(() => {
    if (activeTab === 'movements' && movements.length === 0) {
      fetchMovements()
    }
  }, [activeTab, movements.length, fetchMovements])

  const getLocationTypeColor = type => {
    const colors = {
      warehouse: 'blue',
      production: 'green',
      storage: 'orange'
    }
    return colors[type] || 'default'
  }

  const getLocationTypeIcon = type => {
    const icons = {
      warehouse: <ShopOutlined />,
      production: <DatabaseOutlined />,
      storage: <InboxOutlined />
    }
    return icons[type] || <EnvironmentOutlined />
  }

  const getMovementTypeConfig = type => {
    const config = {
      in: { color: 'green', label: 'Stock In' },
      out: { color: 'red', label: 'Stock Out' },
      transfer_in: { color: 'cyan', label: 'Transfer In' },
      transfer_out: { color: 'orange', label: 'Transfer Out' },
      adjustment: { color: 'purple', label: 'Adjustment' },
      reservation: { color: 'gold', label: 'Reservation' },
      release: { color: 'lime', label: 'Release' }
    }
    return config[type] || { color: 'default', label: type }
  }

  // Adjustment Modal Handlers
  const openAdjustmentModal = record => {
    setSelectedInventoryItem(record)
    adjustmentForm.setFieldsValue({
      productType: record.productType,
      productId: record.productId,
      adjustmentType: 'increase',
      quantity: 1,
      reason: '',
      notes: ''
    })
    setAdjustmentModalVisible(true)
  }

  const handleAdjustmentSubmit = async () => {
    try {
      const values = await adjustmentForm.validateFields()
      setAdjustmentLoading(true)

      await client.post('/inventory/internal/adjustment', {
        productType: values.productType,
        productId: values.productId,
        adjustmentType: values.adjustmentType,
        quantity: values.quantity,
        reason: values.reason,
        notes: values.notes
      })

      message.success('Inventory adjustment completed successfully')
      setAdjustmentModalVisible(false)
      adjustmentForm.resetFields()
      setSelectedInventoryItem(null)
      fetchInventory()
      if (activeTab === 'movements') {
        fetchMovements()
      }
    } catch (error) {
      console.error('Adjustment error:', error)
      message.error(
        error.response?.data?.message || 'Failed to create adjustment'
      )
    } finally {
      setAdjustmentLoading(false)
    }
  }

  // Filter inventory based on search and product type
  const filteredInventory = inventory.filter(item => {
    // Backend adds product_details (snake_case), handle both cases
    const details = item.productDetails || item.product_details
    const productName =
      item.productType === 'alloy'
        ? details?.productName || details?.product_name || ''
        : details?.brand
        ? `${details.brand} ${details.size || ''}`
        : ''

    const matchesSearch =
      !searchText ||
      item.productId?.toString().includes(searchText) ||
      item.productType?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.areaName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.positionName?.toLowerCase().includes(searchText.toLowerCase()) ||
      productName.toLowerCase().includes(searchText.toLowerCase())

    const matchesProductType =
      !productTypeFilter || item.productType === productTypeFilter

    return matchesSearch && matchesProductType
  })

  // Calculate stats
  const inventoryStats = {
    totalItems: inventory.reduce((sum, item) => sum + (item.quantity || 0), 0),
    totalReserved: inventory.reduce(
      (sum, item) => sum + (item.reservedQuantity || 0),
      0
    ),
    totalAvailable: inventory.reduce(
      (sum, item) => sum + (item.availableQuantity || 0),
      0
    ),
    uniqueProducts: new Set(
      inventory.map(item => `${item.productType}-${item.productId}`)
    ).size,
    alloyCount: inventory.filter(item => item.productType === 'alloy').length,
    tyreCount: inventory.filter(item => item.productType === 'tyre').length
  }

  const inventoryColumns = [
    {
      title: 'Product',
      key: 'product',
      render: record => {
        // Backend adds product_details (snake_case), handle both cases
        const details = record.productDetails || record.product_details
        const productName =
          record.productType === 'alloy'
            ? details?.productName || details?.product_name
            : details?.brand
            ? `${details.brand} ${details.size || ''}`.trim()
            : null

        return (
          <div>
            <div style={{ marginBottom: '4px' }}>
              <Tag color={record.productType === 'alloy' ? 'blue' : 'green'}>
                {record.productType?.toUpperCase()}
              </Tag>
              <span
                style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}
              >
                #{record.productId}
              </span>
            </div>
            {productName && (
              <div style={{ fontWeight: 500, fontSize: '13px' }}>
                {productName}
              </div>
            )}
          </div>
        )
      },
      width: 280
    },
    {
      title: 'Storage Location',
      key: 'storage',
      render: record => (
        <div>
          {record.areaName ? (
            <>
              <div style={{ fontWeight: 500 }}>{record.areaName}</div>
              {record.positionName && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Position: {record.positionName}
                </div>
              )}
            </>
          ) : (
            <Text type='secondary'>Default Area</Text>
          )}
        </div>
      ),
      width: 180
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: record => (
        <div>
          <div
            style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}
          >
            {record.quantity || 0}
          </div>
        </div>
      ),
      width: 100,
      align: 'center'
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reserved',
      render: val => (
        <Tag color={val > 0 ? 'orange' : 'default'}>{val || 0}</Tag>
      ),
      width: 100,
      align: 'center'
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'available',
      render: val => <Tag color={val > 0 ? 'green' : 'red'}>{val || 0}</Tag>,
      width: 100,
      align: 'center'
    },
    {
      title: 'Cost/Unit',
      dataIndex: 'costPerUnit',
      key: 'costPerUnit',
      render: val => (val ? `₹${parseFloat(val).toLocaleString()}` : '-'),
      width: 120,
      align: 'right'
    },
    {
      title: 'Total Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      render: val => (val ? `₹${parseFloat(val).toLocaleString()}` : '-'),
      width: 140,
      align: 'right'
    },
    {
      title: 'Action',
      key: 'action',
      render: record => (
        <Button
          type='link'
          size='small'
          onClick={() => openAdjustmentModal(record)}
        >
          Adjust
        </Button>
      ),
      width: 80,
      align: 'center',
      fixed: 'right'
    }
  ]

  const movementsColumns = [
    {
      title: 'Date/Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => (date ? new Date(date).toLocaleString() : '-'),
      width: 170
    },
    {
      title: 'Type',
      dataIndex: 'movementType',
      key: 'movementType',
      render: type => {
        const config = getMovementTypeConfig(type)
        return <Tag color={config.color}>{config.label}</Tag>
      },
      width: 120
    },
    {
      title: 'Product',
      key: 'product',
      render: record => (
        <div>
          <Tag
            color={record.productType === 'alloy' ? 'blue' : 'green'}
            style={{ marginRight: '4px' }}
          >
            {record.productType?.toUpperCase()}
          </Tag>
          <span>#{record.productId}</span>
        </div>
      ),
      width: 150
    },
    {
      title: 'Change',
      dataIndex: 'quantityChange',
      key: 'quantityChange',
      render: (val, record) => {
        const isPositive = ['in', 'transfer_in', 'release'].includes(
          record.movementType
        )
        return (
          <span
            style={{
              fontWeight: 'bold',
              color: isPositive ? '#52c41a' : '#ff4d4f',
              fontSize: '14px'
            }}
          >
            {isPositive ? '+' : '-'}
            {Math.abs(val)}
          </span>
        )
      },
      width: 100,
      align: 'center'
    },
    {
      title: 'Previous → New',
      key: 'quantity_change',
      render: record => (
        <span style={{ color: '#666' }}>
          {record.previousQuantity} → {record.newQuantity}
        </span>
      ),
      width: 120
    },
    {
      title: 'Reference',
      key: 'reference',
      render: record => (
        <div>
          <Tag>{record.referenceType || 'N/A'}</Tag>
          {record.referenceId && (
            <span
              style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}
            >
              #{record.referenceId}
            </span>
          )}
        </div>
      ),
      width: 150
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      width: 200
    }
  ]

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size='large' />
      </div>
    )
  }

  if (!location) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description='Location not found' />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button
            type='primary'
            onClick={() => navigate('/inventory-locations')}
          >
            Back to Locations
          </Button>
        </div>
      </div>
    )
  }

  const paginatedInventory = filteredInventory.slice((invPage - 1) * invPageSize, invPage * invPageSize)
  const paginatedMovements = movements.slice((movPage - 1) * movPageSize, movPage * movPageSize)

  const renderInventoryTable = () => (
    <div>
      {/* Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 24px' }}>
        <input type="text" placeholder="Search product, ID, area..." value={searchText} onChange={e => setSearchText(e.target.value)}
          style={{ flex: 1, height: 36, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 14px', fontSize: 14, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }} />
        <Select placeholder="Product Type" allowClear value={productTypeFilter} onChange={setProductTypeFilter} style={{ width: 140, height: 36 }} className="plati-filter-dealer"
          options={[{ value: 'alloy', label: 'Alloy' }, { value: 'tyre', label: 'Tyre' }]} />
      </div>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Product', 'Storage Location', 'Quantity', 'Reserved', 'Available', 'Cost/Unit', 'Total Value', 'Action'].map((h, i) => (
                <th key={h} style={{
                  background: '#f3f3f5', padding: '10px 14px', textAlign: ['Quantity', 'Reserved', 'Available', 'Action'].includes(h) ? 'center' : ['Cost/Unit', 'Total Value'].includes(h) ? 'right' : 'left',
                  fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 13, fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5', whiteSpace: 'nowrap',
                  paddingLeft: i === 0 ? 24 : undefined,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inventoryLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
            ) : paginatedInventory.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No inventory items</td></tr>
            ) : paginatedInventory.map(record => {
              const details = record.productDetails || record.product_details
              const productName = record.productType === 'alloy' ? (details?.productName || details?.product_name) : details?.brand ? `${details.brand} ${details.size || ''}`.trim() : null
              return (
                <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', paddingLeft: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: record.productType === 'alloy' ? '#dbeafe' : '#d9fae6', color: record.productType === 'alloy' ? '#4a90ff' : '#15803d' }}>{record.productType?.toUpperCase()}</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>#{record.productId}</span>
                    </div>
                    {productName && <div style={{ fontWeight: 500, fontSize: 13 }}>{productName}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                    {record.areaName ? <><div style={{ fontWeight: 500, fontSize: 13 }}>{record.areaName}</div>{record.positionName && <div style={{ fontSize: 11, color: '#9ca3af' }}>Position: {record.positionName}</div>}</> : <span style={{ color: '#9ca3af' }}>Default Area</span>}
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#4a90ff' }}>{record.quantity || 0}</td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 33554400, fontSize: 12, background: (record.reservedQuantity || 0) > 0 ? '#fff7ed' : '#f3f3f5', color: (record.reservedQuantity || 0) > 0 ? '#f26c2d' : '#9ca3af', border: `1px solid ${(record.reservedQuantity || 0) > 0 ? 'rgba(242,108,45,0.2)' : 'rgba(160,160,168,0.3)'}` }}>{record.reservedQuantity || 0}</span>
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 33554400, fontSize: 12, background: (record.availableQuantity || 0) > 0 ? '#d9fae6' : '#fef2f2', color: (record.availableQuantity || 0) > 0 ? '#15803d' : '#e53e3e', border: `1px solid ${(record.availableQuantity || 0) > 0 ? 'rgba(78,203,113,0.2)' : 'rgba(229,62,62,0.2)'}` }}>{record.availableQuantity || 0}</span>
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'right', fontSize: 13 }}>{record.costPerUnit ? `₹${parseFloat(record.costPerUnit).toLocaleString()}` : '-'}</td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'right', fontSize: 13, fontWeight: 500 }}>{record.totalValue ? `₹${parseFloat(record.totalValue).toLocaleString()}` : '-'}</td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <button onClick={() => openAdjustmentModal(record)} style={{ background: '#4a90ff', border: 'none', borderRadius: 10, padding: '5px 12px', fontSize: 12, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer' }}>Adjust</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <DataTablePagination currentPage={invPage} totalItems={filteredInventory.length} pageSize={invPageSize} onPageChange={setInvPage} onPageSizeChange={s => { setInvPageSize(s); setInvPage(1) }} />
    </div>
  )

  const renderMovementsTable = () => (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Date/Time', 'Type', 'Product', 'Change', 'Prev → New', 'Reference', 'Notes'].map((h, i) => (
                <th key={h} style={{
                  background: '#f3f3f5', padding: '10px 14px', textAlign: h === 'Change' ? 'center' : 'left',
                  fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 13, fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5', whiteSpace: 'nowrap',
                  paddingLeft: i === 0 ? 24 : undefined,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movementsLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
            ) : paginatedMovements.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No movements recorded</td></tr>
            ) : paginatedMovements.map(record => {
              const config = getMovementTypeConfig(record.movementType)
              const isPositive = ['in', 'transfer_in', 'release'].includes(record.movementType)
              return (
                <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', paddingLeft: 24, whiteSpace: 'nowrap', fontSize: 12 }}>
                    {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}<br />
                    <span style={{ color: '#9ca3af', fontSize: 11 }}>{record.createdAt ? new Date(record.createdAt).toLocaleTimeString() : ''}</span>
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 33554400, fontSize: 11, fontWeight: 500, color: '#1a1a1a',
                      background: config.bgColor, border: `1px solid ${config.color === 'green' ? 'rgba(78,203,113,0.2)' : config.color === 'red' ? 'rgba(229,62,62,0.2)' : 'rgba(74,144,255,0.2)'}`,
                      textTransform: 'capitalize',
                    }}><span style={{ fontSize: 10 }}>{config.icon}</span> {config.label?.toLowerCase()}</span>
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: record.productType === 'alloy' ? '#dbeafe' : '#d9fae6', color: record.productType === 'alloy' ? '#4a90ff' : '#15803d' }}>{record.productType?.toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>#{record.productId}</span>
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center', fontWeight: 700, fontSize: 14, color: isPositive ? '#4ecb71' : '#e53e3e' }}>
                    {isPositive ? '+' : '-'}{Math.abs(record.quantityChange)}
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: 12, color: '#6b7280' }}>
                    {record.previousQuantity} → {record.newQuantity}
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 500, background: '#f3f3f5', color: '#6b7280', textTransform: 'capitalize' }}>{(record.referenceType || 'N/A').replace(/_/g, ' ')}</span>
                    {record.referenceId && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>#{record.referenceId}</span>}
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                    <Tooltip title={record.notes || 'No notes'} placement="topLeft">
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 8, fontSize: 12,
                        background: record.notes ? '#f9fafb' : 'transparent',
                        border: record.notes ? '1px solid #e5e5e5' : 'none',
                        color: record.notes ? '#374151' : '#d1d5db',
                        width: '100%', overflow: 'hidden',
                        cursor: record.notes ? 'pointer' : 'default',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        {record.notes ? (
                          <>
                            <span style={{ flexShrink: 0 }}>📝</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.notes}</span>
                          </>
                        ) : '—'}
                      </div>
                    </Tooltip>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <DataTablePagination currentPage={movPage} totalItems={movements.length} pageSize={movPageSize} onPageChange={setMovPage} onPageSizeChange={s => { setMovPageSize(s); setMovPage(1) }} />
    </div>
  )

  const tabItems = [
    { key: 'inventory', children: renderInventoryTable() },
    { key: 'movements', children: renderMovementsTable() },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Staff Wide Test', serif", fontSize: 42, fontWeight: 400, color: '#1a1a1a', margin: '0 0 8px', lineHeight: '30px' }}>
            {location.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <StatusBadge variant={location.locationType === 'warehouse' ? 'inprod' : location.locationType === 'production' ? 'paid' : 'pending'}>{location.locationType?.toUpperCase()}</StatusBadge>
            <StatusBadge variant={location.isActive ? 'paid' : 'outofstock'}>{location.isActive ? 'Active' : 'Inactive'}</StatusBadge>
          </div>
          {location.description && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(26,26,26,0.6)' }}>{location.description}</div>}
          {location.address && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#9ca3af', marginTop: 2 }}>📍 {location.address}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setAddInventoryModalVisible(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 16px', background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}><PlusOutlined style={{ fontSize: 14 }} /> Add Inventory</button>
          <button onClick={() => setTransferModalVisible(true)} disabled={inventory.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', whiteSpace: 'nowrap', opacity: inventory.length === 0 ? 0.4 : 1 }}><SwapOutlined style={{ fontSize: 14 }} /> Transfer</button>
          <button onClick={() => setStorageAreasModalVisible(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer', whiteSpace: 'nowrap' }}><AppstoreOutlined style={{ fontSize: 14 }} /> Storage Areas</button>
          <button onClick={() => { fetchLocationDetails(); fetchInventory() }} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}><span style={{ fontSize: 16 }}>↻</span> Refresh</button>
          <button onClick={() => navigate('/inventory-locations')} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}><ArrowLeftOutlined style={{ fontSize: 14 }} /> Back</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard title="Total Items" value={inventoryStats.totalItems} icon={<BoxPlotOutlined />} accentColor="blue" />
        <KpiCard title="Available" value={inventoryStats.totalAvailable} accentColor="green" />
        <KpiCard title="Reserved" value={inventoryStats.totalReserved} accentColor="orange" />
        <KpiCard title="Unique Products" value={inventoryStats.uniqueProducts} icon={<DatabaseOutlined />} accentColor="purple" />
        <KpiCard title="Alloys" value={inventoryStats.alloyCount} accentColor="blue" />
        <KpiCard title="Tyres" value={inventoryStats.tyreCount} accentColor="green" />
      </div>

      {/* Info Bar */}
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 16, padding: '12px 24px', marginBottom: 16, display: 'flex', gap: 24, fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#6b7280' }}>
        <span><strong>Storage Areas:</strong> {location.areas?.length || 0}</span>
        <span><strong>Created:</strong> {location.createdAt ? new Date(location.createdAt).toLocaleDateString() : '-'}</span>
        <span><strong>Updated:</strong> {location.updatedAt ? new Date(location.updatedAt).toLocaleDateString() : '-'}</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #a0a0a8', marginBottom: 16 }}>
        {[{ key: 'inventory', label: 'Inventory' }, { key: 'movements', label: 'Movements' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #f55e34' : '1px solid transparent',
            marginBottom: -1, padding: '12px 24px', fontFamily: "'Inter', sans-serif", fontSize: 16,
            fontWeight: activeTab === tab.key ? 600 : 400, color: '#1a1a1a', cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: '24px',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Tab Content - wrapped in card */}
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)', padding: 0 }}>
        {tabItems.find(t => t.key === activeTab)?.children}
      </div>

      {/* Add Inventory Modal */}
      <AddInventoryToLocationModal
        visible={addInventoryModalVisible}
        onCancel={() => setAddInventoryModalVisible(false)}
        onSuccess={() => {
          setAddInventoryModalVisible(false)
          fetchInventory()
          fetchLocationDetails()
        }}
        locationId={locationId}
        locationName={location?.name}
        storageAreas={location?.areas || []}
      />

      {/* Transfer Inventory Modal */}
      <TransferInventoryModal
        visible={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        onSuccess={() => {
          setTransferModalVisible(false)
          fetchInventory()
          fetchLocationDetails()
          if (activeTab === 'movements') {
            fetchMovements()
          }
        }}
        sourceLocationId={locationId}
        sourceLocationName={location?.name}
        inventoryItems={inventory}
      />

      {/* Manage Storage Areas Modal */}
      <ManageStorageAreasModal
        visible={storageAreasModalVisible}
        onCancel={() => setStorageAreasModalVisible(false)}
        onSuccess={() => {
          fetchLocationDetails()
        }}
        locationId={locationId}
        locationName={location?.name}
        storageAreas={location?.areas || []}
      />

      {/* Inventory Adjustment Modal */}
      <PlatiFormStyles />
      <Modal
        title={<span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>Manual Inventory Adjustment</span>}
        open={adjustmentModalVisible}
        onCancel={() => {
          setAdjustmentModalVisible(false)
          adjustmentForm.resetFields()
          setSelectedInventoryItem(null)
        }}
        footer={null}
        width={500}
        destroyOnClose
        styles={{ body: { padding: '16px 24px 24px' } }}
      >
        <div className="plati-form">
        <Form
          form={adjustmentForm}
          layout='vertical'
          onFinish={handleAdjustmentSubmit}
        >
          <Form.Item label='Product'>
            <Input
              value={
                selectedInventoryItem
                  ? `${selectedInventoryItem.productType?.toUpperCase()} #${selectedInventoryItem.productId} - ${
                      (selectedInventoryItem.productDetails ||
                        selectedInventoryItem.product_details)?.productName ||
                      (selectedInventoryItem.productDetails ||
                        selectedInventoryItem.product_details)?.product_name ||
                      (selectedInventoryItem.productDetails ||
                        selectedInventoryItem.product_details)?.brand ||
                      'Unknown'
                    }`
                  : ''
              }
              disabled
            />
          </Form.Item>

          <Form.Item name='productType' hidden>
            <Input />
          </Form.Item>

          <Form.Item name='productId' hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name='adjustmentType'
            label='Adjustment Type'
            rules={[
              { required: true, message: 'Please select adjustment type' }
            ]}
          >
            <Radio.Group>
              <Radio.Button value='increase'>
                <span style={{ color: '#52c41a' }}>+ Increase Stock</span>
              </Radio.Button>
              <Radio.Button value='decrease'>
                <span style={{ color: '#ff4d4f' }}>- Decrease Stock</span>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name='quantity'
            label='Quantity'
            rules={[
              { required: true, message: 'Please enter quantity' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1' }
            ]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder='Enter quantity to adjust'
            />
          </Form.Item>

          <Form.Item
            name='reason'
            label='Reason for Adjustment'
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <Select placeholder='Select reason for adjustment'>
              <Option value='Stock Count Correction'>
                Stock Count Correction
              </Option>
              <Option value='Damaged Goods'>Damaged Goods</Option>
              <Option value='Lost/Missing'>Lost/Missing</Option>
              <Option value='Found Stock'>Found Stock</Option>
              <Option value='System Error Correction'>
                System Error Correction
              </Option>
              <Option value='Return to Supplier'>Return to Supplier</Option>
              <Option value='Quality Issue'>Quality Issue</Option>
              <Option value='Other'>Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name='notes' label='Additional Notes'>
            <Input.TextArea
              rows={3}
              placeholder='Enter any additional details about this adjustment...'
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16 }}>
            <button type="button" onClick={() => { setAdjustmentModalVisible(false); adjustmentForm.resetFields(); setSelectedInventoryItem(null) }} style={{ background: '#e5e5e5', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ background: '#4a90ff', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', opacity: adjustmentLoading ? 0.5 : 1 }}>{adjustmentLoading ? 'Submitting...' : 'Submit Adjustment'}</button>
          </div>
        </Form>
        </div>
      </Modal>
    </div>
  )
}

export default InventoryLocationDetailsPage
