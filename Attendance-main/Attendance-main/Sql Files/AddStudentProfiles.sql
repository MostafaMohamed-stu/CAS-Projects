-- SQL Script to Add Student Profiles for Existing Student Accounts
-- This script should be run after AddStudents.sql to create StudentProfile records

-- Create StudentProfile records for the students added by AddStudents.sql
-- We'll match students by email address

PRINT 'Creating StudentProfile records for existing students...'

-- Create a temporary table to hold student data with class assignments
CREATE TABLE #StudentProfileData (
    Email NVARCHAR(255),
    ClassId INT
);

-- Distribute students across classes (1-12)
-- We'll use a simple approach to assign classes based on student ID
INSERT INTO #StudentProfileData (Email, ClassId)
SELECT 
    a.Email,
    ((ROW_NUMBER() OVER (ORDER BY a.Id) % 12) + 1) AS ClassId
FROM Accounts a
WHERE a.RoleId = 4 -- Student role
AND NOT EXISTS (
    SELECT 1 FROM StudentProfile sp WHERE sp.Email = a.Email
);

-- Insert StudentProfile records for students without profiles
INSERT INTO StudentProfile (
    Name, 
    Email, 
    PhoneNumber, 
    Age, 
    City, 
    Country, 
    DaysAbsent, 
    GoodNotesJson, 
    BadNotesJson, 
    CreatedAt, 
    ClassId
)
SELECT 
    a.FullNameEn AS Name,
    a.Email,
    a.Phone AS PhoneNumber,
    CASE 
        WHEN spd.ClassId IN (1, 2, 3, 4) THEN 16  -- Junior classes
        WHEN spd.ClassId IN (5, 6, 7, 8) THEN 17   -- Wheeler classes
        ELSE 18  -- Senior classes
    END AS Age,
    CASE (spd.ClassId % 3)
        WHEN 1 THEN 'Cairo'
        WHEN 2 THEN 'Alexandria'
        ELSE 'Giza'
    END AS City,
    'Egypt' AS Country,
    0 AS DaysAbsent,
    '[]' AS GoodNotesJson,
    '[]' AS BadNotesJson,
    GETDATE() AS CreatedAt,
    spd.ClassId
FROM Accounts a
JOIN #StudentProfileData spd ON a.Email = spd.Email
WHERE a.RoleId = 4 -- Student role
AND NOT EXISTS (
    SELECT 1 FROM StudentProfile sp WHERE sp.Email = a.Email
);

-- Clean up temporary table
DROP TABLE #StudentProfileData;

-- Verify the insertion
DECLARE @ProfileCount INT = (SELECT COUNT(*) FROM StudentProfile);
DECLARE @AccountCount INT = (SELECT COUNT(*) FROM Accounts WHERE RoleId = 4);

PRINT 'StudentProfile records created successfully.'
PRINT 'Total Student Profiles: ' + CAST(@ProfileCount AS NVARCHAR(10))
PRINT 'Total Student Accounts: ' + CAST(@AccountCount AS NVARCHAR(10))

-- Show a sample of the created profiles
SELECT TOP 10
    sp.Id,
    sp.Name,
    sp.Email,
    sp.Age,
    sp.City,
    sp.Country,
    sp.DaysAbsent,
    c.ClassName,
    g.GradeName
FROM StudentProfile sp
JOIN Tbl_Class c ON sp.ClassId = c.Id
JOIN Grade g ON c.GradeId = g.Id
ORDER BY sp.Id;

PRINT 'Script completed successfully.'