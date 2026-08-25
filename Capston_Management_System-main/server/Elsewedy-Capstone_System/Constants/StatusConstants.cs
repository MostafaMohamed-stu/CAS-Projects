using System;

namespace Elsewedy_Capstone_System.Constants
{
    /// <summary>
    /// Contains all status IDs used throughout the system for easy management and modification
    /// </summary>
    public static class StatusConstants
    {
        #region General Status IDs
        
        /// <summary>
        /// Active/Enabled status
        /// </summary>
        public const long Active = 1L;
        
        /// <summary>
        /// Inactive/Disabled status
        /// </summary>
        public const long Inactive = 2L;
        
        #endregion

        #region Task Status IDs
        
        /// <summary>
        /// Task is pending/not started
        /// </summary>
        public const long TaskPending = 1L;
        
        /// <summary>
        /// Task is in progress
        /// </summary>
        public const long TaskInProgress = 2L;
        
        /// <summary>
        /// Task is completed successfully
        /// </summary>
        public const long TaskCompleted = 12L;
        
        /// <summary>
        /// Task submission is rejected
        /// </summary>
        public const long TaskRejected = 6L;
        
        /// <summary>
        /// Task submitted on time
        /// </summary>
        public const long TaskSubmittedOnTime = 10L;
        
        /// <summary>
        /// Task submitted late
        /// </summary>
        public const long TaskSubmittedLate = 11L;
        
        /// <summary>
        /// Task completed late
        /// </summary>
        public const long TaskCompletedLate = 13L;
        
        #endregion

        #region Report Status IDs
        
        /// <summary>
        /// Report is submitted (default status)
        /// </summary>
        public const long ReportSubmitted = 1L;
        
        /// <summary>
        /// Report is under review
        /// </summary>
        public const long ReportUnderReview = 2L;
        
        /// <summary>
        /// Report is approved
        /// </summary>
        public const long ReportApproved = 3L;
        
        /// <summary>
        /// Report is rejected
        /// </summary>
        public const long ReportRejected = 4L;
        
        #endregion

        #region Grade Status IDs
        
        /// <summary>
        /// Grade is active
        /// </summary>
        public const long GradeActive = 1L;
        
        #endregion

        #region Account Status IDs
        
        /// <summary>
        /// Account is active
        /// </summary>
        public const long AccountActive = 1L;
        
        /// <summary>
        /// Account is inactive
        /// </summary>
        public const long AccountInactive = 2L;
        
        #endregion

        #region Role IDs (for reference)
        
        /// <summary>
        /// Supervisor role ID
        /// </summary>
        public const long RoleSupervisor = 3L;
        
        /// <summary>
        /// Teacher role ID
        /// </summary>
        public const long RoleTeacher = 4L;
        
        /// <summary>
        /// Engineer role ID
        /// </summary>
        public const long RoleEngineer = 5L;
        
        #endregion

        #region Helper Methods
        
        /// <summary>
        /// Gets the appropriate task status based on submission timing
        /// </summary>
        /// <param name="isLate">Whether the submission is late</param>
        /// <returns>Status ID for submission timing</returns>
        public static long GetTaskSubmissionStatus(bool isLate)
        {
            return isLate ? TaskSubmittedLate : TaskSubmittedOnTime;
        }
        
        /// <summary>
        /// Gets the appropriate task completion status based on timing
        /// </summary>
        /// <param name="isCompletedLate">Whether the completion is late</param>
        /// <returns>Status ID for completion timing</returns>
        public static long GetTaskCompletionStatus(bool isCompletedLate)
        {
            return isCompletedLate ? TaskCompletedLate : TaskCompleted;
        }
        
        /// <summary>
        /// Gets the default report status
        /// </summary>
        /// <returns>Default report status ID</returns>
        public static long GetDefaultReportStatus()
        {
            return ReportSubmitted;
        }
        
        #endregion
    }
}
