import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function CreatePoll() {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addOption = () => setOptions([...options, '']);
  const removeOption = (idx) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };
  const updateOption = (idx, val) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const filtered = options.filter((o) => o.trim());
    if (filtered.length < 2) {
      setError('At least 2 non-empty options are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/polls', { title, options: filtered, startDate, endDate });
      navigate('/admin/my-polls');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Create New Poll</h1>
        <p>Set up a poll for voters</p>
      </div>
      <div className="card" style={{ maxWidth: 600 }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Poll Title</label>
            <input className="form-input" placeholder="e.g. Best Programming Language"
              value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Options</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-1 items-center" style={{ marginBottom: '0.5rem' }}>
                <input className="form-input" placeholder={`Option ${idx + 1}`}
                  value={opt} onChange={(e) => updateOption(idx, e.target.value)} required />
                {options.length > 2 && (
                  <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeOption(idx)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addOption} style={{ marginTop: '0.25rem' }}>
              ➕ Add Option
            </button>
          </div>
          <div className="flex gap-2">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Start Date</label>
              <input className="form-input" type="datetime-local" value={startDate}
                onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>End Date</label>
              <input className="form-input" type="datetime-local" value={endDate}
                onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Creating...' : '🚀 Create Poll'}
          </button>
        </form>
      </div>
    </div>
  );
}
