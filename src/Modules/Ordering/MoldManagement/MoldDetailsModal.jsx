import React, { useState, useEffect } from 'react'
import {
  Modal,
  Descriptions,
  Tag,
  Progress,
  Tabs,
  Table,
  Timeline,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  Empty,
  Spin
} from 'antd'
import {
  ToolOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  HistoryOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  getDispatchHistory,
  getProductionLogs,
  getMaintenanceHistory
} from '../../../redux/api/moldManagementAPI'

const { TabPane } = Tabs
const { Text, Title } = Typography

const MoldDetailsModal = ({ visible, onClose, mold }) => {
  const dispatch = useDispatch()
  const { dispatchHistory, productionLogs, maintenanceHistory, loading } = useSelector(
    (state) => state.moldManagement
  )

  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (visible && mold) {
      loadHistory()
    }
  }, [visible, mold])

  const loadHistory = async () => {
    if (!mold?.id) return
    try {
      await Promise.all([
        dispatch(getDispatchHistory({ moldId: mold.id })).unwrap(),
        dispatch(getProductionLogs({ moldId: mold.id })).unwrap(),
        dispatch(getMaintenanceHistory({ moldId: mold.id })).unwrap()
      ])
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      in_house: 'green',
      with_vendor: 'blue',
      under_maintenance: 'orange',
      retired: 'gray',
      damaged: 'red'
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      in_house: 'In House',
      with_vendor: 'With Vendor',
      under_maintenance: 'Under Maintenance',
      retired: 'Retired',
      damaged: 'Damaged'
    }
    return labels[status] || status
  }

  const getConditionColor = (condition) => {
    const colors = {
      excellent: 'green',
      good: 'blue',
      fair: 'orange',
      needs_repair: 'volcano',
      damaged: 'red'
    }
    return colors[condition] || 'default'
  }

  const getLifeProgressColor = (percentage) => {
    if (percentage > 60) return '#52c41a'
    if (percentage > 30) return '#faad14'
    return '#ff4d4f'
  }

  const dispatchColumns = [
    {
      title: 'Vendor',
      dataIndex: 'vendorName',
      key: 'vendorName'
    },
    {
      title: 'Dispatch Date',
      dataIndex: 'dispatchDate',
      key: 'dispatchDate',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-')
    },
    {
      title: 'Return Date',
      dataIndex: 'actualReturnDate',
      key: 'actualReturnDate',
      render: (date) => (date ? new Date(date).toLocaleDateString() : 'Not Returned')
    },
    {
      title: 'Cycles Used',
      dataIndex: 'cyclesUsedAtVendor',
      key: 'cyclesUsedAtVendor',
      render: (val) => val || '-'
    },
    {
      title: 'Quantity Produced',
      dataIndex: 'quantityProducedAtVendor',
      key: 'quantityProducedAtVendor',
      render: (val) => (val || 0).toLocaleString()
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'returned' ? 'green' : 'blue'}>
          {status?.toUpperCase() || 'N/A'}
        </Tag>
      )
    }
  ]

  const productionColumns = [
    {
      title: 'Date',
      dataIndex: 'productionDate',
      key: 'productionDate',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-')
    },
    {
      title: 'Quantity',
      dataIndex: 'quantityProduced',
      key: 'quantityProduced',
      render: (val) => (val || 0).toLocaleString()
    },
    {
      title: 'Cycles Used',
      dataIndex: 'cyclesUsed',
      key: 'cyclesUsed'
    },
    {
      title: 'Good Qty',
      dataIndex: 'goodQuantity',
      key: 'goodQuantity',
      render: (val) => <Text type="success">{(val || 0).toLocaleString()}</Text>
    },
    {
      title: 'Rejected Qty',
      dataIndex: 'rejectedQuantity',
      key: 'rejectedQuantity',
      render: (val) => <Text type="danger">{(val || 0).toLocaleString()}</Text>
    },
    {
      title: 'Vendor',
      dataIndex: 'vendorName',
      key: 'vendorName',
      render: (val) => val || 'In House'
    }
  ]

  const maintenanceColumns = [
    {
      title: 'Type',
      dataIndex: 'maintenanceType',
      key: 'maintenanceType',
      render: (type) => <Tag color="orange">{type?.toUpperCase() || 'N/A'}</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'maintenanceDate',
      key: 'maintenanceDate',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-')
    },
    {
      title: 'Completed',
      dataIndex: 'completedDate',
      key: 'completedDate',
      render: (date) => (date ? new Date(date).toLocaleDateString() : 'In Progress')
    },
    {
      title: 'Cost',
      dataIndex: 'maintenanceCost',
      key: 'maintenanceCost',
      render: (val) => (val ? `₹${val.toLocaleString()}` : '-')
    },
    {
      title: 'Life Added',
      dataIndex: 'lifeCyclesAdded',
      key: 'lifeCyclesAdded',
      render: (val) => (val ? <Text type="success">+{val.toLocaleString()}</Text> : '-')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status?.toUpperCase() || 'N/A'}
        </Tag>
      )
    }
  ]

  if (!mold) return null

  return (
    <Modal
      title={
        <span>
          <ToolOutlined className="mr-2" />
          Mold Details: {mold.moldCode}
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Overview Tab */}
          <TabPane
            tab={
              <span>
                <ToolOutlined /> Overview
              </span>
            }
            key="overview"
          >
            <Row gutter={16} className="mb-4">
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Life Remaining"
                    value={mold.lifePercentage || 0}
                    suffix="%"
                    valueStyle={{ color: getLifeProgressColor(mold.lifePercentage) }}
                  />
                  <Progress
                    percent={mold.lifePercentage || 0}
                    size="small"
                    strokeColor={getLifeProgressColor(mold.lifePercentage)}
                    showInfo={false}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Produced"
                    value={mold.totalProducedQuantity || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Remaining Cycles"
                    value={mold.remainingLifeCycles || 0}
                    suffix={`/ ${mold.totalLifeCycles || 0}`}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Used Cycles"
                    value={mold.usedLifeCycles || 0}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mold Code">{mold.moldCode}</Descriptions.Item>
              <Descriptions.Item label="Model">{mold.modelName || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Type">{mold.moldType?.replace('_', ' ').toUpperCase() || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Size">{mold.size ? `${mold.size}"` : 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(mold.status)}>{getStatusLabel(mold.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Condition">
                <Tag color={getConditionColor(mold.condition)}>
                  {mold.condition?.replace('_', ' ').toUpperCase() || 'N/A'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Current Vendor">
                {mold.vendorName || 'None'}
              </Descriptions.Item>
              <Descriptions.Item label="Dispatched At">
                {mold.dispatchedToVendorAt
                  ? new Date(mold.dispatchedToVendorAt).toLocaleDateString()
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Purchase Date">
                {mold.purchaseDate ? new Date(mold.purchaseDate).toLocaleDateString() : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Purchase Cost">
                {mold.purchaseCost ? `₹${mold.purchaseCost.toLocaleString()}` : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Warranty Expiry">
                {mold.warrantyExpiryDate
                  ? new Date(mold.warrantyExpiryDate).toLocaleDateString()
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {mold.createdAt ? new Date(mold.createdAt).toLocaleDateString() : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>
                {mold.notes || 'No notes'}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>

          {/* Dispatch History Tab */}
          <TabPane
            tab={
              <span>
                <ShopOutlined /> Dispatch History
              </span>
            }
            key="dispatch"
          >
            {dispatchHistory.length > 0 ? (
              <Table
                columns={dispatchColumns}
                dataSource={dispatchHistory}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            ) : (
              <Empty description="No dispatch history" />
            )}
          </TabPane>

          {/* Production History Tab */}
          <TabPane
            tab={
              <span>
                <HistoryOutlined /> Production History
              </span>
            }
            key="production"
          >
            {productionLogs.length > 0 ? (
              <Table
                columns={productionColumns}
                dataSource={productionLogs}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            ) : (
              <Empty description="No production logs" />
            )}
          </TabPane>

          {/* Maintenance History Tab */}
          <TabPane
            tab={
              <span>
                <SettingOutlined /> Maintenance History
              </span>
            }
            key="maintenance"
          >
            {maintenanceHistory.length > 0 ? (
              <Table
                columns={maintenanceColumns}
                dataSource={maintenanceHistory}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            ) : (
              <Empty description="No maintenance records" />
            )}
          </TabPane>
        </Tabs>
      </Spin>
    </Modal>
  )
}

export default MoldDetailsModal
