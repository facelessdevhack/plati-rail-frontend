import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Card,
  Modal,
  Form,
  InputNumber,
  notification,
  Tag,
  Row,
  Col,
  Typography,
  Switch,
  Divider
} from 'antd'
import {
  ReloadOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import {
  getStockManagement,
  getAllSizes,
  getAllPcd,
  getAllFinishes,
  getConversionOptions
} from '../../redux/api/stockAPI'
import {
  createProductionPlan,
  getStepPresets,
  getPresetDetails
} from '../../redux/api/productionAPI'
import Layout from '../Layout/layout'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const AlloySelection = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Redux state
  const {
    stockManagementData,
    stockPagination,
    loading,
    allSizes,
    allPcd,
    allFinishes,
    conversionOptions
  } = useSelector(state => state.stockDetails)

  const { stepPresets, presetDetails } = useSelector(state => state.productionDetails)
  const { user } = useSelector(state => state.userDetails)

  // Local state management
  const [searchText, setSearchText] = useState('')
  const [selectedPcd, setSelectedPcd] = useState(null)
  const [selectedInches, setSelectedInches] = useState(null)
  const [selectedFinish, setSelectedFinish] = useState(null)

  // Modal states
  const [createPlanModalVisible, setCreatePlanModalVisible] = useState(false)
  const [presetPreviewModalVisible, setPresetPreviewModalVisible] =
    useState(false)
  const [selectedAlloy, setSelectedAlloy] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [previewPresetName, setPreviewPresetName] = useState(null)
  const [form] = Form.useForm()
  const [isCreating, setIsCreating] = useState(false)

  // Fetch stock data
  const fetchStockData = (
    page = 1,
    pageSize = 50,
    search = '',
    pcd = null,
    inches = null,
    finish = null
  ) => {
    const params = { page, limit: pageSize, search, filter: 'all', pcd, inches }
    if (finish) params.finish = finish
    dispatch(getStockManagement(params))
  }

  // Load initial data
  useEffect(() => {
    fetchStockData()
    dispatch(getAllSizes())
    dispatch(getAllPcd())
    dispatch(getAllFinishes())
    dispatch(getStepPresets())
  }, [dispatch])

  // Get stock status
  const getStockStatus = (inHouseStock, showroomStock) => {
    const totalStock = (inHouseStock || 0) + (showroomStock || 0)

    if (totalStock === 0) {
      return {
        status: 'Out of Stock',
        color: 'red',
        icon: <CloseCircleOutlined />
      }
    } else if (totalStock < 10) {
      return {
        status: 'Low Stock',
        color: 'orange',
        icon: <ExclamationCircleOutlined />
      }
    } else {
      return {
        status: 'In Stock',
        color: 'green',
        icon: <CheckCircleOutlined />
      }
    }
  }

  // Handle preset preview
  const handlePreviewPreset = async presetName => {
    try {
      await dispatch(getPresetDetails({ presetName })).unwrap()
      setPreviewPresetName(presetName)
      setPresetPreviewModalVisible(true)
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to load preset details'
      })
    }
  }

  // Get category color for tags
  const getCategoryColor = category => {
    const colors = {
      basic: 'blue',
      chrome: 'gold',
      premium: 'purple',
      standard: 'green',
      urgent: 'red',
      custom: 'orange'
    }
    return colors[category] || 'default'
  }

  // Handle create production plan
  const handleCreatePlan = async values => {
    setIsCreating(true)
    try {
      // Validate stock availability
      const totalSourceStock =
        (selectedAlloy?.inHouseStock || 0) + (selectedAlloy?.showroomStock || 0)
      if (totalSourceStock < values.quantity) {
        notification.error({
          message: 'Insufficient Stock',
          description: `Cannot create production plan for ${values.quantity} units. Only ${totalSourceStock} units available in stock.`
        })
        setIsCreating(false)
        return
      }

      const planData = {
        alloyId: selectedAlloy.id,
        convertId: values.convertId,
        quantity: values.quantity,
        urgent: values.urgent || false,
        userId: user?.id || 1,
        presetName: selectedPreset || null
      }

      await dispatch(createProductionPlan(planData)).unwrap()

      notification.success({
        message: 'Success',
        description: 'Production plan created successfully!'
      })

      form.resetFields()
      setCreatePlanModalVisible(false)
      setSelectedAlloy(null)
      setSelectedPreset(null)

      // Refresh stock data to reflect updated stock
      handleRefresh()

      // Navigate back to production listing
      navigate('/production-plans')
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error?.message || 'Failed to create production plan'
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Table columns
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
            {record.modelName} • {record.holes} holes • {record.finish}
          </div>
        </div>
      )
    },
    {
      title: 'Stock',
      key: 'stock',
      width: 100,
      render: (_, record) => (
        <div className='text-center'>
          <div className='text-sm'>
            <span className='text-blue-600 font-medium'>
              {record.inHouseStock || 0}
            </span>
            <span className='text-gray-400 mx-1'>|</span>
            <span className='text-green-600 font-medium'>
              {record.showroomStock || 0}
            </span>
          </div>
          <div className='text-xs text-gray-500'>IH | SR</div>
        </div>
      )
    },
    {
      title: 'Last Production',
      key: 'last_production',
      width: 120,
      render: (_, record) => (
        <div className='text-center'>
          {record.lastProductionDate ? (
            <div>
              <div className='text-sm font-medium'>
                {moment(record.lastProductionDate).format('MMM DD, YY')}
              </div>
              <div className='text-xs text-gray-500'>
                {moment(record.lastProductionDate).fromNow()}
              </div>
            </div>
          ) : (
            <div className='text-sm text-gray-400'>Never</div>
          )}
        </div>
      ),
      sorter: (a, b) => {
        if (!a.lastProductionDate && !b.lastProductionDate) return 0
        if (!a.lastProductionDate) return 1
        if (!b.lastProductionDate) return -1
        return (
          moment(b.lastProductionDate).unix() -
          moment(a.lastProductionDate).unix()
        )
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const { status, color, icon } = getStockStatus(
          record.inHouseStock,
          record.showroomStock
        )
        return (
          <Tag color={color} icon={icon} className='text-xs'>
            {status}
          </Tag>
        )
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type='primary'
          size='small'
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedAlloy(record)
            setCreatePlanModalVisible(true)
            // Fetch conversion options for this alloy
            dispatch(getConversionOptions({ alloyId: record.id }))
          }}
          className='w-full'
        >
          Create Plan
        </Button>
      )
    }
  ]

  // Table pagination config
  const handleTableChange = paginationConfig => {
    fetchStockData(
      paginationConfig.current,
      paginationConfig.pageSize,
      searchText,
      selectedPcd,
      selectedInches,
      selectedFinish
    )
  }

  // Search handler
  const handleSearch = value => {
    setSearchText(value)
    fetchStockData(
      1,
      stockPagination.pageSize,
      value,
      selectedPcd,
      selectedInches,
      selectedFinish
    )
  }

  // Filter handlers
  const handlePcdFilter = value => {
    setSelectedPcd(value)
    fetchStockData(
      1,
      stockPagination.pageSize,
      searchText,
      value,
      selectedInches,
      selectedFinish
    )
  }

  const handleInchesFilter = value => {
    setSelectedInches(value)
    fetchStockData(
      1,
      stockPagination.pageSize,
      searchText,
      selectedPcd,
      value,
      selectedFinish
    )
  }

  const handleFinishFilter = value => {
    setSelectedFinish(value)
    fetchStockData(
      1,
      stockPagination.pageSize,
      searchText,
      selectedPcd,
      selectedInches,
      value
    )
  }

  // Clear filters handler
  const handleClearFilters = () => {
    setSelectedPcd(null)
    setSelectedInches(null)
    setSelectedFinish(null)
    setSearchText('')
    fetchStockData(1, stockPagination.pageSize, '', null, null, null)
  }

  // Refresh handler
  const handleRefresh = () => {
    fetchStockData(
      stockPagination.current,
      stockPagination.pageSize,
      searchText,
      selectedPcd,
      selectedInches,
      selectedFinish
    )
  }

  return (
    <Layout>
      <div className='p-4 bg-gray-50 min-h-screen'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center gap-3 mb-2'>
            <Button
              type='text'
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/production-plans')}
            >
              Back to Production Plans
            </Button>
          </div>
          <Title level={2} className='mb-2'>
            🔩 Select Alloy for Production Plan
          </Title>
          <Text type='secondary'>
            Choose an alloy wheel from inventory to create a production plan
          </Text>
        </div>

        {/* Controls */}
        <Card className='mb-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div className='flex flex-wrap items-center gap-4'>
              <Search
                placeholder='Search alloys...'
                style={{ width: 300 }}
                onSearch={handleSearch}
                onChange={e => e.target.value === '' && handleSearch('')}
                allowClear
              />
              <Select
                placeholder='Filter by Size'
                style={{ width: 120 }}
                value={selectedInches}
                onChange={handleInchesFilter}
                allowClear
              >
                {(allSizes || []).map(size => (
                  <Option key={size.value} value={size.label}>
                    {size.label}"
                  </Option>
                ))}
              </Select>
              <Select
                placeholder='Filter by PCD'
                style={{ width: 120 }}
                value={selectedPcd}
                onChange={handlePcdFilter}
                allowClear
              >
                {(allPcd || []).map(pcd => (
                  <Option key={pcd.value} value={pcd.label}>
                    {pcd.label}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder='Filter by Finish'
                style={{ width: 150 }}
                value={selectedFinish}
                onChange={handleFinishFilter}
                allowClear
              >
                {(allFinishes?.data || []).map(finish => (
                  <Option key={finish.id} value={finish.finish}>
                    {finish.finish}
                  </Option>
                ))}
              </Select>
              <Button
                onClick={handleClearFilters}
                disabled={
                  !selectedPcd &&
                  !selectedInches &&
                  !selectedFinish &&
                  !searchText
                }
              >
                Clear Filters
              </Button>
            </div>

            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
          </div>
        </Card>

        {/* Alloys Table */}
        <Card>
          <div className='mb-4'>
            <Title level={4}>Available Alloy Wheels</Title>
            <Text type='secondary'>
              {stockPagination?.total > 0
                ? `Found ${stockPagination.total} alloy wheels`
                : 'No alloy wheels found'}
            </Text>
          </div>
          <Table
            columns={columns}
            dataSource={
              Array.isArray(stockManagementData) ? stockManagementData : []
            }
            rowKey='id'
            loading={loading}
            pagination={{
              ...stockPagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`
            }}
            onChange={handleTableChange}
            scroll={{ x: 800 }}
            size='small'
          />
        </Card>

        {/* Create Production Plan Modal */}
        <Modal
          title={
            <div>
              <span>🏭 Create Production Plan</span>
              <br />
              <span className="text-sm font-normal text-gray-600">
                Converting: {selectedAlloy?.productName}
              </span>
            </div>
          }
          open={createPlanModalVisible}
          onCancel={() => {
            setCreatePlanModalVisible(false)
            form.resetFields()
            setSelectedAlloy(null)
            setSelectedPreset(null)
          }}
          footer={null}
          width={600}
          destroyOnClose
        >
          <Form
            form={form}
            layout='vertical'
            onFinish={handleCreatePlan}
            className='mt-4'
          >
            {/* Source Alloy Info */}
            <div className='bg-blue-50 p-4 rounded-lg mb-4'>
              <div className='text-sm font-medium text-blue-900 mb-2'>
                📦 Source Alloy (Starting Material)
              </div>
              <div className='text-blue-800 font-semibold text-lg'>{selectedAlloy?.productName}</div>
              <div className='text-sm text-blue-700 mt-1'>
                {selectedAlloy?.modelName} • {selectedAlloy?.inches}" • {selectedAlloy?.pcd} • {selectedAlloy?.finish}
              </div>
              <div className='text-xs text-blue-600 mt-2 bg-blue-100 px-2 py-1 rounded'>
                Available Stock: {selectedAlloy?.inHouseStock || 0} (In-House) + {selectedAlloy?.showroomStock || 0} (Showroom) = {(selectedAlloy?.inHouseStock || 0) + (selectedAlloy?.showroomStock || 0)} Total
              </div>
            </div>

            {/* Production Step Preset Selection */}
            <Form.Item
              name='presetName'
              label={
                <div className='flex items-center justify-between w-full'>
                  <span>Production Workflow Preset (Optional)</span>
                  {selectedPreset && (
                    <Button
                      type='link'
                      size='small'
                      icon={<EyeOutlined />}
                      onClick={() => handlePreviewPreset(selectedPreset)}
                    >
                      Preview Steps
                    </Button>
                  )}
                </div>
              }
            >
              <Select
                placeholder='Select a preset workflow or leave empty for manual selection'
                allowClear
                size='large'
                onChange={value => {
                  setSelectedPreset(value)
                  form.setFieldsValue({ presetName: value })
                }}
                value={selectedPreset}
                showSearch
                optionFilterProp='children'
                filterOption={(input, option) => {
                  const preset =
                    option?.children?.props?.children?.[0]?.props?.children ||
                    ''
                  const description =
                    option?.children?.props?.children?.[1]?.props?.children ||
                    ''
                  return (
                    preset.toLowerCase().includes(input.toLowerCase()) ||
                    description.toLowerCase().includes(input.toLowerCase())
                  )
                }}
              >
                {(stepPresets || [])
                  .reduce((acc, preset) => {
                    const existingCategory = acc.find(
                      item => item.category === preset.presetCategory
                    )
                    if (existingCategory) {
                      existingCategory.presets.push(preset)
                    } else {
                      acc.push({
                        category: preset.presetCategory,
                        presets: [preset]
                      })
                    }
                    return acc
                  }, [])
                  .map(categoryGroup => (
                    <Select.OptGroup
                      key={categoryGroup.category}
                      label={categoryGroup.category?.toUpperCase()}
                    >
                      {categoryGroup.presets.map(preset => (
                        <Option
                          key={preset.presetName}
                          value={preset.presetName}
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <div className='font-medium flex items-center gap-2'>
                                {preset.presetName}
                                <Tag
                                  color={getCategoryColor(
                                    preset.presetCategory
                                  )}
                                  size='small'
                                >
                                  {preset.presetCategory?.toUpperCase()}
                                </Tag>
                              </div>
                              <div className='text-xs text-gray-500'>
                                {preset.presetDescription} •{' '}
                                {preset.stepCount || 0} steps
                              </div>
                            </div>
                          </div>
                        </Option>
                      ))}
                    </Select.OptGroup>
                  ))}
              </Select>
            </Form.Item>

            {selectedPreset && (
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4'>
                <div className='flex items-start justify-between'>
                  <div className='text-sm text-blue-800'>
                    <div className='flex items-center gap-2 mb-2'>
                      <InfoCircleOutlined />
                      <strong>Preset Selected: {selectedPreset}</strong>
                    </div>
                    <p className='text-blue-700 mb-2'>
                      This preset workflow will be automatically applied to your
                      production plan, streamlining the setup process with
                      predefined steps.
                    </p>
                    <div className='text-xs text-blue-600'>
                      ✓ Steps will be created automatically • ✓ Ready to start
                      production immediately
                    </div>
                  </div>
                  <Button
                    type='link'
                    size='small'
                    icon={<EyeOutlined />}
                    onClick={() => handlePreviewPreset(selectedPreset)}
                    className='text-blue-600'
                  >
                    View Details
                  </Button>
                </div>
              </div>
            )}

            {/* Convert To Alloy */}
            <Form.Item
              name='convertId'
              label='🎯 Target Alloy (Convert To)'
              rules={[
                {
                  required: true,
                  message: 'Please select target alloy to convert to!'
                }
              ]}
            >
              <Select
                showSearch
                placeholder='Select target alloy finish to convert to (same specifications, different finish)'
                optionFilterProp='children'
                filterOption={(input, option) =>
                  option?.children?.props?.children?.[0]?.props?.children?.toLowerCase()?.includes(input.toLowerCase()) ||
                  option?.children?.props?.children?.[1]?.props?.children?.toLowerCase()?.includes(input.toLowerCase())
                }
                size='large'
                loading={loading}
                notFoundContent={
                  conversionOptions?.length === 0
                    ? 'No conversion options available for this alloy'
                    : 'Loading...'
                }
              >
                {(conversionOptions || []).map(alloy => (
                  <Option key={alloy.id} value={alloy.id}>
                    <div className='py-1'>
                      <div className='font-semibold text-gray-800'>{alloy.productName}</div>
                      <div className='text-xs text-gray-500 flex items-center justify-between'>
                        <span>{alloy.finishName} finish</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          (alloy.totalStock || 0) > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          Stock: {alloy.totalStock || 0}
                        </span>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {conversionOptions?.length === 0 && selectedAlloy && (
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4'>
                <div className='text-sm text-yellow-800'>
                  <strong>No conversion options available</strong>
                  <br />
                  This alloy can only be converted to the same model with
                  different finishes. No other finish variants are available for{' '}
                  <strong>{selectedAlloy?.modelName}</strong>.
                </div>
              </div>
            )}

            {/* Conversion Flow Summary (when target is selected) */}
            {form.getFieldValue('convertId') && conversionOptions?.length > 0 && (
              <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
                <div className='text-sm font-medium text-green-900 mb-3'>
                  🔄 Production Conversion Summary
                </div>
                <div className='flex items-center justify-center space-x-4'>
                  <div className='text-center flex-1'>
                    <div className='text-xs text-green-600 mb-1'>FROM</div>
                    <div className='bg-white p-2 rounded border'>
                      <div className='font-medium text-sm text-gray-800'>
                        {selectedAlloy?.productName}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {selectedAlloy?.finish} finish
                      </div>
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    <div className='text-green-600 text-xl'>→</div>
                  </div>
                  <div className='text-center flex-1'>
                    <div className='text-xs text-green-600 mb-1'>TO</div>
                    <div className='bg-white p-2 rounded border'>
                      {(() => {
                        const targetAlloy = conversionOptions?.find(option => 
                          option.id === form.getFieldValue('convertId')
                        );
                        return targetAlloy ? (
                          <>
                            <div className='font-medium text-sm text-gray-800'>
                              {targetAlloy.productName}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {targetAlloy.finishName} finish
                            </div>
                          </>
                        ) : (
                          <div className='text-xs text-gray-400'>Select target</div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity and Priority */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={16}>
                <Form.Item
                  name='quantity'
                  label={
                    <div className='flex items-center justify-between'>
                      <span>Quantity</span>
                      <span className='text-xs text-gray-500 font-normal'>
                        Available:{' '}
                        {(selectedAlloy?.inHouseStock || 0) +
                          (selectedAlloy?.showroomStock || 0)}
                      </span>
                    </div>
                  }
                  rules={[
                    { required: true, message: 'Please enter quantity!' },
                    {
                      type: 'number',
                      min: 1,
                      max:
                        (selectedAlloy?.inHouseStock || 0) +
                          (selectedAlloy?.showroomStock || 0) || 10000,
                      message: `Quantity must be between 1 and ${
                        (selectedAlloy?.inHouseStock || 0) +
                        (selectedAlloy?.showroomStock || 0)
                      } (available stock)`
                    }
                  ]}
                >
                  <InputNumber
                    placeholder='Enter quantity'
                    style={{ width: '100%' }}
                    size='large'
                    min={1}
                    max={
                      (selectedAlloy?.inHouseStock || 0) +
                        (selectedAlloy?.showroomStock || 0) || 10000
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  name='urgent'
                  label='Priority'
                  valuePropName='checked'
                  initialValue={false}
                >
                  <div className='flex items-center gap-3 pt-2'>
                    <Switch size='default' />
                    <span className='text-sm text-gray-600'>
                      Mark as Urgent
                    </span>
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
              <Button
                size='large'
                onClick={() => {
                  setCreatePlanModalVisible(false)
                  form.resetFields()
                  setSelectedAlloy(null)
                  setSelectedPreset(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type='primary'
                size='large'
                htmlType='submit'
                loading={isCreating}
                icon={<PlusOutlined />}
              >
                Create Production Plan
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Preset Preview Modal */}
        <Modal
          title={`Preset Preview: ${previewPresetName}`}
          open={presetPreviewModalVisible}
          onCancel={() => {
            setPresetPreviewModalVisible(false)
            setPreviewPresetName(null)
          }}
          footer={[
            <Button
              key='close'
              onClick={() => {
                setPresetPreviewModalVisible(false)
                setPreviewPresetName(null)
              }}
            >
              Close
            </Button>,
            <Button
              key='select'
              type='primary'
              onClick={() => {
                setSelectedPreset(previewPresetName)
                form.setFieldsValue({ presetName: previewPresetName })
                setPresetPreviewModalVisible(false)
                setPreviewPresetName(null)
              }}
              disabled={selectedPreset === previewPresetName}
            >
              {selectedPreset === previewPresetName
                ? 'Already Selected'
                : 'Select This Preset'}
            </Button>
          ]}
          width={600}
        >
          {presetDetails && presetDetails.length > 0 && (
            <div className='mt-4'>
              <div className='mb-4'>
                <Text strong>Category: </Text>
                <Tag color={getCategoryColor(presetDetails[0]?.presetCategory)}>
                  {presetDetails[0]?.presetCategory?.toUpperCase()}
                </Tag>
              </div>

              <div className='mb-4'>
                <Text strong>Description: </Text>
                <Text>
                  {presetDetails[0]?.presetDescription ||
                    'No description available'}
                </Text>
              </div>

              <div className='mb-2'>
                <Text strong>Workflow Overview:</Text>
              </div>
              <div className='bg-gray-50 rounded-lg p-3 mb-4'>
                <div className='text-sm text-gray-600'>
                  This preset contains{' '}
                  <strong>{presetDetails.length} production steps</strong> that
                  will be automatically added to your production plan. Each step
                  must be completed in order before moving to the next phase.
                </div>
              </div>

              <Divider>Production Steps ({presetDetails.length})</Divider>

              <div className='space-y-3 max-h-300 overflow-y-auto'>
                {presetDetails
                  .sort((a, b) => a.stepOrder - b.stepOrder)
                  .map((step) => (
                    <div
                      key={step.id}
                      className='flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow'
                    >
                      <div className='flex items-center gap-4 w-full'>
                        <div className='flex-shrink-0'>
                          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                            <Text strong className='text-blue-600'>
                              {step.stepOrder}
                            </Text>
                          </div>
                        </div>
                        <div className='flex-grow'>
                          <div className='font-medium text-gray-900'>
                            {step.stepName}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {step.isRequired ? (
                              <span className='text-red-600'>
                                ● Required Step
                              </span>
                            ) : (
                              <span className='text-green-600'>
                                ○ Optional Step
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='flex-shrink-0'>
                          <div className='text-xs text-gray-400'>
                            Step ID: {step.stepId}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='text-sm text-blue-800'>
                  <strong>💡 Tip:</strong> Once this preset is applied, you can
                  still add additional custom steps to your production plan if
                  needed. The preset steps will serve as the foundation of your
                  workflow.
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  )
}

export default AlloySelection
