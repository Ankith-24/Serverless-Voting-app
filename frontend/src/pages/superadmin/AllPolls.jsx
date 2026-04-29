import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function getPollStatus(start, end) {
  const now = new Date();
  if (now < new Date(start)) return 'upcoming';
  if (now > new Date(end)) return 'ended';
  return 'active';
}

export default function AllPolls() {
  const [polls, setPolls] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/polls').then((res) => setPolls(res.data.polls || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>All Polls</h1>
        <p>View every poll across the platform</p>
      </div>
      {polls.length === 0 ? (
        <div className="empty-state"><h3>No polls yet</h3><p>Polls created by admins will appear here.</p></div>
      ) : (
        <div className="polls-grid">
          {polls.map((poll) => {
            const status = getPollStatus(poll.startDate, poll.endDate);
            return (
              <div key={poll.pollId} className="poll-card" onClick={() => navigate(`/super-admin/polls/${poll.pollId}/results`)}>
                <h3>{poll.title}</h3>
                <div className="poll-meta">
                  <span>By {poll.createdByName || 'Admin'}</span>
                  <span>{poll.options?.length} options</span>
                </div>
                <span className={`poll-status ${status}`}>● {status}</span>
                <div className="poll-meta" style={{ marginTop: '0.5rem' }}>
                  <span>📅 {new Date(poll.startDate).toLocaleDateString()} → {new Date(poll.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
