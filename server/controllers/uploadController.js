import { parseDocument, validateParsedQuestions } from '../utils/documentParser.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Upload and parse document (PDF or DOCX)
 * Extracts questions and answer choices
 */
export async function uploadDocument(req, res) {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const filePath = file.path;
    const fileExtension = path.extname(file.originalname).toLowerCase().replace('.', '');

    console.log('Processing uploaded file:', file.originalname);
    console.log('File path:', filePath);
    console.log('File type:', fileExtension);

    // Validate file type
    if (!['pdf', 'doc', 'docx'].includes(fileExtension)) {
      // Clean up uploaded file
      await fs.unlink(filePath);
      return res.status(400).json({ 
        error: 'Invalid file type. Only PDF, DOC, and DOCX files are supported.' 
      });
    }

    // Parse the document
    let questions;
    try {
      questions = await parseDocument(filePath, fileExtension);
      console.log(`Extracted ${questions.length} questions from document`);
    } catch (parseError) {
      console.error('Error parsing document:', parseError);
      // Clean up uploaded file
      await fs.unlink(filePath);
      return res.status(500).json({ 
        error: 'Failed to parse document. Please ensure the document is properly formatted.' 
      });
    }

    // Validate parsed questions
    const validation = validateParsedQuestions(questions);
    if (!validation.isValid) {
      console.warn('Validation errors:', validation.errors);
      // Clean up uploaded file
      await fs.unlink(filePath);
      return res.status(400).json({ 
        error: 'Document validation failed',
        details: validation.errors
      });
    }

    // Clean up uploaded file after successful parsing
    await fs.unlink(filePath);

    // Return parsed questions
    res.json({
      success: true,
      data: questions,
      count: questions.length
    });

  } catch (error) {
    console.error('Error in uploadDocument:', error);
    
    // Try to clean up file if it exists
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ 
      error: 'Failed to process document upload',
      message: error.message 
    });
  }
}

export default {
  uploadDocument
};

