import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import VideoTile from './VideoTile';
import { getGridClass } from '../utils/media';

const ScreenStreamVideo = memo(({ stream, muted = false }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !stream) return;

    if (el.srcObject !== stream) el.srcObject = stream;
    el.muted = Boolean(muted);
    el.playsInline = true;

    requestAnimationFrame(() => el.play?.().catch(() => {}));
  }, [stream, muted]);

  if (!stream) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_42%),linear-gradient(135deg,#0f172a,#020617)] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20">
          <i className="fa-solid fa-display text-2xl" />
        </div>
        <div>
          <p className="text-sm font-black text-white">Waiting for presentation stream…</p>
          <p className="mt-1 text-xs text-slate-500">The screen share will appear here in a moment.</p>
        </div>
      </div>
    );
  }

  return <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full bg-black object-contain" />;
});

const ScreenShareCard = memo(({ activeScreenShare, stream }) => {
  if (!activeScreenShare) return null;

  const isLocal = Boolean(activeScreenShare.isLocal);
  const name = isLocal ? 'You' : (activeScreenShare.name || 'Someone');

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.65rem] bg-black shadow-2xl ring-1 ring-white/10">
      <ScreenStreamVideo stream={stream} muted={isLocal} />
      <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-blue-500/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg backdrop-blur-md">
        <i className="fa-solid fa-display" />
        {isLocal ? 'You are presenting' : `${name} is presenting`}
      </div>
    </div>
  );
});

const VideoStage = memo(({
  localTile,
  participants,
  totalCount,
  activeScreenShare,
  localScreenStream,
  remoteScreenStreams,
  activeSpeakerUid,
  fullscreenId,
  pinnedId,
  commonTileProps,
  onExitFullscreen,
}) => {
  const remoteScreenStream = useMemo(() => {
    if (!activeScreenShare || activeScreenShare.isLocal) return null;
    return remoteScreenStreams?.get?.(activeScreenShare.uid)?.stream || null;
  }, [activeScreenShare, remoteScreenStreams]);

  const activeScreenStream = activeScreenShare?.isLocal ? localScreenStream : remoteScreenStream;

  const getRemoteTile = useCallback((participant, extra = {}) => (
    <VideoTile
      key={participant.uid}
      stream={participant.stream}
      isVideoOn={participant.isVideoEnabled}
      isAudioOn={participant.isAudioEnabled}
      isSpeaking={participant.isSpeaking}
      displayName={participant.name}
      photoURL={participant.photo}
      isLocal={false}
      uid={participant.uid}
      peerId={participant.peerId}
      reactions={participant.reactions}
      raisedHand={participant.raisedHand}
      quality={participant.quality}
      isPinned={pinnedId === participant.uid}
      isFullscreen={fullscreenId === participant.uid}
      {...commonTileProps}
      {...extra}
    />
  ), [commonTileProps, pinnedId, fullscreenId]);

  const local = <VideoTile {...localTile} isPinned={pinnedId === 'local'} isFullscreen={fullscreenId === 'local'} {...commonTileProps} />;
  const localThumb = <VideoTile {...localTile} isThumbnail {...commonTileProps} />;

  if (fullscreenId) {
    const isLocalFullscreen = fullscreenId === 'local';
    const fullscreenParticipant = isLocalFullscreen ? null : participants.find((participant) => participant.uid === fullscreenId);

    return (
      <div className="flex h-full w-full flex-col gap-3 p-3">
        <div className="relative min-h-0 flex-1">
          {isLocalFullscreen ? local : fullscreenParticipant ? getRemoteTile(fullscreenParticipant) : local}
          <button type="button" onClick={onExitFullscreen} className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md ring-1 ring-white/10 hover:bg-black/70" aria-label="Exit fullscreen">
            <i className="fa-solid fa-compress text-sm" />
          </button>
        </div>
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {!isLocalFullscreen && localThumb}
          {participants.filter((participant) => participant.uid !== fullscreenId).map((participant) => getRemoteTile(participant, { isThumbnail: true }))}
        </div>
      </div>
    );
  }

  if (activeScreenShare) {
    return (
      <div className="flex h-full w-full flex-col gap-3 p-2 sm:p-3">
        <ScreenShareCard activeScreenShare={activeScreenShare} stream={activeScreenStream} />
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {localThumb}
          {participants.map((participant) => getRemoteTile(participant, { isThumbnail: true }))}
        </div>
      </div>
    );
  }

  const pinnedParticipant = pinnedId && pinnedId !== 'local' ? participants.find((participant) => participant.uid === pinnedId) : null;
  const activeSpeaker = activeSpeakerUid ? participants.find((participant) => participant.uid === activeSpeakerUid) : null;
  const heroParticipant = pinnedId === 'local' ? 'local' : pinnedParticipant || activeSpeaker;

  if (heroParticipant && totalCount > 2) {
    const heroIsLocal = heroParticipant === 'local';

    return (
      <div className="flex h-full w-full flex-col gap-3 p-2 sm:p-3">
        <div className="min-h-0 flex-1">{heroIsLocal ? local : getRemoteTile(heroParticipant)}</div>
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {!heroIsLocal && localThumb}
          {participants.filter((participant) => participant.uid !== heroParticipant.uid).map((participant) => getRemoteTile(participant, { isThumbnail: true }))}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid h-full w-full content-center gap-2 p-2 sm:gap-3 sm:p-3 ${getGridClass(totalCount)}`} style={{ gridAutoRows: totalCount <= 1 ? '100%' : 'minmax(0,1fr)' }}>
      {local}
      {participants.map((participant) => getRemoteTile(participant))}
    </div>
  );
});

export default VideoStage;
