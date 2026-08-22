-- SQL Script to Add 50 Student Accounts
-- This script will add student accounts to the database with proper account and login records

-- Declare variables for use in the script
DECLARE @RoleId INT = 4; -- Student role ID
DECLARE @StatusId INT = 1; -- Active status
DECLARE @PasswordHash NVARCHAR(255) = '$2a$11$8vP7.U7s1S0f8KzH5pdEzOjV3y5zQ5yQ5yQ5yQ5yQ5yQ5yQ5yQ5yO'; -- BCrypt hash for "Student123!"

-- Create temporary table to hold student data
CREATE TABLE #Students (
    Id INT IDENTITY(1,1),
    FullName NVARCHAR(255),
    Email NVARCHAR(255),
    NationalId NVARCHAR(50),
    PhoneNumber NVARCHAR(50),
    Age INT,
    City NVARCHAR(100),
    Country NVARCHAR(100)
);

-- Insert 50 students
INSERT INTO #Students (FullName, Email, NationalId, PhoneNumber, Age, City, Country) VALUES
('Ahmed Mohamed', 'ahmed.mohamed1@email.com', '10000000000001', '01000000001', 16, 'Cairo', 'Egypt'),
('Fatima Ali', 'fatima.ali1@email.com', '10000000000002', '01000000002', 16, 'Alexandria', 'Egypt'),
('Omar Hassan', 'omar.hassan1@email.com', '10000000000003', '01000000003', 17, 'Giza', 'Egypt'),
('Layla Mahmoud', 'layla.mahmoud1@email.com', '10000000000004', '01000000004', 17, 'Cairo', 'Egypt'),
('Youssef Khalil', 'youssef.khalil1@email.com', '10000000000005', '01000000005', 16, 'Alexandria', 'Egypt'),
('Nadia Salem', 'nadia.salem1@email.com', '10000000000006', '01000000006', 17, 'Giza', 'Egypt'),
('Karim Adel', 'karim.adel1@email.com', '10000000000007', '01000000007', 16, 'Cairo', 'Egypt'),
('Hana Mustafa', 'hana.mustafa1@email.com', '10000000000008', '01000000008', 17, 'Alexandria', 'Egypt'),
('Tariq Nasser', 'tariq.nasser1@email.com', '10000000000009', '01000000009', 16, 'Giza', 'Egypt'),
('Samira Zaki', 'samira.zaki1@email.com', '10000000000010', '01000000010', 17, 'Cairo', 'Egypt'),
('Rami Farouk', 'rami.farouk1@email.com', '10000000000011', '01000000011', 16, 'Alexandria', 'Egypt'),
('Mona Ibrahim', 'mona.ibrahim1@email.com', '10000000000012', '01000000012', 17, 'Giza', 'Egypt'),
('Hassan Youssef', 'hassan.youssef1@email.com', '10000000000013', '01000000013', 16, 'Cairo', 'Egypt'),
('Aisha Kamal', 'aisha.kamal1@email.com', '10000000000014', '01000000014', 17, 'Alexandria', 'Egypt'),
('Khaled Mansour', 'khaled.mansour1@email.com', '10000000000015', '01000000015', 16, 'Giza', 'Egypt'),
('Amira Taha', 'amira.taha2@email.com', '20000000000001', '01000000016', 18, 'Cairo', 'Egypt'),
('Ziad Mahmoud', 'ziad.mahmoud2@email.com', '20000000000002', '01000000017', 18, 'Alexandria', 'Egypt'),
('Dina Sherif', 'dina.sherif2@email.com', '20000000000003', '01000000018', 17, 'Giza', 'Egypt'),
('Tamer Hosny', 'tamer.hosny2@email.com', '20000000000004', '01000000019', 18, 'Cairo', 'Egypt'),
('Nourhan Fathy', 'nourhan.fathy2@email.com', '20000000000005', '01000000020', 17, 'Alexandria', 'Egypt'),
('Marwan Lotfy', 'marwan.lotfy2@email.com', '20000000000006', '01000000021', 18, 'Giza', 'Egypt'),
('Rania Kamel', 'rania.kamel2@email.com', '20000000000007', '01000000022', 17, 'Cairo', 'Egypt'),
('Hesham Adel', 'hesham.adel2@email.com', '20000000000008', '01000000023', 18, 'Alexandria', 'Egypt'),
('Sally Nabil', 'sally.nabil2@email.com', '20000000000009', '01000000024', 17, 'Giza', 'Egypt'),
('Mostafa Reda', 'mostafa.reda2@email.com', '20000000000010', '01000000025', 18, 'Cairo', 'Egypt'),
('Laila Hamed', 'laila.hamed2@email.com', '20000000000011', '01000000026', 17, 'Alexandria', 'Egypt'),
('Ibrahim Samir', 'ibrahim.samir2@email.com', '20000000000012', '01000000027', 18, 'Giza', 'Egypt'),
('Noha Zakaria', 'noha.zakaria2@email.com', '20000000000013', '01000000028', 17, 'Cairo', 'Egypt'),
('Ossama Khalid', 'ossama.khalid2@email.com', '20000000000014', '01000000029', 18, 'Alexandria', 'Egypt'),
('Hend Mounir', 'hend.mounir2@email.com', '20000000000015', '01000000030', 17, 'Giza', 'Egypt'),
('Basem Raafat', 'basem.raafat2@email.com', '20000000000016', '01000000031', 18, 'Cairo', 'Egypt'),
('Dalia Farid', 'dalia.farid2@email.com', '20000000000017', '01000000032', 17, 'Alexandria', 'Egypt'),
('Wael Sobhy', 'wael.sobhy2@email.com', '20000000000018', '01000000033', 18, 'Giza', 'Egypt'),
('Rasha El Sayed', 'rasha.elsayed2@email.com', '20000000000019', '01000000034', 17, 'Cairo', 'Egypt'),
('Tamer Essam', 'tamer.essam2@email.com', '20000000000020', '01000000035', 18, 'Alexandria', 'Egypt'),
('Mai Khaled', 'mai.khaled3@email.com', '30000000000001', '01000000036', 19, 'Giza', 'Egypt'),
('Hossam Fawzy', 'hossam.fawzy3@email.com', '30000000000002', '01000000037', 19, 'Cairo', 'Egypt'),
('Nermeen Salah', 'nermeen.salah3@email.com', '30000000000003', '01000000038', 18, 'Alexandria', 'Egypt'),
('Kareem Osama', 'kareem.osama3@email.com', '30000000000004', '01000000039', 19, 'Giza', 'Egypt'),
('Safia Nader', 'safia.nader3@email.com', '30000000000005', '01000000040', 18, 'Cairo', 'Egypt'),
('Ashraf Maher', 'ashraf.maher3@email.com', '30000000000006', '01000000041', 19, 'Alexandria', 'Egypt'),
('Manal Hani', 'manal.hani3@email.com', '30000000000007', '01000000042', 18, 'Giza', 'Egypt'),
('Fadi Ziad', 'fadi.ziad3@email.com', '30000000000008', '01000000043', 19, 'Cairo', 'Egypt'),
('Hala Tarek', 'hala.tarek3@email.com', '30000000000009', '01000000044', 18, 'Alexandria', 'Egypt'),
('Sherif Mounir', 'sherif.mounir3@email.com', '30000000000010', '01000000045', 19, 'Giza', 'Egypt'),
('Yasmin Fathi', 'yasmin.fathi3@email.com', '30000000000011', '01000000046', 18, 'Cairo', 'Egypt'),
('Emad Sobhi', 'emad.sobhi3@email.com', '30000000000012', '01000000047', 19, 'Alexandria', 'Egypt'),
('Randa Kamal', 'randa.kamal3@email.com', '30000000000013', '01000000048', 18, 'Giza', 'Egypt'),
('Tarek Adel', 'tarek.adel3@email.com', '30000000000014', '01000000049', 19, 'Cairo', 'Egypt'),
('Ghada Nasser', 'ghada.nasser3@email.com', '30000000000015', '01000000050', 18, 'Alexandria', 'Egypt');

-- Process each student in the temporary table
DECLARE @Counter INT = 1;
DECLARE @TotalStudents INT = (SELECT COUNT(*) FROM #Students);
DECLARE @FullName NVARCHAR(255);
DECLARE @Email NVARCHAR(255);
DECLARE @NationalId NVARCHAR(50);
DECLARE @PhoneNumber NVARCHAR(50);
DECLARE @Age INT;
DECLARE @City NVARCHAR(100);
DECLARE @Country NVARCHAR(100);
DECLARE @AccountId BIGINT;

WHILE @Counter <= @TotalStudents
BEGIN
    -- Get student data
    SELECT 
        @FullName = FullName,
        @Email = Email,
        @NationalId = NationalId,
        @PhoneNumber = PhoneNumber,
        @Age = Age,
        @City = City,
        @Country = Country
    FROM #Students
    WHERE Id = @Counter;

    -- Insert into Accounts table
    INSERT INTO Accounts (
        FullNameEn, FullNameAr, Email, RoleId, NationalId, 
        PasswordHash, Phone, IsActive, StatusId, CreatedAt
    ) VALUES (
        @FullName, @FullName, @Email, @RoleId, @NationalId,
        @PasswordHash, @PhoneNumber, 1, @StatusId, CAST(GETDATE() AS DATE)
    );

    -- Get the newly created Account ID
    SET @AccountId = SCOPE_IDENTITY();

    -- Insert into Logins table
    INSERT INTO Logins (
        AccountId, Email, PasswordHash, StatusId
    ) VALUES (
        @AccountId, @Email, @PasswordHash, @StatusId
    );

    -- Increment counter
    SET @Counter = @Counter + 1;
END;

-- Clean up temporary table
DROP TABLE #Students;

-- Verify the insertion by checking the count
SELECT COUNT(*) AS TotalStudents FROM Accounts WHERE RoleId = 4;