import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Tag, message, Space, Progress, Tooltip, Popconfirm, Input, Select, DatePicker, Card, Dropdown } from 'antd';
import { 
  SyncOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined, 
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
import { getInProductionEntriesAPI, moveInProdToMasterAPI, deleteInProductionEntryAPI } from '../../redux/api/entriesAPI';
import { useDispatch } from 'react-redux';
import moment from 'moment';
import * as XLSX from 'xlsx';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const InProductionEntriesView = () => {
  const dispatch = useDispatch();
  const [inProdEntries, setInProdEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [dealerFilter, setDealerFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchInProdEntries();
  }, []);

  const fetchInProdEntries = async () => {
    setLoading(true);
    try {
      const response = await dispatch(getInProductionEntriesAPI()).unwrap();
      setInProdEntries(response.inProdEntries || []);
    } catch (error) {
      console.error('Error fetching in-production entries:', error);
      message.error('Failed to load in-production entries');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessEntry = async (entryId) => {
    setProcessingId(entryId);
    try {
      const response = await moveInProdToMasterAPI({ inProdEntryId: entryId });
      if (response.status === 200) {
        message.success('Entry processed successfully! Production completed and stock allocated.');
        fetchInProdEntries(); // Refresh the list
      } else {
        message.error(response.data?.message || 'Failed to process entry');
      }
    } catch (error) {
      console.error('Error processing entry:', error);
      message.error('Production not completed or insufficient stock');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    setDeletingId(entryId);
    try {
      const response = await deleteInProductionEntryAPI({ inProdEntryId: entryId });
      if (response.status === 200) {
        message.success('Entry deleted successfully! Production plan quantity restored.');
        fetchInProdEntries(); // Refresh the list
      } else {
        message.error(response.data?.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      message.error('Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  const calculateProgress = (record) => {
    if (!record.totalProductionQuantity || record.totalProductionQuantity === 0) return 0;
    const allocated = Number(record.totalAllocatedToProduct) || 0;
    const total = Number(record.totalProductionQuantity) || 0;
    return Math.min(100, Math.round((allocated / total) * 100));
  };

  // Extract unique dealers for the filter
  const uniqueDealers = useMemo(() => {
    const dealers = inProdEntries.map(entry => entry.dealerName).filter(Boolean);
    return [...new Set(dealers)].sort();
  }, [inProdEntries]);

  // Filtering logic
  const filteredEntries = useMemo(() => {
    return inProdEntries.filter(entry => {
      // Search text filter
      const matchesSearch = !searchText || 
        (entry.dealerName?.toLowerCase().includes(searchText.toLowerCase())) ||
        (entry.productName?.toLowerCase().includes(searchText.toLowerCase())) ||
        (entry.id?.toString().includes(searchText)) ||
        (entry.productionPlanId?.toString().includes(searchText));

      // Dealer filter
      const matchesDealer = !dealerFilter || entry.dealerName === dealerFilter;

      // Date range filter
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const entryDate = entry.dateIST ? moment(entry.dateIST) : moment.utc(entry.date || entry.created_at).utcOffset('+05:30');
        const startDate = moment(dateRange[0].valueOf()).startOf('day');
        const endDate = moment(dateRange[1].valueOf()).endOf('day');
        matchesDate = entryDate.isSameOrAfter(startDate) && entryDate.isSameOrBefore(endDate);
      }

      return matchesSearch && matchesDealer && matchesDate;
    });
  }, [inProdEntries, searchText, dealerFilter, dateRange]);

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
      const excelData = filteredEntries.map((entry, index) => {
        const progress = calculateProgress(entry);
        return {
          'S.No': index + 1,
          'Entry ID': entry.id,
          'Date': entry.dateIST ? moment(entry.dateIST).format('DD MMM YYYY hh:mm A') : (entry.date ? moment.utc(entry.date).utcOffset('+05:30').format('DD MMM YYYY hh:mm A') : 'N/A'),
          'Dealer': entry.dealerName || 'N/A',
          'Product': entry.productName || 'N/A',
          'Quantity': entry.quantity || 0,
          'Price': entry.isClaim ? 'Claim' : `₹${entry.price || 0}`,
          'Production Plan': `Plan #${entry.productionPlanId}`,
          'Production Progress': `${progress}%`,
          'Allocated': entry.totalAllocatedToProduct || 0,
          'Total Goal': entry.totalProductionQuantity || 0,
          'In-House Stock': entry.inHouseStock || 0,
          'Plan Status': entry.planCompleted ? 'Completed' : 'In Progress'
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'In Production Entries');
      XLSX.writeFile(wb, `In_Production_Entries_${moment().format('DD-MM-YYYY_HHmm')}.xlsx`);
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
              body { font-family: Arial, sans-serif; font-size: 13px; padding: 20px; }
              h1 { text-align: center; color: #333; margin-bottom: 25px; }
              .dealer-section { margin-bottom: 25px; page-break-inside: avoid; }
              .dealer-header { background: #f0f2f5; padding: 8px 12px; font-weight: bold; border: 1px solid #d9d9d9; margin-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 5px; }
              th, td { border: 1px solid #d9d9d9; padding: 6px; text-align: left; vertical-align: middle; }
              th { background: #fafafa; font-weight: bold; font-size: 12px; }
              .text-center { text-align: center; }
              .progress-bar { background: #f5f5f5; border-radius: 2px; width: 60px; height: 8px; display: inline-block; margin-right: 5px; }
              .progress-fill { height: 100%; background: #1890ff; border-radius: 2px; }
              .progress-fill.success { background: #52c41a; }
              @media print {
                @page { margin: 10mm; }
              }
            </style>
          </head>
          <body>
            <h1>In-Production Entries Report - ${moment().format('DD MMM YYYY')}</h1>
      `;

      Object.entries(groupedByDealer).forEach(([dealer, entries]) => {
        htmlContent += `
          <div class="dealer-section">
            <div class="dealer-header">${dealer}</div>
            <table>
              <thead>
                <tr>
                  <th width="12%">Date</th>
                  <th width="33%">Product</th>
                  <th width="8%" class="text-center">Qty</th>
                  <th width="15%">Plan</th>
                  <th width="20%">Production Progress</th>
                  <th width="12%">Stock Status</th>
                </tr>
              </thead>
              <tbody>
        `;

        entries.forEach(entry => {
          const date = entry.dateIST ? moment(entry.dateIST).format('DD MMM') : (entry.date ? moment.utc(entry.date).utcOffset('+05:30').format('DD MMM') : 'N/A');
          const progress = calculateProgress(entry);
          const hasStock = (entry.inHouseStock || 0) >= (entry.quantity || 0);
          
          htmlContent += `
            <tr>
              <td>${date}</td>
              <td>${entry.productName || 'N/A'}</td>
              <td class="text-center">${entry.quantity || 0}</td>
              <td>Plan #${entry.productionPlanId}<br/><small style="color: #8c8c8c">${entry.planCompleted ? 'Completed' : 'In Progress'}</small></td>
              <td>
                <div class="progress-bar"><div class="progress-fill ${progress >= 100 ? 'success' : ''}" style="width: ${progress}%"></div></div>
                <small>${progress}% (${entry.totalAllocatedToProduct || 0}/${entry.totalProductionQuantity || 0})</small>
              </td>
              <td>
                <span style="color: ${hasStock ? '#52c41a' : '#faad14'}">${hasStock ? 'Available' : 'Pending'}</span><br/>
                <small>Stock: ${entry.inHouseStock || 0}</small>
              </td>
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
        const istDate = record.dateIST ? moment(record.dateIST) : moment.utc(date || record.created_at)
        return istDate.format('DD MMM YYYY HH:mm')
      },
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
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price, record) => (
        record.isClaim ? <Tag color="orange">Claim</Tag> : `₹${price}`
      ),
    },
    {
      title: 'Production Plan',
      dataIndex: 'productionPlanId',
      key: 'productionPlanId',
      width: 120,
      render: (planId) => (
        <Tag color="blue">Plan #{planId}</Tag>
      ),
    },
    {
      title: (
        <span>
          Production Status{' '}
          <Tooltip title="Shows allocated quantity vs total production quantity">
            <InfoCircleOutlined />
          </Tooltip>
        </span>
      ),
      key: 'productionStatus',
      width: 250,
      render: (_, record) => {
        const progress = calculateProgress(record);
        const allocated = Number(record.totalAllocatedToProduct) || 0;
        const total = Number(record.totalProductionQuantity) || 0;

        return (
          <div>
            <div className="mb-1 text-xs text-gray-600">
              {allocated} / {total} allocated
            </div>
            <Progress
              percent={progress}
              size="small"
              status={progress >= 100 ? 'success' : 'active'}
            />
          </div>
        );
      },
    },
    {
      title: 'Plan Status',
      dataIndex: 'planCompleted',
      key: 'planCompleted',
      width: 120,
      render: (isCompleted) => (
        <Tag color={isCompleted ? 'success' : 'processing'}>
          {isCompleted ? 'Completed' : 'In Progress'}
        </Tag>
      ),
    },
    {
      title: 'Stock Status',
      key: 'stockStatus',
      width: 150,
      render: (_, record) => {
        const inHouseStock = Number(record.inHouseStock) || 0;
        const requiredQty = Number(record.quantity) || 0;
        const hasStock = inHouseStock >= requiredQty;

        return (
          <div>
            <Tag color={hasStock ? 'success' : 'warning'}>
              {hasStock ? '✓ Stock Available' : '⚠ Insufficient'}
            </Tag>
            <div className="text-xs text-gray-600 mt-1">
              Available: {inHouseStock}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const inHouseStock = Number(record.inHouseStock) || 0;
        const requiredQty = Number(record.quantity) || 0;
        const hasStock = inHouseStock >= requiredQty;

        return (
          <Space>
            <Tooltip title={hasStock ? 'Process this entry' : `Insufficient stock. Available: ${inHouseStock}, Required: ${requiredQty}`}>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={processingId === record.id}
                onClick={() => handleProcessEntry(record.id)}
                disabled={!hasStock}
              >
                Process
              </Button>
            </Tooltip>
            <Popconfirm
              title="Are you sure you want to delete this entry?"
              description="This will restore the production plan quantity and remove the entry."
              onConfirm={() => handleDeleteEntry(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete this entry">
                <Button
                  type="danger"
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={deletingId === record.id}
                >
                  Delete
                </Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔄 In-Production Entries</h2>
          <p className="text-gray-600 mt-1">
            Entries linked to active production plans
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
            onClick={fetchInProdEntries} 
            loading={loading}
          >
            Refresh
          </Button>
          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}>
            {filteredEntries.length} / {inProdEntries.length} Shown
          </Tag>
        </Space>
      </div>

      {/* Filter Card */}
      <Card className="mb-6 shadow-sm border-gray-200" bodyStyle={{ padding: '16px' }}>
        <div className="flex flex-wrap gap-4 items-center">
          <div style={{ flex: '1 1 300px' }}>
            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search</span>
            <Search
              placeholder="Search Dealer, Product, ID or Plan..."
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
        scroll={{ x: 1950 }}
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
          <li>These entries are linked to active production plans</li>
          <li>Production status shows total allocated quantity vs available quantity</li>
          <li>Process button becomes active when in-house stock is sufficient</li>
          <li>Stock Status column shows real-time in-house stock availability</li>
          <li>System verifies stock availability before processing</li>
          <li>Multiple entries may be linked to the same production plan</li>
        </ul>
      </div>
    </div>
  );
};

export default InProductionEntriesView;
