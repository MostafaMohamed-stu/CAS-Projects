using SchoolAdmission.Repos.IRepos;
using SchoolAdmission.Models;
namespace SchoolAdmission.Repos.IRepos;


public interface ISectionRepo : IGenericRepo<Section> {

    Task<IEnumerable<Section>> getSectionsWithIncludeAsync();
    Task<Section> getSectionByIdWithIncludeAsync(int id);
    
}