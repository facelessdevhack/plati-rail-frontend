/**
 * Update Preview Component
 *
 * Shows preview of changes before applying to database
 */

import React, { useState } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  Alert,
  Popconfirm,
  Input,
  Tag,
  Switch
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  SearchOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const UpdatePreview = ({ updates = [], noChange = [], onBack, onExecute, executing, manualMatchCount = 0 }) => {
  const [searchText, setSearchText] = useState('');
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);

  // Calculate stats
  const totalIncrease = updates.filter(u => u.difference > 0).reduce((sum, u) => sum + u.difference, 0);
  const totalDecrease = updates.filter(u => u.difference < 0).reduce((sum, u) => sum + Math.abs(u.difference), 0);
  const productsIncreasing = updates.filter(u => u.difference > 0).length;
  const productsDecreasing = updates.filter(u => u.difference < 0).length;
  const manualMatchUpdates = updates.filter(u => u.isManualMatch).length;

  // Filter data
  const displayData = showOnlyChanges ? updates : [...updates, ...noChange.map(item => ({
    ...item,
    oldStock: item.stock,
    newStock: item.stock,
    difference: 0
  }))];

  const filteredData = searchText
    ? displayData.filter(item =>
        item.productName?.toLowerCase().includes(searchText.toLowerCase())
      )
    : displayData;

  // Sort by absolute difference
  const sortedData = [...filteredData].sort((a, b) =>
    Math.abs(b.difference || 0) - Math.abs(a.difference || 0)
  );

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Product ID',
      dataIndex: 'productId',
      key: 'productId',
      width: 100
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
      render: (name, record) => (
        <Space>
          <Text>{name}</Text>
          {record.isManualMatch && <Tag color="purple">Manual</Tag>}
        </Space>
      )
    },
    {
      title: 'Old Stock',
      dataIndex: 'oldStock',
      key: 'oldStock',
      width: 100,
      align: 'center',
      render: (value) => <Text type="secondary">{value}</Text>
    },
    {
      title: 'New Stock',
      dataIndex: 'newStock',
      key: 'newStock',
      width: 100,
      align: 'center',
      render: (value) => <Text strong>{value}</Text>
    },
    {
      title: 'Difference',
      dataIndex: 'difference',
      key: 'difference',
      width: 120,
      align: 'center',
      sorter: (a, b) => Math.abs(b.difference || 0) - Math.abs(a.difference || 0),
      render: (diff) => {
        if (diff === 0) {
          return <Tag>No Change</Tag>;
        }
        return (
          <Tag color={diff > 0 ? 'green' : 'red'} style={{ fontWeight: 'bold' }}>
            {diff > 0 ? '+' : ''}{diff}
          </Tag>
        );
      }
    }
  ];

  return (
    <div>
      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={manualMatchUpdates > 0 ? 4 : 6}>
          <Card size="small">
            <Statistic
              title="Products to Update"
              value={updates.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        {manualMatchUpdates > 0 && (
          <Col xs={12} sm={4}>
            <Card size="small">
              <Statistic
                title="Manual Matches"
                value={manualMatchUpdates}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        )}
        <Col xs={12} sm={manualMatchUpdates > 0 ? 4 : 6}>
          <Card size="small">
            <Statistic
              title="Stock Increase"
              value={totalIncrease}
              valueStyle={{ color: '#52c41a' }}
              prefix="+"
              suffix={<Text type="secondary" style={{ fontSize: 12 }}>({productsIncreasing} products)</Text>}
            />
          </Card>
        </Col>
        <Col xs={12} sm={manualMatchUpdates > 0 ? 4 : 6}>
          <Card size="small">
            <Statistic
              title="Stock Decrease"
              value={totalDecrease}
              valueStyle={{ color: '#ff4d4f' }}
              prefix="-"
              suffix={<Text type="secondary" style={{ fontSize: 12 }}>({productsDecreasing} products)</Text>}
            />
          </Card>
        </Col>
        <Col xs={12} sm={manualMatchUpdates > 0 ? 4 : 6}>
          <Card size="small">
            <Statistic
              title="No Change"
              value={noChange.length}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Warning */}
      <Alert
        type="warning"
        message="Review Before Applying"
        description="Please review all changes carefully before applying. This action will update the database and cannot be undone."
        icon={<WarningOutlined />}
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Controls */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Input
            placeholder="Search products..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Space>
            <Text type="secondary">Show only changes:</Text>
            <Switch
              checked={showOnlyChanges}
              onChange={setShowOnlyChanges}
            />
          </Space>
        </Space>
        <Text type="secondary">
          Showing {sortedData.length} of {displayData.length} products
        </Text>
      </div>

      {/* Table */}
      <Table
        dataSource={sortedData}
        columns={columns}
        rowKey={(record) => record.productId}
        size="small"
        scroll={{ y: 400 }}
        pagination={{
          pageSize: 100,
          showSizeChanger: true,
          pageSizeOptions: ['50', '100', '200', '500'],
          showTotal: (total) => `Total: ${total}`
        }}
        rowClassName={(record) => {
          if (record.isManualMatch) return 'row-manual';
          if (record.difference > 0) return 'row-increase';
          if (record.difference < 0) return 'row-decrease';
          return '';
        }}
      />

      {/* Actions */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Back to Review
        </Button>
        <Popconfirm
          title="Apply Updates"
          description={`Are you sure you want to update ${updates.length} products${manualMatchUpdates > 0 ? ` (including ${manualMatchUpdates} manual matches)` : ''}?`}
          onConfirm={onExecute}
          okText="Yes, Apply Updates"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={executing}
            disabled={updates.length === 0}
          >
            Apply {updates.length} Updates
          </Button>
        </Popconfirm>
      </div>

      <style>{`
        .row-increase {
          background-color: #f6ffed;
        }
        .row-decrease {
          background-color: #fff2f0;
        }
        .row-manual {
          background-color: #f9f0ff;
        }
      `}</style>
    </div>
  );
};

export default UpdatePreview;
