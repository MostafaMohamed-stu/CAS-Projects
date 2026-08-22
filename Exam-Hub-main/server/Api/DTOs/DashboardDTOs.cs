namespace QuizesApi.DTOs;

// Student Dashboard Response
public class StudentDashboardDto
{
    public long StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int TotalExamsTaken { get; set; }
    public double PassPercentage { get; set; }
    public double FailPercentage { get; set; }
    public LeaderboardDto? LatestExamLeaderboard { get; set; }
    public int? StudentRankInLatestExam { get; set; }
    public List<StudentRecentExamDto> RecentExams { get; set; } = new();
    public List<ChartDataPointDto> ScoreDistribution { get; set; } = new();
}

public class ChartDataPointDto
{
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
}

public class StudentRecentExamDto
{
    public long ExamId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? SubjectName { get; set; }
    public double? StudentScore { get; set; }
    public double? AverageScore { get; set; }
    public DateTime Date { get; set; }
}

// Teacher Dashboard Response
public class TeacherDashboardDto
{
    public long TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int TotalExamsCreated { get; set; }
    public double AveragePassPercentage { get; set; }
    public double AverageFailPercentage { get; set; }
    public int TotalStudentsWhoTookExams { get; set; }
    public List<ExamStatsDto> ExamBreakdown { get; set; } = new();
    public LeaderboardDto? LatestExamLeaderboard { get; set; }
    public List<ExamSelectionDto> RecentExams { get; set; } = new();
    public List<ChartDataPointDto> ScoreDistribution { get; set; } = new();
}

public class ExamSelectionDto
{
    public long ExamId { get; set; }
    public string Title { get; set; } = string.Empty;
}

// Superadmin Dashboard Response
public class SuperadminDashboardDto
{
    public int TotalExams { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public double OverallPassPercentage { get; set; }
    public double OverallFailPercentage { get; set; }
    public List<LeaderboardEntryDto> TopPerformingStudents { get; set; } = new();
    public List<TopTeacherDto> TopPerformingTeachers { get; set; } = new();
    public List<RecentActivityDto> RecentActivity { get; set; } = new();
    public List<ExamSelectionDto> RecentExams { get; set; } = new();
    public List<ChartDataPointDto> ScoreDistribution { get; set; } = new();
    public List<ExamStatsDto> ExamBreakdown { get; set; } = new();
}

// Leaderboard Response
public class LeaderboardDto
{
    public long ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public string? SubjectName { get; set; }
    public List<LeaderboardEntryDto> TopStudents { get; set; } = new();
    public List<LeaderboardEntryDto> HighlightedStudents { get; set; } = new(); // Top 3 highest scores
    public int TotalParticipants { get; set; }
}

// Individual Leaderboard Entry
public class LeaderboardEntryDto
{
    public long StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public double Score { get; set; }
    public int Rank { get; set; }
    public int TotalMarks { get; set; }
    public int EarnedMarks { get; set; }
}

// Exam Statistics
public class ExamStatsDto
{
    public long ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public string? SubjectName { get; set; }
    public int TotalStudents { get; set; }
    public int PassedStudents { get; set; }
    public int FailedStudents { get; set; }
    public double PassPercentage { get; set; }
    public double FailPercentage { get; set; }
    public double AverageScore { get; set; }
}

// Top Teacher
public class TopTeacherDto
{
    public long TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int TotalExams { get; set; }
    public double AverageStudentScore { get; set; }
    public int TotalStudents { get; set; }
}

// Student Performance for Teacher/Admin Dashboard
public class StudentPerformanceDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public string Class { get; set; } = string.Empty;
    public Dictionary<string, double> QuizScores { get; set; } = new();
}

public class RecentActivityDto
{
    public string ActivityType { get; set; } = string.Empty; // "ExamCreated", "ExamCompleted", etc.
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public long? RelatedExamId { get; set; }
    public long? RelatedAccountId { get; set; }
}

// Filter Model for Leaderboard
public class LeaderboardFilterDto
{
    public long? GradeId { get; set; }
    public long? ClassId { get; set; }
    public long? ExamId { get; set; }
    public long? SubjectId { get; set; }
    public string? SearchTerm { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string GroupBy { get; set; } = "Student"; // "Student" or "Class"
}
// Teacher Account Information for Superadmin
public class TeacherAccountDto
{
    public long Id { get; set; }
    public string FullNameEn { get; set; } = string.Empty;
    public string FullNameAr { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int TotalExams { get; set; }
}

public class TeacherPerformanceDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public string Class { get; set; } = string.Empty;
    public Dictionary<string, double> QuizScores { get; set; } = new();
}
