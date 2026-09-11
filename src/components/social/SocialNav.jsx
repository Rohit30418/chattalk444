import React from 'react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/rooms', label: 'Rooms', icon: 'fa-microphone-lines' },
  { to: '/connect', label: 'Connect', icon: 'fa-user-group' },
  { to: '/messages', label: 'Chat', icon: 'fa-message' },
];

const SocialNav = () => (
  <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#07111f] sm:px-6 lg:px-8">
    <nav className="mx-auto flex w-full max-w-[1600px] items-center gap-2 overflow-x-auto" aria-label="Vaani community navigation">
      {items.map((item) => (
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
);

export default SocialNav;
