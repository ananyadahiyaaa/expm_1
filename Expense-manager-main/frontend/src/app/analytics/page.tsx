'use client';

import { useState, useEffect } from 'react';
import { analyticsApi, type AnalyticsDashboard } from '@/lib/api';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const [from, setFrom] = useState(firstDay.toISOString().slice(0, 10));
  const [to, setTo] = useState(now.toISOString().slice(0, 10));

  useEffect(() => {
    if (!from || !to) return;
    setLoading(true);
    analyticsApi.dashboard({ from, to })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-slate-500 dark:text-slate-400">
        Loading analytics…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
          Failed to load analytics. Check date range and try again.
        </div>
      </div>
    );
  }

  const pieData = data.byCategory.map((c, i) => ({
    name: c.category,
    value: c.total,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const lineData = data.spendingOverTime.map((d) => ({
    date: d.date.slice(5),
    total: data.totalSpent ? Math.round(d.total * 100) / 100 : 0,
  }));

  const barData = data.monthlyComparison.map((m) => ({
    name: m.label,
    total: m.total,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input w-40"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            className="input w-40"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total spent</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ${data.totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg daily</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ${data.averageDailySpend.toFixed(2)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Top category</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data.highestCategory}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Top category amount</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ${data.highestCategoryAmount.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Category breakdown</h3>
          {pieData.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">No data in range</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Spending over time</h3>
          {lineData.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">No data in range</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-slate-500" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Spent']} />
                  <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Spent" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Monthly comparison</h3>
        {barData.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">No data in range</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Total']} />
                <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
