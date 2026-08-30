import { memo, useCallback, useEffect, useRef } from 'react';

const qualityClass = {
  good: 'bg-emerald-500/85 text-white',
  fair: 'bg-amber-500/85 text-white',
  poor: 'bg-red-500/85 text-white',
};

const FloatingReaction = memo(({ emoji, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="pointer-events-none absolute bottom-12 left-1/2 z-40 select-none text-4xl" style={{ animation: 'roomFloatUp 3s ease-out forwards' }} aria-hidden="true">
      {emoji}
    </div>
  );
});

const VideoTile = memo(({
  videoRef,
  stream,
  isVideoOn,
  isAudioOn,
  isSpeaking,
  isScreenSharing,
  displayName,
  photoURL,
  isLocal,
  uid,
  peerId,
  reactions,
  raisedHand,
  quality,
  isThumbnail = false,
  isPinned = false,
  isFullscreen = false,
  isHost = false,
  menuOpenFor,
  onToggleMenu,
  onRemoveReaction,
  onForceMute,
  onKick,
  onOpenProfile,
  onFullscreen,
  onPin,
}) => {
  const internalVideoRef = useRef(null);

  const bindVideo = useCallback((node) => {
    if (!node) return;

    if (videoRef) videoRef.current = node;
    internalVideoRef.current = node;

    if (stream && node.srcObject !== stream) {
      node.srcObject = stream;
    }

    node.muted = Boolean(isLocal);
    node.playsInline = true;

    requestAnimationFrame(() => {
      node.play?.().catch(() => {});
    });
  }, [stream, videoRef, isLocal]);

  useEffect(() => {
    const node = internalVideoRef.current;
    if (!node) return;
    bindVideo(node);
  }, [bindVideo, stream, isVideoOn, isThumbnail, isFullscreen, isPinned]);

  useEffect(() => {
    const node = internalVideoRef.current;
    if (!node) return undefined;

    const forcePlay = () => {
      if (stream && isVideoOn) node.play?.().catch(() => {});
    };

    node.addEventListener('loadedmetadata', forcePlay);
    node.addEventListener('pause', forcePlay);

    return () => {
      node.removeEventListener('loadedmetadata', forcePlay);
      node.removeEventListener('pause', forcePlay);
    };
  }, [stream, isVideoOn]);

  const tileClass = isThumbnail
    ? 'group relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] transition-colors duration-150 sm:h-28 sm:w-44'
    : `group relative h-full w-full overflow-hidden rounded-2xl border bg-[var(--color-surface-2)] transition-colors duration-150 ${isSpeaking ? 'border-[var(--color-secondary)] ring-2 ring-[var(--color-secondary)]/30' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`;

  return (
    <div className={tileClass} onDoubleClick={() => onFullscreen?.(isLocal ? 'local' : uid)}>
      <video
        ref={bindVideo}
        autoPlay
        playsInline
        muted={Boolean(isLocal)}
        className={`h-full w-full bg-black object-cover transition-opacity duration-200 ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''} ${isVideoOn && stream ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-surface-2)] transition-opacity duration-200 ${isVideoOn && stream ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        <div className="relative">
          {isSpeaking && (
            <>
              <span className="absolute inset-0 scale-150 animate-ping rounded-full bg-[var(--color-secondary)]/15" aria-hidden="true" />
              <span className="absolute inset-0 scale-125 animate-ping rounded-full bg-[var(--color-primary)]/10" aria-hidden="true" />
            </>
          )}
          <img
            src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid || displayName || 'user'}`}
            className={`relative z-10 rounded-full border-4 border-[var(--color-border)] bg-[var(--color-surface)] object-cover ${isThumbnail ? 'h-12 w-12' : 'h-20 w-20 sm:h-28 sm:w-28'}`}
            alt={displayName || 'Participant'}
            referrerPolicy="no-referrer"
          />
        </div>
        {!isThumbnail && <p className="mt-4 text-sm font-semibold text-[var(--color-soft)]">Camera off</p>}
      </div>

      {isVideoOn && stream && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />}

      {reactions?.map((reaction) => (
        <FloatingReaction key={reaction.id} emoji={reaction.emoji} onDone={() => onRemoveReaction?.(reaction.id)} />
      ))}

      {raisedHand && <div className="absolute right-3 top-3 z-30 rounded-full bg-amber-500 px-2.5 py-1 text-sm font-black text-white">✋</div>}

      {isPinned && (
        <div className="absolute left-3 top-3 z-30 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
          <i className="fa-solid fa-thumbtack mr-1" /> Pinned
        </div>
      )}

      {quality && !isLocal && !isThumbnail && (
        <div className={`absolute left-3 top-3 z-30 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${qualityClass[quality] || qualityClass.good}`}>{quality}</div>
      )}

      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 rounded-full bg-black/55 px-3 py-1.5">
            <p className={`truncate font-black text-white ${isThumbnail ? 'max-w-[70px] text-[10px]' : 'max-w-[150px] text-xs sm:text-sm'}`}>{isLocal ? 'You' : displayName || 'User'}</p>
          </div>
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${isAudioOn ? 'bg-black/50 text-emerald-300' : 'bg-red-500 text-white'}`}>
            <i className={`fas ${isAudioOn ? 'fa-microphone' : 'fa-microphone-slash'} text-[10px]`} />
          </div>
        </div>

        {!isThumbnail && (
          <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <button type="button" onClick={() => onFullscreen?.(isLocal ? 'local' : uid)} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/65" title="Fullscreen">
              <i className="fa-solid fa-expand text-[11px]" />
            </button>
            <button type="button" onClick={() => onPin?.(isLocal ? 'local' : uid)} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/65" title="Pin">
              <i className="fa-solid fa-thumbtack text-[11px]" />
            </button>
          </div>
        )}
      </div>

      {!isLocal && !isThumbnail && (
        <div className="absolute right-3 top-3 z-40">
          <button type="button" onClick={() => onToggleMenu?.(menuOpenFor === peerId ? null : peerId)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/65" aria-label="Participant options">
            <i className="fa-solid fa-ellipsis-vertical text-xs" />
          </button>
          {menuOpenFor === peerId && (
            <>
              <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={() => onToggleMenu?.(null)} />
              <div role="menu" className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 text-[var(--color-text)]">
                <button type="button" onClick={() => { onOpenProfile?.(uid); onToggleMenu?.(null); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]">
                  <i className="fa-solid fa-user w-4 text-[var(--color-soft)]" /> View profile
                </button>
                {isHost && (
                  <>
                    <div className="my-1 h-px bg-[var(--color-border)]" />
                    <button type="button" onClick={() => { onForceMute?.(uid); onToggleMenu?.(null); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-amber-500 hover:bg-amber-500/10">
                      <i className="fa-solid fa-microphone-slash w-4" /> Force mute
                    </button>
                    <button type="button" onClick={() => { onKick?.(uid); onToggleMenu?.(null); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-red-500 hover:bg-red-500/10">
                      <i className="fa-solid fa-user-xmark w-4" /> Kick user
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default VideoTile;
