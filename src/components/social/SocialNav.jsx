import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const pageItems = [
  { to: '/rooms', label: 'Rooms', icon: 'fa-microphone-lines' },
  { to: '/connect', label: 'Connect', icon: 'fa-user-group' },
  { to: '/messages', label: 'Chat', icon: 'fa-message' },
];

const CONNECT_PROMPTS = [
  '👋 Meet new people',
  '💬 Chat & connect',
  '🌍 Find language buddies',
  '🤝 Get to know learners',
];

const PeopleIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="2.7" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="16.5" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 19c0-3 1.9-5 4.5-5s4.5 2 4.5 5M13 18.8c.2-2.3 1.7-3.8 3.8-3.8 2.2 0 3.7 1.6 3.7 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M13.7 5.6h4.8M16.1 3.2v4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const DesktopSocialBar = () => (
  <div className="relative z-40 hidden pt-[82px] lg:block">
    <div className="border-b border-slate-200 bg-white px-8 py-3 dark:border-white/10 dark:bg-[#07111f]">
      <nav
        className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto"
        aria-label="Vaani community navigation"
      >
        {pageItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `inline-flex min-w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${
                isActive
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
              }`
            }
          >
            <i className={`fa-solid ${item.icon} text-xs`} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  </div>
);

const RoomsPeopleButton = () => {
  const navigate = useNavigate();
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % CONNECT_PROMPTS.length);
    }, 4600);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <style>{`
        @keyframes vaaniConnectHint {
          0% { opacity: 0; transform: translateY(6px) scale(.96); }
          12%, 82% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-4px) scale(.98); }
        }
        .vaani-connect-hint { animation: vaaniConnectHint 4.5s ease-in-out both; }
        @media (prefers-reduced-motion: reduce) {
          .vaani-connect-hint { animation: none; opacity: 1; }
        }
      `}</style>

      <div className="fixed bottom-7 right-7 z-[80] hidden items-end gap-3 lg:flex">
        <div
          key={promptIndex}
          className="vaani-connect-hint pointer-events-none mb-1 rounded-2xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800 shadow-lg dark:border-teal-400/20 dark:bg-[#0b1220] dark:text-white"
          aria-hidden="true"
        >
          {CONNECT_PROMPTS[promptIndex]}
        </div>

        <button
          type="button"
          onClick={() => navigate('/connect')}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-teal-700 text-white shadow-[0_16px_34px_rgba(15,118,110,0.28)] transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-[#050713] dark:bg-teal-600 dark:hover:bg-teal-500"
          aria-label="Open Vaani Connect"
          title="Discover people on Vaani"
        >
          <PeopleIcon className="h-7 w-7" />
          <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 dark:border-[#050713]" aria-hidden="true" />
        </button>
      </div>
    </>
  );
};

const SocialNav = () => {
  const location = useLocation();

  if (location.pathname === '/rooms') {
    return <RoomsPeopleButton />;
  }

  return <DesktopSocialBar />;
};

export default SocialNav;
