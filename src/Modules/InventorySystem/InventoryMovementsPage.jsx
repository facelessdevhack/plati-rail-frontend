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

  // ── Plain-language helpers ────────────────────────────────────────────────
  // Pull the dealer name out of the freeform `notes` field. The backend
  // serialises it as "...dealer: NAME | Product: ..." or
  // "...(dispatch_entry #N | dealer: NAME)" depending on the call site.
  const parseDealerFromNotes = (notes) => {
    if (!notes) return null
    const m = notes.match(/dealer[:\s]+([^|()]+?)(?=\s*(?:\||\)|$))/i)
    return m ? m[1].trim() : null
  }

  // Adjustment notes look like "Manual Adjustment: REASON" or
  // "Manual Adjustment: REASON - extra detail".
  const parseReasonFromNotes = (notes) => {
    if (!notes) return null
    const m = notes.match(/Manual Adjustment:\s*([^-]+?)(?:\s*-|$)/i)
    return m ? m[1].trim() : null
  }

  // Map a (referenceType, movementType) pair to a verb a warehouse user
  // recognises, plus a colour and icon. Falls back to the raw movementType.
  const humanizeMovement = (record) => {
    const ref = record.referenceType || ''
    const isIn = record.movementType === 'in'
    const isOut = record.movementType === 'out'
    const dealer = parseDealerFromNotes(record.notes)
    const refId = record.referenceId

    const sold = (label = 'Sold') => ({ verb: label, color: '#e53e3e', icon: '📤', to: dealer })
    const received = (label = 'Received') => ({ verb: label, color: '#4ecb71', icon: '📥', to: dealer })

    if (ref === 'dispatch_entry' && isOut) return sold('Sold')
    if (ref === 'inprod_to_dispatch' && isOut) return sold('Sold (from in-production)')
    if (ref === 'pending_to_dispatch' && isOut) return sold('Sold (pending fulfilled)')
    if (ref === 'sales_entry' && isOut) return sold('Sales entry')
    if (ref === 'dispatch_entry_delete' && isIn) return { verb: 'Cancelled dispatch', color: '#9ca3af', icon: '↩️', to: refId ? `restored, dispatch #${refId}` : 'restored' }
    if (ref === 'inprod_dispatch_delete' && isIn) return { verb: 'Cancelled in-prod dispatch', color: '#9ca3af', icon: '↩️', to: 'restored' }
    if (ref === 'pricing_entry_delete' && isIn) return { verb: 'Cancelled pricing entry', color: '#9ca3af', icon: '↩️', to: 'restored' }
    if (ref === 'production_request' && isIn) return { verb: 'Received from production', color: '#4ecb71', icon: '🏭', to: refId ? `production plan #${refId}` : null }
    if (ref === 'purchase_entry' && isIn) return received('Bought back from dealer')
    if (ref?.startsWith('sales_entry_edit')) return { verb: isIn ? 'Sales entry edited (restored)' : 'Sales entry edited (deducted)', color: '#f26c2d', icon: '✏️', to: dealer }
    if (ref?.startsWith('purchase_entry_edit')) return { verb: isIn ? 'Purchase edit (added stock)' : 'Purchase edit (removed stock)', color: '#f26c2d', icon: '✏️', to: dealer }
    if (ref === 'transfer') return { verb: 'Transferred', color: '#4a90ff', icon: '🔄', to: null }
    if (ref === 'adjustment') {
      const reason = parseReasonFromNotes(record.notes)
      return { verb: isIn ? 'Stock added (manual)' : 'Stock removed (manual)', color: '#7c3aed', icon: '⚙️', to: null, reason }
    }
    if (ref?.startsWith('phantom_backfill')) return { verb: 'Backfilled missing dispatch', color: '#7c3aed', icon: '🔧', to: dealer || (refId ? `dispatch #${refId}` : null) }
    if (ref === 'reserve' || record.movementType === 'reserve') return { verb: 'Reserved', color: '#f26c2d', icon: '🔒', to: null }
    if (ref === 'unreserve' || record.movementType === 'unreserve') return { verb: 'Reservation released', color: '#9ca3af', icon: '🔓', to: null }
    return { verb: (record.movementType || 'Movement').toUpperCase(), color: '#6b7280', icon: '•', to: dealer }
  }

  // Today / Yesterday / weekday for recent dates; full date for older.
  const formatRelativeDay = (ts) => {
    const m = moment(ts)
    const todayStart = moment().startOf('day')
    const yStart = moment().subtract(1, 'day').startOf('day')
    if (m.isSameOrAfter(todayStart)) return 'Today'
    if (m.isSameOrAfter(yStart)) return 'Yesterday'
    if (m.isAfter(moment().subtract(7, 'days'))) return m.format('ddd, DD MMM')
    return m.format('DD MMM YYYY')
  }

  // Decide which optional columns to hide based on active filters.
  const hiddenCols = {
    location: !!filters.locationId,
    productType: !!filters.productType,
  }

  // Single-product reconciliation: triggered when search is a numeric product ID.
  const focusedProductId = (() => {
    const t = (filters.search || '').trim()
    return /^\d+$/.test(t) ? Number(t) : null
  })()
  const focusedSummary = (() => {
    if (!focusedProductId) return null
    const rows = movements.filter(m => Number(m.productId) === focusedProductId)
    if (rows.length === 0) return null
    const last30 = moment().subtract(30, 'days')
    const recent = rows.filter(m => moment(m.createdAt).isAfter(last30))
    const inQty = recent.filter(m => m.movementType === 'in').reduce((s, m) => s + Math.abs(m.quantityChange || 0), 0)
    const outQty = recent.filter(m => m.movementType === 'out').reduce((s, m) => s + Math.abs(m.quantityChange || 0), 0)
    const latest = rows[0] // movements come back desc by createdAt
    const productName = latest.productType === 'alloy'
      ? latest.alloyName
      : (latest.tyreBrand ? `${latest.tyreBrand} ${latest.tyreSize || ''}`.trim() : `Product #${latest.productId}`)
    return { productName, currentQty: latest.newQuantity, inQty, outQty, total30: recent.length }
  })()

  // Detect cancelled-and-recreated dispatch pairs so the table can mute the
  // first dispatch and the restore as "cancelled, see below".
  // Looks for any `dispatch_entry_delete` IN row and pairs it with the most
  // recent `dispatch_entry` OUT row for the same product within 10 minutes
  // before it.
  const cancelledDispatchIds = (() => {
    const set = new Set()
    movements.forEach((m, idx) => {
      if (m.referenceType !== 'dispatch_entry_delete' || m.movementType !== 'in') return
      // Movements come desc; the cancelled OUT is later in the array
      for (let j = idx + 1; j < movements.length; j++) {
        const c = movements[j]
        if (c.productId !== m.productId) continue
        if (c.movementType !== 'out' || c.referenceType !== 'dispatch_entry') continue
        const gapMin = Math.abs(moment(m.createdAt).diff(moment(c.createdAt), 'minutes'))
        if (gapMin <= 10 && Number(c.quantityChange) === Number(m.quantityChange)) {
          set.add(c.id)
          set.add(m.id)
          break
        }
      }
    })
    return set
  })()

  // CSV export of currently visible movements.
  const exportToCsv = () => {
    const headers = ['Date', 'Time', 'Activity', 'Counterparty', 'Reference Type', 'Reference ID', 'Product Type', 'Product ID', 'Product Name', 'Qty Change', 'Previous Qty', 'New Qty', 'Location', 'User', 'Notes']
    const rows = movements.map(m => {
      const h = humanizeMovement(m)
      const productName = m.productType === 'alloy' ? (m.alloyName || '') : (m.tyreBrand ? `${m.tyreBrand} ${m.tyreSize || ''}`.trim() : '')
      const isOut = m.movementType === 'out'
      const signedQty = isOut ? -Math.abs(m.quantityChange) : Math.abs(m.quantityChange)
      return [
        moment(m.createdAt).format('YYYY-MM-DD'),
        moment(m.createdAt).format('HH:mm:ss'),
        h.verb,
        h.to || '',
        m.referenceType || '',
        m.referenceId ?? '',
        m.productType || '',
        m.productId ?? '',
        productName,
        signedQty,
        m.previousQuantity ?? '',
        m.newQuantity ?? '',
        m.locationName || '',
        m.createdByName || 'System',
        (m.notes || '').replace(/\r?\n/g, ' ')
      ]
    })
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-movements-${moment().format('YYYY-MM-DD-HHmm')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

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
          <button onClick={exportToCsv} disabled={loading || movements.length === 0} title="Download visible rows as CSV" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 16px', background: '#f3f3f5', border: 'none', borderRadius: 123, fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: movements.length === 0 ? 'not-allowed' : 'pointer', opacity: movements.length === 0 ? 0.5 : 1 }}><DownloadOutlined /> Export CSV</button>
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

      {/* Per-product reconciliation banner (shown when the search box holds a product ID) */}
      {focusedSummary && (
        <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, padding: '14px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}>
          <div>
            <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', letterSpacing: 0.6 }}>Product #{focusedProductId}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', fontFamily: "'Inter', sans-serif", marginTop: 2 }}>{focusedSummary.productName}</div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontFamily: "'Inter', sans-serif" }}>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>Current stock</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{focusedSummary.currentQty}</div>
            </div>
            <div style={{ width: 1, height: 32, background: '#e5e5e5' }} />
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>Last 30 days</div>
              <div style={{ fontSize: 14, color: '#1a1a1a', marginTop: 2 }}>
                <span style={{ color: '#4ecb71', fontWeight: 600 }}>+{focusedSummary.inQty} in</span>
                <span style={{ color: '#9ca3af', margin: '0 8px' }}>·</span>
                <span style={{ color: '#e53e3e', fontWeight: 600 }}>−{focusedSummary.outQty} out</span>
                <span style={{ color: '#9ca3af', margin: '0 8px' }}>·</span>
                <span>{focusedSummary.total30} movements</span>
              </div>
            </div>
            <button
              onClick={() => openAdjustmentModal({ productId: focusedProductId, productType: movements[0]?.productType || 'alloy', alloyName: focusedSummary.productName })}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', background: '#7c3aed', border: 'none', borderRadius: 123, fontSize: 13, fontWeight: 500, color: 'white', cursor: 'pointer' }}
            >
              <EditOutlined /> Adjust this product
            </button>
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr>
                {(() => {
                  const headers = [
                    { key: 'when', label: 'When', show: true, pl: 32 },
                    { key: 'activity', label: 'Activity', show: true },
                    { key: 'stock', label: 'Stock change', show: true },
                    { key: 'product', label: 'Product', show: true },
                    { key: 'location', label: 'Location', show: !hiddenCols.location },
                    { key: 'user', label: 'By', show: true },
                  ].filter(h => h.show)
                  return headers.map((h) => (
                    <th key={h.key} style={{
                      background: '#f3f3f5', padding: '12px 16px', textAlign: 'left',
                      fontWeight: 500, color: 'rgba(26,26,26,0.6)', fontSize: 13,
                      fontFamily: "'Inter', sans-serif", borderBottom: '1px solid #e5e5e5',
                      whiteSpace: 'nowrap', lineHeight: '20px',
                      paddingLeft: h.pl,
                    }}>{h.label}</th>
                  ))
                })()}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#f55e34', fontWeight: 500 }}>No movements found</td></tr>
              ) : (
                (() => {
                  const colCount = 4 + (!hiddenCols.location ? 1 : 0) + 1 // when, activity, stock, product, [location], user
                  const out = []
                  let lastDay = null
                  movements.forEach((record) => {
                    const day = moment(record.createdAt).format('YYYY-MM-DD')
                    if (day !== lastDay) {
                      out.push(
                        <tr key={`day-${day}`} style={{ background: '#f9fafb' }}>
                          <td colSpan={colCount} style={{ padding: '8px 32px', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5', borderTop: '1px solid #e5e5e5' }}>
                            — {formatRelativeDay(record.createdAt)} <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>{moment(record.createdAt).format('DD MMM YYYY')}</span> —
                          </td>
                        </tr>
                      )
                      lastDay = day
                    }

                    const h = humanizeMovement(record)
                    const isOut = record.movementType === 'out'
                    const isIn = record.movementType === 'in'
                    const absQty = Math.abs(record.quantityChange || 0)
                    const signedQty = isOut ? -absQty : absQty
                    const productName = record.productType === 'alloy' ? record.alloyName : (record.tyreBrand ? `${record.tyreBrand} ${record.tyreSize || ''}`.trim() : null)
                    const isCancelledPair = cancelledDispatchIds.has(record.id)
                    const isSystemUser = !record.createdByName || record.createdByName === 'System'
                    const initials = isSystemUser ? '' : record.createdByName.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
                    const stripeColor = isIn ? '#4ecb71' : isOut ? '#e53e3e' : '#9ca3af'

                    out.push(
                      <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: isCancelledPair ? 0.55 : 1 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* When (with left stripe to indicate direction) */}
                        <td style={{ padding: '12px 12px 12px 32px', verticalAlign: 'middle', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif", borderLeft: `3px solid ${stripeColor}` }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{moment(record.createdAt).format('hh:mm A')}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{moment(record.createdAt).format('DD MMM')}</div>
                        </td>

                        {/* Activity — verb + counterparty + chips, single readable sentence */}
                        <td style={{ padding: '12px 12px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif" }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 16 }}>{h.icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: h.color, textDecoration: isCancelledPair ? 'line-through' : 'none' }}>{h.verb}</span>
                            {h.to && (
                              <span style={{ fontSize: 13, color: '#4b5563' }}>
                                <span style={{ color: '#9ca3af', marginRight: 4 }}>→</span>{h.to}
                              </span>
                            )}
                            {h.reason && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, background: '#f3e8ff', color: '#7c3aed', fontSize: 11, fontWeight: 500 }}>{h.reason}</span>
                            )}
                            {isCancelledPair && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 500 }}>cancelled & re-applied</span>
                            )}
                            {record.referenceType?.startsWith('phantom_backfill') && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 500 }}>backfill</span>
                            )}
                            {record.referenceId ? (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  navigator.clipboard?.writeText(String(record.referenceId))
                                  message.success(`Reference #${record.referenceId} copied`)
                                }}
                                title="Copy reference ID"
                                style={{ fontSize: 11, color: '#4a90ff', textDecoration: 'none', borderBottom: '1px dashed #4a90ff' }}
                              >ref #{record.referenceId}</a>
                            ) : null}
                          </div>
                          {record.notes && (
                            <div style={{ marginTop: 4, fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }} title={record.notes}>
                              {record.notes}
                            </div>
                          )}
                        </td>

                        {/* Stock change — the big number warehouse staff want */}
                        <td style={{ padding: '12px 12px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>{record.previousQuantity}</span>
                            <span style={{ fontSize: 12, color: stripeColor }}>{isIn ? '↑' : isOut ? '↓' : '→'}</span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{record.newQuantity}</span>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: stripeColor, marginTop: 2 }}>
                            {signedQty > 0 ? '+' : ''}{signedQty}
                          </div>
                        </td>

                        {/* Product — compact */}
                        <td style={{ padding: '12px 12px', verticalAlign: 'middle', maxWidth: 220, fontFamily: "'Inter', sans-serif" }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {!hiddenCols.productType && (
                              <span style={{
                                display: 'inline-flex', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                background: record.productType === 'alloy' ? '#dbeafe' : '#d9fae6',
                                color: record.productType === 'alloy' ? '#1d4ed8' : '#15803d',
                              }}>{record.productType?.toUpperCase()}</span>
                            )}
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>#{record.productId}</span>
                          </div>
                          {productName && (
                            <Tooltip title={productName}>
                              <div style={{ fontSize: 13, color: '#1a1a1a', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{productName}</div>
                            </Tooltip>
                          )}
                        </td>

                        {/* Location (hidden when location filter is active) */}
                        {!hiddenCols.location && (
                          <td style={{ padding: '12px 12px', verticalAlign: 'middle', fontSize: 12, color: '#4b5563', fontFamily: "'Inter', sans-serif" }}>
                            <span style={{ color: '#9ca3af', marginRight: 4 }}><EnvironmentOutlined /></span>{record.locationName || '—'}
                          </td>
                        )}

                        {/* User — avatar for human, ⚙️ for system */}
                        <td style={{ padding: '12px 12px', verticalAlign: 'middle', fontFamily: "'Inter', sans-serif" }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 26, height: 26, borderRadius: '50%',
                              background: isSystemUser ? '#f3f3f5' : '#e0e7ff',
                              color: isSystemUser ? '#9ca3af' : '#4338ca',
                              fontSize: isSystemUser ? 14 : 11, fontWeight: 600,
                            }}>{isSystemUser ? '⚙' : initials}</span>
                            <span style={{ fontSize: 12, color: '#4b5563' }}>{record.createdByName || 'System'}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                  return out
                })()
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
