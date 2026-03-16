import { Request, Response } from 'express';
import { query } from '../config/db.js';
import type { JwtPayload } from '../middleware/auth.js';

const CATEGORIES = ['Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Custom'];

export async function list(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { from, to, category, limit = '100', offset = '0' } = req.query as Record<string, string>;

  let sql = 'SELECT id, amount, category, description, date, created_at FROM expenses WHERE user_id = $1';
  const params: unknown[] = [userId];
  let i = 2;

  if (from) {
    sql += ` AND date >= $${i}`;
    params.push(from);
    i++;
  }
  if (to) {
    sql += ` AND date <= $${i}`;
    params.push(to);
    i++;
  }
  if (category) {
    sql += ` AND category = $${i}`;
    params.push(category);
    i++;
  }

  sql += ' ORDER BY date DESC, created_at DESC';
  sql += ` LIMIT $${i} OFFSET $${i + 1}`;
  params.push(Math.min(parseInt(limit, 10) || 100, 500), parseInt(offset, 10) || 0);

  const result = await query(sql, params);
  res.json({ expenses: result.rows });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { id } = req.params;

  const result = await query(
    'SELECT id, amount, category, description, date, created_at FROM expenses WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  const expense = result.rows[0];
  if (!expense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  res.json(expense);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { amount, category, description, date } = req.body as {
    amount: number;
    category: string;
    description?: string;
    date?: string;
  };

  const cat = (category ?? 'Custom').trim() || 'Custom';
  const safeCategory = CATEGORIES.includes(cat) ? cat : 'Custom';
  const dateStr = date ? String(date).slice(0, 10) : new Date().toISOString().slice(0, 10);

  const result = await query<{ id: string; amount: string; category: string; description: string | null; date: string }>(
    `INSERT INTO expenses (user_id, amount, category, description, date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, amount, category, description, date`,
    [userId, Number(amount), safeCategory, (description ?? '').trim() || null, dateStr]
  );
  res.status(201).json(result.rows[0]);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { id } = req.params;
  const { amount, category, description, date } = req.body as {
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
  };

  const result = await query(
    'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  const updates: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (amount !== undefined) {
    updates.push(`amount = $${i++}`);
    params.push(Number(amount));
  }
  if (category !== undefined) {
    const cat = (category ?? 'Custom').trim() || 'Custom';
    const safeCategory = CATEGORIES.includes(cat) ? cat : 'Custom';
    updates.push(`category = $${i++}`);
    params.push(safeCategory);
  }
  if (description !== undefined) {
    updates.push(`description = $${i++}`);
    params.push((description ?? '').trim() || null);
  }
  if (date !== undefined) {
    updates.push(`date = $${i++}`);
    params.push(String(date).slice(0, 10));
  }
  if (updates.length === 0) {
    const get = await query('SELECT id, amount, category, description, date FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json(get.rows[0]);
    return;
  }
  updates.push(`updated_at = NOW()`);
  params.push(id, userId);

  const sql = `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${i++} AND user_id = $${i} RETURNING id, amount, category, description, date`;
  const out = await query(sql, params);
  res.json(out.rows[0]);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { id } = req.params;

  const result = await query('DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  res.status(204).send();
}

export function categories(_req: Request, res: Response): void {
  res.json({ categories: CATEGORIES });
}
