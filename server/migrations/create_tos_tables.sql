-- Table of Specifications (TOS) System
-- This schema allows teachers to create reusable TOS templates for test generation

-- Main TOS Template table
CREATE TABLE IF NOT EXISTS public.tos_templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  template_name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  grade_level TEXT,
  
  -- Total test configuration
  total_items INT NOT NULL DEFAULT 0,
  
  -- Cognitive levels distribution (percentages should sum to 100)
  percentage_remembering NUMERIC(5,2) DEFAULT 0,
  percentage_understanding NUMERIC(5,2) DEFAULT 0,
  percentage_applying NUMERIC(5,2) DEFAULT 0,
  percentage_analyzing NUMERIC(5,2) DEFAULT 0,
  percentage_evaluating NUMERIC(5,2) DEFAULT 0,
  percentage_creating NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TOS Template Topics (breakdown by topic/unit)
CREATE TABLE IF NOT EXISTS public.tos_template_topics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tos_template_id BIGINT NOT NULL REFERENCES public.tos_templates(id) ON DELETE CASCADE,
  
  topic_name TEXT NOT NULL,
  num_sessions INT DEFAULT 0,
  percentage NUMERIC(5,2) DEFAULT 0,
  total_items INT DEFAULT 0,

  -- Cognitive levels breakdown for this topic
  items_remembering INT DEFAULT 0,
  items_understanding INT DEFAULT 0,
  items_applying INT DEFAULT 0,
  items_analyzing INT DEFAULT 0,
  items_evaluating INT DEFAULT 0,
  items_creating INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link TOS Template to Tests (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.test_tos_templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  test_id BIGINT NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  tos_template_id BIGINT NOT NULL REFERENCES public.tos_templates(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(test_id, tos_template_id)
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.tos_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tos_template_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_tos_templates ENABLE ROW LEVEL SECURITY;

-- TOS Templates: Users can only see their own templates
CREATE POLICY "Users can view own TOS templates"
  ON public.tos_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own TOS templates"
  ON public.tos_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own TOS templates"
  ON public.tos_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own TOS templates"
  ON public.tos_templates FOR DELETE
  USING (auth.uid() = user_id);

-- TOS Template Topics: Users can only access topics of their templates
CREATE POLICY "Users can view own TOS template topics"
  ON public.tos_template_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tos_templates
      WHERE tos_templates.id = tos_template_topics.tos_template_id
      AND tos_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own TOS template topics"
  ON public.tos_template_topics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tos_templates
      WHERE tos_templates.id = tos_template_topics.tos_template_id
      AND tos_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own TOS template topics"
  ON public.tos_template_topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tos_templates
      WHERE tos_templates.id = tos_template_topics.tos_template_id
      AND tos_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own TOS template topics"
  ON public.tos_template_topics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tos_templates
      WHERE tos_templates.id = tos_template_topics.tos_template_id
      AND tos_templates.user_id = auth.uid()
    )
  );

-- Test TOS Templates: Users can only link their own tests and templates
CREATE POLICY "Users can view own test TOS links"
  ON public.test_tos_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tests
      WHERE tests.id = test_tos_templates.test_id
      AND tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own test TOS links"
  ON public.test_tos_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tests
      WHERE tests.id = test_tos_templates.test_id
      AND tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own test TOS links"
  ON public.test_tos_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tests
      WHERE tests.id = test_tos_templates.test_id
      AND tests.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tos_templates_user_id ON public.tos_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_tos_template_topics_template_id ON public.tos_template_topics(tos_template_id);
CREATE INDEX IF NOT EXISTS idx_test_tos_templates_test_id ON public.test_tos_templates(test_id);
CREATE INDEX IF NOT EXISTS idx_test_tos_templates_template_id ON public.test_tos_templates(tos_template_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tos_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_tos_templates_updated_at
  BEFORE UPDATE ON public.tos_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_tos_template_updated_at();
