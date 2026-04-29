import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function getPollStatus(start, end) {
  const now = new Date();
  if (now < new Date(start)) return 'upcoming';
  if (now > new Date(end)) return 'ended';
  return 'active';
}

export default function AvailablePolls() {
  const [polls, setPolls] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/polls').then((res) => setPolls(res.data.polls || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Available Polls</h1>
        <p>Vote on active polls or view results</p>
      </div>
      {polls.length === 0 ? (
        <div className="empty-state"><h3>No polls available</h3><p>Check back later for new polls.</p></div>
      ) : (
        <div className="polls-grid">
          {polls.map((poll) => {
            const status = getPollStatus(poll.startDate, poll.endDate);
            return (
              <div key={poll.pollId} className="poll-card" onClick={() => navigate(`/voter/polls/${poll.pollId}`)}>
                <h3>{poll.title}</h3>
                <div className="poll-meta">
                  <span>{poll.options?.length} options</span>
                  <span className={`poll-status ${status}`}>● {status}</span>
                </div>
                <div className="poll-meta">
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
