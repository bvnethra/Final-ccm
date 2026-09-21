// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuthContext();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If already authenticated, redirect
  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-700/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-700/15 blur-[120px]" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 shadow-xl shadow-indigo-600/30 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.698-1.382 2.698H4.18c-1.412 0-2.382-1.698-1.382-2.698L4.2 15.3" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              NETHRA CCM
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Super Admin Platform Governance</p>
          <p className="text-slate-500 text-xs mt-1">Enterprise Multi-Tenant Platform</p>
        </div>

        {/* Glass Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-slate-900/80">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Sign in to your workspace</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your credentials to access the platform</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organization.com"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center">
              Access is controlled by your Tenant Administrator.
              <br />Contact your system admin for credentials.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} Nethra CCM Platform — Dynamic Role-Based Multi-Tenant System
        </p>
      </div>
    </div>
  );
}
