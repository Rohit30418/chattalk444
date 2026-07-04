/**
 * ScreenBeforeJoin.jsx — Production pre-join lobby
 *
 * Fixes:
 * - Full light mode + dark mode support
 * - Cleaner professional UI
 * - Better mobile spacing and bottom-safe layout
 * - Improved video preview card
 * - Cleaner device dropdowns
 * - Softer status chips
 * - Keeps existing media/device/join logic
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import useAddMembers from '../hooks/useAddMembers';
import { tooglePrescreenRoom, setMediaPrefs } from '../redux/action';
import { useAuth } from '../components/auth/AppWrapper';

const PERM = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
};

const DEVICE_MENU = {
  NONE: null,
  MIC: 'mic',
  CAM: 'cam',
};

const AUDIO_METER_INTERVAL_MS = 90;

const getErrorMessage = (err) => {
  const map = {
    NotAllowedError: 'Camera or microphone permission was denied. Please allow access in your browser settings.',
    PermissionDeniedError: 'Camera or microphone permission was denied. Please allow access in your browser settings.',
    NotFoundError: 'No camera or microphone was found. Please check your device connection.',
    DevicesNotFoundError: 'No camera or microphone was found. Please check your device connection.',
    NotReadableError: 'Your camera or microphone is already in use by another app. Close it and try again.',
    OverconstrainedError: 'The selected device is not available. Please choose another device.',
    SecurityError: 'Media devices are blocked because this page is not running securely.',
  };

  return map[err?.name] || err?.message || 'Could not access your media devices.';
};

const buildConstraints = (audioId, videoId, includeAudio = true, includeVideo = true) => ({
  audio: includeAudio
    ? {
      ...(audioId ? { deviceId: { exact: audioId } } : {}),
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
    }
    : false,
  video: includeVideo
    ? {
      ...(videoId ? { deviceId: { exact: videoId } } : {}),
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 24, max: 30 },
    }
    : false,
});

const StatusPill = ({ active, icon, label }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black shadow-sm backdrop-blur-md ${
      active
        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300'
        : 'border-rose-300 bg-rose-50 text-rose-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300'
    }`}
  >
    <i className={`fa-solid ${icon} text-[9px]`} />
    {label}
  </span>
);

const DeviceDropdown = ({
  title,
  devices,
  selectedId,
  onSelect,
  emptyText,
}) => (
  <div className="absolute bottom-full left-0 z-[80] mb-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111827]">
    <div className="border-b border-slate-100 px-3 py-2 dark:border-white/10">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
    </div>

    <div className="max-h-56 overflow-y-auto py-1">
      {devices.length === 0 ? (
        <p className="px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {emptyText}
        </p>
      ) : devices.map((device, index) => {
        const selected = selectedId === device.deviceId || (!selectedId && index === 0);

        return (
          <button
            key={device.deviceId || `${device.kind}-${index}`}
            type="button"
            onClick={() => onSelect(device.deviceId)}
            className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold transition-colors ${
              selected
                ? 'bg-indigo-50 text-indigo-700 dark:bg-blue-500/10 dark:text-blue-300'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
          >
            <i
              className={`fa-solid fa-check w-3 text-[10px] ${
                selected ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <span className="min-w-0 flex-1 truncate">
              {device.label || `${title} ${index + 1}`}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const SplitControl = ({
  enabled,
  disabled,
  mainLabel,
  pickerLabel,
  enabledIcon,
  disabledIcon,
  onToggle,
  onPickerToggle,
  children,
}) => (
  <div className="relative">
    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={mainLabel}
        aria-pressed={enabled}
        className={`flex h-11 w-11 items-center justify-center text-base transition-all ${
          enabled
            ? 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100'
            : 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500 dark:hover:text-white'
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <i className={`fa-solid ${enabled ? enabledIcon : disabledIcon}`} />
      </button>

      <button
        type="button"
        onClick={onPickerToggle}
        disabled={disabled}
        aria-label={pickerLabel}
        className={`flex h-11 w-8 items-center justify-center border-l text-[10px] transition-all ${
          enabled
            ? 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-slate-300'
            : 'border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 dark:border-white/10 dark:bg-red-500/10 dark:text-red-300'
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <i className="fa-solid fa-chevron-up" />
      </button>
    </div>

    {children}
  </div>
);

const DeviceStatusRow = ({
  active,
  icon,
  title,
  value,
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
        active
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'bg-rose-50 text-rose-600 dark:bg-red-500/10 dark:text-red-300'
      }`}
    >
      <i className={`fa-solid ${icon} text-sm`} />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-sm font-black text-slate-950 dark:text-white">{title}</p>
      <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-500">
        {value}
      </p>
    </div>

    <span
      className={`rounded-full px-2 py-1 text-[10px] font-black ${
        active
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'bg-rose-50 text-rose-600 dark:bg-red-500/10 dark:text-red-300'
      }`}
    >
      {active ? 'On' : 'Off'}
    </span>
  </div>
);

const ScreenBeforeJoin = () => {
  const { id } = useParams();
  const addMember = useAddMembers();
  const dispatch = useDispatch();
  const { user: userData } = useAuth();

  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permState, setPermState] = useState(PERM.IDLE);
  const [deviceError, setDeviceError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  const [showDeviceMenu, setShowDeviceMenu] = useState(DEVICE_MENU.NONE);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const meterRafRef = useRef(null);
  const lastMeterUpdateRef = useRef(0);
  const deviceMenuRef = useRef(null);
  const isMounted = useRef(true);

  const displayName = userData?.displayName || userData?.email?.split('@')[0] || 'there';
  const roomShortId = useMemo(() => id?.slice(0, 6) || 'room', [id]);
  const isReady = permState === PERM.GRANTED;

  const selectedAudioLabel = audioDevices.find((d) => d.deviceId === selectedAudio)?.label
    || audioDevices[0]?.label
    || 'Default microphone';

  const selectedVideoLabel = videoDevices.find((d) => d.deviceId === selectedVideo)?.label
    || videoDevices[0]?.label
    || 'Default camera';

  const stopMeter = useCallback(() => {
    if (meterRafRef.current) {
      cancelAnimationFrame(meterRafRef.current);
      meterRafRef.current = null;
    }

    analyserRef.current = null;
    lastMeterUpdateRef.current = 0;

    if (isMounted.current) setAudioLevel(0);

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    stopMeter();

    streamRef.current?.getTracks().forEach((track) => {
      track.enabled = false;
      track.stop();
    });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stopMeter]);

  const enumerateDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      if (!isMounted.current) return;

      setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
      setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
    } catch {
      // Browser may hide devices until permission is granted.
    }
  }, []);

  const startAudioMeter = useCallback((stream) => {
    stopMeter();

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    try {
      const audioContext = new AudioContextCtor();
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.72;

      const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = (now) => {
        if (!analyserRef.current || !isMounted.current) return;

        analyserRef.current.getByteFrequencyData(data);

        if (now - lastMeterUpdateRef.current > AUDIO_METER_INTERVAL_MS) {
          const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
          setAudioLevel(Math.min(100, Math.round(avg * 1.35)));
          lastMeterUpdateRef.current = now;
        }

        meterRafRef.current = requestAnimationFrame(tick);
      };

      meterRafRef.current = requestAnimationFrame(tick);
    } catch {
      // Audio meter is optional.
    }
  }, [stopMeter]);

  const applyTrackPrefs = useCallback((stream, micOn, camOn) => {
    stream.getAudioTracks().forEach((track) => {
      track.enabled = micOn;
    });

    stream.getVideoTracks().forEach((track) => {
      track.enabled = camOn;
    });

    if (isMounted.current) {
      setIsMicOn(Boolean(stream.getAudioTracks()[0]) && micOn);
      setIsCamOn(Boolean(stream.getVideoTracks()[0]) && camOn);
    }
  }, []);

  const requestMediaStream = useCallback(async (audioId, videoId) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new Error('Your browser does not support camera/microphone access.');
      err.name = 'SecurityError';
      throw err;
    }

    try {
      return await navigator.mediaDevices.getUserMedia(
        buildConstraints(audioId, videoId, true, true)
      );
    } catch (fullError) {
      if (
        fullError?.name === 'NotFoundError'
        || fullError?.name === 'DevicesNotFoundError'
        || fullError?.name === 'OverconstrainedError'
      ) {
        try {
          return await navigator.mediaDevices.getUserMedia(
            buildConstraints('', videoId, false, true)
          );
        } catch {
          return await navigator.mediaDevices.getUserMedia(
            buildConstraints(audioId, '', true, false)
          );
        }
      }

      throw fullError;
    }
  }, []);

  const startStream = useCallback(async ({
    audioId = selectedAudio,
    videoId = selectedVideo,
    preserveMic = isMicOn,
    preserveCam = isCamOn,
  } = {}) => {
    if (!isMounted.current) return null;

    setPermState(PERM.REQUESTING);
    setDeviceError('');

    try {
      stopStream();

      const stream = await requestMediaStream(audioId, videoId);

      if (!isMounted.current) {
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      applyTrackPrefs(stream, preserveMic, preserveCam);
      setPermState(PERM.GRANTED);

      await enumerateDevices();
      startAudioMeter(stream);

      return stream;
    } catch (err) {
      stopStream();

      if (!isMounted.current) return null;

      setDeviceError(getErrorMessage(err));
      setPermState(
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? PERM.DENIED
          : PERM.UNAVAILABLE
      );

      return null;
    }
  }, [
    selectedAudio,
    selectedVideo,
    isMicOn,
    isCamOn,
    stopStream,
    requestMediaStream,
    applyTrackPrefs,
    enumerateDevices,
    startAudioMeter,
  ]);

  const ensureStream = useCallback(async () => {
    if (streamRef.current) return streamRef.current;

    return startStream({
      preserveMic: false,
      preserveCam: false,
    });
  }, [startStream]);

  useEffect(() => {
    isMounted.current = true;

    startStream({
      preserveMic: false,
      preserveCam: false,
    });

    return () => {
      isMounted.current = false;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange);
    };
  }, [enumerateDevices]);

  useEffect(() => {
    const handler = (event) => {
      if (deviceMenuRef.current && !deviceMenuRef.current.contains(event.target)) {
        setShowDeviceMenu(DEVICE_MENU.NONE);
      }
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleSelectAudio = useCallback((deviceId) => {
    setSelectedAudio(deviceId);
    setShowDeviceMenu(DEVICE_MENU.NONE);

    startStream({
      audioId: deviceId,
      videoId: selectedVideo,
      preserveMic: isMicOn,
      preserveCam: isCamOn,
    });
  }, [selectedVideo, isMicOn, isCamOn, startStream]);

  const handleSelectVideo = useCallback((deviceId) => {
    setSelectedVideo(deviceId);
    setShowDeviceMenu(DEVICE_MENU.NONE);

    startStream({
      audioId: selectedAudio,
      videoId: deviceId,
      preserveMic: isMicOn,
      preserveCam: isCamOn,
    });
  }, [selectedAudio, isMicOn, isCamOn, startStream]);

  const toggleCam = useCallback(async () => {
    const stream = await ensureStream();
    if (!stream) return;

    const [track] = stream.getVideoTracks();

    if (!track) {
      toast.error('No camera available.');
      return;
    }

    const next = !isCamOn;
    track.enabled = next;
    setIsCamOn(next);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [ensureStream, isCamOn]);

  const toggleMic = useCallback(async () => {
    const stream = await ensureStream();
    if (!stream) return;

    const [track] = stream.getAudioTracks();

    if (!track) {
      toast.error('No microphone available.');
      return;
    }

    const next = !isMicOn;
    track.enabled = next;
    setIsMicOn(next);

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, [ensureStream, isMicOn]);

  const handleJoin = useCallback(async () => {
    if (isJoining) return;

    setIsJoining(true);

    try {
      dispatch(setMediaPrefs({
        audio: isMicOn,
        video: isCamOn,
        audioDeviceId: selectedAudio || null,
        videoDeviceId: selectedVideo || null,
      }));

      stopStream();

      await addMember(id);

      dispatch(tooglePrescreenRoom(false));
    } catch (error) {
      const message = error.userMessage || error.response?.data?.error || error.message || 'Failed to join room. Please try again.';
      toast.error(message);

      if (isMounted.current) {
        setIsJoining(false);
      }
    }
  }, [
    isJoining,
    isMicOn,
    isCamOn,
    selectedAudio,
    selectedVideo,
    dispatch,
    stopStream,
    addMember,
    id,
  ]);

  const retryPermissions = useCallback(() => {
    startStream({
      preserveMic: false,
      preserveCam: false,
    });
  }, [startStream]);

  const meterBars = useMemo(() => [0.4, 0.65, 0.9, 1, 0.9, 0.65, 0.4], []);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-slate-50 px-3 py-3 text-slate-950 dark:bg-[#050713] dark:text-white sm:px-5 sm:py-5">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/15" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-[130px] dark:bg-violet-600/15" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col">
        <main className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_360px] lg:gap-4">
          {/* Preview panel */}
          <section className="flex min-h-0 flex-col rounded-[1.6rem] border border-slate-200 bg-white p-2.5 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-2xl sm:p-3">
            <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-[1.2rem] bg-slate-200 dark:bg-slate-950 sm:min-h-[380px] lg:min-h-0">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-cover transition-all duration-500 ${
                  isCamOn ? 'scale-x-[-1] opacity-100' : 'scale-x-[-1] opacity-0'
                }`}
              />

              <div
                className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.14),transparent_38%),linear-gradient(135deg,#f8fafc,#e2e8f0)] px-4 text-center transition-opacity duration-500 dark:bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_38%),linear-gradient(135deg,#0f172a,#020617)] ${
                  isCamOn ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
              >
                {permState === PERM.REQUESTING ? (
                  <>
                    <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-300 border-t-indigo-600 dark:border-white/15 dark:border-t-blue-400" />
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                      Checking camera and mic…
                    </p>
                  </>
                ) : permState === PERM.DENIED || permState === PERM.UNAVAILABLE ? (
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20">
                      <i className="fa-solid fa-triangle-exclamation text-xl" />
                    </div>

                    <div>
                      <h2 className="text-base font-black text-slate-950 dark:text-white">
                        Device access problem
                      </h2>
                      <p className="mt-1 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
                        {deviceError}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={retryPermissions}
                      className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-950"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl dark:bg-blue-500/20" />
                      <img
                        src={userData?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.uid || 'user'}`}
                        alt={displayName}
                        className="relative h-20 w-20 rounded-full border-4 border-white bg-white object-cover shadow-2xl dark:border-white/10 sm:h-24 sm:w-24"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div>
                      <p className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">
                        Hi, {displayName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Camera is currently off
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <StatusPill
                  active={isMicOn}
                  icon={isMicOn ? 'fa-microphone' : 'fa-microphone-slash'}
                  label={isMicOn ? 'Mic On' : 'Mic Off'}
                />
                <StatusPill
                  active={isCamOn}
                  icon={isCamOn ? 'fa-video' : 'fa-video-slash'}
                  label={isCamOn ? 'Cam On' : 'Cam Off'}
                />
              </div>

              <div className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-black text-slate-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/35 dark:text-white">
                #{roomShortId}
              </div>

              <div
                className={`absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md transition-opacity dark:border-white/10 dark:bg-black/35 ${
                  isMicOn && isReady ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {meterBars.map((scale, index) => (
                  <span
                    key={index}
                    className="w-1 rounded-full bg-emerald-500 transition-[height] duration-100 dark:bg-emerald-400"
                    style={{ height: `${Math.max(7, Math.min(28, audioLevel * scale * 0.3))}px` }}
                  />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div
              ref={deviceMenuRef}
              className="mt-3 flex flex-wrap items-center justify-center gap-2.5"
            >
              <SplitControl
                enabled={isMicOn}
                disabled={permState === PERM.REQUESTING || isJoining}
                mainLabel={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                pickerLabel="Select microphone"
                enabledIcon="fa-microphone"
                disabledIcon="fa-microphone-slash"
                onToggle={toggleMic}
                onPickerToggle={() => setShowDeviceMenu((value) => (
                  value === DEVICE_MENU.MIC ? DEVICE_MENU.NONE : DEVICE_MENU.MIC
                ))}
              >
                {showDeviceMenu === DEVICE_MENU.MIC && (
                  <DeviceDropdown
                    title="Microphone"
                    devices={audioDevices}
                    selectedId={selectedAudio}
                    onSelect={handleSelectAudio}
                    emptyText="No microphones found"
                  />
                )}
              </SplitControl>

              <SplitControl
                enabled={isCamOn}
                disabled={permState === PERM.REQUESTING || isJoining}
                mainLabel={isCamOn ? 'Turn camera off' : 'Turn camera on'}
                pickerLabel="Select camera"
                enabledIcon="fa-video"
                disabledIcon="fa-video-slash"
                onToggle={toggleCam}
                onPickerToggle={() => setShowDeviceMenu((value) => (
                  value === DEVICE_MENU.CAM ? DEVICE_MENU.NONE : DEVICE_MENU.CAM
                ))}
              >
                {showDeviceMenu === DEVICE_MENU.CAM && (
                  <DeviceDropdown
                    title="Camera"
                    devices={videoDevices}
                    selectedId={selectedVideo}
                    onSelect={handleSelectVideo}
                    emptyText="No cameras found"
                  />
                )}
              </SplitControl>

              <button
                type="button"
                onClick={retryPermissions}
                disabled={permState === PERM.REQUESTING || isJoining}
                className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <i className="fa-solid fa-rotate-right text-[11px]" />
                Refresh
              </button>
            </div>
          </section>

          {/* Join panel */}
          <aside className="flex flex-col justify-between rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-2xl sm:p-5">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-blue-400" />
                Ready to join
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                Join when you&apos;re ready
              </h1>

              <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                Check your camera and microphone before entering the room.
              </p>

              <div className="mt-5 space-y-2.5">
                <DeviceStatusRow
                  active={isMicOn}
                  icon={isMicOn ? 'fa-microphone' : 'fa-microphone-slash'}
                  title="Microphone"
                  value={selectedAudioLabel}
                />

                <DeviceStatusRow
                  active={isCamOn}
                  icon={isCamOn ? 'fa-video' : 'fa-video-slash'}
                  title="Camera"
                  value={selectedVideoLabel}
                />
              </div>

              {deviceError && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-5 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                  {deviceError}
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-black/20">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                    Device status
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                      isReady
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : permState === PERM.REQUESTING
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-600 dark:bg-red-500/10 dark:text-red-300'
                    }`}
                  >
                    {isReady ? 'Ready' : permState === PERM.REQUESTING ? 'Checking' : 'Limited'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleJoin}
                disabled={isJoining}
                aria-busy={isJoining}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-blue-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isJoining ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Joining…</span>
                  </>
                ) : (
                  <>
                    <span>Join Room</span>
                    <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <p className="mt-2 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-600">
                You can change devices again inside the room.
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default ScreenBeforeJoin;