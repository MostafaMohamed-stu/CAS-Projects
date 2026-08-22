using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class StaffDto
    {
        public long Id { get; set; }
        public string EmployeeName { get; set; }
        public string Department { get; set; }
        public string Status { get; set; }
        public DateTime? CheckInTime { get; set; }
        public string CheckInMethod { get; set; }
        public DateTime Date { get; set; }
        public long? AccountId { get; set; }
        public long? RoleId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateStaffAttendanceDto
    {
        [Required]
        public string EmployeeName { get; set; }

        [Required]
        public string Department { get; set; }

        [Required]
        public string Status { get; set; } // "Present", "Late", "Absent"

        public DateTime? CheckInTime { get; set; }

        [Required]
        public string CheckInMethod { get; set; } // "Fingerprint", "FaceID", "Manual"

        public long? AccountId { get; set; }
        public long? RoleId { get; set; }
    }

    public class UpdateStaffAttendanceDto
    {
        [Required]
        public string Status { get; set; }

        public DateTime? CheckInTime { get; set; }

        [Required]
        public string CheckInMethod { get; set; }
    }
    
    // NEW: DTO for staff list
    public class StaffListDto
    {
        public long Id { get; set; }
        public string EmployeeId { get; set; }
        public long? AccountId { get; set; }
        public string Name { get; set; }
        public string Department { get; set; }
        public string Role { get; set; }
        public string Email { get; set; }
    }

    // NEW: DTO for staff registration
    public class RegisterStaffDto
    {
        [Required]
        public string EmployeeName { get; set; }

        [Required]
        public string Department { get; set; }

        [Required]
        public string Status { get; set; } // "Present", "Late", "Absent"

        public DateTime? CheckInTime { get; set; }

        [Required]
        public string CheckInMethod { get; set; } // "Fingerprint", "FaceID", "Manual"

        [Required]
        public long AccountId { get; set; }

        [Required]
        public long RoleId { get; set; }

        public string? Phone { get; set; }

        public string? Address { get; set; }
    }
}
