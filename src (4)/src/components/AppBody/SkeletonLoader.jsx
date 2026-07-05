import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="w-full h-full">
      <div className="relative w-full h-[300px] flex flex-col justify-between rounded-3xl p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Shimmer Effect Overlay (Optional, adds a moving shine) */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent z-10"></div>

        {/* --- Top Section: Tags --- */}
        <div className="flex items-center gap-2 mb-4 animate-pulse">
          {/* Tag 1 */}
          <div className="w-16 h-6 bg-gray-200 dark:bg-slate-800 rounded-lg"></div>
          {/* Tag 2 */}
          <div className="w-20 h-6 bg-gray-200 dark:bg-slate-800 rounded-lg"></div>
        </div>

        {/* --- Middle Section: Title --- */}
        <div className="space-y-3 animate-pulse">
          {/* Title Line 1 */}
          <div className="w-3/4 h-7 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
          {/* Title Line 2 */}
          <div className="w-1/2 h-7 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
        </div>

        {/* --- Bottom Section: Avatars & Button --- */}
        <div className="flex flex-col gap-4 mt-auto">
          
          {/* Stacked Avatars Skeleton */}
          <div className="flex items-center -space-x-3 pl-1 animate-pulse">
             {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900"
                ></div>
             ))}
          </div>

          {/* Join Button Skeleton */}
          <div className="w-full h-12 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
        </div>

      </div>
    </div>
  );
};

export default SkeletonLoader;