import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import RoomCard from '../../room/components/RoomCard';
import AddRoomForm from '../AddRoomForm';
import { addRoomModalToggle, togglePopup } from '../../redux/action';
import { getRoomData } from '../../hooks/getRoom';
import { Popup } from '../common/Popup';
import SkeletonLoader from './SkeletonLoader';
import { useAuth } from '../auth/AppWrapper';
import useMobilePwaMode from '../../hooks/useMobilePwaMode';

const face = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=120&h=120&q=82`;

const LANGUAGE_FLAG_CODES = {
  arabic: 'SA',
  chinese: 'CN',
  english: 'GB',
  french: 'FR',
  german: 'DE',
  hindi: 'IN',
  italian: 'IT',
  japanese: 'JP',
  korean: 'KR',
  mandarin: 'CN',
  portuguese: 'PT',
  russian: 'RU',
  spanish: 'ES',
  urdu: 'PK',
};

const DUMMY_PEOPLE = {
  fatima: { uid: 'demo_fatima', displayName: 'Fatima', photoURL: face('photo-1494790108377-be9c29b29330') },
  ahmed: { uid: 'demo_ahmed', displayName: 'Ahmed', photoURL: face('photo-1500648767791-00dcc994a43e') },
  maria: { uid: 'demo_maria', displayName: 'Maria', photoURL: face('photo-1534528741775-53994a69daeb') },
  kenji: { uid: 'demo_kenji', displayName: 'Kenji', photoURL: face('photo-1507003211169-0a1dd7228f2d') },
  sophie: { uid: 'demo_sophie', displayName: 'Sophie', photoURL: face('photo-1544005313-94ddf0286df2') },
  hans: { uid: 'demo_hans', displayName: 'Hans', photoURL: face('photo-1506794778202-cad84cf45f1d') },
  minji: { uid: 'demo_minji', displayName: 'Min-ji', photoURL: face('photo-1524504388940-b1c1722653e1') },
  sarah: { uid: 'demo_sarah', displayName: 'Sarah', photoURL: face('photo-1531123897727-8f129e1688ce') },
  raj: { uid: 'demo_raj', displayName: 'Raj', photoURL: face('photo-1507591064344-4c6ce005b128') },
  amit: { uid: 'demo_amit', displayName: 'Amit', photoURL: face('photo-1560250097-0b93528c311a') },
};

const roomPeople = (...keys) => keys.map((key) => DUMMY_PEOPLE[key]).filter(Boolean);

const DUMMY_ROOMS = [
  {
    id: 'room_001', participantsCount: 5, MaximumPeople: '5', Level: '#intermediate',
    ownerName: 'Fatima', ownerUid: 'uid_001', ownerPhoto: DUMMY_PEOPLE.fatima.photoURL,
    Language: 'Portuguese', Title: '🦥 Procrastinators Assemble #6', Topic: 'Live practice',
    description: 'Relaxed Portuguese practice for everyday conversations.',
    participants: roomPeople('fatima', 'maria', 'sophie', 'raj'),
  },
  {
    id: 'room_002', participantsCount: 5, MaximumPeople: '5', Level: '#advanced',
    ownerName: 'Ahmed', ownerUid: 'uid_002', ownerPhoto: DUMMY_PEOPLE.ahmed.photoURL,
    Language: 'Urdu', Title: '🫠 Socially Awkward Club #5', Topic: 'Casual chat',
    description: 'Friendly Urdu conversation without pressure or formal topics.',
    participants: roomPeople('ahmed', 'amit', 'raj', 'sarah'),
  },
  {
    id: 'room_003', participantsCount: 6, MaximumPeople: '6', Level: '#beginner',
    ownerName: 'Maria', ownerUid: 'uid_003', ownerPhoto: DUMMY_PEOPLE.maria.photoURL,
    Language: 'Spanish', Title: '🌮 Taco Tuesday Debate', Topic: 'Debate',
    description: 'Fun debates on random topics while practicing natural Spanish.',
    participants: roomPeople('maria', 'sophie', 'fatima', 'kenji'),
  },
  {
    id: 'room_004', participantsCount: 8, MaximumPeople: '8', Level: '#advanced',
    ownerName: 'Kenji', ownerUid: 'uid_004', ownerPhoto: DUMMY_PEOPLE.kenji.photoURL,
    Language: 'Japanese', Title: '⛩️ Anime Spoilers Only', Topic: 'Anime talk',
    description: 'Talk about your favorite anime, manga and characters in Japanese.',
    participants: roomPeople('kenji', 'minji', 'raj', 'sarah'),
  },
  {
    id: 'room_005', participantsCount: 4, MaximumPeople: '4', Level: '#intermediate',
    ownerName: 'Sophie', ownerUid: 'uid_005', ownerPhoto: DUMMY_PEOPLE.sophie.photoURL,
    Language: 'French', Title: '🥐 Croissant Chronicles', Topic: 'Culture',
    description: 'French culture, travel stories and practical daily conversation.',
    participants: roomPeople('sophie', 'fatima', 'maria', 'hans'),
  },
  {
    id: 'room_006', participantsCount: 4, MaximumPeople: '4', Level: '#beginner',
    ownerName: 'Hans', ownerUid: 'uid_006', ownerPhoto: DUMMY_PEOPLE.hans.photoURL,
    Language: 'German', Title: '🍺 Grammar without boring rules', Topic: 'Grammar',
    description: 'Learn practical German through examples instead of textbook drills.',
    participants: roomPeople('hans', 'sarah'),
  },
  {
    id: 'room_007', participantsCount: 10, MaximumPeople: '10', Level: '#intermediate',
    ownerName: 'Min-ji', ownerUid: 'uid_007', ownerPhoto: DUMMY_PEOPLE.minji.photoURL,
    Language: 'Korean', Title: '🎵 K-Pop pronunciation practice', Topic: 'Pronunciation',
    description: 'Improve Korean pronunciation with music, dramas and real phrases.',
    participants: roomPeople('minji', 'kenji', 'maria', 'raj'),
  },
  {
    id: 'room_008', participantsCount: 5, MaximumPeople: '5', Level: '#advanced',
    ownerName: 'Sarah', ownerUid: 'uid_008', ownerPhoto: DUMMY_PEOPLE.sarah.photoURL,
    Language: 'English', Title: '💼 Business English mock interview', Topic: 'Career practice',
    description: 'Practice interview questions, workplace English and clear answers.',
    participants: roomPeople('sarah', 'ahmed', 'amit'),
    hostIsMember: true,
    isPremiumRoom: true,
    roomAnimationId: 'cosmic',
  },
];

const PAGE_SIZE = 12;

const normalizeLanguage = (value) => {
  const clean = typeof value === 'string' && value.trim() ? value.trim() : 'Unknown';
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

const isMemberRoom = (room) => room?.hostIsMember === true || room?.isPremiumRoom === true;
const getRoomOwnerUid = (room) => String(room?.ownerUid || room?.hostId || room?.createdBy || '');

const getLanguageFlagUrl = (language) => {
  const key = String(language || '').trim().toLowerCase();

  if (key === 'abkhazian') {
    return 'https://upload.wikimedia.org/wikipedia/commons/2/27/Flag_of_Abkhazia.svg';
  }

  const code = LANGUAGE_FLAG_CODES[key];
  return code ? `https://flagsapi.com/${code}/flat/64.png` : '';
};

const LanguageFlag = ({ language, className = 'h-4 w-5' }) => {
  const src = getLanguageFlagUrl(language);

  if (!src) {
    return (
      <span className="inline-flex h-4 w-5 items-center justify-center text-xs" aria-hidden="true">
        🌐
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={`${className} shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(15,23,42,0.08)]`}
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
    />
  );
};

const HomeBody = () => {
  const dispatch = useDispatch();
  const togglePopUp = useSelector((state) => state.togglePopup);
  const { user } = useAuth();
  const { rooms, loading, error } = getRoomData();
  const isMobilePwa = useMobilePwaMode();

  const [searchText, setSearchText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  const deferredSearchText = useDeferredValue(searchText);
  const loginStatus = Boolean(user);

  useEffect(() => {
    setPage(1);
  }, [deferredSearchText, selectedLanguage]);

  useEffect(() => {
    const isAccepted = localStorage.getItem('privacy_policy_accepted');
    if (!isAccepted) {
      const timer = window.setTimeout(() => setShowPrivacyNotice(true), 1200);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!togglePopUp) return undefined;
    const timer = window.setTimeout(() => dispatch(togglePopup(false)), 1200);
    return () => window.clearTimeout(timer);
  }, [togglePopUp, dispatch]);

  const allRooms = useMemo(() => {
    const realData = Array.isArray(rooms) ? rooms.filter(Boolean) : [];
    return [...realData, ...DUMMY_ROOMS];
  }, [rooms]);

  const languageList = useMemo(() => {
    const counts = allRooms.reduce((acc, room) => {
      const language = normalizeLanguage(room?.Language || room?.language);
      acc[language] = (acc[language] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => a.item.localeCompare(b.item));
  }, [allRooms]);

  const filteredRooms = useMemo(() => {
    const text = deferredSearchText.trim().toLowerCase();

    return allRooms
      .filter((room) => {
        const title = String(room?.Title || room?.title || '').toLowerCase();
        const language = normalizeLanguage(room?.Language || room?.language).toLowerCase();
        const level = String(room?.Level || room?.level || '').toLowerCase();
        const owner = String(room?.ownerName || room?.hostName || '').toLowerCase();

        const matchesText = !text
          || title.includes(text)
          || language.includes(text)
          || level.includes(text)
          || owner.includes(text);

        const matchesLanguage = !selectedLanguage
          || language === selectedLanguage.toLowerCase();

        return matchesText && matchesLanguage;
      })
      .sort((a, b) => {
        const ownDiff = Number(getRoomOwnerUid(b) === user?.uid) - Number(getRoomOwnerUid(a) === user?.uid);
        if (ownDiff) return ownDiff;

        const memberDiff = Number(isMemberRoom(b)) - Number(isMemberRoom(a));
        if (memberDiff) return memberDiff;

        return 0;
      });
  }, [allRooms, deferredSearchText, selectedLanguage, user?.uid]);

  const paginatedRooms = useMemo(
    () => filteredRooms.slice(0, PAGE_SIZE * page),
    [filteredRooms, page]
  );

  const handleAcceptPrivacy = () => {
    localStorage.setItem('privacy_policy_accepted', 'true');
    setShowPrivacyNotice(false);
  };

  const handleAddRoomClick = () => {
    if (loginStatus) {
      dispatch(addRoomModalToggle(true));
      return;
    }
    toast.error('Please sign in to create a room');
  };

  if (error) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center dark:bg-[#050713] ${isMobilePwa ? 'pt-8' : 'pt-28'}`}>
        <div className="max-w-md rounded-[1.5rem] border border-red-200 bg-white p-8 shadow-sm dark:border-red-400/20 dark:bg-[#101626]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
            <i className="fa-solid fa-wifi text-xl" />
          </div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Unable to load rooms</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
            Please refresh or check your backend connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-x-hidden bg-slate-50 dark:bg-[#050713] ${isMobilePwa ? 'pb-5 pt-4' : 'pb-28 pt-[86px] lg:pb-16 lg:pt-[104px]'}`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <section id="rooms-grid">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Public Rooms
              </h1>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                Join live voice rooms, practice with people around the world and make new friends.
              </p>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-[190px_minmax(0,1fr)_auto] lg:max-w-3xl">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2" aria-hidden="true">
                  {selectedLanguage ? <LanguageFlag language={selectedLanguage} /> : <span className="text-sm">🌐</span>}
                </span>
                <select
                  value={selectedLanguage}
                  onChange={(event) => setSelectedLanguage(event.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-11 pr-10 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-teal-500 dark:border-white/10 dark:bg-[#101626] dark:text-slate-200"
                >
                  <option value="">All languages</option>
                  {languageList.map((lang) => (
                    <option key={lang.item} value={lang.item}>
                      {lang.item} ({lang.count})
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" aria-hidden="true" />
              </div>

              <div className="relative">
                <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true" />
                <input
                  autoComplete="off"
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search rooms, topic or host..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-500 dark:border-white/10 dark:bg-[#101626] dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleAddRoomClick}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 text-sm font-black text-white transition-colors hover:bg-teal-800"
              >
                <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
                <span>Create Room</span>
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setSelectedLanguage('')}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-colors ${
                !selectedLanguage
                  ? 'bg-teal-700 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-white/10 dark:bg-[#101626] dark:text-slate-300'
              }`}
            >
              <span className="text-sm" aria-hidden="true">🌐</span>
              All
            </button>

            {languageList.map((lang) => (
              <button
                key={lang.item}
                type="button"
                onClick={() => setSelectedLanguage(lang.item)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-colors ${
                  selectedLanguage === lang.item
                    ? 'bg-teal-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-white/10 dark:bg-[#101626] dark:text-slate-300'
                }`}
              >
                <LanguageFlag language={lang.item} className="h-[14px] w-5" />
                {lang.item}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 sm:text-sm">
            <p>
              Showing {filteredRooms.length} room{filteredRooms.length === 1 ? '' : 's'}{' '}
              {selectedLanguage ? `in ${selectedLanguage}` : 'across all languages'}
            </p>
            {(selectedLanguage || searchText) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedLanguage('');
                  setSearchText('');
                }}
                className="shrink-0 font-black text-teal-700 hover:text-teal-800 dark:text-teal-300"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading && Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-[270px] w-full">
                <SkeletonLoader />
              </div>
            ))}

            {!loading && paginatedRooms.map((room) => (
              <RoomCard key={room._id || room.id || room.roomId} roomdata={room} />
            ))}
          </div>

          {!loading && paginatedRooms.length === 0 && (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-white/10 dark:bg-[#101626]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                <i className="fa-solid fa-ghost text-xl" />
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">No rooms found</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Try another search or create a new room.
              </p>
            </div>
          )}

          {!loading && filteredRooms.length > page * PAGE_SIZE && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setPage((value) => value + 1)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-[#101626] dark:text-slate-200"
              >
                Load more rooms
                <i className="fa-solid fa-arrow-down ml-2 text-xs" />
              </button>
            </div>
          )}
        </section>

        <AddRoomForm data={rooms} />

        {togglePopUp && (
          <div className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[360] -translate-x-1/2">
            <Popup text="Room created successfully!" color="bg-emerald-600" />
          </div>
        )}

        {showPrivacyNotice && (
          <div className="fixed inset-0 z-[400] flex items-end justify-center bg-slate-950/60 p-4 sm:items-center">
            <div className="w-full max-w-lg rounded-t-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-[#0f172a] sm:rounded-[1.75rem] sm:p-8">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                  <i className="fa-solid fa-shield-halved text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    Community Guidelines
                  </h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Keep rooms respectful and safe.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
                <p>Welcome to Vaani. To keep practice rooms useful:</p>
                <p>
                  <i className="fa-solid fa-check-circle mr-2 text-teal-600" />
                  Respect everyone. Hate speech is not allowed.
                </p>
                <p>
                  <i className="fa-solid fa-check-circle mr-2 text-teal-600" />
                  Protect privacy. Do not share sensitive information in public rooms.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAcceptPrivacy}
                  className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white hover:bg-teal-800"
                >
                  I Agree
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrivacyNotice(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeBody;
