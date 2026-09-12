import React, { useEffect, useRef, useState } from 'react'
import { Alert, Button, Descriptions, Form, Input, InputNumber, Modal, Select, Space } from 'antd'
import { createClaim, errorMessage, searchRegistrations } from './warrantyClaimsAPI'
import { formatDate } from './claimWorkflow'

export default function CreateClaimModal({ onClose, onCreated }) {
  const [form] = Form.useForm()
  const [search, setSearch] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [registration, setRegistration] = useState(null)
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(null)

  useEffect(() => {
    let active = true
    if (search.trim().length < 2) { setRegistrations([]); setSearching(false); return }
    setSearching(true)
    const timer = setTimeout(() => {
      searchRegistrations(search.trim()).then(rows => { if (active) setRegistrations(rows) })
        .catch(err => { if (active) setError(errorMessage(err)) })
        .finally(() => { if (active) setSearching(false) })
    }, 300)
    return () => { active = false; clearTimeout(timer) }
  }, [search])

  const submit = async values => {
    setError('')
    setSubmitting(true)
    try {
      const fingerprint = JSON.stringify(values)
      if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, id: window.crypto.randomUUID() }
      const result = await createClaim({ ...values, requestId: request.current.id })
      onCreated(result.claim)
    } catch (err) { setError(errorMessage(err)) }
    finally { setSubmitting(false) }
  }

  return <Modal title="New warranty claim" open width={720} onCancel={submitting ? undefined : onClose}
    maskClosable={!submitting} closable={!submitting} footer={null}>
    <p>Select the existing warranty registration, confirm the registered mobile, and describe the problem.</p>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Form form={form} layout="vertical" onFinish={submit} initialValues={{ quantity: 1, intakeChannel: 'dealer' }}>
      <Form.Item label="Warranty registration" name="registrationId" rules={[{ required: true, message: 'Select an existing warranty registration.' }]}>
        <Select showSearch filterOption={false} onSearch={setSearch} loading={searching}
          placeholder="Search warranty card, mobile, customer or dealer" notFoundContent={searching ? 'Searching…' : 'Type at least 2 characters'}
          options={registrations.map(row => ({ value: row.id, label: `${row.warrantyCardNo} · ${row.customerName} · ${row.dealerName}` }))}
          onChange={id => { setRegistration(registrations.find(row => row.id === id)); form.setFieldsValue({ registeredMobile: '', quantity: 1 }) }} />
      </Form.Item>
      {registration && <Descriptions size="small" bordered column={2} className="mb-4">
        <Descriptions.Item label="Customer">{registration.customerName}</Descriptions.Item>
        <Descriptions.Item label="Dealer">{registration.dealerName}</Descriptions.Item>
        <Descriptions.Item label="Product">{registration.productType}</Descriptions.Item>
        <Descriptions.Item label="Registered quantity">{String(registration.productType).toLowerCase().includes('alloy') ? registration.noOfAlloys : registration.noOfTyres}</Descriptions.Item>
        <Descriptions.Item label="Purchased">{formatDate(registration.dop)}</Descriptions.Item>
        <Descriptions.Item label="Vehicle">{registration.vehicleNo}</Descriptions.Item>
        <Descriptions.Item label="Specification" span={2}>{registration.productSpecification || '—'}</Descriptions.Item>
      </Descriptions>}
      <Form.Item label="Registered mobile number" name="registeredMobile" rules={[{ required: true, message: 'Confirm the mobile number registered on the warranty.' }]}>
        <Input autoComplete="off" maxLength={20} placeholder="Confirm the customer's registered mobile" />
      </Form.Item>
      <Space size="large" align="start" wrap>
        <Form.Item label="Claim quantity" name="quantity" rules={[{ required: true }]}><InputNumber min={1} max={100} precision={0} /></Form.Item>
        <Form.Item label="Incident date" name="incidentDate" rules={[{ required: true, message: 'Enter the incident date.' }]}><Input type="date" /></Form.Item>
        <Form.Item label="Received through" name="intakeChannel"><Select style={{ width: 155 }} options={['dealer', 'whatsapp', 'phone', 'email', 'other'].map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} /></Form.Item>
      </Space>
      <Form.Item label="Problem reported" name="issueDescription" rules={[{ required: true, min: 10, message: 'Describe the problem in at least 10 characters.' }]}>
        <Input.TextArea rows={4} maxLength={5000} showCount placeholder="Damage or fault, affected wheel/tyre, and what happened" />
      </Form.Item>
      <p className="text-gray-500 text-sm">After submission, add damaged-product and vehicle photos. The claim receives a reference number and a 48-hour decision target.</p>
      <Space className="w-full justify-end"><Button onClick={onClose} disabled={submitting}>Cancel</Button><Button type="primary" htmlType="submit" loading={submitting}>Submit claim</Button></Space>
    </Form>
  </Modal>
}
