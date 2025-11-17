import { supabase } from '../config/supabase.js';
import { shuffleTestQuestions } from '../utils/fisherYatesShuffle.js';

/**
 * Generate randomized versions of a test
 * Uses Fisher-Yates algorithm to shuffle questions and answer choices
 */
export async function generateVersions(req, res) {
  try {
    const { testId, versionCount, questionsPerVersion } = req.body;
    const userId = req.user.id;

    // Validation
    if (!testId || !versionCount) {
      return res.status(400).json({ 
        error: 'Test ID and version count are required' 
      });
    }

    if (versionCount < 1 || versionCount > 100) {
      return res.status(400).json({ 
        error: 'Version count must be between 1 and 100' 
      });
    }

    // Verify user owns the test
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('id, title')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (testError || !testData) {
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    // Get all questions for this test with their answer choices
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        text,
        answer_choices (
          id,
          text
        )
      `)
      .eq('test_id', testId)
      .order('id', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return res.status(500).json({ error: questionsError.message });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ 
        error: 'Test has no questions. Please add questions before generating versions.' 
      });
    }

    // Determine questions per version
    const maxQuestions = questions.length;
    const actualQuestionsPerVersion = questionsPerVersion && questionsPerVersion <= maxQuestions 
      ? questionsPerVersion 
      : maxQuestions;

    // 🔧 FIX: Get the highest existing version number to continue from it
    const { data: existingVersions, error: existingError } = await supabase
      .from('test_versions')
      .select('version_number')
      .eq('test_id', testId)
      .order('version_number', { ascending: false })
      .limit(1);

    let startingVersionNumber = 1;
    if (!existingError && existingVersions && existingVersions.length > 0) {
      startingVersionNumber = existingVersions[0].version_number + 1;
      console.log(`📊 Continuing from version ${startingVersionNumber} (found ${existingVersions[0].version_number} existing versions)`);
    }

    // Generate versions
    const generatedVersions = [];
    
    for (let i = 0; i < versionCount; i++) {
      const currentVersionNumber = startingVersionNumber + i;
      console.log(`\n🔄 Generating version ${currentVersionNumber} (${i + 1}/${versionCount})...`);
      
      // Select subset of questions if needed
      let questionsToUse = questions;
      if (actualQuestionsPerVersion < maxQuestions) {
        // Randomly select questions
        const shuffledAll = [...questions].sort(() => Math.random() - 0.5);
        questionsToUse = shuffledAll.slice(0, actualQuestionsPerVersion);
      }

      // Shuffle questions and answer choices using Fisher-Yates
      const shuffledQuestions = shuffleTestQuestions(questionsToUse);

      // Create version record
      const { data: versionData, error: versionError } = await supabase
        .from('test_versions')
        .insert([{
          test_id: testId,
          version_number: currentVersionNumber
        }])
        .select()
        .single();

      if (versionError) {
        console.error('Error creating version:', versionError);
        continue;
      }

      // Insert shuffled questions with their order
      console.log(`  📝 Inserting ${shuffledQuestions.length} questions...`);
      const versionQuestions = shuffledQuestions.map((q, index) => ({
        test_version_id: versionData.id,
        question_id: q.id,
        question_order: index + 1
      }));

      const { data: insertedQuestions, error: questionsInsertError } = await supabase
        .from('test_version_questions')
        .insert(versionQuestions)
        .select();

      if (questionsInsertError) {
        console.error('❌ Error inserting version questions:', questionsInsertError);
        continue;
      }

      // Insert shuffled answer choices with their order
      const answerChoicesData = [];
      shuffledQuestions.forEach((question, qIndex) => {
        const versionQuestionId = insertedQuestions[qIndex].id;
        
        question.shuffled_answer_choices.forEach((choice, cIndex) => {
          answerChoicesData.push({
            test_version_question_id: versionQuestionId,
            answer_choices_id: choice.id,
            choice_order: cIndex + 1
          });
        });
      });

      if (answerChoicesData.length > 0) {
        console.log(`  🔀 Inserting ${answerChoicesData.length} answer choices...`);
        const { error: choicesInsertError } = await supabase
          .from('test_versions_answer_choices')
          .insert(answerChoicesData);

        if (choicesInsertError) {
          console.error('❌ Error inserting answer choices:', choicesInsertError);
        }
      }

      console.log(`  ✅ Version ${currentVersionNumber} generated successfully!`);
      
      generatedVersions.push({
        id: versionData.id,
        version_number: versionData.version_number,
        question_count: shuffledQuestions.length
      });
    }

    console.log(`\n🎉 Generation complete! Created ${generatedVersions.length} new version(s)`);

    res.status(201).json({
      success: true,
      message: `Generated ${generatedVersions.length} version(s)`,
      data: generatedVersions
    });

  } catch (error) {
    console.error('Error in generateVersions:', error);
    res.status(500).json({ error: 'Failed to generate versions' });
  }
}

/**
 * Get all versions for a test
 */
export async function getTestVersions(req, res) {
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

    // Get all versions with question count
    const { data: versions, error: versionsError } = await supabase
      .from('test_versions')
      .select(`
        id,
        version_number,
        created_at,
        test_version_questions (count)
      `)
      .eq('test_id', testId)
      .order('version_number', { ascending: true });

    if (versionsError) {
      console.error('Error fetching versions:', versionsError);
      return res.status(500).json({ error: versionsError.message });
    }

    // Format the response
    const formattedVersions = versions.map(v => ({
      id: v.id,
      version_number: v.version_number,
      created_at: v.created_at,
      question_count: v.test_version_questions?.[0]?.count || 0
    }));

    res.json({ data: formattedVersions });

  } catch (error) {
    console.error('Error in getTestVersions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
}

/**
 * Get a single version with all questions and answer choices
 */
export async function getVersion(req, res) {
  try {
    const { versionId } = req.params;
    const userId = req.user.id;

    // Get version with test ownership check
    const { data: version, error: versionError } = await supabase
      .from('test_versions')
      .select(`
        id,
        version_number,
        created_at,
        tests!inner (
          id,
          title,
          description,
          user_id
        )
      `)
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    if (version.tests.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get questions in order with their shuffled answer choices
    const { data: versionQuestions, error: questionsError } = await supabase
      .from('test_version_questions')
      .select(`
        id,
        question_order,
        questions (
          id,
          text,
          image_url
        ),
        test_versions_answer_choices (
          choice_order,
          answer_choices (
            id,
            text,
            image_url
          )
        )
      `)
      .eq('test_version_id', versionId)
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('Error fetching version questions:', questionsError);
      return res.status(500).json({ error: questionsError.message });
    }

    // Format the questions data
    const formattedQuestions = versionQuestions.map(vq => {
      // Sort answer choices by their order
      const sortedChoices = vq.test_versions_answer_choices
        .sort((a, b) => a.choice_order - b.choice_order)
        .map(ac => ({
          id: ac.answer_choices.id,
          text: ac.answer_choices.text,
          image_url: ac.answer_choices.image_url,
          order: ac.choice_order
        }));

      return {
        question_number: vq.question_order,
        question_id: vq.questions.id,
        question_text: vq.questions.text,
        question_image_url: vq.questions.image_url,
        answer_choices: sortedChoices
      };
    });

    res.json({
      data: {
        id: version.id,
        version_number: version.version_number,
        created_at: version.created_at,
        test_title: version.tests.title,
        test_description: version.tests.description,
        questions: formattedQuestions
      }
    });

  } catch (error) {
    console.error('Error in getVersion:', error);
    res.status(500).json({ error: 'Failed to fetch version details' });
  }
}

/**
 * Get answer key for a version
 * Returns question numbers mapped to correct answer letters (A, B, C, D, etc.)
 */
export async function getVersionAnswerKey(req, res) {
  try {
    const { versionId } = req.params;
    const userId = req.user.id;

    // Get version with test info and verify ownership
    const { data: version, error: versionError } = await supabase
      .from('test_versions')
      .select(`
        id,
        version_number,
        test_id,
        tests!inner (
          id,
          user_id
        )
      `)
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    if (version.tests.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const testId = version.test_id;

    // Get all questions for this test
    const { data: testQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('test_id', testId);

    if (questionsError) {
      console.error('Error fetching test questions:', questionsError);
      return res.status(500).json({ error: questionsError.message });
    }

    if (!testQuestions || testQuestions.length === 0) {
      return res.json({
        data: {
          version_id: version.id,
          version_number: version.version_number,
          answer_key: []
        }
      });
    }

    const questionIds = testQuestions.map(q => q.id);

    // Get all correct answers for these questions
    const { data: correctAnswers, error: answersError } = await supabase
      .from('answers')
      .select('question_id, answer_choices_id')
      .in('question_id', questionIds);

    if (answersError) {
      console.error('Error fetching correct answers:', answersError);
      return res.status(500).json({ error: answersError.message });
    }

    // Create a map of question_id -> correct_choice_id
    const answerMap = {};
    if (correctAnswers) {
      correctAnswers.forEach(answer => {
        answerMap[answer.question_id] = answer.answer_choices_id;
      });
    }

    // Get version questions with their shuffled answer choices
    const { data: versionQuestions, error: vqError } = await supabase
      .from('test_version_questions')
      .select(`
        id,
        question_id,
        question_order,
        test_versions_answer_choices (
          choice_order,
          answer_choices_id
        )
      `)
      .eq('test_version_id', versionId)
      .order('question_order', { ascending: true });

    if (vqError) {
      console.error('Error fetching version questions:', vqError);
      return res.status(500).json({ error: vqError.message });
    }

    // Build answer key
    const answerKey = [];
    
    versionQuestions.forEach(vq => {
      const correctChoiceId = answerMap[vq.question_id];
      
      if (correctChoiceId) {
        // Find which position (order) the correct choice is in the shuffled choices
        const sortedChoices = vq.test_versions_answer_choices.sort((a, b) => a.choice_order - b.choice_order);
        const correctChoicePosition = sortedChoices.findIndex(c => c.answer_choices_id === correctChoiceId);
        
        if (correctChoicePosition !== -1) {
          // Convert position to letter (0 = A, 1 = B, etc.)
          const letter = String.fromCharCode(65 + correctChoicePosition); // 65 is 'A'
          
          answerKey.push({
            question_number: vq.question_order,
            answer: letter
          });
        }
      }
    });

    res.json({
      data: {
        version_id: version.id,
        version_number: version.version_number,
        answer_key: answerKey
      }
    });

  } catch (error) {
    console.error('Error in getVersionAnswerKey:', error);
    res.status(500).json({ error: 'Failed to fetch version answer key' });
  }
}

/**
 * Delete a version and all related data (cascading delete)
 */
export async function deleteVersion(req, res) {
  try {
    const { versionId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const { data: version, error: versionError } = await supabase
      .from('test_versions')
      .select(`
        id,
        tests!inner (
          user_id
        )
      `)
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    if (version.tests.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Step 1: Get all version questions for this version
    const { data: versionQuestions } = await supabase
      .from('test_version_questions')
      .select('id')
      .eq('test_version_id', versionId);

    if (versionQuestions && versionQuestions.length > 0) {
      const versionQuestionIds = versionQuestions.map(vq => vq.id);

      // Step 1a: Delete test_versions_answer_choices
      await supabase
        .from('test_versions_answer_choices')
        .delete()
        .in('test_version_question_id', versionQuestionIds);

      // Step 1b: Delete test_version_questions
      await supabase
        .from('test_version_questions')
        .delete()
        .in('id', versionQuestionIds);
    }

    // Step 2: Delete the test version
    const { error: deleteError } = await supabase
      .from('test_versions')
      .delete()
      .eq('id', versionId);

    if (deleteError) {
      console.error('Error deleting version:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    res.json({ 
      success: true,
      message: 'Version deleted successfully' 
    });

  } catch (error) {
    console.error('Error in deleteVersion:', error);
    res.status(500).json({ error: 'Failed to delete version' });
  }
}

export default {
  generateVersions,
  getTestVersions,
  getVersion,
  getVersionAnswerKey,
  deleteVersion
};

