-- Data Migration Script
-- This script copies existing ExamId values to the new ExamDetailsID column
-- for records created before the schema change.

UPDATE StudentExamAnswer 
SET ExamDetailsID = ExamId 
WHERE ExamDetailsID IS NULL;

-- Verify migration
SELECT COUNT(*) as RowsToUpdate FROM StudentExamAnswer WHERE ExamDetailsID IS NULL;
SELECT TOP 10 * FROM StudentExamAnswer;
