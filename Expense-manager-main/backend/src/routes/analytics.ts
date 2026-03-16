import { Router } from 'express';
import { query } from 'express-validator';
import { dashboard } from '../controllers/analyticsController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(auth);

router.get(
  '/',
  validate([
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
  ]),
  dashboard
);

export default router;
