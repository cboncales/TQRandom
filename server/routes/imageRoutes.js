import express from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/auth.js';
import { uploadImage } from '../utils/storageHelper.js';
import path from 'path';

const router = express.Router();

// Configure Multer for memory storage (we'll process in memory)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for individual uploads
});

/**
 * Upload a single image
 * POST /api/images/upload
 */
router.post('/upload', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const userId = req.user.id;
    
    // Upload the image buffer to Supabase Storage
    const result = await uploadImage(req.file.buffer, req.file.originalname, userId);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: result.url,
      imagePath: result.path
    });

  } catch (error) {
    console.error('Error in image upload:', error);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

export default router;

