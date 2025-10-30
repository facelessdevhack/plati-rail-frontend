import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Typography,
  Row,
  Col,
  Statistic,
  InputNumber,
  Slider,
  Select,
  Divider
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DollarOutlined,
  EditOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  CalculatorOutlined,
  SettingOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import { useNavigate, useParams } from 'react-router-dom'
import moment from 'moment'

const { Search } = Input
const { Title } = Typography
const { Option } = Select

const EditPriceListPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [priceList, setPriceList] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [isBulkModalVisible, setIsBulkModalVisible] = useState(false)
  const [editedItems, setEditedItems] = useState(new Map())
  const [form] = Form.useForm()

  useEffect(() => {
    if (id) {
      fetchPriceListDetails()
    }
  }, [id, searchText])

  const fetchPriceListDetails = async () => {
    setLoading(true)
    try {
      const response = await client.get(`/master/price-lists/${id}`)
      if (response.data) {
        setPriceList(response.data)
        setItems(response.data.items || [])
      }
    } catch (error) {
      console.error('Error fetching price list details:', error)
      message.error('Failed to fetch price list details')
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = (itemId, value) => {
    setEditedItems(prev => new Map(prev.set(itemId, {
      id: itemId,
      price: value,
      price_list_id: parseInt(id)
    })))
  }

  const handleSaveItems = async () => {
    if (editedItems.size === 0) {
      message.info('No changes to save')
      return
    }

    setSaving(true)
    try {
      const itemsToUpdate = Array.from(editedItems.values())
      const response = await client.put(`/master/price-lists/${id}/items`, {
        items: itemsToUpdate
      })

      if (response.data) {
        message.success(`Successfully updated ${response.data.updated_count} items`)
        setEditedItems(new Map())
        fetchPriceListDetails() // Refresh data
      }
    } catch (error) {
      console.error('Error saving items:', error)
      message.error('Failed to save price updates')
    } finally {
      setSaving(false)
    }
  }

  const handleSearch = (value) => {
    setSearchText(value)
  }

  const handleBulkUpdate = async (values) => {
    try {
      setLoading(true)
      const response = await client.put(`/master/price-lists/${id}/bulk-update`, {
        basePrice: values.basePrice,
        percentageIncrease: values.percentageIncrease
      })

      if (response.data) {
        message.success(`Bulk update completed: ${response.data.updated_count} items updated`)
        setIsBulkModalVisible(false)
        form.resetFields()
        setEditedItems(new Map())
        fetchPriceListDetails() // Refresh data
      }
    } catch (error) {
      console.error('Error in bulk update:', error)
      message.error('Failed to perform bulk update')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item =>
    item.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.sku_code?.toLowerCase().includes(searchText.toLowerCase())
  )

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'SKU Code',
      dataIndex: 'sku_code',
      key: 'sku_code',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.inches && `${record.inches}" | `}
            {record.finishes && `${record.finishes} | `}
            {record.model_name && record.model_name}
          </div>
        </div>
      ),
    },
    {
      title: 'Current Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price, record) => {
        const editedValue = editedItems.get(record.id)?.price
        return (
          <InputNumber
            value={editedValue !== undefined ? editedValue : price}
            onChange={(value) => handlePriceChange(record.id, value)}
            style={{ width: '100%' }}
            placeholder="0.00"
            precision={2}
            min={0}
            step={0.01}
          />
        )
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const editedValue = editedItems.get(record.id)?.price
        const hasChanges = editedValue !== undefined && editedValue !== record.price

        return (
          <Tag color={hasChanges ? 'orange' : (record.price ? 'green' : 'default')}>
            {hasChanges ? 'Modified' : (record.price ? 'Set' : 'Not Set')}
          </Tag>
        )
      },
    },
  ]

  const stats = {
    totalItems: items.length,
    pricedItems: items.filter(item => item.price !== null).length,
    unpricedItems: items.filter(item => item.price === null).length,
    modifiedItems: editedItems.size
  }

  if (!priceList && !loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Title level={3}>Price List Not Found</Title>
          <Button type="primary" onClick={() => navigate('/price-lists')}>
            <ArrowLeftOutlined /> Back to Price Lists
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Space align="center" size="large">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/price-lists')}
          >
            Back to Price Lists
          </Button>
          <Title level={2} className="mb-0">
            Edit Price List: {priceList?.name}
          </Title>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={stats.totalItems}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Priced Items"
              value={stats.pricedItems}
              prefix={<CalculatorOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Unpriced Items"
              value={stats.unpricedItems}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Modified Items"
              value={stats.modifiedItems}
              prefix={<EditOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions */}
      <Row gutter={16} className="mb-4">
        <Col flex="auto">
          <Search
            placeholder="Search products..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && setSearchText('')}
          />
        </Col>
        <Col>
          <Space>
            <Button
              type="default"
              icon={<ThunderboltOutlined />}
              size="large"
              onClick={() => setIsBulkModalVisible(true)}
            >
              Bulk Update
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              size="large"
              onClick={handleSaveItems}
              loading={saving}
              disabled={editedItems.size === 0}
            >
              Save Changes ({editedItems.size})
            </Button>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              size="large"
              onClick={fetchPriceListDetails}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 800 }}
          rowClassName={(record) => {
            const hasChanges = editedItems.has(record.id)
            return hasChanges ? 'bg-orange-50' : ''
          }}
        />
      </Card>

      {/* Bulk Update Modal */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined />
            Bulk Price Update
          </Space>
        }
        open={isBulkModalVisible}
        onCancel={() => {
          setIsBulkModalVisible(false)
          form.resetFields()
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsBulkModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => form.submit()}
            loading={loading}
          >
            Update All Prices
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBulkUpdate}
        >
          <Form.Item
            label="Base Price"
            name="basePrice"
            rules={[
              { required: true, message: 'Please enter base price!' },
              { type: 'number', min: 0, message: 'Base price must be non-negative!' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter base price"
              min={0}
              precision={2}
              step={0.01}
              prefix="₹"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Percentage Increase"
            name="percentageIncrease"
            rules={[
              { required: true, message: 'Please enter percentage increase!' }
            ]}
            extra="This percentage will be added to the base price"
          >
            <div>
              <Slider
                min={-50}
                max={100}
                step={1}
                marks={{
                  '-50': '-50%',
                  '0': '0%',
                  '25': '25%',
                  '50': '50%',
                  '100': '100%'
                }}
                onChange={(value) => form.setFieldsValue({ percentageIncrease: value })}
              />
              <InputNumber
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Enter percentage"
                min={-50}
                max={100}
                step={0.1}
                suffix="%"
                size="large"
                onChange={(value) => form.setFieldsValue({ percentageIncrease: value })}
              />
            </div>
          </Form.Item>

          <Divider />

          <div className="text-center">
            <Title level={4}>
              Final Price: ₹
              {form.getFieldValue('basePrice') && form.getFieldValue('percentageIncrease') !== undefined
                ? (form.getFieldValue('basePrice') +
                   (form.getFieldValue('basePrice') * (form.getFieldValue('percentageIncrease') / 100))
                  ).toFixed(2)
                : '0.00'
              }
            </Title>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default EditPriceListPage