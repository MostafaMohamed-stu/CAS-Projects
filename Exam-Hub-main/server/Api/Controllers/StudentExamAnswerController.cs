using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizesApi.Models;
using System.Security.Claims;
using System;
using System.Collections.Generic;
using System.Linq;

namespace QuizesApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentExamAnswerController : ControllerBase
    {
        private readonly ElsewedySchoolSysDbDevContext _context;

        public StudentExamAnswerController(ElsewedySchoolSysDbDevContext context)
        {
            _context = context;
        }

        private async Task PopulateExamQuestions(List<ExamDetail> exams)
        {
            var examIds = exams.Select(e => e.ExamId).ToList();
            if (!examIds.Any()) return;

            var links = await _context.ExamQuestionBanks.Where(eq => eq.ExamId.HasValue && examIds.Contains(eq.ExamId.Value)).ToListAsync();
            var qIds = links.Where(l => l.QuestionId.HasValue).Select(l => l.QuestionId.Value).Distinct().ToList();
            var questions = await _context.QuestionBanks.Where(q => qIds.Contains(q.QuestionId)).ToDictionaryAsync(q => q.QuestionId);

            foreach (var exam in exams)
            {
                var examLinks = links.Where(l => l.ExamId == exam.ExamId).ToList();
                foreach (var link in examLinks)
                {
                    if (link.QuestionId.HasValue && questions.TryGetValue(link.QuestionId.Value, out var q))
                    {
                        link.Question = q;
                        exam.ExamQuestionBanks.Add(link);
                    }
                }
            }
        }    

        [HttpGet("student/{accountId}/exams")]
        public async Task<ActionResult> GetStudentExams(long accountId)
        {
            var studentAnswers = await _context.StudentExamAnswers
                .Where(sea => sea.AccountId == accountId)
                .ToListAsync();

            var allExams = await _context.ExamDetails.Include(e => e.Subject).ToListAsync();
            await PopulateExamQuestions(allExams);

            var examAnswers = allExams.Select(exam =>
            {
                var examQuestionIds = exam.ExamQuestionBanks
                    .Where(eq => eq.QuestionId.HasValue)
                    .Select(eq => eq.QuestionId.Value)
                    .ToList();
                
                var answers = studentAnswers
                    .Where(a => a.ExamDetailsId.HasValue && 
                               a.ExamDetailsId.Value == exam.ExamId && 
                               a.QuestionBankId.HasValue && 
                               examQuestionIds.Contains(a.QuestionBankId.Value))
                    .ToList();

                if (examQuestionIds.Count == 0 || answers.Count == 0 || answers.Count < examQuestionIds.Count) return null;

                var totalMarks = exam.ExamQuestionBanks.Sum(eq => eq.Question?.Mark ?? 0);
                var earnedMarks = answers.Where(a => a.Score).Sum(a =>
                    exam.ExamQuestionBanks.FirstOrDefault(eq => eq.QuestionId.HasValue && eq.QuestionId.Value == a.QuestionBankId)?.Question?.Mark ?? 0);

                return new
                {
                    ExamId = exam.ExamId,
                    Title = exam.Title,
                    ExamDescription = exam.ExamDescription,
                    StartDate = DateTime.SpecifyKind(exam.StartDate.GetValueOrDefault(), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(exam.EndDate.GetValueOrDefault(), DateTimeKind.Utc),
                    TotalMarks = totalMarks,
                    EarnedMarks = earnedMarks,
                    Score = totalMarks > 0 ? Math.Round((double)(earnedMarks * 100m / totalMarks), 2) : 0.0,
                    Answers = answers
                };
            }).Where(x => x != null).ToList();

            var result = examAnswers.Select(ea =>
            {
                var exam = allExams.First(e => e.ExamId == ea.ExamId);
                return new
                {
                    ea.ExamId,
                    ea.Title,
                    SubjectName = exam.Subject?.StatusName ?? exam.ExamSubject,
                    ea.ExamDescription,
                    StartDate = DateTime.SpecifyKind(ea.StartDate, DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(ea.EndDate, DateTimeKind.Utc),
                    ea.TotalMarks,
                    ea.EarnedMarks,
                    ea.Score,
                    Questions = exam.ExamQuestionBanks
                        .Where(eq => eq.Question != null)
                        .Select(eq =>
                        {
                            var answer = ea.Answers.FirstOrDefault(a => a.QuestionBankId == eq.Question.QuestionId);
                            return new
                            {
                                QuestionId = eq.Question.QuestionId,
                                QuestionTitle = eq.Question.QuestionTitle,
                                OptionA = eq.Question.OptionA,
                                OptionB = eq.Question.OptionB,
                                OptionC = eq.Question.OptionC,
                                OptionD = eq.Question.OptionD,
                                CorrectAnswer = eq.Question.CorrectAnswer,
                                Mark = eq.Question.Mark ?? 0,
                                UserAnswer = answer?.ChoosedAnswer ?? string.Empty,
                                IsCorrect = answer?.Score ?? false
                            };
                        }).ToList()
                };
            }).ToList();

            return Ok(result);
        }

        [HttpGet("student/{accountId}/exam/{examId}")]
        public async Task<ActionResult> GetStudentExamAnswers(long accountId, long examId)
        {
            var exam = await _context.ExamDetails.Include(e => e.Subject).FirstOrDefaultAsync(e => e.ExamId == examId);
            if (exam == null) return NotFound();

            // Strict Access Control for Teachers
            var accountIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst("sub")?.Value 
                ?? User.FindFirst("id")?.Value;
            
            if (long.TryParse(accountIdClaim, out long requesterId))
            {
                var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
                bool isTeacher = roles.Contains("Teacher");
                bool isAdmin = roles.Contains("Superadmin") || roles.Contains("Admin") || roles.Contains("Board");

                // Teachers can now see ANY exam's answers
                // No longer restricting by CreatedBy_AccId
            }

            await PopulateExamQuestions(new List<ExamDetail> { exam });

            var questionIds = exam.ExamQuestionBanks
                .Where(eq => eq.QuestionId.HasValue)
                .Select(eq => eq.QuestionId.Value)
                .ToList();
            
            var answers = await _context.StudentExamAnswers
                .Where(sea => sea.AccountId == accountId && sea.ExamDetailsId == examId && sea.QuestionBankId.HasValue && questionIds.Contains(sea.QuestionBankId.Value))
                .ToListAsync();

            var totalMarks = exam.ExamQuestionBanks.Sum(eq => eq.Question?.Mark ?? 0);
            var earnedMarks = answers.Where(a => a.Score).Sum(a => 
                exam.ExamQuestionBanks.FirstOrDefault(eq => eq.QuestionId.HasValue && eq.QuestionId.Value == a.QuestionBankId)?.Question?.Mark ?? 0);

            var result = new
            {
                ExamId = exam.ExamId,
                Title = exam.Title,
                SubjectName = exam.Subject?.StatusName ?? exam.ExamSubject,
                ExamDescription = exam.ExamDescription,
                StartDate = DateTime.SpecifyKind(exam.StartDate.GetValueOrDefault(), DateTimeKind.Utc),
                EndDate = DateTime.SpecifyKind(exam.EndDate.GetValueOrDefault(), DateTimeKind.Utc),
                TotalMarks = totalMarks,
                EarnedMarks = earnedMarks,
                Score = totalMarks > 0 ? Math.Round((double)(earnedMarks * 100m / totalMarks), 2) : 0.0,
                Questions = exam.ExamQuestionBanks
                    .Where(eq => eq.Question != null)
                    .Select(eq =>
                    {
                        var answer = answers.FirstOrDefault(a => a.QuestionBankId == eq.Question.QuestionId);
                        return new
                        {
                            QuestionId = eq.Question.QuestionId,
                            QuestionTitle = eq.Question.QuestionTitle,
                            OptionA = eq.Question.OptionA,
                            OptionB = eq.Question.OptionB,
                            OptionC = eq.Question.OptionC,
                            OptionD = eq.Question.OptionD,
                            CorrectAnswer = eq.Question.CorrectAnswer,
                            Mark = eq.Question.Mark ?? 0,
                            UserAnswer = answer?.ChoosedAnswer ?? string.Empty,
                            IsCorrect = answer?.Score ?? false
                        };
                    }).ToList()
            };

            return Ok(result);
        }

        [HttpPost("submit")]
        public async Task<ActionResult> SubmitStudentAnswers([FromBody] StudentAnswerSubmitDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Request body is required." });

            var accountIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst("sub")?.Value 
                ?? User.FindFirst("id")?.Value;
            
            long accountId = 0;
            if (!string.IsNullOrEmpty(accountIdClaim) && long.TryParse(accountIdClaim, out long tokenAccountId))
            {
                accountId = tokenAccountId;
            }
            else if (dto.AccountId > 0)
            {
                accountId = dto.AccountId;
            }

            if (accountId <= 0) return BadRequest(new { message = "Unable to determine account ID. Please log in again." });
            if (dto.ExamId <= 0) return BadRequest(new { message = "Invalid exam ID." });

            var accountExists = await _context.Accounts.AnyAsync(a => a.Id == accountId);
            if (!accountExists) return BadRequest(new { message = $"Account with ID {accountId} does not exist." });

            var exam = await _context.ExamDetails.FirstOrDefaultAsync(e => e.ExamId == dto.ExamId);
            if (exam == null) return NotFound(new { message = "Exam not found." });

            await PopulateExamQuestions(new List<ExamDetail> { exam });

            var existingAnswers = await _context.StudentExamAnswers
                .Where(sea => sea.AccountId == accountId && sea.ExamDetailsId == dto.ExamId)
                .ToListAsync();

            if (existingAnswers.Any()) return BadRequest(new { message = "You have already submitted answers for this exam." });

            var questionIds = exam.ExamQuestionBanks
                .Where(eq => eq.QuestionId.HasValue)
                .Select(eq => eq.QuestionId.Value)
                .ToList();
            
            if (dto.Answers == null || dto.Answers.Count == 0) return BadRequest(new { message = "No answers submitted." });
            
            var submittedQuestionIds = dto.Answers.Select(a => a.QuestionId).ToList();
            if (submittedQuestionIds.Any(qid => !questionIds.Contains(qid)))
            {
                return BadRequest(new { message = $"Invalid answers. IDs valid: {string.Join(", ", questionIds)}" });
            }
            
            var missingQuestionIds = questionIds.Where(qid => !submittedQuestionIds.Contains(qid)).ToList();
            foreach (var missingQid in missingQuestionIds)
            {
                dto.Answers.Add(new AnswerDto { QuestionId = missingQid, Answer = string.Empty });
            }



            var studentAnswers = new List<StudentExamAnswer>();
            
            foreach (var answerDto in dto.Answers)
            {
                var question = exam.ExamQuestionBanks
                    .FirstOrDefault(eq => eq.QuestionId.HasValue && eq.QuestionId.Value == answerDto.QuestionId)?.Question;

                if (question == null) continue;
                
                string chosenAnswer = answerDto.Answer?.ToString()?.Trim() ?? string.Empty;
                bool isCorrect = false;
                string correctAnswer = question.CorrectAnswer?.Trim() ?? string.Empty;
                
                if (!string.IsNullOrEmpty(chosenAnswer))
                {
                    if (question.OptionC != null && question.OptionD != null)
                    {
                        if (correctAnswer.Length == 1 && char.IsLetter(correctAnswer[0]))
                        {
                            int correctIndex = char.ToUpper(correctAnswer[0]) - 'A';
                            var optionsList = new List<string>();
                            if (question.OptionA != null) optionsList.Add(question.OptionA);
                            if (question.OptionB != null) optionsList.Add(question.OptionB);
                            if (question.OptionC != null) optionsList.Add(question.OptionC);
                            if (question.OptionD != null) optionsList.Add(question.OptionD);
                            
                            if (correctIndex >= 0 && correctIndex < optionsList.Count)
                            {
                                isCorrect = chosenAnswer.Equals(optionsList[correctIndex].Trim(), StringComparison.OrdinalIgnoreCase);
                            }
                        }
                        else
                        {
                            isCorrect = chosenAnswer.Equals(correctAnswer, StringComparison.OrdinalIgnoreCase);
                        }
                    }
                    else
                    {
                         isCorrect = chosenAnswer.Equals(correctAnswer, StringComparison.OrdinalIgnoreCase);
                    }
                }

                studentAnswers.Add(new StudentExamAnswer
                {
                    AccountId = accountId,
                    ExamQuestionId = null,
                    ExamDetailsId = dto.ExamId,
                    QuestionBankId = answerDto.QuestionId,
                    ChoosedAnswer = chosenAnswer,
                    Score = isCorrect
                });
            }

            try
            {
                await _context.StudentExamAnswers.AddRangeAsync(studentAnswers);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving answers: {ex}");
                return StatusCode(500, new { message = "Error saving answers", details = ex.Message, inner = ex.InnerException?.Message });
            }

            var totalMarks = exam.ExamQuestionBanks.Sum(eq => eq.Question?.Mark ?? 0);
            var earnedMarks = studentAnswers.Where(a => a.Score).Sum(a =>
                exam.ExamQuestionBanks.FirstOrDefault(eq => eq.QuestionId.HasValue && eq.QuestionId.Value == a.QuestionBankId)?.Question?.Mark ?? 0);

            return Ok(new
            {
                message = "Answers submitted successfully.",
                examId = dto.ExamId,
                totalMarks,
                earnedMarks,
                score = totalMarks > 0 ? Math.Round((double)(earnedMarks * 100m / totalMarks), 2) : 0.0
            });
        }
    }

    public class StudentAnswerSubmitDto
    {
        public long ExamId { get; set; }
        public long AccountId { get; set; }
        public List<AnswerDto> Answers { get; set; } = new();
    }

    public class AnswerDto
    {
        public long QuestionId { get; set; }
        public object Answer { get; set; } = null!;
    }
}
