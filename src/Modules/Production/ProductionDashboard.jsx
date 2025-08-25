import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Button,
  Space,
  Tooltip,
  Alert,
  Spin,
  Empty,
  Badge,
  Divider,
  Select,
  DatePicker
} from 'antd'
import {
  DashboardOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FireOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  ToolOutlined,
  ExperimentOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import {
  getProductionPlansWithQuantities,
  getJobCardsWithDetails
} from '../../redux/api/productionAPI'

const { RangePicker } = DatePicker

const ProductionDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  // Redux state
  const {
    productionPlans = [],
    jobCards = [],
    productionSummary = {},
    loading,
    error
  } = useSelector(state => state.productionDetails || {})
  
  // Local state
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('week')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState(null)
  
  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setRefreshing(true)
    try {
      // Fetch production plans with quantities
      await dispatch(getProductionPlansWithQuantities({
        page: 1,
        limit: 100,
        status: statusFilter === 'all' ? '' : statusFilter
      })).unwrap()
      
      // Fetch job cards with details
      await dispatch(getJobCardsWithDetails({
        page: 1,
        limit: 100
      })).unwrap()
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setRefreshing(false)
    }
  }
  
  // Calculate dashboard metrics
  const calculateMetrics = () => {
    const metrics = {
      totalPlans: productionPlans.length,
      activePlans: 0,
      completedPlans: 0,
      urgentPlans: 0,
      totalQuantity: 0,
      allocatedQuantity: 0,
      remainingQuantity: 0,
      completedQuantity: 0,
      allocationRate: 0,
      completionRate: 0,
      plansNeedingJobCards: 0,
      fullyAllocatedPlans: 0,
      overAllocatedPlans: 0,
      totalJobCards: jobCards.length,
      activeJobCards: 0,
      completedJobCards: 0
    }
    
    productionPlans.forEach(plan => {
      const tracking = plan.quantityTracking || {}
      
      // Plan status counts
      if (plan.status === 'active' || plan.status === 'In Progress') metrics.activePlans++
      if (plan.status === 'Completed') metrics.completedPlans++
      if (plan.urgent || plan.isUrgent) metrics.urgentPlans++
      
      // Quantity metrics
      metrics.totalQuantity += plan.quantity || 0
      metrics.allocatedQuantity += tracking.totalJobCardQuantity || 0
      metrics.remainingQuantity += tracking.remainingQuantity || 0
      metrics.completedQuantity += tracking.completedQuantity || 0
      
      // Allocation status
      const remainingQty = tracking.remainingQuantity || plan.quantity || 0
      const allocatedQty = tracking.totalJobCardQuantity || 0
      
      if (remainingQty > 0 && allocatedQty === 0) {
        metrics.plansNeedingJobCards++
      }
      if (remainingQty === 0 && plan.quantity > 0) {
        metrics.fullyAllocatedPlans++
      }
      if (allocatedQty > plan.quantity) {
        metrics.overAllocatedPlans++
      }
    })
    
    // Job card metrics
    jobCards.forEach(jobCard => {
      if (jobCard.status === 'active' || jobCard.status === 'In Progress') metrics.activeJobCards++
      if (jobCard.status === 'Completed') metrics.completedJobCards++
    })
    
    // Calculate rates
    if (metrics.totalQuantity > 0) {
      metrics.allocationRate = Math.round((metrics.allocatedQuantity / metrics.totalQuantity) * 100)
      metrics.completionRate = Math.round((metrics.completedQuantity / metrics.totalQuantity) * 100)
    }
    
    return metrics
  }
  
  const metrics = calculateMetrics()
  
  // Get critical plans (urgent or low remaining quantity)
  const getCriticalPlans = () => {
    return productionPlans
      .filter(plan => {
        const tracking = plan.quantityTracking || {}
        const remainingPct = plan.quantity > 0 
          ? ((tracking.remainingQuantity || 0) / plan.quantity) * 100 
          : 0
        return plan.urgent || plan.isUrgent || remainingPct < 20
      })
      .slice(0, 5)
  }
  
  // Get allocation status distribution
  const getAllocationDistribution = () => {
    const distribution = {
      'Not Started': 0,
      'Partially Allocated': 0,
      'Fully Allocated': 0,
      'Over Allocated': 0
    }
    
    productionPlans.forEach(plan => {
      const tracking = plan.quantityTracking || {}
      const allocatedQty = tracking.totalJobCardQuantity || 0
      const planQty = plan.quantity || 0
      
      if (allocatedQty === 0) {
        distribution['Not Started']++
      } else if (allocatedQty < planQty) {
        distribution['Partially Allocated']++
      } else if (allocatedQty === planQty) {
        distribution['Fully Allocated']++
      } else {
        distribution['Over Allocated']++
      }
    })
    
    return distribution
  }
  
  const allocationDistribution = getAllocationDistribution()
  
  // Table columns for critical plans
  const criticalPlansColumns = [
    {
      title: 'Plan ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id) => <a onClick={() => navigate(`/production-plan/${id}`)}>#{id}</a>
    },
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.alloyName}</div>
          <div className="text-xs text-gray-500">→ {record.convertName}</div>
        </div>
      )
    },
    {
      title: 'Priority',
      key: 'priority',
      width: 90,
      render: (_, record) => (
        record.urgent || record.isUrgent ? (
          <Tag color="red" icon={<FireOutlined />}>URGENT</Tag>
        ) : (
          <Tag color="green">Normal</Tag>
        )
      )
    },
    {
      title: 'Allocation',
      key: 'allocation',
      width: 150,
      render: (_, record) => {
        const tracking = record.quantityTracking || {}
        const allocated = tracking.totalJobCardQuantity || 0
        const total = record.quantity || 0
        const percentage = total > 0 ? Math.round((allocated / total) * 100) : 0
        
        return (
          <div>
            <Progress 
              percent={percentage} 
              size="small" 
              status={percentage === 100 ? 'success' : percentage > 80 ? 'exception' : 'active'}
            />
            <div className="text-xs text-gray-500 mt-1">
              {allocated.toLocaleString()} / {total.toLocaleString()}
            </div>
          </div>
        )
      }
    },
    {
      title: 'Remaining',
      key: 'remaining',
      width: 100,
      render: (_, record) => {
        const remaining = record.quantityTracking?.remainingQuantity || 0
        return (
          <div className={`font-medium ${remaining > 0 ? 'text-green-600' : 'text-gray-500'}`}>
            {remaining.toLocaleString()}
          </div>
        )
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => {
        const remaining = record.quantityTracking?.remainingQuantity || 0
        return remaining > 0 ? (
          <Button 
            type="primary" 
            size="small" 
            icon={<PlusCircleOutlined />}
            onClick={() => navigate(`/job-cards/create?planId=${record.id}`)}
          >
            Create JC
          </Button>
        ) : (
          <Tag color="default">Fully Allocated</Tag>
        )
      }
    }
  ]
  
  return (
    <div className="production-dashboard p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <DashboardOutlined className="mr-2" />
              Production Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time production metrics and allocation tracking
            </p>
          </div>
          <Space>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
            >
              <Select.Option value="today">Today</Select.Option>
              <Select.Option value="week">This Week</Select.Option>
              <Select.Option value="month">This Month</Select.Option>
              <Select.Option value="quarter">This Quarter</Select.Option>
            </Select>
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={fetchDashboardData}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => navigate('/production-plans/create')}
            >
              New Production Plan
            </Button>
          </Space>
        </div>
      </div>
      
      {/* Key Metrics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Production Plans"
              value={metrics.activePlans}
              suffix={`/ ${metrics.totalPlans}`}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="mt-2">
              <Progress 
                percent={metrics.totalPlans > 0 ? Math.round((metrics.activePlans / metrics.totalPlans) * 100) : 0} 
                size="small" 
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Allocation Rate"
              value={metrics.allocationRate}
              suffix="%"
              prefix={metrics.allocationRate > 50 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ color: metrics.allocationRate > 75 ? '#52c41a' : '#faad14' }}
            />
            <div className="text-sm text-gray-600 mt-2">
              {metrics.allocatedQuantity.toLocaleString()} / {metrics.totalQuantity.toLocaleString()} units
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={metrics.completionRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="text-sm text-gray-600 mt-2">
              {metrics.completedQuantity.toLocaleString()} units completed
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Urgent Plans"
              value={metrics.urgentPlans}
              prefix={<FireOutlined />}
              valueStyle={{ color: metrics.urgentPlans > 0 ? '#ff4d4f' : '#8c8c8c' }}
            />
            <div className="text-sm text-gray-600 mt-2">
              Requires immediate attention
            </div>
          </Card>
        </Col>
      </Row>
      
      {/* Allocation Overview */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="Allocation Status Distribution">
            <Row gutter={[16, 16]}>
              {Object.entries(allocationDistribution).map(([status, count]) => (
                <Col span={12} key={status}>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-2xl font-bold mb-1">
                      {count}
                    </div>
                    <div className="text-sm text-gray-600">
                      {status}
                    </div>
                    {status === 'Over Allocated' && count > 0 && (
                      <Tag color="red" className="mt-2">
                        <WarningOutlined /> Needs Review
                      </Tag>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Production Metrics">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Plans Needing Job Cards</span>
                <Badge 
                  count={metrics.plansNeedingJobCards} 
                  style={{ backgroundColor: metrics.plansNeedingJobCards > 0 ? '#faad14' : '#52c41a' }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fully Allocated Plans</span>
                <Badge 
                  count={metrics.fullyAllocatedPlans} 
                  style={{ backgroundColor: '#52c41a' }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Job Cards</span>
                <Badge 
                  count={metrics.activeJobCards} 
                  style={{ backgroundColor: '#1890ff' }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed Job Cards</span>
                <Badge 
                  count={metrics.completedJobCards} 
                  style={{ backgroundColor: '#52c41a' }}
                />
              </div>
              <Divider />
              <div className="flex justify-between items-center">
                <span className="font-medium">Remaining to Allocate</span>
                <span className="text-xl font-bold text-orange-600">
                  {metrics.remainingQuantity.toLocaleString()} units
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      {/* Critical Plans Alert */}
      {metrics.urgentPlans > 0 || metrics.plansNeedingJobCards > 0 ? (
        <Alert
          message="Attention Required"
          description={
            <div>
              {metrics.urgentPlans > 0 && (
                <div className="mb-1">
                  <FireOutlined className="text-red-500 mr-2" />
                  {metrics.urgentPlans} urgent production {metrics.urgentPlans === 1 ? 'plan requires' : 'plans require'} immediate attention
                </div>
              )}
              {metrics.plansNeedingJobCards > 0 && (
                <div>
                  <WarningOutlined className="text-orange-500 mr-2" />
                  {metrics.plansNeedingJobCards} production {metrics.plansNeedingJobCards === 1 ? 'plan has' : 'plans have'} no job cards created yet
                </div>
              )}
            </div>
          }
          type="warning"
          showIcon
          className="mb-6"
        />
      ) : null}
      
      {/* Critical Plans Table */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <span>Critical Production Plans</span>
            <Button 
              type="link" 
              onClick={() => navigate('/production-plans')}
            >
              View All Plans →
            </Button>
          </div>
        }
      >
        <Table
          columns={criticalPlansColumns}
          dataSource={getCriticalPlans()}
          rowKey="id"
          size="small"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <Empty 
                description="No critical plans at the moment" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>
      
      {/* Quick Actions */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable 
            className="text-center cursor-pointer"
            onClick={() => navigate('/production-plans')}
          >
            <FileTextOutlined className="text-3xl text-blue-500 mb-2" />
            <div className="font-medium">View All Plans</div>
            <div className="text-sm text-gray-500">Manage production plans</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable 
            className="text-center cursor-pointer"
            onClick={() => navigate('/job-cards')}
          >
            <ToolOutlined className="text-3xl text-green-500 mb-2" />
            <div className="font-medium">Job Cards</div>
            <div className="text-sm text-gray-500">Track job card progress</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable 
            className="text-center cursor-pointer"
            onClick={() => navigate('/smart-production')}
          >
            <ThunderboltOutlined className="text-3xl text-orange-500 mb-2" />
            <div className="font-medium">Smart Planner</div>
            <div className="text-sm text-gray-500">AI-powered planning</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable 
            className="text-center cursor-pointer"
            onClick={() => navigate('/production-presets')}
          >
            <ExperimentOutlined className="text-3xl text-purple-500 mb-2" />
            <div className="font-medium">Step Presets</div>
            <div className="text-sm text-gray-500">Manage workflows</div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ProductionDashboard