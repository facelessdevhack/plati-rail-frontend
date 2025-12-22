import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Tag, message, Space, Input, Select, DatePicker, Card, Dropdown } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  ReloadOutlined, 
  ClearOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DownOutlined
} from '@ant-design/icons';
import { getPendingEntriesAPI, movePendingToMasterAPI, deletePendingEntryAPI } from '../../redux/api/entriesAPI';
import { useDispatch } from 'react-redux';
import moment from 'moment';
import * as XLSX from 'xlsx';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PendingEntriesView = () => {
  const dispatch = useDispatch();
  const [pendingEntries, setPendingEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [dealerFilter, setDealerFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  const fetchPendingEntries = async () => {
    setLoading(true);
    try {
      const response = await dispatch(getPendingEntriesAPI()).unwrap();
      const entries = response.pendingEntries || [];

      // Sort entries: processable entries first, then by date (newest first)
      const sortedEntries = [...entries].sort((a, b) => {
        const aStock = a.inHouseStock || 0;
        const aQuantity = a.quantity || 0;
        const bStock = b.inHouseStock || 0;
        const bQuantity = b.quantity || 0;

        const aCanProcess = aStock >= aQuantity;
        const bCanProcess = bStock >= bQuantity;

        // If one can be processed and the other can't, prioritize the processable one
        if (aCanProcess !== bCanProcess) {
          return bCanProcess ? 1 : -1; // bCanProcess true means b should come first
        }

        // If both can be processed or both can't, sort by date (newest first, using IST)
        const aDate = a.dateIST ? moment(a.dateIST) : moment.utc(a.date || a.created_at || 0).utcOffset('+05:30');
        const bDate = b.dateIST ? moment(b.dateIST) : moment.utc(b.date || b.created_at || 0).utcOffset('+05:30');
        return bDate - aDate; // Newest first
      });

      setPendingEntries(sortedEntries);
    } catch (error) {
      console.error('Error fetching pending entries:', error);
      message.error('Failed to load pending entries');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessEntry = async (entryId) => {
    setProcessingId(entryId);
    try {
      const response = await movePendingToMasterAPI({ pendingEntryId: entryId });
      if (response.status === 200) {
        message.success('Entry processed successfully! Stock is now available.');
        fetchPendingEntries(); // Refresh the list
      } else {
        message.error(response.data?.message || 'Failed to process entry');
      }
    } catch (error) {
      console.error('Error processing entry:', error);
      message.error('Insufficient stock or error processing entry');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    setDeletingId(entryId);
    try {
      // Show confirmation dialog
      const confirmed = window.confirm('Are you sure you want to delete this pending entry?');

      if (confirmed) {
        // Call the real API
        const response = await deletePendingEntryAPI({ pendingEntryId: entryId });

        if (response.status === 200) {
          message.success('Pending entry deleted successfully!');
          fetchPendingEntries(); // Refresh the list to get updated data
        } else {
          message.error(response.data?.message || 'Failed to delete entry');
        }
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      message.error(error.response?.data?.message || 'Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  // Extract unique dealers for the filter
  const uniqueDealers = useMemo(() => {
    const dealers = pendingEntries.map(entry => entry.dealerName).filter(Boolean);
    return [...new Set(dealers)].sort();
  }, [pendingEntries]);

  // Filtering logic
  const filteredEntries = useMemo(() => {
    return pendingEntries.filter(entry => {
      // Search text filter (Dealer or Product)
      const matchesSearch = !searchText || 
        (entry.dealerName?.toLowerCase().includes(searchText.toLowerCase())) ||
        (entry.productName?.toLowerCase().includes(searchText.toLowerCase())) ||
        (entry.id?.toString().includes(searchText));

      // Dealer filter
      const matchesDealer = !dealerFilter || entry.dealerName === dealerFilter;

      // Date range filter
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const entryDate = entry.dateIST ? moment(entry.dateIST) : moment.utc(entry.date || entry.created_at).utcOffset('+05:30');
        
        // Explicitly convert to moment and set to start/end of day to be absolutely sure
        const startDate = moment(dateRange[0].valueOf()).startOf('day');
        const endDate = moment(dateRange[1].valueOf()).endOf('day');
        
        matchesDate = entryDate.isSameOrAfter(startDate) && entryDate.isSameOrBefore(endDate);
      }

      return matchesSearch && matchesDealer && matchesDate;
    });
  }, [pendingEntries, searchText, dealerFilter, dateRange]);

  const handleClearFilters = () => {
    setSearchText('');
    setDealerFilter(null);
    setDateRange(null);
    message.info('Filters cleared');
  };

  const exportToExcel = () => {
    if (filteredEntries.length === 0) {
      message.warning('No entries to export');
      return;
    }

    try {
      const excelData = filteredEntries.map((entry, index) => ({
        'S.No': index + 1,
        'Entry ID': entry.id,
        'Date': entry.dateIST ? moment(entry.dateIST).format('DD MMM YYYY hh:mm A') : (entry.date ? moment.utc(entry.date).utcOffset('+05:30').format('DD MMM YYYY hh:mm A') : 'N/A'),
        'Dealer': entry.dealerName || 'N/A',
        'Product': entry.productName || 'N/A',
        'Quantity': entry.quantity || 0,
        'Current Stock': entry.inHouseStock || 0,
        'Status': entry.pendingStatus === 'awaiting_stock' ? 'Awaiting Stock' : entry.pendingStatus
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pending Entries');
      XLSX.writeFile(wb, `Pending_Entries_${moment().format('DD-MM-YYYY_HHmm')}.xlsx`);
      message.success('Excel exported successfully');
    } catch (error) {
      console.error('Excel Export Error:', error);
      message.error('Failed to export Excel');
    }
  };

  const exportToPDF = () => {
    if (filteredEntries.length === 0) {
      message.warning('No entries to export');
      return;
    }

    try {
      // Group by dealer
      const groupedByDealer = filteredEntries.reduce((groups, entry) => {
        const dealer = entry.dealerName || 'Unknown Dealer';
        if (!groups[dealer]) groups[dealer] = [];
        groups[dealer].push(entry);
        return groups;
      }, {});

      let htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; font-size: 14px; padding: 20px; }
              h1 { text-align: center; color: #333; margin-bottom: 30px; }
              .dealer-section { margin-bottom: 25px; page-break-inside: avoid; }
              .dealer-header { background: #f0f2f5; padding: 10px; font-weight: bold; border: 1px solid #d9d9d9; margin-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #d9d9d9; padding: 8px; text-align: left; }
              th { background: #fafafa; font-weight: bold; }
              .text-center { text-align: center; }
              @media print {
                @page { margin: 15mm; }
              }
            </style>
          </head>
          <body>
            <h1>Pending Entries Report - ${moment().format('DD MMM YYYY')}</h1>
      `;

      Object.entries(groupedByDealer).forEach(([dealer, entries]) => {
        htmlContent += `
          <div class="dealer-section">
            <div class="dealer-header">${dealer}</div>
            <table>
              <thead>
                <tr>
                  <th width="15%">Date</th>
                  <th width="45%">Product</th>
                  <th width="10%" class="text-center">Qty</th>
                  <th width="15%" class="text-center">Stock</th>
                  <th width="15%">Status</th>
                </tr>
              </thead>
              <tbody>
        `;

        entries.forEach(entry => {
          const date = entry.dateIST ? moment(entry.dateIST).format('DD MMM YYYY') : (entry.date ? moment.utc(entry.date).utcOffset('+05:30').format('DD MMM YYYY') : 'N/A');
          htmlContent += `
            <tr>
              <td>${date}</td>
              <td>${entry.productName || 'N/A'}</td>
              <td class="text-center">${entry.quantity || 0}</td>
              <td class="text-center" style="color: ${(entry.inHouseStock || 0) > 0 ? '#52c41a' : '#ff4d4f'}">${entry.inHouseStock || 0}</td>
              <td>${entry.pendingStatus === 'awaiting_stock' ? 'Awaiting Stock' : entry.pendingStatus}</td>
            </tr>
          `;
        });

        htmlContent += `</tbody></table></div>`;
      });

      htmlContent += `</body></html>`;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
      message.success('PDF print dialog opened');
    } catch (error) {
      console.error('PDF Export Error:', error);
      message.error('Failed to export PDF');
    }
  };

  const exportMenu = {
    items: [
      {
        key: 'excel',
        label: 'Export to Excel',
        icon: <FileExcelOutlined style={{ color: '#52c41a' }} />,
        onClick: exportToExcel
      },
      {
        key: 'pdf',
        label: 'Export to PDF',
        icon: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
        onClick: exportToPDF
      }
    ]
  };

  const columns = [
    {
      title: 'Entry ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date, record) => {
        if (!date) return 'N/A'
        // Use IST date from backend if available, otherwise convert to IST
        const istDate = record.dateIST ? moment(record.dateIST) : moment.utc(date).utcOffset('+05:30')
        return istDate.format('DD MMM YYYY HH:mm')
      }
    },
    {
      title: 'Dealer',
      dataIndex: 'dealerName',
      key: 'dealerName',
      width: 200,
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: 250,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
    },
    {
      title: 'Current Stock',
      dataIndex: 'inHouseStock',
      key: 'inHouseStock',
      width: 120,
      align: 'center',
      render: (stock) => {
        const stockValue = stock || 0
        return (
          <span style={{
            color: stockValue > 0 ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold'
          }}>
            {stockValue}
          </span>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'pendingStatus',
      key: 'pendingStatus',
      width: 150,
      render: status => (
        <Tag icon={<ClockCircleOutlined />} color='processing'>
          {status === 'awaiting_stock' ? 'Awaiting Stock' : status}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const currentStock = record.inHouseStock || 0
        const requiredQuantity = record.quantity || 0
        const hasEnoughStock = currentStock >= requiredQuantity

        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              loading={processingId === record.id}
              disabled={!hasEnoughStock}
              onClick={() => handleProcessEntry(record.id)}
              title={hasEnoughStock ? 'Process this entry' : `Insufficient stock: need ${requiredQuantity}, have ${currentStock}`}
            >
              Process
            </Button>
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={deletingId === record.id}
              onClick={() => handleDeleteEntry(record.id)}
            >
              Delete
            </Button>
          </Space>
        )
      },
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">⏳ Pending Entries</h2>
          <p className="text-gray-600 mt-1">
            Entries awaiting stock availability (not in production)
          </p>
        </div>
        <Space wrap>
          <Dropdown menu={exportMenu} trigger={['click']}>
            <Button icon={<ExportOutlined />} type="default">
              Export <DownOutlined />
            </Button>
          </Dropdown>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchPendingEntries} 
            loading={loading}
          >
            Refresh
          </Button>
          <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}>
            {filteredEntries.length} / {pendingEntries.length} Shown
          </Tag>
        </Space>
      </div>

      {/* Filter Card */}
      <Card className="mb-6 shadow-sm border-gray-200" bodyStyle={{ padding: '16px' }}>
        <div className="flex flex-wrap gap-4 items-center">
          <div style={{ flex: '1 1 300px' }}>
            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search</span>
            <Search
              placeholder="Search Dealer, Product or ID..."
              allowClear
              enterButton={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onSearch={setSearchText}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dealer</span>
            <Select
              showSearch
              placeholder="Filter by Dealer"
              style={{ width: '100%' }}
              value={dealerFilter}
              onChange={setDealerFilter}
              allowClear
            >
              {uniqueDealers.map(dealer => (
                <Option key={dealer} value={dealer}>{dealer}</Option>
              ))}
            </Select>
          </div>

          <div style={{ flex: '1 1 280px' }}>
            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date Range</span>
            <RangePicker 
              style={{ width: '100%' }} 
              value={dateRange}
              onChange={setDateRange}
              format="DD-MM-YYYY"
            />
          </div>

          <div className="pt-5">
            <Button 
              icon={<ClearOutlined />} 
              onClick={handleClearFilters}
              disabled={!searchText && !dealerFilter && !dateRange}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredEntries}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1600 }}
        className="shadow-sm rounded-lg overflow-hidden"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} entries`,
        }}
      />

      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-800 flex items-center gap-2">
          <FilterOutlined /> 📌 Information
        </h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
          <li>These entries are waiting for stock to become available</li>
          <li>No production plans exist for these products currently</li>
          <li>Click "Process" when stock is available to move to entry_master</li>
          <li>System will automatically check stock availability before processing</li>
        </ul>
      </div>
    </div>
  );
};

export default PendingEntriesView;
