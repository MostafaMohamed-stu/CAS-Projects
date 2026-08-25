import React from 'react';
import { validatePasswordComplexity } from '../../utils/inputValidation.js';
import './PasswordStrengthIndicator.css';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  if (!password) {
    return null;
  }

  const validation = validatePasswordComplexity(password);
  const { requirements, strength } = validation;

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'strong': return '#00aa44';
      default: return '#cccccc';
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  const getStrengthWidth = () => {
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    return (metRequirements / 5) * 100;
  };

  return (
    <div className="password-strength-indicator">
      {/* Strength Bar */}
      <div className="strength-bar-container">
        <div 
          className="strength-bar"
          style={{ 
            width: `${getStrengthWidth()}%`,
            backgroundColor: getStrengthColor()
          }}
        ></div>
      </div>
      
      {/* Strength Text */}
      <div className="strength-text" style={{ color: getStrengthColor() }}>
        {getStrengthText()}
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="requirements-list">
          <div className={`requirement ${requirements.length ? 'met' : 'unmet'}`}>
            <span className="requirement-icon">
              {requirements.length ? '✓' : '✗'}
            </span>
            At least 6 characters
          </div>
          <div className={`requirement ${requirements.lowercase ? 'met' : 'unmet'}`}>
            <span className="requirement-icon">
              {requirements.lowercase ? '✓' : '✗'}
            </span>
            One lowercase letter (a-z)
          </div>
          <div className={`requirement ${requirements.uppercase ? 'met' : 'unmet'}`}>
            <span className="requirement-icon">
              {requirements.uppercase ? '✓' : '✗'}
            </span>
            One uppercase letter (A-Z)
          </div>
          <div className={`requirement ${requirements.number ? 'met' : 'unmet'}`}>
            <span className="requirement-icon">
              {requirements.number ? '✓' : '✗'}
            </span>
            One number (0-9)
          </div>
          <div className={`requirement ${requirements.special ? 'met' : 'unmet'}`}>
            <span className="requirement-icon">
              {requirements.special ? '✓' : '✗'}
            </span>
            One special character (@$!%*?&_)
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
