/**
 * Update Summary Component
 *
 * Shows results after updates have been applied
 */

import React from 'react';
import {
  Result,
  Button,
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Typography,
  Tag,
  Space
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const UpdateSummary = ({ results, onReset }) => {
  if (!results) {
    return (
      <Result
        status="error"
        title="No Results"
        subTitle="Something went wrong. Please try again."
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={onReset}>
            Start Over
          </Button>
        }
      />
    );
  }

  const { successCount, errorCount, totalProcessed, errors = [] } = results;
  const hasErrors = errorCount > 0;

  // Error table columns
  const errorColumns = [
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
      ellipsis: true
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      render: (error) => <Text type="danger">{error}</Text>
    }
  ];

  return (
    <div>
      <Result
        status={hasErrors ? 'warning' : 'success'}
        icon={hasErrors ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
        title={hasErrors ? 'Update Completed with Errors' : 'Update Completed Successfully!'}
        subTitle={`${successCount} products updated successfully${hasErrors ? `, ${errorCount} failed` : ''}`}
      />

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Processed"
              value={totalProcessed}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Successful"
              value={successCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Failed"
              value={errorCount}
              valueStyle={{ color: errorCount > 0 ? '#ff4d4f' : '#8c8c8c' }}
              prefix={errorCount > 0 ? <CloseCircleOutlined /> : null}
            />
          </Card>
        </Col>
      </Row>

      {/* Error details if any */}
      {hasErrors && errors.length > 0 && (
        <Card title="Error Details" style={{ marginBottom: 24 }}>
          <Table
            dataSource={errors}
            columns={errorColumns}
            rowKey={(record) => record.productId}
            size="small"
            pagination={false}
          />
        </Card>
      )}

      {/* Summary */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5}>Summary</Title>
        <Space direction="vertical" size={8}>
          <Text>
            <Tag color="green">alloy_master.in_house_stock</Tag> Updated for {successCount} products
          </Text>
          <Text>
            <Tag color="blue">internal_inventory</Tag> Synchronized with alloy_master
          </Text>
          <Text>
            <Tag color="purple">internal_inventory_movements</Tag> Logged all changes
          </Text>
        </Space>
      </Card>

      {/* Actions */}
      <div style={{ textAlign: 'center' }}>
        <Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={onReset}>
            Upload Another File
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default UpdateSummary;
