import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { FileText, Clock, Send, BookOpen, X, Eye, Loader2, Upload } from "lucide-react";
import { useNotification } from "../../contexts/NotificationContext";
import { API_BASE_URL } from '../../config/apiConfig.js';
import { axiosInstance } from '../../utils/authService';
import { format, parseISO, addHours } from "date-fns";
import { STATUS_CONSTANTS } from "../../utils/statusConstants";
import "./ReportsPage.css";

const ReportsPage = ({ currentUserId = null, user = null }) => {
  const [reportTitle, setReportTitle] = useState("");
  const [reportBody, setReportBody] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [previousReports, setPreviousReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const [hasTeam, setHasTeam] = useState(true);

  // Use the passed currentUserId or fall back to user.id
  const effectiveUserId = currentUserId || user?.id;

  useEffect(() => {
    fetchReports();
    // Also detect team membership to decide if page should be shown
    const checkTeam = async () => {
      try {
        const tmRes = await axiosInstance.get(`/TeamMembers`);
        const arr = tmRes.data?.$values || tmRes.data || [];
        const mine = arr.find(m => m.teamMemberAccountId === effectiveUserId);
        setHasTeam(!!mine);
      } catch {
        setHasTeam(true); // fail-open to avoid blocking if endpoint fails
      }
    };
    if (effectiveUserId) checkTeam();
  }, [effectiveUserId]);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("ReportsPage - Fetching reports for user ID:", effectiveUserId);
      const response = await axiosInstance.get(`/Reports/ByUser/${effectiveUserId}`);
      console.log("ReportsPage - Raw response:", response.data);
      
      // Handle different response formats
      let reports = response.data;
      if (Array.isArray(reports)) {
        setPreviousReports(reports);
      } else if (reports && reports.$values && Array.isArray(reports.$values)) {
        setPreviousReports(reports.$values);
      } else if (reports && Array.isArray(reports.data)) {
        setPreviousReports(reports.data);
      } else {
        console.log("ReportsPage - No valid reports array found, setting empty array");
        setPreviousReports([]);
      }
      
      console.log("ReportsPage - Final reports array:", reports);
      

    } catch (err) {
      console.error("ReportsPage - Error fetching reports:", err);
      console.error("ReportsPage - Error response:", err.response?.data);
      setError("Failed to load reports");
      setPreviousReports([]);
    } finally {
      setLoading(false);
    }
  };


  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const reportData = {
        Title: reportTitle,
        ReportMessage: reportBody,
        SubmitterAccountId: effectiveUserId,
        StatusId: 1
      };

      console.log("ReportsPage - Submitting report data:", reportData);
      console.log("ReportsPage - API endpoint:", `${API_BASE_URL}/Reports`);

      const response = await axiosInstance.post(`/Reports`, reportData, {
        headers: { "Content-Type": "application/json" }
      });
      
      console.log("ReportsPage - Submit response:", response.data);

      setReportTitle("");
      setReportBody("");
      await fetchReports();
      showSuccess("Report Submitted", "Report submitted successfully!");
    } catch (err) {
      console.error("ReportsPage - Error submitting report:", err);
      console.error("ReportsPage - Error response:", err.response?.data);
      showError("Submission Failed", "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
  };

  const showDeleteConfirmation = (report) => {
    setReportToDelete(report);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirmation = () => {
    setShowDeleteConfirm(false);
    setReportToDelete(null);
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    
    try {
      await axiosInstance.delete(`/Reports/${reportToDelete.id}`);
      showSuccess("Report Deleted", "Report has been successfully deleted.");
      await fetchReports(); // Refresh the reports list
      closeDeleteConfirmation();
    } catch (err) {
      console.error("Error deleting report:", err);
      showError("Delete Failed", "Failed to delete report. Please try again.");
    }
  };

  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1: return "#3182ce"; // Submitted - Blue
      case 2: return "#3182ce"; // Reviewed - Blue
      case 3: return "#38a169"; // Approved - Green
      case 4: return "#e53e3e"; // Rejected - Red
      case 5: return "#059669"; // Reviewed - Dark Green
      default: return "#718096"; // Unknown - Gray
    }
  };
  
  const getStatusBgColor = (statusId) => {
    switch (statusId) {
      case 1: return "#ebf8ff"; // Submitted - Light Blue
      case 2: return "#ebf8ff"; // Reviewed - Light Blue
      case 3: return "#f0fff4"; // Approved - Light Green
      case 4: return "#fed7d7"; // Rejected - Light Red
      case 5: return "#ecfdf5"; // Reviewed - Light Green
      default: return "#f7fafc"; // Unknown - Light Gray
    }
  };
  
  const getStatusText = (statusId) => {
    const statusMap = {
      1: "Submitted",
      2: "Reviewed",
      3: "Approved",
      4: "Rejected",
      5: "Reviewed"
    };
    return statusMap[statusId] || "Unknown";
  };



  // Convert UTC date to Cairo timezone and format with AM/PM
  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    
    try {
      // Parse the UTC date string
      const utcDate = parseISO(dateString);
      
      // Add 3 hours to UTC to get Cairo time
      const cairoTime = addHours(utcDate, 3);
      
      // Format using date-fns with clear AM/PM display
      const formattedDate = format(cairoTime, "MMM dd, yyyy, hh:mm a");
      
      return formattedDate;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  if (!hasTeam) {
    return (
      <div className="reports-page">
        <div className="reports-header">
          <h1 className="reports-title">Submit Report</h1>
        </div>
        <div className="no-team-message">
          <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>No Team Assigned</h3>
          <p style={{ color: '#6b7280', marginBottom: '12px' }}>
            You are not currently assigned to any team.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Please contact your instructor or administrator to be assigned to a team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1 className="reports-title">Submit Report</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="reports-content">
        <div className="report-form-section">
          <div className="section-headerr">
            <BookOpen size={20} className="section-icon" />
            <h2>New Report</h2>
          </div>
          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <label className="form-label">Report Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter report title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

    

            <div className="form-group">
              <label className="form-label">Report Body</label>
              <textarea
                className="form-textarea"
                placeholder="Enter your report content here..."
                rows={8}
                value={reportBody}
                onChange={(e) => setReportBody(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={!reportTitle.trim() || !reportBody.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="previous-reports-section">
          <div className="section-headerr">
            <FileText size={20} className="section-icon" />
            <h2>Previous Reports</h2>
          </div>

          {loading ? (
            <div className="loading-container">
              <Loader2 size={24} className="animate-spin" />
              <p>Loading reports...</p>
            </div>
          ) : previousReports.length === 0 ? (
            <div className="no-reports">
              <FileText size={48} className="no-reports-icon" />
              <p>No reports found. Submit your first report above!</p>
            </div>
          ) : (
            <div className="reports-list">
              {Array.isArray(previousReports) && previousReports.map((report) => (
                <div key={report.id} className="report-item">
                  <div className="report-content">
                    <div className="report-info">
                      <div className="report-header-info">
                        <div className="report-title-section">
                          <FileText size={20} className="report-icon" />
                          <h3 className="report-title">{report.title}</h3>
                        </div>
                        <div
                          className="report-status"
                          style={{
                            color: getStatusColor(report.statusId),
                            backgroundColor: getStatusBgColor(report.statusId),
                          }}
                        >
                          {report.statusId === STATUS_CONSTANTS.REPORT_SUBMITTED && <Upload size={14} className="status-icon" />}
                          {getStatusText(report.statusId)}
                        </div>
                      </div>
                      <div className="report-message">
                        <p>{report.reportMessage}</p>
                      </div>
                      <div className="report-meta">
                        <span className="submission-date">
                          <Clock size={16} />
                          {formatDate(report.submissionDate)}
                        </span>
                      </div>
                    </div>
                    <div className="report-actions">
                      <button
                        className="report-action-btn view-btn"
                        onClick={() => handleViewReport(report)}
                      >
                        <Eye size={16} />
                        View Report
                      </button>
                      <button
                        className="report-action-btn delete-btn"
                        onClick={() => showDeleteConfirmation(report)}
                        title="Delete Report"
                      >
                        <X size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showReportModal && selectedReport && (
        <div className="report-modal-overlay" onClick={closeReportModal}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <FileText size={24} className="modal-icon" />
                <h2 className="modal-title">{selectedReport.title}</h2>
              </div>
              <button className="modal-close-btn" onClick={closeReportModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              <div className="report-details">
                <div className="detail-item">
                  <span className="detail-label">Submission Date:</span>
                  <span className="detail-value">{formatDate(selectedReport.submissionDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span
                    className="detail-value status-badge"
                    style={{
                      color: getStatusColor(selectedReport.statusId),
                      backgroundColor: getStatusBgColor(selectedReport.statusId),
                    }}
                  >
                    {selectedReport.statusId === STATUS_CONSTANTS.REPORT_SUBMITTED && <Upload size={14} className="status-icon" />}
                    {getStatusText(selectedReport.statusId)}
                  </span>
                </div>
              </div>

              <div className="report-content-section">
                <h3 className="content-title">Report Content</h3>
                <div className="content-text">
                  {selectedReport.reportMessage}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && reportToDelete && (
        <div className="delete-confirm-overlay" onClick={closeDeleteConfirmation}>
          <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <div className="delete-confirm-icon">
                <X size={32} />
              </div>
              <h3 className="delete-confirm-title">Delete Report</h3>
              <p className="delete-confirm-message">
                Are you sure you want to delete "<strong>{reportToDelete.title}</strong>"?
              </p>
              <p className="delete-confirm-warning">
                This action cannot be undone and the report will be permanently removed.
              </p>
            </div>
            
            <div className="delete-confirm-actions">
              <button 
                className="delete-confirm-cancel"
                onClick={closeDeleteConfirmation}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-delete"
                onClick={handleDeleteReport}
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead
