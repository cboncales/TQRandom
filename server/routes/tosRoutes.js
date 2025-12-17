import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  createTOSTemplate,
  getUserTOSTemplates,
  getTOSTemplate,
  updateTOSTemplate,
  deleteTOSTemplate,
  linkTOSToTest,
  getTestTOS
} from '../controllers/tosController.js';

const router = express.Router();

// All TOS routes require authentication
router.use(authenticateUser);

// TOS Template routes
router.post('/templates', createTOSTemplate);
router.get('/templates', getUserTOSTemplates);
router.get('/templates/:id', getTOSTemplate);
router.put('/templates/:id', updateTOSTemplate);
router.delete('/templates/:id', deleteTOSTemplate);

// Link TOS to Test
router.post('/link', linkTOSToTest);
router.get('/test/:testId', getTestTOS);

export default router;
