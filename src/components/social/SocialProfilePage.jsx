import React, { useCallback, useEffect, useState } from 'react';
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
      if (following) await api.delete(`/api/social/follow/${encodeURIComponent(userId)}`);
      else await api.post(`/api/social/follow/${encodeURIComponent(userId)}`);
      await refreshProfileSocial();
    } catch (err) {
      setError(err.userMessage || 'Could not update follow.');
    } finally {
      setBusy('');
    }
  }, [busy, refreshProfileSocial, social?.relationship?.isFollowing, user?.uid, userId]);

  const updateConnection = useCallback(async () => {
    if (!user?.uid || !userId || busy) return;
    const relationship = social?.relationship || {};
    try {
      setBusy('connect');
      if (relationship.connectionStatus === 'friends' || (relationship.connectionStatus === 'pending' && relationship.connectionDirection === 'outgoing')) {
        await api.delete(`/api/social/connect/${encodeURIComponent(userId)}`);
      } else if (relationship.connectionStatus === 'pending' && relationship.connectionDirection === 'incoming') {
        await api.post(`/api/social/connect/${encodeURIComponent(userId)}/accept`);
      } else {
        await api.post(`/api/social/connect/${encodeURIComponent(userId)}`);
      }
      await refreshProfileSocial();
    } catch (err) {
      setError(err.userMessage || 'Could not update connection.');
    } finally {
      setBusy('');
    }
  }, [busy, refreshProfileSocial, social?.relationship, user?.uid, userId]);

  const message = useCallback(async () => {
    if (!user?.uid || !userId || busy) return;
    try {
      setBusy('message');
      await api.post(`/api/social/conversations/${encodeURIComponent(userId)}`);
      navigate('/messages');
    } catch (err) {
      setError(err.userMessage || 'Could not open conversation.');
    } finally {
      setBusy('');
    }
  }, [busy, navigate, user?.uid, userId]);

  const relationship = social?.relationship || {};
  const isSelf = !user?.uid || user?.uid === userId || relationship.isSelf;
  const connectionLabel = relationship.connectionStatus === 'friends'
    ? 'Friends'
    : relationship.connectionStatus === 'pending' && relationship.connectionDirection === 'incoming'
      ? 'Accept request'
      : relationship.connectionStatus === 'pending'
        ? 'Requested'
        : 'Connect';

  const socialActions = !isSelf ? (
    <div className="w-full">
      {error && (
        <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-[11px] font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={toggleFollow}
          disabled={!user?.uid || Boolean(busy)}
          className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-black transition-colors disabled:opacity-50 ${relationship.isFollowing ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200'}`}
        >
          <i className={`fa-solid ${busy === 'follow' ? 'fa-spinner fa-spin' : relationship.isFollowing ? 'fa-user-check' : 'fa-user-plus'}`} aria-hidden="true" />
          <span className="truncate">{relationship.isFollowing ? 'Following' : 'Follow'}</span>
        </button>

        <button
          type="button"
          onClick={updateConnection}
          disabled={!user?.uid || Boolean(busy)}
          className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-black transition-colors disabled:opacity-50 ${relationship.connectionStatus === 'friends' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200'}`}
        >
          <i className={`fa-solid ${busy === 'connect' ? 'fa-spinner fa-spin' : relationship.connectionStatus === 'friends' ? 'fa-handshake' : 'fa-user-group'}`} aria-hidden="true" />
          <span className="truncate">{connectionLabel}</span>
        </button>

        <button
          type="button"
          onClick={message}
          disabled={!user?.uid || Boolean(busy)}
          className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-2 py-3 text-[11px] font-black text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
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
