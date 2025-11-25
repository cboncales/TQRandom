import { supabase } from '../config/supabase.js';

/**
 * Create a new question with answer choices
 */
async function createQuestion(req, res) {
  try {
    const { testId, questionText, questionImageUrl, answerChoices, questionType, questionPart } = req.body;
    const userId = req.user.id;

    // Debug: Log received data
    console.log('Creating question with image URL:', questionImageUrl);
    console.log('Answer choices with images:', answerChoices?.map(c => ({ hasImage: !!c.imageUrl })));

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

    // Create the question (with optional image URL, type, and part)
    // Part should be stored as integer (1, 2, 3, etc.) or null
    const partNumber = questionPart ? parseInt(questionPart, 10) : null;
    
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert([
        {
          test_id: testId,
          text: questionText.trim(),
          image_url: questionImageUrl || null,
          type: questionType || 'Multiple Choice',
          part: partNumber,
        },
      ])
      .select()
      .single();

    if (questionError) {
      console.error('Error creating question:', questionError);
      return res.status(500).json({ error: questionError.message });
    }

    // Create answer choices if provided (with optional image URLs)
    if (answerChoices && answerChoices.length > 0) {
      const choicesData = answerChoices.map((choice) => ({
        question_id: questionData.id,
        text: choice.text.trim(),
        image_url: choice.imageUrl || null,
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
    const { questionText, answerChoices, questionImageUrl, questionType, questionPart } = req.body;
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

    // Update the question text, image URL, type, and part
    const updateData = { text: questionText.trim() };
    if (questionImageUrl !== undefined) {
      updateData.image_url = questionImageUrl;
    }
    if (questionType !== undefined) {
      updateData.type = questionType;
    }
    if (questionPart !== undefined) {
      // Convert part to integer or null
      updateData.part = questionPart ? parseInt(questionPart, 10) : null;
    }
    
    const { error: updateError } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating question:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // Get existing answer choices for this question
    const { data: existingChoices, error: getChoicesError } = await supabase
      .from('answer_choices')
      .select('id, text, image_url')
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
          // Update existing choice if text or image URL is different
          const choiceUpdateData = {};
          if (existingChoice.text.trim() !== newChoice.text.trim()) {
            choiceUpdateData.text = newChoice.text.trim();
          }
          if (newChoice.imageUrl !== undefined && existingChoice.image_url !== newChoice.imageUrl) {
            choiceUpdateData.image_url = newChoice.imageUrl;
          }
          
          // Only update if there are changes
          if (Object.keys(choiceUpdateData).length > 0) {
            await supabase
              .from('answer_choices')
              .update(choiceUpdateData)
              .eq('id', existingChoice.id);
          }
        } else if (!existingChoice && newChoice) {
          // Insert new choice with image URL
          await supabase.from('answer_choices').insert([
            {
              question_id: id,
              text: newChoice.text.trim(),
              image_url: newChoice.imageUrl || null,
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
 * Delete a question and all related data (cascading delete)
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

    // Step 1: Get test_version_ids that use this question
    const { data: versionQuestions } = await supabase
      .from('test_version_questions')
      .select('id, test_version_id')
      .eq('question_id', id);

    const affectedVersionIds = new Set();
    
    if (versionQuestions && versionQuestions.length > 0) {
      const versionQuestionIds = versionQuestions.map(vq => vq.id);
      
      // Track which versions are affected
      versionQuestions.forEach(vq => affectedVersionIds.add(vq.test_version_id));

      // Delete test_versions_answer_choices
      await supabase
        .from('test_versions_answer_choices')
        .delete()
        .in('test_version_question_id', versionQuestionIds);

      // Delete test_version_questions
      await supabase
        .from('test_version_questions')
        .delete()
        .in('id', versionQuestionIds);
    }

    // Step 2: Delete correct answers (answers table)
    await supabase
      .from('answers')
      .delete()
      .eq('question_id', id);

    // Step 3: Delete answer choices
    await supabase
      .from('answer_choices')
      .delete()
      .eq('question_id', id);

    // Step 4: Delete the question
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({ error: error.message });
    }

    // Step 5: Check if any affected versions are now empty and delete them
    if (affectedVersionIds.size > 0) {
      for (const versionId of affectedVersionIds) {
        // Check if this version still has any questions
        const { data: remainingQuestions, error: checkError } = await supabase
          .from('test_version_questions')
          .select('id')
          .eq('test_version_id', versionId)
          .limit(1);

        // If no questions remain, delete the version
        if (!checkError && (!remainingQuestions || remainingQuestions.length === 0)) {
          console.log(`Deleting empty test version ${versionId}`);
          await supabase
            .from('test_versions')
            .delete()
            .eq('id', versionId);
        }
      }
    }

    res.json({ success: true, message: 'Question deleted successfully' });
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

