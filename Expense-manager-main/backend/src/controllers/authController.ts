import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { JwtPayload } from '../middleware/auth.js';

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body as { email: string; password: string; name: string };

  const hashed = await bcrypt.hash(password, 12);
  try {
    const result = await query<{ id: string; email: string; name: string }>(
      `INSERT INTO users (email, password, name) VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [email.toLowerCase().trim(), hashed, (name ?? '').trim() || 'User']
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email } as JwtPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );
    logger.info('User registered', { userId: user.id, email: user.email });
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
      expiresIn: env.JWT_EXPIRES_IN,
    });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    throw e;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  const result = await query<{ id: string; email: string; name: string; password: string }>(
    'SELECT id, email, name, password FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
  logger.info('User logged in', { userId: user.id });
  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const result = await query<{ id: string; email: string; name: string }>(
    'SELECT id, email, name FROM users WHERE id = $1',
    [userId]
  );
  const user = result.rows[0];
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
}
