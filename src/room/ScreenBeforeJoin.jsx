import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import useAddMembers from "../hooks/useAddMembers";
import { tooglePrescreenRoom, setMediaPrefs } from "../redux/action";
import { useAuth } from "../components/auth/AppWrapper";

const PERM = {
  IDLE: "idle",
  REQUESTING: "requesting",
  GRANTED: "granted",
  DENIED: "denied",
  UNAVAILABLE: "unavailable",
};

const DEVICE_MENU = {
  NONE: null,
  MIC: "mic",
  CAM: "cam",
};

const AUDIO_METER_INTERVAL_MS = 90;

const getErrorMessage = (err) => {
  const map = {
    NotAllowedError:
      "Camera or microphone permission was denied. Please allow access in your browser settings.",
    PermissionDeniedError:
      "Camera or microphone permission was denied. Please allow access in your browser settings.",
    NotFoundError:
      "No camera or microphone was found. Please check your device connection.",
    DevicesNotFoundError:
      "No camera or microphone was found. Please check your device connection.",
    NotReadableError:
      "Your camera or microphone is already in use by another app. Close it and try again.",
    OverconstrainedError:
      "The selected device is not available. Please choose another device.",
    SecurityError:
      "Media devices are blocked because this page is not running securely.",
  };

  return map[err?.name] || err?.message || "Could not access your media devices.";
};

const buildConstraints = (
  audioId,
  videoId,
  includeAudio = true,
  includeVideo = true
) => ({
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
    style={{
      "--pill-accent": active ? "var(--color-success)" : "var(--color-danger)",
    }}
    className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--pill-accent)_32%,transparent)] bg-[color-mix(in_srgb,var(--pill-accent)_10%,transparent)] px-2.5 py-1 text-[10px] font-black text-[var(--pill-accent)] [box-shadow:var(--shadow-card)] backdrop-blur-md"
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
  <div className="absolute bottom-full left-0 z-[80] mb-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] [box-shadow:var(--shadow-soft)]">
    <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-soft)]">
        {title}
      </p>
    </div>

    <div className="max-h-56 overflow-y-auto py-1">
      {devices.length === 0 ? (
        <p className="px-3 py-3 text-xs font-semibold text-[var(--color-muted)]">
          {emptyText}
        </p>
      ) : (
        devices.map((device, index) => {
          const selected =
            selectedId === device.deviceId || (!selectedId && index === 0);

          return (
            <button
              key={device.deviceId || `${device.kind}-${index}`}
              type="button"
              onClick={() => onSelect(device.deviceId)}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold transition-colors ${
                selected
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-700)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-bg-soft)]"
              }`}
            >
              <i
                className={`fa-solid fa-check w-3 text-[10px] ${
                  selected ? "opacity-100" : "opacity-0"
                }`}
              />
              <span className="min-w-0 flex-1 truncate">
                {device.label || `${title} ${index + 1}`}
              </span>
            </button>
          );
        })
      )}
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
    <div className="flex overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] [box-shadow:var(--shadow-card)]">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={mainLabel}
        aria-pressed={enabled}
        className={`flex h-11 w-11 items-center justify-center text-base transition-all ${
          enabled
            ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-on-primary)] hover:opacity-90"
            : "bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-[var(--color-on-primary)]"
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <i className={`fa-solid ${enabled ? enabledIcon : disabledIcon}`} />
      </button>

      <button
        type="button"
        onClick={onPickerToggle}
        disabled={disabled}
        aria-label={pickerLabel}
        className={`flex h-11 w-8 items-center justify-center border-l border-[var(--color-border)] text-[10px] transition-all ${
          enabled
            ? "bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-bg-soft)]"
            : "bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_16%,transparent)]"
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <i className="fa-solid fa-chevron-up" />
      </button>
    </div>

    {children}
  </div>
);

const DeviceStatusRow = ({ active, icon, title, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 [box-shadow:var(--shadow-card)]">
    <div
      style={{
        "--row-accent": active ? "var(--color-success)" : "var(--color-danger)",
      }}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--row-accent)_10%,transparent)] text-[var(--row-accent)]"
    >
      <i className={`fa-solid ${icon} text-sm`} />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-sm font-black text-[var(--color-text)]">{title}</p>
      <p className="truncate text-xs font-medium text-[var(--color-soft)]">
        {value}
      </p>
    </div>

    <span
      style={{
        "--row-accent": active ? "var(--color-success)" : "var(--color-danger)",
      }}
      className="rounded-full bg-[color-mix(in_srgb,var(--row-accent)_10%,transparent)] px-2 py-1 text-[10px] font-black text-[var(--row-accent)]"
    >
      {active ? "On" : "Off"}
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
  const [deviceError, setDeviceError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState("");
  const [selectedVideo, setSelectedVideo] = useState("");
  const [showDeviceMenu, setShowDeviceMenu] = useState(DEVICE_MENU.NONE);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const meterRafRef = useRef(null);
  const lastMeterUpdateRef = useRef(0);
  const deviceMenuRef = useRef(null);
  const isMounted = useRef(true);

  const displayName =
    userData?.displayName || userData?.email?.split("@")[0] || "there";

  const roomShortId = useMemo(() => id?.slice(0, 6) || "room", [id]);
  const isReady = permState === PERM.GRANTED;

  const selectedAudioLabel =
    audioDevices.find((d) => d.deviceId === selectedAudio)?.label ||
    audioDevices[0]?.label ||
    "Default microphone";

  const selectedVideoLabel =
    videoDevices.find((d) => d.deviceId === selectedVideo)?.label ||
    videoDevices[0]?.label ||
    "Default camera";

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

      setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
    } catch {
      // Browser may hide devices until permission is granted.
    }
  }, []);

  const startAudioMeter = useCallback(
    (stream) => {
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

        const source = audioContext.createMediaStreamSource(
          new MediaStream([audioTrack])
        );

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
    },
    [stopMeter]
  );

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
      const err = new Error(
        "Your browser does not support camera/microphone access."
      );
      err.name = "SecurityError";
      throw err;
    }

    try {
      return await navigator.mediaDevices.getUserMedia(
        buildConstraints(audioId, videoId, true, true)
      );
    } catch (fullError) {
      if (
        fullError?.name === "NotFoundError" ||
        fullError?.name === "DevicesNotFoundError" ||
        fullError?.name === "OverconstrainedError"
      ) {
        try {
          return await navigator.mediaDevices.getUserMedia(
            buildConstraints("", videoId, false, true)
          );
        } catch {
          return await navigator.mediaDevices.getUserMedia(
            buildConstraints(audioId, "", true, false)
          );
        }
      }

      throw fullError;
    }
  }, []);

  const startStream = useCallback(
    async ({
      audioId = selectedAudio,
      videoId = selectedVideo,
      preserveMic = isMicOn,
      preserveCam = isCamOn,
    } = {}) => {
      if (!isMounted.current) return null;

      setPermState(PERM.REQUESTING);
      setDeviceError("");

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
          err?.name === "NotAllowedError" ||
            err?.name === "PermissionDeniedError"
            ? PERM.DENIED
            : PERM.UNAVAILABLE
        );

        return null;
      }
    },
    [
      selectedAudio,
      selectedVideo,
      isMicOn,
      isCamOn,
      stopStream,
      requestMediaStream,
      applyTrackPrefs,
      enumerateDevices,
      startAudioMeter,
    ]
  );

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

    navigator.mediaDevices?.addEventListener?.("devicechange", onDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener?.(
        "devicechange",
        onDeviceChange
      );
    };
  }, [enumerateDevices]);

  useEffect(() => {
    const handler = (event) => {
      if (deviceMenuRef.current && !deviceMenuRef.current.contains(event.target)) {
        setShowDeviceMenu(DEVICE_MENU.NONE);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const handleSelectAudio = useCallback(
    (deviceId) => {
      setSelectedAudio(deviceId);
      setShowDeviceMenu(DEVICE_MENU.NONE);

      startStream({
        audioId: deviceId,
        videoId: selectedVideo,
        preserveMic: isMicOn,
        preserveCam: isCamOn,
      });
    },
    [selectedVideo, isMicOn, isCamOn, startStream]
  );

  const handleSelectVideo = useCallback(
    (deviceId) => {
      setSelectedVideo(deviceId);
      setShowDeviceMenu(DEVICE_MENU.NONE);

      startStream({
        audioId: selectedAudio,
        videoId: deviceId,
        preserveMic: isMicOn,
        preserveCam: isCamOn,
      });
    },
    [selectedAudio, isMicOn, isCamOn, startStream]
  );

  const toggleCam = useCallback(async () => {
    const stream = await ensureStream();
    if (!stream) return;

    const [track] = stream.getVideoTracks();

    if (!track) {
      toast.error("No camera available.");
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
      toast.error("No microphone available.");
      return;
    }

    const next = !isMicOn;
    track.enabled = next;
    setIsMicOn(next);

    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }
  }, [ensureStream, isMicOn]);

  const handleJoin = useCallback(async () => {
    if (isJoining) return;

    setIsJoining(true);

    try {
      dispatch(
        setMediaPrefs({
          audio: isMicOn,
          video: isCamOn,
          audioDeviceId: selectedAudio || null,
          videoDeviceId: selectedVideo || null,
        })
      );

      stopStream();

      await addMember(id);

      dispatch(tooglePrescreenRoom(false));
    } catch (error) {
      const message =
        error.userMessage ||
        error.response?.data?.error ||
        error.message ||
        "Failed to join room. Please try again.";

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
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--color-bg)] px-3 py-3 text-[var(--color-text)] sm:px-5 sm:py-5">
      <style>{`
        .prejoin-camera-off-bg {
          background:
            radial-gradient(
              circle at center,
              color-mix(in srgb, var(--color-primary) 15%, transparent),
              transparent 42%
            ),
            linear-gradient(
              135deg,
              var(--color-bg-lift, var(--color-bg-soft)),
              var(--color-bg-soft)
            );
        }
      `}</style>

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-[var(--color-primary-soft)] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col">
        <main className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_360px] lg:gap-4">
          {/* Preview panel */}
          <section className="flex min-h-0 flex-col rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 [box-shadow:var(--shadow-soft)] sm:p-3">
            <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-[1.2rem] bg-[var(--color-surface-2)] sm:min-h-[380px] lg:min-h-0">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-cover transition-all duration-500 ${
                  isCamOn ? "scale-x-[-1] opacity-100" : "scale-x-[-1] opacity-0"
                }`}
              />

              <div
                className={`prejoin-camera-off-bg absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center transition-opacity duration-500 ${
                  isCamOn ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
              >
                {permState === PERM.REQUESTING ? (
                  <>
                    <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)]" />
                    <p className="text-sm font-black text-[var(--color-muted)]">
                      Checking camera and mic…
                    </p>
                  </>
                ) : permState === PERM.DENIED ||
                  permState === PERM.UNAVAILABLE ? (
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] ring-1 ring-[color-mix(in_srgb,var(--color-danger)_22%,transparent)]">
                      <i className="fa-solid fa-triangle-exclamation text-xl" />
                    </div>

                    <div>
                      <h2 className="text-base font-black text-[var(--color-text)]">
                        Device access problem
                      </h2>
                      <p className="mt-1 text-xs font-medium leading-5 text-[var(--color-muted)]">
                        {deviceError}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={retryPermissions}
                      className="rounded-2xl bg-[var(--color-text)] px-4 py-2.5 text-xs font-black text-[var(--color-surface)] [box-shadow:var(--shadow-card)] transition hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-[var(--color-primary-soft)] blur-2xl" />
                      <img
                        src={
                          userData?.photoURL ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                            userData?.uid || "user"
                          }`
                        }
                        alt={displayName}
                        className="relative h-20 w-20 rounded-full border-4 border-[var(--color-surface)] bg-[var(--color-surface)] object-cover [box-shadow:var(--shadow-soft)] sm:h-24 sm:w-24"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div>
                      <p className="text-lg font-black text-[var(--color-text)] sm:text-xl">
                        Hi, {displayName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
                        Camera is currently off
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <StatusPill
                  active={isMicOn}
                  icon={isMicOn ? "fa-microphone" : "fa-microphone-slash"}
                  label={isMicOn ? "Mic On" : "Mic Off"}
                />
                <StatusPill
                  active={isCamOn}
                  icon={isCamOn ? "fa-video" : "fa-video-slash"}
                  label={isCamOn ? "Cam On" : "Cam Off"}
                />
              </div>

              <div className="absolute right-3 top-3 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_82%,transparent)] px-2.5 py-1 text-[10px] font-black text-[var(--color-muted)] [box-shadow:var(--shadow-card)] backdrop-blur-md">
                #{roomShortId}
              </div>

              <div
                className={`absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-1 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_82%,transparent)] px-3 py-2 [box-shadow:var(--shadow-card)] backdrop-blur-md transition-opacity ${
                  isMicOn && isReady ? "opacity-100" : "opacity-0"
                }`}
              >
                {meterBars.map((scale, index) => (
                  <span
                    key={index}
                    className="w-1 rounded-full bg-[var(--color-success)] transition-[height] duration-100"
                    style={{
                      height: `${Math.max(
                        7,
                        Math.min(28, audioLevel * scale * 0.3)
                      )}px`,
                    }}
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
                mainLabel={isMicOn ? "Mute microphone" : "Unmute microphone"}
                pickerLabel="Select microphone"
                enabledIcon="fa-microphone"
                disabledIcon="fa-microphone-slash"
                onToggle={toggleMic}
                onPickerToggle={() =>
                  setShowDeviceMenu((value) =>
                    value === DEVICE_MENU.MIC ? DEVICE_MENU.NONE : DEVICE_MENU.MIC
                  )
                }
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
                mainLabel={isCamOn ? "Turn camera off" : "Turn camera on"}
                pickerLabel="Select camera"
                enabledIcon="fa-video"
                disabledIcon="fa-video-slash"
                onToggle={toggleCam}
                onPickerToggle={() =>
                  setShowDeviceMenu((value) =>
                    value === DEVICE_MENU.CAM ? DEVICE_MENU.NONE : DEVICE_MENU.CAM
                  )
                }
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
                className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-black text-[var(--color-muted)] [box-shadow:var(--shadow-card)] transition hover:bg-[var(--color-bg-soft)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i className="fa-solid fa-rotate-right text-[11px]" />
                Refresh
              </button>
            </div>
          </section>

          {/* Join panel */}
          <aside className="flex flex-col justify-between rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 [box-shadow:var(--shadow-soft)] sm:p-5">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-primary-700)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                Ready to join
              </div>

              <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)] sm:text-3xl">
                Join when you&apos;re ready
              </h1>

              <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-muted)]">
                Check your camera and microphone before entering the room.
              </p>

              <div className="mt-5 space-y-2.5">
                <DeviceStatusRow
                  active={isMicOn}
                  icon={isMicOn ? "fa-microphone" : "fa-microphone-slash"}
                  title="Microphone"
                  value={selectedAudioLabel}
                />

                <DeviceStatusRow
                  active={isCamOn}
                  icon={isCamOn ? "fa-video" : "fa-video-slash"}
                  title="Camera"
                  value={selectedVideoLabel}
                />
              </div>

              {deviceError && (
                <div className="mt-4 rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-3 py-2.5 text-xs font-semibold leading-5 text-[var(--color-warning)]">
                  {deviceError}
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-[var(--color-muted)]">
                    Device status
                  </span>

                  <span
                    style={{
                      "--status-accent": isReady
                        ? "var(--color-success)"
                        : permState === PERM.REQUESTING
                          ? "var(--color-warning)"
                          : "var(--color-danger)",
                    }}
                    className="rounded-full bg-[color-mix(in_srgb,var(--status-accent)_10%,transparent)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--status-accent)]"
                  >
                    {isReady
                      ? "Ready"
                      : permState === PERM.REQUESTING
                        ? "Checking"
                        : "Limited"}
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
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] px-4 py-3.5 text-sm font-black text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)] transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isJoining ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--color-on-primary)_30%,transparent)] border-t-[var(--color-on-primary)]" />
                    <span>Joining…</span>
                  </>
                ) : (
                  <>
                    <span>Join Room</span>
                    <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <p className="mt-2 text-center text-[11px] font-semibold text-[var(--color-soft)]">
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