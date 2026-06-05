import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, draft: 0 });

  useEffect(() => {
    api.get('/api/elections').then((res) => {
      const elections = res.data.elections || [];
      setStats({
        total: elections.length,
        open: elections.filter((e) => e.status === 'open').length,
        closed: elections.filter((e) => e.status === 'closed').length,
        draft: elections.filter((e) => e.status === 'draft').length,
      });
    }).catch(() => { });
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 sm:p-10 selection:bg-yellow-200">

      {/* Admin Billboard Header Panel */}
      <div className="max-w-5xl mx-auto mb-10 p-6 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-100 rounded-full border-4 border-black border-dashed opacity-40 pointer-events-none" />

        <h1 className="text-4xl font-black text-black tracking-tight mb-2 flex items-center gap-3">
          <span className="p-1.5 bg-amber-300 border-2 border-black rounded-xl inline-block rotate-[-2deg]">🛠️</span>
          Election Admin Dashboard
        </h1>
        <p className="text-gray-600 font-bold text-base md:text-lg">
          Manage system configurations, design ballots, and review polling performance metrics.
        </p>
      </div>

      {/* 4-Column Metric Blocks Array Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Metric 1: My Elections Total */}
        <div className="bg-indigo-100 border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-950 bg-indigo-200 border-2 border-indigo-950 px-2 py-0.5 rounded-md">
              Total Pool
            </span>
            <span className="text-xl group-hover:rotate-12 transition-transform">📂</span>
          </div>
          <div className="text-gray-700 font-black text-sm tracking-wide uppercase">My Elections</div>
          <div className="text-4xl font-black text-black mt-1 font-mono drop-shadow-sm">
            {stats.total}
          </div>
        </div>

        {/* Metric 2: Live Open Elections */}
        <div className="bg-emerald-100 border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 bg-emerald-200 border-2 border-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping" /> Active
            </span>
            <span className="text-xl group-hover:animate-bounce">⚡</span>
          </div>
          <div className="text-gray-700 font-black text-sm tracking-wide uppercase">Open Now</div>
          <div className="text-4xl font-black text-black mt-1 font-mono drop-shadow-sm">
            {stats.open}
          </div>
        </div>

        {/* Metric 3: Saved Drafts */}
        <div className="bg-amber-100 border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-200 border-2 border-amber-950 px-2 py-0.5 rounded-md">
              Staged
            </span>
            <span className="text-xl group-hover:animate-pulse">📝</span>
          </div>
          <div className="text-gray-700 font-black text-sm tracking-wide uppercase">Drafts</div>
          <div className="text-4xl font-black text-black mt-1 font-mono drop-shadow-sm">
            {stats.draft}
          </div>
        </div>

        {/* Metric 4: Expired/Closed Sessions */}
        <div className="bg-rose-100 border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-950 bg-rose-200 border-2 border-rose-950 px-2 py-0.5 rounded-md">
              Archived
            </span>
            <span className="text-xl group-hover:rotate-[-12deg] transition-transform">🔒</span>
          </div>
          <div className="text-gray-700 font-black text-sm tracking-wide uppercase">Closed</div>
          <div className="text-4xl font-black text-black mt-1 font-mono drop-shadow-sm">
            {stats.closed}
          </div>
        </div>

      </div>

    </div>
  );
}