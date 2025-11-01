import { supabase } from '../config/supabase.js';

/**
 * Create a new question with answer choices
 */
async function createQuestion(req, res) {
  try {
    const { testId, questionText, answerChoices } = req.body;
    const userId = req.user.id;

    if (!testId || !questionText || !questionText.trim()) {
      return res.status(400).json({ error: 'Test ID and question text are required' });
    }

    // Verify the user owns the test
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (testError || !testData) {
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    // Create the question
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert([
        {
          test_id: testId,
          text: questionText.trim(),
        },
      ])
      .select()
      .single();

    if (questionError) {
      console.error('Error creating question:', questionError);
      return res.status(500).json({ error: questionError.message });
    }

    // Create answer choices if provided
    if (answerChoices && answerChoices.length > 0) {
      const choicesData = answerChoices.map((choice) => ({
        question_id: questionData.id,
        text: choice.text.trim(),
      }));

      const { error: choicesError } = await supabase
        .from('answer_choices')
        .insert(choicesData);

      if (choicesError) {
        // If answer choices fail, clean up the question
        await supabase.from('questions').delete().eq('id', questionData.id);
        console.error('Error creating answer choices:', choicesError);
        return res.status(500).json({ error: choicesError.message });
      }
    }

    res.status(201).json({ data: questionData });
  } catch (error) {
    console.error('Error in createQuestion:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
}

/**
 * Get all questions for a test with their answer choices
 */
async function getTestQuestions(req, res) {
  try {
    const { testId } = req.params;
    const userId = req.user.id;

    // Verify the user owns the test
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (testError || !testData) {
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    // Get questions
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('test_id', testId)
      .order('id', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return res.status(500).json({ error: questionsError.message });
    }

    // Get answer choices for all questions
    const questionIds = questionsData.map((q) => q.id);
    let answerChoicesData = [];

    if (questionIds.length > 0) {
      const { data: choicesData, error: choicesError } = await supabase
        .from('answer_choices')
        .select('*')
        .in('question_id', questionIds)
        .order('id', { ascending: true });

      if (choicesError) {
        console.error('Error fetching answer choices:', choicesError);
        return res.status(500).json({ error: choicesError.message });
      }

      answerChoicesData = choicesData || [];
    }

    // Combine questions with their answer choices
    const questionsWithChoices = questionsData.map((question) => ({
      ...question,
      answer_choices: answerChoicesData.filter(
        (choice) => choice.question_id === question.id
      ),
    }));

    res.json({ data: questionsWithChoices });
  } catch (error) {
    console.error('Error in getTestQuestions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
}

/**
 * Update a question and its answer choices
 */
async function updateQuestion(req, res) {
  try {
    const { id } = req.params;
    const { questionText, answerChoices } = req.body;
    const userId = req.user.id;

    if (!questionText || !questionText.trim()) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    // Verify user owns the test that contains this question
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('test_id, tests!inner(user_id)')
      .eq('id', id)
      .single();

    if (
      questionError ||
      !questionData ||
      questionData.tests.user_id !== userId
    ) {
      return res.status(404).json({ error: 'Question not found or access denied' });
    }

    // Update the question text
    const { error: updateError } = await supabase
      .from('questions')
      .update({ text: questionText.trim() })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating question:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // Get existing answer choices for this question
    const { data: existingChoices, error: getChoicesError } = await supabase
      .from('answer_choices')
      .select('id, text')
      .eq('question_id', id)
      .order('id', { ascending: true });

    if (getChoicesError) {
      console.error('Error fetching existing choices:', getChoicesError);
      return res.status(500).json({ error: getChoicesError.message });
    }

    // Smart update: Update existing choices and add/remove as needed
    if (answerChoices && answerChoices.length > 0) {
      for (
        let i = 0;
        i < Math.max(existingChoices.length, answerChoices.length);
        i++
      ) {
        const existingChoice = existingChoices[i];
        const newChoice = answerChoices[i];

        if (existingChoice && newChoice) {
          // Update existing choice if text is different
          if (existingChoice.text.trim() !== newChoice.text.trim()) {
            await supabase
              .from('answer_choices')
              .update({ text: newChoice.text.trim() })
              .eq('id', existingChoice.id);
          }
        } else if (!existingChoice && newChoice) {
          // Insert new choice
          await supabase.from('answer_choices').insert([
            {
              question_id: id,
              text: newChoice.text.trim(),
            },
          ]);
        } else if (existingChoice && !newChoice) {
          // Delete existing choice that's no longer needed
          // First check if this choice is the correct answer and delete the answer record if so
          await supabase
            .from('answers')
            .delete()
            .eq('question_id', id)
            .eq('answer_choices_id', existingChoice.id);

          // Then delete the choice
          await supabase
            .from('answer_choices')
            .delete()
            .eq('id', existingChoice.id);
        }
      }
    } else {
      // No answer choices provided, delete all existing ones
      // First delete any answer records for this question
      await supabase.from('answers').delete().eq('question_id', id);

      // Then delete all choices
      await supabase
        .from('answer_choices')
        .delete()
        .eq('question_id', id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in updateQuestion:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
}

/**
 * Delete a question and its answer choices
 */
async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user owns the test that contains this question
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('test_id, tests!inner(user_id)')
      .eq('id', id)
      .single();

    if (
      questionError ||
      !questionData ||
      questionData.tests.user_id !== userId
    ) {
      return res.status(404).json({ error: 'Question not found or access denied' });
    }

    // Delete answer choices first (foreign key constraint)
    await supabase
      .from('answer_choices')
      .delete()
      .eq('question_id', id);

    // Delete the question
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in deleteQuestion:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
}

export {
  createQuestion,
  getTestQuestions,
  updateQuestion,
  deleteQuestion,
};

