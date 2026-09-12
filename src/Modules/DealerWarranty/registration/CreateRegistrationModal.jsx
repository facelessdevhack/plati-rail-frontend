import React, { useEffect, useRef, useState } from 'react'
import { Alert, Button, Descriptions, Form, Image, Input, InputNumber, Modal, Result, Select, Space, Steps, Tag } from 'antd'
import { ScanOutlined } from '@ant-design/icons'
import { errorMessage, requestRegistrationOtp, retryRegistrationConfirmation, getRegistrationDealers, verifyRegistrationOtp } from './registrationAPI'

export default function CreateRegistrationModal({ onClose, onCreated }) {
  const [form] = Form.useForm()
  const [dealers, setDealers] = useState([])
  const [loadingDealers, setLoadingDealers] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [scanMessage, setScanMessage] = useState('')
  const [scanning, setScanning] = useState(false)
  const [card, setCard] = useState(null)
  const [challenge, setChallenge] = useState(null)
  const [valuesForOtp, setValuesForOtp] = useState(null)
  const [otp, setOtp] = useState('')
  const [created, setCreated] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [retryAt, setRetryAt] = useState(0)
  const request = useRef(null)
  const scanner = useRef(null)
  const fileInput = useRef(null)
  const alive = useRef(true)
  const step = created ? 2 : challenge ? 1 : 0
  const resendSeconds = Math.max(0, Math.ceil((Math.max(retryAt, challenge ? new Date(challenge.resendAt).getTime() : 0) - now) / 1000))
  const expired = challenge && new Date(challenge.expiresAt).getTime() <= now

  useEffect(() => { alive.current = true; return () => { alive.current = false; scanner.current?.abort() } }, [])
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => () => { if (card?.url) URL.revokeObjectURL(card.url) }, [card])
  useEffect(() => {
    let active = true
    getRegistrationDealers().then(rows => { if (active) setDealers(rows) })
      .catch(err => { if (active) setError(errorMessage(err)) })
      .finally(() => { if (active) setLoadingDealers(false) })
    return () => { active = false }
  }, [])

  const scan = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    scanner.current?.abort()
    const controller = new AbortController()
    scanner.current = controller
    setScanning(true); setError(''); setScanMessage('Reading warranty card…')
    try {
      const { readWarrantyCard } = await import('./readWarrantyCard')
      const result = await readWarrantyCard(file, { signal: controller.signal, onProgress: message => { if (alive.current && !controller.signal.aborted) setScanMessage(message) } })
      if (!alive.current || controller.signal.aborted) return
      setCard({ name: file.name, url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null })
      form.setFieldsValue({ customerName: '', mobileNumber: '', warrantyCardNo: '', productType: undefined,
        productInfo: '', purchaseDate: '', vehicleNo: '', vehicleModel: '', customerEmail: '', quantity: 1,
        ...result.fields, ocrUsed: true })
      setScanMessage(Object.keys(result.fields).length ? 'Card details prefilled. Review every field with the customer and correct anything that is wrong.' : 'No labelled card details could be read. Try a clearer card or enter the information manually.')
    } catch (err) { if (alive.current && !controller.signal.aborted) { setError(errorMessage(err)); setScanMessage('You can enter the card details manually.') } }
    finally { if (alive.current && !controller.signal.aborted) setScanning(false) }
  }
  const sendOtp = async (values, resend = false) => {
    setError(''); setBusy(true)
    try {
      const fingerprint = JSON.stringify(values)
      if (resend || request.current?.fingerprint !== fingerprint) request.current = { fingerprint, id: window.crypto.randomUUID() }
      const result = await requestRegistrationOtp({ ...values, requestId: request.current.id })
      if (!alive.current) return
      setRetryAt(new Date(result.resendAt).getTime())
      if (result.state !== 'sent') { request.current = null; setError(result.message); return }
      setValuesForOtp(values); setChallenge(result); setOtp('')
    } catch (err) {
      if (alive.current) {
        setError(errorMessage(err))
        if (err.response?.status === 429 || err.response?.status >= 500) setRetryAt(Date.now() + 60000)
        if (err.response) request.current = null
      }
    } finally { if (alive.current) setBusy(false) }
  }
  const verify = async () => {
    setError(''); setBusy(true)
    try {
      const result = await verifyRegistrationOtp({ challengeId: challenge.challengeId, otp })
      if (alive.current) { setCreated(result); setOtp('') }
    } catch (err) { if (alive.current) setError(errorMessage(err)) }
    finally { if (alive.current) setBusy(false) }
  }
  const retryConfirmation = async () => {
    setBusy(true); setError('')
    try { const result = await retryRegistrationConfirmation(created.registration.id); if (alive.current) setCreated(previous => ({ ...previous, confirmation: result.confirmation })) }
    catch (err) { if (alive.current) setError(errorMessage(err)) }
    finally { if (alive.current) setBusy(false) }
  }
  return <Modal title="New warranty registration" open width={800} onCancel={busy ? undefined : onClose} maskClosable={!busy} closable={!busy} footer={null}>
    <Steps size="small" current={step} className="mb-6" items={[{ title: 'Customer and product' }, { title: 'Customer OTP' }, { title: 'Registered' }]} />
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Form form={form} layout="vertical" onFinish={sendOtp} initialValues={{ quantity: 1, ocrUsed: false, vehicleNo: '', vehicleModel: '', customerEmail: '' }} style={{ display: step === 0 ? 'block' : 'none' }}>
      <Space wrap className="mb-3">
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,application/pdf" aria-label="Warranty card file" style={{ display: 'none' }} onChange={scan} />
        <Button icon={<ScanOutlined />} loading={scanning} disabled={busy} onClick={() => fileInput.current?.click()}>Upload warranty card and read details</Button>
        {scanning && <Button onClick={() => { scanner.current?.abort(); setScanning(false); setScanMessage('Card reading cancelled. You can enter the details manually.') }}>Cancel scan</Button>}
        <span className="text-gray-500">JPG, PNG or PDF · up to 10 MB / 3 pages</span>
      </Space>
      {scanMessage && <Alert type="info" showIcon message={scanMessage} className="mb-4" />}
      {card && <Space className="mb-4">{card.url && <Image src={card.url} width={65} alt="Uploaded warranty card" />}<span>{card.name}</span><Tag>Read in your browser</Tag></Space>}
      <Form.Item name="ocrUsed" hidden><Input /></Form.Item>
      <Form.Item label="Dealer" name="dealerId" rules={[{ required: true, message: 'Select the dealer who sold the product.' }]}>
        <Select showSearch optionFilterProp="label" loading={loadingDealers} disabled={busy || scanning}
          placeholder="Select dealer" options={dealers.map(row => ({ value: row.id, label: row.dealerName }))} />
      </Form.Item>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 18px' }}>
        <Form.Item label="Customer name" name="customerName" rules={[{ required: true, min: 2, whitespace: true }]}><Input maxLength={150} /></Form.Item>
        <Form.Item label="Customer phone number" name="mobileNumber" rules={[{ required: true, pattern: /^(?:\+?91[ -]?)?[6-9][\d -]{9,14}$/, message: 'Enter the customer’s mobile number.' }]}><Input type="tel" autoComplete="tel" maxLength={20} placeholder="Customer mobile for OTP" /></Form.Item>
        <Form.Item label="Warranty card number" name="warrantyCardNo" rules={[{ required: true, whitespace: true }]}><Input maxLength={100} /></Form.Item>
        <Form.Item label="Product type" name="productType" rules={[{ required: true }]}><Select options={[{ value: 'Alloy', label: 'Alloy' }, { value: 'Tyre', label: 'Tyre' }]} /></Form.Item>
      </div>
      <Form.Item label="Product information" name="productInfo" rules={[{ required: true, min: 3, whitespace: true, message: 'Enter the model, size and other product details.' }]}><Input.TextArea rows={2} maxLength={2000} placeholder="Model, size, PCD, finish or tyre specification" /></Form.Item>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 18px' }}>
        <Form.Item label="Vehicle number" name="vehicleNo"><Input maxLength={50} /></Form.Item><Form.Item label="Vehicle model" name="vehicleModel"><Input maxLength={100} /></Form.Item>
      </div>
      <Space size="large" align="start" wrap>
        <Form.Item label="Product quantity" name="quantity" rules={[{ required: true }]}><InputNumber min={1} max={100} precision={0} /></Form.Item>
        <Form.Item label="Purchase date" name="purchaseDate" rules={[{ required: true }]}><Input type="date" /></Form.Item>

      </Space>
      <Form.Item label="Customer email (optional)" name="customerEmail" rules={[{ type: 'email', message: 'Enter a valid email address.' }]}><Input type="email" maxLength={254} /></Form.Item>
      <p className="text-gray-500">Review these details with the customer before requesting OTP. Their warranty registration will be created after the code is verified.</p>
      <Space className="w-full justify-end"><Button onClick={onClose} disabled={busy}>Cancel</Button><Button type="primary" htmlType="submit" loading={busy} disabled={scanning || loadingDealers || resendSeconds > 0}>{resendSeconds > 0 ? `Try again in ${resendSeconds}s` : 'Send customer OTP'}</Button></Space>
    </Form>
    {step === 1 && <div>
      <Alert type={expired ? 'warning' : 'success'} showIcon message={expired ? 'OTP expired. Request a new code.' : `OTP sent to ${challenge.maskedMobile}`} description="The code is valid for 5 minutes. Ask the customer for the OTP after they have checked the details." className="mb-4" />
      <Descriptions bordered size="small" column={1} className="mb-4"><Descriptions.Item label="Customer">{valuesForOtp.customerName}</Descriptions.Item><Descriptions.Item label="Phone">{valuesForOtp.mobileNumber}</Descriptions.Item><Descriptions.Item label="Warranty card">{valuesForOtp.warrantyCardNo}</Descriptions.Item><Descriptions.Item label="Product">{valuesForOtp.productType} · {valuesForOtp.productInfo}</Descriptions.Item><Descriptions.Item label="Product quantity">{valuesForOtp.quantity}</Descriptions.Item></Descriptions>
      <label htmlFor="customer-registration-otp">Customer OTP</label><Input id="customer-registration-otp" inputMode="numeric" autoComplete="one-time-code" value={otp} maxLength={6} onChange={event => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="Enter 6-digit OTP" className="mt-2 mb-4" onPressEnter={() => { if (otp.length === 6 && !busy && !expired) verify() }} />
      <Space wrap className="w-full justify-between"><Button disabled={busy} onClick={() => { setChallenge(null); setOtp(''); setError(''); request.current = null }}>Edit details</Button>
        <Button disabled={busy || resendSeconds > 0} onClick={() => sendOtp(valuesForOtp, true)}>{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP'}</Button>
        <Button type="primary" loading={busy} disabled={otp.length !== 6 || expired} onClick={verify}>Verify OTP and register warranty</Button></Space>
    </div>}
    {step === 2 && <Result status="success" title="Warranty registration successful" subTitle={`Warranty card: ${created.registration.warrantyCardNo}. The customer’s warranty registration is complete.`} extra={<Space wrap>
      {created.confirmation?.status !== 'accepted' && <Button onClick={retryConfirmation} loading={busy}>Retry customer confirmation</Button>}
      <Button type="primary" onClick={() => onCreated(created.registration)}>View registration</Button></Space>}>
      <Alert type={created.confirmation?.status === 'accepted' ? 'success' : 'warning'} showIcon message={created.confirmation?.message || 'Customer confirmation is pending.'} />
    </Result>}
  </Modal>
}
