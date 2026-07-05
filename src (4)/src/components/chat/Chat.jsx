import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../services/api';
import socket from '../../services/socket';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import EmojiPicker from 'emoji-picker-react';
import { Virtuoso } from 'react-virtuoso';

import useAddMessage from '../../hooks/useAddMessage';
import getUserDataFromFirestore from '../../hooks/getUserData';
import { toggleChatSidebar } from '../../redux/action';
import botimg from '../../assets/robot.png';

import msgpopSrc from '../../assets/happy-pop-3-185288.mp3';

const msgPopAudio = new Audio(msgpopSrc);
msgPopAudio.preload = 'auto';

const MSG_REACTIONS = ['👍', '❤️', '😂', '😮', '🎉'];
const TYPING_DEBOUNCE_MS = 3000;
const SMART_REPLY_DELAY = 700;
const MAX_MSG_LENGTH = 2000;
const SEND_COOLDOWN_MS = 500;
const BOT_COOLDOWN_MS = 3000;
const MAX_IMAGE_SIZE = 1.5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [['rel', 'noopener noreferrer'], ['target', '_blank'], 'href', 'title'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
  },
};

const getMessageId = (msg) => msg?._id || msg?.id || msg?.clientId || '';

const isSameMessage = (a, b) => {
  const aId = getMessageId(a);
  const bId = getMessageId(b);

  if (aId && bId && aId === bId) return true;

  return (
    a?.createdAt
    && b?.createdAt
    && a?.userid === b?.userid
    && a?.senderId === b?.senderId
    && a?.text === b?.text
    && a?.type === b?.type
    && Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) < 1200
  );
};

const playPop = () => {
  try {
    msgPopAudio.currentTime = 0;
    msgPopAudio.play().catch(() => {});
  } catch {}
};

const getDisplayTime = (msgData) => {
  let date = new Date();

  if (msgData?.createdAt) {
    date = new Date(msgData.createdAt);
  } else if (msgData?.timestampField?.seconds) {
    date = new Date(msgData.timestampField.seconds * 1000);
  }

  if (Number.isNaN(date.getTime())) date = new Date();

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getReplyText = (msg) => {
  if (!msg) return '';
  if (msg.type === 'image') return 'Image';
  return msg.text || '';
};

function validateImage(file) {
  if (!file) return 'No file selected.';

  if (!ALLOWED_MIME.includes(file.type)) {
    return 'Only JPEG, PNG, GIF, or WebP images are allowed.';
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return `Image must be smaller than ${(MAX_IMAGE_SIZE / 1024 / 1024).toFixed(1)} MB.`;
  }

  return null;
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

function useAutoResize(ref, value) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const minHeight = 40;
    const maxHeight = 96;

    el.style.height = `${minHeight}px`;

    const next = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, ref]);
}

const PremiumChatStyles = () => (
  <style>{`
    @keyframes chatPopIn {
      from { opacity: 0; transform: translateY(6px) scale(0.985); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes chatShine {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(120%); }
    }

    .premium-chat-scrollbar,
    .premium-chat-scrollbar * {
      overscroll-behavior-x: none;
    }

    .premium-chat-scrollbar [data-virtuoso-scroller="true"] {
      overflow-x: hidden !important;
    }

    .premium-chat-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 0;
    }

    .premium-chat-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .premium-chat-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.22);
      border-radius: 999px;
    }

    .premium-chat-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.34);
    }
  `}</style>
);

const markdownComponentsOwn = {
  p: ({ children }) => (
    <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-white/95">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
  code: ({ inline, children }) => (
    inline ? (
      <code className="rounded-lg bg-black/20 px-1.5 py-0.5 font-mono text-[12px] text-blue-50">
        {children}
      </code>
    ) : (
      <pre className="my-2 max-w-full overflow-x-auto rounded-2xl bg-black/25 p-3 text-[12px] shadow-inner">
        <code>{children}</code>
      </pre>
    )
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
    >
      {children}
    </a>
  ),
};

const markdownComponentsOther = {
  p: ({ children }) => (
    <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-slate-100">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
  code: ({ inline, children }) => (
    inline ? (
      <code className="rounded-lg bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-pink-200">
        {children}
      </code>
    ) : (
      <pre className="my-2 max-w-full overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-3 text-[12px] shadow-inner">
        <code>{children}</code>
      </pre>
    )
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-semibold text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200 hover:decoration-blue-200"
    >
      {children}
    </a>
  ),
};

const MarkdownContent = memo(({ text, isOwn }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
    components={isOwn ? markdownComponentsOwn : markdownComponentsOther}
  >
    {text || ''}
  </ReactMarkdown>
));

const ImageModal = memo(({ src, onClose }) => {
  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handler);

    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-2xl transition hover:bg-white/20"
        aria-label="Close image preview"
      >
        <i className="fas fa-times" />
      </button>

      <img
        src={src}
        alt="Full size"
        className="max-h-[90vh] max-w-full rounded-[1.6rem] object-contain shadow-2xl ring-1 ring-white/10"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
});

const UploadProgress = memo(({ uploads }) => {
  if (!uploads?.length) return null;

  return (
    <div className="mx-4 mb-3 flex flex-col gap-2">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 shadow-xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <img
              src={upload.preview}
              alt=""
              className="h-10 w-10 flex-shrink-0 rounded-xl object-cover ring-1 ring-white/10"
            />

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-bold text-slate-200">{upload.name}</p>
                <span className="shrink-0 text-[10px] font-black text-blue-300">{upload.progress}%</span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

const ImagePreviews = memo(({ previews, onRemove }) => {
  if (!previews?.length) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2 px-1">
      {previews.map((preview) => (
        <div key={preview.id} className="group relative">
          <img
            src={preview.dataUrl}
            alt=""
            className="h-20 w-20 rounded-2xl border border-white/10 object-cover shadow-xl ring-2 ring-blue-400/50"
          />

          <button
            type="button"
            onClick={() => onRemove(preview.id)}
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow-lg transition hover:bg-red-600"
            aria-label="Remove image"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      ))}
    </div>
  );
});

class ChatErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ChatErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#050713] p-8 text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20">
            <i className="fas fa-triangle-exclamation text-3xl" />
          </div>
          <div>
            <p className="text-lg font-black">Chat crashed</p>
            <p className="mt-1 text-sm text-slate-400">Something went wrong in the chat panel.</p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-slate-950 shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const MessageActionSheet = memo(({
  message,
  currentUserId,
  onClose,
  onReply,
  onReact,
  onDelete,
}) => {
  if (!message) return null;

  const msgId = getMessageId(message);
  const isOwn = currentUserId === message.userid || currentUserId === message.senderId;
  const canDelete = isOwn || message.type === 'image';

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[320px] rounded-[1.6rem] border border-white/10 bg-[#0b1120]/95 p-3 text-white shadow-2xl ring-1 ring-white/5"
        onClick={(event) => event.stopPropagation()}
        style={{ animation: 'chatPopIn 0.15s ease-out' }}
      >
        <div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
            <i className={`fa-solid ${message.type === 'image' ? 'fa-image' : 'fa-message'} text-sm`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white">
              Message actions
            </p>
            <p className="truncate text-xs text-slate-500">
              {message.type === 'image' ? 'Image message' : (message.text || 'Message')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 text-slate-400 hover:bg-white/12 hover:text-white"
            aria-label="Close actions"
          >
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-5 gap-1.5">
          {MSG_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(msgId, emoji);
                onClose();
              }}
              className="flex h-11 items-center justify-center rounded-2xl bg-white/7 text-2xl transition hover:scale-110 hover:bg-white/12 active:scale-95"
              aria-label={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onReply(message);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            <i className="fas fa-reply w-5 text-center text-blue-300" />
            Reply
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(message);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-red-300 transition hover:bg-red-500/10"
            >
              <i className="fas fa-trash w-5 text-center" />
              Delete {isOwn ? 'message' : 'for me'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

const MessageCard = memo(({
  msgData,
  uId,
  onOpenActions,
  msgReactions,
  onImageClick,
}) => {
  const [showMore, setShowMore] = useState(false);
  const longPressTimer = useRef(null);

  const isOwn = uId === msgData.userid || uId === msgData.senderId;
  const textValue = msgData?.text || '';

  const isEmoji = useMemo(() => {
    const trimmed = textValue.trim();
    if (!trimmed) return false;
    return /^\p{Emoji}+$/u.test(trimmed) && trimmed.length <= 4;
  }, [textValue]);

  const time = useMemo(() => getDisplayTime(msgData), [msgData]);

  const displayText = useMemo(() => {
    if (isEmoji) return textValue;
    if (!showMore && textValue.length > 300) return `${textValue.slice(0, 300)}…`;
    return textValue;
  }, [isEmoji, textValue, showMore]);

  const reactionSummary = useMemo(() => {
    if (!msgReactions || Object.keys(msgReactions).length === 0) return null;

    return Object.values(msgReactions).reduce((acc, emoji) => {
      acc[emoji] = (acc[emoji] || 0) + 1;
      return acc;
    }, {});
  }, [msgReactions]);

  const openActions = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onOpenActions(msgData);
  }, [msgData, onOpenActions]);

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      onOpenActions(msgData);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 420);
  }, [msgData, onOpenActions]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cancelLongPress();
  }, [cancelLongPress]);

  const imageSrc = msgData.dataUrl || msgData.imageUrl || msgData.url;

  return (
    <div
      className={`flex w-full min-w-0 overflow-x-hidden ${isOwn ? 'justify-end' : 'justify-start'} px-1 pb-4`}
      style={{ animation: 'chatPopIn 0.18s ease-out' }}
    >
      <div
        className={`relative flex px-5 max-w-[88%] min-w-0 items-end gap-2.5 md:max-w-[80%] ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {!isOwn && (
          <div className="relative mb-1 shrink-0">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md" />
            <img
              referrerPolicy="no-referrer"
              src={
                msgData.role === 'bot'
                  ? botimg
                  : (msgData?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png')
              }
              className="relative h-8 w-8 rounded-full border-2 border-white/10 object-cover shadow-lg"
              alt="Avatar"
            />

            {msgData.role === 'bot' && (
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#080d1c] bg-blue-500">
                <i className="fas fa-bolt text-[6px] text-white" />
              </div>
            )}
          </div>
        )}

        <div
          className={`relative flex min-w-0 flex-col ${isOwn ? 'items-end' : 'items-start'} select-none sm:select-auto`}
          onContextMenu={openActions}
          onTouchStart={handleTouchStart}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
        >
          {!isOwn && !isEmoji && (
            <span className="mb-1 ml-1 text-[11px] font-black text-slate-400">
              {msgData.role === 'bot'
                ? 'AI Assistant'
                : (msgData.displayName || msgData.senderName || 'User')}
            </span>
          )}

          {msgData.type === 'image' && imageSrc && (
            <div
              className={`group relative max-w-full overflow-hidden rounded-[1.35rem] border shadow-xl transition hover:scale-[1.01] ${
                isOwn
                  ? 'rounded-br-md border-blue-400/20 bg-blue-600/20'
                  : 'rounded-bl-md border-white/10 bg-white/[0.06]'
              }`}
            >
              <button
                type="button"
                onClick={openActions}
                className={`absolute top-2  z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 ${
                  isOwn ? 'left-2' : 'right-2'
                }`}
                aria-label="Image actions"
              >
                <i className="fa-solid fa-ellipsis-vertical text-[11px]" />
              </button>

              <button
                type="button"
                className="block max-w-full"
                onClick={() => onImageClick(imageSrc)}
              >
                <img
                  src={imageSrc}
                  alt="Shared"
                  className="block max-h-[270px] w-auto max-w-[min(250px,calc(100vw-96px))] object-cover sm:max-w-[280px]"
                  loading="lazy"
                />
              </button>

              <div
                className={`flex items-center justify-end gap-1 px-3 py-1.5 text-[10px] font-bold ${
                  isOwn ? 'bg-blue-600/80 text-blue-50' : 'bg-black/20 text-slate-400'
                }`}
              >
                {time}
              </div>
            </div>
          )}

          {msgData.type !== 'image' && (
            <div
              className={`group relative min-w-0 max-w-full  ${
                isEmoji
                  ? 'bg-transparent'
                  : isOwn
                    ? 'rounded-[1.35rem] rounded-br-md bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-500/15'
                    : 'rounded-[1.35rem] rounded-bl-md border border-white/10 bg-white/[0.075] text-slate-100 shadow-xl backdrop-blur-xl'
              } ${!isEmoji ? 'px-4 py-3' : ''}`}
            >
              {!isEmoji && (
                <button
                  type="button"
                  onClick={openActions}
                  className={`absolute top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full text-slate-300 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 ${
                    isOwn ? 'right-1.5' : 'right-1.5'
                  }`}
                  aria-label="Message actions"
                >
                  <i className="fa-solid fa-ellipsis-vertical text-[10px]" />
                </button>
              )}

              {isOwn && !isEmoji && (
                <div className="pointer-events-none absolute inset-0 opacity-25">
                  <div
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    style={{ animation: 'chatShine 4s ease-in-out infinite' }}
                  />
                </div>
              )}

              {!isEmoji && msgData?.replyto && (
                <div
                  className={`relative mb-2.5 flex flex-col gap-0.5 rounded-2xl border-l-4 p-2.5 text-[12px] ${
                    isOwn
                      ? 'border-l-white/70 bg-black/15 text-white/90'
                      : 'border-l-blue-400 bg-black/20 text-slate-300'
                  }`}
                >
                  <span
                    className={`flex items-center gap-1.5 font-black ${
                      isOwn ? 'text-blue-100' : 'text-blue-300'
                    }`}
                  >
                    <i className="fas fa-reply text-[9px]" />
                    {msgData.replytoName || 'User'}
                  </span>

                  <span className="max-w-[220px] truncate opacity-80">
                    {msgData.replyto}
                  </span>
                </div>
              )}

              {isEmoji ? (
                <span className="block origin-bottom select-none text-5xl drop-shadow-lg" role="img" aria-label="emoji">
                  {textValue}
                </span>
              ) : (
                <div className="relative min-w-[60px] max-w-full pb-4">
                  <MarkdownContent text={displayText} isOwn={isOwn} />

                  {textValue.length > 300 && (
                    <button
                      type="button"
                      onClick={() => setShowMore((value) => !value)}
                      className={`mt-1.5 text-[12px] font-black transition-colors ${
                        isOwn
                          ? 'text-blue-100 hover:text-white'
                          : 'text-blue-300 hover:text-blue-200'
                      }`}
                    >
                      {showMore ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {!isEmoji && (
                <div
                  className={`absolute bottom-2 right-3 flex items-center gap-1 ${
                    isOwn ? 'text-blue-100/80' : 'text-slate-500'
                  }`}
                >
                  <span className="text-[10px] font-bold">{time}</span>
                </div>
              )}

              {reactionSummary && (
                <div
                  className={`absolute -bottom-3 ${
                    isOwn ? 'right-2' : 'left-2'
                  } z-10 flex flex-wrap gap-1 pointer-events-none`}
                >
                  {Object.entries(reactionSummary).map(([emoji, count]) => (
                    <span
                      key={emoji}
                      className="flex items-center gap-1 rounded-full border border-white/10 bg-[#10172a] px-2 py-0.5 text-[12px] text-slate-100 shadow-xl"
                    >
                      {emoji}
                      {count > 1 && (
                        <span className="text-[10px] font-black opacity-75">{count}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prev, next) => (
  prev.msgData === next.msgData
  && prev.uId === next.uId
  && prev.msgReactions === next.msgReactions
));

const TypingIndicator = memo(({ typingUsers }) => {
  if (!typingUsers?.length) return null;

  const names = typingUsers.slice(0, 2).join(', ');
  const suffix = typingUsers.length > 2 ? ` +${typingUsers.length - 2} more` : '';

  return (
    <div className="mx-4 mb-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 backdrop-blur-xl">
      <div className="flex gap-1 rounded-full bg-white/8 px-3 py-2">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-300"
            style={{ animationDelay: `${index * 0.15}s` }}
          />
        ))}
      </div>

      <span className="text-[12px] font-semibold text-slate-400">
        <strong className="text-slate-200">{names}{suffix}</strong>{' '}
        {typingUsers.length === 1 ? 'is typing' : 'are typing'}…
      </span>
    </div>
  );
});

const DateSeparator = memo(({ date }) => (
  <div className="my-6 flex items-center justify-center">
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 shadow-xl backdrop-blur-xl">
      {date}
    </span>
  </div>
));

const SmartReplies = memo(({ replies, onSelect, isLoading }) => {
  if (!isLoading && !replies?.length) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20">
        <i className="fas fa-sparkles text-[12px]" />
      </div>

      {isLoading ? (
        [1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-8 w-24 animate-pulse rounded-full bg-white/10"
          />
        ))
      ) : replies.map((reply, index) => (
        <button
          key={`${reply}-${index}`}
          type="button"
          onClick={() => onSelect(reply)}
          className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-[13px] font-bold text-blue-200 shadow-lg transition hover:border-blue-300/40 hover:bg-blue-500/20 active:scale-95"
        >
          {reply}
        </button>
      ))}
    </div>
  );
});

const EmptyState = memo(() => (
  <div className="flex flex-1 items-center justify-center p-6">
    <div className="relative max-w-xs text-center">
      <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/[0.06] text-blue-300 shadow-2xl backdrop-blur-xl">
        <i className="fas fa-comments text-3xl" />
      </div>

      <h3 className="relative text-xl font-black text-white">No messages yet</h3>

      <p className="relative mt-2 text-sm leading-6 text-slate-400">
        Start the conversation, share an image, or ask AI for a quick reply.
      </p>
    </div>
  </div>
));

const Chat = ({ uId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isOpenEmoji, setIsOpenEmoji] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [msgReactions, setMsgReactions] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [smartReplies, setSmartReplies] = useState([]);
  const [smartLoading, setSmartLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const typingTimerRef = useRef(null);
  const smartReplyTimerRef = useRef(null);
  const isMounted = useRef(true);
  const fileInputRef = useRef(null);
  const sendCooldownRef = useRef(0);
  const botCooldownRef = useRef(0);
  const lastSmartCtxRef = useRef('');
  const inputRef = useRef(null);

  const { id } = useParams();
  const dispatch = useDispatch();
  const addMessage = useAddMessage();
  const isChatOpen = useSelector((state) => state.toggleChatSidebar);

  const inputCallbackRef = useCallback((element) => {
    inputRef.current = element;

    if (element) {
      element.style.height = '40px';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.focus({ preventScroll: true });
        });
      });
    }
  }, []);

  useAutoResize(inputRef, message);

  const addLocalMessage = useCallback((newMessage) => {
    setMessages((prev) => {
      if (prev.some((existing) => isSameMessage(existing, newMessage))) return prev;
      return [...prev, newMessage];
    });
  }, []);

  const removeMessageLocally = useCallback((targetMsg) => {
    const targetId = getMessageId(targetMsg);
    if (!targetId) return;

    setMessages((prev) => prev.filter((item) => getMessageId(item) !== targetId));

    setMsgReactions((prev) => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
  }, []);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      clearTimeout(typingTimerRef.current);
      clearTimeout(smartReplyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus({ preventScroll: true });
        });
      });
    }
  }, [isChatOpen]);

  useEffect(() => {
    let cancelled = false;

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/api/chat/${id}`);

        if (!cancelled && isMounted.current) {
          const list = Array.isArray(response.data) ? response.data : [];
          setMessages(list);
        }
      } catch (error) {
        console.warn('[Chat] history fetch failed:', error?.message);
      } finally {
        if (!cancelled && isMounted.current) setLoading(false);
      }
    };

    if (id) fetchMessages();
    else setLoading(false);

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const onMessage = (incoming) => {
      if (!isMounted.current || !incoming) return;
      if (incoming.roomId && incoming.roomId !== id) return;
      addLocalMessage(incoming);
    };

    const onTyping = ({ userId, name, isTyping }) => {
      if (!isMounted.current) return;
      if (userId && userId === uId) return;

      const finalName = name || 'User';

      setTypingUsers((prev) => {
        if (isTyping && !prev.includes(finalName)) return [...prev, finalName];
        if (!isTyping) return prev.filter((item) => item !== finalName);
        return prev;
      });
    };

    const onReaction = ({ msgId, emoji, userId }) => {
      if (!isMounted.current || !msgId || !emoji || !userId) return;

      setMsgReactions((prev) => ({
        ...prev,
        [msgId]: {
          ...(prev[msgId] || {}),
          [userId]: emoji,
        },
      }));
    };

    const onMessageDeleted = ({ roomId, msgId }) => {
      if (roomId && roomId !== id) return;
      if (!msgId) return;

      setMessages((prev) => prev.filter((item) => getMessageId(item) !== msgId));
      setMsgReactions((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
    };

    socket.on('receive-message', onMessage);
    socket.on('user-typing', onTyping);
    socket.on('receive-reaction', onReaction);
    socket.on('message-deleted', onMessageDeleted);

    return () => {
      socket.off('receive-message', onMessage);
      socket.off('user-typing', onTyping);
      socket.off('receive-reaction', onReaction);
      socket.off('message-deleted', onMessageDeleted);
    };
  }, [id, uId, addLocalMessage]);

  useEffect(() => {
    let cancelled = false;

    getUserDataFromFirestore(uId)
      .then((data) => {
        if (!cancelled && isMounted.current) setCurrentUser(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [uId]);

  useEffect(() => {
    clearTimeout(smartReplyTimerRef.current);

    if (!messages.length) return undefined;

    const last = messages[messages.length - 1];

    if (last?.type === 'image') {
      setSmartReplies([]);
      setSmartLoading(false);
      return undefined;
    }

    const isFromOther = last?.userid !== uId && last?.senderId !== uId;

    if (!isFromOther || !last?.text) {
      setSmartReplies([]);
      setSmartLoading(false);
      return undefined;
    }

    const ctxKey = getMessageId(last) || `${last.createdAt}-${last.text}`;

    if (lastSmartCtxRef.current === ctxKey) return undefined;

    setSmartLoading(true);

    smartReplyTimerRef.current = setTimeout(async () => {
      if (!isMounted.current) return;

      lastSmartCtxRef.current = ctxKey;

      try {
        const { data } = await api.post('/api/smart-replies', {
          roomId: id,
          text: String(last.text || '').slice(0, 160),
        });

        if (!isMounted.current) return;

        const replies = Array.isArray(data?.replies) ? data.replies : [];

        setSmartReplies(
          replies
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 3)
        );
      } catch {
        if (isMounted.current) setSmartReplies([]);
      } finally {
        if (isMounted.current) setSmartLoading(false);
      }
    }, SMART_REPLY_DELAY);

    return () => clearTimeout(smartReplyTimerRef.current);
  }, [messages, uId, id]);

  const uploadImage = useCallback(async (file) => {
    const error = validateImage(file);

    if (error) {
      alert(error);
      return;
    }

    const previewDataUrl = await fileToDataUrl(file);
    const uploadId = `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    setUploads((prev) => [
      ...prev,
      {
        id: uploadId,
        name: file.name,
        preview: previewDataUrl,
        progress: 0,
      },
    ]);

    try {
      for (let progress = 0; progress <= 100; progress += 20) {
        setUploads((prev) => (
          prev.map((upload) => (
            upload.id === uploadId ? { ...upload, progress } : upload
          ))
        ));

        await new Promise((resolve) => setTimeout(resolve, 45));
      }

      const payload = {
        id: uploadId,
        _id: uploadId,
        clientId: uploadId,
        roomId: id,
        type: 'image',
        dataUrl: previewDataUrl,
        userid: uId,
        senderId: uId,
        displayName: currentUser?.displayName || currentUser?.name || 'User',
        senderName: currentUser?.displayName || currentUser?.name || 'User',
        photoURL: currentUser?.photoURL || '',
        createdAt: new Date().toISOString(),
        role: 'user',
      };

      addLocalMessage(payload);
      await addMessage(payload);
    } catch (err) {
      console.error('[Chat] image upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
    }
  }, [id, uId, currentUser, addMessage, addLocalMessage]);

  const handleFileSelect = useCallback(async (files) => {
    const arr = Array.from(files || []);
    const seen = new Set(imagePreviews.map((preview) => `${preview.name}_${preview.size}`));

    for (const file of arr) {
      const key = `${file.name}_${file.size}`;

      if (seen.has(key)) continue;

      const error = validateImage(file);

      if (error) {
        alert(error);
        continue;
      }

      const dataUrl = await fileToDataUrl(file);

      setImagePreviews((prev) => [
        ...prev,
        {
          id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          dataUrl,
          name: file.name,
          size: file.size,
          file,
        },
      ]);

      seen.add(key);
    }
  }, [imagePreviews]);

  const handleRemovePreview = useCallback((previewId) => {
    setImagePreviews((prev) => prev.filter((preview) => preview.id !== previewId));
  }, []);

  const sendQueuedImages = useCallback(async () => {
    const queue = [...imagePreviews];

    setImagePreviews([]);

    for (const preview of queue) {
      // eslint-disable-next-line no-await-in-loop
      await uploadImage(preview.file);
    }
  }, [imagePreviews, uploadImage]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  }, [handleFileSelect]);

  const handlePaste = useCallback((event) => {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItems = items.filter((item) => (
      item.kind === 'file' && ALLOWED_MIME.includes(item.type)
    ));

    if (imageItems.length > 0) {
      event.preventDefault();

      handleFileSelect(
        imageItems
          .map((item) => item.getAsFile())
          .filter(Boolean)
      );
    }
  }, [handleFileSelect]);

  const emitStopTyping = useCallback(() => {
    socket.emit('typing-status', {
      roomId: id,
      userId: uId,
      isTyping: false,
      name: currentUser?.displayName || currentUser?.name || 'User',
    });
  }, [id, uId, currentUser]);

  const handleInputChange = useCallback((event) => {
    const value = event.target.value;

    if (value.length > MAX_MSG_LENGTH) return;

    setMessage(value);

    socket.emit('typing-status', {
      roomId: id,
      userId: uId,
      isTyping: true,
      name: currentUser?.displayName || currentUser?.name || 'User',
    });

    clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => {
      emitStopTyping();
    }, TYPING_DEBOUNCE_MS);
  }, [id, uId, currentUser, emitStopTyping]);

  const handleReact = useCallback((msgId, emoji) => {
    if (!msgId) return;

    setMsgReactions((prev) => ({
      ...prev,
      [msgId]: {
        ...(prev[msgId] || {}),
        [uId]: emoji,
      },
    }));

    socket.emit('send-reaction', {
      roomId: id,
      msgId,
      emoji,
      userId: uId,
    });
  }, [id, uId]);

  const handleDeleteMessage = useCallback((targetMsg) => {
    const msgId = getMessageId(targetMsg);
    if (!msgId) return;

    removeMessageLocally(targetMsg);

    socket.emit('delete-message', {
      roomId: id,
      msgId,
      userId: uId,
    });
  }, [id, uId, removeMessageLocally]);

  const buildTextPayload = useCallback((text, extra = {}) => {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    return {
      id: msgId,
      _id: msgId,
      clientId: msgId,
      roomId: id,
      text,
      role: 'user',
      type: 'text',
      userid: uId,
      senderId: uId,
      displayName: currentUser?.displayName || currentUser?.name || 'User',
      senderName: currentUser?.displayName || currentUser?.name || 'User',
      photoURL: currentUser?.photoURL || '',
      createdAt: new Date().toISOString(),
      ...extra,
    };
  }, [id, uId, currentUser]);

  const handleSend = useCallback(async () => {
    const hasImages = imagePreviews.length > 0;
    const text = message.trim();

    if (!text && !hasImages) return;
    if (text && text.length > MAX_MSG_LENGTH) return;

    const now = Date.now();

    if (now - sendCooldownRef.current < SEND_COOLDOWN_MS) return;

    sendCooldownRef.current = now;

    if (hasImages) {
      await sendQueuedImages();
    }

    if (text) {
      const replyData = replyingTo
        ? {
          replyto: getReplyText(replyingTo),
          replytoName: replyingTo.role === 'bot'
            ? 'AI'
            : (replyingTo.displayName || replyingTo.senderName || 'User'),
          replytophoto: replyingTo.photoURL || null,
        }
        : {};

      const payload = buildTextPayload(text, replyData);

      setMessage('');
      setReplyingTo(null);
      setSmartReplies([]);

      clearTimeout(typingTimerRef.current);
      emitStopTyping();
      playPop();

      addLocalMessage(payload);

      try {
        await addMessage(payload);
      } catch (error) {
        console.error('[Chat] failed to send message:', error);
      }
    } else {
      setMessage('');
      setReplyingTo(null);
    }
  }, [
    imagePreviews,
    message,
    sendQueuedImages,
    replyingTo,
    buildTextPayload,
    emitStopTyping,
    addLocalMessage,
    addMessage,
  ]);

  const handleBotMsg = useCallback(async () => {
    const text = message.trim();

    if (!text || text.length > MAX_MSG_LENGTH) return;

    const now = Date.now();

    if (now - botCooldownRef.current < BOT_COOLDOWN_MS) return;

    botCooldownRef.current = now;

    const contextText = messages
      .slice(-6)
      .map((item) => `${item.role === 'bot' ? 'AI' : 'User'}: ${item.text || ''}`)
      .join('\n');

    const replyContext = replyingTo
      ? `\n[Replying to: """${getReplyText(replyingTo)}"""]`
      : '';

    const replyData = replyingTo
      ? {
        replyto: getReplyText(replyingTo),
        replytoName: replyingTo.role === 'bot'
          ? 'AI'
          : (replyingTo.displayName || replyingTo.senderName || 'User'),
      }
      : {};

    const userPayload = buildTextPayload(text, replyData);

    setMessage('');
    setReplyingTo(null);
    setSmartReplies([]);
    setIsAiTyping(true);

    clearTimeout(typingTimerRef.current);
    emitStopTyping();
    playPop();

    addLocalMessage(userPayload);

    try {
      await addMessage(userPayload);
    } catch (error) {
      console.error('[Chat] failed to send user bot prompt:', error);
    }

    try {
      const { data } = await api.post('/api/ai-reply', {
        roomId: id,
        prompt: text,
        context: contextText + replyContext,
      });

      if (!data?.reply || !isMounted.current) return;

      const botId = `bot_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const botPayload = {
        id: botId,
        _id: botId,
        clientId: botId,
        roomId: id,
        text: data.reply,
        type: 'text',
        role: 'bot',
        userid: 'ai-bot',
        senderId: 'ai-bot',
        displayName: 'AI Assistant',
        senderName: 'AI Assistant',
        photoURL: botimg,
        replyto: text,
        replytoName: currentUser?.displayName || currentUser?.name || 'You',
        createdAt: new Date().toISOString(),
      };

      addLocalMessage(botPayload);
      await addMessage(botPayload);
    } catch (error) {
      console.warn('[Chat] AI reply unavailable:', error?.message);
    } finally {
      if (isMounted.current) setIsAiTyping(false);
    }
  }, [
    message,
    messages,
    replyingTo,
    buildTextPayload,
    emitStopTyping,
    addLocalMessage,
    addMessage,
        id,
    currentUser,
  ]);

  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = null;

    for (let index = 0; index < messages.length; index += 1) {
      const msg = messages[index];

      const timestampSeconds = msg.createdAt
        ? new Date(msg.createdAt).getTime() / 1000
        : msg.timestampField?.seconds;

      if (timestampSeconds) {
        const label = new Date(timestampSeconds * 1000).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });

        if (label !== lastDate) {
          groups.push({
            type: 'date',
            label,
            key: `date-${label}-${index}`,
          });

          lastDate = label;
        }
      }

      groups.push({
        type: 'msg',
        data: msg,
        key: getMessageId(msg) || `fallback-${index}`,
      });
    }

    return groups;
  }, [messages]);

  const canSend = message.trim().length > 0 || imagePreviews.length > 0;
  const charCount = message.length;
  const charWarn = charCount > 1800;

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleEmojiClick = useCallback((emojiData) => {
    setMessage((prev) => {
      const next = prev + emojiData.emoji;
      return next.length <= MAX_MSG_LENGTH ? next : prev;
    });

    setIsOpenEmoji(false);
    inputRef.current?.focus();
  }, []);

  const handleCloseSidebar = useCallback(() => {
    dispatch(toggleChatSidebar(false));
  }, [dispatch]);

  return (
    <ChatErrorBoundary>
      <PremiumChatStyles />

      <div
        className="relative z-20 flex h-full min-w-0 flex-col overflow-hidden bg-[#050713] font-sans text-white"
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-blue-600/15 blur-[90px]" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-violet-600/15 blur-[100px]" />
        </div>

        {dragOver && (
          <div className="absolute inset-3 z-50 flex items-center justify-center rounded-[2rem] border-4 border-dashed border-blue-400/70 bg-blue-500/20 backdrop-blur-md">
            <div className="flex flex-col items-center gap-3 text-blue-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 shadow-2xl ring-1 ring-white/10">
                <i className="fas fa-cloud-upload-alt text-3xl" />
              </div>
              <span className="text-lg font-black">Drop images here</span>
            </div>
          </div>
        )}

        <header className="relative z-20 shrink-0 border-b border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
                <i className="fas fa-comments text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#080d1c] bg-emerald-400" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-[15px] font-black text-white">
                    Meeting Chat
                  </h2>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-200">
                    Live
                  </span>
                </div>

                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                  {messages.length} messages · Room #{id?.slice(0, 6)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseSidebar}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-slate-300 ring-1 ring-white/10 transition hover:bg-red-500/15 hover:text-red-300"
              aria-label="Close chat"
            >
              <i className="fas fa-times text-sm" />
            </button>
          </div>
        </header>

        <div className="relative z-10 min-h-0 flex-1  overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState />
          ) : (
            <Virtuoso
              style={{ height: '100%', overflowX: 'hidden' }}
              className="premium-chat-scrollbar overflow-x-hidden px-3 py-4"
              data={groupedMessages}
              followOutput="smooth"
              initialTopMostItemIndex={Math.max(0, groupedMessages.length - 1)}
              increaseViewportBy={{ top: 700, bottom: 700 }}
              itemContent={(index, item) => (
                item.type === 'date' ? (
                  <DateSeparator date={item.label} />
                ) : (
                  <MessageCard
                    uId={uId}
                    msgData={item.data}
                    onOpenActions={setActionMessage}
                    msgReactions={msgReactions[getMessageId(item.data)]}
                    onImageClick={setLightboxSrc}
                  />
                )
              )}
              components={{
                Footer: () => (
                  isAiTyping ? (
                    <div className="mb-5 flex w-full items-end justify-start gap-2.5 px-2 py-2">
                      <img
                        src={botimg}
                        className="h-8 w-8 rounded-full border-2 border-white/10 object-cover shadow-lg"
                        alt="AI"
                      />

                      <div className="flex items-center gap-1.5 rounded-[1.35rem] rounded-bl-md border border-white/10 bg-white/[0.075] px-4 py-3.5 shadow-xl backdrop-blur-xl">
                        {[0, 1, 2].map((item) => (
                          <span
                            key={item}
                            className="h-2 w-2 animate-bounce rounded-full bg-blue-300"
                            style={{ animationDelay: `${item * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null
                ),
              }}
            />
          )}
        </div>

        <div className="relative z-20">
          <TypingIndicator typingUsers={typingUsers} />
          <UploadProgress uploads={uploads} />
        </div>

        <footer className="relative z-20 shrink-0 border-t border-white/10 bg-[#050713]/80 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-2xl">
          <div className="mx-auto w-full max-w-4xl">
            {replyingTo && (
              <div className="mb-2.5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 shadow-xl backdrop-blur-xl">
                <div className="min-w-0">
                  <span className="mb-0.5 flex items-center gap-1.5 text-[12px] font-black text-blue-300">
                    <i className="fas fa-reply text-[10px]" />
                    Replying to{' '}
                    {replyingTo.role === 'bot'
                      ? 'AI'
                      : (replyingTo.displayName || replyingTo.senderName || 'User')}
                  </span>

                  <span className="block max-w-[250px] truncate text-[12px] font-medium text-slate-400">
                    {getReplyText(replyingTo)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-slate-400 transition hover:bg-red-500/15 hover:text-red-300"
                  aria-label="Cancel reply"
                >
                  <i className="fas fa-times text-[12px]" />
                </button>
              </div>
            )}

            <ImagePreviews previews={imagePreviews} onRemove={handleRemovePreview} />

            <SmartReplies
              replies={smartReplies}
              onSelect={(reply) => {
                setMessage(reply);
                setSmartReplies([]);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              isLoading={smartLoading}
            />

            {isOpenEmoji && (
              <div className="absolute bottom-full left-3 z-50 mb-2 overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
                <EmojiPicker
                  theme="dark"
                  height={320}
                  onEmojiClick={handleEmojiClick}
                />
              </div>
            )}

            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.07] p-1.5 shadow-2xl backdrop-blur-2xl transition focus-within:border-blue-400/50 focus-within:ring-4 focus-within:ring-blue-500/10">
              <div className="flex items-end gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpenEmoji((value) => !value)}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-amber-300"
                  tabIndex={-1}
                  aria-label="Emoji"
                >
                  <i className="far fa-face-smile text-[18px]" />
                </button>

                <textarea
                  ref={inputCallbackRef}
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (!message && inputRef.current) inputRef.current.style.height = '40px';
                  }}
                  placeholder="Message..."
                  rows={1}
                  aria-label="Message input"
                  className="min-h-[40px] min-w-0 flex-1 resize-none border-none bg-transparent px-1 py-2 text-[15px] leading-6 text-white outline-none placeholder:text-slate-500"
                  style={{ height: '40px', maxHeight: '96px', overflowY: 'hidden' }}
                />

                <div className="mb-0.5 flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-blue-500/15 hover:text-blue-300"
                    title="Share images"
                    tabIndex={-1}
                    aria-label="Upload image"
                  >
                    <i className="fas fa-image text-[14px]" />
                  </button>

                  <button
                    type="button"
                    onClick={handleBotMsg}
                    disabled={!message.trim()}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                      message.trim()
                        ? 'text-violet-300 hover:bg-violet-500/15 hover:scale-105'
                        : 'cursor-not-allowed text-slate-600'
                    }`}
                    tabIndex={-1}
                    aria-label="Ask AI"
                  >
                    <i className="fas fa-robot text-[14px]" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                      canSend
                        ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 hover:shadow-blue-500/35'
                        : 'cursor-not-allowed bg-white/8 text-slate-600'
                    }`}
                    aria-label="Send"
                  >
                    <i className={`fas fa-paper-plane ${canSend ? 'text-[13px] -ml-0.5 mt-0.5' : 'text-[14px]'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-3 px-2">
              <p className="truncate text-[10px] font-semibold text-slate-600">
                <i className="fab fa-markdown mr-1" />
                Markdown · Shift+Enter · Paste or drag images
              </p>

              <p
                className={`shrink-0 text-[10px] font-black ${
                  charWarn ? 'text-amber-300' : 'text-slate-600'
                }`}
              >
                {charCount > 0 ? `${charCount} / ${MAX_MSG_LENGTH}` : ''}
              </p>
            </div>
          </div>
        </footer>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          aria-hidden="true"
          onChange={(event) => {
            handleFileSelect(event.target.files);
            event.target.value = '';
          }}
        />

        <MessageActionSheet
          message={actionMessage}
          currentUserId={uId}
          onClose={() => setActionMessage(null)}
          onReply={setReplyingTo}
          onReact={handleReact}
          onDelete={handleDeleteMessage}
        />

        {lightboxSrc && (
          <ImageModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        )}
      </div>
    </ChatErrorBoundary>
  );
};

export default Chat;
