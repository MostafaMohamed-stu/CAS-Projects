using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class CourseRound
{
    public long Id { get; set; }

    public long CourseId { get; set; }

    public int RoundNumber { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public long? MaxStudents { get; set; }

    public long MainInstructorId { get; set; }

    public long StatusId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? Question1 { get; set; }

    public string? Question2 { get; set; }

    public string? Question3 { get; set; }

    public string? Question4 { get; set; }

    public string? Question5 { get; set; }

    public string? Question6 { get; set; }

    public string? Question7 { get; set; }

    public string? Question8 { get; set; }

    public string? Question9 { get; set; }

    public string? Question10 { get; set; }
}
