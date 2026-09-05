import React, { memo, useState } from 'react';

const AnniversaryCard = memo(({ onClick }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="mt-8 hidden md:block">
      <div className="relative flex items-center justify-between gap-5 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 shadow-sm dark:border-violet-400/15 dark:bg-violet-500/10">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
            9th Anniversary
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              Lifetime Unlimited
            </h3>
            <span className="text-sm font-black text-rose-600 dark:text-rose-300">
              Only $79
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClick}
            className="rounded-xl bg-violet-700 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition-colors hover:bg-violet-800"
          >
            View Offer
          </button>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
            aria-label="Close offer"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
});

AnniversaryCard.displayName = 'AnniversaryCard';

export default AnniversaryCard;
