import React from 'react';
import { Card } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartProps {
  data: { name: string; value: number }[];
  title: string;
}

const AreaChartComponent: React.FC<AreaChartProps> = ({ data, title }) => (
  <Card
    title={<span style={{ fontWeight: 600 }}>{title}</span>}
    style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    bodyStyle={{ padding: '16px 24px 24px' }}
  >
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorSLA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#colorSLA)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </Card>
);

export default AreaChartComponent;
