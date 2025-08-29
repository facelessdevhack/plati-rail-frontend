import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Badge, 
  Button, 
  Input, 
  Select, 
  DatePicker,
  Alert,
  Spin,
  Tabs
} from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  BoxPlotOutlined,
  TruckOutlined,
  ToolOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const InternalInventoryDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [movements, setMovements] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const response = await client.get('/inventory/internal/overview');
      setOverview(response.data.data);
      
      // Get low stock alerts
      const lowStockResponse = await client.get('/inventory/alerts/low-stock?threshold=10');
      setLowStock(lowStockResponse.data.data.low_stock_items);
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await client.get(`/inventory/internal/movements?${params}`);
      setMovements(response.data.data.movements);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await client.get(`/inventory/search?query=${encodeURIComponent(query)}&limit=20`);
      setSearchResults(response.data.data.inventory);
    } catch (error) {
      console.error('Error searching inventory:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const getMovementTypeColor = (type) => {
    const colors = {
      'in': 'green',
      'out': 'red',
      'transfer': 'blue',
      'reserve': 'orange',
      'unreserve': 'purple',
      'adjustment': 'gray'
    };
    return colors[type] || 'default';
  };

  const getProductTypeIcon = (type) => {
    const icons = {
      'alloy': '⚙️',
      'tyre': '🛞',
      'ppf': '🛡️',
      'caps': '🔧'
    };
    return icons[type] || '📦';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const movementColumns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
      width: 120
    },
    {
      title: 'Type',
      dataIndex: 'movement_type',
      key: 'movement_type',
      render: (type) => (
        <Badge color={getMovementTypeColor(type)} text={type.toUpperCase()} />
      ),
      width: 100
    },
    {
      title: 'Product',
      key: 'product',
      render: (record) => (
        <div>
          <span>{getProductTypeIcon(record.product_type)} </span>
          <span style={{ fontWeight: 'bold' }}>
            {record.product_type?.toUpperCase()} #{record.product_id}
          </span>
        </div>
      ),
      width: 150
    },
    {
      title: 'Location',
      dataIndex: 'location_name',
      key: 'location_name',
      width: 120
    },
    {
      title: 'Change',
      dataIndex: 'quantity_change',
      key: 'quantity_change',
      render: (change) => (
        <span style={{ 
          color: change > 0 ? 'green' : 'red',
          fontWeight: 'bold'
        }}>
          {change > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(change)}
        </span>
      ),
      width: 80
    },
    {
      title: 'New Qty',
      dataIndex: 'new_quantity',
      key: 'new_quantity',
      width: 80
    },
    {
      title: 'User',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      width: 100
    }
  ];

  const searchColumns = [
    {
      title: 'Product',
      key: 'product',
      render: (record) => (
        <div>
          <div>{getProductTypeIcon(record.product_type)} {record.product_details?.product_name || record.product_details?.brand}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.product_details?.size} {record.product_details?.color && `• ${record.product_details.color}`}
          </div>
        </div>
      )
    },
    {
      title: 'Location',
      key: 'location',
      render: (record) => (
        <div>
          <div>{record.location_name}</div>
          {record.area_name && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.area_name} {record.position_name && `• ${record.position_name}`}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>Available: {record.available_quantity}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Total: {record.quantity} | Reserved: {record.reserved_quantity}
          </div>
        </div>
      )
    },
    {
      title: 'Value',
      dataIndex: 'total_value',
      key: 'total_value',
      render: (value) => formatCurrency(value)
    }
  ];

  const lowStockColumns = [
    {
      title: 'Product',
      key: 'product',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {getProductTypeIcon(record.product_type)} {record.product_details?.product_name || record.product_details?.brand}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.product_details?.size}
          </div>
        </div>
      )
    },
    {
      title: 'Location',
      dataIndex: 'location_name',
      key: 'location_name'
    },
    {
      title: 'Current Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty) => (
        <span style={{ color: qty <= 5 ? 'red' : 'orange', fontWeight: 'bold' }}>
          {qty}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <DashboardOutlined style={{ marginRight: '8px' }} />
              Internal Inventory System
            </h1>
            <p style={{ margin: 0, color: '#666' }}>
              Manage warehouse locations, production requests, and dispatch orders
            </p>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={fetchOverview}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Locations"
              value={overview?.overview_stats?.total_locations || 0}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={overview?.overview_stats?.total_products || 0}
              prefix={<BoxPlotOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Quantity"
              value={overview?.overview_stats?.total_quantity || 0}
              prefix={<BoxPlotOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={overview?.overview_stats?.total_value || 0}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <Alert
          message={`${lowStock.length} items are running low on stock`}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          action={
            <Button size="small" onClick={() => navigate('/inventory/alerts')}>
              View All
            </Button>
          }
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/inventory/locations')}>
            <div style={{ textAlign: 'center' }}>
              <EnvironmentOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              <h3>Manage Locations</h3>
              <p>View and manage warehouse locations</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/inventory/production/requests')}>
            <div style={{ textAlign: 'center' }}>
              <ToolOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
              <h3>Production Requests</h3>
              <p>Material requests from production</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/inventory/dispatch/orders')}>
            <div style={{ textAlign: 'center' }}>
              <TruckOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />
              <h3>Dispatch Orders</h3>
              <p>Outbound shipments and deliveries</p>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Search and Recent Activity */}
      <Tabs defaultActiveKey="search">
        <TabPane tab={<span><SearchOutlined />Inventory Search</span>} key="search">
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Search
                placeholder="Search products by name, size, or specifications..."
                allowClear
                enterButton="Search"
                size="large"
                onSearch={handleSearch}
                loading={searchLoading}
              />
            </div>
            
            {searchResults.length > 0 && (
              <Table
                dataSource={searchResults}
                columns={searchColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="middle"
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="Recent Movements" key="movements">
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={[8, 8]}>
                <Col xs={24} sm={6}>
                  <Select 
                    placeholder="Movement Type" 
                    allowClear 
                    style={{ width: '100%' }}
                    onChange={(value) => fetchMovements({ movementType: value })}
                  >
                    <Option value="in">Stock In</Option>
                    <Option value="out">Stock Out</Option>
                    <Option value="transfer">Transfer</Option>
                    <Option value="reserve">Reserve</Option>
                    <Option value="unreserve">Unreserve</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={8}>
                  <RangePicker 
                    style={{ width: '100%' }}
                    onChange={(dates) => {
                      if (dates) {
                        fetchMovements({
                          startDate: dates[0].format('YYYY-MM-DD'),
                          endDate: dates[1].format('YYYY-MM-DD')
                        });
                      } else {
                        fetchMovements();
                      }
                    }}
                  />
                </Col>
                <Col xs={24} sm={4}>
                  <Button onClick={() => fetchMovements()}>
                    <ReloadOutlined /> Refresh
                  </Button>
                </Col>
              </Row>
            </div>

            <Table
              dataSource={overview?.recent_movements || []}
              columns={movementColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><ExclamationCircleOutlined />Low Stock ({lowStock.length})</span>} key="lowstock">
          <Card>
            <Table
              dataSource={lowStock}
              columns={lowStockColumns}
              rowKey="id"
              pagination={{ pageSize: 15 }}
              size="small"
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default InternalInventoryDashboard;