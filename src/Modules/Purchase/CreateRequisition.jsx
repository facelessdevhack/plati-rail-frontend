import PageTitle from "../../Core/Components/PageTitle"
import PlatiFormStyles from "../../Core/Components/FormStyles"
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Form, Input, DatePicker, Button, Select, Alert, Tag } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { createRequisition } from '../../redux/api/purchaseV2API'
import { clearError, clearSuccess } from '../../redux/slices/purchaseV2.slice'

const { TextArea } = Input
const { Option } = Select

export default function CreateRequisition() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.purchaseV2)
  const { user } = useSelector(s => s.userDetails)

  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  const handleSubmit = async () => {
    try {
      await form.validateFields()
    } catch (_) { return }

    setSubmitting(true)
    dispatch(clearError())
    const values = form.getFieldsValue()

    const result = await dispatch(createRequisition({
      requester_name: values.requesterName,
      requester_email: values.requesterEmail,
      department: values.department,
      purchase_type: values.purchaseType,
      urgency: values.urgency,
      required_by_date: values.requiredByDate?.format('YYYY-MM-DD'),
      purpose: values.purpose,
      items_description: values.itemsDescription
    }))

    setSubmitting(false)

    if (result.payload?.success) {
      setSubmitted(result.payload.data)
      form.resetFields()
    }
  }

  const handleNew = () => {
    setSubmitted(null)
    dispatch(clearSuccess())
    // Pre-fill name fields again from user
    form.setFieldsValue({
      requesterName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
      requesterEmail: user?.email || ''
    })
  }

  // Pre-fill user details on first render
  React.useEffect(() => {
    form.setFieldsValue({
      requesterName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
      requesterEmail: user?.email || '',
      purchaseType: 'items',
      urgency: 'normal'
    })
    return () => { dispatch(clearError()); dispatch(clearSuccess()) }
  }, [])

  if (submitted) {
    return (
      <div className='p-6 max-w-2xl mx-auto'>
        <div className='bg-white rounded-xl shadow-sm border p-8 text-center'>
          <div className='text-green-500 text-5xl mb-4'>✓</div>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>Requisition Submitted!</h2>
          <p className='text-gray-500 mb-4'>Your purchase request has been submitted for review.</p>
          <div className='bg-blue-50 rounded-lg border border-blue-100 p-4 mb-6 text-left'>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              <div><span className='text-gray-500'>PR Number:</span> <span className='font-mono font-bold text-blue-700'>{submitted.prNumber}</span></div>
              <div><span className='text-gray-500'>Status:</span> <Tag color='orange'>PENDING REVIEW</Tag></div>
              <div><span className='text-gray-500'>Type:</span> <Tag color={submitted.purchaseType === 'job_work' ? 'purple' : 'blue'}>{submitted.purchaseType === 'job_work' ? 'Job Work' : 'Items Purchase'}</Tag></div>
              <div><span className='text-gray-500'>Urgency:</span> <Tag>{submitted.urgency?.toUpperCase()}</Tag></div>
            </div>
          </div>
          <p className='text-gray-400 text-sm mb-6'>The Purchase Manager will review your request and approve or reject it.</p>
          <div className='flex gap-3 justify-center'>
            <button type='primary' onClick={handleNew}>Submit Another Request</button>
            <button onClick={() => navigate('/')}>Go to Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 max-w-2xl mx-auto'>
      <div className='mb-6'>
        <h1 style={{ fontFamily: "'Staff Wide Test', serif", fontSize: 42, fontWeight: 400, color: '#1a1a1a', margin: 0, lineHeight: '30px' }}>Purchase Requisition</h1>
        <p className='text-gray-500 text-sm mt-1'>Submit a request to purchase items or services</p>
      </div>

      {error && <Alert type='error' message={error?.message || String(error)} className='mb-4' closable onClose={() => dispatch(clearError())} />}

      <div className='bg-white rounded-xl shadow-sm border p-6'>
        <Form form={form} layout='vertical' requiredMark>

          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              name='requesterName'
              label='Your Name'
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input placeholder='Full name' />
            </Form.Item>
            <Form.Item name='requesterEmail' label='Email'>
              <Input type='email' placeholder='your@email.com' />
            </Form.Item>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <Form.Item name='department' label='Department'>
              <Input placeholder='e.g. Production, Maintenance, Admin' />
            </Form.Item>
            <Form.Item
              name='purchaseType'
              label='Purchase Type'
              rules={[{ required: true }]}
            >
              <Select>
                <Option value='items'>Items Purchase (Physical Goods)</Option>
                <Option value='job_work'>Job Work (Services / Labour)</Option>
              </Select>
            </Form.Item>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <Form.Item name='urgency' label='Urgency' rules={[{ required: true }]}>
              <Select>
                <Option value='normal'>Normal</Option>
                <Option value='urgent'>Urgent</Option>
                <Option value='critical'>Critical</Option>
              </Select>
            </Form.Item>
            <Form.Item name='requiredByDate' label='Required By Date'>
              <DatePicker className='w-full' />
            </Form.Item>
          </div>

          <Form.Item name='purpose' label='Purpose / Justification'>
            <TextArea rows={2} placeholder='Why is this purchase needed?' />
          </Form.Item>

          <Form.Item
            name='itemsDescription'
            label='Items / Services Required'
            rules={[{ required: true, message: 'Please describe what you need' }]}
            extra='Describe the items or services needed, including approximate quantities, specifications, and any preferred brands.'
          >
            <TextArea
              rows={5}
              placeholder={'Example:\n- 50 kg MS Rods (12mm dia)\n- 10 litres of Cutting Oil\n- 2 pairs Safety Gloves (Size L)'}
            />
          </Form.Item>

          <div className='flex justify-end gap-3 mt-2'>
            <button onClick={() => navigate(-1)} style={{ background: '#e5e5e5', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}>Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4a90ff', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: 'pointer', opacity: submitting || loading ? 0.5 : 1 }}
            >
              <SendOutlined style={{ fontSize: 14 }} /> Submit Request
            </button>
          </div>
        </Form>
      </div>
    </div>
  )
}
