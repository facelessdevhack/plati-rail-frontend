import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Progress,
  Tooltip,
  Typography,
  Alert,
  Statistic,
  Row,
  Col,
  Badge,
  Empty
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  ToolOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import moment from 'moment'

const { Text, Title } = Typography

const StepManagementView = ({ jobCard, stepProgressData, onProcessStep, loading = false }) => {
  const [selectedStep, setSelectedStep] = useState(null)

  // Calculate aggregates
  const totalPending = stepProgressData?.reduce((sum, step) => sum + (step.pendingQuantity || 0), 0) || 0
  const totalRework = stepProgressData?.reduce((sum, step) => sum + (step.reworkQuantity || 0), 0) || 0
  const totalRejected = stepProgressData?.reduce((sum, step) => sum + (step.rejectedQuantity || 0), 0) || 0
  const totalAccepted = stepProgressData?.reduce((sum, step) => sum + (step.acceptedQuantity || 0), 0) || 0

  const getStepStatus = step => {
    if (step.status === 'completed') return 'completed'
    if (step.status === 'in_progress') return 'active'
    if (step.pendingQuantity > 0) return 'pending'
    return 'not_started'
  }

  const getStatusTag = status => {
    const configs = {
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' },
      active: { color: 'processing', icon: <ClockCircleOutlined />, text: 'In Progress' },
      pending: { color: 'warning', icon: <WarningOutlined />, text: 'Pending' },
      not_started: { color: 'default', icon: <ClockCircleOutlined />, text: 'Not Started' }
    }
    const config = configs[status] || configs.not_started
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const columns = [
    {
      title: 'Step Order',
      dataIndex: 'stepOrder',
      key: 'stepOrder',
      width: 100,
      render: order => <Text strong>Step {order}</Text>
    },
    {
      title: 'Step Name',
      dataIndex: 'stepName',
      key: 'stepName',
      width: 200,
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.status && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {getStatusTag(getStepStatus(record))}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Input',
      dataIndex: 'inputQuantity',
      key: 'inputQuantity',
      width: 100,
      align: 'center',
      render: (qty, record) => {
        // For first step with 0 input, show job card quantity
        const displayQty = (qty === 0 && record.stepOrder === 1) ? (jobCard?.quantity || 0) : (qty || 0)
        return <Text>{displayQty}</Text>
      }
    },
    {
      title: 'Accepted',
      dataIndex: 'acceptedQuantity',
      key: 'acceptedQuantity',
      width: 100,
      align: 'center',
      render: qty => <Text type="success">{qty || 0}</Text>
    },
    {
      title: 'Rejected',
      dataIndex: 'rejectedQuantity',
      key: 'rejectedQuantity',
      width: 100,
      align: 'center',
      render: qty => (qty > 0 ? <Text type="danger">{qty}</Text> : <Text type="secondary">0</Text>)
    },
    {
      title: 'Pending',
      dataIndex: 'pendingQuantity',
      key: 'pendingQuantity',
      width: 100,
      align: 'center',
      render: qty => (qty > 0 ? <Text type="warning">{qty}</Text> : <Text type="secondary">0</Text>)
    },
    {
      title: 'Rework',
      dataIndex: 'reworkQuantity',
      key: 'reworkQuantity',
      width: 100,
      align: 'center',
      render: qty => (qty > 0 ? <Text type="warning">{qty}</Text> : <Text type="secondary">0</Text>)
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 150,
      render: (_, record) => {
        const processed = (record.acceptedQuantity || 0) + (record.rejectedQuantity || 0)
        // For first step with 0 input, use job card quantity
        const total = (record.inputQuantity === 0 && record.stepOrder === 1)
          ? (jobCard?.quantity || 0)
          : (record.inputQuantity || 0)
        const percent = total > 0 ? Math.round((processed / total) * 100) : 0
        return (
          <Progress
            percent={percent}
            size="small"
            status={percent === 100 ? 'success' : 'active'}
          />
        )
      }
    },
    {
      title: 'Rejection Reason',
      dataIndex: 'rejectionReason',
      key: 'rejectionReason',
      width: 200,
      render: reason =>
        reason ? (
          <Tooltip title={reason}>
            <Text type="secondary" ellipsis style={{ maxWidth: 180 }}>
              {reason}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        )
    },
    {
      title: 'Processed At',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 150,
      render: date =>
        date ? (
          <Text type="secondary">{moment(date).format('DD MMM YYYY HH:mm')}</Text>
        ) : (
          <Text type="secondary">-</Text>
        )
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const status = getStepStatus(record)
        // For first step with 0 input quantity, allow processing using job card quantity
        const isFirstStep = record.stepOrder === 1
        const hasInput = record.inputQuantity > 0
        const hasPending = record.pendingQuantity > 0
        const canProcess = hasPending || hasInput || (isFirstStep && jobCard?.quantity > 0)

        return canProcess ? (
          <Button
            type="primary"
            size="small"
            icon={<ToolOutlined />}
            onClick={() => onProcessStep(record)}
            loading={loading}
          >
            Process
          </Button>
        ) : (
          <Button size="small" disabled>
            Completed
          </Button>
        )
      }
    }
  ]

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Summary Statistics */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Quantity"
              value={jobCard?.quantity || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={totalPending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rework"
              value={totalRework}
              valueStyle={{ color: '#ff7a45' }}
              prefix={<ReloadOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={totalRejected}
              valueStyle={{ color: '#f5222d' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Alert for pending quantities */}
      {totalPending > 0 && (
        <Alert
          message={`${totalPending} units pending across ${stepProgressData?.filter(s => s.pendingQuantity > 0).length || 0} steps`}
          description="Click 'Process' button on any step with pending quantities to continue production."
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
        />
      )}

      {/* Step Progress Table */}
      <Card
        title={
          <Space>
            <ArrowRightOutlined />
            <span>Step-wise Progress Tracking</span>
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
            size="small"
          >
            Refresh
          </Button>
        }
      >
        {stepProgressData && stepProgressData.length > 0 ? (
          <Table
            columns={columns}
            dataSource={stepProgressData}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1400 }}
            size="small"
            bordered
          />
        ) : (
          <Empty description="No step progress data available" />
        )}
      </Card>
    </Space>
  )
}

export default StepManagementView
