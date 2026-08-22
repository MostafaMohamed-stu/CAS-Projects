# File Upload Feature Guide for Teachers

## Overview
The quiz system now supports uploading questions from Excel files (.xlsx, .xls) and CSV files. This allows teachers to quickly import multiple questions instead of adding them one by one.

## How to Use

### 1. Accessing the File Upload Feature
- **In Question Bank Editor**: Click the "Upload File" button next to "Add Question"
- **In Quiz Editor**: Click the "Upload Questions File" button next to "Add Questions from Bank"

### 2. Supported File Formats
- **Excel (.xlsx)** - Recommended format
- **Excel (.xls)** - Legacy Excel format
- **CSV (.csv)** - Comma-separated values

### 3. Expected File Structure
Your Excel/CSV file should have the following columns:

| Column | Header | Description | Required |
|--------|--------|-------------|----------|
| A | Question Type | Type of question (MCQ, True/False, Fill Blank) | Yes |
| B | Question Text | The actual question | Yes |
| C | Correct Answer | The correct answer | Yes |
| D | Marks | Points for the question (defaults to 1) | No |
| E | Option A | First option for MCQ questions | No |
| F | Option B | Second option for MCQ questions | No |
| G | Option C | Third option for MCQ questions | No |
| H | Option D | Fourth option for MCQ questions | No |

### 4. Question Type Examples

#### Multiple Choice Questions (MCQ)
```
Question Type: MCQ
Question Text: What is 2 + 2?
Correct Answer: 4
Marks: 1
Option A: 4
Option B: 3
Option C: 5
Option D: 6
```

#### True/False Questions
```
Question Type: True/False
Question Text: The Earth is round.
Correct Answer: True
Marks: 1
```

#### Fill in the Blank Questions
```
Question Type: Fill Blank
Question Text: The capital of France is _____.
Correct Answer: Paris
Marks: 1
```

### 5. File Upload Process
1. **Click Upload Button**: Select "Upload File" or "Upload Questions File"
2. **Drag & Drop**: Drag your file onto the upload area, or click "browse files"
3. **File Processing**: The system will automatically parse your file
4. **Question Import**: Questions are automatically added to your question bank or quiz
5. **Success Confirmation**: You'll see a success message with the number of questions imported

### 6. Download Template
- Click "Download Template" to get a pre-formatted Excel file
- The template includes examples of all question types
- Use this as a starting point for your own questions

### 7. Tips for Best Results

#### File Preparation
- **Use the template**: Download and use the provided template for consistent formatting
- **Clear headers**: Make sure your first row contains the column headers exactly as shown
- **No empty rows**: Remove any completely empty rows from your file
- **Consistent formatting**: Use consistent text formatting (avoid mixed cases for question types)

#### Question Types
- **MCQ**: Provide at least 2 options, but 4 options are recommended
- **True/False**: Use "True" or "False" (case insensitive)
- **Fill Blank**: Use underscores or blanks in your question text

#### Data Quality
- **Avoid special characters**: Keep text simple to prevent parsing issues
- **Check spelling**: Ensure correct answers match exactly with options
- **Test with small files**: Start with a few questions to test the format

### 8. Troubleshooting

#### Common Issues
- **"No valid questions found"**: Check that your file has the correct column structure
- **"Error parsing the file"**: Ensure your file isn't corrupted and follows the expected format
- **Questions not importing correctly**: Verify that question types are spelled correctly

#### File Format Issues
- **Excel files**: Make sure they're saved in .xlsx or .xls format
- **CSV files**: Ensure proper comma separation and no extra commas in text
- **Encoding**: Use UTF-8 encoding for best compatibility

### 9. Example Files

#### Sample MCQ Questions
```
Question Type,Question Text,Correct Answer,Marks,Option A,Option B,Option C,Option D
MCQ,What is the capital of Egypt?,Cairo,1,Alexandria,Cairo,Giza,Luxor
MCQ,Which planet is closest to the Sun?,Mercury,1,Venus,Mercury,Earth,Mars
MCQ,What is 15 × 7?,105,1,98,105,112,119
```

#### Sample Mixed Questions
```
Question Type,Question Text,Correct Answer,Marks,Option A,Option B,Option C,Option D
MCQ,What is the largest ocean?,Pacific,1,Atlantic,Indian,Pacific,Arctic
True/False,The human body has 206 bones,True,1,,,,
Fill Blank,The chemical symbol for gold is _____,Au,1,,,,
MCQ,Which is a prime number?,7,1,4,6,7,8
```

## Benefits
- **Save Time**: Import dozens of questions in seconds
- **Consistency**: Maintain uniform question formatting
- **Bulk Operations**: Handle large question sets efficiently
- **Easy Sharing**: Share question banks with other teachers via files
- **Backup**: Keep backup copies of your questions in Excel format

## Support
If you encounter any issues with the file upload feature:
1. Check that your file follows the expected format
2. Try downloading and using the template
3. Ensure your file isn't corrupted
4. Contact technical support if problems persist

---

*This feature is designed to make question creation more efficient for teachers. With proper file formatting, you can quickly build comprehensive question banks and quizzes.*
