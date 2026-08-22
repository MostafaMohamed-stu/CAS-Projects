using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

using SchoolAdmission.Models;
namespace SchoolAdmission.Data;

public partial class SchoolAdmissionDbContext : DbContext
{
    public SchoolAdmissionDbContext()
    {
    }

    public SchoolAdmissionDbContext(DbContextOptions<SchoolAdmissionDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; }

    public virtual DbSet<AccountRole> AccountRoles { get; set; }

    public virtual DbSet<AdmissionProfile> AdmissionProfiles { get; set; }

    public virtual DbSet<ExamQuestion> ExamQuestions { get; set; }

    public virtual DbSet<InterviewScore> InterviewScores { get; set; }

    public virtual DbSet<Login> Logins { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Section> Sections { get; set; }

    public virtual DbSet<StudentExamAnswer> StudentExamAnswers { get; set; }

    public virtual DbSet<StudentExamResult> StudentExamResults { get; set; }

    public virtual DbSet<HubSettings> HubSettings { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.UseCollation("Arabic_100_CI_AI");

        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("Account");

            entity.HasIndex(e => e.Email, "UQ__Account__A9D10534CCE8DFA0").IsUnique();

            entity.HasIndex(e => e.NationalId, "UQ__Account__E9AA32FA70EBBAC3").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("Created_at");
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.FullNameAr).HasColumnName("FullNameAR");
            entity.Property(e => e.FullNameEn).HasColumnName("FullNameEN");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.NationalId).HasMaxLength(50);
            entity.Property(e => e.StatusId).HasDefaultValue(1L);

            entity.HasOne(d => d.Role).WithMany(p => p.Accounts)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Account_Roles");
        });

        modelBuilder.Entity<AccountRole>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_AccountRoles_Account");

            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.AccountId).HasColumnName("AccountID");
            entity.Property(e => e.RoleId).HasColumnName("RoleID");
        });

        modelBuilder.Entity<AdmissionProfile>(entity =>
        {
            entity.HasKey(e => e.AccountId);

            entity.ToTable("AdmissionProfile");

            entity.Property(e => e.AccountId).ValueGeneratedNever();
            entity.Property(e => e.ArabicInterviewScore).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.EnglishInterviewScore).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.EnglishScore).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.HasIcdllicense).HasColumnName("HasICDLLicense");
            entity.Property(e => e.MathInterviewScore).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.MathScore).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.MinistryExamPercentage).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.ParentPhoneNumber).HasMaxLength(20);
            entity.Property(e => e.SoftwareInterviewScore).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.StatusId).HasDefaultValue(1L);
            entity.Property(e => e.ThirdPrepScore).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.Account).WithOne(p => p.AdmissionProfile)
                .HasForeignKey<AdmissionProfile>(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AdmissionProfile_Account");
        });

        modelBuilder.Entity<ExamQuestion>(entity =>
        {
            entity.ToTable("ExamQuestion");
        });

        modelBuilder.Entity<InterviewScore>(entity =>
        {
            entity.ToTable("InterviewScore");

            entity.Property(e => e.Score).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.Account).WithMany(p => p.InterviewScoreAccounts)
                .HasForeignKey(d => d.AccountId)
                .HasConstraintName("FK_InterviewScore_Student_Account");

            entity.HasOne(d => d.Interviewer).WithMany(p => p.InterviewScoreInterviewers)
                .HasForeignKey(d => d.InterviewerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InterviewScore_Admin_Account");
        });

        modelBuilder.Entity<Login>(entity =>
        {
            entity.ToTable("Login");

            entity.Property(e => e.StatusId).HasDefaultValue(1L);

            entity.HasOne(d => d.Account).WithMany(p => p.Logins)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Login_Account");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(e => e.RoleName, "NonClusteredIndex-20250911-154853");

            entity.Property(e => e.RoleName).HasMaxLength(50);
        });

        modelBuilder.Entity<Section>(entity =>
        {
            entity.ToTable("Section");

            entity.HasIndex(e => e.SectionName, "UQ_Section_SectionName").IsUnique();

            entity.Property(e => e.SectionName).HasMaxLength(100);
        });

        modelBuilder.Entity<StudentExamAnswer>(entity =>
        {
            entity.ToTable("StudentExamAnswer");


            entity.HasOne(d => d.Account).WithMany(p => p.StudentExamAnswers)
                .HasForeignKey(d => d.AccountId)
                .HasConstraintName("FK_StudentExamAnswer_Account");
        });

        modelBuilder.Entity<StudentExamResult>(entity =>
        {
            entity.HasKey(e => e.AccountId);

            entity.ToTable("StudentExamResult");

            entity.Property(e => e.AccountId).ValueGeneratedNever();
            entity.Property(e => e.ExamIqScore).HasColumnName("ExamIQScore");
            entity.Property(e => e.ExamStartedAtUtc).HasColumnName("ExamStartedAtUtc").HasColumnType("datetime2");
            entity.Property(e => e.ExtensionMinutes).HasColumnName("ExtensionMinutes");

            entity.HasOne(d => d.Account).WithOne(p => p.StudentExamResult)
                .HasForeignKey<StudentExamResult>(d => d.AccountId)
                .HasConstraintName("FK_StudentExamResult_Account");
        });

modelBuilder.Entity<HubSettings>(entity =>
{
    entity.ToTable("HUB_Settings");

    entity.HasIndex(e => e.VersionNumber).IsUnique();

    entity.HasIndex(e => e.SettingStatusId, "UX_HUB_Settings_OneActive")
        .IsUnique()
        .HasFilter("[Setting_StatusID] = 1");

    entity.Property(e => e.VersionName).HasMaxLength(150);
    entity.Property(e => e.SettingStatusId).HasColumnName("Setting_StatusID");
    entity.Property(e => e.SchoolExamWeight).HasColumnType("decimal(6, 2)");
    entity.Property(e => e.InterviewWeight).HasColumnType("decimal(6, 2)");
    entity.Property(e => e.PreparatoryCertificateWeight).HasColumnType("decimal(6, 2)");
    entity.Property(e => e.MinistryExamWeight).HasColumnType("decimal(6, 2)");
    entity.Property(e => e.ArabicWeight).HasColumnType("decimal(6, 2)");
    entity.Property(e => e.EnglishWeight).HasColumnType("decimal(6, 2)");
    entity.Property(e => e.MathWeight).HasColumnType("decimal(6, 2)");
    entity.Property(e => e.SoftwareWeight).HasColumnType("decimal(6, 2)");
    entity.Property(e => e.IqWeight).HasColumnType("decimal(6, 2)");
    entity.Property(e => e.CreatedAtUtc).HasColumnType("datetime2");
});

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
