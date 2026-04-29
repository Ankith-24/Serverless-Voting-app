import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function getPollStatus(start, end) {
  const now = new Date();
  if (now < new Date(start)) return 'upcoming';
  if (now > new Date(end)) return 'ended';
  return 'active';
}

export default function MyPolls() {
  const [polls, setPolls] = useState([]);
  const [editPoll, setEditPoll] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', options: [], startDate: '', endDate: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const load = () => {
    api.get('/api/polls').then((res) => setPolls(res.data.polls || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (pollId, title) => {
    if (!confirm(`Delete "${title}"? All votes will be lost.`)) return;
    try {
      await api.delete(`/api/polls/${pollId}`);
      setSuccess('Poll deleted');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEdit = (poll) => {
    setEditPoll(poll);
    setEditForm({
      title: poll.title,
      options: poll.options.map((o) => o.text),
      startDate: poll.startDate?.slice(0, 16) || '',
      endDate: poll.endDate?.slice(0, 16) || '',
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/polls/${editPoll.pollId}`, {
        title: editForm.title,
        options: editForm.options,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      setEditPoll(null);
      setSuccess('Poll updated');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div><h1>My Polls</h1><p>Manage your created polls</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/create-poll')}>➕ New Poll</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {polls.length === 0 ? (
        <div className="empty-state"><h3>No polls yet</h3><p>Create your first poll to get started!</p></div>
      ) : (
        <div className="polls-grid">
          {polls.map((poll) => {
            const status = getPollStatus(poll.startDate, poll.endDate);
            return (
              <div key={poll.pollId} className="poll-card" style={{ cursor: 'default' }}>
                <h3>{poll.title}</h3>
                <div className="poll-meta">
                  <span>{poll.options?.length} options</span>
                  <span className={`poll-status ${status}`}>● {status}</span>
                </div>
                <div className="poll-meta">
                  <span>📅 {new Date(poll.startDate).toLocaleDateString()} → {new Date(poll.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-1" style={{ marginTop: '0.75rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/polls/${poll.pollId}/results`)}>📊 Results</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(poll)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(poll.pollId, poll.title)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editPoll && (
        <div className="modal-overlay" onClick={() => setEditPoll(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Poll</h2>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label>Title</label>
                <input className="form-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Options</label>
                {editForm.options.map((opt, idx) => (
                  <input key={idx} className="form-input" value={opt} style={{ marginBottom: '0.5rem' }}
                    onChange={(e) => { const u = [...editForm.options]; u[idx] = e.target.value; setEditForm({ ...editForm, options: u }); }} required />
                ))}
              </div>
              <div className="flex gap-2">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Start Date</label>
                  <input className="form-input" type="datetime-local" value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>End Date</label>
                  <input className="form-input" type="datetime-local" value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-1">
                <button className="btn btn-primary" type="submit">Save Changes</button>
                <button className="btn btn-secondary" type="button" onClick={() => setEditPoll(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
