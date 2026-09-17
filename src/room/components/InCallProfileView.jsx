import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const InCallProfileView = memo(({ uid, onBack }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    if (!uid) return;

    try {
      setLoading(true);
      const { data } = await api.get(`/api/social/profile/${encodeURIComponent(uid)}`);
      setProfile(data || null);
      setError('');
    } catch (err) {
      setError(err?.userMessage || 'Could not load this profile.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleFollow = useCallback(async () => {
    if (!uid || busy) return;

    try {
      setBusy('follow');
      if (profile?.relationship?.isFollowing) {
        await api.delete(`/api/social/follow/${encodeURIComponent(uid)}`);
      } else {
        await api.post(`/api/social/follow/${encodeURIComponent(uid)}`);
      }
      await loadProfile();
      window.dispatchEvent(new CustomEvent('vaani-social-refresh'));
    } catch (err) {
      setError(err?.userMessage || 'Could not update follow.');
    } finally {
      setBusy('');
    }
  }, [busy, loadProfile, profile?.relationship?.isFollowing, uid]);

  const updateConnection = useCallback(async () => {
    if (!uid || busy) return;

    const relationship = profile?.relationship || {};

    try {
      setBusy('connect');

      if (
        relationship.connectionStatus === 'friends'
        || (
          relationship.connectionStatus === 'pending'
          && relationship.connectionDirection === 'outgoing'
        )
      ) {
        await api.delete(`/api/social/connect/${encodeURIComponent(uid)}`);
      } else if (
        relationship.connectionStatus === 'pending'
        && relationship.connectionDirection === 'incoming'
      ) {
        await api.post(`/api/social/connect/${encodeURIComponent(uid)}/accept`);
      } else {
        await api.post(`/api/social/connect/${encodeURIComponent(uid)}`);
      }

      await loadProfile();
      window.dispatchEvent(new CustomEvent('vaani-social-refresh'));
    } catch (err) {
      setError(err?.userMessage || 'Could not update connection.');
    } finally {
      setBusy('');
    }
  }, [busy, loadProfile, profile?.relationship, uid]);

  const openMessages = useCallback(async () => {
    if (!uid || busy) return;

    try {
      setBusy('message');
      await api.post(`/api/social/conversations/${encodeURIComponent(uid)}`);
      window.open('/messages', '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err?.userMessage || 'Could not open conversation.');
    } finally {
      setBusy('');
    }
  }, [busy, uid]);

  const relationship = profile?.relationship || {};
  const user = profile?.user || {};
  const counts = profile?.counts || {};

  const connectionLabel = useMemo(() => {
    if (relationship.connectionStatus === 'friends') return 'Friends';
    if (
      relationship.connectionStatus === 'pending'
      && relationship.connectionDirection === 'incoming'
    ) return 'Accept request';
    if (relationship.connectionStatus === 'pending') return 'Requested';
    return 'Connect';
  }, [relationship.connectionDirection, relationship.connectionStatus]);

  const languages = Array.isArray(user.languages) ? user.languages.filter(Boolean) : [];
  const photo = user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uid || 'user')}`;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-50 pb-32 text-slate-950 dark:bg-[#050713] dark:text-white sm:pb-8">
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#07101d]/90 sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
          >
            <i className="fa-solid fa-arrow-left text-[11px]" />
            Back to call
          </button>

          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Call continues
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        {loading ? (
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1220]">
            <div className="h-52 animate-pulse bg-slate-200 dark:bg-white/[0.05] sm:h-64" />
            <div className="p-6">
              <div className="h-24 w-24 -translate-y-16 animate-pulse rounded-full border-4 border-white bg-slate-300 dark:border-[#0b1220] dark:bg-white/10" />
            </div>
          </div>
        ) : error && !profile ? (
          <div className="rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-400/20 dark:bg-[#0b1220]">
            <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500" />
            <h2 className="mt-4 text-xl font-black">Profile unavailable</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <button type="button" onClick={loadProfile} className="mt-5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-black text-white">
              Retry
            </button>
          </div>
        ) : (
          <>
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1220]">
              <div className="relative h-48 overflow-hidden bg-[linear-gradient(120deg,#062e33_0%,#0f766e_55%,#0284c7_100%)] sm:h-64">
                <div className="absolute inset-0 bg-slate-950/20" />
                {user.isOnline && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[10px] font-black text-white backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Online
                  </span>
                )}
              </div>

              <div className="px-5 pb-6 sm:px-7 sm:pb-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <div className="-mt-14 flex items-end gap-4 sm:-mt-16">
                      <img
                        src={photo}
                        alt={user.displayName || 'Vaani user'}
                        className="h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-xl dark:border-[#0b1220] dark:bg-[#0b1220] sm:h-28 sm:w-28"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 pb-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
                            {user.displayName || 'Vaani User'}
                          </h1>
                          {user.isMember && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                              Member
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                          {user.bio || 'Learning languages through real conversations on Vaani.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!relationship.isSelf && (
                    <div className="grid w-full grid-cols-3 gap-2 lg:w-auto lg:min-w-[390px]">
                      <button
                        type="button"
                        onClick={toggleFollow}
                        disabled={Boolean(busy)}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-[11px] font-black transition disabled:opacity-50 ${relationship.isFollowing ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200'}`}
                      >
                        <i className={`fa-solid ${busy === 'follow' ? 'fa-spinner fa-spin' : relationship.isFollowing ? 'fa-user-check' : 'fa-user-plus'}`} />
                        <span className="truncate">{relationship.isFollowing ? 'Following' : 'Follow'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={updateConnection}
                        disabled={Boolean(busy)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-[11px] font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200"
                      >
                        <i className={`fa-solid ${busy === 'connect' ? 'fa-spinner fa-spin' : relationship.connectionStatus === 'friends' ? 'fa-handshake' : 'fa-user-group'}`} />
                        <span className="truncate">{connectionLabel}</span>
                      </button>

                      <button
                        type="button"
                        onClick={openMessages}
                        disabled={Boolean(busy)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-3 py-3 text-[11px] font-black text-white transition hover:bg-teal-800 disabled:opacity-50"
                      >
                        <i className={`fa-solid ${busy === 'message' ? 'fa-spinner fa-spin' : 'fa-message'}`} />
                        <span>Message</span>
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                  </div>
                )}

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-white/[0.04]">
                    <p className="text-xl font-black">{Number(counts.followers || 0).toLocaleString()}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Followers</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-white/[0.04]">
                    <p className="text-xl font-black">{Number(counts.following || 0).toLocaleString()}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Following</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-white/[0.04]">
                    <p className="text-xl font-black">{Number(counts.friends || 0).toLocaleString()}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Friends</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0b1220] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                  <i className="fa-solid fa-language text-sm" />
                </span>
                <div>
                  <h2 className="text-base font-black">Languages</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Languages this person practices on Vaani</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(languages.length ? languages : ['English']).map((language) => (
                  <span key={language} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                    {language}
                  </span>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
});

export default InCallProfileView;
