import React from 'react';
import { X, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';
import './SubmissionLinkModal.css';

const SubmissionLinkModal = ({ isOpen, onClose, submissionData }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(submissionData?.glink || '');
      setCopied(true);
      showSuccess('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      showError('Failed to copy link to clipboard');
    }
  };

  const handleOpenLink = () => {
    if (submissionData?.glink) {
      window.open(submissionData.glink, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen || !submissionData) return null;

  return (
    <div className="submission-link-modal-overlay" onClick={onClose}>
      <div className="submission-link-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Task Submission Link</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="submission-info">
            <div className="info-item">
              <span className="info-label">Task:</span>
              <span className="info-value">{submissionData.taskName || `Task #${submissionData.taskId || 'N/A'}`}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Team:</span>
              <span className="info-value">#{submissionData.teamId}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Team Leader:</span>
              <span className="info-value">{submissionData.teamLeaderName || `#${submissionData.teamLeaderId}`}</span>
            </div>
          </div>

          <div className="link-section">
            <label className="link-label">Submission Link:</label>
            <div className="link-container">
              <div className="link-display">
                <span className="link-text" title={submissionData.glink}>
                  {submissionData.glink || 'No link provided'}
                </span>
              </div>
              <div className="link-actions">
                <button 
                  className="action-button copy-button"
                  onClick={handleCopyLink}
                  disabled={!submissionData.glink}
                  title="Copy link to clipboard"
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button 
                  className="action-button open-button"
                  onClick={handleOpenLink}
                  disabled={!submissionData.glink}
                  title="Open link in new tab"
                >
                  <ExternalLink size={16} />
                  Open
                </button>
              </div>
            </div>
          </div>

          {submissionData.note && (
            <div className="note-section">
              <label className="note-label">Submission Note:</label>
              <div className="note-content">
                {submissionData.note}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-modal-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionLinkModal;
