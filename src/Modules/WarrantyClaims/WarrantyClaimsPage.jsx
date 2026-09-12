import React, { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Input, Row, Select, Space, Statistic, Switch, Table, Tag } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import PageTitle from '../../Core/Components/PageTitle'
import CreateClaimModal from './CreateClaimModal'
import { errorMessage, listClaims } from './warrantyClaimsAPI'
import { formatTime, isOverdue, statusColors, statusLabels } from './claimWorkflow'

export default function WarrantyClaimsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState({ page: 1, pageSize: 20, search: '', status: '', overdue: false })
  const [data, setData] = useState({ claims: [], total: 0, stats: {}, capabilities: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [creating, setCreating] = useState(false)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    listClaims(query).then(result => { if (active) setData(result) })
      .catch(err => { if (active) setError(errorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, revision])
  const filter = changes => setQuery(previous => ({ ...previous, ...changes, page: 1 }))
  const columns = [
    { title: 'Claim', dataIndex: 'claimNumber', render: (value, row) => <Link to={`/warranty-claims/${row.id}`}>{value}</Link> },
    { title: 'Warranty / customer', key: 'registration', render: (_, row) => <><div>{row.registrationSnapshot.warrantyCardNo}</div><small>{row.registrationSnapshot.customerName}</small></> },
    { title: 'Dealer', dataIndex: 'dealerName' },
    { title: 'Product', key: 'product', render: (_, row) => `${row.registrationSnapshot.productType} · ${row.quantity} unit${row.quantity === 1 ? '' : 's'}` },
    { title: 'Status', dataIndex: 'status', render: value => <Tag color={statusColors[value]}>{statusLabels[value]}</Tag> },
    { title: 'Resolution', dataIndex: 'resolution', render: value => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Undecided' },
    { title: 'Decision due (IST)', dataIndex: 'decisionDueAt', render: (value, row) => <><div>{formatTime(value)}</div>{isOverdue(row) && <Tag color="red">Overdue</Tag>}</> },
    { title: 'Received (IST)', dataIndex: 'receivedAt', render: formatTime }
  ]
  return <div>
    <Space className="w-full justify-between" wrap><PageTitle>Warranty Claims</PageTitle><Space>
      <Button icon={<ReloadOutlined />} onClick={() => setRevision(value => value + 1)}>Refresh</Button>
      {data.capabilities.create && <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>New claim</Button>}
    </Space></Space>
    <p className="text-gray-500 mb-6">Track registered-product claims from the first report through repair or replacement and return.</p>
    <Row gutter={[16, 16]} className="mb-6">
      {[['Open claims', 'open'], ['Needs information', 'needsInfo'], ['Decision overdue', 'overdue'], ['Closed', 'closed']].map(([title, key]) => <Col xs={12} lg={6} key={key}><Card size="small"><Statistic title={title} value={data.stats[key] || 0} valueStyle={key === 'overdue' && data.stats[key] ? { color: '#cf1322' } : undefined} /></Card></Col>)}
    </Row>
    <Space wrap className="mb-4">
      <Input.Search placeholder="Claim, warranty card or dealer" allowClear style={{ width: 300 }} onSearch={search => filter({ search })} />
      <Select aria-label="Claim status" value={query.status} style={{ width: 190 }} onChange={status => filter({ status })}
        options={[{ value: '', label: 'All statuses' }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]} />
      <Space><Switch checked={query.overdue} onChange={overdue => filter({ overdue })} aria-label="Overdue claims only" />Overdue only</Space>
    </Space>
    {error ? <Alert type="error" showIcon message={error} action={<Button onClick={() => setRevision(value => value + 1)}>Retry</Button>} /> :
      <Table rowKey="id" columns={columns} dataSource={data.claims} loading={loading} scroll={{ x: 1150 }}
        locale={{ emptyText: 'No warranty claims match these filters.' }}
        pagination={{ current: query.page, pageSize: query.pageSize, total: data.total, showSizeChanger: true,
          showTotal: total => `${total} claims`, onChange: (page, pageSize) => setQuery(previous => ({ ...previous, page, pageSize })) }} />}
    {creating && <CreateClaimModal onClose={() => setCreating(false)} onCreated={claim => navigate(`/warranty-claims/${claim.id}`)} />}
  </div>
}
