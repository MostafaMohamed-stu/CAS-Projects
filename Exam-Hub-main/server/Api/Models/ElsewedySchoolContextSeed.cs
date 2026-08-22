using System;
using System.Linq;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace QuizesApi.Models;

public static class ElsewedySchoolContextSeed
{
	public static async Task SeedAsync(ElsewedySchoolSysDbDevContext db)
	{
		// Seed roles
		if (!db.Roles.Any(r => r.BusinessEntity == "Quizes System"))
		{
			db.Roles.AddRange(
				new Role { RoleName = "Admin", BusinessEntity = "Quizes System" },
				new Role { RoleName = "Teacher", BusinessEntity = "Quizes System" },
				new Role { RoleName = "Student", BusinessEntity = "Quizes System" }
			);
			await db.SaveChangesAsync();
		}

		string Hash(string raw)
		{
			using var sha = System.Security.Cryptography.SHA256.Create();
			var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
			var sb = new StringBuilder(bytes.Length * 2);
			foreach (var b in bytes) sb.Append(b.ToString("x2"));
			return sb.ToString();
		}

        // Seed accounts
        if (!db.Accounts.Any(a => a.Email.EndsWith("@quiz.local")))
        {
            var adminRole = db.Roles.First(r => r.RoleName == "Admin" && r.BusinessEntity == "Quizes System");
            var teacherRole = db.Roles.First(r => r.RoleName == "Teacher" && r.BusinessEntity == "Quizes System");
            var studentRole = db.Roles.First(r => r.RoleName == "Student" && r.BusinessEntity == "Quizes System");

            // Ensure a valid Status Id exists for FK
            var statusId = await db.Statuses.Select(s => s.Id).OrderBy(id => id).FirstOrDefaultAsync();
            if (statusId == 0)
            {
                db.Statuses.Add(new Status { StatusName = "Active", BusinessEntity = "Quizes System", OrderNo = 1 });
                await db.SaveChangesAsync();
                statusId = await db.Statuses.Select(s => s.Id).OrderBy(id => id).FirstAsync();
            }

            var admin = new Account { Email = "admin@quiz.local", PasswordHash = Hash("Admin#123"), FullNameEn = "Admin User", FullNameAr = "Admin", NationalId = "ADMIN-NID-0001", RoleId = adminRole.Id, IsActive = true, StatusId = statusId };
            var teacher = new Account { Email = "teacher@quiz.local", PasswordHash = Hash("Teacher#123"), FullNameEn = "Teacher User", FullNameAr = "Teacher", NationalId = "TEACHER-NID-0001", RoleId = teacherRole.Id, IsActive = true, StatusId = statusId };
            var student = new Account { Email = "student@quiz.local", PasswordHash = Hash("Student#123"), FullNameEn = "Student User", FullNameAr = "Student", NationalId = "STUDENT-NID-0001", RoleId = studentRole.Id, IsActive = true, StatusId = statusId };
            db.Accounts.AddRange(admin, teacher, student);
            await db.SaveChangesAsync();

            db.AccountRoles.AddRange(
                new AccountRole { AccountId = admin.Id, RoleId = adminRole.Id, BusinessEntityName = "Quizes System" },
                new AccountRole { AccountId = teacher.Id, RoleId = teacherRole.Id, BusinessEntityName = "Quizes System" },
                new AccountRole { AccountId = student.Id, RoleId = studentRole.Id, BusinessEntityName = "Quizes System" }
            );
            await db.SaveChangesAsync();

            // Seed test data for class-based quiz visibility
            if (!db.TblClasses.Any(c => c.ClassName == "Class A" || c.ClassName == "Class B" || c.ClassName == "Class C"))
            {
                // Ensure we have a grade
                var testGrade = await db.Grades.FirstOrDefaultAsync(g => g.GradeName == "Test Grade");
                if (testGrade == null)
                {
                    testGrade = new Grade { GradeName = "Test Grade", StatusId = statusId };
                    db.Grades.Add(testGrade);
                    await db.SaveChangesAsync();
                }

                // Create 3 classes
                var classA = new TblClass { ClassName = "Class A", GradeId = testGrade.Id, StatusId = testGrade.StatusId };
                var classB = new TblClass { ClassName = "Class B", GradeId = testGrade.Id, StatusId = testGrade.StatusId };
                var classC = new TblClass { ClassName = "Class C", GradeId = testGrade.Id, StatusId = testGrade.StatusId };
                db.TblClasses.AddRange(classA, classB, classC);
                await db.SaveChangesAsync();

                // Create 6 student accounts (2 per class)
                var students = new List<Account>
                {
                    new Account { Email = "student1@classa.test", PasswordHash = Hash("Student#123"), FullNameEn = "Student 1 Class A", FullNameAr = "طالب 1 فصل أ", NationalId = "STU-A1", RoleId = studentRole.Id, IsActive = true, StatusId = statusId },
                    new Account { Email = "student2@classa.test", PasswordHash = Hash("Student#123"), FullNameEn = "Student 2 Class A", FullNameAr = "طالب 2 فصل أ", NationalId = "STU-A2", RoleId = studentRole.Id, IsActive = true, StatusId = statusId },
                    new Account { Email = "student1@classb.test", PasswordHash = Hash("Student#123"), FullNameEn = "Student 1 Class B", FullNameAr = "طالب 1 فصل ب", NationalId = "STU-B1", RoleId = studentRole.Id, IsActive = true, StatusId = statusId },
                    new Account { Email = "student2@classb.test", PasswordHash = Hash("Student#123"), FullNameEn = "Student 2 Class B", FullNameAr = "طالب 2 فصل ب", NationalId = "STU-B2", RoleId = studentRole.Id, IsActive = true, StatusId = statusId },
                    new Account { Email = "student1@classc.test", PasswordHash = Hash("Student#123"), FullNameEn = "Student 1 Class C", FullNameAr = "طالب 1 فصل ج", NationalId = "STU-C1", RoleId = studentRole.Id, IsActive = true, StatusId = statusId },
                    new Account { Email = "student2@classc.test", PasswordHash = Hash("Student#123"), FullNameEn = "Student 2 Class C", FullNameAr = "طالب 2 فصل ج", NationalId = "STU-C2", RoleId = studentRole.Id, IsActive = true, StatusId = statusId }
                };
                db.Accounts.AddRange(students);
                await db.SaveChangesAsync();

                // Create AccountRoles for students
                var accountRoles = students.Select(s => new AccountRole 
                { 
                    AccountId = s.Id, 
                    RoleId = studentRole.Id, 
                    BusinessEntityName = "Quizes System" 
                }).ToList();
                db.AccountRoles.AddRange(accountRoles);
                await db.SaveChangesAsync();

                // Create StudentExtension records linking students to classes
                var studentExtensions = new List<StudentExtension>
                {
                    new StudentExtension { AccountId = students[0].Id, ClassId = classA.Id, StatusId = statusId, IsLeader = false },
                    new StudentExtension { AccountId = students[1].Id, ClassId = classA.Id, StatusId = statusId, IsLeader = false },
                    new StudentExtension { AccountId = students[2].Id, ClassId = classB.Id, StatusId = statusId, IsLeader = false },
                    new StudentExtension { AccountId = students[3].Id, ClassId = classB.Id, StatusId = statusId, IsLeader = false },
                    new StudentExtension { AccountId = students[4].Id, ClassId = classC.Id, StatusId = statusId, IsLeader = false },
                    new StudentExtension { AccountId = students[5].Id, ClassId = classC.Id, StatusId = statusId, IsLeader = false }
                };
                db.StudentExtensions.AddRange(studentExtensions);
                await db.SaveChangesAsync();

                // Get teacher account for creating quizzes
                var teacherAccount = await db.Accounts.FirstOrDefaultAsync(a => a.Email == "teacher@quiz.local");
                
                if (teacherAccount != null)
                {
                    // Create 3 quizzes with different class assignments
                    var now = DateTime.UtcNow;
                    string subjectName = "Mathematics";
                    
                    // Quiz 1: Assigned to Class A
                    var quiz1 = new ExamDetail
                    {
                        Title = "Math Quiz for Class A",
                        ExamDescription = "A mathematics quiz assigned to Class A",
                        ExamSubject = subjectName,
                        GradeId = testGrade.Id,
                        ClassId = $",{classA.Id},",
                        StartDate = now.AddDays(1),
                        EndDate = now.AddDays(2),
                    };
                    db.ExamDetails.Add(quiz1);
                    
                    // Quiz 2: Assigned to Class B 
                    var quiz2 = new ExamDetail
                    {
                        Title = "Math Quiz for Classes B",
                        ExamDescription = "A mathematics quiz assigned to Class B",
                        ExamSubject = subjectName,
                        GradeId = testGrade.Id,
                        ClassId = $",{classB.Id},",
                        StartDate = now.AddDays(2),
                        EndDate = now.AddDays(3),
                    };
                    db.ExamDetails.Add(quiz2);

                    // Quiz 3: Assigned to Class C
                    var quiz3 = new ExamDetail
                    {
                        Title = "Math Quiz for Class C",
                        ExamDescription = "A mathematics quiz assigned to Class C",
                        ExamSubject = subjectName,
                        GradeId = testGrade.Id,
                        ClassId = $",{classC.Id},",
                        StartDate = now.AddDays(3),
                        EndDate = now.AddDays(4),
                    };
                    db.ExamDetails.Add(quiz3);

                    await db.SaveChangesAsync();
                }
            }
        }
	}
}
