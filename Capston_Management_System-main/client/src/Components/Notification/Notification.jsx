import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import './Notification.css';

const Notification = ({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose, 
  show = true 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(show);
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'notification-success';
      case 'error':
        return 'notification-error';
      case 'warning':
        return 'notification-warning';
      default:
        return 'notification-info';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`notification ${getTypeClass()} ${isExiting ? 'notification-exit' : 'notification-enter'}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      <div className="notification-content">
        {title && <h4 className="notification-title">{title}</h4>}
        <p className="notification-message">{message}</p>
      </div>
      <button className="notification-close" onClick={handleClose}>
        <X size={16} />
      </button>
    </div>
  );
};

export default Notification;
