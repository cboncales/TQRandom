import OpenAI from 'openai';
import { extractTextFromFile } from '../utils/fileParser.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate questions using OpenAI based on the provided parameters
 */
export async function generateQuestions(params) {
  try {
    const { testTitle, topic, numberOfQuestions, numberOfParts, parts, questionTypes, file } = params;

    // Extract text from file if provided
    let topicContent = topic;
    if (file) {
      const extractedText = await extractTextFromFile(file);
      topicContent = extractedText || topic;
    }

    let prompt = '';
    let requestedCount = numberOfQuestions;
    let adjustedParts = parts;

    // Strategy: Request 10% more questions to account for inconsistency, then trim to exact count
    if (numberOfParts > 0 && parts && parts.length > 0) {
      adjustedParts = parts.map(part => ({
        ...part,
        questionCount: Math.ceil(part.questionCount * 1.1) // Request 10% more
      }));
      prompt = buildPromptWithParts(testTitle, topicContent, numberOfParts, adjustedParts);
    } else {
      requestedCount = Math.ceil(numberOfQuestions * 1.1); // Request 10% more
      prompt = buildPromptWithoutParts(testTitle, topicContent, requestedCount, questionTypes);
    }

    console.log('Sending prompt to OpenAI...');
    console.log(`Requesting ${requestedCount} questions (will trim to ${numberOfQuestions})`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator specializing in creating high-quality test questions. Generate questions that are clear, accurate, and appropriate for the given topic. Always respond with valid JSON format. Generate AT LEAST the number of questions requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    });

    const generatedContent = response.choices[0].message.content;
    console.log('Received response from OpenAI');

    // Parse the JSON response
    const parsedQuestions = JSON.parse(generatedContent);
    
    // Validate and trim to EXACT count
    if (numberOfParts > 0 && parts && parts.length > 0) {
      // Trim parts-based generation to exact counts
      let totalGenerated = 0;
      let totalExpected = 0;
      
      parts.forEach((part, index) => {
        totalExpected += part.questionCount; // Use original count
        const generatedPart = parsedQuestions.parts?.[index];
        if (generatedPart && generatedPart.questions) {
          const generatedCount = generatedPart.questions.length;
          totalGenerated += generatedCount;
          
          // Always trim to exact count
          if (generatedCount !== part.questionCount) {
            console.log(`Part ${index + 1}: Generated ${generatedCount}, trimming to ${part.questionCount}`);
            generatedPart.questions = generatedPart.questions.slice(0, part.questionCount);
          }
        }
      });
      
      console.log(`Total questions: Expected ${totalExpected}, Generated ${totalGenerated}`);
    } else {
      // Trim non-parts generation to exact count
      const generatedCount = parsedQuestions.questions?.length || 0;
      console.log(`Questions: Expected ${numberOfQuestions}, Generated ${generatedCount}`);
      
      // Always trim to exact count
      if (generatedCount !== numberOfQuestions) {
        console.log(`Trimming from ${generatedCount} to ${numberOfQuestions} questions`);
        parsedQuestions.questions = parsedQuestions.questions.slice(0, numberOfQuestions);
      }
      
      // Warn if we didn't get enough questions even with the buffer
      if (generatedCount < numberOfQuestions) {
        console.warn(`WARNING: Only generated ${generatedCount} questions, requested ${numberOfQuestions}. User will see fewer questions.`);
      }
    }
    
    return {
      success: true,
      data: parsedQuestions
    };

  } catch (error) {
    console.error('Error generating questions with OpenAI:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate questions'
    };
  }
}

/**
 * Build prompt for questions with parts
 */
function buildPromptWithParts(testTitle, topic, numberOfParts, parts) {
  let prompt = `Generate a test questionnaire with the following specifications:

Test Title: ${testTitle}
Topic: ${topic}
Number of Parts: ${numberOfParts}

`;

  parts.forEach((part, index) => {
    const questionType = formatQuestionType(part.questionType);
    prompt += `Part ${index + 1}:
- Question Type: ${questionType}
- Number of Questions: ${part.questionCount}

`;
  });

  prompt += `
Please generate the questions in the following JSON format:
{
  "parts": [
    {
      "partNumber": 1,
      "questions": [
        {
          "question": "Question text here",
          "type": "multiple_choice" | "true_false" | "identification" | "fill_in_the_blank" | "essay",
          "options": ["Option A", "Option B", "Option C", "Option D"], // Only for multiple_choice
          "correctAnswer": "Correct answer text",
          "explanation": "Brief explanation (optional)"
        }
      ]
    }
  ]
}

Important guidelines:
1. For Multiple Choice questions:
   - Provide 4 options (A, B, C, D)
   - The correctAnswer should be the full text of the correct option
   - Make distractors plausible but clearly incorrect

2. For True/False questions:
   - The correctAnswer should be either "True" or "False"
   - No options array needed

3. For Identification questions:
   - Provide a clear, specific question
   - The correctAnswer should be a precise term, name, or concept
   - No options array needed

4. For Fill in the Blank questions:
   - Use underscores (___) to indicate where the blank should be
   - Example: "The capital of France is ___."
   - The correctAnswer should be the word(s) that fill the blank
   - No options array needed

5. For Essay questions:
   - Provide an open-ended question that requires explanation or analysis
   - The correctAnswer should be key points or a sample answer guideline
   - No options array needed

6. All questions should be:
   - Clear and unambiguous
   - Appropriate difficulty level
   - Relevant to the topic
   - Grammatically correct

CRITICAL: You MUST generate EXACTLY the number of questions specified for each part. Do NOT generate fewer or more questions than requested.

Generate exactly the number of questions specified for each part.`;

  return prompt;
}

/**
 * Build prompt for questions without parts
 */
function buildPromptWithoutParts(testTitle, topic, numberOfQuestions, questionTypes) {
  const formattedTypes = questionTypes.map(t => formatQuestionType(t)).join(', ');
  
  let prompt = `Generate a test questionnaire with the following specifications:

Test Title: ${testTitle}
Topic: ${topic}
Number of Questions: ${numberOfQuestions}
Question Types: ${formattedTypes}

Please generate the questions in the following JSON format:
{
  "questions": [
    {
      "question": "Question text here",
      "type": "multiple_choice" | "true_false" | "identification" | "fill_in_the_blank" | "essay",
      "options": ["Option A", "Option B", "Option C", "Option D"], // Only for multiple_choice
      "correctAnswer": "Correct answer text",
      "explanation": "Brief explanation (optional)"
    }
  ]
}

Important guidelines:
1. For Multiple Choice questions:
   - Provide 4 options (A, B, C, D)
   - The correctAnswer should be the full text of the correct option
   - Make distractors plausible but clearly incorrect

2. For True/False questions:
   - The correctAnswer should be either "True" or "False"
   - No options array needed

3. For Identification questions:
   - Provide a clear, specific question
   - The correctAnswer should be a precise term, name, or concept
   - No options array needed

4. For Fill in the Blank questions:
   - Use underscores (___) to indicate where the blank should be
   - Example: "The capital of France is ___."
   - The correctAnswer should be the word(s) that fill the blank
   - No options array needed

5. For Essay questions:
   - Provide an open-ended question that requires explanation or analysis
   - The correctAnswer should be key points or a sample answer guideline
   - No options array needed

6. Mix the question types as requested
7. All questions should be:
   - Clear and unambiguous
   - Appropriate difficulty level
   - Relevant to the topic
   - Grammatically correct

CRITICAL: You MUST generate EXACTLY ${numberOfQuestions} questions. Count carefully and ensure the "questions" array contains exactly ${numberOfQuestions} items. Do NOT generate fewer or more questions than requested.

Generate exactly ${numberOfQuestions} questions.`;

  return prompt;
}

/**
 * Format question type for display
 */
function formatQuestionType(type) {
  const types = {
    'multiple_choice': 'Multiple Choice',
    'true_false': 'True or False',
    'identification': 'Identification',
    'fill_in_the_blank': 'Fill in the Blank',
    'essay': 'Essay'
  };
  return types[type] || type;
}
