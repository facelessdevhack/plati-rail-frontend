import React from 'react';
import { Row, Card } from 'antd';
import { Link } from 'react-router-dom';
import {
  AppstoreOutlined,
  CarOutlined,
  ToolOutlined,
  FileProtectOutlined,
  DollarCircleOutlined
} from '@ant-design/icons';

const CreateOrderView = () => {
  const orderTypes = [
    {
      id: 1,
      label: 'Create Alloys Order',
      link: '/sales-create-order-alloys',
      icon: <AppstoreOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      description: 'Add new alloy wheels order'
    },
    {
      id: 2,
      label: 'Create Tyres Order',
      link: '/sales-create-order-tyres',
      icon: <CarOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      description: 'Add new tyres order'
    },
    {
      id: 3,
      label: 'Create Caps Order',
      link: '/sales-create-order-caps',
      icon: <ToolOutlined style={{ fontSize: '48px', color: '#faad14' }} />,
      description: 'Add new caps order'
    },
    {
      id: 4,
      label: 'Create PPF Order',
      link: '/sales-create-order-ppf',
      icon: <FileProtectOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
      description: 'Add new PPF order'
    },
    {
      id: 5,
      label: 'Add Charges Entry',
      link: '/sales-add-charges',
      icon: <DollarCircleOutlined style={{ fontSize: '48px', color: '#eb2f96' }} />,
      description: 'Add charges to dealer'
    }
  ];

  return (
    <div className="w-full h-full p-6 bg-gray-50">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Create New Order</h2>
        <p className="mt-2 text-gray-600">
          Select order type to create a new entry for dealers
        </p>
      </div>

      <Row gutter={[24, 24]}>
        {orderTypes.map((orderType) => (
          <div key={orderType.id} className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
            <Link to={orderType.link}>
              <Card
                hoverable
                className="h-full transition-all duration-300 hover:shadow-xl"
                bodyStyle={{ padding: '32px', textAlign: 'center' }}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-4">
                    {orderType.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {orderType.label}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {orderType.description}
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </Row>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-900">📌 Information</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Create orders for dealers based on product type</li>
          <li>System will automatically check stock availability</li>
          <li>Orders will be routed based on stock status</li>
          <li>All orders require sales coordinator approval before final dispatch</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateOrderView;
