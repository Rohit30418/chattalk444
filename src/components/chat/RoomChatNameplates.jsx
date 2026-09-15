import { useEffect } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import { normalizeMessageDecorationId } from '../../utils/memberAssets';
import '../../styles/memberEffects.css';

const profileCache = new Map();
const profileRequests = new Map();

const fetchProfile = async (uid, { force = false } = {}) => {
  if (!uid) return null;

  if (profileRequests.has(uid)) {
    return profileRequests.get(uid);
  }

  if (!force && profileCache.has(uid)) {
    return profileCache.get(uid);
  }

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

const isOwnMessageRow = (node) => (
  node instanceof HTMLElement
  && node.tagName === 'DIV'
  && node.classList.contains('w-full')
  && node.classList.contains('pb-4')
  && node.classList.contains('justify-end')
);

const applyNameplate = (node, member) => {
  if (!node || member?.isMember !== true) return;

  const theme = normalizeMessageDecorationId(member.messageDecorationId);

  [...node.classList]
    .filter((className) => className.startsWith('vaani-nameplate-') && className !== 'vaani-nameplate-compact')
    .forEach((className) => node.classList.remove(className));

  node.classList.add('vaani-nameplate', `vaani-nameplate-${theme}`, 'vaani-nameplate-compact');

  // Chat markup already carries slate text utilities. Force premium nameplates
  // to keep strong contrast on every animated/glowing background and in dark mode.
  node.style.setProperty('color', '#ffffff', 'important');
  node.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
  node.style.setProperty('text-shadow', '0 1px 7px rgba(0,0,0,.55)');

  if (!node.querySelector(':scope > .vaani-nameplate-spark')) {
    const spark = document.createElement('span');
    spark.className = 'vaani-nameplate-spark';
    spark.setAttribute('aria-hidden', 'true');
    spark.textContent = '✦';
    node.prepend(spark);
  }
};

const addOwnMessageNameplates = (root, member) => {
  if (!root || member?.isMember !== true) return;

  const displayName = member.displayName || member.name || 'You';

  root.querySelectorAll('div').forEach((row) => {
    if (!isOwnMessageRow(row)) return;

    const messageColumn = [...row.querySelectorAll('div')].find((node) => (
      node.classList.contains('relative')
      && node.classList.contains('flex-col')
      && node.classList.contains('items-end')
    ));

    if (!messageColumn) return;

    let label = messageColumn.querySelector(':scope > [data-vaani-own-nameplate="true"]');

    if (!label) {
      label = document.createElement('span');
      label.dataset.vaaniOwnNameplate = 'true';
      label.className = 'mb-1 mr-1 text-[11px] font-black text-slate-400';
      label.append(document.createTextNode(displayName));
      messageColumn.prepend(label);
    }

    applyNameplate(label, member);
  });
};

const RoomChatNameplates = ({ rootRef, currentUserId }) => {
  useEffect(() => {
    const roomId = window.location.pathname.match(/^\/room\/([^/?#]+)/i)?.[1] || '';
    if (!roomId) return undefined;

    let stopped = false;
    let scanTimer = 0;
    let currentMember = null;
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

      if (currentMember) {
        addOwnMessageNameplates(root, currentMember);
      }
    };

    const scheduleScan = () => {
      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scan, 40);
    };

    const rememberMember = (profile) => {
      if (profile?.isMember !== true) return;
      const name = profile.displayName || profile.name || '';
      if (name) memberByName.set(name, profile);
    };

    const rememberMessageSender = async (message, forceFresh = false) => {
      if (!message || message.role === 'bot') return;

      const uid = message.senderId || message.userid;
      const name = message.displayName || message.senderName || '';
      if (!uid) return;

      const profile = await fetchProfile(uid, { force: forceFresh });
      if (stopped || profile?.isMember !== true) return;

      if (name) memberByName.set(name, profile);
      rememberMember(profile);

      if (uid === currentUserId) {
        currentMember = profile;
      }

      scheduleScan();
    };

    const loadCurrentMember = async () => {
      if (!currentUserId) return;

      // Always refresh the current user when room chat mounts. The module cache
      // survives route changes, so without this a style saved on the profile
      // page can keep showing the previously cached Aurora nameplate.
      const profile = await fetchProfile(currentUserId, { force: true });
      if (stopped || profile?.isMember !== true) return;

      currentMember = profile;
      rememberMember(profile);
      scheduleScan();
    };

    const loadHistoryMembers = async () => {
      try {
        const { data } = await api.get(`/api/chat/${encodeURIComponent(roomId)}`);
        const messages = Array.isArray(data) ? data : [];

        // Refresh each distinct sender from the API on room entry. Concurrent
        // messages from the same sender share profileRequests, so this does not
        // create one request per message.
        await Promise.all(messages.map((message) => rememberMessageSender(message, true)));
      } catch {
        // Chat remains fully usable when optional nameplate enrichment fails.
      }
    };

    const onMessage = (message) => {
      if (message?.roomId && message.roomId !== roomId) return;
      rememberMessageSender(message);
    };

    const onMemberAppearance = (updatedUser) => {
      if (!updatedUser?.uid) return;

      profileCache.set(updatedUser.uid, updatedUser);
      rememberMember(updatedUser);

      if (updatedUser.uid === currentUserId) {
        currentMember = updatedUser.isMember === true ? updatedUser : null;
      }

      scheduleScan();
    };

    const onLocalStyleUpdated = (event) => {
      const updatedUser = event?.detail?.user;
      if (!updatedUser?.uid) return;
      onMemberAppearance(updatedUser);
    };

    const observer = new MutationObserver(scheduleScan);
    if (rootRef?.current) {
      observer.observe(rootRef.current, { childList: true, subtree: true });
    }

    socket.on('receive-message', onMessage);
    socket.on('social-member-appearance', onMemberAppearance);
    window.addEventListener('vaani-member-style-updated', onLocalStyleUpdated);

    loadCurrentMember();
    loadHistoryMembers();
    scheduleScan();

    return () => {
      stopped = true;
      window.clearTimeout(scanTimer);
      observer.disconnect();
      socket.off('receive-message', onMessage);
      socket.off('social-member-appearance', onMemberAppearance);
      window.removeEventListener('vaani-member-style-updated', onLocalStyleUpdated);
    };
  }, [currentUserId, rootRef]);

  return null;
};

export default RoomChatNameplates;
