SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.StudentExamResult', 'ExamIQScore') IS NULL
BEGIN
    ALTER TABLE dbo.StudentExamResult
        ADD ExamIQScore int NULL;
END;

IF OBJECT_ID('dbo.CK_StudentExamResult_ArabicScore', 'C') IS NOT NULL
    ALTER TABLE dbo.StudentExamResult DROP CONSTRAINT CK_StudentExamResult_ArabicScore;

IF OBJECT_ID('dbo.CK_StudentExamResult_EnglishScore', 'C') IS NOT NULL
    ALTER TABLE dbo.StudentExamResult DROP CONSTRAINT CK_StudentExamResult_EnglishScore;

IF OBJECT_ID('dbo.CK_StudentExamResult_MathScore', 'C') IS NOT NULL
    ALTER TABLE dbo.StudentExamResult DROP CONSTRAINT CK_StudentExamResult_MathScore;

IF OBJECT_ID('dbo.CK_StudentExamResult_SoftwareScore', 'C') IS NOT NULL
    ALTER TABLE dbo.StudentExamResult DROP CONSTRAINT CK_StudentExamResult_SoftwareScore;

IF OBJECT_ID('dbo.CK_StudentExamResult_IQScore', 'C') IS NOT NULL
    ALTER TABLE dbo.StudentExamResult DROP CONSTRAINT CK_StudentExamResult_IQScore;

ALTER TABLE dbo.StudentExamResult WITH CHECK
    ADD CONSTRAINT CK_StudentExamResult_ArabicScore
        CHECK (ExamArabicScore >= 0);

ALTER TABLE dbo.StudentExamResult WITH CHECK
    ADD CONSTRAINT CK_StudentExamResult_EnglishScore
        CHECK (ExamEnglishScore >= 0);

ALTER TABLE dbo.StudentExamResult WITH CHECK
    ADD CONSTRAINT CK_StudentExamResult_MathScore
        CHECK (ExamMathScore >= 0);

ALTER TABLE dbo.StudentExamResult WITH CHECK
    ADD CONSTRAINT CK_StudentExamResult_SoftwareScore
        CHECK (ExamSoftwareScore >= 0);

ALTER TABLE dbo.StudentExamResult WITH CHECK
    ADD CONSTRAINT CK_StudentExamResult_IQScore
        CHECK (ExamIQScore IS NULL OR ExamIQScore >= 0);

IF NOT EXISTS (
    SELECT 1
    FROM dbo.Section
    WHERE SectionName = 'IQ'
)
BEGIN
    INSERT INTO dbo.Section (SectionName)
    VALUES ('IQ');
END;

COMMIT TRANSACTION;
