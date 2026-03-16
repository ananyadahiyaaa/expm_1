'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name || undefined);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50/20 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="card w-full max-w-md p-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Start tracking your expenses</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-2 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="label">Name (optional)</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password (min 8 characters)</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
