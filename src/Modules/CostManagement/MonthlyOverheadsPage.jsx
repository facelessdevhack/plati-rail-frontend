import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  Statistic,
  Space,
  message,
  Typography,
  DatePicker,
  InputNumber,
  Form,
  Input,
  Divider,
  Tag,
  Alert
} from 'antd';
import {
  DollarOutlined,
  SaveOutlined,
  ReloadOutlined,
  CalculatorOutlined,
  LineChartOutlined,
  SettingOutlined,
  BankOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const MonthlyOverheadsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [overheadData, setOverheadData] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [productionVolume, setProductionVolume] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  const year = selectedDate.year();
  const month = selectedDate.month() + 1;

  const fetchOverheads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.get(`/cost-management/overheads/${year}/${month}`);
      setOverheadData(response.data.data);
      setProductionVolume(response.data.data?.productionVolume || 0);
      setEditedValues({});
      setHasChanges(false);
    } catch (error) {
      message.error('Failed to fetch monthly overheads');
      console.error('Error fetching overheads:', error);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchOverheads();
  }, [fetchOverheads]);

  const handleValueChange = (categoryId, value) => {
    setEditedValues(prev => ({
      ...prev,
      [categoryId]: value
    }));
    setHasChanges(true);
  };

  const handleProductionVolumeChange = (value) => {
    setProductionVolume(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build values array
      const values = Object.entries(editedValues).map(([categoryId, actualValue]) => ({
        categoryId: parseInt(categoryId),
        actualValue
      }));

      // Add categories that weren't edited but have existing values
      overheadData?.categories?.forEach(cat => {
        if (!editedValues.hasOwnProperty(cat.categoryId)) {
          values.push({
            categoryId: cat.categoryId,
            actualValue: cat.actualValue || 0
          });
        }
      });

      await client.post('/cost-management/overheads/bulk', {
        year,
        month,
        productionVolume,
        values
      });

      message.success('Monthly overheads saved successfully');
      fetchOverheads();
    } catch (error) {
      message.error('Failed to save monthly overheads');
      console.error('Error saving overheads:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryValue = (categoryId) => {
    if (editedValues.hasOwnProperty(categoryId)) {
      return editedValues[categoryId];
    }
    const cat = overheadData?.categories?.find(c => c.categoryId === categoryId);
    return cat?.actualValue || 0;
  };

  const calculateAllocatedPerUnit = (value) => {
    if (productionVolume > 0) {
      return (value / productionVolume).toFixed(4);
    }
    return '0.0000';
  };

  const getCategoryTypeColor = (type) => {
    return type === 'overhead' ? 'blue' : 'orange';
  };

  const getCategoryTypeIcon = (type) => {
    return type === 'overhead' ? <SettingOutlined /> : <BankOutlined />;
  };

  // Group categories by type
  const overheadCategories = overheadData?.categories?.filter(c => c.categoryType === 'overhead') || [];
  const financeCategories = overheadData?.categories?.filter(c => c.categoryType === 'finance') || [];

  // Calculate totals
  const calculateTotal = (categories) => {
    return categories.reduce((sum, cat) => {
      return sum + (getCategoryValue(cat.categoryId) || 0);
    }, 0);
  };

  const calculateAllocatedTotal = (categories) => {
    const total = calculateTotal(categories);
    return productionVolume > 0 ? total / productionVolume : 0;
  };

  const overheadTotal = calculateTotal(overheadCategories);
  const financeTotal = calculateTotal(financeCategories);
  const grandTotal = overheadTotal + financeTotal;
  const grandAllocatedTotal = productionVolume > 0 ? grandTotal / productionVolume : 0;

  const columns = [
    {
      title: 'Category',
      key: 'category',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            {getCategoryTypeIcon(record.categoryType)}
            <span style={{ marginLeft: '8px' }}>{record.categoryName}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {record.calculationMethod === 'monthly' ? 'Monthly' : record.calculationMethod === 'yearly' ? 'Yearly (prorated)' : record.calculationMethod}
          </div>
        </div>
      ),
      width: 250
    },
    {
      title: 'Type',
      dataIndex: 'categoryType',
      key: 'categoryType',
      render: (type) => (
        <Tag color={getCategoryTypeColor(type)}>
          {type?.toUpperCase()}
        </Tag>
      ),
      width: 100
    },
    {
      title: 'Monthly Value (₹)',
      key: 'actualValue',
      render: (record) => (
        <InputNumber
          style={{ width: '150px' }}
          value={getCategoryValue(record.categoryId)}
          onChange={(value) => handleValueChange(record.categoryId, value)}
          min={0}
          precision={2}
          formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/₹\s?|(,*)/g, '')}
        />
      ),
      width: 180
    },
    {
      title: 'Allocated Per Unit (₹)',
      key: 'allocatedPerUnit',
      render: (record) => {
        const value = getCategoryValue(record.categoryId);
        const allocated = calculateAllocatedPerUnit(value);
        return (
          <div>
            <Text strong style={{ color: productionVolume > 0 ? '#1890ff' : '#999' }}>
              ₹ {allocated}
            </Text>
            {productionVolume === 0 && (
              <div style={{ fontSize: '10px', color: '#ff4d4f' }}>
                Set production volume
              </div>
            )}
          </div>
        );
      },
      width: 150
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <CalculatorOutlined style={{ marginRight: '12px' }} />
              Monthly Overhead Values
            </Title>
            <Text type="secondary">
              Record monthly overhead and finance costs for per-unit allocation
            </Text>
          </Col>
          <Col>
            <Space>
              <DatePicker
                picker="month"
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                format="MMMM YYYY"
                allowClear={false}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchOverheads}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                disabled={!hasChanges}
              >
                Save Changes
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {hasChanges && (
        <Alert
          message="You have unsaved changes"
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Production Volume & Summary */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <div style={{ marginBottom: '8px' }}>
              <Text type="secondary">Production Volume</Text>
            </div>
            <InputNumber
              style={{ width: '100%' }}
              value={productionVolume}
              onChange={handleProductionVolumeChange}
              min={0}
              placeholder="Enter monthly production"
              addonAfter="units"
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Total units produced this month
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Overhead"
              value={overheadTotal}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Per Unit: ₹{calculateAllocatedTotal(overheadCategories).toFixed(4)}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Finance Costs"
              value={financeTotal}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Per Unit: ₹{calculateAllocatedTotal(financeCategories).toFixed(4)}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Grand Total (Monthly)"
              value={grandTotal}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ fontSize: '12px', color: '#52c41a', fontWeight: 'bold', marginTop: '4px' }}>
              Per Unit: ₹{grandAllocatedTotal.toFixed(4)}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Overhead Categories Table */}
      <Card
        title={
          <span>
            <SettingOutlined style={{ marginRight: '8px' }} />
            Overhead Costs ({overheadCategories.length} categories)
          </span>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table
          columns={columns}
          dataSource={overheadCategories}
          rowKey="categoryId"
          loading={loading}
          pagination={false}
          size="middle"
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>Subtotal - Overhead</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} />
                <Table.Summary.Cell index={2}>
                  <Text strong style={{ color: '#1890ff' }}>
                    ₹ {overheadTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <Text strong style={{ color: '#1890ff' }}>
                    ₹ {calculateAllocatedTotal(overheadCategories).toFixed(4)}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* Finance Categories Table */}
      <Card
        title={
          <span>
            <BankOutlined style={{ marginRight: '8px' }} />
            Finance Costs ({financeCategories.length} categories)
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={financeCategories}
          rowKey="categoryId"
          loading={loading}
          pagination={false}
          size="middle"
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>Subtotal - Finance</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} />
                <Table.Summary.Cell index={2}>
                  <Text strong style={{ color: '#fa8c16' }}>
                    ₹ {financeTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <Text strong style={{ color: '#fa8c16' }}>
                    ₹ {calculateAllocatedTotal(financeCategories).toFixed(4)}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        <Divider />

        {/* Grand Total */}
        <Row justify="end">
          <Col>
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Row gutter={48}>
                <Col>
                  <Statistic
                    title="Grand Total (Monthly)"
                    value={grandTotal}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ fontSize: '20px' }}
                  />
                </Col>
                <Col>
                  <Statistic
                    title="Total Per Unit Allocation"
                    value={grandAllocatedTotal}
                    precision={4}
                    prefix="₹"
                    valueStyle={{ fontSize: '20px', color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default MonthlyOverheadsPage;
