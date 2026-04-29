import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VOTER' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data.users || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'VOTER' });
      setSuccess('User added successfully');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/api/users/${userId}/role`, { role: newRole });
      setSuccess('Role updated');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/users/${userId}`);
      setSuccess('User deleted');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Manage Users</h1>
          <p>Add, remove, and manage user roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add User</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select className="form-select" value={u.role}
                      onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                      style={{ width: 'auto', padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
                      <option value="VOTER">Voter</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.userId, u.name)}>
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New User</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="VOTER">Voter</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-1" style={{ marginTop: '1rem' }}>
                <button className="btn btn-primary" type="submit">Add User</button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
