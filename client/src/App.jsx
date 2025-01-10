import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import TrucksPage from './pages/trucks/TrucksPage';
import ShipsPage from './pages/ships/ShipsPage';
import ShipmentsPage from './pages/shipments/ShipmentsPage';
import NewShipment from './pages/NewShipment';
import AlertsPage from './pages/alerts/AlertsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import PlantLocationsPage from './pages/locations/PlantLocationsPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ShipmentTracker from './components/shipments/ShipmentTracker';
import ChatBot from './components/ChatBot/ChatBot';
import { ConfigProvider } from 'antd';
// Import styles
import 'antd/dist/reset.css';
import './styles/map.css';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
axios.defaults.withCredentials = true;

// Configure axios interceptor for JWT
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

const AuthenticatedApp = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/shipments" />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/new-shipment" element={<NewShipment />} />
        <Route path="/shipment-tracker" element={<ShipmentTracker />} />
        <Route path="/trucks" element={<TrucksPage />} />
        <Route path="/ships" element={<ShipsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/plant-locations" element={<PlantLocationsPage />} />
      </Routes>
      {isAuthenticated && <ChatBot />}
    </Layout>
  );
};

function App() {
  return (
    <ConfigProvider
      theme={{
        components: {
          Select: {
            colorBgContainer: '#ffffff',
            colorText: '#000000',
            colorTextPlaceholder: '#a0a0a0',
            optionSelectedBg: '#e6f7ff',
            optionSelectedColor: '#1890ff',
          }
        }
      }}
    >
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <AuthenticatedApp />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;