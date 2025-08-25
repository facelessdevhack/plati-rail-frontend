import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  Input,
  Tag,
  notification,
  Typography,
  Table,
  InputNumber,
  Spin
} from 'antd'
import {
  BulbOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Layout from '../Layout/layout'
import AISuggestionsPanel from './AISuggestionsPanel'
import TrendAnalysisChart from './TrendAnalysisChart'
import SalesMetricsTable from './SalesMetricsTable'
import {
  getStockManagement,
  getAllSizes,
  getAllPcd,
  getAllFinishes
} from '../../redux/api/stockAPI'
import {
  createProductionPlan,
  getStepPresets
} from '../../redux/api/productionAPI'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const SmartProductionDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Redux state
  const {
    stockManagementData,
    stockPagination,
    loading,
    allSizes,
    allPcd,
    allFinishes
  } = useSelector(state => state.stockDetails)
  // const { stepPresets } = useSelector(state => state.productionDetails) // Not used in simplified version
  const { user } = useSelector(state => state.userDetails)

  // Local state
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedAlloys, setSelectedAlloys] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSize, setFilterSize] = useState(null)
  const [filterPcd, setFilterPcd] = useState(null)
  const [filterFinish, setFilterFinish] = useState(null)
  const [conversionPlans, setConversionPlans] = useState({})
  const [isCreatingPlans, setIsCreatingPlans] = useState(false)

  // Load initial data
  useEffect(() => {
    dispatch(getStockManagement({ page: 1, limit: 5000, filter: 'all' }))
    dispatch(getAllSizes())
    dispatch(getAllPcd())
    dispatch(getAllFinishes())
    dispatch(getStepPresets())
  }, [dispatch])

  // Filter and process stock data for table
  const filteredStockData = useMemo(() => {
    if (!stockManagementData) return []

    return stockManagementData.filter(alloy => {
      const matchesSearch =
        !searchTerm ||
        alloy.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alloy.modelName?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSize = !filterSize || alloy.inches === filterSize
      const matchesPcd = !filterPcd || alloy.pcd === filterPcd
      const matchesFinish = !filterFinish || alloy.finish === filterFinish

      return matchesSearch && matchesSize && matchesPcd && matchesFinish
    })
  }, [stockManagementData, searchTerm, filterSize, filterPcd, filterFinish])

  // Calculate analytics for dashboard
  const analytics = useMemo(() => {
    if (!filteredStockData.length) {
      return {
        totalAlloys: stockPagination?.total || 0,
        stockUtilization: 0,
        lowStockAlloys: 0,
        outOfStockAlloys: 0,
        recommendations: []
      }
    }

    const totalAlloys = stockPagination?.total || filteredStockData.length
    let totalStock = 0
    let lowStockCount = 0
    let outOfStockCount = 0

    filteredStockData.forEach(alloy => {
      const stock = (alloy.inHouseStock || 0) + (alloy.showroomStock || 0)
      totalStock += stock
      if (stock === 0) outOfStockCount++
      else if (stock < 10) lowStockCount++
    })

    const stockUtilization =
      totalAlloys > 0 ? (totalStock / (totalAlloys * 50)) * 100 : 0

    return {
      totalAlloys,
      stockUtilization: Math.min(stockUtilization, 100),
      lowStockAlloys: lowStockCount,
      outOfStockAlloys: outOfStockCount,
      recommendations: [
        {
          type: 'info',
          icon: '🎯',
          title: 'Smart Selection',
          description: `${totalAlloys} alloys available for conversion planning`,
          action: 'Use checkboxes to select alloys for bulk conversion'
        },
        {
          type: outOfStockCount > 0 ? 'error' : 'success',
          icon: outOfStockCount > 0 ? '🚨' : '✅',
          title: 'Stock Status',
          description:
            outOfStockCount > 0
              ? `${outOfStockCount} alloys are out of stock`
              : 'All alloys have stock available',
          action:
            outOfStockCount > 0
              ? 'Focus on in-stock items for conversions'
              : 'Ready for production planning'
        },
        {
          type: lowStockCount > 5 ? 'warning' : 'info',
          icon: '📊',
          title: 'Low Stock Alert',
          description: `${lowStockCount} alloys have low stock (< 10 units)`,
          action: 'Consider prioritizing these for conversion'
        }
      ]
    }
  }, [filteredStockData, stockPagination])

  // Handle row selection
  const handleRowSelection = (selectedKeys, selectedRows) => {
    setSelectedRowKeys(selectedKeys)
    setSelectedAlloys(selectedRows)

    // Initialize conversion plans for new selections
    const newConversionPlans = { ...conversionPlans }
    selectedRows.forEach(alloy => {
      if (!newConversionPlans[alloy.id]) {
        newConversionPlans[alloy.id] = {
          sourceAlloy: alloy,
          targetFinish: null,
          targetAlloyId: null,
          quantity: 1,
          urgent: false
        }
      }
    })

    // Remove conversion plans for unselected alloys
    Object.keys(newConversionPlans).forEach(alloyId => {
      if (!selectedKeys.includes(parseInt(alloyId))) {
        delete newConversionPlans[alloyId]
      }
    })

    setConversionPlans(newConversionPlans)
  }

  // Handle target finish change
  const handleTargetFinishChange = (alloyId, targetFinish) => {
    setConversionPlans(prev => ({
      ...prev,
      [alloyId]: {
        ...prev[alloyId],
        targetFinish,
        targetAlloyId: alloyId // For now, same ID with different finish
      }
    }))
  }

  // Handle quantity change
  const handleQuantityChange = (alloyId, quantity) => {
    setConversionPlans(prev => ({
      ...prev,
      [alloyId]: {
        ...prev[alloyId],
        quantity: quantity || 1
      }
    }))
  }

  // Handle urgent change (not used in simplified version)
  // const handleUrgentChange = (alloyId, urgent) => {
  //   setConversionPlans(prev => ({
  //     ...prev,
  //     [alloyId]: {
  //       ...prev[alloyId],
  //       urgent
  //     }
  //   }))
  // }

  // Handle AI suggestion application
  const handleApplyAISuggestion = suggestion => {
    // First try to find the alloy in filtered data
    let alloy = filteredStockData.find(
      item => item.id === suggestion.sourceAlloyId
    )

    // If not found in filtered data, try to find in all stock data
    if (!alloy && stockManagementData) {
      alloy = stockManagementData.find(
        item => item.id === suggestion.sourceAlloyId
      )

      if (alloy) {
        // Clear filters to show the suggested alloy
        setSearchTerm('')
        setFilterSize(null)
        setFilterPcd(null)
        setFilterFinish(null)

        notification.info({
          message: 'Filters Cleared',
          description:
            'Search filters have been cleared to show the suggested alloy.'
        })
      }
    }

    if (!alloy) {
      notification.warning({
        message: 'Alloy Not Found',
        description:
          'The suggested alloy is not available in your inventory data.'
      })
      return
    }

    // Add to selections if not already selected
    if (!selectedRowKeys.includes(alloy.id)) {
      const newSelectedKeys = [...selectedRowKeys, alloy.id]
      const newSelectedAlloys = [...selectedAlloys, alloy]
      setSelectedRowKeys(newSelectedKeys)
      setSelectedAlloys(newSelectedAlloys)
    }

    // Apply suggestion to conversion plans
    setConversionPlans(prev => ({
      ...prev,
      [alloy.id]: {
        sourceAlloy: alloy,
        targetFinish: suggestion.targetFinish,
        targetAlloyId: suggestion.sourceAlloyId, // For now, same ID with different finish
        quantity: suggestion.suggestedQuantity,
        urgent: suggestion.priority === 'high'
      }
    }))

    notification.success({
      message: 'AI Suggestion Applied',
      description: `${suggestion.productName} added with ${suggestion.targetFinish} finish, quantity: ${suggestion.suggestedQuantity}`
    })
  }

  // Handle creating plan directly from AI suggestion
  const handleCreateFromAISuggestion = async suggestion => {
    try {
      const planData = {
        alloyId: suggestion.sourceAlloyId,
        convertId: suggestion.sourceAlloyId, // Target alloy ID (same for finish conversion)
        quantity: suggestion.suggestedQuantity,
        urgent: suggestion.priority === 'high',
        userId: user?.id || 1,
        presetName: null
      }

      await dispatch(createProductionPlan(planData)).unwrap()

      notification.success({
        message: 'Production Plan Created',
        description: `Created plan for ${suggestion.productName} based on AI suggestion`,
        duration: 4
      })

      // Navigate to production plans
      navigate('/production-plans')
    } catch (error) {
      notification.error({
        message: 'Failed to Create Plan',
        description:
          error?.message ||
          'Could not create production plan from AI suggestion'
      })
    }
  }

  // Table columns definition
  const columns = [
    {
      title: 'Size & PCD',
      key: 'size_pcd',
      width: 120,
      render: (_, record) => (
        <div>
          <div className='font-semibold text-blue-600'>{record.inches}"</div>
          <div className='text-sm text-gray-500'>{record.pcd}</div>
        </div>
      ),
      sorter: (a, b) => {
        const aSize = parseInt(a.inches) || 0
        const bSize = parseInt(b.inches) || 0
        if (aSize !== bSize) return aSize - bSize
        return (a.pcd || '').localeCompare(b.pcd || '')
      }
    },
    {
      title: 'Product Details',
      key: 'product',
      render: (_, record) => (
        <div>
          <div className='font-medium text-sm'>{record.productName}</div>
          <div className='text-xs text-gray-500'>
            {record.modelName} • {record.holes} holes • {record.width} width •{' '}
            {record.finish}
          </div>
        </div>
      )
    },
    {
      title: 'Current Stock',
      key: 'stock',
      width: 120,
      render: (_, record) => {
        const totalStock =
          (record.inHouseStock || 0) + (record.showroomStock || 0)
        return (
          <div className='text-center'>
            <div className='text-sm font-medium'>{totalStock} units</div>
            <div className='text-xs text-gray-500'>
              IH: {record.inHouseStock || 0} | SR: {record.showroomStock || 0}
            </div>
            {totalStock === 0 && (
              <Tag color='red' size='small'>
                OUT
              </Tag>
            )}
            {totalStock > 0 && totalStock < 10 && (
              <Tag color='orange' size='small'>
                LOW
              </Tag>
            )}
          </div>
        )
      },
      sorter: (a, b) => {
        const aStock = (a.inHouseStock || 0) + (a.showroomStock || 0)
        const bStock = (b.inHouseStock || 0) + (b.showroomStock || 0)
        return aStock - bStock
      }
    },
    {
      title: 'Target Finish',
      key: 'target_finish',
      width: 150,
      render: (_, record) => {
        const plan = conversionPlans[record.id]
        return (
          <Select
            placeholder='Select finish'
            value={plan?.targetFinish}
            onChange={value => handleTargetFinishChange(record.id, value)}
            size='small'
            className='w-full'
            disabled={!selectedRowKeys.includes(record.id)}
          >
            <Option value='Chrome'>Chrome</Option>
            <Option value='Diamond Cut'>Diamond Cut</Option>
            <Option value='Black'>Black</Option>
            <Option value='Silver'>Silver</Option>
            <Option value='Anthracite'>Anthracite</Option>
            <Option value='Gun Metal'>Gun Metal</Option>
          </Select>
        )
      }
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 100,
      render: (_, record) => {
        const plan = conversionPlans[record.id]
        const maxStock =
          (record.inHouseStock || 0) + (record.showroomStock || 0)
        return (
          <InputNumber
            value={plan?.quantity || 1}
            onChange={value => handleQuantityChange(record.id, value)}
            min={1}
            max={maxStock}
            size='small'
            className='w-full'
            disabled={!selectedRowKeys.includes(record.id)}
          />
        )
      }
    }
  ]

  // Handle bulk plan creation
  const handleCreateBulkPlans = async () => {
    const validPlans = Object.values(conversionPlans).filter(
      plan => plan.targetAlloyId && plan.quantity > 0
    )

    if (validPlans.length === 0) {
      notification.warning({
        message: 'No Valid Conversions',
        description:
          'Please select target finishes and quantities for at least one alloy.'
      })
      return
    }

    setIsCreatingPlans(true)
    try {
      const planPromises = validPlans.map(async plan => {
        const planData = {
          alloyId: plan.sourceAlloy.id,
          convertId: plan.targetAlloyId,
          quantity: plan.quantity,
          urgent: plan.urgent,
          userId: user?.id || 1,
          presetName: null
        }
        return dispatch(createProductionPlan(planData)).unwrap()
      })

      await Promise.all(planPromises)

      notification.success({
        message: 'Bulk Production Plans Created!',
        description: `Successfully created ${validPlans.length} conversion plans`,
        duration: 4
      })

      // Reset selections
      setSelectedRowKeys([])
      setSelectedAlloys([])
      setConversionPlans({})

      // Navigate to production plans
      navigate('/production-plans')
    } catch (error) {
      notification.error({
        message: 'Failed to Create Plans',
        description: error?.message || 'Some plans could not be created'
      })
    } finally {
      setIsCreatingPlans(false)
    }
  }

  return (
    <Layout>
      <div className='p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <Title level={2} className='mb-2 text-gray-800'>
                🚀 Smart Bulk Production Planner
              </Title>
              <Text className='text-gray-600 text-lg'>
                Select multiple alloys and plan conversions to different
                finishes in bulk
              </Text>
            </div>
            <Button
              type='primary'
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/production-workflow')}
              className='bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 border-0'
            >
              View Production Workflow
            </Button>
          </div>
        </div>

        {/* Controls and Filters */}
        <Card className='mb-6'>
          <Row gutter={[16, 16]} align='middle'>
            <Col xs={24} md={6}>
              <Search
                placeholder='Search alloys...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                allowClear
                size='large'
              />
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder='Size'
                value={filterSize}
                onChange={setFilterSize}
                allowClear
                size='large'
                className='w-full'
              >
                {(allSizes || []).map(size => (
                  <Option key={size.value} value={size.label}>
                    {size.label}"
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder='PCD'
                value={filterPcd}
                onChange={setFilterPcd}
                allowClear
                size='large'
                className='w-full'
              >
                {(allPcd || []).map(pcd => (
                  <Option key={pcd.value} value={pcd.label}>
                    {pcd.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder='Finish'
                value={filterFinish}
                onChange={setFilterFinish}
                allowClear
                size='large'
                className='w-full'
              >
                {(allFinishes?.data || []).map(finish => (
                  <Option key={finish.id} value={finish.finish}>
                    {finish.finish}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <div className='flex gap-2'>
                <Button
                  icon={<RocketOutlined />}
                  onClick={handleCreateBulkPlans}
                  disabled={selectedRowKeys.length === 0}
                  type='primary'
                  size='large'
                  loading={isCreatingPlans}
                  className='flex-1'
                >
                  Create {selectedRowKeys.length} Plans
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setSelectedRowKeys([])
                    setSelectedAlloys([])
                    setConversionPlans({})
                  }}
                  size='large'
                >
                  Clear
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            {/* Alloy Selection Table */}
            <Card
              title={
                <div className='flex justify-between items-center'>
                  <span>🔩 Select Alloys for Conversion</span>
                  <div className='text-sm text-gray-500'>
                    {selectedRowKeys.length} of {filteredStockData.length}{' '}
                    selected
                  </div>
                </div>
              }
            >
              <Table
                rowSelection={{
                  selectedRowKeys,
                  onChange: handleRowSelection,
                  checkStrictly: true
                }}
                columns={columns}
                dataSource={filteredStockData}
                rowKey='id'
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`
                }}
                scroll={{ x: 900 }}
                size='small'
                loading={loading}
              />
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            {/* Real-time Conversion Preview */}
            <Card title='🎯 Conversion Preview' className='sticky top-4'>
              {selectedRowKeys.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <div className='text-4xl mb-4'>📋</div>
                  <div>
                    Select alloys from the table to start planning conversions
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='text-sm text-gray-600 mb-4'>
                    Planning {selectedRowKeys.length} conversion(s):
                  </div>

                  <div className='max-h-96 overflow-y-auto space-y-3'>
                    {selectedAlloys.map(alloy => {
                      const plan = conversionPlans[alloy.id]
                      const totalStock =
                        (alloy.inHouseStock || 0) + (alloy.showroomStock || 0)

                      return (
                        <div
                          key={alloy.id}
                          className='p-3 bg-gray-50 rounded-lg border'
                        >
                          <div className='flex items-center justify-between mb-2'>
                            <div className='font-medium text-sm'>
                              {alloy.productName}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {alloy.inches}" × {alloy.pcd}
                            </div>
                          </div>

                          <div className='text-xs text-gray-600 mb-2'>
                            {alloy.finish} →{' '}
                            {plan?.targetFinish || 'Select target'}
                          </div>

                          <div className='flex items-center justify-between'>
                            <div className='text-xs'>
                              Stock: {totalStock} units
                            </div>
                            <div className='text-xs'>
                              Planning: {plan?.quantity || 1} units
                            </div>
                          </div>

                          {plan?.targetFinish && (
                            <div className='mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800'>
                              ✅ Ready for production
                            </div>
                          )}

                          {!plan?.targetFinish && (
                            <div className='mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800'>
                              ⚠️ Select target finish
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {selectedRowKeys.length > 0 && (
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                      <div className='text-sm font-medium mb-2'>Summary:</div>
                      <div className='text-xs text-gray-600 space-y-1'>
                        <div>Total plans: {selectedRowKeys.length}</div>
                        <div>
                          Ready to create:{' '}
                          {
                            Object.values(conversionPlans).filter(
                              p => p?.targetFinish
                            ).length
                          }
                        </div>
                        <div>
                          Need setup:{' '}
                          {selectedRowKeys.length -
                            Object.values(conversionPlans).filter(
                              p => p?.targetFinish
                            ).length}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            {/* AI Suggestions Panel */}
            <AISuggestionsPanel
              onApplySuggestion={handleApplyAISuggestion}
              onCreateFromSuggestion={handleCreateFromAISuggestion}
            />
          </Col>
        </Row>

        {/* Advanced Analytics */}
        <Row gutter={[16, 16]} className='mt-6'>
          <Col xs={24} lg={8}>
            <TrendAnalysisChart
              aiInsights={analytics.insights || {}}
              businessData={filteredStockData}
            />
          </Col>
          <Col xs={24} lg={16}>
            <SalesMetricsTable />
          </Col>
        </Row>

        {/* Quick Actions */}
        {selectedRowKeys.length > 0 && (
          <Card className='mt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <Title level={5} className='mb-1'>
                  🚀 Ready to Create Plans?
                </Title>
                <Text className='text-sm text-gray-600'>
                  {
                    Object.values(conversionPlans).filter(p => p?.targetFinish)
                      .length
                  }{' '}
                  of {selectedRowKeys.length} conversions are configured
                </Text>
              </div>
              <div className='flex gap-3'>
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    // Auto-fill missing target finishes with Chrome as default
                    const newPlans = { ...conversionPlans }
                    selectedAlloys.forEach(alloy => {
                      if (!newPlans[alloy.id]?.targetFinish) {
                        newPlans[alloy.id] = {
                          ...newPlans[alloy.id],
                          targetFinish: 'Chrome',
                          targetAlloyId: alloy.id
                        }
                      }
                    })
                    setConversionPlans(newPlans)
                  }}
                  disabled={
                    Object.values(conversionPlans).filter(p => p?.targetFinish)
                      .length === selectedRowKeys.length
                  }
                >
                  Auto-Complete (Chrome)
                </Button>
                <Button
                  type='primary'
                  size='large'
                  icon={<RocketOutlined />}
                  onClick={handleCreateBulkPlans}
                  disabled={
                    Object.values(conversionPlans).filter(p => p?.targetFinish)
                      .length === 0
                  }
                  loading={isCreatingPlans}
                >
                  Create{' '}
                  {
                    Object.values(conversionPlans).filter(p => p?.targetFinish)
                      .length
                  }{' '}
                  Plans
                </Button>
              </div>
            </div>
          </Card>
        )}

        {loading && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white p-6 rounded-lg'>
              <Spin size='large' />
              <div className='mt-4 text-center'>Loading stock data...</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SmartProductionDashboard
