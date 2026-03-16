import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as expenseController from '../controllers/expenseController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router({ mergeParams: true });
router.use(auth);

router.get(
  '/',
  validate([
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('category').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 500 }),
    query('offset').optional().isInt({ min: 0 }),
  ]),
  expenseController.list
);

router.get('/categories', expenseController.categories);

router.get(
  '/:id',
  validate([param('id').isUUID()]),
  expenseController.getOne
);

router.post(
  '/',
  validate([
    body('amount').isFloat({ min: 0.01 }),
    body('category').optional().trim().isLength({ max: 50 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('date').optional().isISO8601(),
  ]),
  expenseController.create
);

router.patch(
  '/:id',
  validate([
    param('id').isUUID(),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('category').optional().trim().isLength({ max: 50 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('date').optional().isISO8601(),
  ]),
  expenseController.update
);

router.delete(
  '/:id',
  validate([param('id').isUUID()]),
  expenseController.remove
);

export default router;
