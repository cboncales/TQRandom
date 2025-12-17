import { supabase } from '../config/supabase.js';
import { generateQuestions, generateQuestionsFromTOS } from '../services/openaiService.js';

/**
 * Convert question type from API format to database format
 */
function convertQuestionType(type) {
  const typeMap = {
    'multiple_choice': 'Multiple Choice',
    'true_false': 'True or False',
    'identification': 'Identification',
    'fill_in_the_blank': 'Fill in the Blank',
    'essay': 'Essay',
    'matching_type': 'Matching Type',
    'rearrangement': 'Rearrangement'
  };
  return typeMap[type] || type;
}

/**
 * Generate test with AI and save to database
 */
async function generateTestWithAI(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { testTitle, topic, numberOfQuestions, numberOfParts, parts, questionTypes, difficulty, tosTemplateId } = req.body;
    const file = req.file; // From multer

    console.log('Generating test with AI for user:', userId);
    console.log('Raw parameters:', { testTitle, numberOfQuestions, numberOfParts, parts, questionTypes, difficulty, tosTemplateId });

    // If TOS template is selected, use TOS-based generation
    if (tosTemplateId && tosTemplateId !== 'null' && tosTemplateId !== '') {
      console.log('Using TOS template:', tosTemplateId);
      return await generateTestWithTOS(req, res);
    }

    // Parse parts and questionTypes if they are JSON strings
    let parsedParts = parts;
    let parsedQuestionTypes = questionTypes;
    
    if (typeof parts === 'string') {
      try {
        parsedParts = JSON.parse(parts);
      } catch (e) {
        console.error('Error parsing parts:', e);
        parsedParts = [];
      }
    }
    
    if (typeof questionTypes === 'string') {
      try {
        parsedQuestionTypes = JSON.parse(questionTypes);
      } catch (e) {
        console.error('Error parsing questionTypes:', e);
        parsedQuestionTypes = [];
      }
    }

    console.log('Parsed parameters:', { parsedParts: parsedParts?.length, parsedQuestionTypes: parsedQuestionTypes?.length });

    // Validate required fields
    if (!testTitle || !testTitle.trim()) {
      return res.status(400).json({ error: 'Test title is required' });
    }

    if (!topic && !file) {
      return res.status(400).json({ error: 'Topic or file is required' });
    }

    // Generate questions using OpenAI
    const generationResult = await generateQuestions({
      testTitle: testTitle.trim(),
      topic: topic || '',
      numberOfQuestions: parseInt(numberOfQuestions) || 10,
      numberOfParts: parseInt(numberOfParts) || 0,
      parts: parsedParts || [],
      questionTypes: parsedQuestionTypes || [],
      difficulty: difficulty || 'Medium',
      file: file
    });

    if (!generationResult.success) {
      return res.status(500).json({ error: generationResult.error });
    }

    const generatedData = generationResult.data;

    // Create the test in database
    const testData = {
      user_id: userId,
      title: testTitle.trim(),
      description: null, // Let user add description later
      number_of_parts: parseInt(numberOfParts) || 0,
      part_descriptions: [],
      directions: []
    };

    // Set up part descriptions and directions if parts exist
    if (numberOfParts > 0 && parsedParts && parsedParts.length > 0) {
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
      testData.part_descriptions = parsedParts.map((part, index) => {
        const romanNumeral = romanNumerals[index] || (index + 1);
        const questionType = part.questionType || '';
        // Convert question type to proper format
        const formattedType = convertQuestionType(questionType);
        if (formattedType) {
          return `Part ${romanNumeral}: ${formattedType}`;
        }
        return `Part ${romanNumeral}`;
      });
      testData.directions = parsedParts.map((part) => {
        const questionType = part.questionType || '';
        // Convert to proper format for switch comparison
        const formattedType = convertQuestionType(questionType);
        // Generate appropriate directions based on question type
        switch (formattedType) {
          case 'Matching Type':
            return 'Match each item in Column A with the correct answer in Column B.';
          case 'True or False':
            return 'Write T if the statement is true and F if the statement is false.';
          case 'Identification':
            return 'Identify the term, concept, or name being described.';
          case 'Fill in the Blank':
            return 'Fill in the blank with the correct word or phrase.';
          case 'Essay':
            return 'Write a comprehensive answer to the following question. Provide detailed explanations and examples.';
          case 'Multiple Choice':
          default:
            return 'Choose the best answer for each question.';
        }
      });
    } else {
      testData.directions = ['Choose the best answer for each question.'];
    }

    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert([testData])
      .select()
      .single();

    if (testError) {
      console.error('Error creating test:', testError);
      return res.status(500).json({ error: testError.message });
    }

    console.log('Test created with ID:', test.id);

    // Prepare questions data (store correct answers separately)
    const questionsToSave = [];
    const questionMetadata = []; // Track questions with their correct answers
    
    if (generatedData.parts && Array.isArray(generatedData.parts)) {
      // Questions organized by parts
      for (const part of generatedData.parts) {
        for (const q of part.questions) {
          const convertedType = convertQuestionType(q.type);
          // For Matching Type, use empty string since instruction is in directions
          const questionText = convertedType === 'Matching Type' ? '' : q.question;
          questionsToSave.push({
            test_id: test.id,
            part: part.partNumber,
            text: questionText,
            type: convertedType,
            image_url: null
          });
          questionMetadata.push({
            correctAnswer: q.correctAnswer,
            type: convertedType,
            options: q.options || [],
            items: q.items || []
          });
        }
      }
    } else if (generatedData.questions && Array.isArray(generatedData.questions)) {
      // Questions without parts
      for (const q of generatedData.questions) {
        const convertedType = convertQuestionType(q.type);
        // For Matching Type, use empty string since instruction is in directions
        const questionText = convertedType === 'Matching Type' ? '' : q.question;
        questionsToSave.push({
          test_id: test.id,
          part: 1,
          text: questionText,
          type: convertedType,
          image_url: null
        });
        questionMetadata.push({
          correctAnswer: q.correctAnswer,
          type: convertedType,
          options: q.options || [],
          items: q.items || []
        });
      }
    }

    if (questionsToSave.length === 0) {
      // Delete the test if no questions were generated
      await supabase.from('tests').delete().eq('id', test.id);
      return res.status(500).json({ error: 'No questions were generated' });
    }

    const { data: savedQuestions, error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToSave)
      .select();

    if (questionsError) {
      console.error('Error saving questions:', questionsError);
      // Delete the test if questions failed to save
      await supabase.from('tests').delete().eq('id', test.id);
      return res.status(500).json({ error: questionsError.message });
    }

    console.log(`Saved ${savedQuestions.length} questions`);

    // Now create answer_choices for all questions and link correct answers
    const answerChoices = [];
    const correctAnswers = [];

    for (let i = 0; i < savedQuestions.length; i++) {
      const question = savedQuestions[i];
      const metadata = questionMetadata[i];
      
      if (metadata.type === 'Multiple Choice' && metadata.options.length > 0) {
        // For Multiple Choice: Create choices for each option
        metadata.options.forEach((option, optIndex) => {
          answerChoices.push({
            question_id: question.id,
            text: option,
            image_url: null
          });
        });
      } else if (metadata.type === 'Matching Type' && metadata.items && metadata.items.length > 0) {
        // For Matching Type: Store both Column A (question) and Column B (answer) in text field
        // Format: JSON string with both values so frontend can parse it
        metadata.items.forEach((item, index) => {
          // Strip any leading numbers/letters from AI responses (e.g., "1. Text" -> "Text")
          const cleanQuestion = item.question.replace(/^[0-9]+\.\s*/, '').trim();
          const cleanAnswer = item.answer.replace(/^[a-z]\.\s*/i, '').trim();
          
          // Store as JSON object string that can be parsed
          const matchingData = {
            text: cleanQuestion,
            matchAnswer: cleanAnswer
          };
          answerChoices.push({
            question_id: question.id,
            text: JSON.stringify(matchingData),
            image_url: null
          });
        });
      } else {
        // For other question types: Create a single answer choice with the correct answer
        answerChoices.push({
          question_id: question.id,
          text: metadata.correctAnswer,
          image_url: null
        });
      }
    }

    if (answerChoices.length > 0) {
      const { data: savedAnswerChoices, error: choicesError } = await supabase
        .from('answer_choices')
        .insert(answerChoices)
        .select();

      if (choicesError) {
        console.error('Error saving answer choices:', choicesError);
        await supabase.from('tests').delete().eq('id', test.id);
        return res.status(500).json({ error: choicesError.message });
      }

      console.log(`Saved ${savedAnswerChoices.length} answer choices`);

      // Now link each question to its correct answer in the answers table
      for (let i = 0; i < savedQuestions.length; i++) {
        const question = savedQuestions[i];
        const metadata = questionMetadata[i];
        
        // Find the correct answer_choice_id
        let correctAnswerChoiceId;
        
        if (metadata.type === 'Multiple Choice') {
          // Find the answer choice that matches the correct answer text
          const correctChoice = savedAnswerChoices.find(
            choice => choice.question_id === question.id && choice.text === metadata.correctAnswer
          );
          correctAnswerChoiceId = correctChoice?.id;
        } else {
          // For non-MC questions, the first (and only) choice is the correct answer
          const choice = savedAnswerChoices.find(choice => choice.question_id === question.id);
          correctAnswerChoiceId = choice?.id;
        }

        if (correctAnswerChoiceId) {
          correctAnswers.push({
            question_id: question.id,
            answer_choices_id: correctAnswerChoiceId
          });
        }
      }

      // Insert into answers table
      if (correctAnswers.length > 0) {
        const { error: answersError } = await supabase
          .from('answers')
          .insert(correctAnswers);

        if (answersError) {
          console.error('Error saving correct answers:', answersError);
          // Continue anyway, questions and choices are saved
        } else {
          console.log(`Saved ${correctAnswers.length} correct answer links`);
        }
      }
    }

    // Fetch all saved answer choices and answers for the questions
    const questionIds = savedQuestions.map(q => q.id);
    const { data: fetchedChoices } = await supabase
      .from('answer_choices')
      .select('*')
      .in('question_id', questionIds);

    const { data: fetchedAnswers } = await supabase
      .from('answers')
      .select('question_id, answer_choices_id')
      .in('question_id', questionIds);

    // Build questions array with choices and correct answers
    // Match the format expected by QuestionList component
    const questionsWithOptions = savedQuestions.map((question, index) => {
      const metadata = questionMetadata[index];
      const questionData = {
        id: question.id,
        question: question.text, // QuestionList expects 'question' not 'text'
        type: question.type,
        part: question.part,
        imageUrl: question.image_url || null // Include image URL in camelCase
      };

      // Add choices for the question
      const choices = fetchedChoices?.filter(choice => choice.question_id === question.id) || [];
      const correctAnswerLink = fetchedAnswers?.find(ans => ans.question_id === question.id);

      if (metadata.type === 'Multiple Choice') {
        questionData.options = choices.map(choice => ({
          id: choice.id,
          text: choice.text,
          imageUrl: choice.image_url || null, // Include image URL in camelCase
          isCorrect: choice.id === correctAnswerLink?.answer_choices_id // camelCase for frontend
        }));
      } else {
        // For non-MC questions, include the correct answer
        const correctChoice = choices[0];
        questionData.correctAnswer = correctChoice?.text || metadata.correctAnswer;
        // Also include options array for non-MC (True/False, Identification, etc.)
        questionData.options = choices.map(choice => ({
          id: choice.id,
          text: choice.text,
          imageUrl: choice.image_url || null,
          isCorrect: choice.id === correctAnswerLink?.answer_choices_id
        }));
      }

      return questionData;
    });

    // Return the created test with full question details
    res.status(201).json({
      success: true,
      message: 'Test generated successfully',
      test: {
        id: test.id,
        title: test.title,
        user_id: test.user_id,
        number_of_parts: test.number_of_parts,
        part_descriptions: test.part_descriptions,
        directions: test.directions,
        created_at: test.created_at,
        questionCount: savedQuestions.length
      },
      questions: questionsWithOptions
    });

  } catch (error) {
    console.error('Error in generateTestWithAI:', error);
    res.status(500).json({ error: 'Failed to generate test with AI' });
  }
}

/**
 * Generate test with AI using TOS template
 */
async function generateTestWithTOS(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { testTitle, tosTemplateId, difficulty } = req.body;
    const file = req.file;

    console.log('Generating test with TOS template for user:', userId);
    console.log('Parameters:', { testTitle, tosTemplateId, difficulty, hasFile: !!file });

    // Validate required fields
    if (!testTitle || !testTitle.trim()) {
      return res.status(400).json({ error: 'Test title is required' });
    }

    if (!tosTemplateId) {
      return res.status(400).json({ error: 'TOS template ID is required' });
    }

    // Fetch TOS template
    const { data: tosTemplate, error: tosError } = await supabase
      .from('tos_templates')
      .select(`
        *,
        tos_template_topics (*)
      `)
      .eq('id', tosTemplateId)
      .eq('user_id', userId)
      .single();

    if (tosError || !tosTemplate) {
      return res.status(404).json({ error: 'TOS template not found or access denied' });
    }

    // Extract text from file if provided
    let topicContent = '';
    if (file) {
      const { extractTextFromFile } = await import('../utils/fileParser.js');
      const extractedText = await extractTextFromFile(file);
      topicContent = extractedText || '';
    }
    
    // Fallback to TOS topics if no file provided
    if (!topicContent || !topicContent.trim()) {
      topicContent = `Topics covered: ${tosTemplate.tos_template_topics.map(t => t.topic_name).join(', ')}`;
    }

    // Generate questions using TOS with difficulty
    const difficultyLevel = difficulty || 'Medium';
    const generationResult = await generateQuestionsFromTOS(tosTemplate, topicContent, testTitle.trim(), difficultyLevel);

    if (!generationResult.success) {
      return res.status(500).json({ error: generationResult.error });
    }

    const generatedData = generationResult.data;

    // Create the test in database
    const testData = {
      user_id: userId,
      title: testTitle.trim(),
      description: `Generated using TOS: ${tosTemplate.template_name}`,
      number_of_parts: 0,
      part_descriptions: [],
      directions: []
    };

    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert(testData)
      .select()
      .single();

    if (testError) {
      console.error('Error creating test:', testError);
      return res.status(500).json({ error: testError.message });
    }

    console.log('Test created with ID:', test.id);

    // Prepare questions data
    const questionsToSave = [];
    const questionMetadata = [];

    generatedData.questions.forEach(q => {
      const convertedType = convertQuestionType(q.type);
      const questionText = q.question;
      
      questionsToSave.push({
        test_id: test.id,
        part: null,
        text: questionText,
        type: convertedType,
        image_url: null
      });
      
      questionMetadata.push({
        questionText: q.question,
        correctAnswer: q.correctAnswer,
        options: q.options || [],
        type: q.type,
        cognitiveLevel: q.cognitiveLevel,
        topic: q.topic
      });
    });

    if (questionsToSave.length === 0) {
      await supabase.from('tests').delete().eq('id', test.id);
      return res.status(500).json({ error: 'No questions were generated' });
    }

    const { data: savedQuestions, error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToSave)
      .select();

    if (questionsError) {
      console.error('Error saving questions:', questionsError);
      await supabase.from('tests').delete().eq('id', test.id);
      return res.status(500).json({ error: questionsError.message });
    }

    console.log(`Saved ${savedQuestions.length} questions`);

    // Create answer choices and correct answers
    const answerChoices = [];
    const correctAnswers = [];

    for (let i = 0; i < savedQuestions.length; i++) {
      const question = savedQuestions[i];
      const metadata = questionMetadata[i];

      if (metadata.type === 'Multiple Choice' && metadata.options && metadata.options.length > 0) {
        // For multiple choice questions with options array
        metadata.options.forEach(optionText => {
          const cleanText = typeof optionText === 'string' 
            ? optionText.replace(/^[0-9]+\.\s*/, '').trim() 
            : (optionText.text || optionText);
          
          answerChoices.push({
            question_id: question.id,
            text: cleanText,
            image_url: null
          });
        });
      } else {
        // For non-multiple choice question types (Essay, Problem Solving, etc.)
        // Save only the correctAnswer as text
        answerChoices.push({
          question_id: question.id,
          text: metadata.correctAnswer,
          image_url: null
        });
      }
    }

    const { data: savedChoices, error: choicesError } = await supabase
      .from('answer_choices')
      .insert(answerChoices)
      .select();

    if (choicesError) {
      console.error('Error saving answer choices:', choicesError);
      return res.status(500).json({ error: choicesError.message });
    }

    // Map correct answers
    let choiceIndex = 0;
    for (let i = 0; i < savedQuestions.length; i++) {
      const question = savedQuestions[i];
      const metadata = questionMetadata[i];
      const choicesForQuestion = [];

      if (metadata.options && metadata.options.length > 0) {
        for (let j = 0; j < metadata.options.length; j++) {
          choicesForQuestion.push(savedChoices[choiceIndex++]);
        }
        
        const correctChoice = choicesForQuestion.find(choice => {
          const normalizedChoice = choice.text.toLowerCase().trim();
          const normalizedAnswer = metadata.correctAnswer.toLowerCase().trim();
          return normalizedChoice === normalizedAnswer || 
                 normalizedChoice.includes(normalizedAnswer) ||
                 normalizedAnswer.includes(normalizedChoice);
        });

        if (correctChoice) {
          correctAnswers.push({
            question_id: question.id,
            answer_choices_id: correctChoice.id
          });
        }
      } else {
        const correctChoice = savedChoices[choiceIndex++];
        correctAnswers.push({
          question_id: question.id,
          answer_choices_id: correctChoice.id
        });
      }
    }

    if (correctAnswers.length > 0) {
      const { error: answersError } = await supabase
        .from('answers')
        .insert(correctAnswers);

      if (answersError) {
        console.error('Error saving correct answers:', answersError);
      }
    }

    // Link TOS template to test
    await supabase
      .from('test_tos_templates')
      .insert({
        test_id: test.id,
        tos_template_id: tosTemplateId
      });

    // Return response
    res.status(201).json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        tosTemplate: tosTemplate.template_name,
        created_at: test.created_at,
        questionCount: savedQuestions.length
      },
      questions: savedQuestions.length
    });

  } catch (error) {
    console.error('Error in generateTestWithTOS:', error);
    res.status(500).json({ error: 'Failed to generate test with TOS' });
  }
}

export { generateTestWithAI, generateTestWithTOS };
