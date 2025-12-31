import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  Tag,
  Statistic,
  Space,
  message,
  Button,
  Select,
  DatePicker,
  Input,
  Typography,
  Badge,
  Tooltip,
  Empty,
  Spin
} from 'antd';
import {
  HistoryOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined,
  DownloadOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const InventoryMovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState({
    totalIn: 0,
    totalOut: 0,
    totalTransfers: 0,
    totalMovements: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    movementType: null,
    locationId: null,
    productType: null,
    dateRange: null,
    search: '',
    referenceType: null
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  const fetchLocations = useCallback(async () => {
    try {
      const response = await client.get('/inventory/internal/locations');
      setLocations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  }, []);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.movementType) {
        params.append('movementType', filters.movementType);
      }
      if (filters.locationId) {
        params.append('locationId', filters.locationId);
      }
      if (filters.productType) {
        params.append('productType', filters.productType);
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
      }
      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters.referenceType) {
        params.append('referenceType', filters.referenceType);
      }

      params.append('page', pagination.current);
      params.append('limit', pagination.pageSize);

      const response = await client.get(`/inventory/internal/movements?${params.toString()}`);
      const data = response.data.data;

      setMovements(data.movements || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || data.movements?.length || 0
      }));

      // Calculate stats from movements
      const movementList = data.movements || [];
      const inMovements = movementList.filter(m => m.movementType === 'in');
      const outMovements = movementList.filter(m => m.movementType === 'out');
      const transferMovements = movementList.filter(m => m.movementType === 'transfer');

      setStats({
        totalIn: inMovements.reduce((sum, m) => sum + Math.abs(m.quantityChange || 0), 0),
        totalOut: outMovements.reduce((sum, m) => sum + Math.abs(m.quantityChange || 0), 0),
        totalTransfers: transferMovements.length,
        totalMovements: movementList.length
      });

    } catch (error) {
      message.error('Failed to fetch movements');
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      movementType: null,
      locationId: null,
      productType: null,
      dateRange: null,
      search: '',
      referenceType: null
    });
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  // Debounced search handler
  const handleSearch = (value) => {
    handleFilterChange('search', value);
  };

  const getMovementTypeConfig = (type) => {
    const configs = {
      'in': {
        color: 'green',
        icon: <ArrowDownOutlined />,
        label: 'IN',
        bgColor: '#f6ffed'
      },
      'out': {
        color: 'red',
        icon: <ArrowUpOutlined />,
        label: 'OUT',
        bgColor: '#fff2f0'
      },
      'transfer': {
        color: 'blue',
        icon: <SwapOutlined />,
        label: 'TRANSFER',
        bgColor: '#e6f7ff'
      },
      'reserve': {
        color: 'orange',
        icon: <HistoryOutlined />,
        label: 'RESERVE',
        bgColor: '#fff7e6'
      },
      'adjustment': {
        color: 'purple',
        icon: <HistoryOutlined />,
        label: 'ADJUSTMENT',
        bgColor: '#f9f0ff'
      }
    };
    return configs[type] || { color: 'default', icon: <HistoryOutlined />, label: type?.toUpperCase(), bgColor: '#fafafa' };
  };

  const getReferenceTypeTag = (type) => {
    const colors = {
      'purchase': 'cyan',
      'production_request': 'green',
      'dispatch': 'blue',
      'transfer': 'purple',
      'adjustment': 'orange',
      'return': 'red'
    };
    return (
      <Tag color={colors[type] || 'default'} style={{ fontSize: '10px' }}>
        {type?.replace('_', ' ').toUpperCase()}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Date & Time',
      key: 'createdAt',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {moment(record.createdAt).format('DD MMM YYYY')}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {moment(record.createdAt).format('hh:mm A')}
          </div>
        </div>
      ),
      width: 130,
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Movement',
      key: 'movement',
      render: (record) => {
        const config = getMovementTypeConfig(record.movementType);
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: config.bgColor,
            borderRadius: '6px',
            width: 'fit-content'
          }}>
            <span style={{
              marginRight: '8px',
              color: config.color === 'green' ? '#52c41a' : config.color === 'red' ? '#ff4d4f' : '#1890ff'
            }}>
              {config.icon}
            </span>
            <Tag color={config.color} style={{ margin: 0 }}>
              {config.label}
            </Tag>
          </div>
        );
      },
      width: 140,
      filters: [
        { text: 'In', value: 'in' },
        { text: 'Out', value: 'out' },
        { text: 'Transfer', value: 'transfer' }
      ],
      onFilter: (value, record) => record.movementType === value
    },
    {
      title: 'Product',
      key: 'product',
      render: (record) => {
        const productName = record.productType === 'alloy'
          ? record.alloyName
          : (record.tyreBrand ? `${record.tyreBrand} ${record.tyreSize || ''}`.trim() : null);
        return (
          <div>
            <div style={{ fontWeight: 'bold' }}>
              <Tag color={record.productType === 'alloy' ? 'blue' : 'green'}>
                {record.productType?.toUpperCase()}
              </Tag>
              <span style={{ marginLeft: '8px' }}>#{record.productId}</span>
            </div>
            {productName && (
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', maxWidth: '200px' }}>
                <Tooltip title={productName}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {productName}
                  </span>
                </Tooltip>
              </div>
            )}
          </div>
        );
      },
      width: 220
    },
    {
      title: 'Quantity Change',
      key: 'quantity',
      render: (record) => {
        const isPositive = record.movementType === 'in' || record.quantityChange > 0;
        return (
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: isPositive ? '#52c41a' : '#ff4d4f'
            }}>
              {isPositive ? '+' : ''}{record.quantityChange}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {record.previousQuantity} → {record.newQuantity}
            </div>
          </div>
        );
      },
      width: 130
    },
    {
      title: 'Location',
      key: 'location',
      render: (record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EnvironmentOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
            <span>{record.locationName || 'Unknown'}</span>
          </div>
        </div>
      ),
      width: 160
    },
    {
      title: 'Reference',
      key: 'reference',
      render: (record) => (
        <div>
          {getReferenceTypeTag(record.referenceType)}
          {record.referenceId && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Ref #{record.referenceId}
            </div>
          )}
        </div>
      ),
      width: 140
    },
    {
      title: 'Notes',
      key: 'notes',
      render: (record) => (
        <Tooltip title={record.notes}>
          <div style={{
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '12px',
            color: '#666'
          }}>
            {record.notes || '-'}
          </div>
        </Tooltip>
      ),
      width: 200
    },
    {
      title: 'User',
      key: 'user',
      render: (record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: '6px', color: '#666' }} />
          <span style={{ fontSize: '12px' }}>{record.createdByName || 'System'}</span>
        </div>
      ),
      width: 120
    }
  ];

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <HistoryOutlined style={{ marginRight: '12px' }} />
              Inventory Movements
            </Title>
            <Text type="secondary">Track all inventory transactions and movements</Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchMovements}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Movements"
              value={stats.totalMovements}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Items In"
              value={stats.totalIn}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Items Out"
              value={stats.totalOut}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Transfers"
              value={stats.totalTransfers}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card style={{ marginBottom: '24px' }}>
        {/* Search Row */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={12}>
            <Search
              placeholder="Search by product name, product ID, reference ID, location, or notes..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={12} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Text type="secondary" style={{ marginRight: '8px' }}>
              Press Enter to search or click the search button
            </Text>
          </Col>
        </Row>

        {/* Filters Row */}
        <Row gutter={16} align="middle">
          <Col>
            <FilterOutlined style={{ marginRight: '8px' }} />
            <Text strong>Filters:</Text>
          </Col>
          <Col span={3}>
            <Select
              placeholder="Movement Type"
              value={filters.movementType}
              onChange={(value) => handleFilterChange('movementType', value)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="in">In</Option>
              <Option value="out">Out</Option>
              <Option value="transfer">Transfer</Option>
              <Option value="adjustment">Adjustment</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="Reference Type"
              value={filters.referenceType}
              onChange={(value) => handleFilterChange('referenceType', value)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="purchase">Purchase</Option>
              <Option value="production_request">Production</Option>
              <Option value="dispatch">Dispatch</Option>
              <Option value="transfer">Transfer</Option>
              <Option value="adjustment">Adjustment</Option>
              <Option value="return">Return</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="Location"
              value={filters.locationId}
              onChange={(value) => handleFilterChange('locationId', value)}
              allowClear
              style={{ width: '100%' }}
            >
              {locations.map(loc => (
                <Option key={loc.id} value={loc.id}>{loc.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="Product Type"
              value={filters.productType}
              onChange={(value) => handleFilterChange('productType', value)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="alloy">Alloy</Option>
              <Option value="tyre">Tyre</Option>
            </Select>
          </Col>
          <Col span={5}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col>
            <Button
              icon={<ClearOutlined />}
              onClick={clearFilters}
            >
              Clear
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Movements Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={movements}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} movements`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500 }}
          locale={{
            emptyText: <Empty description="No movements found" />
          }}
        />
      </Card>
    </div>
  );
};

export default InventoryMovementsPage;
