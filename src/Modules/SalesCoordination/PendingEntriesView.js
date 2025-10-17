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
      setPendingEntries(response.pendingEntries || []);
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
      render: (date) => moment(date).format('DD MMM YYYY HH:mm'),
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
      title: 'Action',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={processingId === record.id}
            onClick={() => handleProcessEntry(record.id)}
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
      ),
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
        scroll={{ x: 1400 }}
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
