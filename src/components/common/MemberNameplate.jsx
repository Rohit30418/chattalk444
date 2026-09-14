import { useEffect, useState } from 'react';
import api from '../../services/api';
import { normalizeMessageDecorationId } from '../../utils/memberAssets';
import '../../styles/memberEffects.css';

const profileCache = new Map();
const profileFetchedAt = new Map();
const inflightProfiles = new Map();
const PROFILE_FRESH_MS = 10000;

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
}) => {
  const finalUid = uid || user?.uid || user?.id || user?.userId || '';
  const [resolvedUser, setResolvedUser] = useState(() => (
    (finalUid && profileCache.get(finalUid)) || user || null
  ));

  useEffect(() => {
    const cached = finalUid ? profileCache.get(finalUid) : null;
    setResolvedUser(cached ? { ...(user || {}), ...cached } : (user || null));
  }, [finalUid, user]);

  useEffect(() => {
    if (!finalUid) return undefined;

    let cancelled = false;

    // Validate mounted nameplates against the latest saved profile. A short
    // freshness window prevents every newly rendered message bubble from
    // generating another profile request during active chats.
    loadProfile(finalUid, { force: true }).then((profile) => {
      if (!cancelled && profile) {
        setResolvedUser((current) => ({ ...(current || {}), ...profile }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [finalUid]);

  useEffect(() => {
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
  }, [finalUid]);

  const finalUser = { ...(user || {}), ...(resolvedUser || {}) };
  const finalName = name || finalUser.displayName || finalUser.name || 'Vaani User';

  if (finalUser.isMember !== true) {
    return <span className={className}>{finalName}</span>;
  }

  const theme = normalizeMessageDecorationId(finalUser.messageDecorationId);

  return (
    <span
      className={`vaani-nameplate vaani-nameplate-${theme} ${compact ? 'vaani-nameplate-compact' : ''} ${className}`}
      title="Vaani member"
    >
      <span className="vaani-nameplate-spark" aria-hidden="true">✦</span>
      <span className="relative z-[2] min-w-0 truncate">{finalName}</span>
    </span>
  );
};

export default MemberNameplate;
