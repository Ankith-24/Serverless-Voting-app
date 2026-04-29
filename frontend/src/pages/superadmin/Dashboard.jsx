import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ users: 0, polls: 0, admins: 0, voters: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, pollsRes] = await Promise.all([
          api.get('/api/users'),
          api.get('/api/polls'),
        ]);
        const users = usersRes.data.users || [];
        setStats({
          users: users.length,
          polls: (pollsRes.data.polls || []).length,
          admins: users.filter((u) => u.role === 'ADMIN').length,
          voters: users.filter((u) => u.role === 'VOTER').length,
        });
      } catch { /* ignore */ }
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Super Admin Dashboard</h1>
        <p>Overview of the entire platform</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-value">{stats.users}</div></div>
        <div className="stat-card"><div className="stat-label">Total Polls</div><div className="stat-value">{stats.polls}</div></div>
        <div className="stat-card"><div className="stat-label">Admins</div><div className="stat-value">{stats.admins}</div></div>
        <div className="stat-card"><div className="stat-label">Voters</div><div className="stat-value">{stats.voters}</div></div>
      </div>
    </div>
  );
}
