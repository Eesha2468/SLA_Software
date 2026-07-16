import React, { useState, useEffect } from 'react';
import { Layout, Menu, Badge } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  NodeIndexOutlined,
  TeamOutlined,
  UserOutlined,
  TagsOutlined,
  ApartmentOutlined,
  AlertOutlined,
  SettingOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchUnreadCount } from '../../api/ticketApi';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState<string[]>(['master-forms']);
  const [ticketCount, setTicketCount] = useState<number>(0);

  const getTicketCount = async () => {
    try {
      const userString = sessionStorage.getItem('user');
      const loggedInUser = userString ? JSON.parse(userString) : null;
      if (!loggedInUser) return;

      const count = await fetchUnreadCount(loggedInUser.id, loggedInUser.user_type);
      setTicketCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    getTicketCount();
    // Refresh count every 15 seconds for real-time feel
    const interval = setInterval(getTicketCount, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleMenuClick = (e: { key: string }) => {
    if (e.key.startsWith('/')) {
      navigate(e.key);
    }
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/new-ticket',
      icon: <PlusCircleOutlined />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>New Ticket</span>
          {!collapsed && (
            <Badge 
              count={ticketCount} 
              showZero
              size="small" 
              style={{ 
                backgroundColor: '#ffffff', 
                color: '#0f172a', 
                border: 'none', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginLeft: 8,
                fontWeight: 'bold'
              }} 
            />
          )}
        </div>
      ),
    },
    {
      key: 'master-forms',
      icon: <ApartmentOutlined />,
      label: 'Master Forms',
      children: [
        { key: '/organization', icon: <BankOutlined />, label: 'Organization' },
        { key: '/lines', icon: <NodeIndexOutlined />, label: 'Lines' },
        { key: '/service-providers', icon: <TeamOutlined />, label: 'Service Providers' },
        { key: '/users', icon: <UserOutlined />, label: 'Users' },
        { key: '/client-users', icon: <UserOutlined />, label: 'Client Users' },
        { key: '/kpi-categories', icon: <TagsOutlined />, label: 'KPI Categories' },
        { key: '/kpi-sub-categories', icon: <TagsOutlined />, label: 'KPI Sub-Categories' },
        { key: '/fault-level-category', icon: <AlertOutlined />, label: 'Fault-Level Category' },
      ],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  return (
    <Sider
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={270}
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        background: '#0f172a', // Original Dark Navy
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <img
          src="/logo.png"
          alt="TAP Logo"
          style={{ height: collapsed ? 35 : 50, transition: 'height 0.3s', objectFit: 'contain' }}
        />
        {!collapsed && (
          <span
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              marginLeft: 10,
              whiteSpace: 'nowrap',
            }}
          >
            SLA System
          </span>
        )}
      </div>

      <div style={{ height: 'calc(100vh - 64px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          onClick={handleMenuClick}
          items={menuItems}
          style={{ borderRight: 0, marginTop: 8, background: 'transparent', flex: 1 }}
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
