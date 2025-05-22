import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Button as AntButton,
  message,
  Badge,
  Tooltip,
  Spin
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import Button from '../../Core/Components/CustomButton'
import { client } from '../../Utils/axiosClient'
import { mockApiResponses } from '../../Utils/mockProductionData'

const { Option } = Select
const { RangePicker } = DatePicker

const JobCardsList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [jobCards, setJobCards] = useState([])
  const [filteredJobCards, setFilteredJobCards] = useState([])
  const [productionSteps, setProductionSteps] = useState([])
  const [sortedInfo, setSortedInfo] = useState({})
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    productionStep: 'all',
    dateRange: null,
    urgentOnly: false
  })

  useEffect(() => {
    fetchJobCards()
    fetchProductionSteps()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, jobCards])

  const fetchJobCards = async () => {
    try {
      setLoading(true)
      const response = await client.get('/v2/production/job-cards')
      if (response.data && response.data.result) {
        setJobCards(response.data.result)
        setFilteredJobCards(response.data.result)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching job cards:', error)
      // message.error('Failed to load job cards. Using mock data instead.')
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getJobCards()
      setJobCards(mockResponse.result)
      setFilteredJobCards(mockResponse.result)
      setLoading(false)
    }
  }

  const fetchProductionSteps = async () => {
    try {
      const response = await client.get('/v2/production/get-steps')
      if (response.data && response.data.result) {
        setProductionSteps(response.data.result)
      }
    } catch (error) {
      console.error('Error fetching production steps:', error)
      // message.error('Failed to load production steps. Using mock data instead.')
      // Use mock data when API fails
      const mockResponse = mockApiResponses.getProductionSteps()
      setProductionSteps(mockResponse.result)
    }
  }

  const applyFilters = () => {
    let result = [...jobCards]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        card =>
          (card.id && card.id.toString().includes(searchLower)) ||
          (card.planId && card.planId.toString().includes(searchLower)) ||
          (card.alloyName && card.alloyName.toLowerCase().includes(searchLower))
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(card => card.status === filters.status)
    }

    // Apply production step filter
    if (filters.productionStep !== 'all') {
      result = result.filter(
        card => card.prodStep === parseInt(filters.productionStep)
      )
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange
      result = result.filter(card => {
        const cardDate = new Date(card.createdAt)
        return cardDate >= start && cardDate <= end
      })
    }

    // Apply urgent only filter
    if (filters.urgentOnly) {
      result = result.filter(card => card.urgent)
    }

    setFilteredJobCards(result)
  }

  const handleChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      productionStep: 'all',
      dateRange: null,
      urgentOnly: false
    })
    setSortedInfo({})
  }

  const getStatusTag = status => {
    if (!status) return <Tag>PENDING</Tag>

    let color = 'default'
    let icon = null

    if (status === 'completed') {
      color = 'success'
      icon = <CheckCircleOutlined />
    } else if (status === 'in-progress') {
      color = 'processing'
      icon = <ClockCircleOutlined />
    } else if (status === 'pending') {
      color = 'warning'
      icon = <ExclamationCircleOutlined />
    }

    return (
      <Tag color={color} icon={icon}>
        {status.toUpperCase()}
      </Tag>
    )
  }

  const getStepName = stepId => {
    const step = productionSteps.find(s => s.id === stepId)
    return step ? step.name : `Step ${stepId}`
  }

  const goToJobCardDetails = jobCardId => {
    navigate(`/production-job-card/${jobCardId}`)
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
      title: 'Plan ID',
      dataIndex: 'prodPlanId',
      key: 'prodPlanId',
      sorter: (a, b) => a.prodPlanId - b.prodPlanId,
      sortOrder: sortedInfo.columnKey === 'prodPlanId' && sortedInfo.order,
      render: planId => (
        <a onClick={() => navigate(`/production-plan/${planId}`)}>{planId}</a>
      )
    },
    {
      title: 'Alloy',
      dataIndex: 'alloyName',
      key: 'alloyName',
      sorter: (a, b) => (a.alloyName || '').localeCompare(b.alloyName || ''),
      sortOrder: sortedInfo.columnKey === 'alloyName' && sortedInfo.order
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
      sortOrder: sortedInfo.columnKey === 'quantity' && sortedInfo.order
    },
    {
      title: 'Production Step',
      dataIndex: 'prodStep',
      key: 'prodStep',
      render: stepId => {
        const stepName = getStepName(stepId)
        return <Badge status='processing' text={stepName} />
      },
      sorter: (a, b) => a.prodStep - b.prodStep,
      sortOrder: sortedInfo.columnKey === 'prodStep' && sortedInfo.order
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => getStatusTag(status),
      sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
      sortOrder: sortedInfo.columnKey === 'status' && sortedInfo.order
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
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: date => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
      sortOrder: sortedInfo.columnKey === 'updatedAt' && sortedInfo.order
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size='small'>
          <AntButton type='link' onClick={() => goToJobCardDetails(record.id)}>
            View Details
          </AntButton>
        </Space>
      )
    }
  ]

  return (
    <div className='w-full p-5 bg-background-grey'>
      <div className='flex items-center justify-between mb-6'>
        <div className='text-2xl font-bold'>Job Cards</div>
      </div>

      <div className='p-6 mb-6 bg-white rounded-lg shadow'>
        <div className='grid grid-cols-1 gap-4 mb-4 md:grid-cols-3'>
          <div>
            <Input
              placeholder='Search by ID, plan ID, or alloy'
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
              placeholder='Filter by production step'
              value={filters.productionStep}
              onChange={value =>
                setFilters({ ...filters, productionStep: value })
              }
            >
              <Option value='all'>All Steps</Option>
              {productionSteps.map(step => (
                <Option key={step.id} value={step.id.toString()}>
                  {step.name}
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
            <AntButton icon={<ReloadOutlined />} onClick={fetchJobCards}>
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
          dataSource={filteredJobCards}
          rowKey='id'
          loading={loading}
          onChange={handleChange}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  )
}

export default JobCardsList
