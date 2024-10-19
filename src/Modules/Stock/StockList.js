import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Space, Tag, Flex, Segmented } from "antd";
import CustomTable from "../../Core/Components/CustomTable";
import { useDispatch, useSelector } from "react-redux";
import { getAllAlloys } from "../../redux/api/stockAPI";

const StockList = () => {
  const [activeTab, setActiveTab] = useState(1);
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { allAlloys } = useSelector((state) => state.stockDetails);

  useEffect(() => {
    dispatch(getAllAlloys({ page: 1 }));
  }, [activeTab]);

  const expandedData = [
    {
      title: "Model",
      dataIndex: "modelName",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "CB",
      dataIndex: "cb",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "Finish",
      dataIndex: "finish",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "In House Stock",
      dataIndex: "inHouseStock",
      render: (text) => <div>{text} pcs</div>,
    },
  ];

  const handleTabContentRender = () => {
    switch (activeTab) {
      case 1:
        return (
          <CustomTable
            titleOnTop={false}
            position="bottomRight"
            data={allAlloys}
            expandedData={expandedData}
            columns={columns}
            title="All Stock List"
          />
        );
      case 2:
        return (
          <CustomTable
            titleOnTop={false}
            position="bottomRight"
            data={allAlloys}
            columns={columns}
            title="Low Stock List"
          />
        );
      case 3:
        return (
          <CustomTable
            titleOnTop={false}
            position="bottomRight"
            data={allAlloys}
            columns={columns}
            title="No Stock List"
          />
        );
      default:
        return;
    }
  };
  const columns = [
    {
      title: "Inches",
      dataIndex: "inches",
      key: "inches",
      render: (text) => <div>{text}"</div>,
    },
    {
      title: "PCD",
      dataIndex: "pcd",
      key: "pcd",
      render: (text, record) => (
        <div>
          {text}
          {record?.holes ? "x" + record?.holes : null}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {/* <a>Invite {record.name}</a> */}
          <div>Delete</div>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full h-full p-5 bg-gray-200">
      <Row>
        {/* <Tabs items={items} onChange={setActiveTab} /> */}{" "}
        {/* <div
          className="cursor-pointer"
          onClick={() => {
            navigate("add-stock");
          }}
        >
          add-stock
        </div> */}
        <Flex gap="small" align="flex-start" vertical>
          <Segmented
            onChange={setActiveTab}
            options={[
              {
                label: (
                  <div
                    style={{
                      padding: 4,
                    }}
                    className={`flex items-center justify-between gap-x-1 ${activeTab === 1 ? "font-semibold" : "font-medium"
                      }`}
                  >
                    <div>All</div>
                    <div>({allAlloys?.length})</div>
                  </div>
                ),
                value: 1,
              },
              {
                label: (
                  <div
                    style={{
                      padding: 4,
                    }}
                    className={`flex items-center justify-between gap-x-1 ${activeTab === 2 ? "font-semibold" : "font-medium"
                      }`}
                  >
                    <div>Low Stock</div>
                    <div>(10)</div>
                  </div>
                ),
                value: 2,
              },
              {
                label: (
                  <div
                    style={{
                      padding: 4,
                    }}
                    className={`flex items-center justify-between gap-x-1 ${activeTab === 3 ? "font-semibold" : "font-medium"
                      }`}
                  >
                    <div>No Stock</div>
                    <div>(2)</div>
                  </div>
                ),
                value: 3,
              },
            ]}
          />
        </Flex>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <div className="mt-5">{handleTabContentRender()}</div>
        </Col>
      </Row>
    </div>
  );
};

export default StockList;
