import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import sharp from 'sharp';
import fs from 'fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Extract raw text from a PDF file.
 * @param {string} filePath - The path to the PDF file.
 * @returns {Promise<string>} The extracted text.
 */
async function extractTextFromPdf(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

/**
 * Extract images from a PDF file using pdf.js
 * @param {string} filePath - The path to the PDF file
 * @returns {Promise<Array<{buffer: Buffer, name: string}>>} Array of image buffers
 */
async function extractImagesFromPdf(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
    const pdfDocument = await loadingTask.promise;
    
    const images = [];
    
    // Iterate through all pages
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const operatorList = await page.getOperatorList();
      
      // Find image operations
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        if (operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
            operatorList.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject) {
          
          try {
            const imageName = operatorList.argsArray[i][0];
            const image = await page.objs.get(imageName);
            
            if (image && image.data && image.width && image.height) {
              // Determine the number of channels based on the image kind
              let channels = 4; // Default to RGBA
              let rawBuffer = Buffer.from(image.data);
              
              // PDF.js images are typically in RGBA format
              // Convert raw pixel data to PNG using sharp
              const pngBuffer = await sharp(rawBuffer, {
                raw: {
                  width: image.width,
                  height: image.height,
                  channels: channels
                }
              })
              .png()
              .toBuffer();
              
              images.push({
                buffer: pngBuffer,
                name: `pdf_page${pageNum}_img${images.length}.png`,
                page: pageNum,
                width: image.width,
                height: image.height
              });
              
              console.log(`✅ Extracted image from PDF page ${pageNum}: ${image.width}x${image.height}`);
            }
          } catch (imgError) {
            console.warn(`❌ Could not extract image from page ${pageNum}:`, imgError.message);
          }
        }
      }
    }
    
    return images;
  } catch (error) {
    console.error('Error extracting images from PDF:', error);
    return []; // Return empty array if extraction fails
  }
}

/**
 * Extract raw text from a DOCX file.
 * @param {string} filePath - The path to the DOCX file.
 * @returns {Promise<string>} The extracted text.
 */
async function extractTextFromDocx(filePath) {
  const { value } = await mammoth.extractRawText({ path: filePath });
  return value;
}

/**
 * Extract images from a DOCX file
 * @param {string} filePath - The path to the DOCX file
 * @returns {Promise<Array<{buffer: Buffer, name: string}>>} Array of image buffers
 */
async function extractImagesFromDocx(filePath) {
  try {
    const images = [];
    let imageCount = 0;

    const result = await mammoth.convertToHtml(
      { path: filePath },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const buffer = await image.read();
          const contentType = image.contentType || 'image/png';
          const extension = contentType.split('/')[1] || 'png';
          
          images.push({
            buffer: buffer,
            name: `docx_img${imageCount++}.${extension}`,
            contentType: contentType
          });

          // Return a placeholder for HTML conversion
          return { src: `IMAGE_${imageCount - 1}` };
        })
      }
    );

    return images;
  } catch (error) {
    console.error('Error extracting images from DOCX:', error);
    return [];
  }
}

/**
 * Parses raw text into structured question and answer data.
 * Assumes questions start with a number (e.g., "1.", "1)")
 * Assumes answer choices start with a letter (A-H) (e.g., "A.", "A)")
 *
 * Now also handles [IMAGE] markers for embedded images
 * If no markers found, distributes images evenly across questions
 *
 * @param {string} rawText - The raw text extracted from the document.
 * @param {Array} extractedImages - Array of extracted images with {url, path}
 * @returns {Array<Object>} An array of question objects.
 */
function parseDocumentText(rawText, extractedImages = []) {
  const lines = rawText.split('\n');
  const questions = [];
  let currentQuestion = null;
  let questionNumber = 0;
  let imageIndex = 0;
  let hasImageMarkers = false;

  // Regex for question lines: starts with number, then dot or parenthesis, then text
  const questionPattern = /^(\d+)[\.\)]\s*(.+)$/;
  // Regex for answer choice lines: starts with letter (A-H), then dot or parenthesis, then text
  const answerChoicePattern = /^[A-H][\.\)]\s*(.+)$/i;
  // Regex for image markers
  const imagePattern = /\[IMAGE\]|\[IMG\]|IMAGE_(\d+)/i;
  
  // Check if document has any image markers
  hasImageMarkers = imagePattern.test(rawText);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue; // Skip blank lines
    }

    const questionMatch = trimmedLine.match(questionPattern);
    const answerChoiceMatch = trimmedLine.match(answerChoicePattern);
    const imageMatch = trimmedLine.match(imagePattern);

    if (questionMatch) {
      // New question found
      questionNumber = parseInt(questionMatch[1]);
      const text = questionMatch[2].trim();

      // If there was a previous question, push it to the array
      if (currentQuestion) {
        // Validate answer choices count
        if (currentQuestion.answer_choices.length < 2 || currentQuestion.answer_choices.length > 8) {
          console.warn(`Skipping question ${currentQuestion.question_number} due to invalid number of answer choices (${currentQuestion.answer_choices.length}). Must be between 2 and 8.`);
        } else {
          questions.push(currentQuestion);
        }
      }

      currentQuestion = {
        question_number: questionNumber,
        question_text: text,
        question_image: null, // Will be set if image marker found
        answer_choices: [],
      };
    } else if (imageMatch && currentQuestion) {
      // Image marker found
      if (currentQuestion.answer_choices.length === 0) {
        // Image belongs to question
        if (extractedImages[imageIndex]) {
          currentQuestion.question_image = extractedImages[imageIndex];
          imageIndex++;
        }
      } else {
        // Image belongs to last answer choice
        const lastChoiceIndex = currentQuestion.answer_choices.length - 1;
        if (extractedImages[imageIndex]) {
          currentQuestion.answer_choices[lastChoiceIndex].image = extractedImages[imageIndex];
          imageIndex++;
        }
      }
    } else if (answerChoiceMatch && currentQuestion) {
      // Answer choice for the current question
      const choiceText = answerChoiceMatch[1].trim();
      currentQuestion.answer_choices.push({
        text: choiceText,
        image: null // Will be set if image marker found next
      });
    } else if (currentQuestion) {
      // Multi-line question or answer choice (append to previous)
      // This logic assumes multi-line content belongs to the most recent element (question or last choice)
      if (currentQuestion.answer_choices.length > 0) {
        // Append to the last answer choice
        const lastChoiceIndex = currentQuestion.answer_choices.length - 1;
        currentQuestion.answer_choices[lastChoiceIndex].text += ' ' + trimmedLine;
      } else {
        // Append to the question text
        currentQuestion.question_text += ' ' + trimmedLine;
      }
    }
  }

  // Add the last question if it exists
  if (currentQuestion) {
    // Validate answer choices count for the last question
    if (currentQuestion.answer_choices.length < 2 || currentQuestion.answer_choices.length > 8) {
      console.warn(`Skipping question ${currentQuestion.question_number} due to invalid number of answer choices (${currentQuestion.answer_choices.length}). Must be between 2 and 8.`);
    } else {
      questions.push(currentQuestion);
    }
  }

  // If no [IMAGE] markers were found but we have extracted images,
  // distribute them evenly across questions (assign to first N questions)
  if (!hasImageMarkers && extractedImages.length > 0) {
    console.log(`No [IMAGE] markers found. Auto-distributing ${extractedImages.length} images to first ${Math.min(extractedImages.length, questions.length)} questions.`);
    
    for (let i = 0; i < Math.min(extractedImages.length, questions.length); i++) {
      if (extractedImages[i]) {
        questions[i].question_image = extractedImages[i];
        console.log(`Assigned image ${i + 1} to question ${questions[i].question_number}`);
      }
    }
  }

  return questions;
}

export {
  extractTextFromPdf,
  extractTextFromDocx,
  extractImagesFromPdf,
  extractImagesFromDocx,
  parseDocumentText,
};
