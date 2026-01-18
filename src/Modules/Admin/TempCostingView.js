import React, { useEffect, useState, useMemo } from 'react'
import {
  Table,
  Select,
  Input,
  Button,
  message,
  InputNumber,
  Space,
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  Alert
} from 'antd'
import {
  SaveOutlined,
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
  FilterOutlined
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { client } from '../../Utils/axiosClient'

const TempCostingView = () => {
  const { user } = useSelector(state => state.userDetails)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sizes, setSizes] = useState([])
  const [selectedSize, setSelectedSize] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [editedCosts, setEditedCosts] = useState({}) // Track edited costs: { productId: newCost }
  const [bulkCostValue, setBulkCostValue] = useState(null) // Bulk cost value input
  const [excludedFinishes, setExcludedFinishes] = useState([]) // Finishes to exclude

  // Check if user is allowed (userId 4 only)
  const isAllowed = user?.userId === 4 || user?.id === 4
  console.log(user, 'user')

  useEffect(() => {
    if (isAllowed) {
      fetchSizes()
      fetchProducts()
    }
  }, [isAllowed])

  const fetchSizes = async () => {
    try {
      const response = await client.get('/alloys/sizes')
      setSizes(response.data || [])
    } catch (error) {
      console.error('Error fetching sizes:', error)
      message.error('Failed to fetch sizes')
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await client.get('/alloys/stock/management', {
        params: { page: 1, limit: 10000 } // Get all products
      })
      setProducts(response.data.data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      message.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  // Get unique finishes for the exclude filter
  const finishOptions = useMemo(() => {
    const finishes = [...new Set(products.map(p => p.finish).filter(Boolean))]
    return finishes.sort().map(finish => ({ label: finish, value: finish }))
  }, [products])

  // Filter products by size, search text, and excluded finishes
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filter by size (inches)
      if (selectedSize) {
        const productInches = product.inches || product.size
        if (String(productInches) !== String(selectedSize)) {
          return false
        }
      }

      // Exclude selected finishes
      if (excludedFinishes.length > 0) {
        const productFinish = product.finish || ''
        if (excludedFinishes.includes(productFinish)) {
          return false
        }
      }

      // Filter by search text
      if (searchText) {
        const search = searchText.toLowerCase()
        return (
          (product.productName &&
            product.productName.toLowerCase().includes(search)) ||
          (product.product_name &&
            product.product_name.toLowerCase().includes(search)) ||
          (product.uniqueId &&
            product.uniqueId.toLowerCase().includes(search)) ||
          (product.unique_id &&
            product.unique_id.toLowerCase().includes(search)) ||
          (product.model && product.model.toLowerCase().includes(search)) ||
          (product.finish && product.finish.toLowerCase().includes(search))
        )
      }

      return true
    })
  }, [products, selectedSize, searchText, excludedFinishes])

  // Handle cost change for a product
  const handleCostChange = (productId, newCost) => {
    setEditedCosts(prev => ({
      ...prev,
      [productId]: newCost
    }))
  }

  // Get display cost (edited or original)
  const getDisplayCost = product => {
    if (editedCosts.hasOwnProperty(product.id)) {
      return editedCosts[product.id]
    }
    return product.costing || 0
  }

  // Save a single product's costing
  const saveSingleCost = async product => {
    const newCost = editedCosts[product.id]
    if (newCost === undefined) {
      message.warning('No changes to save')
      return
    }

    setSaving(true)
    try {
      await client.put(`/alloys/stock/update-costing/${product.id}`, {
        costing: newCost
      })

      // Update local state
      setProducts(prev =>
        prev.map(p => (p.id === product.id ? { ...p, costing: newCost } : p))
      )

      // Remove from edited costs
      setEditedCosts(prev => {
        const updated = { ...prev }
        delete updated[product.id]
        return updated
      })

      message.success(
        `Updated costing for ${product.productName || product.product_name}`
      )
    } catch (error) {
      console.error('Error updating costing:', error)
      message.error('Failed to update costing')
    } finally {
      setSaving(false)
    }
  }

  // Apply bulk cost to all filtered products
  const applyBulkCost = () => {
    if (bulkCostValue === null || bulkCostValue === undefined) {
      message.warning('Please enter a bulk cost value')
      return
    }
    if (filteredProducts.length === 0) {
      message.warning('No products to apply bulk cost to')
      return
    }

    const newEditedCosts = { ...editedCosts }
    filteredProducts.forEach(product => {
      newEditedCosts[product.id] = bulkCostValue
    })
    setEditedCosts(newEditedCosts)
    message.success(
      `Applied ₹${bulkCostValue.toLocaleString()} to ${filteredProducts.length} products. Click "Save All Changes" to save.`
    )
  }

  // Save all edited costs
  const saveAllCosts = async () => {
    const editedIds = Object.keys(editedCosts)
    if (editedIds.length === 0) {
      message.warning('No changes to save')
      return
    }

    setSaving(true)
    let successCount = 0
    let failCount = 0

    for (const productId of editedIds) {
      try {
        await client.put(`/alloys/stock/update-costing/${productId}`, {
          costing: editedCosts[productId]
        })
        successCount++
      } catch (error) {
        console.error(`Error updating product ${productId}:`, error)
        failCount++
      }
    }

    // Refresh products
    await fetchProducts()
    setEditedCosts({})

    if (failCount === 0) {
      message.success(`Successfully updated ${successCount} products`)
    } else {
      message.warning(`Updated ${successCount} products, ${failCount} failed`)
    }
    setSaving(false)
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredProducts.length
    const withCosting = filteredProducts.filter(
      p => p.costing && p.costing > 0
    ).length
    const withoutCosting = total - withCosting
    const pendingChanges = Object.keys(editedCosts).length

    return { total, withCosting, withoutCosting, pendingChanges }
  }, [filteredProducts, editedCosts])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      width: 250,
      render: (text, record) => text || record.product_name || 'N/A',
      sorter: (a, b) =>
        (a.productName || a.product_name || '').localeCompare(
          b.productName || b.product_name || ''
        )
    },
    {
      title: 'Unique ID',
      dataIndex: 'uniqueId',
      key: 'uniqueId',
      width: 120,
      render: (text, record) => text || record.unique_id || 'N/A'
    },
    {
      title: 'Inches',
      dataIndex: 'inches',
      key: 'inches',
      width: 80,
      render: (text, record) => text || record.size || 'N/A',
      sorter: (a, b) => (a.inches || a.size || 0) - (b.inches || b.size || 0)
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 120,
      render: text => text || 'N/A'
    },
    {
      title: 'Finish',
      dataIndex: 'finish',
      key: 'finish',
      width: 120,
      render: text => text || 'N/A'
    },
    {
      title: 'In-House Stock',
      dataIndex: 'inHouseStock',
      key: 'inHouseStock',
      width: 100,
      render: (text, record) => text ?? record.in_house_stock ?? 0,
      sorter: (a, b) =>
        (a.inHouseStock || a.in_house_stock || 0) -
        (b.inHouseStock || b.in_house_stock || 0)
    },
    {
      title: 'Current Costing',
      dataIndex: 'costing',
      key: 'currentCosting',
      width: 120,
      render: text => (
        <span style={{ color: text ? '#52c41a' : '#ff4d4f' }}>
          {text ? `₹${text.toLocaleString()}` : 'Not Set'}
        </span>
      ),
      sorter: (a, b) => (a.costing || 0) - (b.costing || 0)
    },
    {
      title: 'New Costing',
      key: 'newCosting',
      width: 150,
      render: (_, record) => {
        const isEdited = editedCosts.hasOwnProperty(record.id)
        return (
          <InputNumber
            value={getDisplayCost(record)}
            onChange={value => handleCostChange(record.id, value)}
            min={0}
            formatter={value =>
              `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            }
            parser={value => value.replace(/₹\s?|(,*)/g, '')}
            style={{
              width: '100%',
              borderColor: isEdited ? '#1890ff' : undefined
            }}
          />
        )
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => {
        const isEdited = editedCosts.hasOwnProperty(record.id)
        return (
          <Button
            type='primary'
            size='small'
            icon={<SaveOutlined />}
            disabled={!isEdited}
            loading={saving}
            onClick={() => saveSingleCost(record)}
          >
            Save
          </Button>
        )
      }
    }
  ]

  // If user is not allowed, show access denied
  if (!isAllowed) {
    return (
      <div className='p-6'>
        <Alert
          type='error'
          message='Access Denied'
          description='You do not have permission to access this page. This page is only available to authorized users.'
          showIcon
        />
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold'>💰 Product Costing Management</h2>
        <p className='text-gray-600 mt-1'>
          Update product costing by size. Filter by inches and update costs
          individually or in bulk.
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className='mb-6'>
        <Col span={6}>
          <Card>
            <Statistic
              title='Total Products'
              value={stats.total}
              prefix={<FilterOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='With Costing'
              value={stats.withCosting}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Without Costing'
              value={stats.withoutCosting}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title='Pending Changes'
              value={stats.pendingChanges}
              valueStyle={{
                color: stats.pendingChanges > 0 ? '#1890ff' : undefined
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card className='mb-4'>
        <Space wrap>
          <Select
            placeholder='Filter by Inches'
            value={selectedSize}
            onChange={setSelectedSize}
            allowClear
            style={{ width: 150 }}
            options={sizes.map(s => ({
              label: `${s.label}"`,
              value: s.label
            }))}
          />
          <Select
            mode='multiple'
            placeholder='Exclude Finishes'
            value={excludedFinishes}
            onChange={setExcludedFinishes}
            allowClear
            style={{ minWidth: 200, maxWidth: 400 }}
            options={finishOptions}
            maxTagCount={2}
            maxTagPlaceholder={omitted => `+${omitted.length} more`}
          />
          <Input
            placeholder='Search products...'
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 250 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchProducts}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type='primary'
            icon={<SaveOutlined />}
            onClick={saveAllCosts}
            loading={saving}
            disabled={stats.pendingChanges === 0}
          >
            Save All Changes ({stats.pendingChanges})
          </Button>
        </Space>
      </Card>

      {/* Bulk Update Section */}
      <Card className='mb-4' title='🔄 Bulk Update Costing'>
        <Space wrap align='center'>
          <span>Set costing for all {filteredProducts.length} filtered products:</span>
          <InputNumber
            value={bulkCostValue}
            onChange={setBulkCostValue}
            min={0}
            placeholder='Enter bulk cost'
            formatter={value =>
              `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            }
            parser={value => value.replace(/₹\s?|(,*)/g, '')}
            style={{ width: 180 }}
          />
          <Button
            type='primary'
            icon={<DollarOutlined />}
            onClick={applyBulkCost}
            disabled={bulkCostValue === null || filteredProducts.length === 0}
          >
            Apply to All Filtered ({filteredProducts.length})
          </Button>
          <Tag color='blue'>
            Tip: Filter by inches first, then apply bulk cost
          </Tag>
        </Space>
      </Card>

      {/* Products Table */}
      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey='id'
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100', '200'],
          showTotal: total => `Total ${total} products`
        }}
        rowClassName={record =>
          editedCosts.hasOwnProperty(record.id) ? 'bg-blue-50' : ''
        }
      />

      {/* Help Section */}
      <div className='mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
        <h3 className='font-semibold mb-2'>📌 How to Use</h3>
        <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'>
          <li>
            Use the <strong>Inches filter</strong> to view products of a
            specific wheel size
          </li>
          <li>
            Enter the new costing value in the <strong>New Costing</strong>{' '}
            column
          </li>
          <li>
            Click <strong>Save</strong> on individual rows or{' '}
            <strong>Save All Changes</strong> for bulk updates
          </li>
          <li>Products with pending changes will be highlighted in blue</li>
          <li>Products without costing are shown in red</li>
        </ul>
      </div>
    </div>
  )
}

export default TempCostingView
