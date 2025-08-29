import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Select, Input, InputNumber, Button, Row, Col, message, Spin, 
  AutoComplete, Switch, Divider, Space, Typography, Alert, Collapse 
} from 'antd';
import { PlusOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { client } from '../../Utils/axiosClient';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;

const QuickAddInventoryAdvanced = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState('');
  const [createNewProduct, setCreateNewProduct] = useState(false);
  const [masterData, setMasterData] = useState({});
  const [loadingMaster, setLoadingMaster] = useState({});

  // Load master data for specifications
  const loadMasterData = async (type) => {
    if (masterData[type] || loadingMaster[type]) return;
    
    setLoadingMaster(prev => ({ ...prev, [type]: true }));
    try {
      const response = await client.get(`/inventory/master/${type}`);
      if (response.data.success) {
        setMasterData(prev => ({ ...prev, [type]: response.data.data }));
      }
    } catch (error) {
      console.error(`Error loading ${type} master data:`, error);
      message.error(`Failed to load ${type} options`);
    } finally {
      setLoadingMaster(prev => ({ ...prev, [type]: false }));
    }
  };

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
    setCreateNewProduct(false);
    form.setFieldsValue({ 
      productIdentifier: undefined,
      createNew: false
    });
    
    if (!createNewProduct) {
      searchProducts(type);
    }
  };

  // Handle create new toggle
  const handleCreateNewToggle = (checked) => {
    setCreateNewProduct(checked);
    form.setFieldsValue({ createNew: checked });
    
    if (checked && selectedProductType) {
      // Load master data for specifications
      if (selectedProductType === 'alloy') {
        ['model', 'finish', 'inches', 'pcd', 'width', 'offset', 'holes', 'cb'].forEach(loadMasterData);
      }
    } else if (selectedProductType) {
      searchProducts(selectedProductType);
    }
  };

  // Handle product search
  const handleProductSearch = (value) => {
    if (selectedProductType && value.length > 1 && !createNewProduct) {
      searchProducts(selectedProductType, value);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        productType: values.productType,
        quantity: values.quantity,
        costPerUnit: values.costPerUnit,
        notes: values.notes
      };

      if (createNewProduct) {
        payload.createNew = true;
        payload.productIdentifier = values.productName || 'New Product';
        
        if (selectedProductType === 'alloy') {
          payload.productSpecs = {
            productName: values.productName,
            modelId: values.modelId,
            finishId: values.finishId,
            inchesId: values.inchesId,
            pcdId: values.pcdId,
            widthId: values.widthId,
            offsetId: values.offsetId,
            holesId: values.holesId,
            cbId: values.cbId
          };
        } else if (selectedProductType === 'tyre') {
          payload.productSpecs = {
            brand: values.brand,
            size: values.size,
            pattern: values.pattern,
            prefix: values.prefix,
            inches: values.tyreInches
          };
        }
      } else {
        payload.productIdentifier = values.productIdentifier;
      }

      const response = await client.post('/inventory/quick-add', payload);

      if (response.data.success) {
        message.success(response.data.message);
        form.resetFields();
        setProductOptions([]);
        setSelectedProductType('');
        setCreateNewProduct(false);
      }
    } catch (error) {
      console.error('Error adding inventory:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add inventory';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="text-gray-800 mb-2">Quick Add Inventory</Title>
        <Text className="text-gray-600">
          Add inventory items with product search or create new products with full specifications
        </Text>
      </div>

      <Row justify="center">
        <Col xs={24} sm={22} md={18} lg={16} xl={14}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              size="large"
            >
              {/* Product Type Selection */}
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

              {/* Create New Product Toggle */}
              {selectedProductType && (
                <Form.Item
                  label={
                    <Space>
                      <SettingOutlined />
                      <span>Create New Product</span>
                    </Space>
                  }
                  name="createNew"
                  valuePropName="checked"
                >
                  <Switch
                    onChange={handleCreateNewToggle}
                    checkedChildren="Create New"
                    unCheckedChildren="Search Existing"
                  />
                </Form.Item>
              )}

              {/* Existing Product Search */}
              {selectedProductType && !createNewProduct && (
                <Form.Item
                  label="Product"
                  name="productIdentifier"
                  rules={[{ required: true, message: 'Please select a product' }]}
                >
                  <AutoComplete
                    placeholder={`Search ${selectedProductType}s...`}
                    options={productOptions}
                    onSearch={handleProductSearch}
                    size="large"
                    showSearch
                    notFoundContent={searchLoading ? <Spin size="small" /> : 'No products found'}
                    filterOption={false}
                  />
                </Form.Item>
              )}

              {/* New Product Creation */}
              {createNewProduct && selectedProductType === 'alloy' && (
                <div>
                  <Divider orientation="left">Alloy Specifications</Divider>
                  
                  <Form.Item
                    label="Product Name (Optional)"
                    name="productName"
                    help="If not provided, will be generated from specifications"
                  >
                    <Input placeholder="e.g., Premium Chrome Alloy 15x6.0 4x100" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Model"
                        name="modelId"
                        rules={[{ required: true, message: 'Please select model' }]}
                      >
                        <Select 
                          placeholder="Select model"
                          loading={loadingMaster.model}
                          onFocus={() => loadMasterData('model')}
                        >
                          {(masterData.model || []).map(item => (
                            <Option key={item.id} value={item.id}>
                              {item.model_name || item.modelName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Finish"
                        name="finishId"
                        rules={[{ required: true, message: 'Please select finish' }]}
                      >
                        <Select 
                          placeholder="Select finish"
                          loading={loadingMaster.finish}
                          onFocus={() => loadMasterData('finish')}
                        >
                          {(masterData.finish || []).map(item => (
                            <Option key={item.id} value={item.id}>
                              {item.finish}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="Inches"
                        name="inchesId"
                        rules={[{ required: true, message: 'Please select inches' }]}
                      >
                        <Select 
                          placeholder="Inches"
                          loading={loadingMaster.inches}
                          onFocus={() => loadMasterData('inches')}
                        >
                          {(masterData.inches || []).map(item => (
                            <Option key={item.id} value={item.id}>
                              {item.inches}"
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Width"
                        name="widthId"
                        rules={[{ required: true, message: 'Please select width' }]}
                      >
                        <Select 
                          placeholder="Width"
                          loading={loadingMaster.width}
                          onFocus={() => loadMasterData('width')}
                        >
                          {(masterData.width || []).map(item => (
                            <Option key={item.id} value={item.id}>
                              {item.width}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="PCD"
                        name="pcdId"
                        rules={[{ required: true, message: 'Please select PCD' }]}
                      >
                        <Select 
                          placeholder="PCD"
                          loading={loadingMaster.pcd}
                          onFocus={() => loadMasterData('pcd')}
                        >
                          {(masterData.pcd || []).map(item => (
                            <Option key={item.id} value={item.id}>
                              {item.pcd}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="Offset"
                        name="offsetId"
                        rules={[{ required: true, message: 'Please select offset' }]}
                      >
                        <Select 
                          placeholder="Offset"
                          loading={loadingMaster.offset}
                          onFocus={() => loadMasterData('offset')}
                        >
                          {(masterData.offset || []).map(item => (
                            <Option key={item.id} value={item.id}>
                              {item.offset}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Holes"
                        name="holesId"
                        rules={[{ required: true, message: 'Please select holes' }]}
                      >
                        <Select 
                          placeholder="Holes"
                          loading={loadingMaster.holes}
                          onFocus={() => loadMasterData('holes')}
                        >
                          {(masterData.holes || []).map(item => (
                            <Option key={item.id} value={item.id}>
                              {item.holes}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Center Bore (CB)"
                        name="cbId"
                        rules={[{ required: true, message: 'Please select CB' }]}
                      >
                        <Select 
                          placeholder="CB"
                          loading={loadingMaster.cb}
                          onFocus={() => loadMasterData('cb')}
                        >
                          {(masterData.cb || []).map(item => (
                            <Option key={item.id} value={item.id}>
                              {item.cb}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}

              {/* New Tyre Creation */}
              {createNewProduct && selectedProductType === 'tyre' && (
                <div>
                  <Divider orientation="left">Tyre Specifications</Divider>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Brand"
                        name="brand"
                        rules={[{ required: true, message: 'Please enter brand' }]}
                      >
                        <Input placeholder="e.g., Michelin, Bridgestone" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Size"
                        name="size"
                        rules={[{ required: true, message: 'Please enter size' }]}
                      >
                        <Input placeholder="e.g., 195/65R15" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Pattern"
                        name="pattern"
                        rules={[{ required: true, message: 'Please enter pattern' }]}
                      >
                        <Input placeholder="e.g., Primacy 4, Turanza" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        label="Inches"
                        name="tyreInches"
                        rules={[{ required: true, message: 'Please enter inches' }]}
                      >
                        <InputNumber placeholder="15" min={10} max={30} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        label="Prefix"
                        name="prefix"
                      >
                        <Input placeholder="Optional" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}

              <Divider />

              {/* Quantity and Cost */}
              <Row gutter={16}>
                <Col span={12}>
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
                </Col>
                <Col span={12}>
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
                </Col>
              </Row>

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
                  {createNewProduct ? 'Create Product & Add to Inventory' : 'Add to Inventory'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Help Section */}
      <div className="mt-8">
        <Row justify="center">
          <Col xs={24} sm={22} md={18} lg={16} xl={14}>
            <Collapse ghost>
              <Panel header="💡 Quick Tips" key="tips">
                <Alert
                  type="info"
                  message="Product Creation Tips"
                  description={
                    <div>
                      <p>✓ <strong>Existing Products</strong>: Search by name, model, or specifications</p>
                      <p>✓ <strong>New Alloys</strong>: Provide model, finish, size (inches×width), PCD, offset, holes, and CB</p>
                      <p>✓ <strong>New Tyres</strong>: Provide brand, size (e.g., 195/65R15), pattern, and rim size</p>
                      <p>✓ <strong>Smart Detection</strong>: System prevents duplicate products with same specifications</p>
                      <p>✓ <strong>Auto-naming</strong>: Product names generated automatically from specifications</p>
                    </div>
                  }
                />
              </Panel>
            </Collapse>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default QuickAddInventoryAdvanced;