import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  CarOutlined,
  RocketOutlined,
  BoxPlotOutlined,
  AlertOutlined,
  BarChartOutlined,
  LogoutOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    // { path: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { path: '/trucks', icon: <CarOutlined />, label: 'Trucks' },
    { path: '/ships', icon: <RocketOutlined />, label: 'Ships' },
    { path: '/shipments', icon: <BoxPlotOutlined />, label: 'Shipments' },
    { path: '/shipment-tracker', icon: <BoxPlotOutlined />, label: 'Shipment Tracker' },
    { path: '/plant-locations', icon: <EnvironmentOutlined />, label: 'Plant Locations' },
    { path: '/alerts', icon: <AlertOutlined />, label: 'Alerts' },
    { path: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' }
  ];

  return (
    <div className="fixed w-64 h-full bg-gray-800">
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <h1 className="text-white text-xl font-bold">Smart Cargo AI</h1>
      </div>
      <nav className="mt-5">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
              location.pathname === item.path ? 'bg-gray-700 text-white' : ''
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          onClick={logout}
          className="w-full flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <LogoutOutlined className="mr-3" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};