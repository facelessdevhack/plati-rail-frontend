import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Space,
  message,
  Typography,
  DatePicker,
  Select,
  Tabs,
  Progress,
  Empty,
  Spin,
  Button,
  Tag,
  Input,
  Alert,
  InputNumber,
  Tooltip,
  Popconfirm
} from 'antd'
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  ReloadOutlined,
  SearchOutlined,
  BarChartOutlined,
  PieChartOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  SettingOutlined,
  BankOutlined,
  PlusOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const PLDashboardPage = () => {
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1)
  const [summaryData, setSummaryData] = useState(null)
  const [productData, setProductData] = useState([])
  const [productTotals, setProductTotals] = useState(null)
  const [trendsData, setTrendsData] = useState([])
  const [byInchesData, setByInchesData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [trendsMonths, setTrendsMonths] = useState(12)

  // Costing edit state
  const [editingProductId, setEditingProductId] = useState(null)
  const [editingCostValue, setEditingCostValue] = useState(null)
  const [savingCost, setSavingCost] = useState(false)

  // Overhead state
  const [overheadData, setOverheadData] = useState(null)
  const [overheadLoading, setOverheadLoading] = useState(false)
  const [editingOverheadId, setEditingOverheadId] = useState(null)
  const [editingOverheadValue, setEditingOverheadValue] = useState(null)
  const [savingOverhead, setSavingOverhead] = useState(false)
  const [productionVolume, setProductionVolume] = useState(0)
  const [editingVolume, setEditingVolume] = useState(false)
  const [tempVolumeValue, setTempVolumeValue] = useState(0)

  // Fetch monthly P&L summary
  const fetchMonthlySummary = useCallback(async () => {
    try {
      const response = await client.get('/cost-management/pnl/monthly', {
        params: { year: selectedYear, month: selectedMonth }
      })
      setSummaryData(response.data.data?.summary || null)
    } catch (error) {
      console.error('Error fetching monthly summary:', error)
      message.error('Failed to fetch monthly summary')
    }
  }, [selectedYear, selectedMonth])

  // Fetch product-wise P&L
  const fetchProductPnL = useCallback(async () => {
    try {
      const response = await client.get('/cost-management/pnl/products', {
        params: { year: selectedYear, month: selectedMonth, limit: 500 }
      })
      setProductData(response.data.data?.products || [])
      setProductTotals(response.data.data?.totals || null)
    } catch (error) {
      console.error('Error fetching product P&L:', error)
      message.error('Failed to fetch product-wise P&L')
    }
  }, [selectedYear, selectedMonth])

  // Fetch P&L trends
  const fetchTrends = useCallback(async () => {
    try {
      const response = await client.get('/cost-management/pnl/trends', {
        params: { months: trendsMonths }
      })
      setTrendsData(response.data.data || [])
    } catch (error) {
      console.error('Error fetching trends:', error)
    }
  }, [trendsMonths])

  // Fetch P&L by inches
  const fetchByInches = useCallback(async () => {
    try {
      const response = await client.get('/cost-management/pnl/by-inches', {
        params: { year: selectedYear, month: selectedMonth }
      })
      setByInchesData(response.data.data?.byInches || [])
    } catch (error) {
      console.error('Error fetching by inches:', error)
    }
  }, [selectedYear, selectedMonth])

  // Fetch monthly overheads
  const fetchOverheads = useCallback(async () => {
    setOverheadLoading(true)
    try {
      const response = await client.get(`/cost-management/overheads/${selectedYear}/${selectedMonth}`)
      setOverheadData(response.data.data)
      setProductionVolume(response.data.data?.productionVolume || 0)
    } catch (error) {
      console.error('Error fetching overheads:', error)
    } finally {
      setOverheadLoading(false)
    }
  }, [selectedYear, selectedMonth])

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchMonthlySummary(),
        fetchProductPnL(),
        fetchTrends(),
        fetchByInches(),
        fetchOverheads()
      ])
    } finally {
      setLoading(false)
    }
  }, [fetchMonthlySummary, fetchProductPnL, fetchTrends, fetchByInches, fetchOverheads])

  useEffect(() => {
    fetchAllData()
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    fetchTrends()
  }, [trendsMonths])

  // Start editing a product's costing
  const startEditingCost = (product) => {
    setEditingProductId(product.productId)
    setEditingCostValue(product.unitCost || 0)
  }

  // Cancel editing
  const cancelEditingCost = () => {
    setEditingProductId(null)
    setEditingCostValue(null)
  }

  // Save the edited costing
  const saveProductCosting = async (productId) => {
    if (editingCostValue === null || editingCostValue === undefined) {
      message.warning('Please enter a valid cost')
      return
    }

    setSavingCost(true)
    try {
      await client.put(`/alloys/stock/update-costing/${productId}`, {
        costing: editingCostValue
      })

      // Update local state
      setProductData(prev =>
        prev.map(p =>
          p.productId === productId
            ? { ...p, unitCost: editingCostValue }
            : p
        )
      )

      message.success('Costing updated successfully')
      setEditingProductId(null)
      setEditingCostValue(null)

      // Refresh data to get updated P&L calculations
      fetchAllData()
    } catch (error) {
      console.error('Error updating costing:', error)
      message.error('Failed to update costing')
    } finally {
      setSavingCost(false)
    }
  }

  // Start editing an overhead value
  const startEditingOverhead = (category) => {
    setEditingOverheadId(category.categoryId)
    setEditingOverheadValue(category.actualValue || 0)
  }

  // Cancel overhead editing
  const cancelEditingOverhead = () => {
    setEditingOverheadId(null)
    setEditingOverheadValue(null)
  }

  // Save overhead value
  const saveOverheadValue = async (categoryId) => {
    if (editingOverheadValue === null || editingOverheadValue === undefined) {
      message.warning('Please enter a valid value')
      return
    }

    setSavingOverhead(true)
    try {
      await client.post('/cost-management/overheads', {
        categoryId,
        year: selectedYear,
        month: selectedMonth,
        actualValue: editingOverheadValue
      })

      message.success('Overhead value updated successfully')
      setEditingOverheadId(null)
      setEditingOverheadValue(null)
      fetchOverheads()
    } catch (error) {
      console.error('Error updating overhead:', error)
      message.error('Failed to update overhead value')
    } finally {
      setSavingOverhead(false)
    }
  }

  // Save production volume
  const saveProductionVolume = async () => {
    try {
      await client.patch(`/cost-management/overheads/${selectedYear}/${selectedMonth}/volume`, {
        productionVolume: tempVolumeValue
      })
      message.success('Production volume updated')
      setEditingVolume(false)
      setProductionVolume(tempVolumeValue)
      fetchOverheads()
    } catch (error) {
      console.error('Error updating production volume:', error)
      message.error('Failed to update production volume')
    }
  }

  // Calculate total overheads
  const totalOverheads = overheadData?.grandTotal || 0

  // Calculate Net Profit
  const netProfit = (summaryData?.grossProfit || 0) - totalOverheads

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0'
    return `₹${parseFloat(value).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0%'
    return `${parseFloat(value).toFixed(1)}%`
  }

  // Filter products by search text
  const filteredProducts = productData.filter(product => {
    if (!searchText) return true
    const search = searchText.toLowerCase()
    return (
      (product.productName && product.productName.toLowerCase().includes(search)) ||
      (product.uniqueId && product.uniqueId.toLowerCase().includes(search)) ||
      (product.model && product.model.toLowerCase().includes(search)) ||
      (product.finish && product.finish.toLowerCase().includes(search)) ||
      (product.inches && String(product.inches).includes(search))
    )
  })

  // Generate year options (last 5 years)
  const yearOptions = []
  for (let y = dayjs().year(); y >= dayjs().year() - 4; y--) {
    yearOptions.push({ label: y.toString(), value: y })
  }

  // Product columns
  const productColumns = [
    {
      title: 'Product',
      key: 'product',
      width: 250,
      fixed: 'left',
      render: (record) => (
        <div>
          <Text strong style={{ fontSize: '13px' }}>{record.productName || 'N/A'}</Text>
          <div style={{ fontSize: '11px', color: '#888' }}>
            {record.uniqueId && <Tag color='blue' style={{ fontSize: '10px' }}>{record.uniqueId}</Tag>}
            {record.inches && <Tag color='cyan' style={{ fontSize: '10px' }}>{record.inches}"</Tag>}
          </div>
        </div>
      ),
      sorter: (a, b) => (a.productName || '').localeCompare(b.productName || '')
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 100,
      render: (val) => val || '-'
    },
    {
      title: 'Finish',
      dataIndex: 'finish',
      key: 'finish',
      width: 100,
      render: (val) => val || '-'
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 180,
      render: (val, record) => {
        const isEditing = editingProductId === record.productId

        if (isEditing) {
          return (
            <Space size='small'>
              <InputNumber
                value={editingCostValue}
                onChange={setEditingCostValue}
                min={0}
                size='small'
                style={{ width: 90 }}
                formatter={value => `₹${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₹\s?|(,*)/g, '')}
                autoFocus
                onPressEnter={() => saveProductCosting(record.productId)}
              />
              <Tooltip title='Save'>
                <Button
                  type='primary'
                  size='small'
                  icon={<SaveOutlined />}
                  loading={savingCost}
                  onClick={() => saveProductCosting(record.productId)}
                />
              </Tooltip>
              <Tooltip title='Cancel'>
                <Button
                  size='small'
                  icon={<CloseOutlined />}
                  onClick={cancelEditingCost}
                />
              </Tooltip>
            </Space>
          )
        }

        return (
          <Space size='small'>
            <span style={{ color: val ? '#52c41a' : '#ff4d4f' }}>
              {val ? formatCurrency(val) : 'Not Set'}
            </span>
            <Tooltip title='Edit Costing'>
              <Button
                type='text'
                size='small'
                icon={<EditOutlined />}
                onClick={() => startEditingCost(record)}
              />
            </Tooltip>
          </Space>
        )
      },
      sorter: (a, b) => (a.unitCost || 0) - (b.unitCost || 0)
    },
    {
      title: 'Qty Sold',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 80,
      render: (val) => val || 0,
      sorter: (a, b) => (a.totalQuantity || 0) - (b.totalQuantity || 0)
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      render: (val) => <Text style={{ color: '#1890ff' }}>{formatCurrency(val)}</Text>,
      sorter: (a, b) => (a.revenue || 0) - (b.revenue || 0)
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      render: (val) => <Text style={{ color: '#fa8c16' }}>{formatCurrency(val)}</Text>,
      sorter: (a, b) => (a.cost || 0) - (b.cost || 0)
    },
    {
      title: 'Gross Profit',
      dataIndex: 'grossProfit',
      key: 'grossProfit',
      width: 120,
      render: (val) => (
        <Text strong style={{ color: parseFloat(val) >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(val)}
        </Text>
      ),
      sorter: (a, b) => (a.grossProfit || 0) - (b.grossProfit || 0),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Margin %',
      dataIndex: 'grossProfitMargin',
      key: 'grossProfitMargin',
      width: 130,
      render: (val) => (
        <Progress
          percent={Math.min(Math.abs(val || 0), 100)}
          size='small'
          status={val >= 15 ? 'success' : val >= 5 ? 'normal' : 'exception'}
          format={() => formatPercent(val)}
          strokeColor={val >= 15 ? '#52c41a' : val >= 5 ? '#1890ff' : '#ff4d4f'}
        />
      ),
      sorter: (a, b) => (a.grossProfitMargin || 0) - (b.grossProfitMargin || 0)
    }
  ]

  // Trends columns
  const trendsColumns = [
    {
      title: 'Month',
      key: 'month',
      width: 120,
      render: (record) => (
        <Text strong>{MONTH_NAMES[record.month - 1]} {record.year}</Text>
      )
    },
    {
      title: 'Entries',
      dataIndex: 'entryCount',
      key: 'entryCount',
      width: 70,
      render: (val) => val || 0
    },
    {
      title: 'Qty Sold',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 70,
      render: (val) => val || 0
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 110,
      render: (val) => <Text style={{ color: '#1890ff' }}>{formatCurrency(val)}</Text>
    },
    {
      title: 'COGS',
      dataIndex: 'cost',
      key: 'cost',
      width: 110,
      render: (val) => <Text style={{ color: '#fa8c16' }}>{formatCurrency(val)}</Text>
    },
    {
      title: 'Gross Profit',
      dataIndex: 'grossProfit',
      key: 'grossProfit',
      width: 110,
      render: (val) => (
        <Text strong style={{ color: parseFloat(val) >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(val)}
        </Text>
      )
    },
    {
      title: 'GP %',
      dataIndex: 'grossProfitMargin',
      key: 'grossProfitMargin',
      width: 70,
      render: (val) => (
        <Tag color={val >= 15 ? 'green' : val >= 5 ? 'blue' : 'red'}>
          {formatPercent(val)}
        </Tag>
      )
    },
    {
      title: 'Op. Expenses',
      dataIndex: 'operatingExpenses',
      key: 'operatingExpenses',
      width: 110,
      render: (val) => <Text style={{ color: '#722ed1' }}>{formatCurrency(val)}</Text>
    },
    {
      title: 'Net Profit',
      dataIndex: 'netProfit',
      key: 'netProfit',
      width: 110,
      render: (val) => (
        <Text strong style={{ color: parseFloat(val) >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(val)}
        </Text>
      )
    },
    {
      title: 'NP %',
      dataIndex: 'netProfitMargin',
      key: 'netProfitMargin',
      width: 70,
      render: (val) => (
        <Tag color={val >= 10 ? 'green' : val >= 3 ? 'blue' : 'red'}>
          {formatPercent(val)}
        </Tag>
      )
    },
    {
      title: 'Cash Entries',
      dataIndex: 'cashEntryCount',
      key: 'cashEntryCount',
      width: 80,
      render: (val) => <Text style={{ color: '#13c2c2' }}>{val || 0}</Text>
    },
    {
      title: 'Cash Amount',
      dataIndex: 'totalCashAmount',
      key: 'totalCashAmount',
      width: 110,
      render: (val) => <Text style={{ color: '#13c2c2' }}>{formatCurrency(val)}</Text>
    }
  ]

  // By Inches columns
  const byInchesColumns = [
    {
      title: 'Wheel Size',
      dataIndex: 'inches',
      key: 'inches',
      width: 100,
      render: (val) => <Text strong>{val}"</Text>
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 80,
      render: (val) => val || 0
    },
    {
      title: 'Qty Sold',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 80,
      render: (val) => val || 0
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 130,
      render: (val) => <Text style={{ color: '#1890ff' }}>{formatCurrency(val)}</Text>
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 130,
      render: (val) => <Text style={{ color: '#fa8c16' }}>{formatCurrency(val)}</Text>
    },
    {
      title: 'Gross Profit',
      dataIndex: 'grossProfit',
      key: 'grossProfit',
      width: 130,
      render: (val) => (
        <Text strong style={{ color: parseFloat(val) >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(val)}
        </Text>
      )
    },
    {
      title: 'Margin %',
      dataIndex: 'grossProfitMargin',
      key: 'grossProfitMargin',
      width: 120,
      render: (val) => (
        <Progress
          percent={Math.min(Math.abs(val || 0), 100)}
          size='small'
          status={val >= 15 ? 'success' : val >= 5 ? 'normal' : 'exception'}
          format={() => formatPercent(val)}
        />
      )
    }
  ]

  const tabItems = [
    {
      key: 'products',
      label: (
        <span>
          <BarChartOutlined /> Product-wise P&L
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Input
                placeholder='Search products...'
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ width: 300 }}
              />
              <Text type='secondary'>
                Showing {filteredProducts.length} of {productData.length} products
              </Text>
            </Space>
          </div>
          <Table
            columns={productColumns}
            dataSource={filteredProducts}
            rowKey='productId'
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100', '200'],
              showTotal: (total) => `Total ${total} products`
            }}
            summary={() => productTotals && filteredProducts.length === productData.length ? (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>TOTAL</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    {productTotals.totalQuantity}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <Text style={{ color: '#1890ff' }}>{formatCurrency(productTotals.totalRevenue)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <Text style={{ color: '#fa8c16' }}>{formatCurrency(productTotals.totalCost)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <Text strong style={{ color: productTotals.totalGrossProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      {formatCurrency(productTotals.totalGrossProfit)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>
                    <Tag color={productTotals.overallMargin >= 15 ? 'green' : 'blue'}>
                      {formatPercent(productTotals.overallMargin)}
                    </Tag>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : null}
            locale={{ emptyText: <Empty description='No product data for this month' /> }}
          />
        </div>
      )
    },
    {
      key: 'byInches',
      label: (
        <span>
          <PieChartOutlined /> By Wheel Size
        </span>
      ),
      children: (
        <Table
          columns={byInchesColumns}
          dataSource={byInchesData}
          rowKey='inches'
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description='No data by wheel size' /> }}
        />
      )
    },
    {
      key: 'trends',
      label: (
        <span>
          <LineChartOutlined /> Monthly Trends
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Text>Show last:</Text>
              <Select
                value={trendsMonths}
                onChange={setTrendsMonths}
                style={{ width: 120 }}
              >
                <Option value={6}>6 months</Option>
                <Option value={12}>12 months</Option>
                <Option value={24}>24 months</Option>
              </Select>
            </Space>
          </div>
          <Table
            columns={trendsColumns}
            dataSource={trendsData}
            rowKey='period'
            loading={loading}
            pagination={false}
            locale={{ emptyText: <Empty description='No trends data available' /> }}
          />
        </div>
      )
    }
  ]

  return (
    <div className='p-6'>
      {/* Page Header */}
      <div className='mb-6'>
        <Row justify='space-between' align='middle'>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <DollarOutlined style={{ marginRight: '12px' }} />
              P&L Dashboard
            </Title>
            <Text type='secondary'>
              Monthly Profit & Loss analysis with product-wise breakdown
            </Text>
          </Col>
          <Col>
            <Space>
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                style={{ width: 130 }}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <Option key={idx + 1} value={idx + 1}>{name}</Option>
                ))}
              </Select>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                options={yearOptions}
                style={{ width: 100 }}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchAllData}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Summary Cards */}
      <Spin spinning={loading}>
        <Row gutter={16} className='mb-6'>
          <Col span={6}>
            <Card>
              <Statistic
                title='Total Revenue'
                value={summaryData?.totalRevenue || 0}
                precision={0}
                prefix='₹'
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type='secondary'>
                  {summaryData?.totalEntries || 0} entries | {summaryData?.totalQuantity || 0} units
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Total Cost (COGS)'
                value={summaryData?.totalCost || 0}
                precision={0}
                prefix='₹'
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Gross Profit'
                value={summaryData?.grossProfit || 0}
                precision={0}
                prefix={parseFloat(summaryData?.grossProfit) >= 0 ? <RiseOutlined /> : <FallOutlined />}
                suffix=' ₹'
                valueStyle={{ color: parseFloat(summaryData?.grossProfit) >= 0 ? '#52c41a' : '#ff4d4f' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Progress
                  percent={Math.min(Math.abs(summaryData?.grossProfitMargin || 0), 100)}
                  size='small'
                  status={summaryData?.grossProfitMargin >= 15 ? 'success' : 'normal'}
                  format={() => `${summaryData?.grossProfitMargin || 0}%`}
                />
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title='Gross Profit Margin'
                value={summaryData?.grossProfitMargin || 0}
                precision={2}
                suffix='%'
                valueStyle={{
                  color: summaryData?.grossProfitMargin >= 15 ? '#52c41a' :
                         summaryData?.grossProfitMargin >= 5 ? '#1890ff' : '#ff4d4f'
                }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type='secondary'>
                  {summaryData?.grossProfitMargin >= 20 ? 'Excellent' :
                   summaryData?.grossProfitMargin >= 15 ? 'Healthy' :
                   summaryData?.grossProfitMargin >= 10 ? 'Good' :
                   summaryData?.grossProfitMargin >= 5 ? 'Low' : 'Critical'}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Info Alert if no data */}
      {(!summaryData?.totalEntries || summaryData?.totalEntries === 0) && !loading && (
        <Alert
          type='warning'
          showIcon
          icon={<DollarOutlined />}
          message='No Sales Data'
          description={`No sales entries found for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}. P&L calculations are based on sales in entry_master with product costing from alloy_master.`}
          className='mb-4'
        />
      )}

      {/* Note about costing */}
      {summaryData?.totalEntries > 0 && summaryData?.totalCost === 0 && !loading && (
        <Alert
          type='info'
          showIcon
          message='Costing Data Missing'
          description='Some products may not have costing data set. Update product costing in the Temp Costing page to see accurate gross profit calculations.'
          className='mb-4'
        />
      )}

      {/* Operating Expenses & Net Profit Row */}
      <Spin spinning={loading || overheadLoading}>
        <Row gutter={16} className='mb-6'>
          <Col span={8}>
            <Card>
              <Statistic
                title={<span><SettingOutlined /> Operating Expenses (Overheads)</span>}
                value={totalOverheads}
                precision={0}
                prefix='₹'
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type='secondary'>
                  {overheadData?.categories?.length || 0} expense categories
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title='Net Profit'
                value={netProfit}
                precision={0}
                prefix={netProfit >= 0 ? <RiseOutlined /> : <FallOutlined />}
                suffix=' ₹'
                valueStyle={{ color: netProfit >= 0 ? '#52c41a' : '#ff4d4f' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type='secondary'>
                  Gross Profit - Operating Expenses
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title='Net Profit Margin'
                value={summaryData?.totalRevenue > 0 ? (netProfit / summaryData.totalRevenue) * 100 : 0}
                precision={2}
                suffix='%'
                valueStyle={{
                  color: (netProfit / (summaryData?.totalRevenue || 1)) * 100 >= 10 ? '#52c41a' :
                         (netProfit / (summaryData?.totalRevenue || 1)) * 100 >= 5 ? '#1890ff' : '#ff4d4f'
                }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* CASH Payments Row */}
      <Spin spinning={loading}>
        <Row gutter={16} className='mb-6'>
          <Col span={8}>
            <Card>
              <Statistic
                title={<span><WalletOutlined /> CASH Payments</span>}
                value={summaryData?.totalCashAmount || 0}
                precision={0}
                prefix='₹'
                valueStyle={{ color: '#13c2c2' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type='secondary'>
                  {summaryData?.cashEntryCount || 0} cash entries this month
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title='Cash Entry Count'
                value={summaryData?.cashEntryCount || 0}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title='Avg. Cash per Entry'
                value={summaryData?.cashEntryCount > 0 ? (summaryData?.totalCashAmount || 0) / summaryData.cashEntryCount : 0}
                precision={0}
                prefix='₹'
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Monthly Overheads Section */}
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>Monthly Operating Expenses - {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
          </Space>
        }
        className='mb-4'
        extra={
          <Space>
            <Text type='secondary'>Production Volume:</Text>
            {editingVolume ? (
              <Space size='small'>
                <InputNumber
                  value={tempVolumeValue}
                  onChange={setTempVolumeValue}
                  min={0}
                  style={{ width: 100 }}
                />
                <Button size='small' type='primary' icon={<SaveOutlined />} onClick={saveProductionVolume} />
                <Button size='small' icon={<CloseOutlined />} onClick={() => setEditingVolume(false)} />
              </Space>
            ) : (
              <Space size='small'>
                <Tag color='blue'>{productionVolume.toLocaleString()} units</Tag>
                <Tooltip title='Edit Production Volume'>
                  <Button
                    size='small'
                    type='text'
                    icon={<EditOutlined />}
                    onClick={() => {
                      setTempVolumeValue(productionVolume)
                      setEditingVolume(true)
                    }}
                  />
                </Tooltip>
              </Space>
            )}
          </Space>
        }
      >
        <Spin spinning={overheadLoading}>
          {overheadData?.categories?.length > 0 ? (
            <Row gutter={[16, 16]}>
              {/* Overhead Categories */}
              {overheadData.categories.filter(c => c.categoryType === 'overhead').length > 0 && (
                <Col span={12}>
                  <Card
                    type='inner'
                    title={<span><SettingOutlined style={{ color: '#1890ff' }} /> Overhead Costs</span>}
                    size='small'
                  >
                    <Table
                      dataSource={overheadData.categories.filter(c => c.categoryType === 'overhead')}
                      rowKey='categoryId'
                      size='small'
                      pagination={false}
                      columns={[
                        {
                          title: 'Category',
                          dataIndex: 'categoryName',
                          key: 'categoryName',
                          render: (val, record) => (
                            <Tooltip title={record.description}>
                              <span>{val}</span>
                            </Tooltip>
                          )
                        },
                        {
                          title: 'Amount',
                          key: 'amount',
                          width: 180,
                          render: (_, record) => {
                            const isEditing = editingOverheadId === record.categoryId

                            if (isEditing) {
                              return (
                                <Space size='small'>
                                  <InputNumber
                                    value={editingOverheadValue}
                                    onChange={setEditingOverheadValue}
                                    min={0}
                                    size='small'
                                    style={{ width: 100 }}
                                    formatter={value => `₹${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                    autoFocus
                                    onPressEnter={() => saveOverheadValue(record.categoryId)}
                                  />
                                  <Button
                                    type='primary'
                                    size='small'
                                    icon={<SaveOutlined />}
                                    loading={savingOverhead}
                                    onClick={() => saveOverheadValue(record.categoryId)}
                                  />
                                  <Button
                                    size='small'
                                    icon={<CloseOutlined />}
                                    onClick={cancelEditingOverhead}
                                  />
                                </Space>
                              )
                            }

                            return (
                              <Space size='small'>
                                <span style={{ color: record.actualValue ? '#52c41a' : '#ff4d4f' }}>
                                  {record.actualValue ? formatCurrency(record.actualValue) : 'Not Set'}
                                </span>
                                <Tooltip title='Edit Amount'>
                                  <Button
                                    type='text'
                                    size='small'
                                    icon={<EditOutlined />}
                                    onClick={() => startEditingOverhead(record)}
                                  />
                                </Tooltip>
                              </Space>
                            )
                          }
                        },
                        {
                          title: 'Per Unit',
                          key: 'perUnit',
                          width: 80,
                          render: (_, record) => {
                            if (productionVolume > 0 && record.actualValue) {
                              return <Text type='secondary'>₹{(record.actualValue / productionVolume).toFixed(2)}</Text>
                            }
                            return <Text type='secondary'>-</Text>
                          }
                        }
                      ]}
                      summary={() => (
                        <Table.Summary fixed>
                          <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                            <Table.Summary.Cell index={0}>
                              <Text strong>Subtotal</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              <Text strong style={{ color: '#1890ff' }}>
                                {formatCurrency(overheadData.totals?.overhead?.total || 0)}
                              </Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2}>
                              <Text type='secondary'>
                                {productionVolume > 0
                                  ? `₹${((overheadData.totals?.overhead?.total || 0) / productionVolume).toFixed(2)}`
                                  : '-'
                                }
                              </Text>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        </Table.Summary>
                      )}
                    />
                  </Card>
                </Col>
              )}

              {/* Finance Categories */}
              {overheadData.categories.filter(c => c.categoryType === 'finance').length > 0 && (
                <Col span={12}>
                  <Card
                    type='inner'
                    title={<span><BankOutlined style={{ color: '#fa8c16' }} /> Finance Costs</span>}
                    size='small'
                  >
                    <Table
                      dataSource={overheadData.categories.filter(c => c.categoryType === 'finance')}
                      rowKey='categoryId'
                      size='small'
                      pagination={false}
                      columns={[
                        {
                          title: 'Category',
                          dataIndex: 'categoryName',
                          key: 'categoryName',
                          render: (val, record) => (
                            <Tooltip title={record.description}>
                              <span>{val}</span>
                            </Tooltip>
                          )
                        },
                        {
                          title: 'Amount',
                          key: 'amount',
                          width: 180,
                          render: (_, record) => {
                            const isEditing = editingOverheadId === record.categoryId

                            if (isEditing) {
                              return (
                                <Space size='small'>
                                  <InputNumber
                                    value={editingOverheadValue}
                                    onChange={setEditingOverheadValue}
                                    min={0}
                                    size='small'
                                    style={{ width: 100 }}
                                    formatter={value => `₹${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                    autoFocus
                                    onPressEnter={() => saveOverheadValue(record.categoryId)}
                                  />
                                  <Button
                                    type='primary'
                                    size='small'
                                    icon={<SaveOutlined />}
                                    loading={savingOverhead}
                                    onClick={() => saveOverheadValue(record.categoryId)}
                                  />
                                  <Button
                                    size='small'
                                    icon={<CloseOutlined />}
                                    onClick={cancelEditingOverhead}
                                  />
                                </Space>
                              )
                            }

                            return (
                              <Space size='small'>
                                <span style={{ color: record.actualValue ? '#52c41a' : '#ff4d4f' }}>
                                  {record.actualValue ? formatCurrency(record.actualValue) : 'Not Set'}
                                </span>
                                <Tooltip title='Edit Amount'>
                                  <Button
                                    type='text'
                                    size='small'
                                    icon={<EditOutlined />}
                                    onClick={() => startEditingOverhead(record)}
                                  />
                                </Tooltip>
                              </Space>
                            )
                          }
                        },
                        {
                          title: 'Per Unit',
                          key: 'perUnit',
                          width: 80,
                          render: (_, record) => {
                            if (productionVolume > 0 && record.actualValue) {
                              return <Text type='secondary'>₹{(record.actualValue / productionVolume).toFixed(2)}</Text>
                            }
                            return <Text type='secondary'>-</Text>
                          }
                        }
                      ]}
                      summary={() => (
                        <Table.Summary fixed>
                          <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                            <Table.Summary.Cell index={0}>
                              <Text strong>Subtotal</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              <Text strong style={{ color: '#fa8c16' }}>
                                {formatCurrency(overheadData.totals?.finance?.total || 0)}
                              </Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2}>
                              <Text type='secondary'>
                                {productionVolume > 0
                                  ? `₹${((overheadData.totals?.finance?.total || 0) / productionVolume).toFixed(2)}`
                                  : '-'
                                }
                              </Text>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        </Table.Summary>
                      )}
                    />
                  </Card>
                </Col>
              )}

              {/* Grand Total */}
              <Col span={24}>
                <Card size='small' style={{ background: '#f0f5ff' }}>
                  <Row justify='space-between' align='middle'>
                    <Col>
                      <Text strong style={{ fontSize: '16px' }}>Total Operating Expenses</Text>
                    </Col>
                    <Col>
                      <Space size='large'>
                        <Statistic
                          value={totalOverheads}
                          precision={0}
                          prefix='₹'
                          valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                        />
                        {productionVolume > 0 && (
                          <Text type='secondary'>
                            (₹{(totalOverheads / productionVolume).toFixed(2)} per unit)
                          </Text>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          ) : (
            <Empty
              description={
                <span>
                  No expense categories configured.
                  <br />
                  <a href='/monthly-overheads'>Go to Monthly Overheads page</a> to set up categories.
                </span>
              }
            />
          )}
        </Spin>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <Tabs defaultActiveKey='products' items={tabItems} />
      </Card>

      {/* Help Section */}
      <div className='mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
        <h3 className='font-semibold mb-2'>Understanding P&L Metrics</h3>
        <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'>
          <li><strong>Revenue:</strong> Total sales value from entry_master (total_price)</li>
          <li><strong>Cost (COGS):</strong> Cost of Goods Sold = Unit Cost × Quantity (from alloy_master.costing)</li>
          <li><strong>Gross Profit:</strong> Revenue - Cost</li>
          <li><strong>Gross Profit Margin:</strong> (Gross Profit / Revenue) × 100%</li>
          <li><strong>Operating Expenses:</strong> Monthly overhead costs (rent, utilities, salaries, etc.) and finance costs</li>
          <li><strong>Net Profit:</strong> Gross Profit - Operating Expenses</li>
          <li><strong>Net Profit Margin:</strong> (Net Profit / Revenue) × 100%</li>
          <li>Products without costing set will show 0 cost and inflated margins</li>
          <li><strong>Edit Costing:</strong> Click the <EditOutlined /> icon in the Unit Cost column to update product costing</li>
          <li><strong>Edit Overheads:</strong> Click the <EditOutlined /> icon in the Operating Expenses section to update monthly overhead values</li>
        </ul>
      </div>
    </div>
  )
}

export default PLDashboardPage
