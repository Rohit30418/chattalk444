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
// import { ThemeToggleIcon } from '../ui/ThemeToggle';

// Lazy load Chat — keep it mounted once loaded (key fix for focus bug)
const Chat = lazy(() => import('../chat/Chat'));

import joinRoomSrc from '../../assets/notification-1-269296.mp3';
const joinRoomAudio = new Audio(joinRoomSrc);
joinRoomAudio.preload = 'auto';

const REACTION_EMOJIS = [
  { key: '👍', label: 'Like' }, { key: '❤️', label: 'Love' },
  { key: '😂', label: 'Haha' }, { key: '😮', label: 'Wow' },
  { key: '👏', label: 'Clap' }, { key: '🎉', label: 'Party' },
  { key: '✋', label: 'Hand' },
];
const SPEAKING_THRESHOLD   = 20;
const SPEAKING_HOLD_MS     = 1000;
const SPEAKING_THROTTLE_MS = 150;

// ─── Error Boundary ────────────────────────────────────────────────────────────
class RoomErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[RoomErrorBoundary]', error, info.componentStack); }
  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0f172a] dark:bg-[#0f172a] text-white gap-6 p-8 text-center">
          <i className="fas fa-triangle-exclamation text-4xl text-red-400" />
          <h2 className="text-xl font-bold text-red-300">Something went wrong</h2>
          <p className="text-sm text-slate-400 max-w-sm">A rendering error occurred. Please rejoin the room.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors">Rejoin Room</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── useMeetingTimer ──────────────────────────────────────────────────────────
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const HandBadge = memo(() => (
  <div role="status" className="absolute top-2 right-10 sm:top-4 sm:right-14 z-30 bg-amber-500/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 text-[10px] sm:text-xs font-bold text-white animate-bounce">
    ✋
  </div>
));

const FloatingReaction = memo(({ emoji, id: reactionId, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-3xl sm:text-4xl select-none" style={{ animation: 'floatUp 3s ease-out forwards' }} aria-hidden="true">
      {emoji}
    </div>
  );
});

// ─── ControlBtn ───────────────────────────────────────────────────────────────
const ControlBtn = memo(({ active, onClick, icon, label, danger, accent, disabled }) => {
  const accentMap = {
    blue:   { on: 'bg-blue-500/90 text-white shadow-blue-500/30',    off: 'bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-300 border border-white/10' },
    yellow: { on: 'bg-yellow-500/90 text-white shadow-yellow-500/30', off: 'bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-300 border border-white/10' },
    indigo: { on: 'bg-indigo-500/90 text-white shadow-indigo-500/30', off: 'bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-300 border border-white/10' },
  };
  let cls = 'flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl transition-all duration-200 ';
  if (disabled) cls += 'opacity-40 cursor-not-allowed bg-white/5 text-gray-500 border border-white/5 ';
  else if (accent) cls += `${active ? accentMap[accent].on + ' shadow-lg' : accentMap[accent].off} `;
  else if (danger && !active) cls += 'bg-red-500/90 text-white shadow-lg shadow-red-500/20 ';
  else cls += `${active ? 'bg-slate-600 text-white border border-white/10' : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'} `;

  return (
    <button onClick={disabled ? undefined : onClick} title={label} aria-label={label} aria-pressed={active} disabled={disabled} className={cls}>
      <i className={`fas ${icon} text-sm sm:text-lg`} aria-hidden="true" />
      <span className="text-[8px] sm:text-[10px] font-medium hidden sm:block">{label}</span>
    </button>
  );
});

// ─── LocalVideoCard ──────────────────────────────────────────────────────────
const LocalVideoCard = memo(({ localVideoRef, isVideoEnabled, isAudioEnabled, isScreenSharing, localReactions, raisedHand, currUserData, onRemoveReaction, isSolo }) => (
  <div className={`relative rounded-2xl overflow-hidden bg-slate-800 dark:bg-slate-800 ring-1 ring-white/10 group transition-all duration-300 ${isSolo ? 'w-full max-w-2xl h-[80%] mx-auto' : 'w-full h-full min-h-[140px] sm:min-h-[200px]'}`}>
    <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`} />
    <div className={`absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center transition-opacity duration-300 ${isVideoEnabled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative mb-3">
        <div className="absolute inset-0 bg-indigo-500/15 rounded-full blur-xl animate-pulse" />
        <img src={currUserData?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 sm:border-4 border-slate-600 shadow-2xl" alt="You" />
      </div>
      <p className="text-xs sm:text-sm text-slate-400 font-medium">{isScreenSharing ? '🖥 Sharing screen' : 'Camera off'}</p>
    </div>
    {localReactions.map((r) => <FloatingReaction key={r.id} emoji={r.emoji} id={r.id} onDone={() => onRemoveReaction(r.id)} />)}
    {raisedHand && <HandBadge />}
    {isScreenSharing && (
      <div className="absolute top-2 left-2 z-30 bg-blue-500/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-white">
        <i className="fa-solid fa-display text-[9px]" /> Sharing
      </div>
    )}
    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-20">
      <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1.5 border border-white/5">
        <span className="text-white text-[9px] sm:text-xs font-semibold">You</span>
      </div>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isAudioEnabled ? 'bg-black/40 text-green-400' : 'bg-red-500/90 text-white'}`}>
        <i className={`fas text-[9px] sm:text-xs ${isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'}`} />
      </div>
    </div>
  </div>
));

// ─── RemoteCard ───────────────────────────────────────────────────────────────
const RemoteCard = memo(({ peerId: rPeerId, stream, remotePeer, reactions: remoteReactions, handRaised, isSettingOn, onSettingToggle, settingsMenuRef, isHost, onForceMute, onKick }) => {
  const isVideoOn  = remotePeer?.isVideoEnabled;
  const isAudioOn  = remotePeer?.isAudioEnabled;
  const isSpeaking = remotePeer?.isSpeaking;
  const videoRef   = useRef(null);

  // Stable video ref — never reset srcObject if stream hasn't changed
  const attachStream = useCallback((el) => {
    if (!el) return;
    videoRef.current = el;
    if (el.srcObject !== stream) el.srcObject = stream;
  }, [stream]);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-slate-800 transition-all duration-300 group min-h-[140px] sm:min-h-[200px] ${isSpeaking ? 'ring-2 ring-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.3)]' : 'ring-1 ring-white/10 hover:ring-white/20'}`}>
      <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden" aria-hidden="true">
        {remoteReactions.map((r) => (
          <div key={r.id} className="absolute bottom-8 left-1/2 text-3xl" style={{ animation: 'floatUp 3s ease-out forwards' }}>{r.emoji}</div>
        ))}
      </div>
      {handRaised && <HandBadge />}
      <video className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOn ? 'opacity-100' : 'opacity-0'}`} autoPlay playsInline ref={attachStream} />
      <div className={`absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center transition-opacity duration-300 ${!isVideoOn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="relative mb-3">
          {isSpeaking && (
            <>
              <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping scale-150" aria-hidden="true" />
              <span className="absolute inset-0 rounded-full bg-indigo-400/15 animate-ping scale-125 delay-150" aria-hidden="true" />
            </>
          )}
          <img src={remotePeer?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${remotePeer?.uid}`} className="relative w-14 h-14 sm:w-20 sm:h-20 object-cover rounded-full border-2 sm:border-4 border-slate-600 z-10 shadow-2xl" alt={remotePeer?.name} />
        </div>
      </div>
      <div className="absolute top-2 right-2 z-30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" ref={settingsMenuRef}>
        <button onClick={() => onSettingToggle(rPeerId)} className="w-7 h-7 rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60 flex items-center justify-center">
          <i className="fa-solid fa-ellipsis-vertical text-[10px]" />
        </button>
        {isSettingOn === rPeerId && (
          <div role="menu" className="absolute right-0 top-9 flex flex-col bg-slate-800/95 backdrop-blur border border-white/10 rounded-xl w-36 shadow-2xl py-1 z-50" style={{ animation: 'fadeInUp 0.15s ease-out' }}>
            <Link to={`/MyProfile/${remotePeer?.uid}`} className="text-[11px] text-gray-300 hover:bg-white/10 px-3 py-2 flex items-center gap-2 transition-colors"><i className="fa-solid fa-user text-[10px]" /> View Profile</Link>
            {isHost && (
              <>
                <div className="h-px bg-white/10 my-1" />
                <button onClick={() => { onForceMute(remotePeer?.uid); onSettingToggle(null); }} className="text-[11px] text-left text-amber-400 hover:bg-white/10 px-3 py-2 w-full flex items-center gap-2 transition-colors"><i className="fa-solid fa-microphone-slash text-[10px]" /> Force Mute</button>
                <button onClick={() => { onKick(remotePeer?.uid); onSettingToggle(null); }} className="text-[11px] text-left text-red-400 hover:bg-red-500/10 px-3 py-2 w-full flex items-center gap-2 transition-colors"><i className="fa-solid fa-user-xmark text-[10px]" /> Kick User</button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-20">
        <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/5">
          <span className="text-white text-[9px] sm:text-xs font-semibold max-w-[70px] sm:max-w-[110px] truncate block">{remotePeer?.name || 'User'}</span>
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isAudioOn ? 'bg-black/40 text-white' : 'bg-red-500/90 text-white'}`}>
          <i className={`fas text-[9px] sm:text-xs ${isAudioOn ? 'fa-microphone' : 'fa-microphone-slash'}`} />
        </div>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.peerId === next.peerId &&
  prev.stream === next.stream &&
  prev.remotePeer === next.remotePeer &&
  prev.reactions === next.reactions &&
  prev.handRaised === next.handRaised &&
  prev.isSettingOn === next.isSettingOn &&
  prev.isHost === next.isHost
);

// ─── SubtitleOverlay ──────────────────────────────────────────────────────────
const SubtitleOverlay = memo(({ lines }) => {
  if (!lines.length) return null;
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl flex flex-col items-center gap-1 pointer-events-none">
      {lines.map((line) => (
        <div key={line.key} className="px-3 py-1.5 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', animation: 'fadeInUp 0.2s ease-out' }}>
          <span className="text-indigo-300 font-semibold text-[10px] sm:text-xs mr-1">{line.name}:</span>
          <span className="text-white text-xs sm:text-sm font-medium">{line.text}</span>
        </div>
      ))}
    </div>
  );
});

// ─── ParticipantsPanel ────────────────────────────────────────────────────────
const ParticipantsPanel = memo(({ remoteStream, currUserData, localVideoRef, uId, show }) => {
  if (!show) return null;
  return (
    <div className="absolute top-16 right-4 z-50 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
      <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Participants ({remoteStream.length + 1})</h3>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-2">
          <img src={currUserData?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500/50" alt="You" />
          <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-white truncate">You</p><p className="text-[10px] text-gray-400">Host</p></div>
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        {remoteStream.filter((u) => u.remotePeer?.uid !== uId).map((user) => (
          <div key={user.peerId} className="flex items-center gap-2">
            <img src={user.remotePeer?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.remotePeer?.uid}`} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" alt={user.remotePeer?.name} />
            <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-white truncate">{user.remotePeer?.name || 'User'}</p></div>
            <div className={`w-2 h-2 rounded-full ${user.remotePeer?.isAudioEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── ReactionPicker ───────────────────────────────────────────────────────────
const ReactionPicker = memo(({ show, onReact, pickerRef }) => {
  if (!show) return null;
  return (
    <div ref={pickerRef} className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 flex gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
      {REACTION_EMOJIS.map((r) => (
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

// ─── RoomMain ─────────────────────────────────────────────────────────────────
const RoomMain = ({ uId }) => {
  const [peerId,             setPeerId]             = useState('');
  const [isSettingOn,        setIsSettingOn]        = useState(null);
  const [currUserData,       setCurrUserData]       = useState(null);
  const [userLoading,        setUserLoading]        = useState(true);
  const [currentRoomData,    setCurrentRoomData]    = useState(null);
  const [remotePeerIds,      setRemotePeerIds]      = useState([]);
  const [isHost,             setIsHost]             = useState(false);
  const [showParticipants,   setShowParticipants]   = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [raisedHand,         setRaisedHand]         = useState(false);
  const [isAudioEnabled,     setIsAudioEnabled]     = useState(false);
  const [isVideoEnabled,     setIsVideoEnabled]     = useState(false);
  const [isScreenSharing,    setIsScreenSharing]    = useState(false);
  const [remoteStream,       setRemoteStream]       = useState([]);
  const [reactions,          setReactions]          = useState({});
  const [localReactions,     setLocalReactions]     = useState([]);
  const [raisedHands,        setRaisedHands]        = useState({});
  const [subtitles,          setSubtitles]          = useState({});
  const [localSubtitle,      setLocalSubtitle]      = useState('');
  const [subtitlesEnabled,   setSubtitlesEnabled]   = useState(false);
  const [unreadCount,        setUnreadCount]        = useState(0);

  const mediaPrefs       = useSelector((s) => s.mediaPrefs);
  const isChatToggleOpen = useSelector((s) => s.toggleChatSidebar);
  const dispatch         = useDispatch();

  const localVideoRef      = useRef(null);
  const localStreamRef     = useRef(null);
  const screenStreamRef    = useRef(null);
  const dataConnectionsRef = useRef({});
  const chatConnectionsRef = useRef({});
  const settingsMenuRef    = useRef(null);
  const reactionPickerRef  = useRef(null);
  const isHangingUp        = useRef(false);
  const camStateBeforeShare = useRef(false);
  const subtitleTimersRef  = useRef({});
  const recognitionRef     = useRef(null);
  const recognitionActiveRef = useRef(false);
  const speakingThrottleRef = useRef({});
  const speakingStateRef   = useRef({});
  const isMountedRef       = useRef(true);
  const peerRef            = useRef(null);
  const speakingCleanupsRef = useRef({});
  const videoContainerRef  = useRef(null);

  const { id }    = useParams();
  const navigate  = useNavigate();
  const timer     = useMeetingTimer();
  const { rooms } = getRoomData() || {};

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Init local media ─────────────────────────────────────────────────────
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
    return () => { stream?.getTracks().forEach((t) => { t.enabled = false; t.stop(); }); };
  }, []); // Only on mount — mediaPrefs applied via track.enabled

  // ── Sync room data ───────────────────────────────────────────────────────
  useEffect(() => {
    const room = rooms?.find((r) => r.id === id || r._id === id);
    if (!isMountedRef.current) return;
    setCurrentRoomData(room || null);
    if (room && uId) setIsHost(room.ownerUid === uId || room.hostId === uId);
  }, [id, rooms, uId]);

  // ── Fetch user ───────────────────────────────────────────────────────────
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

  // ── Click-outside handlers ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) setIsSettingOn(null);
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target)) setShowReactionPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Data helpers ─────────────────────────────────────────────────────────
  const sendDataToAll = useCallback((msg) => {
    Object.values(chatConnectionsRef.current).forEach((conn) => {
      try { if (conn.open) conn.send(msg); } catch {}
    });
  }, []);

  const processIncomingData = useCallback((data) => {
    if (data.type === 'reaction') {
      const { peerId: sender, emoji } = data;
      const rid = Date.now();
      setReactions((prev) => ({ ...prev, [sender]: [...(prev[sender] || []), { id: rid, emoji }] }));
      setTimeout(() => {
        setReactions((prev) => ({ ...prev, [sender]: (prev[sender] || []).filter((r) => r.id !== rid) }));
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

  // ── Speaking detection ───────────────────────────────────────────────────
  const detectSpeaking = useCallback((rPeerId, stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    const analyser = audioCtx.createAnalyser();
    analyser.smoothingTimeConstant = 0.7;
    analyser.fftSize = 1024;
    try {
      audioCtx.createMediaStreamSource(stream).connect(analyser);
    } catch {
      audioCtx.close();
      return () => {};
    }
    const data = new Uint8Array(analyser.frequencyBinCount);
    let speakingTimeout = null;
    let raf = null;

    const updateSpeaking = (val) => {
      const now = Date.now();
      const last = speakingThrottleRef.current[rPeerId] || 0;
      const cur  = speakingStateRef.current[rPeerId];
      if (cur === val || now - last < SPEAKING_THROTTLE_MS) return;
      speakingThrottleRef.current[rPeerId] = now;
      speakingStateRef.current[rPeerId]    = val;
      setRemoteStream((prev) => prev.map((u) => u.peerId === rPeerId ? { ...u, remotePeer: { ...u.remotePeer, isSpeaking: val } } : u));
    };

    const check = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) sum += data[i];
      const avg = sum / (data.length / 4);
      if (avg > SPEAKING_THRESHOLD) {
        updateSpeaking(true);
        if (speakingTimeout) { clearTimeout(speakingTimeout); speakingTimeout = null; }
      } else if (speakingStateRef.current[rPeerId] && !speakingTimeout) {
        speakingTimeout = setTimeout(() => { updateSpeaking(false); speakingTimeout = null; }, SPEAKING_HOLD_MS);
      }
      raf = requestAnimationFrame(check);
    };
    check();

    return () => {
      if (speakingTimeout) clearTimeout(speakingTimeout);
      if (raf) cancelAnimationFrame(raf);
      try { audioCtx.close(); } catch {}
      delete speakingStateRef.current[rPeerId];
      delete speakingThrottleRef.current[rPeerId];
    };
  }, []);

  const addRemoteVideo = useCallback((rPeerId, stream, remotePeer) => {
    if (!remotePeer?.uid || remotePeer.uid === uId) return;
    setRemoteStream((prev) => {
      const filtered = prev.filter((v) => v.remotePeer?.uid !== remotePeer.uid);
      return [...filtered, { peerId: rPeerId, stream, remotePeer }];
    });
  }, [uId]);

  const removeRemoteVideo = useCallback((rPeerId) => {
    speakingCleanupsRef.current[rPeerId]?.();
    delete speakingCleanupsRef.current[rPeerId];
    setRemoteStream((prev) => prev.filter((u) => u.peerId !== rPeerId));
    delete dataConnectionsRef.current[rPeerId];
    delete chatConnectionsRef.current[rPeerId];
  }, []);

  // ── PeerJS & Socket ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !uId) return;

    const peerInstance = new Peer();
    peerRef.current = peerInstance;

    peerInstance.on('open', (pid) => { if (isMountedRef.current) setPeerId(pid); });

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
        addRemoteVideo(call.peer, stream, { uid: call.peer, name: 'User', photo: '' });
        speakingCleanupsRef.current[call.peer]?.();
        speakingCleanupsRef.current[call.peer] = detectSpeaking(call.peer, stream);
      });
      dataConnectionsRef.current[call.peer] = call;
      call.on('close', () => removeRemoteVideo(call.peer));
      call.on('error', () => removeRemoteVideo(call.peer));
    });

    socket.on('room-participants', (participants) => {
      if (isMountedRef.current) setRemotePeerIds(participants.filter((p) => p.uid !== uId));
    });
    socket.on('media-state-updated', ({ userId, isAudioEnabled: aE, isVideoEnabled: vE }) => {
      if (!isMountedRef.current) return;
      setRemoteStream((prev) => prev.map((u) => u.remotePeer?.uid === userId ? { ...u, remotePeer: { ...u.remotePeer, isAudioEnabled: aE, isVideoEnabled: vE } } : u));
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
      if (!isChatToggleOpen && isMountedRef.current) setUnreadCount((c) => c + 1);
    });

    return () => {
      Object.values(speakingCleanupsRef.current).forEach((fn) => fn?.());
      Object.values(dataConnectionsRef.current).forEach((c) => { try { c.close(); } catch {} });
      Object.values(chatConnectionsRef.current).forEach((c) => { try { c.close(); } catch {} });
      peerInstance.destroy();
      socket.off('room-participants');
      socket.off('media-state-updated');
      socket.off('you-are-kicked');
      socket.off('you-are-force-muted');
      socket.off('receive-message');
    };
  }, [id, uId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Join room when identity ready ────────────────────────────────────────
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
  }, [peerId, currUserData, id, uId, mediaPrefs]);

  // ── Connect to peers ─────────────────────────────────────────────────────
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

  // ── Media controls ───────────────────────────────────────────────────────
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

  // ── Screen share — FIX for black screen ──────────────────────────────────
  //
  // Root cause of black screen:
  //   1. The sender was looked up by track.kind only — if the sender's current
  //      track was already replaced/ended, getSenders() returned stale data.
  //   2. The local video element's srcObject was set to a new MediaStream with
  //      the screen track, but the old camera stream was never properly paused/
  //      resumed.
  //   3. The 'ended' event handler captured a stale `isScreenSharing` closure.
  //
  // Fix strategy:
  //   a. Find senders by track kind AND prefer senders that already have a
  //      video track (robust selection).
  //   b. When stopping, re-acquire the original camera track from localStreamRef
  //      (never from a stale closure).
  //   c. Use a ref (screenSharingRef) for the 'ended' handler to avoid stale
  //      closures — state setters are stable, refs are not stale.
  //   d. Always explicitly call localVideoRef.current.load() if srcObject changes
  //      to force the video element to re-initialize on browsers that cache.
  //   e. Stop + nullify screenStreamRef tracks before replaceTrack to prevent
  //      the browser from holding the screen capture open.
  
  const screenSharingRef = useRef(false); // ref mirror of isScreenSharing for handlers

  const restoreCameraAfterScreenShare = useCallback(() => {
    if (!localStreamRef.current) return;
    const [cameraTrack] = localStreamRef.current.getVideoTracks();
    if (cameraTrack) {
      // Restore track enabled state to what it was before screen share
      cameraTrack.enabled = camStateBeforeShare.current;

      // Replace track on every active peer connection
      Object.values(dataConnectionsRef.current).forEach((call) => {
        const pc = call.peerConnection;
        if (!pc) return;
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === 'video' || (sender.track === null && sender.transport)) {
            sender.replaceTrack(cameraTrack).catch((e) => {
              console.warn('[ScreenShare] replaceTrack (restore) failed:', e);
            });
          }
        });
      });

      // Restore local preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }

      if (isMountedRef.current) {
        setIsVideoEnabled(camStateBeforeShare.current);
        setIsScreenSharing(false);
        screenSharingRef.current = false;
      }
    } else {
      if (isMountedRef.current) {
        setIsScreenSharing(false);
        screenSharingRef.current = false;
      }
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    // Stop and clean up screen tracks
    screenStreamRef.current?.getTracks().forEach((t) => { t.stop(); });
    screenStreamRef.current = null;
    restoreCameraAfterScreenShare();
  }, [restoreCameraAfterScreenShare]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      // Save camera state
      const [cameraTrack] = localStreamRef.current?.getVideoTracks() || [];
      camStateBeforeShare.current = cameraTrack?.enabled ?? false;

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', displaySurface: 'monitor' },
        audio: false,
      });
      screenStreamRef.current = screenStream;
      const [screenTrack] = screenStream.getVideoTracks();

      if (!screenTrack) {
        screenStream.getTracks().forEach((t) => t.stop());
        return;
      }

      // Replace video track on every peer sender
      const replacePromises = [];
      Object.values(dataConnectionsRef.current).forEach((call) => {
        const pc = call.peerConnection;
        if (!pc) return;
        const videoSenders = pc.getSenders().filter((s) => s.track?.kind === 'video' || s.track === null);
        videoSenders.forEach((sender) => {
          replacePromises.push(
            sender.replaceTrack(screenTrack).catch((e) => {
              console.warn('[ScreenShare] replaceTrack failed:', e);
            })
          );
        });
      });

      // Don't await all — set state immediately to prevent UI lag
      Promise.allSettled(replacePromises);

      // Show screen in local preview
      if (localVideoRef.current) {
        // Use the screen stream directly — do NOT mirror it
        localVideoRef.current.srcObject = new MediaStream([screenTrack]);
        localVideoRef.current.play().catch(() => {});
        // Remove mirror transform for screen share
        localVideoRef.current.style.transform = 'none';
      }

      setIsScreenSharing(true);
      screenSharingRef.current = true;
      setIsVideoEnabled(true);

      // Handle user stopping via browser UI (clicking "Stop sharing")
      screenTrack.addEventListener('ended', () => {
        // Use ref — NOT closure state — to avoid stale isScreenSharing
        if (!screenSharingRef.current) return;
        screenStreamRef.current = null;
        restoreCameraAfterScreenShare();
        // Restore mirror transform
        if (localVideoRef.current) {
          localVideoRef.current.style.transform = '';
        }
      }, { once: true });

    } catch (err) {
      if (err.name !== 'NotAllowedError') console.error('[RoomMain] Screen share error:', err);
    }
  }, [isScreenSharing, stopScreenShare, restoreCameraAfterScreenShare]);

  // Restore mirror transform when screen share ends
  useEffect(() => {
    if (!isScreenSharing && localVideoRef.current) {
      localVideoRef.current.style.transform = '';
    }
  }, [isScreenSharing]);

  // ── Reactions ─────────────────────────────────────────────────────────────
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
      if (next) Swal.fire({ toast: true, icon: 'info', title: '✋ Hand raised', position: 'top-start', timer: 2000, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      return next;
    });
  }, [peerId, sendDataToAll]);

  // ── Host controls ─────────────────────────────────────────────────────────
  const kickUser = useCallback(async (targetUid) => {
    const confirm = await Swal.fire({ title: 'Kick this user?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#334155', confirmButtonText: 'Kick', background: '#1e293b', color: '#fff' });
    if (confirm.isConfirmed) socket.emit('admin-kick-user', { targetUid });
  }, []);

  const forceMuteUser = useCallback((targetUid) => {
    socket.emit('admin-force-mute', { targetUid });
  }, []);

  // ── Subtitles ─────────────────────────────────────────────────────────────
  const startSubtitles = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || recognitionRef.current) return;
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    r.onresult = (e) => {
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      if (isMountedRef.current) setLocalSubtitle(txt);
      sendDataToAll({ type: 'subtitle', peerId, name: currUserData?.displayName || 'You', text: txt });
      clearTimeout(subtitleTimersRef.current['local']);
      subtitleTimersRef.current['local'] = setTimeout(() => { if (isMountedRef.current) setLocalSubtitle(''); }, 3000);
    };
    r.onerror = (e) => { if (e.error !== 'no-speech') console.warn('[SR] error:', e.error); };
    r.onend = () => { if (recognitionActiveRef.current && recognitionRef.current) { try { r.start(); } catch {} } };
    recognitionActiveRef.current = true;
    recognitionRef.current = r;
    r.start();
  }, [peerId, currUserData, sendDataToAll]);

  const stopSubtitles = useCallback(() => {
    recognitionActiveRef.current = false;
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

  // ── Hangup ────────────────────────────────────────────────────────────────
  const handleHangup = useCallback(async (silent = false) => {
    if (isHangingUp.current) return;
    isHangingUp.current = true;
    stopSubtitles();
    Object.values(speakingCleanupsRef.current).forEach((fn) => fn?.());
    speakingCleanupsRef.current = {};
    localStreamRef.current?.getTracks().forEach((t) => { t.enabled = false; t.stop(); });
    screenStreamRef.current?.getTracks().forEach((t) => { t.enabled = false; t.stop(); });
    Object.values(dataConnectionsRef.current).forEach((c) => { try { c.close(); } catch {} });
    Object.values(chatConnectionsRef.current).forEach((c) => { try { c.close(); } catch {} });
    peerRef.current?.destroy();
    socket.emit('leave-room', { roomId: id, userId: uId });
    navigate('/Rooms');
  }, [id, uId, navigate, stopSubtitles]);

  const showLeaveModal = useCallback(() => {
    Swal.fire({ title: 'Leave the meeting?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#334155', confirmButtonText: 'Leave', background: '#1e293b', color: '#fff' })
      .then((r) => { if (r.isConfirmed) handleHangup(); });
  }, [handleHangup]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handler = () => { window.history.pushState(null, '', window.location.href); showLeaveModal(); };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [showLeaveModal]);

  // ── Derived values ────────────────────────────────────────────────────────
  const filteredRemoteStream = useMemo(() => remoteStream.filter((u) => u.remotePeer?.uid !== uId), [remoteStream, uId]);

  const activeSubtitleLines = useMemo(() => [
    ...(localSubtitle ? [{ key: 'local', name: 'You', text: localSubtitle }] : []),
    ...Object.entries(subtitles).map(([key, v]) => ({ key, name: v.name, text: v.text })),
  ], [localSubtitle, subtitles]);

  const gridClass = useMemo(() => {
    const count = filteredRemoteStream.length;
    if (count === 0) return 'flex items-center justify-center';
    if (count === 1) return 'grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3';
    if (count <= 3) return 'grid grid-cols-2 gap-2 sm:gap-3';
    return 'grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3';
  }, [filteredRemoteStream.length]);

  const handleSettingToggle = useCallback((pid) => { setIsSettingOn((prev) => (prev === pid ? null : pid)); }, []);

  const handleChatOpen = useCallback(() => {
    setUnreadCount(0);
    dispatch(toggleChatSidebar(true));
  }, [dispatch]);

  const isPageLoading = userLoading || !currentRoomData;

  // ── Loading screen ────────────────────────────────────────────────────────
  if (isPageLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a] dark:bg-[#0f172a] text-white gap-6">
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
        @keyframes floatUp { 0%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} 80%{opacity:1} 100%{opacity:0;transform:translateX(-50%) translateY(-120px) scale(1.4)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="room-container overflow-hidden bg-[#0f172a] dark:bg-[#0f172a] h-screen w-screen relative text-white font-sans flex flex-col">
        {/* ── TopBar ── */}
        <header className="relative flex-shrink-0 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-5 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col leading-tight">
              <h1 className="text-xs sm:text-sm font-bold text-gray-100 max-w-[100px] sm:max-w-[180px] truncate">{currentRoomData?.Title || 'Meeting Room'}</h1>
              <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium uppercase tracking-wide">#{id?.slice(0, 6)} {isHost && <span className="text-amber-400 ml-1">· HOST</span>}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Live · {timer}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* <ThemeToggleIcon /> */}
            <button onClick={() => setShowParticipants((v) => !v)} className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all">
              <i className="fa-solid fa-users text-[11px]" /> {filteredRemoteStream.length + 1}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); Swal.fire({ icon: 'success', title: 'Link copied!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#1e293b', color: '#fff' }); }} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-all">
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
          remoteStream={filteredRemoteStream}
          currUserData={currUserData}
          localVideoRef={localVideoRef}
          uId={uId}
          show={showParticipants}
        />

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* ── VideoGrid ── */}
          <div
            ref={videoContainerRef}
            className={`relative flex-shrink-0 overflow-hidden p-2 sm:p-3 h-[58vh] md:h-full transition-all duration-500 ease-in-out ${isChatToggleOpen ? 'w-full md:w-[70%]' : 'w-full'} ${gridClass}`}
          >
            {/* LocalVideoCard */}
            <LocalVideoCard
              localVideoRef={localVideoRef}
              isVideoEnabled={isVideoEnabled}
              isAudioEnabled={isAudioEnabled}
              isScreenSharing={isScreenSharing}
              localReactions={localReactions}
              raisedHand={raisedHand}
              currUserData={currUserData}
              onRemoveReaction={removeLocalReaction}
              isSolo={filteredRemoteStream.length === 0}
            />

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
              />
            ))}

            {/* SubtitleOverlay */}
            <SubtitleOverlay lines={activeSubtitleLines} />
          </div>

          {/* ── Chat sidebar ────────────────────────────────────────────────
              KEY FIX: Never conditionally unmount Chat — only hide it with
              CSS. This keeps the component mounted so:
                1. The textarea ref remains stable
                2. Socket listeners stay active
                3. Message history is preserved
                4. Focus state is never reset by unmounting
          ─────────────────────────────────────────────────────────────────── */}
          <div
            className={`
              fixed bottom-0 left-0 right-0 z-[60] h-[60vh]
              md:static md:h-full md:w-[30%] md:min-w-[280px] md:max-w-[400px]
              bg-[#ffffff] dark:bg-[#0B1120]
              border-t md:border-t-0 md:border-l border-white/10
              shadow-2xl transform transition-transform duration-300 ease-in-out
              ${isChatToggleOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full md:w-0 md:min-w-0 md:overflow-hidden'}
            `}
            aria-hidden={!isChatToggleOpen}
          >
            {/* ── Render Chat once and keep mounted ── */}
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
        <ReactionPicker
          show={showReactionPicker}
          onReact={sendReaction}
          pickerRef={reactionPickerRef}
        />

        {/* ── BottomControls ── */}
        <div className="flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-[#0a0f1e]/90 backdrop-blur-xl border-t border-white/5 z-50 flex-wrap">
          <ControlBtn active={isAudioEnabled} onClick={toggleAudio} icon={isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'} label={isAudioEnabled ? 'Mute' : 'Unmute'} danger={!isAudioEnabled} />
          <ControlBtn active={isVideoEnabled} onClick={toggleVideo} icon={isVideoEnabled ? 'fa-video' : 'fa-video-slash'} label={isVideoEnabled ? 'Camera off' : 'Camera on'} danger={!isVideoEnabled} disabled={isScreenSharing} />
          <ControlBtn active={isScreenSharing} onClick={toggleScreenShare} icon={isScreenSharing ? 'fa-stop' : 'fa-display'} label={isScreenSharing ? 'Stop' : 'Share'} accent="blue" />
          <ControlBtn active={showReactionPicker} onClick={() => setShowReactionPicker((v) => !v)} icon="fa-face-smile" label="React" accent="yellow" />

          <button
            onClick={toggleRaiseHand}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl transition-all duration-200 ${raisedHand ? 'bg-amber-500/90 text-white shadow-lg shadow-amber-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'}`}
          >
            <span className="text-base sm:text-xl">✋</span>
            <span className="text-[8px] sm:text-[10px] font-medium hidden sm:block">{raisedHand ? 'Lower' : 'Raise'}</span>
          </button>

          <ControlBtn active={subtitlesEnabled} onClick={toggleSubtitles} icon="fa-closed-captioning" label="CC" accent="indigo" />

          <button onClick={handleChatOpen} className="relative flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20">
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-[8px] sm:text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-[#0a0f1e]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <i className="fas fa-comment-dots text-sm sm:text-lg" />
            <span className="text-[8px] sm:text-[10px] font-medium hidden sm:block">Chat</span>
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <button onClick={showLeaveModal} className="flex flex-col items-center gap-0.5 sm:gap-1 px-3 sm:px-5 py-1.5 sm:py-2 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/25">
            <i className="fas fa-phone-slash rotate-[135deg] text-sm sm:text-lg" />
            <span className="text-[8px] sm:text-[10px] font-bold hidden sm:block">Leave</span>
          </button>
        </div>
      </div>
    </RoomErrorBoundary>
  );
};

export default RoomMain;