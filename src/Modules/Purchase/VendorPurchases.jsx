import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button, Card, Col, DatePicker, Divider, Form, Input, InputNumber, Modal,
  Popconfirm, Row, Select, Space, Table, Tag, Typography, message
} from 'antd'
import { DeleteOutlined, PlusOutlined, ReloadOutlined, UndoOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { client } from '../../Utils/axiosClient'
import PageTitle from '../../Core/Components/PageTitle'

const { Text } = Typography
const { RangePicker } = DatePicker

const inr = v => `₹${Number(v || 0).toLocaleString('en-IN')}`

// Purchases from any vendor: recording one adds the stock at invoice cost —
// each line becomes a FIFO cost layer (cost_source 'actual'), which then
// flows through production into sale costs and the P&L. Unit prices are
// entered EX-GST (the costing basis); GST and transport are kept on the
// document, and transport is spread per-unit into the cost.
const VendorPurchases = () => {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState([])
  const [products, setProducts] = useState([])
  const [filterVendor, setFilterVendor] = useState(null)
  const [filterRange, setFilterRange] = useState(null)
  const [detail, setDetail] = useState(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const [vendorOpen, setVendorOpen] = useState(false)
  const [vendorForm] = Form.useForm()

  const fetchVendors = useCallback(async () => {
    try {
      const res = await client.get('/vendor-orders/vendors')
      setVendors(res.data?.data || [])
    } catch (e) {
      message.error('Could not load vendors')
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await client.get('/master/all-products?type=1')
      setProducts(res.data || [])
    } catch (e) {
      message.error('Could not load products')
    }
  }, [])

  const fetchPurchases = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: pageSize })
      if (filterVendor) params.append('vendorId', filterVendor)
      if (filterRange?.[0]) params.append('startDate', filterRange[0].format('YYYY-MM-DD'))
      if (filterRange?.[1]) params.append('endDate', filterRange[1].format('YYYY-MM-DD'))
      const res = await client.get(`/vendor-purchases?${params.toString()}`)
      setRows(res.data?.data || [])
      const p = res.data?.pagination
      setPagination({ current: p?.currentPage || 1, pageSize: p?.pageSize || 20, total: p?.total || 0 })
    } catch (e) {
      message.error(e?.response?.data?.message || 'Could not load purchases')
    } finally {
      setLoading(false)
    }
  }, [filterVendor, filterRange])

  useEffect(() => { fetchVendors(); fetchProducts() }, [fetchVendors, fetchProducts])
  useEffect(() => { fetchPurchases(1, pagination.pageSize) }, [fetchPurchases]) // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = async id => {
    try {
      const res = await client.get(`/vendor-purchases/${id}`)
      setDetail(res.data?.data)
    } catch (e) {
      message.error('Could not load purchase details')
    }
  }

  const reversePurchase = async id => {
    try {
      await client.delete(`/vendor-purchases/${id}`)
      message.success('Purchase reversed — stock and cost layers removed')
      fetchPurchases(pagination.current, pagination.pageSize)
    } catch (e) {
      message.error(e?.response?.data?.message || 'Could not reverse purchase')
    }
  }

  const submitPurchase = async values => {
    setSaving(true)
    try {
      const payload = {
        vendorId: values.vendorId,
        invoiceNo: values.invoiceNo?.trim(),
        invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
        gstPercent: values.gstPercent ?? 18,
        transportTotal: values.transportTotal ?? 0,
        notes: values.notes,
        items: (values.items || []).map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        }))
      }
      const res = await client.post('/vendor-purchases', payload)
      message.success(res.data?.message || 'Purchase recorded')
      setCreateOpen(false)
      form.resetFields()
      fetchPurchases(1, pagination.pageSize)
    } catch (e) {
      message.error(e?.response?.data?.message || 'Could not record purchase')
    } finally {
      setSaving(false)
    }
  }

  const submitVendor = async values => {
    try {
      const res = await client.post('/vendor-orders/vendors', {
        vendor_name: values.vendorName,
        contact_person: values.contactPerson,
        phone: values.phone,
        email: values.email,
        address: values.address
      })
      message.success('Vendor added')
      setVendorOpen(false)
      vendorForm.resetFields()
      await fetchVendors()
      form.setFieldValue('vendorId', res.data?.data?.id)
    } catch (e) {
      message.error(e?.response?.data?.message || 'Could not add vendor')
    }
  }

  // live totals in the create modal
  const watchedItems = Form.useWatch('items', form) || []
  const watchedGst = Form.useWatch('gstPercent', form) ?? 18
  const watchedTransport = Form.useWatch('transportTotal', form) ?? 0
  const totals = useMemo(() => {
    const subtotal = watchedItems.reduce(
      (s, i) => s + (Number(i?.quantity) || 0) * (Number(i?.unitPrice) || 0), 0)
    const units = watchedItems.reduce((s, i) => s + (Number(i?.quantity) || 0), 0)
    const gst = subtotal * Number(watchedGst) / 100
    return { units, subtotal, gst, grand: subtotal + gst + Number(watchedTransport) }
  }, [watchedItems, watchedGst, watchedTransport])

  const columns = [
    {
      title: 'Invoice date',
      dataIndex: 'invoiceDate',
      render: v => dayjs(v).format('DD MMM YYYY'),
      width: 120
    },
    { title: 'Vendor', dataIndex: 'vendorName' },
    {
      title: 'Invoice no.',
      dataIndex: 'invoiceNo',
      render: (v, r) => <Button type='link' style={{ padding: 0 }} onClick={() => openDetail(r.id)}>{v}</Button>
    },
    { title: 'Items', dataIndex: 'itemCount', align: 'right', width: 70 },
    { title: 'Units', dataIndex: 'totalUnits', align: 'right', width: 80 },
    { title: 'Subtotal (ex-GST)', dataIndex: 'subtotal', align: 'right', render: inr },
    { title: 'GST', dataIndex: 'gstAmount', align: 'right', render: inr, width: 110 },
    { title: 'Transport', dataIndex: 'transportTotal', align: 'right', render: inr, width: 110 },
    { title: 'Total', dataIndex: 'grandTotal', align: 'right', render: v => <Text strong>{inr(v)}</Text> },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: v => <Tag color={v === 'received' ? 'green' : 'red'}>{v?.toUpperCase()}</Tag>
    },
    {
      title: '',
      width: 60,
      render: r => r.status === 'received' && (
        <Popconfirm
          title='Reverse this purchase?'
          description='Stock and cost layers are removed. Only possible while none of it is consumed.'
          onConfirm={() => reversePurchase(r.id)}
        >
          <Button size='small' danger icon={<UndoOutlined />} />
        </Popconfirm>
      )
    }
  ]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <PageTitle>Vendor Purchases</PageTitle>
        <Space>
          <Select
            allowClear
            showSearch
            placeholder='All vendors'
            style={{ width: 220 }}
            optionFilterProp='label'
            value={filterVendor}
            onChange={setFilterVendor}
            options={vendors.map(v => ({ value: v.id, label: v.vendorName }))}
          />
          <RangePicker value={filterRange} onChange={setFilterRange} format='DD MMM YYYY' />
          <Button icon={<ReloadOutlined />} onClick={() => fetchPurchases(1, pagination.pageSize)}>Refresh</Button>
          <Button type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>New Purchase</Button>
        </Space>
      </div>

      <Card size='small'>
        <Table
          rowKey='id'
          size='small'
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: t => `${t} purchases`,
            onChange: (page, pageSize) => fetchPurchases(page, pageSize)
          }}
        />
      </Card>

      {/* ── create ── */}
      <Modal
        title='New Vendor Purchase'
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText='Record purchase'
        confirmLoading={saving}
        width={900}
        destroyOnClose
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={submitPurchase}
          initialValues={{ gstPercent: 18, transportTotal: 0, invoiceDate: dayjs(), items: [{}] }}
        >
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name='vendorId' label='Vendor' rules={[{ required: true, message: 'Pick a vendor' }]}>
                <Select
                  showSearch
                  optionFilterProp='label'
                  placeholder='Select vendor'
                  options={vendors.map(v => ({ value: v.id, label: v.vendorName }))}
                  dropdownRender={menu => (
                    <>
                      {menu}
                      <Divider style={{ margin: '4px 0' }} />
                      <Button type='link' icon={<PlusOutlined />} onClick={() => setVendorOpen(true)}>
                        Add new vendor
                      </Button>
                    </>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='invoiceNo' label='Invoice no.' rules={[{ required: true, message: 'Invoice number' }]}>
                <Input placeholder='e.g. RM1106613483' />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name='invoiceDate' label='Invoice date' rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format='DD MMM YYYY' />
              </Form.Item>
            </Col>
            <Col span={2}>
              <Form.Item name='gstPercent' label='GST %'>
                <InputNumber min={0} max={28} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item name='transportTotal' label='Transport ₹'>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation='left' plain>Items — unit price EX-GST</Divider>
          <Form.List name='items'>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Row gutter={8} key={key} align='middle'>
                    <Col span={13}>
                      <Form.Item {...rest} name={[name, 'productId']} rules={[{ required: true, message: 'Product' }]}>
                        <Select
                          showSearch
                          optionFilterProp='label'
                          placeholder='Search alloy…'
                          options={products.map(p => ({ value: p.value, label: p.label }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item {...rest} name={[name, 'quantity']} rules={[{ required: true, message: 'Qty' }]}>
                        <InputNumber min={1} precision={0} placeholder='Qty' style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item {...rest} name={[name, 'unitPrice']} rules={[{ required: true, message: 'Rate' }]}>
                        <InputNumber min={0} placeholder='₹/unit ex-GST' style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      {fields.length > 1 && (
                        <Button type='text' danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                      )}
                    </Col>
                  </Row>
                ))}
                <Button type='dashed' block icon={<PlusOutlined />} onClick={() => add()}>Add item</Button>
              </>
            )}
          </Form.List>

          <Row justify='end' style={{ marginTop: 16 }}>
            <Space direction='vertical' align='end' size={2}>
              <Text type='secondary'>{totals.units} units · subtotal {inr(totals.subtotal)}</Text>
              <Text type='secondary'>GST {inr(totals.gst)} · transport {inr(watchedTransport)}</Text>
              <Text strong style={{ fontSize: 16 }}>Total {inr(totals.grand)}</Text>
            </Space>
          </Row>

          <Form.Item name='notes' label='Notes' style={{ marginTop: 8 }}>
            <Input.TextArea rows={2} placeholder='Optional' />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── add vendor ── */}
      <Modal
        title='Add Vendor'
        open={vendorOpen}
        onCancel={() => setVendorOpen(false)}
        onOk={() => vendorForm.submit()}
        okText='Add vendor'
        destroyOnClose
      >
        <Form form={vendorForm} layout='vertical' onFinish={submitVendor}>
          <Form.Item name='vendorName' label='Vendor name' rules={[{ required: true }]}>
            <Input placeholder='e.g. Rockman Industries Ltd.' />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name='contactPerson' label='Contact person'><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='phone' label='Phone'><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item name='email' label='Email'><Input /></Form.Item>
          <Form.Item name='address' label='Address'><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* ── detail ── */}
      <Modal
        title={detail ? `${detail.vendorName} — ${detail.invoiceNo}` : ''}
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={760}
      >
        {detail && (
          <>
            <Space split={<Divider type='vertical' />} style={{ marginBottom: 12 }}>
              <Text>{dayjs(detail.invoiceDate).format('DD MMM YYYY')}</Text>
              <Text>GST {Number(detail.gstPercent)}%</Text>
              <Text>Transport {inr(detail.transportTotal)}</Text>
              <Tag color={detail.status === 'received' ? 'green' : 'red'}>{detail.status?.toUpperCase()}</Tag>
            </Space>
            <Table
              rowKey='id'
              size='small'
              pagination={false}
              dataSource={detail.items}
              columns={[
                { title: 'Product', dataIndex: 'productName' },
                { title: 'Qty', dataIndex: 'quantity', align: 'right', width: 80 },
                { title: 'Rate (ex-GST)', dataIndex: 'unitPrice', align: 'right', render: inr, width: 130 },
                { title: 'Line total', dataIndex: 'lineTotal', align: 'right', render: inr, width: 130 }
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell><Text strong>Total (incl. GST + transport)</Text></Table.Summary.Cell>
                  <Table.Summary.Cell colSpan={3} align='right'>
                    <Text strong>{inr(detail.grandTotal)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
            {detail.notes && <Text type='secondary'>Note: {detail.notes}</Text>}
          </>
        )}
      </Modal>
    </div>
  )
}

export default VendorPurchases
