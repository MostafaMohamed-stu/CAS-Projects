using Microsoft.EntityFrameworkCore;
using QuizesApi.Models;
using QuizesApi.Repositories.Interfaces;

namespace QuizesApi.Repositories
{
    public class QuestionBankRepo : IQuestionBankRepo
    {
        private readonly ElsewedySchoolSysDbDevContext _context;

        public QuestionBankRepo(ElsewedySchoolSysDbDevContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<QuestionBank>> GetAllAsync()
        {
            return await _context.QuestionBanks.ToListAsync();
        }

        public async Task<QuestionBank?> GetByIdAsync(long id)
        {
            return await _context.QuestionBanks.FindAsync(id);
        }

        public async Task AddAsync(QuestionBank question)
        {
            await _context.QuestionBanks.AddAsync(question);
        }

        public async Task UpdateAsync(QuestionBank question)
        {
            _context.QuestionBanks.Update(question);
        }

        public async Task DeleteAsync(long id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null)
                _context.QuestionBanks.Remove(entity);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
