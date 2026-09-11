import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const pageItems = [
  { to: '/rooms', label: 'Rooms', icon: 'fa-microphone-lines' },
  { to: '/connect', label: 'Connect', icon: 'fa-user-group' },
  { to: '/messages', label: 'Chat', icon: 'fa-message' },
];

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
      className="fixed right-5 top-1/2 z-[80] hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-teal-700 shadow-lg transition-colors hover:border-teal-300 hover:bg-teal-50 dark:border-white/10 dark:bg-[#0b1220] dark:text-teal-300 dark:hover:bg-[#101a2a] lg:flex"
      aria-label="Open Vaani people"
      title="Connect"
    >
      <i className="fa-solid fa-user-group text-base" aria-hidden="true" />
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
