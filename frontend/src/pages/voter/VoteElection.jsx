import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ElectionBarChart, ElectionPieChart } from '../../components/Charts';

export default function VoteElection() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [serverTime, setServerTime] = useState(null);

  const loadElection = async () => {
    try {
      const res = await api.get(`/api/elections/${electionId}`);
      setElection(res.data.election);
      setHasVoted(res.data.hasVoted);
      setServerTime(res.data.serverTime);
      if (res.data.hasVoted || res.data.election.status === 'closed') {
        const resultsRes = await api.get(`/api/elections/${electionId}/results`);
        setResults(resultsRes.data);
      }
    } catch {
      setError('Election not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadElection(); }, [electionId]);

  const handleVote = async () => {
    if (!selectedCandidate) { setError('Please select a candidate'); return; }
    setVoting(true);
    setError('');
    try {
      await api.post(`/api/elections/${electionId}/vote`, { candidateId: selectedCandidate });
      setSuccess('Vote cast successfully!');
      setHasVoted(true);
      const resultsRes = await api.get(`/api/elections/${electionId}/results`);
      setResults(resultsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  // Neo-brutalist custom spinner screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-black border-t-indigo-500 rounded-full animate-spin shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
        <p className="mt-4 font-black text-black text-lg">Gathering poll data...</p>
      </div>
    );
  }

  // Neo-brutalist empty/error state
  if (!election) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-6">
        <div className="bg-white border-4 border-black p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-sm">
          <span className="text-4xl block mb-2">🔍</span>
          <h3 className="text-2xl font-black text-black">Election not found</h3>
          <button onClick={() => navigate('/voter/elections')} className="mt-4 px-4 py-2 bg-indigo-300 font-bold border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-400 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOpen = election.status === 'open';
  const isClosed = election.status === 'closed';
  const isDraft = election.status === 'draft';

  // Dynamic status badge themes for our illustrative UI
  const getStatusStyle = (status) => {
    switch (status) {
      case 'open': return 'bg-emerald-200 text-emerald-950 border-emerald-500';
      case 'closed': return 'bg-rose-200 text-rose-950 border-rose-500';
      default: return 'bg-amber-200 text-amber-950 border-amber-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-4 sm:p-8 selection:bg-yellow-200">

      {/* Back Button */}
      <button
        className="mb-6 px-4 py-2 bg-white hover:bg-gray-50 text-black font-black text-sm border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
        onClick={() => navigate('/voter/elections')}
      >
        ← Back to Elections
      </button>

      {/* Primary Card */}
      <div className="w-full max-w-2xl bg-white border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

        {/* Title Block */}
        <h2 className="text-3xl font-black text-black tracking-tight mb-3 drop-shadow-sm leading-tight">
          {election.title}
        </h2>

        {election.description && (
          <p className="text-gray-600 font-bold text-sm bg-gray-50 border-2 border-black border-dashed rounded-xl p-4 mb-5">
            {election.description}
          </p>
        )}

        {/* Metadata Timeline Bar */}
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold mb-6 pb-6 border-b-2 border-black border-dashed">
          <span className={`px-3 py-1 border-2 border-black rounded-full text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${getStatusStyle(election.status)}`}>
            ● {election.status}
          </span>
          <span className="bg-indigo-50 border-2 border-black rounded-lg py-1 px-3 text-black">
            📅 {new Date(election.startDate).toLocaleString()} → {new Date(election.endDate).toLocaleString()}
          </span>
        </div>

        {/* Alerts Block */}
        {error && (
          <div className="mb-6 p-4 bg-rose-200 border-2 border-black rounded-xl font-black text-rose-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 animate-shake">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-200 border-2 border-black rounded-xl font-black text-emerald-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span>🎉</span> {success}
          </div>
        )}

        {/* VOTING CONTAINER VIEW */}
        {!hasVoted && isOpen && (
          <>
            <p className="text-lg font-black text-black tracking-wide mb-4">
              Select your candidate:
            </p>

            <ul className="space-y-4">
              {election.candidates.map((candidate) => {
                const isSelected = selectedCandidate === candidate.id;
                return (
                  <li
                    key={candidate.id}
                    className={`group flex items-start gap-4 p-4 border-2 border-black rounded-2xl cursor-pointer transition-all ${isSelected
                        ? 'bg-indigo-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                        : 'bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5'
                      }`}
                    onClick={() => setSelectedCandidate(candidate.id)}
                  >
                    {/* Illustration-styled Radio Target */}
                    <div className={`mt-1 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-indigo-500' : 'bg-white group-hover:bg-gray-100'
                      }`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>

                    {/* Candidate Identity Layout */}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-black text-lg leading-snug">{candidate.name}</div>
                      {candidate.party && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 border border-black rounded-md text-xs font-bold text-amber-900">
                          🏛️ {candidate.party}
                        </span>
                      )}
                      {candidate.bio && (
                        <div className="text-gray-600 font-bold text-xs mt-2 break-words leading-relaxed pl-2 border-l-2 border-black">
                          {candidate.bio}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              className="w-full mt-6 py-4 bg-emerald-300 hover:bg-emerald-400 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-black font-black text-xl border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100"
              onClick={handleVote}
              disabled={voting || !selectedCandidate}
            >
              {voting ? 'Submitting Vote...' : '🗳️ Cast Vote'}
            </button>
          </>
        )}

        {/* STATIC CONDITIONAL BARS */}
        {!hasVoted && isDraft && (
          <div className="p-4 bg-amber-100 border-2 border-black border-dashed rounded-xl font-bold text-amber-950">
            ⏳ This election hasn't been opened yet. Check back when the countdown finishes!
          </div>
        )}

        {!hasVoted && isClosed && (
          <div className="p-4 bg-indigo-50 border-2 border-black rounded-xl font-bold text-indigo-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
            🔒 This election is closed. You can view the final metrics and audit scores below.
          </div>
        )}

        {/* GRAPH & DATA METRICS RESULTS VIEW */}
        {(hasVoted || isClosed) && results && (
          <div className="mt-4 pt-4 border-t-4 border-black border-dashed">
            <h3 className="text-2xl font-black text-black tracking-tight mb-4 flex items-center gap-2">
              <span>📊</span> Live Analytics
              <span className="text-sm px-2.5 py-0.5 bg-yellow-200 border-2 border-black rounded-md rotate-[-1deg]">
                {results.totalVotes} total votes
              </span>
            </h3>

            {/* Container for the charts */}
            <div className="bg-gray-50 border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="p-2 bg-white border border-black rounded-xl">
                <ElectionBarChart data={results.results} />
              </div>
              <div className="p-2 bg-white border border-black rounded-xl">
                <ElectionPieChart data={results.results} />
              </div>
            </div>

            {!hasVoted && (
              <p className="text-xs font-bold text-gray-500 mt-4 italic text-center bg-gray-100 py-2 border border-black border-dashed rounded-lg">
                ⚠️ You did not cast a vote in this election window.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}