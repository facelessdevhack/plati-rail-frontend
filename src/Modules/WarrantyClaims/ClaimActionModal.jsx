import React, { useState } from 'react'
import { Alert, Button, Checkbox, Form, Input, InputNumber, Modal, Select, Space } from 'antd'
import { actOnClaim, errorMessage } from './warrantyClaimsAPI'

export default function ClaimActionModal({ claim, action, onClose, onUpdated }) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const key = action.key
  const submit = async values => {
    setSubmitting(true)
    setError('')
    try {
      await actOnClaim(claim.id, { action: key, version: claim.version, ...values })
      onUpdated()
    } catch (err) { setError(errorMessage(err)) }
    finally { setSubmitting(false) }
  }
  const referenceLabel = { receive: 'Workshop receipt reference', complete_resolution: claim.resolution === 'repair' ? 'Repair job reference' : 'Replacement issue reference', return_to_dealer: 'Return dispatch / LR reference' }[key]
  return <Modal title={`${action.label} · ${claim.claimNumber}`} open onCancel={submitting ? undefined : onClose} closable={!submitting} maskClosable={!submitting} footer={null} width={620}>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Form form={form} layout="vertical" onFinish={submit}>
      {key === 'approve' && <>
        <Form.Item label="Approved resolution" name="resolution" rules={[{ required: true, message: 'Select the resolution.' }]}>
          <Select options={[{ value: 'repair', label: 'Repair' }, { value: 'replacement', label: 'Replacement' }]} />
        </Form.Item>
        <Form.Item name="registrationVerified" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Confirm registration verification.')) }]}>
          <Checkbox>I verified the warranty registration, registered mobile and supporting photos.</Checkbox>
        </Form.Item>
      </>}
      {referenceLabel && <Form.Item label={referenceLabel} name="reference" rules={[{ required: true, whitespace: true }]}><Input maxLength={250} /></Form.Item>}
      {key === 'close' && <>
        <Form.Item name="customerReceived" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Confirm customer receipt.')) }]}>
          <Checkbox>The customer has received the repaired or replacement product.</Checkbox>
        </Form.Item>
        <Form.Item label="Payment settlement" name="paymentStatus" rules={[{ required: true }]}><Select options={[
          { value: 'paid', label: 'Paid at dealer' }, { value: 'waived', label: 'Waived' }, { value: 'not_applicable', label: 'Not applicable' }
        ]} onChange={() => form.setFieldsValue({ paymentAmount: 0, paymentReference: '' })} /></Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.paymentStatus !== b.paymentStatus}>{({ getFieldValue }) => getFieldValue('paymentStatus') === 'paid' && <>
          <Form.Item label="Amount collected (₹)" name="paymentAmount" rules={[{ required: true, type: 'number', min: 0.01 }]}><InputNumber min={0.01} max={999999999999.99} precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="Payment receipt reference" name="paymentReference" rules={[{ required: true, whitespace: true }]}><Input maxLength={250} /></Form.Item>
        </>}</Form.Item>
        <Form.Item label="Surrendered product" name="surrenderStatus" rules={[{ required: true }]}><Select options={[
          { value: 'logged', label: 'Surrender received and logged' }, { value: 'not_required', label: 'Surrender not required' }
        ]} /></Form.Item>
        <Form.Item label="Surrender receipt, or reason it is not required" name="surrenderReference" rules={[{ required: true, whitespace: true }]}><Input maxLength={250} /></Form.Item>
      </>}
      <Form.Item label={['approve', 'reject', 'request_info'].includes(key) ? 'Decision / reason' : 'Notes'} name="notes" rules={[{ required: true, min: 3, whitespace: true }]}>
        <Input.TextArea rows={4} maxLength={5000} showCount />
      </Form.Item>
      <Space className="w-full justify-end"><Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button type="primary" danger={['reject', 'cancel'].includes(key)} htmlType="submit" loading={submitting}>{action.label}</Button></Space>
    </Form>
  </Modal>
}
