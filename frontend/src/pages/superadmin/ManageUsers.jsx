import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VOTER', studentId: '', year: '', program: '' });
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
      setForm({ name: '', email: '', password: '', role: 'VOTER', studentId: '', year: '', program: '' });
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

  const handleEligibilityToggle = async (userId, currentEligible) => {
    try {
      await api.put(`/api/users/${userId}/eligible`, { eligible: !currentEligible });
      setSuccess('Eligibility updated');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update eligibility');
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
    <div className="min-h-screen bg-[#FFFBEB] p-6 sm:p-10 selection:bg-yellow-200">

      {/* Top Header Section */}
      <div className="max-w-6xl mx-auto mb-8 p-6 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tight mb-1 flex items-center gap-3">
            <span className="p-1.5 bg-indigo-200 border-2 border-black rounded-xl inline-block rotate-[-2deg]">👥</span>
            Manage Users
          </h1>
          <p className="text-gray-600 font-bold text-sm sm:text-base">
            Add, remove, and manage user roles or configure global voter eligibility profiles.
          </p>
        </div>
        <button
          className="px-5 py-3 bg-emerald-300 hover:bg-emerald-400 text-black font-black text-sm border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          ➕ Add New User
        </button>
      </div>

      {/* Dynamic Alerts Tray */}
      <div className="max-w-6xl mx-auto space-y-3 mb-6">
        {error && (
          <div className="p-4 bg-rose-200 border-2 border-black rounded-xl font-black text-rose-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-200 border-2 border-black rounded-xl font-black text-emerald-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span>🎉</span> {success}
          </div>
        )}
      </div>

      {/* Main Roster Table Layout */}
      <div className="max-w-6xl mx-auto bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-indigo-50 border-b-4 border-black">
                <th className="p-4 text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">Name</th>
                <th className="p-4 text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">Email</th>
                <th className="p-4 text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">Student ID</th>
                <th className="p-4 text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">Role</th>
                <th className="p-4 text-sm font-black text-black uppercase tracking-wider border-r-2 border-black text-center">Eligible</th>
                <th className="p-4 text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">Joined</th>
                <th className="p-4 text-sm font-black text-black uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black font-bold text-sm text-gray-700">
              {users.map((u) => (
                <tr key={u.userId} className="hover:bg-yellow-50/50 transition-colors">
                  <td className="p-4 text-black font-black border-r-2 border-black truncate max-w-[160px]">{u.name}</td>
                  <td className="p-4 border-r-2 border-black truncate max-w-[200px]">{u.email}</td>
                  <td className="p-4 border-r-2 border-black font-mono">{u.studentId || '—'}</td>
                  <td className="p-4 border-r-2 border-black">
                    <div className="relative inline-block w-full">
                      <select
                        className="w-full py-1.5 pl-2 pr-8 bg-white border-2 border-black rounded-lg font-black text-xs text-black focus:outline-none appearance-none cursor-pointer"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                      >
                        <option value="VOTER">🎓 Student</option>
                        <option value="ADMIN">🛠️ Admin</option>
                        <option value="SUPER_ADMIN">👑 Super Admin</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black font-black text-xs border-l-2 border-black">
                        ▼
                      </div>
                    </div>
                  </td>
                  <td className="p-4 border-r-2 border-black text-center">
                    <button
                      className={`px-3 py-1 border-2 border-black rounded-lg font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${u.eligible !== false
                          ? 'bg-emerald-200 text-emerald-950 hover:bg-emerald-300'
                          : 'bg-rose-200 text-rose-950 hover:bg-rose-300'
                        }`}
                      onClick={() => handleEligibilityToggle(u.userId, u.eligible !== false)}
                    >
                      {u.eligible !== false ? '✓ Yes' : '✕ No'}
                    </button>
                  </td>
                  <td className="p-4 border-r-2 border-black font-mono">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      className="px-3 py-1.5 bg-rose-300 hover:bg-rose-400 text-black border-2 border-black rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1 mx-auto"
                      onClick={() => handleDelete(u.userId, u.name)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500 font-black text-lg bg-gray-50">
                    🏜️ No users found inside the index.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 w-full h-full bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-lg bg-white border-4 border-black rounded-3xl p-6 max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="pb-3 border-b-2 border-black border-dashed flex justify-between items-center">
              <h2 className="text-2xl font-black text-black">➕ Add New User Account</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-lg font-black text-black flex items-center justify-center text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-black text-black uppercase tracking-wide">Full Name</label>
                <input
                  className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-sm text-black focus:outline-none focus:bg-indigo-50"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-black text-black uppercase tracking-wide">Email Address</label>
                <input
                  className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-sm text-black focus:outline-none focus:bg-indigo-50"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@pollapp.com"
                  required
                />
                <span className="text-[11px] font-bold text-amber-600 ml-1">* Must end with @pollapp.com</span>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-black text-black uppercase tracking-wide">Account Password</label>
                <input
                  className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-sm text-black focus:outline-none focus:bg-indigo-50"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
              </div>

              {/* Role Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-black text-black uppercase tracking-wide">Access Role Clearance</label>
                <select
                  className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-sm text-black focus:outline-none cursor-pointer"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="VOTER">Student</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              {/* Student ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-black text-black uppercase tracking-wide flex items-center gap-1.5">
                  Student ID
                  <span className="text-xs font-bold text-gray-400 lowercase italic">(optional)</span>
                </label>
                <input
                  className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-sm text-black focus:outline-none focus:bg-indigo-50"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  placeholder="e.g. STU2026001"
                />
              </div>

              {/* Year & Program Double Grid Splits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-yellow-50 border-2 border-black border-dashed p-3 rounded-2xl">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-black uppercase tracking-wide">Class Year</label>
                  <select
                    className="w-full px-2 py-2 bg-white border-2 border-black rounded-xl font-bold text-xs text-black cursor-pointer"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5+">5+ Year</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-black uppercase tracking-wide">Program Field</label>
                  <input
                    className="w-full px-2 py-2 bg-white border-2 border-black rounded-xl font-bold text-xs text-black focus:outline-none"
                    value={form.program}
                    onChange={(e) => setForm({ ...form, program: e.target.value })}
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>

              {/* Action Sheet Footer */}
              <div className="pt-3 border-t-2 border-black border-dashed flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black font-black text-sm border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-emerald-300 hover:bg-emerald-400 text-black font-black text-sm border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
                  type="submit"
                >
                  Add User 👤
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}