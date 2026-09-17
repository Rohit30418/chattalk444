import { memo, useCallback, useEffect, useRef } from 'react';

const MiniVideo = memo(({ stream, muted = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !stream) return;

    if (node.srcObject !== stream) node.srcObject = stream;
    node.muted = Boolean(muted);
    node.playsInline = true;
    requestAnimationFrame(() => node.play?.().catch(() => {}));
  }, [stream, muted]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="h-full w-full bg-black object-cover"
    />
  );
});

const MiniCallWindow = memo(({
  participant,
  fallbackUser,
  roomTitle,
  isAudioEnabled,
  isVideoEnabled,
  connectionState,
  onToggleAudio,
  onToggleVideo,
  onReturnToCall,
  onLeave,
}) => {
  const stream = participant?.stream || null;
  const hasVideo = Boolean(participant?.isVideoEnabled && stream);
  const name = participant?.name || fallbackUser?.displayName || 'Vaani call';
  const photo = participant?.photo || fallbackUser?.photoURL || '';

  const stop = useCallback((event, handler) => {
    event.stopPropagation();
    handler?.();
  }, []);

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[120] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-2xl sm:bottom-5 sm:left-auto sm:right-5 sm:w-[320px]">
      <button
        type="button"
        onClick={onReturnToCall}
        className="relative block h-20 w-full overflow-hidden text-left sm:h-44"
        aria-label="Return to full call"
      >
        {hasVideo ? (
          <MiniVideo stream={stream} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#0f172a,#172554,#0f766e)]">
            {photo ? (
              <img
                src={photo}
                alt={name}
                className="h-14 w-14 rounded-full border-2 border-white/20 object-cover shadow-lg sm:h-20 sm:w-20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-lg font-black sm:h-20 sm:w-20 sm:text-2xl">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />

        <div className="absolute left-3 top-2.5 flex items-center gap-2 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-md">
          <span className={`h-2 w-2 rounded-full ${connectionState === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="max-w-[170px] truncate text-[10px] font-black uppercase tracking-[0.12em]">
            {roomTitle || 'Live call'}
          </span>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-black sm:text-sm">{name}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/65">Tap to return to room</p>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
            <i className="fa-solid fa-expand text-[10px]" />
          </span>
        </div>
      </button>

      <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-slate-950/95 px-3 py-2.5">
        <button
          type="button"
          onClick={(event) => stop(event, onToggleAudio)}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isAudioEnabled ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-red-500 text-white hover:bg-red-600'}`}
          aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          <i className={`fa-solid ${isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'} text-[11px]`} />
        </button>

        <button
          type="button"
          onClick={(event) => stop(event, onToggleVideo)}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isVideoEnabled ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-red-500 text-white hover:bg-red-600'}`}
          aria-label={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
          title={isVideoEnabled ? 'Camera off' : 'Camera on'}
        >
          <i className={`fa-solid ${isVideoEnabled ? 'fa-video' : 'fa-video-slash'} text-[11px]`} />
        </button>

        <button
          type="button"
          onClick={(event) => stop(event, onReturnToCall)}
          className="flex h-9 items-center gap-2 rounded-full bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.1em] text-white hover:bg-white/15"
        >
          <i className="fa-solid fa-up-right-and-down-left-from-center text-[10px]" />
          Return
        </button>

        <button
          type="button"
          onClick={(event) => stop(event, onLeave)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
          aria-label="Leave call"
          title="Leave call"
        >
          <i className="fa-solid fa-phone-slash text-[11px]" />
        </button>
      </div>
    </div>
  );
});

export default MiniCallWindow;
