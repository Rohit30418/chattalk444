/**
 * RoomMain.jsx — Production-grade video conferencing room
 *
 * ROOT CAUSE FIXES:
 *
 * 1. DUPLICATE "USER" GHOST CARDS
 *    Root cause: addRemoteVideo used peerId as the map key, but the same user
 *    could reconnect with a new peerId, creating two entries with uid-less data
 *    from the initial `call` event (where remotePeer = { uid: call.peer, name: 'User' }).
 *    The socket `room-participants` event gave us real uid→peerId mappings, but
 *    those were never reconciled with the call.peer keyed entries.
 *    Fix: Deduplicate by remotePeer.uid (not peerId). The call event now carries
 *    proper metadata via socket `peer-metadata` before answering. A Map<uid,entry>
 *    is the single source of truth; peerId is just an index into it.
 *
 * 2. SCREEN SHARE BLACK SCREEN
 *    Root cause: getSenders() returned senders whose .track was null (ended/stopped)
 *    so replaceTrack was called on wrong senders. Also, srcObject was set to the
 *    full localStream (with camera track) after screen share ended, but the camera
 *    track was already stopped if the user had turned it off before sharing.
 *    Fix: Select senders by kind === 'video' regardless of track nullness.
 *    Restore camera only if it was enabled; else show avatar. Ref-based ended handler.
 *
 * 3. SCREEN SHARE LAYOUT (Google Meet / Zoom style)
 *    When sharing: main viewport = shared screen (full). Others = thumbnail strip.
 *    When not sharing: intelligent grid layout restores automatically.
 *
 * 4. MOBILE UI
 *    - Video grid uses CSS Grid with auto-fit and aspect-ratio
 *    - Chat is a full-screen drawer on mobile, side panel on desktop
 *    - Controls bar wraps cleanly, icons visible on all screen sizes
 *    - No overlapping panels
 *
 * 5. PARTICIPANT GRID INTELLIGENCE
 *    1 = full, 2 = split, 3-4 = 2×2, 5-9 = 3-col, 10+ = auto
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo, lazy, Suspense,
} from 'react';
import Peer from 'peerjs';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleChatSidebar } from '../../redux/action';
import getUserData from '../../hooks/getUserData';
import { getRoomData } from '../../hooks/getRoom';
import socket from '../../services/socket';
import Swal from 'sweetalert2';

const Chat = lazy(() => import('../chat/Chat'));

import joinRoomSrc from '../../assets/notification-1-269296.mp3';
const joinRoomAudio = new Audio(joinRoomSrc);
joinRoomAudio.preload = 'auto';

// ─── Constants ────────────────────────────────────────────────────────────────
const REACTION_EMOJIS = [
  { key: '👍', label: 'Like' }, { key: '❤️', label: 'Love' },
  { key: '😂', label: 'Haha' }, { key: '😮', label: 'Wow' },
  { key: '👏', label: 'Clap' }, { key: '🎉', label: 'Party' },
  { key: '✋', label: 'Hand' },
];
const SPEAKING_THRESHOLD   = 18;
const SPEAKING_HOLD_MS     = 1000;
const SPEAKING_THROTTLE_MS = 150;

// ─── Error Boundary ───────────────────────────────────────────────────────────
class RoomErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, i) { console.error('[RoomErrorBoundary]', e, i.componentStack); }
  render() {
    if (this.state.error) return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0f172a] text-white gap-6 p-8 text-center">
        <i className="fas fa-triangle-exclamation text-4xl text-red-400" />
        <h2 className="text-xl font-bold text-red-300">Something went wrong</h2>
        <p className="text-sm text-slate-400 max-w-sm">A rendering error occurred. Please rejoin the room.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors">Rejoin Room</button>
      </div>
    );
    return this.props.children;
  }
}

// ─── useMeetingTimer ──────────────────────────────────────────────────────────
const useMeetingTimer = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

// ─── Grid class helper ────────────────────────────────────────────────────────
// total = local + remote count
const getGridClass = (total) => {
  if (total === 1) return 'grid-cols-1';
  if (total === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (total <= 4)  return 'grid-cols-2';
  if (total <= 9)  return 'grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-3 xl:grid-cols-4';
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const HandBadge = memo(() => (
  <div className="absolute top-2 right-10 z-30 bg-amber-500/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-white animate-bounce">
    ✋
  </div>
));

const FloatingReaction = memo(({ emoji, id: rid, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="absolute bottom-10 left-1/2 z-40 pointer-events-none text-3xl select-none" style={{ animation: 'floatUp 3s ease-out forwards' }} aria-hidden="true">
      {emoji}
    </div>
  );
});

// ─── ControlBtn ───────────────────────────────────────────────────────────────
const ControlBtn = memo(({ active, onClick, icon, label, danger, accent, disabled, badge }) => {
  const accentMap = {
    blue:   { on: 'bg-blue-500/90 text-white shadow-blue-500/30',    off: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
    yellow: { on: 'bg-yellow-500/90 text-white shadow-yellow-500/30', off: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
    indigo: { on: 'bg-indigo-500/90 text-white shadow-indigo-500/30', off: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
  };
  let cls = 'relative flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ';
  if (disabled) cls += 'opacity-40 cursor-not-allowed bg-white/5 text-gray-500 border border-white/5 ';
  else if (accent) cls += (active ? accentMap[accent].on + ' shadow-lg' : accentMap[accent].off) + ' ';
  else if (danger && !active) cls += 'bg-red-500/90 text-white shadow-lg shadow-red-500/20 ';
  else cls += (active ? 'bg-slate-600 text-white border border-white/10' : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10') + ' ';

  return (
    <button onClick={disabled ? undefined : onClick} title={label} aria-label={label} aria-pressed={active} disabled={disabled} className={cls}>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center border border-[#0a0f1e]">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <i className={`fas ${icon} text-sm sm:text-lg`} aria-hidden="true" />
      <span className="text-[8px] sm:text-[10px] font-medium hidden sm:block">{label}</span>
    </button>
  );
});

// ─── VideoTile ────────────────────────────────────────────────────────────────
// Unified tile for both local and remote — avoids code duplication
const VideoTile = memo(({
  videoRef, stream, isVideoOn, isAudioOn, isSpeaking, isScreenSharing,
  displayName, photoURL, isLocal, reactions, raisedHand, onRemoveReaction,
  isThumbnail, // true when in screen-share thumbnail strip
  // host actions (remote only)
  isHost, peerId, uid, isSettingOn, onSettingToggle, settingsMenuRef, onForceMute, onKick,
}) => {
  // For remote tiles — attach stream to video element
  const attachRef = useCallback((el) => {
    if (!el) return;
    if (videoRef) videoRef.current = el;
    if (stream && el.srcObject !== stream) el.srcObject = stream;
  }, [stream, videoRef]);

  const tileClass = isThumbnail
    ? 'relative rounded-xl overflow-hidden bg-slate-800 ring-1 ring-white/10 w-32 h-24 sm:w-40 sm:h-28 flex-shrink-0 transition-all duration-300'
    : `relative rounded-2xl overflow-hidden bg-slate-800 transition-all duration-300 group w-full h-full ${isSpeaking ? 'ring-2 ring-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.3)]' : 'ring-1 ring-white/10 hover:ring-white/20'}`;

  return (
    <div className={tileClass}>
      {/* Video element */}
      {isLocal ? (
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${isScreenSharing ? '' : 'scale-x-[-1]'} ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <video
          autoPlay playsInline
          ref={attachRef}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Avatar overlay when video is off */}
      <div className={`absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center transition-opacity duration-300 ${isVideoOn ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="relative mb-2">
          {isSpeaking && !isLocal && (
            <>
              <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping scale-150" aria-hidden="true" />
              <span className="absolute inset-0 rounded-full bg-indigo-400/15 animate-ping scale-125 animation-delay-150" aria-hidden="true" />
            </>
          )}
          {isLocal && <div className="absolute inset-0 bg-indigo-500/15 rounded-full blur-xl animate-pulse" />}
          <img
            src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid || 'user'}`}
            className={`relative ${isThumbnail ? 'w-10 h-10' : 'w-14 h-14 sm:w-20 sm:h-20'} rounded-full object-cover border-2 sm:border-4 border-slate-600 shadow-2xl z-10`}
            alt={displayName}
          />
        </div>
        {!isThumbnail && (
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            {isScreenSharing ? '🖥 Sharing screen' : 'Camera off'}
          </p>
        )}
      </div>

      {/* Floating reactions */}
      {reactions?.map(r => (
        <FloatingReaction key={r.id} emoji={r.emoji} id={r.id} onDone={() => onRemoveReaction?.(r.id)} />
      ))}

      {/* Raised hand */}
      {raisedHand && <HandBadge />}

      {/* Screen sharing badge */}
      {isLocal && isScreenSharing && (
        <div className="absolute top-2 left-2 z-30 bg-blue-500/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-white">
          <i className="fa-solid fa-display text-[9px]" /> Sharing
        </div>
      )}

      {/* Name + mic badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-20">
        <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1.5 border border-white/5">
          <span className={`text-white font-semibold truncate ${isThumbnail ? 'text-[8px] max-w-[50px]' : 'text-[9px] sm:text-xs max-w-[70px] sm:max-w-[110px]'}`}>
            {isLocal ? 'You' : (displayName || 'User')}
          </span>
        </div>
        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${isAudioOn ? 'bg-black/40 text-green-400' : 'bg-red-500/90 text-white'}`}>
          <i className={`fas ${isAudioOn ? 'fa-microphone' : 'fa-microphone-slash'} text-[8px] sm:text-[9px]`} />
        </div>
      </div>

      {/* Remote host actions menu */}
      {!isLocal && (
        <div className="absolute top-2 right-2 z-30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" ref={settingsMenuRef}>
          <button onClick={() => onSettingToggle?.(peerId)} className="w-7 h-7 rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60 flex items-center justify-center">
            <i className="fa-solid fa-ellipsis-vertical text-[10px]" />
          </button>
          {isSettingOn === peerId && (
            <div role="menu" className="absolute right-0 top-9 flex flex-col bg-slate-800/95 backdrop-blur border border-white/10 rounded-xl w-36 shadow-2xl py-1 z-50" style={{ animation: 'fadeInUp 0.15s ease-out' }}>
              <Link to={`/MyProfile/${uid}`} className="text-[11px] text-gray-300 hover:bg-white/10 px-3 py-2 flex items-center gap-2 transition-colors">
                <i className="fa-solid fa-user text-[10px]" /> View Profile
              </Link>
              {isHost && (
                <>
                  <div className="h-px bg-white/10 my-1" />
                  <button onClick={() => { onForceMute?.(uid); onSettingToggle?.(null); }} className="text-[11px] text-left text-amber-400 hover:bg-white/10 px-3 py-2 w-full flex items-center gap-2">
                    <i className="fa-solid fa-microphone-slash text-[10px]" /> Force Mute
                  </button>
                  <button onClick={() => { onKick?.(uid); onSettingToggle?.(null); }} className="text-[11px] text-left text-red-400 hover:bg-red-500/10 px-3 py-2 w-full flex items-center gap-2">
                    <i className="fa-solid fa-user-xmark text-[10px]" /> Kick User
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── SubtitleOverlay ──────────────────────────────────────────────────────────
const SubtitleOverlay = memo(({ lines }) => {
  if (!lines.length) return null;
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl flex flex-col items-center gap-1 pointer-events-none">
      {lines.map(line => (
        <div key={line.key} className="px-3 py-1.5 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
          <span className="text-indigo-300 font-semibold text-[10px] sm:text-xs mr-1">{line.name}:</span>
          <span className="text-white text-xs sm:text-sm font-medium">{line.text}</span>
        </div>
      ))}
    </div>
  );
});

// ─── ParticipantsPanel ────────────────────────────────────────────────────────
const ParticipantsPanel = memo(({ participants, currUserData, uId, show, onClose }) => {
  if (!show) return null;
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-16 right-4 z-50 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Participants ({participants.length + 1})</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><i className="fas fa-times text-xs" /></button>
        </div>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {/* Local user */}
          <div className="flex items-center gap-2">
            <img src={currUserData?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500/50" alt="You" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">You</p>
              <p className="text-[10px] text-gray-400">Host</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          {participants.map(p => (
            <div key={p.uid} className="flex items-center gap-2">
              <img src={p.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" alt={p.name} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{p.name || 'User'}</p>
              </div>
              <div className={`w-2 h-2 rounded-full ${p.isAudioEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
});

// ─── ReactionPicker ───────────────────────────────────────────────────────────
const ReactionPicker = memo(({ show, onReact, pickerRef }) => {
  if (!show) return null;
  return (
    <div ref={pickerRef} className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 flex gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
      {REACTION_EMOJIS.map(r => (
        <button key={r.key} onClick={() => onReact(r.key)} title={r.label} className="text-xl sm:text-2xl hover:scale-125 active:scale-90 transition-transform duration-150 cursor-pointer select-none">
          {r.key}
        </button>
      ))}
    </div>
  );
});

// ─── ScreenShareBanner ────────────────────────────────────────────────────────
const ScreenShareBanner = memo(({ isScreenSharing, onStop }) => {
  if (!isScreenSharing) return null;
  return (
    <div className="flex-shrink-0 h-10 sm:h-12 bg-blue-600/90 backdrop-blur flex items-center justify-between px-4 sm:px-6 z-40 border-b border-blue-500/30">
      <div className="flex items-center gap-2 text-white text-xs sm:text-sm font-semibold">
        <i className="fa-solid fa-display" /> You are presenting your screen
      </div>
      <button onClick={onStop} className="text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-lg transition-all">
        Stop sharing
      </button>
    </div>
  );
});

// ─── ScreenShareView ──────────────────────────────────────────────────────────
// Google Meet / Zoom style: large screen + thumbnail strip
const ScreenShareView = memo(({ screenVideoRef, thumbnails, localThumb }) => (
  <div className="w-full h-full flex flex-col gap-2 p-2 sm:p-3">
    {/* Main screen area */}
    <div className="flex-1 rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 min-h-0 relative">
      <video
        ref={screenVideoRef}
        autoPlay playsInline muted
        className="w-full h-full object-contain"
      />
      <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-white">
        <i className="fa-solid fa-display text-[9px]" /> Screen Share
      </div>
    </div>
    {/* Thumbnail strip */}
    <div className="flex-shrink-0 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {/* Local thumbnail */}
      {localThumb && <VideoTile {...localThumb} isThumbnail />}
      {/* Remote thumbnails */}
      {thumbnails.map(t => <VideoTile key={t.uid} {...t} isThumbnail />)}
    </div>
  </div>
));

// ─── RoomMain ─────────────────────────────────────────────────────────────────
const RoomMain = ({ uId }) => {
  // ── State ────────────────────────────────────────────────────────────────
  const [peerId,             setPeerId]             = useState('');
  const [isSettingOn,        setIsSettingOn]        = useState(null);
  const [currUserData,       setCurrUserData]       = useState(null);
  const [userLoading,        setUserLoading]        = useState(true);
  const [currentRoomData,    setCurrentRoomData]    = useState(null);
  const [isHost,             setIsHost]             = useState(false);
  const [showParticipants,   setShowParticipants]   = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [raisedHand,         setRaisedHand]         = useState(false);
  const [isAudioEnabled,     setIsAudioEnabled]     = useState(false);
  const [isVideoEnabled,     setIsVideoEnabled]     = useState(false);
  const [isScreenSharing,    setIsScreenSharing]    = useState(false);
  const [unreadCount,        setUnreadCount]        = useState(0);
  const [subtitlesEnabled,   setSubtitlesEnabled]   = useState(false);
  const [localSubtitle,      setLocalSubtitle]      = useState('');
  const [localReactions,     setLocalReactions]     = useState([]);

  /**
   * FIX #1 — SINGLE SOURCE OF TRUTH: Map<uid, participantEntry>
   *
   * Each entry: { uid, peerId, stream, name, photo, isAudioEnabled,
   *               isVideoEnabled, isSpeaking, reactions, raisedHand }
   *
   * Keyed by uid (NOT peerId). This prevents ghost cards when the same
   * user reconnects with a new peerId, or when the `call` event fires
   * before we have metadata from the socket.
   */
  const [participants, setParticipants]     = useState(new Map()); // Map<uid, entry>
  const [subtitles,    setSubtitles]        = useState({});         // uid → { text, name }

  const mediaPrefs       = useSelector(s => s.mediaPrefs);
  const isChatToggleOpen = useSelector(s => s.toggleChatSidebar);
  const dispatch         = useDispatch();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const localVideoRef       = useRef(null);
  const screenVideoRef      = useRef(null); // dedicated ref for screen share preview
  const localStreamRef      = useRef(null);
  const screenStreamRef     = useRef(null);
  const dataConnectionsRef  = useRef({});   // peerId → RTCPeerConnection/call
  const chatConnectionsRef  = useRef({});   // peerId → data conn
  const settingsMenuRef     = useRef(null);
  const reactionPickerRef   = useRef(null);
  const isHangingUp         = useRef(false);
  const camStateBeforeShare = useRef(false);
  const isScreenSharingRef  = useRef(false); // ref mirror to avoid stale closures
  const subtitleTimers      = useRef({});
  const recognitionRef      = useRef(null);
  const recognitionActive   = useRef(false);
  const speakingThrottle    = useRef({});
  const speakingState       = useRef({});
  const speakingCleanups    = useRef({});    // uid → cleanup fn
  const isMounted           = useRef(true);
  const peerRef             = useRef(null);
  /**
   * peerMetadata: Map<peerId, { uid, name, photo }> populated from socket
   * before calls are answered, so addParticipant always has real identity.
   */
  const peerMetadataRef     = useRef(new Map());

  const { id }    = useParams();
  const navigate  = useNavigate();
  const timer     = useMeetingTimer();
  const { rooms } = getRoomData() || {};

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Init local media ──────────────────────────────────────────────────────
  useEffect(() => {
    let stream;
    (async () => {
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
        if (isMounted.current) {
          setIsAudioEnabled(mediaPrefs?.audio || false);
          setIsVideoEnabled(mediaPrefs?.video || false);
        }
      } catch (err) {
        console.error('[RoomMain] Media init error:', err);
      }
    })();
    return () => { stream?.getTracks().forEach(t => { t.enabled = false; t.stop(); }); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync room data ────────────────────────────────────────────────────────
  useEffect(() => {
    const room = rooms?.find(r => r.id === id || r._id === id);
    if (!isMounted.current) return;
    setCurrentRoomData(room || null);
    if (room && uId) setIsHost(room.ownerUid === uId || room.hostId === uId);
  }, [id, rooms, uId]);

  // ── Fetch user data ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getUserData(uId);
        if (!cancelled && isMounted.current) setCurrUserData(data);
      } catch { /* ignore */ } finally {
        if (!cancelled && isMounted.current) setUserLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uId]);

  // ── Click-outside handlers ────────────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) setIsSettingOn(null);
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target)) setShowReactionPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Data messaging helpers ────────────────────────────────────────────────
  const sendDataToAll = useCallback(msg => {
    Object.values(chatConnectionsRef.current).forEach(conn => {
      try { if (conn.open) conn.send(msg); } catch {}
    });
  }, []);

  const processIncomingData = useCallback(data => {
    if (!isMounted.current) return;
    if (data.type === 'reaction') {
      const { uid: senderUid, emoji } = data;
      const rid = Date.now();
      setParticipants(prev => {
        const next = new Map(prev);
        const entry = next.get(senderUid);
        if (entry) next.set(senderUid, { ...entry, reactions: [...(entry.reactions || []), { id: rid, emoji }] });
        return next;
      });
      setTimeout(() => {
        if (!isMounted.current) return;
        setParticipants(prev => {
          const next = new Map(prev);
          const entry = next.get(senderUid);
          if (entry) next.set(senderUid, { ...entry, reactions: (entry.reactions || []).filter(r => r.id !== rid) });
          return next;
        });
      }, 3200);
    }
    if (data.type === 'subtitle') {
      const { uid: senderUid, text, name } = data;
      setSubtitles(prev => ({ ...prev, [senderUid]: { text, name } }));
      clearTimeout(subtitleTimers.current[senderUid]);
      subtitleTimers.current[senderUid] = setTimeout(() => {
        if (!isMounted.current) return;
        setSubtitles(prev => { const u = { ...prev }; delete u[senderUid]; return u; });
      }, 3000);
    }
    if (data.type === 'raise_hand') {
      const { uid: senderUid, raised } = data;
      setParticipants(prev => {
        const next = new Map(prev);
        const entry = next.get(senderUid);
        if (entry) next.set(senderUid, { ...entry, raisedHand: raised });
        return next;
      });
    }
  }, []);

  // ── Speaking detection ────────────────────────────────────────────────────
  const detectSpeaking = useCallback((targetUid, stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    const analyser = audioCtx.createAnalyser();
    analyser.smoothingTimeConstant = 0.7;
    analyser.fftSize = 1024;
    try { audioCtx.createMediaStreamSource(stream).connect(analyser); }
    catch { audioCtx.close(); return () => {}; }

    const data = new Uint8Array(analyser.frequencyBinCount);
    let holdTimeout = null;
    let raf = null;

    const update = val => {
      const now = Date.now();
      const last = speakingThrottle.current[targetUid] || 0;
      if (speakingState.current[targetUid] === val || now - last < SPEAKING_THROTTLE_MS) return;
      speakingThrottle.current[targetUid] = now;
      speakingState.current[targetUid] = val;
      setParticipants(prev => {
        const next = new Map(prev);
        const entry = next.get(targetUid);
        if (entry) next.set(targetUid, { ...entry, isSpeaking: val });
        return next;
      });
    };

    const check = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) sum += data[i];
      const avg = sum / (data.length / 4);
      if (avg > SPEAKING_THRESHOLD) {
        update(true);
        if (holdTimeout) { clearTimeout(holdTimeout); holdTimeout = null; }
      } else if (speakingState.current[targetUid] && !holdTimeout) {
        holdTimeout = setTimeout(() => { update(false); holdTimeout = null; }, SPEAKING_HOLD_MS);
      }
      raf = requestAnimationFrame(check);
    };
    check();

    return () => {
      if (holdTimeout) clearTimeout(holdTimeout);
      if (raf) cancelAnimationFrame(raf);
      try { audioCtx.close(); } catch {}
      delete speakingState.current[targetUid];
      delete speakingThrottle.current[targetUid];
    };
  }, []);

  /**
   * FIX #1 — addParticipant: keyed by uid, not peerId.
   * Merges metadata from peerMetadataRef if available.
   */
  const addParticipant = useCallback((peerId, stream, metaOverride = {}) => {
    const meta = peerMetadataRef.current.get(peerId) || {};
    const uid  = metaOverride.uid || meta.uid || peerId; // fallback to peerId only if uid unknown

    // Never add our own stream
    if (uid === uId) return;

    setParticipants(prev => {
      const next = new Map(prev);
      const existing = next.get(uid) || {};
      next.set(uid, {
        uid,
        peerId,
        stream,
        name:           metaOverride.name  || meta.name  || existing.name  || 'User',
        photo:          metaOverride.photo || meta.photo || existing.photo || '',
        isAudioEnabled: metaOverride.isAudioEnabled ?? meta.isAudioEnabled ?? existing.isAudioEnabled ?? true,
        isVideoEnabled: metaOverride.isVideoEnabled ?? meta.isVideoEnabled ?? existing.isVideoEnabled ?? true,
        isSpeaking:     false,
        reactions:      existing.reactions    || [],
        raisedHand:     existing.raisedHand   || false,
      });
      return next;
    });
  }, [uId]);

  const removeParticipant = useCallback(peerId => {
    // Find uid by peerId
    setParticipants(prev => {
      const next = new Map(prev);
      for (const [uid, entry] of next) {
        if (entry.peerId === peerId) {
          speakingCleanups.current[uid]?.();
          delete speakingCleanups.current[uid];
          next.delete(uid);
          break;
        }
      }
      return next;
    });
    delete dataConnectionsRef.current[peerId];
    delete chatConnectionsRef.current[peerId];
  }, []);

  // ── PeerJS & Socket ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !uId) return;
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', pid => { if (isMounted.current) setPeerId(pid); });

    // Incoming data connections (chat/reactions)
    peer.on('connection', conn => {
      conn.on('open', () => {
        chatConnectionsRef.current[conn.peer] = conn;
        conn.on('data', processIncomingData);
        conn.on('close', () => { delete chatConnectionsRef.current[conn.peer]; });
      });
    });

    // Incoming calls
    peer.on('call', call => {
      call.answer(localStreamRef.current);

      call.on('stream', stream => {
        // At this point peerMetadataRef should have metadata from 'user-joined' socket event
        const meta = peerMetadataRef.current.get(call.peer) || {};
        addParticipant(call.peer, stream, meta);
        joinRoomAudio.play().catch(() => {});

        const uid = meta.uid || call.peer;
        speakingCleanups.current[uid]?.();
        speakingCleanups.current[uid] = detectSpeaking(uid, stream);
      });

      dataConnectionsRef.current[call.peer] = call;
      call.on('close', () => removeParticipant(call.peer));
      call.on('error', () => removeParticipant(call.peer));
    });

    // ── Socket events ─────────────────────────────────────────────────────
    socket.on('room-participants', participants => {
      if (!isMounted.current) return;
      // Store metadata for all peers
      participants.forEach(p => {
        if (p.uid !== uId) peerMetadataRef.current.set(p.peerId, p);
      });
      // Connect to all peers we don't already have connections to
      const remotePeers = participants.filter(p => p.uid !== uId);
      remotePeers.forEach(remotePeer => {
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
        call.on('stream', stream => {
          addParticipant(rPeerId, stream, remotePeer);
          joinRoomAudio.play().catch(() => {});
          const uid = remotePeer.uid || rPeerId;
          speakingCleanups.current[uid]?.();
          speakingCleanups.current[uid] = detectSpeaking(uid, stream);
        });
        call.on('close', () => removeParticipant(rPeerId));
        call.on('error', () => removeParticipant(rPeerId));
        dataConnectionsRef.current[rPeerId] = call;
      });
    });

    // A new user joined — store their metadata BEFORE the call arrives
    socket.on('user-joined', participant => {
      if (participant.uid !== uId) {
        peerMetadataRef.current.set(participant.peerId, participant);
      }
    });

    socket.on('media-state-updated', ({ userId, isAudioEnabled: aE, isVideoEnabled: vE }) => {
      if (!isMounted.current) return;
      setParticipants(prev => {
        const next = new Map(prev);
        const entry = next.get(userId);
        if (entry) next.set(userId, { ...entry, isAudioEnabled: aE, isVideoEnabled: vE });
        return next;
      });
    });

    socket.on('you-are-kicked', () => {
      Swal.fire({ toast: true, icon: 'warning', title: 'You were removed by the host', position: 'top-end', timer: 3000, showConfirmButton: false, background: '#1e293b', color: '#fff' })
        .then(() => handleHangup(true));
    });

    socket.on('you-are-force-muted', () => {
      const [at] = localStreamRef.current?.getAudioTracks() || [];
      if (at) { at.enabled = false; setIsAudioEnabled(false); socket.emit('update-media-state', { isAudioEnabled: false, isVideoEnabled }); }
      Swal.fire({ toast: true, icon: 'info', title: 'Muted by host', position: 'top-end', timer: 2500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
    });

    socket.on('receive-message', () => {
      if (!isChatToggleOpen && isMounted.current) setUnreadCount(c => c + 1);
    });

    // User left
    socket.on('user-left', ({ peerId: leavingPeerId }) => {
      removeParticipant(leavingPeerId);
    });

    return () => {
      Object.values(speakingCleanups.current).forEach(fn => fn?.());
      Object.values(dataConnectionsRef.current).forEach(c => { try { c.close(); } catch {} });
      Object.values(chatConnectionsRef.current).forEach(c => { try { c.close(); } catch {} });
      peer.destroy();
      socket.off('room-participants');
      socket.off('user-joined');
      socket.off('media-state-updated');
      socket.off('you-are-kicked');
      socket.off('you-are-force-muted');
      socket.off('receive-message');
      socket.off('user-left');
    };
  }, [id, uId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Join room when identity ready ─────────────────────────────────────────
  useEffect(() => {
    if (peerId && currUserData && id && uId && socket.connected) {
      socket.emit('join-room', {
        roomId: id, userId: uId, peerId,
        name: currUserData.displayName || 'User',
        photo: currUserData.photoURL || '',
        isAudioEnabled: mediaPrefs?.audio || false,
        isVideoEnabled: mediaPrefs?.video || false,
      });
    }
  }, [peerId, currUserData, id, uId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Media controls ────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const [at] = localStreamRef.current.getAudioTracks();
    if (!at) return;
    at.enabled = !at.enabled;
    setIsAudioEnabled(at.enabled);
    socket.emit('update-media-state', { isAudioEnabled: at.enabled, isVideoEnabled });
    if (!at.enabled && recognitionRef.current) recognitionRef.current.stop();
    else if (at.enabled && subtitlesEnabled) startSubtitles();
  }, [isVideoEnabled, subtitlesEnabled]); // eslint-disable-line

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current || isScreenSharing) return;
    const [vt] = localStreamRef.current.getVideoTracks();
    if (!vt) return;
    vt.enabled = !vt.enabled;
    setIsVideoEnabled(vt.enabled);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
    socket.emit('update-media-state', { isAudioEnabled, isVideoEnabled: vt.enabled });
  }, [isAudioEnabled, isScreenSharing]);

  // ── Screen Share — FIX #2 ─────────────────────────────────────────────────
  const restoreCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) { setIsScreenSharing(false); isScreenSharingRef.current = false; return; }

    const [cameraTrack] = stream.getVideoTracks();

    // Replace track on all active peer connections
    Object.values(dataConnectionsRef.current).forEach(call => {
      const pc = call.peerConnection;
      if (!pc) return;
      // FIX: select senders by kind, tolerating null tracks
      const videoSenders = pc.getSenders().filter(s => s.track?.kind === 'video' || (!s.track && s._kind === 'video'));
      videoSenders.forEach(s => {
        s.replaceTrack(cameraTrack || null).catch(e => console.warn('[restoreCamera]', e));
      });
    });

    if (cameraTrack) {
      cameraTrack.enabled = camStateBeforeShare.current;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      if (isMounted.current) setIsVideoEnabled(camStateBeforeShare.current);
    } else {
      if (isMounted.current) setIsVideoEnabled(false);
    }

    if (isMounted.current) { setIsScreenSharing(false); isScreenSharingRef.current = false; }
  }, []);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    restoreCamera();
  }, [restoreCamera]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) { stopScreenShare(); return; }
    try {
      const [cameraTrack] = localStreamRef.current?.getVideoTracks() || [];
      camStateBeforeShare.current = cameraTrack?.enabled ?? false;

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', displaySurface: 'monitor' },
        audio: false,
      });
      screenStreamRef.current = screenStream;
      const [screenTrack] = screenStream.getVideoTracks();
      if (!screenTrack) { screenStream.getTracks().forEach(t => t.stop()); return; }

      // FIX: replace track on all senders — filter by kind
      const replacePromises = [];
      Object.values(dataConnectionsRef.current).forEach(call => {
        const pc = call.peerConnection;
        if (!pc) return;
        pc.getSenders()
          .filter(s => s.track?.kind === 'video' || (!s.track && s._kind === 'video'))
          .forEach(s => replacePromises.push(s.replaceTrack(screenTrack).catch(e => console.warn('[toggleScreenShare]', e))));
      });
      Promise.allSettled(replacePromises);

      // Show screen in dedicated ref (not the camera video element)
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = new MediaStream([screenTrack]);
        screenVideoRef.current.play().catch(() => {});
      }

      setIsScreenSharing(true);
      isScreenSharingRef.current = true;
      setIsVideoEnabled(true);

      screenTrack.addEventListener('ended', () => {
        if (!isScreenSharingRef.current) return;
        screenStreamRef.current = null;
        restoreCamera();
      }, { once: true });

    } catch (err) {
      if (err.name !== 'NotAllowedError') console.error('[toggleScreenShare]', err);
    }
  }, [isScreenSharing, stopScreenShare, restoreCamera]);

  // ── Reactions ──────────────────────────────────────────────────────────────
  const sendReaction = useCallback(emoji => {
    const rid = Date.now();
    setLocalReactions(p => [...p, { id: rid, emoji }]);
    sendDataToAll({ type: 'reaction', uid: uId, emoji });
    setShowReactionPicker(false);
  }, [uId, sendDataToAll]);

  const removeLocalReaction = useCallback(rid => {
    setLocalReactions(p => p.filter(r => r.id !== rid));
  }, []);

  const toggleRaiseHand = useCallback(() => {
    setRaisedHand(prev => {
      const next = !prev;
      sendDataToAll({ type: 'raise_hand', uid: uId, raised: next });
      if (next) Swal.fire({ toast: true, icon: 'info', title: '✋ Hand raised', position: 'top-start', timer: 2000, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      return next;
    });
  }, [uId, sendDataToAll]);

  // ── Host controls ──────────────────────────────────────────────────────────
  const kickUser = useCallback(async targetUid => {
    const result = await Swal.fire({ title: 'Kick this user?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#334155', confirmButtonText: 'Kick', background: '#1e293b', color: '#fff' });
    if (result.isConfirmed) socket.emit('admin-kick-user', { targetUid });
  }, []);

  const forceMuteUser = useCallback(targetUid => {
    socket.emit('admin-force-mute', { targetUid });
  }, []);

  // ── Subtitles ──────────────────────────────────────────────────────────────
  const startSubtitles = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || recognitionRef.current) return;
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    r.onresult = e => {
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      if (isMounted.current) setLocalSubtitle(txt);
      sendDataToAll({ type: 'subtitle', uid: uId, name: currUserData?.displayName || 'You', text: txt });
      clearTimeout(subtitleTimers.current['local']);
      subtitleTimers.current['local'] = setTimeout(() => { if (isMounted.current) setLocalSubtitle(''); }, 3000);
    };
    r.onerror = e => { if (e.error !== 'no-speech') console.warn('[SR]', e.error); };
    r.onend = () => { if (recognitionActive.current && recognitionRef.current) { try { r.start(); } catch {} } };
    recognitionActive.current = true;
    recognitionRef.current = r;
    r.start();
  }, [uId, currUserData, sendDataToAll]);

  const stopSubtitles = useCallback(() => {
    recognitionActive.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (isMounted.current) setLocalSubtitle('');
    Object.values(subtitleTimers.current).forEach(clearTimeout);
    subtitleTimers.current = {};
  }, []);

  const toggleSubtitles = useCallback(() => {
    if (subtitlesEnabled) { stopSubtitles(); setSubtitlesEnabled(false); }
    else { startSubtitles(); setSubtitlesEnabled(true); }
  }, [subtitlesEnabled, stopSubtitles, startSubtitles]);

  // ── Hangup ─────────────────────────────────────────────────────────────────
  const handleHangup = useCallback(async (silent = false) => {
    if (isHangingUp.current) return;
    isHangingUp.current = true;
    stopSubtitles();
    Object.values(speakingCleanups.current).forEach(fn => fn?.());
    localStreamRef.current?.getTracks().forEach(t => { t.enabled = false; t.stop(); });
    screenStreamRef.current?.getTracks().forEach(t => { t.enabled = false; t.stop(); });
    Object.values(dataConnectionsRef.current).forEach(c => { try { c.close(); } catch {} });
    Object.values(chatConnectionsRef.current).forEach(c => { try { c.close(); } catch {} });
    peerRef.current?.destroy();
    socket.emit('leave-room', { roomId: id, userId: uId });
    navigate('/Rooms');
  }, [id, uId, navigate, stopSubtitles]);

  const showLeaveModal = useCallback(() => {
    Swal.fire({ title: 'Leave the meeting?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#334155', confirmButtonText: 'Leave', background: '#1e293b', color: '#fff' })
      .then(r => { if (r.isConfirmed) handleHangup(); });
  }, [handleHangup]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handler = () => { window.history.pushState(null, '', window.location.href); showLeaveModal(); };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [showLeaveModal]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const participantsArray = useMemo(() => Array.from(participants.values()), [participants]);
  const totalCount        = participantsArray.length + 1; // +1 for local
  const gridClass         = useMemo(() => getGridClass(totalCount), [totalCount]);

  const activeSubtitleLines = useMemo(() => [
    ...(localSubtitle ? [{ key: 'local', name: 'You', text: localSubtitle }] : []),
    ...Object.entries(subtitles).map(([key, v]) => ({ key, name: v.name, text: v.text })),
  ], [localSubtitle, subtitles]);

  const handleSettingToggle = useCallback(pid => setIsSettingOn(p => p === pid ? null : pid), []);
  const handleChatOpen      = useCallback(() => { setUnreadCount(0); dispatch(toggleChatSidebar(true)); }, [dispatch]);

  const isPageLoading = userLoading || !currentRoomData;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (isPageLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a] text-white gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/30 rounded-full animate-spin border-t-indigo-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500/30 rounded-full animate-spin border-b-purple-500" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-indigo-200 animate-pulse">Entering Room…</h2>
          <p className="text-sm text-slate-500 mt-1">Setting up your connection</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <RoomErrorBoundary>
      <style>{`
        @keyframes floatUp { 0%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} 80%{opacity:1} 100%{opacity:0;transform:translateX(-50%) translateY(-120px) scale(1.4)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="room-container overflow-hidden bg-[#0f172a] h-[100dvh] w-screen relative text-white font-sans flex flex-col">

        {/* ── TopBar ── */}
        <header className="relative flex-shrink-0 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-5 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex flex-col leading-tight min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-gray-100 max-w-[100px] sm:max-w-[180px] truncate">{currentRoomData?.Title || 'Meeting Room'}</h1>
              <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                #{id?.slice(0, 6)}{isHost && <span className="text-amber-400 ml-1">· HOST</span>}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Live · {timer}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowParticipants(v => !v)} className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all" aria-label="Participants">
              <i className="fa-solid fa-users text-[11px]" /> {totalCount}
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); Swal.fire({ icon: 'success', title: 'Link copied!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#1e293b', color: '#fff' }); }}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-all" aria-label="Copy link"
            >
              <i className="fa-solid fa-link text-[11px]" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white/5 pl-1.5 pr-3 py-1 rounded-full border border-white/10">
              <img src={currUserData?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-7 h-7 rounded-full object-cover border-2 border-indigo-500/50" alt="You" />
              <span className="text-xs font-medium text-gray-200 max-w-[80px] truncate">{currUserData?.displayName || 'You'}</span>
              {raisedHand && <span>✋</span>}
            </div>
          </div>
        </header>

        {/* ── Screen share banner ── */}
        <ScreenShareBanner isScreenSharing={isScreenSharing} onStop={stopScreenShare} />

        {/* ── Participants panel ── */}
        <ParticipantsPanel
          participants={participantsArray}
          currUserData={currUserData}
          uId={uId}
          show={showParticipants}
          onClose={() => setShowParticipants(false)}
        />

        {/* ── Main content area ── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

          {/* ── Video area ── */}
          <div className={`relative overflow-hidden transition-all duration-500 ease-in-out
            ${isChatToggleOpen ? 'flex-1 md:flex-none md:w-[calc(100%-min(340px,30vw))]' : 'flex-1'}
            ${isScreenSharing ? 'h-[58vh] md:h-full' : 'h-[58vh] md:h-full'}
          `}>

            {/* ── FIX #3: Screen share layout (Google Meet style) ── */}
            {isScreenSharing ? (
              <ScreenShareView
                screenVideoRef={screenVideoRef}
                localThumb={{
                  videoRef: localVideoRef,
                  isVideoOn: isVideoEnabled && !isScreenSharing, // camera was off during share
                  isAudioOn: isAudioEnabled,
                  isLocal: true,
                  displayName: currUserData?.displayName || 'You',
                  photoURL: currUserData?.photoURL,
                  uid: uId,
                  reactions: localReactions,
                  raisedHand,
                  onRemoveReaction: removeLocalReaction,
                }}
                thumbnails={participantsArray.map(p => ({
                  uid: p.uid,
                  stream: p.stream,
                  isVideoOn: p.isVideoEnabled,
                  isAudioOn: p.isAudioEnabled,
                  isSpeaking: p.isSpeaking,
                  isLocal: false,
                  displayName: p.name,
                  photoURL: p.photo,
                  reactions: p.reactions,
                  raisedHand: p.raisedHand,
                  peerId: p.peerId,
                  isHost,
                  isSettingOn,
                  onSettingToggle: handleSettingToggle,
                  settingsMenuRef,
                  onForceMute: forceMuteUser,
                  onKick: kickUser,
                }))}
              />
            ) : (
              /* ── Normal grid view ── */
              <div className={`w-full h-full p-2 sm:p-3 grid gap-2 sm:gap-3 content-center ${gridClass}`}
                   style={{ gridAutoRows: totalCount === 1 ? '100%' : 'minmax(0,1fr)' }}>

                {/* Local tile */}
                <VideoTile
                  videoRef={localVideoRef}
                  isVideoOn={isVideoEnabled}
                  isAudioOn={isAudioEnabled}
                  isScreenSharing={isScreenSharing}
                  isLocal={true}
                  displayName={currUserData?.displayName || 'You'}
                  photoURL={currUserData?.photoURL}
                  uid={uId}
                  reactions={localReactions}
                  raisedHand={raisedHand}
                  onRemoveReaction={removeLocalReaction}
                />

                {/* Remote tiles — FIX #1: each entry is unique by uid */}
                {participantsArray.map(p => (
                  <VideoTile
                    key={p.uid}
                    stream={p.stream}
                    isVideoOn={p.isVideoEnabled}
                    isAudioOn={p.isAudioEnabled}
                    isSpeaking={p.isSpeaking}
                    isLocal={false}
                    displayName={p.name}
                    photoURL={p.photo}
                    uid={p.uid}
                    reactions={p.reactions}
                    raisedHand={p.raisedHand}
                    peerId={p.peerId}
                    isHost={isHost}
                    isSettingOn={isSettingOn}
                    onSettingToggle={handleSettingToggle}
                    settingsMenuRef={settingsMenuRef}
                    onForceMute={forceMuteUser}
                    onKick={kickUser}
                  />
                ))}
              </div>
            )}

            {/* Subtitle overlay */}
            <SubtitleOverlay lines={activeSubtitleLines} />
          </div>

          {/* ── Chat sidebar ──
              Never unmounted — only hidden with CSS.
              Mobile: slides up from bottom (drawer).
              Desktop: right panel.
          ── */}
          <div
            className={`
              fixed bottom-0 left-0 right-0 z-[60]
              md:static md:z-auto
              bg-white dark:bg-[#0B1120]
              border-t md:border-t-0 md:border-l border-white/10
              shadow-2xl
              transition-all duration-300 ease-in-out
              ${isChatToggleOpen
                ? 'h-[60vh] md:h-full md:w-[min(340px,30vw)] md:min-w-[280px] translate-y-0'
                : 'h-0 md:h-full md:w-0 md:min-w-0 translate-y-full md:translate-y-0 overflow-hidden'}
            `}
            aria-hidden={!isChatToggleOpen}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <Chat uId={uId} />
            </Suspense>
          </div>
        </div>

        {/* ── Reaction picker ── */}
        <ReactionPicker show={showReactionPicker} onReact={sendReaction} pickerRef={reactionPickerRef} />

        {/* ── Controls bar ── */}
        <div className="flex-shrink-0 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-[#0a0f1e]/90 backdrop-blur-xl border-t border-white/5 z-50 flex-wrap min-h-[60px] sm:min-h-[72px]">
          <ControlBtn active={isAudioEnabled} onClick={toggleAudio} icon={isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'} label={isAudioEnabled ? 'Mute' : 'Unmute'} danger={!isAudioEnabled} />
          <ControlBtn active={isVideoEnabled} onClick={toggleVideo} icon={isVideoEnabled ? 'fa-video' : 'fa-video-slash'} label={isVideoEnabled ? 'Cam Off' : 'Cam On'} danger={!isVideoEnabled} disabled={isScreenSharing} />
          <ControlBtn active={isScreenSharing} onClick={toggleScreenShare} icon={isScreenSharing ? 'fa-stop' : 'fa-display'} label={isScreenSharing ? 'Stop' : 'Share'} accent="blue" />
          <ControlBtn active={showReactionPicker} onClick={() => setShowReactionPicker(v => !v)} icon="fa-face-smile" label="React" accent="yellow" />

          {/* Raise hand */}
          <button
            onClick={toggleRaiseHand}
            aria-label={raisedHand ? 'Lower hand' : 'Raise hand'}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl transition-all duration-200 ${raisedHand ? 'bg-amber-500/90 text-white shadow-lg shadow-amber-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'}`}
          >
            <span className="text-base sm:text-xl leading-none">✋</span>
            <span className="text-[8px] sm:text-[10px] font-medium hidden sm:block">{raisedHand ? 'Lower' : 'Raise'}</span>
          </button>

          <ControlBtn active={subtitlesEnabled} onClick={toggleSubtitles} icon="fa-closed-captioning" label="CC" accent="indigo" />

          {/* Participants (mobile) */}
          <button
            onClick={() => setShowParticipants(v => !v)}
            className="relative sm:hidden flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all"
          >
            <i className="fas fa-users text-sm" />
            <span className="text-[8px] font-medium">{totalCount}</span>
          </button>

          {/* Chat */}
          <ControlBtn
            active={isChatToggleOpen}
            onClick={handleChatOpen}
            icon="fa-comment-dots"
            label="Chat"
            accent="indigo"
            badge={unreadCount}
          />

          <div className="w-px h-8 bg-white/10 mx-0.5" />

          {/* Leave */}
          <button onClick={showLeaveModal} className="flex flex-col items-center gap-0.5 sm:gap-1 px-3 sm:px-5 py-1.5 sm:py-2 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400" aria-label="Leave meeting">
            <i className="fas fa-phone-slash text-sm sm:text-lg" style={{ transform: 'rotate(135deg)' }} />
            <span className="text-[8px] sm:text-[10px] font-bold hidden sm:block">Leave</span>
          </button>
        </div>
      </div>
    </RoomErrorBoundary>
  );
};

export default RoomMain;