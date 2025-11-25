import { supabase } from '../config/supabase.js';

/**
 * Create a new test
 */
async function createTest(req, res) {
  try {
    const { title, description, header_logo_url, number_of_parts, part_descriptions, directions, identification_image_urls } = req.body;
    
    if (!req.user || !req.user.id) {
      console.error('createTest: req.user is undefined');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    console.log('createTest: Creating test for user:', userId);

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate parts data if provided
    const numberOfParts = number_of_parts || 0;
    const partDescriptions = part_descriptions || [];
    const testDirections = directions || [];
    const identificationImageUrls = identification_image_urls || [];
    
    if (numberOfParts > 0 && partDescriptions.length !== numberOfParts) {
      return res.status(400).json({ 
        error: 'Number of part descriptions must match number of parts' 
      });
    }

    const { data, error } = await supabase
      .from('tests')
      .insert([
        {
          user_id: userId,
          title: title.trim(),
          description: description?.trim() || null,
          header_logo_url: header_logo_url || null,
          number_of_parts: numberOfParts,
          part_descriptions: partDescriptions,
          directions: testDirections,
          identification_image_urls: identificationImageUrls,
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
    if (updates.number_of_parts !== undefined) allowedUpdates.number_of_parts = updates.number_of_parts;
    if (updates.part_descriptions !== undefined) allowedUpdates.part_descriptions = updates.part_descriptions;
    if (updates.directions !== undefined) allowedUpdates.directions = updates.directions;
    if (updates.identification_image_urls !== undefined) allowedUpdates.identification_image_urls = updates.identification_image_urls;

    // Validate parts data if being updated
    if (allowedUpdates.number_of_parts !== undefined && allowedUpdates.part_descriptions !== undefined) {
      if (allowedUpdates.number_of_parts > 0 && allowedUpdates.part_descriptions.length !== allowedUpdates.number_of_parts) {
        return res.status(400).json({ 
          error: 'Number of part descriptions must match number of parts' 
        });
      }
    }

    // Validate directions data if being updated
    if (allowedUpdates.directions !== undefined) {
      if (!Array.isArray(allowedUpdates.directions)) {
        return res.status(400).json({ 
          error: 'Directions must be an array' 
        });
      }
      // If number_of_parts is being updated or already exists, validate directions length
      const numberOfParts = allowedUpdates.number_of_parts !== undefined 
        ? allowedUpdates.number_of_parts 
        : updates.number_of_parts; // Fallback to existing value if available
      
      if (numberOfParts !== undefined && numberOfParts > 0 && allowedUpdates.directions.length !== numberOfParts) {
        return res.status(400).json({ 
          error: 'Number of directions must match number of parts' 
        });
      }
    }

    // Validate identification_image_urls data if being updated
    if (allowedUpdates.identification_image_urls !== undefined) {
      if (!Array.isArray(allowedUpdates.identification_image_urls)) {
        return res.status(400).json({ 
          error: 'Identification image URLs must be an array' 
        });
      }
    }

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

    console.log(`Attempting to delete test ${id} for user ${userId}`);

    // Verify user owns the test
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (testError || !testData) {
      console.error('Test not found:', testError);
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    // Step 1: Get all test versions for this test
    const { data: versions, error: versionsError } = await supabase
      .from('test_versions')
      .select('id')
      .eq('test_id', id);

    if (versionsError) {
      console.error('Error fetching versions:', versionsError);
    }

    if (versions && versions.length > 0) {
      const versionIds = versions.map(v => v.id);
      console.log(`Deleting ${versions.length} versions`);

      // Step 1a: Delete version-related data by processing each version
      // This avoids issues with large IN clauses
      for (const versionId of versionIds) {
        // Get version questions for this version
        const { data: versionQuestions, error: vqError } = await supabase
          .from('test_version_questions')
          .select('id')
          .eq('test_version_id', versionId);

        if (vqError) {
          console.error(`Error fetching version questions for version ${versionId}:`, vqError);
          return res.status(500).json({ error: `Failed to fetch version questions: ${vqError.message}` });
        }

        if (versionQuestions && versionQuestions.length > 0) {
          const versionQuestionIds = versionQuestions.map(vq => vq.id);
          console.log(`Version ${versionId}: Deleting answer choices for ${versionQuestions.length} questions`);

          // Delete answer choices in batches of 100 to avoid limits
          const batchSize = 100;
          for (let i = 0; i < versionQuestionIds.length; i += batchSize) {
            const batch = versionQuestionIds.slice(i, i + batchSize);
            const { error: tvacError } = await supabase
              .from('test_versions_answer_choices')
              .delete()
              .in('test_version_question_id', batch);

            if (tvacError) {
              console.error(`Error deleting version answer choices batch ${i / batchSize + 1}:`, tvacError);
              return res.status(500).json({ error: `Failed to delete version answer choices: ${tvacError.message}` });
            }
          }
          console.log(`Version ${versionId}: Successfully deleted answer choices`);

          // Delete version questions for this version
          const { error: tvqError } = await supabase
            .from('test_version_questions')
            .delete()
            .eq('test_version_id', versionId);

          if (tvqError) {
            console.error(`Error deleting version questions for version ${versionId}:`, tvqError);
            return res.status(500).json({ error: `Failed to delete version questions: ${tvqError.message}` });
          }
          console.log(`Version ${versionId}: Successfully deleted version questions`);
        }
      }

      // Step 1b: Now delete all versions
      console.log(`Deleting ${versions.length} test versions`);
      const { error: tvError } = await supabase
        .from('test_versions')
        .delete()
        .in('id', versionIds);

      if (tvError) {
        console.error('Error deleting versions:', tvError);
        return res.status(500).json({ error: `Failed to delete versions: ${tvError.message}` });
      }
      console.log('Successfully deleted all test versions');
    }

    // Step 2: Get all questions for this test
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('test_id', id);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return res.status(500).json({ error: `Failed to fetch questions: ${questionsError.message}` });
    }

    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      console.log(`Deleting ${questions.length} questions and related data`);

      // Step 2a: Delete correct answers
      const { error: answersError } = await supabase
        .from('answers')
        .delete()
        .in('question_id', questionIds);

      if (answersError) {
        console.error('Error deleting answers:', answersError);
        return res.status(500).json({ error: `Failed to delete answers: ${answersError.message}` });
      }

      // Step 2b: Delete answer choices
      const { error: choicesError } = await supabase
        .from('answer_choices')
        .delete()
        .in('question_id', questionIds);

      if (choicesError) {
        console.error('Error deleting answer choices:', choicesError);
        return res.status(500).json({ error: `Failed to delete answer choices: ${choicesError.message}` });
      }

      // Step 2c: Delete questions
      const { error: deleteQuestionsError } = await supabase
        .from('questions')
        .delete()
        .in('id', questionIds);

      if (deleteQuestionsError) {
        console.error('Error deleting questions:', deleteQuestionsError);
        return res.status(500).json({ error: `Failed to delete questions: ${deleteQuestionsError.message}` });
      }
    }

    // Step 3: Finally, delete the test
    console.log(`Deleting test ${id}`);
    const { error: deleteError } = await supabase
      .from('tests')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting test:', deleteError);
      return res.status(500).json({ error: `Failed to delete test: ${deleteError.message}` });
    }

    console.log(`Successfully deleted test ${id}`);
    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTest:', error);
    res.status(500).json({ error: `Failed to delete test: ${error.message}` });
  }
}

export {
  createTest,
  getUserTests,
  getTest,
  updateTest,
  deleteTest,
};

