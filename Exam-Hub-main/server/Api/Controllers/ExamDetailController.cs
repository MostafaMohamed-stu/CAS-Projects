using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizesApi.Models;
using QuizesApi.Repositories.Interfaces;
using System.Security.Claims;
using QuizesApi.DTOs;
using System.Linq;

namespace QuizesApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExamDetailController : ControllerBase
    {
        private readonly IExamRepo _repo;
        private readonly ElsewedySchoolSysDbDevContext _context;

        public ExamDetailController(IExamRepo repo, ElsewedySchoolSysDbDevContext context)
        {
            _repo = repo;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ExamReadDto>>> GetAll()
        {
            var accountIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst("sub")?.Value 
                ?? User.FindFirst("id")?.Value;
            
            long? accountId = null;
            if (!string.IsNullOrEmpty(accountIdClaim) && long.TryParse(accountIdClaim, out long tokenAccountId))
            {
                accountId = tokenAccountId;
            }

            var exams = await _repo.GetAllAsync();

            if (accountId.HasValue)
            {
                var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
                bool isTeacher = roles.Contains("Teacher");
                bool isAdmin = roles.Contains("Superadmin") || roles.Contains("Admin") || roles.Contains("Board");

                // Teachers can now see ALL exams. No longer restricted to CreatedBy_AccId.

                var studentExtension = await _context.StudentExtensions
                    .FirstOrDefaultAsync(se => se.AccountId == accountId.Value);
                
                // If account is found in StudentExtensions, strictly filter by class
                if (studentExtension != null)
                {
                    if (studentExtension.ClassId.HasValue)
                    {
                        // Students see exams assigned to their class (multi-class support)
                        var filterClassId = studentExtension.ClassId.Value.ToString();
                        exams = exams.Where(e => !string.IsNullOrEmpty(e.ClassId) && 
                            e.ClassId.Split(',', StringSplitOptions.RemoveEmptyEntries).Contains(filterClassId));
                    }
                    else
                    {
                        // Registered student with no class assigned should see no exams
                        exams = Enumerable.Empty<ExamDetail>();
                    }
                }
            }

            return Ok(exams.Select(MapToDto));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ExamReadDto>> GetById(long id)
        {
            var exam = await _repo.GetByIdAsync(id);
            if (exam == null) return NotFound();

            var accountIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst("sub")?.Value 
                ?? User.FindFirst("id")?.Value;
            
            long? accountId = null;
            if (!string.IsNullOrEmpty(accountIdClaim) && long.TryParse(accountIdClaim, out long tokenAccountId))
            {
                accountId = tokenAccountId;
            }

            if (accountId.HasValue)
            {
                var studentExtension = await _context.StudentExtensions
                    .FirstOrDefaultAsync(se => se.AccountId == accountId.Value);
                
                if (studentExtension != null && studentExtension.ClassId.HasValue)
                {
                    var studentClassId = studentExtension.ClassId.Value.ToString();
                    
                    // Access check using multi-class ID string
                    bool hasAccess = string.IsNullOrEmpty(exam.ClassId) || 
                                     exam.ClassId.Split(',', StringSplitOptions.RemoveEmptyEntries).Contains(studentClassId);
                                     
                    if (!hasAccess)
                    {
                        return StatusCode(403, new { message = "You do not have access to this quiz. It is not assigned to your class." });
                    }
                }
            }

            return Ok(MapToDto(exam));
        }

    [HttpPost]
    public async Task<ActionResult<ExamReadDto>> Create(ExamCreateDto dto)  
    {
        Console.WriteLine($"[DIAG] Create Exam called. Title={dto.Title}, GradeId={dto.GradeId}, ClassIds={dto.ClassIds?.Count}");
        try 
        {
                var accountIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value 
                    ?? User.FindFirst("id")?.Value;
                
                long accountId = 0;
                if (!string.IsNullOrEmpty(accountIdClaim) && long.TryParse(accountIdClaim, out long tokenAccountId))
                {
                    accountId = tokenAccountId;
                }
                else if (dto.CreatedBy_AccID > 0)
                {
                    accountId = dto.CreatedBy_AccID;
                }

                if (accountId <= 0)
                {
                    if (dto.CreatedBy.HasValue) accountId = dto.CreatedBy.Value;
                    if (accountId <= 0)
                        return BadRequest(new { message = "Unable to determine account ID. Please log in again." });
                }

                var accountExists = await _context.Accounts.AnyAsync(a => a.Id == accountId);
                if (!accountExists)
                {
                    return BadRequest(new { message = $"Account with ID {accountId} does not exist." });
                }

                // Determine which classes to assign
                var classIdsToProcess = new List<long>();
                if (dto.ClassIds != null && dto.ClassIds.Count > 0)
                {
                    foreach (var classIdValue in dto.ClassIds)
                    {
                        if (classIdValue is long longId)
                            classIdsToProcess.Add(longId);
                        else if (classIdValue is int intId)
                            classIdsToProcess.Add(intId);
                        else if (long.TryParse(classIdValue?.ToString(), out long parsedId))
                            classIdsToProcess.Add(parsedId);
                    }
                }
                else if (dto.ClassId.HasValue)
                {
                    classIdsToProcess.Add(dto.ClassId.Value);
                }

                if (classIdsToProcess.Count == 0)
                {
                    return BadRequest(new { message = "At least one class must be selected." });
                }

                Console.WriteLine($"[DIAG] Creating exam for classes: {string.Join(", ", classIdsToProcess)}");

                // Create SINGLE exam linked to multiple classes
                var newExam = new ExamDetail
                {
                    Title = dto.Title,
                    ExamSubject = dto.ExamSubject,
                    ExamDescription = dto.ExamDescription,
                    GradeId = dto.GradeId, 
                    // ClassId will be set in AddAsync
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    CreatedBy_AccId = accountId,
                    SubjectId = dto.SubjectId
                };
                
                await _repo.AddAsync(newExam, dto.QuestionIds, classIdsToProcess);

                var savedExam = await _repo.GetByIdAsync(newExam.ExamId);
                if (savedExam == null) return NotFound();

                var examDto = MapToDto(savedExam);

                return CreatedAtAction(nameof(GetById), new { id = savedExam.ExamId }, examDto);
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message ?? "No inner details";
                Console.WriteLine($"[ERROR] Quiz Creation failed: {ex.Message} | Inner: {innerMessage} | Stack: {ex.StackTrace}");
                return StatusCode(500, new { message = $"Error creating exam: {ex.Message} | Inner: {innerMessage}" });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ExamReadDto>> Update(long id, ExamUpdateDto dto)
        {
            try
            {
                var exam = await _repo.GetByIdAsync(id);
                if (exam == null) return NotFound();

                exam.Title = dto.Title;
                exam.ExamSubject = dto.ExamSubject;
                exam.ExamDescription = dto.ExamDescription;
                exam.GradeId = dto.GradeId;
                exam.StartDate = dto.StartDate;
                exam.EndDate = dto.EndDate;
                exam.SubjectId = dto.SubjectId;
                
                List<long> classIds = new List<long>();
                if (dto.ClassIds != null && dto.ClassIds.Any())
                {
                    classIds.AddRange(dto.ClassIds);
                }
                else if (dto.ClassId.HasValue)
                {
                    classIds.Add(dto.ClassId.Value);
                }


                await _repo.UpdateAsync(exam, dto.QuestionIds, classIds);
                await _repo.SaveChangesAsync();

                var updatedExam = await _repo.GetByIdAsync(id);
                if (updatedExam == null) return NotFound();

                 var examDto = MapToDto(updatedExam);

                return Ok(examDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Update Quiz Failed: {ex.Message} \nStack: {ex.StackTrace}");
                if (ex.InnerException != null)
                     Console.WriteLine($"[Inner] {ex.InnerException.Message}");
                
                return StatusCode(500, new { message = $"Failed to save exam: {ex.Message} {(ex.InnerException != null ? " | " + ex.InnerException.Message : "")}" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(long id)
        {
            await _repo.DeleteAsync(id);
            await _repo.SaveChangesAsync();
            return NoContent();
        }

        private ExamReadDto MapToDto(ExamDetail e)
        {
            return new ExamReadDto
            {
                ExamId = e.ExamId,
                Title = e.Title,
                SubjectName = e.Subject?.StatusName ?? e.ExamSubject,
                ExamDescription = e.ExamDescription,
                GradeId = e.GradeId,
                SubjectId = e.SubjectId,
                ClassId = e.ClassId,
                StartDate = DateTime.SpecifyKind(e.StartDate.GetValueOrDefault(), DateTimeKind.Utc),
                EndDate = DateTime.SpecifyKind(e.EndDate.GetValueOrDefault(), DateTimeKind.Utc),
                Questions = e.ExamQuestionBanks
                    .Where(eq => eq.Question != null)
                    .Select(eq => new QuestionBankReadDto
                    {
                        QuestionId = eq.Question.QuestionId,
                        QuestionTitle = eq.Question.QuestionTitle,
                        OptionA = eq.Question.OptionA,
                        OptionB = eq.Question.OptionB,
                        OptionC = eq.Question.OptionC,
                        OptionD = eq.Question.OptionD,
                        OptionE = eq.Question.OptionE,
                        OptionF = eq.Question.OptionF,
                        OptionG = eq.Question.OptionG,
                        OptionH = eq.Question.OptionH,
                        UsedOptions = eq.Question.UsedOptions ?? 4,
                        CorrectAnswer = eq.Question.CorrectAnswer,
                        QuestionSubject = eq.Question.QuestionSubject,
                        Mark = eq.Question.Mark ?? 0
                    }).ToList(),
                TotalMarks = e.ExamQuestionBanks.Sum(eq => eq.Question?.Mark ?? 0)
            };
        }

        [HttpGet("subjects")]
        public async Task<ActionResult<IEnumerable<object>>> GetSubjects()
        {
            var subjects = await _context.Statuses
                .Where(s => s.BusinessEntity == "Exams")
                .Select(s => new { id = s.Id, statusName = s.StatusName })
                .ToListAsync();
            return Ok(subjects);
        }
    }
}
