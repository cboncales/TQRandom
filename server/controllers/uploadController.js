import { 
  extractTextFromPdf, 
  extractTextFromDocx, 
  extractImagesFromPdf,
  extractImagesFromDocx,
  parseDocumentText 
} from '../utils/documentParser.js';
import { uploadMultipleImages } from '../utils/storageHelper.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Handles document upload, extracts text and images, and parses it into structured questions.
 */
async function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const userId = req.user?.id || 'anonymous';
    
    let rawText = '';
    let extractedImages = [];

    // Step 1: Extract text and images based on file type
    if (fileExtension === '.pdf') {
      rawText = await extractTextFromPdf(filePath);
      extractedImages = await extractImagesFromPdf(filePath);
      console.log(`Extracted ${extractedImages.length} images from PDF`);
    } else if (fileExtension === '.docx' || fileExtension === '.doc') {
      rawText = await extractTextFromDocx(filePath);
      extractedImages = await extractImagesFromDocx(filePath);
      console.log(`Extracted ${extractedImages.length} images from DOCX`);
    } else {
      await fs.unlink(filePath);
      return res.status(400).json({ error: 'Unsupported file type. Only PDF and DOCX are allowed.' });
    }

    // Step 2: Upload images to Supabase Storage
    let uploadedImages = [];
    if (extractedImages.length > 0) {
      console.log(`Uploading ${extractedImages.length} images to storage...`);
      const uploadResults = await uploadMultipleImages(extractedImages, userId);
      
      // Filter successful uploads
      uploadedImages = uploadResults.map((result, index) => {
        if (result.error) {
          console.warn(`Failed to upload image ${index}:`, result.error);
          return null;
        }
        return result;
      }).filter(img => img !== null);

      console.log(`Successfully uploaded ${uploadedImages.length} images`);
    }

    // Step 3: Parse text into structured questions
    const parsedQuestions = parseDocumentText(rawText, uploadedImages);
    
    const questionsWithImages = parsedQuestions
      .map((q, idx) => q.question_image ? idx + 1 : null)
      .filter(n => n !== null);

    // Clean up the uploaded file after processing
    await fs.unlink(filePath);

    res.json({
      message: 'Document processed successfully',
      data: parsedQuestions,
      images: uploadedImages, // Include uploaded images for manual assignment
      stats: {
        total_questions: parsedQuestions.length,
        total_images: uploadedImages.length,
        images_extracted: extractedImages.length
      }
    });

  } catch (error) {
    console.error('Error processing document:', error);
    // Ensure file is deleted even if parsing fails
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(e => console.error("Error deleting temp file:", e));
    }
    res.status(500).json({ 
      error: 'Failed to process document', 
      details: error.message 
    });
  }
}

export {
  uploadDocument,
};
