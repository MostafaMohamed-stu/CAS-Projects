using QuizesApi.Models;

public interface IQuestionBankRepo
{
    Task<IEnumerable<QuestionBank>> GetAllAsync();
    Task<QuestionBank?> GetByIdAsync(long id);
    Task AddAsync(QuestionBank question);
    Task UpdateAsync(QuestionBank question);
    Task DeleteAsync(long id);
    Task SaveChangesAsync();
}
