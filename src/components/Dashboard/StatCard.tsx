import React from 'react';
import { Card } from 'antd';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  return (
    <Card
      style={{
        background: color,
        border: 'none',
        borderRadius: 12,
        color: '#fff',
        minHeight: 120,
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
            {title}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)' }}>{icon}</div>
      </div>
    </Card>
  );
};

export default StatCard;
