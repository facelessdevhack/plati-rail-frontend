import React from 'react'
import { Alert, Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

const STATUS = {
  VERIFIED: { color: 'success', alert: 'success', icon: <CheckCircleOutlined />, label: 'Verified' },
  PROVISIONAL: { color: 'warning', alert: 'warning', icon: <ClockCircleOutlined />, label: 'Provisional' },
  INCOMPLETE: { color: 'error', alert: 'error', icon: <WarningOutlined />, label: 'Incomplete' }
}

const DataQualityBanner = ({ dataQuality, loading }) => {
  if (loading || !dataQuality) return null

  const config = STATUS[dataQuality.status] || STATUS.INCOMPLETE
  const missingMonths = dataQuality.missingExpenseMonths || []
  const description = dataQuality.status === 'VERIFIED'
    ? 'All sales in this period have verified FIFO costs and monthly expenses are present.'
    : dataQuality.status === 'PROVISIONAL'
      ? 'A complete number is available, but fallback layers or production WIP still require reconciliation.'
      : 'GP covers only sales with a usable FIFO cost. NP is not final until missing FIFO costs and expense months are resolved.'

  return (
    <Card style={{ borderRadius: 12, marginBottom: 24 }} bodyStyle={{ padding: 16 }}>
      <Alert
        showIcon
        type={config.alert}
        message={
          <Space>
            <Tag color={config.color} icon={config.icon}>{config.label.toUpperCase()}</Tag>
            <Text strong>Finance P&amp;L verification</Text>
          </Space>
        }
        description={description}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[20, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Text type="secondary">FIFO costing coverage</Text>
          <Progress
            percent={Number(dataQuality.costingCoveragePercent || 0)}
            status={dataQuality.costingCoveragePercent === 100 ? 'success' : 'exception'}
            format={value => `${Number(value).toFixed(1)}%`}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {(dataQuality.costedQuantity || 0).toLocaleString('en-IN')} / {(dataQuality.totalQuantity || 0).toLocaleString('en-IN')} pieces
          </Text>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Text type="secondary">Verified invoice-backed FIFO</Text>
          <Progress
            percent={Number(dataQuality.verifiedCoveragePercent || 0)}
            strokeColor="#1677ff"
            format={value => `${Number(value).toFixed(1)}%`}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {(dataQuality.verifiedQuantity || 0).toLocaleString('en-IN')} verified pieces
          </Text>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Statistic title="Missing cost" value={dataQuality.missingCostQuantity || 0} suffix="pcs" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Statistic title="Fallback cost" value={dataQuality.provisionalQuantity || 0} suffix="pcs" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Statistic title="Open pending stock" value={dataQuality.pendingLayerQuantity || 0} suffix="pcs" />
          {Number(dataQuality.pendingLayerCreatedQuantity || 0) > Number(dataQuality.pendingLayerQuantity || 0) && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {Number(dataQuality.pendingLayerCreatedQuantity).toLocaleString('en-IN')} created ·{' '}
              {(Number(dataQuality.pendingLayerCreatedQuantity) - Number(dataQuality.pendingLayerQuantity)).toLocaleString('en-IN')} consumed
            </Text>
          )}
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Statistic title="Stranded WIP" value={dataQuality.strandedWipQuantity || 0} suffix="pcs" />
        </Col>
      </Row>

      <Space wrap style={{ marginTop: 16 }}>
        <Tag color={missingMonths.length ? 'red' : 'green'}>
          Expenses: {dataQuality.expenseMonthsRecorded || 0}/{dataQuality.expenseMonthsExpected || 0} months
        </Tag>
        {missingMonths.length > 0 && <Tag color="red">Missing: {missingMonths.join(', ')}</Tag>}
        {Number(dataQuality.legacyProductionVarianceQuantity || 0) > 0 && (
          <Tag color="orange">
            Legacy production variance: {Number(dataQuality.legacyProductionVarianceQuantity).toLocaleString('en-IN')} pcs
          </Tag>
        )}
        <Tag>Costing: FIFO ledger</Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Last replay: {dataQuality.lastReplayAt ? dayjs(dataQuality.lastReplayAt).format('DD MMM YYYY, HH:mm') : 'Not recorded'}
        </Text>
      </Space>
    </Card>
  )
}

export default DataQualityBanner
