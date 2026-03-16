'use client';

import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile & settings</h1>

      <div className="card p-6 max-w-md">
        <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Account</h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-slate-500 dark:text-slate-400">Name</dt>
            <dd className="text-slate-900 dark:text-white font-medium">{user?.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="text-slate-900 dark:text-white font-medium">{user?.email}</dd>
          </div>
        </dl>
      </div>

      <div className="card p-6 max-w-md">
        <h2 className="font-semibold text-slate-800 dark:text-white mb-4">About</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Cloud-Based Expense Tracker. Your data is stored securely in the cloud. 
          Password changes and export will be available in a future update.
        </p>
      </div>
    </div>
  );
}
