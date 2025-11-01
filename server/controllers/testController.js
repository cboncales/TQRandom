import { supabase } from '../config/supabase.js';

/**
 * Create a new test
 */
async function createTest(req, res) {
  try {
    const { title, description } = req.body;
    
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
 * Delete a test
 */
async function deleteTest(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting test:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
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

