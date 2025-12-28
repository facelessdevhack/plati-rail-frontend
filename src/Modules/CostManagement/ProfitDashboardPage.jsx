import React, { useState, useEffect, useCallback } from 'react';
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
  Button
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  ShopOutlined,
  BarChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ProfitDashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [trendsMonths, setTrendsMonths] = useState(6);

  const fetchProfitReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange[0]) params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
      if (dateRange[1]) params.append('endDate', dateRange[1].format('YYYY-MM-DD'));

      const response = await client.get(`/cost-management/profit/report?${params.toString()}`);
      setReportData(response.data.data);
    } catch (error) {
      message.error('Failed to fetch profit report');
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const fetchTrends = useCallback(async () => {
    try {
      const response = await client.get(`/cost-management/profit/trends?months=${trendsMonths}&groupBy=month`);
      setTrendsData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  }, [trendsMonths]);

  useEffect(() => {
    fetchProfitReport();
    fetchTrends();
  }, [fetchProfitReport, fetchTrends]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0';
    return `₹${parseFloat(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${parseFloat(value).toFixed(2)}%`;
  };

  const summary = reportData?.summary || {};
  const byProduct = reportData?.byProduct || [];
  const byDealer = reportData?.byDealer || [];

  // Product columns
  const productColumns = [
    {
      title: 'Product',
      key: 'product',
      render: (record) => (
        <div>
          <Text strong>{record.productType?.toUpperCase()}</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.productId}</div>
        </div>
      ),
      width: 120
    },
    {
      title: 'Sales',
      dataIndex: 'saleCount',
      key: 'saleCount',
      render: (val) => val || 0,
      width: 80
    },
    {
      title: 'Quantity',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      render: (val) => val || 0,
      width: 80
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => formatCurrency(val),
      width: 120
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (val) => formatCurrency(val),
      width: 120
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (val) => (
        <Text style={{ color: parseFloat(val) >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(val)}
        </Text>
      ),
      width: 120
    },
    {
      title: 'Margin',
      dataIndex: 'margin',
      key: 'margin',
      render: (val) => (
        <Progress
          percent={parseFloat(val) * 100}
          size="small"
          status={parseFloat(val) >= 0.1 ? 'success' : parseFloat(val) >= 0 ? 'normal' : 'exception'}
          format={() => formatPercent(parseFloat(val) * 100)}
        />
      ),
      width: 150
    }
  ];

  // Dealer columns
  const dealerColumns = [
    {
      title: 'Dealer',
      key: 'dealer',
      render: (record) => (
        <div>
          <Text strong>{record.dealerName || 'Unknown'}</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.dealerId}</div>
        </div>
      ),
      width: 180
    },
    {
      title: 'Sales',
      dataIndex: 'saleCount',
      key: 'saleCount',
      render: (val) => val || 0,
      width: 80
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => formatCurrency(val),
      width: 130
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (val) => formatCurrency(val),
      width: 130
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (val) => (
        <Text strong style={{ color: parseFloat(val) >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(val)}
        </Text>
      ),
      width: 130
    },
    {
      title: 'Margin',
      dataIndex: 'margin',
      key: 'margin',
      render: (val) => (
        <Progress
          percent={parseFloat(val) * 100}
          size="small"
          status={parseFloat(val) >= 0.1 ? 'success' : parseFloat(val) >= 0 ? 'normal' : 'exception'}
          format={() => formatPercent(parseFloat(val) * 100)}
        />
      ),
      width: 150
    }
  ];

  // Trends columns
  const trendsColumns = [
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      width: 100
    },
    {
      title: 'Sales',
      dataIndex: 'saleCount',
      key: 'saleCount',
      render: (val) => val || 0,
      width: 80
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => formatCurrency(val),
      width: 130
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (val) => formatCurrency(val),
      width: 130
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (val) => (
        <Text strong style={{ color: parseFloat(val) >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(val)}
        </Text>
      ),
      width: 130
    },
    {
      title: 'Margin',
      dataIndex: 'margin',
      key: 'margin',
      render: (val) => formatPercent(parseFloat(val) * 100),
      width: 100
    }
  ];

  const tabItems = [
    {
      key: 'byProduct',
      label: (
        <span>
          <BarChartOutlined /> By Product
        </span>
      ),
      children: (
        <Table
          columns={productColumns}
          dataSource={byProduct}
          rowKey={(record) => `${record.productType}-${record.productId}`}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: <Empty description="No profit data available" /> }}
        />
      )
    },
    {
      key: 'byDealer',
      label: (
        <span>
          <ShopOutlined /> By Dealer
        </span>
      ),
      children: (
        <Table
          columns={dealerColumns}
          dataSource={byDealer}
          rowKey="dealerId"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: <Empty description="No dealer profit data available" /> }}
        />
      )
    },
    {
      key: 'trends',
      label: (
        <span>
          <LineChartOutlined /> Trends
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
                <Option value={3}>3 months</Option>
                <Option value={6}>6 months</Option>
                <Option value={12}>12 months</Option>
              </Select>
            </Space>
          </div>
          <Table
            columns={trendsColumns}
            dataSource={trendsData}
            rowKey="period"
            loading={loading}
            pagination={false}
            locale={{ emptyText: <Empty description="No trends data available" /> }}
          />
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <LineChartOutlined style={{ marginRight: '12px' }} />
              Profit Dashboard
            </Title>
            <Text type="secondary">
              Track revenue, costs, and profit across products and dealers
            </Text>
          </Col>
          <Col>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="DD MMM YYYY"
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchProfitReport();
                  fetchTrends();
                }}
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
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={summary.totalRevenue || 0}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">{summary.totalEntries || 0} sales entries</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Cost (COGS)"
                value={summary.totalCost || 0}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Gross Profit"
                value={summary.totalProfit || 0}
                precision={2}
                prefix={parseFloat(summary.totalProfit) >= 0 ? <RiseOutlined /> : <FallOutlined />}
                suffix="₹"
                valueStyle={{ color: parseFloat(summary.totalProfit) >= 0 ? '#52c41a' : '#ff4d4f' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Progress
                  percent={parseFloat(summary.grossProfitPercent) || 0}
                  size="small"
                  status={parseFloat(summary.grossProfitPercent) >= 10 ? 'success' : 'normal'}
                  format={(val) => `${val?.toFixed(1)}%`}
                />
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average Margin"
                value={parseFloat(summary.avgMargin) * 100 || 0}
                precision={2}
                suffix="%"
                valueStyle={{ color: parseFloat(summary.avgMargin) >= 0.1 ? '#52c41a' : '#722ed1' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">
                  {parseFloat(summary.avgMargin) >= 0.15 ? 'Healthy' :
                   parseFloat(summary.avgMargin) >= 0.1 ? 'Good' :
                   parseFloat(summary.avgMargin) >= 0.05 ? 'Low' : 'Critical'}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Profit Breakdown Note */}
      {(!summary.totalEntries || summary.totalEntries === 0) && !loading && (
        <Card style={{ marginBottom: '24px', background: '#fffbe6', borderColor: '#ffe58f' }}>
          <Space>
            <DollarOutlined style={{ color: '#faad14', fontSize: '24px' }} />
            <div>
              <Text strong>No Profit Data Available</Text>
              <div>
                <Text type="secondary">
                  Profit tracking requires cost data to be recorded at the time of sale.
                  Make sure cost_at_sale is populated in sales entries for profit calculations.
                </Text>
              </div>
            </div>
          </Space>
        </Card>
      )}

      {/* Detailed Breakdown */}
      <Card>
        <Tabs defaultActiveKey="byProduct" items={tabItems} />
      </Card>
    </div>
  );
};

export default ProfitDashboardPage;
