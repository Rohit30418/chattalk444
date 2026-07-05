import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import RoomCard from '../../room/components/RoomCard';
import AddRoomForm from '../AddRoomForm';
import { addRoomModalToggle, togglePopup } from '../../redux/action';
import { getRoomData } from '../../hooks/getRoom';
import { Popup } from '../common/Popup';
import AiCard from '../ai/AiCard';
import SkeletonLoader from './SkeletonLoader';
import FeaturedEvents from './FeaturedEvents';
import LiveActivityFeed from './LiveActivityFeed';
import AnniversaryCard from './AnniversaryCard';
import SpinWheelModal from './SpinWheelModal';
import { useAuth } from '../auth/AppWrapper';

const DUMMY_ROOMS = [
  { id: 'room_001', joinedAt: 1766078139215, participantsCount: 5, MaximumPeople: '5', Level: '#intermediate', ownerName: 'Fatima', ownerUid: 'uid_001', Language: 'Portuguese', flagCode: 'PT', Title: '🦥 Procrastinators Assemble #6', bgColor: '#99BC85' },
  { id: 'room_002', joinedAt: 1766078140000, participantsCount: 5, MaximumPeople: '5', Level: '#advanced', ownerName: 'Ahmed', ownerUid: 'uid_002', Language: 'Urdu', flagCode: 'PK', Title: '🫠 Socially Awkward Club #5', bgColor: '#FFD6BA' },
  { id: 'room_003', joinedAt: 1766078200000, participantsCount: 6, MaximumPeople: '6', Level: '#beginner', ownerName: 'Maria', ownerUid: 'uid_003', Language: 'Spanish', flagCode: 'ES', Title: '🌮 Taco Tuesday Debate', bgColor: '#FEC8D8' },
  { id: 'room_004', joinedAt: 1766078350000, participantsCount: 8, MaximumPeople: '8', Level: '#advanced', ownerName: 'Kenji', ownerUid: 'uid_004', Language: 'Japanese', flagCode: 'JP', Title: '⛩️ Anime Spoilers Only', bgColor: '#D4F1F4' },
  { id: 'room_005', joinedAt: 1766078420000, participantsCount: 4, MaximumPeople: '4', Level: '#intermediate', ownerName: 'Sophie', ownerUid: 'uid_005', Language: 'French', flagCode: 'FR', Title: '🥐 Croissant Chronicles', bgColor: '#E0BBE4' },
  { id: 'room_006', joinedAt: 1766078550000, participantsCount: 4, MaximumPeople: '4', Level: '#beginner', ownerName: 'Hans', ownerUid: 'uid_006', Language: 'German', flagCode: 'DE', Title: '🍺 Grammar without boring rules', bgColor: '#FFDFD3' },
  { id: 'room_007', joinedAt: 1766078600000, participantsCount: 10, MaximumPeople: '10', Level: '#intermediate', ownerName: 'Min-ji', ownerUid: 'uid_007', Language: 'Korean', flagCode: 'KR', Title: '🎵 K-Pop pronunciation practice', bgColor: '#B5EAD7' },
  { id: 'room_008', joinedAt: 1766078700000, participantsCount: 5, MaximumPeople: '5', Level: '#advanced', ownerName: 'Sarah', ownerUid: 'uid_008', Language: 'English', flagCode: 'US', Title: '💼 Business English mock interview', bgColor: '#A0E7E5' },
];

const PAGE_SIZE = 15;

const normalizeLanguage = (value) => {
  const clean = typeof value === 'string' && value.trim() ? value.trim() : 'Unknown';
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

const getMaxPeople = (room) => Number(room?.MaximumPeople || room?.maxPeople || room?.capacity || 5) || 5;
const getParticipants = (room) => Number(room?.participantsCount || room?.activeCount || room?.memberCount || 0) || 0;

const MetricCard = ({ icon, label, value, hint }) => (
  <div className="rounded-[1.4rem] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.045]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
        <i className={`fa-solid ${icon}`} />
      </div>
    </div>
  </div>
);

const HomeBody = () => {
  const dispatch = useDispatch();
  const modalToggle = useSelector((state) => state.toggleModal);
  const togglePopUp = useSelector((state) => state.togglePopup);
  const { user } = useAuth();
  const { rooms, loading, error } = getRoomData();

  const [searchText, setSearchText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showOffer, setShowOffer] = useState(false);

  const loginStatus = Boolean(user);

  useEffect(() => {
    setPage(1);
  }, [searchText, selectedLanguage]);

  useEffect(() => {
    const isAccepted = localStorage.getItem('privacy_policy_accepted');
    if (!isAccepted) {
      const timer = setTimeout(() => setShowPrivacyNotice(true), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!togglePopUp) return undefined;
    const timer = setTimeout(() => dispatch(togglePopup(false)), 1200);
    return () => clearTimeout(timer);
  }, [togglePopUp, dispatch]);

  const allRooms = useMemo(() => {
    const realData = Array.isArray(rooms) ? rooms.filter(Boolean) : [];
    return realData.length ? realData : DUMMY_ROOMS;
  }, [rooms]);

  const languageList = useMemo(() => {
    const counts = allRooms.reduce((acc, room) => {
      const lang = normalizeLanguage(room?.Language || room?.language);
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => a.item.localeCompare(b.item));
  }, [allRooms]);

  const filteredRooms = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return allRooms.filter((room) => {
      const title = String(room?.Title || room?.title || '').toLowerCase();
      const lang = normalizeLanguage(room?.Language || room?.language).toLowerCase();
      const level = String(room?.Level || room?.level || '').toLowerCase();
      const owner = String(room?.ownerName || room?.hostName || '').toLowerCase();
      const matchesText = !text || title.includes(text) || lang.includes(text) || level.includes(text) || owner.includes(text);
      const matchesLanguage = !selectedLanguage || lang === selectedLanguage.toLowerCase();
      return matchesText && matchesLanguage;
    });
  }, [allRooms, searchText, selectedLanguage]);

  const paginatedRooms = useMemo(() => filteredRooms.slice(0, PAGE_SIZE * page), [filteredRooms, page]);

  const metrics = useMemo(() => {
    const active = allRooms.length;
    const learners = allRooms.reduce((sum, room) => sum + getParticipants(room), 0);
    const seats = allRooms.reduce((sum, room) => Math.max(sum + getMaxPeople(room) - getParticipants(room), 0), 0);
    return [
      { icon: 'fa-signal', label: 'Live rooms', value: active, hint: 'available now' },
      { icon: 'fa-users', label: 'Learners', value: learners || '24+', hint: 'currently practicing' },
      { icon: 'fa-language', label: 'Languages', value: languageList.length, hint: 'active communities' },
      { icon: 'fa-chair', label: 'Open seats', value: seats, hint: 'ready to join' },
    ];
  }, [allRooms, languageList.length]);

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-28 text-center dark:bg-[#050713]">
        <div className="max-w-md rounded-[2rem] border border-red-200 bg-white p-8 shadow-xl dark:border-red-400/20 dark:bg-white/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
            <i className="fa-solid fa-wifi text-xl" />
          </div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Unable to load rooms</h2>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Please refresh or check your backend connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-24 pt-[136px] transition-colors duration-300 dark:bg-[#050713] sm:pt-[144px]">
      <div className="container-app">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[2.5rem] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live discovery
              </div>

              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                Find the right room and start speaking with confidence.
              </h1>

              <p className="mt-4 max-w-2xl text-base font-medium leading-8 text-slate-500 dark:text-slate-400 sm:text-lg">
                Browse real-time language rooms, join open seats, or host a focused practice session with a cleaner, production-ready interface.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddRoomClick}
                  className="btn-primary px-5 py-3.5 text-sm"
                >
                  <i className="fa-solid fa-plus" />
                  Create room
                </button>
                <a href="#rooms-grid" className="btn-secondary px-5 py-3.5 text-sm">
                  Explore rooms
                  <i className="fa-solid fa-arrow-down text-xs" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Trending now</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Featured practice themes</h2>
            </div>
          </div>
          <FeaturedEvents />
        </section>

        <section id="rooms-grid" className="mt-10">
          <div className="sticky top-[116px] z-30 mb-6 rounded-[1.7rem] border border-slate-200 bg-white/88 p-3 shadow-lg shadow-slate-200/60 backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1120]/88 dark:shadow-black/20 sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  Public Rooms <span className="text-indigo-600 dark:text-indigo-300">.</span>
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Showing {filteredRooms.length} room{filteredRooms.length === 1 ? '' : 's'} {selectedLanguage ? `in ${selectedLanguage}` : 'across all languages'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[220px_1fr] xl:w-[560px]">
                <div className="relative">
                  <select
                    value={selectedLanguage}
                    onChange={(event) => setSelectedLanguage(event.target.value)}
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:focus:bg-white/10"
                  >
                    <option value="">All languages</option>
                    {languageList.map((lang) => (
                      <option key={lang.item} value={lang.item}>{lang.item} ({lang.count})</option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                </div>

                <div className="relative">
                  <i className="fa-solid fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                  <input
                    type="search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search topic, level, host..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-white/10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                <div className="md:col-span-2">
                  <AiCard
                    pageName="AI Voice Room"
                    title="Luna — AI Friend"
                    description="Practice pronunciation, ask for replies, and keep speaking even when no one is online."
                    avatar="https://static.vecteezy.com/system/resources/previews/034/599/439/non_2x/ai-generated-3d-cute-cartoon-woman-character-in-blue-suit-on-transparent-background-png.png"
                  />
                </div>

                {loading && Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="h-[260px] w-full">
                    <SkeletonLoader />
                  </div>
                ))}

                {!loading && paginatedRooms.map((room) => (
                  <RoomCard key={room._id || room.id || room.roomId} roomdata={room} />
                ))}
              </div>

              {!loading && paginatedRooms.length === 0 && (
                <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                    <i className="fa-solid fa-ghost text-2xl" />
                  </div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">No rooms found</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Try a different search or create a new room.</p>
                </div>
              )}

              {!loading && filteredRooms.length > page * PAGE_SIZE && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => setPage((value) => value + 1)}
                    className="btn-secondary px-6 py-3 text-sm"
                  >
                    Load more rooms
                    <i className="fa-solid fa-arrow-down text-xs" />
                  </button>
                </div>
              )}
            </div>

            <aside className="hidden space-y-5 xl:block">
              <LiveActivityFeed />

              <div className="relative overflow-hidden rounded-[2rem] border border-indigo-400/20 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-6 text-white shadow-xl shadow-indigo-500/20">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
                <div className="relative">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur-xl">
                    <i className="fa-solid fa-plus" />
                  </div>
                  <h3 className="text-2xl font-black">Host a focused room</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/80">Create a safe topic, invite your friends, and lead a better live practice session.</p>
                  <button
                    type="button"
                    onClick={handleAddRoomClick}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-indigo-700 shadow-lg transition hover:-translate-y-0.5"
                  >
                    Create Room
                    <i className="fa-solid fa-arrow-right text-xs" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="xl:hidden">
          <button
            type="button"
            onClick={handleAddRoomClick}
            className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-2xl shadow-indigo-500/35 transition hover:scale-105 active:scale-95"
            aria-label="Create room"
          >
            <i className="fa fa-plus text-xl" />
          </button>
        </div>

        <AnniversaryCard onClick={() => setShowOffer(true)} />
        <AddRoomForm data={rooms} />

        {modalToggle && <div className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm" />}
        {togglePopUp && (
          <div className="fixed left-1/2 top-28 z-[70] -translate-x-1/2 animate-bounce">
            <Popup text="Room created successfully!" color="bg-emerald-600" />
          </div>
        )}

        {showOffer && <SpinWheelModal onClose={() => setShowOffer(false)} />}

        {showPrivacyNotice && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-lg rounded-t-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0f172a] sm:rounded-[2rem] sm:p-8">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <i className="fa-solid fa-shield-halved text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">Community Guidelines</h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Keep rooms respectful and safe.</p>
                </div>
              </div>

              <div className="space-y-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
                <p>Welcome to Vaani. To keep practice rooms useful:</p>
                <p><i className="fa-solid fa-check-circle mr-2 text-indigo-500" /> Respect everyone. Hate speech is not allowed.</p>
                <p><i className="fa-solid fa-check-circle mr-2 text-indigo-500" /> Protect privacy. Do not share sensitive information in public rooms.</p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={handleAcceptPrivacy} className="btn-primary px-5 py-3 text-sm">I Agree</button>
                <button type="button" onClick={() => setShowPrivacyNotice(false)} className="btn-secondary px-5 py-3 text-sm">Later</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeBody;
