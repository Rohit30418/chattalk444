import { memo } from 'react';

const networkMeta = {
  good: {
    label: 'Good',
    textClass: 'text-emerald-500',
    borderClass: 'border-emerald-500/20',
    bgClass: 'bg-emerald-500/10',
    barClass: 'bg-emerald-500',
    bars: 3,
  },
  fair: {
    label: 'Fair',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500/20',
    bgClass: 'bg-amber-500/10',
    barClass: 'bg-amber-500',
    bars: 2,
  },
  poor: {
    label: 'Poor',
    textClass: 'text-red-500',
    borderClass: 'border-red-500/20',
    bgClass: 'bg-red-500/10',
    barClass: 'bg-red-500',
    bars: 1,
  },
  offline: {
    label: 'Offline',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/20',
    bgClass: 'bg-slate-500/10',
    barClass: 'bg-slate-400',
    bars: 0,
  },
};

const NetworkBars = ({ quality, compact = false }) => (
  <span className={`flex items-end gap-[2px] ${compact ? 'h-3' : 'h-4'}`} aria-hidden="true">
    <span className={`${compact ? 'h-1 w-[2px]' : 'h-1.5 w-[3px]'} rounded-sm ${quality.bars >= 1 ? quality.barClass : 'bg-slate-500/30'}`} />
    <span className={`${compact ? 'h-2 w-[2px]' : 'h-2.5 w-[3px]'} rounded-sm ${quality.bars >= 2 ? quality.barClass : 'bg-slate-500/30'}`} />
    <span className={`${compact ? 'h-3 w-[2px]' : 'h-3.5 w-[3px]'} rounded-sm ${quality.bars >= 3 ? quality.barClass : 'bg-slate-500/30'}`} />
  </span>
);

const TopMeetingBar = memo(({
  title,
  roomId,
  timer,
  isHost,
  totalCount,
  user,
  raisedHand,
  connectionState,
  networkQuality = 'good',
  onCopyLink,
  onToggleParticipants,
  onOpenDeviceSettings,
}) => {
  const quality = networkMeta[networkQuality] || networkMeta.good;
  const connected = connectionState === 'connected';

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[var(--color-text)] sm:h-16 sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] sm:flex">
          <i className="fa-solid fa-video text-sm text-[var(--color-secondary)]" />
        </div>

        <div className="min-w-0">
          <h1 className="max-w-[135px] truncate text-sm font-black text-[var(--color-text)] xs:max-w-[165px] sm:max-w-[260px] sm:text-base">
            {title || 'Meeting Room'}
          </h1>

          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-[var(--color-soft)] sm:gap-2 sm:text-[10px] sm:tracking-[0.14em]">
            <span className="hidden sm:inline">#{roomId?.slice(0, 6)}</span>
            {isHost && <span className="hidden text-amber-500 sm:inline">Host</span>}

            <span className={`flex items-center gap-1.5 ${connected ? 'text-emerald-500' : 'text-amber-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {connectionState}
            </span>

            <span className={`${quality.textClass} flex items-center sm:hidden`} title={`Network ${quality.label}`}>
              <NetworkBars quality={quality} compact />
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 sm:flex">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-red-500">Live · {timer}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          className={`hidden h-10 items-center gap-2 rounded-xl border px-2.5 sm:flex ${quality.borderClass} ${quality.bgClass} ${quality.textClass}`}
          title={`Network Quality: ${quality.label}`}
          aria-label={`Network Quality: ${quality.label}`}
        >
          <NetworkBars quality={quality} />
          <span className="hidden text-[10px] font-black uppercase tracking-[0.12em] lg:inline">
            Network {quality.label}
          </span>
        </div>

        {isHost && (
          <button
            type="button"
            onClick={onToggleParticipants}
            className="flex h-9 items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-2.5 text-[11px] font-black text-amber-500 transition-colors hover:bg-amber-500/15 sm:h-10 sm:px-3"
            aria-label="Open host controls"
            title="Host controls"
          >
            <i className="fa-solid fa-crown text-[11px]" />
            <span className="hidden md:inline">Host controls</span>
          </button>
        )}

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
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)] sm:h-10 sm:w-10"
          aria-label="Device settings"
        >
          <i className="fa-solid fa-gear text-[12px]" />
        </button>

        <button
          type="button"
          onClick={onCopyLink}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)] sm:h-10 sm:w-10"
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
  );
});

export default TopMeetingBar;
