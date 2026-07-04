import { memo } from 'react';

const TopMeetingBar = memo(({
  title,
  roomId,
  timer,
  isHost,
  totalCount,
  user,
  raisedHand,
  connectionState,
  onCopyLink,
  onToggleParticipants,
  onOpenDeviceSettings,
}) => (
  <header className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#050713]/75 px-3 text-white backdrop-blur-2xl sm:h-16 sm:px-5">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10">
        <i className="fa-solid fa-video text-sm text-blue-300" />
      </div>

      <div className="min-w-0">
        <h1 className="truncate text-sm font-black text-white sm:max-w-[260px] sm:text-base">
          {title || 'Meeting Room'}
        </h1>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          <span>#{roomId?.slice(0, 6)}</span>
          {isHost && <span className="text-amber-300">Host</span>}
          <span className={connectionState === 'connected' ? 'text-emerald-300' : 'text-amber-300'}>
            {connectionState}
          </span>
        </div>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 sm:flex">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-red-300">Live · {timer}</span>
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onToggleParticipants}
        className="hidden h-10 items-center gap-2 rounded-2xl bg-white/8 px-3 text-xs font-black text-slate-200 ring-1 ring-white/10 transition hover:bg-white/12 sm:flex"
        aria-label="Participants"
      >
        <i className="fa-solid fa-users text-[11px]" />
        {totalCount}
      </button>

      <button
        type="button"
        onClick={onOpenDeviceSettings}
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-slate-200 ring-1 ring-white/10 transition hover:bg-white/12"
        aria-label="Device settings"
      >
        <i className="fa-solid fa-gear text-[12px]" />
      </button>

      <button
        type="button"
        onClick={onCopyLink}
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-slate-200 ring-1 ring-white/10 transition hover:bg-white/12"
        aria-label="Copy meeting link"
      >
        <i className="fa-solid fa-link text-[12px]" />
      </button>

      <div className="hidden items-center gap-2 rounded-full bg-white/8 py-1 pl-1 pr-3 ring-1 ring-white/10 lg:flex">
        <img
          src={user?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
          alt="You"
          className="h-8 w-8 rounded-full border-2 border-blue-400/40 object-cover"
          referrerPolicy="no-referrer"
        />
        <span className="max-w-[120px] truncate text-xs font-bold text-slate-200">
          {user?.displayName || 'You'}
        </span>
        {raisedHand && <span>✋</span>}
      </div>
    </div>
  </header>
));

export default TopMeetingBar;
