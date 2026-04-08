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
  InputNumber,
  Tag,
  Tabs,
  Progress,
  Empty,
  Spin,
  Button,
  Tooltip,
  Badge,
  Collapse,
  Alert
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  InboxOutlined,
  BarChartOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const InventorySuggestionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [suggestionsData, setSuggestionsData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [sourcesData, setSourcesData] = useState(null);
  const [activeTab, setActiveTab] = useState('suggestions');

  // Configurable parameters
  const [maxQuantity, setMaxQuantity] = useState(1500);
  const [safetyFactor, setSafetyFactor] = useState(1.5);
  const [months, setMonths] = useState(3);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        maxQuantity: maxQuantity.toString(),
        safetyFactor: safetyFactor.toString(),
        months: months.toString()
      });

      const response = await client.get(`/inventory-suggestions?${params.toString()}`);
      setSuggestionsData(response.data.data);
    } catch (error) {
      message.error('Failed to fetch production suggestions');
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [maxQuantity, safetyFactor, months]);

  const fetchHealth = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        safetyFactor: safetyFactor.toString(),
        months: months.toString()
      });

      const response = await client.get(`/inventory-suggestions/health?${params.toString()}`);
      setHealthData(response.data.data);
    } catch (error) {
      console.error('Error fetching health:', error);
    }
  }, [safetyFactor, months]);

  const fetchSources = useCallback(async () => {
    try {
      const response = await client.get('/inventory-suggestions/production-sources');
      setSourcesData(response.data.data);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
    fetchHealth();
    fetchSources();
  }, []);

  const handleRefresh = () => {
    fetchSuggestions();
    fetchHealth();
    fetchSources();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <WarningOutlined />;
      case 'medium': return <ExclamationCircleOutlined />;
      case 'low': return <CheckCircleOutlined />;
      default: return null;
    }
  };

  const suggestionColumns = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      sorter: (a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      },
      render: (priority) => (
        <Tag icon={getPriorityIcon(priority)} color={getPriorityColor(priority)}>
          {priority?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Target Alloy',
      key: 'target',
      render: (_, record) => (
        <div>
          <Text strong>{record.targetAlloy?.productName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.targetAlloy?.finishName}
          </Text>
        </div>
      )
    },
    {
      title: 'Current Stock',
      key: 'currentStock',
      width: 120,
      render: (_, record) => (
        <Text>{record.targetAlloy?.currentStock || 0}</Text>
      )
    },
    {
      title: 'Min Required',
      key: 'minimumInventory',
      width: 120,
      render: (_, record) => (
        <Tooltip title="Based on last 3 months sales × safety factor">
          <Text type="warning">{record.targetAlloy?.minimumInventory || 0}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Deficit',
      key: 'deficit',
      width: 100,
      render: (_, record) => (
        <Text type="danger" strong>-{record.targetAlloy?.deficit || 0}</Text>
      )
    },
    {
      title: 'Suggested Qty',
      dataIndex: 'suggestedQuantity',
      key: 'suggestedQuantity',
      width: 130,
      render: (qty) => (
        <Tag color="blue" style={{ fontSize: 14 }}>
          {qty}
        </Tag>
      )
    },
    {
      title: 'Source',
      key: 'source',
      render: (_, record) => {
        if (!record.canProduce) {
          return (
            <Tooltip title={record.noSourceReason}>
              <Tag color="red">No Source</Tag>
            </Tooltip>
          );
        }
        const source = record.recommendedSource;
        return (
          <div>
            <Tag color={source?.sourceType === 'WITHOUT_PAINT' ? 'purple' : 'cyan'}>
              {source?.sourceType === 'WITHOUT_PAINT' ? 'W/O Paint' : 'BWL'}
            </Tag>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Stock: {source?.stock || 0}
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Avg Monthly Sales',
      key: 'avgSales',
      width: 140,
      render: (_, record) => (
        <Text>{record.salesMetrics?.avgMonthlySales || 0} / month</Text>
      )
    }
  ];

  const summary = suggestionsData?.summary || {};
  const suggestions = suggestionsData?.suggestions || [];

  const tabItems = [
    {
      key: 'suggestions',
      label: (
        <span>
          <RocketOutlined /> Production Suggestions
          {suggestions.length > 0 && (
            <Badge count={suggestions.length} style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: (
        <Card>
          {suggestions.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="All inventory levels are healthy!"
            />
          ) : (
            <Table
              dataSource={suggestions}
              columns={suggestionColumns}
              rowKey={(record) => record.targetAlloy?.id}
              pagination={{ pageSize: 20 }}
              size="middle"
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '12px 0' }}>
                    <Row gutter={24}>
                      <Col span={12}>
                        <Text strong>Available Source Variants:</Text>
                        <div style={{ marginTop: 8 }}>
                          {record.sourceVariants?.length === 0 ? (
                            <Text type="secondary">No matching variants found</Text>
                          ) : (
                            record.sourceVariants?.map((sv, idx) => (
                              <Tag
                                key={idx}
                                color={sv.canFulfill ? 'green' : 'orange'}
                                style={{ margin: '4px' }}
                              >
                                {sv.productName} ({sv.stock} pcs)
                              </Tag>
                            ))
                          )}
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text strong>Sales Metrics (Last {months} months):</Text>
                        <div style={{ marginTop: 8 }}>
                          <Text>Total Sold: {record.salesMetrics?.totalSoldLast3Months || 0}</Text>
                          <br />
                          <Text>Sale Count: {record.salesMetrics?.saleCount || 0}</Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )
              }}
            />
          )}
        </Card>
      )
    },
    {
      key: 'sources',
      label: (
        <span>
          <InboxOutlined /> Production Sources
        </span>
      ),
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Card
              title={
                <span>
                  <Tag color="purple">WITHOUT PAINT</Tag>
                  Available Stock
                </span>
              }
            >
              {sourcesData?.withoutPaint?.items?.length === 0 ? (
                <Empty description="No Without Paint variants in stock" />
              ) : (
                <>
                  <Statistic
                    title="Total Available"
                    value={sourcesData?.withoutPaint?.totalStock || 0}
                    suffix="pcs"
                    style={{ marginBottom: 16 }}
                  />
                  <Table
                    dataSource={sourcesData?.withoutPaint?.items || []}
                    columns={[
                      { title: 'Product', dataIndex: 'productName', key: 'name' },
                      { title: 'Model', dataIndex: 'modelName', key: 'model' },
                      {
                        title: 'Stock',
                        dataIndex: 'stock',
                        key: 'stock',
                        render: (val) => <Tag color="blue">{val}</Tag>
                      }
                    ]}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={
                <span>
                  <Tag color="cyan">BLACK WITHOUT LACQUER</Tag>
                  Available Stock
                </span>
              }
            >
              {sourcesData?.blackWithoutLacquer?.items?.length === 0 ? (
                <Empty description="No BWL variants in stock" />
              ) : (
                <>
                  <Statistic
                    title="Total Available"
                    value={sourcesData?.blackWithoutLacquer?.totalStock || 0}
                    suffix="pcs"
                    style={{ marginBottom: 16 }}
                  />
                  <Table
                    dataSource={sourcesData?.blackWithoutLacquer?.items || []}
                    columns={[
                      { title: 'Product', dataIndex: 'productName', key: 'name' },
                      { title: 'Model', dataIndex: 'modelName', key: 'model' },
                      {
                        title: 'Stock',
                        dataIndex: 'stock',
                        key: 'stock',
                        render: (val) => <Tag color="blue">{val}</Tag>
                      }
                    ]}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )}
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'health',
      label: (
        <span>
          <BarChartOutlined /> Inventory Health
        </span>
      ),
      children: (
        <Card>
          <Row gutter={24}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Alloys"
                  value={healthData?.total || 0}
                  prefix={<InboxOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Healthy"
                  value={healthData?.healthy || 0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Warning"
                  value={healthData?.warning || 0}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Critical"
                  value={healthData?.critical || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
          </Row>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Title level={4}>Inventory Health Score</Title>
            <Progress
              type="dashboard"
              percent={healthData?.healthPercentage || 0}
              strokeColor={{
                '0%': '#ff4d4f',
                '50%': '#faad14',
                '100%': '#52c41a'
              }}
              format={(percent) => (
                <div>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{percent}%</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Healthy</div>
                </div>
              )}
              width={200}
            />
          </div>
        </Card>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <ThunderboltOutlined /> Inventory Suggestions
          </Title>
          <Text type="secondary">
            Production recommendations based on minimum inventory analysis
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Configuration Panel */}
      <Collapse style={{ marginBottom: 24 }}>
        <Panel
          header={
            <span>
              <SettingOutlined /> Configuration Parameters
            </span>
          }
          key="config"
        >
          <Row gutter={24}>
            <Col span={8}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>Max Production Quantity</Text>
                <Tooltip title="Maximum quantity per production suggestion">
                  <Text type="secondary"> (per suggestion)</Text>
                </Tooltip>
              </div>
              <InputNumber
                min={100}
                max={5000}
                step={100}
                value={maxQuantity}
                onChange={(val) => setMaxQuantity(val)}
                style={{ width: '100%' }}
                addonAfter="pcs"
              />
            </Col>
            <Col span={8}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>Safety Factor</Text>
                <Tooltip title="Minimum inventory = Average monthly sales × Safety factor">
                  <Text type="secondary"> (multiplier)</Text>
                </Tooltip>
              </div>
              <InputNumber
                min={1}
                max={3}
                step={0.1}
                value={safetyFactor}
                onChange={(val) => setSafetyFactor(val)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={8}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>Analysis Period</Text>
                <Tooltip title="Number of months of sales data to analyze">
                  <Text type="secondary"> (months)</Text>
                </Tooltip>
              </div>
              <InputNumber
                min={1}
                max={12}
                value={months}
                onChange={(val) => setMonths(val)}
                style={{ width: '100%' }}
                addonAfter="months"
              />
            </Col>
          </Row>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={handleRefresh} loading={loading}>
              Apply & Refresh
            </Button>
          </div>
        </Panel>
      </Collapse>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Alloys Analyzed"
              value={summary.totalAlloysAnalyzed || 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Needing Production"
              value={summary.alloysNeedingProduction || 0}
              valueStyle={{
                color: summary.alloysNeedingProduction > 0 ? '#ff4d4f' : '#52c41a'
              }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Deficit"
              value={summary.totalDeficit || 0}
              suffix="pcs"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Production Sources"
              value={sourcesData?.grandTotalStock || 0}
              suffix="pcs available"
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Info Alert */}
      {suggestions.length > 0 && (
        <Alert
          message="Production Recommendations Available"
          description={`${suggestions.filter(s => s.priority === 'high').length} high priority, ${suggestions.filter(s => s.priority === 'medium').length} medium priority, ${suggestions.filter(s => s.priority === 'low').length} low priority items need production attention.`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Spin spinning={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Spin>
    </div>
  );
};

export default InventorySuggestionsPage;
