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
  if (target.querySelector(':scope > .vaani-runtime-decoration')) return;

  const decoration = getProfileDecoration(member.profileDecorationId, member.profileAnimationId);
  if (!decoration?.src) return;

  target.style.position = 'relative';
  target.style.overflow = 'visible';

  const image = document.createElement('img');
  image.src = decoration.src;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
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
  const parent = image.parentElement;
  if (!parent || parent.querySelector(':scope > .vaani-runtime-decoration')) return;

  parent.style.position = 'relative';
  parent.style.overflow = 'visible';
  addDecoration(parent, member);
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
        const { data } = await api.get(`/api/users/${encodeURIComponent(uid)}`);
        cacheRef.current.set(uid, data);
        return data;
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

    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleScan();

    window.addEventListener('popstate', scheduleScan);
    window.addEventListener('vaani-member-style-updated', scheduleScan);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('popstate', scheduleScan);
      window.removeEventListener('vaani-member-style-updated', scheduleScan);
    };
  }, [user?.uid, user?.profileDecorationId, user?.profileAnimationId]);

  if (!bannerTarget || !profileMember) return null;

  return createPortal(
    <div className="vaani-profile-banner-slot pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <MemberBannerVideo
        bannerId={profileMember.profileBannerId}
        eager
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/20" />
    </div>,
    bannerTarget
  );
};

export default GlobalMemberVisuals;
