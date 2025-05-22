import { Link } from 'react-router-dom'
import {
  CodeSandboxOutlined,
  StockOutlined,
  PieChartOutlined,
  AlertOutlined,
  BarChartOutlined,
  UserOutlined,
  ToolOutlined
} from '@ant-design/icons'

function getItemLayout (label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label
  }
}

export const adminSiderRoutes = [
  getItemLayout(
    <Link to='/stock-dashboard'>Dashboard</Link>,
    '1',
    <StockOutlined />
  ),
  getItemLayout(
    <Link to='/admin-daily-entry-dealers'>Select Dealers</Link>,
    '2',
    <PieChartOutlined />
  ),
  // getItemLayout(
  //   <Link to="/admin-alerts-list">Alerts</Link>,
  //   "3",
  //   <AlertOutlined />
  // ),
  getItemLayout('Dealer Metrics', 'sub1', <BarChartOutlined />, [
    getItemLayout(<Link to='/admin-dealer-metrics'>Overall</Link>, '3'),
    getItemLayout(<Link to='/admin-dealer-metrics-for-size'>By Size</Link>, '4')
  ]),
  getItemLayout('Production', 'sub2', <ToolOutlined />, [
    getItemLayout(<Link to='/production-plans'>Production Plans</Link>, '5'),
    getItemLayout(<Link to='/production-plan/create'>Create Plan</Link>, '6'),
    getItemLayout(<Link to='/production-job-cards'>Job Cards</Link>, '7'),
    getItemLayout(
      <Link to='/production-workflow'>Production Workflow</Link>,
      '8'
    )
  ])
  //   getItemLayout("Team", "sub2", <TeamOutlined />, [
  //     getItemLayout("Team 1", "6"),
  //     getItemLayout("Team 2", "8"),
  //   ]),
  //   getItemLayout("Files", "9", <FileOutlined />),
]
