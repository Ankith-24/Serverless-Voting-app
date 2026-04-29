import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navConfig = {
  SUPER_ADMIN: {
    base: '/super-admin',
    links: [
      { to: '/super-admin', label: 'Dashboard', icon: '📊' },
      { to: '/super-admin/users', label: 'Manage Users', icon: '👥' },
      { to: '/super-admin/polls', label: 'All Polls', icon: '📋' },
    ],
  },
  ADMIN: {
    base: '/admin',
    links: [
      { to: '/admin', label: 'Dashboard', icon: '📊' },
      { to: '/admin/create-poll', label: 'Create Poll', icon: '➕' },
      { to: '/admin/my-polls', label: 'My Polls', icon: '📋' },
    ],
  },
  VOTER: {
    base: '/voter',
    links: [
      { to: '/voter', label: 'Dashboard', icon: '📊' },
      { to: '/voter/polls', label: 'Available Polls', icon: '🗳️' },
    ],
  },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  const config = navConfig[user.role];
  if (!config) return null;

  const roleClass = user.role === 'SUPER_ADMIN' ? 'super-admin' : user.role.toLowerCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>⚡ PollStream</h2>
        <div className={`role-badge ${roleClass}`}>
          {user.role.replace('_', ' ')}
        </div>
      </div>
      <nav className="sidebar-nav">
        {config.links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === config.base}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
          <div style={{ fontSize: '0.8rem' }}>{user.email}</div>
        </div>
        <button className="btn btn-secondary btn-block btn-sm" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
