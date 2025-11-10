import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  Upload,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Traffic & Revenue', href: '/traffic', icon: TrendingUp },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Upload Data', href: '/upload', icon: Upload },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)' }}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: 'rgba(131, 24, 67, 0.75)' }} onClick={() => setSidebarOpen(false)} />

        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ borderRight: '1px solid #fbcfe8' }}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold" style={{ color: '#831843' }}>Customer Dashboard</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link group flex items-center px-2 py-2 text-base font-medium rounded-md transition-all duration-200 ${
                      isActive(item.href)
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white" style={{ borderRight: '1px solid #fbcfe8', boxShadow: '4px 0 6px -1px rgba(236, 72, 153, 0.1)' }}>
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#831843' }}>Customer Dashboard</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      isActive(item.href)
                        ? 'active'
                        : ''
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3" style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)' }}>
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset"
            style={{
              color: '#be185d',
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              focusRingColor: '#ec4899'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.2)';
              e.currentTarget.style.color = '#831843';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.1)';
              e.currentTarget.style.color = '#be185d';
            }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1">
          <div className="py-4 lg:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
