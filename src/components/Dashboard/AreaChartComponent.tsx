import React from 'react';
import { Card } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartProps {
  data?: { name: string; value: number }[];
  title: string;
}

const defaultMonthlyData = [
  { name: 'Jan', value: 0 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 },
  { name: 'Apr', value: 0 }, { name: 'May', value: 0 }, { name: 'Jun', value: 0 },
  { name: 'Jul', value: 0 }, { name: 'Aug', value: 0 }, { name: 'Sep', value: 0 },
  { name: 'Oct', value: 0 }, { name: 'Nov', value: 0 }, { name: 'Dec', value: 0 }
];

const AreaChartComponent: React.FC<AreaChartProps> = ({ data, title }) => {
  const safeData = Array.isArray(data) && data.length > 0 ? data : defaultMonthlyData;

  return (
    <Card
      title={<span style={{ fontWeight: 600 }}>{title}</span>}
      style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      bodyStyle={{ padding: '16px 24px 24px' }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={safeData}>
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
};

export default AreaChartComponent;
