import { memo } from 'react';

const StatusBanner = memo(({ isScreenSharing, mediaError, onStopScreenShare, onRetryMedia }) => (
  <>
    {isScreenSharing && (
      <div className="relative z-40 flex h-11 shrink-0 items-center justify-between border-b border-blue-400/20 bg-blue-600/90 px-4 text-white backdrop-blur-xl sm:h-12 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-black sm:text-sm">
          <i className="fa-solid fa-display" />
          You are presenting your screen
        </div>
        <button
          type="button"
          onClick={onStopScreenShare}
          className="rounded-xl bg-white/18 px-3 py-1.5 text-xs font-black transition hover:bg-white/25"
        >
          Stop sharing
        </button>
      </div>
    )}

    {mediaError && (
      <div className="absolute left-1/2 top-20 z-[70] w-[min(92vw,30rem)] -translate-x-1/2 rounded-2xl border border-red-400/20 bg-red-500/90 px-4 py-3 text-sm font-semibold leading-6 text-white shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <i className="fa-solid fa-triangle-exclamation mt-1" />
          <div className="min-w-0 flex-1">{mediaError}</div>
          {onRetryMedia && (
            <button
              type="button"
              onClick={onRetryMedia}
              className="shrink-0 rounded-lg bg-white/18 px-2 py-1 text-xs font-black hover:bg-white/25"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )}
  </>
));

export default StatusBanner;
