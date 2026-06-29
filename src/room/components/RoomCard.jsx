import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// Make sure to adjust this path to where your AppWrapper is actually located
import { useAuth } from '../../components/auth/AppWrapper'; 

const FLAG_MAP = {
  english: 'US',
  hindi: 'IN',
  spanish: 'ES',
  japanese: 'JP',
  french: 'FR',
  german: 'DE',
  portuguese: 'PT',
  urdu: 'PK',
  arabic: 'SA',
  korean: 'KR',
  chinese: 'CN',
  mandarin: 'CN',
  italian: 'IT',
  russian: 'RU',
  global: 'US',
};

const cleanText = (value, fallback = '') => (
  typeof value === 'string' && value.trim() ? value.trim() : fallback
);

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getRoomId = (room) => room?._id || room?.id || room?.roomId || '';

const getParticipants = (room) => {
  if (Array.isArray(room?.participants)) return room.participants;
  if (Array.isArray(room?.members)) return room.members;
  if (Array.isArray(room?.activeMembers)) return room.activeMembers;
  return [];
};

const getFlagCode = (language) => {
  const key = cleanText(language, 'global').toLowerCase();
  return FLAG_MAP[key] || roomFlagFallback(language);
};

const roomFlagFallback = (language) => {
  const value = cleanText(language, 'global').slice(0, 2).toUpperCase();
  return /^[A-Z]{2}$/.test(value) ? value : 'US';
};

const getLevelClasses = (level) => {
  const value = cleanText(level).toLowerCase();

  if (value.includes('advanced')) {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300';
  }

  if (value.includes('intermediate')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300';
  }

  if (value.includes('beginner')) {
    return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300';
  }

  return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300';
};

const getAvatarSrc = (participant, fallbackSeed) => (
  participant?.photoURL
  || participant?.photo
  || participant?.avatar
  || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackSeed)}`
);

const getAvatarName = (participant, index) => (
  participant?.displayName
  || participant?.name
  || participant?.username
  || participant?.email
  || `User ${index + 1}`
);

const AvatarStack = memo(({ roomId, participants, activeCount }) => {
  const realParticipants = participants.slice(0, 4);
  const placeholderCount = Math.min(activeCount, 4);

  const visible = realParticipants.length
    ? realParticipants
    : Array.from({ length: placeholderCount }, (_, index) => ({
      __placeholder: true,
      index,
    }));

  if (activeCount <= 0) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
        <i className="fa-solid fa-user-plus text-[11px]" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex -space-x-2.5">
      {visible.map((participant, index) => {
        const seed = participant?.uid || participant?.userId || participant?._id || `${roomId}-${index}`;
        const src = getAvatarSrc(participant, seed);
        const name = getAvatarName(participant, index);

        return (
          <img
            key={seed}
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 object-cover shadow-sm dark:border-[#101626] dark:bg-slate-800"
          />
        );
      })}

      {activeCount > 4 && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-black text-slate-700 shadow-sm dark:border-[#101626] dark:bg-slate-800 dark:text-white">
          +{activeCount - 4}
        </div>
      )}
    </div>
  );
});

const RoomCard = ({ roomdata }) => {
  const { user } = useAuth(); // Hook to get current user
  const loginStatus = Boolean(user); // Check if logged in

  const room = roomdata || {};
  const roomId = getRoomId(room);

  const title = cleanText(room.Title || room.title || room.name, 'Untitled room');
  const language = cleanText(room.Language || room.language, 'Global');
  const level = cleanText(room.Level || room.level, 'All levels');
  const topic = cleanText(room.Topic || room.topic || room.category, 'Live practice');
  const owner = cleanText(room.ownerName || room.hostName || room.createdByName, 'Host');

  const participants = useMemo(() => getParticipants(room), [room]);

  const activeCount = Math.max(
    0,
    safeNumber(
      room.participantsCount ?? room.activeCount ?? room.memberCount ?? participants.length,
      participants.length
    )
  );

  const maxPeople = Math.max(
    1,
    safeNumber(room.MaximumPeople ?? room.maximumPeople ?? room.maxPeople ?? room.capacity, 5)
  );

  const isFull = activeCount >= maxPeople;
  const seatsLeft = Math.max(maxPeople - activeCount, 0);
  const capacityPercent = Math.min(100, Math.round((activeCount / maxPeople) * 100));

  if (!roomId) return null;

  // Intercept the click event
  const handleJoinClick = (e) => {
    if (!loginStatus) {
      e.preventDefault(); // Prevents React Router from navigating
      toast.error('Please sign in to join a room');
    }
  };

  return (
    <article className="group relative flex min-h-[236px] flex-col overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-white/10 dark:bg-[#101626] dark:hover:border-indigo-400/35">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl transition-opacity group-hover:opacity-90 dark:bg-indigo-500/15" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/10" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex max-w-[140px] items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300">
            <img
              src={`https://flagsapi.com/${getFlagCode(language)}/flat/64.png`}
              alt=""
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 object-contain"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
            <span className="truncate">{language}</span>
          </span>

          <span className={`inline-flex max-w-[140px] truncate rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${getLevelClasses(level)}`}>
            {level.replace('#', '')}
          </span>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
      </div>

      <div className="relative z-10 mt-5 min-w-0 flex-1">
        <div className="mb-3 flex items-center gap-2">
          {isFull && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              Full
            </span>
          )}

          <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
            {topic}
          </span>
        </div>

        <h3 className="line-clamp-2 text-xl font-black leading-snug text-slate-950 transition-colors group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-100">
          {title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-bold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-solid fa-user-tie text-[10px] text-slate-400" />
            {owner}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-solid fa-user-group text-[10px] text-slate-400" />
            {activeCount}/{maxPeople} speaking
          </span>
          <span className={isFull ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}>
            {isFull ? 'No seats left' : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-600 to-cyan-500'}`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between gap-3">
        <AvatarStack roomId={roomId} participants={participants} activeCount={activeCount} />

        {isFull ? (
          <button
            type="button"
            disabled
            className="rounded-2xl bg-amber-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-wide text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
          >
            Full
          </button>
        ) : (
          <Link
            to={`/room/${roomId}`}
            onClick={handleJoinClick}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-[11px] font-black uppercase tracking-wide text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-50"
            aria-label={`Join ${title}`}
          >
            Join
            <i className="fa-solid fa-arrow-right text-[10px]" />
          </Link>
        )}
      </div>
    </article>
  );
};

export default memo(RoomCard);