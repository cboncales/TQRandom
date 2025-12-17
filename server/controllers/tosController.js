import { supabase } from '../config/supabase.js';

/**
 * Create a new TOS template
 */
export async function createTOSTemplate(req, res) {
  try {
    const userId = req.user.id;
    const {
      template_name,
      description,
      subject,
      grade_level,
      total_items,
      percentage_remembering,
      percentage_understanding,
      percentage_applying,
      percentage_analyzing,
      percentage_evaluating,
      percentage_creating,
      topics
    } = req.body;

    // Validate required fields
    if (!template_name || !total_items) {
      return res.status(400).json({ error: 'Template name and total items are required' });
    }

    // Validate percentages sum to 100
    const totalPercentage = 
      (percentage_remembering || 0) +
      (percentage_understanding || 0) +
      (percentage_applying || 0) +
      (percentage_analyzing || 0) +
      (percentage_evaluating || 0) +
      (percentage_creating || 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({ 
        error: 'Cognitive level percentages must sum to 100%' 
      });
    }

    // Create TOS template
    const { data: template, error: templateError } = await supabase
      .from('tos_templates')
      .insert({
        user_id: userId,
        template_name,
        description,
        subject,
        grade_level,
        total_items,
        percentage_remembering: percentage_remembering || 0,
        percentage_understanding: percentage_understanding || 0,
        percentage_applying: percentage_applying || 0,
        percentage_analyzing: percentage_analyzing || 0,
        percentage_evaluating: percentage_evaluating || 0,
        percentage_creating: percentage_creating || 0
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating TOS template:', templateError);
      return res.status(500).json({ error: templateError.message });
    }

    // Insert topics if provided
    if (topics && Array.isArray(topics) && topics.length > 0) {
      const topicsToInsert = topics.map(topic => ({
        tos_template_id: template.id,
        topic_name: topic.topic_name,
        num_sessions: topic.num_sessions || 0,
        percentage: topic.percentage || 0,
        total_items: topic.total_items || 0,
        items_remembering: topic.items_remembering || 0,
        items_understanding: topic.items_understanding || 0,
        items_applying: topic.items_applying || 0,
        items_analyzing: topic.items_analyzing || 0,
        items_evaluating: topic.items_evaluating || 0,
        items_creating: topic.items_creating || 0
      }));

      const { error: topicsError } = await supabase
        .from('tos_template_topics')
        .insert(topicsToInsert);

      if (topicsError) {
        console.error('Error creating TOS topics:', topicsError);
        // Delete the template if topics failed
        await supabase.from('tos_templates').delete().eq('id', template.id);
        return res.status(500).json({ error: topicsError.message });
      }
    }

    res.status(201).json(template);
  } catch (error) {
    console.error('Error in createTOSTemplate:', error);
    res.status(500).json({ error: 'Failed to create TOS template' });
  }
}

/**
 * Get all TOS templates for the authenticated user
 */
export async function getUserTOSTemplates(req, res) {
  try {
    const userId = req.user.id;

    const { data: templates, error } = await supabase
      .from('tos_templates')
      .select(`
        *,
        tos_template_topics (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching TOS templates:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(templates);
  } catch (error) {
    console.error('Error in getUserTOSTemplates:', error);
    res.status(500).json({ error: 'Failed to fetch TOS templates' });
  }
}

/**
 * Get a single TOS template by ID
 */
export async function getTOSTemplate(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: template, error } = await supabase
      .from('tos_templates')
      .select(`
        *,
        tos_template_topics (*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching TOS template:', error);
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error in getTOSTemplate:', error);
    res.status(500).json({ error: 'Failed to fetch TOS template' });
  }
}

/**
 * Update a TOS template
 */
export async function updateTOSTemplate(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      template_name,
      description,
      subject,
      grade_level,
      total_items,
      percentage_remembering,
      percentage_understanding,
      percentage_applying,
      percentage_analyzing,
      percentage_evaluating,
      percentage_creating,
      topics
    } = req.body;

    // Validate percentages if provided
    if (percentage_remembering !== undefined) {
      const totalPercentage = 
        (percentage_remembering || 0) +
        (percentage_understanding || 0) +
        (percentage_applying || 0) +
        (percentage_analyzing || 0) +
        (percentage_evaluating || 0) +
        (percentage_creating || 0);

      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({ 
          error: 'Cognitive level percentages must sum to 100%' 
        });
      }
    }

    // Update template
    const { data: template, error: templateError } = await supabase
      .from('tos_templates')
      .update({
        template_name,
        description,
        subject,
        grade_level,
        total_items,
        percentage_remembering,
        percentage_understanding,
        percentage_applying,
        percentage_analyzing,
        percentage_evaluating,
        percentage_creating
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (templateError) {
      console.error('Error updating TOS template:', templateError);
      return res.status(500).json({ error: templateError.message });
    }

    // Update topics if provided
    if (topics && Array.isArray(topics)) {
      // Delete existing topics
      await supabase
        .from('tos_template_topics')
        .delete()
        .eq('tos_template_id', id);

      // Insert new topics
      if (topics.length > 0) {
        const topicsToInsert = topics.map(topic => ({
          tos_template_id: id,
          topic_name: topic.topic_name,
          num_sessions: topic.num_sessions || 0,
          percentage: topic.percentage || 0,
          total_items: topic.total_items || 0,
          items_remembering: topic.items_remembering || 0,
          items_understanding: topic.items_understanding || 0,
          items_applying: topic.items_applying || 0,
          items_analyzing: topic.items_analyzing || 0,
          items_evaluating: topic.items_evaluating || 0,
          items_creating: topic.items_creating || 0
        }));

        await supabase
          .from('tos_template_topics')
          .insert(topicsToInsert);
      }
    }

    res.json(template);
  } catch (error) {
    console.error('Error in updateTOSTemplate:', error);
    res.status(500).json({ error: 'Failed to update TOS template' });
  }
}

/**
 * Delete a TOS template
 */
export async function deleteTOSTemplate(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('tos_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting TOS template:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'TOS template deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTOSTemplate:', error);
    res.status(500).json({ error: 'Failed to delete TOS template' });
  }
}

/**
 * Link a TOS template to a test
 */
export async function linkTOSToTest(req, res) {
  try {
    const { testId, tosTemplateId } = req.body;
    const userId = req.user.id;

    if (!testId || !tosTemplateId) {
      return res.status(400).json({ error: 'Test ID and TOS Template ID are required' });
    }

    // Verify user owns the test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (testError || !test) {
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    // Verify user owns the template
    const { data: template, error: templateError } = await supabase
      .from('tos_templates')
      .select('id')
      .eq('id', tosTemplateId)
      .eq('user_id', userId)
      .single();

    if (templateError || !template) {
      return res.status(404).json({ error: 'TOS template not found or access denied' });
    }

    // Create link
    const { data: link, error: linkError } = await supabase
      .from('test_tos_templates')
      .insert({
        test_id: testId,
        tos_template_id: tosTemplateId
      })
      .select()
      .single();

    if (linkError) {
      // Check if link already exists
      if (linkError.code === '23505') {
        return res.status(400).json({ error: 'This template is already linked to this test' });
      }
      console.error('Error linking TOS to test:', linkError);
      return res.status(500).json({ error: linkError.message });
    }

    res.status(201).json(link);
  } catch (error) {
    console.error('Error in linkTOSToTest:', error);
    res.status(500).json({ error: 'Failed to link TOS template to test' });
  }
}

/**
 * Get TOS template linked to a test
 */
export async function getTestTOS(req, res) {
  try {
    const { testId } = req.params;
    const userId = req.user.id;

    // Verify user owns the test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (testError || !test) {
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    // Get linked TOS template
    const { data: link, error: linkError } = await supabase
      .from('test_tos_templates')
      .select(`
        tos_templates (
          *,
          tos_template_topics (*)
        )
      `)
      .eq('test_id', testId)
      .single();

    if (linkError) {
      if (linkError.code === 'PGRST116') {
        // No TOS linked to this test
        return res.json(null);
      }
      console.error('Error fetching test TOS:', linkError);
      return res.status(500).json({ error: linkError.message });
    }

    res.json(link.tos_templates);
  } catch (error) {
    console.error('Error in getTestTOS:', error);
    res.status(500).json({ error: 'Failed to fetch test TOS' });
  }
}
