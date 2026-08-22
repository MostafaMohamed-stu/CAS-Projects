using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class NoteInputModel
    {
        [Required]
        public long StudentId { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        public string NoteType { get; set; }

        public string ImageUrl { get; set; }

        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
}
