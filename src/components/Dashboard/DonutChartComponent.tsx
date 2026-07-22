import React from 'react';
import { Card, Empty } from 'antd';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DonutChartProps {
  data: { name: string; value: number }[];
  title: string;
  colors?: string[];
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

const DonutChartComponent: React.FC<DonutChartProps> = ({ data, title, colors = COLORS }) => {
  const hasData = data && data.length > 0 && data.some((d) => d.value > 0);

  return (
    <Card
      title={<span style={{ fontWeight: 600 }}>{title}</span>}
      style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      bodyStyle={{ padding: '16px 24px 24px' }}
    >
      <ResponsiveContainer width="100%" height={220}>
        {hasData ? (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No Ticket Data" />
          </div>
        )}
      </ResponsiveContainer>
    </Card>
  );
};

export default DonutChartComponent;
