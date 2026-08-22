// In Interfaces/IStudentProfileRepository.cs
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Models;

namespace AttendanceBehaviour_Backend.Interfaces
{
    public interface IStudentProfileRepository
    {
        Task<IEnumerable<StudentProfileDto>> GetAllAsync();
        Task<StudentProfileDto?> GetByIdAsync(long id);
        Task<StudentProfileDto?> GetByAccountIdAsync(long accountId);
        //Task<StudentProfileDto?> GetByEmailAsync(string email);
        //Task<StudentProfile> CreateAsync(StudentProfileDto dto);
        //Task<StudentProfileDto?> UpdateAsync(long id, StudentProfileDto dto);
        //Task<bool> DeleteAsync(long id);
        Task<bool> UpdateNotesAsync(long id, NotesUpdateDto dto);
    }
}
