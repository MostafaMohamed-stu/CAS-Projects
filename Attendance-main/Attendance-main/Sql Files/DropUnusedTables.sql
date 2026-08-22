-- ===================================================
-- Script to Drop Unused Tables
-- Tables: StudentExamAnswer, StudentExamResult, ExamQuestion, Section
-- Date: 2025-01-13
-- ===================================================

-- Drop tables in order to respect foreign key constraints
-- Drop StudentExamAnswer first (has FK to ExamQuestion)
IF OBJECT_ID('dbo.StudentExamAnswer', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table StudentExamAnswer...'
    DROP TABLE [dbo].[StudentExamAnswer]
    PRINT 'Table StudentExamAnswer dropped successfully.'
END
ELSE
BEGIN
    PRINT 'Table StudentExamAnswer does not exist.'
END

-- Drop StudentExamResult 
IF OBJECT_ID('dbo.StudentExamResult', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table StudentExamResult...'
    DROP TABLE [dbo].[StudentExamResult]
    PRINT 'Table StudentExamResult dropped successfully.'
END
ELSE
BEGIN
    PRINT 'Table StudentExamResult does not exist.'
END

-- Drop ExamQuestion (has FK to Section)
IF OBJECT_ID('dbo.ExamQuestion', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table ExamQuestion...'
    DROP TABLE [dbo].[ExamQuestion]
    PRINT 'Table ExamQuestion dropped successfully.'
END
ELSE
BEGIN
    PRINT 'Table ExamQuestion does not exist.'
END

-- Drop Section last
IF OBJECT_ID('dbo.Section', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table Section...'
    DROP TABLE [dbo].[Section]
    PRINT 'Table Section dropped successfully.'
END
ELSE
BEGIN
    PRINT 'Table Section does not exist.'
END

PRINT 'All unused tables have been successfully removed from the database.'