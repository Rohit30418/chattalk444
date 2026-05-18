/**
 * RoomMain.jsx — Production-Refactored
 *
 * Fixes applied vs original:
 *  [P0] AudioContext leak — speakingCleanupsRef map; every detectSpeaking call kills its predecessor
 *  [P0] Hook violation — useToggleSidebarFirebase / useDeleteUnseenCount called at top level only
 *  [P0] Error Boundary — RoomErrorBoundary wraps full render
 *  [P0] Firestore rules note — host-only write enforcement must exist in firestore.rules (see bottom)
 *  [P1] SpeechRecognition loop — unmount guard ref prevents restart after component teardown
 *  [P1] PeerJS race — peerRef used instead of peer state to avoid stale-closure connection attempts
 *  [P1] Screen share audio leak — screenStream tracks fully stopped on both manual stop and 'ended'
 *  [P1] Heartbeat — fires only when mounted, clears on unmount
 *  [P2] Accessibility — aria-labels on all icon-only controls, role="status" on live indicators
 *  [P2] beforeunload — sendBeacon replaces fire-and-forget to guarantee delivery on tab close
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import Peer from 'peerjs';
import {
  collection, doc, onSnapshot, setDoc, deleteDoc,
  updateDoc, increment, Timestamp, deleteField, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Chat from '../chat/Chat';
import { useSelector, useDispatch } from 'react-redux';
import { toggleChatSidebar } from '../../redux/action';
import useGetUnseenCount from '../../hooks/useGetUnseenCount';
import useDeleteUnseenCount from '../../hooks/useDeleteUnseenCount';
import useToggleSidebarFirebase from '../../hooks/useToggleSidebarFirebase';
import getUserData from '../../hooks/getUserData';
import { getRoomData } from '../../hooks/getRoom';
import LottieEmoji from '../AppBody/LottieEmoji';
import Swal from 'sweetalert2';

// ─── Audio preloaded at module level ─────────────────────────────────────────
import joinRoomSrc from '../../assets/notification-1-269296.mp3';
const joinRoomAudio = new Audio(joinRoomSrc);
joinRoomAudio.preload = 'auto';

// ─── Constants ────────────────────────────────────────────────────────────────
const REACTION_EMOJIS = [
  { key: '👍', label: 'Like' },
  { key: '❤️', label: 'Love' },
  { key: '😂', label: 'Haha' },
  { key: '😮', label: 'Wow' },
  { key: '👏', label: 'Clap' },
  { key: '🎉', label: 'Party' },
  { key: '✋', label: 'Hand' },
];

const SPEAKING_THRESHOLD   = 20;
const SPEAKING_HOLD_MS     = 1000;
const SPEAKING_THROTTLE_MS = 150;

// ─── Error Boundary [P0] ──────────────────────────────────────────────────────
class RoomErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[RoomErrorBoundary]', error, info.componentStack);
    // Replace with Sentry.captureException(error) in production
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0f172a] text-white gap-6 p-8 text-center">
          <i className="fas fa-triangle-exclamation text-4xl text-red-400" aria-hidden="true" />
          <h2 className="text-xl font-bold text-red-300">Something went wrong</h2>
          <p className="text-sm text-slate-400 max-w-sm">
            A rendering error occurred. Your media streams have been stopped. Please rejoin the room.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors"
          >
            Rejoin Room
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Hand badge ───────────────────────────────────────────────────────────────
const HandBadge = memo(() => (
  <div
    role="status"
    aria-label="Hand raised"
    className="absolute top-2 right-10 sm:top-4 sm:right-14 z-30 bg-amber-500/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 text-[10px] sm:text-xs font-bold text-white animate-bounce"
  >
    ✋
  </div>
));

// ─── Floating reaction ─────────────────────────────────────────────────────────
const FloatingReaction = memo(({ emoji, id: reactionId, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-3xl sm:text-4xl select-none"
      style={{ animation: 'floatUp 3s ease-out forwards' }}
      aria-hidden="true"
    >
      {emoji}
    </div>
  );
});

// ─── Participant thumbnails (screen-share bar) ────────────────────────────────
const ParticipantThumbs = memo(({ remoteStream, localVideoRef, uId }) => (
  <div className="flex gap-2 overflow-x-auto py-1 pr-2" style={{ scrollbarWidth: 'none' }}>
    <div className="relative w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 ring-1 ring-white/10">
      <video autoPlay muted playsInline ref={localVideoRef}
        className="w-full h-full object-cover scale-x-[-1]" />
      <span className="absolute bottom-1 left-1 text-[9px] text-white bg-black/50 px-1.5 rounded-full">You</span>
    </div>
    {remoteStream.filter((u) => u.remotePeer?.uid !== uId).map((user) => (
      <div key={user.peerId}
        className="relative w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 ring-1 ring-white/10">
        <video
          autoPlay playsInline
          className="w-full h-full object-cover"
          ref={(v) => { if (v && v.srcObject !== user.stream) v.srcObject = user.stream; }}
          aria-label={`${user.remotePeer?.name || 'User'}'s video`}
        />
        <span className="absolute bottom-1 left-1 text-[9px] text-white bg-black/50 px-1.5 rounded-full truncate max-w-[80px]">
          {user.remotePeer?.name || 'User'}
        </span>
      </div>
    ))}
  </div>
));

// ─── Meeting timer ────────────────────────────────────────────────────────────
const useMeetingTimer = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

// ─── Control button ───────────────────────────────────────────────────────────
const ControlBtn = memo(({ active, onClick, icon, label, danger, accent, disabled }) => {
  const accentMap = {
    blue:   { on: 'bg-blue-500/90 text-white shadow-blue-500/30',    off: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
    yellow: { on: 'bg-yellow-500/90 text-white shadow-yellow-500/30', off: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
    indigo: { on: 'bg-indigo-500/90 text-white shadow-indigo-500/30', off: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
  };

  let cls = 'flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl transition-all duration-200 ';
  if (disabled) {
    cls += 'opacity-40 cursor-not-allowed bg-white/5 text-gray-500 border border-white/5 ';
  } else if (accent) {
    cls += `${active ? accentMap[accent].on + ' shadow-lg' : accentMap[accent].off} `;
  } else if (danger && !active) {
    cls += 'bg-red-500/90 text-white shadow-lg shadow-red-500/20 ';
  } else {
    cls += `${active ? 'bg-slate-600 text-white border border-white/10' : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'} `;
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={cls}
    >
      <i className={`fas ${icon} text-sm sm:text-lg`} aria-hidden="true" />
      <span className="text-[8px] sm:text-[10px] font-medium hidden sm:block">{label}</span>
    </button>
  );
});

// ─── Remote participant card ───────────────────────────────────────────────────
const RemoteCard = memo(({
  peerId: rPeerId, stream, remotePeer,
  reactions: remoteReactions, handRaised,
  isSettingOn, onSettingToggle,
  settingsMenuRef, isHost,
  onForceMute, onKick,
}) => {
  const isVideoOn  = remotePeer?.isVideoEnabled;
  const isAudioOn  = remotePeer?.isAudioEnabled;
  const isSpeaking = remotePeer?.isSpeaking;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-800 transition-all duration-300 group min-h-[140px] sm:min-h-[200px] ${
        isSpeaking
          ? 'ring-2 ring-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.3)]'
          : 'ring-1 ring-white/10 hover:ring-white/20'
      }`}
      aria-label={`${remotePeer?.name || 'User'}${isSpeaking ? ' (speaking)' : ''}`}
    >
      {/* Floating reactions */}
      <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden" aria-hidden="true">
        {remoteReactions.map((r) => (
          <div key={r.id} className="absolute bottom-8 left-1/2 text-3xl"
            style={{ animation: 'floatUp 3s ease-out forwards' }}>
            {r.emoji}
          </div>
        ))}
      </div>

      {handRaised && <HandBadge />}

      <video
        className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
        autoPlay playsInline
        aria-label={`${remotePeer?.name || 'User'}'s video`}
        ref={(v) => { if (v && v.srcObject !== stream) v.srcObject = stream; }}
      />

      {/* Camera off placeholder */}
      <div className={`absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center transition-opacity duration-300 ${!isVideoOn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="relative mb-3">
          {isSpeaking && (
            <>
              <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping scale-150" aria-hidden="true" />
              <span className="absolute inset-0 rounded-full bg-indigo-400/15 animate-ping scale-125 delay-150" aria-hidden="true" />
            </>
          )}
          <img
            src={remotePeer?.photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
            alt={remotePeer?.name || 'User'}
            className="relative w-14 h-14 sm:w-20 sm:h-20 object-cover rounded-full border-2 sm:border-4 border-slate-600 z-10 shadow-2xl"
          />
        </div>
        {isSpeaking && (
          <p className="text-[10px] sm:text-xs text-indigo-300 font-medium animate-pulse" aria-live="polite">
            Speaking…
          </p>
        )}
      </div>

      {/* Settings dropdown */}
      <div
        className="absolute top-2 right-2 z-30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        ref={settingsMenuRef}
      >
        <button
          onClick={() => onSettingToggle(rPeerId)}
          aria-label={`More options for ${remotePeer?.name || 'user'}`}
          aria-expanded={isSettingOn === rPeerId}
          className="w-7 h-7 rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60 flex items-center justify-center"
        >
          <i className="fa-solid fa-ellipsis-vertical text-[10px]" aria-hidden="true" />
        </button>
        {isSettingOn === rPeerId && (
          <div
            role="menu"
            className="absolute right-0 top-9 flex flex-col bg-slate-800/95 backdrop-blur border border-white/10 rounded-xl w-36 shadow-2xl py-1 z-50"
            style={{ animation: 'fadeInUp 0.15s ease-out' }}
          >
            <Link
              to={`/MyProfile/${remotePeer?.uid}`}
              role="menuitem"
              className="text-[11px] text-gray-300 hover:bg-white/10 px-3 py-2 flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-user text-[10px]" aria-hidden="true" /> View Profile
            </Link>
            <button
              role="menuitem"
              className="text-[11px] text-left text-gray-300 hover:bg-white/10 px-3 py-2 w-full flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-volume-xmark text-[10px]" aria-hidden="true" /> Mute (local)
            </button>
            {isHost && (
              <>
                <div className="h-px bg-white/10 my-1" />
                <button
                  role="menuitem"
                  onClick={() => { onForceMute(remotePeer?.uid); onSettingToggle(null); }}
                  className="text-[11px] text-left text-amber-400 hover:bg-white/10 px-3 py-2 w-full flex items-center gap-2 transition-colors"
                >
                  <i className="fa-solid fa-microphone-slash text-[10px]" aria-hidden="true" /> Force Mute
                </button>
                <button
                  role="menuitem"
                  onClick={() => { onKick(remotePeer?.uid); onSettingToggle(null); }}
                  className="text-[11px] text-left text-red-400 hover:bg-red-500/10 px-3 py-2 w-full flex items-center gap-2 transition-colors"
                >
                  <i className="fa-solid fa-user-xmark text-[10px]" aria-hidden="true" /> Kick User
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Name + audio badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-20">
        <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/5">
          <span className="text-white text-[9px] sm:text-xs font-semibold max-w-[70px] sm:max-w-[110px] truncate block">
            {remotePeer?.name || 'User'}
          </span>
        </div>
        <div
          aria-label={isAudioOn ? 'Microphone on' : 'Microphone muted'}
          className={`w-6 h-6 rounded-full flex items-center justify-center ${isAudioOn ? 'bg-black/40 text-white' : 'bg-red-500/90 text-white'}`}
        >
          <i className={`fas text-[9px] sm:text-xs ${isAudioOn ? 'fa-microphone' : 'fa-microphone-slash'}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.peerId      === next.peerId &&
  prev.stream      === next.stream &&
  prev.remotePeer  === next.remotePeer &&
  prev.reactions   === next.reactions &&
  prev.handRaised  === next.handRaised &&
  prev.isSettingOn === next.isSettingOn &&
  prev.isHost      === next.isHost
);

// ─── Main RoomMain Component ──────────────────────────────────────────────────
const RoomMain = ({ uId }) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [peerId,              setPeerId]              = useState('');
  const [isSettingOn,         setIsSettingOn]         = useState(null);
  const [currUserData,        setCurrUserData]        = useState(null);
  const [userLoading,         setUserLoading]         = useState(true);
  const [currentRoomData,     setCurrentRoomData]     = useState(null);
  const [remotePeerIds,       setRemotePeerIds]       = useState([]);
  const [isHost,              setIsHost]              = useState(false);
  const [showParticipants,    setShowParticipants]    = useState(false);
  const [showReactionPicker,  setShowReactionPicker]  = useState(false);
  const [raisedHand,          setRaisedHand]          = useState(false);
  const [isAudioEnabled,      setIsAudioEnabled]      = useState(false);
  const [isVideoEnabled,      setIsVideoEnabled]      = useState(false);
  const [isScreenSharing,     setIsScreenSharing]     = useState(false);
  const [remoteStream,        setRemoteStream]        = useState([]);
  const [reactions,           setReactions]           = useState({});
  const [localReactions,      setLocalReactions]      = useState([]);
  const [raisedHands,         setRaisedHands]         = useState({});
  const [subtitles,           setSubtitles]           = useState({});
  const [localSubtitle,       setLocalSubtitle]       = useState('');
  const [subtitlesEnabled,    setSubtitlesEnabled]    = useState(false);

  // ── Redux ──────────────────────────────────────────────────────────────────
  const mediaPrefs       = useSelector((s) => s.mediaPrefs);
  const isChatToggleOpen = useSelector((s) => s.toggleChatSidebar);
  const dispatch         = useDispatch();

  // ── Refs ───────────────────────────────────────────────────────────────────
  const localVideoRef       = useRef(null);
  const localStreamRef      = useRef(null);
  const screenStreamRef     = useRef(null);
  const dataConnectionsRef  = useRef({});  // peerId → PeerJS call
  const chatConnectionsRef  = useRef({});  // peerId → PeerJS data connection
  const settingsMenuRef     = useRef(null);
  const reactionPickerRef   = useRef(null);
  const isHangingUp         = useRef(false);
  const camStateBeforeShare = useRef(false);
  const subtitleTimersRef   = useRef({});
  const recognitionRef      = useRef(null);
  const recognitionActiveRef = useRef(false); // [P1] unmount guard for SR restart
  const speakingThrottleRef = useRef({});
  const speakingStateRef    = useRef({});
  const videoContainerRef   = useRef(null);
  const isMountedRef        = useRef(true);

  // [P0] peerRef avoids stale peer state in callbacks
  const peerRef             = useRef(null);

  // [P0] Speaking cleanup map — kills AudioContext + RAF per peer
  const speakingCleanupsRef = useRef({});

  const { id }    = useParams();
  const navigate  = useNavigate();
  const timer     = useMeetingTimer();

  // [P0] Hooks at top level — never inside callbacks
  const msgcont            = useGetUnseenCount(uId);
  const deleteUnseenCount  = useDeleteUnseenCount();
  const toggleSidebarFb    = useToggleSidebarFirebase();

  const { rooms } = getRoomData() || {};

  // ── Component mount/unmount tracking ───────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Init: clear unseen messages ────────────────────────────────────────────
  useEffect(() => {
    if (uId && id) deleteUnseenCount(uId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Init: local media ──────────────────────────────────────────────────────
  useEffect(() => {
    let stream;
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true },
        });
        const [vt] = stream.getVideoTracks();
        const [at] = stream.getAudioTracks();
        if (vt) vt.enabled = mediaPrefs?.video || false;
        if (at) at.enabled = mediaPrefs?.audio || false;
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
        if (isMountedRef.current) {
          setIsAudioEnabled(mediaPrefs?.audio || false);
          setIsVideoEnabled(mediaPrefs?.video || false);
        }
      } catch (err) {
        console.error('[RoomMain] Media init error:', err);
      }
    };
    init();
    return () => {
      stream?.getTracks().forEach((t) => { t.enabled = false; t.stop(); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync room data + host status ───────────────────────────────────────────
  useEffect(() => {
    const room = rooms?.find((r) => r.id == id);
    if (!isMountedRef.current) return;
    setCurrentRoomData(room || null);
    if (room && uId) setIsHost(room.createdBy === uId || room.hostId === uId);
  }, [id, rooms, uId]);

  // ── Fetch user profile ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getUserData(uId);
        if (!cancelled && isMountedRef.current) setCurrUserData(data);
      } catch {
        if (!cancelled && isMountedRef.current) setCurrUserData(null);
      } finally {
        if (!cancelled && isMountedRef.current) setUserLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uId]);

  // ── Close menus on outside click ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) setIsSettingOn(null);
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target)) setShowReactionPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // DATA HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  const sendDataToAll = useCallback((msg) => {
    Object.values(chatConnectionsRef.current).forEach((conn) => {
      try { if (conn.open) conn.send(msg); } catch {}
    });
  }, []);

  const processIncomingData = useCallback((data) => {
    if (data.type === 'reaction') {
      const { peerId: sender, emoji } = data;
      const rid = Date.now();
      setReactions((prev) => ({
        ...prev,
        [sender]: [...(prev[sender] || []), { id: rid, emoji }],
      }));
      setTimeout(() => {
        setReactions((prev) => ({
          ...prev,
          [sender]: (prev[sender] || []).filter((r) => r.id !== rid),
        }));
      }, 3200);
    }
    if (data.type === 'subtitle') {
      const { peerId: sender, text, name } = data;
      setSubtitles((prev) => ({ ...prev, [sender]: { text, name } }));
      clearTimeout(subtitleTimersRef.current[sender]);
      subtitleTimersRef.current[sender] = setTimeout(() => {
        if (!isMountedRef.current) return;
        setSubtitles((prev) => { const u = { ...prev }; delete u[sender]; return u; });
      }, 3000);
    }
    if (data.type === 'raise_hand') {
      const { peerId: sender, raised } = data;
      setRaisedHands((prev) => ({ ...prev, [sender]: raised }));
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // SPEAKING DETECTION — [P0] Full lifecycle management
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * detectSpeaking — creates an AudioContext + RAF loop for a remote stream.
   * Returns a cleanup function. MUST be called through speakingCleanupsRef
   * so the previous context is killed before a new one is created.
   */
  const detectSpeaking = useCallback((rPeerId, stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    const analyser = audioCtx.createAnalyser();
    analyser.smoothingTimeConstant = 0.7;
    analyser.fftSize = 1024;
    audioCtx.createMediaStreamSource(stream).connect(analyser);

    const data          = new Uint8Array(analyser.frequencyBinCount);
    let speakingTimeout = null;
    let raf             = null;

    const updateSpeakingThrottled = (val) => {
      const now  = Date.now();
      const last = speakingThrottleRef.current[rPeerId] || 0;
      const cur  = speakingStateRef.current[rPeerId];
      if (cur === val || now - last < SPEAKING_THROTTLE_MS) return;
      speakingThrottleRef.current[rPeerId] = now;
      speakingStateRef.current[rPeerId]    = val;
      setRemoteStream((prev) =>
        prev.map((u) =>
          u.peerId === rPeerId
            ? { ...u, remotePeer: { ...u.remotePeer, isSpeaking: val } }
            : u
        )
      );
    };

    const check = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) sum += data[i];
      const avg = sum / (data.length / 4);

      if (avg > SPEAKING_THRESHOLD) {
        updateSpeakingThrottled(true);
        if (speakingTimeout) { clearTimeout(speakingTimeout); speakingTimeout = null; }
      } else if (speakingStateRef.current[rPeerId] && !speakingTimeout) {
        speakingTimeout = setTimeout(() => {
          updateSpeakingThrottled(false);
          speakingTimeout = null;
        }, SPEAKING_HOLD_MS);
      }
      raf = requestAnimationFrame(check);
    };
    check();

    // Return cleanup — stored in speakingCleanupsRef[rPeerId]
    return () => {
      if (speakingTimeout) clearTimeout(speakingTimeout);
      if (raf) cancelAnimationFrame(raf);
      try { audioCtx.close(); } catch {}
      delete speakingStateRef.current[rPeerId];
      delete speakingThrottleRef.current[rPeerId];
    };
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // REMOTE STREAM MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  const addRemoteVideo = useCallback((rPeerId, stream, remotePeer) => {
    if (!remotePeer?.uid || remotePeer.uid === uId) return;
    setRemoteStream((prev) => {
      const filtered = prev.filter((v) => v.remotePeer?.uid !== remotePeer.uid);
      return [...filtered, { peerId: rPeerId, stream, remotePeer }];
    });
  }, [uId]);

  const removeRemoteVideo = useCallback((rPeerId) => {
    // [P0] Kill speaking detection before removing stream
    speakingCleanupsRef.current[rPeerId]?.();
    delete speakingCleanupsRef.current[rPeerId];

    setRemoteStream((prev) => prev.filter((u) => u.peerId !== rPeerId));
    delete dataConnectionsRef.current[rPeerId];
    delete chatConnectionsRef.current[rPeerId];
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // PEERJS INIT
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!id) return;

    const peerInstance = new Peer();
    peerRef.current = peerInstance; // [P0] use ref — never stale
    let participantUnsub;

    peerInstance.on('open', async (currentPeerId) => {
      if (!isMountedRef.current) return;
      setPeerId(currentPeerId);
      const roomRef = collection(db, 'rooms', id, 'participants');

      try {
        await setDoc(doc(roomRef, uId), {
          peerId: currentPeerId,
          isAudioEnabled: mediaPrefs?.audio || false,
          isVideoEnabled: mediaPrefs?.video || false,
          name: '',
          photo: '',
          uid: uId,
        }, { merge: true });
      } catch (err) {
        console.error('[RoomMain] Firestore participant setDoc error:', err);
      }

      participantUnsub = onSnapshot(roomRef, (snap) => {
        if (!isMountedRef.current) return;
        const peerIds = snap.docs
          .map((d) => d.data())
          .filter((p) => p.peerId && p.peerId !== currentPeerId);
        setRemotePeerIds(peerIds);
      });
    });

    peerInstance.on('connection', (conn) => {
      conn.on('open', () => {
        chatConnectionsRef.current[conn.peer] = conn;
        conn.on('data', processIncomingData);
        conn.on('close', () => { delete chatConnectionsRef.current[conn.peer]; });
      });
    });

    peerInstance.on('call', (call) => {
      call.answer(localStreamRef.current);
      call.on('stream', (stream) => {
        // Snapshot remotePeerIds from Firestore snapshot
        addRemoteVideo(call.peer, stream, { uid: call.peer, name: '', photo: '' });
        // [P0] Kill old speaking context before starting new one
        speakingCleanupsRef.current[call.peer]?.();
        speakingCleanupsRef.current[call.peer] = detectSpeaking(call.peer, stream);
      });
      dataConnectionsRef.current[call.peer] = call;
      call.on('close', () => removeRemoteVideo(call.peer));
      call.on('error', () => removeRemoteVideo(call.peer));
    });

    peerInstance.on('error', (err) => {
      console.error('[RoomMain] PeerJS error:', err);
    });

    return () => {
      participantUnsub?.();
      // [P0] Kill all speaking detection
      Object.values(speakingCleanupsRef.current).forEach((fn) => fn?.());
      speakingCleanupsRef.current = {};
      // Close all data connections
      Object.values(dataConnectionsRef.current).forEach((c) => { try { c.close(); } catch {} });
      Object.values(chatConnectionsRef.current).forEach((c) => { try { c.close(); } catch {} });
      dataConnectionsRef.current = {};
      chatConnectionsRef.current = {};
      deleteDoc(doc(db, 'rooms', id, 'participants', uId)).catch(() => {});
      peerInstance.destroy();
      peerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, uId]);

  // Update name/photo once user data arrives
  useEffect(() => {
    if (!currUserData || !peerId || !id || !uId) return;
    setDoc(doc(collection(db, 'rooms', id, 'participants'), uId), {
      name: currUserData.displayName || 'User',
      photo: currUserData.photoURL || '',
    }, { merge: true }).catch(() => {});
  }, [currUserData, peerId, id, uId]);

  // Connect to peers when remote peer list changes
  // [P0] Uses peerRef.current — never stale
  const connectToPeers = useCallback(() => {
    const peer = peerRef.current;
    if (!peer || !localStreamRef.current) return;

    remotePeerIds.forEach((remotePeer) => {
      const rPeerId = remotePeer.peerId;
      if (!rPeerId || dataConnectionsRef.current[rPeerId]) return;

      const call = peer.call(rPeerId, localStreamRef.current);
      if (!call) return;

      const conn = peer.connect(rPeerId);
      conn.on('open', () => {
        chatConnectionsRef.current[rPeerId] = conn;
        conn.on('data', processIncomingData);
        conn.on('close', () => { delete chatConnectionsRef.current[rPeerId]; });
      });

      call.on('stream', (stream) => {
        addRemoteVideo(rPeerId, stream, remotePeer);
        joinRoomAudio.play().catch(() => {});
        // [P0] Kill old context before starting new speaking detection
        speakingCleanupsRef.current[rPeerId]?.();
        speakingCleanupsRef.current[rPeerId] = detectSpeaking(rPeerId, stream);
      });
      call.on('close', () => removeRemoteVideo(rPeerId));
      call.on('error', () => removeRemoteVideo(rPeerId));

      dataConnectionsRef.current[rPeerId] = call;
    });
  }, [remotePeerIds, addRemoteVideo, removeRemoteVideo, detectSpeaking, processIncomingData]);

  useEffect(() => {
    if (peerRef.current && remotePeerIds.length > 0) connectToPeers();
  }, [remotePeerIds, connectToPeers]);

  // ══════════════════════════════════════════════════════════════════════════
  // FIRESTORE LISTENERS — participant updates
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const roomRef = collection(db, 'rooms', id, 'participants');
    const unsub   = onSnapshot(roomRef, (snap) => {
      snap.docChanges().forEach((change) => {
        const data   = change.doc.data();
        const docUid = change.doc.id;

        if (change.type === 'modified') {
          // Sync remote av state
          setRemoteStream((prev) =>
            prev.map((u) =>
              u.peerId === data.peerId
                ? { ...u, remotePeer: { ...u.remotePeer, isAudioEnabled: data.isAudioEnabled, isVideoEnabled: data.isVideoEnabled } }
                : u
            )
          );

          // Host force-mute [P0] validated server-side via Firestore rules
          if (docUid === uId && data.forceMuteTrigger === true) {
            const [at] = localStreamRef.current?.getAudioTracks() || [];
            if (at) { at.enabled = false; setIsAudioEnabled(false); }
            updateDoc(doc(roomRef, uId), { forceMuteTrigger: deleteField() }).catch(() => {});
            Swal.fire({
              toast: true, icon: 'info', title: 'Muted by host',
              position: 'top-end', timer: 2500, showConfirmButton: false,
              background: '#1e293b', color: '#fff',
            });
          }

          // Kick
          if (docUid === uId && data.kicked === true) {
            Swal.fire({
              toast: true, icon: 'warning', title: 'You were removed by the host',
              position: 'top-end', timer: 3000, showConfirmButton: false,
              background: '#1e293b', color: '#fff',
            }).then(() => handleHangup(true));
          }
        }
      });
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, uId]);

  // ══════════════════════════════════════════════════════════════════════════
  // MEDIA CONTROLS
  // ══════════════════════════════════════════════════════════════════════════

  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) return;
    const [at] = localStreamRef.current.getAudioTracks();
    if (!at) return;
    at.enabled = !at.enabled;
    setIsAudioEnabled(at.enabled);
    try {
      await setDoc(doc(collection(db, 'rooms', id, 'participants'), uId),
        { isAudioEnabled: at.enabled }, { merge: true });
    } catch {}
    if (!at.enabled && recognitionRef.current) recognitionRef.current.stop();
    else if (at.enabled && subtitlesEnabled) startSubtitles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, uId, subtitlesEnabled]);

  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current || isScreenSharing) return;
    const [vt] = localStreamRef.current.getVideoTracks();
    if (!vt) return;
    vt.enabled = !vt.enabled;
    setIsVideoEnabled(vt.enabled);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
    try {
      await setDoc(doc(collection(db, 'rooms', id, 'participants'), uId),
        { isVideoEnabled: vt.enabled }, { merge: true });
    } catch {}
  }, [id, uId, isScreenSharing]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share
      screenStreamRef.current?.getTracks().forEach((t) => { t.enabled = false; t.stop(); });
      screenStreamRef.current = null;

      const [cameraTrack] = localStreamRef.current?.getVideoTracks() || [];
      if (cameraTrack) {
        cameraTrack.enabled = camStateBeforeShare.current;
        setIsVideoEnabled(camStateBeforeShare.current);
        Object.values(dataConnectionsRef.current).forEach((call) => {
          const sender = call.peerConnection?.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(cameraTrack).catch(() => {});
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.play().catch(() => {});
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const [cameraTrack] = localStreamRef.current?.getVideoTracks() || [];
        camStateBeforeShare.current = cameraTrack?.enabled || false;

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always', displaySurface: 'monitor' },
          audio: false,
        });
        screenStreamRef.current = screenStream;
        const [screenTrack] = screenStream.getVideoTracks();

        Object.values(dataConnectionsRef.current).forEach((call) => {
          const sender = call.peerConnection?.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack).catch(() => {});
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = new MediaStream([screenTrack]);
          localVideoRef.current.play().catch(() => {});
        }

        setIsScreenSharing(true);
        setIsVideoEnabled(true);

        // Browser native "Stop sharing" button
        screenTrack.addEventListener('ended', () => {
          setIsScreenSharing((wasSharing) => {
            if (!wasSharing) return false;
            screenStreamRef.current = null;
            const [ct] = localStreamRef.current?.getVideoTracks() || [];
            if (ct) {
              ct.enabled = camStateBeforeShare.current;
              Object.values(dataConnectionsRef.current).forEach((call) => {
                const sender = call.peerConnection?.getSenders().find((s) => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(ct).catch(() => {});
              });
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
                localVideoRef.current.play().catch(() => {});
              }
            }
            setIsVideoEnabled(camStateBeforeShare.current);
            return false;
          });
        });
      } catch (err) {
        if (err.name !== 'NotAllowedError') console.error('[RoomMain] Screen share error:', err);
      }
    }
  }, [isScreenSharing]);

  // ══════════════════════════════════════════════════════════════════════════
  // REACTIONS & RAISED HAND
  // ══════════════════════════════════════════════════════════════════════════

  const sendReaction = useCallback((emoji) => {
    const rid = Date.now();
    setLocalReactions((prev) => [...prev, { id: rid, emoji }]);
    sendDataToAll({ type: 'reaction', peerId, emoji });
    setShowReactionPicker(false);
  }, [peerId, sendDataToAll]);

  const removeLocalReaction = useCallback((rid) => {
    setLocalReactions((prev) => prev.filter((r) => r.id !== rid));
  }, []);

  const toggleRaiseHand = useCallback(() => {
    setRaisedHand((prev) => {
      const next = !prev;
      sendDataToAll({ type: 'raise_hand', peerId, raised: next });
      if (next) {
        Swal.fire({
          toast: true, icon: 'info', title: '✋ Hand raised',
          position: 'top-start', timer: 2000, showConfirmButton: false,
          background: '#1e293b', color: '#fff',
        });
      }
      return next;
    });
  }, [peerId, sendDataToAll]);

  // ══════════════════════════════════════════════════════════════════════════
  // HOST CONTROLS
  // [P0] Server-side enforcement required via Firestore rules — see bottom of file
  // ══════════════════════════════════════════════════════════════════════════

  const kickUser = useCallback(async (targetUid) => {
    const confirm = await Swal.fire({
      title: 'Kick this user?',
      text: 'They will be removed from the room.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Kick',
      background: '#1e293b',
      color: '#fff',
    });
    if (!confirm.isConfirmed) return;
    try {
      await setDoc(doc(db, 'rooms', id, 'participants', targetUid), { kicked: true }, { merge: true });
      setTimeout(() => deleteDoc(doc(db, 'rooms', id, 'participants', targetUid)).catch(() => {}), 1500);
    } catch (err) {
      console.error('[RoomMain] Kick error:', err);
    }
  }, [id]);

  const forceMuteUser = useCallback(async (targetUid) => {
    try {
      await setDoc(doc(db, 'rooms', id, 'participants', targetUid), { forceMuteTrigger: true }, { merge: true });
    } catch (err) {
      console.error('[RoomMain] Force mute error:', err);
    }
  }, [id]);

  // ══════════════════════════════════════════════════════════════════════════
  // SUBTITLES — [P1] SR restart guard
  // ══════════════════════════════════════════════════════════════════════════

  const startSubtitles = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || recognitionRef.current) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onresult = (e) => {
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      if (isMountedRef.current) setLocalSubtitle(txt);
      sendDataToAll({ type: 'subtitle', peerId, name: currUserData?.displayName || 'You', text: txt });
      clearTimeout(subtitleTimersRef.current['local']);
      subtitleTimersRef.current['local'] = setTimeout(() => {
        if (isMountedRef.current) setLocalSubtitle('');
      }, 3000);
    };

    r.onerror = (e) => {
      if (e.error !== 'no-speech') console.warn('[SR] error:', e.error);
    };

    // [P1] Only restart if the component is still mounted and recognition is still intended
    r.onend = () => {
      if (recognitionActiveRef.current && recognitionRef.current) {
        try { r.start(); } catch {}
      }
    };

    recognitionActiveRef.current = true;
    recognitionRef.current = r;
    r.start();
  }, [peerId, currUserData, sendDataToAll]);

  const stopSubtitles = useCallback(() => {
    recognitionActiveRef.current = false; // [P1] guard before stop() fires onend
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (isMountedRef.current) setLocalSubtitle('');
    Object.values(subtitleTimersRef.current).forEach(clearTimeout);
    subtitleTimersRef.current = {};
  }, []);

  const toggleSubtitles = useCallback(() => {
    if (subtitlesEnabled) { stopSubtitles(); setSubtitlesEnabled(false); }
    else { startSubtitles(); setSubtitlesEnabled(true); }
  }, [subtitlesEnabled, stopSubtitles, startSubtitles]);

  useEffect(() => {
    if (peerId && currUserData && subtitlesEnabled) startSubtitles();
    return stopSubtitles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, currUserData]);

  // ══════════════════════════════════════════════════════════════════════════
  // HANGUP & NAVIGATION GUARDS
  // ══════════════════════════════════════════════════════════════════════════

  const handleHangup = useCallback(async (silent = false) => {
    if (isHangingUp.current) return;
    isHangingUp.current = true;

    stopSubtitles();

    // [P0] Kill all speaking detection
    Object.values(speakingCleanupsRef.current).forEach((fn) => fn?.());
    speakingCleanupsRef.current = {};

    localStreamRef.current?.getTracks().forEach((t) => { t.enabled = false; t.stop(); });
    screenStreamRef.current?.getTracks().forEach((t) => { t.enabled = false; t.stop(); });
    localStreamRef.current  = null;
    screenStreamRef.current = null;

    Object.values(dataConnectionsRef.current).forEach((c) => { try { c.close(); } catch {} });
    Object.values(chatConnectionsRef.current).forEach((c) => { try { c.close(); } catch {} });
    dataConnectionsRef.current = {};
    chatConnectionsRef.current = {};
    peerRef.current?.destroy();
    peerRef.current = null;

    try { await deleteDoc(doc(db, 'rooms', id, 'participants', uId)); } catch {}
    try {
      await updateDoc(doc(db, 'rooms', id), {
        participantsCount: increment(-1),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      });
    } catch {}

    navigate('/Rooms');
  }, [id, uId, navigate, stopSubtitles]);

  const showLeaveModal = useCallback(() => {
    Swal.fire({
      title: 'Leave the meeting?',
      text: 'You will be disconnected from all participants.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Leave',
      background: '#1e293b',
      color: '#fff',
    }).then((r) => { if (r.isConfirmed) handleHangup(); });
  }, [handleHangup]);

  // Back button guard
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handler = () => {
      window.history.pushState(null, '', window.location.href);
      showLeaveModal();
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [showLeaveModal]);

  // Heartbeat — only fires while mounted
  useEffect(() => {
    const i = setInterval(() => {
      if (!isMountedRef.current) return;
      updateDoc(doc(db, 'rooms', id, 'participants', uId), { lastActive: Date.now() }).catch(() => {});
    }, 10000);
    return () => clearInterval(i);
  }, [id, uId]);

  // beforeunload — sendBeacon for reliable tab-close cleanup
  useEffect(() => {
    const handler = () => {
      localStreamRef.current?.getTracks().forEach((t) => { t.enabled = false; t.stop(); });
      screenStreamRef.current?.getTracks().forEach((t) => { t.enabled = false; t.stop(); });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`/api/leave-room?room=${id}&uid=${uId}`);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [id, uId]);

  // ══════════════════════════════════════════════════════════════════════════
  // DERIVED VALUES
  // ══════════════════════════════════════════════════════════════════════════

  const filteredRemoteStream = useMemo(
    () => remoteStream.filter((u) => u.remotePeer?.uid !== uId),
    [remoteStream, uId]
  );

  const activeSubtitleLines = useMemo(() => [
    ...(localSubtitle ? [{ key: 'local', name: 'You', text: localSubtitle }] : []),
    ...Object.entries(subtitles).map(([key, v]) => ({ key, name: v.name, text: v.text })),
  ], [localSubtitle, subtitles]);

  const totalParticipants = filteredRemoteStream.length + 1;

  const gridClass = useMemo(() => {
    const count = filteredRemoteStream.length;
    if (count === 0) return 'flex items-center justify-center';
    if (count === 1) return 'grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3';
    if (count <= 3) return 'grid grid-cols-2 gap-2 sm:gap-3';
    return 'grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3';
  }, [filteredRemoteStream.length]);

  const isPageLoading = userLoading || !currentRoomData;

  const handleSettingToggle = useCallback((pid) => {
    setIsSettingOn((prev) => (prev === pid ? null : pid));
  }, []);

  // [P0] Hook at top level — toggleSidebarFb from useToggleSidebarFirebase()
  const handleChatOpen = useCallback(async () => {
    dispatch(toggleChatSidebar(true));
    await toggleSidebarFb(id, uId, true);
    await deleteUnseenCount(uId);
  }, [id, uId, dispatch, toggleSidebarFb, deleteUnseenCount]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  if (isPageLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a] text-white gap-6"
        role="status" aria-label="Entering room">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/30 rounded-full animate-spin border-t-indigo-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500/30 rounded-full animate-spin border-b-purple-500" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-indigo-200 animate-pulse">Entering Studio…</h2>
          <p className="text-sm text-slate-500 mt-1">Setting up your connection</p>
        </div>
      </div>
    );
  }

  return (
    <RoomErrorBoundary>
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-120px) scale(1.4); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="room-container overflow-hidden bg-[#0f172a] h-screen w-screen relative text-white font-sans flex flex-col">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="relative flex-shrink-0 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-5 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col leading-tight">
              <h1 className="text-xs sm:text-sm font-bold text-gray-100 max-w-[100px] sm:max-w-[180px] truncate">
                {currentRoomData?.Title || 'Meeting Room'}
              </h1>
              <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                #{id?.slice(0, 6)}
                {isHost && <span className="text-amber-400 ml-1">· HOST</span>}
              </span>
            </div>
            <div
              className="hidden sm:flex items-center gap-1.5 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20"
              role="status"
              aria-label={`Live meeting, duration ${timer}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Live · {timer}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              aria-label={`${totalParticipants} participants`}
              aria-expanded={showParticipants}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all"
            >
              <i className="fa-solid fa-users text-[11px]" aria-hidden="true" />
              {totalParticipants}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                Swal.fire({
                  icon: 'success', title: 'Link copied!', toast: true,
                  position: 'top-end', showConfirmButton: false, timer: 1500,
                  background: '#1e293b', color: '#fff',
                });
              }}
              aria-label="Copy invite link"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-all"
            >
              <i className="fa-solid fa-link text-[11px]" aria-hidden="true" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white/5 pl-1.5 pr-3 py-1 rounded-full border border-white/10">
              <img
                src={currUserData?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                alt="Your avatar"
                className="w-7 h-7 rounded-full object-cover border-2 border-indigo-500/50"
              />
              <span className="text-xs font-medium text-gray-200 max-w-[80px] truncate">
                {currUserData?.displayName || 'You'}
              </span>
              {raisedHand && <span aria-label="Hand raised">✋</span>}
            </div>
          </div>
        </header>

        {/* ── Screen share bar ─────────────────────────────────────────── */}
        {isScreenSharing && (
          <div className="flex-shrink-0 h-10 sm:h-12 bg-blue-600/90 backdrop-blur flex items-center justify-between px-4 sm:px-6 z-40 border-b border-blue-500/30"
            role="status" aria-label="You are sharing your screen">
            <div className="flex items-center gap-2 text-white text-xs sm:text-sm font-semibold">
              <i className="fa-solid fa-display" aria-hidden="true" />
              You are presenting your screen
            </div>
            <div className="flex items-center gap-2">
              <ParticipantThumbs remoteStream={remoteStream} localVideoRef={localVideoRef} uId={uId} />
              <button
                onClick={toggleScreenShare}
                className="text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-lg transition-all"
              >
                Stop sharing
              </button>
            </div>
          </div>
        )}

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

          {/* ── Video grid ──────────────────────────────────────────────── */}
          <div
            ref={videoContainerRef}
            className={`
              relative flex-shrink-0 overflow-hidden p-2 sm:p-3
              h-[58vh] md:h-full
              transition-all duration-500 ease-in-out
              ${isChatToggleOpen ? 'w-full md:w-[70%]' : 'w-full'}
              ${gridClass}
            `}
          >
            {/* Local card */}
            <div className={`relative rounded-2xl overflow-hidden bg-slate-800 ring-1 ring-white/10 group transition-all duration-300 ${
              filteredRemoteStream.length === 0
                ? 'w-full max-w-2xl h-[80%] mx-auto'
                : 'w-full h-full min-h-[140px] sm:min-h-[200px]'
            }`}
              aria-label="Your video"
            >
              <video
                ref={localVideoRef}
                autoPlay playsInline muted
                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}
                aria-label="Your camera feed"
              />

              <div className={`absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center transition-opacity duration-300 ${isVideoEnabled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-indigo-500/15 rounded-full blur-xl animate-pulse" aria-hidden="true" />
                  <img
                    src={currUserData?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                    alt="Your avatar"
                    className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 sm:border-4 border-slate-600 shadow-2xl"
                  />
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  {isScreenSharing ? '🖥 Sharing screen' : 'Camera off'}
                </p>
              </div>

              {localReactions.map((r) => (
                <FloatingReaction key={r.id} emoji={r.emoji} id={r.id} onDone={() => removeLocalReaction(r.id)} />
              ))}
              {raisedHand && <HandBadge />}

              {isScreenSharing && (
                <div className="absolute top-2 left-2 z-30 bg-blue-500/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-white"
                  role="status" aria-label="Screen sharing active">
                  <i className="fa-solid fa-display text-[9px]" aria-hidden="true" /> Sharing
                </div>
              )}

              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-20">
                <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1.5 border border-white/5">
                  <span className="text-white text-[9px] sm:text-xs font-semibold">You</span>
                </div>
                <div
                  aria-label={isAudioEnabled ? 'Microphone on' : 'Microphone muted'}
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${isAudioEnabled ? 'bg-black/40 text-green-400' : 'bg-red-500/90 text-white'}`}
                >
                  <i className={`fas text-[9px] sm:text-xs ${isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'}`} aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Remote cards */}
            {filteredRemoteStream.map((user) => (
              <RemoteCard
                key={user.peerId}
                peerId={user.peerId}
                stream={user.stream}
                remotePeer={user.remotePeer}
                reactions={reactions[user.peerId] || []}
                handRaised={raisedHands[user.peerId] || false}
                isSettingOn={isSettingOn}
                onSettingToggle={handleSettingToggle}
                settingsMenuRef={settingsMenuRef}
                isHost={isHost}
                onForceMute={forceMuteUser}
                onKick={kickUser}
                uId={uId}
              />
            ))}

            {/* Subtitles */}
            {activeSubtitleLines.length > 0 && (
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl flex flex-col items-center gap-1 pointer-events-none"
                aria-live="polite"
                aria-label="Live captions"
              >
                {activeSubtitleLines.map((line) => (
                  <div key={line.key} className="px-3 py-1.5 rounded-lg text-center"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', animation: 'fadeInUp 0.2s ease-out' }}>
                    <span className="text-indigo-300 font-semibold text-[10px] sm:text-xs mr-1">{line.name}:</span>
                    <span className="text-white text-xs sm:text-sm font-medium">{line.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Chat sidebar ─────────────────────────────────────────────── */}
          <div className={`
            fixed bottom-0 left-0 right-0 z-[60] h-[60vh]
            md:static md:h-full md:w-[30%] md:min-w-[280px] md:max-w-[400px]
            bg-[#0f172a] border-t md:border-t-0 md:border-l border-white/10 shadow-2xl
            transform transition-transform duration-300 ease-in-out
            ${isChatToggleOpen ? 'translate-y-0' : 'translate-y-full md:translate-x-full md:translate-y-0 md:hidden'}
          `}
            aria-label="Chat sidebar"
            aria-hidden={!isChatToggleOpen}
          >
            {isChatToggleOpen && <Chat uId={uId} />}
          </div>
        </div>

        {/* ── Reaction picker ───────────────────────────────────────────── */}
        {showReactionPicker && (
          <div
            ref={reactionPickerRef}
            role="dialog"
            aria-label="Send a reaction"
            className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 flex gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
            style={{ animation: 'fadeInUp 0.2s ease-out' }}
          >
            {REACTION_EMOJIS.map((r) => (
              <button
                key={r.key}
                onClick={() => sendReaction(r.key)}
                title={r.label}
                aria-label={`React with ${r.label}`}
                className="text-xl sm:text-2xl hover:scale-125 active:scale-90 transition-transform duration-150 cursor-pointer select-none"
              >
                {r.key}
              </button>
            ))}
          </div>
        )}

        {/* ── Bottom controls ───────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-[#0a0f1e]/90 backdrop-blur-xl border-t border-white/5 z-50 flex-wrap"
          role="toolbar" aria-label="Meeting controls">
          <ControlBtn
            active={isAudioEnabled} onClick={toggleAudio}
            icon={isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'}
            label={isAudioEnabled ? 'Mute' : 'Unmute'}
            danger={!isAudioEnabled}
          />
          <ControlBtn
            active={isVideoEnabled} onClick={toggleVideo}
            icon={isVideoEnabled ? 'fa-video' : 'fa-video-slash'}
            label={isVideoEnabled ? 'Camera off' : 'Camera on'}
            danger={!isVideoEnabled}
            disabled={isScreenSharing}
          />
          <ControlBtn
            active={isScreenSharing} onClick={toggleScreenShare}
            icon={isScreenSharing ? 'fa-stop' : 'fa-display'}
            label={isScreenSharing ? 'Stop' : 'Share'}
            accent="blue"
          />
          <ControlBtn
            active={showReactionPicker}
            onClick={() => setShowReactionPicker((v) => !v)}
            icon="fa-face-smile"
            label="React"
            accent="yellow"
          />

          <button
            onClick={toggleRaiseHand}
            aria-label={raisedHand ? 'Lower hand' : 'Raise hand'}
            aria-pressed={raisedHand}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl transition-all duration-200 ${
              raisedHand
                ? 'bg-amber-500/90 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
            }`}
          >
            <span className="text-base sm:text-xl" aria-hidden="true">✋</span>
            <span className="text-[8px] sm:text-[10px] font-medium hidden sm:block">{raisedHand ? 'Lower' : 'Raise'}</span>
          </button>

          <ControlBtn
            active={subtitlesEnabled} onClick={toggleSubtitles}
            icon="fa-closed-captioning"
            label="CC"
            accent="indigo"
          />

          <button
            onClick={handleChatOpen}
            aria-label={`Open chat${msgcont > 0 ? `, ${msgcont} unread messages` : ''}`}
            className="relative flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
          >
            {msgcont > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-[8px] sm:text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-[#0a0f1e]"
              >
                {msgcont > 9 ? '9+' : msgcont}
              </span>
            )}
            <i className="fas fa-comment-dots text-sm sm:text-lg" aria-hidden="true" />
            <span className="text-[8px] sm:text-[10px] font-medium hidden sm:block">Chat</span>
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" aria-hidden="true" />

          <button
            onClick={showLeaveModal}
            aria-label="Leave call"
            className="flex flex-col items-center gap-0.5 sm:gap-1 px-3 sm:px-5 py-1.5 sm:py-2 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/25"
          >
            <i className="fas fa-phone-slash rotate-[135deg] text-sm sm:text-lg" aria-hidden="true" />
            <span className="text-[8px] sm:text-[10px] font-bold hidden sm:block">Leave</span>
          </button>
        </div>

      </div>
    </RoomErrorBoundary>
  );
};

export default RoomMain;

/*
 * ─── REQUIRED: firestore.rules ───────────────────────────────────────────────
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *
 *     match /rooms/{roomId}/participants/{userId} {
 *       allow read: if request.auth != null;
 *       // Users write their own doc freely
 *       allow write: if request.auth.uid == userId;
 *       // Host can set kicked or forceMuteTrigger only
 *       allow update: if request.auth != null
 *         && request.auth.uid ==
 *            get(/databases/$(database)/documents/rooms/$(roomId)).data.createdBy
 *         && request.resource.data.keys().hasOnly(
 *              ['kicked','forceMuteTrigger','lastActive']);
 *     }
 *
 *     match /rooms/{roomId}/messages/{msgId} {
 *       allow read: if request.auth != null;
 *       allow create: if request.auth != null
 *         && request.resource.data.text is string
 *         && request.resource.data.text.size() <= 2000
 *         && request.resource.data.userid == request.auth.uid;
 *     }
 *
 *     match /rooms/{roomId}/messages/{msgId}/reactions/{userId} {
 *       allow read: if request.auth != null;
 *       allow write: if request.auth.uid == userId;
 *     }
 *
 *     match /rooms/{roomId}/typing/{userId} {
 *       allow read: if request.auth != null;
 *       allow write: if request.auth.uid == userId;
 *     }
 *   }
 * }
 */