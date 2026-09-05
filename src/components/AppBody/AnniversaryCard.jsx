import React, { memo, useState } from 'react';

const AnniversaryCard = memo(({ onClick }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden md:block">
      <div className="relative w-60 rounded-2xl border border-violet-300/30 bg-violet-700 p-4 shadow-md">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsVisible(false);
          }}
          className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label="Close offer"
        >
          ✕
        </button>

        <button
          type="button"
          onClick={onClick}
          className="block w-full text-left"
        >
          <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-100">
            9th Anniversary
          </p>
          <h3 className="mt-1 text-lg font-black text-white">Big Sale</h3>

          <div className="mt-3 rounded-xl bg-white px-3 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              Lifetime Unlimited
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">
              Only <span className="text-rose-600">$79</span>
            </p>
          </div>

          <div className="mt-3 rounded-xl bg-lime-300 py-2 text-center text-xs font-black uppercase tracking-wide text-slate-950">
            Grab Now
          </div>
        </button>
      </div>
    </div>
  );
});

AnniversaryCard.displayName = 'AnniversaryCard';

export default AnniversaryCard;
