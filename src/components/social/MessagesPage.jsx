import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../auth/AppWrapper';
import SocialNav from './SocialNav';

const initials = (name = 'Vaani User') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'VU';

const Avatar = ({ user, size = 'h-11 w-11' }) => {
  const [failed, setFailed] = useState(false);
  if (user?.photoURL && !failed) {
    return <img src={user.photoURL} alt={user.displayName || 'Vaani user'} onError={() => setFailed(true)} className={`${size} rounded-2xl object-cover`} />;
  }
  return <div className={`${size} flex items-center justify-center rounded-2xl bg-teal-700 text-xs font-black text-white`}>{initials(user?.displayName)}</div>;
};

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
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

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

      if (!activeId && list[0]?.id) {
        setSearchParams({ conversation: list[0].id }, { replace: true });
      }
    } catch (err) {
      setError(err.userMessage || 'Could not load conversations.');
    } finally {
      setLoadingList(false);
    }
  }, [activeId, setSearchParams, user?.uid]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId || !user?.uid) {
      setActiveConversation(null);
      setMessages([]);
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
        setConversations((current) => current.map((item) => item.id === activeId ? { ...item, unread: 0 } : item));
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
          lastMessage: message.text,
          lastMessageAt: message.createdAt,
          unread: conversationId === activeId ? 0 : Number(existing.unread || 0) + 1,
        };
        return [updated, ...current.filter((item) => item.id !== conversationId)];
      });

      if (conversationId === activeId) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
        api.post(`/api/social/conversations/${encodeURIComponent(conversationId)}/read`).catch(() => {});
      }
    };

    const onTyping = (payload) => {
      if (payload?.conversationId !== activeId) return;
      setTypingUid(payload?.isTyping ? payload.uid : '');
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

    socket.on('social-message', onMessage);
    socket.on('social-message-sent', onMessage);
    socket.on('social-typing', onTyping);
    socket.on('social-presence', onPresence);
    return () => {
      socket.off('social-message', onMessage);
      socket.off('social-message-sent', onMessage);
      socket.off('social-typing', onTyping);
      socket.off('social-presence', onPresence);
    };
  }, [activeId, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, activeId]);

  const selectConversation = useCallback((conversation) => {
    if (!conversation?.id) return;
    setSearchParams({ conversation: conversation.id });
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

  const sendMessage = useCallback(async (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || !activeId || sending) return;

    try {
      setSending(true);
      setDraft('');
      const { data } = await api.post(`/api/social/conversations/${encodeURIComponent(activeId)}/messages`, { text });
      const sent = data?.message;
      if (sent) {
        setMessages((current) => current.some((item) => item.id === sent.id) ? current : [...current, sent]);
        setConversations((current) => {
          const selected = current.find((item) => item.id === activeId);
          if (!selected) return current;
          const updated = { ...selected, lastMessage: sent.text, lastMessageAt: sent.createdAt, unread: 0 };
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
      setError(err.userMessage || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  }, [activeConversation?.otherUser?.uid, activeId, draft, sending]);

  const totalUnread = useMemo(() => conversations.reduce((sum, item) => sum + Number(item.unread || 0), 0), [conversations]);

  if (!user?.uid) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#050713]">
        <SocialNav />
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"><i className="fa-solid fa-user-lock" /></div>
          <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">Sign in to message people</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Private Vaani conversations are available after sign in.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050713] dark:text-white">
      <SocialNav />
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 lg:px-8 lg:py-6">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}

        <div className="grid min-h-[680px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1220] lg:h-[calc(100dvh-170px)] lg:min-h-[620px] lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)]">
          <aside className={`${activeConversation ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-r border-slate-200 dark:border-white/10`}>
            <div className="border-b border-slate-200 p-5 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Private chat</p>
                  <h1 className="mt-1 text-2xl font-black">Messages</h1>
                </div>
                {totalUnread > 0 && <span className="rounded-full bg-teal-700 px-2.5 py-1 text-xs font-black text-white">{totalUnread}</span>}
              </div>
              <Link to="/connect" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-teal-700 hover:text-teal-800 dark:text-teal-300"><i className="fa-solid fa-user-plus" /> Start a new conversation</Link>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {loadingList && <div className="p-6 text-center text-sm font-bold text-slate-500">Loading conversations...</div>}
              {!loadingList && conversations.length === 0 && (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.05]"><i className="fa-regular fa-message" /></div>
                  <p className="mt-4 text-sm font-black">No messages yet</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">Find a learner in Connect and send the first message.</p>
                </div>
              )}

              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${conversation.id === activeId ? 'bg-teal-50 dark:bg-teal-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'}`}
                >
                  <div className="relative shrink-0">
                    <Avatar user={conversation.otherUser} />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#0b1220] ${conversation.otherUser?.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-black">{conversation.otherUser?.displayName || 'Vaani User'}</span>
                      <span className="shrink-0 text-[10px] font-semibold text-slate-400">{formatTime(conversation.lastMessageAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <p className={`min-w-0 flex-1 truncate text-xs ${conversation.unread ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>{conversation.lastMessage || 'Start a conversation'}</p>
                      {conversation.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-black text-white">{conversation.unread}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className={`${activeConversation ? 'flex' : 'hidden lg:flex'} relative min-h-0 flex-col overflow-hidden`}>
            {activeConversation ? (
              <>
                <div className="flex h-18 shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10 sm:px-5">
                  <button type="button" onClick={() => { setActiveConversation(null); setSearchParams({}); }} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden dark:border-white/10 dark:text-slate-300"><i className="fa-solid fa-arrow-left text-xs" /></button>
                  <Avatar user={activeConversation.otherUser} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${encodeURIComponent(activeConversation.otherUser?.uid || '')}`} className="truncate text-sm font-black hover:text-teal-700 dark:hover:text-teal-300">{activeConversation.otherUser?.displayName || 'Vaani User'}</Link>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{typingUid ? 'Typing...' : formatLastActive(activeConversation.otherUser?.lastActive, activeConversation.otherUser?.isOnline)}</p>
                  </div>
                  <Link to={`/profile/${encodeURIComponent(activeConversation.otherUser?.uid || '')}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-700 dark:border-white/10 dark:text-slate-300"><i className="fa-regular fa-user text-xs" /></Link>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-4 py-5 dark:bg-[#070b13] sm:px-6">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500"><i className="fa-solid fa-spinner fa-spin mr-2" /> Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"><i className="fa-regular fa-comments" /></div>
                      <h2 className="mt-4 text-lg font-black">Say hello</h2>
                      <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">Start a private conversation. Be respectful and keep language practice friendly.</p>
                    </div>
                  ) : (
                    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
                      {messages.map((message) => {
                        const mine = message.senderUid === user.uid;
                        return (
                          <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`min-w-[92px] max-w-[82%] rounded-[1.15rem] px-3.5 py-2.5 sm:max-w-[72%] ${mine ? 'rounded-br-md bg-teal-700' : 'rounded-bl-md border border-slate-200 bg-white dark:border-white/10 dark:bg-[#101626]'}`}>
                              <p className={`whitespace-pre-wrap break-words text-sm font-medium leading-5 ${mine ? '!text-white' : 'text-slate-800 dark:text-slate-100'}`}>{message.text}</p>
                              <p className={`mt-1.5 text-right text-[10px] font-bold ${mine ? '!text-teal-50/90' : 'text-slate-400'}`}>{formatTime(message.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                <form onSubmit={sendMessage} className="sticky bottom-0 z-30 shrink-0 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/95 sm:p-4">
                  <div className="mx-auto flex max-w-3xl items-end gap-2">
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
                    <button type="submit" disabled={!draft.trim() || sending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"><i className={`fa-solid ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-xs`} /></button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-teal-50 text-xl text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"><i className="fa-regular fa-comments" /></div>
                <h2 className="mt-5 text-xl font-black">Your private conversations</h2>
                <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">Choose a conversation or find someone new from the Connect tab.</p>
                <Link to="/connect" className="mt-5 rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white">Find people</Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default MessagesPage;