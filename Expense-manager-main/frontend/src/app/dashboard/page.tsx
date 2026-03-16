'use client';

import { useState, useEffect, useCallback } from 'react';
import { expensesApi, type Expense } from '@/lib/api';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { BudgetCard } from '@/components/BudgetCard';

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const fetchExpenses = useCallback(() => {
    expensesApi.list({ limit: 50 }).then((r) => setExpenses(r.expenses)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    try {
      await expensesApi.delete(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <button type="button" onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary">
          Add expense
        </button>
      </div>

      <BudgetCard />

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Recent expenses</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No expenses yet. Click “Add expense” to start.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">
                    ${Number(e.amount).toFixed(2)} · {e.category}
                  </p>
                  {e.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{e.description}</p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500">{e.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditing(e); setModalOpen(true); }}
                    className="btn-ghost text-sm py-1"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(e.id)}
                    className="btn-ghost text-sm py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddExpenseModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={fetchExpenses}
        edit={editing}
      />
    </div>
  );
}
