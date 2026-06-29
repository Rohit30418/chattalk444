import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom"; // Using Link instead of NavLink
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";

import { loginToggle } from "../../redux/action";
import useGoogleLogin from "../../hooks/useGoogleLogin";
import { useAuth } from "../auth/AppWrapper";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Rooms", to: "/rooms" },
  { label: "Luna AI", to: "/#ai-bot" },
  { label: "Pricing", to: "/#pricing" },
];

/* Inline SVG Icons */
const SunIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 17A5 5 0 1 0 12 7A5 5 0 0 0 12 17Z" stroke="currentColor" strokeWidth="2" />
    <path d="M12 1.75V4M12 20V22.25M4.75 4.75L6.35 6.35M17.65 17.65L19.25 19.25M1.75 12H4M20 12H22.25M4.75 19.25L6.35 17.65M17.65 6.35L19.25 4.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MoonIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 14.2C19.9 18.05 16.35 20.75 12.25 20.75C7.28 20.75 3.25 16.72 3.25 11.75C3.25 7.65 5.95 4.1 9.8 3C9.45 4.05 9.25 5.15 9.25 6.3C9.25 11 13 14.75 17.7 14.75C18.85 14.75 19.95 14.55 21 14.2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const MenuIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const CloseIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const ChevronDownIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRightIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UserIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 21C20 17.7 16.4 15 12 15C7.6 15 4 17.7 4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 12A4 4 0 1 0 12 4A4 4 0 0 0 12 12Z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const LogoutIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M15 17L20 12L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 12H9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M12 21H6C4.9 21 4 20.1 4 19V5C4 3.9 4.9 3 6 3H12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getCssVar = (name, fallback = "") => {
  if (typeof window === "undefined") return fallback;

  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
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

  const isRoomsPage = location.pathname === "/rooms";
  const containerWidth = isRoomsPage ? "max-w-8xl" : "max-w-7xl";
  const loginStatus = Boolean(user);

  const displayName = useMemo(
    () => user?.displayName || user?.email?.split("@")[0] || "Learner",
    [user]
  );

  const initials = useMemo(() => {
    return (displayName || "Learner").trim().charAt(0).toUpperCase();
  }, [displayName]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Sign out?",
      text: "Your active session will be closed on this device.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, sign out",
      confirmButtonColor: getCssVar("--color-primary"),
      cancelButtonColor: getCssVar("--color-danger"),
      background: getCssVar("--color-surface"),
      color: getCssVar("--color-text"),
    }).then((result) => {
      if (!result.isConfirmed) return;

      logout();
      dispatch(loginToggle(false));
      setIsProfileOpen(false);
    });
  };

  // --- MANUAL ACTIVE STATE LOGIC ---
  const checkIsActive = (itemTo) => {
    const currentPath = location.pathname;
    const currentHash = location.hash;
    const currentFullPath = currentPath + currentHash;

    // 1. If it's an exact match (e.g., "/#ai-bot" matches exactly) -> GLOW
    if (itemTo === currentFullPath) return true;

    // 2. If this nav item has a hash, but didn't match exactly above -> NO GLOW
    if (itemTo.includes("#")) return false;

    // 3. Prevent "Home" (/) from glowing on other pages -> NO GLOW
    if (itemTo === "/") return currentPath === "/" && !currentHash;

    // 4. Handle standard pages (like "/rooms" matching "/rooms/123")
    if (currentPath.startsWith(itemTo)) {
      // CRITICAL FIX: If another tab is an EXACT match for the current URL,
      // we suppress this parent tab so they don't both glow at the same time.
      const isAnotherTabExactlyActive = navItems.some(
        (nav) => nav.to === currentFullPath
      );
      
      if (isAnotherTabExactlyActive) {
        return false; 
      }

      return true;
    }

    return false;
  };

  const getNavClass = (itemTo) => {
    const isActive = checkIsActive(itemTo);
    return `inline-flex items-center rounded-full px-5 py-2.5 text-sm font-black transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]"
        : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
    }`;
  };

  const getMobileNavClass = (itemTo) => {
    const isActive = checkIsActive(itemTo);
    return `flex items-center justify-between rounded-2xl px-4 py-4 text-sm font-black transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]"
        : "bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)]"
    }`;
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-200 ${
          scrolled || isMobileMenuOpen
            ? "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] [box-shadow:var(--shadow-card)]"
            : "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)]"
        }`}
      >
        <div
          className={`relative mx-auto flex h-[68px] ${containerWidth} items-center justify-between gap-3 px-5  lg:h-[82px] `}
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex min-w-0 shrink-0 items-center gap-3"
            aria-label="Vaani home"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7.5 18.5H7C4.8 18.5 3 16.7 3 14.5V8C3 5.8 4.8 4 7 4H17C19.2 4 21 5.8 21 8V14.5C21 16.7 19.2 18.5 17 18.5H12.8L8.8 21.2C8.2 21.6 7.5 21.2 7.5 20.5V18.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 10H16M8 14H13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <span className="min-w-0 leading-tight">
              <span className="block truncate text-2xl font-black tracking-tight text-[var(--color-text)]">
                Vaani
              </span>
              <span className="hidden text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-soft)] sm:block">
                Speak together
              </span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] p-1 [box-shadow:var(--shadow-card)] lg:flex">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className={getNavClass(item.to)}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 sm:h-11 sm:w-11 ${
                theme === "dark"
                  ? "border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] text-[var(--color-warning)] hover:bg-[var(--color-warning-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary-700)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-soft)]"
              }`}
              aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
              title={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {loginStatus ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((value) => !value)}
                  className="flex h-10 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 pr-1 transition-all duration-200 hover:border-[var(--color-border-strong)] sm:h-11 sm:pr-3"
                  aria-expanded={isProfileOpen}
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={displayName}
                      className="h-8 w-8 rounded-xl object-cover sm:h-9 sm:w-9"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-sm font-black text-[var(--color-on-primary)] sm:h-9 sm:w-9">
                      {initials}
                    </span>
                  )}

                  <span className="hidden max-w-[130px] truncate text-sm font-black text-[var(--color-muted)] md:block">
                    {displayName}
                  </span>

                  <ChevronDownIcon className="hidden h-4 w-4 text-[var(--color-soft)] md:block" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text)] [box-shadow:var(--shadow-soft)]">
                    <div className="rounded-2xl bg-[var(--color-surface-2)] p-3">
                      <p className="truncate text-sm font-black text-[var(--color-text)]">
                        {displayName}
                      </p>
                      <p className="truncate text-xs font-semibold text-[var(--color-soft)]">
                        {user?.email || "Signed in"}
                      </p>
                    </div>

                    <Link
                      to={`/profile/${user?.uid}`}
                      className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                    >
                      <UserIcon className="h-4 w-4 text-[var(--color-primary)]" />
                      View profile
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-[var(--color-danger)] transition hover:bg-[var(--color-danger-soft)]"
                    >
                      <LogoutIcon className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-black text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)] transition-all duration-200 hover:-translate-y-0.5"
              >
                Login
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-primary-700)] sm:h-11 sm:w-11 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <CloseIcon className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--color-overlay)] pt-[76px] lg:hidden">
          <div className="mx-3 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 [box-shadow:var(--shadow-soft)]">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={getMobileNavClass(item.to)}
                >
                  <span>{item.label}</span>
                  <ArrowRightIcon className="h-4 w-4 opacity-60" />
                </Link>
              ))}
            </nav>

            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
                  theme === "dark"
                    ? "border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                    : "border-[var(--color-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary-700)]"
                }`}
              >
                {theme === "dark" ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;