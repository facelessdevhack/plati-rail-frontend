import React from "react";
import { CaretRightFilled } from "@ant-design/icons";
import { Card, Statistic } from "antd";
const CustomKPI = ({ title, count, color = "#10CB00", icon }) => (
  <Card bordered={false} className="cursor-pointer">
    <div className="flex items-center justify-between">
      <div>
        <div className="relative">
          <div>{icon}</div>
        </div>
        <div className="z-10 mt-5">
          <Statistic
            title={title}
            value={count}
            precision={0}
            valueStyle={{
              color,
              fontWeight: "bold",
            }}
          />
        </div>
      </div>
      <CaretRightFilled
        style={{
          fontSize: 20,
        }}
      />
    </div>
  </Card>
);
export default CustomKPI;
