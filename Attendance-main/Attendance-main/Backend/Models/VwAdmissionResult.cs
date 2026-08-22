using System;
using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.Models;

public partial class VwAdmissionResult
{
    public string? City { get; set; }

    public string StudName { get; set; } = null!;

    public string SocialId { get; set; } = null!;

    public string PrepScores { get; set; } = null!;

    public decimal? PrepFinal { get; set; }

    public decimal MinistryExam { get; set; }

    public string? InterviewersScores { get; set; }

    public decimal? InterviewersSumScores { get; set; }

    public int? InterviewersCount { get; set; }

    public decimal? InterviewersAvgScores { get; set; }

    public string SchoolExamSectionScores { get; set; } = null!;

    public int? SchoolExamSectionSumScores { get; set; }

    public int SchoolExamSectionCount { get; set; }

    public decimal? SchoolExamSectionScoresAvg { get; set; }

    public decimal? ResultAdmission1 { get; set; }

    public decimal? ResultAdmission2 { get; set; }
}
