import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';
import { loginApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await loginApi(email, password);
      setAuth(data.user, data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    loginApi(e, p)
      .then((data) => {
        setAuth(data.user, data.access_token);
        navigate('/dashboard');
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Demo login failed');
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 items-center justify-center text-2xl mb-3">
            ❄️
          </div>
          <h2 className="text-2xl font-bold tracking-tight">ColdGuard Portal</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sign in to access cold-chain controls and alert escalation
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@coldguard.local"
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            <LogIn className="w-4 h-4 mr-1.5" /> Sign In
          </Button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick 1-Click Demo Logins
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo('staff@coldguard.local', 'Staff123!')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-slate-50 dark:bg-slate-800 text-left transition-colors"
            >
              <div className="font-semibold text-teal-600 dark:text-teal-400">Store Staff</div>
              <div className="text-[10px] text-slate-500">View & Ack Alerts</div>
            </button>

            <button
              onClick={() => handleQuickDemo('manager@coldguard.local', 'Manager123!')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-slate-50 dark:bg-slate-800 text-left transition-colors"
            >
              <div className="font-semibold text-teal-600 dark:text-teal-400">Store Manager</div>
              <div className="text-[10px] text-slate-500">Escalation L2 & Reports</div>
            </button>

            <button
              onClick={() => handleQuickDemo('med@coldguard.local', 'Med123!')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-slate-50 dark:bg-slate-800 text-left transition-colors"
            >
              <div className="font-semibold text-teal-600 dark:text-teal-400">Medical Officer</div>
              <div className="text-[10px] text-slate-500">Critical L3 Recipient</div>
            </button>

            <button
              onClick={() => handleQuickDemo('admin@coldguard.local', 'Admin123!')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-slate-50 dark:bg-slate-800 text-left transition-colors"
            >
              <div className="font-semibold text-teal-600 dark:text-teal-400">System Admin</div>
              <div className="text-[10px] text-slate-500">Full Config & Units</div>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
          >
            ← Return to Overview
          </Link>
        </div>
      </div>
    </div>
  );
};

