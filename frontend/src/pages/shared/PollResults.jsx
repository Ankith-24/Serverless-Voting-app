import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PollBarChart, PollPieChart } from '../../components/Charts';
import { useAuth } from '../../context/AuthContext';

export default function PollResults() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/polls/${pollId}/results`)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pollId]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><h3>Results not found</h3></div>;

  const backPath = user?.role === 'SUPER_ADMIN' ? '/super-admin/polls' : '/admin/my-polls';

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(backPath)} style={{ marginBottom: '1rem' }}>
        ← Back
      </button>
      <div className="card" style={{ maxWidth: 700 }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{data.poll.title}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Total Votes: <strong style={{ color: 'var(--text-primary)' }}>{data.totalVotes}</strong>
        </p>
        <PollBarChart data={data.results} />
        <div style={{ marginTop: '2rem' }}>
          <PollPieChart data={data.results} />
        </div>
        <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
          <table>
            <thead><tr><th>Option</th><th>Votes</th><th>Percentage</th></tr></thead>
            <tbody>
              {data.results.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.name}</td>
                  <td>{r.votes}</td>
                  <td>{data.totalVotes > 0 ? ((r.votes / data.totalVotes) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
