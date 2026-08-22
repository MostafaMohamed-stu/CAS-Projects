using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using QuizesApi.DTOs;
using QuizesApi.Models;
using QuizesApi.Repositories.Interfaces;

namespace QuizesApi.Repositories.Implementation;

public class DashboardRepo : IDashboardRepo
{
    private readonly ElsewedySchoolSysDbDevContext _context;
    private readonly IMemoryCache _cache;
    private const double PassThreshold = 50.0;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(2); // 2 minute cache for dashboard stats
    private const string CacheVersion = "v2";

    public DashboardRepo(ElsewedySchoolSysDbDevContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    private string GetCacheKey(string prefix, long id, LeaderboardFilterDto? filters)
    {
        return $"{CacheVersion}_{prefix}_{id}_{filters?.GradeId}_{filters?.ClassId}_{filters?.ExamId}_{filters?.SubjectId}_{filters?.SearchTerm}_{filters?.StartDate:yyyyMMdd}_{filters?.EndDate:yyyyMMdd}";
    }

    private string FormatClassName(string className)
    {
        if (string.IsNullOrEmpty(className)) return className;
        
        if (className.StartsWith("J", StringComparison.OrdinalIgnoreCase) && className.Length > 1 && char.IsDigit(className[1]))
            return $"Junior {className.Substring(1)}";
            
        if (className.StartsWith("S", StringComparison.OrdinalIgnoreCase) && className.Length > 1 && char.IsDigit(className[1]))
            return $"Senior {className.Substring(1)}";
            
        if (className.StartsWith("W", StringComparison.OrdinalIgnoreCase))
        {
            if (className.Length > 1 && char.IsDigit(className[1]))
                return $"Wheeler {className.Substring(1)}";
            return className.Length > 7 && className.StartsWith("Wheeler", StringComparison.OrdinalIgnoreCase) 
                ? className 
                : $"Wheeler {className}";
        }
        
        return className;
    }

    private async Task PopulateExamQuestions(ExamDetail exam)
    {
        exam.ExamQuestionBanks.Clear();
        var links = await _context.ExamQuestionBanks
            .AsNoTracking()
            .Where(eq => eq.ExamId == exam.ExamId)
            .ToListAsync();

        var questionIds = links.Where(l => l.QuestionId.HasValue).Select(l => l.QuestionId!.Value).Distinct().ToList();
        var questions = await _context.QuestionBanks
            .AsNoTracking()
            .Where(q => questionIds.Contains(q.QuestionId))
            .ToDictionaryAsync(q => q.QuestionId);
            
        foreach (var link in links)
        {
            if (link.QuestionId.HasValue && questions.TryGetValue(link.QuestionId.Value, out var q))
            {
                link.Question = q;
                exam.ExamQuestionBanks.Add(link);
            }
        }
    }
    
    private async Task PopulateExamQuestions(List<ExamDetail> exams)
    {
        var examIds = exams.Select(e => e.ExamId).Distinct().ToList();
        if (!examIds.Any()) return;

        var links = await _context.ExamQuestionBanks
            .AsNoTracking()
            .Where(eq => eq.ExamId.HasValue && examIds.Contains(eq.ExamId.Value))
            .ToListAsync();

        var questionIds = links.Where(l => l.QuestionId.HasValue).Select(l => l.QuestionId!.Value).Distinct().ToList();
        var questions = await _context.QuestionBanks
            .AsNoTracking()
            .Where(q => questionIds.Contains(q.QuestionId))
            .ToDictionaryAsync(q => q.QuestionId);
        
        var linksByExam = links.GroupBy(l => l.ExamId!.Value).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var exam in exams)
        {
            exam.ExamQuestionBanks.Clear();
            if (linksByExam.TryGetValue(exam.ExamId, out var examLinks))
            {
                foreach (var link in examLinks)
                {
                    if (link.QuestionId.HasValue && questions.TryGetValue(link.QuestionId.Value, out var q))
                    {
                        link.Question = q;
                        exam.ExamQuestionBanks.Add(link);
                    }
                }
            }
        }
    }

    public async Task<StudentDashboardDto?> GetStudentDashboardAsync(long studentId, LeaderboardFilterDto? filters = null)
    {
        string cacheKey = GetCacheKey("StudentDashboard", studentId, filters);
        if (_cache.TryGetValue(cacheKey, out StudentDashboardDto? cachedData)) return cachedData;

        var student = await _context.Accounts
            .AsNoTracking()
            .Select(a => new { a.Id, a.FullNameEn })
            .FirstOrDefaultAsync(a => a.Id == studentId);
            
        if (student == null) return null;

        var examsQuery = _context.ExamDetails.AsNoTracking();
        examsQuery = ApplyFilters(examsQuery, filters);
        
        var exams = await examsQuery
            .Include(e => e.Subject)
            .ToListAsync();
        
        if (!exams.Any()) 
        {
            var emptyResult = new StudentDashboardDto {
                StudentId = studentId,
                StudentName = student.FullNameEn ?? "Unknown",
                RecentExams = new()
            };
            _cache.Set(cacheKey, emptyResult, CacheDuration);
            return emptyResult;
        }

        var examIds = exams.Select(e => e.ExamId).Distinct().ToList();

        // Sequential fetching to avoid EF Core thread-safety issues
        var marksMapRaw = await _context.ExamQuestionBanks
            .AsNoTracking()
            .Where(eq => eq.ExamId.HasValue && eq.QuestionId.HasValue && examIds.Contains(eq.ExamId.Value))
            .Join(_context.QuestionBanks.AsNoTracking(),
                eq => eq.QuestionId!.Value,
                q => q.QuestionId,
                (eq, q) => new { ExamId = eq.ExamId!.Value, QuestionId = q.QuestionId, Mark = (double)(q.Mark ?? 0) })
            .ToListAsync();

        var studentAnswers = await _context.StudentExamAnswers
            .AsNoTracking()
            .Where(sea => sea.AccountId == studentId && sea.ExamDetailsId.HasValue && examIds.Contains(sea.ExamDetailsId.Value))
            .Select(sea => new { sea.ExamDetailsId, sea.QuestionBankId, sea.Score })
            .ToListAsync();

        var allExamsAnswers = await _context.StudentExamAnswers
            .AsNoTracking()
            .Where(sea => sea.ExamDetailsId.HasValue && examIds.Contains(sea.ExamDetailsId.Value))
            .Select(sea => new { sea.ExamDetailsId, sea.AccountId, sea.QuestionBankId, sea.Score })
            .ToListAsync();

        var examTotalMarks = marksMapRaw.GroupBy(m => m.ExamId).ToDictionary(g => g.Key, g => g.Sum(x => x.Mark));
        var examQuestionMarks = marksMapRaw.GroupBy(m => m.ExamId).ToDictionary(g => g.Key, g => g.ToDictionary(x => x.QuestionId, x => x.Mark));

        var studentExams = studentAnswers
            .Where(sea => sea.ExamDetailsId.HasValue)
            .Select(sea => sea.ExamDetailsId!.Value)
            .Distinct()
            .ToList();

        var scoreBuckets = new Dictionary<string, int> { { "0-50%", 0 }, { "50-70%", 0 }, { "70-85%", 0 }, { "85-100%", 0 } };
        var recentExamsData = new List<StudentRecentExamDto>();

        var examAverages = allExamsAnswers.GroupBy(a => a.ExamDetailsId!.Value).ToDictionary(
            g => g.Key,
            g => {
                if (!examTotalMarks.TryGetValue(g.Key, out double max) || max == 0) return 0.0;
                if (!examQuestionMarks.TryGetValue(g.Key, out var qMarks)) return 0.0;
                
                var scores = g.GroupBy(a => a.AccountId).Select(sg => 
                {
                    var earned = sg.Where(ans => ans.Score && ans.QuestionBankId.HasValue && qMarks.ContainsKey(ans.QuestionBankId.Value))
                                   .Sum(ans => qMarks[ans.QuestionBankId!.Value]);
                    return earned / max * 100.0;
                }).ToList();
                
                return scores.Any() ? Math.Round(scores.Average(), 2) : 0.0;
            }
        );

        int passedExams = 0;
        int failedExams = 0;
        long? latestExamId = null;
        DateTime? latestExamDate = null;

        foreach (var group in studentAnswers.GroupBy(a => a.ExamDetailsId!.Value))
        {
            long examId = group.Key;
            var exam = exams.FirstOrDefault(e => e.ExamId == examId);
            if (exam == null || !examTotalMarks.TryGetValue(examId, out double max) || max == 0) continue;
            
            var qMarks = examQuestionMarks[examId];
            double earned = group.Where(ans => ans.Score && ans.QuestionBankId.HasValue && qMarks.ContainsKey(ans.QuestionBankId.Value))
                                 .Sum(ans => qMarks[ans.QuestionBankId!.Value]);

            double score = (earned / max) * 100.0;
            if (score >= PassThreshold) passedExams++; else failedExams++;

            if (latestExamDate == null || (exam.EndDate.HasValue && exam.EndDate > latestExamDate))
            {
                latestExamDate = exam.EndDate;
                latestExamId = examId;
            }
            
            if (score < 50) scoreBuckets["0-50%"]++;
            else if (score < 70) scoreBuckets["50-70%"]++;
            else if (score < 85) scoreBuckets["70-85%"]++;
            else scoreBuckets["85-100%"]++;
            
            recentExamsData.Add(new StudentRecentExamDto {
                ExamId = examId, Title = exam.Title ?? "Untitled Exam",
                SubjectName = exam.Subject?.StatusName ?? exam.ExamSubject,
                StudentScore = Math.Round(score, 2),
                AverageScore = examAverages.ContainsKey(examId) ? examAverages[examId] : 0,
                Date = exam.EndDate ?? DateTime.Now
            });
        }

        LeaderboardDto? latestExamLeaderboard = null;
        if (latestExamId.HasValue) latestExamLeaderboard = await GetLeaderboardAsync(latestExamId.Value, filters);

        var result = new StudentDashboardDto {
            StudentId = studentId, StudentName = student.FullNameEn ?? "Unknown",
            TotalExamsTaken = studentExams.Count,
            PassPercentage = studentExams.Count > 0 ? Math.Round((double)passedExams / studentExams.Count * 100, 2) : 0,
            FailPercentage = studentExams.Count > 0 ? Math.Round((double)failedExams / studentExams.Count * 100, 2) : 0,
            LatestExamLeaderboard = latestExamLeaderboard,
            StudentRankInLatestExam = latestExamLeaderboard?.TopStudents?.FirstOrDefault(s => s.StudentId == studentId)?.Rank,
            RecentExams = recentExamsData.OrderByDescending(e => e.Date).Take(10).ToList(),
            ScoreDistribution = scoreBuckets.Select(b => new ChartDataPointDto { Name = b.Key, Value = b.Value }).ToList()
        };

        _cache.Set(cacheKey, result, CacheDuration);
        return result;
    }

    public async Task<TeacherDashboardDto?> GetTeacherDashboardAsync(long teacherId, LeaderboardFilterDto? filters = null)
    {
        string cacheKey = GetCacheKey("TeacherDashboard", teacherId, filters);
        if (_cache.TryGetValue(cacheKey, out TeacherDashboardDto? cachedData)) return cachedData;

        var teacher = await _context.Accounts
            .AsNoTracking()
            .Select(a => new { a.Id, a.FullNameEn })
            .FirstOrDefaultAsync(a => a.Id == teacherId);
            
        if (teacher == null) return null;

        var examsQuery = _context.ExamDetails.AsNoTracking().Where(e => e.CreatedBy_AccId == teacherId);
        examsQuery = ApplyFilters(examsQuery, filters);
        
        var exams = await examsQuery
            .Include(e => e.Subject)
            .ToListAsync();
        
        if (!exams.Any())
        {
            var emptyResult = new TeacherDashboardDto { TeacherId = teacherId, TeacherName = teacher.FullNameEn ?? "Unknown", RecentExams = new() };
            _cache.Set(cacheKey, emptyResult, CacheDuration);
            return emptyResult;
        }

        var examIds = exams.Select(e => e.ExamId).Distinct().ToList();

        // Sequential fetching to avoid EF Core thread-safety issues
        var marksMapRaw = await _context.ExamQuestionBanks
            .AsNoTracking()
            .Where(eq => eq.ExamId.HasValue && eq.QuestionId.HasValue && examIds.Contains(eq.ExamId.Value))
            .Join(_context.QuestionBanks.AsNoTracking(),
                eq => eq.QuestionId!.Value,
                q => q.QuestionId,
                (eq, q) => new { ExamId = eq.ExamId!.Value, QuestionId = q.QuestionId, Mark = (double)(q.Mark ?? 0) })
            .ToListAsync();

        var answersQuery = _context.StudentExamAnswers.AsNoTracking()
            .Where(sea => sea.ExamDetailsId.HasValue && examIds.Contains(sea.ExamDetailsId.Value));

        List<StudentExamAnswer> allAnswers;
        if (filters?.GradeId.HasValue == true || filters?.ClassId.HasValue == true)
        {
             var joinQuery = answersQuery
                .Join(_context.StudentExtensions, ans => ans.AccountId, ext => ext.AccountId, (ans, ext) => new { ans, ext })
                .Where(x => x.ext.ClassId.HasValue);

             if (filters.GradeId.HasValue)
             {
                 var classIds = await _context.TblClasses
                    .AsNoTracking()
                    .Where(c => c.GradeId == filters.GradeId.Value)
                    .Select(c => c.Id)
                    .ToListAsync();
                 joinQuery = joinQuery.Where(x => classIds.Contains(x.ext.ClassId!.Value));
             }
             if (filters.ClassId.HasValue) joinQuery = joinQuery.Where(x => x.ext.ClassId == filters.ClassId.Value);

             allAnswers = await joinQuery.Select(x => new StudentExamAnswer {
                 AccountId = x.ans.AccountId, ExamDetailsId = x.ans.ExamDetailsId, QuestionBankId = x.ans.QuestionBankId, Score = x.ans.Score
             }).ToListAsync();
        }
        else 
        {
            allAnswers = await answersQuery.Select(sea => new StudentExamAnswer {
                 AccountId = sea.AccountId, ExamDetailsId = sea.ExamDetailsId, QuestionBankId = sea.QuestionBankId, Score = sea.Score
            }).ToListAsync();
        }

        var examTotalMarks = marksMapRaw.GroupBy(m => m.ExamId).ToDictionary(g => g.Key, g => g.Sum(x => x.Mark));
        var examQuestionMarks = marksMapRaw.GroupBy(m => m.ExamId).ToDictionary(g => g.Key, g => g.ToDictionary(x => x.QuestionId, x => x.Mark));
        var scoreBuckets = new Dictionary<string, int> { { "0-50%", 0 }, { "50-70%", 0 }, { "70-85%", 0 }, { "85-100%", 0 } };
        var examBreakdown = new List<ExamStatsDto>();
        int totalPassed = 0, totalFailed = 0;
        var uniqueStudents = new HashSet<long>();
        var studentPerformanceMap = new Dictionary<long, List<double>>();

        var answersByExam = allAnswers.GroupBy(a => a.ExamDetailsId!.Value).ToDictionary(g => g.Key, g => g.GroupBy(a => a.AccountId));

        foreach (var exam in exams)
        {
            if (!answersByExam.TryGetValue(exam.ExamId, out var studentGroups)) 
            {
                examBreakdown.Add(new ExamStatsDto { 
                    ExamId = exam.ExamId, 
                    ExamTitle = exam.Title, 
                    SubjectName = exam.Subject?.StatusName ?? exam.ExamSubject,
                    TotalStudents = 0 
                });
                continue;
            }

            if (!examTotalMarks.TryGetValue(exam.ExamId, out var max) || max <= 0) continue;
            var qMarks = examQuestionMarks.ContainsKey(exam.ExamId) ? examQuestionMarks[exam.ExamId] : new();
            int ep = 0, ef = 0; double ets = 0;

            foreach (var sg in studentGroups)
            {
                 uniqueStudents.Add(sg.Key);
                 double earned = sg.Where(ans => ans.Score && ans.QuestionBankId.HasValue && qMarks.ContainsKey(ans.QuestionBankId.Value)).Sum(ans => qMarks[ans.QuestionBankId!.Value]);
                 double score = (earned * 100.0 / max);
                 ets += score;
                 if (score >= PassThreshold) ep++; else ef++;

                 if (!studentPerformanceMap.ContainsKey(sg.Key)) studentPerformanceMap[sg.Key] = new List<double>();
                 studentPerformanceMap[sg.Key].Add(score);
            }

            examBreakdown.Add(new ExamStatsDto {
                ExamId = exam.ExamId, ExamTitle = exam.Title,
                SubjectName = exam.Subject?.StatusName ?? exam.ExamSubject,
                TotalStudents = studentGroups.Count(),
                PassedStudents = ep, FailedStudents = ef, 
                PassPercentage = Math.Round((double)ep / studentGroups.Count() * 100, 2),
                AverageScore = Math.Round(ets / studentGroups.Count(), 2)
            });
        }

        // Calculate aggregate stats based on student averages for "All Exams" view
        foreach (var studentScores in studentPerformanceMap.Values)
        {
            double avgScore = studentScores.Average();
            if (avgScore >= PassThreshold) totalPassed++; else totalFailed++;

            if (avgScore < 50) scoreBuckets["0-50%"]++;
            else if (avgScore < 70) scoreBuckets["50-70%"]++;
            else if (avgScore < 85) scoreBuckets["70-85%"]++;
            else scoreBuckets["85-100%"]++;
        }

        var result = new TeacherDashboardDto {
            TeacherId = teacherId, TeacherName = teacher.FullNameEn ?? "Unknown",
            TotalExamsCreated = exams.Count,
            AveragePassPercentage = (totalPassed + totalFailed) > 0 ? Math.Round((double)totalPassed / (totalPassed + totalFailed) * 100, 2) : 0,
            TotalStudentsWhoTookExams = uniqueStudents.Count,
            ExamBreakdown = examBreakdown,
            RecentExams = exams.OrderByDescending(e => e.EndDate).Take(10).Select(e => new ExamSelectionDto { ExamId = e.ExamId, Title = e.Title ?? "Untitled Exam" }).ToList(),
            ScoreDistribution = scoreBuckets.Select(b => new ChartDataPointDto { Name = b.Key, Value = b.Value }).ToList()
        };

        _cache.Set(cacheKey, result, CacheDuration);
        return result;
    }

    public async Task<SuperadminDashboardDto> GetSuperadminDashboardAsync(LeaderboardFilterDto? filters = null)
    {
        string cacheKey = GetCacheKey("SuperadminDashboard", 0, filters);
        if (_cache.TryGetValue(cacheKey, out SuperadminDashboardDto? cachedData)) return cachedData;

        var examsQuery = _context.ExamDetails.AsNoTracking();
        examsQuery = ApplyFilters(examsQuery, filters);
        
        var exams = await examsQuery
            .Include(e => e.Subject)
            .ToListAsync();
        
        if (!exams.Any())
        {
            var emptyResult = new SuperadminDashboardDto();
            _cache.Set(cacheKey, emptyResult, CacheDuration);
            return emptyResult;
        }

        var examIds = exams.Select(e => e.ExamId).Distinct().ToList();

        // Sequential fetching to avoid EF Core thread-safety issues
        var marksMapRaw = await _context.ExamQuestionBanks.AsNoTracking()
            .Where(eq => eq.ExamId.HasValue && eq.QuestionId.HasValue && examIds.Contains(eq.ExamId.Value))
            .Join(_context.QuestionBanks.AsNoTracking(),
                eq => eq.QuestionId!.Value,
                q => q.QuestionId,
                (eq, q) => new { ExamId = eq.ExamId!.Value, QuestionId = q.QuestionId, Mark = (double)(q.Mark ?? 0) })
            .ToListAsync();

        var answersQuery = _context.StudentExamAnswers.AsNoTracking().Where(sea => sea.ExamDetailsId.HasValue && examIds.Contains(sea.ExamDetailsId.Value));
        List<StudentExamAnswer> allAnswers;
        if (filters?.GradeId.HasValue == true || filters?.ClassId.HasValue == true)
        {
             var classIds = filters.GradeId.HasValue 
                ? await _context.TblClasses.AsNoTracking().Where(c => c.GradeId == filters.GradeId.Value).Select(c => c.Id).ToListAsync()
                : null;

             allAnswers = await answersQuery.Join(_context.StudentExtensions, ans => ans.AccountId, ext => ext.AccountId, (ans, ext) => new { ans, ext })
                .Where(x => (classIds == null || classIds.Contains(x.ext.ClassId!.Value)) && (!filters.ClassId.HasValue || x.ext.ClassId == filters.ClassId.Value))
                .Select(x => new StudentExamAnswer { AccountId = x.ans.AccountId, ExamDetailsId = x.ans.ExamDetailsId, QuestionBankId = x.ans.QuestionBankId, Score = x.ans.Score }).ToListAsync();
        }
        else 
        {
            allAnswers = await answersQuery.Select(sea => new StudentExamAnswer { AccountId = sea.AccountId, ExamDetailsId = sea.ExamDetailsId, QuestionBankId = sea.QuestionBankId, Score = sea.Score }).ToListAsync();
        }

        var totalStudentsCount = await _context.Accounts.AsNoTracking().Where(a => a.Role.RoleName == "Student").CountAsync();
        var totalTeachersCount = await _context.Accounts.AsNoTracking().Where(a => a.Role.RoleName == "Teacher").CountAsync();
        var topPerformingStudents = await GetTopPerformingStudentsAsync(10);
        var recentActivity = await GetRecentActivityAsync(20);

        var examTotalMarks = marksMapRaw.GroupBy(m => m.ExamId).ToDictionary(g => g.Key, g => g.Sum(x => x.Mark));
        var examQuestionMarks = marksMapRaw.GroupBy(m => m.ExamId).ToDictionary(g => g.Key, g => g.ToDictionary(x => x.QuestionId, x => x.Mark));
        var scoreBuckets = new Dictionary<string, int> { { "0-50%", 0 }, { "50-70%", 0 }, { "70-85%", 0 }, { "85-100%", 0 } };
        var examBreakdown = new List<ExamStatsDto>();
        int tp = 0, tf = 0;
        var studentPerformanceMap = new Dictionary<long, List<double>>();

        foreach (var group in allAnswers.GroupBy(a => a.ExamDetailsId!.Value))
        {
            if (!examTotalMarks.TryGetValue(group.Key, out double max) || max == 0) continue;
            var qMarks = examQuestionMarks[group.Key];
            var exam = exams.FirstOrDefault(e => e.ExamId == group.Key);
            int ep = 0, ef = 0; double ets = 0;

            foreach (var sg in group.GroupBy(a => a.AccountId))
            {
                double earned = sg.Where(ans => ans.Score && ans.QuestionBankId.HasValue && qMarks.ContainsKey(ans.QuestionBankId.Value)).Sum(ans => qMarks[ans.QuestionBankId!.Value]);
                double score = earned * 100.0 / max;
                ets += score;
                if (score >= PassThreshold) ep++; else ef++;
                
                if (!studentPerformanceMap.ContainsKey(sg.Key)) studentPerformanceMap[sg.Key] = new List<double>();
                studentPerformanceMap[sg.Key].Add(score);
            }
            examBreakdown.Add(new ExamStatsDto { 
                ExamId = group.Key, 
                ExamTitle = exam?.Title, 
                SubjectName = exam?.Subject?.StatusName ?? exam?.ExamSubject,
                TotalStudents = group.GroupBy(a => a.AccountId).Count(), 
                PassedStudents = ep, 
                FailedStudents = ef, 
                AverageScore = Math.Round(ets / group.GroupBy(a => a.AccountId).Count(), 2) 
            });
        }

        // Calculate aggregate stats based on student averages
        foreach (var studentScores in studentPerformanceMap.Values)
        {
            double avgScore = studentScores.Average();
            if (avgScore >= PassThreshold) tp++; else tf++;

            if (avgScore < 50) scoreBuckets["0-50%"]++;
            else if (avgScore < 70) scoreBuckets["50-70%"]++;
            else if (avgScore < 85) scoreBuckets["70-85%"]++;
            else scoreBuckets["85-100%"]++;
        }

        var result = new SuperadminDashboardDto {
            TotalExams = exams.Count, TotalStudents = totalStudentsCount, TotalTeachers = totalTeachersCount,
            OverallPassPercentage = (tp + tf) > 0 ? Math.Round((double)tp / (tp + tf) * 100, 2) : 0,
            TopPerformingStudents = topPerformingStudents, RecentActivity = recentActivity,
            RecentExams = exams.OrderByDescending(e => e.EndDate).Take(10).Select(e => new ExamSelectionDto { ExamId = e.ExamId, Title = e.Title ?? "Untitled Exam" }).ToList(),
            ScoreDistribution = scoreBuckets.Select(b => new ChartDataPointDto { Name = b.Key, Value = b.Value }).ToList(),
            ExamBreakdown = examBreakdown
        };

        _cache.Set(cacheKey, result, CacheDuration);
        return result;
    }

    public async Task<LeaderboardDto?> GetLeaderboardAsync(long examId, LeaderboardFilterDto? filters = null)
    {
        string cacheKey = GetCacheKey("Leaderboard", examId, filters);
        if (_cache.TryGetValue(cacheKey, out LeaderboardDto? cachedData)) return cachedData;

        var exam = await _context.ExamDetails.AsNoTracking().Include(e => e.Subject).FirstOrDefaultAsync(e => e.ExamId == examId);
        if (exam == null) return null;
        
        var marksMapRaw = await _context.ExamQuestionBanks.AsNoTracking()
            .Where(eq => eq.ExamId == examId && eq.QuestionId.HasValue)
            .Join(_context.QuestionBanks.AsNoTracking(),
                eq => eq.QuestionId!.Value,
                q => q.QuestionId,
                (eq, q) => new { QuestionId = q.QuestionId, Mark = (double)(q.Mark ?? 0) })
            .ToListAsync();

        var qMarks = marksMapRaw.ToDictionary(x => x.QuestionId, x => x.Mark);
        double totalMax = marksMapRaw.Sum(x => x.Mark);

        var studentAnswers = await _context.StudentExamAnswers.AsNoTracking().Where(sea => sea.ExamDetailsId == examId)
            .Select(sea => new { sea.AccountId, sea.QuestionBankId, sea.Score }).ToListAsync();

        var studentIds = studentAnswers.Select(sa => sa.AccountId).Distinct().ToList();
        var students = await _context.Accounts.AsNoTracking().Where(a => studentIds.Contains(a.Id))
            .Select(a => new { a.Id, a.FullNameEn, a.StudentExtension!.ClassId }).ToDictionaryAsync(a => a.Id);

        HashSet<long>? validClasses = filters?.GradeId.HasValue == true 
            ? (await _context.TblClasses.AsNoTracking().Where(c => c.GradeId == filters.GradeId.Value).Select(c => c.Id).ToListAsync()).ToHashSet() : null;

        var entries = new List<LeaderboardEntryDto>();
        foreach (var group in studentAnswers.GroupBy(a => a.AccountId))
        {
            if (!students.TryGetValue(group.Key, out var student)) continue;
            if (filters?.ClassId.HasValue == true && student.ClassId != filters.ClassId.Value) continue;
            if (validClasses != null && (!student.ClassId.HasValue || !validClasses.Contains(student.ClassId.Value))) continue;

            double earned = group.Where(ans => ans.Score && ans.QuestionBankId.HasValue && qMarks.ContainsKey(ans.QuestionBankId.Value)).Sum(ans => qMarks[ans.QuestionBankId!.Value]);
            entries.Add(new LeaderboardEntryDto { StudentId = group.Key, StudentName = student.FullNameEn ?? "Unknown", Score = totalMax > 0 ? Math.Round((earned / totalMax) * 100, 2) : 0, EarnedMarks = (int)earned, TotalMarks = (int)totalMax });
        }

        entries = entries.OrderByDescending(e => e.Score).ToList();
        for (int i = 0; i < entries.Count; i++) entries[i].Rank = i + 1;

        if (string.Equals(filters?.GroupBy, "Class", StringComparison.OrdinalIgnoreCase))
        {
            var classes = await _context.TblClasses.AsNoTracking().Where(c => c.GradeId == exam.GradeId).ToListAsync();
            var classScores = entries
                .Select(e => new { e.Score, ClassId = students.TryGetValue(e.StudentId, out var s) ? s.ClassId : null })
                .Where(x => x.ClassId.HasValue)
                .GroupBy(x => x.ClassId!.Value)
                .ToDictionary(g => g.Key, g => g.Average(x => x.Score));
            var classResults = classes.Select(c => new LeaderboardEntryDto { StudentId = c.Id, StudentName = FormatClassName(c.ClassName ?? $"Class {c.Id}"), Score = classScores.ContainsKey(c.Id) ? Math.Round(classScores[c.Id], 2) : 0.0 }).OrderByDescending(e => e.Score).ToList();
            for (int i = 0; i < classResults.Count; i++) classResults[i].Rank = i + 1;
            var resultClass = new LeaderboardDto { ExamId = examId, ExamTitle = exam.Title, SubjectName = exam.Subject?.StatusName ?? exam.ExamSubject, TopStudents = classResults.Take(10).ToList(), TotalParticipants = classResults.Count };
            _cache.Set(cacheKey, resultClass, CacheDuration); return resultClass;
        }

        var result = new LeaderboardDto { ExamId = examId, ExamTitle = exam.Title, SubjectName = exam.Subject?.StatusName ?? exam.ExamSubject, TopStudents = entries.Take(10).ToList(), TotalParticipants = entries.Count };
        _cache.Set(cacheKey, result, CacheDuration);
        return result;
    }

    public async Task<ExamStatsDto?> GetExamStatsAsync(long examId)
    {
        var exam = await _context.ExamDetails.AsNoTracking().Include(e => e.Subject).FirstOrDefaultAsync(e => e.ExamId == examId);
        if (exam == null) return null;
        
        var marksMapRaw = await _context.ExamQuestionBanks.AsNoTracking()
            .Where(eq => eq.ExamId == examId && eq.QuestionId.HasValue)
            .Join(_context.QuestionBanks.AsNoTracking(),
                eq => eq.QuestionId!.Value,
                q => q.QuestionId,
                (eq, q) => new { QuestionId = q.QuestionId, Mark = (double)(q.Mark ?? 0) })
            .ToListAsync();
        var qMarks = marksMapRaw.ToDictionary(x => x.QuestionId, x => x.Mark);
        double totalMax = marksMapRaw.Sum(x => x.Mark);

        var allAnswers = await _context.StudentExamAnswers.AsNoTracking().Where(sea => sea.ExamDetailsId == examId)
            .Select(sea => new { sea.AccountId, sea.QuestionBankId, sea.Score }).ToListAsync();

        var studentGroups = allAnswers.GroupBy(a => a.AccountId);
        int passed = 0; double totalScore = 0;

        foreach (var sg in studentGroups)
        {
            double earned = sg.Where(a => a.Score && a.QuestionBankId.HasValue && qMarks.ContainsKey(a.QuestionBankId.Value)).Sum(a => qMarks[a.QuestionBankId!.Value]);
            double score = totalMax > 0 ? (earned * 100.0 / totalMax) : 0.0;
            totalScore += score;
            if (score >= PassThreshold) passed++;
        }

        return new ExamStatsDto {
            ExamId = examId, ExamTitle = exam.Title, 
            SubjectName = exam.Subject?.StatusName ?? exam.ExamSubject,
            TotalStudents = studentGroups.Count(),
            PassedStudents = passed, FailedStudents = studentGroups.Count() - passed,
            PassPercentage = studentGroups.Any() ? Math.Round((double)passed / studentGroups.Count() * 100, 2) : 0,
            AverageScore = studentGroups.Any() ? Math.Round(totalScore / studentGroups.Count(), 2) : 0
        };
    }

    private async Task<List<LeaderboardEntryDto>> GetTopPerformingStudentsAsync(int count)
    {
        var studentIds = await _context.Accounts.AsNoTracking().Where(a => a.Role.RoleName == "Student").Select(a => a.Id).ToListAsync();
        var allAnswers = await _context.StudentExamAnswers.AsNoTracking().Where(sea => studentIds.Contains(sea.AccountId))
            .Select(sea => new { sea.AccountId, sea.ExamDetailsId, sea.QuestionBankId, sea.Score }).ToListAsync();

        var examIds = allAnswers.Where(a => a.ExamDetailsId.HasValue).Select(a => a.ExamDetailsId!.Value).Distinct().ToList();
        var marksMapRaw = await _context.ExamQuestionBanks.AsNoTracking()
            .Where(eq => eq.ExamId.HasValue && eq.QuestionId.HasValue && examIds.Contains(eq.ExamId.Value))
            .Join(_context.QuestionBanks.AsNoTracking(),
                eq => eq.QuestionId!.Value,
                q => q.QuestionId,
                (eq, q) => new { ExamId = eq.ExamId!.Value, QuestionId = q.QuestionId, Mark = (double)(q.Mark ?? 0) })
            .ToListAsync();

        var examTotalMarks = marksMapRaw.GroupBy(m => m.ExamId).ToDictionary(g => g.Key, g => g.Sum(x => x.Mark));
        var examQuestionMarks = marksMapRaw.GroupBy(m => m.ExamId).ToDictionary(g => g.Key, g => g.ToDictionary(x => x.QuestionId, x => x.Mark));

        var studentMap = await _context.Accounts.AsNoTracking().Where(a => studentIds.Contains(a.Id)).Select(a => new { a.Id, a.FullNameEn }).ToDictionaryAsync(a => a.Id);

        var studentPerformances = allAnswers.GroupBy(a => a.AccountId).Select(group => {
            var studentId = group.Key;
            if (!studentMap.TryGetValue(studentId, out var student)) return null;
            var examGroups = group.Where(a => a.ExamDetailsId.HasValue).GroupBy(a => a.ExamDetailsId!.Value);
            if (!examGroups.Any()) return null;

            double totalP = 0; int ec = 0;
            foreach (var eg in examGroups) {
                if (!examTotalMarks.TryGetValue(eg.Key, out double max) || max <= 0) continue;
                var qm = examQuestionMarks[eg.Key];
                double earned = eg.Where(ans => ans.Score && ans.QuestionBankId.HasValue && qm.ContainsKey(ans.QuestionBankId.Value)).Sum(ans => qm[ans.QuestionBankId!.Value]);
                totalP += (earned / max) * 100.0; ec++;
            }
            return ec > 0 ? new LeaderboardEntryDto { StudentId = studentId, StudentName = student.FullNameEn ?? "Unknown", Score = Math.Round(totalP / ec, 2) } : null;
        }).Where(x => x != null).Cast<LeaderboardEntryDto>().OrderByDescending(x => x.Score).Take(count).ToList();

        for (int i = 0; i < studentPerformances.Count; i++) studentPerformances[i]!.Rank = i + 1;
        return studentPerformances!;
    }

    private async Task<List<TopTeacherDto>> GetTopPerformingTeachersAsync(int count) => new List<TopTeacherDto>();

    private async Task<List<RecentActivityDto>> GetRecentActivityAsync(int count)
    {
        var examActivities = await _context.ExamDetails.AsNoTracking().OrderByDescending(e => e.StartDate).Take(count / 2)
            .Select(e => new RecentActivityDto { ActivityType = "ExamCreated", Description = $"Exam '{e.Title}' created", Timestamp = e.StartDate ?? DateTime.MinValue, RelatedExamId = e.ExamId }).ToListAsync();

        var recentAnswers = await _context.StudentExamAnswers.AsNoTracking().Where(sea => sea.ExamDetailsId.HasValue).GroupBy(sea => new { sea.ExamDetailsId, sea.AccountId })
            .Select(g => new { g.Key.ExamDetailsId, g.Key.AccountId, LatestId = g.Max(sea => sea.Id) }).OrderByDescending(x => x.LatestId).Take(count / 2).ToListAsync();

        var answerExamIds = recentAnswers.Select(x => x.ExamDetailsId!.Value).Distinct().ToList();
        var answerStudentIds = recentAnswers.Select(x => x.AccountId).Distinct().ToList();
        var exams = await _context.ExamDetails.AsNoTracking().Where(e => answerExamIds.Contains(e.ExamId)).ToDictionaryAsync(e => e.ExamId, e => e.Title);
        var students = await _context.Accounts.AsNoTracking().Where(a => answerStudentIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id, a => a.FullNameEn);

        var answerActivities = recentAnswers.Select(a => new RecentActivityDto {
            ActivityType = "ExamCompleted",
            Description = $"{(students.ContainsKey(a.AccountId) ? students[a.AccountId] : "A student")} completed exam '{(exams.ContainsKey(a.ExamDetailsId!.Value) ? exams[a.ExamDetailsId.Value] : "Unknown")}'",
            Timestamp = DateTime.Now, RelatedExamId = a.ExamDetailsId!.Value, RelatedAccountId = a.AccountId
        }).ToList();

        return examActivities.Concat(answerActivities).OrderByDescending(a => a.Timestamp).Take(count).ToList();
    }

    private IQueryable<ExamDetail> ApplyFilters(IQueryable<ExamDetail> query, LeaderboardFilterDto? filters)
    {
        if (filters == null) return query;
        if (filters.GradeId.HasValue) query = query.Where(e => e.GradeId == filters.GradeId.Value);
        if (filters.ExamId.HasValue) query = query.Where(e => e.ExamId == filters.ExamId.Value);
        if (filters.SubjectId.HasValue) query = query.Where(e => e.SubjectId == filters.SubjectId.Value);
        if (!string.IsNullOrEmpty(filters.SearchTerm)) query = query.Where(e => e.Title != null && EF.Functions.Like(e.Title, "%" + filters.SearchTerm + "%"));
        
        if (filters.ClassId.HasValue) 
        { 
            var classIdStr = filters.ClassId.Value.ToString();
            // Match if ClassId is exactly the ID, contains it in a comma-separated list, or in a JSON array format
            query = query.Where(e => e.ClassId != null && (
                e.ClassId == classIdStr || 
                e.ClassId.StartsWith(classIdStr + ",") || 
                e.ClassId.EndsWith("," + classIdStr) || 
                e.ClassId.Contains("," + classIdStr + ",") ||
                e.ClassId.Contains("\"" + classIdStr + "\"")
            )); 
        }

        if (filters.StartDate.HasValue) 
        {
            var start = filters.StartDate.Value.Date;
            query = query.Where(e => e.StartDate >= start);
        }
        
        if (filters.EndDate.HasValue) 
        {
            // End of day for the end date filter
            var end = filters.EndDate.Value.Date.AddDays(1).AddSeconds(-1);
            query = query.Where(e => e.EndDate <= end);
        }
        
        return query;
    }

    public async Task<List<StudentPerformanceDto>> GetStudentsAsync()
    {
        // Get Student Role IDs
        var studentRoleIds = await _context.Roles.AsNoTracking()
            .Where(r => r.RoleName.ToLower() == "student")
            .Select(r => r.Id)
            .ToListAsync();

        if (!studentRoleIds.Any()) return new List<StudentPerformanceDto>();

        // Fetch all students by role
        var students = await _context.Accounts.AsNoTracking()
            .Include(a => a.StudentExtension)
            .Where(a => studentRoleIds.Contains(a.RoleId) || _context.AccountRoles.Any(ar => ar.AccountId == a.Id && ar.RoleId.HasValue && studentRoleIds.Contains(ar.RoleId.Value)))
            .ToListAsync();

        if (!students.Any()) return new List<StudentPerformanceDto>();

        var studentIds = students.Select(s => s.Id).ToList();

        // Get all answers for these students
        var allAnswers = await _context.StudentExamAnswers.AsNoTracking()
            .Where(sea => studentIds.Contains(sea.AccountId) && sea.ExamDetailsId.HasValue)
            .Select(sea => new { sea.AccountId, sea.ExamDetailsId, sea.QuestionBankId, sea.Score })
            .ToListAsync();

        var examIds = allAnswers.Select(a => a.ExamDetailsId!.Value).Distinct().ToList();
        
        // Prepare data for mapping
        var exams = new List<ExamDetail>();
        if (examIds.Any())
        {
            exams = await _context.ExamDetails.AsNoTracking()
                .Where(e => examIds.Contains(e.ExamId))
                .ToListAsync();
            await PopulateExamQuestions(exams);
        }

        var grades = await _context.Grades.AsNoTracking().ToDictionaryAsync(g => g.Id, g => g.GradeName);
        var classes = await _context.TblClasses.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c);
        var examMap = exams.ToDictionary(e => e.ExamId);

        return students.Select(student =>
        {
            var studentAnswers = allAnswers.Where(a => a.AccountId == student.Id && a.ExamDetailsId.HasValue && examMap.ContainsKey(a.ExamDetailsId.Value)).ToList();

            var scores = studentAnswers
                .GroupBy(a => a.ExamDetailsId!.Value)
                .ToDictionary(g => g.Key.ToString(), g =>
                {
                    var exam = examMap[g.Key];
                    double total = (double)exam.ExamQuestionBanks.Sum(eq => eq.Question?.Mark ?? 0);
                    double earned = (double)g.Where(a => a.Score && a.QuestionBankId.HasValue)
                        .Sum(a => exam.ExamQuestionBanks.FirstOrDefault(eq => eq.QuestionId == a.QuestionBankId)?.Question?.Mark ?? 0);
                    return total > 0 ? Math.Round(earned * 100.0 / total, 2) : 0.0;
                });

            var classId = student.StudentExtension?.ClassId;
            string gradeName = "N/A";
            string className = "N/A";

            if (classId.HasValue && classes.TryGetValue(classId.Value, out var classEntity))
            {
                className = classEntity.ClassName ?? "N/A";
                if (grades.TryGetValue(classEntity.GradeId, out var gName))
                {
                    gradeName = gName;
                }
            }

            return new StudentPerformanceDto
            {
                Id = student.Id,
                Name = student.FullNameEn ?? string.Empty,
                Email = student.Email ?? string.Empty,
                Initials = string.IsNullOrWhiteSpace(student.FullNameEn)
                    ? "NA"
                    : string.Join("", student.FullNameEn.Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(s => s[0])).ToUpper()
                        .Substring(0, Math.Min(2, student.FullNameEn.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length)),
                Grade = gradeName,
                Class = className,
                QuizScores = scores
            };
        }).ToList();
    }

    public async Task<LeaderboardDto> GetCombinedLeaderboardAsync(LeaderboardFilterDto? filters)
    {
        string cacheKey = GetCacheKey("CombinedLeaderboard", 0, filters);
        if (_cache.TryGetValue(cacheKey, out LeaderboardDto? cachedData)) return cachedData;

        var examsQuery = _context.ExamDetails.AsNoTracking();
        examsQuery = ApplyFilters(examsQuery, filters);
        var exams = await examsQuery
            .Include(e => e.Subject)
            .ToListAsync();
        
        bool isGroupByClass = string.Equals(filters?.GroupBy, "Class", StringComparison.OrdinalIgnoreCase);
        if (!exams.Any() && !isGroupByClass) return new LeaderboardDto { ExamTitle = "Overall Performance", TopStudents = new() };

        await PopulateExamQuestions(exams);
        var examIds = exams.Select(e => e.ExamId).Distinct().ToList();
        var marksMapRaw = await _context.ExamQuestionBanks.AsNoTracking()
            .Where(eq => eq.ExamId.HasValue && eq.QuestionId.HasValue && examIds.Contains(eq.ExamId.Value))
            .Join(_context.QuestionBanks.AsNoTracking(),
                eq => eq.QuestionId!.Value,
                q => q.QuestionId,
                (eq, q) => new { ExamId = eq.ExamId!.Value, QuestionId = q.QuestionId, Mark = (double)(q.Mark ?? 0) })
            .ToListAsync();
        
        var examTotalMarksMap = marksMapRaw.GroupBy(m => m.ExamId).ToDictionary(g => g.Key, g => g.Sum(x => x.Mark));
        var examQuestionMarksMap = marksMapRaw.GroupBy(m => m.ExamId).ToDictionary(g => g.Key, g => g.ToDictionary(x => x.QuestionId, x => x.Mark));

        var allAnswers = await _context.StudentExamAnswers.AsNoTracking().Where(sea => sea.ExamDetailsId.HasValue && examIds.Contains(sea.ExamDetailsId.Value))
            .Select(sea => new { sea.AccountId, sea.ExamDetailsId, sea.QuestionBankId, sea.Score }).ToListAsync();

        var studentIds = allAnswers.Select(x => x.AccountId).Distinct().ToList();
        var students = await _context.Accounts.AsNoTracking().Include(a => a.StudentExtension).Where(a => studentIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);

        var leaderboardEntries = allAnswers.GroupBy(a => a.AccountId).Select(group => {
            if (!students.TryGetValue(group.Key, out var s) || (filters?.ClassId.HasValue == true && s.StudentExtension?.ClassId != filters.ClassId.Value)) return null;
            var examGroups = group.GroupBy(a => a.ExamDetailsId!.Value);
            double totalP = 0; int ec = 0;
            foreach (var eg in examGroups) {
                if (!examTotalMarksMap.TryGetValue(eg.Key, out double max) || max <= 0) continue;
                var qm = examQuestionMarksMap[eg.Key];
                double earned = eg.Where(ans => ans.Score && ans.QuestionBankId.HasValue && qm.ContainsKey(ans.QuestionBankId.Value)).Sum(ans => qm[ans.QuestionBankId!.Value]);
                totalP += (earned / max) * 100.0; ec++;
            }
            return ec > 0 ? new LeaderboardEntryDto { StudentId = group.Key, StudentName = s.FullNameEn ?? "Unknown", Score = Math.Round(totalP / ec, 2) } : null;
        }).Where(x => x != null).Cast<LeaderboardEntryDto>().OrderByDescending(e => e.Score).ToList();

        for (int i = 0; i < leaderboardEntries.Count; i++) leaderboardEntries[i].Rank = i + 1;

        LeaderboardDto result;
        if (string.Equals(filters?.GroupBy, "Class", StringComparison.OrdinalIgnoreCase)) {
            var classes = await _context.TblClasses.AsNoTracking().Where(c => !filters.GradeId.HasValue || c.GradeId == filters.GradeId.Value).ToListAsync();
            var classScores = leaderboardEntries
                .Select(e => new { e.Score, ClassId = students.TryGetValue(e.StudentId, out var s) ? s.StudentExtension?.ClassId : null })
                .Where(x => x.ClassId.HasValue)
                .GroupBy(x => x.ClassId!.Value)
                .ToDictionary(g => g.Key, g => g.Average(x => x.Score));
            var classResults = classes.Select(c => new LeaderboardEntryDto { StudentId = c.Id, StudentName = FormatClassName(c.ClassName ?? $"Class {c.Id}"), Score = classScores.ContainsKey(c.Id) ? Math.Round(classScores[c.Id], 2) : 0.0 }).OrderByDescending(e => e.Score).ToList();
            for (int i = 0; i < classResults.Count; i++) classResults[i].Rank = i + 1;
            result = new LeaderboardDto { ExamTitle = "Overall Class Performance", SubjectName = filters?.SubjectId.HasValue == true ? exams.FirstOrDefault(e => e.SubjectId == filters.SubjectId.Value)?.Subject?.StatusName : null, TopStudents = classResults.Take(10).ToList(), TotalParticipants = classResults.Count };
        } else {
            result = new LeaderboardDto { ExamTitle = "Overall Performance", SubjectName = filters?.SubjectId.HasValue == true ? exams.FirstOrDefault(e => e.SubjectId == filters.SubjectId.Value)?.Subject?.StatusName : null, TopStudents = leaderboardEntries.Take(10).ToList(), TotalParticipants = leaderboardEntries.Count };
        }

        _cache.Set(cacheKey, result, CacheDuration);
        return result;
    }

    public async Task<List<TeacherAccountDto>> GetTeachersAsync()
    {
        var teacherRoleIds = await _context.Roles.AsNoTracking().Where(r => r.RoleName.ToLower() == "teacher").Select(r => r.Id).ToListAsync();
        if (!teacherRoleIds.Any()) return new List<TeacherAccountDto>();

        return await _context.Accounts.AsNoTracking()
            .Where(a => teacherRoleIds.Contains(a.RoleId) || _context.AccountRoles.Any(ar => ar.AccountId == a.Id && ar.RoleId.HasValue && teacherRoleIds.Contains(ar.RoleId.Value)))
            .Select(a => new TeacherAccountDto { Id = a.Id, FullNameEn = a.FullNameEn, Email = a.Email, IsActive = a.IsActive, TotalExams = _context.ExamDetails.Count(e => e.CreatedBy_AccId == a.Id) })
            .Distinct().ToListAsync();
    }
}
