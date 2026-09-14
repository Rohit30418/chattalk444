import { useEffect, useState } from 'react';
import api from '../../services/api';
import { normalizeMessageDecorationId } from '../../utils/memberAssets';
import '../../styles/memberEffects.css';

const profileCache = new Map();
const profileFetchedAt = new Map();
const inflightProfiles = new Map();
const PROFILE_FRESH_MS = 10000;

const PREVIEW_PALETTES = {
  aurora: ['#0f766e', '#22d3ee', '#8b5cf6'],
  'neon-wave': ['#06b6d4', '#6366f1', '#d946ef'],
  'royal-gold': ['#a16207', '#f59e0b', '#fde68a'],
  fire: ['#b91c1c', '#f97316', '#facc15'],
  galaxy: ['#1d4ed8', '#7c3aed', '#ec4899'],
  'cyber-grid': ['#0f766e', '#14b8a6', '#22d3ee'],
};

const loadProfile = async (uid, { force = false } = {}) => {
  if (!uid) return null;

  if (inflightProfiles.has(uid)) {
    return inflightProfiles.get(uid);
  }

  const cached = profileCache.get(uid);
  const fetchedAt = Number(profileFetchedAt.get(uid) || 0);
  const isFresh = cached && Date.now() - fetchedAt < PROFILE_FRESH_MS;

  if (cached && (!force || isFresh)) {
    return cached;
  }

  inflightProfiles.set(
    uid,
    api.get(`/api/users/${encodeURIComponent(uid)}`)
      .then(({ data }) => {
        profileCache.set(uid, data);
        profileFetchedAt.set(uid, Date.now());
        return data;
      })
      .catch(() => cached || null)
      .finally(() => inflightProfiles.delete(uid))
  );

  return inflightProfiles.get(uid);
};

const MemberNameplate = ({
  user,
  uid,
  name,
  className = '',
  compact = false,
  resolveProfile = true,
}) => {
  const finalUid = uid || user?.uid || user?.id || user?.userId || '';
  const [resolvedUser, setResolvedUser] = useState(() => {
    if (!resolveProfile) return user || null;
    return (finalUid && profileCache.get(finalUid)) || user || null;
  });

  useEffect(() => {
    if (!resolveProfile) {
      setResolvedUser(user || null);
      return;
    }

    const cached = finalUid ? profileCache.get(finalUid) : null;
    setResolvedUser(cached ? { ...(user || {}), ...cached } : (user || null));
  }, [finalUid, resolveProfile, user]);

  useEffect(() => {
    if (!resolveProfile || !finalUid) return undefined;

    let cancelled = false;

    loadProfile(finalUid, { force: true }).then((profile) => {
      if (!cancelled && profile) {
        setResolvedUser((current) => ({ ...(current || {}), ...profile }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [finalUid, resolveProfile]);

  useEffect(() => {
    if (!resolveProfile) return undefined;

    const applyUpdatedUser = (updatedUser) => {
      if (!updatedUser?.uid || updatedUser.uid !== finalUid) return;

      profileCache.set(updatedUser.uid, updatedUser);
      profileFetchedAt.set(updatedUser.uid, Date.now());
      setResolvedUser((current) => ({ ...(current || {}), ...updatedUser }));
    };

    const onLocalStyleUpdated = (event) => {
      applyUpdatedUser(event?.detail?.user);
    };

    window.addEventListener('vaani-member-style-updated', onLocalStyleUpdated);

    return () => {
      window.removeEventListener('vaani-member-style-updated', onLocalStyleUpdated);
    };
  }, [finalUid, resolveProfile]);

  const finalUser = resolveProfile
    ? { ...(user || {}), ...(resolvedUser || {}) }
    : (user || {});
  const finalName = name || finalUser.displayName || finalUser.name || 'Vaani User';

  if (finalUser.isMember !== true) {
    return <span className={className}>{finalName}</span>;
  }

  const theme = normalizeMessageDecorationId(finalUser.messageDecorationId);
  const previewPalette = !resolveProfile ? PREVIEW_PALETTES[theme] : null;
  const previewStyle = previewPalette
    ? {
        '--np-a': previewPalette[0],
        '--np-b': previewPalette[1],
        '--np-c': previewPalette[2],
      }
    : undefined;

  return (
    <span
      className={`vaani-nameplate vaani-nameplate-${theme} ${compact ? 'vaani-nameplate-compact' : ''} ${className}`}
      style={previewStyle}
      title="Vaani member"
      data-nameplate-theme={theme}
    >
      <span className="vaani-nameplate-spark" aria-hidden="true">✦</span>
      <span className="relative z-[2] min-w-0 truncate">{finalName}</span>
    </span>
  );
};

export default MemberNameplate;
