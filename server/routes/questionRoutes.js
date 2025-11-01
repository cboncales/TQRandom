import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  createQuestion,
  getTestQuestions,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController.js';

const router = express.Router();

// All question routes require authentication
router.use(authenticateUser);

// Question routes
router.post('/', createQuestion);
router.get('/test/:testId', getTestQuestions);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;

