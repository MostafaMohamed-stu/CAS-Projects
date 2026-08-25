using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore.Query;

namespace Elsewedy_Capstone_System.Repositories.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(params object[] ids);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);
    
    Task AddAsync(T entity);
    Task AddRangeAsync(IEnumerable<T> entities);
    void Update(T entity);
    void UpdateRange(IEnumerable<T> entities);
    void Remove(T entity);
    void RemoveRange(IEnumerable<T> entities);
    
    Task<T?> GetByIdAsync(
        Expression<Func<T, bool>> predicate,
        Func<IQueryable<T>, IIncludableQueryable<T, object>>? include = null);
    
    Task<IEnumerable<T>> GetAllAsync(
        Func<IQueryable<T>, IIncludableQueryable<T, object>>? include = null);
    
    Task<IEnumerable<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        Func<IQueryable<T>, IIncludableQueryable<T, object>>? include = null);
}
