import React from 'react';
import CustomSelect from '../../Core/Components/CustomSelect';
import CustomInput from '../../Core/Components/CustomInput';
import { useDispatch, useSelector } from 'react-redux';
import { getDealersDropdown, getAllProducts } from '../../redux/api/stockAPI';
import Button from '../../Core/Components/CustomButton';
import {
  setEntry,
  resetEntry,
  addEntry,
  setEditing,
} from '../../redux/slices/entry.slice';
import { addCoordinatedEntryAPI, getAllCoordinationEntriesAPI, deletePendingEntryAPI, deleteDispatchEntryAPI, getPendingEntriesAPI } from '../../redux/api/entriesAPI';
import moment from 'moment';
import { Table, Tag, Space, message, Popconfirm, Checkbox, Button as AntButton } from 'antd';
import { EditOutlined, DeleteOutlined, ExportOutlined } from '@ant-design/icons';

const CreateOrderAlloys = () => {
  const dispatch = useDispatch();
  const { entry } = useSelector((state) => state.entryDetails);
  const [reloadAPI, setReloadAPI] = React.useState(false);
  const [coordinationEntries, setCoordinationEntries] = React.useState([]);
  const [pendingEntries, setPendingEntries] = React.useState([]);
  const [deletingId, setDeletingId] = React.useState(null);
  const { dealersDropdown, allProducts } = useSelector((state) => state.stockDetails);

  // Combine coordination and pending entries, filter for today only
  const allEntries = React.useMemo(() => {
    const today = moment().format('YYYY-MM-DD');
    const combined = [...coordinationEntries, ...pendingEntries];

    // Filter for today's entries only
    return combined.filter(entry => {
      const entryDate = moment(entry.date);
      return entryDate.format('YYYY-MM-DD') === today;
    });
  }, [coordinationEntries, pendingEntries]);

  const getAndSetTodayDate = () => {
    const dateToSet = moment().format('YYYY-MM-DD HH:mm:ss');
    dispatch(setEntry({ ...entry, date: dateToSet }));
  };

  const fetchCoordinationEntries = async () => {
    try {
      const response = await dispatch(getAllCoordinationEntriesAPI()).unwrap();
      // Filter for alloys (product_type === 1)
      const alloyEntries = response.entries?.filter(entry => entry.productType === 1) || [];
      setCoordinationEntries(alloyEntries);
    } catch (error) {
      console.error('Error fetching coordination entries:', error);
      message.error('Failed to load today\'s orders');
    }
  };

  const fetchPendingEntries = async () => {
    try {
      const response = await dispatch(getPendingEntriesAPI()).unwrap();
      // Filter for alloys (product_type === 1)
      const alloyPendingEntries = response.pendingEntries?.filter(entry => entry.productType === 1) || [];
      setPendingEntries(alloyPendingEntries);
    } catch (error) {
      console.error('Error fetching pending entries:', error);
      message.error('Failed to load pending orders');
    }
  };

  React.useEffect(() => {
    dispatch(getDealersDropdown({}));
    dispatch(getAllProducts({ type: 1 }));
    fetchCoordinationEntries();
    fetchPendingEntries();
    getAndSetTodayDate();
  }, [dispatch]);

  React.useEffect(() => {
    fetchCoordinationEntries();
    fetchPendingEntries();
  }, [reloadAPI]);

  const handleCreateOrder = async () => {
    if (!entry.dealerId || !entry.dealerName) {
      message.error('Please select a dealer before submitting.');
      return;
    }

    if (!entry.productId || !entry.productName) {
      message.error('Please select a product before submitting.');
      return;
    }

    if (!entry.quantity) {
      message.error('Please enter a quantity before submitting.');
      return;
    }

    try {
      const addEntryResponse = await addCoordinatedEntryAPI({ ...entry });
      if (addEntryResponse.status === 200) {
        console.log(addEntryResponse, 'addEntryResponse');
        const responseData = addEntryResponse.data;

        // Show routing information to user
        if (responseData.routedTo === 'dispatch_entries') {
          message.success('✅ Order created successfully! Stock available. Sent to dispatch queue.');
        } else if (responseData.routedTo === 'currently_inprod_master') {
          message.info('🔄 Order created! Product is currently in production.');
        } else if (responseData.routedTo === 'pending_entry_master') {
          message.warning('⏳ Order pending. Product is out of stock and not in production.');
        } else {
          message.success('Order created successfully!');
        }

        dispatch(resetEntry());
        getAndSetTodayDate();
        setReloadAPI(!reloadAPI);
      }
    } catch (error) {
      console.log(error, 'error');
      message.error('Error creating order. Please try again.');
    }
  };

  const handleDeleteEntry = async (record) => {
    setDeletingId(record.id);

    try {
      let response;

      // Determine entry type and call appropriate delete API
      if (record.entryStatus === 'pending') {
        response = await deletePendingEntryAPI({ pendingEntryId: record.id });
      } else if (record.entryStatus === 'dispatch') {
        response = await deleteDispatchEntryAPI({ dispatchEntryId: record.id });
      } else if (record.entryStatus === 'in_production') {
        // For in-production entries, we need to check if there's a delete endpoint
        // For now, let's show an appropriate message
        message.warning('Cannot delete entries that are in production. Please contact the production team.');
        setDeletingId(null);
        return;
      } else {
        message.error('Unknown entry type. Cannot delete.');
        setDeletingId(null);
        return;
      }

      if (response.status === 200) {
        message.success('Entry deleted successfully!');
        setReloadAPI(!reloadAPI); // Refresh the list
      } else {
        message.error(response.data?.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      message.error(error.response?.data?.message || 'Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportTodayOrders = () => {
    if (allEntries.length === 0) {
      message.warning('No orders to export');
      return;
    }

    exportToPDF(allEntries, `Today's Alloy Orders - ${moment().format('DD MMM YYYY')}`);
  };

  const exportToPDF = (entries, reportTitle) => {
    try {
      // Sort entries by date/time (newest first)
      const sortedEntries = [...entries].sort((a, b) => {
        return moment(b.date).valueOf() - moment(a.date).valueOf();
      });

      // Create HTML content for PDF with proper tables
      let htmlContent = `
        <html>
          <head>
            <title>${reportTitle} - ${moment().format('DD MMM YYYY')}</title>
            <style>
              @page {
                size: A4;
                margin: 10mm;
                orientation: portrait;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 26px;
                margin: 0;
                padding: 8px;
                color: #000;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
              }
              h1 {
                text-align: center;
                margin-bottom: 12px;
                font-size: 26px;
                color: #333;
                font-weight: bold;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 12px;
                font-size: 18px;
                table-layout: fixed;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 4px 6px;
                text-align: left;
                word-wrap: break-word;
              }
              th {
                background-color: #f8f9fa;
                font-weight: bold;
                color: #333;
                font-size: 16px;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .date-col {
                width: 15%;
              }
              .dealer-col {
                width: 20%;
                font-weight: bold;
              }
              .product-col {
                width: 30%;
              }
              .quantity-col {
                width: 12%;
                text-align: center;
                font-weight: bold;
              }
              .status-col {
                width: 13%;
                text-align: center;
              }
              .transport-col {
                width: 10%;
                text-align: center;
                font-weight: bold;
              }
              .no-entries {
                text-align: center;
                font-style: italic;
                color: #666;
                padding: 5px;
              }
              @media print {
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                body {
                  font-size: 16px !important;
                  line-height: 1.4 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                h1 {
                  font-size: 21px !important;
                  margin-bottom: 10px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                th, td {
                  padding: 6px 8px !important;
                  font-size: 13px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                th {
                  font-size: 13px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            </style>
          </head>
          <body>
            <h1>${reportTitle} - ${moment().format('DD MMM YYYY')}</h1>
            <table>
              <thead>
                <tr>
                  <th class="date-col">Date</th>
                  <th class="dealer-col">Dealer</th>
                  <th class="product-col">Product</th>
                  <th class="quantity-col">Quantity</th>
                  <th class="status-col">Status</th>
                  <th class="transport-col">Transport</th>
                </tr>
              </thead>
              <tbody>
      `;

      if (sortedEntries.length === 0) {
        htmlContent += `
                <tr>
                  <td colspan="6" class="no-entries">No entries found</td>
                </tr>
        `;
      } else {
        sortedEntries.forEach(entry => {
          const formattedDate = entry.date
            ? moment(entry.date).format('DD MMM YYYY hh:mm A')
            : 'N/A';
          const dealer = entry.dealerName || 'N/A';
          const product = entry.productName || 'N/A';
          const quantity = entry.quantity || 0;
          const transportPaid = entry.isTransportPaid ? 'Paid' : 'To Pay';

          // Status label
          const statusConfig = {
            dispatch: 'Awaiting Dispatch',
            pending: 'Out of Stock',
            in_production: 'In Production',
          };
          const statusLabel = statusConfig[entry.entryStatus] || entry.statusLabel || 'Unknown';

          htmlContent += `
                <tr>
                  <td>${formattedDate}</td>
                  <td class="dealer-col">${dealer}</td>
                  <td>${product}</td>
                  <td>${quantity}</td>
                  <td>${statusLabel}</td>
                  <td style="color: ${
                    entry.isTransportPaid ? '#52c41a' : '#ff4d4f'
                  }; font-weight: bold;">${transportPaid}</td>
                </tr>
          `;
        });
      }

      htmlContent += `
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Create a temporary window to print the content
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      printWindow.document.write(htmlContent);
      printWindow.document.title = `${reportTitle} - ${moment().format('DD MMM YYYY')}`;
      printWindow.document.close();

      // Wait for the content to load, then trigger print
      printWindow.onload = () => {
        printWindow.print();
      };

      message.success(
        'PDF export dialog opened. Please choose "Save as PDF" in the print dialog.'
      );
    } catch (error) {
      console.error('Error exporting orders to PDF:', error);
      message.error('Failed to export orders to PDF');
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date) => moment(date).format('DD MMM YYYY hh:mm A'),
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
      title: 'Transport Paid',
      dataIndex: 'isTransportPaid',
      key: 'isTransportPaid',
      width: 120,
      align: 'center',
      render: (isTransportPaid) => {
        return (
          <Tag color={isTransportPaid ? 'green' : 'red'}>
            {isTransportPaid ? 'Yes' : 'No'}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'entryStatus',
      key: 'entryStatus',
      width: 150,
      render: (status, record) => {
        const statusConfig = {
          dispatch: { color: 'processing', label: record.statusLabel || 'Awaiting Dispatch' },
          pending: { color: 'warning', label: record.statusLabel || 'Out of Stock' },
          in_production: { color: 'cyan', label: record.statusLabel || 'In Production' },
        };
        const config = statusConfig[status] || { color: 'default', label: 'Unknown' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Delete this entry?"
            description="Are you sure you want to delete this entry? This action cannot be undone."
            onConfirm={() => handleDeleteEntry(record)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={deletingId === record.id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="grid h-[calc(100vh-135px)] grid-cols-6 gap-4 p-5">
      {/* Left Panel - Create Order Form */}
      <div className="h-full col-span-2 p-5 bg-white border-2 rounded-lg shadow-sm">
        <div className="pb-5 text-2xl font-bold text-center text-gray-800">
          Create Alloys Order
        </div>
        <div className="grid w-full grid-cols-1 gap-5">
          <div>
            <div className="mb-2 font-medium">Date & Time</div>
            <CustomInput
              type="datetime-local"
              value={entry?.date}
              onChange={(e) =>
                dispatch(
                  setEntry({
                    date: e.target.value,
                  })
                )
              }
            />
          </div>
          <div>
            <div className="mb-2 font-medium">Select Dealer</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={dealersDropdown || []}
              value={entry.dealerId}
              placeholder="Select a dealer"
              onChange={(e, l) => {
                dispatch(
                  setEntry({
                    dealerId: e,
                    dealerName: l ? l.label : null,
                  })
                );
              }}
            />
          </div>
          <div>
            <div className="mb-2 font-medium">Select Product</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={allProducts}
              value={entry.productId}
              placeholder="Select a product"
              onChange={(e, l) => {
                dispatch(
                  setEntry({
                    productId: e,
                    productName: l ? l.label : null,
                    productType: 1, // Alloys
                  })
                );
              }}
            />
          </div>
          <div>
            <div className="mb-2 font-medium">Quantity</div>
            <CustomInput
              type="number"
              value={entry.quantity}
              onChange={(e) =>
                dispatch(
                  setEntry({
                    quantity: +e.target.value,
                  })
                )
              }
              placeholder="Enter quantity"
            />
          </div>
          <div>
            <div className="mb-2 font-medium">Transport Paid</div>
            <Checkbox
              checked={entry.isTransportPaid || false}
              onChange={(e) =>
                dispatch(
                  setEntry({
                    isTransportPaid: e.target.checked,
                  })
                )
              }
            >
              Transport charges are paid
            </Checkbox>
          </div>
          <div className="flex gap-3 mt-5">
            <Button
              onClick={handleCreateOrder}
              className="w-full"
              type="primary"
            >
              Create Order
            </Button>
            <Button
              onClick={() => {
                dispatch(resetEntry());
                getAndSetTodayDate();
              }}
              className="w-full"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Today's Orders */}
      <div className="h-full col-span-4 p-5 overflow-auto bg-white border-2 rounded-lg shadow-sm">
        <div className="flex items-center justify-between pb-5">
          <div>
            <div className="text-2xl font-bold text-gray-800">
              Today's Orders
            </div>
            <div className="flex gap-2 mt-2">
              <Tag color="green">Total: {allEntries.length}</Tag>
            </div>
          </div>
          <Space>
            <AntButton
              type="primary"
              icon={<ExportOutlined />}
              onClick={handleExportTodayOrders}
              disabled={allEntries.length === 0}
            >
              Export Today
            </AntButton>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={allEntries}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders today`,
          }}
          scroll={{ y: 'calc(100vh - 300px)' }}
        />
      </div>
    </div>
  );
};

export default CreateOrderAlloys;
