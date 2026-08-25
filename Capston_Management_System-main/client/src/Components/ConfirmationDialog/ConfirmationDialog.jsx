import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmationDialog.css';

const ConfirmationDialog = ({ 
  isOpen, 
  title = "Confirm Action", 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning" // warning, danger, info
}) => {
  if (!isOpen) return null;

  const getTypeClass = () => {
    switch (type) {
      case 'danger':
        return 'confirmation-danger';
      case 'info':
        return 'confirmation-info';
      default:
        return 'confirmation-warning';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={24} />;
      case 'info':
        return <AlertTriangle size={24} />;
      default:
        return <AlertTriangle size={24} />;
    }
  };

  return (
    <div className="confirmation-overlay">
      <div className={`confirmation-dialog ${getTypeClass()}`}>
        <div className="confirmation-header">
          <div className="confirmation-icon">
            {getIcon()}
          </div>
          <h3 className="confirmation-title">{title}</h3>
          <button className="confirmation-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        
        <div className="confirmation-content">
          <p className="confirmation-message">{message}</p>
        </div>
        
        <div className="confirmation-actions">
          <button className="confirmation-btn cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirmation-btn confirm-btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
