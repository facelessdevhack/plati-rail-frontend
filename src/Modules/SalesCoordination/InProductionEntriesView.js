import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, message, Space, Progress, Tooltip } from 'antd';
import { SyncOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getInProductionEntriesAPI, moveInProdToMasterAPI } from '../../redux/api/entriesAPI';
import { useDispatch } from 'react-redux';
import moment from 'moment';

const InProductionEntriesView = () => {
  const dispatch = useDispatch();
  const [inProdEntries, setInProdEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

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

  const calculateProgress = (record) => {
    if (!record.totalProductionQuantity || record.totalProductionQuantity === 0) return 0;
    const allocated = Number(record.totalAllocatedToProduct) || 0;
    const total = Number(record.totalProductionQuantity) || 0;
    return Math.min(100, Math.round((allocated / total) * 100));
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
      title: 'Action',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title={record.planCompleted ? 'Process this entry' : 'Production plan not yet completed'}>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={processingId === record.id}
            onClick={() => handleProcessEntry(record.id)}
            disabled={!record.planCompleted}
          >
            Process
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">🔄 In-Production Entries</h2>
          <p className="text-gray-600 mt-1">
            Entries linked to active production plans
          </p>
        </div>
        <Space>
          <Button onClick={fetchInProdEntries} loading={loading}>
            Refresh
          </Button>
          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
            {inProdEntries.length} In Production
          </Tag>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={inProdEntries}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1800 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} entries`,
        }}
      />

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">📌 Information</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>These entries are linked to active production plans</li>
          <li>Production status shows total allocated quantity vs available quantity</li>
          <li>Process button becomes active when production plan is completed</li>
          <li>System verifies stock availability before processing</li>
          <li>Multiple entries may be linked to the same production plan</li>
        </ul>
      </div>
    </div>
  );
};

export default InProductionEntriesView;
