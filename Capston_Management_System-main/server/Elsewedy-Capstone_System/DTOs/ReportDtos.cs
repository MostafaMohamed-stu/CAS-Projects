using System;
using Elsewedy_Capstone_System.Constants;

namespace Elsewedy_Capstone_System.DTOs
{
    public class ReportReadDto
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public DateTime SubmissionDate { get; set; }
        public string ReportMessage { get; set; }
        public long SubmitterAccountId { get; set; }
        public long StatusId { get; set; }
    }

    public class CreateReportDto
    {
        public string Title { get; set; } = string.Empty;
        public string ReportMessage { get; set; } = string.Empty;
        public long SubmitterAccountId { get; set; }
        public long StatusId { get; set; } = StatusConstants.GetDefaultReportStatus(); // Default to submitted
    }

    public class ReportUpdateDto
    {
        public string Title { get; set; } = string.Empty;
        public string ReportMessage { get; set; } = string.Empty;
        public long? StatusId { get; set; }
    }
}


