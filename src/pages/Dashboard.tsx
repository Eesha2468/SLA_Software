import React, { useState, useEffect } from 'react';
import { Row, Col, Select, message, Spin } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  StatCard,
  AreaChartComponent,
  DonutChartComponent,
  BarChartComponent,
} from '../components/Dashboard';
import {
  fetchDashboardStats,
  fetchDashboardCharts,
  DashboardStatsDTO,
  DashboardChartsDTO,
} from '../api/ticketApi';
import { fetchLines, LineDTO } from '../api/linesApi';

const Dashboard: React.FC = () => {
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStatsDTO>({
    total: 0,
    total_sent: 0,
    total_received: 0,
    new_tickets: 0,
    opened: 0,
    open_tickets: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    cancelled: 0,
    overdue: 0,
    sla_breached: 0,
  });

  const [charts, setCharts] = useState<DashboardChartsDTO>({
    monthlyTrend: [],
    statusData: [],
    weeklyData: [],
    faultLevelBreakdown: [],
  });

  const loadInitialData = async () => {
    try {
      const lineData = await fetchLines();
      setLines(lineData);
    } catch (error: any) {
      console.error('Failed to load lines:', error);
    }
  };

  const loadDashboardData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [statsData, chartsData] = await Promise.all([
        fetchDashboardStats(selectedLine),
        fetchDashboardCharts(selectedLine),
      ]);
      setStats(statsData);
      setCharts(chartsData);
    } catch (error: any) {
      if (isInitial) {
        message.error(error.message || 'Failed to load dashboard data');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadDashboardData(true);
    const interval = setInterval(() => loadDashboardData(false), 5000);
    return () => clearInterval(interval);
  }, [selectedLine]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Loading Dashboard..." />
      </div>
    );
  }

  const lineOptions = [
    { value: 'All', label: 'All Lines' },
    ...lines.map((l) => ({ value: String(l.line_id), label: l.line_name })),
  ];

  return (
    <div>
      {/* Header & Filter Row */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h2 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Dashboard Overview</h2>
        </Col>
        <Col>
          <Select
            value={selectedLine}
            onChange={(value) => setSelectedLine(value)}
            size="large"
            style={{ width: 220 }}
            options={lineOptions}
            placeholder="Filter by Line"
          />
        </Col>
      </Row>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Tickets"
            value={stats.total}
            icon={<ClockCircleOutlined />}
            color="#1e40af"
            subtitle="Overall"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Opened"
            value={stats.opened}
            icon={<CheckCircleOutlined />}
            color="#0ea5e9"
            subtitle="Currently Active"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Resolved"
            value={stats.resolved + stats.closed}
            icon={<CloseCircleOutlined />}
            color="#059669"
            subtitle="Successfully Fixed"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={<ExclamationCircleOutlined />}
            color="#dc2626"
            subtitle="Closed without resolution"
          />
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <AreaChartComponent
            data={charts.monthlyTrend}
            title="Monthly Ticket Trend"
          />
        </Col>

        <Col xs={24} lg={8}>
          <DonutChartComponent
            data={charts.statusData}
            title="Ticket Status Overview"
            colors={['#1e40af', '#059669', '#f59e0b', '#dc2626']}
          />
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <BarChartComponent
            data={charts.weeklyData}
            title="Weekly Ticket Volume"
          />
        </Col>

        <Col xs={24} lg={12}>
          <DonutChartComponent
            data={charts.faultLevelBreakdown}
            title="Fault Level Breakdown"
            colors={['#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;