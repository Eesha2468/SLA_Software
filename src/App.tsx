import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { MainLayout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewTicket from './pages/tickets/NewTicket';
import TicketList from './pages/tickets/TicketList';
import TicketDetails from './pages/tickets/TicketDetails';
import Settings from './pages/Settings';
import OrganizationManager from './components/MasterForms/Organization/OrganizationManager';
import LinesManager from './components/MasterForms/Lines/LinesManager';
import EquipmentsManager from './components/MasterForms/Equipments/EquipmentsManager';
import ServiceProvidersManager from './components/MasterForms/ServiceProviders/ServiceProvidersManager';
import UsersManager from './components/MasterForms/Users/UsersManager';
import ClientUsersManager from './components/MasterForms/ClientUsers/ClientUsersManager';
import KPICategoriesManager from './components/MasterForms/KPICategories/KPICategoriesManager';
import KPISubCategoriesManager from './components/MasterForms/KPISubCategories/KPISubCategoriesManager';
import FaultLevelCategoryManager from './components/MasterForms/FaultLevelCategory/FaultLevelCategoryManager';
import { theme } from './styles/theme';
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check if user is already logged in on page load/refresh
    const user = sessionStorage.getItem('user');
    return !!user;
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  return (
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Public Route: Login */}
          <Route 
            path="/login" 
            element={
              !isLoggedIn ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              isLoggedIn ? (
                <MainLayout onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* MASTER FORMS */}
            <Route path="organization" element={<OrganizationManager />} />
            <Route path="lines" element={<LinesManager />} />
            <Route path="equipments" element={<EquipmentsManager />} />
            <Route path="service-providers" element={<ServiceProvidersManager />} />
            <Route path="users" element={<UsersManager />} />
            <Route path="client-users" element={<ClientUsersManager />} />
            <Route path="kpi-categories" element={<KPICategoriesManager />} />
            <Route path="kpi-sub-categories" element={<KPISubCategoriesManager />} />
            <Route path="fault-level-category" element={<FaultLevelCategoryManager />} />

            {/* ✅ FIXED TICKET ROUTES */}
            <Route path="tickets" element={<TicketList />} />
            <Route path="new-ticket" element={<NewTicket />} />
            <Route path="tickets/:id" element={<TicketDetails />} />

            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Redirect any unknown routes */}
          <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;