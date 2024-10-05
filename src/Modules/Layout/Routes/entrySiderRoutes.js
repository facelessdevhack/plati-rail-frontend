import { Link } from "react-router-dom";
import {
  CodeSandboxOutlined,
  StockOutlined,
  PieChartOutlined,
  AlertOutlined,
} from "@ant-design/icons";

function getItemLayout(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

export const entrySiderRoutes = [
  getItemLayout(
    <Link to="/entry-dashboard">Dashboard</Link>,
    "1",
    <PieChartOutlined />
  ),
  getItemLayout(
    <Link to="/add-daily-entry">Add Daily Entry</Link>,
    "2",
    <StockOutlined />
  ),
  getItemLayout(
    <Link to="/add-inwards-entry">Add Inwards Entry</Link>,
    "3",
    <StockOutlined />
  ),
  //   getItemLayout(
  //     <Link to="/admin-orders">Orders</Link>,
  //     "2",
  //     <CodeSandboxOutlined />
  //   ),
  //   getItemLayout(
  //     <Link to="/admin-alerts-list">Alerts</Link>,
  //     "3",
  //     <AlertOutlined />
  //   ),
  //   getItemLayout(
  //     <Link to="/admin-stock-list">Stock</Link>,
  //     "4",
  //     <StockOutlined />
  //   ),
  //   getItemLayout("User", "sub1", <UserOutlined />, [
  //     getItemLayout("Tom", "3"),
  //     getItemLayout("Bill", "4"),
  //     getItemLayout("Alex", "5"),
  //   ]),
  //   getItemLayout("Team", "sub2", <TeamOutlined />, [
  //     getItemLayout("Team 1", "6"),
  //     getItemLayout("Team 2", "8"),
  //   ]),
  //   getItemLayout("Files", "9", <FileOutlined />),
];
