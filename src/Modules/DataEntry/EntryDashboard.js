import React, { useEffect } from "react";
import { Row, Col, Space, Tag, Card } from "antd";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getAllDealers, getAllFinishes } from "../../redux/api/stockAPI";

const EntryDashboard = () => {
  const dispatch = useDispatch();
  const data = [
    {
      id: 1,
      label: "Add Stock",
      link: "/add-stock",
    },
    {
      id: 2,
      label: "Add Model",
      link: "/add-model",
    },
    {
      id: 3,
      label: "Add Finish",
      link: "/add-finish",
    },
    {
      id: 4,
      label: "Add Daily Entry",
      link: '/add-daily-entry'
    },
    {
      id: 5,
      label: 'Add Cap',
      link: '/add-cap-stock'
    }
  ];

  useEffect(() => {
    dispatch(getAllFinishes({}));
    dispatch(getAllDealers({}))
  }, []);

  return (
    <div className="w-full h-full p-5 bg-background-grey">
      <Row gutter={16}>
        <div className="flex items-center justify-start w-full gap-x-5">
          {data.map((i) => (
            <Link key={i.id} to={i.link}>
              <Card bordered={false} className="cursor-pointer">
                <div className="text-xl font-semibold">{i.label}</div>
              </Card>
            </Link>
          ))}
        </div>
      </Row>
      <Row gutter={16}></Row>
    </div>
  );
};

export default EntryDashboard;
