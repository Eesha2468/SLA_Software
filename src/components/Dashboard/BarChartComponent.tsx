import React from 'react';
import { Card } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data?: { name: string; value: number }[];
  title: string;
}

const defaultWeeklyData = [
  { name: 'Sun', value: 0 }, { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 },
  { name: 'Wed', value: 0 }, { name: 'Thu', value: 0 }, { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 }
];

const BarChartComponent: React.FC<BarChartProps> = ({ data, title }) => {
  const safeData = Array.isArray(data) && data.length > 0 ? data : defaultWeeklyData;

  return (
    <Card
      title={<span style={{ fontWeight: 600 }}>{title}</span>}
      style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      bodyStyle={{ padding: '16px 24px 24px' }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={safeData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default BarChartComponent;
