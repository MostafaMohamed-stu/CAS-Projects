using System;
using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.DTOs
{
    public class StudentRegisterDTO
    {
        [Required]
        public string StudentName { get; set; }
        
        [Required]
        public string NationalId { get; set; }
        
        [Required]
        public decimal MathScore { get; set; }
        
        [Required]
        public decimal EnglishScore { get; set; }
        
        [Required]
        public decimal FinalYearScore { get; set; }
        
        [Required]
        public bool IsAcceptanceLetterReceived { get; set; }
        
        public decimal MinistryExamPercentage { get; set; }
        
        [Required]
        public string DateOfBirth { get; set; }
    }
} 