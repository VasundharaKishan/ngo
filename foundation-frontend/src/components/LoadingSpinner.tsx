import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text,
  className = ''
}) => {
  return (
    <div className={`loading-spinner-container ${className}`} role="status" aria-live="polite">
      <div className={`loading-spinner loading-spinner-${size}`} aria-hidden="true"></div>
      {text && <span className="loading-spinner-text">{text}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
