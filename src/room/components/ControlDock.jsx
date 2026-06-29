import { memo } from 'react';

const ControlButton = memo(({
  active,
  onClick,
  icon,
  label,
  danger,
  disabled,
  accent,
  badge,
  compact
}) => {
  // Determine base colors based on props
  let bgClass = 'bg-white/8 hover:bg-white/12 text-slate-200 ring-1 ring-white/10';
  
  if (active) {
    if (danger) {
      bgClass = 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30';
    } else if (accent === 'blue') {
      bgClass = 'bg-blue-500 text-white shadow-lg shadow-blue-500/25';
    } else if (accent === 'yellow') {
      bgClass = 'bg-amber-500 text-white shadow-lg shadow-amber-500/25';
    } else if (accent === 'indigo') {
      bgClass = 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25';
    } else {
      bgClass = 'bg-white/20 text-white ring-1 ring-white/30';
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`relative flex flex-col items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none
        ${compact ? 'h-10 min-w-10 px-2 sm:h-12 sm:min-w-12 sm:px-3' : 'h-12 min-w-12 px-3 sm:h-14 sm:min-w-14 sm:px-4'}
        ${bgClass}
      `}
    >
      <i className={`fa-solid ${icon} ${compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'}`} />
      
      {!compact && (
        <span className="mt-1 hidden text-[10px] font-bold leading-none sm:block">
          {label}
        </span>
      )}

      {/* The Red Notification Badge */}
      {badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg ring-2 ring-[#050713]">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
});

export default ControlButton;