import React, { useState, useEffect } from 'react'
import {
  Table,
  Input,
  Select,
  DatePicker,
  Button as AntButton,
  Tag,
  Space,
  message
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { mockApiResponses } from '../../Utils/mockProductionData'

const { Option } = Select
const { RangePicker } = DatePicker

const ProductionPlansList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState([])
  const [filteredPlans, setFilteredPlans] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: null,
    alloyId: null,
    urgentOnly: false
  })
  const [sortedInfo, setSortedInfo] = useState({})
  const [alloys, setAlloys] = useState([]) // For alloy filter dropdown

  useEffect(() => {
    fetchProductionPlans()
    fetchAlloys()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, plans])

  const fetchProductionPlans = async () => {
    try {
      setLoading(true)
      const response = await client.get('/v2/production/production-plans')
      if (response.data && response.data.result) {
        setPlans(response.data.result)
        setFilteredPlans(response.data.result)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching production plans:', error)
      // message.error('Failed to load production plans. Using mock data instead.')
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getProductionPlans()
      setPlans(mockResponse.result)
      setFilteredPlans(mockResponse.result)
      setLoading(false)
    }
  }

  const fetchAlloys = async () => {
    try {
      const response = await client.get('/v2/production/alloys')
      if (response.data && response.data.result) {
        const formattedAlloys = response.data.result.map(alloy => ({
          value: alloy.id,
          label: alloy.name
        }))
        setAlloys(formattedAlloys)
      }
    } catch (error) {
      console.error('Error fetching alloys:', error)
      // message.error('Failed to load alloys. Using mock data instead.')
      // Use mock data when API fails
      const mockAlloys = [
        { id: 1, name: 'Aluminum 6061' },
        { id: 2, name: 'Steel 1045' },
        { id: 3, name: 'Copper C11000' },
        { id: 4, name: 'Brass C26000' }
      ]
      const formattedAlloys = mockAlloys.map(alloy => ({
        value: alloy.id,
        label: alloy.name
      }))
      setAlloys(formattedAlloys)
    }
  }

  const applyFilters = () => {
    let result = [...plans]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        plan =>
          (plan.alloyName &&
            plan.alloyName.toLowerCase().includes(searchLower)) ||
          (plan.convertName &&
            plan.convertName.toLowerCase().includes(searchLower)) ||
          plan.id.toString().includes(searchLower)
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(plan => plan.status === filters.status)
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange
      result = result.filter(plan => {
        const planDate = new Date(plan.createdAt)
        return planDate >= start && planDate <= end
      })
    }

    // Apply alloy filter
    if (filters.alloyId) {
      result = result.filter(
        plan =>
          plan.alloyId === filters.alloyId || plan.convertId === filters.alloyId
      )
    }

    // Apply urgent only filter
    if (filters.urgentOnly) {
      result = result.filter(plan => plan.urgent)
    }

    setFilteredPlans(result)
  }

  const handleChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateRange: null,
      alloyId: null,
      urgentOnly: false
    })
    setSortedInfo({})
  }

  const handleCreatePlan = () => {
    navigate('/production-plan/create')
  }

  const viewPlanDetails = planId => {
    navigate(`/production-plan/${planId}`)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      sortOrder: sortedInfo.columnKey === 'id' && sortedInfo.order
    },
    {
      title: 'Alloy',
      dataIndex: 'alloyName',
      key: 'alloyName',
      sorter: (a, b) => a.alloyName.localeCompare(b.alloyName),
      sortOrder: sortedInfo.columnKey === 'alloyName' && sortedInfo.order
    },
    {
      title: 'Convert Alloy',
      dataIndex: 'convertName',
      key: 'convertName',
      sorter: (a, b) => a.convertName.localeCompare(b.convertName),
      sortOrder: sortedInfo.columnKey === 'convertName' && sortedInfo.order
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
      sortOrder: sortedInfo.columnKey === 'quantity' && sortedInfo.order
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = 'default'
        if (status === 'completed') color = 'success'
        if (status === 'in-progress') color = 'processing'
        if (status === 'pending') color = 'warning'
        return <Tag color={color}>{status?.toUpperCase()}</Tag>
      },
      sorter: (a, b) => a.status.localeCompare(b.status),
      sortOrder: sortedInfo.columnKey === 'status' && sortedInfo.order
    },
    {
      title: 'Urgent',
      dataIndex: 'urgent',
      key: 'urgent',
      render: urgent =>
        urgent ? (
          <Tag color='red'>URGENT</Tag>
        ) : (
          <Tag color='green'>REGULAR</Tag>
        ),
      sorter: (a, b) => a.urgent - b.urgent,
      sortOrder: sortedInfo.columnKey === 'urgent' && sortedInfo.order
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      sortOrder: sortedInfo.columnKey === 'createdAt' && sortedInfo.order
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size='middle'>
          <AntButton type='link' onClick={() => viewPlanDetails(record.id)}>
            View Details
          </AntButton>
        </Space>
      )
    }
  ]

  return (
    <div className='w-full p-5 bg-background-grey'>
      <div className='flex items-center justify-between mb-6'>
        <div className='text-2xl font-bold'>Production Plans</div>
        <Button onClick={handleCreatePlan}>Create Production Plan</Button>
      </div>

      <div className='p-6 mb-6 bg-white rounded-lg shadow'>
        <div className='grid grid-cols-1 gap-4 mb-4 md:grid-cols-3'>
          <div>
            <Input
              placeholder='Search by alloy, conversion or ID'
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <Select
              className='w-full'
              placeholder='Filter by status'
              value={filters.status}
              onChange={value => setFilters({ ...filters, status: value })}
            >
              <Option value='all'>All Statuses</Option>
              <Option value='pending'>Pending</Option>
              <Option value='in-progress'>In Progress</Option>
              <Option value='completed'>Completed</Option>
            </Select>
          </div>
          <div>
            <Select
              className='w-full'
              placeholder='Filter by alloy'
              value={filters.alloyId}
              onChange={value => setFilters({ ...filters, alloyId: value })}
              allowClear
            >
              {alloys.map(alloy => (
                <Option key={alloy.value} value={alloy.value}>
                  {alloy.label}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        <div className='flex flex-col items-start justify-between mb-4 md:flex-row md:items-center'>
          <div className='mb-2 md:mb-0'>
            <RangePicker
              onChange={dates => setFilters({ ...filters, dateRange: dates })}
              value={filters.dateRange}
            />
          </div>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center'>
              <input
                type='checkbox'
                id='urgentOnly'
                checked={filters.urgentOnly}
                onChange={e =>
                  setFilters({ ...filters, urgentOnly: e.target.checked })
                }
                className='mr-2'
              />
              <label htmlFor='urgentOnly'>Urgent Only</label>
            </div>
            <AntButton icon={<ReloadOutlined />} onClick={fetchProductionPlans}>
              Refresh
            </AntButton>
            <AntButton icon={<FilterOutlined />} onClick={clearFilters}>
              Clear Filters
            </AntButton>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-lg shadow'>
        <Table
          columns={columns}
          dataSource={filteredPlans}
          rowKey='id'
          loading={loading}
          onChange={handleChange}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  )
}

export default ProductionPlansList
