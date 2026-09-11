import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../auth/AppWrapper';

const pageItems = [
  { to: '/rooms', label: 'Rooms', icon: 'fa-microphone-lines' },
  { to: '/connect', label: 'Connect', icon: 'fa-user-group' },
  { to: '/messages', label: 'Chat', icon: 'fa-message' },
];

const peopleFilters = [
  { key: 'all', label: 'All', icon: 'fa-user-group' },
  { key: 'friends', label: 'Friends', icon: 'fa-heart' },
  { key: 'following', label: 'Following', icon: 'fa-user-check' },
  { key: 'followers', label: 'Followers', icon: 'fa-users' },
];

const initials = (name = 'Vaani User') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'VU';

const Avatar = ({ person, className = 'h-11 w-11' }) => {
  const [failed, setFailed] = useState(false);

  if (person?.photoURL && !failed) {
    return (
      <img
        src={person.photoURL}
        alt={person.displayName || 'Vaani learner'}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center rounded-full bg-teal-700 text-xs font-black text-white`}
      aria-label={person?.displayName || 'Vaani learner'}
    >
      {initials(person?.displayName)}
    </div>
  );
};

const DesktopSocialBar = () => (
  <div className="relative z-40 pt-[68px] lg:pt-[82px]">
    <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#07111f] sm:px-6 lg:px-8">
      <nav
        className="mx-auto flex w-full max-w-[1600px] items-center gap-2 overflow-x-auto"
        aria-label="Vaani community navigation"
      >
        {pageItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `inline-flex min-w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${
                isActive
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
              }`
            }
          >
            <i className={`fa-solid ${item.icon} text-xs`} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  </div>
);

const RoomsSocialDock = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('people');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyUid, setBusyUid] = useState('');

  const loadPeople = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError('');

      let data;
      if (filter === 'all') {
        const response = await api.get('/api/social/people', {
          params: { page: 1, limit: 40 },
        });
        data = response.data;
      } else {
        const response = await api.get(
          `/api/social/collections/${encodeURIComponent(user.uid)}/${filter}`
        );
        data = response.data;
      }

      setPeople(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      setPeople([]);
      setError(err.userMessage || 'Could not load people.');
    } finally {
      setLoading(false);
    }
  }, [filter, user?.uid]);

  const loadConversations = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/api/social/conversations');
      setConversations(Array.isArray(data?.conversations) ? data.conversations : []);
    } catch (err) {
      setConversations([]);
      setError(err.userMessage || 'Could not load conversations.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!open || !user?.uid) return;
    if (tab === 'people') loadPeople();
    else loadConversations();
  }, [open, tab, filter, user?.uid, loadPeople, loadConversations]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const visiblePeople = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return people;

    return people.filter((person) => {
      const name = String(person?.displayName || '').toLowerCase();
      const bio = String(person?.bio || '').toLowerCase();
      const languages = Array.isArray(person?.languages)
        ? person.languages.join(' ').toLowerCase()
        : '';
      return name.includes(query) || bio.includes(query) || languages.includes(query);
    });
  }, [people, search]);

  const openPeople = () => {
    setTab('people');
    setOpen((current) => (tab === 'people' ? !current : true));
  };

  const openChat = () => {
    setTab('chat');
    setOpen((current) => (tab === 'chat' ? !current : true));
  };

  const startMessage = useCallback(
    async (person) => {
      if (!person?.uid || busyUid) return;
      try {
        setBusyUid(person.uid);
        const { data } = await api.post(
          `/api/social/conversations/${encodeURIComponent(person.uid)}`
        );
        const id = data?.conversation?.id;
        setOpen(false);
        navigate(id ? `/messages?conversation=${encodeURIComponent(id)}` : '/messages');
      } catch (err) {
        setError(err.userMessage || 'Could not start conversation.');
      } finally {
        setBusyUid('');
      }
    },
    [busyUid, navigate]
  );

  return (
    <>
      <div className="fixed bottom-5 right-4 z-[80] flex flex-col gap-2 sm:bottom-auto sm:right-5 sm:top-1/2 sm:-translate-y-1/2">
        <button
          type="button"
          onClick={openPeople}
          className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-colors sm:h-14 sm:w-14 ${
            open && tab === 'people'
              ? 'border-teal-300 bg-teal-700 text-white'
              : 'border-slate-200 bg-white text-teal-700 hover:border-teal-300 hover:bg-teal-50 dark:border-white/10 dark:bg-[#0b1220] dark:text-teal-300 dark:hover:bg-[#101a2a]'
          }`}
          aria-label="Open Vaani people"
          title="People"
        >
          <i className="fa-solid fa-user-group text-base" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={openChat}
          className={`relative flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-colors sm:h-14 sm:w-14 ${
            open && tab === 'chat'
              ? 'border-teal-300 bg-teal-700 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-300 dark:hover:bg-[#101a2a] dark:hover:text-teal-300'
          }`}
          aria-label="Open Vaani chat"
          title="Chat"
        >
          <i className="fa-solid fa-message text-base" aria-hidden="true" />
          {conversations.some((item) => Number(item.unread || 0) > 0) && (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500 dark:border-[#0b1220]" />
          )}
        </button>
      </div>

      {open && (
        <aside className="fixed inset-x-3 bottom-20 z-[79] flex max-h-[72dvh] flex-col overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1220] sm:bottom-auto sm:left-auto sm:right-20 sm:top-[96px] sm:h-[min(650px,calc(100dvh-120px))] sm:w-[390px] sm:max-h-none">
          <div className="flex items-center border-b border-slate-200 px-3 pt-3 dark:border-white/10">
            <button
              type="button"
              onClick={() => setTab('people')}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-black transition-colors ${
                tab === 'people'
                  ? 'border-teal-600 text-teal-700 dark:text-teal-300'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-user-group" aria-hidden="true" />
              People
            </button>
            <button
              type="button"
              onClick={() => setTab('chat')}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-black transition-colors ${
                tab === 'chat'
                  ? 'border-teal-600 text-teal-700 dark:text-teal-300'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-message" aria-hidden="true" />
              Chat
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.05] dark:hover:text-white"
              aria-label="Close community panel"
            >
              <i className="fa-solid fa-xmark text-base" aria-hidden="true" />
            </button>
          </div>

          {!user?.uid ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                <i className="fa-solid fa-user-lock text-lg" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">Sign in to connect</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                Sign in to discover learners, follow people and start private chats.
              </p>
            </div>
          ) : tab === 'people' ? (
            <>
              <div className="border-b border-slate-200 p-3 dark:border-white/10">
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {peopleFilters.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilter(item.key)}
                      className={`inline-flex min-w-fit items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-black transition-colors ${
                        filter === item.key
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      <i className={`fa-solid ${item.icon} text-[9px]`} aria-hidden="true" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="relative mt-2">
                  <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name or language"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {loading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500">
                    <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                    Loading people...
                  </div>
                )}

                {!loading && error && (
                  <div className="m-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                  </div>
                )}

                {!loading && !error && visiblePeople.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.05]">
                      <i className="fa-solid fa-users-slash" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">No learners found</p>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Try another filter or search.</p>
                  </div>
                )}

                {!loading &&
                  visiblePeople.map((person) => (
                    <div
                      key={person.uid}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/profile/${encodeURIComponent(person.uid)}`);
                        }}
                        className="relative shrink-0"
                        aria-label={`View ${person.displayName || 'user'} profile`}
                      >
                        <Avatar person={person} />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#0b1220] ${
                            person.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/profile/${encodeURIComponent(person.uid)}`);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-black text-slate-900 group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
                          {person.displayName || 'Vaani User'}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {Array.isArray(person.languages) && person.languages.length
                            ? person.languages.slice(0, 2).join(' · ')
                            : person.isOnline
                              ? 'Online now'
                              : 'Vaani learner'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => startMessage(person)}
                        disabled={busyUid === person.uid}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50 dark:border-white/10 dark:hover:bg-teal-500/10 dark:hover:text-teal-300"
                        aria-label={`Message ${person.displayName || 'user'}`}
                      >
                        <i className={`fa-solid ${busyUid === person.uid ? 'fa-spinner fa-spin' : 'fa-message'} text-xs`} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
              </div>

              <div className="border-t border-slate-200 p-3 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/connect');
                  }}
                  className="w-full rounded-xl bg-teal-700 px-4 py-3 text-xs font-black text-white transition-colors hover:bg-teal-800"
                >
                  Open full Connect page
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {loading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500">
                    <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                    Loading chats...
                  </div>
                )}

                {!loading && error && (
                  <div className="m-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                  </div>
                )}

                {!loading && !error && conversations.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                      <i className="fa-regular fa-comments" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">No private chats yet</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                      Open People and message someone to start a conversation.
                    </p>
                  </div>
                )}

                {!loading &&
                  conversations.map((conversation) => {
                    const person = conversation.otherUser || {};
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/messages?conversation=${encodeURIComponent(conversation.id)}`);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                      >
                        <div className="relative shrink-0">
                          <Avatar person={person} />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#0b1220] ${
                              person.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="min-w-0 flex-1 truncate text-sm font-black text-slate-900 dark:text-white">
                              {person.displayName || 'Vaani User'}
                            </p>
                            {Number(conversation.unread || 0) > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-black text-white">
                                {conversation.unread}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {conversation.lastMessage || 'Start a conversation'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>

              <div className="border-t border-slate-200 p-3 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/messages');
                  }}
                  className="w-full rounded-xl bg-teal-700 px-4 py-3 text-xs font-black text-white transition-colors hover:bg-teal-800"
                >
                  Open full Chat page
                </button>
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
};

const SocialNav = () => {
  const location = useLocation();

  if (location.pathname === '/rooms') {
    return <RoomsSocialDock />;
  }

  return <DesktopSocialBar />;
};

export default SocialNav;
