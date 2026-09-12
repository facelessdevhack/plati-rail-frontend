import React, { useState } from 'react'
import { Alert, Button, Collapse, Input, Select, Space } from 'antd'
import { normalizeWarrantyFields } from './parseWarrantyCard'

const fields = [
  ['customerName', 'Customer name'], ['mobileNumber', 'Customer phone number'], ['warrantyCardNo', 'Warranty card number'],
  ['productInfo', 'Product information'], ['vehicleNo', 'Vehicle number'], ['vehicleModel', 'Vehicle model'],
  ['quantity', 'Product quantity'], ['purchaseDate', 'Purchase date'], ['meterReading', 'Odometer reading'], ['customerEmail', 'Customer email']
].map(([value, label]) => ({ value, label }))

export default function DetectedCardText({ text, disabled, onApply }) {
  const [field, setField] = useState('customerName')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const lines = [...new Set(text.split('\n').map(line => line.trim()).filter(Boolean))].slice(0, 200)
  const apply = () => {
    const value = normalizeWarrantyFields({ [field]: draft.trim() })[field]
    if (value === undefined || value === '') { setError('Correct this text to a valid value for the selected field.'); return }
    onApply(field, value); setError('')
  }
  return <Collapse className="mb-4" items={[{ key: 'text', label: 'Use text from the card', children: <div>
    <p>If a field was missed, choose the text and where it belongs. Correct any reading errors before applying it.</p>
    <Space direction="vertical" className="w-full" size="middle">
      <div><label htmlFor="card-detected-line">Text found on card</label><Select id="card-detected-line" aria-label="Text found on card" showSearch value={null}
        placeholder="Choose detected text" className="w-full" disabled={disabled} options={lines.map(value => ({ value, label: value }))}
        onChange={value => { setDraft(value); setError('') }} /></div>
      <div><label htmlFor="card-target-field">Use for</label><Select id="card-target-field" aria-label="Use for" className="w-full" value={field} disabled={disabled}
        options={fields} onChange={value => { setField(value); setError('') }} /></div>
      <div><label htmlFor="card-corrected-text">Corrected text</label><Input.TextArea id="card-corrected-text" value={draft} disabled={disabled} maxLength={2000}
        onChange={event => { setDraft(event.target.value); setError('') }} rows={2} /></div>
      {error && <Alert type="error" message={error} showIcon />}
      <Button disabled={disabled || !draft.trim()} onClick={apply}>Use in selected field</Button>
    </Space>
  </div> }]} />
}
