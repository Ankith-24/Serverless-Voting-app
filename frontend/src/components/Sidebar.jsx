import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navConfig = {
  SUPER_ADMIN: {
    base: '/super-admin',
    links: [
      { to: '/super-admin', label: 'Dashboard', icon: '📊' },
      { to: '/super-admin/users', label: 'Manage Users', icon: '👥' },
      { to: '/super-admin/elections', label: 'All Elections', icon: '🗳️' },
    ],
  },
  ADMIN: {
    base: '/admin',
    links: [
      { to: '/admin', label: 'Dashboard', icon: '📊' },
      { to: '/admin/create-election', label: 'Create Election', icon: '➕' },
      { to: '/admin/my-elections', label: 'My Elections', icon: '🗳️' },
    ],
  },
  VOTER: {
    base: '/voter',
    links: [
      { to: '/voter', label: 'Dashboard', icon: '📊' },
      { to: '/voter/elections', label: 'Available Elections', icon: '🗳️' },
    ],
  },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  const config = navConfig[user.role];
  if (!config) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Assign distinct aesthetic illustration accents based on role levels
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-rose-300 text-rose-950 border-rose-600';
      case 'ADMIN':
        return 'bg-amber-300 text-amber-950 border-amber-600';
      default:
        return 'bg-indigo-300 text-indigo-950 border-indigo-600';
    }
  };

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-white border-r-4 border-black flex flex-col p-5 justify-between select-none z-40">

      {/* Top Branding Section */}
      <div>
        <div className="pb-5 mb-6 border-b-2 border-black border-dashed">
          <h2 className="text-2xl font-black text-black tracking-tight flex items-center gap-2 mb-2">
            <span className="p-1 bg-indigo-100 border border-black rounded-lg inline-block text-lg">🗳️</span>
            PollStream
          </h2>
          <div className={`inline-block px-3 py-0.5 border-2 border-black rounded-md text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${getRoleBadgeStyle(user.role)}`}>
            {user.role.replace('_', ' ')}
          </div>
        </div>

        {/* Dynamic Nav List links */}
        <nav className="space-y-3">
          {config.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === config.base}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 border-2 border-black font-black text-sm text-black rounded-xl transition-all duration-100 ${isActive
                  ? 'bg-yellow-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]'
                  : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]'
                }`
              }
            >
              <span className="text-lg bg-white border border-black w-7 h-7 rounded-md flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Profile Footer Section */}
      <div className="pt-5 border-t-2 border-black border-dashed">
        <div className="bg-gray-50 border-2 border-black rounded-xl p-3 mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="font-black text-black text-sm truncate">{user.name}</div>
          <div className="text-xs font-bold text-gray-500 truncate mt-0.5">{user.email}</div>
        </div>

        <button
          className="w-full py-2.5 bg-white hover:bg-rose-50 text-black font-black text-xs border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </div>

    </aside>
  );
}