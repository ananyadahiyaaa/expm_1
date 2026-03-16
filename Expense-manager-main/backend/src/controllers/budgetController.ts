import { Request, Response } from 'express';
import { query } from '../config/db.js';
import type { JwtPayload } from '../middleware/auth.js';

export async function get(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { month, year } = req.query as { month?: string; year?: string };

  const now = new Date();
  const m = month ? parseInt(month, 10) : now.getMonth() + 1;
  const y = year ? parseInt(year, 10) : now.getFullYear();

  const budgetResult = await query<{ id: string; amount: string; month: number; year: number }>(
    'SELECT id, amount, month, year FROM monthly_budgets WHERE user_id = $1 AND month = $2 AND year = $3',
    [userId, m, y]
  );
  const budget = budgetResult.rows[0];
  const budgetAmount = budget ? Number(budget.amount) : 0;

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

  const spentResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text as total FROM expenses
     WHERE user_id = $1 AND date >= $2 AND date <= $3`,
    [userId, startDate, endDate]
  );
  const spent = Number(spentResult.rows[0]?.total ?? 0);

  res.json({
    month: m,
    year: y,
    budget: budgetAmount,
    spent: Math.round(spent * 100) / 100,
    remaining: Math.round((budgetAmount - spent) * 100) / 100,
    percentageUsed: budgetAmount > 0 ? Math.min(100, Math.round((spent / budgetAmount) * 1000) / 10) : 0,
    budgetId: budget?.id,
  });
}

export async function set(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { month, year, amount } = req.body as { month?: number; year?: number; amount: number };

  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();
  const amt = Math.max(0, Number(amount));

  await query(
    `INSERT INTO monthly_budgets (user_id, month, year, amount)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, month, year) DO UPDATE SET amount = $4, updated_at = NOW()`,
    [userId, m, y, amt]
  );

  const result = await query<{ id: string; amount: string; month: number; year: number }>(
    'SELECT id, amount, month, year FROM monthly_budgets WHERE user_id = $1 AND month = $2 AND year = $3',
    [userId, m, y]
  );
  res.json(result.rows[0]);
}
