using System;
using System.Collections.Generic;

namespace SchoolAdmission.Models;

public partial class Account
{
    public long Id { get; set; }

    public string NationalId { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public long RoleId { get; set; }

    public string FullNameEn { get; set; } = null!;

    public string FullNameAr { get; set; } = null!;

    public string? ResetToken { get; set; }

    public DateTime? ResetTokenExpiry { get; set; }

    public DateOnly? CreatedAt { get; set; }

    public bool IsActive { get; set; }

    public long StatusId { get; set; }

    public virtual AdmissionProfile? AdmissionProfile { get; set; }

    public virtual ICollection<InterviewScore> InterviewScoreAccounts { get; set; } = new List<InterviewScore>();

    public virtual ICollection<InterviewScore> InterviewScoreInterviewers { get; set; } = new List<InterviewScore>();

    public virtual ICollection<Login> Logins { get; set; } = new List<Login>();

    public virtual Role Role { get; set; } = null!;

    public virtual ICollection<StudentExamAnswer> StudentExamAnswers { get; set; } = new List<StudentExamAnswer>();

    public virtual StudentExamResult? StudentExamResult { get; set; }


}
