import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function VoterDashboard() {
  const [stats, setStats] = useState({ total: 0, open: 0 });

  useEffect(() => {
    api.get('/api/elections').then((res) => {
      const elections = res.data.elections || [];
      setStats({
        total: elections.length,
        open: elections.filter((e) => e.status === 'open').length,
      });
    }).catch(() => { });
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 sm:p-10 selection:bg-yellow-200">

      {/* Header Panel styled like an open folder/billboard banner */}
      <div className="max-w-4xl mx-auto mb-10 p-6 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Background decorative sketch element */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-100 rounded-full border-4 border-black border-dashed opacity-50 pointer-events-none" />

        <h1 className="text-4xl font-black text-black tracking-tight mb-2 flex items-center gap-3">
          <span className="p-1.5 bg-yellow-300 border-2 border-black rounded-xl inline-block rotate-[-2deg]">🎓</span>
          Student Dashboard
        </h1>
        <p className="text-gray-600 font-bold text-base md:text-lg flex items-center gap-1.5">
          Browse and vote on live campus elections
          <span className="text-indigo-600 font-black tracking-widest animate-pulse">⚡</span>
        </p>
      </div>

      {/* Metrics Layout Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Metric Block 1: Total Elections */}
        <div className="bg-indigo-100 border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-black uppercase tracking-wider text-indigo-950 bg-indigo-200 border-2 border-indigo-950 px-2.5 py-1 rounded-lg">
              History Archive
            </span>
            <span className="text-2xl group-hover:animate-bounce">📁</span>
          </div>
          <div className="text-gray-700 font-black text-lg tracking-wide uppercase">
            Total Elections
          </div>
          <div className="text-5xl md:text-6xl font-black text-black mt-2 drop-shadow-sm font-mono">
            {stats.total}
          </div>
        </div>

        {/* Metric Block 2: Open Elections Now */}
        <div className="bg-emerald-100 border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-black uppercase tracking-wider text-emerald-950 bg-emerald-200 border-2 border-emerald-950 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping" /> Live Action
            </span>
            <span className="text-2xl group-hover:animate-spin">🔥</span>
          </div>
          <div className="text-gray-700 font-black text-lg tracking-wide uppercase">
            Open Now
          </div>
          <div className="text-5xl md:text-6xl font-black text-black mt-2 drop-shadow-sm font-mono">
            {stats.open}
          </div>
        </div>

      </div>

    </div>
  );
}