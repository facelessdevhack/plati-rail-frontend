import React, { useEffect, useState, useMemo } from 'react'
import { message, Modal, Form, InputNumber, Radio, Checkbox, Space, Button as AntButton } from 'antd'
import { DollarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { getPricingPendingEntriesAPI, addPricingToEntryAPI, deletePricingPendingEntryAPI } from '../../redux/api/entriesAPI'
import { useDispatch } from 'react-redux'
import moment from 'moment'

import PageTitle from '../../Core/Components/PageTitle'
import DataTable from '../../Core/Components/DataTable'
import StatusBadge from '../../Core/Components/StatusBadge'
import { ProcessButton, DeleteButton } from '../../Core/Components/ActionButton'
import InfoBox from '../../Core/Components/InfoBox'

const PricingEntriesView = () => {
  const dispatch = useDispatch()
  const [pricingEntries, setPricingEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [pricingModalVisible, setPricingModalVisible] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => { fetchPricingEntries() }, [])

  const fetchPricingEntries = async () => {
    setLoading(true)
    try {
      const response = await dispatch(getPricingPendingEntriesAPI()).unwrap()
      setPricingEntries(response.pricingEntries || [])
    } catch (error) {
      message.error('Failed to load pricing entries')
    } finally {
      setLoading(false)
    }
  }

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return pricingEntries.slice(start, start + pageSize)
  }, [pricingEntries, currentPage, pageSize])

  const handleOpenPricingModal = (entry) => {
    setSelectedEntry(entry)
    setPricingModalVisible(true)
    form.resetFields()
  }

  const handleClosePricingModal = () => {
    setPricingModalVisible(false)
    setSelectedEntry(null)
    form.resetFields()
  }

  const handleSubmitPricing = async (values) => {
    if (!selectedEntry) return
    setSubmitting(true)
    try {
      const response = await addPricingToEntryAPI({
        pricingEntryId: selectedEntry.id,
        price: values.price,
        transportationCharges: values.transportationCharges || 0,
        transportationType: values.transportationType || 0,
        isClaim: values.isClaim ? 1 : 0,
        isRepair: values.isRepair ? 1 : 0,
      })
      if (response.status === 200) {
        message.success('Pricing added! Entry moved to entry_master.')
        handleClosePricingModal()
        fetchPricingEntries()
      } else {
        message.error(response.data?.message || 'Failed to add pricing')
      }
    } catch (error) {
      message.error('Error adding pricing to entry')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEntry = async (entry) => {
    try {
      const response = await deletePricingPendingEntryAPI(entry.id)
      if (response.status === 200) {
        message.success(`Entry deleted! Stock restored: ${response.data.restoredQuantity} units`)
        fetchPricingEntries()
      } else {
        message.error(response.data?.message || 'Failed to delete entry')
      }
    } catch (error) {
      message.error('Error deleting pricing entry')
    }
  }

  const columns = [
    {
      key: 'id', dataIndex: 'id', title: 'Entry ID',
      render: (val) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'date', dataIndex: 'date', title: 'Date & Time',
      render: (_, record) => {
        const date = moment(record.date)
        return (
          <div style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
            {date.format('DD MMM YYYY')}<br />
            <span style={{ color: '#9ca3af', fontSize: 12 }}>{date.format('hh:mm A')}</span>
          </div>
        )
      },
    },
    { key: 'dealer', dataIndex: 'dealerName', title: 'Dealers' },
    { key: 'product', dataIndex: 'productName', title: 'Product' },
    { key: 'quantity', dataIndex: 'quantity', title: 'Quantity', align: 'center' },
    {
      key: 'status', dataIndex: 'pricingStatus', title: 'Status', align: 'center',
      render: () => <StatusBadge variant="pending">Awaiting Pricing</StatusBadge>,
    },
    {
      key: 'approvedBy', dataIndex: 'approvedBy', title: 'Approved By', align: 'center',
      render: (val) => val || '-',
    },
    {
      key: 'actions', title: 'Actions', align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <button
            onClick={() => handleOpenPricingModal(record)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#4a90ff', border: 'none', borderRadius: 12,
              padding: 8, fontSize: 14, fontWeight: 400,
              fontFamily: "'Inter', sans-serif", color: 'white',
              cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: '20px',
            }}
          >
            <DollarOutlined /> Add Pricing
          </button>
          <DeleteButton
            onConfirm={() => handleDeleteEntry(record)}
            description="Stock will be restored."
          />
        </div>
      ),
    },
  ]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <PageTitle>Pricing Entries</PageTitle>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button
            onClick={fetchPricingEntries}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f3f3f5', border: 'none', borderRadius: 123,
              padding: '6px 16px', fontSize: 14, fontWeight: 400,
              fontFamily: "'Inter', sans-serif", color: '#1a1a1a',
              cursor: 'pointer', height: 32,
            }}
          >
            <span style={{ fontSize: 16 }}>↻</span> Refresh
          </button>
          <span style={{
            background: '#f7d6ca', color: '#1a1a1a',
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            fontSize: 12, fontWeight: 600,
            padding: '6px 12px', borderRadius: 1234,
            display: 'flex', alignItems: 'center', height: 32,
          }}>
            {pricingEntries.length} Awaiting Pricing
          </span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedEntries}
        rowKey="id"
        loading={loading}
        emptyText="No pricing entries found"
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={pricingEntries.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      />

      <InfoBox
        title="Information"
        items={[
          'These entries have been approved by sales coordinator',
          'Stock has already been reserved for these entries',
          'Add price and transportation charges to finalize the entry',
          'Once priced, the entry will be moved to entry_master and dealer balance updated',
        ]}
      />

      {/* Pricing Modal */}
      <Modal
        title="Add Pricing"
        open={pricingModalVisible}
        onCancel={handleClosePricingModal}
        footer={null}
        width={500}
      >
        {selectedEntry && (
          <div style={{ marginBottom: 16, padding: 16, background: '#f9fafb', borderRadius: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>Entry Details</div>
            <div style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#374151', lineHeight: 1.8 }}>
              <div><strong>Dealer:</strong> {selectedEntry.dealerName}</div>
              <div><strong>Product:</strong> {selectedEntry.productName}</div>
              <div><strong>Quantity:</strong> {selectedEntry.quantity}</div>
              <div><strong>Date:</strong> {moment(selectedEntry.date).format('DD MMM YYYY HH:mm')}</div>
            </div>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmitPricing}>
          <Form.Item
            label="Price (₹)" name="price"
            rules={[{ required: true, message: 'Please enter the price' }, { type: 'number', min: 0, message: 'Price must be positive' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Enter price" min={0} precision={0} />
          </Form.Item>

          <Form.Item
            label="Transportation Charges (₹)" name="transportationCharges" initialValue={0}
            rules={[{ type: 'number', min: 0, message: 'Charges must be positive' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Enter transportation charges" min={0} precision={0} />
          </Form.Item>

          <Form.Item label="Transportation Type" name="transportationType" initialValue={0}>
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
              <AntButton onClick={handleClosePricingModal}>Cancel</AntButton>
              <AntButton type="primary" htmlType="submit" icon={<CheckCircleOutlined />} loading={submitting}>
                Submit Pricing
              </AntButton>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PricingEntriesView
