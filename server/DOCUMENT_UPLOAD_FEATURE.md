# Document Upload Feature - Implementation Guide

## Overview

The document upload feature allows instructors to upload PDF or DOCX files containing questions and answer choices, which are automatically extracted and added to their tests.

---

## Installation

### 1. Install Required Packages

**IMPORTANT**: You need to install the following npm packages in the `server` directory:

```bash
cd server
npm install pdf-parse mammoth multer
```

Or manually run from the root if you have PowerShell execution policy issues:
- Open the `server/package.json` file
- The dependencies are already added
- Run `npm install` in the server directory

### Required Packages:
- **pdf-parse**: Extracts text from PDF files
- **mammoth**: Extracts text from DOCX files
- **multer**: Handles multipart/form-data file uploads

---

## Architecture

### Backend Components

#### 1. **Document Parser Utility** (`server/utils/documentParser.js`)
- Extracts raw text from PDF and DOCX files
- Parses text into structured question/answer format
- Validates parsed questions

**Key Functions:**
- `parseDocument(filePath, fileType)` - Main parsing function
- `validateParsedQuestions(questions)` - Validates parsed data
- `extractTextFromPDF(filePath)` - PDF text extraction
- `extractTextFromDOCX(filePath)` - DOCX text extraction
- `parseQuestionsFromText(text)` - Text parsing logic

#### 2. **Upload Controller** (`server/controllers/uploadController.js`)
- Handles file upload requests
- Coordinates parsing and validation
- Returns structured question data

**Endpoint:**
- `POST /api/upload/document` - Upload and parse document

#### 3. **Upload Routes** (`server/routes/uploadRoutes.js`)
- Configures multer middleware
- Sets up file upload constraints:
  - Max file size: 10MB
  - Allowed types: .pdf, .doc, .docx
  - Storage: temporary `uploads/` directory

#### 4. **Server Configuration** (`server/index.js`)
- Creates `uploads/` directory on startup
- Registers upload routes at `/api/upload`

### Frontend Components

#### 1. **API Service** (`src/services/api.js`)
- `uploadApi.uploadDocument(file)` - Sends file to backend

#### 2. **Question Management View** (`src/views/QuestionManagementView.vue`)
- Upload button in Questions tab
- File upload modal with drag & drop
- Progress indicator during processing
- Automatic question creation after parsing

---

## Document Format

### Requirements

Questions must follow this format:

```
1. Question text here?
A. First answer choice
B. Second answer choice
C. Third answer choice
D. Fourth answer choice

2. Next question text?
A. Answer option 1
B. Answer option 2
C. Answer option 3
D. Answer option 4
```

### Parsing Rules

1. **Questions** start with:
   - Pattern: `\d+\.` or `\d+\)`
   - Examples: `1.`, `2)`, `15.`

2. **Answer choices** start with:
   - Pattern: `[A-H]\.` or `[A-H]\)`
   - Examples: `A.`, `B)`, `H.`

3. **Multi-line questions** are supported
4. **Blank lines** are automatically skipped
5. **2-8 answer choices** per question (A-H)

See `server/SAMPLE_DOCUMENT_FORMAT.md` for detailed examples.

---

## API Usage

### Upload Document Endpoint

**Request:**
```http
POST /api/upload/document
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF or DOCX file>
```

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "question_text": "What is the capital of France?",
      "answer_choices": [
        "Berlin",
        "Madrid",
        "Paris",
        "Rome"
      ]
    }
  ],
  "count": 1
}
```

**Response (Error):**
```json
{
  "error": "Document validation failed",
  "details": [
    "Question 1: Missing question text",
    "Question 2: Must have at least 2 answer choices"
  ]
}
```

---

## File Processing Flow

1. **Upload** → User selects PDF/DOCX file
2. **Validation** → Check file type and size
3. **Extraction** → Extract raw text from document
4. **Parsing** → Convert text to structured data
5. **Validation** → Verify questions have valid format
6. **Storage** → Save each question to database
7. **Cleanup** → Delete temporary uploaded file
8. **Refresh** → Reload question list in UI

---

## Error Handling

### Backend Errors

- **Invalid file type**: Returns 400 with error message
- **File too large**: Rejected by multer (10MB limit)
- **Parsing failure**: Returns 500 with descriptive error
- **Validation failure**: Returns 400 with validation details

### Frontend Handling

- Shows alert with error message
- Displays success/failure count after processing
- Disables upload button during processing
- Shows progress bar with percentage

---

## Security Considerations

1. **Authentication Required**: Upload endpoint requires valid JWT token
2. **File Type Validation**: Only PDF, DOC, DOCX allowed
3. **File Size Limit**: Maximum 10MB
4. **Temporary Storage**: Files deleted immediately after processing
5. **User Ownership**: Questions added to authenticated user's test

---

## Testing

### Manual Testing Steps

1. Create a test document following the sample format
2. Log in to the application
3. Navigate to a test's question management page
4. Click "Upload Document" button
5. Select your test file
6. Click "Upload & Extract"
7. Verify questions are added correctly

### Sample Test Files

Create test documents with:
- ✅ Valid format (should succeed)
- ❌ Missing question numbers (should fail)
- ❌ Missing answer choices (should fail)
- ✅ Multi-line questions (should succeed)
- ✅ Mix of 2-8 answer choices (should succeed)

---

## Troubleshooting

### Common Issues

#### 1. "Failed to extract text from PDF"
- **Cause**: PDF might be scanned image or encrypted
- **Solution**: Use OCR or re-create as text-based PDF

#### 2. "No questions found in document"
- **Cause**: Format doesn't match expected pattern
- **Solution**: Check numbering and lettering format

#### 3. "Question X: Must have at least 2 answer choices"
- **Cause**: Parser couldn't identify answer choices
- **Solution**: Ensure choices start with A., B., etc.

#### 4. Upload fails silently
- **Cause**: Backend not running or CORS issue
- **Solution**: Check server logs, verify server is running

---

## Future Enhancements

Potential improvements:
1. ✨ Support for images in questions
2. ✨ OCR for scanned documents
3. ✨ Batch file uploads
4. ✨ Preview before import
5. ✨ Custom parsing rules
6. ✨ Support for more file formats (TXT, RTF)
7. ✨ Duplicate question detection
8. ✨ Automatic correct answer detection (e.g., "Answer: C" in document)

---

## File Structure

```
server/
├── utils/
│   └── documentParser.js          # Core parsing logic
├── controllers/
│   └── uploadController.js        # Upload handling
├── routes/
│   └── uploadRoutes.js           # API routes
├── uploads/                       # Temporary file storage (gitignored)
├── DOCUMENT_UPLOAD_FEATURE.md    # This file
└── SAMPLE_DOCUMENT_FORMAT.md     # Format examples

src/
├── services/
│   └── api.js                    # Frontend API (uploadApi added)
└── views/
    └── QuestionManagementView.vue # Upload UI
```

---

## Dependencies

### Backend
```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.8.0",
  "multer": "^1.4.5-lts.1"
}
```

### Frontend
- No additional dependencies (uses native FormData API)

---

## Support

For issues or questions:
1. Check `SAMPLE_DOCUMENT_FORMAT.md` for format examples
2. Review server logs for detailed error messages
3. Verify file format matches expected pattern
4. Test with sample documents first

---

## License

Part of the TQ Randomization System v3.


