import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
    });
  });
  next();
}
