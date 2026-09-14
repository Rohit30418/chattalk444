import { memo, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import MemberAvatar from '../../components/common/MemberAvatar';
import VideoTile from './VideoTile';

// Replace only this URL when you have the final Vaani room artwork.
const ROOM_BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=2000&q=82';

const SLOT_POSITIONS = [
  'left-1/2 top-[11%] -translate-x-1/2',
  'left-[27%] top-[23%] -translate-x-1/2',
  'left-[73%] top-[23%] -translate-x-1/2',
  'left-[31%] top-[52%] -translate-x-1/2',
  'left-1/2 top-[56%] -translate-x-1/2',
  'left-[69%] top-[52%] -translate-x-1/2',
  'left-[40%] top-[74%] -translate-x-1/2',
  'left-[60%] top-[74%] -translate-x-1/2',
];

const profileCache = new Map();

const ReactionBubble = memo(({ reaction }) => (
  <span
    className="pointer-events-none absolute left-1/2 top-0 z-40 select-none text-3xl drop-shadow-[0_4px_12px_rgba(0,0,0,.55)]"
    style={{ animation: 'roomFloatUp 3s ease-out forwards' }}
    aria-hidden="true"
  >
    {reaction?.emoji}
  </span>
));

const AudioSeat = memo(({ person, isRoomHost }) => {
  const [memberProfile, setMemberProfile] = useState(() => (
    person?.uid ? profileCache.get(person.uid) || null : null
  ));

  useEffect(() => {
    const uid = person?.uid;
    if (!uid) return undefined;

    const cached = profileCache.get(uid);
    if (cached) {
      setMemberProfile(cached);
      return undefined;
    }

    let cancelled = false;

    api.get(`/api/users/${encodeURIComponent(uid)}`)
      .then(({ data }) => {
        if (!data) return;
        profileCache.set(uid, data);
        if (!cancelled) setMemberProfile(data);
      })
      .catch(() => {
        // The room should keep rendering even if appearance lookup fails.
      });

    return () => {
      cancelled = true;
    };
  }, [person?.uid]);

  const name = person.isLocal
    ? (person.displayName || person.name || 'You')
    : (person.displayName || person.name || 'Participant');

  const avatarUser = {
    ...person,
    ...(memberProfile || {}),
    uid: person.uid,
    displayName: memberProfile?.displayName || name,
    photoURL: memberProfile?.photoURL || person.photoURL || person.photo || '',
  };

  return (
    <div className="group relative flex min-w-[118px] flex-col items-center text-center">
      {(person.reactions || []).slice(-2).map((reaction) => (
        <ReactionBubble key={reaction.id || `${reaction.emoji}-${Math.random()}`} reaction={reaction} />
      ))}

      {isRoomHost && (
        <div className="relative z-30 mb-1 flex flex-col items-center leading-none">
          <span className="text-2xl drop-shadow-[0_3px_8px_rgba(245,158,11,.55)]" aria-label="Room host">👑</span>
        </div>
      )}

      <div className={`relative rounded-full p-1.5 transition-transform duration-300 group-hover:-translate-y-1 ${person.isSpeaking ? 'bg-emerald-400/25 shadow-[0_0_30px_rgba(52,211,153,.42)]' : 'bg-black/15'}`}>
        {person.isSpeaking && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full border border-emerald-300/45" />
            <span className="absolute -inset-2 rounded-full border border-emerald-300/20" />
          </>
        )}

        <MemberAvatar
          user={avatarUser}
          src={avatarUser.photoURL}
          name={avatarUser.displayName}
          className="relative z-10 h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28"
          avatarClassName="border-[3px] border-white/20 bg-slate-900 shadow-2xl"
          roundedClass="rounded-full"
          loading="eager"
        />

        <span className={`absolute -bottom-1 -right-1 z-30 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#07111f] text-[11px] shadow-lg ${person.isAudioOn ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          <i className={`fa-solid ${person.isAudioOn ? 'fa-microphone' : 'fa-microphone-slash'}`} />
        </span>
      </div>

      <div className="mt-2 max-w-[150px] rounded-full border border-white/10 bg-black/45 px-3 py-1.5 shadow-lg backdrop-blur-md">
        <p className="truncate text-xs font-black text-white">{person.isLocal ? 'You' : avatarUser.displayName}</p>
      </div>

      {isRoomHost && (
        <span className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-emerald-300 drop-shadow">Host</span>
      )}

      {person.raisedHand && (
        <span className="absolute -right-1 top-7 z-40 rounded-full bg-amber-400 px-2 py-1 text-xs shadow-lg">✋</span>
      )}
    </div>
  );
});

const CameraSeat = memo(({ person, commonTileProps, isRoomHost }) => (
  <div className="relative h-32 w-48 sm:h-36 sm:w-56 lg:h-40 lg:w-64">
    {isRoomHost && (
      <div className="absolute -top-9 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center">
        <span className="text-2xl drop-shadow-[0_3px_8px_rgba(245,158,11,.55)]">👑</span>
        <span className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Host</span>
      </div>
    )}

    <VideoTile
      videoRef={person.videoRef}
      stream={person.stream}
      isVideoOn={person.isVideoOn}
      isAudioOn={person.isAudioOn}
      isSpeaking={person.isSpeaking}
      isScreenSharing={person.isScreenSharing}
      displayName={person.displayName || person.name}
      photoURL={person.photoURL || person.photo}
      isLocal={person.isLocal}
      uid={person.uid}
      peerId={person.peerId}
      reactions={person.reactions}
      raisedHand={person.raisedHand}
      quality={person.quality}
      {...commonTileProps}
    />
  </div>
));

const AnimatedRoomStage = memo(({
  localTile,
  participants = [],
  commonTileProps,
}) => {
  const { id: roomId } = useParams();
  const [hostUid, setHostUid] = useState(() => (
    commonTileProps?.isHost ? localTile?.uid || '' : ''
  ));

  useEffect(() => {
    if (!roomId || hostUid) return undefined;

    let cancelled = false;

    api.get(`/api/rooms/${encodeURIComponent(roomId)}`)
      .then(({ data }) => {
        if (cancelled) return;
        setHostUid(data?.ownerUid || data?.hostId || '');
      })
      .catch(() => {
        // Host badge is decorative; media must not depend on this request.
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, hostUid]);

  const people = useMemo(() => {
    const all = [
      {
        ...localTile,
        id: 'local',
        isLocal: true,
        displayName: localTile?.displayName || 'You',
      },
      ...participants.map((participant) => ({
        ...participant,
        id: participant.uid,
        isLocal: false,
        displayName: participant.name || participant.displayName || 'Participant',
        photoURL: participant.photo || participant.photoURL || '',
        isVideoOn: participant.isVideoEnabled,
        isAudioOn: participant.isAudioEnabled,
      })),
    ];

    const effectiveHostUid = hostUid || (commonTileProps?.isHost ? localTile?.uid : '');
    if (!effectiveHostUid) return all;

    return [...all].sort((a, b) => (
      Number(b.uid === effectiveHostUid) - Number(a.uid === effectiveHostUid)
    ));
  }, [localTile, participants, hostUid, commonTileProps?.isHost]);

  const visiblePeople = people.slice(0, SLOT_POSITIONS.length);
  const overflowCount = Math.max(0, people.length - visiblePeople.length);
  const effectiveHostUid = hostUid || (commonTileProps?.isHost ? localTile?.uid : '');

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#06111b] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${ROOM_BACKGROUND_IMAGE})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#020617]/45" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020617]/70 via-transparent to-[#020617]/35" />

      <div className="absolute inset-0 z-10 hidden sm:block">
        {visiblePeople.map((person, index) => {
          const cameraOn = Boolean(person.isVideoOn && person.stream);
          const isRoomHost = Boolean(
            effectiveHostUid
              ? person.uid === effectiveHostUid
              : person.isLocal && commonTileProps?.isHost
          );

          return (
            <div key={person.id || index} className={`absolute ${SLOT_POSITIONS[index] || SLOT_POSITIONS[0]}`}>
              {cameraOn
                ? <CameraSeat person={person} commonTileProps={commonTileProps} isRoomHost={isRoomHost} />
                : <AudioSeat person={person} isRoomHost={isRoomHost} />}
            </div>
          );
        })}
      </div>

      <div className="relative z-10 grid h-full grid-cols-2 content-start gap-x-3 gap-y-7 overflow-y-auto px-4 pb-32 pt-10 sm:hidden">
        {visiblePeople.map((person, index) => {
          const cameraOn = Boolean(person.isVideoOn && person.stream);
          const isRoomHost = Boolean(
            effectiveHostUid
              ? person.uid === effectiveHostUid
              : person.isLocal && commonTileProps?.isHost
          );

          return (
            <div key={person.id || index} className="flex min-w-0 justify-center py-2">
              {cameraOn
                ? <CameraSeat person={person} commonTileProps={commonTileProps} isRoomHost={isRoomHost} />
                : <AudioSeat person={person} isRoomHost={isRoomHost} />}
            </div>
          );
        })}
      </div>

      {overflowCount > 0 && (
        <div className="absolute right-5 top-5 z-30 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-black text-slate-100 backdrop-blur-md">
          +{overflowCount} more
        </div>
      )}
    </div>
  );
});

export default AnimatedRoomStage;
