import React from "react";

const Layout = ({ header, children, footer }) => {
  return (
    <div className="grid w-screen h-screen grid-rows-12 ">
      <div className="w-full h-full row-span-1 text-white bg-black">
        {header}
      </div>
      <div className="row-span-10">{children}</div>
      <div className="w-full h-full row-span-1 text-white border shadow-moreFilters">
        {footer}
      </div>
    </div>
  );
};

export default Layout;
