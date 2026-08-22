namespace SchoolAdmission.DTOs;

public sealed class AdmissionFactorSettingDTO
{
    public bool Enabled { get; set; }
    public decimal Weight { get; set; }
}

public sealed class ExamSubjectWeightsDTO
{
    public decimal Arabic { get; set; }
    public decimal English { get; set; }
    public decimal Math { get; set; }
    public decimal Software { get; set; }
    public decimal Iq { get; set; }
}

public sealed class AdmissionSettingsDTO
{
    public long Id { get; set; }
    public int VersionNumber { get; set; }
    public string VersionName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public AdmissionFactorSettingDTO SchoolExam { get; set; } = new();
    public AdmissionFactorSettingDTO Interview { get; set; } = new();
    public AdmissionFactorSettingDTO PreparatoryCertificate { get; set; } = new();
    public AdmissionFactorSettingDTO MinistryExam { get; set; } = new();
    public ExamSubjectWeightsDTO SubjectWeights { get; set; } = new();
    public int QuestionsPerSection { get; set; }
    public bool RequireFullQuestionSet { get; set; }
    public int ExamDurationMinutes { get; set; }
}

public sealed class UpdateAdmissionSettingsDTO
{
    public AdmissionFactorSettingDTO SchoolExam { get; set; } = new();
    public AdmissionFactorSettingDTO Interview { get; set; } = new();
    public AdmissionFactorSettingDTO PreparatoryCertificate { get; set; } = new();
    public AdmissionFactorSettingDTO MinistryExam { get; set; } = new();
    public ExamSubjectWeightsDTO SubjectWeights { get; set; } = new();
    public int QuestionsPerSection { get; set; }
    public bool RequireFullQuestionSet { get; set; }
    public int ExamDurationMinutes { get; set; }
}
