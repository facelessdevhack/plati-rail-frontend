import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, message, Space, Modal, Form, InputNumber, Radio, Checkbox, Popconfirm } from 'antd';
import { DollarOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { getPricingPendingEntriesAPI, addPricingToEntryAPI, deletePricingPendingEntryAPI } from '../../redux/api/entriesAPI';
import { useDispatch } from 'react-redux';
import moment from 'moment';

const PricingEntriesView = () => {
  const dispatch = useDispatch();
  const [pricingEntries, setPricingEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pricingModalVisible, setPricingModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPricingEntries();
  }, []);

  const fetchPricingEntries = async () => {
    setLoading(true);
    try {
      const response = await dispatch(getPricingPendingEntriesAPI()).unwrap();
      setPricingEntries(response.pricingEntries || []);
    } catch (error) {
      console.error('Error fetching pricing entries:', error);
      message.error('Failed to load pricing entries');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPricingModal = (entry) => {
    setSelectedEntry(entry);
    setPricingModalVisible(true);
    form.resetFields();
  };

  const handleClosePricingModal = () => {
    setPricingModalVisible(false);
    setSelectedEntry(null);
    form.resetFields();
  };

  const handleSubmitPricing = async (values) => {
    if (!selectedEntry) return;

    setSubmitting(true);
    try {
      const response = await addPricingToEntryAPI({
        pricingEntryId: selectedEntry.id,
        price: values.price,
        transportationCharges: values.transportationCharges || 0,
        transportationType: values.transportationType || 0,
        isClaim: values.isClaim ? 1 : 0,
        isRepair: values.isRepair ? 1 : 0
      });

      if (response.status === 200) {
        message.success('Pricing added successfully! Entry moved to entry_master.');
        handleClosePricingModal();
        fetchPricingEntries(); // Refresh the list
      } else {
        message.error(response.data?.message || 'Failed to add pricing');
      }
    } catch (error) {
      console.error('Error adding pricing:', error);
      message.error('Error adding pricing to entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (entry) => {
    try {
      const response = await deletePricingPendingEntryAPI(entry.id);

      if (response.status === 200) {
        message.success(
          `Entry deleted successfully! Stock restored: ${response.data.restoredQuantity} units`
        );
        fetchPricingEntries(); // Refresh the list
      } else {
        message.error(response.data?.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting pricing entry:', error);
      message.error('Error deleting pricing entry');
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
      title: 'Status',
      dataIndex: 'pricingStatus',
      key: 'pricingStatus',
      width: 150,
      render: (status) => (
        <Tag icon={<DollarOutlined />} color="warning">
          {status === 'awaiting_pricing' ? 'Awaiting Pricing' : status}
        </Tag>
      ),
    },
    {
      title: 'Approved By',
      dataIndex: 'approvedBy',
      key: 'approvedBy',
      width: 120,
      align: 'center',
    },
    {
      title: 'Approved At',
      dataIndex: 'approvedAt',
      key: 'approvedAt',
      width: 150,
      render: (date) => date ? moment(date).format('DD MMM HH:mm') : '-',
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
            icon={<DollarOutlined />}
            onClick={() => handleOpenPricingModal(record)}
          >
            Add Pricing
          </Button>
          <Popconfirm
            title="Delete Entry"
            description="Are you sure you want to delete this entry? Stock will be restored."
            onConfirm={() => handleDeleteEntry(record)}
            okText="Yes, Delete"
            cancelText="Cancel"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">💰 Pricing Entries</h2>
          <p className="text-gray-600 mt-1">
            Approved dispatch entries awaiting price entry
          </p>
        </div>
        <Space>
          <Button onClick={fetchPricingEntries} loading={loading}>
            Refresh
          </Button>
          <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px' }}>
            {pricingEntries.length} Awaiting Pricing
          </Tag>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={pricingEntries}
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
          <li>These entries have been approved by sales coordinator</li>
          <li>Stock has already been reserved for these entries</li>
          <li>Add price and transportation charges to finalize the entry</li>
          <li>Once priced, the entry will be moved to entry_master and dealer balance updated</li>
        </ul>
      </div>

      {/* Pricing Modal */}
      <Modal
        title="Add Pricing"
        open={pricingModalVisible}
        onCancel={handleClosePricingModal}
        footer={null}
        width={500}
      >
        {selectedEntry && (
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Entry Details</h4>
            <p><strong>Dealer:</strong> {selectedEntry.dealerName}</p>
            <p><strong>Product:</strong> {selectedEntry.productName}</p>
            <p><strong>Quantity:</strong> {selectedEntry.quantity}</p>
            <p><strong>Date:</strong> {moment(selectedEntry.date).format('DD MMM YYYY HH:mm')}</p>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitPricing}
        >
          <Form.Item
            label="Price (₹)"
            name="price"
            rules={[
              { required: true, message: 'Please enter the price' },
              { type: 'number', min: 0, message: 'Price must be positive' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter price"
              min={0}
              precision={0}
            />
          </Form.Item>

          <Form.Item
            label="Transportation Charges (₹)"
            name="transportationCharges"
            initialValue={0}
            rules={[
              { type: 'number', min: 0, message: 'Charges must be positive' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter transportation charges"
              min={0}
              precision={0}
            />
          </Form.Item>

          <Form.Item
            label="Transportation Type"
            name="transportationType"
            initialValue={0}
          >
            <Radio.Group>
              <Radio value={0}>None</Radio>
              <Radio value={1}>Transport</Radio>
              <Radio value={2}>Bus</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="isClaim" valuePropName="checked" initialValue={false}>
            <Checkbox>Is Claim</Checkbox>
          </Form.Item>

          <Form.Item name="isRepair" valuePropName="checked" initialValue={false}>
            <Checkbox>Is Repair</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={handleClosePricingModal}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CheckCircleOutlined />}
                loading={submitting}
              >
                Submit Pricing
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PricingEntriesView;
