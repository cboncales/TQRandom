import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract text from uploaded file based on file type
 */
export async function extractTextFromFile(file) {
  try {
    if (!file || !file.buffer) {
      return null;
    }

    const mimeType = file.mimetype;

    if (mimeType === 'application/pdf') {
      return await extractTextFromPDF(file.buffer);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await extractTextFromDOCX(file.buffer);
    } else if (mimeType === 'application/msword') {
      return await extractTextFromDOC(file.buffer);
    } else if (mimeType === 'text/plain') {
      return file.buffer.toString('utf-8');
    }

    return null;
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return null;
  }
}

/**
 * Extract text from PDF
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Extract text from DOCX
 */
async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

/**
 * Extract text from DOC (older format)
 */
async function extractTextFromDOC(buffer) {
  try {
    // Mammoth also handles older .doc files
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOC:', error);
    throw new Error('Failed to parse DOC file');
  }
}
