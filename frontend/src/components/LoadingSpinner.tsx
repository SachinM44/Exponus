import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = 'Loading...', 
  fullPage = false 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8 border-2',
    medium: 'w-12 h-12 border-3',
    large: 'w-16 h-16 border-4'
  };

  const spinner = (
    <div className={`${fullPage ? 'flex flex-col items-center justify-center' : ''}`}>
      <div className={`${sizeClasses[size]} border-t-transparent border-b-transparent rounded-full border-gray-900 dark:border-gray-200 animate-spin mx-auto`}></div>
      {message && <div className="mt-4 text-gray-700 dark:text-gray-300">{message}</div>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner; 