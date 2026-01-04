import React from "react";

const GradientSpinner = () => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm transition-colors duration-300">
      
      {/* Spinner Container */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-xl animate-pulse"></div>

        {/* Background Track (Static) */}
        <div className="absolute w-full h-full border-4 border-gray-100 dark:border-slate-800 rounded-full"></div>
        
        {/* Active Spinner (Gradient Effect) */}
        {/* Using border-t and border-r with specific colors creates a gradient-like arc */}
        <div className="absolute w-full h-full border-4 border-transparent border-t-indigo-600 border-r-purple-500 dark:border-t-indigo-400 dark:border-r-purple-400 rounded-full animate-spin"></div>

        {/* Center Pulsing Dot */}
        <div className="absolute w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-ping"></div>
        
      </div>
    </div>
  );
};

export default GradientSpinner;