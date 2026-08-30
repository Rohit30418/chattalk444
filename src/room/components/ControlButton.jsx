import { memo } from 'react';

const accentMap = {
  blue: {
    active: 'bg-[var(--color-secondary)] text-[var(--color-on-primary)] border-[var(--color-secondary)]',
    idle: 'bg-[var(--color-surface-2)] text-[var(--color-muted)] border-[var(--color-border)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)]',
  },
  yellow: {
    active: 'bg-amber-500 text-white border-amber-500',
    idle: 'bg-[var(--color-surface-2)] text-[var(--color-muted)] border-[var(--color-border)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)]',
  },
  indigo: {
    active: 'bg-indigo-500 text-white border-indigo-500',
    idle: 'bg-[var(--color-surface-2)] text-[var(--color-muted)] border-[var(--color-border)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)]',
  },
  green: {
    active: 'bg-emerald-500 text-white border-emerald-500',
    idle: 'bg-[var(--color-surface-2)] text-[var(--color-muted)] border-[var(--color-border)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)]',
  },
};

const ControlButton = memo(({
  active,
  onClick,
  icon,
  label,
  danger = false,
  accent,
  disabled = false,
  badge = 0,
  compact = false,
}) => {
  let classes = 'relative flex flex-col items-center justify-center rounded-xl border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] active:scale-95 ';

  classes += compact
    ? 'h-11 min-w-11 px-3 '
    : 'h-12 min-w-12 px-3 sm:h-14 sm:min-w-14 sm:px-4 ';

  if (disabled) {
    classes += 'cursor-not-allowed border-[var(--color-border)] bg-[var(--color-bg-soft)] text-[var(--color-soft)] ';
  } else if (danger && !active) {
    classes += 'border-red-500 bg-red-500 text-white ';
  } else if (accent) {
    classes += `${active ? accentMap[accent].active : accentMap[accent].idle} `;
  } else {
    classes += active
      ? 'border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] text-[var(--color-primary-700)] '
      : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)] ';
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={label}
      aria-label={label}
      aria-pressed={Boolean(active)}
      disabled={disabled}
      className={classes}
    >
      {badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-red-500 px-1 text-[9px] font-black text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <i className={`fas ${icon} text-base sm:text-lg`} aria-hidden="true" />
      <span className="mt-1 hidden text-[10px] font-bold leading-none text-current sm:block">{label}</span>
    </button>
  );
});

export default ControlButton;
