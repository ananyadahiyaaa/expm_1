import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post(
  '/register',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').optional().trim().isLength({ max: 255 }),
  ]),
  register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  login
);

router.get('/me', auth, me);

export default router;
