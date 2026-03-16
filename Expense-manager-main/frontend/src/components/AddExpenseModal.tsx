'use client';

import { useState, useEffect } from 'react';
import { expensesApi, type Expense } from '@/lib/api';

const CATEGORIES = ['Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Custom'];

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  edit?: Expense | null;
}

export function AddExpenseModal({ open, onClose, onSaved, edit }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (edit) {
      setAmount(edit.amount);
      setCategory(edit.category);
      setDescription(edit.description ?? '');
      setDate(edit.date.slice(0, 10));
    } else {
      setAmount('');
      setCategory('Food');
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
    }
    setError('');
  }, [edit, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      if (edit) {
        await expensesApi.update(edit.id, { amount: num, category, description: description || undefined, date });
      } else {
        await expensesApi.create({ amount: num, category, description: description || undefined, date });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          {edit ? 'Edit expense' : 'Add expense'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-2 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input
              type="text"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was it for?"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving…' : edit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
