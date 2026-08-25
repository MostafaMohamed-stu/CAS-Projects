using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elsewedy_Capstone_System.Models;

public class SchoolDbContext : DbContext
{
    public SchoolDbContext(DbContextOptions<SchoolDbContext> options) : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; }
    public virtual DbSet<Login> Logins { get; set; }
    public virtual DbSet<Role> Roles { get; set; }
    public virtual DbSet<AccountRole> AccountRoles { get; set; }
    public virtual DbSet<Status> Statuses { get; set; }
    public virtual DbSet<Grade> Grades { get; set; }
    public virtual DbSet<TblClass> TblClasses { get; set; }
    public virtual DbSet<TblTask> TblTasks { get; set; }
    public virtual DbSet<Team> Teams { get; set; }
    public virtual DbSet<TeamMember> TeamMembers { get; set; }
    public virtual DbSet<TaskSubmission> TaskSubmissions { get; set; }
    public virtual DbSet<StudentExtension> StudentExtensions { get; set; }
    public virtual DbSet<SuperAdminExtension> SuperAdminExtensions { get; set; }
    public virtual DbSet<CapstoneSupervisorExtension> CapstoneSupervisorExtensions { get; set; }
    public virtual DbSet<ReviewerSupervisorExtension> ReviewerSupervisorExtensions { get; set; }
    public virtual DbSet<Report> Reports { get; set; }
    public virtual DbSet<Project> Projects { get; set; }
    public virtual DbSet<Week> Weeks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.FullNameEn).HasMaxLength(100);
            entity.Property(e => e.FullNameAr).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.NationalId).HasMaxLength(20);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.ResetToken).HasMaxLength(255);
            entity.Property(e => e.ResetTokenExpiry);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Login>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.HasOne(d => d.Account).WithMany(p => p.Logins)
                .HasForeignKey(d => d.AccountId)
                .HasConstraintName("FK_Login_Account");
            entity.HasOne(d => d.Status).WithMany(p => p.Logins)
                .HasForeignKey(d => d.StatusId)
                .HasConstraintName("FK_Login_Status");
        });

        modelBuilder.Entity<Status>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.StatusName).HasMaxLength(50);
            entity.Property(e => e.BusinessEntity).HasMaxLength(50);
            entity.Property(e => e.OrderNo);
        });

        modelBuilder.Entity<Grade>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.GradeName).HasMaxLength(50);
            entity.Property(e => e.StatusId);
        });

        modelBuilder.Entity<TblClass>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ClassName).HasMaxLength(100);
            entity.Property(e => e.GradeId);
            entity.Property(e => e.StatusId);
        });

        modelBuilder.Entity<TblTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TaskName).HasMaxLength(200);
            entity.Property(e => e.TaskDescription).HasMaxLength(1000);
            entity.Property(e => e.TaskDeadline);
            entity.Property(e => e.StatusId);
            entity.Property(e => e.GradeId);
            entity.Property(e => e.ClassId);
            entity.Property(e => e.TeamId);
            entity.Property(e => e.AdminAccountId);
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TeamName).HasMaxLength(100);
            entity.Property(e => e.ClassId);
            entity.Property(e => e.SupervisorAccountId);
            entity.Property(e => e.TeamLeaderAccountId);
        });

        modelBuilder.Entity<TeamMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TeamId);
            entity.Property(e => e.TeamMemberAccountId);
            entity.Property(e => e.TeamMemberDescription).HasMaxLength(500);
            entity.Property(e => e.StatusId);
        });

        modelBuilder.Entity<TaskSubmission>(entity =>
        {
            entity.HasKey(e => e.TaskSubmissionId);
            entity.Property(e => e.TaskSubmissionId).ValueGeneratedOnAdd();
            entity.Property(e => e.TeamId);
            entity.Property(e => e.TeamLeaderId);
            entity.Property(e => e.GradeId);
            entity.Property(e => e.TaskId);
            entity.Property(e => e.Glink).HasMaxLength(500);
            entity.Property(e => e.Note).HasMaxLength(1000);
            entity.Property(e => e.Feedback).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.StatusId);
        });

        modelBuilder.Entity<StudentExtension>(entity =>
        {
            entity.HasKey(e => e.AccountId);
            entity.Property(e => e.AccountId).ValueGeneratedNever();
            entity.Property(e => e.ClassId);
            entity.Property(e => e.StatusId);
        });

        modelBuilder.Entity<SuperAdminExtension>(entity =>
        {
            entity.HasKey(e => e.AccountId);
            entity.Property(e => e.AccountId).ValueGeneratedNever();
            entity.Property(e => e.StatusId);
        });

        modelBuilder.Entity<CapstoneSupervisorExtension>(entity =>
        {
            entity.HasKey(e => e.AccountId);
            entity.Property(e => e.AccountId).ValueGeneratedNever();
            entity.Property(e => e.StatusId);
        });

        modelBuilder.Entity<ReviewerSupervisorExtension>(entity =>
        {
            entity.HasKey(e => e.AccountId);
            entity.Property(e => e.AccountId).ValueGeneratedNever();
            entity.Property(e => e.AssignedClassId);
            entity.Property(e => e.StatusId);
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.SubmitterAccountId);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.ReportMessage).HasMaxLength(2000);
            entity.Property(e => e.SubmissionDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.StatusId);
        });

        modelBuilder.Entity<AccountRole>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RoleId);
            entity.Property(e => e.AccountId);
            entity.Property(e => e.BusinessEntityName).HasMaxLength(100);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.NameEn).HasMaxLength(200).IsRequired();
            entity.Property(e => e.NameAr).HasMaxLength(200);
            entity.Property(e => e.CompanyName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.AdditionalInformation).HasMaxLength(2000);
            entity.Property(e => e.ProjectDescription).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.DateOfCreation).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.StatusId).IsRequired();
            entity.Property(e => e.SupervisorAccountId).IsRequired();
        });


        modelBuilder.Entity<TblTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TaskName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.TaskDescription).HasMaxLength(500);
            entity.Property(e => e.TaskDeadline).HasColumnType("datetime");
            entity.Property(e => e.WeekId).IsRequired();

            // Relationship removed due to type mismatch
            /*entity.HasOne(d => d.Week)
                .WithMany()
                .HasForeignKey(d => d.WeekId)
                .OnDelete(DeleteBehavior.Restrict) 
                .HasConstraintName("FK_Tbl_Task_Weeks");*/
        });

        modelBuilder.Entity<Week>(entity =>
        {
            entity.HasKey(e => e.Id);
        });
    }
}
