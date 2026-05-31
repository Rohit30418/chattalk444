import { memo } from 'react';

const accentMap = {
  blue: {
    active: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
    idle: 'bg-white/8 text-slate-200 ring-1 ring-white/10 hover:bg-white/12',
  },
  yellow: {
    active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/25',
    idle: 'bg-white/8 text-slate-200 ring-1 ring-white/10 hover:bg-white/12',
  },
  indigo: {
    active: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30',
    idle: 'bg-white/8 text-slate-200 ring-1 ring-white/10 hover:bg-white/12',
  },
  green: {
    active: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25',
    idle: 'bg-white/8 text-slate-200 ring-1 ring-white/10 hover:bg-white/12',
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
  let classes = 'relative flex flex-col items-center justify-center rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:scale-95 ';

  classes += compact
    ? 'h-11 min-w-11 px-3 '
    : 'h-12 min-w-12 px-3 sm:h-14 sm:min-w-14 sm:px-4 ';

  if (disabled) {
    classes += 'cursor-not-allowed bg-white/5 text-slate-500 ring-1 ring-white/5 ';
  } else if (danger && !active) {
    classes += 'bg-red-500 text-white shadow-lg shadow-red-500/25 ';
  } else if (accent) {
    classes += `${active ? accentMap[accent].active : accentMap[accent].idle} `;
  } else {
    classes += active
      ? 'bg-white/15 text-white ring-1 ring-white/15 '
      : 'bg-white/8 text-slate-200 ring-1 ring-white/10 hover:bg-white/12 ';
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
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#050713] bg-red-500 px-1 text-[9px] font-black text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <i className={`fas ${icon} text-base sm:text-lg`} aria-hidden="true" />
      <span className="mt-1 hidden text-[10px] font-bold leading-none text-current sm:block">{label}</span>
    </button>
  );
});

export default ControlButton;
