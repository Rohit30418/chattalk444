import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import useAddMembers from "../../hooks/useAddMembers";
import { useParams } from "react-router";
import { tooglePrescreenRoom, setMediaPrefs } from "../../redux/action";
import { toast } from "react-toastify"; // Optional: Good for showing errors
import { useAuth } from "../auth/AppWrapper";

const PERM = { IDLE: "idle", REQUESTING: "requesting", GRANTED: "granted", DENIED: "denied", UNAVAILABLE: "unavailable" };

// 🔥 2. Removed userData from props, we will get it from Context now!
const ScreenBeforeJoin = () => { 
  const { id } = useParams();
  const addMember = useAddMembers();
  const dispatch = useDispatch();
  
  // 🔥 3. Grab the persistent user from Context (Survives page refresh!)
  const { user: userData } = useAuth();

  // ── Media State ────────────────────────────────────────────────────────────
  const [isMicOn, setIsMicOn]         = useState(false);
  const [isCamOn, setIsCamOn]         = useState(false);
  const [audioLevel, setAudioLevel]   = useState(0);
  const [permState, setPermState]     = useState(PERM.IDLE);
  const [deviceError, setDeviceError] = useState(null);
  const [isJoining, setIsJoining]     = useState(false);

  // ── Device Selection ───────────────────────────────────────────────────────
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState("");
  const [selectedVideo, setSelectedVideo] = useState("");
  const [showDeviceMenu, setShowDeviceMenu] = useState(false); 

  // ── Refs ───────────────────────────────────────────────────────────────────
  const videoRef          = useRef(null);
  const streamRef         = useRef(null);
  const audioContextRef   = useRef(null);
  const analyserRef       = useRef(null);
  const animationFrameRef = useRef(null);
  const deviceMenuRef     = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => { t.enabled = false; t.stop(); });
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    analyserRef.current = null;
  }, []);

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
    } catch {}
  };

  const startStream = useCallback(async (audioId, videoId) => {
    setPermState(PERM.REQUESTING);
    setDeviceError(null);
    try {
      stopStream();
      const constraints = {
        video: videoId ? { deviceId: { exact: videoId } } : true,
        audio: audioId ? { deviceId: { exact: audioId }, noiseSuppression: true, echoCancellation: true } : { noiseSuppression: true, echoCancellation: true },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) videoRef.current.srcObject = stream;
      stream.getVideoTracks().forEach((t) => { t.enabled = false; });
      stream.getAudioTracks().forEach((t)  => { t.enabled = false; });

      setPermState(PERM.GRANTED);
      await enumerateDevices();

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg);
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      stopStream();
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermState(PERM.DENIED);
        setDeviceError("Camera & microphone access was denied. Please allow access in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setPermState(PERM.UNAVAILABLE);
        setDeviceError("No camera or microphone found. Check your device connections.");
      } else if (err.name === "NotReadableError") {
        setPermState(PERM.UNAVAILABLE);
        setDeviceError("Your camera is in use by another application.");
      } else {
        setPermState(PERM.UNAVAILABLE);
        setDeviceError("Could not access media devices. " + err.message);
      }
    }
  }, [stopStream]);

  useEffect(() => {
    startStream();
    return () => stopStream();
  }, []);

  useEffect(() => {
    if (selectedAudio || selectedVideo) {
      const wasOn = { mic: isMicOn, cam: isCamOn };
      startStream(selectedAudio, selectedVideo).then(() => {
        if (streamRef.current) {
          streamRef.current.getAudioTracks().forEach((t) => { t.enabled = wasOn.mic; });
          streamRef.current.getVideoTracks().forEach((t) => { t.enabled = wasOn.cam; });
        }
      });
    }
  }, [selectedAudio, selectedVideo]);

  useEffect(() => {
    const handleClick = (e) => {
      if (deviceMenuRef.current && !deviceMenuRef.current.contains(e.target)) setShowDeviceMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleCam = () => {
    if (!streamRef.current) return;
    const [track] = streamRef.current.getVideoTracks();
    if (track) { track.enabled = !isCamOn; setIsCamOn(!isCamOn); }
  };

  const toggleMic = () => {
    if (!streamRef.current) return;
    const [track] = streamRef.current.getAudioTracks();
    if (track) { track.enabled = !isMicOn; setIsMicOn(!isMicOn); }
  };

  // 🔥 4. THE BULLETPROOF MODAL JOIN LOGIC
  const handleJoin = async () => {
    if (isJoining) return;
    
    // 1. Turn on the "Joining..." spinner
    setIsJoining(true);
    
    try {
      // 2. Shut off local pre-screen streams to free up the webcam
      stopStream();
      dispatch(setMediaPrefs({ audio: isMicOn, video: isCamOn }));
      
      // 3. Wait for MongoDB to successfully add you to the room!
      await addMember(id);
      
      // 4. Close the modal/pre-screen ONLY after MongoDB says OK!
      dispatch(tooglePrescreenRoom(false));
      
    } catch (error) {
      console.error("Join failed:", error);
      toast.error("Failed to join room. Please try again.");
      
      // 5. If it fails, turn off the spinner so they aren't stuck!
      setIsJoining(false);
    }
  };

  const isReady = permState === PERM.GRANTED;
  const bars = [0.4, 0.7, 1, 0.7, 0.4];

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-[#02040a] text-slate-900 dark:text-white overflow-hidden p-4 sm:p-6 font-sans transition-colors duration-300">

      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-[-15%] left-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-blue-400/15 dark:bg-blue-600/15 rounded-full blur-[100px] sm:blur-[140px] animate-pulse" />
      <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-violet-400/15 dark:bg-violet-600/15 rounded-full blur-[100px] sm:blur-[140px] animate-pulse delay-700" />

      {/* ── Glass Card ──────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-5xl bg-white/95 dark:bg-white/[0.04] backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 shadow-2xl flex flex-col md:flex-row gap-8 items-stretch z-10 transition-colors duration-300">

        {/* ── LEFT: Preview ─────────────────────────────────────────────────── */}
        <div className="w-full md:w-[55%] flex flex-col gap-5">

          {/* Video preview */}
          <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-black/60 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner">

            {/* Actual video */}
            <video
              ref={videoRef}
              autoPlay muted playsInline
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${isCamOn ? "opacity-100" : "opacity-0"}`}
            />

            {/* Avatar / error state */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-500 ${isCamOn ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              {permState === PERM.DENIED || permState === PERM.UNAVAILABLE ? (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <i className="fa-solid fa-video-slash text-red-500 text-xl" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{deviceError}</p>
                  <button onClick={() => startStream(selectedAudio, selectedVideo)} className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline transition">Try again</button>
                </div>
              ) : permState === PERM.REQUESTING ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Requesting access…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                    <img
                      src={userData?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.uid || "user"}`}
                      alt="You"
                      className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl object-cover bg-white dark:bg-slate-800"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Camera is off</p>
                </div>
              )}
            </div>

            {/* Mic status badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border transition-all ${
                isMicOn
                  ? "bg-emerald-50/70 border-emerald-400/40 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-red-50/70 border-red-400/40 text-red-600 dark:bg-red-500/20 dark:text-red-400"
              }`}>
                {isMicOn ? "Mic On" : "Mic Off"}
              </span>
            </div>

            {/* Audio level bars */}
            {isMicOn && isReady && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5 sm:gap-1 items-end h-6 sm:h-8">
                {bars.map((scale, i) => (
                  <div
                    key={i}
                    className="w-1 sm:w-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full transition-[height] duration-75"
                    style={{ height: `${Math.max(20, Math.min(100, audioLevel * scale * 2))}%` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Controls row */}
          <div className="flex justify-center gap-3 sm:gap-4">
            {/* Mic toggle */}
            <div className="relative" ref={deviceMenuRef}>
              <div className="flex rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={toggleMic}
                  disabled={!isReady}
                  className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-lg sm:text-xl border-r transition-all duration-200 ${
                    isMicOn
                      ? "bg-slate-800 text-white border-slate-700 dark:bg-white dark:text-slate-900"
                      : "bg-red-50 text-red-500 border-red-200 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <i className={`fa-solid ${isMicOn ? "fa-microphone" : "fa-microphone-slash"}`} />
                </button>
                <button onClick={() => setShowDeviceMenu(showDeviceMenu === "mic" ? false : "mic")} disabled={!isReady} className={`w-6 h-12 sm:h-14 flex items-center justify-center text-[10px] transition-all ${isMicOn ? "bg-slate-800 text-slate-300 dark:bg-white dark:text-slate-500" : "bg-red-50 text-red-400 dark:bg-red-500/10 dark:text-red-400"} disabled:opacity-40`}>
                  <i className="fa-solid fa-chevron-up" />
                </button>
              </div>
              {showDeviceMenu === "mic" && audioDevices.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-1.5 z-50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 pt-1 pb-1.5">Microphone</p>
                  {audioDevices.map((d) => (
                    <button key={d.deviceId} onClick={() => { setSelectedAudio(d.deviceId); setShowDeviceMenu(false); }} className={`w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center gap-2 transition-colors ${selectedAudio === d.deviceId ? "text-blue-600 bg-blue-50 dark:bg-blue-500/10" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                      <i className={`fa-solid fa-check text-[10px] ${selectedAudio === d.deviceId ? "opacity-100" : "opacity-0"}`} />
                      <span className="truncate">{d.label || `Microphone ${d.deviceId.slice(0, 5)}`}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cam toggle */}
            <div className="relative">
              <div className="flex rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={toggleCam}
                  disabled={!isReady}
                  className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-lg sm:text-xl border-r transition-all duration-200 ${
                    isCamOn
                      ? "bg-slate-800 text-white border-slate-700 dark:bg-white dark:text-slate-900"
                      : "bg-red-50 text-red-500 border-red-200 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <i className={`fa-solid ${isCamOn ? "fa-video" : "fa-video-slash"}`} />
                </button>
                <button onClick={() => setShowDeviceMenu(showDeviceMenu === "cam" ? false : "cam")} disabled={!isReady} className={`w-6 h-12 sm:h-14 flex items-center justify-center text-[10px] transition-all ${isCamOn ? "bg-slate-800 text-slate-300 dark:bg-white dark:text-slate-500" : "bg-red-50 text-red-400 dark:bg-red-500/10 dark:text-red-400"} disabled:opacity-40`}>
                  <i className="fa-solid fa-chevron-up" />
                </button>
              </div>
              {showDeviceMenu === "cam" && videoDevices.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-1.5 z-50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 pt-1 pb-1.5">Camera</p>
                  {videoDevices.map((d) => (
                    <button key={d.deviceId} onClick={() => { setSelectedVideo(d.deviceId); setShowDeviceMenu(false); }} className={`w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center gap-2 transition-colors ${selectedVideo === d.deviceId ? "text-blue-600 bg-blue-50 dark:bg-blue-500/10" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                      <i className={`fa-solid fa-check text-[10px] ${selectedVideo === d.deviceId ? "opacity-100" : "opacity-0"}`} />
                      <span className="truncate">{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Info & Join ──────────────────────────────────────────────── */}
        <div className="w-full md:w-[45%] flex flex-col justify-between gap-6 sm:gap-8">
          <div>
            <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4">
              Ready to Connect
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 leading-tight">
              Join the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-500">
                Conversation
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              You're about to enter{" "}
              <span className="text-slate-900 dark:text-white font-semibold">
                Room #{id?.slice(0, 6)}
              </span>.
              Check your setup and let's go!
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Device Status</span>
              <span className={`text-[10px] sm:text-xs flex items-center gap-1.5 font-medium ${isReady ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                {isReady ? "Ready" : permState === PERM.REQUESTING ? "Checking…" : "Not available"}
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <i className={`fa-solid fa-microphone w-4 text-center ${isMicOn ? "text-emerald-500" : "text-red-500"}`} />
                Microphone:{" "}
                <strong className="text-slate-900 dark:text-white ml-auto">{isMicOn ? "Active" : "Muted"}</strong>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <i className={`fa-solid fa-video w-4 text-center ${isCamOn ? "text-emerald-500" : "text-red-500"}`} />
                Camera:{" "}
                <strong className="text-slate-900 dark:text-white ml-auto">{isCamOn ? "Active" : "Off"}</strong>
              </div>
            </div>
            {(permState === PERM.DENIED || permState === PERM.UNAVAILABLE) && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{deviceError}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="relative w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-black text-base sm:text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2.5 overflow-hidden group"
          >
            <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200 rounded-2xl" />
            {isJoining ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Joining Server...
              </>
            ) : (
              <>
                Join Room Now
                <i className="fa-solid fa-arrow-right text-sm group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600">
            You can change your settings after joining
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScreenBeforeJoin;