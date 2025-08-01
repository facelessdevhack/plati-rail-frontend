import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  message,
  Modal
} from 'antd'
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import AddDealer from './AddDealer'
import EditDealer from './EditDealer'

const DealersList = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [searchText, setSearchText] = useState('')
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedDealer, setSelectedDealer] = useState(null)

  const columns = [
    {
      title: 'Dealer Code',
      dataIndex: 'id',
      key: 'id',
      sorter: true
    },
    {
      title: 'Dealer Name',
      dataIndex: 'dealerName',
      key: 'dealerName',
      sorter: true
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
      sorter: true
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      sorter: true
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
      )
    }
  ]

  const fetchDealers = async (page = 1, limit = 10, search = '') => {
    setLoading(true)
    try {
      const response = await client.get('/master/dealer-list', {
        params: {
          page,
          limit,
          search
        }
      })
      
      const filteredData = response.data.data.filter(dealer => dealer.id !== 1)
      setData(filteredData)
      setPagination({
        current: page,
        pageSize: limit,
        total: response.data.pagination.total
      })
    } catch (error) {
      message.error('Failed to fetch dealers')
      console.error('Error fetching dealers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDealers()
  }, [])

  const handleTableChange = (paginationConfig, filters, sorter) => {
    fetchDealers(
      paginationConfig.current,
      paginationConfig.pageSize,
      searchText
    )
  }

  const handleSearch = () => {
    fetchDealers(1, pagination.pageSize, searchText)
  }

  const handleRefresh = () => {
    setSearchText('')
    fetchDealers(1, pagination.pageSize, '')
  }

  const handleEdit = (record) => {
    setSelectedDealer(record)
    setEditModalVisible(true)
  }

  const handleAddNew = () => {
    setAddModalVisible(true)
  }

  const handleModalSuccess = () => {
    fetchDealers(pagination.current, pagination.pageSize, searchText)
  }

  return (
    <div className="p-6">
      <Card
        title="Dealers List"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
            >
              Add New Dealer
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <div className="mb-4">
          <Space>
            <Input
              placeholder="Search dealers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 300 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} dealers`
          }}
          onChange={handleTableChange}
        />
      </Card>

      <AddDealer
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={handleModalSuccess}
      />

      <EditDealer
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false)
          setSelectedDealer(null)
        }}
        onSuccess={handleModalSuccess}
        dealerData={selectedDealer}
      />
    </div>
  )
}

export default DealersList