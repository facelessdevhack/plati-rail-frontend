import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Typography,
  Spin,
  Alert,
  Badge,
  message,
  Space
} from 'antd';
import {
  ClockCircleOutlined,
  TruckOutlined,
  SettingOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getPendingEntriesAPI, getDispatchEntriesAPI, getInProductionEntriesAPI, getPendingEntriesComparisonAPI } from '../../redux/api/entriesAPI';
import moment from 'moment';

const { Title, Text } = Typography;

const SalesCoordinatorDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // KPI data states
  const [pendingEntries, setPendingEntries] = useState([]);
  const [dispatchEntries, setDispatchEntries] = useState([]);
  const [inProductionEntries, setInProductionEntries] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Comparison data for month-over-month analysis
  const [pendingComparison, setPendingComparison] = useState({
    currentCount: 0,
    previousCount: 0,
    percentageChange: 0,
    trend: 'neutral' // 'up', 'down', 'neutral'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [pendingRes, dispatchRes, inProductionRes, comparisonRes] = await Promise.all([
        dispatch(getPendingEntriesAPI()).unwrap(),
        dispatch(getDispatchEntriesAPI()).unwrap(),
        dispatch(getInProductionEntriesAPI()).unwrap(),
        dispatch(getPendingEntriesComparisonAPI()).unwrap()
      ]);

      setPendingEntries(pendingRes.pendingEntries || []);
      setDispatchEntries(dispatchRes.dispatchEntries || []);
      setInProductionEntries(inProductionRes.inProdEntries || []);
      setLastUpdated(moment());

      // Set comparison data
      if (comparisonRes && comparisonRes.comparisonData) {
        setPendingComparison({
          currentCount: comparisonRes.comparisonData.currentCount || 0,
          previousCount: comparisonRes.comparisonData.previousCount || 0,
          percentageChange: comparisonRes.comparisonData.percentageChange || 0,
          trend: comparisonRes.comparisonData.trend || 'neutral'
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  const navigateToPage = (path) => {
    navigate(path);
  };

  // KPI Cards Data
  const kpiCards = [
    {
      title: 'Pending Entries',
      value: pendingEntries.length,
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
      color: '#faad14',
      description: 'Entries waiting for stock availability',
      route: '/sales-pending-entries',
      status: pendingEntries.length > 0 ? 'warning' : 'success',
      buttonText: 'View Pending Entries',
      buttonType: 'warning',
      comparison: pendingComparison
    },
    {
      title: 'Dispatch Approval',
      value: dispatchEntries.length,
      icon: <TruckOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff',
      description: 'Entries ready for coordinator approval',
      route: '/sales-dispatch-entries',
      status: dispatchEntries.length > 0 ? 'processing' : 'success',
      buttonText: 'Review Dispatch Entries',
      buttonType: 'primary'
    },
    {
      title: 'In Production',
      value: inProductionEntries.length,
      icon: <SettingOutlined style={{ color: '#fa8c16' }} />,
      color: '#fa8c16',
      description: 'Entries currently in production',
      route: '/sales-inprod-entries',
      status: inProductionEntries.length > 0 ? 'processing' : 'default',
      buttonText: 'View Production Queue',
      buttonType: 'default'
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
        <Title level={4} style={{ marginTop: 20 }}>Loading Dashboard...</Title>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Sales Coordinator Dashboard</Title>
          <Text type="secondary">
            {lastUpdated ? `Last updated: ${lastUpdated.format('MMM DD, YYYY h:mm A')}` : 'Loading...'}
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => navigate('/settings')}
          >
            Settings
          </Button>
        </Space>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {kpiCards.map((kpi, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card
              hoverable
              style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer'
              }}
              onClick={() => navigateToPage(kpi.route)}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px', color: kpi.color }}>
                  {kpi.icon}
                </div>
                <Statistic
                  title={kpi.title}
                  value={kpi.value}
                  valueStyle={{ color: kpi.color, fontSize: '28px', fontWeight: 'bold' }}
                />
                <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                  {kpi.description}
                </Text>

                {/* Month-over-Month Comparison for Pending Entries */}
                {kpi.comparison && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      color: kpi.comparison.trend === 'up' ? '#52c41a' :
                             kpi.comparison.trend === 'down' ? '#ff4d4f' : '#8c8c8c'
                    }}>
                      {kpi.comparison.trend === 'up' && <ArrowUpOutlined />}
                      {kpi.comparison.trend === 'down' && <ArrowDownOutlined />}
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                        {kpi.comparison.percentageChange > 0 ? '+' : ''}{kpi.comparison.percentageChange.toFixed(1)}%
                      </span>
                    </div>
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      vs last month ({kpi.comparison.previousCount} → {kpi.comparison.currentCount})
                    </Text>
                  </div>
                )}

                <Badge
                  status={kpi.status}
                  text={kpi.value > 0 ? 'Needs attention' : 'All clear'}
                  style={{ marginTop: kpi.comparison ? '8px' : '12px' }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SalesCoordinatorDashboard;