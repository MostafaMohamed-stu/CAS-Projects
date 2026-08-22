using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.Models
{
    public class Staff
    {
        [Key]
        public long Id { get; set; }

        public string EmployeeName { get; set; } = string.Empty;

        public string Department { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime CheckInTime { get; set; }

        public string CheckInMethod { get; set; } = string.Empty;

        public long? AccountId { get; set; }

        public long RoleId { get; set; }

        public DateTime Date { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public virtual Account? Account { get; set; }

        public virtual Role? Role { get; set; }
    }
}