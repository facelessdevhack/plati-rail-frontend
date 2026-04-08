import PageTitle from "../../Core/Components/PageTitle"
import PlatiFormStyles from "../../Core/Components/FormStyles"
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Tag, Button, Modal, Input, Spin, Descriptions, Alert, Space } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { getRequisitionById, approveRequisition, rejectRequisition } from '../../redux/api/purchaseV2API'
import { clearError, clearSuccess } from '../../redux/slices/purchaseV2.slice'

const STATUS_COLOR = { pending: 'orange', approved: 'green', rejected: 'red', indent_created: 'blue' }

export default function RequisitionDetails() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentRequisition: pr, loading, error, success } = useSelector(s => s.purchaseV2)
  const { user } = useSelector(s => s.userDetails)

  const [rejectModal, setRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const isPM = [9, 5, 999].includes(Number(user?.roleId))

  useEffect(() => {
    dispatch(getRequisitionById(id))
    return () => { dispatch(clearError()); dispatch(clearSuccess()) }
  }, [id])

  const handleApprove = async () => {
    setActionLoading(true)
    await dispatch(approveRequisition(id))
    dispatch(getRequisitionById(id))
    setActionLoading(false)
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) return
    setActionLoading(true)
    await dispatch(rejectRequisition({ id, rejectionReason }))
    dispatch(getRequisitionById(id))
    setRejectModal(false)
    setActionLoading(false)
  }

  if (loading && !pr) return <div className='flex justify-center items-center h-64'><Spin size='large' /></div>
  if (!pr) return null

  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <button className='flex items-center text-gray-500 hover:text-gray-700 mb-4' onClick={() => navigate('/purchase/requisitions')}>
        <ArrowLeftOutlined className='mr-2' /> Back to Requisitions
      </button>

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold font-mono'>{pr.prNumber}</h1>
          <Tag color={STATUS_COLOR[pr.status]} className='mt-1'>{pr.status?.replace('_', ' ').toUpperCase()}</Tag>
        </div>
        {isPM && pr.status === 'pending' && (
          <Space>
            <button type='primary' icon={<CheckCircleOutlined />} loading={actionLoading} onClick={handleApprove}>
              Approve
            </button>
            <button danger icon={<CloseCircleOutlined />} onClick={() => setRejectModal(true)}>
              Reject
            </button>
          </Space>
        )}
        {pr.status === 'approved' && !pr.indentNumber && (
          <Tag color='green' className='text-sm'>Ready for Indent Creation</Tag>
        )}
        {pr.indentNumber && (
          <button className='text-blue-600 underline font-semibold' onClick={() => navigate(`/purchase/indents/${pr.indentId}`)}>
            View Indent: {pr.indentNumber} →
          </button>
        )}
      </div>

      {error && <Alert type='error' message={error?.message || String(error)} className='mb-4' />}
      {success && <Alert type='success' message={success} className='mb-4' />}

      {pr.status === 'rejected' && pr.rejectionReason && (
        <Alert type='error' message={`Rejection Reason: ${pr.rejectionReason}`} className='mb-4' />
      )}

      <div className='bg-white rounded-xl shadow-sm border p-6 mb-4'>
        <h2 className='text-lg font-semibold mb-4'>Requisition Details</h2>
        <Descriptions bordered column={2} size='small'>
          <Descriptions.Item label='Requester'>{pr.requesterName}</Descriptions.Item>
          <Descriptions.Item label='Email'>{pr.requesterEmail || '-'}</Descriptions.Item>
          <Descriptions.Item label='Department'>{pr.department || '-'}</Descriptions.Item>
          <Descriptions.Item label='Purchase Type'>
            <Tag color={pr.purchaseType === 'job_work' ? 'purple' : 'blue'}>
              {pr.purchaseType === 'job_work' ? 'Job Work' : 'Items Purchase'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label='Urgency'>
            <Tag color={pr.urgency === 'critical' ? 'error' : pr.urgency === 'urgent' ? 'warning' : 'default'}>
              {pr.urgency?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label='Required By'>{pr.requiredByDate ? new Date(pr.requiredByDate).toLocaleDateString() : '-'}</Descriptions.Item>
          <Descriptions.Item label='Purpose' span={2}>{pr.purpose || '-'}</Descriptions.Item>
          <Descriptions.Item label='Items / Services Required' span={2}>
            <pre className='whitespace-pre-wrap text-sm'>{pr.itemsDescription}</pre>
          </Descriptions.Item>
          {pr.approverName && <Descriptions.Item label='Approved / Reviewed By'>{pr.approverName}</Descriptions.Item>}
          {pr.approvedAt && <Descriptions.Item label='Reviewed At'>{new Date(pr.approvedAt).toLocaleString()}</Descriptions.Item>}
          <Descriptions.Item label='Submitted'>{ new Date(pr.createdAt).toLocaleString()}</Descriptions.Item>
        </Descriptions>
      </div>

      <Modal
        title='Reject Requisition'
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        onOk={handleReject}
        okText='Reject'
        okButtonProps={{ danger: true, loading: actionLoading }}
      >
        <p className='text-gray-600 mb-3'>Please provide a reason for rejection:</p>
        <Input.TextArea rows={4} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder='Reason for rejection...' />
      </Modal>
    </div>
  )
}
