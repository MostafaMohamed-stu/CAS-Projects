using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SchoolAdmission.DTOs;
using SchoolAdmission.Services;
using SchoolAdmission.Repos.IRepos;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using SchoolAdmission.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Collections.Generic;
using System;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminRepo _adminRepo;
    private readonly IAuthRepo _authRepo;
    private readonly SchoolAdmissionDbContext _db;
    private static readonly List<ExportColumnDefinitionDTO> ExportableColumns = new()
    {
        new ExportColumnDefinitionDTO { Key = "StudentNameEnglish", Label = "Student Name English", Description = "English full name of the applicant" },
        new ExportColumnDefinitionDTO { Key = "StudentNameArabic", Label = "Student Name Arabic", Description = "Arabic full name of the applicant" },
        new ExportColumnDefinitionDTO { Key = "CreatedAt", Label = "Created At", Description = "Date the student record was created" },
        new ExportColumnDefinitionDTO { Key = "SocialID", Label = "National ID", Description = "National identification number" },
        new ExportColumnDefinitionDTO { Key = "MathPrepScore", Label = "Math Prep Score", Description = "Preparatory Math score" },
        new ExportColumnDefinitionDTO { Key = "EnglishPrepScore", Label = "English Prep Score", Description = "Preparatory English score" },
        new ExportColumnDefinitionDTO { Key = "Prep_Final%", Label = "Prep Final %", Description = "Final year percentage" },
        new ExportColumnDefinitionDTO { Key = "MinistryExam%", Label = "Ministry Exam %", Description = "Ministry exam percentage" },
        new ExportColumnDefinitionDTO { Key = "Interviewer1Score", Label = "Interviewer 1 Score", Description = "Score from the first interviewer" },
        new ExportColumnDefinitionDTO { Key = "Interviewer2Score", Label = "Interviewer 2 Score", Description = "Score from the second interviewer" },
        new ExportColumnDefinitionDTO { Key = "Interviewer3Score", Label = "Interviewer 3 Score", Description = "Score from the third interviewer" },
        new ExportColumnDefinitionDTO { Key = "Interviewers_SUM_Scores", Label = "Interviewers Sum", Description = "Sum of interviewer scores" },
        new ExportColumnDefinitionDTO { Key = "Interviewers_Count", Label = "Interviewers Count", Description = "Number of interviewers" },
        new ExportColumnDefinitionDTO { Key = "Interviewers_AVG_Scores%", Label = "Interview Average %", Description = "Average interviewer score (percentage)" },
        new ExportColumnDefinitionDTO { Key = "ExamArabicScore", Label = "Arabic Exam Score", Description = "School exam Arabic score" },
        new ExportColumnDefinitionDTO { Key = "ExamEnglishScore", Label = "English Exam Score", Description = "School exam English score" },
        new ExportColumnDefinitionDTO { Key = "ExamMathScore", Label = "Math Exam Score", Description = "School exam Math score" },
        new ExportColumnDefinitionDTO { Key = "ExamSoftwareScore", Label = "Software Exam Score", Description = "School exam Software score" },
        new ExportColumnDefinitionDTO { Key = "ExamIQScore", Label = "IQ Exam Score", Description = "School exam IQ score; blank for the pre-IQ cohort" },
        new ExportColumnDefinitionDTO { Key = "SchoolExamSection_SUM_Scores", Label = "Exam Section Sum", Description = "Sum of school exam section scores" },
        new ExportColumnDefinitionDTO { Key = "SchoolExamSection_Count", Label = "Exam Section Count", Description = "Number of school exam sections" },
        new ExportColumnDefinitionDTO { Key = "SchoolExamSection_Scores_AVG%", Label = "Exam Section Avg %", Description = "Average school exam section percentage" },
        new ExportColumnDefinitionDTO { Key = "ResultAdmission1%", Label = "Result Admission 1 %", Description = "Interview 50% + School exam results percentage 50%" },
        new ExportColumnDefinitionDTO { Key = "ResultAdmission2%", Label = "Result Admission 2 %", Description = "Overall result admission percentage" }
    };

    public AdminController(IAdminRepo adminRepo, IAuthRepo authRepo, SchoolAdmissionDbContext db)
    {
        _adminRepo = adminRepo;
        _authRepo = authRepo;
        _db = db;
    }

    [HttpGet("students/paginated")]
    public async Task<IActionResult> GetStudentsPaginated(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? statusFilter = null,
        [FromQuery] string? sortBy = "name",
        [FromQuery] string? sortOrder = "asc")
    {
        try
        {
            var userEmail = await _adminRepo.GetCurrentAdminEmailAsync(User);
            if (string.IsNullOrEmpty(userEmail))
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var adminAccount = await _adminRepo.GetAccountByEmailAsync(userEmail);
            if (adminAccount == null)
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var request = new PaginationRequestDTO
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                SearchTerm = searchTerm,
                StatusFilter = statusFilter,
                SortBy = sortBy,
                SortOrder = sortOrder
            };

            PaginationResponseDTO<dynamic> result;
            var isInterviewer = await _authRepo.IsInterviewerAsync(userEmail);
            var isBoard = await _authRepo.IsBoardAsync(userEmail);
            var isSuperAdmin = await _authRepo.IsSuperAdminAsync(userEmail);
            
            if (isInterviewer)
            {
                result = await _adminRepo.GetStudentsForAdminPaginatedAsync(userEmail, request);
            }
            else if (isBoard || isSuperAdmin)
            {
                result = await _adminRepo.GetStudentsForSuperAdminPaginatedAsync(userEmail, request);
            }
            else
            {
                return Forbid("You do not have permission to view student information.");
            }

            // Always return the result, even if empty (this is normal for filters)
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while retrieving students", ex.Message));
        }
    }



    [HttpGet("students/filter")]
    public async Task<IActionResult> FilterStudents([FromQuery] string? name, [FromQuery] string? nationalId)
    {
        try
        {
            var userEmail = await _adminRepo.GetCurrentAdminEmailAsync(User);
            if (string.IsNullOrEmpty(userEmail))
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var adminAccount = await _adminRepo.GetAccountByEmailAsync(userEmail);
            if (adminAccount == null)
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var isBoard = await _authRepo.IsBoardAsync(userEmail);
            var isSuperAdmin = await _authRepo.IsSuperAdminAsync(userEmail);
            
            if (!isBoard && !isSuperAdmin)
                return Forbid("Only SuperAdmin and Board members can filter students.");

            var result = await _adminRepo.FilterStudentsAsync(name, nationalId);
            if (result.Count == 0)
                return NotFound("No students match the provided filter criteria.");

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while filtering students", ex.Message));
        }
    }



    [HttpPost("student/{studentId}/my-interview-score")]
    public async Task<IActionResult> SetMyInterviewScore(long studentId, [FromBody] double scoreValue)
    {
        try
        {
            var userEmail = await _adminRepo.GetCurrentAdminEmailAsync(User);
            if (string.IsNullOrEmpty(userEmail))
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var adminAccount = await _adminRepo.GetAccountByEmailAsync(userEmail);
            if (adminAccount == null)
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var isInterviewer = await _authRepo.IsInterviewerAsync(userEmail);
            if (!isInterviewer)
                return Forbid("Only interviewers can set or edit their own interview score.");

            await _adminRepo.SetInterviewScoreAsync(studentId, adminAccount.Id, scoreValue);

            return Ok(ApiResponse.SuccessResult("Interview score submitted successfully."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while submitting your interview score", ex.Message));
        }
    }


    [HttpPut("student/{studentId}/status")]
    public async Task<IActionResult> UpdateStudentStatus(long studentId, [FromBody] UpdateStudentStatusDTO dto)
    {
        try
        {
            var userEmail = await _adminRepo.GetCurrentAdminEmailAsync(User);
            if (string.IsNullOrEmpty(userEmail))
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var adminAccount = await _adminRepo.GetAccountByEmailAsync(userEmail);
            if (adminAccount == null)
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var isSuperAdmin = await _authRepo.IsSuperAdminAsync(userEmail);

            if (!isSuperAdmin)
                return Forbid("Only SuperAdmin can update student status.");

            await _adminRepo.UpdateStudentStatusAsync(studentId, dto.Status);

            return Ok(ApiResponse.SuccessResult($"Student status updated successfully to {dto.Status}."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while updating student status", ex.Message));
        }
    }

    [HttpGet("export-students-columns")]
    public async Task<IActionResult> GetExportStudentsColumns()
    {
        try
        {
            var userEmail = await _adminRepo.GetCurrentAdminEmailAsync(User);
            if (string.IsNullOrEmpty(userEmail))
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var adminAccount = await _adminRepo.GetAccountByEmailAsync(userEmail);
            if (adminAccount == null)
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var isBoard = await _authRepo.IsBoardAsync(userEmail);
            var isSuperAdmin = await _authRepo.IsSuperAdminAsync(userEmail);
            
            if (!isBoard && !isSuperAdmin)
                return Forbid("Only SuperAdmin and Board members can configure export data.");

            return Ok(ExportableColumns);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while fetching export columns", ex.Message));
        }
    }

    [HttpPost("export-students-excel")]
    public async Task<IActionResult> ExportStudentsToExcel([FromBody] ExportStudentsRequestDTO? request)
    {
        try
        {
            var userEmail = await _adminRepo.GetCurrentAdminEmailAsync(User);
            if (string.IsNullOrEmpty(userEmail))
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var adminAccount = await _adminRepo.GetAccountByEmailAsync(userEmail);
            if (adminAccount == null)
                return Unauthorized("Admin not found or not authorized. Please log in again.");

            var isBoard = await _authRepo.IsBoardAsync(userEmail);
            var isSuperAdmin = await _authRepo.IsSuperAdminAsync(userEmail);
            
            if (!isBoard && !isSuperAdmin)
                return Forbid("Only SuperAdmin and Board members can export students data.");

            if (request?.FromDate.HasValue == true && request.ToDate.HasValue && request.FromDate > request.ToDate)
                return BadRequest("From date cannot be later than To date.");
            if (request?.StudentCount is <= 0)
                return BadRequest("Student count must be greater than zero.");

            var students = await _adminRepo.GetStudentsForSuperAdminAsync(
                userEmail,
                request?.FromDate,
                request?.ToDate);

            if (students == null || students.Count == 0)
            {
                return NotFound("No students found to export.");
            }

            var requestedColumns = request?.Columns?
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Select(c => c.Trim())
                .ToList() ?? new List<string>();

            var availableKeys = new HashSet<string>(ExportableColumns.Select(c => c.Key));
            var columnsToExport = (requestedColumns.Count > 0
                ? requestedColumns.Where(key => availableKeys.Contains(key)).Distinct().ToList()
                : ExportableColumns.Select(c => c.Key).ToList());

            if (columnsToExport.Count == 0)
            {
                columnsToExport = ExportableColumns.Select(c => c.Key).ToList();
            }

            var headerLookup = ExportableColumns.ToDictionary(c => c.Key, c => c.Label);
            var columnSelectors = new Dictionary<string, Func<dynamic, object?>>
            {
                ["StudentNameEnglish"] = data => data.Student.FullNameEn ?? data.Student.FullName ?? "",
                ["StudentNameArabic"] = data => data.Student.FullNameAr ?? "",
                ["CreatedAt"] = data => data.Student.CreatedAt,
                ["SocialID"] = data => data.Student.NationalId ?? "",
                ["MathPrepScore"] = data => data.MathPrepScore,
                ["EnglishPrepScore"] = data => data.EnglishPrepScore,
                ["Prep_Final%"] = data => data.PrepFinalPercent,
                ["MinistryExam%"] = data => data.MinistryExamPercent,
                ["Interviewer1Score"] = data => data.Interviewer1Score,
                ["Interviewer2Score"] = data => data.Interviewer2Score,
                ["Interviewer3Score"] = data => data.Interviewer3Score,
                ["Interviewers_SUM_Scores"] = data => data.InterviewersSumScores,
                ["Interviewers_Count"] = data => data.InterviewersCount,
                ["Interviewers_AVG_Scores%"] = data => data.InterviewersAvgScoresPercent,
                ["ExamArabicScore"] = data => data.ExamArabicScore,
                ["ExamEnglishScore"] = data => data.ExamEnglishScore,
                ["ExamMathScore"] = data => data.ExamMathScore,
                ["ExamSoftwareScore"] = data => data.ExamSoftwareScore,
                ["ExamIQScore"] = data => data.ExamIqScore,
                ["SchoolExamSection_SUM_Scores"] = data => data.SchoolExamSectionSumScores,
                ["SchoolExamSection_Count"] = data => data.SchoolExamSectionCount,
                ["SchoolExamSection_Scores_AVG%"] = data => data.SchoolExamSectionScoresAvgPercent,
                ["ResultAdmission1%"] = data => data.ResultAdmission1Percent,
                ["ResultAdmission2%"] = data => data.ResultAdmission2Percent
            };

            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Students Data");

            for (int i = 0; i < columnsToExport.Count; i++)
            {
                var key = columnsToExport[i];
                worksheet.Cells[1, i + 1].Value = headerLookup.TryGetValue(key, out var label) ? label : key;
                worksheet.Cells[1, i + 1].Style.Font.Bold = true;
                worksheet.Cells[1, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                worksheet.Cells[1, i + 1].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightBlue);
            }

            // Add data rows using optimized LINQ logic with direct InterviewScores query
            var processedStudents = new List<dynamic>();

            foreach (var student in students)
            {
                // Get interview scores data directly from database
                var studentId = (long)student.Id;
                var interviewScores = await _db.InterviewScores
                    .Where(i => i.AccountId == studentId)
                    .OrderBy(i => i.InterviewerId)
                    .Select(i => new
                    {
                        Admin = _db.Accounts.Where(a => a.Id == i.InterviewerId).Select(a => a.FullNameEn).FirstOrDefault() ?? "Unknown Admin",
                        Score = (double)i.Score
                    })
                    .ToListAsync();

                // Calculate interview statistics
                var interviewScoresList = interviewScores.Select(i => i.Score).ToList();
                var interviewer1Score = interviewScoresList.Count > 0 ? interviewScoresList[0] : (double?)null;
                var interviewer2Score = interviewScoresList.Count > 1 ? interviewScoresList[1] : (double?)null;
                var interviewer3Score = interviewScoresList.Count > 2 ? interviewScoresList[2] : (double?)null;
                var interviewersSumScores = interviewScoresList.Sum();
                var interviewersCount = interviewScoresList.Count;
                var interviewersAvgScoresPercent = interviewersCount > 0 ?
                    Math.Round((interviewersSumScores / interviewersCount) * 100.0 / 40.0, 2) : 0.0;

                // Calculate prep scores
                var mathScore = (double)(student.MathScore ?? 0);
                var englishScore = (double)(student.EnglishScore ?? 0);
                var finalYearScore = (double)(student.FinalYearScore ?? 0);
                var ministryExamPercent = (double)(student.MinistryExamPercentage ?? 0);

                // Calculate school exam section scores
                var examArabicScore = (double)(student.ExamArabicScore ?? 0);
                var examEnglishScore = (double)(student.ExamEnglishScore ?? 0);
                var examMathScore = (double)(student.ExamMathScore ?? 0);
                var examSoftwareScore = (double)(student.ExamSoftwareScore ?? 0);
                var hasIqScore = student.ExamIqScore != null;
                var examIqScore = hasIqScore ? (double)student.ExamIqScore : 0.0;

                var prepFinalPercent = Math.Round(finalYearScore * 100.0 / 280.0, 2);

                var schoolExamSectionSumScores = examArabicScore +
                                                 examEnglishScore +
                                                 examMathScore +
                                                 examSoftwareScore +
                                                 examIqScore;
                var schoolExamSectionCount = hasIqScore ? 5 : 4;
                var schoolExamMaximum = (double)student.ExamMaxScore;
                var schoolExamSectionScoresAvgPercent = Math.Round(
                    schoolExamSectionSumScores * 100.0 / schoolExamMaximum,
                    2);

                // Calculate result admission percentages
                var resultAdmission1Percent = Math.Round((interviewersAvgScoresPercent + schoolExamSectionScoresAvgPercent) / 2.0, 2);
                var resultAdmission2Percent = (double)student.TotalPercentage;

                processedStudents.Add(new
                {
                    Student = student,
                    Interviewer1Score = interviewer1Score,
                    Interviewer2Score = interviewer2Score,
                    Interviewer3Score = interviewer3Score,
                    InterviewersSumScores = interviewersSumScores,
                    InterviewersCount = interviewersCount,
                    InterviewersAvgScoresPercent = interviewersAvgScoresPercent,
                    MathPrepScore = mathScore,
                    EnglishPrepScore = englishScore,
                    PrepFinalPercent = prepFinalPercent,
                    MinistryExamPercent = ministryExamPercent,
                    ExamArabicScore = examArabicScore,
                    ExamEnglishScore = examEnglishScore,
                    ExamMathScore = examMathScore,
                    ExamSoftwareScore = examSoftwareScore,
                    ExamIqScore = hasIqScore ? examIqScore : (double?)null,
                    SchoolExamSectionSumScores = schoolExamSectionSumScores,
                    SchoolExamSectionCount = schoolExamSectionCount,
                    SchoolExamSectionScoresAvgPercent = schoolExamSectionScoresAvgPercent,
                    ResultAdmission1Percent = resultAdmission1Percent,
                    ResultAdmission2Percent = resultAdmission2Percent
                });
            }

            // Export the highest Result Admission 2 percentage first.
            processedStudents = processedStudents
                .OrderByDescending(data => (double)data.ResultAdmission2Percent)
                .ThenBy(data => (long)data.Student.Id)
                .ToList();

            if (request?.StudentCount is int studentCount)
            {
                processedStudents = processedStudents
                    .Take(studentCount)
                    .ToList();
            }

            // Fill Excel cells
            int row = 2;
            foreach (var data in processedStudents)
            {
                for (int columnIndex = 0; columnIndex < columnsToExport.Count; columnIndex++)
                {
                    var key = columnsToExport[columnIndex];
                    if (columnSelectors.TryGetValue(key, out var selector))
                    {
                        worksheet.Cells[row, columnIndex + 1].Value = selector(data);
                    }
                }
                row++;
            }

            // Auto-fit columns
            worksheet.Cells.AutoFitColumns();

            // Generate file name with timestamp
            var fileName = $"Students_Export_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

            // Convert to byte array
            var fileBytes = package.GetAsByteArray();

            // Return file
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while exporting students data", ex.Message));
        }
    }

    private string GetStatusText(object status)
    {
        if (status == null) return "Pending";

        string statusStr = status.ToString() ?? "Pending";
        return statusStr switch
        {
            "1" => "Pending",
            "2" => "Accepted",
            "3" => "Rejected",
            "4" => "Waitlisted",
            _ => "Pending"
        };
    }
}
