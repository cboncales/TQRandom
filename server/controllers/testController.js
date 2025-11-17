import { supabase } from '../config/supabase.js';

/**
 * Create a new test
 */
async function createTest(req, res) {
  try {
    const { title, description, header_logo_url } = req.body;
    
    if (!req.user || !req.user.id) {
      console.error('createTest: req.user is undefined');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    console.log('createTest: Creating test for user:', userId);

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabase
      .from('tests')
      .insert([
        {
          user_id: userId,
          title: title.trim(),
          description: description?.trim() || null,
          header_logo_url: header_logo_url || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating test:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error('Error in createTest:', error);
    res.status(500).json({ error: 'Failed to create test' });
  }
}

/**
 * Get all tests for the authenticated user
 */
async function getUserTests(req, res) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tests:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error in getUserTests:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
}

/**
 * Get a single test by ID
 */
async function getTest(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching test:', error);
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error in getTest:', error);
    res.status(500).json({ error: 'Failed to fetch test' });
  }
}

/**
 * Update a test
 */
async function updateTest(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Only allow updating specific fields
    const allowedUpdates = {};
    if (updates.title !== undefined) allowedUpdates.title = updates.title.trim();
    if (updates.description !== undefined) allowedUpdates.description = updates.description?.trim() || null;
    if (updates.header_logo_url !== undefined) allowedUpdates.header_logo_url = updates.header_logo_url || null;

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const { data, error } = await supabase
      .from('tests')
      .update(allowedUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating test:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error in updateTest:', error);
    res.status(500).json({ error: 'Failed to update test' });
  }
}

/**
 * Delete a test and all related data (cascading delete)
 */
async function deleteTest(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user owns the test
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (testError || !testData) {
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    // Step 1: Get all test versions for this test
    const { data: versions } = await supabase
      .from('test_versions')
      .select('id')
      .eq('test_id', id);

    if (versions && versions.length > 0) {
      const versionIds = versions.map(v => v.id);

      // Step 1a: Get all version questions
      const { data: versionQuestions } = await supabase
        .from('test_version_questions')
        .select('id')
        .in('test_version_id', versionIds);

      if (versionQuestions && versionQuestions.length > 0) {
        const versionQuestionIds = versionQuestions.map(vq => vq.id);

        // Delete test_versions_answer_choices
        await supabase
          .from('test_versions_answer_choices')
          .delete()
          .in('test_version_question_id', versionQuestionIds);
      }

      // Step 1b: Delete test_version_questions
      await supabase
        .from('test_version_questions')
        .delete()
        .in('test_version_id', versionIds);

      // Step 1c: Delete test_versions
      await supabase
        .from('test_versions')
        .delete()
        .in('id', versionIds);
    }

    // Step 2: Get all questions for this test
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('test_id', id);

    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id);

      // Step 2a: Delete correct answers
      await supabase
        .from('answers')
        .delete()
        .in('question_id', questionIds);

      // Step 2b: Delete answer choices
      await supabase
        .from('answer_choices')
        .delete()
        .in('question_id', questionIds);

      // Step 2c: Delete questions
      await supabase
        .from('questions')
        .delete()
        .in('id', questionIds);
    }

    // Step 3: Finally, delete the test
    const { error: deleteError } = await supabase
      .from('tests')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting test:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTest:', error);
    res.status(500).json({ error: 'Failed to delete test' });
  }
}

export {
  createTest,
  getUserTests,
  getTest,
  updateTest,
  deleteTest,
};

