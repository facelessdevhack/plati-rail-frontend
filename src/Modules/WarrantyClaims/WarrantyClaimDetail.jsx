import React, { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Col, Descriptions, List, message, Row, Select, Space, Spin, Tag, Timeline } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import { Link, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import PageTitle from '../../Core/Components/PageTitle'
import ClaimActionModal from './ClaimActionModal'
import { errorMessage, getClaim, getEvidenceUrl, uploadEvidence } from './warrantyClaimsAPI'
import { availableActions, evidenceLabels, formatDate, formatTime, isOverdue, statusColors, statusLabels } from './claimWorkflow'

export default function WarrantyClaimDetail() {
  const { id } = useParams()
  const { user } = useSelector(state => state.userDetails)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [action, setAction] = useState(null)
  const [kind, setKind] = useState('damage_photo')
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef(null)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getClaim(id).then(result => { if (active) setData(result) })
      .catch(err => { if (active) setError(errorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, revision])
  const refresh = () => { setAction(null); setRevision(value => value + 1) }
  const upload = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      message.error('Choose a JPG, PNG or PDF no larger than 3 MB.')
      return
    }
    setUploading(true)
    try { await uploadEvidence(id, file, kind); message.success('Evidence added.'); refresh() }
    catch (err) { message.error(errorMessage(err)) }
    finally { setUploading(false) }
  }
  const openEvidence = async evidenceId => {
    const viewer = window.open('about:blank', '_blank')
    if (viewer) viewer.opener = null
    try {
      const url = await getEvidenceUrl(id, evidenceId)
      if (!/^https:\/\//i.test(url)) throw new Error('The evidence link is unavailable.')
      if (viewer) viewer.location.href = url
      else message.error('Allow pop-ups to open the evidence file.')
    } catch (err) { viewer?.close(); message.error(errorMessage(err)) }
  }
  if (loading) return <div className="py-12 text-center"><Spin tip="Loading claim…" /></div>
  if (error) return <Alert type="error" showIcon message={error} action={<Button onClick={refresh}>Retry</Button>} />
  if (!data) return null
  const { claim, events, evidence, capabilities } = data
  const registration = claim.registrationSnapshot
  const actions = availableActions(claim, capabilities, user?.userId ?? user?.id)
  const canUpload = (capabilities.create || capabilities.review || capabilities.fulfill) && !['closed', 'rejected', 'cancelled'].includes(claim.status)
  return <div>
    <Link to="/warranty-claims"><ArrowLeftOutlined /> All warranty claims</Link>
    <Space className="w-full justify-between mt-4" align="start" wrap>
      <div><PageTitle>{claim.claimNumber}</PageTitle><Space><Tag color={statusColors[claim.status]}>{statusLabels[claim.status]}</Tag>
        {claim.resolution && <Tag>{claim.resolution === 'repair' ? 'Repair' : 'Replacement'}</Tag>}
        <span className="text-gray-500">Received {formatTime(claim.receivedAt)} IST</span></Space></div>
      <Button icon={<ReloadOutlined />} onClick={refresh}>Refresh</Button>
    </Space>
    {isOverdue(claim) && <Alert className="mt-4" type="warning" showIcon message={`Decision overdue · Target was ${formatTime(claim.decisionDueAt)} IST`} description="Escalate this claim to the assigned reviewer or Operations owner." />}
    <Space wrap className="my-5">{actions.map(item => <Button key={item.key} onClick={() => setAction(item)}
      type={['approve', 'receive', 'start_repair', 'complete_resolution', 'return_to_dealer', 'close'].includes(item.key) ? 'primary' : 'default'}
      danger={['reject', 'cancel'].includes(item.key)}>{item.label}</Button>)}</Space>
    <Row gutter={[24, 24]}>
      <Col xs={24} xl={15}>
        <Card title="Claim and registration" className="mb-5">
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="Warranty card">{registration.warrantyCardNo}</Descriptions.Item>
            <Descriptions.Item label="Registration ID">{claim.registrationId}</Descriptions.Item>
            <Descriptions.Item label="Customer">{registration.customerName}</Descriptions.Item>
            <Descriptions.Item label="Registered mobile">{registration.mobileNo}</Descriptions.Item>
            <Descriptions.Item label="Dealer" span={2}>{claim.dealerName}</Descriptions.Item>
            <Descriptions.Item label="Product">{registration.productType}</Descriptions.Item>
            <Descriptions.Item label="Claim quantity">{claim.quantity}</Descriptions.Item>
            <Descriptions.Item label="Vehicle">{registration.vehicleNo}</Descriptions.Item>
            <Descriptions.Item label="Vehicle model">{registration.vehicleModel}</Descriptions.Item>
            <Descriptions.Item label="Purchase date">{formatDate(registration.dop)}</Descriptions.Item>
            <Descriptions.Item label="Incident date">{formatDate(claim.incidentDate)}</Descriptions.Item>
            <Descriptions.Item label="Received through">{claim.intakeChannel}</Descriptions.Item>
            <Descriptions.Item label="Decision target (IST)">{formatTime(claim.decisionDueAt)}</Descriptions.Item>
            <Descriptions.Item label="Product specification" span={2}>{registration.productSpecification || '—'}</Descriptions.Item>
            <Descriptions.Item label="Problem reported" span={2}><span style={{ whiteSpace: 'pre-wrap' }}>{claim.issueDescription}</span></Descriptions.Item>
            {claim.decisionReason && <Descriptions.Item label="Decision reason" span={2}>{claim.decisionReason}</Descriptions.Item>}
          </Descriptions>
        </Card>
        <Card title="Photos and evidence" className="mb-5">
          <p className="text-gray-500">Add damaged-product and vehicle photos before approval. JPG, PNG or PDF, up to 3 MB per file.</p>
          {canUpload && <Space wrap className="mb-4">
            <Select aria-label="Evidence category" style={{ width: 225 }} value={kind} onChange={setKind}
              options={Object.entries(evidenceLabels).map(([value, label]) => ({ value, label }))} />
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,application/pdf" onChange={upload} style={{ display: 'none' }} aria-label="Evidence file" />
            <Button icon={<UploadOutlined />} loading={uploading} onClick={() => fileInput.current?.click()}>Add evidence</Button>
          </Space>}
          <List dataSource={evidence} locale={{ emptyText: 'No evidence added yet.' }} renderItem={item => <List.Item
            actions={[<Button key="open" type="link" onClick={() => openEvidence(item.id)}>Open</Button>]}>
            <List.Item.Meta title={item.fileName} description={`${evidenceLabels[item.kind]} · ${formatTime(item.uploadedAt)} IST`} />
          </List.Item>} />
        </Card>
        <Card title="Workshop, return and settlement">
          <Descriptions size="small" column={1}>
            <Descriptions.Item label="Workshop receipt">{claim.workshopReference || 'Not yet received'}</Descriptions.Item>
            <Descriptions.Item label="Repair / replacement reference">{claim.resolutionReference || 'Not completed'}</Descriptions.Item>
            <Descriptions.Item label="Return dispatch reference">{claim.returnReference || 'Not dispatched'}</Descriptions.Item>
            <Descriptions.Item label="Customer receipt (IST)">{formatTime(claim.customerReceivedAt)}</Descriptions.Item>
            <Descriptions.Item label="Payment">{claim.paymentStatus.replaceAll('_', ' ')}{Number(claim.paymentAmount) > 0 ? ` · ₹${Number(claim.paymentAmount).toLocaleString('en-IN')}` : ''}</Descriptions.Item>
            {claim.paymentReference && <Descriptions.Item label="Payment reference">{claim.paymentReference}</Descriptions.Item>}
            <Descriptions.Item label="Surrender">{claim.surrenderStatus.replaceAll('_', ' ')}{claim.surrenderReference ? ` · ${claim.surrenderReference}` : ''}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} xl={9}><Card title="Claim history">
        <Timeline items={events.map(event => ({ color: event.toStatus === 'rejected' ? 'red' : 'blue', children: <div>
          <div className="font-semibold">{event.action.replaceAll('_', ' ')}</div>
          <div className="text-xs text-gray-500 mb-2">{event.actorName} · {formatTime(event.occurredAt)} IST</div>
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{event.notes}</p>
          {event.fromStatus !== event.toStatus && <Tag>{statusLabels[event.toStatus]}</Tag>}
        </div> }))} />
      </Card></Col>
    </Row>
    {action && <ClaimActionModal key={action.key} claim={claim} action={action} onClose={() => setAction(null)} onUpdated={refresh} />}
  </div>
}
