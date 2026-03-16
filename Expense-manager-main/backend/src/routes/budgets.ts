import { Router } from 'express';
import { body, query } from 'express-validator';
import * as budgetController from '../controllers/budgetController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(auth);

router.get(
  '/',
  validate([
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2000, max: 2100 }),
  ]),
  budgetController.get
);

router.put(
  '/',
  validate([
    body('amount').isFloat({ min: 0 }),
    body('month').optional().isInt({ min: 1, max: 12 }),
    body('year').optional().isInt({ min: 2000, max: 2100 }),
  ]),
  budgetController.set
);

export default router;
