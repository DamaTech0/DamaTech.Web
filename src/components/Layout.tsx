import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const NAV = [
  { to: '/dashboard', icon: '▦', label: 'Dashboard' },
  { to: '/devices',   icon: '📺', label: 'Devices'   },
  { to: '/media',     icon: '🖼️', label: 'Media'     },
  { to: '/schedules', icon: '📅', label: 'Schedules' },
];

export default function Layout({ children, title, subtitle, actions }: Props) {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">📡</div>
          <div>
            <div className="sidebar-brand-name">DamaTech</div>
            <div className="sidebar-brand-sub">Digital Signage</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-user-email" title={email ?? ''}>{email}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Sign out">
            ↩
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">{title}</div>
            {subtitle && <div className="page-subtitle">{subtitle}</div>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </div>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
