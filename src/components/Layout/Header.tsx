import React from 'react';
import { Layout, Button, Dropdown, Avatar, Space, Badge } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle, onLogout }) => {
  const navigate = useNavigate();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <EyeOutlined />,
      label: 'View Profile',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: onLogout,
    },
  ];

  const userString = sessionStorage.getItem('user');
  const user = (() => {
    try {
      if (!userString) return { first_name: 'Admin' };
      const parsed = JSON.parse(userString);
      return typeof parsed === 'object' && parsed ? parsed : { first_name: 'Admin' };
    } catch {
      return { first_name: 'Admin' };
    }
  })();

  const [orgName, setOrgName] = React.useState<string>(() => {
    try {
      const settings = sessionStorage.getItem('settings');
      if (!settings) return '';
      const parsed = JSON.parse(settings);
      return typeof parsed === 'object' && parsed ? (parsed.organization || '') : '';
    } catch {
      return '';
    }
  });

  React.useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const settings = sessionStorage.getItem('settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          setOrgName(typeof parsed === 'object' && parsed ? (parsed.organization || '') : '');
        }
      } catch (e) {
        console.error('Failed to sync settings', e);
      }
    };

    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
  }, []);

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 99,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* LEFT SIDE: Sidebar toggle */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        style={{ fontSize: 18, width: 48, height: 48, color: '#fff' }}
      />

      {/* RIGHT SIDE ACTIONS */}
      <Space size={16}>
        {orgName && (
          <span style={{ color: '#94a3b8', marginRight: 16, fontSize: '14px', fontWeight: 500 }}>
            {orgName}
          </span>
        )}

        {/* 👤 User Dropdown */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <Space style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar style={{ backgroundColor: '#2563eb' }} icon={<UserOutlined />} />
            <span style={{ color: '#fff' }}>{user.first_name || user.username}</span>
          </Space>
        </Dropdown>

      </Space>
    </AntHeader>
  );
};

export default Header;