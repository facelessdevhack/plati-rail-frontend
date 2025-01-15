import React, { useEffect } from "react";
import { Row, Card } from "antd";
import { Link } from "react-router-dom";

const AddDailyEntry = () => {
  const data = [
    {
      id: 1,
      label: "Add Alloys Entry",
      link: "/add-daily-entry-alloys",
    },
    {
      id: 2,
      label: "Add Tyres Entry",
      link: "/add-daily-entry-tyres",
    },
    {
      id: 3,
      label: "Add Caps Entry",
      link: "/add-daily-entry-caps",
    },
    {
      id: 4,
      label: "Add PPF Entry",
      link: '/add-daily-entry-ppf'
    },
    {
      id: 5,
      label: "Add Charges Entry",
      link: '/add-charges-entry'
    },
  ];

  useEffect(() => {
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

export default AddDailyEntry;
