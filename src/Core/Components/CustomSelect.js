import React from "react";
import { Select } from "antd";

const CustomSelect = ({ options, ...props }) => {
  return (
    <Select
      defaultValue={options[0]}
      {...props}
      options={options}
      optionFilterProp="label"
    />
  );
};

export default CustomSelect;
