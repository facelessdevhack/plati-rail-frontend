import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  message,
  Space,
  Tag,
  Spin,
  Alert,
  Divider,
  Row,
  Col,
  Card,
  Typography
} from 'antd';
import {
  SwapOutlined,
  ArrowRightOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const TransferInventoryModal = ({
  visible,
  onCancel,
  onSuccess,
  sourceLocationId,
  sourceLocationName,
  inventoryItems = [],
  allLocations = []
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  // Fetch all locations if not provided
  const fetchLocations = useCallback(async () => {
    if (allLocations.length > 0) {
      setLocations(allLocations.filter(loc => loc.id !== parseInt(sourceLocationId)));
      return;
    }

    setLocationsLoading(true);
    try {
      const response = await client.get('/inventory/internal/locations');
      const locs = response.data.data || [];
      setLocations(locs.filter(loc => loc.id !== parseInt(sourceLocationId) && loc.isActive));
    } catch (error) {
      console.error('Error fetching locations:', error);
      message.error('Failed to fetch locations');
    } finally {
      setLocationsLoading(false);
    }
  }, [sourceLocationId, allLocations]);

  useEffect(() => {
    if (visible) {
      fetchLocations();
    }
  }, [visible, fetchLocations]);

  const handleItemChange = (itemId) => {
    const item = inventoryItems.find(i => i.id === itemId);
    setSelectedItem(item);
    // Set max quantity based on available
    form.setFieldValue('quantity', 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        productType: selectedItem.productType,
        productId: selectedItem.productId,
        fromLocationId: parseInt(sourceLocationId),
        toLocationId: values.toLocationId,
        quantity: values.quantity,
        fromAreaId: selectedItem.areaId || null,
        fromPositionId: selectedItem.positionId || null,
        toAreaId: values.toAreaId || null,
        toPositionId: values.toPositionId || null,
        notes: values.notes || null
      };

      await client.post('/inventory/internal/transfer', payload);

      message.success(`Successfully transferred ${values.quantity} items`);
      form.resetFields();
      setSelectedItem(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error transferring inventory:', error);
      message.error(error.response?.data?.message || 'Failed to transfer inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedItem(null);
    onCancel?.();
  };

  // Get destination location areas
  const getDestinationAreas = () => {
    const toLocationId = form.getFieldValue('toLocationId');
    if (!toLocationId) return [];
    const loc = locations.find(l => l.id === toLocationId);
    return loc?.areas || [];
  };

  // Format inventory item label
  const formatItemLabel = (item) => {
    return (
      <span>
        <Tag color={item.productType === 'alloy' ? 'blue' : 'green'} style={{ marginRight: '8px' }}>
          {item.productType?.toUpperCase()}
        </Tag>
        #{item.productId}
        <Text type="secondary" style={{ marginLeft: '8px' }}>
          (Available: {item.availableQuantity})
        </Text>
      </span>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <SwapOutlined />
          <span>Transfer Inventory from {sourceLocationName}</span>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Transfer"
      okButtonProps={{ disabled: !selectedItem }}
      width={650}
      destroyOnClose
    >
      <Alert
        message="Transfer stock between locations"
        description="Select an item from the current location's inventory and choose the destination location. The transfer will update stock levels in both locations."
        type="info"
        showIcon
        icon={<SwapOutlined />}
        style={{ marginBottom: '16px' }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          quantity: 1
        }}
      >
        {/* Source Item Selection */}
        <Card size="small" title="Select Item to Transfer" style={{ marginBottom: '16px' }}>
          <Form.Item
            name="inventoryItemId"
            label="Inventory Item"
            rules={[{ required: true, message: 'Please select an item to transfer' }]}
          >
            <Select
              showSearch
              placeholder="Select an inventory item"
              onChange={handleItemChange}
              optionLabelProp="label"
              filterOption={(input, option) =>
                option?.searchtext?.toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={inventoryItems.length === 0 ? 'No items in this location' : 'No matching items'}
            >
              {inventoryItems
                .filter(item => item.availableQuantity > 0)
                .map(item => (
                  <Option
                    key={item.id}
                    value={item.id}
                    label={`${item.productType} #${item.productId}`}
                    searchtext={`${item.productType} ${item.productId}`}
                  >
                    {formatItemLabel(item)}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          {selectedItem && (
            <Row gutter={16}>
              <Col span={8}>
                <Text type="secondary">Current Quantity:</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                  {selectedItem.quantity}
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary">Reserved:</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                  {selectedItem.reservedQuantity || 0}
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary">Available to Transfer:</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                  {selectedItem.availableQuantity}
                </div>
              </Col>
            </Row>
          )}
        </Card>

        {/* Quantity */}
        <Form.Item
          name="quantity"
          label="Quantity to Transfer"
          rules={[
            { required: true, message: 'Please enter quantity' },
            {
              type: 'number',
              min: 1,
              max: selectedItem?.availableQuantity || 1,
              message: `Quantity must be between 1 and ${selectedItem?.availableQuantity || 1}`
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={selectedItem?.availableQuantity || 1}
            placeholder="Enter quantity"
            addonAfter="units"
            disabled={!selectedItem}
          />
        </Form.Item>

        <Divider>
          <ArrowRightOutlined /> Destination
        </Divider>

        {/* Destination Location */}
        <Card size="small" title="Destination Location" style={{ marginBottom: '16px' }}>
          <Form.Item
            name="toLocationId"
            label="Location"
            rules={[{ required: true, message: 'Please select destination location' }]}
          >
            <Select
              showSearch
              placeholder={locationsLoading ? 'Loading locations...' : 'Select destination location'}
              loading={locationsLoading}
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={locationsLoading ? <Spin size="small" /> : 'No other locations available'}
            >
              {locations.map(loc => (
                <Option key={loc.id} value={loc.id}>
                  <EnvironmentOutlined style={{ marginRight: '8px' }} />
                  {loc.name}
                  <Tag color={loc.locationType === 'warehouse' ? 'blue' : loc.locationType === 'production' ? 'green' : 'orange'} style={{ marginLeft: '8px' }}>
                    {loc.locationType}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="toAreaId"
                label="Storage Area (Optional)"
              >
                <Select
                  allowClear
                  placeholder="Select area"
                  disabled={!form.getFieldValue('toLocationId') || getDestinationAreas().length === 0}
                >
                  {getDestinationAreas().map(area => (
                    <Option key={area.id} value={area.id}>
                      {area.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="toPositionId"
                label="Position (Optional)"
              >
                <Select
                  allowClear
                  placeholder="Select position"
                  disabled
                >
                  {/* Positions would be populated based on selected area */}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Form.Item
          name="notes"
          label="Transfer Notes (Optional)"
        >
          <TextArea
            rows={2}
            placeholder="Add any notes about this transfer..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TransferInventoryModal;
