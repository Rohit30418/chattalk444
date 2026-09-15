import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AppWrapper';
import api from '../../services/api';
import socket from '../../services/socket';

const MAX_NOTIFICATIONS = 50;
const NOTIFICATION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const actorCache = new Map();

const historyKey = (uid) => `vaani-inapp-notifications:${uid}`;
const snapshotKey = (uid) => `vaani-inapp-social-snapshot:${uid}`;

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
};

const notificationIdentity = (item = {}) => {
  const actorUid = String(item.actorUid || '');

  if (item.type === 'follow' && actorUid) return `follow:${actorUid}`;
  if (item.type === 'connection-accepted' && actorUid) return `connection-accepted:${actorUid}`;
  if (item.type === 'connection-request' && actorUid) return `connection-request:${actorUid}`;

  return String(item.id || '');
};

const compactNotifications = (items, now = Date.now()) => {
  const cutoff = now - NOTIFICATION_RETENTION_MS;
  const seen = new Set();

  return (Array.isArray(items) ? items : [])
    .filter((item) => {
      const createdAt = new Date(item?.createdAt).getTime();
      return Number.isFinite(createdAt) && createdAt >= cutoff;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .reduce((result, item) => {
      const identity = notificationIdentity(item);
      if (!identity || seen.has(identity)) return result;

      seen.add(identity);
      result.push({ ...item, id: identity });
      return result;
    }, [])
    .slice(0, MAX_NOTIFICATIONS);
};

const getActor = async (uid) => {
  if (!uid) return null;
  if (actorCache.has(uid)) return actorCache.get(uid);

  try {
    const { data } = await api.get(`/api/users/${encodeURIComponent(uid)}`);
    actorCache.set(uid, data);
    return data;
  } catch {
    return null;
  }
};

const timeAgo = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 45) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
};

const visualForType = (type) => {
  if (type === 'message') {
    return {
      icon: 'fa-comment-dots',
      tone: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
    };
  }
  if (type === 'follow') {
    return {
      icon: 'fa-user-plus',
      tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
    };
  }
  if (type === 'connection-request') {
    return {
      icon: 'fa-user-group',
      tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    };
  }
  if (type === 'connection-accepted') {
    return {
      icon: 'fa-handshake',
      tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    };
  }

  return {
    icon: 'fa-bell',
    tone: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  };
};

const InAppNotifications = () => {
  const { user } = useAuth();
  const [target, setTarget] = useState(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const panelRef = useRef(null);

  const uid = user?.uid || '';

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => count + (item.read ? 0 : 1), 0),
    [notifications]
  );

  const save = useCallback((next) => {
    if (!uid) return;
    const compacted = compactNotifications(next);
    localStorage.setItem(historyKey(uid), JSON.stringify(compacted));
  }, [uid]);

  const upsertNotification = useCallback((item, { announce = false } = {}) => {
    if (!uid || !item?.id) return;

    const normalized = {
      id: String(item.id),
      type: item.type || 'general',
      title: item.title || 'Vaani update',
      body: item.body || '',
      url: item.url || '/',
      actorUid: item.actorUid || '',
      createdAt: item.createdAt || new Date().toISOString(),
      read: item.read === true,
    };

    normalized.id = notificationIdentity(normalized) || normalized.id;

    let isNew = false;

    setNotifications((current) => {
      const active = compactNotifications(current);
      const index = active.findIndex((entry) => entry.id === normalized.id);
      let next;

      if (index >= 0) {
        const existing = active[index];
        next = [...active];
        next[index] = {
          ...existing,
          ...normalized,
          createdAt: item.createdAt || existing.createdAt,
          read: item.read === undefined ? existing.read : normalized.read,
        };
      } else {
        isNew = true;
        next = [normalized, ...active];
      }

      next = compactNotifications(next);
      save(next);
      return next;
    });

    if (announce && isNew && document.visibilityState === 'visible') {
      toast.info(normalized.body ? `${normalized.title}: ${normalized.body}` : normalized.title, {
        autoClose: 3500,
      });
    }
  }, [save, uid]);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setOpen(false);
      return;
    }

    const stored = safeParse(localStorage.getItem(historyKey(uid)), []);
    const compacted = compactNotifications(stored);
    setNotifications(compacted);
    localStorage.setItem(historyKey(uid), JSON.stringify(compacted));
  }, [uid]);

  useEffect(() => {
    if (!uid) return undefined;

    const pruneExpired = () => {
      setNotifications((current) => {
        const next = compactNotifications(current);
        save(next);
        return next;
      });
    };

    const timer = window.setInterval(pruneExpired, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [save, uid]);

  useEffect(() => {
    const findTarget = () => {
      const themeButton = document.querySelector('header button[aria-label^="Switch to"]');
      const nextTarget = themeButton?.parentElement || null;
      setTarget((current) => (current === nextTarget ? current : nextTarget));
    };

    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!uid) return undefined;

    const onDirectMessage = async (message = {}) => {
      if (!message.senderUid || message.senderUid === uid) return;

      const activeConversation = new URLSearchParams(window.location.search).get('conversation');
      if (window.location.pathname === '/messages' && activeConversation === String(message.conversationId || '')) {
        return;
      }

      const actor = await getActor(message.senderUid);
      const name = actor?.displayName || 'Someone';

      upsertNotification({
        id: `message:${message.id || `${message.conversationId}:${message.createdAt || Date.now()}`}`,
        type: 'message',
        title: `${name} sent you a message`,
        body: String(message.text || 'New message').slice(0, 120),
        actorUid: message.senderUid,
        url: message.conversationId
          ? `/messages?conversation=${encodeURIComponent(message.conversationId)}`
          : '/messages',
        createdAt: message.createdAt || new Date().toISOString(),
      }, { announce: true });
    };

    const onConnectionRequest = async ({ fromUid } = {}) => {
      if (!fromUid || fromUid === uid) return;
      const actor = await getActor(fromUid);
      const name = actor?.displayName || 'Someone';

      upsertNotification({
        id: `connection-request:${fromUid}`,
        type: 'connection-request',
        title: 'New connection request',
        body: `${name} wants to connect with you.`,
        actorUid: fromUid,
        url: `/profile/${encodeURIComponent(fromUid)}`,
      }, { announce: true });
    };

    const onConnectionUpdated = async ({ uid: otherUid, status } = {}) => {
      if (!otherUid || otherUid === uid || status !== 'friends') return;
      const actor = await getActor(otherUid);
      const name = actor?.displayName || 'Your connection';

      upsertNotification({
        id: `connection-accepted:${otherUid}`,
        type: 'connection-accepted',
        title: 'Connection accepted',
        body: `You and ${name} are now connected.`,
        actorUid: otherUid,
        url: `/profile/${encodeURIComponent(otherUid)}`,
      }, { announce: true });
    };

    const onFollowUpdated = async ({ uid: followerUid, following } = {}) => {
      if (!followerUid || followerUid === uid || !following) return;
      const actor = await getActor(followerUid);
      const name = actor?.displayName || 'Someone';

      upsertNotification({
        id: `follow:${followerUid}`,
        type: 'follow',
        title: 'New follower',
        body: `${name} started following you.`,
        actorUid: followerUid,
        url: `/profile/${encodeURIComponent(followerUid)}`,
      }, { announce: true });
    };

    socket.on('social-message', onDirectMessage);
    socket.on('social-connection-request', onConnectionRequest);
    socket.on('social-connection-updated', onConnectionUpdated);
    socket.on('social-follow-updated', onFollowUpdated);

    return () => {
      socket.off('social-message', onDirectMessage);
      socket.off('social-connection-request', onConnectionRequest);
      socket.off('social-connection-updated', onConnectionUpdated);
      socket.off('social-follow-updated', onFollowUpdated);
    };
  }, [uid, upsertNotification]);

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;

    const recoverMissedActivity = async () => {
      const previousSnapshot = safeParse(localStorage.getItem(snapshotKey(uid)), null);

      const [conversationsResult, requestsResult, followersResult, friendsResult] = await Promise.allSettled([
        api.get('/api/social/conversations'),
        api.get(`/api/social/collections/${encodeURIComponent(uid)}/requests`),
        api.get(`/api/social/collections/${encodeURIComponent(uid)}/followers`),
        api.get(`/api/social/collections/${encodeURIComponent(uid)}/friends`),
      ]);

      if (cancelled) return;

      if (conversationsResult.status === 'fulfilled') {
        const conversations = conversationsResult.value?.data?.conversations || [];
        conversations.forEach((conversation) => {
          const unread = Number(conversation?.unread || 0);
          if (unread <= 0) return;
          const name = conversation?.otherUser?.displayName || 'Someone';

          upsertNotification({
            id: `unread-conversation:${conversation.id}`,
            type: 'message',
            title: `${name} sent you messages`,
            body: `${unread} unread ${unread === 1 ? 'message' : 'messages'}`,
            actorUid: conversation?.otherUser?.uid || '',
            url: `/messages?conversation=${encodeURIComponent(conversation.id)}`,
            createdAt: conversation.lastMessageAt || new Date().toISOString(),
          });
        });
      }

      if (requestsResult.status === 'fulfilled') {
        const requests = requestsResult.value?.data?.users || [];
        requests.forEach((person) => {
          if (!person?.uid) return;
          upsertNotification({
            id: `connection-request:${person.uid}`,
            type: 'connection-request',
            title: 'Connection request',
            body: `${person.displayName || 'Someone'} is waiting for your response.`,
            actorUid: person.uid,
            url: `/profile/${encodeURIComponent(person.uid)}`,
          });
        });
      }

      const followers = followersResult.status === 'fulfilled'
        ? followersResult.value?.data?.users || []
        : [];
      const friends = friendsResult.status === 'fulfilled'
        ? friendsResult.value?.data?.users || []
        : [];

      if (previousSnapshot) {
        const previousFollowers = new Set(previousSnapshot.followers || []);
        const previousFriends = new Set(previousSnapshot.friends || []);

        followers.forEach((person) => {
          if (!person?.uid || previousFollowers.has(person.uid)) return;
          upsertNotification({
            id: `follow:${person.uid}`,
            type: 'follow',
            title: 'New follower',
            body: `${person.displayName || 'Someone'} started following you.`,
            actorUid: person.uid,
            url: `/profile/${encodeURIComponent(person.uid)}`,
          });
        });

        friends.forEach((person) => {
          if (!person?.uid || previousFriends.has(person.uid)) return;
          upsertNotification({
            id: `connection-accepted:${person.uid}`,
            type: 'connection-accepted',
            title: 'New connection',
            body: `You and ${person.displayName || 'someone'} are now connected.`,
            actorUid: person.uid,
            url: `/profile/${encodeURIComponent(person.uid)}`,
          });
        });
      }

      localStorage.setItem(snapshotKey(uid), JSON.stringify({
        followers: followers.map((person) => person?.uid).filter(Boolean),
        friends: friends.map((person) => person?.uid).filter(Boolean),
        syncedAt: new Date().toISOString(),
      }));
    };

    recoverMissedActivity().catch((error) => {
      console.warn('[Notifications] Could not recover missed activity:', error?.message || error);
    });

    const onFocus = () => recoverMissedActivity().catch(() => {});
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [uid, upsertNotification]);

  const updateNotifications = useCallback((updater) => {
    setNotifications((current) => {
      const next = compactNotifications(updater(compactNotifications(current)));
      save(next);
      return next;
    });
  }, [save]);

  const markRead = useCallback((id) => {
    updateNotifications((current) => current.map((item) => (
      item.id === id ? { ...item, read: true } : item
    )));
  }, [updateNotifications]);

  const markAllRead = useCallback(() => {
    updateNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, [updateNotifications]);

  const openNotification = useCallback((item) => {
    markRead(item.id);
    setOpen(false);
    if (item.url) window.location.assign(item.url);
  }, [markRead]);

  const togglePanel = () => {
    if (!open && target) {
      const profileButton = target.querySelector('button[aria-expanded="true"]:not([aria-label])');
      profileButton?.click();
    }
    setOpen((value) => !value);
  };

  if (!uid || !target) return null;

  const bell = (
    <div ref={panelRef} className="relative order-[-1]">
      <style>{`
        @media (max-width: 639px) {
          header button[aria-label^="Switch to"] { display: none !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={togglePanel}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-primary-700)] sm:h-11 sm:w-11"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        title="Notifications"
      >
        <i className="fa-regular fa-bell text-[15px]" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-[var(--color-surface)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-[76px] z-[240] max-h-[calc(100dvh-92px)] overflow-hidden rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[390px] sm:max-h-[min(620px,75vh)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[9px] font-black text-[var(--color-primary-700)]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] font-semibold text-[var(--color-soft)]">
                Messages, followers and connections
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-lg px-2 py-1.5 text-[10px] font-black text-[var(--color-primary-700)] hover:bg-[var(--color-primary-soft)]"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[calc(100dvh-170px)] overflow-y-auto sm:max-h-[520px]">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-soft)]">
                  <i className="fa-regular fa-bell text-lg" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-black">All caught up</p>
                <p className="mt-1 text-xs font-medium text-[var(--color-soft)]">
                  New messages and social activity will appear here.
                </p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.slice(0, 30).map((item) => {
                  const visual = visualForType(item.type);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openNotification(item)}
                      className={`group relative flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[var(--color-surface-2)] ${
                        item.read ? '' : 'bg-[var(--color-primary-soft)]/55'
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.tone}`}>
                        <i className={`fa-solid ${visual.icon} text-xs`} aria-hidden="true" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className={`block text-xs leading-5 ${item.read ? 'font-bold' : 'font-black'}`}>
                            {item.title}
                          </span>
                          <span className="shrink-0 text-[9px] font-semibold text-[var(--color-soft)]">
                            {timeAgo(item.createdAt)}
                          </span>
                        </span>
                        {item.body && (
                          <span className="mt-0.5 block line-clamp-2 text-[11px] font-medium leading-4 text-[var(--color-muted)]">
                            {item.body}
                          </span>
                        )}
                      </span>

                      {!item.read && (
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label="Mark as read"
                          title="Mark as read"
                          onClick={(event) => {
                            event.stopPropagation();
                            markRead(item.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              markRead(item.id);
                            }
                          }}
                          className="mt-4 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(bell, target);
};

export default InAppNotifications;
