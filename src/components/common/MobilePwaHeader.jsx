import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AppWrapper';
import useGoogleLogin from '../../hooks/useGoogleLogin';
import MemberAvatar from './MemberAvatar';
import useMobilePwaMode from '../../hooks/useMobilePwaMode';
import {
  requestVaaniNotifications,
  showVaaniNotification,
  syncPushSubscription,
} from '../../services/pwa';

const getPageMeta = (pathname = '') => {
  if (pathname.startsWith('/messages')) {
    return { title: 'Messages', eyebrow: 'Private conversations' };
  }
  if (pathname.startsWith('/connect')) {
    return { title: 'Connect', eyebrow: 'Find language partners' };
  }
  if (pathname.startsWith('/profile') || pathname.startsWith('/MyProfile')) {
    return { title: 'Profile', eyebrow: 'Your Vaani identity' };
  }
  if (pathname.startsWith('/rooms')) {
    return { title: 'Rooms', eyebrow: 'Practice live together' };
  }

  return { title: 'Vaani', eyebrow: 'Practice · Speak · Belong' };
};

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const MobilePwaHeader = () => {
  const enabled = useMobilePwaMode();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const loginWithGoogle = useGoogleLogin();

  const [theme, setTheme] = useState(getInitialTheme);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(() => (
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  ));

  const meta = useMemo(() => getPageMeta(pathname), [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setNotificationOpen(false);
  }, [pathname]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const openProfile = useCallback(() => {
    if (!user?.uid) return;
    navigate(`/profile/${encodeURIComponent(user.uid)}`);
  }, [navigate, user?.uid]);

  const enableNotifications = useCallback(async () => {
    if (notificationBusy) return;

    setNotificationBusy(true);
    try {
      const result = await requestVaaniNotifications();
      const nextPermission = result?.permission
        || (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

      setNotificationPermission(nextPermission);

      if (nextPermission === 'granted') {
        toast.success('Notifications are enabled on this device');
      } else if (nextPermission === 'denied') {
        toast.info('Notifications are blocked in your device settings');
      } else {
        toast.info('Notification permission was not enabled');
      }
    } catch (error) {
      console.error('[PWA Header] Notification setup failed:', error);
      toast.error('Could not enable notifications right now');
    } finally {
      setNotificationBusy(false);
    }
  }, [notificationBusy]);

  const testNotification = useCallback(async () => {
    if (notificationBusy) return;

    setNotificationBusy(true);
    try {
      let permission = typeof Notification === 'undefined'
        ? 'unsupported'
        : Notification.permission;

      if (permission !== 'granted') {
        const result = await requestVaaniNotifications();
        permission = result?.permission || permission;
        setNotificationPermission(permission);
      }

      if (permission !== 'granted') {
        toast.info('Enable notifications first to send a test');
        return;
      }

      await syncPushSubscription().catch(() => null);
      await showVaaniNotification({
        title: 'Vaani notifications are working',
        body: 'You will see messages, connections and room updates here.',
        tag: 'vaani-test-notification',
        url: '/rooms',
      });

      toast.success('Test notification sent');
    } catch (error) {
      console.error('[PWA Header] Test notification failed:', error);
      toast.error('Could not send a test notification');
    } finally {
      setNotificationBusy(false);
    }
  }, [notificationBusy]);

  if (!enabled) return null;

  const notificationsEnabled = notificationPermission === 'granted';

  return (
    <header className="relative z-[120] border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_96%,transparent)] px-3 pb-3 pt-[max(.65rem,env(safe-area-inset-top))] shadow-[0_8px_24px_rgba(7,27,44,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition active:scale-95"
          aria-label="Open Vaani rooms"
        >
          <img src="/vaani-icon.svg" alt="" aria-hidden="true" className="h-11 w-11" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-[var(--color-primary-700)]">
            {meta.eyebrow}
          </p>
          <h1 className="mt-0.5 truncate text-lg font-black tracking-tight text-[var(--color-text)]">
            {meta.title}
          </h1>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] transition active:scale-95"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-sm`} aria-hidden="true" />
        </button>

        {user?.uid && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen((current) => !current)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] transition active:scale-95"
              aria-label="Notification settings"
              aria-expanded={notificationOpen}
            >
              <i className="fa-solid fa-bell text-sm" aria-hidden="true" />
              <span
                className={`absolute right-2 top-2 h-2 w-2 rounded-full border border-[var(--color-surface)] ${notificationsEnabled ? 'bg-emerald-500' : 'bg-amber-400'}`}
                aria-hidden="true"
              />
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-[calc(100%+.65rem)] z-[240] w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[var(--color-text)] shadow-[var(--shadow-soft)]">
                <div className="flex items-start gap-3 rounded-xl bg-[var(--color-surface-2)] p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-700)]">
                    <i className="fa-solid fa-bell text-xs" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black">Notifications</p>
                    <p className="mt-1 text-[11px] font-semibold leading-4 text-[var(--color-soft)]">
                      {notificationsEnabled
                        ? 'This phone can receive Vaani alerts.'
                        : 'Enable alerts for messages, follows and room activity.'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  {!notificationsEnabled && (
                    <button
                      type="button"
                      onClick={enableNotifications}
                      disabled={notificationBusy}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 py-2.5 text-xs font-black text-white disabled:opacity-60"
                    >
                      <i className="fa-solid fa-bell" aria-hidden="true" />
                      Enable notifications
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={testNotification}
                    disabled={notificationBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-xs font-black text-[var(--color-text)] disabled:opacity-60"
                  >
                    <i className={`fa-solid ${notificationBusy ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} aria-hidden="true" />
                    Test notification
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {user?.uid ? (
          <button
            type="button"
            onClick={openProfile}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] p-0.5 ring-1 ring-[var(--color-border)] transition active:scale-95"
            aria-label="Open your profile"
          >
            <MemberAvatar
              user={user}
              src={user.photoURL}
              name={user.displayName || 'Profile'}
              className="h-9 w-9"
              avatarClassName="border-0 shadow-none"
              roundedClass="rounded-full"
              loading="eager"
            />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-surface)] bg-emerald-500" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={loginWithGoogle}
            className="rounded-xl bg-[var(--color-primary)] px-3.5 py-2.5 text-xs font-black text-white shadow-sm active:scale-[0.98]"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};

export default MobilePwaHeader;
