import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  createTest,
  getUserTests,
  getTest,
  updateTest,
  deleteTest,
} from '../controllers/testController.js';

const router = express.Router();

// All test routes require authentication
router.use(authenticateUser);

// Test routes
router.post('/', createTest);
router.get('/', getUserTests);
router.get('/:id', getTest);
router.put('/:id', updateTest);
router.delete('/:id', deleteTest);

export default router;

