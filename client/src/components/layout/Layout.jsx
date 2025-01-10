import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TruckIcon,
  Package,
  MapIcon,
  PlusCircle,
  Settings,
  Bell,
  BarChart2,
  Ship,
  Building2
} from 'lucide-react';
import { cn } from '../../lib/utils';

const sidebarItems = [
  // {
  //   title: 'Dashboard',
  //   icon: LayoutDashboard,
  //   href: '/dashboard'
  // },
  {
    title: 'Shipments',
    icon: Package,
    href: '/shipments'
  },
  {
    title: 'New Shipment',
    icon: PlusCircle,
    href: '/new-shipment'
  },
  {
    title: 'Shipment Tracker',
    icon: MapIcon,
    href: '/shipment-tracker'
  },
  {
    title: 'Trucks',
    icon: TruckIcon,
    href: '/trucks'
  },
  {
    title: 'Ships',
    icon: Ship,
    href: '/ships'
  },
  {
    title: 'Plant Locations',
    icon: Building2,
    href: '/plant-locations'
  },
  {
    title: 'Alerts',
    icon: Bell,
    href: '/alerts'
  },
  {
    title: 'Analytics',
    icon: BarChart2,
    href: '/analytics'
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/settings'
  }
];

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0 overflow-y-auto">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-8">Smart Cargo AI</h1>
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-white" 
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
