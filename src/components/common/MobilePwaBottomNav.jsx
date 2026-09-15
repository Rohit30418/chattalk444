import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { addRoomModalToggle } from '../../redux/action';
import { useAuth } from '../auth/AppWrapper';
import useUnreadMessages from '../../hooks/useUnreadMessages';
import useMobilePwaMode from '../../hooks/useMobilePwaMode';
import MemberAvatar from './MemberAvatar';

const navItems = [
  { to: '/rooms', label: 'Rooms', icon: 'fa-microphone-lines' },
  { to: '/connect', label: 'Connect', icon: 'fa-user-group' },
  { to: '/messages', label: 'Chat', icon: 'fa-comment-dots' },
];

const MobilePwaBottomNav = () => {
  const enabled = useMobilePwaMode();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const unreadCount = useUnreadMessages();

  if (!enabled) return null;

  const openCreateRoom = () => {
    if (!user?.uid) {
      toast.error('Sign in to create a room');
      return;
    }

    dispatch(addRoomModalToggle(true));
    navigate('/rooms');
  };

  const openProfile = (event) => {
    if (user?.uid) return;
    event.preventDefault();
    toast.info('Sign in to open your profile');
  };

  const profilePath = user?.uid
    ? `/profile/${encodeURIComponent(user.uid)}`
    : '/rooms';

  return (
    <nav
      className="fixed inset-x-3 bottom-[max(.65rem,env(safe-area-inset-bottom))] z-[140] mx-auto max-w-xl rounded-[1.75rem] border border-slate-200/90 bg-white/95 px-2 py-2 shadow-[0_18px_45px_rgba(15,23,42,.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1220]/95"
      aria-label="Vaani app navigation"
    >
      <div className="grid grid-cols-5 items-end gap-1">
        <NavLink
          to={navItems[0].to}
          className={({ isActive }) => `flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-black transition ${isActive ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <i className={`fa-solid ${navItems[0].icon} text-[17px]`} aria-hidden="true" />
          <span>{navItems[0].label}</span>
        </NavLink>

        <NavLink
          to={navItems[1].to}
          className={({ isActive }) => `flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-black transition ${isActive ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <i className={`fa-solid ${navItems[1].icon} text-[17px]`} aria-hidden="true" />
          <span>{navItems[1].label}</span>
        </NavLink>

        <button
          type="button"
          onClick={openCreateRoom}
          className="relative -mt-7 flex min-w-0 flex-col items-center gap-1 text-[10px] font-black text-teal-700 dark:text-teal-300"
          aria-label="Create room"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-teal-700 text-white shadow-[0_10px_26px_rgba(15,118,110,.34)] transition active:scale-95 dark:border-[#0b1220] dark:bg-teal-600">
            <i className="fa-solid fa-plus text-lg" aria-hidden="true" />
          </span>
          <span>Create</span>
        </button>

        <NavLink
          to={navItems[2].to}
          className={({ isActive }) => `flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-black transition ${isActive ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <i className={`fa-solid ${navItems[2].icon} text-[17px]`} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className={`absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-black ${isActive ? 'bg-teal-700 text-white dark:bg-teal-300 dark:text-[#07111f]' : 'bg-red-500 text-white'}`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
              <span>{navItems[2].label}</span>
            </>
          )}
        </NavLink>

        <NavLink
          to={profilePath}
          onClick={openProfile}
          className={({ isActive }) => `flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-black transition ${isActive && user?.uid ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <MemberAvatar
            user={user || { displayName: 'Profile' }}
            src={user?.photoURL}
            name={user?.displayName || 'Profile'}
            className="h-[19px] w-[19px]"
            avatarClassName="border-0 shadow-none"
            roundedClass="rounded-full"
            showDecoration={false}
          />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobilePwaBottomNav;
