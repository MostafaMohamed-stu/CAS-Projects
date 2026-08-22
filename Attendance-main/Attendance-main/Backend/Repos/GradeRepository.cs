using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.Models;
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Interfaces;

namespace AttendanceBehaviour_Backend.Repos
{
    public class GradeRepository : IGradeRepository
    {
        private readonly ElsewedySchoolContext _context;
        public GradeRepository(ElsewedySchoolContext context)
        {
            _context = context;
        }

        public async Task<List<StudentExtensionDto>> GetStudentsByGradeClassSessionAsync(string gradeName, string className, int sessionName)
        {
            // First, find the class that matches the grade and class name

            var classEntity = await _context.TblClasses
                .Include(c => c.Grade)
                .Include(s => s.studentExtensions)
                .ThenInclude(x=>x.Account)
                .FirstOrDefaultAsync(c =>
                    c.ClassName == className &&
                    c.Grade.GradeName == gradeName &&
                    c.StatusId == 1); // Only active classes

            if (classEntity == null)
                return null;

            // Check if there's a SubordinateTicket linking this class with the session
            var sessionExists = await _context.SubordinateTickets
                .Include(st => st.Session)
                .AnyAsync(st =>
                    st.ClassId == classEntity.Id &&
                    st.Session != null &&
                    st.Session.SessionNo == sessionName &&
                    st.StatusId == 1); // Only active tickets

            // If no session relationship exists, still return students but log a warning
            if (!sessionExists)
            {
                // For now, we'll be lenient and return students even if session relationship doesn't exist
                // This allows the system to work with sessions 1-8 even if not all are properly linked
                Console.WriteLine($"Warning: No SubordinateTicket found for Tbl_Class {className}, Grade {gradeName}, Session {sessionName}");
            }


            var result = classEntity.studentExtensions.Select(x => new StudentExtensionDto
            {
                StudentId=x.Account.Id,
                StudentName = x.Account.FullNameAr,
                
            }).ToList();
            return result;
            

            //return classEntity.StudentProfiles.Select(sp => new StudentProfileDto
            //{
            //    Id = sp.Id,
            //    Name = sp.Name,
            //    Email = sp.Email,
            //    PhoneNumber = sp.PhoneNumber,
            //    Age = sp.Age,
            //    City = sp.City,
            //    Country = sp.Country,
            //    DaysAbsent = sp.DaysAbsent,
            //    ClassId = sp.ClassId,
            //    ClassName = classEntity.ClassName,
            //    GradeName = classEntity.Grade.GradeName
            //}).ToList();
            return null;
        }

    }
}
