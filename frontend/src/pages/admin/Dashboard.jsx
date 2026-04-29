import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, ended: 0, upcoming: 0 });

  useEffect(() => {
    api.get('/api/polls').then((res) => {
      const polls = res.data.polls || [];
      const now = new Date();
      setStats({
        total: polls.length,
        active: polls.filter((p) => now >= new Date(p.startDate) && now <= new Date(p.endDate)).length,
        ended: polls.filter((p) => now > new Date(p.endDate)).length,
        upcoming: polls.filter((p) => now < new Date(p.startDate)).length,
      });
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your polls and view statistics</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">My Polls</div><div className="stat-value">{stats.total}</div></div>
        <div className="stat-card"><div className="stat-label">Active</div><div className="stat-value">{stats.active}</div></div>
        <div className="stat-card"><div className="stat-label">Upcoming</div><div className="stat-value">{stats.upcoming}</div></div>
        <div className="stat-card"><div className="stat-label">Ended</div><div className="stat-value">{stats.ended}</div></div>
      </div>
    </div>
  );
}
