using AttendanceBehaviour_Backend.DTOs;

namespace AttendanceBehaviour_Backend.Interfaces
{
    public interface IGradeRepository
    {
        Task<List<StudentExtensionDto>>GetStudentsByGradeClassSessionAsync(string gradeName, string className, int sessionName);
    }
}
