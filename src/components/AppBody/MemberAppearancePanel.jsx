import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/memberEffects.css';

const PROFILE_THEMES = [
  { id: 'aurora', label: 'Aurora', hint: 'Teal, cyan and violet glow' },
  { id: 'gold', label: 'Gold', hint: 'Warm gold and rose glow' },
  { id: 'galaxy', label: 'Galaxy', hint: 'Blue, violet and pink glow' },
];

const ROOM_THEMES = [
  { id: 'cosmic', label: 'Cosmic', hint: 'Blue, violet and gold motion' },
  { id: 'aurora', label: 'Aurora', hint: 'Teal and green flowing light' },
  { id: 'sunset', label: 'Sunset', hint: 'Gold, rose and violet motion' },
];

const normalizeProfileTheme = (value) => (
  PROFILE_THEMES.some((theme) => theme.id === value) ? value : 'aurora'
);

const normalizeRoomTheme = (value) => (
  ROOM_THEMES.some((theme) => theme.id === value) ? value : 'cosmic'
);

const MemberAppearancePanel = ({ userInfo, authUser, onUpdated }) => {
  const [profileAnimationId, setProfileAnimationId] = useState(
    normalizeProfileTheme(userInfo?.profileAnimationId)
  );
  const [roomAnimationId, setRoomAnimationId] = useState(
    normalizeRoomTheme(userInfo?.roomAnimationId)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfileAnimationId(normalizeProfileTheme(userInfo?.profileAnimationId));
    setRoomAnimationId(normalizeRoomTheme(userInfo?.roomAnimationId));
  }, [userInfo?.profileAnimationId, userInfo?.roomAnimationId]);

  const photoURL = userInfo?.photoURL || authUser?.photoURL || '';
  const displayName = userInfo?.displayName || authUser?.displayName || 'Vaani Member';
  const initials = useMemo(
    () => displayName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'VM',
    [displayName]
  );

  const saveStyle = async () => {
    if (!authUser?.uid || saving) return;

    try {
      setSaving(true);
      const { data } = await api.patch(`/api/users/${encodeURIComponent(authUser.uid)}/member-style`, {
        profileAnimationId,
        roomAnimationId,
      });

      if (data?.user) onUpdated?.(data.user);
      toast.success('Member appearance updated');
    } catch (error) {
      toast.error(error.userMessage || 'Could not update member appearance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[1.5rem] border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-400/20 dark:bg-[#101626]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
            <span className="vaani-member-star" aria-hidden="true">✦</span>
            Member style
          </div>
          <h2 className="mt-3 text-lg font-black tracking-tight text-slate-950 dark:text-white">
            Customize your appearance
          </h2>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
            Pick one animation for your profile and another for rooms you host.
          </p>
        </div>

        <span className={`vaani-profile-frame vaani-profile-theme-${profileAnimationId} !p-[3px]`}>
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="h-14 w-14 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-xs font-black text-white">
              {initials}
            </span>
          )}
        </span>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Profile animation
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {PROFILE_THEMES.map((theme) => {
            const selected = profileAnimationId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setProfileAnimationId(theme.id)}
                className={`rounded-2xl border p-3 text-left transition-colors ${
                  selected
                    ? 'border-teal-400 bg-teal-50 dark:border-teal-400/40 dark:bg-teal-500/10'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`vaani-profile-frame vaani-profile-theme-${theme.id} !p-[2px]`}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white">V</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-slate-900 dark:text-white">{theme.label}</span>
                    <span className="mt-0.5 block text-[9px] font-semibold leading-4 text-slate-500 dark:text-slate-400">{theme.hint}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Room animation
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {ROOM_THEMES.map((theme) => {
            const selected = roomAnimationId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setRoomAnimationId(theme.id)}
                className={`relative min-h-[86px] overflow-hidden rounded-2xl border p-3 text-left transition-colors ${
                  selected ? 'border-teal-400' : 'border-slate-200 dark:border-white/10'
                } vaani-member-room vaani-room-theme-${theme.id} bg-white/90 dark:bg-[#0f172a]/90`}
              >
                <span className="relative z-[1] block text-xs font-black text-slate-900 dark:text-white">{theme.label}</span>
                <span className="relative z-[1] mt-1 block text-[9px] font-semibold leading-4 text-slate-500 dark:text-slate-300">{theme.hint}</span>
                {selected && (
                  <span className="absolute bottom-2 right-2 z-[1] rounded-full bg-teal-700 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-white">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={saveStyle}
        disabled={saving}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden="true" />
        ) : (
          <i className="fa-solid fa-wand-magic-sparkles text-xs" aria-hidden="true" />
        )}
        {saving ? 'Saving style...' : 'Save member style'}
      </button>
    </section>
  );
};

export default MemberAppearancePanel;
