import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import fs from 'fs/promises';

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from DOCX file
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromDOCX(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

/**
 * Parse extracted text into structured question/answer data
 * @param {string} text - Raw text extracted from document
 * @returns {Array<Object>} - Array of question objects
 */
function parseQuestionsFromText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const questions = [];
  let currentQuestion = null;
  let currentQuestionText = '';
  let collectingQuestion = false;

  // Regex patterns
  const questionPattern = /^(\d+)[\.\)]\s*(.+)$/;
  const choicePattern = /^([A-H])[\.\)]\s*(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a question
    const questionMatch = line.match(questionPattern);
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentQuestionText) {
        currentQuestion.question_text = currentQuestionText.trim();
        if (currentQuestion.answer_choices.length > 0) {
          questions.push(currentQuestion);
        }
      }

      // Start new question
      currentQuestion = {
        question_text: '',
        answer_choices: []
      };
      currentQuestionText = questionMatch[2]; // Get question text after number
      collectingQuestion = true;
      continue;
    }

    // Check if line is an answer choice
    const choiceMatch = line.match(choicePattern);
    if (choiceMatch && currentQuestion) {
      // Question text is complete, now collecting choices
      if (collectingQuestion) {
        currentQuestion.question_text = currentQuestionText.trim();
        collectingQuestion = false;
      }
      currentQuestion.answer_choices.push(choiceMatch[2].trim());
      continue;
    }

    // If we're still collecting question text (multi-line question)
    if (collectingQuestion && currentQuestion) {
      // Check if this line is not a choice or new question
      if (!line.match(/^[A-H][\.\)]/) && !line.match(/^\d+[\.\)]/)) {
        currentQuestionText += ' ' + line;
      }
    }
  }

  // Don't forget to add the last question
  if (currentQuestion && currentQuestionText) {
    currentQuestion.question_text = currentQuestionText.trim();
    if (currentQuestion.answer_choices.length > 0) {
      questions.push(currentQuestion);
    }
  }

  return questions;
}

/**
 * Main function to parse document and extract questions
 * @param {string} filePath - Path to the document file
 * @param {string} fileType - File extension (pdf, docx, doc)
 * @returns {Promise<Array<Object>>} - Array of parsed questions
 */
export async function parseDocument(filePath, fileType) {
  let text = '';

  // Extract text based on file type
  if (fileType === 'pdf') {
    text = await extractTextFromPDF(filePath);
  } else if (fileType === 'docx' || fileType === 'doc') {
    text = await extractTextFromDOCX(filePath);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Parse the extracted text into structured data
  const questions = parseQuestionsFromText(text);

  return questions;
}

/**
 * Validate parsed questions
 * @param {Array<Object>} questions - Array of question objects
 * @returns {Object} - Validation result with isValid and errors
 */
export function validateParsedQuestions(questions) {
  const errors = [];

  if (!Array.isArray(questions) || questions.length === 0) {
    return {
      isValid: false,
      errors: ['No questions found in the document']
    };
  }

  questions.forEach((q, index) => {
    if (!q.question_text || q.question_text.trim().length === 0) {
      errors.push(`Question ${index + 1}: Missing question text`);
    }

    if (!Array.isArray(q.answer_choices) || q.answer_choices.length < 2) {
      errors.push(`Question ${index + 1}: Must have at least 2 answer choices`);
    }

    if (q.answer_choices.length > 8) {
      errors.push(`Question ${index + 1}: Too many answer choices (max 8)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  parseDocument,
  validateParsedQuestions
};

