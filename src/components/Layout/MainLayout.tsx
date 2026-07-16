import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { fetchSettings } from '../../api/settingsApi';

const { Content } = Layout;

interface MainLayoutProps {
  onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const prefetchSettings = async () => {
      try {
        const settings = await fetchSettings();
        sessionStorage.setItem('settings', JSON.stringify(settings));
        window.dispatchEvent(new Event('settings-updated'));
      } catch (e) {
        console.error('Failed to prefetch settings', e);
      }
    };
    prefetchSettings();
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 270,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onLogout={onLogout}
        />
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#ffffff',
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Outlet/>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
