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
              
              console.log(`Extracted image from PDF page ${pageNum}: ${image.width}x${image.height}`);
            }
          } catch (imgError) {
            console.warn(`Could not extract image from page ${pageNum}:`, imgError.message);
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
 * Supports multiple question types:
 * - Multiple Choice: Questions with 2-8 lettered answer choices (A., B., C., etc.)
 * - True/False: Questions with "True" and "False" or "T" and "F" answers
 * - Identification: Questions with "Answer:" or "Ans:" followed by the answer
 * - Fill in the Blank: Questions containing ___ with "Answer:" or "Ans:" 
 * - Essay: Questions marked with [ESSAY] or no answer format
 * 
 * Format examples:
 * 1. What is 2+2? [Multiple Choice]
 *    A. 3
 *    B. 4
 *    C. 5
 * 
 * 2. The Earth is round. [True/False]
 *    True
 *    False
 * 
 * 3. Who invented the telephone? [Identification]
 *    Answer: Alexander Graham Bell
 * 
 * 4. The capital of France is ___. [Fill in the Blank]
 *    Answer: Paris
 * 
 * 5. Explain the theory of relativity. [Essay]
 *    Answer: [sample answer or key points]
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

  // Regex patterns
  const questionPattern = /^(\d+)[\.\)]\s*(.+)$/;
  const answerChoicePattern = /^[A-H][\.\)]\s+(.+)$/i;
  const imagePattern = /\[IMAGE\]|\[IMG\]|IMAGE_(\d+)/i;
  const answerPattern = /^(Answer|Ans|ANSWER|ANS):\s*(.+)$/i;
  const truePattern = /^(True|TRUE|T)$/;
  const falsePattern = /^(False|FALSE|F)$/;
  const essayMarker = /\[ESSAY\]|\[Essay\]/i;
  const fillInBlankPattern = /___+/;
  
  // Check if document has any image markers
  hasImageMarkers = imagePattern.test(rawText);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue;
    }

    const questionMatch = trimmedLine.match(questionPattern);
    const answerChoiceMatch = trimmedLine.match(answerChoicePattern);
    const imageMatch = trimmedLine.match(imagePattern);
    const answerMatch = trimmedLine.match(answerPattern);
    const trueMatch = trimmedLine.match(truePattern);
    const falseMatch = trimmedLine.match(falsePattern);

    if (questionMatch) {
      // Save previous question
      if (currentQuestion) {
        questions.push(finalizeQuestion(currentQuestion));
      }

      questionNumber = parseInt(questionMatch[1]);
      const text = questionMatch[2].trim();

      // Detect question type
      let type = 'Multiple Choice'; // Default
      if (essayMarker.test(text)) {
        type = 'Essay';
      } else if (fillInBlankPattern.test(text)) {
        type = 'Fill in the Blank';
      }

      currentQuestion = {
        question_number: questionNumber,
        question_text: text.replace(essayMarker, '').trim(),
        question_image: null,
        question_type: type,
        answer_choices: [],
        direct_answer: null, // For non-MC questions
      };
    } else if (imageMatch && currentQuestion) {
      // Image marker found
      if (currentQuestion.answer_choices.length === 0) {
        if (extractedImages[imageIndex]) {
          currentQuestion.question_image = extractedImages[imageIndex];
          imageIndex++;
        }
      } else {
        const lastChoiceIndex = currentQuestion.answer_choices.length - 1;
        if (extractedImages[imageIndex]) {
          currentQuestion.answer_choices[lastChoiceIndex].image = extractedImages[imageIndex];
          imageIndex++;
        }
      }
    } else if (answerMatch && currentQuestion) {
      // Direct answer format (for Identification, Fill in Blank, Essay)
      currentQuestion.direct_answer = answerMatch[2].trim();
      if (currentQuestion.question_type === 'Multiple Choice') {
        currentQuestion.question_type = 'Identification';
      }
    } else if (answerChoiceMatch && currentQuestion) {
      // Multiple choice answer
      const choiceText = answerChoiceMatch[1].trim();
      currentQuestion.answer_choices.push({
        text: choiceText,
        image: null
      });
    } else if ((trueMatch || falseMatch) && currentQuestion) {
      // True/False answer
      if (currentQuestion.answer_choices.length === 0) {
        currentQuestion.question_type = 'True or False';
      }
      const choiceText = trueMatch ? 'True' : 'False';
      currentQuestion.answer_choices.push({
        text: choiceText,
        image: null
      });
    } else if (currentQuestion) {
      // Multi-line content
      if (currentQuestion.answer_choices.length > 0) {
        const lastChoiceIndex = currentQuestion.answer_choices.length - 1;
        currentQuestion.answer_choices[lastChoiceIndex].text += ' ' + trimmedLine;
      } else {
        currentQuestion.question_text += ' ' + trimmedLine;
      }
    }
  }

  // Add the last question
  if (currentQuestion) {
    questions.push(finalizeQuestion(currentQuestion));
  }

  // Auto-distribute images if no markers found
  if (!hasImageMarkers && extractedImages.length > 0) {
    console.log(`Auto-distributing ${extractedImages.length} images to questions`);
    for (let i = 0; i < Math.min(extractedImages.length, questions.length); i++) {
      if (extractedImages[i]) {
        questions[i].question_image = extractedImages[i];
      }
    }
  }

  return questions;
}

/**
 * Finalize and validate a question object
 */
function finalizeQuestion(question) {
  const { question_type, answer_choices, direct_answer } = question;

  // Validate based on question type
  if (question_type === 'Multiple Choice') {
    if (answer_choices.length < 2 || answer_choices.length > 8) {
      console.warn(`Skipping question ${question.question_number}: Invalid MC choices (${answer_choices.length})`);
      return null;
    }
  } else if (question_type === 'True or False') {
    if (answer_choices.length !== 2) {
      console.warn(`Skipping question ${question.question_number}: True/False must have 2 choices`);
      return null;
    }
  } else if (['Identification', 'Fill in the Blank', 'Essay'].includes(question_type)) {
    if (!direct_answer) {
      console.warn(`Skipping question ${question.question_number}: ${question_type} needs an answer`);
      return null;
    }
  }

  return question;
}

export {
  extractTextFromPdf,
  extractTextFromDocx,
  extractImagesFromPdf,
  extractImagesFromDocx,
  parseDocumentText,
};
