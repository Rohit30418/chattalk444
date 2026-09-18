import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import api from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../auth/AppWrapper';
import SocialNav from './SocialNav';
import MemberAvatar from '../common/MemberAvatar';
import MemberNameplate from '../common/MemberNameplate';
import {
  RichImageModal,
  RichMessageActionSheet,
  RichMessageBubble,
  RichReplyPreview,
  getRichMessageId,
  readRichImageAsDataUrl,
  validateRichImage,
} from '../chat/RichChatPrimitives';

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatLastActive = (value, isOnline = false) => {
  if (isOnline) return 'Online now';
  if (!value) return 'Offline';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Offline';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Active just now';
  if (minutes < 60) return `Active ${minutes} min ago`;
  if (hours < 24) return `Active ${hours} hr${hours === 1 ? '' : 's'} ago`;
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days} days ago`;

  return `Active ${date.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
};

const notifyUnreadChanged = () => {
  window.dispatchEvent(new CustomEvent('vaani-chat-unread-changed'));
};

const previewMessageText = (message) => {
  if (!message) return '';
  if (message.type === 'gif') return 'GIF';
  if (message.type === 'image') return 'Image';
  return message.text || '';
};

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [typingUid, setTypingUid] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeId = searchParams.get('conversation') || '';

  const loadConversations = useCallback(async () => {
    if (!user?.uid) {
      setLoadingList(false);
      return;
    }

    try {
      setLoadingList(true);
      setError('');
      const { data } = await api.get('/api/social/conversations');
      const list = Array.isArray(data?.conversations) ? data.conversations : [];
      setConversations(list);
    } catch (err) {
      setError(err.userMessage || 'Could not load conversations.');
    } finally {
      setLoadingList(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId || !user?.uid) {
      setActiveConversation(null);
      setMessages([]);
      setTypingUid('');
      return;
    }

    const selected = conversations.find((item) => item.id === activeId) || null;
    setActiveConversation(selected);

    let cancelled = false;

    const load = async () => {
      try {
        setLoadingMessages(true);
        const { data } = await api.get(`/api/social/conversations/${encodeURIComponent(activeId)}/messages`);
        if (cancelled) return;

        setMessages(Array.isArray(data?.messages) ? data.messages : []);
        await api.post(`/api/social/conversations/${encodeURIComponent(activeId)}/read`).catch(() => {});
        setConversations((current) => current.map((item) => (
          item.id === activeId ? { ...item, unread: 0 } : item
        )));
        notifyUnreadChanged();
      } catch (err) {
        if (!cancelled) setError(err.userMessage || 'Could not load messages.');
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [activeId, conversations.length, user?.uid]);

  useEffect(() => {
    const onMessage = (message) => {
      const conversationId = message?.conversationId;
      if (!conversationId) return;

      setConversations((current) => {
        const index = current.findIndex((item) => item.id === conversationId);
        if (index === -1) {
          loadConversations();
          return current;
        }

        const existing = current[index];
        const updated = {
          ...existing,
          lastMessage: previewMessageText(message),
          lastMessageAt: message.createdAt,
          unread: conversationId === activeId ? 0 : Number(existing.unread || 0) + 1,
        };

        return [updated, ...current.filter((item) => item.id !== conversationId)];
      });

      if (conversationId === activeId) {
        setMessages((current) => (
          current.some((item) => item.id === message.id) ? current : [...current, message]
        ));
        api.post(`/api/social/conversations/${encodeURIComponent(conversationId)}/read`)
          .catch(() => {})
          .finally(notifyUnreadChanged);
      }
    };

    const onTyping = (payload) => {
      if (payload?.conversationId !== activeId) return;
      setTypingUid(payload?.isTyping ? payload.uid : '');
    };

    const onReaction = (payload) => {
      if (payload?.conversationId !== activeId || !payload?.messageId) return;
      setMessages((current) => current.map((message) => (
        message.id === payload.messageId
          ? { ...message, reactions: payload.reactions || {} }
          : message
      )));
    };

    const onDeleted = (payload) => {
      if (!payload?.conversationId || !payload?.messageId) return;

      if (payload.conversationId === activeId) {
        setMessages((current) => current.filter((message) => message.id !== payload.messageId));
        setActionMessage((current) => (
          current?.id === payload.messageId ? null : current
        ));
      }

      setConversations((current) => current.map((conversation) => (
        conversation.id === payload.conversationId
          ? {
              ...conversation,
              lastMessage: payload.lastMessage || '',
              lastMessageAt: payload.lastMessageAt || conversation.lastMessageAt,
            }
          : conversation
      )));
    };

    const onPresence = ({ uid, isOnline }) => {
      const lastActive = isOnline ? undefined : new Date().toISOString();

      setConversations((current) => current.map((conversation) => {
        if (conversation.otherUser?.uid !== uid) return conversation;
        return {
          ...conversation,
          otherUser: {
            ...conversation.otherUser,
            isOnline,
            ...(lastActive ? { lastActive } : {}),
          },
        };
      }));

      setActiveConversation((current) => {
        if (current?.otherUser?.uid !== uid) return current;
        return {
          ...current,
          otherUser: {
            ...current.otherUser,
            isOnline,
            ...(lastActive ? { lastActive } : {}),
          },
        };
      });
    };

    const onMemberAppearance = (updatedUser) => {
      if (!updatedUser?.uid) return;
      setConversations((current) => current.map((conversation) => (
        conversation.otherUser?.uid === updatedUser.uid
          ? { ...conversation, otherUser: { ...conversation.otherUser, ...updatedUser } }
          : conversation
      )));
      setActiveConversation((current) => (
        current?.otherUser?.uid === updatedUser.uid
          ? { ...current, otherUser: { ...current.otherUser, ...updatedUser } }
          : current
      ));
    };

    socket.on('social-message', onMessage);
    socket.on('social-message-sent', onMessage);
    socket.on('social-typing', onTyping);
    socket.on('social-message-reaction', onReaction);
    socket.on('social-message-deleted', onDeleted);
    socket.on('social-presence', onPresence);
    socket.on('social-member-appearance', onMemberAppearance);

    return () => {
      socket.off('social-message', onMessage);
      socket.off('social-message-sent', onMessage);
      socket.off('social-typing', onTyping);
      socket.off('social-message-reaction', onReaction);
      socket.off('social-message-deleted', onDeleted);
      socket.off('social-presence', onPresence);
      socket.off('social-member-appearance', onMemberAppearance);
    };
  }, [activeId, loadConversations]);

  useEffect(() => {
    if (!activeId || loadingMessages || messages.length === 0) return undefined;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [messages.length, activeId, loadingMessages]);

  useEffect(() => () => {
    window.clearTimeout(typingTimerRef.current);
  }, []);

  const selectConversation = useCallback((conversation) => {
    if (!conversation?.id) return;
    setSearchParams({ conversation: conversation.id });
  }, [setSearchParams]);

  const showConversationList = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
    setTypingUid('');
    setDraft('');
    setReplyingTo(null);
    setActionMessage(null);
    setMediaPreviews([]);
    setIsEmojiOpen(false);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleDraftChange = useCallback((event) => {
    const value = event.target.value;
    setDraft(value);
    if (!activeConversation?.otherUser?.uid || !activeId) return;

    socket.emit('social-typing', {
      targetUid: activeConversation.otherUser.uid,
      conversationId: activeId,
      isTyping: Boolean(value.trim()),
    });

    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      socket.emit('social-typing', {
        targetUid: activeConversation.otherUser.uid,
        conversationId: activeId,
        isTyping: false,
      });
    }, 1200);
  }, [activeConversation?.otherUser?.uid, activeId]);

  const handleEmojiClick = useCallback((emojiData) => {
    setDraft((current) => {
      const next = current + emojiData.emoji;
      return next.slice(0, 2000);
    });
    setIsEmojiOpen(false);
  }, []);

  const handleFiles = useCallback(async (files) => {
    const selected = Array.from(files || []);

    for (const file of selected) {
      const validationError = validateRichImage(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      try {
        const dataUrl = await readRichImageAsDataUrl(file);
        setMediaPreviews((current) => [
          ...current,
          {
            id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
            file,
            dataUrl,
            type: file.type === 'image/gif' ? 'gif' : 'image',
          },
        ]);
      } catch {
        setError('Could not read this image.');
      }
    }
  }, []);

  const removeMediaPreview = useCallback((id) => {
    setMediaPreviews((current) => current.filter((item) => item.id !== id));
  }, []);

  const handleReact = useCallback(async (messageId, emoji) => {
    if (!activeId || !messageId) return;

    try {
      const { data } = await api.post(
        `/api/social/conversations/${encodeURIComponent(activeId)}/messages/${encodeURIComponent(messageId)}/reaction`,
        { emoji }
      );

      setMessages((current) => current.map((message) => (
        message.id === messageId
          ? { ...message, reactions: data?.reactions || {} }
          : message
      )));
    } catch (err) {
      setError(err.userMessage || 'Could not update reaction.');
    }
  }, [activeId]);

  const handleDeleteMessage = useCallback(async (message) => {
    const messageId = getRichMessageId(message);
    if (!activeId || !messageId || message.senderUid !== user?.uid) return;

    try {
      const { data } = await api.delete(
        `/api/social/conversations/${encodeURIComponent(activeId)}/messages/${encodeURIComponent(messageId)}`
      );

      setMessages((current) => current.filter((item) => item.id !== messageId));
      setConversations((current) => current.map((conversation) => (
        conversation.id === activeId
          ? {
              ...conversation,
              lastMessage: data?.lastMessage || '',
              lastMessageAt: data?.lastMessageAt || conversation.lastMessageAt,
            }
          : conversation
      )));
    } catch (err) {
      setError(err.userMessage || 'Could not delete message.');
    }
  }, [activeId, user?.uid]);

  const sendMessage = useCallback(async (event) => {
    event?.preventDefault();
    const text = draft.trim();
    const pendingMedia = [...mediaPreviews];

    if ((!text && pendingMedia.length === 0) || !activeId || sending) return;

    try {
      setSending(true);
      setError('');
      setDraft('');
      setMediaPreviews([]);

      const sentMessages = [];

      for (const media of pendingMedia) {
        const { data } = await api.post(
          `/api/social/conversations/${encodeURIComponent(activeId)}/messages`,
          {
            type: media.type,
            mediaUrl: media.dataUrl,
            replyTo: replyingTo ? { messageId: getRichMessageId(replyingTo) } : undefined,
          }
        );

        if (data?.message) sentMessages.push(data.message);
      }

      if (text) {
        const { data } = await api.post(
          `/api/social/conversations/${encodeURIComponent(activeId)}/messages`,
          {
            type: 'text',
            text,
            replyTo: replyingTo ? { messageId: getRichMessageId(replyingTo) } : undefined,
          }
        );

        if (data?.message) sentMessages.push(data.message);
      }

      setReplyingTo(null);
      setIsEmojiOpen(false);

      if (sentMessages.length) {
        setMessages((current) => {
          const map = new Map(current.map((message) => [message.id, message]));
          sentMessages.forEach((message) => map.set(message.id, message));
          return Array.from(map.values());
        });

        const latest = sentMessages[sentMessages.length - 1];
        setConversations((current) => {
          const selected = current.find((item) => item.id === activeId);
          if (!selected) return current;
          const updated = {
            ...selected,
            lastMessage: previewMessageText(latest),
            lastMessageAt: latest.createdAt,
            unread: 0,
          };
          return [updated, ...current.filter((item) => item.id !== activeId)];
        });
      }

      if (activeConversation?.otherUser?.uid) {
        socket.emit('social-typing', {
          targetUid: activeConversation.otherUser.uid,
          conversationId: activeId,
          isTyping: false,
        });
      }
    } catch (err) {
      setDraft(text);
      setMediaPreviews(pendingMedia);
      setError(err.userMessage || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  }, [
    activeConversation?.otherUser?.uid,
    activeId,
    draft,
    mediaPreviews,
    replyingTo,
    sending,
  ]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, item) => sum + Number(item.unread || 0), 0),
    [conversations]
  );

  if (!user?.uid) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#050713]">
        <SocialNav />
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
            <i className="fa-solid fa-user-lock" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">Sign in to message people</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Private Vaani conversations are available after sign in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050713] dark:text-white">
      <SocialNav />

      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 lg:px-8 lg:py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid min-h-[680px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1220] lg:h-[calc(100dvh-170px)] lg:min-h-[620px] lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)]">
          <aside className={`${activeConversation ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-r border-slate-200 dark:border-white/10`}>
            <div className="border-b border-slate-200 p-5 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Private chat</p>
                  <h1 className="mt-1 text-2xl font-black">Messages</h1>
                </div>
                {totalUnread > 0 && (
                  <span className="rounded-full bg-teal-700 px-2.5 py-1 text-xs font-black text-white">
                    {totalUnread}
                  </span>
                )}
              </div>
              <Link to="/connect" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-teal-700 hover:text-teal-800 dark:text-teal-300">
                <i className="fa-solid fa-user-plus" />
                Start a new conversation
              </Link>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {loadingList && (
                <div className="p-6 text-center text-sm font-bold text-slate-500">Loading conversations...</div>
              )}

              {!loadingList && conversations.length === 0 && (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.05]">
                    <i className="fa-regular fa-message" />
                  </div>
                  <p className="mt-4 text-sm font-black">No messages yet</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                    Find a learner in Connect and send the first message.
                  </p>
                </div>
              )}

              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                    conversation.id === activeId
                      ? 'bg-teal-50 dark:bg-teal-500/10'
                      : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="relative shrink-0">
                    <MemberAvatar user={conversation.otherUser} className="h-11 w-11" />
                    <span className={`absolute -bottom-0.5 -right-0.5 z-30 h-3 w-3 rounded-full border-2 border-white dark:border-[#0b1220] ${
                      conversation.otherUser?.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <MemberNameplate
                        user={conversation.otherUser}
                        compact
                        className="max-w-[170px] text-[10px] font-black"
                      />
                      <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <p className={`min-w-0 flex-1 truncate text-xs ${
                        conversation.unread
                          ? 'font-black text-slate-900 dark:text-white'
                          : 'font-medium text-slate-500 dark:text-slate-400'
                      }`}>
                        {conversation.lastMessage || 'Start a conversation'}
                      </p>
                      {conversation.unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-black text-white">
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className={`${activeConversation ? 'flex' : 'hidden lg:flex'} relative min-h-0 flex-col overflow-hidden`}>
            {activeConversation ? (
              <>
                <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10 sm:px-5">
                  <button
                    type="button"
                    onClick={showConversationList}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden dark:border-white/10 dark:text-slate-300"
                    aria-label="Back to conversations"
                  >
                    <i className="fa-solid fa-arrow-left text-xs" />
                  </button>

                  <MemberAvatar
                    user={activeConversation.otherUser}
                    className="h-11 w-11"
                  />

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/profile/${encodeURIComponent(activeConversation.otherUser?.uid || '')}`}
                      className="inline-flex max-w-full hover:opacity-90"
                    >
                      <MemberNameplate
                        user={activeConversation.otherUser}
                        compact
                        className="max-w-[220px] text-[11px] font-black"
                      />
                    </Link>

                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {typingUid
                        ? 'Typing...'
                        : formatLastActive(
                          activeConversation.otherUser?.lastActive,
                          activeConversation.otherUser?.isOnline
                        )}
                    </p>
                  </div>

                  <Link
                    to={`/profile/${encodeURIComponent(activeConversation.otherUser?.uid || '')}`}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300"
                    aria-label="Open profile"
                  >
                    <i className="fa-regular fa-user text-xs" />
                  </Link>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-4 py-5 dark:bg-[#070b13] sm:px-6">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500">
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                        <i className="fa-regular fa-comments" />
                      </div>
                      <h2 className="mt-4 text-lg font-black">Say hello</h2>
                      <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                        Start a private conversation. Be respectful and keep language practice friendly.
                      </p>
                    </div>
                  ) : (
                    <div className="mx-auto flex w-full max-w-3xl flex-col">
                      {messages.map((message) => {
                        const mine = message.senderUid === user.uid;
                        const senderUser = mine ? user : activeConversation.otherUser;

                        return (
                          <RichMessageBubble
                            key={message.id}
                            message={message}
                            currentUserId={user.uid}
                            senderName={senderUser?.displayName || (mine ? 'You' : 'Vaani User')}
                            senderPhoto={senderUser?.photoURL || ''}
                            onOpenActions={setActionMessage}
                            onImageClick={setLightboxSrc}
                            compact
                          />
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                <form
                  onSubmit={sendMessage}
                  className="sticky bottom-0 z-30 shrink-0 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/95 sm:p-4"
                >
                  <div className="relative mx-auto max-w-3xl">
                    <RichReplyPreview
                      message={replyingTo}
                      onCancel={() => setReplyingTo(null)}
                      dark={false}
                    />

                    {mediaPreviews.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {mediaPreviews.map((media) => (
                          <div key={media.id} className="group relative">
                            <img src={media.dataUrl} alt="" className="h-20 w-20 rounded-2xl border border-slate-200 object-cover dark:border-white/10" />
                            <button type="button" onClick={() => removeMediaPreview(media.id)} className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] text-white" aria-label="Remove media">
                              <i className="fa-solid fa-xmark" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {isEmojiOpen && (
                      <div className="absolute bottom-full left-0 z-50 mb-2 overflow-hidden rounded-3xl border border-slate-200 shadow-2xl dark:border-white/10">
                        <EmojiPicker
                          theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                          height={320}
                          onEmojiClick={handleEmojiClick}
                        />
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEmojiOpen((value) => !value)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-amber-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                        aria-label="Emoji"
                      >
                        <i className="fa-regular fa-face-smile" />
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-teal-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                        aria-label="Attach image or GIF"
                      >
                        <i className="fa-solid fa-paperclip" />
                      </button>

                      <textarea
                      value={draft}
                      onChange={handleDraftChange}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage(event);
                        }
                      }}
                      rows={1}
                      maxLength={2000}
                      placeholder="Write a message..."
                      className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-teal-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={(!draft.trim() && mediaPreviews.length === 0) || sending}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Send message"
                    >
                      <i className={`fa-solid ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-xs`} />
                    </button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      handleFiles(event.target.files);
                      event.target.value = '';
                    }}
                  />
                </form>

                <RichMessageActionSheet
                  message={actionMessage}
                  currentUserId={user.uid}
                  onClose={() => setActionMessage(null)}
                  onReply={setReplyingTo}
                  onReact={handleReact}
                  onDelete={handleDeleteMessage}
                />

                <RichImageModal
                  src={lightboxSrc}
                  onClose={() => setLightboxSrc('')}
                />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-teal-50 text-xl text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                  <i className="fa-regular fa-comments" />
                </div>
                <h2 className="mt-5 text-xl font-black">Your private conversations</h2>
                <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                  Choose a conversation from the list or find someone new from the Connect tab.
                </p>
                <Link to="/connect" className="mt-5 rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white">
                  Find people
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default MessagesPage;
