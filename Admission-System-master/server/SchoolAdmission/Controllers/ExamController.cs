using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SchoolAdmission.Models;
using SchoolAdmission.Data;
using SchoolAdmission.DTOs;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using System.Security.Claims;
using SchoolAdmission.Repos.IRepos;
using SchoolAdmission.Services;

[ApiController]
[Route("api/[controller]")]
public class ExamController : ControllerBase
{
    private readonly SchoolAdmissionDbContext db;
    private readonly IAuthRepo _authRepo;
    private readonly ISectionRepo _sectionRepo;
    private readonly IExamRepo _examRepo;
    private readonly IStudentRepo _studentRepo;
    private readonly AdmissionSettingsService _settingsService;


    public ExamController(SchoolAdmissionDbContext context, IAuthRepo authRepo, ISectionRepo sectionRepo, IExamRepo examRepo, IStudentRepo studentRepo, AdmissionSettingsService settingsService)
    {
        db = context;
        _authRepo = authRepo;
        _sectionRepo = sectionRepo;
        _examRepo = examRepo;
        _studentRepo = studentRepo;
        _settingsService = settingsService;
    }

    private string GetCurrentAdminEmail()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? string.Empty;
    }


    [HttpPost("import-questions")]
    [Authorize]
    public async Task<IActionResult> ImportQuestionsFromExcelMultiSheets(IFormFile file)
    {
        // Check if user is SuperAdmin
        if (!await _authRepo.IsSuperAdminAsync(GetCurrentAdminEmail()))
            return Forbid("Only SuperAdmin users can import exam questions.");

        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        if (!file.FileName.EndsWith(".xlsx"))
            return BadRequest("Please upload an Excel file (.xlsx)");

        try
        {
            var importedQuestions = new List<ExamQuestion>();
            var skippedRows = 0;
            var sections = await db.Sections.AsNoTracking().ToListAsync();
            var sectionsById = sections.ToDictionary(section => section.Id);
            var sectionsByName = sections.ToDictionary(
                section => section.SectionName,
                StringComparer.OrdinalIgnoreCase);

            using var stream = file.OpenReadStream();
            using var package = new ExcelPackage(stream);

            foreach (var worksheet in package.Workbook.Worksheets)
            {
                if (worksheet.Dimension == null)
                    continue;

                Section? worksheetSection = null;
                if (long.TryParse(worksheet.Name, out var worksheetSectionId))
                    sectionsById.TryGetValue(worksheetSectionId, out worksheetSection);
                else
                    sectionsByName.TryGetValue(worksheet.Name.Trim(), out worksheetSection);

                for (int row = 2; row <= worksheet.Dimension.End.Row; row++)
                {
                    var questionTitle = worksheet.Cells[row, 1].Text.Trim();
                    var choices = Enumerable.Range(2, 4)
                        .Select(column => worksheet.Cells[row, column].Text.Trim())
                        .ToArray();
                    var correctAnswer = worksheet.Cells[row, 6].Text.Trim();
                    var sectionIdentifier = worksheet.Cells[row, 7].Text.Trim();

                    Section? rowSection = null;
                    if (long.TryParse(sectionIdentifier, out var rowSectionId))
                        sectionsById.TryGetValue(rowSectionId, out rowSection);
                    else if (!string.IsNullOrWhiteSpace(sectionIdentifier))
                        sectionsByName.TryGetValue(sectionIdentifier, out rowSection);

                    rowSection ??= worksheetSection;

                    var isValidQuestion = !string.IsNullOrWhiteSpace(questionTitle) &&
                                          choices.All(choice => !string.IsNullOrWhiteSpace(choice)) &&
                                          !string.IsNullOrWhiteSpace(correctAnswer) &&
                                          choices.Contains(correctAnswer, StringComparer.OrdinalIgnoreCase) &&
                                          rowSection != null;

                    if (!isValidQuestion)
                    {
                        skippedRows++;
                        continue;
                    }

                    var question = new ExamQuestion
                    {
                        QuestionTitle = questionTitle,
                        Choice1 = choices[0],
                        Choice2 = choices[1],
                        Choice3 = choices[2],
                        Choice4 = choices[3],
                        CorrectAnswer = correctAnswer,
                        SectionId = rowSection!.Id
                    };

                    importedQuestions.Add(question);
                }
            }

            await _examRepo.addExamQuestionsAsync(importedQuestions);
            await _sectionRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Questions imported successfully (multi-sheets)",
                importedCount = importedQuestions.Count,
                skippedCount = skippedRows,
                questions = importedQuestions.Select(q => new
                {
                    q.Id,
                    q.QuestionTitle,
                    q.SectionId
                })
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error importing questions: {ex.Message}");
        }
    }




    // 3.1. Get Sections with School Type Logic
    [HttpGet("sections/{nationalId}")]

    public async Task<IActionResult> GetSectionsWithSchoolType(string nationalId)
    {
        // Get student's school type
        var account = await _studentRepo.getStudentByNationalIdWithIncludeAsync(nationalId);
        if (account == null)
            return NotFound("Student not found");

        if (await db.StudentExamAnswers.AnyAsync(answer => answer.AccountId == account.Id))
            return Conflict("Student has already completed the exam.");

        var schoolType = account.AdmissionProfile?.PreviousSchoolType;
        var requiredSections = ExamScoring.GetRequiredSections(schoolType);
        if (requiredSections.Length == 0)
            return BadRequest("Invalid or missing school type.");

        var timing = await _settingsService.StartOrResumeExamAsync(account.Id);
        var settings = timing.Settings;

        var allSections = await _sectionRepo.getSectionsWithIncludeAsync();
        var sectionByName = allSections.ToDictionary(
            section => section.SectionName,
            StringComparer.OrdinalIgnoreCase);
        var filteredSections = requiredSections
            .Where(sectionByName.ContainsKey)
            .Select(sectionName =>
            {
                var section = sectionByName[sectionName];
                return new
                {
                    section.Id,
                    section.SectionName,
                    questionCount = section.ExamQuestions.Count,
                    requiredQuestionCount = settings.QuestionsPerSection,
                    isReady = settings.RequireFullQuestionSet != 0
                        ? section.ExamQuestions.Count >= settings.QuestionsPerSection
                        : section.ExamQuestions.Count > 0
                };
            })
            .ToList();

        return Ok(new
        {
            schoolType = schoolType,
            examDurationMinutes = settings.ExamDurationMinutes,
            examStartedAtUtc = timing.StartedAtUtc,
            examEndsAtUtc = timing.EndsAtUtc,
            remainingSeconds = Math.Max(
                0,
                (int)Math.Ceiling((timing.EndsAtUtc - DateTimeOffset.UtcNow).TotalSeconds)),
            settingsVersion = settings.VersionNumber,
            sections = filteredSections
        });
    }


    // Get Questions by Section and school type, new Logic- With Randomization
    [HttpGet("questions/{sectionName}/{nationalId}")]
    public async Task<IActionResult> GetQuestionsBySectionWithSchoolType(string sectionName, string nationalId)
    {
        // Get student and school type
        var student = await _studentRepo.getStudentByNationalIdWithIncludeAsync(nationalId);

        if (student == null)
            return NotFound("Student not found");

        if (await db.StudentExamAnswers.AnyAsync(answer => answer.AccountId == student.Id))
            return Conflict("Student has already completed the exam.");

        var timing = await _settingsService.StartOrResumeExamAsync(student.Id);
        var settings = timing.Settings;

        // Determine actual section name based on school type
        var actualSectionName = sectionName;
        if (sectionName.Equals("Math", StringComparison.OrdinalIgnoreCase))
        {
            actualSectionName = ExamScoring.ResolveMathSection(
                student.AdmissionProfile?.PreviousSchoolType);
            if (actualSectionName == null)
                return BadRequest("Invalid or missing school type.");
        }

        var allowedSections = ExamScoring.GetRequiredSections(
            student.AdmissionProfile?.PreviousSchoolType);
        if (!allowedSections.Contains(actualSectionName, StringComparer.OrdinalIgnoreCase))
            return BadRequest($"Section '{actualSectionName}' is not available for this student.");

        // Get section with questions
        var section = await db.Sections
            .Include(s => s.ExamQuestions)
            .FirstOrDefaultAsync(s => s.SectionName == actualSectionName);

        if (section == null)
            return NotFound($"Section '{actualSectionName}' not found");

        var availableQuestionCount = section.ExamQuestions.Count;
        if (availableQuestionCount == 0)
            return BadRequest($"Section '{actualSectionName}' has no available questions.");

        if (settings.RequireFullQuestionSet != 0 && availableQuestionCount < settings.QuestionsPerSection)
            return BadRequest($"Section '{actualSectionName}' has only {availableQuestionCount} questions. Required: {settings.QuestionsPerSection}.");

        // Randomize and take the configured number of questions
        var questions = section.ExamQuestions
            .OrderBy(q => Guid.NewGuid()) // randomize
            .Take(settings.QuestionsPerSection)
            .Select(q => new
            {
                q.Id,
                q.QuestionTitle,
                q.Choice1,
                q.Choice2,
                q.Choice3,
                q.Choice4
                // Don't include CorrectAnswer
            })
            .ToList();

        return Ok(new
        {
            sectionName = section.SectionName,
            actualSectionName = actualSectionName,
            schoolType = student.AdmissionProfile?.PreviousSchoolType,
            questionCount = questions.Count,
            requestedQuestionCount = settings.QuestionsPerSection,
            availableQuestionCount = availableQuestionCount,
            questions = questions
        });
    }

    [HttpGet("timing/{nationalId}")]
    public async Task<IActionResult> GetExamTiming(string nationalId)
    {
        var student = await _studentRepo.getStudentByNationalIdWithIncludeAsync(nationalId);
        if (student == null)
            return NotFound("Student not found");

        var timing = await _settingsService.GetCurrentExamTimingAsync(student.Id);
        if (timing == null)
            return BadRequest("The student has not started an exam session.");

        return Ok(new
        {
            examStartedAtUtc = timing.StartedAtUtc,
            examEndsAtUtc = timing.EndsAtUtc,
            remainingSeconds = Math.Max(
                0,
                (int)Math.Ceiling((timing.EndsAtUtc - DateTimeOffset.UtcNow).TotalSeconds))
        });
    }





    // 4. Submit Student Answers
    [HttpPost("submit-answers")]
    public async Task<IActionResult> SubmitAnswers([FromBody] SubmitAnswersDTO dto)
    {

        var account = await _studentRepo.getStudentByNationalIdWithIncludeAsync(dto.NationalId);

        if (account == null)
            return NotFound("Student not found");

        if (await db.StudentExamAnswers.AnyAsync(answer => answer.AccountId == account.Id))
            return Conflict("Student has already completed the exam.");

        if (dto.Answers == null || dto.Answers.Count == 0)
            return BadRequest("At least one answered question is required before an exam can be submitted.");

        var timing = await _settingsService.GetCurrentExamTimingAsync(account.Id);
        if (timing == null)
            return BadRequest("The exam has not been started for this student.");

        var settings = timing.Settings;

        var submittedAnswerByQuestion = dto.Answers
            .GroupBy(answer => answer.QuestionId)
            .ToDictionary(group => group.Key, group => group.Last());
        var submittedQuestionIds = submittedAnswerByQuestion.Keys.ToList();
        var questionsById = await db.ExamQuestions
            .Include(question => question.Section)
            .Where(question => submittedQuestionIds.Contains(question.Id))
            .ToDictionaryAsync(question => question.Id);
        var allowedSections = ExamScoring.GetRequiredSections(
            account.AdmissionProfile?.PreviousSchoolType);

        if (allowedSections.Length == 0)
            return BadRequest("Invalid or missing school type.");

        if (!questionsById.Values.Any(question => allowedSections.Contains(
                question.Section.SectionName,
                StringComparer.OrdinalIgnoreCase)))
        {
            return BadRequest("The submission does not contain any valid exam answers.");
        }

        var availableSectionCounts = await db.Sections
            .Where(section => allowedSections.Contains(section.SectionName))
            .Select(section => new
            {
                section.SectionName,
                QuestionCount = section.ExamQuestions.Count
            })
            .ToDictionaryAsync(
                section => section.SectionName,
                section => section.QuestionCount);
        var unavailableSections = allowedSections
            .Where(sectionName =>
            {
                availableSectionCounts.TryGetValue(sectionName, out var questionCount);
                return settings.RequireFullQuestionSet != 0
                    ? questionCount < settings.QuestionsPerSection
                    : questionCount == 0;
            })
            .ToList();
        if (unavailableSections.Count > 0)
        {
            return BadRequest(new
            {
                error = "Exam Not Ready",
                message = "The exam cannot be submitted because required sections are unavailable.",
                sections = unavailableSections
            });
        }

        var invalidSectionSize = questionsById.Values
            .Where(question => allowedSections.Contains(
                question.Section.SectionName,
                StringComparer.OrdinalIgnoreCase))
            .GroupBy(question => question.Section.SectionName)
            .Any(section => section.Count() > settings.QuestionsPerSection);
        if (invalidSectionSize)
            return BadRequest($"A section cannot contain more than {settings.QuestionsPerSection} submitted answers.");

        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            var existingAnswers = await db.StudentExamAnswers
                .Where(sea => sea.AccountId == account.Id)
                .ToListAsync();

            if (existingAnswers.Any())
                db.StudentExamAnswers.RemoveRange(existingAnswers);

            foreach (var answer in submittedAnswerByQuestion.Values)
            {
                if (!questionsById.TryGetValue(answer.QuestionId, out var question) ||
                    !allowedSections.Contains(question.Section.SectionName, StringComparer.OrdinalIgnoreCase))
                    continue;

                // Frontend sends an answer index, while the database stores answer text.
                bool isCorrect;

                if (int.TryParse(answer.ChosenAnswer, out int chosenIndex))
                {
                    var actualAnswer = chosenIndex switch
                    {
                        0 => question.Choice1,
                        1 => question.Choice2,
                        2 => question.Choice3,
                        3 => question.Choice4,
                        _ => answer.ChosenAnswer
                    };

                    isCorrect = string.Equals(
                        actualAnswer?.Trim(),
                        question.CorrectAnswer?.Trim(),
                        StringComparison.OrdinalIgnoreCase);
                }
                else
                {
                    isCorrect = string.Equals(
                        answer.ChosenAnswer?.Trim(),
                        question.CorrectAnswer?.Trim(),
                        StringComparison.OrdinalIgnoreCase);
                }

                var studentAnswer = new StudentExamAnswer
                {
                    AccountId = account.Id,
                    ExamQuestionId = answer.QuestionId,
                    ChoosedAnswer = answer.ChosenAnswer,
                    Score = isCorrect
                };

                db.StudentExamAnswers.Add(studentAnswer);
            }

            await db.SaveChangesAsync();

            await CalculateAndUpdateResults(
                account.Id,
                account.AdmissionProfile?.PreviousSchoolType,
                settings);

            var results = await db.StudentExamResults
                .FirstOrDefaultAsync(r => r.AccountId == account.Id);

            await transaction.CommitAsync();

            return Ok(new
            {
                message = "Answers submitted successfully",
                totalScore = AdmissionSettingsService.GetExamTotal(results),
                maxScore = AdmissionSettingsService.GetExamMaximum(settings)
            });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }


    // Helper method to calculate and update final results
    private async Task CalculateAndUpdateResults(
        long accountId,
        string? schoolType,
        HubSettings settings)
    {
        // Get all student answers with Exam and Section
        var studentAnswers = await db.StudentExamAnswers
            .Include(sea => sea.Exam)
            .ThenInclude(e => e.Section)
            .Where(sea => sea.AccountId == accountId)
            .ToListAsync();

        // Define each Section and the number of questions the student answered for each subject
        var sections = studentAnswers
            .Where(sea => sea.Exam != null && sea.Exam.Section != null)
            .GroupBy(
                sea => sea.Exam.Section.SectionName,
                StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    CorrectAnswers = g.Count(sea => sea.Score)
                }
            );

        // Get or create StudentExamResult
        var results = await db.StudentExamResults.FirstOrDefaultAsync(r => r.AccountId == accountId);
        if (results == null)
        {
            results = new StudentExamResult { AccountId = accountId };
            db.StudentExamResults.Add(results);
        }

        var configuredQuestionCount = settings.QuestionsPerSection;
        var requireFullQuestionSet = settings.RequireFullQuestionSet != 0;
        var availableQuestionCountRows = await db.Sections
            .Where(section => ExamScoring.ScoredSectionNames.Contains(section.SectionName))
            .Select(section => new
            {
                section.SectionName,
                QuestionCount = section.ExamQuestions.Count
            })
            .ToListAsync();
        var availableQuestionCounts = availableQuestionCountRows.ToDictionary(
            section => section.SectionName,
            section => section.QuestionCount,
            StringComparer.OrdinalIgnoreCase);

        int CalcScore(string sectionName, decimal weight)
        {
            if (!sections.TryGetValue(sectionName, out var sectionResult))
                return 0;

            availableQuestionCounts.TryGetValue(sectionName, out var availableQuestionCount);
            var denominator = requireFullQuestionSet
                ? configuredQuestionCount
                : Math.Min(availableQuestionCount, configuredQuestionCount);

            return ExamScoring.CalculateSectionScore(
                sectionResult.CorrectAnswers,
                denominator,
                (int)Math.Round(weight));
        }

        results.ExamArabicScore = CalcScore(
            ExamScoring.ArabicSection,
            settings.ArabicWeight);
        results.ExamEnglishScore = CalcScore(
            ExamScoring.EnglishSection,
            settings.EnglishWeight);
        results.ExamSoftwareScore = CalcScore(
            ExamScoring.SoftwareSection,
            settings.SoftwareWeight);
        results.ExamIqScore = CalcScore(
            ExamScoring.IqSection,
            settings.IqWeight);

        var mathSection = ExamScoring.ResolveMathSection(schoolType);
        results.ExamMathScore = mathSection == null
            ? 0
            : CalcScore(mathSection, settings.MathWeight);

        await db.SaveChangesAsync();
    }



    // 10. Request Time Extension (Reception Coordinator Authentication)
    [HttpPost("request-extension")]
    public async Task<IActionResult> RequestTimeExtension([FromBody] TimeExtensionDTO dto)
    {
        // Validate credentials
        var coordinator = await db.Accounts
            .FirstOrDefaultAsync(a => a.Email == dto.CoordinatorEmail);

        if (coordinator == null)
            return BadRequest("Invalid reception coordinator credentials.");

        var isReceptionCoordinator = await _authRepo.IsReceptionCoordinatorAsync(dto.CoordinatorEmail);
        if (!isReceptionCoordinator)
            return BadRequest("Invalid reception coordinator credentials.");

        // Verify password
        var login = await db.Logins.FirstOrDefaultAsync(l => l.AccountId == coordinator.Id);
        if (login == null || !BCrypt.Net.BCrypt.Verify(dto.CoordinatorPassword, login.PasswordHash))
            return BadRequest("Invalid reception coordinator credentials.");

        // Validate student exists
        var student = await db.Accounts.FirstOrDefaultAsync(a => a.NationalId == dto.NationalId);
        if (student == null)
            return NotFound("Student not found.");

        // Check if student has already taken exam
        if (await db.StudentExamAnswers.AnyAsync(answer => answer.AccountId == student.Id))
            return BadRequest("Student has already completed the exam.");

        ExamTiming timing;
        try
        {
            timing = await _settingsService.GrantExtensionAsync(student.Id, dto.ExtensionMinutes);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }

        return Ok(new
        {
            message = $"Time extension of {dto.ExtensionMinutes} minutes granted.",
            extensionMinutes = dto.ExtensionMinutes,
            examEndsAtUtc = timing.EndsAtUtc,
            remainingSeconds = Math.Max(
                0,
                (int)Math.Ceiling((timing.EndsAtUtc - DateTimeOffset.UtcNow).TotalSeconds))
        });
    }

}
