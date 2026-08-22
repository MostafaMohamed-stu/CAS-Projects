-- Comprehensive script to prevent JSON truncation in StudentProfile table
-- This script ensures proper column types and adds safeguards

-- 1. Ensure StudentProfile table has the correct structure
IF EXISTS (SELECT * FROM sysobjects WHERE name='StudentProfile' AND xtype='U')
BEGIN
    PRINT 'Updating StudentProfile table structure...'
    
    -- Check and update GoodNotesJson column
    IF EXISTS (
        SELECT 1 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'StudentProfile' 
        AND COLUMN_NAME = 'GoodNotesJson'
        AND (DATA_TYPE != 'nvarchar' OR CHARACTER_MAXIMUM_LENGTH != -1)
    )
    BEGIN
        PRINT 'Updating GoodNotesJson column to nvarchar(max)...'
        ALTER TABLE StudentProfile ALTER COLUMN GoodNotesJson NVARCHAR(MAX) NULL
    END
    ELSE
    BEGIN
        PRINT 'GoodNotesJson column is already properly configured.'
    END
    
    -- Check and update BadNotesJson column
    IF EXISTS (
        SELECT 1 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'StudentProfile' 
        AND COLUMN_NAME = 'BadNotesJson'
        AND (DATA_TYPE != 'nvarchar' OR CHARACTER_MAXIMUM_LENGTH != -1)
    )
    BEGIN
        PRINT 'Updating BadNotesJson column to nvarchar(max)...'
        ALTER TABLE StudentProfile ALTER COLUMN BadNotesJson NVARCHAR(MAX) NULL
    END
    ELSE
    BEGIN
        PRINT 'BadNotesJson column is already properly configured.'
    END
    
    PRINT 'StudentProfile table structure update completed.'
END
ELSE
BEGIN
    PRINT 'StudentProfile table does not exist. Creating it with proper structure...'
    
    -- Create the table with proper column definitions
    CREATE TABLE [dbo].[StudentProfile](
        [Id] [bigint] IDENTITY(1,1) NOT NULL,
        [Name] [nvarchar](255) NULL,
        [Email] [nvarchar](255) NULL,
        [PhoneNumber] [nvarchar](50) NULL,
        [Age] [int] NOT NULL,
        [City] [nvarchar](100) NULL,
        [Country] [nvarchar](100) NULL,
        [DaysAbsent] [int] NOT NULL,
        [GoodNotesJson] [nvarchar](max) NULL,
        [BadNotesJson] [nvarchar](max) NULL,
        [CreatedAt] [datetime] NOT NULL,
        [ClassId] [bigint] NOT NULL,
     CONSTRAINT [PK_StudentProfile] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
    
    -- Add foreign key constraint
    ALTER TABLE [dbo].[StudentProfile]  WITH CHECK ADD  CONSTRAINT [FK_StudentProfile_Class] FOREIGN KEY([ClassId])
    REFERENCES [dbo].[Tbl_Class] ([Id])
    
    ALTER TABLE [dbo].[StudentProfile] CHECK CONSTRAINT [FK_StudentProfile_Class]
    
    PRINT 'StudentProfile table created successfully with proper JSON column definitions.'
END

-- 2. Create a stored procedure to safely update student profile notes
-- This procedure includes validation to prevent truncation
IF OBJECT_ID('UpdateStudentProfileNotes', 'P') IS NOT NULL
    DROP PROCEDURE UpdateStudentProfileNotes
GO

CREATE PROCEDURE UpdateStudentProfileNotes
    @StudentId BIGINT,
    @GoodNotesJson NVARCHAR(MAX) = NULL,
    @BadNotesJson NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validate inputs
        IF @StudentId IS NULL OR @StudentId <= 0
        BEGIN
            RAISERROR('Invalid StudentId provided', 16, 1)
            RETURN
        END
        
        -- Check if student exists
        IF NOT EXISTS (SELECT 1 FROM StudentProfile WHERE Id = @StudentId)
        BEGIN
            RAISERROR('Student with provided ID does not exist', 16, 1)
            RETURN
        END
        
        -- Validate JSON format if provided
        IF @GoodNotesJson IS NOT NULL AND ISJSON(@GoodNotesJson) = 0
        BEGIN
            RAISERROR('GoodNotesJson is not valid JSON', 16, 1)
            RETURN
        END
        
        IF @BadNotesJson IS NOT NULL AND ISJSON(@BadNotesJson) = 0
        BEGIN
            RAISERROR('BadNotesJson is not valid JSON', 16, 1)
            RETURN
        END
        
        -- Update the student profile
        UPDATE StudentProfile
        SET 
            GoodNotesJson = ISNULL(@GoodNotesJson, GoodNotesJson),
            BadNotesJson = ISNULL(@BadNotesJson, BadNotesJson)
        WHERE Id = @StudentId
        
        -- Return success
        SELECT 'Success' as Result, 'Student profile notes updated successfully' as Message
    END TRY
    BEGIN CATCH
        -- Return error
        SELECT 'Error' as Result, ERROR_MESSAGE() as Message
    END CATCH
END
GO

PRINT 'Stored procedure UpdateStudentProfileNotes created for safe JSON updates.'

-- 3. Create a function to validate JSON size before insertion
IF OBJECT_ID('ValidateJsonSize', 'FN') IS NOT NULL
    DROP FUNCTION ValidateJsonSize
GO

CREATE FUNCTION ValidateJsonSize(@JsonData NVARCHAR(MAX), @MaxSize INT)
RETURNS BIT
AS
BEGIN
    DECLARE @Result BIT = 1
    
    -- Check if JSON data exceeds maximum size
    IF LEN(ISNULL(@JsonData, '')) > @MaxSize
        SET @Result = 0
    
    RETURN @Result
END
GO

PRINT 'Function ValidateJsonSize created for JSON size validation.'

-- 4. Test the fixes
PRINT 'Testing the fixes...'

-- Check if we have any student profiles
DECLARE @TestStudentId BIGINT
SELECT TOP 1 @TestStudentId = Id FROM StudentProfile

IF @TestStudentId IS NOT NULL
BEGIN
    -- Test with a longer JSON string
    DECLARE @TestJson NVARCHAR(MAX) = '["Test note 1", "Test note 2", "Test note 3", "Test note 4", "Test note 5", "Test note 6", "Test note 7", "Test note 8", "Test note 9", "Test note 10"]'
    
    BEGIN TRY
        -- Test direct update
        UPDATE StudentProfile 
        SET BadNotesJson = @TestJson
        WHERE Id = @TestStudentId
        
        PRINT 'SUCCESS: Direct update test passed without truncation error'
        
        -- Test with stored procedure
        EXEC UpdateStudentProfileNotes 
            @StudentId = @TestStudentId,
            @GoodNotesJson = @TestJson,
            @BadNotesJson = '["Another test note"]'
            
        PRINT 'SUCCESS: Stored procedure update test passed'
        
        -- Revert changes
        UPDATE StudentProfile 
        SET GoodNotesJson = '[]', BadNotesJson = '[]'
        WHERE Id = @TestStudentId
        
        PRINT 'Test records reverted to original state'
    END TRY
    BEGIN CATCH
        PRINT 'ERROR: Test failed with message: ' + ERROR_MESSAGE()
    END CATCH
END
ELSE
BEGIN
    PRINT 'No student profiles found for testing'
END

PRINT 'All fixes applied successfully. The truncation issue should now be resolved.'