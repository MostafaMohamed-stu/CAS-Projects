using SchoolAdmission.Data;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Repos.IRepos;
namespace SchoolAdmission.Repos;


public class GenericRepo<T> : IGenericRepo<T> where T : class{

    protected readonly SchoolAdmissionDbContext db;

    public GenericRepo(SchoolAdmissionDbContext db)
    {
        this.db = db;
    }

    public async Task AddAsync(T entity) 
    {
        await db.Set<T>().AddAsync(entity);
    }

    public void Delete(T entity)
    {
        db.Set<T>().Remove(entity);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await db.Set<T>().ToListAsync(); 
    }

    public async Task<T> GetByIdAsync(int id)
    {
        return await db.Set<T>().FindAsync(id);
    }

    public void Update(T entity)
    {
        db.Set<T>().Update(entity);
    }
    public async Task SaveChangesAsync()
    {
        await db.SaveChangesAsync();
    }
}