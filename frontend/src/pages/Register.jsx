import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [year, setYear] = useState('');
  const [program, setProgram] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, rolePath } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side email domain check
    if (!email.trim().toLowerCase().endsWith('@pollapp.com')) {
      setError('Email must end with @pollapp.com');
      return;
    }

    setLoading(true);
    try {
      const user = await register(name, email, password, studentId, year, program);
      navigate(rolePath(user.role));
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-6 selection:bg-yellow-200">
      {/* Container Card with thick black borders and hard shadow */}
      <div className="w-full max-w-xl bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight text-black flex items-center justify-center gap-2 mb-2 drop-shadow-sm">
            <span className="p-2 bg-indigo-200 border-2 border-black rounded-xl inline-block rotate-[-3deg]">🗳️</span>
            PollStream
          </h1>
          <p className="font-bold text-gray-600 bg-yellow-100 border-2 border-black border-dashed rounded-lg py-1 px-3 inline-block text-sm rotate-[1deg]">
            Create your student account
          </p>
        </div>

        {/* Error Alert styled like a cartoon warning badge */}
        {error && (
          <div className="mb-6 p-4 bg-rose-200 border-2 border-black rounded-xl font-bold text-rose-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 animate-bounce">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form elements arranged cleanly into a scannable grid */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-lg font-black text-black tracking-wide">
              Full Name
            </label>
            <input
              id="name"
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50 focus:ring-0 focus:border-indigo-600 transition-colors"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email Address & Helper Text */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-lg font-black text-black tracking-wide">
              Email Address
            </label>
            <input
              id="email"
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50 focus:ring-0 focus:border-indigo-600 transition-colors"
              type="email"
              placeholder="you@pollapp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span className="text-xs font-bold text-amber-600 mt-0.5 ml-1">
              * Must end with @pollapp.com
            </span>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-lg font-black text-black tracking-wide">
              Password
            </label>
            <input
              id="password"
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50 focus:ring-0 focus:border-indigo-600 transition-colors"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {/* Student ID (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="studentId" className="text-lg font-black text-black tracking-wide flex items-center gap-2">
              Student ID
              <span className="text-xs font-bold text-gray-400 lowercase italic">(optional)</span>
            </label>
            <input
              id="studentId"
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50 focus:ring-0 focus:border-indigo-600 transition-colors"
              type="text"
              placeholder="e.g. STU2026001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>

          {/* Two-Column Layout for Year and Program splits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Year Select dropdown with custom illustration border */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="year" className="text-lg font-black text-black tracking-wide flex items-center gap-2">
                Year
                <span className="text-xs font-bold text-gray-400 lowercase italic">(optional)</span>
              </label>
              <select
                id="year"
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black focus:outline-none focus:bg-indigo-50 focus:ring-0 focus:border-indigo-600 transition-colors appearance-none cursor-pointer"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5+">5+ Year</option>
              </select>
            </div>

            {/* Program input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="program" className="text-lg font-black text-black tracking-wide flex items-center gap-2">
                Program
                <span className="text-xs font-bold text-gray-400 lowercase italic">(optional)</span>
              </label>
              <input
                id="program"
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50 focus:ring-0 focus:border-indigo-600 transition-colors"
                type="text"
                placeholder="e.g. Computer Science"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              />
            </div>

          </div>

          {/* Styled Action Button */}
          <button
            id="register-submit"
            className="w-full py-4 bg-emerald-300 hover:bg-emerald-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-black font-black text-xl border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 mt-4"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account 🚀'}
          </button>
        </form>

        {/* Footer Navigation */}
        <p className="text-center mt-8 font-bold text-gray-700 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 underline font-black hover:text-indigo-800 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}