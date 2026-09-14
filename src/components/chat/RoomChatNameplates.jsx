import { useEffect } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import { normalizeMessageDecorationId } from '../../utils/memberAssets';
import '../../styles/memberEffects.css';

const profileCache = new Map();
const profileRequests = new Map();

const fetchProfile = async (uid) => {
  if (!uid) return null;
  if (profileCache.has(uid)) return profileCache.get(uid);

  if (!profileRequests.has(uid)) {
    profileRequests.set(
      uid,
      api.get(`/api/users/${encodeURIComponent(uid)}`)
        .then(({ data }) => {
          profileCache.set(uid, data);
          return data;
        })
        .catch(() => null)
        .finally(() => profileRequests.delete(uid))
    );
  }

  return profileRequests.get(uid);
};

const isSenderLabel = (node) => {
  if (!(node instanceof HTMLElement)) return false;
  const classes = String(node.className || '');
  return classes.includes('mb-1')
    && classes.includes('ml-1')
    && classes.includes('font-black')
    && classes.includes('text-slate-400');
};

const applyNameplate = (node, member) => {
  if (!node || member?.isMember !== true) return;

  const theme = normalizeMessageDecorationId(member.messageDecorationId);

  [...node.classList]
    .filter((className) => className.startsWith('vaani-nameplate-') && className !== 'vaani-nameplate-compact')
    .forEach((className) => node.classList.remove(className));

  node.classList.add('vaani-nameplate', `vaani-nameplate-${theme}`, 'vaani-nameplate-compact');

  if (!node.querySelector(':scope > .vaani-nameplate-spark')) {
    const spark = document.createElement('span');
    spark.className = 'vaani-nameplate-spark';
    spark.setAttribute('aria-hidden', 'true');
    spark.textContent = '✦';
    node.prepend(spark);
  }
};

const RoomChatNameplates = ({ rootRef }) => {
  useEffect(() => {
    const roomId = window.location.pathname.match(/^\/room\/([^/?#]+)/i)?.[1] || '';
    if (!roomId) return undefined;

    let stopped = false;
    let scanTimer = 0;
    const memberByName = new Map();

    const scan = () => {
      if (stopped) return;
      const root = rootRef?.current;
      if (!root) return;

      root.querySelectorAll('span').forEach((node) => {
        if (!isSenderLabel(node)) return;

        const rawName = [...node.childNodes]
          .filter((child) => child.nodeType === Node.TEXT_NODE)
          .map((child) => child.textContent || '')
          .join('')
          .trim() || node.textContent?.replace('✦', '').trim();

        const member = memberByName.get(rawName);
        if (member) applyNameplate(node, member);
      });
    };

    const scheduleScan = () => {
      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scan, 40);
    };

    const rememberMessageSender = async (message) => {
      if (!message || message.role === 'bot') return;

      const uid = message.senderId || message.userid;
      const name = message.displayName || message.senderName || '';
      if (!uid || !name) return;

      const profile = await fetchProfile(uid);
      if (stopped || profile?.isMember !== true) return;

      memberByName.set(name, profile);
      scheduleScan();
    };

    const loadHistoryMembers = async () => {
      try {
        const { data } = await api.get(`/api/chat/${encodeURIComponent(roomId)}`);
        const messages = Array.isArray(data) ? data : [];
        await Promise.all(messages.map(rememberMessageSender));
      } catch {
        // Chat remains fully usable when optional nameplate enrichment fails.
      }
    };

    const onMessage = (message) => {
      if (message?.roomId && message.roomId !== roomId) return;
      rememberMessageSender(message);
    };

    const onLocalStyleUpdated = (event) => {
      const updatedUser = event?.detail?.user;
      if (!updatedUser?.uid) return;
      profileCache.set(updatedUser.uid, updatedUser);
      if (updatedUser.isMember === true && updatedUser.displayName) {
        memberByName.set(updatedUser.displayName, updatedUser);
      }
      scheduleScan();
    };

    const observer = new MutationObserver(scheduleScan);
    if (rootRef?.current) {
      observer.observe(rootRef.current, { childList: true, subtree: true });
    }

    socket.on('receive-message', onMessage);
    window.addEventListener('vaani-member-style-updated', onLocalStyleUpdated);
    loadHistoryMembers();
    scheduleScan();

    return () => {
      stopped = true;
      window.clearTimeout(scanTimer);
      observer.disconnect();
      socket.off('receive-message', onMessage);
      window.removeEventListener('vaani-member-style-updated', onLocalStyleUpdated);
    };
  }, [rootRef]);

  return null;
};

export default RoomChatNameplates;
