import { useEffect, useState } from 'react';
import api from '../../services/api';
import { normalizeMessageDecorationId } from '../../utils/memberAssets';
import '../../styles/memberEffects.css';

const profileCache = new Map();
const inflightProfiles = new Map();

const loadProfile = async (uid, { force = false } = {}) => {
  if (!uid) return null;

  if (inflightProfiles.has(uid)) {
    return inflightProfiles.get(uid);
  }

  if (!force && profileCache.has(uid)) {
    return profileCache.get(uid);
  }

  inflightProfiles.set(
    uid,
    api.get(`/api/users/${encodeURIComponent(uid)}`)
      .then(({ data }) => {
        profileCache.set(uid, data);
        return data;
      })
      .catch(() => null)
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
  const [resolvedUser, setResolvedUser] = useState(user || null);

  useEffect(() => {
    setResolvedUser(user || null);
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const knownUser = resolvedUser || user;
    const needsLookup = Boolean(
      finalUid
      && knownUser?.isMember !== false
      && !(knownUser?.isMember === true && knownUser?.messageDecorationId)
    );

    if (!needsLookup) return undefined;

    // A nameplate lookup must be fresh. Member appearance can change on the
    // profile page while this module-level cache survives route changes.
    loadProfile(finalUid, { force: true }).then((profile) => {
      if (!cancelled && profile) {
        setResolvedUser((current) => ({ ...(current || {}), ...profile }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [finalUid, resolvedUser?.isMember, resolvedUser?.messageDecorationId, user]);

  useEffect(() => {
    const applyUpdatedUser = (updatedUser) => {
      if (!updatedUser?.uid || updatedUser.uid !== finalUid) return;

      profileCache.set(updatedUser.uid, updatedUser);
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
