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
  <header className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] sm:h-16 sm:px-5">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <i className="fa-solid fa-video text-sm text-[var(--color-secondary)]" />
      </div>

      <div className="min-w-0">
        <h1 className="truncate text-sm font-black text-[var(--color-text)] sm:max-w-[260px] sm:text-base">
          {title || 'Meeting Room'}
        </h1>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-soft)]">
          <span>#{roomId?.slice(0, 6)}</span>
          {isHost && <span className="text-amber-500">Host</span>}
          <span className={connectionState === 'connected' ? 'text-emerald-500' : 'text-amber-500'}>
            {connectionState}
          </span>
        </div>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 sm:flex">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-red-500">Live · {timer}</span>
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onToggleParticipants}
        className="hidden h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-xs font-black text-[var(--color-muted)] transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)] sm:flex"
        aria-label="Participants"
      >
        <i className="fa-solid fa-users text-[11px]" />
        {totalCount}
      </button>

      <button
        type="button"
        onClick={onOpenDeviceSettings}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)]"
        aria-label="Device settings"
      >
        <i className="fa-solid fa-gear text-[12px]" />
      </button>

      <button
        type="button"
        onClick={onCopyLink}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)]"
        aria-label="Copy meeting link"
      >
        <i className="fa-solid fa-link text-[12px]" />
      </button>

      <div className="hidden items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1 pl-1 pr-3 lg:flex">
        <img
          src={user?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
          alt="You"
          className="h-8 w-8 rounded-full border-2 border-[var(--color-border-strong)] object-cover"
          referrerPolicy="no-referrer"
        />
        <span className="max-w-[120px] truncate text-xs font-bold text-[var(--color-muted)]">
          {user?.displayName || 'You'}
        </span>
        {raisedHand && <span>✋</span>}
      </div>
    </div>
  </header>
));

export default TopMeetingBar;
