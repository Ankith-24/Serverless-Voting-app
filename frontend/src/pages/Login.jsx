import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, rolePath } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(rolePath(user.role));
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-6 selection:bg-yellow-200">
      {/* Container Card with thick borders and custom offset illustration shadow */}
      <div className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight text-black flex items-center justify-center gap-2 mb-2 drop-shadow-sm">
            <span className="p-2 bg-indigo-200 border-2 border-black rounded-xl inline-block rotate-[-3deg]">🗳️</span>
            PollStream
          </h1>
          <p className="font-bold text-gray-600 bg-yellow-100 border-2 border-black border-dashed rounded-lg py-1 px-3 inline-block text-sm rotate-[1deg]">
            Sign in to your student account
          </p>
        </div>

        {/* Error Alert styled like a warning sticker */}
        {error && (
          <div className="mb-6 p-4 bg-rose-200 border-2 border-black rounded-xl font-bold text-rose-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 animate-bounce">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email Group */}
          <div className="flex flex-col gap-2">
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
          </div>

          {/* Password Group */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-lg font-black text-black tracking-wide">
              Password
            </label>
            <input
              id="password"
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-indigo-50 focus:ring-0 focus:border-indigo-600 transition-colors"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Styled Submit Button */}
          <button
            id="login-submit"
            className="w-full py-4 bg-emerald-300 hover:bg-emerald-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-black font-black text-xl border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In 🚀'}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center mt-8 font-bold text-gray-700 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 underline font-black hover:text-indigo-800 transition-colors">
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
}