import React, { memo } from 'react';

const SkeletonLoader = memo(() => {
  return (
    <div className="h-full w-full">
      <div className="flex h-[260px] w-full flex-col justify-between rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#101626]">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-md bg-slate-100 dark:bg-white/[0.06]" />
          <div className="h-5 w-20 rounded-md bg-slate-100 dark:bg-white/[0.06]" />
        </div>

        <div className="space-y-3">
          <div className="h-6 w-3/4 rounded-md bg-slate-100 dark:bg-white/[0.06]" />
          <div className="h-6 w-1/2 rounded-md bg-slate-100 dark:bg-white/[0.06]" />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-9 w-9 rounded-full border-2 border-white bg-slate-100 dark:border-[#101626] dark:bg-white/[0.06]"
              />
            ))}
          </div>
          <div className="h-9 w-20 rounded-xl bg-slate-100 dark:bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;
