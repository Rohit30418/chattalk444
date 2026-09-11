import React, { memo, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../components/auth/AppWrapper';

const FLAG_MAP = {
  english: 'GB',
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
  global: 'UN',
};

const FEATURE_META = {
  'ai feedback': { icon: 'fa-wand-magic-sparkles', label: 'AI feedback' },
  'priority room': { icon: 'fa-bolt', label: 'Priority room' },
  'members only': { icon: 'fa-lock', label: 'Members only' },
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

const getFlagUrl = (language) => {
  const key = cleanText(language, 'global').toLowerCase();

  if (key === 'abkhazian') {
    return 'https://upload.wikimedia.org/wikipedia/commons/2/27/Flag_of_Abkhazia.svg';
  }

  const code = FLAG_MAP[key];
  return code && code !== 'UN' ? `https://flagsapi.com/${code}/flat/64.png` : '';
};

const getLevelClasses = (level) => {
  const value = cleanText(level).toLowerCase();
  if (value.includes('advanced')) return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300';
  if (value.includes('intermediate')) return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300';
  if (value.includes('beginner')) return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300';
  return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300';
};

const getParticipantName = (participant, index) => (
  participant?.displayName || participant?.name || participant?.username || participant?.email || `Participant ${index + 1}`
);

const getParticipantPhoto = (participant) => (
  participant?.photoURL || participant?.photo || participant?.avatar || ''
);

const getInitials = (name = 'Vaani User') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || 'VU';

const ProfilePhoto = memo(({ src, name, className = 'h-6 w-6', rounded = 'rounded-full' }) => {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || 'Profile'}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} ${rounded} shrink-0 border border-slate-200 bg-slate-100 object-cover dark:border-white/10 dark:bg-slate-800`}
      />
    );
  }

  return (
    <span className={`${className} ${rounded} flex shrink-0 items-center justify-center border border-slate-200 bg-slate-100 text-[9px] font-black text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300`}>
      {getInitials(name)}
    </span>
  );
});

ProfilePhoto.displayName = 'ProfilePhoto';

const AvatarStack = memo(({ roomId, participants, activeCount, ownerName, ownerPhoto }) => {
  const withOwner = useMemo(() => {
    const list = Array.isArray(participants) ? [...participants] : [];
    if (ownerPhoto && !list.some((item) => getParticipantPhoto(item) === ownerPhoto)) {
      list.unshift({ uid: `${roomId}-owner`, displayName: ownerName, photoURL: ownerPhoto });
    }
    return list;
  }, [ownerName, ownerPhoto, participants, roomId]);

  if (!withOwner.length) {
    return (
      <div className="flex -space-x-2" aria-label={`${activeCount} active participants`}>
        {Array.from({ length: Math.min(Math.max(activeCount, 1), 3) }, (_, index) => (
          <span key={`${roomId}-placeholder-${index}`} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-black text-slate-500 dark:border-[#101626] dark:bg-slate-800 dark:text-slate-300">
            {index + 1}
          </span>
        ))}
        {activeCount > 3 && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-black text-slate-600 dark:border-[#101626] dark:bg-slate-800 dark:text-slate-200">+{activeCount - 3}</span>
        )}
      </div>
    );
  }

  const visible = withOwner.slice(0, 4);

  return (
    <div className="flex -space-x-2" aria-label={`${activeCount} active participants`}>
      {visible.map((participant, index) => {
        const key = participant?.uid || participant?.userId || participant?._id || participant?.id || `${roomId}-${index}`;
        const name = getParticipantName(participant, index);
        const photo = getParticipantPhoto(participant);
        return <ProfilePhoto key={key} src={photo} name={name} className="h-8 w-8" />;
      })}
      {activeCount > visible.length && (
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-black text-slate-600 dark:border-[#101626] dark:bg-slate-800 dark:text-slate-200">+{activeCount - visible.length}</span>
      )}
    </div>
  );
});

AvatarStack.displayName = 'AvatarStack';

const RoomCard = ({ roomdata }) => {
  const { user } = useAuth();
  const room = roomdata || {};
  const roomId = getRoomId(room);
  const loginStatus = Boolean(user);

  const title = cleanText(room.Title || room.title || room.name, 'Untitled room');
  const language = cleanText(room.Language || room.language, 'Global');
  const level = cleanText(room.Level || room.level, 'All levels');
  const ownerName = cleanText(room.ownerName || room.hostName || room.createdByName, 'Host');
  const ownerPhoto = cleanText(room.ownerPhoto || room.hostPhoto || room.ownerPhotoURL || room.photoURL, '');
  const description = cleanText(
    room.description || room.Description || room.about || room.TopicDescription,
    `Join the conversation and practice ${language} with other Vaani learners.`
  );

  const isDemoPremiumRoom = roomId === 'room_008';
  const isPremiumRoom = room.isPremiumRoom === true || room.hostIsMember === true || isDemoPremiumRoom;
  const hostIsMember = room.hostIsMember === true || room.isPremiumRoom === true || isDemoPremiumRoom;
  const isMembersOnly = room.isMembersOnly === true || isDemoPremiumRoom;
  const premiumFeatures = useMemo(() => {
    if (Array.isArray(room.premiumFeatures) && room.premiumFeatures.length) {
      return room.premiumFeatures.slice(0, 3);
    }

    if (isDemoPremiumRoom) {
      return ['AI feedback', 'Priority room', 'Members only'];
    }

    if (!isPremiumRoom) return [];
    return ['AI feedback', 'Priority room'];
  }, [isDemoPremiumRoom, isPremiumRoom, room.premiumFeatures]);

  const participants = useMemo(() => getParticipants(room), [room]);
  const activeCount = Math.max(0, safeNumber(room.participantsCount ?? room.activeCount ?? room.memberCount ?? participants.length, participants.length));
  const maxPeople = Math.max(1, safeNumber(room.MaximumPeople ?? room.maximumPeople ?? room.maxPeople ?? room.capacity, 5));
  const isFull = activeCount >= maxPeople;

  const handleJoinClick = useCallback((event) => {
    if (!loginStatus) {
      event.preventDefault();
      toast.error('Please sign in to join a room');
      return;
    }

    if (isMembersOnly && user?.isMember !== true) {
      event.preventDefault();
      toast.info('This is a members-only room. Upgrade your Vaani membership to join.');
    }
  }, [isMembersOnly, loginStatus, user?.isMember]);

  if (!roomId) return null;

  return (
    <article
      className={`relative flex min-h-[260px] flex-col overflow-hidden rounded-[1.6rem] border bg-white p-5 shadow-sm transition-colors dark:bg-[#101626] ${
        isPremiumRoom
          ? 'border-amber-300/80 ring-1 ring-amber-200/50 hover:border-amber-400 dark:border-amber-400/30 dark:ring-amber-400/10'
          : 'border-slate-200 hover:border-teal-200 dark:border-white/10 dark:hover:border-teal-400/20'
      }`}
      style={{ contain: 'layout paint style' }}
    >
      {isPremiumRoom && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-amber-400" aria-hidden="true" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex max-w-[145px] items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            {getFlagUrl(language) ? (
              <img
                src={getFlagUrl(language)}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span aria-hidden="true">🌐</span>
            )}
            <span className="truncate">{language}</span>
          </span>

          <span className={`inline-flex max-w-[145px] truncate rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${getLevelClasses(level)}`}>
            {level.replace('#', '')}
          </span>

          {isPremiumRoom && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
              <i className="fa-solid fa-crown text-[9px]" aria-hidden="true" />
              Premium Host
            </span>
          )}
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
        </span>
      </div>

      <div className="mt-4 flex-1">
        <h3 className="line-clamp-2 text-lg font-black leading-snug text-slate-950 dark:text-white sm:text-xl">{title}</h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            <ProfilePhoto src={ownerPhoto} name={ownerName} className="h-7 w-7" />
            <span>{ownerName}</span>
          </span>

          {hostIsMember && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
              <i className="fa-solid fa-crown text-[9px]" aria-hidden="true" />
              Member
            </span>
          )}

          <span className="inline-flex items-center gap-1.5">
            <i className="fa-solid fa-user-group text-[9px] text-slate-400" aria-hidden="true" />
            {activeCount}/{maxPeople} speaking
          </span>
        </div>

        <p className="mt-4 line-clamp-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{description}</p>

        {isPremiumRoom && premiumFeatures.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {premiumFeatures.map((feature) => {
              const key = cleanText(feature).toLowerCase();
              const meta = FEATURE_META[key] || { icon: 'fa-star', label: feature };

              return (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1.5 text-[10px] font-black text-teal-700 dark:border-teal-400/10 dark:bg-teal-500/10 dark:text-teal-300"
                >
                  <i className={`fa-solid ${meta.icon} text-[9px]`} aria-hidden="true" />
                  {meta.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className={`mt-5 flex items-center justify-between gap-3 border-t pt-4 ${isPremiumRoom ? 'border-amber-100 dark:border-amber-400/10' : 'border-slate-100 dark:border-white/[0.07]'}`}>
        <AvatarStack
          roomId={roomId}
          participants={participants}
          activeCount={activeCount}
          ownerName={ownerName}
          ownerPhoto={ownerPhoto}
        />

        {isFull ? (
          <button type="button" disabled className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">Room Full</button>
        ) : (
          <Link
            to={`/room/${roomId}`}
            onClick={handleJoinClick}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label={`Join ${title}`}
          >
            {isMembersOnly ? 'Join Premium Room' : 'Join Room'}
            <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
};

export default memo(RoomCard);
