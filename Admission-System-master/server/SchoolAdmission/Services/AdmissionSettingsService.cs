using System.Data;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Data;
using SchoolAdmission.DTOs;
using SchoolAdmission.Models;

namespace SchoolAdmission.Services;

public class AdmissionSettingsService
{
    private const decimal PreparatoryCertificateMaximum = 280m;
    private const decimal InterviewScoreMaximum = 40m;
    private const int ExpectedInterviewers = 3;

    private readonly SchoolAdmissionDbContext _db;

    public AdmissionSettingsService(SchoolAdmissionDbContext db)
    {
        _db = db;
    }

    public async Task<HubSettings> GetActiveAsync()
    {
        // Always use the last inserted row (highest Id) — no status filter.
        // Whenever a new row is inserted it automatically becomes the active config.
        var latest = await _db.HubSettings
            .AsNoTracking()
            .OrderByDescending(settings => settings.Id)
            .FirstOrDefaultAsync();

        return latest ?? CreateDefaultHubSettings();
    }

    public async Task<ExamTiming> StartOrResumeExamAsync(long accountId)
    {
        var activeSettings = await GetActiveAsync();
        var result = await _db.StudentExamResults
            .FirstOrDefaultAsync(item => item.AccountId == accountId);

        if (result?.ExamStartedAtUtc.HasValue == true)
            return BuildExamTiming(result, activeSettings);

        var startedAtUtc = DateTime.UtcNow;

        if (result == null)
        {
            result = new StudentExamResult
            {
                AccountId = accountId,
                ExamArabicScore = 0,
                ExamEnglishScore = 0,
                ExamMathScore = 0,
                ExamSoftwareScore = 0,
                ExamIqScore = null,
                ExamStartedAtUtc = startedAtUtc,
                ExtensionMinutes = 0
            };
            _db.StudentExamResults.Add(result);
        }
        else
        {
            result.ExamStartedAtUtc = startedAtUtc;
            result.ExtensionMinutes = 0;
        }

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            _db.ChangeTracker.Clear();
            result = await _db.StudentExamResults
                .AsNoTracking()
                .SingleOrDefaultAsync(item => item.AccountId == accountId);
        }

        return BuildExamTiming(result ?? new StudentExamResult
        {
            AccountId = accountId,
            ExamStartedAtUtc = startedAtUtc,
            ExtensionMinutes = 0
        }, activeSettings);
    }

    public async Task<ExamTiming> GrantExtensionAsync(long accountId, int extensionMinutes)
    {
        if (extensionMinutes < 1 || extensionMinutes > 60)
            throw new ArgumentException("Extension minutes must be between 1 and 60.");

        var activeSettings = await GetActiveAsync();
        var result = await _db.StudentExamResults
            .FirstOrDefaultAsync(item => item.AccountId == accountId);

        if (result == null || !result.ExamStartedAtUtc.HasValue)
            throw new InvalidOperationException("The student has not started an exam session.");

        result.ExtensionMinutes = (result.ExtensionMinutes ?? 0) + extensionMinutes;
        await _db.SaveChangesAsync();
        return BuildExamTiming(result, activeSettings);
    }

    public async Task<HubSettings> GetForStudentAsync(
        long accountId,
        StudentExamResult? result = null)
    {
        return await GetActiveAsync();
    }

    public async Task<HubSettings> GetForExamValidationAsync(long accountId)
    {
        return await GetActiveAsync();
    }

    public async Task<ExamTiming?> GetCurrentExamTimingAsync(long accountId)
    {
        var activeSettings = await GetActiveAsync();
        var result = await _db.StudentExamResults
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.AccountId == accountId && item.ExamStartedAtUtc != null);

        return result == null ? null : BuildExamTiming(result, activeSettings);
    }

    public async Task<HubSettings> CreateVersionAsync(
        UpdateAdmissionSettingsDTO request,
        long createdByAccountId)
    {
        Validate(request);

        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var currentVersions = await _db.HubSettings.ToListAsync();
        foreach (var version in currentVersions.Where(version => version.SettingStatusId == 1))
            version.SettingStatusId = 2; // Deactivate

        await _db.SaveChangesAsync();

        var nextVersionNumber = currentVersions.Count == 0
            ? 1
            : currentVersions.Max(version => version.VersionNumber) + 1;

        var settings = new HubSettings
        {
            VersionNumber = nextVersionNumber,
            VersionName = $"SuperAdmin configuration v{nextVersionNumber}",
            SettingStatusId = 1,
            SchoolExamWeight = request.SchoolExam.Weight,
            InterviewWeight = request.Interview.Weight,
            PreparatoryCertificateWeight = request.PreparatoryCertificate.Weight,
            MinistryExamWeight = request.MinistryExam.Weight,
            ArabicWeight = request.SubjectWeights.Arabic,
            EnglishWeight = request.SubjectWeights.English,
            MathWeight = request.SubjectWeights.Math,
            SoftwareWeight = request.SubjectWeights.Software,
            IqWeight = request.SubjectWeights.Iq,
            QuestionsPerSection = request.QuestionsPerSection,
            RequireFullQuestionSet = request.RequireFullQuestionSet ? 1 : 0,
            ExamDurationMinutes = request.ExamDurationMinutes,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByAccountId = createdByAccountId
        };

        _db.HubSettings.Add(settings);
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
        return settings;
    }

    public static void Validate(UpdateAdmissionSettingsDTO request)
    {
        if (request.QuestionsPerSection < 1)
            throw new ArgumentException("Questions per section must be at least 1.");
        if (request.ExamDurationMinutes < 1)
            throw new ArgumentException("Exam duration must be at least 1 minute.");

        var factors = new[]
        {
            request.SchoolExam,
            request.Interview,
            request.PreparatoryCertificate,
            request.MinistryExam
        };
        if (factors.Any(factor => factor.Weight < 0))
            throw new ArgumentException("Factor weights cannot be negative.");
        if (factors.Sum(factor => factor.Weight) != 100m)
            throw new ArgumentException("Total factor weights must add up to exactly 100%.");

        var subjectWeights = new[]
        {
            request.SubjectWeights.Arabic,
            request.SubjectWeights.English,
            request.SubjectWeights.Math,
            request.SubjectWeights.Software,
            request.SubjectWeights.Iq
        };
        if (subjectWeights.Any(weight => weight < 0))
            throw new ArgumentException("School exam subject weights cannot be negative.");
        if (subjectWeights.Sum() != 100m)
            throw new ArgumentException("School exam subject weights must add up to exactly 100%.");
    }

    public static decimal GetExamMaximum(HubSettings settings)
        => settings.ArabicWeight + settings.EnglishWeight + settings.MathWeight +
           settings.SoftwareWeight + settings.IqWeight;

    public static int GetExamTotal(StudentExamResult? result) => ExamScoring.GetTotal(result);

    public static double GetExamPercentage(
        StudentExamResult? result,
        HubSettings settings)
    {
        var maximum = (double)GetExamMaximum(settings);
        return result == null || maximum <= 0
            ? 0
            : Math.Round((double)GetExamTotal(result) * 100 / maximum, 2);
    }

    public static double GetTotalPercentage(
        StudentExamResult? result,
        AdmissionProfile? profile,
        IEnumerable<decimal>? interviewScores,
        HubSettings settings)
    {
        var scores = interviewScores?.ToList() ?? new List<decimal>();
        var hasInterviewScores = scores.Count > 0;

        // Calculate earned scores for the non-interview factors
        var schoolScore = settings.SchoolExamWeight > 0
            ? GetExamPercentage(result, settings) * (double)settings.SchoolExamWeight / 100d
            : 0d;

        var prepScore = settings.PreparatoryCertificateWeight > 0
            ? (double)((profile?.ThirdPrepScore ?? 0m) * 100m / PreparatoryCertificateMaximum) * (double)settings.PreparatoryCertificateWeight / 100d
            : 0d;

        var ministryScore = settings.MinistryExamWeight > 0
            ? (double)(profile?.MinistryExamPercentage ?? 0m) * (double)settings.MinistryExamWeight / 100d
            : 0d;

        var nonInterviewEarned = schoolScore + prepScore + ministryScore;

        if (!hasInterviewScores)
        {
            // When all interviewers are null (no interview score recorded yet),
            // scale the non-interview weights (e.g. 60% if interview is 40%) to represent 100%.
            var nonInterviewWeight = (double)(settings.SchoolExamWeight + settings.PreparatoryCertificateWeight + settings.MinistryExamWeight);
            if (nonInterviewWeight > 0)
            {
                return Math.Round((nonInterviewEarned / nonInterviewWeight) * 100d, 2);
            }

            return 0d;
        }

        // When interview score(s) have been entered, include the interview weight out of the full 100%
        var interviewScore = 0d;
        if (settings.InterviewWeight > 0)
        {
            var interviewPercentage = (double)(scores.Sum() * 100m /
                (InterviewScoreMaximum * ExpectedInterviewers));
            interviewScore = interviewPercentage * (double)settings.InterviewWeight / 100d;
        }

        var total = nonInterviewEarned + interviewScore;
        return Math.Round(total, 2);
    }

    public static AdmissionSettingsDTO ToDto(HubSettings settings) => new()
    {
        Id = settings.Id,
        VersionNumber = settings.VersionNumber,
        VersionName = settings.VersionName,
        CreatedAtUtc = settings.CreatedAtUtc,
        SchoolExam = new AdmissionFactorSettingDTO
        {
            Enabled = settings.SchoolExamWeight > 0,
            Weight = settings.SchoolExamWeight
        },
        Interview = new AdmissionFactorSettingDTO
        {
            Enabled = settings.InterviewWeight > 0,
            Weight = settings.InterviewWeight
        },
        PreparatoryCertificate = new AdmissionFactorSettingDTO
        {
            Enabled = settings.PreparatoryCertificateWeight > 0,
            Weight = settings.PreparatoryCertificateWeight
        },
        MinistryExam = new AdmissionFactorSettingDTO
        {
            Enabled = settings.MinistryExamWeight > 0,
            Weight = settings.MinistryExamWeight
        },
        SubjectWeights = new ExamSubjectWeightsDTO
        {
            Arabic = settings.ArabicWeight,
            English = settings.EnglishWeight,
            Math = settings.MathWeight,
            Software = settings.SoftwareWeight,
            Iq = settings.IqWeight
        },
        QuestionsPerSection = settings.QuestionsPerSection,
        RequireFullQuestionSet = settings.RequireFullQuestionSet != 0,
        ExamDurationMinutes = settings.ExamDurationMinutes
    };

    public static HubSettings GetHistoricalBaseline(StudentExamResult result)
        => result.ExamIqScore.HasValue ? CreateOriginalIqBaseline() : CreateLegacyBaseline();

    private static HubSettings CreateLegacyBaseline() => new()
    {
        VersionName = "Legacy pre-IQ baseline",
        SettingStatusId = 2,
        SchoolExamWeight = 60m,
        InterviewWeight = 40m,
        PreparatoryCertificateWeight = 0m,
        MinistryExamWeight = 0m,
        ArabicWeight = 15m,
        EnglishWeight = 15m,
        MathWeight = 15m,
        SoftwareWeight = 15m,
        IqWeight = 0m,
        QuestionsPerSection = 10,
        RequireFullQuestionSet = 0,
        ExamDurationMinutes = 60
    };

    private static HubSettings CreateOriginalIqBaseline() => new()
    {
        VersionName = "Original IQ baseline",
        SettingStatusId = 2,
        SchoolExamWeight = 60m,
        InterviewWeight = 40m,
        PreparatoryCertificateWeight = 0m,
        MinistryExamWeight = 0m,
        ArabicWeight = 15m,
        EnglishWeight = 30m,
        MathWeight = 30m,
        SoftwareWeight = 15m,
        IqWeight = 10m,
        QuestionsPerSection = 10,
        RequireFullQuestionSet = 0,
        ExamDurationMinutes = 60
    };

    private static HubSettings CreateDefaultHubSettings() => new()
    {
        VersionNumber = 1,
        VersionName = "Default HUB Settings",
        SettingStatusId = 1,
        SchoolExamWeight = 60m,
        InterviewWeight = 40m,
        PreparatoryCertificateWeight = 0m,
        MinistryExamWeight = 0m,
        ArabicWeight = 15m,
        EnglishWeight = 30m,
        MathWeight = 30m,
        SoftwareWeight = 15m,
        IqWeight = 10m,
        QuestionsPerSection = 10,
        RequireFullQuestionSet = 0,
        ExamDurationMinutes = 60,
        CreatedAtUtc = DateTime.UtcNow
    };

    private static ExamTiming BuildExamTiming(StudentExamResult result, HubSettings settings)
    {
        var storedStart = result.ExamStartedAtUtc ?? DateTime.UtcNow;
        var startedAtUtc = new DateTimeOffset(
            DateTime.SpecifyKind(storedStart, DateTimeKind.Utc));
        return new ExamTiming(
            settings,
            startedAtUtc,
            startedAtUtc
                .AddMinutes(settings.ExamDurationMinutes)
                .AddMinutes(result.ExtensionMinutes ?? 0));
    }
}

public sealed record ExamTiming(
    HubSettings Settings,
    DateTimeOffset StartedAtUtc,
    DateTimeOffset EndsAtUtc);
