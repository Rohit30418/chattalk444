import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';

import { loginToggle } from '../../redux/action';
import useGoogleLogin from '../../hooks/useGoogleLogin';
import SpinWheelModal from './SpinWheelModal';
import { useAuth } from '../auth/AppWrapper';

const navItems = [
  { label: 'Home', to: '/', icon: 'fa-house' },
  { label: 'Rooms', to: '/rooms', icon: 'fa-comments' },
  { label: 'Watch Demo', to: '/ai-bot', icon: 'fa-robot' },
];

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const Header = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const signInWithGoogle = useGoogleLogin();
  const { user, logout } = useAuth();

  const [theme, setTheme] = useState(getInitialTheme);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const loginStatus = Boolean(user);

  const displayName = useMemo(() => (
    user?.displayName || user?.email?.split('@')[0] || 'Learner'
  ), [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Sign out?',
      text: 'Your active session will be closed on this device.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, sign out',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      background: theme === 'dark' ? '#0f172a' : '#ffffff',
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
    }).then((result) => {
      if (!result.isConfirmed) return;
      logout();
      dispatch(loginToggle(false));
      setIsProfileOpen(false);
    });
  };

  const navClass = ({ isActive }) => `inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition-all ${
    isActive
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 dark:bg-white dark:text-slate-950'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
  }`;

  const mobileNavClass = ({ isActive }) => `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition-all ${
    isActive
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
  }`;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        {showBanner && (
          <div className="border-b border-white/10 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white">
            <div className="container-app flex min-h-[40px] items-center justify-between gap-3 py-2 text-xs font-bold sm:text-sm">
              <button
                type="button"
                onClick={() => setShowOffer(true)}
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <span className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 sm:flex">
                  <i className="fa-solid fa-bolt text-[10px]" />
                </span>
                <span className="truncate">Launch offer: unlock AI practice rooms and premium voice features</span>
                <span className="hidden rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 sm:inline-flex">
                  View
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                aria-label="Close announcement"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            </div>
          </div>
        )}

        <header
          className={`transition-all duration-300 ${
            scrolled || isMobileMenuOpen
              ? 'border-b border-slate-200/80 bg-white/88 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#050713]/88'
              : 'bg-white/60 backdrop-blur-xl dark:bg-[#050713]/55'
          }`}
        >
          <div className="container-app flex h-[72px] items-center justify-between gap-4">
            <Link to="/" className="group flex items-center gap-3" aria-label="Vaani home">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
                <i className="fa-solid fa-comments text-lg" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#050713]" />
              </span>
              <span className="leading-tight">
                <span className="block text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">Vaani</span>
                <span className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 sm:block">Speak together</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 shadow-sm dark:border-white/10 dark:bg-white/5 lg:flex">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass}>
                  <i className={`fa-solid ${item.icon} text-[12px]`} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-white"
                aria-label="Toggle theme"
              >
                <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-sm`} />
              </button>

              {loginStatus ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((value) => !value)}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pr-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5"
                    aria-expanded={isProfileOpen}
                  >
                    <img
                      src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'user'}`}
                      alt={displayName}
                      className="h-8 w-8 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="hidden max-w-[120px] truncate text-sm font-black text-slate-700 dark:text-slate-200 md:block">
                      {displayName}
                    </span>
                    <i className="fa-solid fa-chevron-down text-[10px] text-slate-400" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#0f172a] dark:text-white">
                      <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                        <p className="truncate text-sm font-black">{displayName}</p>
                        <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{user?.email || 'Signed in'}</p>
                      </div>

                      <Link
                        to={`/profile/${user?.uid}`}
                        className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                      >
                        <i className="fa-solid fa-user text-indigo-500" />
                        View profile
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <i className="fa-solid fa-right-from-bracket" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="hidden rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-50 sm:inline-flex"
                >
                  Sign in
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition dark:border-white/10 dark:bg-white/5 dark:text-white lg:hidden"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-sm`} />
              </button>
            </div>
          </div>
        </header>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/45 pt-[112px] backdrop-blur-sm sm:pt-[112px] lg:hidden">
          <div className="mx-3 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#0f172a]">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={mobileNavClass}>
                  <span className="flex items-center gap-3">
                    <i className={`fa-solid ${item.icon} w-5 text-center`} />
                    {item.label}
                  </span>
                  <i className="fa-solid fa-arrow-right text-xs opacity-50" />
                </NavLink>
              ))}
            </nav>

            {!loginStatus && (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950"
              >
                <i className="fa-brands fa-google" />
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      )}

      {showOffer && <SpinWheelModal onClose={() => setShowOffer(false)} />}
    </>
  );
};

export default Header;
