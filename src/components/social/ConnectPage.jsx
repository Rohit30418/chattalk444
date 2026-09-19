import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../auth/AppWrapper';
import '../../styles/memberEffects.css';

const TAB_META = [
  { id: 'discover', label: 'Discover', icon: 'fa-compass' },
  { id: 'friends', label: 'Friends', icon: 'fa-handshake' },
  { id: 'following', label: 'Following', icon: 'fa-user-check' },
  { id: 'followers', label: 'Followers', icon: 'fa-users' },
];

const COLLECTION_TABS = ['friends', 'following', 'followers'];

const initials = (name = 'Vaani User') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || 'VU';

const normalizeProfileTheme = (value) => {
  const theme = typeof value === 'string' ? value.trim().toLowerCase() : 'aurora';
  return ['aurora', 'gold', 'galaxy'].includes(theme) ? theme : 'aurora';
};

const profileThemeToCardTheme = (value) => {
  const theme = normalizeProfileTheme(value);
  if (theme === 'gold') return 'sunset';
  if (theme === 'galaxy') return 'cosmic';
  return 'aurora';
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

const ProfileButton = ({ uid }) => (
  <Link
    to={`/profile/${encodeURIComponent(uid)}`}
    className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-xs font-black text-slate-700 transition-colors hover:border-teal-300 hover:text-teal-700 dark:border-white/10 dark:bg-black/10 dark:text-slate-200 dark:hover:border-teal-400/30 dark:hover:text-teal-300"
  >
    <i className="fa-regular fa-user text-[10px]" aria-hidden="true" />
    Profile
  </Link>
);

const ConnectPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('discover');
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [discoverTotal, setDiscoverTotal] = useState(0);
  const [followBusyUid, setFollowBusyUid] = useState('');
  const [messageBusyUid, setMessageBusyUid] = useState('');
  const [tabCounts, setTabCounts] = useState({
    friends: 0,
    following: 0,
    followers: 0,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const hydrateUsers = useCallback(async (rawUsers = []) => {
    const hydrated = await Promise.all(
      rawUsers.map(async (person) => {
        if (!person?.uid) return person;

        try {
          const { data } = await api.get(`/api/social/profile/${encodeURIComponent(person.uid)}`);
          return {
            ...person,
            ...(data?.user || {}),
            relationship: data?.relationship || {},
            counts: data?.counts || {},
          };
        } catch {
          return person;
        }
      })
    );

    return hydrated.sort((a, b) => Number(b?.isMember === true) - Number(a?.isMember === true));
  }, []);

  const loadCounts = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const results = await Promise.all(
        COLLECTION_TABS.map(async (type) => {
          const { data } = await api.get(
            `/api/social/collections/${encodeURIComponent(user.uid)}/${type}`
          );
          return [type, Number(data?.total || 0)];
        })
      );

      setTabCounts(Object.fromEntries(results));
    } catch (err) {
      console.error('Failed to load social counts:', err);
    }
  }, [user?.uid]);

  const loadDiscover = useCallback(async ({ nextPage = 1, append = false } = {}) => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/api/social/people', {
        params: {
          page: nextPage,
          limit: 18,
          search: debouncedSearch || undefined,
        },
      });

      const rawUsers = Array.isArray(data?.users) ? data.users : [];
      const hydrated = await hydrateUsers(rawUsers);
      const discoverUsers = hydrated.filter((person) => {
        const relationship = person?.relationship || {};
        const isFriend = relationship.isFriend === true
          || (relationship.isFollowing === true && relationship.isFollowedBy === true)
          || relationship.connectionStatus === 'friends';
        return !isFriend;
      });

      setPeople((current) => {
        if (!append) return discoverUsers;
        const merged = [...current, ...discoverUsers];
        return Array.from(new Map(merged.map((person) => [person.uid, person])).values());
      });

      setDiscoverTotal(
        Math.max(0, Number(data?.total || discoverUsers.length) - Number(tabCounts.friends || 0))
      );
      setPage(nextPage);
      setHasMore(Boolean(data?.hasMore));
    } catch (err) {
      console.error('Failed to load people:', err);
      setError(err.userMessage || 'Could not load Vaani learners.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, hydrateUsers, tabCounts.friends, user?.uid]);

  const loadCollection = useCallback(async (type) => {
    if (!user?.uid || !COLLECTION_TABS.includes(type)) return;

    try {
      setLoading(true);
      setError('');
      setHasMore(false);
      setPage(1);

      const { data } = await api.get(
        `/api/social/collections/${encodeURIComponent(user.uid)}/${type}`
      );
      const rawUsers = Array.isArray(data?.users) ? data.users : [];
      const hydrated = await hydrateUsers(rawUsers);

      setPeople(hydrated);
      setTabCounts((current) => ({
        ...current,
        [type]: Number(data?.total || hydrated.length),
      }));
    } catch (err) {
      console.error(`Failed to load ${type}:`, err);
      setPeople([]);
      setError(err.userMessage || `Could not load ${type}.`);
    } finally {
      setLoading(false);
    }
  }, [hydrateUsers, user?.uid]);

  useEffect(() => {
    if (!user?.uid || activeTab !== 'discover') return;
    loadDiscover({ nextPage: 1, append: false });
  }, [activeTab, debouncedSearch, loadDiscover, user?.uid]);

  useEffect(() => {
    if (!user?.uid || activeTab === 'discover') return;
    loadCollection(activeTab);
  }, [activeTab, loadCollection, user?.uid]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const refreshCurrentTab = useCallback(async () => {
    await loadCounts();
    if (activeTab === 'discover') {
      await loadDiscover({ nextPage: 1, append: false });
    } else {
      await loadCollection(activeTab);
    }
  }, [activeTab, loadCollection, loadCounts, loadDiscover]);

  useEffect(() => {
    const onPresence = ({ uid, isOnline }) => {
      setPeople((current) => current.map((person) => (
        person.uid === uid
          ? {
              ...person,
              isOnline,
              lastActive: isOnline ? person.lastActive : new Date().toISOString(),
            }
          : person
      )));
    };

    const onSocialChange = () => {
      refreshCurrentTab();
    };

    socket.on('social-presence', onPresence);
    socket.on('social-follow-updated', onSocialChange);

    return () => {
      socket.off('social-presence', onPresence);
      socket.off('social-follow-updated', onSocialChange);
    };
  }, [refreshCurrentTab]);

  const updatePerson = useCallback((uid, patch) => {
    setPeople((current) => current.map((person) => (
      person.uid === uid ? { ...person, ...patch } : person
    )));
  }, []);

  const refreshAfterAction = useCallback(async () => {
    await loadCounts();
    if (activeTab !== 'discover') {
      await loadCollection(activeTab);
    }
  }, [activeTab, loadCollection, loadCounts]);

  const toggleFollow = useCallback(async (person) => {
    if (!user?.uid || followBusyUid === person.uid) return;

    try {
      setFollowBusyUid(person.uid);
      const isFollowing = person.relationship?.isFollowing === true;

      if (isFollowing) {
        await api.delete(`/api/social/follow/${encodeURIComponent(person.uid)}`);
      } else {
        await api.post(`/api/social/follow/${encodeURIComponent(person.uid)}`);
      }

      updatePerson(person.uid, {
        relationship: {
          ...person.relationship,
          isFollowing: !isFollowing,
        },
        counts: {
          ...person.counts,
          followers: Math.max(
            0,
            Number(person.counts?.followers || 0) + (isFollowing ? -1 : 1)
          ),
        },
      });

      await refreshAfterAction();
    } catch (err) {
      setError(err.userMessage || 'Could not update follow.');
    } finally {
      setFollowBusyUid('');
    }
  }, [followBusyUid, refreshAfterAction, updatePerson, user?.uid]);

  const openMessage = useCallback(async (uid) => {
    if (!user?.uid || messageBusyUid === uid) return;

    try {
      setMessageBusyUid(uid);
      const { data } = await api.post(`/api/social/conversations/${encodeURIComponent(uid)}`);
      const conversationId = data?.conversation?.id;
      navigate(
        conversationId
          ? `/messages?conversation=${encodeURIComponent(conversationId)}`
          : '/messages'
      );
    } catch (err) {
      setError(err.userMessage || 'Could not open conversation.');
    } finally {
      setMessageBusyUid('');
    }
  }, [messageBusyUid, navigate, user?.uid]);

  const visiblePeople = useMemo(() => {
    if (activeTab === 'discover') return people;

    const query = debouncedSearch.toLowerCase();
    if (!query) return people;

    return people.filter((person) => {
      const name = String(person?.displayName || '').toLowerCase();
      const languages = Array.isArray(person?.languages)
        ? person.languages.join(' ').toLowerCase()
        : '';
      return name.includes(query) || languages.includes(query);
    });
  }, [activeTab, debouncedSearch, people]);

  const emptyText = useMemo(() => {
    if (debouncedSearch) return 'No people match your search.';
    if (activeTab === 'friends') return 'No mutual follows yet. Follow people you enjoy talking with.';
    if (activeTab === 'following') return 'You are not following anyone yet.';
    if (activeTab === 'followers') return 'No followers yet. Keep joining rooms and meeting people.';
    return 'No new learners to discover right now.';
  }, [activeTab, debouncedSearch]);

  const statusLabel = useCallback((person) => {
    const state = person.relationship || {};
    const isFriend = state.isFriend === true
      || (state.isFollowing === true && state.isFollowedBy === true)
      || state.connectionStatus === 'friends';

    if (isFriend) return 'Friends';
    if (activeTab === 'following') return 'You follow';
    if (activeTab === 'followers') return state.isFollowing ? 'Following' : 'Follows you';
    if (state.isFollowing) return 'Following';
    if (state.isFollowedBy) return 'Follows you';
    return '';
  }, [activeTab]);

  const changeTab = useCallback((tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPeople([]);
    setSearch('');
    setDebouncedSearch('');
    setError('');
    setHasMore(false);
    setPage(1);
  }, [activeTab]);

  const renderActions = useCallback((person) => {
    const followBusy = followBusyUid === person.uid;
    const messageBusy = messageBusyUid === person.uid;
    const state = person.relationship || {};
    const isFriend = state.isFriend === true
      || (state.isFollowing === true && state.isFollowedBy === true)
      || state.connectionStatus === 'friends';

    const followLabel = isFriend
      ? 'Friends'
      : state.isFollowing
        ? 'Following'
        : state.isFollowedBy
          ? 'Follow back'
          : 'Follow';

    return (
      <div className="grid grid-cols-3 gap-2">
        <ProfileButton uid={person.uid} />

        <button
          type="button"
          onClick={() => toggleFollow(person)}
          disabled={followBusy}
          title={state.isFollowing ? 'Unfollow' : followLabel}
          className={`rounded-xl px-3 py-2.5 text-xs font-black transition-colors disabled:opacity-60 ${
            isFriend
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : state.isFollowing
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
                : 'border border-slate-200 bg-white/80 text-slate-700 hover:border-teal-300 dark:border-white/10 dark:bg-black/10 dark:text-slate-200'
          }`}
        >
          {followBusy ? <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> : followLabel}
        </button>

        <button
          type="button"
          onClick={() => openMessage(person.uid)}
          disabled={messageBusy}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2.5 text-xs font-black text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
        >
          {messageBusy ? (
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
          ) : (
            <i className="fa-regular fa-message text-[10px]" aria-hidden="true" />
          )}
          Message
        </button>
      </div>
    );
  }, [followBusyUid, messageBusyUid, openMessage, toggleFollow]);

  if (!user?.uid) {
    return (
      <div className="min-h-screen bg-slate-50 pt-[82px] dark:bg-[#050713]">
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
            <i className="fa-solid fa-user-lock" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
            Sign in to connect
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
            Your followers, friends, requests and people directory are available after sign in.
          </p>
          <Link
            to="/rooms"
            className="mt-6 rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white"
          >
            Back to rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50  text-slate-950 dark:bg-[#050713] dark:text-white pt-[20px]">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-7">
        <aside className="hidden lg:block">
          <div className="sticky top-[104px] rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0b1220]">
            <Link
              to="/connect"
              className="flex items-center gap-3 rounded-xl bg-teal-700 px-4 py-3 text-sm font-black text-white"
            >
              <i className="fa-solid fa-user-group text-xs" aria-hidden="true" />
              Connect
            </Link>

            <Link
              to="/messages"
              className="mt-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white"
            >
              <i className="fa-solid fa-message text-xs" aria-hidden="true" />
              Chat
            </Link>

            <div className="my-3 border-t border-slate-100 dark:border-white/[0.07]" />
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              My network
            </p>

            <div className="space-y-1">
              {TAB_META.map((tab) => {
                const active = activeTab === tab.id;
                const count = tab.id === 'discover'
                  ? discoverTotal
                  : Number(tabCounts[tab.id] || 0);
                const showRequestBadge = tab.id === 'requests' && count > 0;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => changeTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black transition-colors ${
                      active
                        ? 'bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white'
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon} w-4 text-center text-xs`} aria-hidden="true" />
                    <span className="flex-1">{tab.label}</span>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                      {count > 99 ? '99+' : count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1220]">
            <div className="flex flex-col gap-5 p-5 sm:p-7 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                  Your Vaani network
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Connect with people
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                  Discover new learners, follow people you enjoy talking with and keep your network in one place.
                </p>
              </div>

              <label className="relative block w-full xl:max-w-md">
                <i
                  className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                  aria-hidden="true"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={activeTab === 'discover' ? 'Search people or language' : `Search ${activeTab}`}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold outline-none transition-colors focus:border-teal-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </label>
            </div>

            <div className="border-t border-slate-100 px-3 py-3 dark:border-white/[0.07] lg:hidden sm:px-5">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:pb-0">
                {TAB_META.map((tab) => {
                  const active = activeTab === tab.id;
                  const count = tab.id === 'discover'
                    ? discoverTotal
                    : Number(tabCounts[tab.id] || 0);
                  const showRequestBadge = tab.id === 'requests' && count > 0;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => changeTab(tab.id)}
                      className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-xs font-black shadow-sm transition-colors ${
                        active
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-teal-500/10 dark:hover:text-teal-300'
                      }`}
                    >
                      <i className={`fa-solid ${tab.icon} text-[10px]`} aria-hidden="true" />
                      {tab.label}
                      <span className="text-[10px] font-black opacity-70">
                        {count > 99 ? '99+' : count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                {TAB_META.find((tab) => tab.id === activeTab)?.label}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {activeTab === 'discover' && 'People you can meet who are not already mutual followers'}
                {activeTab === 'friends' && 'People who follow you and you follow back'}
                {activeTab === 'following' && 'People you chose to follow'}
                {activeTab === 'followers' && 'People following your profile'}
              </p>
            </div>
          </div>

          <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePeople.map((person) => {
              const isMember = person.isMember === true;
              const memberCardTheme = profileThemeToCardTheme(person.profileAnimationId);
              const relationshipStatus = statusLabel(person);

              return (
                <article
                  key={person.uid}
                  className={`relative overflow-hidden rounded-[1.6rem] border p-5 shadow-sm transition-colors ${
                    isMember
                      ? `vaani-member-room vaani-room-theme-${memberCardTheme} border-amber-300/60 bg-white/95 dark:border-amber-400/20 dark:bg-[#101626]/95`
                      : 'border-slate-200 bg-white hover:border-teal-300 dark:border-white/10 dark:bg-[#101626] dark:hover:border-teal-400/30'
                  }`}
                >
                  <div className="relative z-[1] flex items-start gap-4">
                    <div className="relative shrink-0">
                      <MemberAvatar person={person} />
                      <span
                        className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#101626] ${
                          person.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${encodeURIComponent(person.uid)}`}
                          className="min-w-0 truncate text-base font-black text-slate-950 hover:text-teal-700 dark:text-white dark:hover:text-teal-300"
                        >
                          {person.displayName || 'Vaani User'}
                        </Link>
                        {isMember && (
                          <span className="vaani-member-star shrink-0 text-sm text-amber-500" title="Vaani member" aria-label="Vaani member">
                            ✦
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {formatLastActive(person.lastActive, person.isOnline)}
                      </p>

                      {relationshipStatus && (
                        <span className="mt-2 inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                          {relationshipStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {(person.languages || []).length > 0 && (
                    <div className="relative z-[1] mt-4 flex flex-wrap gap-1.5">
                      {(person.languages || []).slice(0, 3).map((language) => (
                        <span
                          key={language}
                          className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-600 dark:bg-white/[0.04] dark:text-slate-300"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="relative z-[1] mt-4 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-slate-600 dark:text-slate-300">
                    {person.bio || 'Ready to meet people, practice languages and have real conversations on Vaani.'}
                  </p>

                  <div className="relative z-[1] mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-[11px] font-bold text-slate-500 dark:border-white/[0.07] dark:text-slate-400">
                    <span>{Number(person.counts?.followers || 0)} followers</span>
                    <span>{Number(person.counts?.friends || 0)} friends</span>
                  </div>

                  <div className="relative z-[1] mt-4">
                    {renderActions(person)}
                  </div>
                </article>
              );
            })}
          </section>

          {!loading && visiblePeople.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-[#101626]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                <i
                  className={`fa-solid ${TAB_META.find((tab) => tab.id === activeTab)?.icon || 'fa-users'}`}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 text-sm font-black text-slate-800 dark:text-slate-200">
                {emptyText}
              </p>
            </div>
          )}

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500 dark:text-slate-400">
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
              Loading {activeTab === 'discover' ? 'learners' : activeTab}...
            </div>
          )}

          {!loading && activeTab === 'discover' && hasMore && (
            <div className="mt-7 text-center">
              <button
                type="button"
                onClick={() => loadDiscover({ nextPage: page + 1, append: true })}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:border-teal-300 dark:border-white/10 dark:bg-[#101626] dark:text-white"
              >
                Load more people
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ConnectPage;
