import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Zap, Activity, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="layout">
      {/* Mobile header */}
      <header className="mobile-header">
        <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(true)}>
          <Menu size={20} />
        </button>
        <div className="mobile-logo">
          <Zap size={18} className="logo-icon" />
          <span className="logo-text">TaskFlow</span>
        </div>
        <div className="avatar avatar-sm">{initials}</div>
      </header>

      {/* Sidebar overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Zap size={20} className="logo-icon" />
          <span className="logo-text">TaskFlow</span>
          <button className="mobile-close btn btn-ghost btn-icon" onClick={closeMobile}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          {user?.isAdmin && (
            <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
              <FolderKanban size={18} />
              <span>Projects</span>
            </NavLink>
          )}
          <NavLink to="/activity" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            <Activity size={18} />
            <span>Activity</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar avatar-sm">{initials}</div>
            <div className="user-details">
              <div className="user-name truncate">{user?.name}</div>
              <div className="user-email truncate text-xs text-muted">{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
