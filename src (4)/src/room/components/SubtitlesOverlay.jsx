import { memo } from 'react';

const SubtitlesOverlay = memo(({ lines }) => {
  if (!lines?.length) return null;

  return (
    <div className="pointer-events-none absolute bottom-24 left-1/2 z-40 flex w-[92%] max-w-2xl -translate-x-1/2 flex-col items-center gap-1.5 sm:bottom-28">
      {lines.map((line) => (
        <div
          key={line.key}
          className="rounded-2xl bg-black/70 px-4 py-2 text-center shadow-xl backdrop-blur-md ring-1 ring-white/10"
        >
          <span className="mr-2 text-xs font-black text-blue-300">{line.name}:</span>
          <span className="text-sm font-semibold text-white">{line.text}</span>
        </div>
      ))}
    </div>
  );
});

export default SubtitlesOverlay;
