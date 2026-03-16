import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface JwtPayload {
  userId: string;
  email: string;
}

export function auth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as Request & { user: JwtPayload }).user = decoded;
    next();
  } catch {
    logger.warn('Invalid or expired JWT', { token: token.slice(0, 10) + '...' });
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
