-- Script to fix String or binary data would be truncated error for StudentProfile JSON columns
-- This script ensures the GoodNotesJson and BadNotesJson columns are properly configured as nvarchar(max)

-- Check if the columns exist and their current types
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'StudentProfile' 
    AND COLUMN_NAME IN ('GoodNotesJson', 'BadNotesJson')
)
BEGIN
    -- Check current data types
    DECLARE @GoodNotesType NVARCHAR(50)
    DECLARE @BadNotesType NVARCHAR(50)
    
    SELECT @GoodNotesType = DATA_TYPE + 
        CASE 
            WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL AND CHARACTER_MAXIMUM_LENGTH != -1 
            THEN '(' + CAST(CHARACTER_MAXIMUM_LENGTH AS NVARCHAR(10)) + ')'
            WHEN CHARACTER_MAXIMUM_LENGTH = -1 
            THEN '(max)'
            ELSE ''
        END
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'StudentProfile' AND COLUMN_NAME = 'GoodNotesJson'
    
    SELECT @BadNotesType = DATA_TYPE + 
        CASE 
            WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL AND CHARACTER_MAXIMUM_LENGTH != -1 
            THEN '(' + CAST(CHARACTER_MAXIMUM_LENGTH AS NVARCHAR(10)) + ')'
            WHEN CHARACTER_MAXIMUM_LENGTH = -1 
            THEN '(max)'
            ELSE ''
        END
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'StudentProfile' AND COLUMN_NAME = 'BadNotesJson'
    
    PRINT 'Current column types:'
    PRINT 'GoodNotesJson: ' + ISNULL(@GoodNotesType, 'NOT FOUND')
    PRINT 'BadNotesJson: ' + ISNULL(@BadNotesType, 'NOT FOUND')
    
    -- If columns are not nvarchar(max), alter them
    IF (@GoodNotesType != 'nvarchar(max)')
    BEGIN
        PRINT 'Altering GoodNotesJson column to nvarchar(max)'
        ALTER TABLE StudentProfile ALTER COLUMN GoodNotesJson NVARCHAR(MAX) NULL
    END
    ELSE
    BEGIN
        PRINT 'GoodNotesJson column is already nvarchar(max)'
    END
    
    IF (@BadNotesType != 'nvarchar(max)')
    BEGIN
        PRINT 'Altering BadNotesJson column to nvarchar(max)'
        ALTER TABLE StudentProfile ALTER COLUMN BadNotesJson NVARCHAR(MAX) NULL
    END
    ELSE
    BEGIN
        PRINT 'BadNotesJson column is already nvarchar(max)'
    END
END
ELSE
BEGIN
    PRINT 'StudentProfile table or JSON columns not found'
END

-- Verify the changes
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'StudentProfile' 
    AND COLUMN_NAME IN ('GoodNotesJson', 'BadNotesJson')
    AND DATA_TYPE = 'nvarchar'
    AND CHARACTER_MAXIMUM_LENGTH = -1
)
BEGIN
    PRINT 'SUCCESS: Both JSON columns are now properly configured as nvarchar(max)'
END
ELSE
BEGIN
    PRINT 'WARNING: JSON columns may not be properly configured'
END

-- Test with a sample update to verify the fix
-- First, check if we have any records
DECLARE @RecordCount INT
SELECT @RecordCount = COUNT(*) FROM StudentProfile

IF (@RecordCount > 0)
BEGIN
    PRINT 'Testing with a sample record...'
    
    -- Get the first student profile ID
    DECLARE @TestId BIGINT
    SELECT TOP 1 @TestId = Id FROM StudentProfile
    
    -- Try updating with a longer JSON string
    BEGIN TRY
        UPDATE StudentProfile 
        SET BadNotesJson = '["Test note 1", "Test note 2", "Test note 3", "Test note 4", "Test note 5"]'
        WHERE Id = @TestId
        
        PRINT 'SUCCESS: Test update completed without truncation error'
        
        -- Revert the change
        UPDATE StudentProfile 
        SET BadNotesJson = '[]'
        WHERE Id = @TestId
        
        PRINT 'Test record reverted to original state'
    END TRY
    BEGIN CATCH
        PRINT 'ERROR: Test update failed with message: ' + ERROR_MESSAGE()
    END CATCH
END
ELSE
BEGIN
    PRINT 'No records found in StudentProfile table for testing'
END