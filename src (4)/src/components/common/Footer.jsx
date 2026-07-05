import React from 'react';
import { Link } from 'react-router-dom';

const footerGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Browse rooms', to: '/rooms' },
      { label: 'AI Coach', to: '/ai-bot' },
      { label: 'Create room', to: '/rooms' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Language practice', to: '/rooms' },
      { label: 'Live conversations', to: '/rooms' },
      { label: 'Profile', to: '/profile/me' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Privacy', to: '#' },
      { label: 'Terms', to: '#' },
      { label: 'Support', to: '#' },
    ],
  },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/80 px-4 py-12 text-slate-600 backdrop-blur-xl dark:border-white/10 dark:bg-[#050713]/90 dark:text-slate-400 sm:py-16">
      <div className="container-app">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr] lg:gap-16">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
                <i className="fa-solid fa-comments text-lg" />
              </span>
              <span>
                <span className="block text-2xl font-black tracking-tight text-slate-950 dark:text-white">Vaani</span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Speak together</span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
              A clean, real-time voice-room experience for learners who want live practice, better pronunciation, and a safer community.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {['twitter', 'github', 'linkedin', 'instagram'].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white"
                  aria-label={icon}
                >
                  <i className={`fa-brands fa-${icon}`} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-950 dark:text-white">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="text-sm font-semibold text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-slate-200 pt-6 text-sm font-semibold dark:border-white/10 md:flex-row md:items-center">
          <p>© {currentYear} Vaani Inc. All rights reserved.</p>

          <a
            href="https://rohitpant.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
          >
            Designed & Developed by Rohit Pant
            <i className="fa-solid fa-heart text-red-500" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
