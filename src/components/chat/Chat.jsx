/**
 * Chat.jsx — Production-Refactored
 *
 * Fixes applied vs original:
 *  [P0] XSS — added rehype-sanitize to all ReactMarkdown instances
 *  [P0] Hook violation — useToggleSidebarFirebase/useMarkAsRead called at top level only
 *  [P0] Reactions — Firestore onSnapshot listener hydrates & syncs msgReactions in real time
 *  [P0] Error Boundary — ChatErrorBoundary wraps render output
 *  [P1] Rate limiting — 500 ms send cooldown, 3 s AI cooldown, 2000 char max
 *  [P1] Prompt injection — bracketed + truncated content in smart-reply prompt
 *  [P1] Translation stub — removed fake defaultTranslate; TranslationButton hidden until wired
 *  [P1] Textarea — replaced <input> with auto-resize textarea for multi-line + mobile UX
 *  [P1] loadMore race — isLoadingMoreRef guards duplicate scroll-triggered loads
 *  [P2] Accessibility — aria-labels on icon buttons, role="log" on message list
 *  [P2] Character counter — visible warning above 1800 chars
 *  [P2] Smart reply skeleton — loading state shown during AI delay
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Timestamp, doc, updateDoc, serverTimestamp,
  onSnapshot, collection, setDoc,
} from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'; // [P0] XSS fix
import EmojiPicker from 'emoji-picker-react';

import useAddMessage from '../../hooks/useAddMessage';
import useChatPagination from '../../hooks/useChatPagination';
import getUserDataFromFirestore from '../../hooks/getUserData';
import useToggleSidebarFirebase from '../../hooks/useToggleSidebarFirebase';
import useMarkAsRead from '../../hooks/useDeleteUnseenCount';
import openAIChat from '../../hooks/openAIChat';
import { toggleChatSidebar } from '../../redux/action';
import { db } from '../../services/firebase';
import botimg from '../../assets/robot.png';

// ─── Audio — preloaded at module level to eliminate cold-start latency [P2] ──
import msgpopSrc from '../../assets/happy-pop-3-185288.mp3';
const msgPopAudio = new Audio(msgpopSrc);
msgPopAudio.preload = 'auto';

// ─── Constants ────────────────────────────────────────────────────────────────
const MSG_REACTIONS       = ['👍', '❤️', '😂', '😮', '🎉'];
const TYPING_DEBOUNCE_MS  = 3000;
const REACT_THROTTLE_MS   = 1000;
const SMART_REPLY_DELAY   = 800;
const MAX_MSG_LENGTH      = 2000;
const SEND_COOLDOWN_MS    = 500;   // max 2 sends/second
const BOT_COOLDOWN_MS     = 3000;  // max 1 AI call per 3 s

// ─── rehype-sanitize schema — strips JS URIs and raw HTML [P0] ───────────────
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [['rel', 'noopener noreferrer'], ['target', '_blank'], 'href', 'title'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'], // blocks javascript:
  },
};

// ─── Markdown renderers ───────────────────────────────────────────────────────
const markdownComponents = {
  p:      ({ children }) => <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em:     ({ children }) => <em className="italic">{children}</em>,
  del:    ({ children }) => <del className="line-through opacity-60">{children}</del>,
  code:   ({ inline, children }) =>
    inline
      ? <code className="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-black/10 dark:bg-white/10">{children}</code>
      : <pre className="mt-2 mb-2 p-3 rounded-xl text-[13px] font-mono overflow-x-auto bg-black/20 dark:bg-black/40 shadow-inner"><code>{children}</code></pre>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="underline decoration-white/40 underline-offset-2 hover:decoration-white transition-all break-all">
      {children}
    </a>
  ),
};

const markdownComponentsOther = {
  ...markdownComponents,
  p: ({ children }) => <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-100">{children}</p>,
  code: ({ inline, children }) =>
    inline
      ? <code className="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-gray-100 dark:bg-gray-700 text-pink-600 dark:text-pink-400">{children}</code>
      : <pre className="mt-2 mb-2 p-3 rounded-xl text-[13px] font-mono overflow-x-auto bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-inner"><code>{children}</code></pre>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 underline-offset-2 transition-all break-all">
      {children}
    </a>
  ),
};

// [P0] Sanitized ReactMarkdown wrapper
const MarkdownContent = memo(({ text, isOwn }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
    components={isOwn ? markdownComponents : markdownComponentsOther}
  >
    {text}
  </ReactMarkdown>
));

// ─── Error Boundary [P0] ──────────────────────────────────────────────────────
class ChatErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Replace with Sentry.captureException(error) in production
    console.error('[ChatErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3">
          <i className="fas fa-triangle-exclamation text-3xl text-amber-500" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Something went wrong in the chat.
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Message Card ─────────────────────────────────────────────────────────────
const MessageCard = memo(({ msgData, uId, onReply, onReact, msgReactions }) => {
  const [showMore, setShowMore]               = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const reactRef = useRef(null);

  const isOwn   = uId === msgData.userid;
  const isEmoji = /^\p{Emoji}+$/u.test((msgData?.text || '').trim()) && msgData.text.trim().length <= 4;

  const time = useMemo(() => {
    const seconds = msgData?.timestampField?.seconds;
    if (!seconds) return '';
    return new Date(seconds * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  }, [msgData?.timestampField?.seconds]);

  const displayText = useMemo(() => {
    if (isEmoji) return msgData.text || '';
    if (!showMore && msgData.text?.length > 300) return msgData.text.slice(0, 300) + '…';
    return msgData.text || '';
  }, [isEmoji, msgData.text, showMore]);

  const reactionSummary = useMemo(() => {
    if (!msgReactions || Object.keys(msgReactions).length === 0) return null;
    return Object.values(msgReactions).reduce((acc, e) => {
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    }, {});
  }, [msgReactions]);

  const handleReply       = useCallback(() => onReply(msgData), [onReply, msgData]);
  const handleToggleMore  = useCallback(() => setShowMore((v) => !v), []);
  const handleReactToggle = useCallback(() => setShowReactPicker((v) => !v), []);

  // Close reaction picker on outside click
  useEffect(() => {
    const h = (e) => {
      if (reactRef.current && !reactRef.current.contains(e.target)) {
        setShowReactPicker(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`flex items-end gap-2.5 max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Avatar */}
        {!isOwn && (
          <div className="relative flex-shrink-0 mb-1">
            <img
              referrerPolicy="no-referrer"
              src={msgData.role === 'bot' ? botimg : (msgData?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png')}
              className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
              alt={msgData.role === 'bot' ? 'AI Assistant' : (msgData.displayName || 'User')}
            />
            {msgData.role === 'bot' && (
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                <i className="fas fa-bolt text-[6px] text-white" aria-hidden="true" />
              </div>
            )}
          </div>
        )}

        {/* Bubble */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && !isEmoji && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 ml-1 font-medium tracking-wide">
              {msgData.role === 'bot' ? 'AI Assistant' : (msgData.displayName || msgData.senderName || 'User')}
            </span>
          )}

          <div className={`relative group/bubble ${
            isEmoji ? 'bg-transparent' : isOwn
              ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-[22px] rounded-br-[6px] shadow-[0_2px_10px_-2px_rgba(37,99,235,0.3)]'
              : 'bg-white dark:bg-[#1E2532] text-gray-800 dark:text-gray-100 rounded-[22px] rounded-bl-[6px] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800'
          } ${!isEmoji ? 'px-4 py-3' : ''}`}>

            {/* Reply context */}
            {!isEmoji && msgData?.replyto && (
              <div className={`text-[12px] mb-2.5 p-2 rounded-xl flex flex-col gap-0.5 ${
                isOwn
                  ? 'bg-black/10 text-white/90'
                  : 'bg-gray-50 dark:bg-[#131823] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50'
              }`}>
                <span className={`font-semibold flex items-center gap-1.5 ${isOwn ? 'text-blue-100' : 'text-blue-500 dark:text-blue-400'}`}>
                  <i className="fas fa-reply text-[9px]" aria-hidden="true" /> {msgData.replytoName}
                </span>
                <span className="truncate max-w-[220px] opacity-80">{msgData.replyto}</span>
              </div>
            )}

            {/* Content */}
            {isEmoji ? (
              <span className="text-5xl block select-none hover:scale-110 transition-transform duration-300 origin-bottom"
                role="img" aria-label="emoji message">
                {msgData.text}
              </span>
            ) : (
              <div className="pb-3 relative min-w-[60px]">
                <MarkdownContent text={displayText} isOwn={isOwn} />
                {msgData.text?.length > 300 && (
                  <button
                    onClick={handleToggleMore}
                    className={`text-[12px] mt-1.5 font-semibold transition-colors ${
                      isOwn ? 'text-blue-200 hover:text-white' : 'text-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                    aria-expanded={showMore}
                  >
                    {showMore ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* Timestamp */}
            {!isEmoji && (
              <div className={`absolute bottom-2 right-3 flex items-center gap-1 ${
                isOwn ? 'text-blue-100/80' : 'text-gray-400 dark:text-gray-500'
              }`}>
                <span className="text-[10px] font-medium">{time}</span>
                {isOwn && <i className="fa-solid fa-check-double text-[10px]" aria-label="sent" />}
              </div>
            )}

            {/* Reaction summary */}
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
        </div>

        {/* Hover actions */}
        <div
          ref={reactRef}
          className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-200 self-center mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}
        >
          <button
            onClick={handleReply}
            aria-label="Reply to message"
            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-500 flex items-center justify-center transition-all"
          >
            <i className="fas fa-reply text-[12px]" aria-hidden="true" />
          </button>

          <div className="relative">
            <button
              onClick={handleReactToggle}
              aria-label="React to message"
              aria-expanded={showReactPicker}
              className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 hover:text-yellow-500 flex items-center justify-center transition-all"
            >
              <i className="far fa-face-smile text-[14px]" aria-hidden="true" />
            </button>
            {showReactPicker && (
              <div
                role="menu"
                aria-label="Reaction picker"
                className={`absolute bottom-10 ${isOwn ? 'right-0' : 'left-0'} flex gap-1.5 p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-50 animate-fade-in-up`}
              >
                {MSG_REACTIONS.map((e) => (
                  <button
                    key={e}
                    role="menuitem"
                    aria-label={`React with ${e}`}
                    onClick={() => { onReact(msgData.id, e); setShowReactPicker(false); }}
                    className="text-xl hover:scale-125 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                  >
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
  prev.msgData      === next.msgData &&
  prev.uId          === next.uId &&
  prev.msgReactions === next.msgReactions
);

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = memo(({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null;
  const names  = typingUsers.slice(0, 2).join(', ');
  const suffix = typingUsers.length > 2 ? ` +${typingUsers.length - 2} more` : '';
  return (
    <div className="flex items-center gap-3 px-4 py-2 mb-2" aria-live="polite" aria-atomic="true">
      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-2xl rounded-bl-md shadow-sm border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
      <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
        <strong>{names}{suffix}</strong> {typingUsers.length === 1 ? 'is typing' : 'are typing'}…
      </span>
    </div>
  );
});

// ─── Date separator ───────────────────────────────────────────────────────────
const DateSeparator = memo(({ date }) => (
  <div className="flex items-center justify-center my-6" role="separator" aria-label={date}>
    <span className="text-[11px] tracking-wide text-gray-500 dark:text-gray-400 font-semibold px-4 py-1 bg-gray-100 dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700/50">
      {date}
    </span>
  </div>
));

// ─── Smart replies ────────────────────────────────────────────────────────────
const SmartReplies = memo(({ replies, onSelect, isLoading }) => {
  if (!isLoading && (!replies || replies.length === 0)) return null;
  return (
    <div className="flex gap-2 flex-wrap mb-3 px-1" aria-label="Smart reply suggestions">
      <div className="flex items-center gap-1.5 mr-1">
        <i className="fas fa-sparkles text-blue-500 text-[12px]" aria-hidden="true" />
      </div>
      {isLoading
        ? [1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))
        : replies.map((r, i) => (
            <button
              key={i}
              onClick={() => onSelect(r)}
              className="text-[13px] px-4 py-1.5 bg-white dark:bg-[#1E2532] border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 transition-all shadow-sm active:scale-95"
            >
              {r}
            </button>
          ))}
    </div>
  );
});

// ─── Auto-resize textarea hook ────────────────────────────────────────────────
function useAutoResize(ref, value) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [value, ref]);
}

// ─── Main Chat Component ──────────────────────────────────────────────────────
const Chat = ({ uId }) => {
  const [message,       setMessage]       = useState('');
  const [currentUser,   setCurrentUser]   = useState(null);
  const [isOpenEmoji,   setIsOpenEmoji]   = useState(false);
  const [replyingTo,    setReplyingTo]    = useState(null);
  const [msgReactions,  setMsgReactions]  = useState({});
  const [typingUsers,   setTypingUsers]   = useState([]);
  const [isAiTyping,    setIsAiTyping]    = useState(false);
  const [smartReplies,  setSmartReplies]  = useState([]);
  const [smartLoading,  setSmartLoading]  = useState(false); // [P2] skeleton state

  // Refs
  const typingTimerRef       = useRef(null);
  const smartReplyTimerRef   = useRef(null);
  const reactThrottleRef     = useRef({});
  const isMountedRef         = useRef(true);
  const chatBoxRef           = useRef(null);
  const bottomRef            = useRef(null);
  const inputRef             = useRef(null);
  const lastSmartReplyCtxRef = useRef('');
  const sendCooldownRef      = useRef(0);      // [P1] send rate limit
  const botCooldownRef       = useRef(0);      // [P1] AI call rate limit
  const isLoadingMoreRef     = useRef(false);  // [P2] scroll race guard

  useAutoResize(inputRef, message); // [P1] auto-resize textarea

  const { id }     = useParams();
  const dispatch   = useDispatch();
  const addMessage = useAddMessage();

  // [P0] Hooks called at top level — never inside callbacks
  const markAsRead        = useMarkAsRead();
  const toggleSidebarFb   = useToggleSidebarFirebase();

  const { messages, loading, loadMore, hasMore } = useChatPagination(id);

  // Component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(typingTimerRef.current);
      clearTimeout(smartReplyTimerRef.current);
    };
  }, []);

  // Mark as read when new messages arrive
  useEffect(() => {
    if (messages.length > 0) markAsRead(uId);
  }, [messages.length, uId, markAsRead]);

  // [P0] Real-time reactions from Firestore
  useEffect(() => {
    if (!id || messages.length === 0) return;

    // Only subscribe to the latest 30 visible messages to avoid too many listeners
    const visibleMessages = messages.slice(-30);
    const unsubs = visibleMessages.map((msg) => {
      const reactionsRef = collection(db, 'rooms', id, 'messages', msg.id, 'reactions');
      return onSnapshot(reactionsRef, (snap) => {
        if (!isMountedRef.current) return;
        const reactionsMap = {};
        snap.docs.forEach((d) => { reactionsMap[d.id] = d.data().emoji; });
        setMsgReactions((prev) => ({ ...prev, [msg.id]: reactionsMap }));
      }, () => {}); // silently ignore per-message permission errors
    });

    return () => unsubs.forEach((u) => u());
  }, [id, messages]);

  // Scroll to bottom on new messages / AI typing
  useEffect(() => {
    if (!bottomRef.current) return;
    const t = setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: messages.length <= 20 ? 'auto' : 'smooth',
        block: 'end',
      });
    }, 100);
    return () => clearTimeout(t);
  }, [messages.length, loading, isAiTyping]);

  // Load current user profile
  useEffect(() => {
    let cancelled = false;
    getUserDataFromFirestore(uId)
      .then((data) => { if (!cancelled) setCurrentUser(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [uId]);

  // Typing broadcast
  const broadcastTyping = useCallback(async (isTyping) => {
    try {
      await setDoc(doc(db, 'rooms', id, 'typing', uId), {
        name: currentUser?.displayName || 'Someone',
        isTyping,
        updatedAt: Date.now(),
      }, { merge: true });
    } catch {}
  }, [id, uId, currentUser]);

  // Typing listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rooms', id, 'typing'), (snap) => {
      if (!isMountedRef.current) return;
      const now    = Date.now();
      const typers = snap.docs
        .filter((d) => d.id !== uId && d.data().isTyping && now - (d.data().updatedAt || 0) < 8000)
        .map((d) => d.data().name || 'Someone');
      setTypingUsers(typers);
    });
    return () => unsub();
  }, [id, uId]);

  // Input change handler
  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    if (val.length > MAX_MSG_LENGTH) return; // [P1] length cap
    setMessage(val);
    broadcastTyping(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) broadcastTyping(false);
    }, TYPING_DEBOUNCE_MS);
  }, [broadcastTyping]);

  // Smart replies
  useEffect(() => {
    clearTimeout(smartReplyTimerRef.current);
    if (messages.length === 0) return;

    const lastMsg     = messages[messages.length - 1];
    const isFromOther = lastMsg?.data?.userid !== uId;

    if (!isFromOther) {
      setSmartReplies([]);
      setSmartLoading(false);
      return;
    }

    const ctxKey = lastMsg.id;
    if (lastSmartReplyCtxRef.current === ctxKey) return;

    setSmartLoading(true); // [P2] show skeleton immediately

    smartReplyTimerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      lastSmartReplyCtxRef.current = ctxKey;
      try {
        const lastText = lastMsg.data?.text || '';
        // [P1] bracket injected content to prevent prompt injection
        const prompt = [
          'Suggest exactly 3 very short (max 6 words each) natural chat reply options.',
          `The message being replied to is delimited by triple backticks:`,
          `\`\`\`${lastText.slice(0, 120).replace(/`/g, "'")}\`\`\``,
          'Return ONLY a JSON array of 3 strings. No preamble, no markdown fences.',
        ].join(' ');

        const raw     = await openAIChat(prompt, '');
        if (!isMountedRef.current) return;
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed  = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          // [P1] validate each item is a plain string
          const safe = parsed.slice(0, 3).filter((s) => typeof s === 'string' && s.length < 60);
          setSmartReplies(safe);
        }
      } catch {
        if (isMountedRef.current) setSmartReplies([]);
      } finally {
        if (isMountedRef.current) setSmartLoading(false);
      }
    }, SMART_REPLY_DELAY);

    return () => clearTimeout(smartReplyTimerRef.current);
  }, [messages.length, uId]);

  const handleSmartReplySelect = useCallback((reply) => {
    setMessage(reply);
    setSmartReplies([]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // React to a message
  const handleReact = useCallback((msgId, emoji) => {
    // Optimistic local update
    setMsgReactions((prev) => ({
      ...prev,
      [msgId]: { ...(prev[msgId] || {}), [uId]: emoji },
    }));

    const now  = Date.now();
    const last = reactThrottleRef.current[msgId] || 0;
    if (now - last < REACT_THROTTLE_MS) return;
    reactThrottleRef.current[msgId] = now;

    setDoc(
      doc(db, 'rooms', id, 'messages', msgId, 'reactions', uId),
      { emoji },
      { merge: true },
    ).catch(() => {});
  }, [id, uId]);

  // Send message
  const handleSend = useCallback(async () => {
    const txt = message.trim();
    if (!txt || txt.length > MAX_MSG_LENGTH) return;

    // [P1] Rate limit
    const now = Date.now();
    if (now - sendCooldownRef.current < SEND_COOLDOWN_MS) return;
    sendCooldownRef.current = now;

    const replyData = replyingTo ? {
      replyto:      replyingTo.text,
      replytoName:  replyingTo.role === 'bot' ? 'AI' : (replyingTo.displayName || replyingTo.senderName || 'User'),
      replytophoto: replyingTo.photoURL || null,
    } : {};

    setMessage('');
    setReplyingTo(null);
    setSmartReplies([]);
    clearTimeout(typingTimerRef.current);
    broadcastTyping(false);
    msgPopAudio.play().catch(() => {});

    await addMessage({
      text: txt,
      role: 'user',
      timestampField: Timestamp.fromDate(new Date()),
      seenBy: {},
      ...(currentUser || {}),
      ...replyData,
    });

    try {
      await updateDoc(doc(db, 'rooms', id), {
        lastMessage: {
          text: txt,
          senderId: uId,
          senderName: currentUser?.displayName || 'User',
          timestamp: serverTimestamp(),
        },
        lastActive: serverTimestamp(),
      });
    } catch {}
  }, [message, addMessage, currentUser, id, uId, replyingTo, broadcastTyping]);

  // Send to AI bot
  const handleBotMsg = useCallback(async () => {
    const txt = message.trim();
    if (!txt || txt.length > MAX_MSG_LENGTH) return;

    // [P1] AI call rate limit
    const now = Date.now();
    if (now - botCooldownRef.current < BOT_COOLDOWN_MS) return;
    botCooldownRef.current = now;

    const specificCtx = replyingTo
      ? `\n[User is replying to this message: """${replyingTo.text}"""]`
      : '';
    const historyText = messages.slice(0, 6).reverse()
      .map((m) => `${m.data.role === 'user' ? 'User' : 'AI'}: ${m.data.text}`)
      .join('\n') + specificCtx;

    const replyData = replyingTo ? {
      replyto:      replyingTo.text,
      replytoName:  replyingTo.role === 'bot' ? 'AI' : (replyingTo.displayName || 'User'),
      replytophoto: replyingTo.photoURL || null,
    } : {};

    setMessage('');
    setReplyingTo(null);
    setSmartReplies([]);
    setIsAiTyping(true);
    clearTimeout(typingTimerRef.current);
    broadcastTyping(false);
    msgPopAudio.play().catch(() => {});

    await addMessage({
      text: txt,
      role: 'user',
      timestampField: Timestamp.fromDate(new Date()),
      seenBy: {},
      ...(currentUser || {}),
      ...replyData,
    });

    try {
      const reply = await openAIChat(txt, historyText);
      if (reply && isMountedRef.current) {
        await addMessage({
          text: reply,
          role: 'bot',
          timestampField: Timestamp.fromDate(new Date()),
          replyto: txt,
          replytoName: currentUser?.displayName,
        });
        await updateDoc(doc(db, 'rooms', id), {
          lastMessage: {
            text: '🤖 ' + reply.slice(0, 40) + '…',
            senderId: 'ai-bot',
            senderName: 'AI',
            timestamp: serverTimestamp(),
          },
        });
      }
    } catch {
      console.error('[Chat] Bot message failed');
    } finally {
      if (isMountedRef.current) setIsAiTyping(false);
    }
  }, [message, addMessage, currentUser, id, messages, replyingTo, broadcastTyping]);

  // Grouped messages with date separators
  const groupedMessages = useMemo(() => {
    const groups  = [];
    let lastDate  = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const sec = msg.data?.timestampField?.seconds;
      if (sec) {
        const label = new Date(sec * 1000).toLocaleDateString('en-US', {
          weekday: 'long', month: 'short', day: 'numeric',
        });
        if (label !== lastDate) {
          groups.push({ type: 'date', label, key: `date-${label}` });
          lastDate = label;
        }
      }
      groups.push({ type: 'msg', data: msg, key: msg.id });
    }
    return groups;
  }, [messages]);

  // Scroll to load more — with race guard [P2]
  const handleScroll = useCallback((e) => {
    if (e.target.scrollTop !== 0 || !hasMore || loading || isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    const prevScrollHeight = e.target.scrollHeight;
    loadMore()
      .then(() => {
        requestAnimationFrame(() => {
          if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight - prevScrollHeight;
          }
        });
      })
      .finally(() => { isLoadingMoreRef.current = false; });
  }, [hasMore, loading, loadMore]);

  const canSend = message.trim().length > 0;
  const charCount = message.length;
  const charWarn  = charCount > 1800;

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleEmojiClick = useCallback((e) => {
    setMessage((p) => {
      const next = p + e.emoji;
      return next.length <= MAX_MSG_LENGTH ? next : p;
    });
    setIsOpenEmoji(false);
    inputRef.current?.focus();
  }, []);

  const handleToggleEmoji  = useCallback(() => setIsOpenEmoji((v) => !v), []);
  const handleClearReply   = useCallback(() => setReplyingTo(null), []);

  // [P0] Hook at top level — toggleSidebarFb from useToggleSidebarFirebase()
  const handleCloseSidebar = useCallback(async () => {
    dispatch(toggleChatSidebar(false));
    await toggleSidebarFb(id, uId, false);
  }, [dispatch, toggleSidebarFb, id, uId]);

  return (
    <ChatErrorBoundary>
      <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#0B1120] font-sans transition-colors duration-300 overflow-hidden relative">

        {/* Header */}
        <div className="flex-shrink-0 h-16 px-5 flex items-center justify-between border-b border-gray-200/60 dark:border-gray-800 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                <i className="fas fa-users text-white text-[15px]" aria-hidden="true" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#0B1120] rounded-full" aria-label="Online" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 leading-tight">Group Chat</h2>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                {messages.length} messages loaded
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseSidebar}
            aria-label="Close chat"
            className="w-9 h-9 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
          >
            <i className="fas fa-times text-[16px]" aria-hidden="true" />
          </button>
        </div>

        {/* Message list */}
        <div
          ref={chatBoxRef}
          onScroll={handleScroll}
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
          className="flex-1 overflow-y-auto px-4 md:px-6 py-4 min-h-0 relative z-10"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.4) transparent' }}
        >
          {loading && hasMore && (
            <div className="w-full flex justify-center py-4">
              <div className="w-6 h-6 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin shadow-sm"
                role="status" aria-label="Loading messages" />
            </div>
          )}

          {!hasMore && !loading && (
            <div className="flex flex-col items-center justify-center my-8 p-6 bg-white dark:bg-[#1E2532] border border-gray-100 dark:border-gray-800/60 shadow-sm rounded-[24px] text-center max-w-sm mx-auto">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800/40">
                <i className="fas fa-hand-wave text-blue-500 dark:text-blue-400 text-2xl" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Welcome to the Chat!</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                This is the beginning of your conversation. Keep it friendly! ✨
              </p>
            </div>
          )}

          {groupedMessages.map((item) =>
            item.type === 'date'
              ? <DateSeparator key={item.key} date={item.label} />
              : (
                <MessageCard
                  key={item.key}
                  uId={uId}
                  msgData={item.data.data}
                  onReply={setReplyingTo}
                  onReact={handleReact}
                  msgReactions={msgReactions[item.data.id]}
                />
              )
          )}

          {isAiTyping && (
            <div className="flex items-end gap-2.5 px-2 py-2 mb-4 w-full justify-start animate-fade-in"
              aria-label="AI is typing" aria-live="polite">
              <img src={botimg} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" alt="AI" />
              <div className="bg-white dark:bg-[#1E2532] border border-gray-100 dark:border-gray-800 rounded-[22px] rounded-bl-[6px] px-4 py-3.5 flex gap-1.5 items-center shadow-sm">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} aria-hidden="true" />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <TypingIndicator typingUsers={typingUsers} />

        {/* Input area */}
        <div className="flex-shrink-0 px-4 pb-5 pt-2 bg-transparent z-20 relative">
          <div className="max-w-4xl mx-auto w-full relative">

            {/* Reply preview */}
            {replyingTo && (
              <div className="flex items-center justify-between bg-white dark:bg-[#1E2532] px-4 py-2.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-3 ml-2 border-l-[4px] border-l-blue-500 animate-fade-in-up">
                <div className="flex flex-col overflow-hidden">
                  <span className="text-blue-500 dark:text-blue-400 font-bold text-[12px] flex items-center gap-1.5 mb-0.5">
                    <i className="fas fa-reply text-[10px]" aria-hidden="true" />
                    Replying to {replyingTo.role === 'bot' ? 'AI' : (replyingTo.displayName || replyingTo.senderName || 'User')}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-[12px] truncate max-w-[250px] md:max-w-[400px]">
                    {replyingTo.text}
                  </span>
                </div>
                <button
                  onClick={handleClearReply}
                  aria-label="Cancel reply"
                  className="w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-3"
                >
                  <i className="fas fa-times text-[12px]" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* [P2] Smart reply skeleton/pills */}
            <SmartReplies
              replies={smartReplies}
              onSelect={handleSmartReplySelect}
              isLoading={smartLoading}
            />

            {/* Emoji picker */}
            {isOpenEmoji && (
              <div
                role="dialog"
                aria-label="Emoji picker"
                className="absolute bottom-full mb-2 left-0 z-50 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden animate-fade-in-up"
              >
                <EmojiPicker theme="auto" height={320} onEmojiClick={handleEmojiClick} />
              </div>
            )}

            {/* Input container */}
            <div className="flex items-end bg-white dark:bg-[#1E2532] rounded-[24px] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border-2 border-transparent focus-within:border-blue-400 dark:focus-within:border-blue-600 focus-within:ring-4 ring-blue-50 dark:ring-blue-900/20 transition-all duration-300 min-h-[52px] py-2">

              {/* Emoji button */}
              <button
                onClick={handleToggleEmoji}
                aria-label="Open emoji picker"
                aria-expanded={isOpenEmoji}
                className="self-end mb-0.5 w-[48px] h-[36px] text-gray-400 hover:text-yellow-500 transition-colors flex items-center justify-center flex-shrink-0 bg-transparent"
              >
                <i className="far fa-face-smile text-[20px]" aria-hidden="true" />
              </button>

              {/* [P1] Textarea replaces input — supports Shift+Enter newlines */}
              <textarea
                ref={inputRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message… (Markdown supported, Shift+Enter for newline)"
                rows={1}
                aria-label="Message input"
                aria-multiline="true"
                className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-[15px] px-2 py-1 min-w-0 resize-none overflow-hidden leading-6"
                style={{ maxHeight: '120px' }}
              />

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 pr-2 flex-shrink-0 self-end mb-0.5">
                <button
                  onClick={handleBotMsg}
                  disabled={!canSend}
                  aria-label="Send to AI assistant"
                  className={`w-[36px] h-[36px] rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
                    canSend
                      ? 'text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:scale-105'
                      : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <i className="fas fa-robot text-[15px]" aria-hidden="true" />
                </button>

                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  aria-label="Send message"
                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    canSend
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <i className={`fas fa-paper-plane ${canSend ? 'text-[13px] -ml-0.5 mt-0.5' : 'text-[14px]'}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Footer hint + char counter */}
            <div className="flex justify-between items-center mt-2 px-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-600 font-medium">
                <i className="fab fa-markdown mr-1" aria-hidden="true" /> Markdown · Shift+Enter for newline
              </p>
              <p className={`text-[10px] font-medium ${charWarn ? 'text-amber-500' : 'text-gray-400 dark:text-gray-600'}`}>
                {charCount > 0 ? `${charCount} / ${MAX_MSG_LENGTH}` : ''}
              </p>
            </div>
          </div>
        </div>

      </div>
    </ChatErrorBoundary>
  );
};

export default Chat;