import React, { useState } from "react";
import { Layout, Menu, theme } from "antd";
import { adminSiderRoutes } from "./Routes/adminSiderRoutes";
const { Header, Footer, Sider } = Layout;

const AdminLayout = ({ content, title, items = adminSiderRoutes }) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  return (
    <Layout
      style={{
        minHeight: "100vh",
      }}
    >
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div
          className={`transition-all duration-200 ${
            collapsed ? "flex items-center justify-center my-10" : "p-10"
          }`}
        >
          <img
            className={`transition-all duration-200 ${
              collapsed ? "z-10 h-8 p-1.5" : "z-10"
            }`}
            src="/assets/logo.png"
            alt="Plati India"
          />
        </div>

        <Menu
          theme="dark"
          defaultSelectedKeys={["1"]}
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            padding: "0 0px 0px 20px",
          }}
          className="flex items-center justify-start"
        >
          <div className="flex items-center justify-start text-2xl font-semibold text-left text-black font-poppins">
            {title}
          </div>
        </Header>
        {content}
        <Footer
          className="bg-white"
          style={{
            textAlign: "center",
          }}
        >
          Plati India Pvt. Ltd. ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};
export default AdminLayout;
