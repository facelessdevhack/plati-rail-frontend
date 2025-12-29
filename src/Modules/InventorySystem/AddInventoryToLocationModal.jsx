import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  message,
  Space,
  Tag,
  Spin,
  Alert,
  Divider,
  Row,
  Col,
  Empty
} from 'antd'
import {
  PlusOutlined,
  InboxOutlined,
  DollarOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'

const { Option } = Select
const { TextArea } = Input

const AddInventoryToLocationModal = ({
  visible,
  onCancel,
  onSuccess,
  locationId,
  locationName,
  storageAreas = []
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [productType, setProductType] = useState('alloy')
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedAreaId, setSelectedAreaId] = useState(null)
  const [positions, setPositions] = useState([])
  const [searchValue, setSearchValue] = useState('')

  // Fetch products based on type and optional search query
  const fetchProducts = useCallback(async (type, search = '') => {
    setProductsLoading(true)
    try {
      let response
      if (type === 'alloy') {
        // Use stock/management endpoint which returns flat alloy list
        // Fetch all products (high limit) to ensure complete list for selection
        response = await client.get('/alloys/stock/management', {
          params: {
            limit: 5000,
            search: search || undefined
          }
        })
        // Transform to common format
        const alloys = (response.data.data || []).map(item => {
          // Get product name - API returns productName (camelCase from knex)
          const productName = item.productName || item.product_name || ''
          const modelName = item.modelName || item.model_name || ''
          const finishName = item.finish || item.finishName || ''

          // Build comprehensive search text including all searchable fields
          const searchText = [
            String(item.id || ''),
            productName,
            modelName,
            String(item.inches || ''),
            String(item.pcd || ''),
            finishName,
            String(item.holes || ''),
            String(item.width || ''),
            String(item.offset || ''),
            String(item.cb || ''),
            String(item.uniqueId || item.unique_id || '')
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return {
            id: item.id,
            productName,
            model: modelName,
            size: item.inches,
            pcd: item.pcd,
            finish: finishName,
            holes: item.holes,
            width: item.width,
            inHouseStock: item.inHouseStock ?? item.in_house_stock ?? 0,
            showroomStock: item.showroomStock ?? item.showroom_stock ?? 0,
            searchText
          }
        })
        setProducts(alloys)
      } else {
        // Use master/all-products endpoint with type=2 for tyres
        response = await client.get('/master/all-products', {
          params: { type: 2 }
        })
        // Transform to common format - tyres return { value: id, label: "prefix - size" }
        const tyres = (response.data || []).map(item => ({
          id: item.value,
          productName: item.label,
          source: item.source,
          // Pre-compute searchable text
          searchText: [item.value, item.label, item.source]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        }))
        setProducts(tyres)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      message.error(`Failed to fetch ${type}s`)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (visible) {
      fetchProducts(productType)
    }
  }, [visible, productType, fetchProducts])

  // Update positions when area changes
  useEffect(() => {
    if (selectedAreaId) {
      const area = storageAreas.find(a => a.id === selectedAreaId)
      setPositions(area?.positions || [])
    } else {
      setPositions([])
    }
    form.setFieldValue('positionId', null)
  }, [selectedAreaId, storageAreas, form])

  const handleProductTypeChange = type => {
    setProductType(type)
    form.setFieldValue('productId', null)
    fetchProducts(type)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const payload = {
        productType: values.productType,
        productId: values.productId,
        quantity: values.quantity,
        areaId: values.areaId || null,
        positionId: values.positionId || null,
        costPerUnit: values.costPerUnit || null,
        notes: values.notes || null
      }

      await client.post(
        `/inventory/internal/locations/${locationId}/inventory`,
        payload
      )

      message.success(
        `Successfully added ${values.quantity} items to ${locationName}`
      )
      form.resetFields()
      setProductType('alloy')
      onSuccess?.()
    } catch (error) {
      console.error('Error adding inventory:', error)
      message.error(error.response?.data?.message || 'Failed to add inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setProductType('alloy')
    setSelectedAreaId(null)
    setSearchValue('')
    onCancel?.()
  }

  // Format product label based on type
  const formatProductLabel = product => {
    if (productType === 'alloy') {
      const parts = [
        `#${product.id}`,
        product.productName || product.model || '',
        product.size ? `${product.size}"` : '',
        product.pcd || '',
        product.finish || ''
      ].filter(Boolean)
      return parts.join(' - ')
    } else {
      // Tyres come with productName already formatted as "prefix - size"
      return `#${product.id} - ${product.productName || ''}`
    }
  }

  // Filter products based on search value (client-side filtering)
  const filteredProducts = useMemo(() => {
    if (!searchValue.trim()) return products
    const searchLower = searchValue.toLowerCase().trim()
    // Split search into words for multi-word matching
    const searchWords = searchLower.split(/\s+/).filter(Boolean)

    return products.filter(product => {
      const searchText = product.searchText || ''
      const productName = (product.productName || '').toLowerCase()

      // Check if all search words are found in searchText or productName
      return searchWords.every(
        word => searchText.includes(word) || productName.includes(word)
      )
    })
  }, [products, searchValue])

  // Handle search input change
  const handleSearch = useCallback(value => {
    setSearchValue(value)
  }, [])

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined />
          <span>Add Inventory to {locationName}</span>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText='Add Inventory'
      width={970}
      destroyOnClose
    >
      <Alert
        message='Add stock to this location'
        description='Select the product type and specific product, enter the quantity to add, and optionally specify the storage area and position.'
        type='info'
        showIcon
        icon={<InboxOutlined />}
        style={{ marginBottom: '16px' }}
      />

      <Form
        form={form}
        layout='vertical'
        initialValues={{
          productType: 'alloy',
          quantity: 1
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name='productType'
              label='Product Type'
              rules={[
                { required: true, message: 'Please select product type' }
              ]}
            >
              <Select onChange={handleProductTypeChange} value={productType}>
                <Option value='alloy'>
                  <Tag color='blue'>ALLOY</Tag> Alloy Wheels
                </Option>
                <Option value='tyre'>
                  <Tag color='green'>TYRE</Tag> Tyres
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name='productId'
              label={
                <Space>
                  <span>Product</span>
                  <Tag color='purple' style={{ fontSize: '10px' }}>
                    <SearchOutlined /> Searchable
                  </Tag>
                </Space>
              }
              rules={[{ required: true, message: 'Please select a product' }]}
            >
              <Select
                showSearch
                placeholder={
                  productsLoading
                    ? 'Loading products...'
                    : `Search by ID, name, size, PCD...`
                }
                loading={productsLoading}
                onSearch={handleSearch}
                searchValue={searchValue}
                filterOption={false}
                notFoundContent={
                  productsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Spin size='small' />
                      <div style={{ marginTop: 8, color: '#999' }}>
                        Loading products...
                      </div>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        searchValue
                          ? `No products matching "${searchValue}"`
                          : 'No products found'
                      }
                    />
                  ) : null
                }
                dropdownStyle={{ maxHeight: 400 }}
                listHeight={350}
                virtual
              >
                {filteredProducts.map(product => (
                  <Select.Option key={product.id} value={product.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{formatProductLabel(product)}</span>
                      {productType === 'alloy' && (
                        <Tag
                          color={product.inHouseStock > 0 ? 'green' : 'red'}
                          style={{ marginLeft: 8, fontSize: '10px' }}
                        >
                          Stock: {product.inHouseStock || 0}
                        </Tag>
                      )}
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name='quantity'
              label='Quantity'
              rules={[
                { required: true, message: 'Please enter quantity' },
                {
                  type: 'number',
                  min: 1,
                  message: 'Quantity must be at least 1'
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder='Enter quantity'
                addonAfter='units'
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name='costPerUnit' label='Cost per Unit (Optional)'>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder='Enter cost'
                prefix={<DollarOutlined />}
                formatter={value =>
                  `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={value => value.replace(/₹\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation='left' plain>
          Storage Location (Optional)
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name='areaId' label='Storage Area'>
              <Select
                allowClear
                placeholder='Select storage area'
                onChange={value => setSelectedAreaId(value)}
                disabled={storageAreas.length === 0}
              >
                {storageAreas.map(area => (
                  <Option key={area.id} value={area.id}>
                    {area.name} {area.description && `(${area.description})`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name='positionId' label='Position'>
              <Select
                allowClear
                placeholder='Select position'
                disabled={!selectedAreaId || positions.length === 0}
              >
                {positions.map(pos => (
                  <Option key={pos.id} value={pos.id}>
                    {pos.name} {pos.description && `(${pos.description})`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name='notes' label='Notes (Optional)'>
          <TextArea
            rows={2}
            placeholder='Add any notes about this inventory addition...'
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddInventoryToLocationModal
