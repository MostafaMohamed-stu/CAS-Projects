import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="loader">
        <div className="justify-content-center jimu-primary-loading"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
