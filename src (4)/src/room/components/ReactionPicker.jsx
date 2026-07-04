import { memo } from 'react';
import { REACTION_EMOJIS } from '../constants';

const ReactionPicker = memo(({ show, onReact, pickerRef }) => {
  if (!show) return null;

  return (
    <div
      ref={pickerRef}
      className="fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 gap-2 rounded-[1.4rem] border border-white/10 bg-[#050713]/90 px-4 py-3 shadow-2xl backdrop-blur-2xl sm:bottom-28"
      style={{ animation: 'roomFadeInUp 0.18s ease-out' }}
    >
      {REACTION_EMOJIS.map((reaction) => (
        <button
          key={reaction.key}
          type="button"
          onClick={() => onReact(reaction.key)}
          title={reaction.label}
          className="flex h-10 w-10 items-center justify-center rounded-full text-2xl transition hover:scale-125 hover:bg-white/8 active:scale-90"
        >
          {reaction.key}
        </button>
      ))}
    </div>
  );
});

export default ReactionPicker;
