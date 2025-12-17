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
    const { testTitle, topic, numberOfQuestions, numberOfParts, parts, questionTypes, difficulty, file } = params;

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
      prompt = buildPromptWithParts(testTitle, topicContent, numberOfParts, adjustedParts, difficulty || 'Medium');
    } else {
      requestedCount = Math.ceil(numberOfQuestions * 1.1); // Request 10% more
      prompt = buildPromptWithoutParts(testTitle, topicContent, requestedCount, questionTypes, difficulty || 'Medium');
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
function buildPromptWithParts(testTitle, topic, numberOfParts, parts, difficulty) {
  let prompt = `Generate a test questionnaire with the following specifications:

Test Title: ${testTitle}
Topic: ${topic}
Difficulty Level: ${difficulty}
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
          "type": "multiple_choice" | "true_false" | "identification" | "fill_in_the_blank" | "essay" | "problem_solving" | "enumeration",
          "options": ["Option A", "Option B", "Option C", "Option D"], // Only for multiple_choice
          "correctAnswer": "Correct answer text",
          "explanation": "Brief explanation (optional)",
          "items": [ // Only for matching_type - array of question-answer pairs
            {
              "question": "Item question text",
              "answer": "Corresponding answer text"
            }
          ]
        }
      ]
    }
  ]
}

Important guidelines:
1. Difficulty Level:
   - Easy: Basic concepts, straightforward questions, minimal complexity
   - Medium: Moderate complexity, requires understanding and application of concepts
   - Hard: Complex scenarios, critical thinking, analysis and synthesis required
   - Adjust question complexity, vocabulary, and depth based on the specified difficulty level

2. For Multiple Choice questions:
   - Provide 4 options (A, B, C, D)
   - The correctAnswer should be the full text of the correct option
   - Make distractors plausible but clearly incorrect

3. For True/False questions:
   - The correctAnswer should be either "True" or "False"
   - No options array needed

4. For Identification questions:
   - Provide a clear, specific question
   - The correctAnswer should be a precise term, name, or concept
   - No options array needed

5. For Fill in the Blank questions:
   - Use underscores (___) to indicate where the blank should be
   - Example: "The capital of France is ___."
   - The correctAnswer should be the word(s) that fill the blank
   - No options array needed

6. For Essay questions:
   - Provide an open-ended question that requires explanation or analysis
   - The correctAnswer should be key points or a sample answer guideline
   - No options array needed

7. For Problem Solving questions:
   - Provide a problem that requires step-by-step solution
   - The correctAnswer should include the complete solution with steps and final answer
   - These are typically math, physics, or logic problems
   - No options array needed

8. For Enumeration questions:
   - Ask students to list or enumerate specific items
   - The correctAnswer should contain all acceptable answers separated by newlines
   - Example: "List three laws of thermodynamics" with correctAnswer containing each law on a new line
   - No options array needed

9. Question Type Directions (for reference)::
   - Multiple Choice: "Choose the best answer for each question."
   - True or False: "Write T if the statement is true and F if the statement is false."
   - Identification: "Identify the term, concept, or name being described."
   - Fill in the Blank: "Fill in the blank with the correct word or phrase."
   - Essay: "Write a comprehensive answer to the following question. Provide detailed explanations and examples."
   - Problem Solving: "Solve the following problem. Show your complete solution and final answer."
   - Enumeration: "List or enumerate the items requested. Write your answers clearly."

10. All questions should be:enumerate the items requested. Write your answers clearly."

11. All questions should be:
   - Clear and unambiguous
   - Appropriate difficulty level
   - Relevant to the topic
   - Grammatically correct
   - Varied in length: Mix short, concise questions with longer, more detailed questions for better assessment quality

CRITICAL: You MUST generate the correct number of questions for each part. Do NOT generate fewer or more questions than requested.

Generate exactly the number of questions specified for each part.`;

  return prompt;
}

/**
 * Build prompt for questions without parts
 */
function buildPromptWithoutParts(testTitle, topic, numberOfQuestions, questionTypes, difficulty) {
  const formattedTypes = questionTypes.map(t => formatQuestionType(t)).join(', ');
  
  let prompt = `Generate a test questionnaire with the following specifications:

Test Title: ${testTitle}
Topic: ${topic}
Difficulty Level: ${difficulty}
Number of Questions: ${numberOfQuestions}
Question Types: ${formattedTypes}

Please generate the questions in the following JSON format:
{
  "questions": [
    {
      "question": "Question text here",
      "type": "multiple_choice" | "true_false" | "identification" | "fill_in_the_blank" | "essay" | "problem_solving" | "enumeration",
      "options": ["Option A", "Option B", "Option C", "Option D"], // Only for multiple_choice
      "correctAnswer": "Correct answer text",
      "explanation": "Brief explanation (optional)",
      "items": [
        {
          "question": "Item question text",
          "answer": "Corresponding answer text"
        }
      ]
    }
  ]
}

Important guidelines:
1. Difficulty Level:
   - Easy: Basic concepts, straightforward questions, minimal complexity
   - Medium: Moderate complexity, requires understanding and application of concepts
   - Hard: Complex scenarios, critical thinking, analysis and synthesis required
   - Adjust question complexity, vocabulary, and depth based on the specified difficulty level

2. For Multiple Choice questions:
   - Provide 4 options (A, B, C, D)
   - The correctAnswer should be the full text of the correct option
   - Make distractors plausible but clearly incorrect

3. For True/False questions:
   - The correctAnswer should be either "True" or "False"
   - No options array needed

4. For Identification questions:
   - Provide a clear, specific question
   - The correctAnswer should be a precise term, name, or concept
   - No options array needed

5. For Fill in the Blank questions:
   - Use underscores (___) to indicate where the blank should be
   - Example: "The capital of France is ___."
   - The correctAnswer should be the word(s) that fill the blank
   - No options array needed

6. For Essay questions:
   - Provide an open-ended question that requires explanation or analysis
   - The correctAnswer should be key points or a sample answer guideline
   - No options array needed

7. For Problem Solving questions:
   - Provide a problem that requires step-by-step solution
   - The correctAnswer should include the complete solution with steps and final answer
   - These are typically math, physics, or logic problems
   - No options array needed

8. For Enumeration questions:
   - Ask students to list or enumerate specific items
   - The correctAnswer should contain all acceptable answers separated by newlines
   - Example: "List three laws of thermodynamics" with correctAnswer containing each law on a new line
   - No options array needed

9. Mix the question types as requested

10. Question Type Directions (for reference):
   - Multiple Choice: "Choose the best answer for each question."
   - True or False: "Write T if the statement is true and F if the statement is false."
   - Identification: "Identify the term, concept, or name being described."
   - Fill in the Blank: "Fill in the blank with the correct word or phrase."
   - Essay: "Write a comprehensive answer to the following question. Provide detailed explanations and examples."
   - Problem Solving: "Solve the given problem and show your work."
   - Enumeration: "List all the correct answers or items related to the question."

11. All questions should be:
   - Clear and unambiguous
   - Appropriate difficulty level
   - Relevant to the topic
   - Grammatically correct
   - Varied in length: Mix short, concise questions with longer, more detailed questions for better assessment quality

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
    'essay': 'Essay',
    'problem_solving': 'Problem Solving',
    'enumeration': 'Enumeration',
  };
  return types[type] || type;
}

/**
 * Generate questions based on TOS (Table of Specifications) template
 */
export async function generateQuestionsFromTOS(tosTemplate, topicContent, testTitle, difficulty = 'Medium') {
  try {
    console.log('Generating questions from TOS template:', tosTemplate.template_name);
    console.log('Difficulty level:', difficulty);
    console.log('Additional topic content provided:', !!topicContent);

    const topics = tosTemplate.tos_template_topics || [];
    const cognitiveLevels = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];
    
    // Validate and fix topic totals to ensure they don't exceed template total
    let totalTopicItems = topics.reduce((sum, topic) => sum + (topic.total_items || 0), 0);
    if (totalTopicItems !== tosTemplate.total_items) {
      console.warn(`Topic items sum (${totalTopicItems}) doesn't match template total (${tosTemplate.total_items}). Adjusting...`);
      
      // Adjust the last topic to match the total
      if (topics.length > 0) {
        const diff = totalTopicItems - tosTemplate.total_items;
        topics[topics.length - 1].total_items -= diff;
        
        // Also adjust cognitive levels in the last topic
        const lastTopic = topics[topics.length - 1];
        const cognitiveSum = cognitiveLevels.reduce((sum, level) => sum + (lastTopic[`items_${level}`] || 0), 0);
        if (cognitiveSum !== lastTopic.total_items && lastTopic.total_items > 0) {
          const cogDiff = cognitiveSum - lastTopic.total_items;
          // Adjust the first non-zero cognitive level
          for (const level of cognitiveLevels.reverse()) {
            if (lastTopic[`items_${level}`] > 0) {
              lastTopic[`items_${level}`] -= cogDiff;
              break;
            }
          }
        }
      }
    }
    
    // Build comprehensive prompt with TOS specifications
    let prompt = `Generate a test questionnaire based on the following Table of Specifications (TOS):

Test Title: ${testTitle}
Subject: ${tosTemplate.subject || 'General'}
Grade Level: ${tosTemplate.grade_level || 'Not specified'}
Total Items: ${tosTemplate.total_items}

COGNITIVE LEVELS DISTRIBUTION:
`;

    // Add cognitive levels distribution
    cognitiveLevels.forEach(level => {
      const percentage = tosTemplate[`percentage_${level}`] || 0;
      if (percentage > 0) {
        prompt += `- ${level.charAt(0).toUpperCase() + level.slice(1)}: ${percentage}%\n`;
      }
    });

    prompt += `\nTOPICS BREAKDOWN:\n`;

    // Add topics breakdown with explicit counts
    let totalExpected = 0;
    topics.forEach((topic, index) => {
      const topicTotal = topic.total_items || 0;
      totalExpected += topicTotal;
      
      prompt += `\nTopic ${index + 1}: ${topic.topic_name}
- Number of Sessions: ${topic.num_sessions}
- Percentage: ${topic.percentage}%
- Total Items for this Topic: ${topicTotal} QUESTIONS REQUIRED
- Cognitive Levels Distribution:
`;
      
      cognitiveLevels.forEach(level => {
        const items = topic[`items_${level}`] || 0;
        if (items > 0) {
          prompt += `  * ${level.charAt(0).toUpperCase() + level.slice(1)}: ${items} items\n`;
        }
      });
    });
    
    prompt += `\n⚠️ TOTAL QUESTIONS REQUIRED: ${totalExpected} (Sum of all topic items)\n`;
    prompt += `⚠️ VERIFICATION: Total must equal ${tosTemplate.total_items}\n`;

    // Add additional content reference if provided
    if (topicContent && topicContent.trim()) {
      prompt += `\nADDITIONAL CONTENT REFERENCE:
${topicContent}

Use the above content as additional context and examples for generating questions. Ensure questions are relevant to both the TOS topics and this additional content.
`;
    } else {
      prompt += `\nNote: Generate questions based on the topic names and cognitive levels specified above.
`;
    }

    prompt += `
DIFFICULTY LEVEL ADJUSTMENT:
- ${difficulty}: Adjust question complexity, vocabulary, and depth according to this level
  * Easy: Basic concepts, straightforward questions, minimal complexity
  * Medium: Moderate complexity, requires understanding and application
  * Hard: Complex scenarios, critical thinking, analysis and synthesis required

INSTRUCTIONS:
1. Generate exactly ${tosTemplate.total_items} questions following the TOS distribution
2. Each topic should have the specified number of items at each cognitive level
3. Adjust all questions to match the ${difficulty} difficulty level
4. Use appropriate question types based on Bloom's Taxonomy cognitive levels:

COGNITIVE LEVEL GUIDELINES:
- REMEMBERING (recall facts, terms, basic concepts):
  * Use: Multiple Choice, True/False, Identification
  * Focus on: definitions, facts, dates, names, formulas
  
- UNDERSTANDING (explain ideas, comprehend meanings):
  * Use: Multiple Choice, Identification, Essay
  * Focus on: explanations, comparisons, interpretations
  
- APPLYING (use information in new situations):
  * Use: Problem Solving, Multiple Choice with scenarios
  * Focus on: calculations, demonstrations, applications of concepts
  
- ANALYZING (break down information, identify relationships):
  * Use: Essay, Multiple Choice with complex scenarios, Problem Solving
  * Focus on: comparisons, contrasts, cause-effect, patterns
  
- EVALUATING (make judgments, critique ideas):
  * Use: Essay, Multiple Choice with critical thinking
  * Focus on: assessments, critiques, recommendations, justifications
  
- CREATING (produce new work, design solutions):
  * Use: Essay, Problem Solving, Enumeration
  * Focus on: designs, hypotheses, solutions, innovations

QUESTION TYPE FORMATS AND ANSWER REQUIREMENTS:
- Multiple Choice: 4 options (A, B, C, D) with one correct answer. correctAnswer must be the full text of correct option.
- True/False: Statement with true or false answer. correctAnswer must be "True" or "False".
- Identification: Direct question requiring specific answer. correctAnswer must be precise term/name/concept.
- Essay: Open-ended question requiring detailed explanation. correctAnswer MUST include key points or sample answer guideline.
- Problem Solving: Mathematical or logical problem. correctAnswer MUST include complete step-by-step solution with final answer.
- Enumeration: Question requiring list of items/steps. correctAnswer MUST contain all acceptable answers separated by newlines.

⚠️ CRITICAL REQUIREMENTS:
1. Every question MUST have a correctAnswer field - NO EXCEPTIONS!
2. The "type" field must ONLY be one of these exact values: "multiple_choice", "true_false", "identification", "essay", "problem_solving", "enumeration"
3. DO NOT use cognitive levels (remembering, understanding, etc.) as the question type
4. The "cognitiveLevel" is separate from "type" - they are different fields!

Please generate the questions in the following JSON format:
{
  "topics": [
    {
      "topicName": "Topic name",
      "questions": [
        {
          "question": "Question text here",
          "type": "multiple_choice" | "true_false" | "identification" | "essay" | "problem_solving" | "enumeration",
          "cognitiveLevel": "remembering" | "understanding" | "applying" | "analyzing" | "evaluating" | "creating",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Correct answer text",
          "explanation": "Brief explanation (optional)"
        }
      ]
    }
  ]
}

EXAMPLE - Correct Format:
{
  "question": "What is the capital of France?",
  "type": "multiple_choice",
  "cognitiveLevel": "remembering",
  "options": ["London", "Paris", "Berlin", "Madrid"],
  "correctAnswer": "Paris"
}

EXAMPLE - WRONG (DO NOT DO THIS):
{
  "question": "What is the capital of France?",
  "type": "remembering",  ❌ WRONG - This is cognitive level, not question type!
  "cognitiveLevel": "remembering"
}

IMPORTANT: 
- YOU MUST GENERATE EXACTLY ${tosTemplate.total_items} QUESTIONS IN TOTAL - NO MORE, NO LESS
- COUNT YOUR QUESTIONS CAREFULLY BEFORE RESPONDING
- Follow the cognitive level distribution strictly
- Each topic must have its specified number of items at each cognitive level
- Vary question types appropriately based on cognitive level
- Higher cognitive levels (analyzing, evaluating, creating) should use more complex question types
- Ensure all questions are clear, accurate, and aligned with the cognitive level

VERIFICATION CHECKLIST BEFORE SUBMITTING:
1. Count total questions across all topics = ${tosTemplate.total_items}? ✓
2. Each topic has the correct number of items? ✓
3. Each cognitive level in each topic has the correct count? ✓
4. All questions have correctAnswer field? ✓
`;

    console.log('Sending TOS-based prompt to OpenAI...');
    
    // Calculate approximate tokens needed (rough estimate: 150 tokens per question)
    const estimatedTokens = Math.max(4000, tosTemplate.total_items * 150 + 1000);
    const maxTokens = Math.min(estimatedTokens, 16000); // Cap at model limit
    
    console.log(`Using max_tokens: ${maxTokens} for ${tosTemplate.total_items} questions`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator specializing in creating high-quality test questions based on Table of Specifications and Bloom\'s Taxonomy. Generate questions that are clear, accurate, and properly aligned with cognitive levels. Always respond with valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7, // Slightly higher for more variety
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const finishReason = response.choices[0].finish_reason;
    
    console.log('Received response from OpenAI');
    console.log('Finish reason:', finishReason);
    console.log('Response length:', content.length);
    
    // Check if response was truncated
    if (finishReason === 'length') {
      console.warn('WARNING: Response was truncated due to token limit. Some questions may be missing.');
      throw new Error(`Response truncated. The TOS template requires ${tosTemplate.total_items} questions which exceeded the token limit. Please reduce the number of questions or split into smaller templates.`);
    }
    
    // Log first 500 chars of response for debugging
    console.log('Response preview:', content.substring(0, 500));

    // Parse the response with error handling
    let parsedResponse;
    try {
      // Clean up the content - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Content length:', content.length);
      console.error('Content preview:', content.substring(0, 1000));
      console.error('Content end:', content.substring(content.length - 500));
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}. Response may be too large or contain invalid JSON.`);
    }
    
    // Transform to standard format
    const allQuestions = [];
    let questionNumber = 1;
    const validQuestionTypes = ['multiple_choice', 'true_false', 'identification', 'essay', 'problem_solving', 'enumeration'];
    const cognitiveLevelNames = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];

    if (parsedResponse.topics && Array.isArray(parsedResponse.topics)) {
      parsedResponse.topics.forEach(topic => {
        if (topic.questions && Array.isArray(topic.questions)) {
          topic.questions.forEach(q => {
            let questionType = q.type || 'multiple_choice';
            
            // Validate and fix if AI used cognitive level as question type
            if (cognitiveLevelNames.includes(questionType.toLowerCase())) {
              console.warn(`Invalid question type "${questionType}" (cognitive level used as type). Defaulting to "multiple_choice".`);
              questionType = 'multiple_choice';
            }
            
            // Ensure it's a valid question type
            if (!validQuestionTypes.includes(questionType.toLowerCase())) {
              console.warn(`Unknown question type "${questionType}". Defaulting to "multiple_choice".`);
              questionType = 'multiple_choice';
            }
            
            const formattedType = formatQuestionType(questionType);
            const options = q.options || [];
            const correctAnswer = q.correctAnswer || '';
            
            // Validate correctAnswer exists
            if (!correctAnswer) {
              console.warn(`Question missing correctAnswer: "${q.question?.substring(0, 50)}..."`);
            }
            
            allQuestions.push({
              question: q.question,
              type: formattedType,
              options: options,
              correctAnswer: correctAnswer,
              explanation: q.explanation,
              cognitiveLevel: q.cognitiveLevel,
              topic: topic.topicName,
              questionNumber: questionNumber++
            });
          });
        }
      });
    }

    console.log(`Generated ${allQuestions.length} questions from TOS (expected: ${tosTemplate.total_items})`);

    // Validate question count
    if (allQuestions.length < tosTemplate.total_items) {
      console.warn(`WARNING: Generated ${allQuestions.length} questions but expected ${tosTemplate.total_items}`);
      console.warn('This may happen due to AI inconsistency. Returning available questions.');
    } else if (allQuestions.length > tosTemplate.total_items) {
      console.warn(`WARNING: Generated ${allQuestions.length} questions but expected ${tosTemplate.total_items}. Trimming excess.`);
      allQuestions.splice(tosTemplate.total_items); // Remove excess questions
    }

    return {
      success: true,
      data: {
        questions: allQuestions,
        tosTemplate: tosTemplate.template_name
      }
    };

  } catch (error) {
    console.error('Error generating questions from TOS:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate questions from TOS'
    };
  }
}
