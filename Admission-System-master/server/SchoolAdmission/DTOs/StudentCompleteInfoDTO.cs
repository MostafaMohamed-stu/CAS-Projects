using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.DTOs
{
    public class StudentCompleteInfoDTO
    {
        [Required]
        public string NationalId { get; set; }
        public string StudentNameEn { get; set; }
        public string ParentOccupation { get; set; }
        public string Location { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string City { get; set; }
        public string District { get; set; }
        public string StreetName { get; set; }
        public string BuildingNo { get; set; }


        public string? BirthCertificatePath { get; set; }
        public string? SuccessReportPath { get; set; }
        public string? TuitionFeeReceiptPath { get; set; }
        public string? PreferencesSheetPath { get; set; }

        public string? ParentPhoneNumber { get; set; }
        public string? PreviousSchoolType { get; set; }

        public bool HasOnlineTrainingCourses { get; set; }
        public bool HasICDLLicense { get; set; }
        public bool HasLaptop { get; set; }
    }
} 