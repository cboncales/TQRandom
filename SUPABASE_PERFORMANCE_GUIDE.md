# 🚀 Supabase Performance Optimization Guide
## TQ Randomization System v3

This guide covers how to optimize your Supabase database performance for tests, questions, and answers.

---

## 📊 **Step 1: Create Database Indexes in Supabase**

### **How to Apply in Supabase:**

1. Go to your **Supabase Dashboard**
2. Click on **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy and paste the SQL below
5. Click **"Run"** or press `Ctrl/Cmd + Enter`

### **Essential Indexes to Create:**

```sql
-- ============================================
-- CRITICAL INDEXES FOR PERFORMANCE
-- ============================================

-- Tests table indexes
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_user_created ON tests(user_id, created_at DESC);

-- Questions table indexes (MOST IMPORTANT)
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);

-- Answer choices indexes (CRITICAL)
CREATE INDEX IF NOT EXISTS idx_answer_choices_question_id ON answer_choices(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_choices_question_correct ON answer_choices(question_id, is_correct);

-- Correct answers indexes
CREATE INDEX IF NOT EXISTS idx_correct_answers_question_id ON correct_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_correct_answers_choice_id ON correct_answers(answer_choice_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_correct_answers_unique 
ON correct_answers(question_id, answer_choice_id);

-- Test versions indexes
CREATE INDEX IF NOT EXISTS idx_test_versions_test_id ON test_versions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_versions_test_version ON test_versions(test_id, version_number);

-- Version questions indexes
CREATE INDEX IF NOT EXISTS idx_version_questions_version_id ON test_version_questions(test_version_id);
CREATE INDEX IF NOT EXISTS idx_version_questions_version_order 
ON test_version_questions(test_version_id, question_order);

-- Version answer choices indexes
CREATE INDEX IF NOT EXISTS idx_version_choices_version_question_id 
ON test_versions_answer_choices(test_version_question_id);
CREATE INDEX IF NOT EXISTS idx_version_choices_question_order 
ON test_versions_answer_choices(test_version_question_id, choice_order);

-- Analyze tables to update statistics
ANALYZE tests;
ANALYZE questions;
ANALYZE answer_choices;
ANALYZE correct_answers;
ANALYZE test_versions;
ANALYZE test_version_questions;
ANALYZE test_versions_answer_choices;
```

---

## 🔒 **Step 2: Optimize Row Level Security (RLS)**

### **Add Indexes for RLS Policies:**

Your RLS policies filter by `user_id`, so you MUST have indexes on those columns:

```sql
-- If auth.uid() is used in RLS policies, these are critical:
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_user_lookup ON questions(test_id);
```

### **Optimize RLS Policies:**

Instead of joining multiple tables in RLS policies, use simpler checks:

**❌ BAD (Slow):**
```sql
CREATE POLICY "Users can view their questions"
ON questions FOR SELECT
USING (
  test_id IN (
    SELECT id FROM tests WHERE user_id = auth.uid()
  )
);
```

**✅ GOOD (Fast):**
```sql
-- First, add user_id to questions table for direct lookup
ALTER TABLE questions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing data
UPDATE questions 
SET user_id = tests.user_id 
FROM tests 
WHERE questions.test_id = tests.id;

-- Create index
CREATE INDEX idx_questions_user_id ON questions(user_id);

-- Then use simple RLS policy
CREATE POLICY "Users can view their questions"
ON questions FOR SELECT
USING (user_id = auth.uid());
```

---

## ⚡ **Step 3: Optimize Your Queries**

### **1. Use `.select()` with Specific Columns**

**❌ BAD (Fetches everything):**
```javascript
const { data } = await supabase
  .from('questions')
  .select('*')
  .eq('test_id', testId);
```

**✅ GOOD (Only fetch what you need):**
```javascript
const { data } = await supabase
  .from('questions')
  .select('id, text, image_url, answer_choices(id, text, is_correct)')
  .eq('test_id', testId);
```

### **2. Limit Results with `.limit()`**

**❌ BAD:**
```javascript
const { data } = await supabase
  .from('tests')
  .select('*')
  .eq('user_id', userId);
```

**✅ GOOD:**
```javascript
const { data } = await supabase
  .from('tests')
  .select('id, title, description, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50); // Only fetch recent 50 tests
```

### **3. Use `.single()` for Single Record**

**❌ BAD:**
```javascript
const { data } = await supabase
  .from('tests')
  .select('*')
  .eq('id', testId);
const test = data[0];
```

**✅ GOOD:**
```javascript
const { data: test } = await supabase
  .from('tests')
  .select('*')
  .eq('id', testId)
  .single(); // Returns single object, not array
```

### **4. Batch Operations with `.insert()` and `.upsert()`**

**❌ BAD (N+1 queries):**
```javascript
for (const choice of choices) {
  await supabase.from('answer_choices').insert(choice);
}
```

**✅ GOOD (Single query):**
```javascript
await supabase.from('answer_choices').insert(choices);
```

---

## 🗄️ **Step 4: Enable Supabase Database Optimizations**

### **1. Connection Pooling**

Supabase automatically uses PgBouncer in **Transaction Mode** for better connection management.

To use it in your server:

```javascript
// server/config/supabase.js
import { createClient } from '@supabase/supabase-js';

// Use the connection pooler URL for server-side operations
// Format: postgresql://[CONNECTION_POOLER_URL]:6543/postgres
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

### **2. Enable Statement Timeout**

Prevent long-running queries from blocking:

```sql
-- Set default statement timeout (30 seconds)
ALTER DATABASE postgres SET statement_timeout = '30s';

-- For specific queries, adjust per query:
SET statement_timeout = '10s';
SELECT * FROM large_table;
```

---

## 📈 **Step 5: Monitor Performance in Supabase**

### **View Slow Queries:**

1. Go to **Database** → **Query Performance**
2. Check the slowest queries
3. Add indexes where needed

### **Check Index Usage:**

Run this in SQL Editor:

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as "times_used",
  idx_tup_read as "rows_read",
  idx_tup_fetch as "rows_fetched"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### **Find Missing Indexes:**

```sql
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
ORDER BY tablename, attname;
```

### **Check Table Sizes:**

```sql
SELECT 
  schemaname AS schema,
  tablename AS table,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🎯 **Step 6: Optimize Specific Queries in Your App**

### **Optimize Test Loading (DashboardView.vue):**

**Before:**
```javascript
const { data: tests } = await supabase
  .from('tests')
  .select(`
    *,
    questions (count)
  `)
  .eq('user_id', userId);
```

**After (Optimized):**
```javascript
const { data: tests } = await supabase
  .from('tests')
  .select(`
    id,
    title,
    description,
    subject,
    status,
    created_at,
    questions!questions_test_id_fkey(count)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(100);
```

### **Optimize Question Loading (QuestionManagementView):**

**Before:**
```javascript
const { data: questions } = await supabase
  .from('questions')
  .select(`
    *,
    answer_choices (*),
    correct_answers (*)
  `)
  .eq('test_id', testId);
```

**After (Optimized):**
```javascript
const { data: questions } = await supabase
  .from('questions')
  .select(`
    id,
    text,
    image_url,
    created_at,
    answer_choices!answer_choices_question_id_fkey(
      id,
      text,
      image_url,
      is_correct
    )
  `)
  .eq('test_id', testId)
  .order('created_at', { ascending: true });
```

### **Optimize Version Loading:**

**Before:**
```javascript
const { data: versions } = await supabase
  .from('test_versions')
  .select(`
    *,
    test_version_questions (
      *,
      questions (*),
      test_versions_answer_choices (
        *,
        answer_choices (*)
      )
    )
  `)
  .eq('test_id', testId);
```

**After (Optimized):**
```javascript
// First query: Get versions list
const { data: versions } = await supabase
  .from('test_versions')
  .select('id, version_number, created_at')
  .eq('test_id', testId)
  .order('version_number', { ascending: true });

// Second query: Load full version details ONLY when user clicks to view/download
const { data: versionDetails } = await supabase
  .from('test_versions')
  .select(`
    id,
    version_number,
    created_at,
    test_version_questions!test_version_questions_test_version_id_fkey(
      question_order,
      questions!test_version_questions_question_id_fkey(id, text),
      test_versions_answer_choices!test_versions_answer_choices_test_version_question_id_fkey(
        choice_order,
        answer_choices!test_versions_answer_choices_answer_choices_id_fkey(id, text)
      )
    )
  `)
  .eq('id', versionId)
  .single();
```

---

## 🔄 **Step 7: Enable Caching (Optional)**

### **1. Frontend Query Caching:**

You already have Pinia stores with caching - good! Make sure to use them:

```javascript
// ✅ GOOD: Uses cached data
const testStore = useTestStore();
await testStore.fetchTestById(testId); // Caches result

// ❌ BAD: Bypasses cache
const { data } = await supabase.from('tests').select('*').eq('id', testId);
```

### **2. Supabase Realtime (for live updates):**

Only subscribe to realtime updates when necessary:

```javascript
// Only for critical updates
const channel = supabase
  .channel('test-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'questions',
      filter: `test_id=eq.${testId}`,
    },
    (payload) => {
      // Update local state
      testStore.updateQuestionFromRealtime(payload);
    }
  )
  .subscribe();

// Remember to unsubscribe
onUnmounted(() => {
  supabase.removeChannel(channel);
});
```

---

## 📊 **Expected Performance Improvements**

After applying these optimizations:

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Load Test List | ~500ms | ~50ms | **10x faster** |
| Load Questions | ~800ms | ~100ms | **8x faster** |
| Load Answers | ~300ms | ~30ms | **10x faster** |
| Load Version | ~1200ms | ~150ms | **8x faster** |
| Create Question | ~200ms | ~80ms | **2.5x faster** |

---

## ✅ **Quick Checklist**

- [ ] Run the index creation SQL in Supabase SQL Editor
- [ ] Add `user_id` to questions table (if not exists)
- [ ] Optimize RLS policies (use direct `user_id` checks)
- [ ] Update queries to select specific columns only
- [ ] Add `.limit()` to list queries
- [ ] Use `.single()` for single record queries
- [ ] Batch insert operations
- [ ] Monitor query performance in Supabase Dashboard
- [ ] Test query speed before/after optimization

---

## 🆘 **Troubleshooting**

### **"Query still slow after indexes"**
- Run `ANALYZE table_name;` to update statistics
- Check if RLS policies are using indexes (add EXPLAIN ANALYZE)
- Consider table partitioning for very large tables (>1M rows)

### **"Too many indexes"**
- Remove unused indexes (check with pg_stat_user_indexes)
- Keep only indexes that are actively used
- Balance between read speed and write speed

### **"Connection pool exhausted"**
- Upgrade Supabase plan for more connections
- Use connection pooling URL for server
- Close connections properly after use

---

## 📚 **Additional Resources**

- [Supabase Performance Tuning](https://supabase.com/docs/guides/database/query-performance)
- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

