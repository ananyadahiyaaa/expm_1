'use client';

import { useState, useEffect } from 'react';
import { budgetsApi, type BudgetSummary } from '@/lib/api';

export function BudgetCard() {
  const [data, setData] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();

  useEffect(() => {
    budgetsApi.get().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  async function saveBudget() {
    const num = parseFloat(inputAmount);
    if (isNaN(num) || num < 0) return;
    setSaving(true);
    try {
      const updated = await budgetsApi.set({ amount: num });
      setData({
        ...data!,
        budget: num,
        spent: data?.spent ?? 0,
        remaining: num - (data?.spent ?? 0),
        percentageUsed: data?.spent ? Math.min(100, (data.spent / num) * 100) : 0,
        month: updated.month,
        year: updated.year,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="mt-4 h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  const pct = data?.budget ? Math.min(100, (data.spent / data.budget) * 100) : 0;
  const isOver = data?.budget ? data.spent > data.budget : false;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-white">
          Budget · {monthName} {year}
        </h3>
        {!editing ? (
          <button type="button" onClick={() => { setEditing(true); setInputAmount(String(data?.budget ?? 0)); }} className="btn-ghost text-sm">
            Edit
          </button>
        ) : (
          <button type="button" onClick={saveBudget} disabled={saving} className="btn-primary text-sm py-1.5 px-3">
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            className="input flex-1"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="Monthly budget"
          />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ${(data?.remaining ?? 0).toFixed(2)}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-sm">remaining</span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            ${(data?.spent ?? 0).toFixed(2)} of ${(data?.budget ?? 0).toFixed(2)} spent
          </p>
          <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={isOver ? 'bg-red-500' : 'bg-brand-500'}
              style={{ width: `${Math.min(100, pct)}%`, height: '100%', transition: 'width 0.3s ease' }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {pct.toFixed(0)}% used
          </p>
        </>
      )}
    </div>
  );
}
