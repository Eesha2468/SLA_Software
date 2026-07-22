import React, { useState, useEffect } from 'react';
import { Row, Col, Select, message, Spin, Table, Tag, Typography, Card } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  SendOutlined,
  FileTextOutlined,
  AlertOutlined,
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
  fetchDashboardRecentTickets,
  DashboardStatsDTO,
  DashboardChartsDTO,
  RecentTicketDTO,
} from '../api/ticketApi';
import { fetchLines, LineDTO } from '../api/linesApi';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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

  const [recentTickets, setRecentTickets] = useState<RecentTicketDTO[]>([]);

  const userString = sessionStorage.getItem('user');
  const loggedInUser = (() => {
    try {
      return userString ? JSON.parse(userString) : null;
    } catch (e) {
      return null;
    }
  })();

  const isClient = loggedInUser?.user_type === 'CLIENT_USER';
  const userOrgName = isClient ? 'CDA' : 'TAP';

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
      const [statsData, chartsData, recentData] = await Promise.all([
        fetchDashboardStats(selectedLine),
        fetchDashboardCharts(selectedLine),
        fetchDashboardRecentTickets(selectedLine),
      ]);
      setStats(statsData);
      setCharts(chartsData);
      setRecentTickets(recentData);
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
    // Poll dashboard stats every 5 seconds for real-time ticket updates
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

  const recentColumns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      render: (text: string, record: RecentTicketDTO) => (
        <Text strong style={{ color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'ticket_title',
      key: 'ticket_title',
    },
    {
      title: 'Line',
      dataIndex: 'line_name',
      key: 'line_name',
    },
    {
      title: 'Creator',
      dataIndex: 'creator_name',
      key: 'creator_name',
    },
    {
      title: 'Status',
      dataIndex: 'ticket_status',
      key: 'ticket_status',
      render: (status: string) => {
        let color = 'blue';
        if (status === 'Resolved' || status === 'Close') color = 'success';
        else if (status === 'Cancel') color = 'error';
        else if (status === 'In Progress') color = 'warning';
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
  ];

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header & Filter Row */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
              {userOrgName} Dashboard Overview
            </h2>
            <Tag color={isClient ? 'purple' : 'blue'} style={{ fontSize: 13, padding: '2px 10px' }}>
              {userOrgName} Portal
            </Tag>
          </div>
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

      {/* Primary Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
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
            title="New Tickets (Unread)"
            value={stats.new_tickets}
            icon={<InboxOutlined />}
            color="#ec4899"
            subtitle="Pending Receiver Attention"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Open / Active"
            value={stats.opened}
            icon={<CheckCircleOutlined />}
            color="#0ea5e9"
            subtitle="Currently Active"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Resolved / Closed"
            value={stats.resolved + stats.closed}
            icon={<CloseCircleOutlined />}
            color="#059669"
            subtitle="Successfully Completed"
          />
        </Col>
      </Row>

      {/* Secondary Stat Cards (Sent/Received/Overdue/Cancelled) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={isClient ? "Sent to TAP" : "Sent to CDA"}
            value={stats.total_sent}
            icon={<SendOutlined />}
            color="#6366f1"
            subtitle="Outgoing Tickets"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={isClient ? "Received from TAP" : "Received from CDA"}
            value={stats.total_received}
            icon={<InboxOutlined />}
            color="#8b5cf6"
            subtitle="Incoming Tickets"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Overdue Tickets"
            value={stats.overdue}
            icon={<AlertOutlined />}
            color="#f59e0b"
            subtitle="Exceeded Standard Resolution"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={<ExclamationCircleOutlined />}
            color="#dc2626"
            subtitle="Closed without Resolution"
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
            colors={['#1e40af', '#0ea5e9', '#059669', '#dc2626']}
          />
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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

      {/* Recent Tickets Table */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#2563eb' }} />
            <span style={{ fontWeight: 600 }}>Recent Tickets ({userOrgName})</span>
          </div>
        }
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        <Table
          dataSource={recentTickets}
          columns={recentColumns}
          rowKey="ticket_id"
          pagination={false}
          locale={{ emptyText: 'No tickets found for this organization.' }}
          onRow={(record) => ({
            onClick: () => navigate(`/tickets/${record.ticket_id}`),
            style: { cursor: 'pointer' },
          })}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Dashboard;