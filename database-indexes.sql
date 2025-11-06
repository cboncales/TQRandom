-- ============================================
-- DATABASE INDEXES FOR PERFORMANCE OPTIMIZATION
-- TQ Randomization System v3
-- ============================================

-- ===========================================
-- TESTS TABLE INDEXES
-- ===========================================

-- Index on user_id for filtering tests by user
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);

-- Index on created_at for sorting and recent tests queries
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at DESC);

-- Composite index for user's tests sorted by creation date
CREATE INDEX IF NOT EXISTS idx_tests_user_created ON tests(user_id, created_at DESC);

-- Index on status for filtering active/draft tests
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);


-- ===========================================
-- QUESTIONS TABLE INDEXES
-- ===========================================

-- Index on test_id for fetching all questions for a test (MOST IMPORTANT)
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);

-- Composite index for test questions with image URL (for filtering questions with images)
CREATE INDEX IF NOT EXISTS idx_questions_test_image ON questions(test_id, image_url);

-- Index on created_at for sorting questions
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);


-- ===========================================
-- ANSWER_CHOICES TABLE INDEXES
-- ===========================================

-- Index on question_id for fetching choices for a question (CRITICAL)
CREATE INDEX IF NOT EXISTS idx_answer_choices_question_id ON answer_choices(question_id);

-- Composite index for fetching correct answers
CREATE INDEX IF NOT EXISTS idx_answer_choices_question_correct ON answer_choices(question_id, is_correct);


-- ===========================================
-- CORRECT_ANSWERS TABLE INDEXES
-- ===========================================

-- Index on question_id for finding correct answers
CREATE INDEX IF NOT EXISTS idx_correct_answers_question_id ON correct_answers(question_id);

-- Index on answer_choice_id for reverse lookups
CREATE INDEX IF NOT EXISTS idx_correct_answers_choice_id ON correct_answers(answer_choice_id);

-- Composite unique index to prevent duplicate correct answers
CREATE UNIQUE INDEX IF NOT EXISTS idx_correct_answers_unique 
ON correct_answers(question_id, answer_choice_id);


-- ===========================================
-- TEST_VERSIONS TABLE INDEXES
-- ===========================================

-- Index on test_id for fetching versions of a test
CREATE INDEX IF NOT EXISTS idx_test_versions_test_id ON test_versions(test_id);

-- Composite index for test versions sorted by version number
CREATE INDEX IF NOT EXISTS idx_test_versions_test_version ON test_versions(test_id, version_number);

-- Index on created_at for sorting versions
CREATE INDEX IF NOT EXISTS idx_test_versions_created_at ON test_versions(created_at DESC);


-- ===========================================
-- TEST_VERSION_QUESTIONS TABLE INDEXES
-- ===========================================

-- Index on test_version_id for fetching questions in a version
CREATE INDEX IF NOT EXISTS idx_version_questions_version_id ON test_version_questions(test_version_id);

-- Index on question_id for finding which versions use a question
CREATE INDEX IF NOT EXISTS idx_version_questions_question_id ON test_version_questions(question_id);

-- Composite index for version questions sorted by order
CREATE INDEX IF NOT EXISTS idx_version_questions_version_order 
ON test_version_questions(test_version_id, question_order);


-- ===========================================
-- TEST_VERSIONS_ANSWER_CHOICES TABLE INDEXES
-- ===========================================

-- Index on test_version_question_id for fetching choices in a version question
CREATE INDEX IF NOT EXISTS idx_version_choices_version_question_id 
ON test_versions_answer_choices(test_version_question_id);

-- Index on answer_choices_id for finding versions that use a choice
CREATE INDEX IF NOT EXISTS idx_version_choices_choice_id 
ON test_versions_answer_choices(answer_choices_id);

-- Composite index for version choices sorted by order
CREATE INDEX IF NOT EXISTS idx_version_choices_question_order 
ON test_versions_answer_choices(test_version_question_id, choice_order);


-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check all indexes on a table
-- Run these to verify indexes were created:

-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'tests';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'questions';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'answer_choices';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'correct_answers';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'test_versions';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'test_version_questions';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'test_versions_answer_choices';


-- ===========================================
-- PERFORMANCE TIPS
-- ===========================================

-- 1. Run ANALYZE after creating indexes to update statistics:
--    ANALYZE tests;
--    ANALYZE questions;
--    ANALYZE answer_choices;
--    ANALYZE correct_answers;
--    ANALYZE test_versions;
--    ANALYZE test_version_questions;
--    ANALYZE test_versions_answer_choices;

-- 2. Monitor index usage with:
--    SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
--    FROM pg_stat_user_indexes
--    WHERE schemaname = 'public'
--    ORDER BY idx_scan DESC;

-- 3. Find unused indexes:
--    SELECT schemaname, tablename, indexname
--    FROM pg_stat_user_indexes
--    WHERE idx_scan = 0 AND schemaname = 'public';

-- 4. Check table sizes:
--    SELECT schemaname, tablename, 
--           pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
--    FROM pg_tables
--    WHERE schemaname = 'public'
--    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

