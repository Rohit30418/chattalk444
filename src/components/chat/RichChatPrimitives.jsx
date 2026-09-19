import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

export const CHAT_REACTIONS = ['👍', '❤️', '😂', '😮', '🎉'];
export const RICH_MAX_IMAGE_SIZE = 1.5 * 1024 * 1024;
export const RICH_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const validateRichImage = (file) => {
  if (!file) return 'No file selected.';
  if (!RICH_ALLOWED_MIME.includes(file.type)) return 'Only JPEG, PNG, GIF, or WebP images are allowed.';
  if (file.size > RICH_MAX_IMAGE_SIZE) return 'Image must be smaller than 1.5 MB.';
  return null;
};

export const readRichImageAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('File read failed'));
  reader.readAsDataURL(file);
});

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

export const getRichMessageId = (message) => (
  message?._id || message?.id || message?.clientId || ''
);

export const getRichSenderUid = (message) => (
  message?.senderUid || message?.senderId || message?.userid || ''
);

export const getRichMessageType = (message) => (
  message?.type === 'gif' ? 'gif' : message?.type === 'image' ? 'image' : 'text'
);

export const getRichMediaUrl = (message) => (
  message?.mediaUrl || message?.dataUrl || message?.imageUrl || message?.url || ''
);

export const getRichReply = (message) => {
  if (message?.replyTo) {
    return {
      messageId: message.replyTo.messageId || '',
      senderUid: message.replyTo.senderUid || '',
      senderName: message.replyTo.senderName || 'User',
      text: message.replyTo.text || '',
      type: message.replyTo.type || 'text',
    };
  }

  if (message?.replyto) {
    return {
      messageId: message.replyMessageId || '',
      senderUid: message.replytoUid || '',
      senderName: message.replytoName || 'User',
      text: message.replyto || '',
      type: message.replytoType || 'text',
    };
  }

  return null;
};

export const getRichReplyText = (message) => {
  if (!message) return '';
  const type = getRichMessageType(message);
  if (type === 'gif') return 'GIF';
  if (type === 'image') return 'Image';
  return message.text || '';
};

export const getRichDisplayTime = (message) => {
  let date = new Date();

  if (message?.createdAt) {
    date = new Date(message.createdAt);
  } else if (message?.timestampField?.seconds) {
    date = new Date(message.timestampField.seconds * 1000);
  }

  if (Number.isNaN(date.getTime())) date = new Date();

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const markdownOwn = {
  p: ({ children }) => <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-white/95">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
  code: ({ inline, children }) => inline
    ? <code className="rounded-lg bg-black/20 px-1.5 py-0.5 font-mono text-[12px] text-blue-50">{children}</code>
    : <pre className="my-2 max-w-full overflow-x-auto rounded-2xl bg-black/25 p-3 text-[12px]"><code>{children}</code></pre>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-white underline decoration-white/40 underline-offset-4">{children}</a>,
};

const markdownOther = {
  p: ({ children }) => <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-100">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
  code: ({ inline, children }) => inline
    ? <code className="rounded-lg bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-pink-200">{children}</code>
    : <pre className="my-2 max-w-full overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-3 text-[12px]"><code>{children}</code></pre>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-blue-300 underline decoration-blue-300/40 underline-offset-4">{children}</a>,
};

export const RichMarkdown = memo(({ text, isOwn }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
    components={isOwn ? markdownOwn : markdownOther}
  >
    {text || ''}
  </ReactMarkdown>
));

export const RichImageModal = memo(({ src, onClose }) => {
  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white"
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

export const RichReplyPreview = memo(({ message, onCancel, dark = true }) => {
  if (!message) return null;

  const name = message.role === 'bot'
    ? 'AI'
    : (message.displayName || message.senderName || message.replyTo?.senderName || 'User');

  return (
    <div className={`mb-2.5 flex items-center justify-between rounded-2xl border px-3.5 py-2.5 shadow-sm ${
      dark
        ? 'border-white/10 bg-white/[0.06] text-white'
        : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-white'
    }`}>
      <div className="min-w-0">
        <span className={`flex items-center gap-1.5 text-[12px] font-black ${dark ? 'text-blue-300' : 'text-teal-700 dark:text-teal-300'}`}>
          <i className="fas fa-reply text-[10px]" />
          Replying to {name}
        </span>
        <span className={`block max-w-[280px] truncate text-[12px] font-medium ${dark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {getRichReplyText(message)}
        </span>
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          aria-label="Cancel reply"
        >
          <i className="fas fa-times text-[12px]" />
        </button>
      )}
    </div>
  );
});

export const RichMessageActionSheet = memo(({
  message,
  currentUserId,
  onClose,
  onReply,
  onReact,
  onDelete,
  allowDeleteForOthers = false,
}) => {
  if (!message) return null;

  const messageId = getRichMessageId(message);
  const isOwn = currentUserId === getRichSenderUid(message);
  const canDelete = isOwn || allowDeleteForOthers;
  const type = getRichMessageType(message);

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[320px] rounded-[1.6rem] border border-white/10 bg-[#0b1120]/95 p-3 text-white shadow-2xl ring-1 ring-white/5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
            <i className={`fa-solid ${type === 'text' ? 'fa-message' : 'fa-image'} text-sm`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white">Message actions</p>
            <p className="truncate text-xs text-slate-500">
              {type === 'text' ? (message.text || 'Message') : type === 'gif' ? 'GIF message' : 'Image message'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-slate-400 hover:text-white" aria-label="Close actions">
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-5 gap-1.5">
          {CHAT_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact?.(messageId, emoji, message);
                onClose?.();
              }}
              className="flex h-11 items-center justify-center rounded-2xl bg-white/10 text-2xl transition hover:scale-110 hover:bg-white/15"
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
              onReply?.(message);
              onClose?.();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-slate-200 hover:bg-white/10"
          >
            <i className="fas fa-reply w-5 text-center text-blue-300" />
            Reply
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete?.(message);
                onClose?.();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-red-300 hover:bg-red-500/10"
            >
              <i className="fas fa-trash w-5 text-center" />
              Delete message
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export const RichMessageBubble = memo(({
  message,
  currentUserId,
  reactions,
  onOpenActions,
  onImageClick,
  senderName,
  senderPhoto,
  botPhoto,
  compact = false,
}) => {
  const [showMore, setShowMore] = useState(false);
  const longPressTimer = useRef(null);

  const isOwn = currentUserId === getRichSenderUid(message);
  const type = getRichMessageType(message);
  const mediaUrl = getRichMediaUrl(message);
  const reply = getRichReply(message);
  const text = message?.text || '';
  const displayName = message?.role === 'bot'
    ? 'AI Assistant'
    : (senderName || message?.displayName || message?.senderName || 'User');
  const photo = message?.role === 'bot'
    ? botPhoto
    : (senderPhoto || message?.photoURL || '');
  const time = getRichDisplayTime(message);

  const isEmoji = useMemo(() => {
    const trimmed = text.trim();
    return Boolean(trimmed) && /^\p{Emoji}+$/u.test(trimmed) && trimmed.length <= 4;
  }, [text]);

  const displayText = useMemo(() => {
    if (isEmoji || showMore || text.length <= 300) return text;
    return `${text.slice(0, 300)}…`;
  }, [isEmoji, showMore, text]);

  const reactionSummary = useMemo(() => {
    const source = reactions || message?.reactions || {};
    return Object.values(source).reduce((acc, emoji) => {
      if (!emoji) return acc;
      acc[emoji] = (acc[emoji] || 0) + 1;
      return acc;
    }, {});
  }, [message?.reactions, reactions]);

  const openActions = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onOpenActions?.(message);
  }, [message, onOpenActions]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const startLongPress = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      onOpenActions?.(message);
      navigator.vibrate?.(40);
    }, 420);
  }, [message, onOpenActions]);

  useEffect(() => () => cancelLongPress(), [cancelLongPress]);

  return (
    <div className={`flex w-full min-w-0 ${isOwn ? 'justify-end' : 'justify-start'} ${compact ? 'pb-2' : 'pb-4'}`}>
      <div className={`relative flex min-w-0 items-end gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${compact ? 'max-w-[86%]' : 'max-w-[88%] md:max-w-[80%]'}`}>
        {!isOwn && (
          <div className="mb-1 shrink-0">
            {photo ? (
              <img src={photo} referrerPolicy="no-referrer" alt={displayName} className="h-8 w-8 rounded-full border-2 border-white/10 object-cover shadow" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-[10px] font-black text-white">
                {(displayName || 'U').slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        )}

        <div
          className={`relative flex min-w-0 flex-col ${isOwn ? 'items-end' : 'items-start'} select-none sm:select-auto`}
          onContextMenu={openActions}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
        >
          {!isOwn && !isEmoji && (
            <span className="mb-1 ml-1 text-[11px] font-black text-slate-400">{displayName}</span>
          )}

          {(type === 'image' || type === 'gif') && mediaUrl ? (
            <div className="relative">
              <div className={`group relative max-w-full overflow-hidden rounded-[1.35rem] border shadow-xl ${isOwn ? 'rounded-br-md border-blue-400/20 bg-blue-600/20' : 'rounded-bl-md border-white/10 bg-white/[0.06]'}`}>
                {reply && (
                  <div className={`mx-2 mt-2 flex max-w-[230px] flex-col gap-0.5 overflow-hidden rounded-xl border-l-[3px] px-2.5 py-1.5 ${isOwn ? 'border-l-white/70 bg-black/20 text-white/90' : 'border-l-blue-400 bg-black/20 text-slate-300'}`}>
                    <span className={`flex items-center gap-1 truncate text-[10px] font-black leading-4 ${isOwn ? 'text-blue-100' : 'text-blue-300'}`}>
                      <i className="fas fa-reply text-[8px]" />
                      {reply.senderName || 'User'}
                    </span>
                    <span className="truncate text-[11px] font-medium leading-4 opacity-75">{reply.text || (reply.type === 'gif' ? 'GIF' : reply.type === 'image' ? 'Image' : '')}</span>
                  </div>
                )}

                <button type="button" onClick={openActions} className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white" aria-label="Message actions">
                  <i className="fa-solid fa-ellipsis-vertical text-[11px]" />
                </button>
                <button type="button" onClick={() => onImageClick?.(mediaUrl)} className="block max-w-full">
                  <img src={mediaUrl} alt={type === 'gif' ? 'Shared GIF' : 'Shared image'} className="block max-h-[280px] w-auto max-w-[min(300px,calc(100vw-96px))] object-cover" loading="lazy" />
                </button>
                <div className={`flex items-center justify-end px-3 py-1.5 text-[10px] font-bold ${isOwn ? 'bg-blue-600/80 text-blue-50' : 'bg-black/20 text-slate-400'}`}>
                  {time}
                </div>
              </div>

              {Object.keys(reactionSummary).length > 0 && (
                <div className={`pointer-events-none absolute -bottom-3 z-10 flex flex-wrap gap-1 ${isOwn ? 'right-2' : 'left-2'}`}>
                  {Object.entries(reactionSummary).map(([emoji, count]) => (
                    <span key={emoji} className="flex items-center gap-1 rounded-full border border-white/10 bg-[#10172a] px-2 py-0.5 text-[12px] text-slate-100 shadow-xl">
                      {emoji}
                      {count > 1 && <span className="text-[10px] font-black opacity-75">{count}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`group relative min-w-0 max-w-full ${
              isEmoji
                ? 'bg-transparent'
                : isOwn
                  ? 'rounded-[1.35rem] rounded-br-md bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-4 py-3 text-white shadow-xl'
                  : 'rounded-[1.35rem] rounded-bl-md border border-white/10 bg-white/[0.075] px-4 py-3 text-slate-100 shadow-xl backdrop-blur-xl'
            }`}>
              {!isEmoji && (
                <button type="button" onClick={openActions} className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full text-slate-300 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100" aria-label="Message actions">
                  <i className="fa-solid fa-ellipsis-vertical text-[10px]" />
                </button>
              )}

              {!isEmoji && reply && (
                <div className={`relative mb-2 max-w-[230px] overflow-hidden rounded-xl border-l-[3px] px-2.5 py-1.5 ${isOwn ? 'border-l-white/70 bg-black/15 text-white/90' : 'border-l-blue-400 bg-black/20 text-slate-300'}`}>
                  <span className={`flex items-center gap-1 truncate text-[10px] font-black leading-4 ${isOwn ? 'text-blue-100' : 'text-blue-300'}`}>
                    <i className="fas fa-reply text-[8px]" />
                    {reply.senderName || 'User'}
                  </span>
                  <span className="block truncate text-[11px] font-medium leading-4 opacity-75">{reply.text || (reply.type === 'gif' ? 'GIF' : reply.type === 'image' ? 'Image' : '')}</span>
                </div>
              )}

              {isEmoji ? (
                <span className="block select-none text-5xl" role="img" aria-label="emoji">{text}</span>
              ) : (
                <div className="relative min-w-[60px] max-w-full pb-4">
                  <RichMarkdown text={displayText} isOwn={isOwn} />
                  {text.length > 300 && (
                    <button type="button" onClick={() => setShowMore((value) => !value)} className={`mt-1.5 text-[12px] font-black ${isOwn ? 'text-blue-100' : 'text-blue-300'}`}>
                      {showMore ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {!isEmoji && (
                <span className={`absolute bottom-2 right-3 text-[10px] font-bold ${isOwn ? 'text-blue-100/80' : 'text-slate-500'}`}>{time}</span>
              )}

              {Object.keys(reactionSummary).length > 0 && (
                <div className={`pointer-events-none absolute -bottom-3 z-10 flex flex-wrap gap-1 ${isOwn ? 'right-2' : 'left-2'}`}>
                  {Object.entries(reactionSummary).map(([emoji, count]) => (
                    <span key={emoji} className="flex items-center gap-1 rounded-full border border-white/10 bg-[#10172a] px-2 py-0.5 text-[12px] text-slate-100 shadow-xl">
                      {emoji}
                      {count > 1 && <span className="text-[10px] font-black opacity-75">{count}</span>}
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
});
