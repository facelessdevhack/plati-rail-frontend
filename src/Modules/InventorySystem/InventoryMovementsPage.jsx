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
  Spin,
  Modal,
  Form,
  InputNumber,
  Radio,
  AutoComplete
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
  ClearOutlined,
  PlusOutlined,
  MinusOutlined,
  EditOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';
import moment from 'moment';
import KpiCard from '../../Core/Components/KpiCard';
import DataTablePagination from '../../Core/Components/DataTablePagination';
import PlatiFormStyles from '../../Core/Components/FormStyles';

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

  // Adjustment modal states
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [adjustmentForm] = Form.useForm();

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

      // Backend expects 'offset' not 'page', calculate offset from page number
      const offset = (pagination.current - 1) * pagination.pageSize;
      params.append('offset', offset);
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

  // Product search for adjustment modal
  const handleProductSearch = async (searchText, productType) => {
    if (!searchText || searchText.length < 2) {
      setProductSearchResults([]);
      return;
    }

    setProductSearchLoading(true);
    try {
      const response = await client.get(`/inventory/products/${productType}`, {
        params: { search: searchText, limit: 20 }
      });
      const products = response.data.data || [];
      setProductSearchResults(products.map(p => ({
        value: p.id,
        label: `#${p.id} - ${p.name}${p.size ? ` (${p.size})` : ''}`,
        product: p
      })));
    } catch (error) {
      console.error('Error searching products:', error);
      setProductSearchResults([]);
    } finally {
      setProductSearchLoading(false);
    }
  };

  // Handle adjustment form submission
  const handleAdjustmentSubmit = async (values) => {
    setAdjustmentLoading(true);
    try {
      const response = await client.post('/inventory/internal/adjustment', {
        productType: values.productType,
        productId: values.productId,
        adjustmentType: values.adjustmentType,
        quantity: values.quantity,
        reason: values.reason,
        notes: values.notes
      });

      if (response.data.success) {
        message.success(response.data.message);
        setAdjustmentModalVisible(false);
        adjustmentForm.resetFields();
        fetchMovements(); // Refresh movements list
      } else {
        message.error(response.data.message || 'Failed to create adjustment');
      }
    } catch (error) {
      console.error('Error creating adjustment:', error);
      message.error(error.response?.data?.message || 'Failed to create adjustment');
    } finally {
      setAdjustmentLoading(false);
    }
  };

  // Open adjustment modal - can be called with a record to pre-fill product
  const openAdjustmentModal = (record = null) => {
    adjustmentForm.resetFields();

    if (record && record.productId && record.productType) {
      // Pre-fill with product from the row
      const productName = record.productType === 'alloy'
        ? record.alloyName
        : (record.tyreBrand ? `${record.tyreBrand} ${record.tyreSize || ''}`.trim() : `Product #${record.productId}`);

      adjustmentForm.setFieldsValue({
        productType: record.productType,
        productId: record.productId,
        adjustmentType: 'increase'
      });

      // Set the search results to show the selected product
      setProductSearchResults([{
        value: record.productId,
        label: `#${record.productId} - ${productName}`,
        product: { id: record.productId, name: productName }
      }]);
    } else {
      adjustmentForm.setFieldsValue({
        productType: 'alloy',
        adjustmentType: 'increase'
      });
      setProductSearchResults([]);
    }

    setAdjustmentModalVisible(true);
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
    const configs = {
      'purchase': { bg: '#dbeafe', border: 'rgba(74,144,255,0.2)', dot: '#4a90ff' },
      'production_request': { bg: '#d9fae6', border: 'rgba(78,203,113,0.2)', dot: '#4ecb71' },
      'inventory_request': { bg: '#d9fae6', border: 'rgba(78,203,113,0.2)', dot: '#4ecb71' },
      'dispatch': { bg: '#dbeafe', border: 'rgba(74,144,255,0.2)', dot: '#4a90ff' },
      'transfer': { bg: '#f3e8ff', border: 'rgba(124,58,237,0.2)', dot: '#7c3aed' },
      'adjustment': { bg: '#fff7ed', border: 'rgba(242,108,45,0.2)', dot: '#f26c2d' },
      'return': { bg: '#fef2f2', border: 'rgba(229,62,62,0.2)', dot: '#e53e3e' },
      'rework_plan': { bg: '#fff7ed', border: 'rgba(242,108,45,0.2)', dot: '#f26c2d' },
      'rework_return': { bg: '#ecfeff', border: 'rgba(8,145,178,0.2)', dot: '#0891b2' },
    };
    const c = configs[type] || { bg: '#f3f3f5', border: 'rgba(160,160,168,0.3)', dot: '#9ca3af' };
    const label = type?.replace(/_/g, ' ').toUpperCase() || 'N/A';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 33554400, fontSize: 10,
        fontWeight: 500, fontFamily: "'Inter', sans-serif", lineHeight: '14px', color: '#1a1a1a',
        background: c.bg, border: `1px solid ${c.border}`, whiteSpace: 'nowrap',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
        {label}
      </span>
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
        // Determine if movement is positive based on movement type
        // 'in' movements are positive, 'out' movements are negative
        // Handle both cases: when backend sends negative values OR absolute values
        const isOutMovement = record.movementType === 'out';
        const isPositive = record.movementType === 'in' ||
          (!isOutMovement && record.quantityChange > 0);

        // Get absolute quantity and apply sign based on movement type
        const absQuantity = Math.abs(record.quantityChange);
        const displayQuantity = isOutMovement ? -absQuantity : absQuantity;

        return (
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: isPositive ? '#52c41a' : '#ff4d4f'
            }}>
              {isPositive ? '+' : ''}{displayQuantity}
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
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (record) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => openAdjustmentModal(record)}
        >
          Adjust
        </Button>
      )
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
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Staff Wide Test', serif", fontSize: 42, fontWeight: 400, color: '#1a1a1a', margin: '0 0 4px', lineHeight: '30px' }}>Inventory Movements</h1>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(26,26,26,0.6)' }}>Track all inventory transactions and movements</div>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button onClick={() => openAdjustmentModal()} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#4a90ff', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}><EditOutlined style={{ fontSize: 14 }} /> New Adjustment</button>
          <button onClick={fetchMovements} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}><span style={{ fontSize: 16 }}>↻</span> Refresh</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <KpiCard title="Total Movements" value={stats.totalMovements} icon={<HistoryOutlined />} accentColor="blue" />
        <KpiCard title="Items In" value={stats.totalIn} icon={<ArrowDownOutlined />} accentColor="green" />
        <KpiCard title="Items Out" value={stats.totalOut} icon={<ArrowUpOutlined />} accentColor="red" />
        <KpiCard title="Transfers" value={stats.totalTransfers} icon={<SwapOutlined />} accentColor="purple" />
      </div>

      {/* Filter Bar */}
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, padding: '12px 32px', marginBottom: 16, boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input type="text" placeholder="Search product, ID, location, notes..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handleSearch(filters.search)} style={{ flex: 1, minWidth: 200, height: 40, border: '1px solid #a0a0a8', borderRadius: 123, padding: '0 16px', fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', outline: 'none', background: 'white' }} />
          <DatePicker.RangePicker value={filters.dateRange} onChange={(dates) => handleFilterChange('dateRange', dates)} format="DD MMM YYYY" placeholder={['Start Date', 'End Date']} className="plati-filter-daterange" style={{ height: 40, borderRadius: 123, borderColor: '#a0a0a8', minWidth: 260 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Filters:</span>
          <Select placeholder="Movement" value={filters.movementType} onChange={(v) => handleFilterChange('movementType', v)} allowClear style={{ width: 130, height: 36 }} className="plati-filter-dealer" options={[{ value: 'in', label: 'In' }, { value: 'out', label: 'Out' }, { value: 'transfer', label: 'Transfer' }, { value: 'adjustment', label: 'Adjustment' }]} />
          <Select placeholder="Reference" value={filters.referenceType} onChange={(v) => handleFilterChange('referenceType', v)} allowClear style={{ width: 150, height: 36 }} className="plati-filter-dealer" options={[{ value: 'purchase', label: 'Purchase' }, { value: 'production_request', label: 'Production' }, { value: 'inventory_request', label: 'Inventory Req' }, { value: 'dispatch', label: 'Dispatch' }, { value: 'transfer', label: 'Transfer' }, { value: 'adjustment', label: 'Adjustment' }, { value: 'return', label: 'Return' }]} />
          <Select placeholder="Location" value={filters.locationId} onChange={(v) => handleFilterChange('locationId', v)} allowClear style={{ width: 150, height: 36 }} className="plati-filter-dealer" options={locations.map(l => ({ value: l.id, label: l.name }))} />
          <Select placeholder="Product Type" value={filters.productType} onChange={(v) => handleFilterChange('productType', v)} allowClear style={{ width: 130, height: 36 }} className="plati-filter-dealer" options={[{ value: 'alloy', label: 'Alloy' }, { value: 'tyre', label: 'Tyre' }]} />
          <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 36, padding: '0 12px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 13, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}>Clear</button>
        </div>
      </div>

      {/* Movements Table */}
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1100 }}>
            <thead>
              <tr>
                {['Date', 'Type', 'Product', 'Qty', 'Location', 'Reference', 'Notes', 'User', 'Action'].map((h, i) => (
                  <th key={h} style={{
                    background: '#f3f3f5', padding: '12px 16px', textAlign: 'left',
                    fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 14,
                    fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5',
                    whiteSpace: 'nowrap', lineHeight: '20px',
                    paddingLeft: i === 0 ? 32 : undefined,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No movements found</td></tr>
              ) : (
                movements.map((record) => {
                  const config = getMovementTypeConfig(record.movementType)
                  const isOut = record.movementType === 'out'
                  const isPositive = record.movementType === 'in' || (!isOut && record.quantityChange > 0)
                  const absQty = Math.abs(record.quantityChange)
                  const displayQty = isOut ? -absQty : absQty
                  const productName = record.productType === 'alloy' ? record.alloyName : (record.tyreBrand ? `${record.tyreBrand} ${record.tyreSize || ''}`.trim() : null)

                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Date */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle', paddingLeft: 24, whiteSpace: 'nowrap', fontSize: 12 }}>
                        {moment(record.createdAt).format('DD MMM YYYY')}<br />
                        <span style={{ color: '#9ca3af', fontSize: 11 }}>{moment(record.createdAt).format('hh:mm A')}</span>
                      </td>
                      {/* Movement */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '5px 13px', borderRadius: 33554400, fontSize: 12,
                          fontWeight: 400, fontFamily: "'Inter', sans-serif", lineHeight: '16px', color: '#1a1a1a',
                          background: config.bgColor,
                          border: `1px solid ${config.color === 'green' ? 'rgba(78,203,113,0.2)' : config.color === 'red' ? 'rgba(229,62,62,0.2)' : config.color === 'blue' ? 'rgba(74,144,255,0.2)' : 'rgba(160,160,168,0.3)'}`,
                        }}>
                          <span style={{ fontSize: 12, color: config.color === 'green' ? '#4ecb71' : config.color === 'red' ? '#e53e3e' : config.color === 'blue' ? '#4a90ff' : '#f26c2d' }}>{config.icon}</span>
                          {config.label}
                        </span>
                      </td>
                      {/* Product */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle', maxWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: record.productType === 'alloy' ? '#dbeafe' : '#d9fae6',
                            color: record.productType === 'alloy' ? '#4a90ff' : '#15803d',
                          }}>{record.productType?.toUpperCase()}</span>
                          <span style={{ fontSize: 13, color: '#6b7280' }}>#{record.productId}</span>
                        </div>
                        {productName && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productName}</div>}
                      </td>
                      {/* Qty Change */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: isPositive ? '#4ecb71' : '#e53e3e' }}>
                          {isPositive ? '+' : ''}{displayQty}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{record.previousQuantity} → {record.newQuantity}</div>
                      </td>
                      {/* Location */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontSize: 13 }}>
                        <span style={{ color: '#4a90ff' }}><EnvironmentOutlined /></span> {record.locationName || 'Unknown'}
                      </td>
                      {/* Reference */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        {getReferenceTypeTag(record.referenceType)}
                        {record.referenceId && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Ref #{record.referenceId}</div>}
                      </td>
                      {/* Notes */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <Tooltip title={record.notes || 'No notes'} placement="topLeft">
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 8, fontSize: 12,
                            background: record.notes ? '#f9fafb' : 'transparent',
                            border: record.notes ? '1px solid #e5e5e5' : 'none',
                            color: record.notes ? '#374151' : '#d1d5db',
                            width: '100%', overflow: 'hidden',
                            cursor: record.notes ? 'pointer' : 'default',
                            fontFamily: "'Inter', sans-serif",
                          }}>
                            {record.notes ? (
                              <>
                                <span style={{ flexShrink: 0 }}>📝</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.notes}</span>
                              </>
                            ) : '—'}
                          </div>
                        </Tooltip>
                      </td>
                      {/* User */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontSize: 12, color: '#6b7280' }}>
                        {record.createdByName || 'System'}
                      </td>
                      {/* Action */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <button onClick={() => openAdjustmentModal(record)} style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: '#4a90ff', border: 'none', borderRadius: 10,
                          padding: '6px 12px', fontSize: 13, fontWeight: 500,
                          fontFamily: "'Inter', sans-serif", color: 'white',
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}><EditOutlined /> Adjust</button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          currentPage={pagination.current}
          totalItems={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
          onPageSizeChange={(size) => setPagination(prev => ({ ...prev, pageSize: size, current: 1 }))}
        />
      </div>

      {/* Inventory Adjustment Modal */}
      <PlatiFormStyles />
      <Modal
        title={<span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 500, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}><EditOutlined style={{ color: '#4a90ff' }} /> Manual Inventory Adjustment</span>}
        open={adjustmentModalVisible}
        onCancel={() => setAdjustmentModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
        styles={{ body: { padding: '16px 24px 24px' } }}
      >
        <div className="plati-form">
          <Form form={adjustmentForm} layout="vertical" onFinish={handleAdjustmentSubmit} initialValues={{ productType: 'alloy', adjustmentType: 'increase' }}>
            <Form.Item name="productType" label="Product Type" rules={[{ required: true }]}>
              <Radio.Group onChange={() => { adjustmentForm.setFieldValue('productId', undefined); setProductSearchResults([]) }}>
                <Radio.Button value="alloy">Alloy</Radio.Button>
                <Radio.Button value="tyre">Tyre</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.productType !== curr.productType}>
              {({ getFieldValue }) => (
                <Form.Item name="productId" label="Product" rules={[{ required: true }]}>
                  <AutoComplete options={productSearchResults} onSearch={(t) => handleProductSearch(t, getFieldValue('productType'))} placeholder={`Search ${getFieldValue('productType')}...`} notFoundContent={productSearchLoading ? <Spin size="small" /> : 'Type to search...'} style={{ width: '100%' }} />
                </Form.Item>
              )}
            </Form.Item>
            <Form.Item name="adjustmentType" label="Adjustment Type" rules={[{ required: true }]}>
              <Radio.Group>
                <Radio.Button value="increase"><PlusOutlined /> Increase</Radio.Button>
                <Radio.Button value="decrease"><MinusOutlined /> Decrease</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="quantity" label="Quantity" rules={[{ required: true }, { type: 'number', min: 1 }]}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter quantity" />
            </Form.Item>
            <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
              <Select placeholder="Select reason">
                <Option value="Stock Count Correction">Stock Count Correction</Option>
                <Option value="Damaged Goods">Damaged Goods</Option>
                <Option value="Lost/Missing">Lost/Missing</Option>
                <Option value="Found Stock">Found Stock</Option>
                <Option value="System Error Correction">System Error Correction</Option>
                <Option value="Return to Supplier">Return to Supplier</Option>
                <Option value="Quality Issue">Quality Issue</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item name="notes" label="Additional Notes">
              <Input.TextArea rows={3} placeholder="Enter details..." />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16 }}>
              <button type="button" onClick={() => setAdjustmentModalVisible(false)} style={{ background: '#e5e5e5', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ background: '#4a90ff', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', opacity: adjustmentLoading ? 0.5 : 1 }}>{adjustmentLoading ? 'Submitting...' : 'Submit Adjustment'}</button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryMovementsPage;
