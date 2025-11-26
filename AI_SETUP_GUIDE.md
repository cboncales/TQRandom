# AI Test Generator - Setup Guide

## ✅ What's Been Implemented

### Backend (Complete)
1. **OpenAI Service** (`server/utils/openaiService.js`)
   - GPT-4o-mini integration
   - Smart prompt building for parts and non-parts scenarios
   - JSON response format enforcement

2. **File Parser** (`server/utils/fileParser.js`)
   - PDF text extraction
   - DOCX/DOC text extraction
   - TXT file support

3. **AI Controller** (`server/controllers/aiController.js`)
   - Generate test with AI
   - Save to Supabase (tests, questions, answer_options tables)
   - Error handling and validation

4. **AI Routes** (`server/routes/aiRoutes.js`)
   - POST /api/ai/generate endpoint
   - Multer file upload middleware (10MB limit)
   - Authentication middleware

5. **Server Integration** (`server/index.js`)
   - AI routes registered

### Frontend (Complete)
1. **AI Modal** (`src/components/dashboard/AIGenerateTestModal.vue`)
   - Topic input or file upload
   - Per-part question type configuration
   - Smart question distribution with auto-adjustment
   - Visual progress bar
   - Loading state handling

2. **API Client** (`src/services/api.js`)
   - `aiApi.generateTest()` method
   - FormData submission
   - Error handling

3. **Dashboard Integration** (`src/views/DashboardView.vue`)
   - Modal integration
   - API connection
   - Test list updates
   - Success/error handling

## 🔧 Setup Steps

### 1. Install Dependencies
```bash
cd server
npm install pdf-parse mammoth
```

### 2. Configure Environment Variables
Create `server/.env` file (use `.env.example` as template):
```env
OPENAI_API_KEY=sk-...your-key-here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `server/.env`

## 🧪 Testing Checklist

### Basic Tests
- [ ] Generate test without file (text topic only)
- [ ] Generate test with PDF file
- [ ] Generate test with DOCX file
- [ ] Generate test without parts (mixed question types)
- [ ] Generate test with parts (per-part question types)

### Question Type Tests
- [ ] Multiple Choice questions (verify 4 options)
- [ ] True/False questions
- [ ] Identification questions
- [ ] Fill in the Blank questions (verify ___ blanks)
- [ ] Essay questions (verify open-ended)

### Question Distribution Tests
- [ ] Adjust question count in one part, verify others auto-adjust
- [ ] Set total questions, click "Distribute Evenly"
- [ ] Verify question count never exceeds total

### Database Verification
- [ ] Check `tests` table for new test
- [ ] Check `questions` table for generated questions
- [ ] Check `answer_options` table for multiple choice options
- [ ] Verify part numbers are correct
- [ ] Verify question types match selections

### UI Tests
- [ ] Modal disables inputs during generation
- [ ] Loading spinner shows during generation
- [ ] Success message displays after generation
- [ ] Test appears in dashboard list
- [ ] Error messages display properly

## 📝 Request Format

### With Parts
```javascript
{
  testTitle: "Science Quiz",
  topic: "Photosynthesis",
  numberOfQuestions: 20,
  numberOfParts: 2,
  parts: [
    { partNumber: 1, questionType: "multiple_choice", questionCount: 12 },
    { partNumber: 2, questionType: "true_false", questionCount: 8 }
  ],
  questionTypes: [], // Not used when parts exist
  file: File | null
}
```

### Without Parts
```javascript
{
  testTitle: "Mixed Quiz",
  topic: "General Science",
  numberOfQuestions: 15,
  numberOfParts: 0,
  parts: [],
  questionTypes: ["multiple_choice", "true_false"],
  file: File | null
}
```

## 🎯 **Response Format**

### Success
```json
{
  "success": true,
  "message": "Test generated successfully",
  "test": {
    "id": 123,
    "title": "Science Quiz",
    "user_id": "...",
    "number_of_parts": 2,
    "part_descriptions": ["Part I", "Part II"],
    "directions": ["Choose the best answer for each question.", "..."],
    "created_at": "2024-01-01T00:00:00Z",
    "questionCount": 20
  },
  "questions": [
    {
      "id": 1,
      "question": "What is photosynthesis?",
      "type": "multiple_choice",
      "part": 1,
      "correct_answer": "The process by which plants make food",
      "options": [
        {
          "option_letter": "A",
          "option_text": "The process by which plants make food",
          "is_correct": true
        },
        {
          "option_letter": "B",
          "option_text": "The process of respiration",
          "is_correct": false
        },
        {
          "option_letter": "C",
          "option_text": "The process of digestion",
          "is_correct": false
        },
        {
          "option_letter": "D",
          "option_text": "The process of excretion",
          "is_correct": false
        }
      ]
    },
    {
      "id": 2,
      "question": "Plants are living organisms.",
      "type": "true_false",
      "part": 1,
      "correct_answer": "True"
    },
    {
      "id": 3,
      "question": "What is the green pigment in plants called?",
      "type": "identification",
      "part": 2,
      "correct_answer": "Chlorophyll"
    },
    {
      "id": 4,
      "question": "The capital of France is ___.",
      "type": "fill_in_the_blank",
      "part": 2,
      "correct_answer": "Paris"
    },
    {
      "id": 5,
      "question": "Explain the importance of photosynthesis in the ecosystem.",
      "type": "essay",
      "part": 2,
      "correct_answer": "Key points: Produces oxygen, converts light energy to chemical energy, forms base of food chain, removes CO2 from atmosphere"
    }
  ]
}
```

### Notes:
- **Test object** includes: title, number_of_parts, part_descriptions, directions, questionCount
- **Description field** is null - users add it later through edit
- **Questions array** includes all generated questions with:
  - Question text
  - Question type (multiple_choice, true_false, identification, fill_in_the_blank, essay)
  - Assigned part number
  - Correct answer
  - Options array (only for multiple_choice type)

### Error
```json
{
  "error": "Error message here",
  "details": "Optional additional details"
}
```

## 🐛 Troubleshooting

### "OpenAI API key not configured"
- Check `server/.env` file exists
- Verify `OPENAI_API_KEY` is set
- Restart server after adding key

### "Failed to parse file"
- Check file size < 10MB
- Verify file format (PDF, DOC, DOCX, TXT)
- Try with a different file

### "Error saving to database"
- Check Supabase connection
- Verify table structures match
- Check server logs for details

### "Questions not appearing in list"
- Refresh the page
- Check browser console for errors
- Verify API response contains test data

## 📊 Database Schema Requirements

### tests table
- `id` (bigint, primary key)
- `user_id` (uuid)
- `title` (text)
- `has_parts` (boolean)
- `created_at` (timestamp)

### questions table
- `id` (bigint, primary key)
- `test_id` (bigint, foreign key)
- `part_number` (integer, nullable)
- `question_text` (text)
- `question_type` (text)
- `correct_answer` (text)
- `created_at` (timestamp)

### answer_options table
- `id` (bigint, primary key)
- `question_id` (bigint, foreign key)
- `option_text` (text)
- `option_letter` (text)
- `is_correct` (boolean)
- `created_at` (timestamp)

## 🎉 Features

1. **Smart Question Generation**
   - Context-aware prompts
   - Structured JSON responses
   - 5 question types supported:
     - Multiple Choice (4 options)
     - True/False
     - Identification
     - Fill in the Blank
     - Essay

2. **Flexible Configuration**
   - Per-part question types
   - Auto-adjusting distribution
   - File or text input

3. **File Support**
   - PDF documents
   - Word documents (DOC/DOCX)
   - Plain text files

4. **Visual Feedback**
   - Progress bar with color coding
   - Loading states
   - Success/error messages

5. **Database Integration**
   - Automatic test creation
   - Question storage
   - Answer options for MC questions

## 📝 Next Steps

1. Install dependencies (`npm install pdf-parse mammoth`)
2. Add OpenAI API key to `.env`
3. Test with sample topics
4. Test with sample files
5. Verify database entries
6. Adjust prompts if needed (in `openaiService.js`)

## 🔗 Important Files

- Backend:
  - `server/utils/openaiService.js` - OpenAI integration
  - `server/utils/fileParser.js` - File parsing
  - `server/controllers/aiController.js` - Request handling
  - `server/routes/aiRoutes.js` - API routes

- Frontend:
  - `src/components/dashboard/AIGenerateTestModal.vue` - UI
  - `src/services/api.js` - API client
  - `src/views/DashboardView.vue` - Integration

Good luck! 🚀
