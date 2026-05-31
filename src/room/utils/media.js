export const getGridClass = (total) => {
  if (total <= 1) return 'grid-cols-1';
  if (total === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (total <= 4) return 'grid-cols-2';
  if (total <= 9) return 'grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
};

export const safelyPlayVideo = (videoEl) => {
  if (!videoEl) return;
  const playPromise = videoEl.play?.();
  if (playPromise?.catch) playPromise.catch(() => {});
};

export const stopStreamTracks = (stream) => {
  stream?.getTracks?.().forEach((track) => {
    try {
      track.enabled = false;
      track.stop();
    } catch {}
  });
};

export const getVideoSenders = (pc) => {
  if (!pc?.getSenders) return [];

  return pc.getSenders().filter((sender) => {
    if (sender.track?.kind === 'video') return true;

    // Fallback for senders whose current track is temporarily null after replaceTrack.
    const params = sender.getParameters?.();
    const hasEncoding = Array.isArray(params?.encodings) && params.encodings.length > 0;

    return sender.track === null && hasEncoding;
  });
};

export const buildMediaConstraints = ({ audioDeviceId, videoDeviceId } = {}) => ({
  audio: {
    ...(audioDeviceId ? { deviceId: { exact: audioDeviceId } } : {}),
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
  },
  video: {
    ...(videoDeviceId ? { deviceId: { exact: videoDeviceId } } : {}),
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 24, max: 30 },
  },
});
