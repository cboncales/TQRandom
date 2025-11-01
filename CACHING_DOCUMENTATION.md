# Pinia Store Caching Implementation

## 🚀 Features

### **Automatic Caching**
- Fetched data is cached automatically
- Cache duration: **5 minutes**
- Reduces unnecessary API calls
- Improves app performance

### **Smart Cache Invalidation**
- Cache is automatically cleared when data changes
- Create/Update/Delete operations invalidate relevant cache
- Logout clears all cache

---

## 📦 **Test Store (`testStore.js`)**

### **Cached Operations:**

#### **1. `getUserTests(forceRefresh = false)`**
```javascript
const testStore = useTestStore();

// First call - fetches from API
const result = await testStore.getUserTests();

// Second call within 5 minutes - returns cached data
const result2 = await testStore.getUserTests();

// Force refresh - bypasses cache
const result3 = await testStore.getUserTests(true);
```

#### **2. `getTest(testId, forceRefresh = false)`**
```javascript
// Caches individual tests by ID
const result = await testStore.getTest(123);

// Returns cached test if available
const result2 = await testStore.getTest(123);

// Force refresh
const result3 = await testStore.getTest(123, true);
```

#### **3. `getTestQuestions(testId, forceRefresh = false)`**
```javascript
// Caches questions per test
const result = await testStore.getTestQuestions(123);

// Returns cached questions
const result2 = await testStore.getTestQuestions(123);

// Force refresh
const result3 = await testStore.getTestQuestions(123, true);
```

---

## 🗑️ **Cache Invalidation**

### **Automatic Invalidation:**

1. **Creating a test** → Clears all tests cache
2. **Updating a test** → Clears that test's cache
3. **Deleting a test** → Clears that test's cache + questions cache
4. **Creating a question** → Clears questions cache for that test
5. **Updating a question** → Clears questions cache for that test
6. **Deleting a question** → Clears questions cache for that test
7. **Logout** → Clears all cache

### **Manual Cache Control:**

```javascript
const testStore = useTestStore();

// Clear all cache
testStore.clearCache();

// Clear specific test cache
testStore.clearTestCache(testId);
```

---

## 📊 **Cache Structure**

```javascript
{
  // All tests
  testsCache: [...tests],
  testsCacheTime: timestamp,
  
  // Individual tests
  singleTestCache: {
    123: { data: {...}, timestamp: ... },
    456: { data: {...}, timestamp: ... }
  },
  
  // Questions by test ID
  questionsCache: {
    123: { data: [...], timestamp: ... },
    456: { data: [...], timestamp: ... }
  }
}
```

---

## ⚡ **Performance Benefits**

### **Before Caching:**
- Every page visit → New API call
- Slow navigation
- Unnecessary server load

### **After Caching:**
- First visit → API call (cached)
- Subsequent visits → Instant (from cache)
- Cache refreshes every 5 minutes
- Manual refresh available

---

## 🔍 **Debug Logs**

Console logs show cache behavior:
```
Fetching tests from API
Returning cached tests
Fetching questions for test 123 from API
Returning cached questions for test 123
```

---

## 💡 **Usage Examples**

### **Dashboard View:**
```javascript
<script setup>
import { useTestStore } from '@/stores/testStore';

const testStore = useTestStore();

// Load tests (uses cache if available)
const loadTests = async () => {
  const result = await testStore.getUserTests();
  if (!result.error) {
    tests.value = result.data;
  }
};

// Refresh with fresh data
const refreshTests = async () => {
  const result = await testStore.getUserTests(true); // Force refresh
  if (!result.error) {
    tests.value = result.data;
  }
};
</script>
```

### **Question Management:**
```javascript
<script setup>
import { useTestStore } from '@/stores/testStore';

const testStore = useTestStore();
const testId = route.params.id;

// Load questions (uses cache if available)
const loadQuestions = async () => {
  const result = await testStore.getTestQuestions(testId);
  if (!result.error) {
    questions.value = result.data;
  }
};

// After creating/updating/deleting, cache is auto-cleared
// Next call to loadQuestions() will fetch fresh data
</script>
```

---

## ⚙️ **Configuration**

Change cache duration in `testStore.js`:
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Options:
// 1 minute:  1 * 60 * 1000
// 5 minutes: 5 * 60 * 1000
// 10 minutes: 10 * 60 * 1000
// 30 minutes: 30 * 60 * 1000
```

---

## ✅ **Best Practices**

1. **Use default behavior** - Let cache work automatically
2. **Force refresh only when needed** - User-triggered refresh buttons
3. **Cache clears on mutations** - Happens automatically
4. **Logout clears everything** - Prevents data leaks
5. **Check console logs** - Monitor cache hits/misses during development

---

## 🎯 **Summary**

✅ **5-minute cache** for all GET operations
✅ **Automatic invalidation** on data changes
✅ **Force refresh option** available
✅ **Per-test caching** for questions
✅ **Logout clears cache** for security
✅ **Console logs** for debugging
✅ **Zero configuration needed** - works out of the box!

