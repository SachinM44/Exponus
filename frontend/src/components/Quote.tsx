import React from 'react';

export const Quote = () => {
  return (
    <div className="bg-slate-200 dark:bg-gray-800 h-screen flex justify-center items-center">
      <div className="max-w-md p-8 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
        <p className="text-2xl font-serif italic text-gray-800 dark:text-gray-100 mb-4">
          "The secret of getting ahead is getting started."
        </p>
        <p className="text-right text-gray-600 dark:text-gray-400">— Mark Twain</p>
      </div>
    </div>
  );
};