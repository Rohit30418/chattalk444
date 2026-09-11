import React from 'react';
import { NavLink } from 'react-router-dom';

const Icon = ({ type, className = '' }) => {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true,
  };

  if (type === 'home') {
    return (
      <svg {...common}>
        <path d="M3.5 10.5 12 3.5l8.5 7v9a1 1 0 0 1-1 1h-5.2v-6.3H9.7v6.3H4.5a1 1 0 0 1-1-1v-9Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'rooms') {
    return (
      <svg {...common}>
        <circle cx="12" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="5.5" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="18.5" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M7 20v-2.2c0-2.5 2.2-4.4 5-4.4s5 1.9 5 4.4V20M2.7 19v-1.4c0-1.7 1.3-3 3.2-3.2M21.3 19v-1.4c0-1.7-1.3-3-3.2-3.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'connect') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        <circle cx="16.7" cy="9" r="2.4" fill="currentColor" opacity="0.8" />
        <path d="M2.8 19.7c0-3.3 2.2-5.5 5.2-5.5s5.2 2.2 5.2 5.5c0 .5-.4.8-.8.8H3.6c-.5 0-.8-.3-.8-.8Z" fill="currentColor" />
        <path d="M13.7 19.8c.2-2.7 1.9-4.5 4.3-4.5 2.2 0 3.7 1.5 4 3.8.1.7-.4 1.2-1.1 1.2h-7.2v-.5Z" fill="currentColor" opacity="0.8" />
        <circle cx="18.8" cy="5.1" r="3.2" fill="currentColor" />
        <path d="M18.8 3.5v3.2M17.2 5.1h3.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'chat') {
    return (
      <svg {...common}>
        <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.7 3.2c-.5.3-1.3 0-1.3-.7V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M8 10h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="m12 2 1.2 4.3L17 8l-3.8 1.7L12 14l-1.2-4.3L7 8l3.8-1.7L12 2ZM18.2 13.5l.8 2.7 2.5.8-2.5.8-.8 2.7-.8-2.7-2.5-.8 2.5-.8.8-2.7ZM5.2 13l.7 2.2 2.1.7-2.1.7-.7 2.2-.7-2.2-2.1-.7 2.1-.7.7-2.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
};

const items = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/rooms', label: 'Rooms', icon: 'rooms' },
  { to: '/connect', label: 'Connect', icon: 'connect' },
  { to: '/messages', label: 'Chat', icon: 'chat' },
  { to: '/aiBot', label: 'Luna AI', icon: 'luna' },
];

const MobileBottomNav = () => (
  <>
    <style>{`[aria-label="Rooms mobile navigation"]{display:none!important;}`}</style>
    <nav
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-slate-200 bg-white px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#07111f] lg:hidden"
      aria-label="Vaani mobile navigation"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            aria-label={item.label === 'Connect' ? 'Open Connect people page' : item.label}
            className={({ isActive }) => `flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-black transition-colors ${isActive ? 'bg-teal-700 text-white' : item.icon === 'connect' ? 'text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white'}`}
          >
            <Icon type={item.icon} className={item.icon === 'connect' ? 'h-6 w-6' : 'h-5 w-5'} />
            <span className="w-full truncate text-center">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  </>
);

export default MobileBottomNav;
