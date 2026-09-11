import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../auth/AppWrapper';
import SocialNav from './SocialNav';
import '../../styles/memberEffects.css';

const initials = (name = 'Vaani User') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'VU';

const normalizeProfileTheme = (value) => {
  const theme = typeof value === 'string' ? value.trim().toLowerCase() : 'aurora';
  return ['aurora', 'gold', 'galaxy'].includes(theme) ? theme : 'aurora';
};

const formatLastActive = (value, isOnline = false) => {
  if (isOnline) return 'Online now';
  if (!value) return 'Offline';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Offline';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Active just now';
  if (minutes < 60) return `Active ${minutes} min ago`;
  if (hours < 24) return `Active ${hours} hr${hours === 1 ? '' : 's'} ago`;
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days} days ago`;

  return `Active ${date.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
};

const Avatar = ({ user }) => {
  const [failed, setFailed] = useState(false);
  if (user?.photoURL && !failed) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || 'Vaani user'}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-14 w-14 rounded-2xl object-cover"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-sm font-black text-white">
      {initials(user?.displayName)}
    </div>
  );
};

const MemberAvatar = ({ person }) => {
  const avatar = <Avatar user={person} />;
  if (person?.isMember !== true) return avatar;

  const theme = normalizeProfileTheme(person?.profileAnimationId);
  return (
    <span className={`vaani-profile-frame vaani-profile-theme-${theme} !rounded-[1.15rem] !p-[2px]`}>
      {avatar}
    </span>
  );
};

const ConnectPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busyUid, setBusyUid] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadPeople = useCallback(async ({ nextPage = 1, append = false } = {}) => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/api/social/people', {
        params: { page: nextPage, limit: 18, search: debouncedSearch || undefined },
      });

      const rawUsers = Array.isArray(data?.users) ? data.users : [];
      const hydrated = await Promise.all(
        rawUsers.map(async (person) => {
          try {
            const profile = await api.get(`/api/social/profile/${encodeURIComponent(person.uid)}`);
            return {
              ...person,
              ...(profile.data?.user || {}),
              relationship: profile.data?.relationship || {},
              counts: profile.data?.counts || {},
            };
          } catch {
            return person;
          }
        })
      );

      const prioritized = hydrated.sort((a, b) => Number(b?.isMember === true) - Number(a?.isMember === true));
      setPeople((current) => append ? [...current, ...prioritized] : prioritized);
      setPage(nextPage);
      setHasMore(Boolean(data?.hasMore));
    } catch (err) {
      console.error('Failed to load people:', err);
      setError(err.userMessage || 'Could not load Vaani learners.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, user?.uid]);

  useEffect(() => {
    loadPeople({ nextPage: 1, append: false });
  }, [loadPeople]);

  useEffect(() => {
    const onPresence = ({ uid, isOnline }) => {
      setPeople((current) => current.map((person) => (
        person.uid === uid
          ? { ...person, isOnline, lastActive: isOnline ? person.lastActive : new Date().toISOString() }
          : person
      )));
    };
    socket.on('social-presence', onPresence);
    return () => socket.off('social-presence', onPresence);
  }, []);

  const updatePerson = useCallback((uid, patch) => {
    setPeople((current) => current.map((person) => person.uid === uid ? { ...person, ...patch } : person));
  }, []);

  const toggleFollow = useCallback(async (person) => {
    if (!user?.uid || busyUid) return;
    try {
      setBusyUid(person.uid);
      const isFollowing = person.relationship?.isFollowing === true;
      if (isFollowing) {
        await api.delete(`/api/social/follow/${encodeURIComponent(person.uid)}`);
      } else {
        await api.post(`/api/social/follow/${encodeURIComponent(person.uid)}`);
      }
      updatePerson(person.uid, {
        relationship: { ...person.relationship, isFollowing: !isFollowing },
        counts: {
          ...person.counts,
          followers: Math.max(0, Number(person.counts?.followers || 0) + (isFollowing ? -1 : 1)),
        },
      });
    } catch (err) {
      setError(err.userMessage || 'Could not update follow.');
    } finally {
      setBusyUid('');
    }
  }, [busyUid, updatePerson, user?.uid]);

  const connect = useCallback(async (person) => {
    if (!user?.uid || busyUid) return;
    try {
      setBusyUid(person.uid);
      const state = person.relationship || {};
      if (state.connectionStatus === 'friends' || (state.connectionStatus === 'pending' && state.connectionDirection === 'outgoing')) {
        await api.delete(`/api/social/connect/${encodeURIComponent(person.uid)}`);
        updatePerson(person.uid, {
          relationship: { ...state, connectionStatus: 'none', connectionDirection: null },
        });
        return;
      }

      const path = state.connectionStatus === 'pending' && state.connectionDirection === 'incoming'
        ? `/api/social/connect/${encodeURIComponent(person.uid)}/accept`
        : `/api/social/connect/${encodeURIComponent(person.uid)}`;
      const { data } = await api.post(path);
      updatePerson(person.uid, {
        relationship: {
          ...state,
          connectionStatus: data?.status || 'pending',
          connectionDirection: data?.direction ?? null,
        },
      });
    } catch (err) {
      setError(err.userMessage || 'Could not update connection.');
    } finally {
      setBusyUid('');
    }
  }, [busyUid, updatePerson, user?.uid]);

  const openMessage = useCallback(async (uid) => {
    if (!user?.uid) return;
    try {
      setBusyUid(uid);
      const { data } = await api.post(`/api/social/conversations/${encodeURIComponent(uid)}`);
      const conversationId = data?.conversation?.id;
      navigate(conversationId ? `/messages?conversation=${encodeURIComponent(conversationId)}` : '/messages');
    } catch (err) {
      setError(err.userMessage || 'Could not open conversation.');
    } finally {
      setBusyUid('');
    }
  }, [navigate, user?.uid]);

  const connectionLabel = useCallback((person) => {
    const state = person.relationship || {};
    if (state.connectionStatus === 'friends') return 'Friends';
    if (state.connectionStatus === 'pending' && state.connectionDirection === 'incoming') return 'Accept';
    if (state.connectionStatus === 'pending') return 'Requested';
    return 'Connect';
  }, []);

  const emptyText = useMemo(() => debouncedSearch ? 'No learners match your search.' : 'No other Vaani learners are available yet.', [debouncedSearch]);

  if (!user?.uid) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#050713]">
        <SocialNav />
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
            <i className="fa-solid fa-user-lock" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">Sign in to connect</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">Your people directory, followers, friends and messages are available after sign in.</p>
          <Link to="/rooms" className="mt-6 rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white">Back to rooms</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050713] dark:text-white">
      <SocialNav />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0b1220] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Vaani community</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Meet people to practice with</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">Discover registered learners, visit their profile, follow them, connect as friends or start a private chat.</p>
            </div>

            <label className="relative block w-full lg:max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people or language"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold outline-none transition-colors focus:border-teal-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>
        )}

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {people.map((person) => {
            const busy = busyUid === person.uid;
            const state = person.relationship || {};
            const isMember = person.isMember === true;

            return (
              <article
                key={person.uid}
                className={`relative overflow-hidden rounded-[1.6rem] border bg-white p-5 shadow-sm transition-colors dark:bg-[#101626] ${
                  isMember
                    ? 'border-amber-300/70 ring-1 ring-amber-200/40 dark:border-amber-400/25 dark:ring-amber-400/10'
                    : 'border-slate-200 hover:border-teal-300 dark:border-white/10 dark:hover:border-teal-400/30'
                }`}
              >
                {isMember && (
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
                    <span className="vaani-member-star text-xs" aria-hidden="true">✦</span>
                    Member
                  </div>
                )}

                <div className={`flex items-start gap-4 ${isMember ? 'pr-16' : ''}`}>
                  <div className="relative shrink-0">
                    <MemberAvatar person={person} />
                    <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#101626] ${person.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${encodeURIComponent(person.uid)}`} className="block truncate text-base font-black text-slate-950 hover:text-teal-700 dark:text-white dark:hover:text-teal-300">
                      {person.displayName || 'Vaani User'}
                    </Link>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{formatLastActive(person.lastActive, person.isOnline)}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(person.languages || []).slice(0, 3).map((language) => (
                        <span key={language} className="rounded-lg bg-teal-50 px-2 py-1 text-[10px] font-black text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">{language}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-4 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-slate-600 dark:text-slate-300">{person.bio || 'Ready to meet people, practice languages and have real conversations on Vaani.'}</p>

                <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-[11px] font-bold text-slate-500 dark:border-white/[0.07] dark:text-slate-400">
                  <span>{Number(person.counts?.followers || 0)} followers</span>
                  <span>{Number(person.counts?.friends || 0)} friends</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFollow(person)}
                    disabled={busy}
                    className={`rounded-xl px-3 py-2.5 text-xs font-black transition-colors ${state.isFollowing ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.04]'}`}
                  >
                    {state.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    type="button"
                    onClick={() => connect(person)}
                    disabled={busy}
                    className={`rounded-xl px-3 py-2.5 text-xs font-black transition-colors ${state.connectionStatus === 'friends' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.04]'}`}
                  >
                    {connectionLabel(person)}
                  </button>
                  <button
                    type="button"
                    onClick={() => openMessage(person.uid)}
                    disabled={busy}
                    className="rounded-xl bg-teal-700 px-3 py-2.5 text-xs font-black text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
                  >
                    Message
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {!loading && people.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-[#101626] dark:text-slate-400">{emptyText}</div>
        )}

        {loading && (
          <div className="mt-6 flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500 dark:text-slate-400">
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
            Loading learners...
          </div>
        )}

        {!loading && hasMore && (
          <div className="mt-7 text-center">
            <button type="button" onClick={() => loadPeople({ nextPage: page + 1, append: true })} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-teal-300 dark:border-white/10 dark:bg-[#101626] dark:text-white">Load more people</button>
          </div>
        )}
      </div>
    </main>
  );
};

export default ConnectPage;
