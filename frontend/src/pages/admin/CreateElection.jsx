import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function CreateElection() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [candidates, setCandidates] = useState([
    { name: '', bio: '', party: '' },
    { name: '', bio: '', party: '' },
  ]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eligYear, setEligYear] = useState('');
  const [eligProgram, setEligProgram] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Compute the minimum datetime value (current time, formatted for datetime-local input)
  const getNowString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const nowString = getNowString();

  const addCandidate = () => setCandidates([...candidates, { name: '', bio: '', party: '' }]);
  const removeCandidate = (idx) => {
    if (candidates.length <= 2) return;
    setCandidates(candidates.filter((_, i) => i !== idx));
  };
  const updateCandidate = (idx, field, val) => {
    const updated = [...candidates];
    updated[idx] = { ...updated[idx], [field]: val };
    setCandidates(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const filtered = candidates.filter((c) => c.name.trim());
    if (filtered.length < 2) {
      setError('At least 2 candidates with names are required');
      return;
    }
    setLoading(true);
    try {
      // Validate dates are not in the past
      const now = new Date();
      if (new Date(startDate) < now) {
        setError('Start date cannot be in the past');
        setLoading(false);
        return;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        setError('End date must be after start date');
        setLoading(false);
        return;
      }
      const payload = {
        title,
        description,
        candidates: filtered,
        startDate,
        endDate,
      };
      if (eligYear || eligProgram) {
        payload.eligibilityRules = {};
        if (eligYear) payload.eligibilityRules.year = eligYear;
        if (eligProgram) payload.eligibilityRules.program = eligProgram;
      }
      await api.post('/api/elections', payload);
      navigate('/admin/my-elections');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 sm:p-10 selection:bg-yellow-200">

      {/* Header Panel */}
      <div className="max-w-3xl mx-auto mb-8 p-6 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black text-black tracking-tight mb-2 flex items-center gap-3">
          <span className="p-1.5 bg-amber-300 border-2 border-black rounded-xl inline-block rotate-[-2deg]">➕</span>
          Create New Election
        </h1>
        <p className="text-gray-600 font-bold text-sm sm:text-base">
          Configure poll metadata, criteria rules, and candidate slates.
        </p>
      </div>

      {/* Main Form Configuration Card */}
      <div className="max-w-3xl mx-auto bg-white border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

        {error && (
          <div className="mb-6 p-4 bg-rose-200 border-2 border-black rounded-xl font-black text-rose-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Election Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-lg font-black text-black tracking-wide">Election Title</label>
            <input
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50 focus:border-indigo-600 transition-colors"
              placeholder="e.g. Student Council President 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-lg font-black text-black tracking-wide flex items-center gap-2">
              Description
              <span className="text-xs font-bold text-gray-400 lowercase italic">(optional)</span>
            </label>
            <textarea
              className="w-full h-24 px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50 focus:border-indigo-600 transition-colors resize-none"
              placeholder="Describe the purpose of this election..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Dynamic Candidates Management Section */}
          <div className="flex flex-col gap-3">
            <label className="text-lg font-black text-black tracking-wide">Nominated Candidates</label>

            <div className="space-y-4">
              {candidates.map((c, idx) => (
                <div key={idx} className="bg-indigo-50 border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">

                  {/* Candidate Badge Header */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-2.5 py-0.5 bg-indigo-200 border-2 border-black rounded-md text-xs font-black text-indigo-950">
                      Candidate #{idx + 1}
                    </span>
                    {candidates.length > 2 && (
                      <button
                        type="button"
                        className="w-7 h-7 bg-rose-200 hover:bg-rose-300 border-2 border-black rounded-md font-black text-xs text-black flex items-center justify-center transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        onClick={() => removeCandidate(idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Core Identity Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="sm:col-span-2">
                      <input
                        className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-sm text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50"
                        placeholder="Candidate Full Name *"
                        value={c.name}
                        onChange={(e) => updateCandidate(idx, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <input
                        className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-sm text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50"
                        placeholder="Party Affiliation"
                        value={c.party}
                        onChange={(e) => updateCandidate(idx, 'party', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Biography Row */}
                  <input
                    className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl font-bold text-sm text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50"
                    placeholder="Short campaign bio overview..."
                    value={c.bio}
                    onChange={(e) => updateCandidate(idx, 'bio', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="self-start mt-1 px-4 py-2 bg-white hover:bg-gray-50 text-black font-black text-xs border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-1.5"
              onClick={addCandidate}
            >
              ➕ Add Candidate Card
            </button>
          </div>

          {/* Scheduling Window Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-black text-black uppercase tracking-wide">Start Date Window</label>
              <input
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black focus:outline-none focus:bg-indigo-50 cursor-pointer"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                min={nowString}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-black text-black uppercase tracking-wide">End Date Window</label>
              <input
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black focus:outline-none focus:bg-indigo-50 cursor-pointer"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || nowString}
              />
            </div>
          </div>

          {/* Voter Eligibility Criteria */}
          <div className="flex flex-col gap-1.5 pt-2">
            <label className="text-lg font-black text-black tracking-wide flex items-center gap-2">
              Voter Eligibility Rules
              <span className="text-xs font-bold text-gray-400 lowercase italic">(optional — leave blank for public access)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-yellow-50 border-2 border-black border-dashed p-4 rounded-2xl">
              <div>
                <select
                  className="w-full px-3 py-2.5 bg-white border-2 border-black rounded-xl font-bold text-sm text-black focus:outline-none cursor-pointer appearance-none"
                  value={eligYear}
                  onChange={(e) => setEligYear(e.target.value)}
                >
                  <option value="">Any Class Year</option>
                  <option value="1">1st Year only</option>
                  <option value="2">2nd Year only</option>
                  <option value="3">3rd Year only</option>
                  <option value="4">4th Year only</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <input
                  className="w-full px-3 py-2.5 bg-white border-2 border-black rounded-xl font-bold text-sm text-black placeholder-gray-400 focus:outline-none"
                  placeholder="Specific Department Program Filter (e.g. Computer Science)"
                  value={eligProgram}
                  onChange={(e) => setEligProgram(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submission Primary Action */}
          <button
            className="w-full py-4 bg-emerald-300 hover:bg-emerald-400 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-black font-black text-xl border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 pt-4"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Publishing Ballot...' : '🗳️ Create & Launch Election'}
          </button>
        </form>

      </div>
    </div>
  );
}