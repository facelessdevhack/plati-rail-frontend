import React from "react";
import CustomKPI from "../../Core/Components/CustomKpi";
import Layout from "../Layout/layout";
import Footer from "../Layout/Footer";
import { InventoryFooterRoutes } from "../Layout/Routes/FooterRoutes";

const InventoryDashboard = () => {
  return (
    <Layout footer={<Footer routes={InventoryFooterRoutes} />}>
      <div className="flex flex-col items-center py-10">
        <div className="text-4xl">Hello, Preet</div>
        <div>
          <CustomKPI title="In Progress" count={10} />
          <CustomKPI title="Completed" count={20} />
        </div>
      </div>
    </Layout>
  );
};

export default InventoryDashboard;
