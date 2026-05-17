import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PollBarChart, PollPieChart } from '../../components/Charts';

export default function VotePoll() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [serverTime, setServerTime] = useState(null);

  const loadPoll = async () => {
    try {
      const res = await api.get(`/api/polls/${pollId}`);
      setPoll(res.data.poll);
      setHasVoted(res.data.hasVoted);
      setServerTime(res.data.serverTime);
      if (res.data.hasVoted) {
        const resultsRes = await api.get(`/api/polls/${pollId}/results`);
        setResults(resultsRes.data);
      }
    } catch {
      setError('Poll not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPoll(); }, [pollId]);

  const handleVote = async () => {
    if (!selectedOption) { setError('Please select an option'); return; }
    setVoting(true);
    setError('');
    try {
      await api.post(`/api/polls/${pollId}/vote`, { selectedOptionId: selectedOption });
      setSuccess('Vote cast successfully!');
      setHasVoted(true);
      const resultsRes = await api.get(`/api/polls/${pollId}/results`);
      setResults(resultsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!poll) return <div className="empty-state"><h3>Poll not found</h3></div>;

  // Use server time for poll status
  const now = serverTime ? new Date(serverTime) : new Date();
  const isActive = now >= new Date(poll.startDate) && now <= new Date(poll.endDate);
  const isEnded = now > new Date(poll.endDate);

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/voter/polls')} style={{ marginBottom: '1rem' }}>
        ← Back to Polls
      </button>
      <div className="card" style={{ maxWidth: 700 }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{poll.title}</h2>
        <div className="poll-meta" style={{ marginBottom: '1rem' }}>
          <span className={`poll-status ${isActive ? 'active' : isEnded ? 'ended' : 'upcoming'}`}>
            ● {isActive ? 'Active' : isEnded ? 'Ended' : 'Upcoming'}
          </span>
          <span>📅 {new Date(poll.startDate).toLocaleString()} → {new Date(poll.endDate).toLocaleString()}</span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!hasVoted && isActive && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Select your choice:</p>
            <ul className="poll-options-list">
              {poll.options.map((opt) => (
                <li key={opt.id} className={`poll-option-item${selectedOption === opt.id ? ' selected' : ''}`}
                  onClick={() => setSelectedOption(opt.id)}>
                  <div className="radio-circle" />
                  <span>{opt.text}</span>
                </li>
              ))}
            </ul>
            <button className="btn btn-primary btn-block" style={{ marginTop: '1rem' }}
              onClick={handleVote} disabled={voting || !selectedOption}>
              {voting ? 'Submitting...' : '🗳️ Cast Vote'}
            </button>
          </>
        )}

        {!hasVoted && !isActive && !isEnded && (
          <div className="alert alert-error">This poll hasn't started yet.</div>
        )}
        {!hasVoted && isEnded && (
          <div className="alert alert-error">This poll has ended.</div>
        )}

        {hasVoted && results && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>📊 Live Results ({results.totalVotes} total votes)</h3>
            <PollBarChart data={results.results} />
            <div style={{ marginTop: '1.5rem' }}>
              <PollPieChart data={results.results} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
