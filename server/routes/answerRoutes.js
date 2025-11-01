import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  storeCorrectAnswer,
  getCorrectAnswersForTest,
} from '../controllers/answerController.js';

const router = express.Router();

// All answer routes require authentication
router.use(authenticateUser);

// Answer routes
router.post('/correct', storeCorrectAnswer);
router.get('/test/:testId/correct', getCorrectAnswersForTest);

export default router;

