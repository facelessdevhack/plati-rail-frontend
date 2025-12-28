import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Tag,
  Space,
  message,
  Switch,
  Tooltip,
  Empty,
  Typography,
  Tabs,
  InputNumber,
  DatePicker
} from 'antd';
import {
  DollarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  BankOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CostCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [form] = Form.useForm();

  const fetchCategories = useCallback(async (type = null) => {
    setLoading(true);
    try {
      let url = '/cost-management/categories';
      if (type && type !== 'all') {
        url += `?type=${type}`;
      }
      const response = await client.get(url);
      setCategories(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch cost categories');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(activeTab === 'all' ? null : activeTab);
  }, [fetchCategories, activeTab]);

  const handleCreateCategory = async (values) => {
    try {
      const payload = {
        categoryName: values.categoryName,
        categoryCode: values.categoryCode,
        categoryType: values.categoryType,
        calculationMethod: values.calculationMethod,
        defaultValue: values.defaultValue || 0,
        unitLabel: values.unitLabel,
        description: values.description
      };

      if (values.effectiveDates && values.effectiveDates[0]) {
        payload.effectiveFrom = values.effectiveDates[0].format('YYYY-MM-DD');
      }
      if (values.effectiveDates && values.effectiveDates[1]) {
        payload.effectiveTo = values.effectiveDates[1].format('YYYY-MM-DD');
      }

      await client.post('/cost-management/categories', payload);
      message.success('Cost category created successfully');
      setModalVisible(false);
      form.resetFields();
      fetchCategories(activeTab === 'all' ? null : activeTab);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create category');
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async (values) => {
    try {
      const payload = {
        categoryName: values.categoryName,
        categoryCode: values.categoryCode,
        categoryType: values.categoryType,
        calculationMethod: values.calculationMethod,
        defaultValue: values.defaultValue || 0,
        unitLabel: values.unitLabel,
        description: values.description,
        isActive: values.isActive
      };

      if (values.effectiveDates && values.effectiveDates[0]) {
        payload.effectiveFrom = values.effectiveDates[0].format('YYYY-MM-DD');
      } else {
        payload.effectiveFrom = null;
      }
      if (values.effectiveDates && values.effectiveDates[1]) {
        payload.effectiveTo = values.effectiveDates[1].format('YYYY-MM-DD');
      } else {
        payload.effectiveTo = null;
      }

      await client.put(`/cost-management/categories/${editingCategory.id}`, payload);
      message.success('Cost category updated successfully');
      setModalVisible(false);
      setEditingCategory(null);
      form.resetFields();
      fetchCategories(activeTab === 'all' ? null : activeTab);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update category');
      console.error('Error updating category:', error);
    }
  };

  const handleSubmit = (values) => {
    if (editingCategory) {
      handleUpdateCategory(values);
    } else {
      handleCreateCategory(values);
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      await client.patch(`/cost-management/categories/${record.id}/toggle`);
      message.success(`Category ${record.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchCategories(activeTab === 'all' ? null : activeTab);
    } catch (error) {
      message.error('Failed to toggle category status');
      console.error('Error toggling status:', error);
    }
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: 'Delete Cost Category',
      content: `Are you sure you want to delete "${record.categoryName}"? This action cannot be undone if the category is not in use.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await client.delete(`/cost-management/categories/${record.id}`);
          message.success('Category deleted successfully');
          fetchCategories(activeTab === 'all' ? null : activeTab);
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to delete category');
          console.error('Error deleting category:', error);
        }
      }
    });
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (record) => {
    setEditingCategory(record);
    const effectiveDates = [];
    if (record.effectiveFrom) {
      effectiveDates[0] = dayjs(record.effectiveFrom);
    }
    if (record.effectiveTo) {
      effectiveDates[1] = dayjs(record.effectiveTo);
    }

    form.setFieldsValue({
      categoryName: record.categoryName,
      categoryCode: record.categoryCode,
      categoryType: record.categoryType,
      calculationMethod: record.calculationMethod,
      defaultValue: record.defaultValue,
      unitLabel: record.unitLabel,
      description: record.description,
      isActive: record.isActive,
      effectiveDates: effectiveDates.length > 0 ? effectiveDates : undefined
    });
    setModalVisible(true);
  };

  const getCategoryTypeColor = (type) => {
    const colors = {
      production: 'green',
      overhead: 'blue',
      finance: 'orange'
    };
    return colors[type] || 'default';
  };

  const getCategoryTypeIcon = (type) => {
    const icons = {
      production: <ToolOutlined />,
      overhead: <SettingOutlined />,
      finance: <BankOutlined />
    };
    return icons[type] || <DollarOutlined />;
  };

  const getCalculationMethodLabel = (method) => {
    const labels = {
      per_unit: 'Per Unit',
      per_hour: 'Per Hour',
      monthly: 'Monthly',
      yearly: 'Yearly',
      fixed: 'Fixed'
    };
    return labels[method] || method;
  };

  const columns = [
    {
      title: 'Category',
      key: 'category',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            {getCategoryTypeIcon(record.categoryType)}
            <span style={{ marginLeft: '8px' }}>{record.categoryName}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Code: {record.categoryCode}
          </div>
          {record.description && (
            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
      width: 280
    },
    {
      title: 'Type',
      dataIndex: 'categoryType',
      key: 'categoryType',
      render: (type) => (
        <Tag color={getCategoryTypeColor(type)}>
          {type?.toUpperCase()}
        </Tag>
      ),
      width: 120
    },
    {
      title: 'Calculation',
      key: 'calculation',
      render: (record) => (
        <div>
          <div>{getCalculationMethodLabel(record.calculationMethod)}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Default: {record.defaultValue || 0} {record.unitLabel}
          </div>
        </div>
      ),
      width: 150
    },
    {
      title: 'Effective Period',
      key: 'effectivePeriod',
      render: (record) => {
        if (!record.effectiveFrom && !record.effectiveTo) {
          return <Text type="secondary">Always Active</Text>;
        }
        return (
          <div style={{ fontSize: '12px' }}>
            {record.effectiveFrom && (
              <div>From: {dayjs(record.effectiveFrom).format('DD MMM YYYY')}</div>
            )}
            {record.effectiveTo && (
              <div>To: {dayjs(record.effectiveTo).format('DD MMM YYYY')}</div>
            )}
          </div>
        );
      },
      width: 150
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Tooltip title="Edit Category">
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Category">
            <Button
              type="default"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
      width: 120
    }
  ];

  const tabItems = [
    { key: 'all', label: 'All Categories' },
    { key: 'production', label: 'Production', icon: <ToolOutlined /> },
    { key: 'overhead', label: 'Overhead', icon: <SettingOutlined /> },
    { key: 'finance', label: 'Finance', icon: <BankOutlined /> }
  ];

  // Calculate stats
  const stats = {
    total: categories.length,
    active: categories.filter(c => c.isActive).length,
    production: categories.filter(c => c.categoryType === 'production').length,
    overhead: categories.filter(c => c.categoryType === 'overhead').length,
    finance: categories.filter(c => c.categoryType === 'finance').length
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <DollarOutlined style={{ marginRight: '12px' }} />
              Cost Categories
            </Title>
            <Text type="secondary">
              Manage production, overhead, and finance cost categories
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchCategories(activeTab === 'all' ? null : activeTab)}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
              >
                Add Category
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div>
              <div style={{ color: '#666' }}>Total</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{stats.active}</div>
              <div style={{ color: '#666' }}>Active</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'green' }}>{stats.production}</div>
              <div style={{ color: '#666' }}>Production</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'blue' }}>{stats.overhead}</div>
              <div style={{ color: '#666' }}>Overhead</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'orange' }}>{stats.finance}</div>
              <div style={{ color: '#666' }}>Finance</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Categories Table */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: '16px' }}
        />
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`
          }}
          locale={{
            emptyText: <Empty description="No cost categories found" />
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingCategory ? 'Edit Cost Category' : 'Create Cost Category'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCategory(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryName"
                label="Category Name"
                rules={[{ required: true, message: 'Please enter category name' }]}
              >
                <Input placeholder="e.g., Raw Material Cost" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryCode"
                label="Category Code"
                rules={[{ required: true, message: 'Please enter category code' }]}
              >
                <Input
                  placeholder="e.g., RAW_MATERIAL"
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryType"
                label="Category Type"
                rules={[{ required: true, message: 'Please select category type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="production">
                    <ToolOutlined /> Production
                  </Option>
                  <Option value="overhead">
                    <SettingOutlined /> Overhead
                  </Option>
                  <Option value="finance">
                    <BankOutlined /> Finance
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="calculationMethod"
                label="Calculation Method"
                rules={[{ required: true, message: 'Please select calculation method' }]}
              >
                <Select placeholder="Select method">
                  <Option value="per_unit">Per Unit</Option>
                  <Option value="per_hour">Per Hour</Option>
                  <Option value="monthly">Monthly</Option>
                  <Option value="yearly">Yearly</Option>
                  <Option value="fixed">Fixed</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="defaultValue"
                label="Default Value"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unitLabel"
                label="Unit Label"
              >
                <Input placeholder="e.g., ₹/unit, ₹/hour, ₹/month" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="effectiveDates"
            label="Effective Period (Optional - for time-bound costs like loans)"
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter category description" />
          </Form.Item>

          {editingCategory && (
            <Form.Item
              name="isActive"
              label="Status"
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CostCategoriesPage;
