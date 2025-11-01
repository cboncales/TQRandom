# TQ Randomization System - Backend API

Express.js server with Supabase integration for managing tests, questions, and answers.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (found in Project Settings > API)
   - `CLIENT_URL`: Your frontend URL (default: http://localhost:5173)
   - `PORT`: Server port (default: 3000)

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## API Endpoints

### Tests
- `POST /api/tests` - Create a new test
- `GET /api/tests` - Get all tests for authenticated user
- `GET /api/tests/:id` - Get a specific test
- `PUT /api/tests/:id` - Update a test
- `DELETE /api/tests/:id` - Delete a test

### Questions
- `POST /api/questions` - Create a new question with answer choices
- `GET /api/questions/test/:testId` - Get all questions for a test
- `PUT /api/questions/:id` - Update a question
- `DELETE /api/questions/:id` - Delete a question

### Answers
- `POST /api/answers/correct` - Store/update correct answer for a question
- `GET /api/answers/test/:testId/correct` - Get all correct answers for a test

## Authentication

All routes require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_supabase_jwt_token>
```

## Database Schema

### Tables:
- `tests`: id, user_id, title, description, created_at
- `questions`: id, test_id, text, created_at
- `answer_choices`: id, question_id, text, created_at
- `answers`: id, question_id, answer_choices_id, created_at

## Project Structure

```
server/
├── config/
│   └── supabase.js          # Supabase client configuration
├── controllers/
│   ├── testController.js    # Test business logic
│   ├── questionController.js # Question business logic
│   └── answerController.js  # Answer business logic
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── testRoutes.js        # Test endpoints
│   ├── questionRoutes.js    # Question endpoints
│   └── answerRoutes.js      # Answer endpoints
├── .env.example             # Environment variables template
├── .gitignore
├── index.js                 # Main server file
└── package.json
```

