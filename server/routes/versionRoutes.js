import express from 'express';
import { 
  generateVersions, 
  getTestVersions, 
  getVersion, 
  getVersionAnswerKey,
  deleteVersion 
} from '../controllers/versionController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/versions/generate
 * Generate randomized versions for a test
 * Body: { testId, versionCount, questionsPerVersion }
 */
router.post('/generate', authenticateUser, generateVersions);

/**
 * GET /api/versions/test/:testId
 * Get all versions for a specific test
 */
router.get('/test/:testId', authenticateUser, getTestVersions);

/**
 * GET /api/versions/:versionId
 * Get a single version with all questions and answers
 */
router.get('/:versionId', authenticateUser, getVersion);

/**
 * GET /api/versions/:versionId/answer-key
 * Get answer key for a specific version
 */
router.get('/:versionId/answer-key', authenticateUser, getVersionAnswerKey);

/**
 * DELETE /api/versions/:versionId
 * Delete a version
 */
router.delete('/:versionId', authenticateUser, deleteVersion);

export default router;

