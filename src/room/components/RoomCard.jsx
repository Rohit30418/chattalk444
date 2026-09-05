import React, { memo, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  if (FLAG_MAP[key]) return FLAG_MAP[key];
  const fallback = cleanText(language, 'global').slice(0, 2).toUpperCase();
  return /^[A-Z]{2}$/.test(fallback) ? fallback : 'US';
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

const getParticipantName = (participant, index) => (
  participant?.displayName
  || participant?.name
  || participant?.username
  || participant?.email
  || `User ${index + 1}`
);

const getParticipantPhoto = (participant) => (
  participant?.photoURL || participant?.photo || participant?.avatar || ''
);

const getInitial = (name, index) => {
  const cleaned = cleanText(name);
  if (cleaned) return cleaned.charAt(0).toUpperCase();
  return String((index % 9) + 1);
};

const AvatarStack = memo(({ roomId, participants, activeCount }) => {
  const visibleCount = Math.min(Math.max(activeCount, 0), 4);
  const visible = participants.length
    ? participants.slice(0, 4)
    : Array.from({ length: visibleCount }, (_, index) => ({
        __placeholder: true,
        id: `${roomId}-${index}`,
      }));

  if (activeCount <= 0) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
        <i className="fa-solid fa-user-plus text-[10px]" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex -space-x-2">
      {visible.map((participant, index) => {
        const key = participant?.uid || participant?.userId || participant?._id || participant?.id || `${roomId}-${index}`;
        const name = getParticipantName(participant, index);
        const photo = participant?.__placeholder ? '' : getParticipantPhoto(participant);

        if (photo) {
          return (
            <img
              key={key}
              src={photo}
              alt={name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-full border-2 border-white bg-slate-100 object-cover dark:border-[#101626] dark:bg-slate-800"
            />
          );
        }

        return (
          <div
            key={key}
            title={name}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[11px] font-black text-slate-600 dark:border-[#101626] dark:bg-slate-800 dark:text-slate-200"
          >
            {getInitial(name, index)}
          </div>
        );
      })}

      {activeCount > 4 && (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-black text-slate-600 dark:border-[#101626] dark:bg-slate-800 dark:text-slate-200">
          +{activeCount - 4}
        </div>
      )}
    </div>
  );
});

AvatarStack.displayName = 'AvatarStack';

const RoomCard = ({ roomdata }) => {
  const { user } = useAuth();
  const loginStatus = Boolean(user);
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

  const handleJoinClick = useCallback((event) => {
    if (!loginStatus) {
      event.preventDefault();
      toast.error('Please sign in to join a room');
    }
  }, [loginStatus]);

  if (!roomId) return null;

  return (
    <article
      className="flex min-h-[228px] flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#101626]"
      style={{ contain: 'layout paint style' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex max-w-[140px] items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            <img
              src={`https://flagsapi.com/${getFlagCode(language)}/flat/64.png`}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
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
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      <div className="mt-4 min-w-0 flex-1">
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

        <h3 className="line-clamp-2 text-lg font-black leading-snug text-slate-950 dark:text-white sm:text-xl">
          {title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-solid fa-user-tie text-[9px] text-slate-400" aria-hidden="true" />
            {owner}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-solid fa-user-group text-[9px] text-slate-400" aria-hidden="true" />
            {activeCount}/{maxPeople} speaking
          </span>
          <span className={isFull ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}>
            {isFull ? 'No seats left' : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}
          </span>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
          <div
            className={`h-full rounded-full ${isFull ? 'bg-amber-500' : 'bg-teal-600 dark:bg-teal-400'}`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <AvatarStack roomId={roomId} participants={participants} activeCount={activeCount} />

        {isFull ? (
          <button
            type="button"
            disabled
            className="rounded-xl bg-amber-50 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
          >
            Full
          </button>
        ) : (
          <Link
            to={`/room/${roomId}`}
            onClick={handleJoinClick}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            aria-label={`Join ${title}`}
          >
            Join
            <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
};

export default memo(RoomCard);
