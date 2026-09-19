import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AppWrapper';
import api from '../../services/api';
import socket from '../../services/socket';
import {
  bumpAppBadge,
  captureInstallPrompt,
  clearAppBadge,
  hasInstallPrompt,
  isStandalonePwa,
  promptVaaniInstall,
  registerVaaniPwa,
  requestVaaniNotifications,
  showVaaniNotification,
  syncPushSubscription,
} from '../../services/pwa';

const actorCache = new Map();

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

const shouldShowSystemNotification = () => (
  typeof document !== 'undefined'
  && document.visibilityState !== 'visible'
);

const PwaManager = () => {
  const { user } = useAuth();
  const [installable, setInstallable] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    const until = Number(localStorage.getItem('vaani-pwa-prompt-dismissed-until') || 0);
    return Date.now() < until;
  });

  useEffect(() => {
    registerVaaniPwa();

    const onBeforeInstallPrompt = (event) => {
      captureInstallPrompt(event);
      setInstallable(true);
    };
    const onInstallAvailable = () => setInstallable(true);
    const onInstallConsumed = () => setInstallable(false);
    const onInstalled = () => {
      setInstallable(false);
      toast.success('Vaani installed successfully');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('vaani-install-available', onInstallAvailable);
    window.addEventListener('vaani-install-consumed', onInstallConsumed);
    window.addEventListener('appinstalled', onInstalled);

    setInstallable(hasInstallPrompt() && !isStandalonePwa());

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('vaani-install-available', onInstallAvailable);
      window.removeEventListener('vaani-install-consumed', onInstallConsumed);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid || permission !== 'granted') return undefined;

    const syncThisDevice = async () => {
      // Keep registration repair in the background. A temporary API/network
      // failure must not become a permanent global popup on every page.
      await syncPushSubscription().catch(() => null);
    };

    syncThisDevice();

    const onOnline = () => syncThisDevice();
    const onFocus = () => syncThisDevice();
    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
    };
  }, [permission, user?.uid]);

  useEffect(() => {
    const onFocus = () => clearAppBadge();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const notify = useCallback(async (payload) => {
    if (permission !== 'granted' || !shouldShowSystemNotification()) return;
    bumpAppBadge();
    await showVaaniNotification(payload);
  }, [permission]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const onDirectMessage = async (message = {}) => {
      if (!message.senderUid || message.senderUid === user.uid) return;
      const actor = await getActor(message.senderUid);
      const name = actor?.displayName || 'Someone';

      notify({
        title: `${name} sent you a message`,
        body: String(message.text || 'New message').slice(0, 140),
        tag: `dm-${message.conversationId || message.senderUid}`,
        url: message.conversationId
          ? `/messages?conversation=${encodeURIComponent(message.conversationId)}`
          : '/messages',
      });
    };

    const onConnectionRequest = async ({ fromUid } = {}) => {
      if (!fromUid || fromUid === user.uid) return;
      const actor = await getActor(fromUid);
      const name = actor?.displayName || 'Someone';

      notify({
        title: 'New connection request',
        body: `${name} wants to connect with you on Vaani.`,
        tag: `connect-${fromUid}`,
        url: `/profile/${encodeURIComponent(fromUid)}`,
      });
    };

    const onConnectionUpdated = async ({ uid, status } = {}) => {
      if (!uid || uid === user.uid || status !== 'friends') return;
      const actor = await getActor(uid);
      const name = actor?.displayName || 'Your connection';

      notify({
        title: 'Connection accepted',
        body: `You and ${name} are now connected on Vaani.`,
        tag: `friends-${uid}`,
        url: `/profile/${encodeURIComponent(uid)}`,
      });
    };

    const onFollowUpdated = async ({ uid, following } = {}) => {
      if (!uid || uid === user.uid || !following) return;
      const actor = await getActor(uid);
      const name = actor?.displayName || 'Someone';

      notify({
        title: 'New follower',
        body: `${name} started following you on Vaani.`,
        tag: `follow-${uid}`,
        url: `/profile/${encodeURIComponent(uid)}`,
      });
    };

    const onRoomMessage = (message = {}) => {
      const senderUid = message.senderId || message.userid;
      if (!senderUid || senderUid === user.uid || message.role === 'bot') return;

      const name = message.displayName || message.senderName || 'Someone';
      notify({
        title: `${name} · Room chat`,
        body: message.type === 'image'
          ? 'Shared an image'
          : String(message.text || 'New room message').slice(0, 140),
        tag: `room-${message.roomId || 'chat'}`,
        url: message.roomId ? `/room/${encodeURIComponent(message.roomId)}` : '/rooms',
      });
    };

    socket.on('social-message', onDirectMessage);
    socket.on('social-connection-request', onConnectionRequest);
    socket.on('social-connection-updated', onConnectionUpdated);
    socket.on('social-follow-updated', onFollowUpdated);
    socket.on('receive-message', onRoomMessage);

    return () => {
      socket.off('social-message', onDirectMessage);
      socket.off('social-connection-request', onConnectionRequest);
      socket.off('social-connection-updated', onConnectionUpdated);
      socket.off('social-follow-updated', onFollowUpdated);
      socket.off('receive-message', onRoomMessage);
    };
  }, [notify, user?.uid]);

  const standalone = isStandalonePwa();
  const showInstall = installable && !standalone;
  const showNotifications = Boolean(user?.uid && permission === 'default');
  const visible = useMemo(
    () => !standalone && !dismissed && (showInstall || showNotifications),
    [dismissed, showInstall, showNotifications, standalone]
  );

  const installApp = async () => {
    setBusy(true);
    try {
      const result = await promptVaaniInstall();
      if (result?.outcome === 'accepted') {
        toast.success('Vaani is being installed');
      }
    } finally {
      setBusy(false);
    }
  };

  const enableNotifications = async () => {
    setBusy(true);
    try {
      const result = await requestVaaniNotifications();
      setPermission(result.permission);

      if (result.permission === 'granted') {
        if (result.subscribed) {
          toast.success('This device is registered for Vaani notifications');
        } else {
          toast.error(
            result?.message ||
            (result?.reason === 'server-not-configured'
              ? 'Push notifications are not configured on the Vaani server yet.'
              : 'Could not sync this device for push notifications.')
          );
        }
      } else if (result.permission === 'denied') {
        toast.info('Notifications are blocked in your browser settings');
      }
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    const until = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('vaani-pwa-prompt-dismissed-until', String(until));
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[220] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-white/10 bg-[#071b2c]/95 p-3 text-white shadow-2xl backdrop-blur-xl sm:left-auto sm:right-4 sm:w-auto sm:min-w-[360px] sm:translate-x-0">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg">
          <img src="/vaani-icon.svg" alt="" aria-hidden="true" className="h-10 w-10" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">
            Make Vaani feel like an app
          </p>
          <p className="mt-0.5 text-[11px] font-medium leading-4 text-slate-400">
            Install it and turn on alerts for messages, follows, connections and room chat.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {showInstall && (
              <button
                type="button"
                onClick={installApp}
                disabled={busy}
                className="rounded-xl bg-white px-3 py-2 text-[11px] font-black text-[#071b2c] disabled:opacity-60"
              >
                <i className="fa-solid fa-download mr-1.5" aria-hidden="true" />
                Install Vaani
              </button>
            )}

            {showNotifications && (
              <button
                type="button"
                onClick={enableNotifications}
                disabled={busy}
                className="rounded-xl bg-teal-600 px-3 py-2 text-[11px] font-black text-white disabled:opacity-60"
              >
                <i className="fa-solid fa-bell mr-1.5" aria-hidden="true" />
                Enable notifications
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss app prompt"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default PwaManager;
