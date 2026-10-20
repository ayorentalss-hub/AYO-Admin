import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { api, setToken } from '../api/client';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@ayo.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both administrator email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.adminLogin({ email: email.trim(), password: password.trim() });
      setToken(res.access_token);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Red Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-rose-700/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center mx-auto shadow-2xl shadow-red-950/60 text-white font-black text-2xl tracking-wider border border-red-500/30">
            A
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">AYO Admin Portal</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Fleet Operations, Host KYC Moderation & Financial Operations
            </p>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-red-600/10 text-red-400 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-2"></span>
            Enterprise Secure Session
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-semibold leading-relaxed animate-in fade-in">
            {error}
          </div>
        )}

        {/* Email & Password Admin Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Administrator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ayo.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-sans"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-sans tracking-wider"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-950/50 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer border border-red-500/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Info */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-2">
          <p className="text-[10px] text-center text-zinc-500 uppercase tracking-wider font-bold">
            Administrator Access Credentials
          </p>
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@ayo.com');
                setPassword('admin123');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 border border-zinc-800 hover:border-red-500/40 transition cursor-pointer"
            >
              admin@ayo.com / admin123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
