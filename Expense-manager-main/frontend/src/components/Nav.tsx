'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function handleLogout() {
    logout();
    router.push('/');
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/profile', label: 'Profile' },
  ];

  return (
    <header className="border-b border-slate-200/80 dark:border-slate-800 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/dashboard" className="text-lg font-semibold text-slate-800 dark:text-white">
          Expense Tracker
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-ghost p-2 rounded-lg"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          )}
          <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">{user?.email}</span>
          <button type="button" onClick={handleLogout} className="btn-ghost text-sm">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
