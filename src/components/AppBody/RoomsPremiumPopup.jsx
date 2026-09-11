import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AVATAR_URL = 'https://static.vecteezy.com/system/resources/previews/034/599/439/non_2x/ai-generated-3d-cute-cartoon-woman-character-in-blue-suit-on-transparent-background-png.png';

const RoomsPremiumPopup = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname !== '/rooms') {
      setVisible(false);
      return undefined;
    }

    const alreadySeen = sessionStorage.getItem('vaani_rooms_premium_seen') === '1';
    if (alreadySeen) return undefined;

    const timer = window.setTimeout(() => setVisible(true), 1100);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (pathname !== '/rooms' || !visible) return null;

  const dismiss = () => {
    sessionStorage.setItem('vaani_rooms_premium_seen', '1');
    setVisible(false);
  };

  return (
    <aside className="fixed bottom-24 left-3 right-3 z-[85] overflow-hidden rounded-[1.45rem] border border-amber-300/25 bg-[#07111f] text-white shadow-xl sm:left-auto sm:right-5 sm:w-[390px] lg:bottom-6 lg:right-6" role="dialog" aria-label="Vaani Premium announcement">
      <div className="relative min-h-[152px] p-4 pr-[116px] sm:p-5 sm:pr-[135px]">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close premium announcement"
        >
          <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
        </button>

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-200">
            <i className="fa-solid fa-crown text-[8px]" aria-hidden="true" />
            Premium is live
          </span>

          <h3 className="mt-3 max-w-[220px] text-lg font-black leading-tight tracking-tight text-white sm:text-xl">
            Unlock Luna AI + advanced speaking feedback
          </h3>
          <p className="mt-2 max-w-[225px] text-[11px] font-medium leading-5 text-slate-300">
            Lifetime access, private practice and detailed progress insights.
          </p>

          <div className="mt-3 flex items-center gap-3">
            <Link
              to="/#pricing"
              onClick={dismiss}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-3.5 py-2 text-xs font-black text-slate-950 transition-colors hover:bg-amber-200"
            >
              View Premium
              <i className="fa-solid fa-arrow-right text-[9px]" aria-hidden="true" />
            </Link>
            <span className="text-[10px] font-bold text-emerald-300">$99 lifetime</span>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 right-2 h-full w-[120px] overflow-hidden sm:right-3 sm:w-[135px]">
          <img
            src={AVATAR_URL}
            alt="Luna AI coach"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute bottom-0 right-0 max-h-[150px] w-auto object-contain sm:max-h-[162px]"
          />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-teal-500/80" />
      </div>
    </aside>
  );
};

export default RoomsPremiumPopup;
