import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Input, InputNumber, Button, Row, Col, message, Spin, AutoComplete } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';

const { TextArea } = Input;
const { Option } = Select;

const QuickAddInventory = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState('');

  // Search products based on type and query
  const searchProducts = async (productType, searchValue = '') => {
    if (!productType) return;

    setSearchLoading(true);
    try {
      const response = await client.get(`/inventory/products/${productType}`, {
        params: { search: searchValue, limit: 50 }
      });

      if (response.data.success) {
        const options = response.data.data.map(product => ({
          value: product.id.toString(),
          label: productType === 'alloy' 
            ? `${product.name} - ${product.size} (${product.color})`
            : `${product.name} - ${product.size} (${product.type})`,
          product: product
        }));
        setProductOptions(options);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      message.error('Failed to load products');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle product type change
  const handleProductTypeChange = (type) => {
    setSelectedProductType(type);
    setProductOptions([]);
    form.setFieldsValue({ productIdentifier: undefined });
    searchProducts(type);
  };

  // Handle product search
  const handleProductSearch = (value) => {
    if (selectedProductType && value.length > 1) {
      searchProducts(selectedProductType, value);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await client.post('/inventory/quick-add', {
        productType: values.productType,
        productIdentifier: values.productIdentifier,
        quantity: values.quantity,
        costPerUnit: values.costPerUnit,
        notes: values.notes
      });

      if (response.data.success) {
        message.success(response.data.message);
        form.resetFields();
        setProductOptions([]);
        setSelectedProductType('');
      }
    } catch (error) {
      console.error('Error adding inventory:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add inventory';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load initial products for selected type
  useEffect(() => {
    if (selectedProductType) {
      searchProducts(selectedProductType);
    }
  }, [selectedProductType]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Quick Add Inventory</h2>
        <p className="text-gray-600">
          Easily add inventory items to your warehouse with smart product lookup
        </p>
      </div>

      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                label="Product Type"
                name="productType"
                rules={[{ required: true, message: 'Please select product type' }]}
              >
                <Select
                  placeholder="Select product type"
                  onChange={handleProductTypeChange}
                  size="large"
                >
                  <Option value="alloy">Alloy Wheels</Option>
                  <Option value="tyre">Tyres</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Product"
                name="productIdentifier"
                rules={[{ required: true, message: 'Please select a product' }]}
              >
                <AutoComplete
                  placeholder={selectedProductType ? `Search ${selectedProductType}s...` : "Select product type first"}
                  options={productOptions}
                  onSearch={handleProductSearch}
                  disabled={!selectedProductType}
                  size="large"
                  showSearch
                  notFoundContent={searchLoading ? <Spin size="small" /> : 'No products found'}
                  filterOption={false}
                />
              </Form.Item>

              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[
                  { required: true, message: 'Please enter quantity' },
                  { type: 'number', min: 1, message: 'Quantity must be at least 1' }
                ]}
              >
                <InputNumber
                  placeholder="Enter quantity"
                  style={{ width: '100%' }}
                  min={1}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Cost Per Unit"
                name="costPerUnit"
                help="Optional - will use product's default price if not provided"
              >
                <InputNumber
                  placeholder="Enter cost per unit"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  size="large"
                  prefix="₹"
                />
              </Form.Item>

              <Form.Item
                label="Notes"
                name="notes"
              >
                <TextArea
                  placeholder="Optional notes (e.g., supplier, batch number, etc.)"
                  rows={3}
                  size="large"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<PlusOutlined />}
                  size="large"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Add to Inventory
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <div className="mt-8 text-center">
        <div className="text-sm text-gray-500">
          <p>✓ Smart product search with auto-complete</p>
          <p>✓ Automatically adds to main warehouse location</p>
          <p>✓ Full audit trail and movement logging</p>
        </div>
      </div>
    </div>
  );
};

export default QuickAddInventory;