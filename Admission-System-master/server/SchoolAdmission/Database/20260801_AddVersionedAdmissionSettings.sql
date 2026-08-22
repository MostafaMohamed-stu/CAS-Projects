SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.AdmissionSettingsVersion', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.AdmissionSettingsVersion
        (
            Id bigint IDENTITY(1,1) NOT NULL
                CONSTRAINT PK_AdmissionSettingsVersion PRIMARY KEY,
            VersionNumber int NOT NULL,
            VersionName nvarchar(150) NOT NULL,
            IsActive bit NOT NULL,

            SchoolExamEnabled bit NOT NULL,
            SchoolExamWeight int NOT NULL,
            InterviewEnabled bit NOT NULL,
            InterviewWeight int NOT NULL,
            PreparatoryCertificateEnabled bit NOT NULL,
            PreparatoryCertificateWeight int NOT NULL,
            MinistryExamEnabled bit NOT NULL,
            MinistryExamWeight int NOT NULL,

            ArabicWeight int NOT NULL,
            EnglishWeight int NOT NULL,
            MathWeight int NOT NULL,
            SoftwareWeight int NOT NULL,
            IqWeight int NOT NULL,

            QuestionsPerSection int NOT NULL,
            RequireFullQuestionSet bit NOT NULL,
            ExamDurationMinutes int NOT NULL,
            CreatedAtUtc datetime2 NOT NULL,
            CreatedByAccountId bigint NULL
        );
    END;

    IF NOT EXISTS
    (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.AdmissionSettingsVersion')
          AND name = N'UX_AdmissionSettingsVersion_VersionNumber'
    )
    BEGIN
        CREATE UNIQUE INDEX UX_AdmissionSettingsVersion_VersionNumber
            ON dbo.AdmissionSettingsVersion(VersionNumber);
    END;

    IF NOT EXISTS
    (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.AdmissionSettingsVersion')
          AND name = N'UX_AdmissionSettingsVersion_OneActive'
    )
    BEGIN
        CREATE UNIQUE INDEX UX_AdmissionSettingsVersion_OneActive
            ON dbo.AdmissionSettingsVersion(IsActive)
            WHERE IsActive = 1;
    END;

    -- These immutable baselines preserve the formulas already used by completed students.
    IF NOT EXISTS (SELECT 1 FROM dbo.AdmissionSettingsVersion WHERE VersionNumber = 1)
    BEGIN
        INSERT dbo.AdmissionSettingsVersion
        (
            VersionNumber, VersionName, IsActive,
            SchoolExamEnabled, SchoolExamWeight, InterviewEnabled, InterviewWeight,
            PreparatoryCertificateEnabled, PreparatoryCertificateWeight,
            MinistryExamEnabled, MinistryExamWeight,
            ArabicWeight, EnglishWeight, MathWeight, SoftwareWeight, IqWeight,
            QuestionsPerSection, RequireFullQuestionSet, ExamDurationMinutes,
            CreatedAtUtc, CreatedByAccountId
        )
        VALUES
        (
            1, N'Legacy pre-IQ baseline', 0,
            1, 60, 1, 40, 0, 0, 0, 0,
            15, 15, 15, 15, 0,
            10, 0, 60, SYSUTCDATETIME(), NULL
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.AdmissionSettingsVersion WHERE VersionNumber = 2)
    BEGIN
        INSERT dbo.AdmissionSettingsVersion
        (
            VersionNumber, VersionName, IsActive,
            SchoolExamEnabled, SchoolExamWeight, InterviewEnabled, InterviewWeight,
            PreparatoryCertificateEnabled, PreparatoryCertificateWeight,
            MinistryExamEnabled, MinistryExamWeight,
            ArabicWeight, EnglishWeight, MathWeight, SoftwareWeight, IqWeight,
            QuestionsPerSection, RequireFullQuestionSet, ExamDurationMinutes,
            CreatedAtUtc, CreatedByAccountId
        )
        VALUES
        (
            2, N'Original IQ baseline', 0,
            1, 60, 1, 40, 0, 0, 0, 0,
            15, 30, 30, 15, 10,
            10, 0, 60, SYSUTCDATETIME(), NULL
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.AdmissionSettingsVersion WHERE VersionNumber = 3)
    BEGIN
        INSERT dbo.AdmissionSettingsVersion
        (
            VersionNumber, VersionName, IsActive,
            SchoolExamEnabled, SchoolExamWeight, InterviewEnabled, InterviewWeight,
            PreparatoryCertificateEnabled, PreparatoryCertificateWeight,
            MinistryExamEnabled, MinistryExamWeight,
            ArabicWeight, EnglishWeight, MathWeight, SoftwareWeight, IqWeight,
            QuestionsPerSection, RequireFullQuestionSet, ExamDurationMinutes,
            CreatedAtUtc, CreatedByAccountId
        )
        VALUES
        (
            3, N'2027 default configuration',
            CASE WHEN EXISTS (SELECT 1 FROM dbo.AdmissionSettingsVersion WHERE IsActive = 1) THEN 0 ELSE 1 END,
            1, 60, 1, 40, 0, 0, 0, 0,
            15, 30, 30, 10, 15,
            10, 0, 60, SYSUTCDATETIME(), NULL
        );
    END;

    IF OBJECT_ID(N'dbo.StudentSettingsAssignment', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.StudentSettingsAssignment
        (
            AccountId bigint NOT NULL
                CONSTRAINT PK_StudentSettingsAssignment PRIMARY KEY,
            SettingsVersionId bigint NOT NULL,
            AssignedAtUtc datetime2 NOT NULL,
            ExamStartedAtUtc datetime2 NULL,
            ExtensionMinutes int NOT NULL CONSTRAINT DF_StudentSettingsAssignment_ExtensionMinutes DEFAULT (0),
            CONSTRAINT FK_StudentSettingsAssignment_Account
                FOREIGN KEY (AccountId) REFERENCES dbo.Account(Id) ON DELETE CASCADE,
            CONSTRAINT FK_StudentSettingsAssignment_SettingsVersion
                FOREIGN KEY (SettingsVersionId) REFERENCES dbo.AdmissionSettingsVersion(Id)
        );

        CREATE INDEX IX_StudentSettingsAssignment_SettingsVersionId
            ON dbo.StudentSettingsAssignment(SettingsVersionId);
    END;

    IF COL_LENGTH(N'dbo.StudentSettingsAssignment', N'ExamStartedAtUtc') IS NULL
        ALTER TABLE dbo.StudentSettingsAssignment ADD ExamStartedAtUtc datetime2 NULL;

    IF COL_LENGTH(N'dbo.StudentSettingsAssignment', N'ExtensionMinutes') IS NULL
        ALTER TABLE dbo.StudentSettingsAssignment ADD ExtensionMinutes int NOT NULL
            CONSTRAINT DF_StudentSettingsAssignment_ExtensionMinutes DEFAULT (0) WITH VALUES;

    -- Dynamic SQL keeps the script parse-safe if it is inspected before the IQ upgrade runs.
    IF COL_LENGTH(N'dbo.StudentExamResult', N'ExamIQScore') IS NOT NULL
    BEGIN
        EXEC sys.sp_executesql N'
            INSERT dbo.StudentSettingsAssignment (AccountId, SettingsVersionId, AssignedAtUtc)
            SELECT
                result.AccountId,
                settings.Id,
                SYSUTCDATETIME()
            FROM dbo.StudentExamResult AS result
            INNER JOIN dbo.AdmissionSettingsVersion AS settings
                ON settings.VersionNumber = CASE WHEN result.ExamIQScore IS NULL THEN 1 ELSE 2 END
            WHERE NOT EXISTS
            (
                SELECT 1
                FROM dbo.StudentSettingsAssignment AS assignment
                WHERE assignment.AccountId = result.AccountId
            );';
    END
    ELSE
    BEGIN
        INSERT dbo.StudentSettingsAssignment (AccountId, SettingsVersionId, AssignedAtUtc)
        SELECT result.AccountId, settings.Id, SYSUTCDATETIME()
        FROM dbo.StudentExamResult AS result
        CROSS JOIN dbo.AdmissionSettingsVersion AS settings
        WHERE settings.VersionNumber = 1
          AND NOT EXISTS
          (
              SELECT 1
              FROM dbo.StudentSettingsAssignment AS assignment
              WHERE assignment.AccountId = result.AccountId
          );
    END;

    -- An assignment is frozen only after the exam starts or completes. Remove stale
    -- validation-only assignments so unstarted students receive the current version.
    DELETE assignment
    FROM dbo.StudentSettingsAssignment AS assignment
    LEFT JOIN dbo.StudentExamResult AS result
        ON result.AccountId = assignment.AccountId
    WHERE result.AccountId IS NULL
      AND assignment.ExamStartedAtUtc IS NULL;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT VersionNumber, VersionName, IsActive, CreatedAtUtc
FROM dbo.AdmissionSettingsVersion
ORDER BY VersionNumber;

SELECT COUNT(*) AS PreservedCompletedStudentAssignments
FROM dbo.StudentSettingsAssignment;
