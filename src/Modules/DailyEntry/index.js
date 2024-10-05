import React, { useState } from "react";
import { Row, Col, Space, Tag, Flex, Segmented } from "antd";
import CustomTable from "../../Core/Components/CustomTable";
import { PlusOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../Core/Components/CustomButton";

const DailyEntryAdmin = () => {
    const [activeTab, setActiveTab] = useState(1);
    const navigate = useNavigate();


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
                    <Link to={`/admin-order-details/${record.key}`}>Detail</Link>
                </Space>
            ),
        },
    ];
    const data = [
        {
            key: 1,
            itemName: "PY-009 ",
            age: 32,
            address: "New York No. 1 Lake Park",
            tags: ["nice", "developer"],
        },
        {
            key: 2,
            itemName: "Jim Green",
            age: 42,
            address: "London No. 1 Lake Park",
            tags: ["loser"],
        },
        {
            key: 3,
            itemName: "Joe Black",
            age: 32,
            address: "Sydney No. 1 Lake Park",
            tags: ["cool", "teacher"],
        },
        {
            key: 4,
            itemName: "Joe Black",
            age: 32,
            address: "Sydney No. 1 Lake Park",
            tags: ["cool", "teacher"],
        },
        {
            key: 5,
            itemName: "PY-009 ",
            age: 32,
            address: "New York No. 1 Lake Park",
            tags: ["nice", "developer"],
        },
        {
            key: 6,
            itemName: "Jim Green",
            age: 42,
            address: "London No. 1 Lake Park",
            tags: ["loser"],
        },
        {
            key: 7,
            itemName: "Joe Black",
            age: 32,
            address: "Sydney No. 1 Lake Park",
            tags: ["cool", "teacher"],
        },
        {
            key: 8,
            itemName: "Joe Black",
            age: 32,
            address: "Sydney No. 1 Lake Park",
            tags: ["cool", "teacher"],
        },
        {
            key: 9,
            itemName: "PY-009 ",
            age: 32,
            address: "New York No. 1 Lake Park",
            tags: ["nice", "developer"],
        },
        {
            key: 10,
            itemName: "Jim Green",
            age: 42,
            address: "London No. 1 Lake Park",
            tags: ["loser"],
        },
        {
            key: 11,
            itemName: "Joe Black",
            age: 32,
            address: "Sydney No. 1 Lake Park",
            tags: ["cool", "teacher"],
        },
        {
            key: 12,
            itemName: "Joe Black",
            age: 32,
            address: "Sydney No. 1 Lake Park",
            tags: ["cool", "teacher"],
        },
        {
            key: 13,
            itemName: "PY-009 ",
            age: 32,
            address: "New York No. 1 Lake Park",
            tags: ["nice", "developer"],
        },
        {
            key: 14,
            itemName: "Jim Green",
            age: 42,
            address: "London No. 1 Lake Park",
            tags: ["loser"],
        },
        {
            key: 15,
            itemName: "Joe Black",
            age: 32,
            address: "Sydney No. 1 Lake Park",
            tags: ["cool", "teacher"],
        },
        {
            key: 16,
            itemName: "Joe Black",
            age: 32,
            address: "Sydney No. 1 Lake Park",
            tags: ["cool", "teacher"],
        },
    ];

    return (
        <div className="w-full h-full p-5 bg-gray-200">
            <Row gutter={16}>
                <Col span={24}>
                    <CustomTable
                        data={data}
                        titleOnTop={false}
                        position="bottomRight"
                        columns={columns}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default DailyEntryAdmin;
