import React, { memo, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../components/auth/AppWrapper';
import '../../styles/memberEffects.css';

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

const normalizeRoomTheme = (value) => {
  const theme = cleanText(value, 'cosmic').toLowerCase();
  return ['cosmic', 'aurora', 'sunset'].includes(theme) ? theme : 'cosmic';
};

const normalizeProfileTheme = (value) => {
  const theme = cleanText(value, 'aurora').toLowerCase();
  return ['aurora', 'gold', 'galaxy'].includes(theme) ? theme : 'aurora';
};

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

const AvatarStack = memo(({ roomId, participants, activeCount, ownerName, ownerPhoto, memberHost, profileTheme }) => {
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
        const avatar = <ProfilePhoto src={photo} name={name} className="h-8 w-8" />;

        if (index === 0 && memberHost) {
          return (
            <span key={key} className={`vaani-profile-frame vaani-profile-theme-${profileTheme} !p-[2px]`}>
              {avatar}
            </span>
          );
        }

        return React.cloneElement(avatar, { key });
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
  const ownerUid = cleanText(room.ownerUid || room.hostId || room.createdBy, '');

  const isDemoPremiumRoom = roomId === 'room_008';
  const isOwnRoom = Boolean(user?.uid && ownerUid && user.uid === ownerUid);
  const ownMembershipMakesPremium = isOwnRoom && user?.isMember === true;
  const hostIsMember = room.hostIsMember === true || room.isPremiumRoom === true || isDemoPremiumRoom || ownMembershipMakesPremium;
  const roomTheme = normalizeRoomTheme(
    room.roomAnimationId || (ownMembershipMakesPremium ? user?.roomAnimationId : '') || (isDemoPremiumRoom ? 'cosmic' : 'aurora')
  );
  const profileTheme = normalizeProfileTheme(
    room.hostProfileAnimationId || (ownMembershipMakesPremium ? user?.profileAnimationId : '') || 'aurora'
  );

  const participants = useMemo(() => getParticipants(room), [room]);
  const activeCount = Math.max(0, safeNumber(room.participantsCount ?? room.activeCount ?? room.memberCount ?? participants.length, participants.length));
  const maxPeople = Math.max(1, safeNumber(room.MaximumPeople ?? room.maximumPeople ?? room.maxPeople ?? room.capacity, 5));
  const isFull = activeCount >= maxPeople;

  const handleJoinClick = useCallback((event) => {
    if (!loginStatus) {
      event.preventDefault();
      toast.error('Please sign in to join a room');
    }
  }, [loginStatus]);

  if (!roomId) return null;

  return (
    <article
      className={`relative flex min-h-[220px] flex-col overflow-hidden rounded-[1.6rem] border p-5 shadow-sm transition-colors ${
        hostIsMember
          ? `vaani-member-room vaani-room-theme-${roomTheme} border-amber-300/70 bg-white/95 dark:border-amber-400/25 dark:bg-[#101626]/95`
          : 'border-slate-200 bg-white hover:border-teal-200 dark:border-white/10 dark:bg-[#101626] dark:hover:border-teal-400/20'
      }`}
      style={{ contain: 'layout paint style' }}
    >
      {hostIsMember && (
        <div className="pointer-events-none absolute right-4 top-4 z-[2] flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/95 px-2.5 py-1 text-[10px] font-black text-amber-700 shadow-sm dark:border-amber-400/20 dark:bg-[#17130a]/95 dark:text-amber-300">
          <span className="vaani-member-star text-sm" aria-hidden="true">✦</span>
          Vaani Member
        </div>
      )}

      <div className="relative z-[1] flex items-start justify-between gap-3 pr-0">
        <div className={`flex min-w-0 flex-wrap items-center gap-2 ${hostIsMember ? 'pr-28' : ''}`}>
          <span className="inline-flex max-w-[145px] items-center gap-1.5 rounded-full border border-slate-200 bg-white/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-black/20 dark:text-slate-300">
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
        </div>

        {!hostIsMember && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
          </span>
        )}
      </div>

      <div className="relative z-[1] mt-4 flex-1">
        <h3 className="line-clamp-2 text-lg font-black leading-snug text-slate-950 dark:text-white sm:text-xl">{title}</h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            {hostIsMember ? (
              <span className={`vaani-profile-frame vaani-profile-theme-${profileTheme} !p-[2px]`}>
                <ProfilePhoto src={ownerPhoto} name={ownerName} className="h-7 w-7" />
              </span>
            ) : (
              <ProfilePhoto src={ownerPhoto} name={ownerName} className="h-7 w-7" />
            )}
            <span>{ownerName}</span>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <i className="fa-solid fa-user-group text-[9px] text-slate-400" aria-hidden="true" />
            {activeCount}/{maxPeople} speaking
          </span>

          {hostIsMember && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 px-2 py-1 text-[10px] font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </span>
          )}
        </div>
      </div>

      <div className={`relative z-[1] mt-5 flex items-center justify-between gap-3 border-t pt-4 ${hostIsMember ? 'border-amber-200/60 dark:border-amber-400/10' : 'border-slate-100 dark:border-white/[0.07]'}`}>
        <AvatarStack
          roomId={roomId}
          participants={participants}
          activeCount={activeCount}
          ownerName={ownerName}
          ownerPhoto={ownerPhoto}
          memberHost={hostIsMember}
          profileTheme={profileTheme}
        />

        {isFull ? (
          <button type="button" disabled className="rounded-xl bg-slate-100/90 px-4 py-2.5 text-xs font-black text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">Room Full</button>
        ) : (
          <Link
            to={`/room/${roomId}`}
            onClick={handleJoinClick}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label={`Join ${title}`}
          >
            Join Room
            <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
};

export default memo(RoomCard);
