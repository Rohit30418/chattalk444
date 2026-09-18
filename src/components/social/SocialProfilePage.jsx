import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../auth/AppWrapper';
import MyProfile from '../AppBody/MyProfile';

const SocialProfilePage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [social, setSocial] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const loadSocial = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await api.get(`/api/social/profile/${encodeURIComponent(userId)}`);
      setSocial(data);
      setError('');
    } catch (err) {
      console.error('Failed to load social profile actions:', err);
    }
  }, [userId]);

  const refreshProfileSocial = useCallback(async () => {
    await loadSocial();
    window.dispatchEvent(new CustomEvent('vaani-social-refresh'));
  }, [loadSocial]);

  useEffect(() => {
    loadSocial();
  }, [loadSocial]);

  const toggleFollow = useCallback(async () => {
    if (!user?.uid || !userId || busy) return;

    try {
      setBusy('follow');
      const following = social?.relationship?.isFollowing === true;

      if (following) {
        await api.delete(`/api/social/follow/${encodeURIComponent(userId)}`);
      } else {
        await api.post(`/api/social/follow/${encodeURIComponent(userId)}`);
      }

      await refreshProfileSocial();
    } catch (err) {
      setError(err.userMessage || 'Could not update follow.');
    } finally {
      setBusy('');
    }
  }, [busy, refreshProfileSocial, social?.relationship?.isFollowing, user?.uid, userId]);

  const message = useCallback(async () => {
    if (!user?.uid || !userId || busy) return;

    try {
      setBusy('message');
      const { data } = await api.post(`/api/social/conversations/${encodeURIComponent(userId)}`);
      const conversationId = data?.conversation?.id;
      navigate(
        conversationId
          ? `/messages?conversation=${encodeURIComponent(conversationId)}`
          : '/messages'
      );
    } catch (err) {
      setError(err.userMessage || 'Could not open conversation.');
    } finally {
      setBusy('');
    }
  }, [busy, navigate, user?.uid, userId]);

  const relationship = social?.relationship || {};
  const isSelf = !user?.uid || user?.uid === userId || relationship.isSelf;
  const isFriend = relationship.isFriend === true
    || (relationship.isFollowing === true && relationship.isFollowedBy === true);

  const followMeta = useMemo(() => {
    if (isFriend) {
      return {
        label: 'Friends',
        icon: 'fa-handshake',
        active: true,
        friend: true,
      };
    }

    if (relationship.isFollowing) {
      return {
        label: 'Following',
        icon: 'fa-user-check',
        active: true,
        friend: false,
      };
    }

    if (relationship.isFollowedBy) {
      return {
        label: 'Follow back',
        icon: 'fa-user-plus',
        active: false,
        friend: false,
      };
    }

    return {
      label: 'Follow',
      icon: 'fa-user-plus',
      active: false,
      friend: false,
    };
  }, [isFriend, relationship.isFollowedBy, relationship.isFollowing]);

  const socialActions = !isSelf ? (
    <div className="w-full">
      {error && (
        <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-[11px] font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={toggleFollow}
          disabled={!user?.uid || Boolean(busy)}
          title={relationship.isFollowing ? 'Unfollow' : followMeta.label}
          className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-[11px] font-black transition-colors disabled:opacity-50 ${
            followMeta.friend
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : followMeta.active
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200'
          }`}
        >
          <i className={`fa-solid ${busy === 'follow' ? 'fa-spinner fa-spin' : followMeta.icon}`} aria-hidden="true" />
          <span className="truncate">{followMeta.label}</span>
        </button>

        <button
          type="button"
          onClick={message}
          disabled={!user?.uid || Boolean(busy)}
          className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-3 py-3 text-[11px] font-black text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          <i className={`fa-solid ${busy === 'message' ? 'fa-spinner fa-spin' : 'fa-message'}`} aria-hidden="true" />
          <span className="truncate">Message</span>
        </button>
      </div>
    </div>
  ) : null;

  return <MyProfile socialActions={socialActions} />;
};

export default SocialProfilePage;
