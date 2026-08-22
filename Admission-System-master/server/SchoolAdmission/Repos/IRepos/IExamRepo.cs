using SchoolAdmission.Models;
using SchoolAdmission.Repos.IRepos;

namespace SchoolAdmission.Repos.IRepos;
public interface IExamRepo : IGenericRepo<ExamQuestion> {

    Task<bool> areExamQuestionsAvailableAsync();
    Task addExamQuestionsAsync(List<ExamQuestion> examQuestions);


}