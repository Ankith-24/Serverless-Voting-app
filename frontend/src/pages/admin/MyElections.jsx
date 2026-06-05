import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function MyElections() {
  const [elections, setElections] = useState([]);
  const [editElection, setEditElection] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', candidates: [], startDate: '', endDate: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const load = () => {
    api.get('/api/elections').then((res) => setElections(res.data.elections || [])).catch(() => { });
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (electionId, title) => {
    if (!confirm(`Delete "${title}"? All votes will be lost.`)) return;
    try {
      await api.delete(`/api/elections/${electionId}`);
      setSuccess('Election deleted');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusChange = async (electionId, newStatus) => {
    try {
      await api.put(`/api/elections/${electionId}/status`, { status: newStatus });
      setSuccess(`Election ${newStatus === 'open' ? 'opened' : newStatus === 'closed' ? 'closed' : 'set to draft'}`);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEdit = (election) => {
    setEditElection(election);
    setEditForm({
      title: election.title,
      description: election.description || '',
      candidates: election.candidates.map((c) => ({ name: c.name, bio: c.bio || '', party: c.party || '' })),
      startDate: election.startDate?.slice(0, 16) || '',
      endDate: election.endDate?.slice(0, 16) || '',
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/elections/${editElection.electionId}`, {
        title: editForm.title,
        description: editForm.description,
        candidates: editForm.candidates,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      setEditElection(null);
      setSuccess('Election updated');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    }
  };

  // Helper for illustrative status badge variations
  const getStatusClasses = (status) => {
    switch (status) {
      case 'open': return 'bg-emerald-200 text-emerald-950 border-emerald-400';
      case 'closed': return 'bg-rose-200 text-rose-950 border-rose-400';
      default: return 'bg-amber-200 text-amber-950 border-amber-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 sm:p-10 selection:bg-yellow-200 relative">

      {/* Header Container with Add Trigger Button split layout */}
      <div className="max-w-6xl mx-auto mb-8 p-6 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tight mb-1 flex items-center gap-3">
            <span className="p-1.5 bg-yellow-300 border-2 border-black rounded-xl inline-block rotate-[-2deg]">📋</span>
            My Elections
          </h1>
          <p className="text-gray-600 font-bold text-sm sm:text-base">
            Configure system states, run analytics, or modify active candidates.
          </p>
        </div>
        <button
          className="px-5 py-3 bg-indigo-300 hover:bg-indigo-400 text-black font-black text-sm border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          onClick={() => navigate('/admin/create-election')}
        >
          ➕ New Election
        </button>
      </div>

      {/* Floating System Notifications */}
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

      {/* Grid Content Arrays */}
      {elections.length === 0 ? (
        <div className="max-w-md mx-auto bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <span className="text-5xl block mb-3">📝</span>
          <h3 className="text-2xl font-black text-black mb-1">No elections yet</h3>
          <p className="text-gray-600 font-bold text-sm">Launch your first structural campus ballot run to get started!</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {elections.map((election) => {
            const status = election.status || 'draft';
            return (
              <div key={election.electionId} className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                <div>
                  {/* Status Badges */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold bg-gray-100 border border-black px-2 py-0.5 rounded-md text-gray-700">
                      👥 {election.candidates?.length || 0} Candidates
                    </span>
                    <span className={`px-2.5 py-0.5 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${getStatusClasses(status)}`}>
                      ● {status}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-black tracking-tight mb-2 leading-tight">
                    {election.title}
                  </h3>

                  {election.description && (
                    <p className="text-gray-500 font-bold text-xs line-clamp-2 mb-4 bg-gray-50 border border-black border-dashed p-2.5 rounded-xl">
                      {election.description}
                    </p>
                  )}

                  <div className="text-[11px] font-bold text-gray-700 bg-yellow-50 border border-black px-2 py-1.5 rounded-xl text-center mb-4">
                    📅 {new Date(election.startDate).toLocaleDateString()} → {new Date(election.endDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Interactive Tool Actions Tray */}
                <div className="pt-4 border-t-2 border-black border-dashed flex flex-wrap gap-2">
                  <button
                    className="px-2.5 py-1.5 bg-sky-200 hover:bg-sky-300 text-black border-2 border-black rounded-lg font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1"
                    onClick={() => navigate(`/admin/elections/${election.electionId}/results`)}
                  >
                    📊 Metrics
                  </button>
                  <button
                    className="px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-black border-2 border-black rounded-lg font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1"
                    onClick={() => openEdit(election)}
                  >
                    ✏️ Edit
                  </button>

                  {/* Contextual Status Triggers */}
                  {status === 'draft' && (
                    <button
                      className="px-2.5 py-1.5 bg-emerald-300 hover:bg-emerald-400 text-black border-2 border-black rounded-lg font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                      onClick={() => handleStatusChange(election.electionId, 'open')}
                    >
                      ▶️ Open Polls
                    </button>
                  )}
                  {status === 'open' && (
                    <button
                      className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-black border-2 border-black rounded-lg font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                      onClick={() => handleStatusChange(election.electionId, 'closed')}
                    >
                      ⏹️ Close Run
                    </button>
                  )}
                  {status === 'closed' && (
                    <button
                      className="px-2.5 py-1.5 bg-purple-200 hover:bg-purple-300 text-black border-2 border-black rounded-lg font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                      onClick={() => handleStatusChange(election.electionId, 'draft')}
                    >
                      ↩️ Reset Draft
                    </button>
                  )}

                  {/* Delete Trigger */}
                  <button
                    className="ml-auto px-2.5 py-1.5 bg-rose-300 hover:bg-rose-400 text-black border-2 border-black rounded-lg font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    onClick={() => handleDelete(election.electionId, election.title)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ILLUSTRATED MODAL DIALOG COMPONENT */}
      {editElection && (
        <div className="fixed inset-0 w-full h-full bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setEditElection(null)}>
          <div
            className="w-full max-w-lg bg-white border-4 border-black rounded-3xl p-6 max-h-[85vh] overflow-y-auto shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Heading Header */}
            <div className="pb-3 border-b-2 border-black border-dashed flex justify-between items-center">
              <h2 className="text-2xl font-black text-black">✏️ Edit Core Configuration</h2>
              <button
                onClick={() => setEditElection(null)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-lg font-black text-black flex items-center justify-center text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">

              {/* Title Input */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-black text-black uppercase tracking-wide">Election Title</label>
                <input
                  className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-sm text-black focus:outline-none focus:bg-indigo-50"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-black text-black uppercase tracking-wide">Description Summary</label>
                <textarea
                  className="w-full h-20 px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-sm text-black focus:outline-none focus:bg-indigo-50 resize-none"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              {/* Nested Nominee Field Matrix */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black text-black uppercase tracking-wide">Candidate Lineup</label>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 border border-black border-dashed p-3 rounded-2xl bg-gray-50">
                  {editForm.candidates.map((c, idx) => (
                    <div key={idx} className="bg-white border-2 border-black p-3 rounded-xl space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-xs font-black text-indigo-600 uppercase tracking-wide">Position #{idx + 1}</div>
                      <input
                        className="w-full px-2 py-1 bg-white border border-black rounded-md text-xs font-bold"
                        placeholder="Name"
                        value={c.name}
                        onChange={(e) => { const u = [...editForm.candidates]; u[idx] = { ...u[idx], name: e.target.value }; setEditForm({ ...editForm, candidates: u }); }}
                        required
                      />
                      <input
                        className="w-full px-2 py-1 bg-white border border-black rounded-md text-xs font-bold"
                        placeholder="Bio (optional)"
                        value={c.bio}
                        onChange={(e) => { const u = [...editForm.candidates]; u[idx] = { ...u[idx], bio: e.target.value }; setEditForm({ ...editForm, candidates: u }); }}
                      />
                      <input
                        className="w-full px-2 py-1 bg-white border border-black rounded-md text-xs font-bold"
                        placeholder="Party Affiliation (optional)"
                        value={c.party}
                        onChange={(e) => { const u = [...editForm.candidates]; u[idx] = { ...u[idx], party: e.target.value }; setEditForm({ ...editForm, candidates: u }); }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Datetime Allocation Matrix Splits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-black uppercase tracking-wide">Start Date Window</label>
                  <input
                    className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-xs text-black"
                    type="datetime-local"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-black uppercase tracking-wide">End Date Window</label>
                  <input
                    className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-xs text-black"
                    type="datetime-local"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Sheet Footer Triggers */}
              <div className="pt-3 border-t-2 border-black border-dashed flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black font-black text-sm border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
                  type="button"
                  onClick={() => setEditElection(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-emerald-300 hover:bg-emerald-400 text-black font-black text-sm border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
                  type="submit"
                >
                  Save Changes 💾
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}