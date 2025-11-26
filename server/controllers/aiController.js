import { supabase } from '../config/supabase.js';
import { generateQuestions } from '../services/openaiService.js';

/**
 * Generate test with AI and save to database
 */
async function generateTestWithAI(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { testTitle, topic, numberOfQuestions, numberOfParts, parts, questionTypes } = req.body;
    const file = req.file; // From multer

    console.log('Generating test with AI for user:', userId);
    console.log('Parameters:', { testTitle, numberOfQuestions, numberOfParts, parts: parts?.length });

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
      parts: parts || [],
      questionTypes: questionTypes || [],
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
    if (numberOfParts > 0 && parts && parts.length > 0) {
      testData.part_descriptions = parts.map((part, index) => 
        `Part ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][index] || (index + 1)}`
      );
      testData.directions = parts.map(() => 
        'Choose the best answer for each question.'
      );
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

    // Save questions to database
    const questions = [];
    
    if (generatedData.parts && Array.isArray(generatedData.parts)) {
      // Questions organized by parts
      for (const part of generatedData.parts) {
        for (const q of part.questions) {
          questions.push({
            test_id: test.id,
            part: part.partNumber,
            question: q.question,
            type: q.type,
            correct_answer: q.correctAnswer
          });
        }
      }
    } else if (generatedData.questions && Array.isArray(generatedData.questions)) {
      // Questions without parts
      for (const q of generatedData.questions) {
        questions.push({
          test_id: test.id,
          part: 1,
          question: q.question,
          type: q.type,
          correct_answer: q.correctAnswer
        });
      }
    }

    if (questions.length === 0) {
      // Delete the test if no questions were generated
      await supabase.from('tests').delete().eq('id', test.id);
      return res.status(500).json({ error: 'No questions were generated' });
    }

    const { data: savedQuestions, error: questionsError } = await supabase
      .from('questions')
      .insert(questions)
      .select();

    if (questionsError) {
      console.error('Error saving questions:', questionsError);
      // Delete the test if questions failed to save
      await supabase.from('tests').delete().eq('id', test.id);
      return res.status(500).json({ error: questionsError.message });
    }

    console.log(`Saved ${savedQuestions.length} questions`);

    // Save answer options for multiple choice questions
    const answerOptions = [];
    let questionIndex = 0;

    if (generatedData.parts && Array.isArray(generatedData.parts)) {
      for (const part of generatedData.parts) {
        for (const q of part.questions) {
          if (q.type === 'multiple_choice' && q.options && Array.isArray(q.options)) {
            const questionId = savedQuestions[questionIndex].id;
            q.options.forEach((option, optIndex) => {
              answerOptions.push({
                question_id: questionId,
                option_text: option,
                option_letter: String.fromCharCode(65 + optIndex), // A, B, C, D
                is_correct: option === q.correctAnswer
              });
            });
          }
          questionIndex++;
        }
      }
    } else if (generatedData.questions && Array.isArray(generatedData.questions)) {
      for (const q of generatedData.questions) {
        if (q.type === 'multiple_choice' && q.options && Array.isArray(q.options)) {
          const questionId = savedQuestions[questionIndex].id;
          q.options.forEach((option, optIndex) => {
            answerOptions.push({
              question_id: questionId,
              option_text: option,
              option_letter: String.fromCharCode(65 + optIndex), // A, B, C, D
              is_correct: option === q.correctAnswer
            });
          });
        }
        questionIndex++;
      }
    }

    if (answerOptions.length > 0) {
      const { error: optionsError } = await supabase
        .from('answer_options')
        .insert(answerOptions);

      if (optionsError) {
        console.error('Error saving answer options:', optionsError);
        // Continue anyway, questions are saved
      } else {
        console.log(`Saved ${answerOptions.length} answer options`);
      }
    }

    // Fetch all saved answer options for the questions
    const questionIds = savedQuestions.map(q => q.id);
    const { data: fetchedOptions } = await supabase
      .from('answer_options')
      .select('*')
      .in('question_id', questionIds);

    // Build questions array with options
    const questionsWithOptions = savedQuestions.map(question => {
      const questionData = {
        id: question.id,
        question: question.question,
        type: question.type,
        part: question.part,
        correct_answer: question.correct_answer
      };

      // Add options for multiple choice questions
      if (question.type === 'multiple_choice' && fetchedOptions) {
        questionData.options = fetchedOptions
          .filter(opt => opt.question_id === question.id)
          .sort((a, b) => a.option_letter.localeCompare(b.option_letter))
          .map(opt => ({
            option_letter: opt.option_letter,
            option_text: opt.option_text,
            is_correct: opt.is_correct
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

export { generateTestWithAI };
