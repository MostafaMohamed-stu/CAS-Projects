using System;
using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.Models;

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

    public virtual ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();

    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    public virtual CapstoneSupervisorExtension? CapstoneSupervisorExtension { get; set; }

    public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();

    public virtual ICollection<InterviewScore> InterviewScoreAccounts { get; set; } = new List<InterviewScore>();

    public virtual ICollection<InterviewScore> InterviewScoreInterviewers { get; set; } = new List<InterviewScore>();

    public virtual ICollection<Login> Logins { get; set; } = new List<Login>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    public virtual ReviewerSupervisorExtension? ReviewerSupervisorExtension { get; set; }

    public virtual Role Role { get; set; } = null!;

    public virtual Status Status { get; set; } = null!;

    public virtual ICollection<StudentExamAnswer> StudentExamAnswers { get; set; } = new List<StudentExamAnswer>();

    public virtual StudentExamResult? StudentExamResult { get; set; }

    public virtual StudentExtension? StudentExtension { get; set; }

    public virtual ICollection<StudentTask> StudentTasks { get; set; } = new List<StudentTask>();

    public virtual ICollection<SubordinateTicket> SubordinateTickets { get; set; } = new List<SubordinateTicket>();

    public virtual SuperAdminExtension? SuperAdminExtension { get; set; }

    public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();

    public virtual ICollection<TblTask> TblTasks { get; set; } = new List<TblTask>();

    public virtual ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();

    public virtual ICollection<Team> TeamSupervisorAccounts { get; set; } = new List<Team>();

    public virtual ICollection<Team> TeamTeamLeaderAccounts { get; set; } = new List<Team>();
    public virtual AccountRole ?AccountRoles { get; set; } 


}
