import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <header className="border-b border-slate-200/80 dark:border-slate-800 backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <span className="text-xl font-semibold text-slate-800 dark:text-white">Expense Tracker</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost">Log in</Link>
            <Link href="/register" className="btn-primary">Get started</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            Know where your money goes
          </h1>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
            Track daily expenses, set monthly budgets, and see spending at a glance. 
            Simple, secure, and built for the cloud.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/register" className="btn-primary text-base px-6 py-3">Start free</Link>
            <Link href="/login" className="btn-ghost text-base px-6 py-3 border border-slate-200 dark:border-slate-700">Sign in</Link>
          </div>
        </div>

        <div className="mt-24 grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { title: 'Track expenses', desc: 'Add and categorize every spend. One place, all your data.' },
            { title: 'Set budgets', desc: 'Monthly limits per category. Stay in control.' },
            { title: 'Analytics', desc: 'Charts and insights. See patterns, not just numbers.' },
          ].map((item, i) => (
            <div key={i} className="card p-6 text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <h3 className="font-semibold text-slate-800 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Cloud-Based Expense Tracker · Secure · No ads
        </div>
      </footer>
    </div>
  );
}
