import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ElectionBarChart, ElectionPieChart } from '../../components/Charts';
import { useAuth } from '../../context/AuthContext';

export default function ElectionResults() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/elections/${electionId}/results`)
      .then((res) => setData(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [electionId]);

  // Illustrated loading fallback screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-black border-t-indigo-500 rounded-full animate-spin shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        <p className="mt-4 font-black text-black text-lg animate-pulse">Calculating ballot data...</p>
      </div>
    );
  }

  // Illustrated empty error panel
  if (!data) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-6">
        <div className="bg-white border-4 border-black p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-sm">
          <span className="text-4xl block mb-2">📊</span>
          <h3 className="text-2xl font-black text-black">Results not found</h3>
          <p className="text-gray-500 font-bold text-sm mt-1">Telemetry missing or poll window deleted.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-5 px-4 py-2 bg-indigo-200 font-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const backPath = user?.role === 'SUPER_ADMIN' ? '/super-admin/elections' : '/admin/my-elections';
  const status = data.election.status || 'draft';

  // Dynamic status badge colorizer
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'open': return 'bg-emerald-200 text-emerald-950 border-emerald-400';
      case 'closed': return 'bg-rose-200 text-rose-950 border-rose-400';
      default: return 'bg-amber-200 text-amber-950 border-amber-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-4 sm:p-8 selection:bg-yellow-200">

      {/* Return Navigation Anchor */}
      <button
        className="mb-6 px-4 py-2 bg-white hover:bg-gray-50 text-black font-black text-sm border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
        onClick={() => navigate(backPath)}
      >
        ← Back to Console
      </button>

      {/* Main Analysis Document Frame */}
      <div className="w-full max-w-2xl bg-white border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">

        {/* Upper Title Section */}
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight leading-tight mb-2 drop-shadow-sm">
            {data.election.title}
          </h2>
          {data.election.description && (
            <p className="text-gray-600 font-bold text-xs sm:text-sm bg-gray-50 border-2 border-black border-dashed rounded-xl p-3.5 mt-3">
              {data.election.description}
            </p>
          )}
        </div>

        {/* Telemetry Index Tags */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b-2 border-black border-dashed">
          <span className={`px-2.5 py-0.5 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${getStatusBadgeStyle(status)}`}>
            ● {status}
          </span>
          <span className="text-xs font-black bg-yellow-100 text-black border-2 border-black px-2.5 py-0.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            🗳️ Total Turnout: <span className="font-mono text-indigo-600">{data.totalVotes}</span>
          </span>
        </div>

        {/* Analytics Charts Embed Slots */}
        <div className="bg-gray-50 border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
          <div className="p-3 bg-white border border-black rounded-xl shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <ElectionBarChart data={data.results} />
          </div>
          <div className="p-3 bg-white border border-black rounded-xl shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <ElectionPieChart data={data.results} />
          </div>
        </div>

        {/* Audit Metrics Breakdown Data Table */}
        <div className="border-4 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-indigo-50 border-b-2 border-black">
                <th className="p-3 text-xs font-black text-black uppercase tracking-wider border-r-2 border-black">Candidate</th>
                <th className="p-3 text-xs font-black text-black uppercase tracking-wider border-r-2 border-black text-center">Votes</th>
                <th className="p-3 text-xs font-black text-black uppercase tracking-wider text-center">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black font-bold text-sm text-gray-700">
              {data.results.map((r) => (
                <tr key={r.id} className="hover:bg-yellow-50/40 transition-colors">
                  <td className="p-3 text-black font-black border-r-2 border-black">{r.name}</td>
                  <td className="p-3 border-r-2 border-black text-center font-mono text-black">{r.votes}</td>
                  <td className="p-3 text-center font-mono text-indigo-600">
                    {data.totalVotes > 0 ? ((r.votes / data.totalVotes) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}