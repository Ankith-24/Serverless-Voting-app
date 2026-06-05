import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function AllElections() {
  const [elections, setElections] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/elections').then((res) => setElections(res.data.elections || [])).catch(() => { });
  }, []);

  // Helper formatting for platform-wide status labels
  const getStatusStyle = (status) => {
    switch (status) {
      case 'open': return 'bg-emerald-200 text-emerald-950 border-emerald-400';
      case 'closed': return 'bg-rose-200 text-rose-950 border-rose-400';
      default: return 'bg-amber-200 text-amber-950 border-amber-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 sm:p-10 selection:bg-yellow-200">

      {/* Super Admin Top Header Panel */}
      <div className="max-w-6xl mx-auto mb-10 p-6 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black text-black tracking-tight mb-2 flex items-center gap-3">
          <span className="p-1.5 bg-rose-300 border-2 border-black rounded-xl inline-block rotate-[-2deg]">👑</span>
          All Platform Elections
        </h1>
        <p className="text-gray-600 font-bold text-sm sm:text-base">
          Global database master view. Audit polling performance indices across all department channels.
        </p>
      </div>

      {/* Empty Database State */}
      {elections.length === 0 ? (
        <div className="max-w-md mx-auto bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <span className="text-5xl block mb-3 animate-bounce">🪐</span>
          <h3 className="text-2xl font-black text-black mb-1">No elections yet</h3>
          <p className="text-gray-600 font-bold text-sm">Active ballot programs built by regional administrative tiers will stream here.</p>
        </div>
      ) : (
        /* Global Master Grid */
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {elections.map((election) => {
            const status = election.status || 'draft';
            return (
              <div
                key={election.electionId}
                className="group bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 cursor-pointer flex flex-col justify-between animate-fade-in"
                onClick={() => navigate(`/super-admin/elections/${election.electionId}/results`)}
              >
                {/* Upper Ticket Segment */}
                <div>
                  {/* Metadata Stamp Line */}
                  <div className="flex justify-between items-center mb-3.5">
                    <span className="text-[10px] font-black uppercase tracking-wide bg-indigo-100 text-indigo-950 border border-black px-2 py-0.5 rounded-md truncate max-w-[150px]">
                      👤 {election.createdByName || 'System Admin'}
                    </span>
                    <span className={`px-2.5 py-0.5 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${getStatusStyle(status)}`}>
                      ● {status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-black text-black tracking-tight mb-2 group-hover:text-indigo-600 transition-colors leading-tight">
                    {election.title}
                  </h3>

                  {/* Description Excerpt */}
                  {election.description && (
                    <p className="text-gray-500 font-bold text-xs line-clamp-2 mb-4 bg-gray-50 border border-black border-dashed p-2.5 rounded-xl">
                      {election.description}
                    </p>
                  )}
                </div>

                {/* Bottom Stats Tray */}
                <div className="pt-3 border-t-2 border-black border-dashed space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span className="flex items-center gap-1">🗳️ Slated Pool:</span>
                    <span className="bg-gray-100 border border-black px-2 py-0.5 rounded-md font-black text-black">
                      {election.candidates?.length || 0} Candidates
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-gray-700 bg-yellow-100 border border-black px-2 py-1.5 rounded-xl text-center w-full">
                    📅 {new Date(election.startDate).toLocaleDateString()} → {new Date(election.endDate).toLocaleDateString()}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}