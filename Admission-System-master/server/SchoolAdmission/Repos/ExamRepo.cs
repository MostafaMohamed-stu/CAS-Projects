using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Data;
using SchoolAdmission.Models;
using SchoolAdmission.Repos.IRepos;

namespace SchoolAdmission.Repos;
public class ExamRepo : GenericRepo<ExamQuestion>, IExamRepo
{
    public ExamRepo(SchoolAdmissionDbContext db) : base(db)
    {
    }

    public async Task<bool> areExamQuestionsAvailableAsync()
    {
        return await db.ExamQuestions.AnyAsync();
    }

    public async Task addExamQuestionsAsync(List<ExamQuestion> examQuestions)
    {
        await db.ExamQuestions.AddRangeAsync(examQuestions);
    }
}