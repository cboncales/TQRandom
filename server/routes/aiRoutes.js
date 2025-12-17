import express from 'express';
import multer from 'multer';
import { generateTestWithAI, generateTestWithTOS } from '../controllers/aiController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Generate test with AI
router.post('/generate', authenticateUser, upload.single('file'), generateTestWithAI);

// Generate test with TOS template
router.post('/generate-with-tos', authenticateUser, upload.single('file'), generateTestWithTOS);

export default router;
