import React from "react";
import { Row, Col, Space, Tag } from "antd";
import {
  ClockCircleTwoTone,
  CheckCircleTwoTone,
  DownCircleTwoTone,
  AlertTwoTone,
} from "@ant-design/icons";
import CustomKPI from "../../Core/Components/CustomKpi";
import CustomTable from "../../Core/Components/CustomTable";

const AdminDashboard = () => {
  const kpiData = [
    {
      id: 1,
      title: "Pending Production Orders",
      count: 5,
      color: "#cf1322",
      icon: (
        <ClockCircleTwoTone
          style={{
            fontSize: 40,
          }}
          twoToneColor="#cf1322"
        />
      ),
    },
    {
      id: 2,
      title: "Completed Production Orders",
      count: 10,
      icon: (
        <CheckCircleTwoTone
          style={{
            fontSize: 40,
          }}
          twoToneColor="#10CB00"
        />
      ),
    },
    {
      id: 3,
      title: "Low Stock Items",
      count: 500,
      color: "#cf1322",
      icon: (
        <DownCircleTwoTone
          style={{
            fontSize: 40,
          }}
          twoToneColor="#cf1322"
        />
      ),
    },
    {
      id: 4,
      title: "Alert Items (piece)",
      count: 20,
      color: "#cf1322",
      icon: (
        <AlertTwoTone
          style={{
            fontSize: 40,
          }}
          twoToneColor="#cf1322"
        />
      ),
    },
  ];

  const columns = [
    {
      title: "Item",
      dataIndex: "itemName",
      key: "itemName",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Tags",
      key: "tags",
      dataIndex: "tags",
      render: (_, { tags }) => (
        <>
          {tags.map((tag) => {
            let color = tag.length > 5 ? "geekblue" : "green";
            if (tag === "loser") {
              color = "volcano";
            }
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            );
          })}
        </>
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
  const data = [
    {
      key: "1",
      itemName: "PY-009 ",
      age: 32,
      address: "New York No. 1 Lake Park",
      tags: ["nice", "developer"],
    },
    {
      key: "2",
      itemName: "Jim Green",
      age: 42,
      address: "London No. 1 Lake Park",
      tags: ["loser"],
    },
    {
      key: "3",
      itemName: "Joe Black",
      age: 32,
      address: "Sydney No. 1 Lake Park",
      tags: ["cool", "teacher"],
    },
    {
      key: "4",
      itemName: "Joe Black",
      age: 32,
      address: "Sydney No. 1 Lake Park",
      tags: ["cool", "teacher"],
    },
  ];
  return (
    <div className="w-full h-full p-5 bg-background-grey">
      <Row gutter={16}>
        {kpiData.map((kpi) => (
          <Col key={kpi.id} span={24 / (kpiData.length || 1)}>
            <CustomKPI
              title={kpi.title}
              count={kpi.count}
              color={kpi.color}
              icon={kpi.icon}
            />
          </Col>
        ))}
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <div className="mt-5">
            <CustomTable data={data} columns={columns} title="Alert Items" />
          </div>
        </Col>
        <Col span={12}>
          <div className="mt-5">
            <CustomTable
              data={data}
              columns={columns}
              title="Completed Productions Order"
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
