import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import MemberAvatar from '../common/MemberAvatar';
import {
  PROFILE_BANNERS,
  PROFILE_DECORATIONS,
  normalizeProfileBannerId,
  normalizeProfileDecorationId,
} from '../../utils/memberAssets';
import '../../styles/memberEffects.css';

const ROOM_THEMES = [
  { id: 'cosmic', label: 'Cosmic', hint: 'Blue, violet and gold motion' },
  { id: 'aurora', label: 'Aurora', hint: 'Teal and green flowing light' },
  { id: 'sunset', label: 'Sunset', hint: 'Gold, rose and violet motion' },
];

const normalizeRoomTheme = (value) => (
  ROOM_THEMES.some((theme) => theme.id === value) ? value : 'cosmic'
);

const MemberAppearancePanel = ({ userInfo, authUser, onUpdated }) => {
  const [profileDecorationId, setProfileDecorationId] = useState(
    normalizeProfileDecorationId(userInfo?.profileDecorationId, userInfo?.profileAnimationId)
  );
  const [profileBannerId, setProfileBannerId] = useState(
    normalizeProfileBannerId(userInfo?.profileBannerId)
  );
  const [roomAnimationId, setRoomAnimationId] = useState(
    normalizeRoomTheme(userInfo?.roomAnimationId)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfileDecorationId(
      normalizeProfileDecorationId(userInfo?.profileDecorationId, userInfo?.profileAnimationId)
    );
    setProfileBannerId(normalizeProfileBannerId(userInfo?.profileBannerId));
    setRoomAnimationId(normalizeRoomTheme(userInfo?.roomAnimationId));
  }, [
    userInfo?.profileAnimationId,
    userInfo?.profileBannerId,
    userInfo?.profileDecorationId,
    userInfo?.roomAnimationId,
  ]);

  const previewUser = useMemo(() => ({
    ...(userInfo || {}),
    ...(authUser || {}),
    isMember: true,
    profileDecorationId,
  }), [authUser, profileDecorationId, userInfo]);

  const saveStyle = async () => {
    if (!authUser?.uid || saving) return;

    try {
      setSaving(true);
      const { data } = await api.patch(`/api/users/${encodeURIComponent(authUser.uid)}/member-style`, {
        profileDecorationId,
        profileBannerId,
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
    <section className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm dark:border-amber-400/20 dark:bg-[#101626] sm:p-6">
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
            Your avatar decoration follows you across Vaani. Your banner appears only on your full profile.
          </p>
        </div>

        <MemberAvatar user={previewUser} className="h-16 w-16" loading="eager" />
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Profile decoration
        </p>
        <div className="mt-3 grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {PROFILE_DECORATIONS.map((item) => {
            const selected = profileDecorationId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setProfileDecorationId(item.id)}
                className={`flex min-h-[92px] flex-col items-center justify-center rounded-2xl border p-2 text-center transition-colors ${
                  selected
                    ? 'border-teal-400 bg-teal-50 dark:border-teal-400/40 dark:bg-teal-500/10'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03]'
                }`}
              >
                <MemberAvatar
                  user={{ ...previewUser, profileDecorationId: item.id }}
                  className="h-12 w-12"
                  loading="lazy"
                />
                <span className="mt-1.5 line-clamp-1 text-[10px] font-black text-slate-800 dark:text-slate-100">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Profile banner
        </p>
        <div className="mt-3 grid max-h-[330px] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {PROFILE_BANNERS.map((item) => {
            const selected = profileBannerId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setProfileBannerId(item.id)}
                className={`overflow-hidden rounded-2xl border text-left transition-colors ${
                  selected ? 'border-teal-400 ring-1 ring-teal-300/50' : 'border-slate-200 dark:border-white/10'
                }`}
              >
                <video
                  src={item.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="aspect-[16/7] w-full bg-slate-900 object-cover"
                />
                <span className="block truncate bg-white px-2.5 py-2 text-[10px] font-black text-slate-800 dark:bg-[#0b1220] dark:text-slate-100">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Hosted room animation
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
        <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} text-xs`} aria-hidden="true" />
        {saving ? 'Saving style...' : 'Save member style'}
      </button>
    </section>
  );
};

export default MemberAppearancePanel;
