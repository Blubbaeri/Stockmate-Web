import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutGrid, Box, Compass, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  user: any;
}

export default function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
  }, [user]);

  const userName = email ? email.split('@')[0] : 'User';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutGrid },
    { id: 'inventory', label: 'Koleksi Saya', path: '/inventory', icon: Box },
    { id: 'explore', label: 'Explore', path: '/explore', icon: Compass },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="container-layout">
      {/* Sidebar - Desktop Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <Box size={22} />
          </div>
          <span className="sidebar-logo-text">StockMate</span>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {userName.charAt(0)}
            </div>
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom Tab Bar - Mobile Navigation */}
      <nav className="bottom-tab">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`bottom-tab-item ${isActive ? 'active' : ''}`}
            >
              <div className="bottom-tab-icon-wrap">
                <Icon size={20} />
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
        <button onClick={handleLogout} className="bottom-tab-item">
          <div className="bottom-tab-icon-wrap" style={{ color: 'var(--out-of-stock)' }}>
            <LogOut size={20} />
          </div>
          <span>Keluar</span>
        </button>
      </nav>
    </div>
  );
}
