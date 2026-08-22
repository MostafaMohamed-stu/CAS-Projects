using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Data;
using SchoolAdmission.Models;
using SchoolAdmission.Repos.IRepos;
namespace SchoolAdmission.Repos;

public class SectionRepo : GenericRepo<Section>, ISectionRepo
{
    public SectionRepo(SchoolAdmissionDbContext db) : base(db)
    {
    }

    public async Task<IEnumerable<Section>> getSectionsWithIncludeAsync(){
        return await db.Sections
        .Include(s => s.ExamQuestions)
        .ToListAsync();
    }

    public async Task<Section> getSectionByIdWithIncludeAsync(int id){
        var section = await db.Sections
        .Include(s => s.ExamQuestions)
        .FirstOrDefaultAsync(s => s.Id == id);
        if (section == null)
            return null;
            
        return section;

    }
}