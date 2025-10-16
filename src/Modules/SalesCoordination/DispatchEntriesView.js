import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, message, Space } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getDispatchEntriesAPI, processDispatchEntryAPI } from '../../redux/api/entriesAPI';
import { useDispatch } from 'react-redux';
import moment from 'moment';

const DispatchEntriesView = () => {
  const dispatch = useDispatch();
  const [dispatchEntries, setDispatchEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchDispatchEntries();
  }, []);

  const fetchDispatchEntries = async () => {
    setLoading(true);
    try {
      const response = await dispatch(getDispatchEntriesAPI()).unwrap();
      setDispatchEntries(response.dispatchEntries || []);
    } catch (error) {
      console.error('Error fetching dispatch entries:', error);
      message.error('Failed to load dispatch entries');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessEntry = async (entryId) => {
    setProcessingId(entryId);
    try {
      const response = await processDispatchEntryAPI({ dispatchEntryId: entryId });
      if (response.status === 200) {
        message.success('Entry dispatched successfully!');
        fetchDispatchEntries(); // Refresh the list
      } else {
        message.error(response.data?.message || 'Failed to process entry');
      }
    } catch (error) {
      console.error('Error processing dispatch entry:', error);
      message.error('Error processing dispatch entry');
    } finally {
      setProcessingId(null);
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
      title: 'In-House Stock',
      dataIndex: 'inHouseStock',
      key: 'inHouseStock',
      width: 130,
      align: 'center',
      render: (stock) => {
        const stockNum = stock || 0;
        return (
          <Tag color={stockNum >= 0 ? 'green' : 'red'}>
            {stockNum} units
          </Tag>
        );
      },
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
      title: 'Status',
      dataIndex: 'dispatchStatus',
      key: 'dispatchStatus',
      width: 150,
      render: (status) => (
        <Tag icon={<ClockCircleOutlined />} color="processing">
          {status === 'awaiting_approval' ? 'Awaiting Approval' : status}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => date ? moment(date).format('DD MMM HH:mm') : '-',
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          loading={processingId === record.id}
          onClick={() => handleProcessEntry(record.id)}
        >
          Dispatch
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">📦 Dispatch Entries</h2>
          <p className="text-gray-600 mt-1">
            Entries with stock available, awaiting sales coordinator approval
          </p>
        </div>
        <Space>
          <Button onClick={fetchDispatchEntries} loading={loading}>
            Refresh
          </Button>
          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
            {dispatchEntries.length} Awaiting
          </Tag>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={dispatchEntries}
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
          <li>These entries have stock available and are awaiting your approval</li>
          <li>Stock has already been reserved for these entries</li>
          <li>Click "Dispatch" to approve and move the entry to entry_master</li>
          <li>Once dispatched, the entry will be finalized in the system</li>
        </ul>
      </div>
    </div>
  );
};

export default DispatchEntriesView;
