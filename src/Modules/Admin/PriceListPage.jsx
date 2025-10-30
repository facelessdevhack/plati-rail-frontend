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
  Statistic
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'

const { Search } = Input
const { Title } = Typography

const PriceListPage = () => {
  const navigate = useNavigate()
  const [priceLists, setPriceLists] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingPriceList, setEditingPriceList] = useState(null)
  const [totalLists, setTotalLists] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [form] = Form.useForm()

  useEffect(() => {
    fetchPriceLists()
  }, [searchText, pagination.current, pagination.pageSize])

  const fetchPriceLists = async () => {
    setLoading(true)
    try {
      const response = await client.get('/master/price-lists', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText
        }
      })

      if (response.data && response.data.data) {
        setPriceLists(response.data.data)
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }))

        // Calculate statistics
        const totalLists = response.data.data.reduce((sum, list) => sum + 1, 0)
        const totalItems = response.data.data.reduce(
          (sum, list) => sum + (parseInt(list.item_count) || 0),
          0
        )
        setTotalLists(totalLists)
        setTotalItems(totalItems)
      }
    } catch (error) {
      console.error('Error fetching price lists:', error)
      message.error('Failed to fetch price lists')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = value => {
    setSearchText(value)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleTableChange = pagination => {
    setPagination(pagination)
  }

  const handleAdd = () => {
    setEditingPriceList(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = record => {
    setEditingPriceList(record)
    form.setFieldsValue({ name: record.name })
    setIsModalVisible(true)
  }

  const handleDelete = async id => {
    try {
      await client.delete(`/master/price-lists/${id}`)
      message.success('Price list deleted successfully')
      fetchPriceLists()
    } catch (error) {
      console.error('Error deleting price list:', error)
      message.error('Failed to delete price list')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingPriceList) {
        await client.put(`/master/price-lists/${editingPriceList.id}`, values)
        message.success('Price list updated successfully')
      } else {
        await client.post('/master/price-lists', values)
        message.success('Price list created successfully')
      }

      setIsModalVisible(false)
      fetchPriceLists()
    } catch (error) {
      console.error('Error saving price list:', error)
      message.error('Failed to save price list')
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Price List Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button
          type='link'
          onClick={() => navigate(`/price-lists/edit/${record.id}`)}
          style={{ padding: 0, height: 'auto' }}
        >
          {text}
        </Button>
      )
    },
    {
      title: 'Items Count',
      dataIndex: 'item_count',
      key: 'item_count',
      width: 120,
      render: count => (
        <Tag color={count > 0 ? 'green' : 'default'}>{count || 0} items</Tag>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: date => moment(date).format('DD-MM-YYYY HH:mm')
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: date => moment(date).format('DD-MM-YYYY HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size='small'>
          <Tooltip title='Edit Prices'>
            <Button
              type='text'
              icon={<SettingOutlined />}
              onClick={() => navigate(`/price-lists/edit/${record.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title='Are you sure you want to delete this price list?'
            description='This action cannot be undone.'
            onConfirm={() => handleDelete(record.id)}
            okText='Yes'
            cancelText='No'
          >
            <Tooltip title='Delete'>
              <Button type='text' danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <Title level={2} className='mb-4'>
          Price Lists Management
        </Title>

        {/* Statistics Cards */}
        <Row gutter={16} className='mb-6'>
          <Col span={12}>
            <Card>
              <Statistic
                title='Total Price Lists'
                value={totalLists}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title='Total Items'
                value={totalItems}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Actions */}
        <Row gutter={16} className='mb-4'>
          <Col flex='auto'>
            <Search
              placeholder='Search price lists...'
              allowClear
              enterButton={<SearchOutlined />}
              size='large'
              onSearch={handleSearch}
              onChange={e => !e.target.value && setSearchText('')}
            />
          </Col>
          <Col>
            <Space>
              <Button
                type='default'
                icon={<ReloadOutlined />}
                size='large'
                onClick={fetchPriceLists}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                size='large'
                onClick={handleAdd}
              >
                Add Price List
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={priceLists}
          rowKey='id'
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }))
            }
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingPriceList ? 'Edit Price List' : 'Add New Price List'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText='Save'
        cancelText='Cancel'
      >
        <Form form={form} layout='vertical' name='priceListForm'>
          <Form.Item
            label='Price List Name'
            name='name'
            rules={[
              { required: true, message: 'Please input price list name!' },
              { min: 2, message: 'Name must be at least 2 characters!' },
              { max: 100, message: 'Name cannot exceed 100 characters!' }
            ]}
          >
            <Input placeholder='Enter price list name' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PriceListPage
