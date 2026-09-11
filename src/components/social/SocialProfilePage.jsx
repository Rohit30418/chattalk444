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
      const { data } = await api.post(`/api/social/conversations/${encodeURIComponent(userId)}`);
      const id = data?.conversation?.id;
      navigate(id ? `/messages?conversation=${encodeURIComponent(id)}` : '/messages');
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

  return (
    <>
      <MyProfile />

      {!isSelf && (
        <div className="fixed bottom-4 left-1/2 z-[180] w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 sm:bottom-6 sm:w-auto sm:min-w-[520px]">
          {error && (
            <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-center text-xs font-bold text-red-700 shadow-sm dark:border-red-400/20 dark:bg-[#17101a] dark:text-red-300">
              {error}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 rounded-[1.35rem] border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#0b1220]">
            <button
              type="button"
              onClick={toggleFollow}
              disabled={!user?.uid || Boolean(busy)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black transition-colors disabled:opacity-50 ${relationship.isFollowing ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.04]'}`}
            >
              <i className={`fa-solid ${busy === 'follow' ? 'fa-spinner fa-spin' : relationship.isFollowing ? 'fa-user-check' : 'fa-user-plus'}`} />
              {relationship.isFollowing ? 'Following' : 'Follow'}
            </button>

            <button
              type="button"
              onClick={updateConnection}
              disabled={!user?.uid || Boolean(busy)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black transition-colors disabled:opacity-50 ${relationship.connectionStatus === 'friends' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.04]'}`}
            >
              <i className={`fa-solid ${busy === 'connect' ? 'fa-spinner fa-spin' : relationship.connectionStatus === 'friends' ? 'fa-handshake' : 'fa-user-group'}`} />
              {connectionLabel}
            </button>

            <button
              type="button"
              onClick={message}
              disabled={!user?.uid || Boolean(busy)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-3 py-3 text-xs font-black text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
            >
              <i className={`fa-solid ${busy === 'message' ? 'fa-spinner fa-spin' : 'fa-message'}`} />
              Message
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialProfilePage;
