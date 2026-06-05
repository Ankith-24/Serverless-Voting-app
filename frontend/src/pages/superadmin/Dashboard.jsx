import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ users: 0, elections: 0, admins: 0, students: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, electionsRes] = await Promise.all([
          api.get('/api/users'),
          api.get('/api/elections'),
        ]);
        const users = usersRes.data.users || [];
        setStats({
          users: users.length,
          elections: (electionsRes.data.elections || []).length,
          admins: users.filter((u) => u.role === 'ADMIN').length,
          students: users.filter((u) => u.role === 'VOTER').length,
        });
      } catch { /* ignore */ }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 sm:p-10 selection:bg-yellow-200">

      {/* Super Admin Billboard Header */}
      <div className="max-w-5xl mx-auto mb-10 p-6 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Background decorative accent element */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-rose-100 rounded-full border-4 border-black border-dashed opacity-50 pointer-events-none" />

        <h1 className="text-4xl font-black text-black tracking-tight mb-2 flex items-center gap-3">
          <span className="p-1.5 bg-rose-300 border-2 border-black rounded-xl inline-block rotate-[-2deg]">👑</span>
          Platform Admin Dashboard
        </h1>
        <p className="text-gray-600 font-bold text-base md:text-lg">
          Master system telemetry. Global monitoring across institutional nodes and active database lifecycles.
        </p>
      </div>

      {/* 4-Column High-Contrast Stats Matrix Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Registered Accounts */}
        <div className="bg-indigo-100 border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-950 bg-indigo-200 border-2 border-indigo-950 px-2.5 py-0.5 rounded-md">
              Global Roster
            </span>
            <span className="text-xl group-hover:animate-bounce">👥</span>
          </div>
          <div className="text-gray-700 font-black text-sm tracking-wide uppercase">Total Users</div>
          <div className="text-4xl font-black text-black mt-1 font-mono drop-shadow-sm">
            {stats.users}
          </div>
        </div>

        {/* Global Ballots Count */}
        <div className="bg-amber-100 border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-200 border-2 border-amber-950 px-2.5 py-0.5 rounded-md">
              Index Pool
            </span>
            <span className="text-xl group-hover:rotate-12 transition-transform">🗳️</span>
          </div>
          <div className="text-gray-700 font-black text-sm tracking-wide uppercase">Total Elections</div>
          <div className="text-4xl font-black text-black mt-1 font-mono drop-shadow-sm">
            {stats.elections}
          </div>
        </div>

        {/* Total Admin Organizers */}
        <div className="bg-sky-100 border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-950 bg-sky-200 border-2 border-sky-950 px-2.5 py-0.5 rounded-md">
              Privileged
            </span>
            <span className="text-xl group-hover:animate-spin">🛠️</span>
          </div>
          <div className="text-gray-700 font-black text-sm tracking-wide uppercase">Admins</div>
          <div className="text-4xl font-black text-black mt-1 font-mono drop-shadow-sm">
            {stats.admins}
          </div>
        </div>

        {/* Total Student Voters */}
        <div className="bg-emerald-100 border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 bg-emerald-200 border-2 border-emerald-950 px-2.5 py-0.5 rounded-md">
              Voters
            </span>
            <span className="text-xl group-hover:animate-pulse">🎓</span>
          </div>
          <div className="text-gray-700 font-black text-sm tracking-wide uppercase">Students</div>
          <div className="text-4xl font-black text-black mt-1 font-mono drop-shadow-sm">
            {stats.students}
          </div>
        </div>

      </div>

    </div>
  );
}