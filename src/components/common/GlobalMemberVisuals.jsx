import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../auth/AppWrapper';
import { getProfileDecoration } from '../../utils/memberAssets';
import MemberBannerVideo from './MemberBannerVideo';

const profilePathUid = () => {
  const match = window.location.pathname.match(/^\/(?:profile|MyProfile)\/([^/]+)/i);
  return match ? decodeURIComponent(match[1]) : '';
};

const profileUidFromElement = (element, fallbackUid = '') => {
  if (!element) return fallbackUid;
  if (element.closest('header')) return fallbackUid;

  const link = element.closest('article')?.querySelector('a[href*="/profile/"]')
    || element.closest('a[href*="/profile/"]');
  const href = link?.getAttribute('href') || '';
  const match = href.match(/\/profile\/([^/?#]+)/i);
  if (match) return decodeURIComponent(match[1]);

  return profilePathUid() || fallbackUid;
};

const addDecoration = (target, member) => {
  if (!target || member?.isMember !== true) return;

  const decoration = getProfileDecoration(member.profileDecorationId, member.profileAnimationId);
  if (!decoration?.src) return;

  const existing = target.querySelector(':scope > .vaani-runtime-decoration');
  if (existing?.dataset?.vaaniDecorationId === decoration.id) {
    target.classList.add('vaani-has-runtime-decoration');
    return;
  }

  existing?.remove();

  target.style.position = 'relative';
  target.style.overflow = 'visible';
  target.classList.add('vaani-has-runtime-decoration');

  const image = document.createElement('img');
  image.src = decoration.src;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.dataset.vaaniDecorationId = decoration.id;
  image.className = 'vaani-runtime-decoration';
  Object.assign(image.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    pointerEvents: 'none',
    zIndex: '30',
    transform: 'scale(1.12)',
    transformOrigin: 'center',
  });
  target.appendChild(image);
};

const addDecorationAroundImage = (image, member) => {
  if (!image || member?.isMember !== true) return;

  const decoration = getProfileDecoration(member.profileDecorationId, member.profileAnimationId);
  if (!decoration?.src) return;

  const parent = image.parentElement;
  if (!parent) return;

  // MessagesPage sometimes renders the avatar image directly inside the whole
  // chat header. Never use that large parent as the decoration's dimensions.
  // Instead, keep the decoration as a sibling but position it exactly over the
  // avatar's own box. This also works for the small conversation-list avatars.
  parent.style.position = 'relative';
  parent.style.overflow = 'visible';

  if (!parent.classList.contains('vaani-profile-frame')) {
    parent.classList.remove('vaani-has-runtime-decoration');
  }

  const selector = ':scope > .vaani-runtime-decoration[data-vaani-image-overlay="true"]';
  let overlay = parent.querySelector(selector);

  if (overlay && overlay.dataset.vaaniDecorationId !== decoration.id) {
    overlay.remove();
    overlay = null;
  }

  if (!overlay) {
    overlay = document.createElement('img');
    overlay.src = decoration.src;
    overlay.alt = '';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.dataset.vaaniDecorationId = decoration.id;
    overlay.dataset.vaaniImageOverlay = 'true';
    overlay.className = 'vaani-runtime-decoration';
    Object.assign(overlay.style, {
      position: 'absolute',
      objectFit: 'contain',
      pointerEvents: 'none',
      zIndex: '30',
      transform: 'scale(1.22)',
      transformOrigin: 'center',
    });
    parent.appendChild(overlay);
  }

  // Setting the parent to position:relative makes offsetLeft/offsetTop resolve
  // against this exact container, including the wide active-chat header case.
  overlay.style.left = `${image.offsetLeft}px`;
  overlay.style.top = `${image.offsetTop}px`;
  overlay.style.width = `${image.offsetWidth}px`;
  overlay.style.height = `${image.offsetHeight}px`;
};

const clearRuntimeDecorations = () => {
  document.querySelectorAll('.vaani-runtime-decoration').forEach((node) => {
    node.parentElement?.classList.remove('vaani-has-runtime-decoration');
    node.remove();
  });
};

const GlobalMemberVisuals = () => {
  const { user } = useAuth();
  const cacheRef = useRef(new Map());
  const runningRef = useRef(false);
  const [bannerTarget, setBannerTarget] = useState(null);
  const [profileMember, setProfileMember] = useState(null);

  useEffect(() => {
    if (user?.uid) cacheRef.current.set(user.uid, user);
  }, [user]);

  useEffect(() => {
    let stopped = false;
    let timer = 0;

    const getMember = async (uid) => {
      if (!uid) return null;

      const cached = cacheRef.current.get(uid);
      if (cached?.profileDecorationId || cached?.isMember === false) return cached;

      try {
        let member = null;

        if (uid === user?.uid) {
          const { data } = await api.get(`/api/users/${encodeURIComponent(uid)}`);
          member = data || null;
        } else {
          const { data } = await api.get(`/api/social/profile/${encodeURIComponent(uid)}`);
          member = data?.user || null;
        }

        if (member) cacheRef.current.set(uid, member);
        return member || cached || null;
      } catch {
        return cached || null;
      }
    };

    const scan = async () => {
      if (stopped || runningRef.current) return;
      runningRef.current = true;

      try {
        const frames = [...document.querySelectorAll('.vaani-profile-frame')];
        await Promise.all(frames.map(async (frame) => {
          const uid = profileUidFromElement(frame, user?.uid || '');
          const member = await getMember(uid);
          addDecoration(frame, member);
        }));

        const profileUid = profilePathUid();
        if (profileUid) {
          const member = await getMember(profileUid);
          if (!stopped) setProfileMember(member?.isMember === true ? member : null);

          const main = document.querySelector('main');
          const cover = main?.querySelector(':scope > section > div.relative');
          if (cover && member?.isMember === true) {
            const background = cover.firstElementChild;
            if (background && !background.classList.contains('vaani-profile-banner-slot')) {
              background.dataset.vaaniPreviousOpacity = background.style.opacity || '';
              background.style.opacity = '0';
            }

            [...cover.children].forEach((child, index) => {
              if (index === 1) child.style.zIndex = '10';
              if (index >= 2) child.style.zIndex = '20';
            });
            if (!stopped) setBannerTarget(cover);
          } else if (!stopped) {
            setBannerTarget(null);
          }
        } else if (!stopped) {
          setBannerTarget(null);
          setProfileMember(null);
        }

        if (window.location.pathname.startsWith('/messages') && user?.uid) {
          try {
            const { data } = await api.get('/api/social/conversations');
            const conversations = Array.isArray(data?.conversations) ? data.conversations : [];
            await Promise.all(conversations.map(async (conversation) => {
              const other = conversation?.otherUser;
              if (!other?.uid || !other?.photoURL) return;
              const member = other.profileDecorationId ? other : await getMember(other.uid);
              if (member?.isMember !== true) return;
              [...document.querySelectorAll('img')]
                .filter((image) => image.src === other.photoURL || image.getAttribute('src') === other.photoURL)
                .forEach((image) => addDecorationAroundImage(image, member));
            }));
          } catch {
            // Messages still work normally if visual enrichment fails.
          }
        }
      } finally {
        runningRef.current = false;
      }
    };

    const scheduleScan = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(scan, 80);
    };

    const handleStyleUpdated = (event) => {
      const updatedUser = event?.detail?.user;
      if (updatedUser?.uid) {
        cacheRef.current.set(updatedUser.uid, updatedUser);
      } else if (user?.uid) {
        cacheRef.current.delete(user.uid);
      }

      clearRuntimeDecorations();
      scheduleScan();
    };

    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleScan();

    window.addEventListener('popstate', scheduleScan);
    window.addEventListener('vaani-member-style-updated', handleStyleUpdated);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('popstate', scheduleScan);
      window.removeEventListener('vaani-member-style-updated', handleStyleUpdated);
    };
  }, [user?.uid, user?.profileDecorationId, user?.profileAnimationId, user?.profileBannerId]);

  if (!bannerTarget || !profileMember) return null;

  return createPortal(
    <div className="vaani-profile-banner-slot pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <MemberBannerVideo
        bannerId={profileMember.profileBannerId}
        eager
        className="h-full w-full"
      />
      <div className="absolute inset-0 bg-slate-950/10" />
    </div>,
    bannerTarget
  );
};

export default GlobalMemberVisuals;
