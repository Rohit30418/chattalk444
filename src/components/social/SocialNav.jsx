import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const pageItems = [
  { to: '/rooms', label: 'Rooms', icon: 'fa-microphone-lines' },
  { to: '/connect', label: 'Connect', icon: 'fa-user-group' },
  { to: '/messages', label: 'Chat', icon: 'fa-message' },
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

  return (
    <button
      type="button"
      onClick={() => navigate('/connect')}
      className="fixed right-5 top-1/2 z-[80] hidden -translate-y-1/2 items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-3 text-sm font-black text-teal-700 shadow-lg transition-colors hover:border-teal-300 hover:bg-teal-50 dark:border-teal-400/20 dark:bg-[#0b1220] dark:text-teal-300 dark:hover:bg-[#101a2a] lg:flex"
      aria-label="Open Vaani Connect"
      title="Connect with learners"
    >
      <PeopleIcon className="h-5 w-5" />
      <span>Connect</span>
    </button>
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
