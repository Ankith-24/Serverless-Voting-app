import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function VoterDashboard() {
  const [stats, setStats] = useState({ available: 0, active: 0, voted: 0 });

  useEffect(() => {
    api.get('/api/polls').then((res) => {
      const polls = res.data.polls || [];
      const now = new Date();
      setStats({
        available: polls.length,
        active: polls.filter((p) => now >= new Date(p.startDate) && now <= new Date(p.endDate)).length,
        voted: 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Voter Dashboard</h1>
        <p>Browse and vote on active polls</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Polls</div><div className="stat-value">{stats.available}</div></div>
        <div className="stat-card"><div className="stat-label">Active Now</div><div className="stat-value">{stats.active}</div></div>
      </div>
    </div>
  );
}
