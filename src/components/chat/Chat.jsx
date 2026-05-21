// src/components/chat/Chat.jsx
// ─────────────────────────────────────────────────────────────────────────────
// FIXES:
//   1. Chat input focus bug — input is rendered unconditionally (no hidden/block
//      swap), pointer-events are always 'auto', and we focus via a stable ref
//      callback on mount + whenever the sidebar opens.
//   2. Screen-share black screen — handled in RoomMain (see RoomMain.jsx).
//   3. Image sharing via Socket.IO RAM-based chunked transfer.
//   4. Full dark / light mode.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import socket from '../../services/socket';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import EmojiPicker from 'emoji-picker-react';

import useAddMessage from '../../hooks/useAddMessage';
import getUserDataFromFirestore from '../../hooks/getUserData';
import openAIChat from '../../hooks/openAIChat';
import { toggleChatSidebar } from '../../redux/action';
import botimg from '../../assets/robot.png';

import msgpopSrc from '../../assets/happy-pop-3-185288.mp3';
const msgPopAudio = new Audio(msgpopSrc);
msgPopAudio.preload = 'auto';

// ─── Constants ────────────────────────────────────────────────────────────────
const MSG_REACTIONS      = ['👍', '❤️', '😂', '😮', '🎉'];
const TYPING_DEBOUNCE_MS = 3000;
const SMART_REPLY_DELAY  = 800;
const MAX_MSG_LENGTH     = 2000;
const SEND_COOLDOWN_MS   = 500;
const BOT_COOLDOWN_MS    = 3000;
const MAX_IMAGE_SIZE     = 2 * 1024 * 1024; // 2 MB
const CHUNK_SIZE         = 16 * 1024;       // 16 KB per chunk
const ALLOWED_MIME       = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [['rel', 'noopener noreferrer'], ['target', '_blank'], 'href', 'title'],
  },
  protocols: { ...defaultSchema.protocols, href: ['http', 'https', 'mailto'] },
};

// ─── Markdown renderers ───────────────────────────────────────────────────────
const markdownComponents = {
  p:      ({ children }) => <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em:     ({ children }) => <em className="italic">{children}</em>,
  del:    ({ children }) => <del className="line-through opacity-60">{children}</del>,
  code:   ({ inline, children }) => inline
    ? <code className="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-black/10">{children}</code>
    : <pre className="mt-2 mb-2 p-3 rounded-xl text-[13px] font-mono overflow-x-auto bg-black/20 shadow-inner"><code>{children}</code></pre>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-white/40 underline-offset-2 hover:decoration-white transition-all break-all">{children}</a>
  ),
};

const markdownComponentsOther = {
  ...markdownComponents,
  p: ({ children }) => <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-100">{children}</p>,
  code: ({ inline, children }) => inline
    ? <code className="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-gray-100 dark:bg-gray-700 text-pink-600 dark:text-pink-400">{children}</code>
    : <pre className="mt-2 mb-2 p-3 rounded-xl text-[13px] font-mono overflow-x-auto bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-inner"><code>{children}</code></pre>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 underline-offset-2 transition-all break-all">{children}</a>
  ),
};

const MarkdownContent = memo(({ text, isOwn }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
    components={isOwn ? markdownComponents : markdownComponentsOther}
  >
    {text}
  </ReactMarkdown>
));

// ─── useAutoResize ─────────────────────────────────────────────────────────────
function useAutoResize(ref, value) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [value, ref]);
}

// ─── Image-upload helpers ─────────────────────────────────────────────────────
function validateImage(file) {
  if (!ALLOWED_MIME.includes(file.type)) return 'Only JPEG, PNG, GIF, or WebP images are allowed.';
  if (file.size > MAX_IMAGE_SIZE) return 'Image must be smaller than 2 MB.';
  return null;
}

async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result.split(',')[1]);
    reader.onerror = () => rej(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

// ─── Image preview modal ──────────────────────────────────────────────────────
const ImageModal = memo(({ src, onClose }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
        <i className="fas fa-times" />
      </button>
      <img
        src={src}
        alt="Full size"
        className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
});

// ─── Image upload progress ────────────────────────────────────────────────────
const UploadProgress = memo(({ uploads }) => {
  if (!uploads || uploads.length === 0) return null;
  return (
    <div className="px-4 mb-2 flex flex-col gap-1.5">
      {uploads.map((u) => (
        <div key={u.id} className="flex items-center gap-2 bg-white dark:bg-[#1E2532] border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2">
          <img src={u.preview} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">{u.name}</p>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${u.progress}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{u.progress}%</span>
        </div>
      ))}
    </div>
  );
});

// ─── Image preview before send ────────────────────────────────────────────────
const ImagePreviews = memo(({ previews, onRemove }) => {
  if (!previews || previews.length === 0) return null;
  return (
    <div className="flex gap-2 flex-wrap px-4 mb-2">
      {previews.map((p) => (
        <div key={p.id} className="relative">
          <img src={p.dataUrl} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-blue-400 shadow-md" />
          <button
            onClick={() => onRemove(p.id)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] transition-colors shadow"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      ))}
    </div>
  );
});

// ─── ChatErrorBoundary ────────────────────────────────────────────────────────
class ChatErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[ChatErrorBoundary]', error, info.componentStack); }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3">
          <i className="fas fa-triangle-exclamation text-3xl text-amber-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Something went wrong in the chat.</p>
          <button onClick={() => this.setState({ error: null })} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm transition-colors">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── MessageCard ──────────────────────────────────────────────────────────────
const MessageCard = memo(({ msgData, uId, onReply, onReact, msgReactions, onImageClick }) => {
  const [showMore,       setShowMore]       = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const reactRef = useRef(null);

  const isOwn  = uId === msgData.userid || uId === msgData.senderId;
  const isEmoji = /^\p{Emoji}+$/u.test((msgData?.text || '').trim()) && msgData.text?.trim().length <= 4;

  const time = useMemo(() => {
    let d = new Date();
    if (msgData?.createdAt) d = new Date(msgData.createdAt);
    else if (msgData?.timestampField?.seconds) d = new Date(msgData.timestampField.seconds * 1000);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }, [msgData]);

  const displayText = useMemo(() => {
    if (isEmoji) return msgData.text || '';
    if (!showMore && msgData.text?.length > 300) return msgData.text.slice(0, 300) + '…';
    return msgData.text || '';
  }, [isEmoji, msgData.text, showMore]);

  const reactionSummary = useMemo(() => {
    if (!msgReactions || Object.keys(msgReactions).length === 0) return null;
    return Object.values(msgReactions).reduce((acc, e) => { acc[e] = (acc[e] || 0) + 1; return acc; }, {});
  }, [msgReactions]);

  useEffect(() => {
    const h = (e) => { if (reactRef.current && !reactRef.current.contains(e.target)) setShowReactPicker(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleReply = useCallback(() => onReply(msgData), [onReply, msgData]);

  return (
    <div className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`flex items-end gap-2.5 max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <div className="relative flex-shrink-0 mb-1">
            <img
              referrerPolicy="no-referrer"
              src={msgData.role === 'bot' ? botimg : (msgData?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png')}
              className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
              alt="Avatar"
            />
            {msgData.role === 'bot' && (
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                <i className="fas fa-bolt text-[6px] text-white" />
              </div>
            )}
          </div>
        )}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && !isEmoji && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 ml-1 font-medium tracking-wide">
              {msgData.role === 'bot' ? 'AI Assistant' : (msgData.displayName || msgData.senderName || 'User')}
            </span>
          )}

          {/* Image message */}
          {msgData.type === 'image' && msgData.dataUrl && (
            <div className={`rounded-2xl overflow-hidden shadow-md cursor-pointer hover:opacity-95 transition-opacity ${isOwn ? 'rounded-br-[6px]' : 'rounded-bl-[6px]'}`}>
              <img
                src={msgData.dataUrl}
                alt="Shared image"
                className="max-w-[240px] max-h-[240px] object-cover block"
                onClick={() => onImageClick(msgData.dataUrl)}
                loading="lazy"
              />
              <div className={`px-2 py-1 text-[10px] ${isOwn ? 'text-right text-blue-100 bg-blue-600' : 'text-right text-gray-400 dark:text-gray-500 bg-white dark:bg-[#1E2532]'}`}>
                {time}
              </div>
            </div>
          )}

          {/* Text message */}
          {msgData.type !== 'image' && (
            <div className={`relative group/bubble ${
              isEmoji ? 'bg-transparent' : isOwn
                ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-[22px] rounded-br-[6px] shadow-[0_2px_10px_-2px_rgba(37,99,235,0.3)]'
                : 'bg-white dark:bg-[#1E2532] text-gray-800 dark:text-gray-100 rounded-[22px] rounded-bl-[6px] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800'
            } ${!isEmoji ? 'px-4 py-3' : ''}`}>
              {!isEmoji && msgData?.replyto && (
                <div className={`text-[12px] mb-2.5 p-2 rounded-xl flex flex-col gap-0.5 ${isOwn ? 'bg-black/10 text-white/90' : 'bg-gray-50 dark:bg-[#131823] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50'}`}>
                  <span className={`font-semibold flex items-center gap-1.5 ${isOwn ? 'text-blue-100' : 'text-blue-500 dark:text-blue-400'}`}>
                    <i className="fas fa-reply text-[9px]" /> {msgData.replytoName}
                  </span>
                  <span className="truncate max-w-[220px] opacity-80">{msgData.replyto}</span>
                </div>
              )}

              {isEmoji ? (
                <span className="text-5xl block select-none hover:scale-110 transition-transform duration-300 origin-bottom" role="img">{msgData.text}</span>
              ) : (
                <div className="pb-3 relative min-w-[60px]">
                  <MarkdownContent text={displayText} isOwn={isOwn} />
                  {msgData.text?.length > 300 && (
                    <button onClick={() => setShowMore(v => !v)} className={`text-[12px] mt-1.5 font-semibold transition-colors ${isOwn ? 'text-blue-200 hover:text-white' : 'text-blue-500 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                      {showMore ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {!isEmoji && (
                <div className={`absolute bottom-2 right-3 flex items-center gap-1 ${isOwn ? 'text-blue-100/80' : 'text-gray-400 dark:text-gray-500'}`}>
                  <span className="text-[10px] font-medium">{time}</span>
                  {isOwn && <i className="fa-solid fa-check-double text-[10px]" />}
                </div>
              )}

              {reactionSummary && (
                <div className={`absolute -bottom-3 ${isOwn ? 'right-2' : 'left-2'} flex flex-wrap gap-1 z-10`}>
                  {Object.entries(reactionSummary).map(([emoji, count]) => (
                    <span key={emoji} className={`text-[12px] flex items-center gap-1 rounded-full px-2 py-0.5 shadow-sm border ${
                      isOwn
                        ? 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
                        : 'bg-white border-gray-100 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
                    }`}>
                      {emoji} {count > 1 && <span className="text-[10px] font-bold opacity-70">{count}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div ref={reactRef} className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-200 self-center mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <button onClick={handleReply} className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-500 flex items-center justify-center transition-all">
            <i className="fas fa-reply text-[12px]" />
          </button>
          <div className="relative">
            <button onClick={() => setShowReactPicker(v => !v)} className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 hover:text-yellow-500 flex items-center justify-center transition-all">
              <i className="far fa-face-smile text-[14px]" />
            </button>
            {showReactPicker && (
              <div role="menu" className={`absolute bottom-10 ${isOwn ? 'right-0' : 'left-0'} flex gap-1.5 p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-50`}>
                {MSG_REACTIONS.map((e) => (
                  <button key={e} onClick={() => { onReact(msgData._id || msgData.id, e); setShowReactPicker(false); }} className="text-xl hover:scale-125 hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.msgData === next.msgData &&
  prev.uId === next.uId &&
  prev.msgReactions === next.msgReactions
);

const TypingIndicator = memo(({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null;
  const names  = typingUsers.slice(0, 2).join(', ');
  const suffix = typingUsers.length > 2 ? ` +${typingUsers.length - 2} more` : '';
  return (
    <div className="flex items-center gap-3 px-4 py-2 mb-2">
      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-2xl rounded-bl-md shadow-sm border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
      <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
        <strong>{names}{suffix}</strong> {typingUsers.length === 1 ? 'is typing' : 'are typing'}…
      </span>
    </div>
  );
});

const DateSeparator = memo(({ date }) => (
  <div className="flex items-center justify-center my-6">
    <span className="text-[11px] tracking-wide text-gray-500 dark:text-gray-400 font-semibold px-4 py-1 bg-gray-100 dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700/50">
      {date}
    </span>
  </div>
));

const SmartReplies = memo(({ replies, onSelect, isLoading }) => {
  if (!isLoading && (!replies || replies.length === 0)) return null;
  return (
    <div className="flex gap-2 flex-wrap mb-3 px-1">
      <div className="flex items-center gap-1.5 mr-1"><i className="fas fa-sparkles text-blue-500 text-[12px]" /></div>
      {isLoading
        ? [1, 2, 3].map((i) => <div key={i} className="h-8 w-24 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />)
        : replies.map((r, i) => (
          <button key={i} onClick={() => onSelect(r)} className="text-[13px] px-4 py-1.5 bg-white dark:bg-[#1E2532] border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 transition-all shadow-sm active:scale-95">
            {r}
          </button>
        ))
      }
    </div>
  );
});

// ─── Main Chat Component ──────────────────────────────────────────────────────
const Chat = ({ uId }) => {
  const [messages,      setMessages]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [message,       setMessage]       = useState('');
  const [currentUser,   setCurrentUser]   = useState(null);
  const [isOpenEmoji,   setIsOpenEmoji]   = useState(false);
  const [replyingTo,    setReplyingTo]    = useState(null);
  const [msgReactions,  setMsgReactions]  = useState({});
  const [typingUsers,   setTypingUsers]   = useState([]);
  const [isAiTyping,    setIsAiTyping]    = useState(false);
  const [smartReplies,  setSmartReplies]  = useState([]);
  const [smartLoading,  setSmartLoading]  = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);   // { id, dataUrl, name, file }
  const [uploads,       setUploads]       = useState([]);   // active uploads with progress
  const [lightboxSrc,   setLightboxSrc]   = useState(null);
  const [dragOver,      setDragOver]      = useState(false);

  const typingTimerRef     = useRef(null);
  const smartReplyTimerRef = useRef(null);
  const isMountedRef       = useRef(true);
  const chatBoxRef         = useRef(null);
  const bottomRef          = useRef(null);
  const fileInputRef       = useRef(null);
  const sendCooldownRef    = useRef(0);
  const botCooldownRef     = useRef(0);
  const lastSmartCtxRef    = useRef('');
  const uploadSeqRef       = useRef({}); // track chunk reassembly: { uploadId: { chunks, total, meta } }

  // ── FIX #1: stable inputRef + focus on mount & sidebar open ──────────────
  const inputRef = useRef(null);

  // Stable callback ref ensures focus fires exactly once when the element mounts
  const inputCallbackRef = useCallback((el) => {
    inputRef.current = el;
    if (el) {
      // Use rAF to ensure the browser has painted and the element is interactive
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.focus({ preventScroll: true });
        });
      });
    }
  }, []); // empty deps — stable for lifetime of component

  useAutoResize(inputRef, message);

  const { id }     = useParams();
  const dispatch   = useDispatch();
  const addMessage = useAddMessage();
  const isChatOpen = useSelector((s) => s.toggleChatSidebar);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Focus input when sidebar opens ───────────────────────────────────────
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus({ preventScroll: true });
        });
      });
    }
  }, [isChatOpen]);

  // ── Load history ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/chat/${id}`);
        if (isMountedRef.current) { setMessages(res.data); setLoading(false); }
      } catch {
        if (isMountedRef.current) setLoading(false);
      }
    };
    fetchHistory();
  }, [id, backendUrl]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const onMessage    = (msg) => { if (isMountedRef.current) setMessages((p) => [...p, msg]); };
    const onTyping     = ({ name, isTyping }) => {
      if (!isMountedRef.current) return;
      setTypingUsers((p) => {
        if (isTyping && !p.includes(name)) return [...p, name];
        if (!isTyping) return p.filter((n) => n !== name);
        return p;
      });
    };
    const onReaction   = ({ msgId, emoji, userId }) => {
      if (!isMountedRef.current) return;
      setMsgReactions((p) => ({ ...p, [msgId]: { ...(p[msgId] || {}), [userId]: emoji } }));
    };

    // ── Image chunk reassembly ──────────────────────────────────────────────
    const onImageStart = ({ uploadId, totalChunks, meta }) => {
      uploadSeqRef.current[uploadId] = { chunks: new Array(totalChunks), total: totalChunks, received: 0, meta };
    };
    const onImageChunk = ({ uploadId, index, data }) => {
      const entry = uploadSeqRef.current[uploadId];
      if (!entry) return;
      entry.chunks[index] = data;
      entry.received += 1;
    };
    const onImageComplete = ({ uploadId, senderId, senderName, senderPhoto, timestamp }) => {
      const entry = uploadSeqRef.current[uploadId];
      if (!entry) return;
      const base64 = entry.chunks.join('');
      const dataUrl = `data:${entry.meta.mimeType};base64,${base64}`;
      delete uploadSeqRef.current[uploadId];

      const imgMsg = {
        id: uploadId,
        type: 'image',
        dataUrl,
        userid: senderId,
        displayName: senderName,
        photoURL: senderPhoto,
        createdAt: timestamp,
        role: 'user',
      };
      if (isMountedRef.current) setMessages((p) => [...p, imgMsg]);
    };
    const onUploadProgress = ({ uploadId, progress }) => {
      if (!isMountedRef.current) return;
      setUploads((p) => p.map((u) => u.id === uploadId ? { ...u, progress } : u));
    };
    const onUploadError = ({ uploadId, error }) => {
      if (!isMountedRef.current) return;
      setUploads((p) => p.filter((u) => u.id !== uploadId));
      console.warn('[Chat] Upload error:', error);
    };

    socket.on('receive-message',        onMessage);
    socket.on('user-typing',            onTyping);
    socket.on('receive-reaction',       onReaction);
    socket.on('image-upload-start',     onImageStart);
    socket.on('image-upload-chunk',     onImageChunk);
    socket.on('image-upload-complete',  onImageComplete);
    socket.on('upload-progress',        onUploadProgress);
    socket.on('upload-error',           onUploadError);

    return () => {
      socket.off('receive-message',        onMessage);
      socket.off('user-typing',            onTyping);
      socket.off('receive-reaction',       onReaction);
      socket.off('image-upload-start',     onImageStart);
      socket.off('image-upload-chunk',     onImageChunk);
      socket.off('image-upload-complete',  onImageComplete);
      socket.off('upload-progress',        onUploadProgress);
      socket.off('upload-error',           onUploadError);
    };
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 100);
    return () => clearTimeout(t);
  }, [messages.length, isAiTyping]);

  // ── Load user data ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    getUserDataFromFirestore(uId)
      .then((data) => { if (!cancelled && isMountedRef.current) setCurrentUser(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [uId]);

  // ── Smart replies ─────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(smartReplyTimerRef.current);
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.type === 'image') { setSmartReplies([]); setSmartLoading(false); return; }
    const isFromOther = last?.userid !== uId && last?.senderId !== uId;
    if (!isFromOther) { setSmartReplies([]); setSmartLoading(false); return; }
    const ctxKey = last._id || last.id;
    if (lastSmartCtxRef.current === ctxKey) return;
    setSmartLoading(true);
    smartReplyTimerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      lastSmartCtxRef.current = ctxKey;
      try {
        const prompt = ['Suggest exactly 3 very short (max 6 words each) natural chat reply options.', `Message: \`\`\`${(last.text || '').slice(0, 120)}\`\`\``, 'Return ONLY a JSON array of 3 strings.'].join(' ');
        const raw = await openAIChat(prompt, '');
        if (!isMountedRef.current) return;
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
        if (Array.isArray(parsed)) setSmartReplies(parsed.slice(0, 3).filter((s) => typeof s === 'string'));
      } catch { if (isMountedRef.current) setSmartReplies([]); }
      finally { if (isMountedRef.current) setSmartLoading(false); }
    }, SMART_REPLY_DELAY);
    return () => clearTimeout(smartReplyTimerRef.current);
  }, [messages.length, uId]);

  // ── Image upload via Socket chunks ────────────────────────────────────────
  const uploadImage = useCallback(async (file) => {
    const error = validateImage(file);
    if (error) { alert(error); return; }

    const previewDataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej();
      r.readAsDataURL(file);
    });

    const uploadId = `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const uploadEntry = { id: uploadId, name: file.name, preview: previewDataUrl, progress: 0 };

    setUploads((p) => [...p, uploadEntry]);

    const base64 = await fileToBase64(file);
    const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);

    socket.emit('image-upload-start', {
      uploadId,
      roomId: id,
      totalChunks,
      meta: { mimeType: file.type, name: file.name, size: file.size },
      sender: {
        id: uId,
        name: currentUser?.displayName || 'User',
        photo: currentUser?.photoURL || '',
      },
    });

    for (let i = 0; i < totalChunks; i++) {
      const chunk = base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      socket.emit('image-upload-chunk', { uploadId, roomId: id, index: i, data: chunk });
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      setUploads((p) => p.map((u) => u.id === uploadId ? { ...u, progress } : u));
      // Small yield to prevent blocking event loop on large files
      if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0));
    }

    socket.emit('image-upload-complete', {
      uploadId,
      roomId: id,
      senderId: uId,
      senderName: currentUser?.displayName || 'User',
      senderPhoto: currentUser?.photoURL || '',
      timestamp: new Date().toISOString(),
    });

    // Optimistic: show locally immediately
    const localMsg = {
      id: uploadId + '_local',
      type: 'image',
      dataUrl: previewDataUrl,
      userid: uId,
      displayName: currentUser?.displayName,
      photoURL: currentUser?.photoURL,
      createdAt: new Date().toISOString(),
      role: 'user',
    };
    setMessages((p) => [...p, localMsg]);
    setUploads((p) => p.filter((u) => u.id !== uploadId));
  }, [id, uId, currentUser]);

  const handleFileSelect = useCallback(async (files) => {
    const arr = Array.from(files);
    // De-duplicate by name+size
    const seen = new Set(imagePreviews.map((p) => p.name + p.size));
    for (const file of arr) {
      const key = file.name + file.size;
      if (seen.has(key)) continue;
      const err = validateImage(file);
      if (err) { alert(err); continue; }
      const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
      setImagePreviews((p) => [...p, { id: `${Date.now()}_${Math.random()}`, dataUrl, name: file.name, size: file.size, file }]);
      seen.add(key);
    }
  }, [imagePreviews]);

  const handleRemovePreview = useCallback((previewId) => {
    setImagePreviews((p) => p.filter((x) => x.id !== previewId));
  }, []);

  const sendQueuedImages = useCallback(async () => {
    for (const preview of imagePreviews) {
      await uploadImage(preview.file);
    }
    setImagePreviews([]);
  }, [imagePreviews, uploadImage]);

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // ── Paste ─────────────────────────────────────────────────────────────────
  const handlePaste = useCallback((e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter((item) => item.kind === 'file' && ALLOWED_MIME.includes(item.type));
    if (imageItems.length > 0) {
      e.preventDefault();
      handleFileSelect(imageItems.map((item) => item.getAsFile()));
    }
  }, [handleFileSelect]);

  // ── Input handlers ────────────────────────────────────────────────────────
  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    if (val.length > MAX_MSG_LENGTH) return;
    setMessage(val);
    socket.emit('typing-status', { isTyping: true, name: currentUser?.displayName || 'User' });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing-status', { isTyping: false, name: currentUser?.displayName || 'User' });
    }, TYPING_DEBOUNCE_MS);
  }, [currentUser]);

  const handleReact = useCallback((msgId, emoji) => {
    setMsgReactions((p) => ({ ...p, [msgId]: { ...(p[msgId] || {}), [uId]: emoji } }));
    socket.emit('send-reaction', { roomId: id, msgId, emoji, userId: uId });
  }, [id, uId]);

  const handleSend = useCallback(async () => {
    const hasImages = imagePreviews.length > 0;
    const txt = message.trim();
    if (!txt && !hasImages) return;
    if (txt && txt.length > MAX_MSG_LENGTH) return;
    const now = Date.now();
    if (now - sendCooldownRef.current < SEND_COOLDOWN_MS) return;
    sendCooldownRef.current = now;

    if (hasImages) { await sendQueuedImages(); }

    if (txt) {
      const replyData = replyingTo
        ? { replyto: replyingTo.text, replytoName: replyingTo.role === 'bot' ? 'AI' : (replyingTo.displayName || replyingTo.senderName || 'User'), replytophoto: replyingTo.photoURL || null }
        : {};
      setMessage('');
      setReplyingTo(null);
      setSmartReplies([]);
      clearTimeout(typingTimerRef.current);
      socket.emit('typing-status', { isTyping: false, name: currentUser?.displayName });
      msgPopAudio.play().catch(() => {});
      await addMessage({ text: txt, role: 'user', userid: uId, displayName: currentUser?.displayName, photoURL: currentUser?.photoURL, ...replyData });
    } else {
      setMessage('');
      setReplyingTo(null);
    }
  }, [message, imagePreviews, sendQueuedImages, addMessage, currentUser, uId, replyingTo]);

  const handleBotMsg = useCallback(async () => {
    const txt = message.trim();
    if (!txt || txt.length > MAX_MSG_LENGTH) return;
    const now = Date.now();
    if (now - botCooldownRef.current < BOT_COOLDOWN_MS) return;
    botCooldownRef.current = now;

    const specificCtx = replyingTo ? `\n[User is replying to: """${replyingTo.text}"""]` : '';
    const historyText = messages.slice(-6).map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n') + specificCtx;
    const replyData = replyingTo ? { replyto: replyingTo.text, replytoName: replyingTo.role === 'bot' ? 'AI' : (replyingTo.displayName || replyingTo.senderName || 'User') } : {};

    setMessage('');
    setReplyingTo(null);
    setSmartReplies([]);
    setIsAiTyping(true);
    socket.emit('typing-status', { isTyping: false, name: currentUser?.displayName });
    msgPopAudio.play().catch(() => {});
    await addMessage({ text: txt, role: 'user', userid: uId, displayName: currentUser?.displayName, photoURL: currentUser?.photoURL, ...replyData });

    try {
      const reply = await openAIChat(txt, historyText);
      if (reply && isMountedRef.current) {
        await addMessage({ text: reply, role: 'bot', userid: 'ai-bot', displayName: 'AI Assistant', replyto: txt, replytoName: currentUser?.displayName });
      }
    } catch {}
    finally { if (isMountedRef.current) setIsAiTyping(false); }
  }, [message, addMessage, currentUser, uId, messages, replyingTo]);

  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = null;
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const sec = msg.createdAt ? new Date(msg.createdAt).getTime() / 1000 : msg.timestampField?.seconds;
      if (sec) {
        const label = new Date(sec * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if (label !== lastDate) { groups.push({ type: 'date', label, key: `date-${label}` }); lastDate = label; }
      }
      groups.push({ type: 'msg', data: msg, key: msg._id || msg.id || i });
    }
    return groups;
  }, [messages]);

  const canSend   = message.trim().length > 0 || imagePreviews.length > 0;
  const charCount = message.length;
  const charWarn  = charCount > 1800;

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleEmojiClick = useCallback((e) => {
    setMessage((p) => {
      const next = p + e.emoji;
      return next.length <= MAX_MSG_LENGTH ? next : p;
    });
    setIsOpenEmoji(false);
    inputRef.current?.focus();
  }, []);

  const handleCloseSidebar = useCallback(() => { dispatch(toggleChatSidebar(false)); }, [dispatch]);

  return (
    <ChatErrorBoundary>
      <div
        className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#0B1120] font-sans transition-colors duration-300 overflow-hidden relative"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-50 bg-blue-500/20 border-4 border-dashed border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-blue-500 dark:text-blue-300">
              <i className="fas fa-cloud-upload-alt text-4xl" />
              <span className="font-bold text-lg">Drop images here</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 h-16 px-5 flex items-center justify-between border-b border-gray-200/60 dark:border-gray-800 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                <i className="fas fa-users text-white text-[15px]" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#0B1120] rounded-full" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 leading-tight">Group Chat</h2>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{messages.length} messages loaded</p>
            </div>
          </div>
          <button onClick={handleCloseSidebar} className="w-9 h-9 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
            <i className="fas fa-times text-[16px]" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={chatBoxRef}
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto px-4 md:px-6 py-4 min-h-0 relative z-10"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.4) transparent' }}
        >
          {loading && (
            <div className="w-full flex justify-center py-4">
              <div className="w-6 h-6 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin shadow-sm" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center my-8 p-6 bg-white dark:bg-[#1E2532] border border-gray-100 dark:border-gray-800/60 shadow-sm rounded-[24px] text-center max-w-sm mx-auto">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800/40">
                <i className="fas fa-comments text-blue-500 dark:text-blue-400 text-2xl" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Welcome to the Chat!</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Start the conversation. Keep it friendly! ✨</p>
            </div>
          )}

          {groupedMessages.map((item) =>
            item.type === 'date'
              ? <DateSeparator key={item.key} date={item.label} />
              : <MessageCard
                  key={item.key}
                  uId={uId}
                  msgData={item.data}
                  onReply={setReplyingTo}
                  onReact={handleReact}
                  msgReactions={msgReactions[item.data._id || item.data.id]}
                  onImageClick={setLightboxSrc}
                />
          )}

          {isAiTyping && (
            <div className="flex items-end gap-2.5 px-2 py-2 mb-4 w-full justify-start">
              <img src={botimg} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" alt="AI" />
              <div className="bg-white dark:bg-[#1E2532] border border-gray-100 dark:border-gray-800 rounded-[22px] rounded-bl-[6px] px-4 py-3.5 flex gap-1.5 items-center shadow-sm">
                {[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <TypingIndicator typingUsers={typingUsers} />

        {/* Upload progress */}
        <UploadProgress uploads={uploads} />

        {/* Input area */}
        <div className="flex-shrink-0 px-4 pb-5 pt-2 bg-transparent z-20 relative" onPaste={handlePaste}>
          <div className="max-w-4xl mx-auto w-full relative">
            {/* Reply preview */}
            {replyingTo && (
              <div className="flex items-center justify-between bg-white dark:bg-[#1E2532] px-4 py-2.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-3 ml-2 border-l-[4px] border-l-blue-500">
                <div className="flex flex-col overflow-hidden">
                  <span className="text-blue-500 dark:text-blue-400 font-bold text-[12px] flex items-center gap-1.5 mb-0.5">
                    <i className="fas fa-reply text-[10px]" /> Replying to {replyingTo.role === 'bot' ? 'AI' : (replyingTo.displayName || replyingTo.senderName || 'User')}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-[12px] truncate max-w-[250px] md:max-w-[400px]">{replyingTo.text}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors ml-3">
                  <i className="fas fa-times text-[12px]" />
                </button>
              </div>
            )}

            {/* Image previews before send */}
            <ImagePreviews previews={imagePreviews} onRemove={handleRemovePreview} />

            <SmartReplies
              replies={smartReplies}
              onSelect={(r) => { setMessage(r); setSmartReplies([]); requestAnimationFrame(() => inputRef.current?.focus()); }}
              isLoading={smartLoading}
            />

            {/* Emoji picker */}
            {isOpenEmoji && (
              <div className="absolute bottom-full mb-2 left-0 z-50 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                <EmojiPicker theme="auto" height={320} onEmojiClick={handleEmojiClick} />
              </div>
            )}

            {/* Input box */}
            <div className="flex items-end bg-white dark:bg-[#1E2532] rounded-[24px] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border-2 border-transparent focus-within:border-blue-400 dark:focus-within:border-blue-600 focus-within:ring-4 ring-blue-50 dark:ring-blue-900/20 transition-all duration-300 min-h-[52px] py-2">
              {/* Emoji button */}
              <button
                onClick={() => setIsOpenEmoji((v) => !v)}
                className="self-end mb-0.5 w-[48px] h-[36px] text-gray-400 hover:text-yellow-500 transition-colors flex items-center justify-center flex-shrink-0 bg-transparent"
                tabIndex={-1}
              >
                <i className="far fa-face-smile text-[20px]" />
              </button>

              {/* ── FIX: Use ref callback, never conditional rendering ── */}
              <textarea
                ref={inputCallbackRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message… (Markdown supported, paste images)"
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-[15px] px-2 py-1 min-w-0 resize-none overflow-hidden leading-6"
                style={{ maxHeight: '120px' }}
              />

              <div className="flex items-center gap-1.5 pr-2 flex-shrink-0 self-end mb-0.5">
                {/* Image upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[36px] h-[36px] rounded-full transition-all flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  title="Share images"
                  tabIndex={-1}
                >
                  <i className="fas fa-image text-[15px]" />
                </button>
                {/* AI bot */}
                <button
                  onClick={handleBotMsg}
                  disabled={!message.trim()}
                  className={`w-[36px] h-[36px] rounded-full transition-all flex items-center justify-center flex-shrink-0 ${message.trim() ? 'text-indigo-500 hover:bg-indigo-50 hover:scale-105 dark:hover:bg-indigo-500/10' : 'text-gray-300 cursor-not-allowed'}`}
                  tabIndex={-1}
                >
                  <i className="fas fa-robot text-[15px]" />
                </button>
                {/* Send */}
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all flex-shrink-0 ${canSend ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:-translate-y-0.5' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                >
                  <i className={`fas fa-paper-plane ${canSend ? 'text-[13px] -ml-0.5 mt-0.5' : 'text-[14px]'}`} />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2 px-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-600 font-medium">
                <i className="fab fa-markdown mr-1" /> Markdown · Shift+Enter for newline · Paste or drag images
              </p>
              <p className={`text-[10px] font-medium ${charWarn ? 'text-amber-500' : 'text-gray-400 dark:text-gray-600'}`}>
                {charCount > 0 ? `${charCount} / ${MAX_MSG_LENGTH}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ''; }}
        />

        {/* Image lightbox */}
        {lightboxSrc && <ImageModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      </div>
    </ChatErrorBoundary>
  );
};

export default Chat;