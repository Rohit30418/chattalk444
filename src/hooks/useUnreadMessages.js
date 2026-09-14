import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { useAuth } from '../components/auth/AppWrapper';

const countUnread = (items = []) => (
  items.reduce((sum, item) => sum + Number(item?.unread || 0), 0)
);

const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    try {
      const { data } = await api.get('/api/social/conversations');
      const conversations = Array.isArray(data?.conversations) ? data.conversations : [];
      setUnreadCount(countUnread(conversations));
    } catch {
      // Keep the last known count if the network is temporarily unavailable.
    }
  }, [user?.uid]);

  useEffect(() => {
    refreshUnread();

    if (!user?.uid) return undefined;

    let refreshTimer = null;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(refreshUnread, 80);
    };

    socket.on('social-message', scheduleRefresh);
    window.addEventListener('vaani-chat-unread-changed', scheduleRefresh);
    window.addEventListener('focus', scheduleRefresh);

    return () => {
      window.clearTimeout(refreshTimer);
      socket.off('social-message', scheduleRefresh);
      window.removeEventListener('vaani-chat-unread-changed', scheduleRefresh);
      window.removeEventListener('focus', scheduleRefresh);
    };
  }, [refreshUnread, user?.uid]);

  return unreadCount;
};

export default useUnreadMessages;
