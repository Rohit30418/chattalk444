import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AppWrapper';
import useGoogleLogin from '../../hooks/useGoogleLogin';
import MemberAvatar from './MemberAvatar';
import useMobilePwaMode from '../../hooks/useMobilePwaMode';

const getPageMeta = (pathname = '') => {
  if (pathname.startsWith('/messages')) {
    return { title: 'Messages', eyebrow: 'Private conversations' };
  }
  if (pathname.startsWith('/connect')) {
    return { title: 'Connect', eyebrow: 'Find language partners' };
  }
  if (pathname.startsWith('/rooms')) {
    return { title: 'Rooms', eyebrow: 'Practice live together' };
  }

  return { title: 'Vaani', eyebrow: 'Speak together' };
};

const MobilePwaHeader = () => {
  const enabled = useMobilePwaMode();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const loginWithGoogle = useGoogleLogin();

  const meta = useMemo(() => getPageMeta(pathname), [pathname]);

  if (!enabled) return null;

  const openProfile = () => {
    if (!user?.uid) return;
    navigate(`/profile/${encodeURIComponent(user.uid)}`);
  };

  return (
    <header className="sticky top-0 z-[110] border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[max(.65rem,env(safe-area-inset-top))] shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/95">
      <div className="mx-auto flex w-full max-w-xl items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-[0_8px_22px_rgba(15,118,110,.24)] active:scale-95"
          aria-label="Open Vaani rooms"
        >
          <i className="fa-solid fa-comments text-base" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.15em] text-teal-700 dark:text-teal-300">
            {meta.eyebrow}
          </p>
          <h1 className="mt-0.5 truncate text-lg font-black tracking-tight text-slate-950 dark:text-white">
            {meta.title}
          </h1>
        </div>

        {user?.uid ? (
          <button
            type="button"
            onClick={openProfile}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200 active:scale-95 dark:bg-white/[0.06] dark:ring-white/10"
            aria-label="Open your profile"
          >
            <MemberAvatar
              user={user}
              src={user.photoURL}
              name={user.displayName || 'Profile'}
              className="h-10 w-10"
              avatarClassName="border-0 shadow-none"
              roundedClass="rounded-full"
              loading="eager"
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[#07111f]" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={loginWithGoogle}
            className="rounded-xl bg-teal-700 px-3.5 py-2.5 text-xs font-black text-white shadow-sm active:scale-[0.98]"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};

export default MobilePwaHeader;
