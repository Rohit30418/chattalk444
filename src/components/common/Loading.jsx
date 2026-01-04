import React from 'react';

const Loading = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm transition-all duration-300">
      
      <div className="flex flex-col items-center gap-4">
        {/* Animated Spinner */}
        <div className="relative w-12 h-12">
          {/* Background Ring */}
          <div className="absolute inset-0 border-4 border-gray-200 dark:border-slate-700 rounded-full"></div>
          
          {/* Spinning Ring (Brand Color) */}
          <div className="absolute inset-0 border-4 border-indigo-600 dark:border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        </div>

        {/* Optional Loading Text */}
        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse tracking-wider">
          Loading...
        </span>
      </div>

    </div>
  );
};

export default Loading;