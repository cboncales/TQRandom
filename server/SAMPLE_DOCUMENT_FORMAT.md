# Sample Document Format for Question Upload

This document shows the expected format for PDF or DOCX files when uploading questions.

## Format Rules

1. **Questions** must start with a number followed by a dot or parenthesis
   - Examples: `1.` or `1)`

2. **Answer choices** must start with a letter (A-H) followed by a dot or parenthesis
   - Examples: `A.` or `A)`

3. **Multi-line questions** are supported (text continues until an answer choice or new question is found)

4. **Blank lines** are automatically skipped

---

## Sample Format

```
1. What is the capital of France?
A. Berlin
B. Madrid
C. Paris
D. Rome

2. Which planet is known as the Red Planet?
A. Venus
B. Mars
C. Jupiter
D. Saturn

3. What is the largest ocean on Earth?
A. Atlantic Ocean
B. Indian Ocean
C. Arctic Ocean
D. Pacific Ocean

4. Who painted the Mona Lisa?
A. Vincent van Gogh
B. Leonardo da Vinci
C. Pablo Picasso
D. Michelangelo

5. What is the smallest prime number?
A. 0
B. 1
C. 2
D. 3
```

---

## Alternative Format (with parentheses)

```
1) What is the chemical symbol for gold?
A) Au
B) Ag
C) Fe
D) Cu

2) How many continents are there?
A) 5
B) 6
C) 7
D) 8
```

---

## Multi-line Question Example

```
1. Which of the following statements best describes
the process of photosynthesis in plants?
A. Plants absorb oxygen and release carbon dioxide
B. Plants convert light energy into chemical energy
C. Plants break down glucose for energy
D. Plants absorb nutrients from the soil only

2. What year did World War II end?
A. 1943
B. 1944
C. 1945
D. 1946
```

---

## Important Notes

- The parser automatically trims whitespace
- Questions can have 2-8 answer choices (A-H)
- Each question must have at least 2 answer choices
- Questions are numbered sequentially (1, 2, 3, ...)
- Answer choices must immediately follow the question

---

## Tips for Best Results

1. ✅ Use consistent formatting throughout the document
2. ✅ Ensure each question has a unique number
3. ✅ Always use letters (A, B, C, D...) for answer choices
4. ✅ Keep answer choices on separate lines
5. ❌ Avoid mixing formats (dots and parentheses) in the same document
6. ❌ Don't skip question numbers
7. ❌ Don't use special characters in question numbers

---

## File Requirements

- **Supported formats**: PDF (.pdf), Word (.doc, .docx)
- **Maximum file size**: 10MB
- **Encoding**: UTF-8 (recommended)

---

## Answer Key Feature

When uploading a document, you can optionally provide an answer key to automatically set the correct answers for each question.

### Answer Key Format

Paste your answer key in the "Answer Key (Optional)" field using this format:

```
1. A
2. C
3. A
4. C
5. C
6. A
7. B
8. D
9. B
10. C
```

### Supported Formats

The answer key parser accepts multiple formats:
- `1. A` (number, dot, letter)
- `1) A` (number, parenthesis, letter)
- `1 A` (number, space, letter)
- `1: A` (number, colon, letter)

### Requirements

- One answer per line
- Question numbers should match the order in your document
- Letters A-H are supported (for questions with up to 8 answer choices)
- Blank lines are ignored
- Case insensitive (both "a" and "A" work)

### Example

If your document has 30 questions and you paste this answer key:

```
1. A
2. C
3. A
4. C
5. C
6. A
7. B
8. D
9. B
10. C
11. B
12. B
13. B
14. A
15. B
16. B
17. B
18. D
19. A
20. A
21. A
22. B
23. B
24. C
25. A
26. C
27. C
28. A
29. A
30. A
```

The system will:
1. Upload and parse your document (extracting 30 questions)
2. Create all 30 questions in the database
3. Automatically set the correct answer for each question based on your answer key
4. Show a summary: "Successfully added: 30 questions, Correct answers set: 30"

### Benefits

- ✅ Saves time - no need to manually set each correct answer
- ✅ Reduces errors - copy/paste from your answer key
- ✅ Works with any number of questions
- ✅ Optional - you can still upload without an answer key


