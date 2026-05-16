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

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { first_name: 'Admin' };

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