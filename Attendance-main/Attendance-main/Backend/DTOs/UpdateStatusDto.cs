using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class UpdateStatusDto
    {
        [Required]
        public long StatusId { get; set; }
        
        [Required]
        public string StatusName { get; set; } = string.Empty;
    }
}
