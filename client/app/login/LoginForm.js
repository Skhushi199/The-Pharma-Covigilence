'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    const token = localStorage.getItem('pv_token');
    const user = localStorage.getItem('pv_user');
    if (token && user) {
      const parsed = JSON.parse(user);
      router.replace(parsed.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (mode === 'register') {
        res = await authAPI.register({ name: form.name, email: form.email, password: form.password });
      } else {
        res = await authAPI.login({ email: form.email, password: form.password });
      }
      const { token, ...userData } = res.data.data;
      localStorage.setItem('pv_token', token);
      localStorage.setItem('pv_user', JSON.stringify(userData));
      toast.success(`Welcome, ${userData.name}!`);
      router.push(userData.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black gradient-text">PharmaVigil</span>
          </Link>
          <p className="text-emerald-700 mt-3 text-sm">
            {mode === 'register' ? 'Create your account to start reporting' : 'Sign in to continue'}
          </p>
        </div>

        <div className="card">
          <div className="flex bg-white/80 border border-emerald-100 rounded-xl p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                id={`mode-${m}`}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${
                  mode === m
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">Full Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Smith"
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-emerald-800 mb-2">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-800 mb-2">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-700 hover:text-emerald-900"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="submit-auth"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{mode === 'register' ? 'Creating...' : 'Signing in...'}</>
              ) : mode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-emerald-600 text-xs mt-4">
            Patient reports only. Admin accounts are provisioned separately.
          </p>
        </div>
      </div>
    </div>
  );
}
