using System;
using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.Models;

public partial class Status
{
    public long Id { get; set; }

    public string StatusName { get; set; } = null!;

    public string? BusinessEntity { get; set; }

    public int? OrderNo { get; set; }

    public virtual ICollection<Account> Accounts { get; set; } = new List<Account>();

    public virtual ICollection<AdmissionProfile> AdmissionProfiles { get; set; } = new List<AdmissionProfile>();

    public virtual ICollection<CapstoneSupervisorExtension> CapstoneSupervisorExtensions { get; set; } = new List<CapstoneSupervisorExtension>();

    public virtual ICollection<EmploymentRequest> EmploymentRequests { get; set; } = new List<EmploymentRequest>();

    public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();

    public virtual ICollection<Login> Logins { get; set; } = new List<Login>();

    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();

    public virtual ICollection<ReportSpecialist> ReportSpecialists { get; set; } = new List<ReportSpecialist>();

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    public virtual ICollection<ReviewerSupervisorExtension> ReviewerSupervisorExtensions { get; set; } = new List<ReviewerSupervisorExtension>();

    public virtual ICollection<Scholarship> Scholarships { get; set; } = new List<Scholarship>();

    public virtual ICollection<Session> Sessions { get; set; } = new List<Session>();

    public virtual ICollection<StudentExtension> StudentExtensions { get; set; } = new List<StudentExtension>();

    public virtual ICollection<StudentTask> StudentTasks { get; set; } = new List<StudentTask>();

    public virtual ICollection<SubordinateTicket> SubordinateTickets { get; set; } = new List<SubordinateTicket>();

    public virtual ICollection<SuperAdminExtension> SuperAdminExtensions { get; set; } = new List<SuperAdminExtension>();

    public virtual ICollection<TblTask> TblTasks { get; set; } = new List<TblTask>();

    public virtual ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();

    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();

    public virtual ICollection<TicketType> TicketTypes { get; set; } = new List<TicketType>();
}
