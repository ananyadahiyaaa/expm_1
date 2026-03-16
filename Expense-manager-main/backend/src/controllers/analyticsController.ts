import { Request, Response } from 'express';
import { query } from '../config/db.js';
import type { JwtPayload } from '../middleware/auth.js';

export async function dashboard(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { from, to } = req.query as { from?: string; to?: string };

  const now = new Date();
  const defaultTo = to ?? now.toISOString().slice(0, 10);
  const defaultFrom = from ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const totalResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text as total FROM expenses
     WHERE user_id = $1 AND date >= $2 AND date <= $3`,
    [userId, defaultFrom, defaultTo]
  );
  const totalSpent = Number(totalResult.rows[0]?.total ?? 0);

  const categoryResult = await query<{ category: string; total: string }>(
    `SELECT category, SUM(amount)::text as total FROM expenses
     WHERE user_id = $1 AND date >= $2 AND date <= $3
     GROUP BY category ORDER BY total DESC`,
    [userId, defaultFrom, defaultTo]
  );
  const byCategory = categoryResult.rows.map((r) => ({
    category: r.category,
    total: Number(r.total),
  }));

  const dailyResult = await query<{ date: string; total: string }>(
    `SELECT date::text, SUM(amount)::text as total FROM expenses
     WHERE user_id = $1 AND date >= $2 AND date <= $3
     GROUP BY date ORDER BY date`,
    [userId, defaultFrom, defaultTo]
  );
  const spendingOverTime = dailyResult.rows.map((r) => ({
    date: r.date,
    total: Number(r.total),
  }));

  const monthlyResult = await query<{ month: number; year: number; total: string }>(
    `SELECT EXTRACT(MONTH FROM date)::int as month, EXTRACT(YEAR FROM date)::int as year, SUM(amount)::text as total
     FROM expenses WHERE user_id = $1 AND date >= $2 AND date <= $3
     GROUP BY EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date) ORDER BY year, month`,
    [userId, defaultFrom, defaultTo]
  );
  const monthlyComparison = monthlyResult.rows.map((r) => ({
    month: r.month,
    year: r.year,
    total: Number(r.total),
    label: `${r.year}-${String(r.month).padStart(2, '0')}`,
  }));

  const daysInRange = Math.max(1, (new Date(defaultTo).getTime() - new Date(defaultFrom).getTime()) / (24 * 60 * 60 * 1000) + 1);
  const avgDaily = totalSpent / daysInRange;
  const highestCategory = byCategory[0] ?? { category: 'N/A', total: 0 };

  res.json({
    totalSpent: Math.round(totalSpent * 100) / 100,
    averageDailySpend: Math.round(avgDaily * 100) / 100,
    highestCategory: highestCategory.category,
    highestCategoryAmount: Math.round(highestCategory.total * 100) / 100,
    byCategory,
    spendingOverTime,
    monthlyComparison,
    from: defaultFrom,
    to: defaultTo,
  });
}
