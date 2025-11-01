import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, message, Space } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { getPendingEntriesAPI, movePendingToMasterAPI, deletePendingEntryAPI } from '../../redux/api/entriesAPI';
import { useDispatch } from 'react-redux';
import moment from 'moment';

const PendingEntriesView = () => {
  const dispatch = useDispatch();
  const [pendingEntries, setPendingEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
        const aDate = moment.utc(a.date || a.created_at || 0).utcOffset('+05:30');
        const bDate = moment.utc(b.date || b.created_at || 0).utcOffset('+05:30');
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
      render: date => {
        if (!date) return 'N/A'
        // Convert to Indian Standard Time (UTC+5:30)
        const istDate = moment.utc(date).utcOffset('+05:30')
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
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">⏳ Pending Entries</h2>
          <p className="text-gray-600 mt-1">
            Entries awaiting stock availability (not in production)
          </p>
        </div>
        <Space>
          <Button onClick={fetchPendingEntries} loading={loading}>
            Refresh
          </Button>
          <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px' }}>
            {pendingEntries.length} Pending
          </Tag>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={pendingEntries}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1600 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} entries`,
        }}
      />

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">📌 Information</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
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
