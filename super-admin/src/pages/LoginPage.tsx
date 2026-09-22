// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginWithCredentials } from '../services/authService';
import { useAuthContext } from '../contexts/AuthContext';
import { usePlatformConfig } from '../super-admin/hooks/usePlatformConfig';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  const { data: brandingConfigs } = usePlatformConfig('platform_branding');

  const platformName =
    brandingConfigs?.find((c) => c.code === 'PLATFORM_NAME')?.label || 'CCM PLATFORM';
  const platformTagline =
    brandingConfigs?.find((c) => c.code === 'PLATFORM_TAGLINE')?.label ||
    'Super Admin Platform Governance';

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
      await loginWithCredentials(email, password);
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
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0274BB]/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#EF7626]/15 blur-[120px]" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[16px] bg-gradient-to-br from-[#0274BB] to-[#003B8C] shadow-xl shadow-[#0274BB]/20 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.698-1.382 2.698H4.18c-1.412 0-2.382-1.698-1.382-2.698L4.2 15.3" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-[#0274BB] via-[#003B8C] to-[#EF7626] bg-clip-text text-transparent">
              {platformName}
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{platformTagline}</p>
          <p className="text-slate-500 text-xs mt-1">Enterprise Multi-Tenant Platform</p>
        </div>

        {/* Glass Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-[16px] p-8 shadow-2xl shadow-slate-900/80">
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
                className="w-full bg-slate-950/80 border border-slate-800 rounded-[4px] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-[#0274BB] focus:ring-1 focus:ring-[#0274BB] transition-all outline-none"
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
                className="w-full bg-slate-950/80 border border-slate-800 rounded-[4px] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-[#0274BB] focus:ring-1 focus:ring-[#0274BB] transition-all outline-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-[4px] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
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
              className="w-full bg-[#0274BB] hover:bg-[#003B8C] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-[4px] px-4 py-2.5 text-sm transition-all shadow-lg shadow-[#0274BB]/20 flex items-center justify-center gap-2 cursor-pointer"
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

          <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#0274BB]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Demo Credentials
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                Click to Auto-fill
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('superadmin@nethra.com');
                  setPassword('SuperAdmin@2026!');
                  setError('');
                }}
                className="w-full text-left p-2.5 rounded bg-slate-950/60 border border-slate-800 hover:border-[#0274BB]/60 hover:bg-slate-950 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      SUPER ADMIN
                    </span>
                    <span className="text-xs font-medium text-slate-200">superadmin@nethra.com</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Password: SuperAdmin@2026!</div>
                </div>
                <span className="text-xs text-[#0274BB] group-hover:underline font-semibold pr-1">Use →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('admin@nethra.com');
                  setPassword('Password@123');
                  setError('');
                }}
                className="w-full text-left p-2.5 rounded bg-slate-950/60 border border-slate-800 hover:border-[#0274BB]/60 hover:bg-slate-950 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      PLATFORM ADMIN
                    </span>
                    <span className="text-xs font-medium text-slate-200">admin@nethra.com</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Password: Password@123</div>
                </div>
                <span className="text-xs text-[#0274BB] group-hover:underline font-semibold pr-1">Use →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} {platformName} — Dynamic Role-Based Multi-Tenant System
        </p>
      </div>
    </div>
  );
}
