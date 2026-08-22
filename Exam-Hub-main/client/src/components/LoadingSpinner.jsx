import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      minHeight: '400px',
      width: '100%',
      // Transparent background removed to avoid layout flash when swapping
    }}>
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <svg
          viewBox="0 0 50 50"
          style={{
            width: '80px',
            height: '80px',
            animation: 'premium-spin 1.5s linear infinite'
          }}
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="rgba(239, 68, 68, 0.1)"
            strokeWidth="4"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="4"
            strokeDasharray="31.4 31.4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p style={{
        marginTop: '2rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        animation: 'pulse 2s ease-in-out infinite'
      }}>{message}</p>

      <style>
        {`
          @keyframes premium-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;

