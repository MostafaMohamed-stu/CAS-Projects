using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Repositories.Interfaces;

namespace Elsewedy_Capstone_System.Repositories.Implementations;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly SchoolDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(SchoolDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(params object[] ids)
    {
        return await _dbSet.FindAsync(ids);
    }

    public virtual async Task<T?> GetByIdAsync(
        Expression<Func<T, bool>> predicate,
        Func<IQueryable<T>, IIncludableQueryable<T, object>>? include = null)
    {
        IQueryable<T> query = _dbSet;

        if (include != null)
            query = include(query);

        return await query.FirstOrDefaultAsync(predicate);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync(
        Func<IQueryable<T>, IIncludableQueryable<T, object>>? include = null)
    {
        IQueryable<T> query = _dbSet;

        if (include != null)
            query = include(query);

        return await query.ToListAsync();
    }

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public virtual async Task<IEnumerable<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        Func<IQueryable<T>, IIncludableQueryable<T, object>>? include = null)
    {
        IQueryable<T> query = _dbSet.Where(predicate);

        if (include != null)
            query = include(query);

        return await query.ToListAsync();
    }

    public virtual async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.FirstOrDefaultAsync(predicate);
    }

    public virtual async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AnyAsync(predicate);
    }

    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        if (predicate == null)
            return await _dbSet.CountAsync();
        return await _dbSet.CountAsync(predicate);
    }

    public virtual async Task AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
    }

    public virtual async Task AddRangeAsync(IEnumerable<T> entities)
    {
        await _dbSet.AddRangeAsync(entities);
        await _context.SaveChangesAsync();
    }

    public virtual void Update(T entity)
    {
        _dbSet.Update(entity);
        _context.SaveChanges();
    }

    public virtual void UpdateRange(IEnumerable<T> entities)
    {
        _dbSet.UpdateRange(entities);
        _context.SaveChanges();
    }

    public virtual void Remove(T entity)
    {
        _dbSet.Remove(entity);
        _context.SaveChanges();
    }

    public virtual void RemoveRange(IEnumerable<T> entities)
    {
        _dbSet.RemoveRange(entities);
        _context.SaveChanges();
    }
}
