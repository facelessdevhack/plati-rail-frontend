import React, { useMemo } from 'react'
import { Card, Col, Empty, Row, Space, Table, Tag, Typography } from 'antd'

const { Text } = Typography

const money = value => {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

const statusTag = status => {
  const colors = { VERIFIED: 'green', PROVISIONAL: 'gold', INCOMPLETE: 'red' }
  return <Tag color={colors[status] || 'default'}>{status || 'UNKNOWN'}</Tag>
}

const FinancePnLPanel = ({
  pnlStatement,
  profitBridge = [],
  trends = [],
  expenseBreakdown = [],
  exceptions = [],
  dataQuality,
  loading
}) => {
  const statementRows = useMemo(() => {
    if (!pnlStatement) return []
    const incomplete = dataQuality?.status === 'INCOMPLETE'
    return [
      { key: 'sales', label: 'Net Sales', amount: pnlStatement.netSales, emphasis: true },
      { key: 'coveredSales', label: 'Sales with FIFO cost', amount: pnlStatement.salesWithCost },
      { key: 'awaiting', label: 'Sales awaiting FIFO cost', amount: pnlStatement.salesAwaitingCost, warning: pnlStatement.salesAwaitingCost > 0 },
      { key: 'cogs', label: 'Less: FIFO COGS', amount: -pnlStatement.fifoCogs },
      { key: 'gp', label: incomplete ? 'Covered Gross Profit' : 'Gross Profit', amount: pnlStatement.coveredGrossProfit, emphasis: true },
      { key: 'overhead', label: 'Less: Indirect expenses', amount: -pnlStatement.indirectExpenses },
      { key: 'finance', label: 'Less: Finance expenses', amount: -pnlStatement.financeExpenses },
      { key: 'scrap', label: 'Less: Recorded scrap loss', amount: -pnlStatement.scrapLoss },
      { key: 'productionVariance', label: 'Less: Legacy production variance', amount: -pnlStatement.productionVarianceLoss },
      {
        key: 'np',
        label: incomplete ? 'Indicative Net Profit (not final)' : 'Net Profit',
        amount: incomplete ? pnlStatement.indicativeNetProfit : pnlStatement.netProfit,
        emphasis: true,
        warning: incomplete
      }
    ]
  }, [pnlStatement, dataQuality])

  const statementColumns = [
    {
      title: 'P&L line',
      dataIndex: 'label',
      render: (value, row) => <Text strong={row.emphasis} type={row.warning ? 'danger' : undefined}>{value}</Text>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right',
      render: (value, row) => (
        <Text strong={row.emphasis} type={row.warning ? 'danger' : undefined}>
          {money(value)}
        </Text>
      )
    }
  ]

  const monthlyColumns = [
    { title: 'Month', dataIndex: 'period', width: 90 },
    { title: 'Status', dataIndex: 'status', width: 110, render: statusTag },
    { title: 'Units', dataIndex: 'totalQuantity', align: 'right', render: value => Number(value || 0).toLocaleString('en-IN') },
    { title: 'Net Sales', dataIndex: 'revenue', align: 'right', render: money },
    { title: 'Costed Sales', dataIndex: 'costedRevenue', align: 'right', render: money },
    { title: 'FIFO COGS', dataIndex: 'cost', align: 'right', render: money },
    { title: 'GP', dataIndex: 'grossProfit', align: 'right', render: money },
    { title: 'GP %', dataIndex: 'grossMargin', align: 'right', render: value => `${Number(value || 0).toFixed(1)}%` },
    { title: 'Expenses', dataIndex: 'operatingExpenses', align: 'right', render: money },
    { title: 'Scrap', dataIndex: 'scrapLoss', align: 'right', render: money },
    { title: 'Prod. variance', dataIndex: 'productionVarianceLoss', align: 'right', render: money },
    { title: 'NP', dataIndex: 'netProfit', align: 'right', render: money }
  ]

  const exceptionColumns = [
    {
      title: 'Issue',
      dataIndex: 'title',
      render: (value, row) => (
        <Space direction="vertical" size={0}>
          <Space>{statusTag(row.severity === 'error' ? 'INCOMPLETE' : 'PROVISIONAL')}<Text strong>{value}</Text></Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{row.action}</Text>
        </Space>
      )
    },
    { title: 'Entries', dataIndex: 'entries', width: 90, align: 'right', render: value => value ?? '—' },
    { title: 'Quantity', dataIndex: 'quantity', width: 100, align: 'right', render: value => value ?? '—' },
    { title: 'Amount', dataIndex: 'amount', width: 140, align: 'right', render: money }
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Formal P&L statement" style={{ borderRadius: 12, height: '100%' }}>
            <Table
              rowKey="key"
              loading={loading}
              columns={statementColumns}
              dataSource={statementRows}
              pagination={false}
              size="small"
              showHeader={false}
            />
            {pnlStatement?.note && <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>{pnlStatement.note}</Text>}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Profit bridge" style={{ borderRadius: 12, height: '100%' }}>
            {profitBridge.length ? profitBridge.map(item => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong={item.type === 'total'}>{item.label}</Text>
                <Text
                  strong={item.type === 'total'}
                  style={{ color: item.amount < 0 ? '#cf1322' : item.type === 'total' ? '#1677ff' : '#389e0d' }}
                >
                  {money(item.amount)}
                </Text>
              </div>
            )) : <Empty description="No profit bridge data" />}
          </Card>
        </Col>
      </Row>

      <Card title="Month-by-month P&L" style={{ borderRadius: 12 }}>
        <Table
          rowKey="period"
          loading={loading}
          columns={monthlyColumns}
          dataSource={trends}
          pagination={false}
          size="small"
          scroll={{ x: 1250 }}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card title="Expense breakdown" style={{ borderRadius: 12, height: '100%' }}>
            <Table
              rowKey={row => `${row.categoryType}-${row.categoryId}`}
              loading={loading}
              size="small"
              pagination={false}
              dataSource={expenseBreakdown}
              columns={[
                { title: 'Category', dataIndex: 'categoryName' },
                { title: 'Type', dataIndex: 'categoryType', width: 90, render: value => <Tag>{String(value || '').toUpperCase()}</Tag> },
                { title: 'Amount', dataIndex: 'amount', align: 'right', render: money }
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card title={`Costing and accounting exceptions (${exceptions.length})`} style={{ borderRadius: 12, height: '100%' }}>
            <Table
              rowKey="key"
              loading={loading}
              size="small"
              pagination={false}
              dataSource={exceptions}
              columns={exceptionColumns}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

export default FinancePnLPanel
