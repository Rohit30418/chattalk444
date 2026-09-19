import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";

import { loginToggle } from "../../redux/action";
import useGoogleLogin from "../../hooks/useGoogleLogin";
import { useAuth } from "../auth/AppWrapper";
import api from "../../services/api";
import {
  requestVaaniNotifications,
  syncPushSubscription,
} from "../../services/pwa";
import "../../styles/memberEffects.css";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Rooms", to: "/rooms" },
  { label: "Luna AI", to: "/aiBot" },
  { label: "Pricing", to: "/#pricing" },
];

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

const normalizeProfileTheme = (value) => {
  const theme = typeof value === "string" ? value.trim().toLowerCase() : "aurora";
  return ["aurora", "gold", "galaxy"].includes(theme) ? theme : "aurora";
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
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  });

  const isRoomsPage = location.pathname === "/rooms";
  const containerWidth = isRoomsPage ? "max-w-8xl" : "max-w-7xl";
  const loginStatus = Boolean(user);
  const memberProfileTheme = normalizeProfileTheme(user?.profileAnimationId);

  const displayName = useMemo(
    () => user?.displayName || user?.email?.split("@")[0] || "Learner",
    [user]
  );

  const initials = useMemo(() => {
    return (displayName || "Learner").trim().charAt(0).toUpperCase();
  }, [displayName]);

  const notificationStatus = useMemo(() => {
    if (notificationPermission === "granted") {
      return {
        label: "Allowed",
        text: "Browser permission is allowed. Vaani verifies the push device before delivery.",
        badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
        dotClass: "bg-emerald-500",
      };
    }

    if (notificationPermission === "denied") {
      return {
        label: "Blocked",
        text: "Enable notifications from your browser site settings.",
        badgeClass: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
        dotClass: "bg-red-500",
      };
    }

    if (notificationPermission === "unsupported") {
      return {
        label: "Unavailable",
        text: "Notifications are not supported in this browser.",
        badgeClass: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
        dotClass: "bg-slate-400",
      };
    }

    return {
      label: "Not enabled",
      text: "Allow notifications to get messages and connection alerts.",
      badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      dotClass: "bg-amber-500",
    };
  }, [notificationPermission]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 6);
          ticking = false;
        });
        ticking = true;
      }
    };

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isProfileOpen || typeof Notification === "undefined") return;
    setNotificationPermission(Notification.permission);
  }, [isProfileOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const handleLogout = useCallback(() => {
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
  }, [dispatch, logout]);

  const allowNotifications = useCallback(async () => {
    if (notificationBusy) return;

    setNotificationBusy(true);
    try {
      const result = await requestVaaniNotifications();
      setNotificationPermission(result.permission);

      if (result.permission === "granted" && result.subscribed) {
        await Swal.fire({
          icon: "success",
          title: "Notifications allowed",
          text: "This device is now registered for Vaani notifications.",
          confirmButtonColor: getCssVar("--color-primary"),
          background: getCssVar("--color-surface"),
          color: getCssVar("--color-text"),
        });
        return;
      }

      if (result.permission === "denied") {
        await Swal.fire({
          icon: "info",
          title: "Notifications are blocked",
          text: "Open your browser site settings and allow notifications for Vaani.",
          confirmButtonColor: getCssVar("--color-primary"),
          background: getCssVar("--color-surface"),
          color: getCssVar("--color-text"),
        });
        return;
      }

      await Swal.fire({
        icon: "error",
        title: "Could not register this device",
        text:
          result?.message ||
          (result?.reason === "server-not-configured"
            ? "Push notifications are not configured on the Vaani server yet."
            : "The push connection could not be synced. Please try again in a moment."),
        confirmButtonColor: getCssVar("--color-primary"),
        background: getCssVar("--color-surface"),
        color: getCssVar("--color-text"),
      });
    } catch (error) {
      console.error("[PWA] Notification permission failed:", error);
      await Swal.fire({
        icon: "error",
        title: "Notification setup failed",
        text: "Please try again in a moment.",
        confirmButtonColor: getCssVar("--color-primary"),
        background: getCssVar("--color-surface"),
        color: getCssVar("--color-text"),
      });
    } finally {
      setNotificationBusy(false);
    }
  }, [notificationBusy]);

  const sendTestNotification = useCallback(async () => {
    if (notificationBusy) return;

    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      setNotificationPermission(
        typeof Notification === "undefined" ? "unsupported" : Notification.permission
      );
      await allowNotifications();
      return;
    }

    setNotificationBusy(true);
    try {
      const syncResult = await syncPushSubscription();
      if (!syncResult?.subscribed) {
        throw new Error(
          syncResult?.message ||
          (syncResult?.reason === "server-not-configured"
            ? "Push notifications are not configured on the Vaani server yet."
            : "This device could not be registered for push notifications yet.")
        );
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager?.getSubscription?.();
      const currentEndpoint = subscription?.endpoint || "";

      let sent = false;

      if (currentEndpoint) {
        const { data } = await api.get("/api/social/push/devices", {
          params: { currentEndpoint },
        });
        const currentDevice = data?.devices?.find((device) => device.isCurrent);

        if (currentDevice?.id) {
          const response = await api.post(
            `/api/social/push/devices/${encodeURIComponent(currentDevice.id)}/test`
          );
          sent = Number(response?.data?.sent || 0) > 0;
        }
      }

      if (!sent) {
        const response = await api.post("/api/social/push/test");
        sent = Number(response?.data?.sent || 0) > 0;
      }

      if (!sent) {
        throw new Error("The push service did not confirm delivery.");
      }

      await Swal.fire({
        icon: "success",
        title: "Test notification sent",
        text: "Check this device's notification tray.",
        confirmButtonColor: getCssVar("--color-primary"),
        background: getCssVar("--color-surface"),
        color: getCssVar("--color-text"),
      });
    } catch (error) {
      console.error("[PWA] Test notification failed:", error);
      await Swal.fire({
        icon: "error",
        title: "Test notification failed",
        text: error?.userMessage || error?.message || "Please try again in a moment.",
        confirmButtonColor: getCssVar("--color-primary"),
        background: getCssVar("--color-surface"),
        color: getCssVar("--color-text"),
      });
    } finally {
      setNotificationBusy(false);
    }
  }, [allowNotifications, notificationBusy]);

  const checkIsActive = useCallback((itemTo) => {
    const currentPath = location.pathname;
    const currentHash = location.hash;
    const currentFullPath = currentPath + currentHash;

    if (currentPath === "/ai-bot" || currentPath === "/aiBot") {
      return itemTo === "/aiBot" || itemTo === "/ai-bot";
    }

    if (itemTo === currentFullPath) return true;
    if (itemTo.includes("#")) return false;
    if (itemTo === "/") return currentPath === "/" && !currentHash;

    if (currentPath.startsWith(itemTo)) {
      const isAnotherTabExactlyActive = navItems.some(
        (nav) => nav.to === currentFullPath
      );

      if (isAnotherTabExactlyActive) {
        return false;
      }
      return true;
    }

    return false;
  }, [location.pathname, location.hash]);

  const getNavClass = useCallback((itemTo) => {
    const isActive = checkIsActive(itemTo);
    return `inline-flex items-center rounded-full px-5 py-2.5 text-sm font-black transition-colors duration-200 ${
      isActive
        ? "bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]"
        : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
    }`;
  }, [checkIsActive]);

  const getMobileNavClass = useCallback((itemTo) => {
    const isActive = checkIsActive(itemTo);
    return `flex items-center justify-between rounded-2xl px-4 py-4 text-sm font-black transition-colors duration-200 ${
      isActive
        ? "bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]"
        : "bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)]"
    }`;
  }, [checkIsActive]);

  const profileVisual = user?.photoURL ? (
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
  );

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-200 ${
          scrolled || isMobileMenuOpen
            ? "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] [box-shadow:var(--shadow-card)]"
            : "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)]"
        }`}
      >
        <div
          className={`relative mx-auto flex h-[68px] ${containerWidth} items-center justify-between gap-3 px-5 lg:h-[82px]`}
        >
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

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] p-1 [box-shadow:var(--shadow-card)] lg:flex">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className={getNavClass(item.to)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-200 sm:h-11 sm:w-11 ${
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
                  className="flex h-10 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 pr-1 transition-colors duration-200 hover:border-[var(--color-border-strong)] sm:h-11 sm:pr-3"
                  aria-expanded={isProfileOpen}
                >
                  {user?.isMember ? (
                    <span className={`vaani-profile-frame vaani-profile-theme-${memberProfileTheme} !rounded-2xl !p-[2px]`}>
                      {profileVisual}
                    </span>
                  ) : profileVisual}

                  <span className="hidden max-w-[130px] truncate text-sm font-black text-[var(--color-muted)] md:block">
                    {displayName}
                  </span>

                  <ChevronDownIcon className="hidden h-4 w-4 text-[var(--color-soft)] md:block" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text)] [box-shadow:var(--shadow-soft)]">
                    <div className="rounded-2xl bg-[var(--color-surface-2)] p-3">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-black text-[var(--color-text)]">
                          {displayName}
                        </p>
                        {user?.isMember && (
                          <span className="vaani-member-badge inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
                            <span className="vaani-member-star" aria-hidden="true">✦</span>
                            Member
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs font-semibold text-[var(--color-soft)]">
                        {user?.email || "Signed in"}
                      </p>
                    </div>

                    <Link
                      to={`/profile/${user?.uid}`}
                      className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                    >
                      <UserIcon className="h-4 w-4 text-[var(--color-primary)]" />
                      View profile
                    </Link>

                    <div className="mx-1 my-1 border-t border-[var(--color-border)]" />

                    <div className="rounded-2xl px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-700)]">
                          <i className="fa-solid fa-bell text-xs" aria-hidden="true" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-[var(--color-muted)]">
                              Notifications
                            </p>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-black ${notificationStatus.badgeClass}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${notificationStatus.dotClass}`} />
                              {notificationStatus.label}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] font-semibold leading-4 text-[var(--color-soft)]">
                            {notificationStatus.text}
                          </p>
                        </div>
                      </div>

                      {notificationPermission === "granted" ? (
                        <button
                          type="button"
                          onClick={sendTestNotification}
                          disabled={notificationBusy}
                          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] font-black text-[var(--color-primary-700)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <i className={`fa-solid ${notificationBusy ? "fa-spinner fa-spin" : "fa-paper-plane"} text-[10px]`} aria-hidden="true" />
                          {notificationBusy ? "Sending test..." : "Send test notification"}
                        </button>
                      ) : notificationPermission === "default" ? (
                        <button
                          type="button"
                          onClick={allowNotifications}
                          disabled={notificationBusy}
                          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-[11px] font-black text-[var(--color-on-primary)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <i className={`fa-solid ${notificationBusy ? "fa-spinner fa-spin" : "fa-bell"} text-[10px]`} aria-hidden="true" />
                          {notificationBusy ? "Enabling..." : "Allow notifications"}
                        </button>
                      ) : null}
                    </div>

                    <div className="mx-1 my-1 border-t border-[var(--color-border)]" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)]"
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
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-black text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Login
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-primary-700)] sm:h-11 sm:w-11 lg:hidden"
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
                className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition-colors ${
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
