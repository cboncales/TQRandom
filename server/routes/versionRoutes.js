import express from 'express';
import { 
  generateVersions, 
  getTestVersions, 
  getVersion, 
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
 * DELETE /api/versions/:versionId
 * Delete a version
 */
router.delete('/:versionId', authenticateUser, deleteVersion);

export default router;

