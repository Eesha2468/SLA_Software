import React, { useState, useEffect, useMemo } from 'react';
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
import { fetchTickets, TicketDTO } from '../api/ticketApi';
import { fetchLines, LineDTO } from '../api/linesApi';
import { fetchFaultLevelCategories, FaultLevelCategoryDTO } from '../api/faultLevelApi';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [faultLevels, setFaultLevels] = useState<FaultLevelCategoryDTO[]>([]);
  const [selectedLine, setSelectedLine] = useState<string | number>('All');
  const [loading, setLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [ticketsData, linesData, flData] = await Promise.all([
        fetchTickets().catch(() => []),
        fetchLines().catch(() => []),
        fetchFaultLevelCategories().catch(() => []),
      ]);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setLines(Array.isArray(linesData) ? linesData : []);
      setFaultLevels(Array.isArray(flData) ? flData : []);
    } catch (error: any) {
      if (isInitial) {
        message.error(error.message || 'Failed to load dashboard data');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredTickets = useMemo(() => {
    if (selectedLine === 'All') return tickets;
    return tickets.filter((t) => String(t.line_id) === String(selectedLine));
  }, [tickets, selectedLine]);

  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const opened = filteredTickets.filter(t => ['open', 'in progress', 'in-progress'].includes(t.ticket_status?.toLowerCase() || '')).length;
    const resolved = filteredTickets.filter(t => (t.ticket_status?.toLowerCase() || '') === 'resolved').length;
    const cancelled = filteredTickets.filter(t => ['cancel', 'cancelled', 'close', 'closed'].includes(t.ticket_status?.toLowerCase() || '')).length;

    return { total, opened, resolved, cancelled };
  }, [filteredTickets]);

  const monthlyTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ name: m, value: 0 }));

    filteredTickets.forEach(t => {
      if (t.created_at) {
        const monthIndex = dayjs(t.created_at).month();
        if (monthIndex >= 0 && monthIndex < 12) {
          data[monthIndex].value++;
        }
      }
    });

    return data;
  }, [filteredTickets]);

  const statusData = useMemo(() => {
    const counts = {
      'Open': 0,
      'Resolved': 0,
      'Cancelled': 0
    };

    filteredTickets.forEach(t => {
      const status = t.ticket_status?.toLowerCase() || '';
      if (status === 'open' || status === 'in progress' || status === 'in-progress') {
        counts['Open']++;
      } else if (status === 'resolved') {
        counts['Resolved']++;
      } else if (status === 'cancel' || status === 'cancelled' || status === 'close' || status === 'closed') {
        counts['Cancelled']++;
      }
    });

    return [
      { name: 'Open', value: counts['Open'] },
      { name: 'Resolved', value: counts['Resolved'] },
      { name: 'Cancelled', value: counts['Cancelled'] }
    ];
  }, [filteredTickets]);

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(d => ({ name: d, value: 0 }));

    filteredTickets.forEach(t => {
      if (t.created_at) {
        const dayIndex = dayjs(t.created_at).day();
        if (dayIndex >= 0 && dayIndex < 7) {
          data[dayIndex].value++;
        }
      }
    });

    return data;
  }, [filteredTickets]);

  const faultLevelBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(t => {
      const fl = faultLevels.find(f => f.fl_category_id === t.fl_category_id);
      const name = fl?.fl_name || 'Other';
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredTickets, faultLevels]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Loading Dashboard..." />
      </div>
    );
  }

  const lineOptions = [
    { value: 'All', label: 'All Lines' },
    ...lines.map(l => ({ value: String(l.line_id), label: l.line_name }))
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
            value={String(selectedLine)}
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
            value={stats.resolved}
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
            data={monthlyTrend}
            title="Monthly Ticket Trend"
          />
        </Col>

        <Col xs={24} lg={8}>
          <DonutChartComponent
            data={statusData}
            title="Ticket Status Overview"
            colors={['#1e40af', '#059669', '#dc2626']}
          />
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <BarChartComponent
            data={weeklyData}
            title="Weekly Ticket Volume"
          />
        </Col>

        <Col xs={24} lg={12}>
          <DonutChartComponent
            data={faultLevelBreakdown}
            title="Fault Level Breakdown"
            colors={['#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;