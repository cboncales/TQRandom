import { supabase } from '../config/supabase.js';

/**
 * Store or update the correct answer for a question
 */
async function storeCorrectAnswer(req, res) {
  try {
    const { questionId, answerChoiceId } = req.body;
    const userId = req.user.id;

    if (!questionId || !answerChoiceId) {
      return res.status(400).json({ error: 'Question ID and answer choice ID are required' });
    }

    // First verify the question exists
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('id, test_id')
      .eq('id', questionId)
      .single();

    if (questionError || !questionData) {
      console.error('Question verification error:', questionError);
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify user owns the test
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('id, user_id')
      .eq('id', questionData.test_id)
      .single();

    if (testError || !testData || testData.user_id !== userId) {
      console.error('Test verification error:', testError);
      return res.status(403).json({ error: 'Test not found or access denied' });
    }

    // Verify the answer choice belongs to this question
    const { data: choiceData, error: choiceError } = await supabase
      .from('answer_choices')
      .select('id')
      .eq('id', answerChoiceId)
      .eq('question_id', questionId)
      .single();

    if (choiceError || !choiceData) {
      console.error('Answer choice verification error:', choiceError);
      return res.status(404).json({
        error: 'Answer choice not found or doesn\'t belong to this question',
      });
    }

    // Check if correct answer already exists for this question
    const { data: existingAnswers, error: checkError } = await supabase
      .from('answers')
      .select('id')
      .eq('question_id', questionId);

    if (checkError) {
      console.error('Error checking for existing answer:', checkError);
    }

    let result;
    if (existingAnswers && existingAnswers.length > 0) {
      // Update existing correct answer
      const existingAnswer = existingAnswers[0];
      console.log('Updating existing answer:', existingAnswer.id);
      
      const { data, error } = await supabase
        .from('answers')
        .update({ answer_choices_id: answerChoiceId })
        .eq('id', existingAnswer.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new correct answer record
      console.log('Creating new answer record');
      
      const { data, error } = await supabase
        .from('answers')
        .insert([
          {
            question_id: questionId,
            answer_choices_id: answerChoiceId,
          },
        ])
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error('Answer storage error:', result.error);
      return res.status(500).json({ error: result.error.message });
    }

    console.log('Correct answer stored successfully:', result.data);
    res.json({ data: result.data });
  } catch (error) {
    console.error('Unexpected error in storeCorrectAnswer:', error);
    res.status(500).json({ error: 'Failed to store correct answer' });
  }
}

/**
 * Get correct answers for a test
 */
async function getCorrectAnswersForTest(req, res) {
  try {
    const { testId } = req.params;
    const userId = req.user.id;

    // Verify user owns the test
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (testError || !testData) {
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    // First get all questions for this test
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, text')
      .eq('test_id', testId);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return res.status(500).json({ error: questionsError.message });
    }

    if (!questions || questions.length === 0) {
      // No questions yet, return empty array
      return res.json({ data: [] });
    }

    const questionIds = questions.map(q => q.id);

    // Get answers for these questions
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('id, question_id, answer_choices_id, created_at')
      .in('question_id', questionIds)
      .order('question_id', { ascending: true });

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return res.status(500).json({ error: answersError.message });
    }

    // If no answers yet, return empty array
    if (!answers || answers.length === 0) {
      return res.json({ data: [] });
    }

    // Get answer choice texts
    const answerChoiceIds = answers.map(a => a.answer_choices_id);
    const { data: answerChoices, error: choicesError } = await supabase
      .from('answer_choices')
      .select('id, text')
      .in('id', answerChoiceIds);

    if (choicesError) {
      console.error('Error fetching answer choices:', choicesError);
      return res.status(500).json({ error: choicesError.message });
    }

    // Combine the data
    const result = answers.map(answer => {
      const question = questions.find(q => q.id === answer.question_id);
      const choice = answerChoices?.find(c => c.id === answer.answer_choices_id);
      
      return {
        id: answer.id,
        question_id: answer.question_id,
        answer_choices_id: answer.answer_choices_id,
        created_at: answer.created_at,
        questions: question ? { test_id: testId, text: question.text } : null,
        answer_choices_data: choice ? { text: choice.text } : null,
      };
    });

    res.json({ data: result });
  } catch (error) {
    console.error('Error in getCorrectAnswersForTest:', error);
    res.status(500).json({ error: 'Failed to fetch correct answers' });
  }
}

export {
  storeCorrectAnswer,
  getCorrectAnswersForTest,
};

