import React from "react";
import CustomNavButton from "../../Core/Components/CustomNavButton";

const Footer = ({ routes }) => {
  return (
    <div className={`flex justify-between items-center h-full`}>
      {routes.map((route) => (
        <CustomNavButton key={route.id} title={route.title} />
      ))}
    </div>
  );
};

export default Footer;
